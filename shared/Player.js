import {
  GRAVITY, FRICTION,
  COYOTE_TIME_DURATION, JUMP_BUFFER_DURATION, JUMP_CUT_MULTIPLIER, JUMP_FLOAT_MULTIPLIER
} from "./constants.js";
import { applyKnockback, isColliding, handlePlatformCollision } from "./physics.js";
import { Bullet, Pistol, Revolver, Smg, Snipergun } from "./weapons/index.js";

const GUN_CLASS_MAP = { Pistol, Revolver, Smg, Snipergun };

export default class Player {
  constructor(config) {
    Object.assign(this, config); // property 복사

    if (this.gun === null) {
      this.gun = new Pistol();
    }
    else { // 네트워크에서 플레이어 정보를 받아 생성할 때 : 이미 gun정보가 있음
      this.hydrateGun(config.gun);
      this.hydrateBullets(config.bullets);
    }

    // respawn을 위한 config정보 저장
    this.defaultState = JSON.parse(JSON.stringify(config));
  }

  resetFromData(playerData) {
    if (!playerData) return;

    // 1. 필요한 중첩 객체를 분리합니다.
    const {
      gun: GunData,
      bullets: BulletData,
      ...restOfData // x, y, vx, vy, health, isAlive 등 모든 평면 속성
    } = playerData;

    // 2. 평면 속성들을 Object.assign으로 빠르게 덮어씁니다.
    Object.assign(this, restOfData);

    // 3. 중첩된 클래스 인스턴스는 hydration 메소드로 상태만 업데이트합니다.
    this.hydrateGun(GunData);
    this.hydrateBullets(BulletData);
  }

  hydrateGun(gunData) {
    if (!gunData) return;

    const GunClass = GUN_CLASS_MAP[gunData.type];
    // 알 수 없는 총기 타입
    if (!GunClass) {
      this.gun = new Pistol();
      return;
    }

    // 1. 총이 다르거나, 총이 없었으면 새로 생성
    if (!this.gun || this.gun.type !== gunData.type) {
      this.gun = new GunClass(gunData);
    }

    // 2. 총기 스펙을 제외한 총기 상태(탄약, 재장전) 업데이트
    this.gun.currentAmmo = gunData.currentAmmo;
    this.gun.lastShotTime = gunData.lastShotTime;
    this.gun.reloading = gunData.reloading;
    this.gun.reloadTime = gunData.reloadTime;
  }

  hydrateBullets(bulletsData) {
    if (!bulletsData) return;

    // [참고] Bullet은 매번 새로 생성하는 것이 상태 동기화에 더 간단할 수 있습니다.
    // (고급: 기존 총알과 ID를 비교하여 업데이트/삭제/생성할 수도 있습니다)
    this.bullets = bulletsData.map(data => new Bullet(data));
  }


  // =====================================================================
  // ... (move, update, draw 등) ...
  // =====================================================================

  move(keys, deltaTime, canvasWidth) {
    // 죽은 상태에선 움직임 제한
    if (!this.isAlive) {
      keys = {};
    }

    // ------------------------ x축 움직임 ------------------------
    if (keys[this.controls.left] && !keys[this.controls.right] && this.vx > -this.speed) {
      this.vx -= this.accel * deltaTime;
      this.facing = -1;
    }
    else if (!keys[this.controls.left] && keys[this.controls.right] && this.vx < this.speed) {
      this.vx += this.accel * deltaTime;
      this.facing = 1;
    }
    else { // 양쪽 키 동시 입력 또는 키를 놓았을 때 + 또는 이미 플레이어속도를 초과했을 때
      if (this.onGround) {
        this.vx *= (1 - FRICTION * deltaTime);
      }
      else {
        this.vx *= (1 - (FRICTION * deltaTime) / 3) // 공중에 있을 땐 마찰력 1/3만 적용
      }
      // 떨림 방지
      if (Math.abs(this.vx) < 0.1) {
        this.vx = 0;
      }
    }

    this.x += this.vx * deltaTime;

    // X축 경계 설정
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }
    if (this.x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
      this.vx = 0;
    }


    // ------------------------ y축 움직임 ------------------------

    // ---- 코요테/버퍼 카운터 업데이트 ----
    if (this.onGround) {
      // 지면에 닿아 있을 때: 코요테 카운터를 최대값으로 리셋
      this.coyoteTimeCounter = COYOTE_TIME_DURATION;
    } else {
      // 공중에 있을 때: 코요테, 버퍼 카운터 감소
      if (this.coyoteTimeCounter > 0) {
        this.coyoteTimeCounter -= deltaTime;
      }
      if (this.jumpBufferCounter > 0) {
        this.jumpBufferCounter -= deltaTime;
      }
    }

    // 점프 입력 확인시 점프 버퍼 갱신
    if (keys[this.controls.jump]) {
      this.jumpBufferCounter = JUMP_BUFFER_DURATION;
    }

    // 점프 버퍼가 있으면 점프처리 지상에 있는 경우 위 코드에서 점프 버퍼를 갱신 후 즉시 시행됨
    if (this.jumpBufferCounter > 0) {
      // A. 지상 점프 또는 코요테 타임 점프 허용
      if (this.onGround || this.coyoteTimeCounter > 0) {

        // if (this.onGround) console.log(`${this.color} player jumped on Ground`);
        // else console.log(`${this.color} player jumped in Coyote Time)`);

        this.vy += this.jumpStrength;
        this.onGround = false;
        this.onJump = true;

        // 점프 성공시 코요테/버퍼 타임 소진
        this.coyoteTimeCounter = 0;
        this.jumpBufferCounter = 0;
      }

      // B. 공중 점프 (이중 점프) 허용. 최대 점프속도 보다 낮을 때만
      // 지상/코요테 점프가 실패했을 때만 공중 점프를 시도합니다.
      else if (this.jumpsLeft > 0 && this.vy > this.jumpStrength * 0.25) {
        // console.log(`${this.color} player jumped on the air`);

        this.jumpsLeft--;
        this.vy = this.jumpStrength;
        this.onJump = true;

        this.jumpBufferCounter = 0; // 점프 버퍼 초기화
      }
    }

    // ---------------------- 가변 중력 적용 -----------------------
    let gravityApplied = GRAVITY;
    let jumpCutPeriod = this.jumpStrength * -0.10;

    // 추락 가변 가속도 적용
    if (this.vy > 0) {
      this.onJump = false;
      // 상단 구간에서 천천히 떨어지기
      if (this.vy < jumpCutPeriod) {
        gravityApplied *= JUMP_FLOAT_MULTIPLIER;
      }
      else {
        // 하강 4분의 1 지점 부터 4분의 2 지점까지 가속도 배수 interpolation
        const t = Math.min(1, (this.vy - jumpCutPeriod) / (jumpCutPeriod));
        const multiplier = (1 - t) * JUMP_FLOAT_MULTIPLIER + t * JUMP_CUT_MULTIPLIER;
        gravityApplied *= multiplier;
      }
    }

    // 아래 키를 누르면 더 빨리 하강
    if (keys[this.controls.down]) {
      gravityApplied *= JUMP_CUT_MULTIPLIER;
      if(this.vy > -2.5 * this.jumpStrength){
        gravityApplied = 0;
      }
    }  // 추락 속도 제한
    else if (this.vy > -2 * this.jumpStrength) {
      gravityApplied = 0;
    }

    this.vy += gravityApplied * deltaTime;
    this.y += this.vy * deltaTime;

    if (this.y < 0) {
      this.y = 0;
      this.vy = 0; // 캔버스 상단에 부딪히면 튕기지 않게 속도를 0으로 만듦
    }
  }

  stomp(otherPlayer, timestamp) {
    if (otherPlayer?.isAlive && !otherPlayer.isInvincible) {
      // 상대방의 머리에서 5분의 1 지점, 좌우 0.3~0.7 지점을 밟으면 stomp 판정
      if (isColliding(this, otherPlayer) && this.y + this.height < otherPlayer.y + otherPlayer.height / 5 &&
        this.x < otherPlayer.x + otherPlayer.width * 0.7 && this.x + this.width > otherPlayer.x + otherPlayer.width * 0.3) {
        this.vy = this.jumpStrength; // 튕겨오르기
        this.jumpsLeft = this.extraJump; // 공중점프 초기화
        if(this.mode != 'render') this.killPlayer(otherPlayer, timestamp, 'stomped on');
      }
    }
  }

  // 총기 관련 입력을 처리하는 래퍼(wrapper) 함수
  handleGun(keys, timestamp) {

    // 1. 발사 시도
    if (keys[this.controls.shoot]) {
      const newBullet = this.gun.shoot(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.facing,
        timestamp
      );

      // Gun이 발사에 성공하면(탄약, 쿨타임 충족) Bullet 객체를 반환
      if (newBullet) {
        this.bullets.push(newBullet);
      }
    }

    // 2. 총기 자체 로직 (재장전 등)
    this.gun.update(timestamp);
  }

  killPlayer(deadPlayer, timestamp, cause) {
    if (!deadPlayer.isAlive) return;

    deadPlayer.isAlive = false;
    deadPlayer.deadTime = timestamp;

    switch (cause) {
      case 'hit':
      default:
        let temp = deadPlayer.width;
        deadPlayer.width = deadPlayer.height;
        deadPlayer.height = temp;
        break;

      case 'stomped on':
        deadPlayer.width *= 1.25;
        deadPlayer.height *= 0.25;
        break;
    }

    console.log(`${this.color} player ${cause} ${deadPlayer.color} player!`);
    if (this.id != deadPlayer.id) {
      this.killLog.push(deadPlayer);
    }
  }

  // 피격 함수 : 받은 데미지로 인해 죽으면 true를 반환, 안죽으면 false 반환
  getDamage(damage, source, cause, timestamp) {
    this.health -= damage;
    this.lastHit = source;
    this.lastHitTime = timestamp;
    if (this.health <= 0) {
      source.killPlayer(this, timestamp, cause);
      return true;
    }
    return false;
  }

  setSpawnPoint(x, y) {
    this.x = x;
    this.y = y;
    this.defaultState.x = x;
    this.defaultState.y = y;
  }

  respawn(timestamp) {
    if (this.isAlive) return;
    if (timestamp - this.deadTime < this.respawnDelay) return;

    const cleanState = JSON.parse(JSON.stringify(this.defaultState));
    Object.assign(this, cleanState);
    this.gun = new Pistol();
    this.setInvincible(timestamp);
  }

  setInvincible(timestamp) {
    this.isInvincible = true;
    this.invincibilityStartTime = timestamp;
  }

  judgeInvicible(timestamp) {
    if (this.isInvincible) {
      const elapsedTime = timestamp - this.invincibilityStartTime;

      if (elapsedTime >= this.invincibilityDuration) {
        this.isInvincible = false;
      }
    }
  }

  stepLava(timestamp) {
    if (this.mode === 'render') return;
    this.getDamage(0, this.lastHit, 'lava', timestamp);

    if (this.lastHit) {
      this.lastHit.killPlayer(this, timestamp, 'threw');
    }
    else {
      this.killPlayer(this, timestamp, 'killed');
    }
    applyKnockback(this, 0, this.jumpStrength * 0.5);
  }

  clearKillLog() {
    this.killLog = [];
  }

  switchGun(keys) {
    if (keys[this.controls.revolver]) {
      this.gun = new Revolver();
      keys[this.controls.revolver] = false;
    }
    if (keys[this.controls.pistol]) {
      this.gun = new Pistol();
      keys[this.controls.pistol] = false;
    }
    if (keys[this.controls.smg]) {
      this.gun = new Smg();
      keys[this.controls.smg] = false;
    }
    if (keys[this.controls.snipergun]) {
      this.gun = new Snipergun();
      keys[this.controls.snipergun] = false;
    }
  }

  // =============================================================================================

  update(options) {
    // 이동, 점프, 물리 처리 등
    const {
      keys,
      deltaTime,
      canvasWidth,
      otherPlayer,
      timestamp,
      ctx,
      platforms
    } = options;

    handlePlatformCollision(this, platforms, timestamp);
    this.move(keys, deltaTime, canvasWidth);
    if (this.mode == 'offline') this.draw(ctx, timestamp)
    this.updateBullets(otherPlayer, deltaTime, canvasWidth, timestamp, ctx, platforms);

    this.switchGun(keys);

    // 살아있을때만 진행되는 로직들
    if (!this.isAlive) return;

    // 무적 판정
    this.judgeInvicible(timestamp);
    // 밟기 판정
    if (otherPlayer) {
      this.stomp(otherPlayer, timestamp);
    }
    // 총기 관련
    this.handleGun(keys, timestamp);
  }

  updateBullets(otherPlayer, deltaTime, canvasWidth, timestamp, ctx, platforms) {
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.update(deltaTime, platforms)) {
        return false;
      }

      if (otherPlayer?.isAlive && isColliding(bullet, otherPlayer) && !otherPlayer.isInvincible) {
        // 체력 감소시키고 넉백적용
        if (otherPlayer.getDamage(this.gun.damage, this, 'hit', timestamp)) {
          applyKnockback(otherPlayer, bullet.dir * bullet.power.x * 1.5, bullet.power.y * 1.5);
        }
        else {
          applyKnockback(otherPlayer, bullet.dir * bullet.power.x, bullet.power.y);
        }
        return false;
      }

      // canvas 나간 bullet 제거
      return (bullet.x + bullet.width > 0 && bullet.x < canvasWidth);
    });
    // 탄환 그리기
    if (this.mode == 'offline') this.bullets.forEach(bullet => bullet.draw(ctx));
  }

  // 무적 판정일 때 플레이어 그리기
  drawInviciblePlayer(ctx) {
    const currentTime = performance.now();
    const elapsedTime = currentTime - this.invincibilityStartTime;

    // 1. 페이드(Fade) 효과를 위한 투명도(Alpha) 계산
    const cycleDuration = 700; // 0.7초 주기로 페이드인/아웃
    const phase = (elapsedTime % cycleDuration) / cycleDuration; // 0.0 ~ 1.0

    // Math.sin(x)를 사용하여 0.5 ~ 1.0 범위의 알파 값 생성 (은은하게 깜빡임)
    const minAlpha = 0.5;
    const maxAlpha = 1.0;
    const alphaRange = maxAlpha - minAlpha;

    // 투명도 (0.5에서 1.0 사이를 부드럽게 왕복)
    const alpha = minAlpha + (alphaRange * (Math.sin(phase * Math.PI * 2) * 0.5 + 0.5));

    // 캔버스 투명도 설정
    ctx.globalAlpha = alpha;

    // 1. 플레이어 본체 그리기
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 흰색 오버레이 레이어 추가
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // 흰색을 40% 투명도로 오버레이
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.globalAlpha = 1.0;
  }

  draw(ctx, timestamp) {
    // 피격모션
    if (timestamp - this.lastHitTime < 150) {
      ctx.globalAlpha = 0.3;
    }

    // 몸통
    if (this.isInvincible) {
      this.drawInviciblePlayer(ctx)
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    //피격모션 초기화
    ctx.globalAlpha = 1;

    if (this.isAlive) {
      // 눈
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2 + this.facing * (this.width / 4), this.y + this.height / 3, 2, 0, Math.PI * 2);
      ctx.fill();

      //장탄수 표시
      this.gun.drawAmmo(ctx, this.x+this.width/2, this.y, this.color)
    }
  }
}