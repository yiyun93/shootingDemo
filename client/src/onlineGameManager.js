import { setupInput, keys } from './inputManager.js';
import { initializeCanvasManager } from './canvasManager.js';
// *GameManager는 이제 동적으로 로드됩니다.

// 1. DOM 엘리먼트 정의
const canvasWrapper = document.getElementById('canvas-wrapper');
const timerElement = document.getElementById('timerDisplay');
const roundElement = document.getElementById('roundCounter');
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');

const modeSelection = document.getElementById('mode-selection');
const gameContainer = document.getElementById('game-container');
const offlineBtn = document.getElementById('offline-btn');
const onlineBtn = document.getElementById('online-btn');

// DOM 엘리먼트 묶음
const domElements = {
    timer: timerElement,
    round: roundElement,
    player1Score: player1ScoreElement,
    player2Score: player2ScoreElement
};

// 캔버스 초기화 (모드와 관계없이 필요)
initializeCanvasManager(canvasWrapper);
setupInput(); // 키 입력 초기화 (오프라인/온라인 모두 사용)

let CurrentGameManager = null; // 현재 활성화된 게임 매니저 인스턴스

// 2. 게임 모듈 실행 함수
async function launchGame(mode) {
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
        GameManagerModule = await import('./onlineGameManager.js');
        console.log("온라인 모드로 게임을 시작합니다.");
    } else {
        return;
    }
    
    // 3. 로드된 모듈 초기화 및 시작
    CurrentGameManager = GameManagerModule;
    CurrentGameManager.initializeGameManager(domElements);
    CurrentGameManager.startLoop();
}


// 3. 이벤트 리스너 설정
offlineBtn.addEventListener('click', () => {
    launchGame('offline');
});

onlineBtn.addEventListener('click', () => {
    // 온라인 모드는 서버 주소가 필요할 수 있습니다.
    // 여기서는 예시로 서버 주소를 직접 전달하거나, onlineGameManager 내부에서 처리하도록 합니다.
    launchGame('online'); 
});


// 탭 가시성 변경 이벤트 리스너 (GameManager의 stop/startLoop 함수를 사용)
document.addEventListener('visibilitychange', () => {
    if (CurrentGameManager) {
        if (document.visibilityState === 'hidden') {
            CurrentGameManager.stopLoop();
        } else {
            CurrentGameManager.startLoop();
        }
    }
});