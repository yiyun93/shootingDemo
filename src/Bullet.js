import { BULLET_SPEED, BULLET_SIZE } from "./constants.js";

export default class Bullet {
    constructor(x, y, dir, owner) {
        this.x = x;
        this.y = y;
        this.dir = dir; // -1 or 1
        this.owner = owner; // reference to player
        this.width = BULLET_SIZE;
        this.height = BULLET_SIZE;
    }

    update(deltaTime) {
        this.x += this.dir * BULLET_SPEED * deltaTime;
    }

    draw(ctx) {
        ctx.fillStyle = this.owner.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, BULLET_SIZE, 0, Math.PI * 2);
        ctx.fill();
    }
}
