// Axis-Aligned Bounding Box collision
export function isColliding(a, b) {
    const tolerance = 3; // 허용 오차 없을시 플랫폼 밟기 판정 떨림 발생
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y - tolerance
    );
}

// 플랫폼 밟기 처리
export function handlePlatformCollision(players, platforms){
    players.forEach(player => {
        let targetOnGround = false;
        platforms.forEach(platform => {
            if (isColliding(player,platform)) {
                // 상반신이 플랫폼보다 높이 있다면 플랫폼 밟기
                if (player.vy >= 0 && player.y + player.height/2 <= platform.y) {
                    player.y = platform.y - player.height;
                    player.vy = 0;
                    player.jumpsLeft = player.extraJump;
                    targetOnGround = true;
                }
            }
        })
        player.onGround = targetOnGround;
    })
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

    a.vx *= 0.9;
    b.vx *= 0.9;

  } else {
    // Y 축으로 분리
    const sign = Math.sign(dy) || 1;
    const moveA = -sign * (overlapY * (bMass / totalMass));
    const moveB = sign * (overlapY * (aMass / totalMass));
    a.y += moveA;
    b.y += moveB;

    // 속도 감쇠: 서로 밀쳐내는 효과(끼임 방지)
    a.vy *= 0.9;
    b.vy *= 0.9;
  }
}

export function applyKnockback(player, forceX, forceY) {
    player.vx += forceX;
    player.vy += forceY;
}