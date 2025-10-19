import Bullet from "./Bullet.js";
import {
  GRAVITY, FRICTION,
  COYOTE_TIME_DURATION, JUMP_BUFFER_DURATION, JUMP_CUT_MULTIPLIER
} from "./constants.js";
import { applyKnockback, isColliding } from "./physics.js";

export default class Player {
  constructor(config) {
    Object.assign(this, config); // property 복사
    // respawn을 위한 config정보 저장
    this.defaultState = JSON.parse(JSON.stringify(config));

    // 생성 시 즉시 무적 적용
    this.setInvincible(performance.now());
  }

  move(keys, deltaTime, canvasWidth) {
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
      if (this.onGround) this.vx *= (1 - FRICTION * deltaTime);
      else this.vx *= (1 - (FRICTION * deltaTime) / 3) // 공중에 있을 땐 마찰력 1/3만 적용
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

    // let isJumpCut = false;

    // // 가변 점프 (jump cut) 처리 (핵심)
    // if (this.vy < 0 && this.jumpsLeft > 0) {
    //   // 1. 키를 놓았을 때 점프 컷 실행
    //   if (!keys[this.controls.jump]) {
    //     isJumpCut = true;
    //   }
    // }

    // 점프 버퍼가 있으면 점프처리 지상에 있는 경우 위 코드에서 점프 버퍼를 갱신 후 즉시 시행됨
    if (this.jumpBufferCounter > 0) {
      // A. 지상 점프 또는 코요테 타임 점프 허용
      if (this.onGround || this.coyoteTimeCounter > 0) {

        // if(this.onGround) console.log(`${this.color} player jumped on Ground`);
        // else console.log(`${this.color} player jumped in Coyote Time)`);

        this.vy = this.jumpStrength;
        this.onGround = false;

        // 점프 성공시 코요테/버퍼 타임 소진
        this.coyoteTimeCounter = 0;
        this.jumpBufferCounter = 0;

        // 다음 프레임에서 점프가 다시 실행되는 것을 막기 위해 키 입력을 소비합니다.
        keys[this.controls.jump] = false;
      }

      // B. 공중 점프 (이중 점프) 허용. 최대 점프속도 보다 낮을 때만
      // `else if`를 사용하여 지상/코요테 점프가 실패했을 때만 공중 점프를 시도합니다.
      else if (this.jumpsLeft > 0 && this.vy >= this.jumpStrength) {
        // console.log(`${this.color} player jumped on the air`);
        
        this.jumpsLeft--;
        this.vy = this.jumpStrength;

        this.jumpBufferCounter = 0; // 점프 버퍼 초기화

        // 다음 프레임에서 점프가 다시 실행되는 것을 막기 위해 키 입력을 소비합니다.
        keys[this.controls.jump] = false;
      }
    }

    // 가변 중력 적용
    let gravityApplied = GRAVITY;

    if (this.vy > 0) {
      gravityApplied *= JUMP_CUT_MULTIPLIER;
    }
    // 추락 속도 제한
    if (this.vy > -2 * this.jumpStrength) {
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
        this.killPlayer(otherPlayer, timestamp, 'stomped on');
      }
    }
  }

  killPlayer(deadPlayer, timestamp, cause) {
    deadPlayer.isAlive = false;
    deadPlayer.deadTime = timestamp;
    console.log(`${this.color} player ${cause} ${deadPlayer.color} player!`);
    if (this.id != deadPlayer.id) {
      this.killLog.push(deadPlayer);
    }
  }

  shoot(keys, timestamp) {
    if (keys[this.controls.shoot] && (timestamp - this.lastShotTime > this.shootRate) && this.currentAmmo > 0) {
      // 총알 생성
      this.bullets.push(new Bullet(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.facing,
        this
      ));
      //탄약소모 및 타이머 리셋
      this.lastShotTime = timestamp;
      this.currentAmmo--;
      this.reloading = false;
    }
  }

  reload(timestamp) {
    if (this.currentAmmo === this.maxAmmo) {
      this.reloading = false;
      return; // 탄약이 가득 찼으면 장전 로직 종료
    }

    // A. 자동 장전 시작 조건
    if (!this.reloading && (
      //(this.currentAmmo === 0 && timestamp - this.lastShotTime >= this.reloadDelay / 2) ||
      timestamp - this.lastShotTime >= this.reloadDelay)) {
      this.reloading = true;
      this.reloadTime = timestamp;
    }

    // B. 장전 실행 로직 reloadRate 마다 장전
    if (this.reloading) {
      // lastShotTime을 장전 진척도 측정기로 사용 (마지막 발사/장전 시점)
      if (timestamp - this.reloadTime >= this.reloadRate) {
        this.currentAmmo++; // 한 발 장전
        this.reloadTime = timestamp;
      }
    }
  }

  updateBullets(otherPlayer, deltaTime, canvasWidth, timestamp, ctx, platforms) {
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.update(deltaTime, platforms)) {
        return false;
      }

      if (otherPlayer?.isAlive && isColliding(bullet, otherPlayer) && !otherPlayer.isInvincible) {
        // 체력 감소시키고 넉백적용
        otherPlayer.getDamage(this.damage, this, 'hit', timestamp);
        applyKnockback(otherPlayer, bullet.dir * bullet.power.x, bullet.power.y);
        return false;
      }

      // canvas 나간 bullet 제거
      return (bullet.x > 0 && bullet.x < canvasWidth);
    });
    // 탄환 그리기
    this.bullets.forEach(bullet => bullet.draw(ctx));
  }

  getDamage(damage, source, cause, timestamp) {
    this.health -= damage;
    this.lastHit = source;
    if (this.health <= 0) {
      source.killPlayer(this, timestamp, cause);
    }
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
    if (this.lastHit) {
      this.lastHit.killPlayer(this, timestamp, 'threw');
    }
    this.killPlayer(this, timestamp, 'killed');
  }

  clearKillLog() {
    this.killLog = [];
  }

  update(options) {
    const {
      keys,
      deltaTime,
      canvasWidth,
      otherPlayer,
      timestamp,
      mode = 'offline'
    } = options;

    // 이동, 점프, 물리 처리 등
    this.judgeInvicible(timestamp);
    this.move(keys, deltaTime, canvasWidth);
    if (otherPlayer) {
      this.stomp(otherPlayer, timestamp);
    }
    this.shoot(keys, timestamp);
    this.reload(timestamp);
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

  draw(ctx) {
    // 몸통
    if (this.isInvincible) {
      this.drawInviciblePlayer(ctx)
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // 눈
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2 + this.facing * (this.width / 4), this.y + this.height / 3, 2, 0, Math.PI * 2);
    ctx.fill();

    //장전 수 표시
    ctx.fillStyle = this.color //'#FFD700' 금색 (Gold)
    let ammoX = this.x + this.width / 2;
    let ammoY = this.y - this.height / 5
    for (let i = 0; i < this.currentAmmo; i++) {
      ctx.beginPath();
      ctx.arc(ammoX, ammoY - 6 * i, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    /* 장탄수 숫자 표기식 
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentAmmo, this.x + this.width / 2, this.y - this.height / 5);
    */
  }
}