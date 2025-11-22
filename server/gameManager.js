import Player from '../shared/Player.js';
import { playerConfigs } from '../shared/playerConfigs.js';
import { maps } from '../shared/maps.js';
import { resolvePlayerOverlap } from '../shared/physics.js';
import { ROUND_DURATION } from '../shared/constants.js';
const readyCount = 10000;

let map = maps[0]; // 대기 맵
let platforms = map.platforms;

export function createPlayer(socketId, playerId) {
    const playerConfig = playerConfigs[playerId];
    const newPlayer = new Player({
        ...playerConfig,
        mode: 'online',
        socketId: socketId,
        jumpKeyBuffer: false,
    })
    newPlayer.setSpawnPoint(map.spawnPoints[playerId].x, map.spawnPoints[playerId].y);
    return newPlayer;
}

export function updateGame({ gameState, deltaTime, timestamp }) {
    const elapsedTime = timestamp - gameState.roundStartTime;
    const remainingTimeMs = ROUND_DURATION - elapsedTime;
    gameState.remainingSeconds = Math.max(0, Math.ceil(remainingTimeMs / 1000));

    // 게임 준비 로직
    if (gameState.round == 0 && !gameState.gameover) {
        if(gameState.gameReady){
            gameState.gameover = true;
            gameState.roundStartTime = timestamp;
        }
        else{
            gameState.remainingSeconds = 0;
        }
    }

    // 라운드 로직
    if (gameState.round != 0 && remainingTimeMs <= 0 && !gameState.gameover) {
        console.log(`${gameState.round} 라운드 종료. red: ${gameState.playerWins[0]}, blue: ${gameState.playerWins[1]}`);
        gameState.gameover = true;
        gameState.roundStartTime = timestamp;
    }
    else if (gameState.gameover){
        gameState.remainingSeconds = Math.max(0, Math.ceil((readyCount - elapsedTime)/ 1000));

        if(gameState.remainingSeconds <= 0){
            resetRound(gameState, timestamp);
        }
    }

    const players = Object.values(gameState.players);
    const activePlayers = players.filter(p => p.isAlive);

    for (const player of players) {
        const otherPlayer = players.find(p => p.id !== player.id);

        // 점프키가 계속 눌리고 있을 때 이단 점프 방지
        if (player.jumpKeyBuffer && gameState.keys[player.socketId]['KeyW']) {
            gameState.keys[player.socketId]['KeyW'] = false;
            //console.log('버퍼로 인해 점프키가 false로 설정됨');
        }
        else if (player.jumpKeyBuffer != gameState.keys[player.socketId]['KeyW']) {
            player.jumpKeyBuffer = gameState.keys[player.socketId]['KeyW'];
            //console.log("점프키가 설정됨", player.jumpKeyBuffer);
        }

        const updateOptions = {
            keys: gameState.keys[player.socketId],
            deltaTime: deltaTime,
            canvasWidth: map.width,
            otherPlayer: otherPlayer,
            timestamp: timestamp,
            platforms: platforms,
        };
        player.update(updateOptions);
    };

    // 둘다 살아 있을 때 충돌 분리
    if (activePlayers.length >= 2) {
        resolvePlayerOverlap(activePlayers[0], activePlayers[1]);
    } // 사망자 리스폰
    else if (!gameState.gameover) { // 게임오버시 부활안함
        const dead = players.find(p => !p.isAlive);
        if (dead) dead.respawn(timestamp);
    }

    // 플레이어 점수 카운트
    players.forEach(player => {
        if (gameState.gameover || gameState.round == 0) return;
        for (const deadPlayer of player.killLog) {
            gameState.playerWins[player.id]++;
        }
        player.clearKillLog();
    });

    refineGameState(gameState);
    return gameState;
}

function refineGameState(gameState) {
    // 클라이언트에 필요한 최소한의 데이터만 전송
    const players = Object.values(gameState.players);
    for (const p of players) {
        p.x = Math.round(p.x * 100) / 100;
        p.y = Math.round(p.y * 100) / 100;
        p.vx = Math.round(p.vx * 100) / 100;
        p.vy = Math.round(p.vy * 100) / 100;
    }
}

function resetRound(gameState, timestamp) {
    gameState.round++;
    const mapId = Math.floor(Math.random() * (maps.length-1)) + 1;
    gameState.mapId = mapId;
    map = maps[mapId];
    platforms = map.platforms;
    console.log(`${gameState.round} 라운드 : ${map.name} `);

    // 캐릭터 재생성
    const playerIds = Object.keys(gameState.players);
    playerIds.forEach(playerId => {
        const newPlayer = createPlayer(gameState.players[playerId].socketId, playerId);
        gameState.players[playerId] = newPlayer;
    });

    // 게임 상태 초기화
    gameState.gameover = false;
    gameState.roundStartTime = timestamp;
}
