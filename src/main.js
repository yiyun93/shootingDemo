import { GRAVITY, playerSpeed, jumpStrength, maxJumps, bulletSpeed, bulletSize, shootCooldown } from './constants.js';
import { Player1Config, Player2Config } from './playerConfigs.js';
import { keys, setupInput } from './input.js';
import { isColliding, handlePlatformCollision, resolveOverlap } from './physics.js';
import Player from './Player.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let isGameOver = false; // 게임 상태를 추적하는 변수
const restartButton = document.getElementById('restartButton'); // 버튼 엘리먼트 가져오기

//승리 횟수 변수
let player1Wins = 0;
let player2Wins = 0;
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');


let players = [
    new Player(Player1Config),
    new Player(Player2Config)
];

const platforms = [
    { x: 0, y: 550, width: 800, height: 50, color: '#4CAF50' },
    { x: 150, y: 400, width: 200, height: 20, color: '#795548' },
    { x: 450, y: 300, width: 200, height: 20, color: '#795548' },
    { x: 50, y: 200, width: 100, height: 20, color: '#795548' }
];

// 키 입력 함수
setupInput();

// Delta Time 기법을 이용한 프레임 속도 보정
let lastTime = 0;

// 게임 루프를 제어할 변수 선언
let animationId = null;

function gameLoop(timestamp) {
    // 게임오버 텍스트 표시
    if (isGameOver) {
        ctx.font = '40px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    }

    // 델타 타임 계산 (밀리초를 초 단위로 변환)
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //플랫폼 그리기
    platforms.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    const activePlayers = players.filter(p => p.isAlive);
    handlePlatformCollision(activePlayers, platforms);

    activePlayers.forEach(player => {
        const otherPlayer = activePlayers.find(p => p.id !== player.id);
        player.update(keys, deltaTime, canvas, otherPlayer, timestamp)
        player.draw(ctx);
    });

    // If a player is no longer alive, a simple game over message can be added here.
    if (activePlayers.length < 2 && !isGameOver) {
        isGameOver = true;

        // 승리 횟수 추가 로직
        const winner = players.find(p => p.isAlive);
        if (winner) {
            if (winner.id === 1) {
                player1Wins++;
                player1ScoreElement.innerText = `Player 1 : ${player1Wins}`;
            } else if (winner.id === 2) {
                player2Wins++;
                player2ScoreElement.innerText = `Player 2 : ${player2Wins}`;
            }
        }

        // 게임 루프를 멈추고 버튼을 표시
        restartButton.style.display = 'block';
    }

    // 둘다 살아 있을 때 충돌 분리
    if (activePlayers.length >= 2)
        resolveOverlap(activePlayers[0], activePlayers[1]);


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
    restartButton.style.display = 'none'; // 버튼 숨기기
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

restartButton.addEventListener('click', resetGame);

requestAnimationFrame(gameLoop);