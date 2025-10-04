import Bullet from "./Bullet.js";
import { GRAVITY, playerSpeed, jumpStrength, maxJumps, shootCooldown } from "./constants.js";
import { isColliding } from "./physics.js";


export default class Player {
  constructor(config) {
    Object.assign(this, config); // id, x, y, width 등 복사
  }

  move(keys, deltaTime, canvasWidth) {
    // 좌우 움직임
    if (keys[this.controls.left]) this.x -= playerSpeed * deltaTime * 60;
    if (keys[this.controls.right]) this.x += playerSpeed * deltaTime * 60;

    // 점프 로직
    if (keys[this.controls.jump] && this.jumpsLeft > 0) {
      this.yVelocity = jumpStrength;
      this.jumpsLeft--;
      keys[this.controls.jump] = false;
    }

    // X축 경계 설정
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
    }

    // 중력 적용
    this.yVelocity += GRAVITY * deltaTime * 60;
    this.y += this.yVelocity * deltaTime * 60;

    if (this.y < 0) {
      this.y = 0;
      this.yVelocity = 0; // 캔버스 상단에 부딪히면 튕기지 않게 속도를 0으로 만듦
    }
  }

  stomp(otherPlayer) {
    if (otherPlayer) {
      // 상대방의 머리에서 5분의 1 지점, 좌우 0.3~0.7 지점을 밟으면 stomp 판정
      if (isColliding(this, otherPlayer) && this.y + this.height < otherPlayer.y + otherPlayer.height / 5 &&
          this.x < otherPlayer.x + otherPlayer.width*0.7 && this.x + this.width > otherPlayer.x + otherPlayer.width*0.3 ) {
        this.yVelocity = jumpStrength; // 튕겨오르기
        this.jumpsLeft = maxJumps - 1; // 공중점프 초기화
        otherPlayer.isAlive = false;
        console.log(`${this.color} player stomped on ${otherPlayer.color}!`);
      }
    }
  }

  shoot(keys, timestamp) {
    if (keys[this.controls.shoot] && (timestamp - this.lastShotTime > shootCooldown)) {
      let dir = 1;
      if (keys[this.controls.left]) {
        dir = -1;
      } else if (keys[this.controls.right]) {
        dir = 1;
      } else {
        dir = (this.id === 1) ? 1 : -1;
      }

      this.bullets.push(new Bullet(
        this.x + this.width / 2,
        this.y + this.height / 2,
        dir,
        this
      ));

      this.lastShotTime = timestamp;
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
    this.stomp(otherPlayer);
    this.shoot(keys, timestamp);
    this.updateBullets(otherPlayer, deltaTime, canvas.width)
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    this.bullets.forEach(bullet => bullet.draw(ctx));
  }
}

