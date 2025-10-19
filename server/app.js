// // 1. 모듈 임포트
// require("dotenv").config();
// const express = require('express');
// const http = require('http');
// const path = require('path');
// const { Server } = require('socket.io');

// 1. 모듈 임포트
import 'dotenv/config.js'; // dotenv 초기화
import express from 'express';
import http from 'http'; // http는 Node.js 내장 모듈
import path from 'path'; // path는 Node.js 내장 모듈
import { fileURLToPath } from 'url';
import { Server } from 'socket.io'; // 명명된 임포트 사용

// 게임 로직 모듈 임포트
import { createPlayer, updateGame, getGameState } from './gameManager.js'; 

// 2. 서버 설정
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;
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

// 서버가 관리하는 모든 플레이어의 상태 (객체로 관리)
let serverPlayers = {};
// 서버가 받는 최신 입력 정보 (각 플레이어별로 저장)
let playerInputs = {};
// 게임의 종합 상태
let gameState = {
    remainingSeconds: 0,
    gameover: false,
    restartCountDown: 0,
    players: { 
        0: { // Player config + socketId
            id: 0,
            socketId: null,
        }
    },
    mapId: 0,
    round: 0,
    playerWins: {
        0: {
            wins: 0
        },
        1: {
            wins: 0
        }
    }
};

const MAX_PLAYERS = 2;

io.on('connection', (socket) => {
    // 첫번째 플레이어일 경우 맵 default 생성
    if(Object.keys(serverPlayers).length === 0){
        console.log('[대기상태로 돌입합니다]');

    }
    console.log(`[연결] 새로운 플레이어 접속: ${socket.id}`);

    let playerId = NaN;
    for(let i = 0; i < MAX_PLAYERS ; i++){
        if(i in serverPlayers){
            playerId = i;
            break;
        }
    }
    // 새 플레이어 생성 및 초기 상태 설정
    const newPlayer = createPlayer(socket.id, playerId);
    playerInputs[playerId] = {}; // 입력 상태 초기화

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