import Player from '../shared/Player.js';
import { playerConfigs } from '../shared/playerConfigs.js';
import { maps } from '../shared/maps.js';
import { resolvePlayerOverlap } from '../shared/physics.js';
import { GAME_DURATION } from '../shared/constants.js';

let map = maps[0]; // 대기 맵
let platforms = map.platforms;

export function createPlayer(socketId, playerId) {
    const playerConfig = playerConfigs[playerId];
    const newPlayer = new Player({
        ...playerConfig,
        socketId: socketId,
        jumpKeyBuffer: false,
    })
    newPlayer.setSpawnPoint(map.spawnPoints[playerId].x, map.spawnPoints[playerId].y);
    return newPlayer;
}

export function updateGame({ gameState, deltaTime, timestamp }) {
    const elapsedTime = timestamp - gameState.roundStartTime;
    const remainingTimeMs = GAME_DURATION - elapsedTime;
    gameState.remainingSeconds = Math.max(0, Math.ceil(remainingTimeMs / 1000));

    // 라운드 종료 판정
    // if (remainingTimeMs <= 0 && !isGameOver) {
    //     isGameOver = true;
    //     console.log(`${round} 라운드 종료. red: ${playerStats[0].wins}, blue: ${playerStats[1].wins}`);
    // }

    const players = Object.values(gameState.players);
    const activePlayers = players.filter(p => p.isAlive);

    for (const player of players) {
        const otherPlayer = players.find(p => p.id !== player.id);

        // 점프키가 계속 눌리고 있을 때 이단 점프 방지
        if (player.jumpKeyBuffer && gameState.keys[player.socketId]['KeyW']) {
            gameState.keys[player.socketId]['KeyW'] = false;
            //console.log('버퍼로 인해 점프키가 false로 설정됨');
        }
        else if(player.jumpKeyBuffer != gameState.keys[player.socketId]['KeyW']){
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
            mode: 'online'
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
        if (gameState.gameover) return;
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