import { io } from 'socket.io-client';
import { keys } from './inputManager.js';
import { recreateCanvas } from './canvasManager.js';
import Player from '@shared/Player.js';

// 1. 상태 변수 (게임 매니저가 관리)
let map = null;
let platforms = {};
let gameCanvas = null;
let gameCtx = null;
let round = 0;
let isGameOver;

let players = [];
const playerStats = {
    0: {
        wins: 0,
        scoreElement: null
    },
    1: {
        wins: 0,
        scoreElement: null
    }
};

// 2. DOM 엘리먼트
let timerElement;
let roundElement;

let socket = null;
let serverState = { players: {}, map: null }; // 서버로부터 수신한 게임 상태
let lastTime; // deltaTime 계산용
let animationId = null;
let localPlayer = null; // 클라이언트 예측을 위한 로컬 Player 객체 (Player.js 인스턴스)


// 다른 플레이어 보간을 위한 상태 저장 객체: { id: { prev: {x,y,t}, current: {x,y,t} } }
let otherPlayersState = {};
// 렌더링을 지연시킬 시간 (밀리초). 서버 틱 주기보다 커야 합니다.
const INTERP_DELAY_MS = 100; // 100ms 뒤의 상태를 렌더링하도록 지연

// 틱마다 서버에서 state를 받아 시행하는 다른 플레이어들 보간 함수
function updateOtherPlayersState(players){
    const now = performance.now();
    players.forEach(player => {
        if(player.id === socket.id) return;

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


export function initializeGameManager(domElements) {
    // DOM 엘리먼트 할당
    timerElement = domElements.timer;
    roundElement = domElements.round;
    playerStats[0].scoreElement = domElements.player1Score;
    playerStats[1].scoreElement = domElements.player2Score;


    // 1. 소켓 연결
    // 통합 서빙 : Express 서버와 동일한 출처(Origin)이므로 별도 주소 지정 없이 연결 가능
    socket = io();

    // --- socket.io 이벤트 리스너 등록 ---

    // 1. 연결 성공
    socket.on('connect', () => {
        console.log(`[Online] 접속됨 플레이어ID: ${socket.id}`);
        // 플레이어 접속 정보 전송
        socket.emit('playerJoin', { name: 'Player' + socket.id.substring(0, 4) });
    });

    // 2. 초기 상태, 라운드 초기화 수신 (map, round 등)
    socket.on('initializeRound', (state) => {
        serverState = state;
        resetGame(serverState);
    });

    // 3. 게임 상태 수신 (Tick 마다)
    socket.on('gameState', (state) => {
        serverState = state;
        // 틱마다 다른 플레이어들 타임스탬프 기반 보간 시행
        updateOtherPlayersState(state.players);
    });

    // 4. 연결 끊김
    socket.on('disconnect', () => {
        console.log(`[Online] Socket disconnected.`);
        // 사용자에게 메시지 표시 등
    });
}

// -------------------------------------------------------------
// **rAF 기반의 클라이언트 게임 루프** (렌더링 및 예측 담당)
// -------------------------------------------------------------
function gameLoop(timestamp) {
    // 델타 타임 계산 (밀리초를 초 단위로 변환)
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

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

    // 타이머 엘리먼트 업데이트
    timerElement.innerText = serverState.remainingSeconds;

    // 서버가 보내준 데이터로 모든 플레이어 그리기
    if (serverState.players) {
        for (const playerId in serverState.players) {
            const serverPlayerData = serverState.players[playerId];

            // 내 캐릭터인 경우: 예측과 보정 적용
            if (playerId === socket.id) {
                reconcilePlayer(serverPlayerData);
                localPlayer.update(opions);
                localPlayer.draw(gameCtx);
            } else {
                // 다른 플레이어는 서버가 보내준 위치에 그대로 그린다 (보간 추가하면 더 좋음)
                interpolatePlayer(serverPlayerData);
            }
        }
    }

    animationId = requestAnimationFrame(gameLoop);
}

// 게임/라운드 재시작
function resetGame(serverState) {
    map = serverState.map;
    round = serverState.round;
    platforms = map.platforms;
    console.log(`${round} 라운드 : ${map.name} `);
    roundElement.innerText = `Round ${round}`;

    const { canvas, ctx } = recreateCanvas(map);
    gameCanvas = canvas;
    gameCtx = ctx;
    gameCanvas.style.backgroundColor = currentMap.background;

    if (socket.io in serverState.players) {
        localPlayer = new Player(serverState.players[socket.id]);
    }

    // 게임 상태 초기화
    isGameOver = false;

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
function reconcilePlayer(serverData) {
    const INTERP_AMOUNT = 0.15; // 핑이 낮으면 더 높게, 핑이 높으면 더 낮게
    if (localPlayer) {
        // [핵심: 보정(Reconciliation)] 서버 위치와 예측 위치 사이의 차이를 보간합니다.

        // X, Y 위치 보정
        localPlayer.x = lerp(localPlayer.x, serverData.x, INTERP_AMOUNT);
        localPlayer.y = lerp(localPlayer.y, serverData.y, INTERP_AMOUNT);

        // 서버의 다른 상태 (체력 등)도 업데이트
        localPlayer.health = serverData.health;
    }
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