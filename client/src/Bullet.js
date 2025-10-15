import { BULLET_SPEED, BULLET_SIZE, BULLET_KNOCKBACK_POWER } from "./constants.js";
import { isColliding } from "./physics.js";
import { platforms } from "./gameManager.js";

export default class Bullet {
    constructor(x, y, dir, owner) {
        this.x = x;
        this.y = y;
        this.dir = dir; // -1 or 1
        this.owner = owner; // reference to player
        this.width = BULLET_SIZE;
        this.height = BULLET_SIZE;
        this.power = BULLET_KNOCKBACK_POWER;
    }

    update(deltaTime) {
        this.x += this.dir * BULLET_SPEED * deltaTime;
        const isCollision = platforms.some(platform => {
            if (platform.type === 'wall' && isColliding(this, platform)) {
                return true;
            }
            return false;
        });
        return !isCollision;
    }

    draw(ctx) {
        ctx.fillStyle = this.owner.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, BULLET_SIZE, 0, Math.PI * 2);
        ctx.fill();
    }
}
