import { GRAVITY } from "./constants.js";

const tolerance = 3; // 플랫폼 밟기 판정을 위한 허용 오차

// Axis-Aligned Bounding Box collision
export function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y - tolerance
    );
}

function isStrictColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y + tolerance // <- Y축 상단에 허용 오차가 없습니다.
    );
}

function step(player, platform) {
    // 착지 했을 때 x축 속도 줄이기
    if (player.vy >= player.jumpStrength * -0.5) {
        // console.log("stemp detected vx" + player.vx + " -> " + player.vx*0.5);
        player.vx *= 0.5;
    }

    player.y = platform.y - player.height;
    player.vy = 0;
    player.jumpsLeft = player.extraJump;
}

// 플랫폼 충돌 처리
export function handlePlatformCollision(player, platforms, timestamp) {
    // 충돌 전 위치 저장
    const prevX = player.x - player.vx;
    const prevY = player.y - player.vy;

    let targetOnGround = false;

    platforms.forEach(platform => {
        if (!isColliding(player, platform)) return;

        // 충돌이 발생했을 때 플랫폼 타입에 따라 처리
        switch (platform.type) {

            // 1. hover (플레이어가 위에서 밟을 때만 충돌 처리, 나머지는 통과)
            case 'hover':
            default: // 올바르지 않은 type은 일단 hover 취급
                // 플레이어가 하강 중이고, 상반신이 플랫폼보다 높이 있다면 (위에서 밟을 때)
                if (player.vy >= 0 && player.y + player.height / 2 <= platform.y) {
                    // 플랫폼 위에 정지
                    step(player, platform);
                    targetOnGround = true;
                }
                break;

            // 2. wall (모든 방향에서 충돌 방지 및 정지)
            case 'wall':
                // 충돌 처리 (플레이어가 플랫폼 밖으로 밀려나도록 위치 조정)

                // Y축 이동 때문에 충돌이 발생했는지 확인
                // pure chaos idk what is happening clearly but it works...
                if (!isColliding({ ...player, y: prevY }, platform)) {
                    if (player.vy >= 0 && player.vy >= 0 && player.y + player.height / 2 <= platform.y) {
                        step(player, platform);
                        targetOnGround = true;
                    } else if (player.y + player.height / 5 > platform.y + platform.height) { // 상승 중: 플랫폼 아래쪽에 머리 부딪힘
                        player.y = platform.y + platform.height;
                        player.vy = 0;
                    } else if (isStrictColliding(player, platform)) { // x축 이동 충돌 처리
                        if (player.vx > 0) player.x = platform.x - player.width;
                        else if (player.vx < 0) player.x = platform.x + platform.width;
                        player.vx = 0;
                    }
                } else if (isStrictColliding(player, platform)) { // x축 이동 충돌 처리
                    if (player.vx > 0) player.x = platform.x - player.width;
                    else if (player.vx < 0) player.x = platform.x + platform.width;
                    player.vx = 0;
                }
                break;

            // 3. lava (플레이어 충돌 시 사망)
            case 'lava':
                player.stepLava(timestamp);
                // 사망했으므로 추가 충돌 처리는 불필요
                break;
        }
    });

    player.onGround = targetOnGround;
}

// 겹침 방지
export function resolvePlayerOverlap(a, b) {
    // AABB 중심 좌표
    const aCenterX = a.x + a.width / 2;
    const aCenterY = a.y + a.height / 2;
    const bCenterX = b.x + b.width / 2;
    const bCenterY = b.y + b.height / 2;

    // 거리
    const dx = bCenterX - aCenterX;
    const dy = bCenterY - aCenterY;

    // 반폭 합
    const overlapX = (a.width / 2 + b.width / 2) - Math.abs(dx);
    const overlapY = (a.height / 2 + b.height / 2) - Math.abs(dy);

    // 겹치지 않으면 종료
    if (overlapX <= 0 || overlapY <= 0) return;

    // 질량 근사(면적). 0이 되지 않도록 최소값 보정
    const aMass = Math.max(1, a.width * a.height);
    const bMass = Math.max(1, b.width * b.height);
    const totalMass = aMass + bMass;

    // 작은 축(최소 침투 축) 기준으로 분리
    if (overlapX < overlapY) {
        // X 축으로 분리
        const sign = Math.sign(dx) || 1; // b가 오른쪽에 있으면 +1
        const moveA = -sign * (overlapX * (bMass / totalMass));
        const moveB = sign * (overlapX * (aMass / totalMass));
        a.x += moveA;
        b.x += moveB;

        a.vx *= 0.8;
        b.vx *= 0.8;

    } else {
        // Y 축으로 분리
        const sign = Math.sign(dy) || 1;
        const moveA = -sign * (overlapY * (bMass / totalMass));
        const moveB = sign * (overlapY * (aMass / totalMass));
        a.y += moveA;
        b.y += moveB;

        // 속도 감쇠: 서로 밀쳐내는 효과(끼임 방지)
        a.vy *= 0.8;
        b.vy *= 0.8;
    }
}

export function applyKnockback(player, forceX, forceY) {
    player.vx += forceX;
    player.vy += forceY;
}