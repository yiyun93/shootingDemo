import { io } from 'socket.io-client';
import { keys } from './inputManager.js';
import { maps } from '@shared/maps.js';
import { recreateCanvas } from './canvasManager.js';
import Player from '@shared/Player.js';
import { resolvePlayerOverlap, handlePlatformCollision } from '../../shared/physics.js';
import { predictRender } from './modeManager.js';

// 1. 상태 변수 (게임 매니저가 관리)
let map = null;
let platforms = {};
let gameCanvas = null;
let gameCtx = null;
let round = 0;

// 2. DOM 엘리먼트
let timerElement;
let roundElement;
const scoreElements = {};

let socket = null;
let rtt = 0;

// 서버로부터 수신받는 게임 상태
let serverState = {};

let lastTime; // deltaTime 계산용
let localPlayer = null; // 클라이언트 예측을 위한 로컬 Player 객체 (Player.js 인스턴스)
let tempPlayer = null;
let localPlayerId = NaN;
let otherPlayers = {};
let pendingInputs = [];

const INTER_AMOUNT = 0.2;
const OTHER_PLAYER_INTER_AMOUNT = 0.75;
const TICK_RATE = 60; // (서버 틱 속도)
const FIXED_DELTA_TIME = 1 / TICK_RATE;

export function initializeGameManager(domElements) {
    // DOM 엘리먼트 할당
    timerElement = domElements.timer;
    roundElement = domElements.round;
    scoreElements[0] = domElements.player1Score;
    scoreElements[1] = domElements.player2Score;


    // 1. 소켓 연결
    // 통합 서빙 : Express 서버와 동일한 출처(Origin)이므로 별도 주소 지정 없이 연결 가능
    socket = io();

    // --- socket.io 이벤트 리스너 등록 ---

    // 1. 연결 성공
    socket.on('connect', () => {
        console.log(`[Online] 접속됨 플레이어ID: ${socket.id}`);
        setInterval(function () {
            // 보내는 시점의 고해상도 타임스탬프를 보냅니다.
            const startTime = performance.now();
            socket.emit('clientPing', startTime);
        }, 2000);
    });

    socket.on('serverPong', (sentTime) => {
        const endTime = performance.now();

        // 왕복 시간(RTT) 계산 및 소수점 제거
        rtt = Math.round(endTime - sentTime);

        // console.log(`[Manual Ping Success] 현재 RTT: ${rtt} ms`);
    });

    // 2. 초기 상태
    socket.on('initPlayer', (data) => {
        console.log(data);
        serverState = data.state;
        localPlayerId = data.playerId;
        resetGame();
    })

    // 3. 게임 상태 수신 (Tick 마다)
    socket.on('gameState', (state) => {
        serverState = state;
        updateDom();
    });

    // 4. 라운드 초기화
    socket.on('resetRound', (state) => {
        serverState = state;
        resetGame();
    });

    // 5. 연결 끊김
    socket.on('disconnect', () => {
        console.log(`[Online] 접속 끊김`);
    });

    // 6. 새 플레이어 입장
    socket.on('newPlayer', (playerData) => {
        addNewPlayer(playerData);
        console.log(playerData.id, '번 플레이어가 입장했습니다.');
    });
}

// 플레이어 점수, 라운드 시간 등의 돔 업데이트
function updateDom() {
    timerElement.innerText = serverState.remainingSeconds;
    scoreElements[0].innerText = serverState.playerWins[0];
    scoreElements[1].innerText = serverState.playerWins[1];
}

// 게임/라운드 재시작
function resetGame() {
    map = maps[serverState.mapId];
    round = serverState.round;
    platforms = map.platforms;
    console.log(`${round} 라운드 : ${map.name} `);
    roundElement.innerText = `Round ${round}`;

    const { canvas, ctx } = recreateCanvas(map);
    gameCanvas = canvas;
    gameCtx = ctx;
    gameCanvas.style.backgroundColor = map.background;

    // Player 클래스 생성
    Object.values(serverState.players).forEach(playerData => {
        if (playerData.id === localPlayerId) {
            localPlayer = new Player(playerData);
            localPlayer.mode = 'render';
            tempPlayer = new Player(playerData);
            tempPlayer.mode = 'render';
        }
        else {
            otherPlayers[playerData.id] = new Player(playerData);
            otherPlayers[playerData.id].mode = 'render';
        }
    });

    // 루프가 이미 실행 중이 아니라면 시작
    if (animationId === null && localPlayer) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function addNewPlayer(playerData) {
    if (otherPlayers[playerData.id]) return;
    otherPlayers[playerData.id] = new Player(playerData);
    otherPlayers[playerData.id].mode = 'render';
}

// ------------------------------------------------------------------------------------------
// **rAF 기반의 클라이언트 게임 루프** (렌더링 및 예측 담당)
// ------------------------------------------------------------------------------------------
let animationId = null;

function gameLoop(timestamp) {
    if (!localPlayer || !serverState.players) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // 델타 타임 계산 (밀리초를 초 단위로 변환)
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // serverstate.players 는 객체 타입이기 때문에 배열로 전환후, Player 인스턴스로 만들어서 players 에 할당
    // const players = Object.values(serverState.players).map(playerData => new Player(playerData));

    // 1. 키 입력 전송 (requestAnimationFrame 속도로 보냅니다.)
    if (socket && socket.connected) {
        const input = {
            seq: timestamp,
            keys: { ...keys }
        };
        pendingInputs.push(input);
        socket.emit('playerInput', input);
    }

    // ... 캔버스 초기화 ...
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // 플랫폼 그리기
    platforms.forEach(p => {
        gameCtx.fillStyle = p.color;
        gameCtx.fillRect(p.x, p.y, p.width, p.height);
    });

    // 우측상단 ping 표시
    gameCtx.font = '15px Arial';
    gameCtx.fillStyle = 'white';
    gameCtx.textAlign = 'center';
    gameCtx.fillText(`ping: ${rtt}`, gameCanvas.width - 30, 20);

    // 게임오버 텍스트 표시
    if (serverState.gameover) {
        gameCtx.font = '50px Arial';
        gameCtx.fillStyle = 'white';
        gameCtx.textAlign = 'center';
        gameCtx.fillText('Round Over!', gameCanvas.width / 2, gameCanvas.height / 2);

        // 다시시작 문구 깜빡이기
        const blinkPeriod = 1500
        const timeInCycle = timestamp % blinkPeriod;
        // 시간에 따른 각도 계산 (0부터 2*PI까지 변하도록)
        const angle = (timeInCycle / blinkPeriod) * 2 * Math.PI;
        let alpha = (Math.sin(angle) + 1.0) / 2.0;

        gameCtx.globalAlpha = alpha; // 계산된 투명도 적용
        gameCtx.font = '20px Arial';
        gameCtx.fillStyle = 'white';
        gameCtx.fillText(`The next round will begin in next ${serverState.restartCountDown}`, gameCanvas.width / 2, gameCanvas.height * 0.8);
        gameCtx.globalAlpha = 1.0;
    }


    // ================================= Player 로직 실행 ==================================
    // ------------------------------------------------------------------------------------

    // 1. 로컬 플레이어 (예측 및 보정)
    // 1-A. 서버 데이터로 보정 (Reconcile)
    const localPlayerData = serverState.players[localPlayerId];
    if (localPlayerData) {
        if(predictRender){
            localReplay(localPlayerData);
            reconcilePlayer(localPlayer, tempPlayer, INTER_AMOUNT);
        }
        else{
            reconcilePlayer(localPlayer, localPlayerData, OTHER_PLAYER_INTER_AMOUNT);
        }
    }

    // 1-B. 예측 후 그리기

    // 움직임만 예측
    if (predictRender && localPlayer.isAlive) {
        localPlayer.move(keys, deltaTime, gameCanvas.width);
        handlePlatformCollision(localPlayer, platforms, timestamp);

        if (otherPlayers) {
            Object.values(otherPlayers).forEach(player => {
                resolvePlayerOverlap(localPlayer, player);
            })
        }
    }

    localPlayer.draw(gameCtx);
    localPlayer.bullets.forEach(bullet => {
        bullet.draw(gameCtx);
    });

    // 2. 다른 플레이어 (보정) 후 그리기
    Object.values(otherPlayers).forEach(player => {
        const playerData = serverState.players[player.id];
        if (playerData) {
            reconcilePlayer(player, playerData, OTHER_PLAYER_INTER_AMOUNT);
        }
        else {
            player = null;
            return;
        }

        player.draw(gameCtx);
        player.bullets.forEach(bullet => {
            bullet.draw(gameCtx);
        });
    });

    animationId = requestAnimationFrame(gameLoop);
}



// 선형 보간(Linear Interpolation) 함수
function lerp(start, end, amt) {
    return start + (end - start) * amt;
}


function localReplay(localPlayerData) {
    let replayStartIndex = -1;

    // 큐에서 승인된 입력을 제거하고 재시뮬레이션 시작점을 찾습니다.
    for (let i = 0; i < pendingInputs.length; i++) {
        if (pendingInputs[i].seq === serverState.seqs[socket.id]) {
            replayStartIndex = i + 1;
            break;
        }
    }
    if (replayStartIndex > 0) {
        pendingInputs.splice(0, replayStartIndex);
    }

    // 시작점에 맞춰 tempPlayer 초기화
    tempPlayer.resetFromData(localPlayerData);

    // 서버가 아직 처리하지 않은 입력을 임시 Player에 재시뮬레이션합니다.

    pendingInputs.forEach(input => {
        // 이동로직만 재시뮬레이션 합니다.
        handlePlatformCollision(tempPlayer, platforms, input.timestamp);
        tempPlayer.move(input.keys, FIXED_DELTA_TIME, gameCanvas.width);
    });
}

// 이 함수는 rAF의 한 프레임마다 로컬 Player를 서버 위치로 보정하는 역할만 합니다.
function reconcilePlayer(player, serverPlayerData, amount) {
    if (!player) return;

    // 1. 서버 데이터에서 특별히 처리할 속성들을 분리합니다.
    const {
        x, y, vx, vy, // 보간할 데이터들
        ...restOfData              // 덮어쓸 나머지 모든 데이터
    } = serverPlayerData;

    // 2. [보간] x, y 위치는 부드럽게 보정
    player.x = lerp(player.x, x, amount);
    player.y = lerp(player.y, y, amount);
    player.vx = lerp(player.vx, vx, amount);
    player.vy = lerp(player.vy, vy, amount);

    player.resetFromData(restOfData);
    player.mode = 'render';
}

// -------------------------------------------------------------
// 루프 제어 (rAF)
// -------------------------------------------------------------
export function startLoop() {
    if (!animationId) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        console.log("[Online] rAF Game Loop Started.");
    }
}

export function stopLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        console.log("[Online] rAF Game Loop Stopped.");
    }
}