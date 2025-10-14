import { Player1Config, Player2Config } from './playerConfigs.js';
import { maps } from './maps.js';
import { keys, setupInput } from './inputManager.js';
import { handlePlatformCollision, resolvePlayerOverlap } from './physics.js';
import Player from './Player.js';
import { initializeCanvasManager, recreateCanvas } from './canvasManager.js';
import { GAME_DURATION } from './constants.js';


let map;
let platforms;

const canvasWrapper = document.getElementById('canvas-wrapper');
initializeCanvasManager(canvasWrapper);
let gameCanvas;
let gameCtx;

const timerElement = document.getElementById('timerDisplay');
const roundElement = document.getElementById('roundCounter');
let round = 0;
let roundStartTime;

let isGameOver; // 게임 상태를 추적하는 변수

let players = [];
//승리 횟수 변수
let player1Wins = 0;
let player2Wins = 0;
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');

// Delta Time 기법을 이용한 프레임 속도 보정
let lastTime;

// 키 입력 함수
setupInput();

// 게임 루프를 제어할 변수 선언
let animationId = null;

// 초기 게임 재시작
resetGame();

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
        console.log(`${round} 라운드 종료. red: ${player1Wins}, blue: ${player2Wins}`);
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
        player.update(keys, deltaTime, gameCanvas, otherPlayer, timestamp)
        player.draw(gameCtx);
    });

    // 둘다 살아 있을 때 충돌 분리
    if (activePlayers.length >= 2)
        resolvePlayerOverlap(activePlayers[0], activePlayers[1]);


    if (activePlayers.length < 2 && !isGameOver) {
        isGameOver = true;
        console.log(`${round} 라운드 종료. red: ${player1Wins}, blue: ${player2Wins}`);
        
        // 승리 횟수 추가 로직
        const winner = players.find(p => p.isAlive);
        if (winner) {
            if (winner.id === 1) {
                player1Wins++;
                player1ScoreElement.innerText = player1Wins;
            } else if (winner.id === 2) {
                player2Wins++;
                player2ScoreElement.innerText = player2Wins;
            }
        }
    }

    animationId = requestAnimationFrame(gameLoop);

    // Enter로도 재시작 지원
    if (isGameOver && keys['Enter']) resetGame();
}

// 탭 가시성 변경 이벤트 리스너 추가
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // 탭이 숨겨지면 게임 루프를 일시 중지
        cancelAnimationFrame(animationId);
    } else {
        // 탭이 다시 보이면 게임 루프를 재개
        // lastTime을 현재 시간으로 초기화하여 deltaTime 오차 방지
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
});

// 게임 재시작
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
    lastTime = performance.now();
    roundStartTime = lastTime;
    players.forEach(player => {
        player.isInvincible = true;
        player.invincibilityStartTime = lastTime;
    });
}

requestAnimationFrame(gameLoop);