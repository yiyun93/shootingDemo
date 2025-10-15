import { setupInput, keys } from './inputManager.js';
import { initializeCanvasManager } from './canvasManager.js';
import * as GameManager from './gameManager.js';

// DOM 엘리먼트 정의
const canvasWrapper = document.getElementById('canvas-wrapper');
const timerElement = document.getElementById('timerDisplay');
const roundElement = document.getElementById('roundCounter');
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');

// 캔버스 초기화
initializeCanvasManager(canvasWrapper);

// 키 입력 함수 초기화
setupInput();

// 게임 매니저 초기화 및 DOM 엘리먼트 전달
GameManager.initializeGameManager({
    timer: timerElement,
    round: roundElement,
    player1Score: player1ScoreElement,
    player2Score: player2ScoreElement
});


// 탭 가시성 변경 이벤트 리스너 추가 (main.js 역할)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // 탭이 숨겨지면 게임 루프를 일시 중지
        GameManager.stopLoop();
    } else {
        // 탭이 다시 보이면 게임 루프를 재개
        GameManager.startLoop();
    }
});