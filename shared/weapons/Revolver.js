import ShellReloadGun from './ShellReloadGun.js';

const DAMAGE = 14;

const REVOLVER_DEFAULT_CONFIG = {
  type: "Revolver",
  damage: DAMAGE,
  shootRate: 180, // ms
  maxAmmo: 6,
  reloadDelay: 800, // ms
  reloadRate: 400, // ms

  bulletConfig: {
    color: '#c79709ff',
    width: 30,
    height: 4,
    damage: DAMAGE,
    power: { x: 550, y: -220 },
    speed: 1200
  },

  ammoRenderConfig: {
    width: 8,
    height: 4,
    enum: 7
  }
}

export default class Revolver extends ShellReloadGun {
  constructor(config = REVOLVER_DEFAULT_CONFIG) {
    super(config);
  }


  drawAmmo(ctx, x, y, color) {
    //장전 수 표시
    ctx.fillStyle = color
    const centerX = x;
    const centerY = y - 25;
    const layoutRadius = 10;
    const bulletRadius = 3;

    for (let i = 0; i < 6; i++) {
        let angle = -Math.PI / 2 - (i * (Math.PI / 3));
        let ammoX = centerX + Math.cos(angle) * layoutRadius;
        let ammoY = centerY + Math.sin(angle) * layoutRadius;

        ctx.beginPath();
        ctx.arc(ammoX, ammoY, bulletRadius, 0, Math.PI * 2);

        if (i < this.currentAmmo) {
            // 현재 장전된 총알
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            // 빈 슬롯은 테두리만
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(100, 100, 100, 0.5)"; // 회색 테두리
            ctx.stroke();
        }
    }
  }
}