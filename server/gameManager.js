import Player from '../shared/Player.js';
import { Player1Config, Player2Config } from '../shared/playerConfigs.js';
import { maps } from '../shared/maps.js';
import { handlePlatformCollision, resolvePlayerOverlap } from '../shared/physics.js';
import { GAME_DURATION } from '../shared/constants.js';

let map = maps[0]; // 대기 맵
let platforms = map.platforms;

export function createPlayer(socketId, playerId) {
    const playerConfig = playerId ? Player2Config : Player1Config;
    const newPlayer = new Player({
        ...playerConfig,
        socketId: socketId,
        keys: {}
    })
    newPlayer.setSpawnPoint( map.spawnPoints[i].x,  map.spawnPoints[i].y );
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
        const keys = player.keys;
        const otherPlayer = players.find(p => p.id !== player.id);

        // 살아있는 플레이어만 움직임 업데이트
        if (player.isAlive) {
            const updateOptions = {
                keys: keys,
                deltaTime: deltaTime,
                canvasWidth: map.width,
                otherPlayer: otherPlayer,
                timestamp: timestamp
            };
            player.update(updateOptions);
        }

        // 총알 업데이트
        player.updateBullets(otherPlayer, deltaTime, gameCanvas.width, timestamp, gameCtx, platforms);
    };

    // 플랫폼 물리 적용
    handlePlatformCollision(activePlayers, platforms, timestamp);

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
        if(gameState.gameover) return;
        for (const deadPlayer of player.killLog){
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