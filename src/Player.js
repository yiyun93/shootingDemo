import Bullet from "./Bullet.js";
import { GRAVITY, FRICTION } from "./constants.js";
import { isColliding } from "./physics.js";


export default class Player {
  constructor(config) {
    Object.assign(this, config); // id, x, y, width 등 복사
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
    else { // 양쪽 키 동시 입력 또는 키를 놓았을 때
      this.vx *= (1 - FRICTION * deltaTime);
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
    // 지상 점프 (onGround 조건으로 점프를 허용)
    if (keys[this.controls.jump] && this.onGround) {
      // console.log(`${this.color} player jumped on the ground`);
      this.vy = this.jumpStrength;
      this.onGround = false;
      keys[this.controls.jump] = false;
    }
    // 공중 점프 (jumpsLeft 조건으로 점프를 허용)
    else if (keys[this.controls.jump] && this.jumpsLeft > 0) {
      this.jumpsLeft--;
      // console.log(`${this.color} player jumped on the air`);
      this.vy = this.jumpStrength;
      keys[this.controls.jump] = false;
    }

    this.vy += GRAVITY * deltaTime;
    this.y += this.vy * deltaTime;

    if (this.y < 0) {
      this.y = 0;
      this.vy = 0; // 캔버스 상단에 부딪히면 튕기지 않게 속도를 0으로 만듦
    }
  }

  stomp(otherPlayer) {
    if (otherPlayer) {
      // 상대방의 머리에서 5분의 1 지점, 좌우 0.3~0.7 지점을 밟으면 stomp 판정
      if (isColliding(this, otherPlayer) && this.y + this.height < otherPlayer.y + otherPlayer.height / 5 &&
        this.x < otherPlayer.x + otherPlayer.width * 0.7 && this.x + this.width > otherPlayer.x + otherPlayer.width * 0.3) {
        this.vy = this.jumpStrength; // 튕겨오르기
        this.jumpsLeft = this.extraJump; // 공중점프 초기화
        otherPlayer.isAlive = false;
        console.log(`${this.color} player stomped on ${otherPlayer.color}!`);
      }
    }
  }

  shoot(keys, timestamp) {
    if (keys[this.controls.shoot] && (timestamp - this.lastShotTime > this.shootRate)  && this.currentAmmo > 0) {
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
    
    // A. 자동 장전 시작 조건 (탄약이 0이거나, reloadDelay 동안 발사하지 않았을 때)
    if (!this.reloading && (this.currentAmmo === 0 || timestamp - this.lastShotTime >= this.reloadDelay) ) {
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

  updateBullets(otherPlayer, deltaTime, canvasWidth) {
    this.bullets = this.bullets.filter(bullet => {
      bullet.update(deltaTime);

      if (otherPlayer && isColliding(bullet, otherPlayer)) {
        otherPlayer.isAlive = false;
        console.log(`${this.color} player hit ${otherPlayer.color} player!`);
        return false;
      }

      // canvas 나간 bullet 제거
      return (bullet.x > 0 && bullet.x < canvasWidth);
    });
  }


  update(keys, deltaTime, canvas, otherPlayer, timestamp) {
    // 이동, 점프, 물리 처리 등
    this.move(keys, deltaTime, canvas.width);
    if (otherPlayer) this.stomp(otherPlayer);
    this.shoot(keys, timestamp);
    this.reload(timestamp);
    this.updateBullets(otherPlayer, deltaTime, canvas.width)
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // 눈
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2 + this.facing * (this.width / 4), this.y + this.height / 3, 2, 0, Math.PI * 2);
    ctx.fill();
    this.bullets.forEach(bullet => bullet.draw(ctx));

    //장전 수 표시
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentAmmo, this.x + this.width/2, this.y - this.height/5);
  }
}

