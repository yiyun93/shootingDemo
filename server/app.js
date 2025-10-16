// 1. 모듈 임포트
require("dotenv").config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// (임시) 게임 로직 모듈 임포트 (추후 gameManager.js로 대체)
// const { createPlayer, updateGame, getGameState } = require('./mockGameManager'); 

// 2. 서버 설정
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;
const TICK_RATE = 60; // 60Hz (서버 틱 속도)

// 3. Socket.io 서버 초기화 (WebSocket 통신 처리)
const io = new Server(httpServer, {
    cors: {
        origin: "*", // 모든 오리진 허용 (배포시 변경)
    },
    // Heartbeat 설정: 클라우드 환경에서 연결 끊김 방지를 위해 권장 (60초 타임아웃 대비)
    pingInterval: 20000, // 20초마다 핑 전송
    pingTimeout: 5000     // 5초 내 응답 없으면 연결 종료
});

// 4. Express 웹 서버 설정 (정적 파일 제공)
// 클라이언트 폴더를 정적 파일로 제공하여, 브라우저가 HTML/JS/CSS에 접근 가능하게 함
app.use(express.static(path.join(__dirname, '../client')));

// shared 폴더를 '/shared' 경로로 서빙합니다.
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// 루트 경로 ('/')로 접속 시 index.html 파일 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});


// =======================================================
// 5. 게임 데이터 및 Socket.io 이벤트 처리
// =======================================================

// 서버가 관리하는 모든 플레이어의 상태 (객체로 관리)
let serverPlayers = {};
// 서버가 받는 최신 입력 정보 (각 플레이어별로 저장)
let playerInputs = {};

io.on('connection', (socket) => {
    console.log(`[연결] 새로운 플레이어 접속: ${socket.id}`);

    // 새 플레이어 생성 및 초기 상태 설정
    serverPlayers[socket.id] = createPlayer(socket.id); 
    playerInputs[socket.id] = {}; // 입력 상태 초기화

    // --- 이벤트 리스너 설정 ---

    // 1. 클라이언트로부터 입력 수신
    socket.on('input', (keys) => {
        // 클라이언트의 최신 키 입력 상태를 저장
        playerInputs[socket.id] = keys;
    });

    // 2. 연결 종료
    socket.on('disconnect', () => {
        console.log(`[종료] 플레이어 연결 해제: ${socket.id}`);
        delete serverPlayers[socket.id]; // 서버 목록에서 제거
        delete playerInputs[socket.id];
        // 다른 모든 클라이언트에게 플레이어 제거 사실을 알림
        io.emit('playerDisconnected', socket.id);
    });

    // 현재 접속된 플레이어 목록을 새 플레이어에게 전송
    socket.emit('currentPlayers', serverPlayers);
    // 다른 모든 플레이어에게 새 플레이어 접속을 알림
    socket.broadcast.emit('newPlayer', serverPlayers[socket.id]);
});


// =======================================================
// 6. 서버 게임 루프 (FIXED TICK RATE)
// =======================================================

const FIXED_DELTA_TIME = 1 / TICK_RATE; // 고정된 델타 타임 (약 0.01666초)

setInterval(() => {
    // 1. 모든 플레이어 입력 처리 및 게임 로직 업데이트
    // 이 함수가 gameManager.js의 핵심 로직을 대체하게 됩니다.
    updateGame({
        serverPlayers,
        playerInputs,
        deltaTime: FIXED_DELTA_TIME
    });
    
    // 2. 업데이트된 게임 상태를 모든 클라이언트에게 전송
    io.emit('gameState', {
        players: getGameState(serverPlayers),
        // 라운드 정보, 타이머, 점수 등 다른 게임 상태도 여기에 포함
        // score: { player1: 10, player2: 5 },
        // timeRemaining: 30
    });

}, 1000 / TICK_RATE);


// 7. 서버 시작
httpServer.listen(PORT, () => {
    console.log(`[서버 시작] Game server listening on port ${PORT}`);
    console.log(`[서버 틱] Fixed Tick Rate: ${TICK_RATE} Hz`);
});


// =======================================================
// 8. (임시) Mock Game Manager (실제 로직은 gameManager.js로 구현 필요)
// =======================================================

function createPlayer(id) {
    return { id, x: Math.random() * 500, y: 100, vx: 0, vy: 0, health: 100, color: '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6,'0') };
}

function updateGame({ serverPlayers, playerInputs, deltaTime }) {
    for (const id in serverPlayers) {
        const player = serverPlayers[id];
        const input = playerInputs[id];
        
        // 간단한 이동 로직 예시 (실제 게임 로직은 Player.js, gameManager.js에서 처리)
        if (input.d) player.x += 100 * deltaTime;
        if (input.a) player.x -= 100 * deltaTime;
        
        // Y축에 중력 적용 (예시)
        player.vy += 9.8 * deltaTime;
        player.y += player.vy;

        // 바닥 충돌 처리 (예시)
        if (player.y > 400) {
            player.y = 400;
            player.vy = 0;
            if (input.w) player.vy = -300; // 점프
        }
    }
}

function getGameState(serverPlayers) {
    // 클라이언트에 필요한 최소한의 데이터만 전송
    const state = {};
    for(const id in serverPlayers) {
        const p = serverPlayers[id];
        state[id] = { 
            id: p.id, 
            x: Math.round(p.x * 100) / 100, // 소수점 2자리로 반올림하여 전송 (데이터 크기 최적화)
            y: Math.round(p.y * 100) / 100, 
            health: p.health, 
            color: p.color 
        };
    }
    return state;
}