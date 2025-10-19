import { setupInput } from './inputManager.js';
import { initializeCanvasManager } from './canvasManager.js';
import { mode, setMode } from './modeManager.js';

// DOM 엘리먼트 정의
const canvasWrapper = document.getElementById('canvas-wrapper');
const timerElement = document.getElementById('timerDisplay');
const roundElement = document.getElementById('roundCounter');
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');

// 모드 선택을 위한 엘리멘트
const modeSelection = document.getElementById('mode-selection');
const gameContainer = document.getElementById('game-container');
const offlineBtn = document.getElementById('offline-btn');
const onlineBtn = document.getElementById('online-btn');

// 캔버스 초기화
initializeCanvasManager(canvasWrapper);

// 키 입력 함수 초기화
setupInput();

let CurrentGameManager = null; // 현재 활성화된 게임 매니저 인스턴스

// 2. 게임 모듈 실행 함수
async function launchGame(mode) {
    setMode(mode);
    // 1. UI 전환: 모드 선택 화면 숨기고 게임 화면 표시
    modeSelection.style.display = 'none';
    gameContainer.style.display = 'flex';

    // 2. 모듈 동적 로드
    let GameManagerModule;

    if (mode === 'offline') {
        // 오프라인 모듈 로드 (기존 싱글 플레이/로컬 멀티)
        GameManagerModule = await import('./offlineGameManager.js');
        console.log("오프라인 모드로 게임을 시작합니다.");
    } else if (mode === 'online') {
        // 온라인 모듈 로드 (Socket.io 통신 로직 포함)
        //GameManagerModule = await import('./onlineGameManager.js');
        GameManagerModule = await import('./onlineGameManagerMinor.js');
        console.log("온라인 모드로 게임을 시작합니다.");
    } else {
        return;
    }

    // 게임 매니저 초기화 및 DOM 엘리먼트 전달
    CurrentGameManager = GameManagerModule;
    CurrentGameManager.initializeGameManager({
        timer: timerElement,
        round: roundElement,
        player1Score: player1ScoreElement,
        player2Score: player2ScoreElement
    });
}

// 3. 이벤트 리스너 설정
offlineBtn.addEventListener('click', () => {
    launchGame('offline');
});

onlineBtn.addEventListener('click', () => {
    launchGame('online');
});

// 탭 가시성 변경 이벤트 리스너 (GameManager의 stop/startLoop 함수를 사용)
document.addEventListener('visibilitychange', () => {
    // 오프라인일 때만 백그라운드 시 일시정지
    if (mode !== 'offline' || !CurrentGameManager) {
        return;
    }

    if (document.visibilityState === 'hidden') {
        CurrentGameManager.stopLoop();
    } else {
        CurrentGameManager.startLoop();
    }
}
);