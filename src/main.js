import { Player1Config, Player2Config } from './playerConfigs.js';
import { maps } from './maps.js';
import { keys, setupInput } from './inputManager.js';
import { handlePlatformCollision, resolvePlayerOverlap } from './physics.js';
import Player from './Player.js';
import { initializeCanvasManager, recreateCanvas } from './canvasManager.js';


let map = maps[0];

const canvasWrapper = document.getElementById('canvas-wrapper');
initializeCanvasManager(canvasWrapper);

let gameCanvas;
let gameCtx;

const { canvas, ctx } = recreateCanvas(map.width, map.height);
gameCanvas = canvas;
gameCtx = ctx;

gameCanvas.style.backgroundColor = map.background;

let isGameOver = false; // 게임 상태를 추적하는 변수

//승리 횟수 변수
let player1Wins = 0;
let player2Wins = 0;
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');


let players = [
    new Player(Player1Config),
    new Player(Player2Config)
];

let platforms = map.platforms;

// 키 입력 함수
setupInput();

// Delta Time 기법을 이용한 프레임 속도 보정
let lastTime = 0;

// 게임 루프를 제어할 변수 선언
let animationId = null;

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

    // 게임오버 텍스트 표시
    if (isGameOver) {
        gameCtx.font = '40px Arial';
        gameCtx.fillStyle = 'white';
        gameCtx.textAlign = 'center';
        gameCtx.fillText('Game Over!', gameCanvas.width / 2, gameCanvas.height / 2);
        gameCtx.font = '15px Arial';
        gameCtx.fillText("press 'Enter' to restart", gameCanvas.width / 5, gameCanvas.height / 2);
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

    // If a player is no longer alive, a simple game over message can be added here.
    if (activePlayers.length < 2 && !isGameOver) {
        isGameOver = true;

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
    // 플레이어의 초기 상태를 다시 설정
    //스프레드 문법으로 객체복사
    players = [
        new Player(Player1Config),
        new Player(Player2Config)
    ];

    // 게임 상태 초기화
    isGameOver = false;
    lastTime = performance.now();
}

requestAnimationFrame(gameLoop);