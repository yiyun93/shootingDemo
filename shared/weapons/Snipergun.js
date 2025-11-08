import Gun from './Gun.js';

const DAMAGE = 50;

export default class Snipergun extends Gun {
  constructor() {
    super({
      damage: DAMAGE,
      shootRate: 1000, // ms
      maxAmmo: 5,
      reloadDelay: 0, // ms
      reloadRate: 3300, // ms

      bulletConfig: {
        color: '#b9aa7cff',
        width: 60,
        height: 5,
        damage: DAMAGE,
        power: { x: 700, y: -250 },
        speed: 1400
      }
    });
  }
}