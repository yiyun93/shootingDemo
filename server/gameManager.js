import Player from '../shared/Player.js'; 
import { Player1Config, Player2Config } from '../shared/playerConfigs.js';
import { maps } from '../shared/maps.js';
import { handlePlatformCollision, resolvePlayerOverlap } from '../shared/physics.js';

export function createPlayer(socketId, playerId) {

}



export function updateGame({ serverPlayers, playerInputs, deltaTime }) {
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

export function getGameState(serverPlayers) {
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