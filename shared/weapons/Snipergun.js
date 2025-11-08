import Gun from './Gun.js';

const DAMAGE = 50;

export default class Snipergun extends Gun {
  constructor() {
    super({
      damage: DAMAGE,
      shootRate: 800, // ms
      maxAmmo: 5,
      reloadDelay: 0, // ms
      reloadRate: 3500, // ms

      bulletConfig: {
        color: '#b9aa7cff',
        width: 60,
        height: 6,
        damage: DAMAGE,
        power: { x: 700, y: -250 },
        speed: 1500
      }
    });
  }
}