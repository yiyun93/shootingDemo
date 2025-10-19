import { io } from 'socket.io-client';
import { keys } from './inputManager.js';
import { maps } from '@shared/maps.js';
import { recreateCanvas } from './canvasManager.js';
import Player from '@shared/Player.js';
import { handlePlatformCollision, resolvePlayerOverlap } from '../../shared/physics.js';

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
// 서버로부터 수신받는 게임 상태
let serverState = {};

let lastTime; // deltaTime 계산용
let localPlayer = null; // 클라이언트 예측을 위한 로컬 Player 객체 (Player.js 인스턴스)
let localPlayerId = NaN;

// 다른 플레이어 보간을 위한 상태 저장 객체: { id: { prev: {x,y,t}, current: {x,y,t} } }
let otherPlayersState = {};
// 렌더링을 지연시킬 시간 (밀리초). 서버 틱 주기보다 커야 합니다.
const INTERP_DELAY_MS = 100; // 100ms 뒤의 상태를 렌더링하도록 지연


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
        // 틱마다 다른 플레이어들 타임스탬프 기반 보간 시행
        updateOtherPlayersState(state.players);
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
}

// 플레이어 점수, 라운드 시간 등의 돔 업데이트
function updateDom() {
    timerElement.innerText = serverState.remainingSeconds;
    scoreElements[0].innerText = serverState.playerWins[0];
    scoreElements[1].innerText = serverState.playerWins[1];
}

// -------------------------------------------------------------
// **rAF 기반의 클라이언트 게임 루프** (렌더링 및 예측 담당)
// -------------------------------------------------------------
let animationId = null;

function gameLoop(timestamp) {
    if (!localPlayer) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // 델타 타임 계산 (밀리초를 초 단위로 변환)
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    // serverstate.players 는 객체 타입이기 때문에 배열로 전환후, Player 인스턴스로 만들어서 players 에 할당
    const players = Object.values(serverState.players).map(playerData => new Player(playerData));

    // 1. 키 입력 전송 (requestAnimationFrame 속도로 보냅니다.)
    if (socket && socket.connected) {
        socket.emit('playerInput', keys);
    }

    // ... 캔버스 초기화 ...
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // 플랫폼 그리기
    platforms.forEach(p => {
        gameCtx.fillStyle = p.color;
        gameCtx.fillRect(p.x, p.y, p.width, p.height);
    });

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

    // 서버가 보내준 데이터로 모든 플레이어 그리기
    for (const player of players) {
        if(!player.isAlive) continue; // 살아있는 플레이어만 그리기
        // 내 캐릭터인 경우: 예측과 보정 적용
        if (player.id == localPlayerId) {
            reconcilePlayer(player);
            const updateOptions = {
                keys: keys,
                deltaTime: deltaTime,
                canvasWidth: gameCanvas.width,
                timestamp: timestamp,
                mode: 'online'
            };
            localPlayer.update(updateOptions);
            localPlayer.draw(gameCtx);
        } else {
            // 다른 플레이어는 보간하여 그리기
            interpolatePlayer(player);
        }
    }

    //bullet update & draw
    players.forEach(player => {
        const otherPlayer = players.find(p => p.id !== player.id);
        player.updateBullets(otherPlayer, deltaTime, gameCanvas.width, timestamp, gameCtx, platforms);
    });

    // 플랫폼 물리 적용
    handlePlatformCollision([localPlayer], platforms, timestamp);

    // 플레이어간 충돌 처리
    for(let i = 0; i < players.length; i++){
        if(!players[i].isAlive) continue;
        for(let j = i+1; j < players.length; j++)
            if(players[j].isAlive) resolvePlayerOverlap(players[i], players[j]);
    }

    // console.log(localPlayer, serverState.players[localPlayerId]);
    
    animationId = requestAnimationFrame(gameLoop);
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

    // localPlayer 설정
    const localPlayerData = serverState.players[localPlayerId];
    localPlayer = new Player(localPlayerData);

    // 루프가 이미 실행 중이 아니라면 시작
    if (animationId === null && localPlayer) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// 선형 보간(Linear Interpolation) 함수. 부드러운 움직임을 위해 추가
function lerp(start, end, amt) {
    return start + (end - start) * amt;
}

// 이 함수는 rAF의 한 프레임마다 로컬 Player를 서버 위치로 보정하는 역할만 합니다.
function reconcilePlayer(serverPlayerData) {
    const INTERP_AMOUNT = 0.15; // 핑이 낮으면 더 높게, 핑이 높으면 더 낮게
    if (localPlayer) {
        // [핵심: 보정(Reconciliation)] 서버 위치와 예측 위치 사이의 차이를 보간합니다.

        // X, Y 위치 보정
        localPlayer.x = lerp(localPlayer.x, serverPlayerData.x, INTERP_AMOUNT);
        localPlayer.y = lerp(localPlayer.y, serverPlayerData.y, INTERP_AMOUNT);

        // 서버의 다른 상태 (체력 등)도 업데이트
        localPlayer.health = serverPlayerData.health;
    }
}

// 틱마다 서버에서 state를 받아 otherPlayerState 업데이트
function updateOtherPlayersState(playersObject) {
    const now = performance.now();
    const players = Object.values(playersObject);
    players.forEach(player => {
        if (player.id == localPlayerId) return;

        const newPlayerData = player;
        const newState = { x: newPlayerData.x, y: newPlayerData.y, timestamp: now };

        if (player.id in otherPlayersState) {
            const state = otherPlayersState[player.id];
            state.prev = state.current;
            state.current = newState;
        } else {
            // 처음 접속한 경우, prev와 current를 동일하게 설정합니다.
            otherPlayersState[player.id] = {
                prev: newState,
                current: newState
            };
        }
    });
}

// -------------------------------------------------------------
// **[핵심]** 타임스탬프 기반 선형 보간 함수
// -------------------------------------------------------------
function interpolatePlayer(player) {
    const state = otherPlayersState[player.id];
    if (!state || !state.prev || !state.current) return;

    // 1. 현재 렌더링되어야 할 시점(Target Time) 계산
    // 현재 클라이언트 시간에서 지연 시간(INTERP_DELAY_MS)만큼 과거의 시간을 구합니다.
    const renderTime = performance.now() - INTERP_DELAY_MS;

    const prevTime = state.prev.timestamp;
    const currTime = state.current.timestamp;

    // 이전 상태와 현재 상태의 시간 차이
    const timeDifference = currTime - prevTime;

    // 2. 보간 비율 (Amount) 계산
    let amount = 0;
    if (timeDifference > 0) {
        // 렌더링 시점과 이전 상태 시간 사이의 경과 시간을 계산
        const elapsedTime = renderTime - prevTime;
        // 보간 비율 (0.0 ~ 1.0)
        amount = elapsedTime / timeDifference;

        // 비율이 1.0을 넘으면 (이미 다음 틱 정보가 와야 할 시점) 그냥 다음 틱 위치로 고정합니다.
        // 클램프(Clamp)를 사용하여 비율을 [0, 1] 사이로 제한합니다.
        amount = Math.max(0, Math.min(1, amount));
    }

    // 3. 보간된 위치 계산
    const interpolatedX = lerp(state.prev.x, state.current.x, amount);
    const interpolatedY = lerp(state.prev.y, state.current.y, amount);

    // 4. Player 객체의 Draw 함수를 사용하여 렌더링
    // 이 시점에서 서버 데이터(health, color 등)와 보간된 위치를 합쳐서 그립니다.
    // (실제 구현 시 Player 클래스 인스턴스를 활용하는 것이 더 좋습니다.)
    const otherPlayer = new Player({
        ...player, // 서버의 최신 정보 (체력, 색상 등)
        x: interpolatedX,
        y: interpolatedY
    });
    otherPlayer.draw(gameCtx); // 서버의 timestamp로 인한 몇가지 렌더링 차이 발생 ex) invincible
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