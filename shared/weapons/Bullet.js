import { isColliding } from "../physics.js";

export default class Bullet {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.dir = config.dir; // -1 or 1

        this.color = config.color;
        this.width = config.width;
        this.height = config.height;
        this.damage = config.damage;
        this.power = config.power;
        this.speed = config.speed;

        if (this.dir == -1) {
            this.x -= this.width;
        }
    }

    update(deltaTime, platforms) {
        this.x += this.dir * this.speed * deltaTime;
        const isCollision = platforms.some(platform => {
            if (platform.type === 'wall' && isColliding(this, platform)) {
                return true;
            }
            return false;
        });
        return !isCollision;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
