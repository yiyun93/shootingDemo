import { Player1Config, Player2Config } from './playerConfigs.js';
import { maps } from './maps.js';
import { keys } from './inputManager.js';
import { handlePlatformCollision, resolvePlayerOverlap } from './physics.js';
import Player from './Player.js';
import { recreateCanvas } from './canvasManager.js';
import { GAME_DURATION } from './constants.js';

// 1. 상태 변수 (게임 매니저가 관리)
let map;
let platforms;
let gameCanvas;
let gameCtx;
let round = 0;
let roundStartTime;
let isGameOver = false;

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

let lastTime; // deltaTime 계산용
let animationId = null;

// 2. DOM 엘리먼트 (main.js에서 인수로 받거나 여기서 직접 가져올 수 있음)
let timerElement;
let roundElement;

// 3. 게임 초기화 (외부에서 호출)
export function initializeGameManager(domElements) {
    // DOM 엘리먼트 할당
    timerElement = domElements.timer;
    roundElement = domElements.round;
    playerStats[0].scoreElement = domElements.player1Score;
    playerStats[1].scoreElement = domElements.player2Score;

    // 초기 게임 시작
    resetGame();
}

// 4. 게임 루프
function gameLoop(timestamp) {
    // 델타 타임 계산 (밀리초를 초 단위로 변환)
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    //플랫폼 그리기
    platforms.forEach(p => {
        gameCtx.fillStyle = p.color;
        gameCtx.fillRect(p.x, p.y, p.width, p.height);
    });

    const elapsedTime = timestamp - roundStartTime;
    const remainingTimeMs = GAME_DURATION - elapsedTime;
    // 남은 시간(초) 계산 및 정수형으로 변환
    const remainingSeconds = Math.max(0, Math.ceil(remainingTimeMs / 1000));
    // HTML 엘리먼트 업데이트
    timerElement.innerText = remainingSeconds;

    // 라운드 종료 판정
    if (remainingTimeMs <= 0 && !isGameOver) {
        isGameOver = true;
        console.log(`${round} 라운드 종료. red: ${playerStats[0].wins}, blue: ${playerStats[1].wins}`);
    }

    // 게임오버 텍스트 표시
    if (isGameOver) {
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
        gameCtx.fillText("press 'Enter' to next round", gameCanvas.width / 2, gameCanvas.height * 0.8);
        gameCtx.globalAlpha = 1.0;
    }

    const activePlayers = players.filter(p => p.isAlive);
    handlePlatformCollision(activePlayers, platforms);

    activePlayers.forEach(player => {
        const otherPlayer = activePlayers.find(p => p.id !== player.id);
        const updateOptions = {
            keys: keys,
            deltaTime: deltaTime,
            canvasWidth: gameCanvas.width,
            otherPlayer: otherPlayer,
            timestamp: timestamp
        };

        player.update(updateOptions)
        player.draw(gameCtx);
    });

    // 둘다 살아 있을 때 충돌 분리
    if (activePlayers.length >= 2) {
        resolvePlayerOverlap(activePlayers[0], activePlayers[1]);
    } // 사망자 리스폰
    else {
        const dead = players.find(p => !p.isAlive);
        if(dead) dead.respawn(timestamp);
    }

    // Enter로 재시작 지원
    if (isGameOver && keys['Enter']) {
        resetGame();
    }

    animationId = requestAnimationFrame(gameLoop);
}

export function startLoop() {
    lastTime = performance.now(); // visibilitychange에서 재개 시 deltaTime 오류 방지
    animationId = requestAnimationFrame(gameLoop);
}

export function stopLoop() {
    cancelAnimationFrame(animationId);
}


// 5. 게임/라운드 재시작
function resetGame() {
    round++;
    map = maps[Math.floor(Math.random() * maps.length)];
    platforms = map.platforms;
    console.log(`${round} 라운드 : ${map.name} `);
    roundElement.innerText = `${round} Round`;

    const { canvas, ctx } = recreateCanvas(map);
    gameCanvas = canvas;
    gameCtx = ctx;

    gameCanvas.style.backgroundColor = map.background;

    players = [
        new Player(Player1Config),
        new Player(Player2Config)
    ];

    // 게임 상태 초기화
    isGameOver = false;
    roundStartTime = performance.now(); // 현재 시간을 roundStartTime으로 설정

    // 루프가 이미 실행 중이 아니라면 시작
    if (animationId === null) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

export function countPoint(player) {
    playerStats[player.id].wins++;
    playerStats[player.id].scoreElement.innerText = playerStats[player.id].wins;
}