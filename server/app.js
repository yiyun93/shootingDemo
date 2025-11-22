// 1. 모듈 임포트
import 'dotenv/config.js'; // dotenv 초기화
import express from 'express';
import http from 'http'; // http는 Node.js 내장 모듈
import path from 'path'; // path는 Node.js 내장 모듈
import { fileURLToPath } from 'url';
import { Server } from 'socket.io'; // 명명된 임포트 사용

// 게임 로직 모듈 임포트
import { createPlayer, updateGame } from './gameManager.js';

// 2. 서버 설정
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;
const TICK_RATE = 60; // (서버 틱 속도)

// 3. Socket.io 서버 초기화 (WebSocket 통신 처리)
const io = new Server(httpServer, {
    cors: {
        origin: "*", // 모든 오리진 허용 (배포시 변경)
    },
    // Heartbeat 설정: 클라우드 환경에서 연결 끊김 방지를 위해 권장 (60초 타임아웃 대비)
    pingInterval: 20000, // 20초마다 핑 전송
    pingTimeout: 5000     // 5초 내 응답 없으면 연결 종료
});

// ... 서버 시작 ...
// 4. Express 웹 서버 설정 (정적 파일 제공)
// 클라이언트 폴더를 정적 파일로 제공하여, 브라우저가 HTML/JS/CSS에 접근 가능하게 함

// 현재 모듈 파일의 절대 URL을 가져옵니다. (ESM에서 파일 경로를 얻는 표준)
const __filename = fileURLToPath(import.meta.url);
// 파일 경로에서 디렉토리 경로만 추출합니다.
const __dirname = path.dirname(__filename);
const BUILD_PATH = path.join(__dirname, '../dist'); // project-root/dist를 가리킵니다.

// 빌드 결과물 (index.html, 번들 JS/CSS)을 루트 경로 ('/')에서 서빙합니다.
app.use(express.static(BUILD_PATH));

// 루트 경로 ('/')로 접속 시 dist 폴더 내의 index.html 파일 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(BUILD_PATH, 'index.html'));
});


// =======================================================
// 5. 게임 데이터 및 Socket.io 이벤트 처리
// =======================================================

let gameOn = false;
// 서버가 관리하는 모든 플레이어의 상태 (객체로 관리)
let serverPlayers = {};
// 게임의 종합 상태
const DEFAULT_STATE_SETTING = {
    remainingSeconds: 0,
    roundStartTime: 0,
    gameover: false,
    players: serverPlayers,
    mapId: 0, // default
    round: 0,
    playerWins: {
        0: 0,
        1: 0
    },
    keys: {},
    seqs: {},
    gameReady: false
}
let gameState = DEFAULT_STATE_SETTING;
let getPlayerId = {};

const MAX_PLAYERS = 2;

io.on('connection', (socket) => {
    // playerId 할당
    let playerId = NaN;
    for (let i = 0; i < MAX_PLAYERS; i++) {
        if (i in serverPlayers) {
            continue;
        }
        playerId = i;
        break;
    }
    if (isNaN(playerId)) {
        // Full player logic
        socket.disconnect();
        return;
    }

    // 새 플레이어 생성 및 초기 상태 설정
    const newPlayer = createPlayer(socket.id, playerId);
    getPlayerId[socket.id] = playerId;
    serverPlayers[playerId] = newPlayer;

    console.log(`[연결] 새로운 플레이어 접속: playerId: ${playerId}, SocketId: ${socket.id}`);

    // 새 플레이어에게 현재 게임상태 전송
    socket.emit('initPlayer', { state: gameState, playerId: playerId });
    // 다른 모든 플레이어에게 새 플레이어 접속을 알림
    socket.broadcast.emit('newPlayer', serverPlayers[playerId]);

    // 플레이어가 모두 입장한 경우 게임 시작 카운트 실행
    if (Object.keys(serverPlayers).length === MAX_PLAYERS) {
        console.log('** 모든 플레이어 입장, 잠시후 게임이 시작됩니다.');
        gameState.gameReady = true;
    }

    gameState.keys[socket.id] = {};
    gameState.seqs[socket.id] = 0;
    if (!gameOn) {
        gameOn = true;
        init();
    }

    // ------------------- 이벤트 리스너 설정 -------------------

    socket.on('clientPing', (sentTime) => {
        // 클라이언트가 보낸 타임스탬프를 그대로 다시 반환
        socket.emit('serverPong', sentTime);
    });

    // 1. 클라이언트로부터 입력 수신
    socket.on('playerInput', (data) => {
        gameState.keys[socket.id] = data.keys;
        gameState.seqs[socket.id] = data.seq;
    });

    // 2. 연결 종료
    socket.on('disconnect', () => {
        console.log(`[종료] 플레이어 연결 해제: ${socket.id}`);

        gameState = DEFAULT_STATE_SETTING;

        // 기존 플레이어 정보 제거
        delete serverPlayers[playerId];

        // 다른 모든 클라이언트에게 플레이어 제거 사실을 알림
        io.emit('playerDisconnected', socket.id);
    });
});


// =======================================================
// 6. 서버 게임 루프 (FIXED TICK RATE)
// =======================================================

const FIXED_DELTA_TIME = 1 / TICK_RATE; // 고정된 델타 타임 (약 0.01666초)
let timestamp;

function init() {
    setInterval(() => {
        if (Object.values(serverPlayers).length != MAX_PLAYERS) {
            gameState.gameReady = false;
        }
        timestamp = performance.now();
        // 1. 모든 플레이어 입력 처리 및 게임 로직 업데이트
        // 이 함수가 gameManager.js의 핵심 로직을 대체하게 됩니다.
        const newGameState = updateGame({
            gameState: gameState,
            deltaTime: FIXED_DELTA_TIME,
            timestamp: timestamp,
        });

        gameState = newGameState;

        // 2. 업데이트된 게임 상태를 모든 클라이언트에게 전송
        io.emit('gameState', gameState);

    }, 1000 / TICK_RATE);
}



// 7. 서버 시작
httpServer.listen(PORT, () => {
    console.log(`[서버 시작] Game server listening on port ${PORT}`);
    console.log(`[서버 틱] Fixed Tick Rate: ${TICK_RATE} Hz`);
});