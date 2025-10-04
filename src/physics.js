import { maxJumps } from "./constants";

// Axis-Aligned Bounding Box collision
export function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// 플랫폼 밟기 처리
export function handlePlatformCollision(players, platforms){
    players.forEach(player => {
        platforms.forEach(platform => {
            if (isColliding(player,platform)) {
                // 상반신이 플랫폼보다 높이 있다면 플랫폼 밟기
                if (player.yVelocity > 0 && player.y + player.height/2 < platform.y) {
                    player.y = platform.y - player.height;
                    player.yVelocity = 0;
                    player.jumpsLeft = maxJumps;
                }
            }
        })
    })
}