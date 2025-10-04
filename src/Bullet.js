import { bulletSpeed, bulletSize } from "./constants.js";

export default class Bullet {
    constructor(x, y, dir, owner) {
        this.x = x;
        this.y = y;
        this.dir = dir; // -1 or 1
        this.owner = owner; // reference to player
        this.width = bulletSize;
        this.height = bulletSize;
    }

    update(deltaTime) {
        this.x += this.dir * bulletSpeed * deltaTime * 60;
    }

    draw(ctx) {
        ctx.fillStyle = this.owner.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, bulletSize, 0, Math.PI * 2);
        ctx.fill();
    }
}
