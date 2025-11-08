import Gun from './Gun.js';

const DAMAGE = 10;

export default class Pistol extends Gun {
  constructor() {
    super({
      damage: DAMAGE,
      shootRate: 250, // ms
      maxAmmo: 7,
      reloadDelay: 0, // ms
      reloadRate: 2000, // ms

      bulletConfig: {
        color: '#E6AB00',
        width: 30,
        height: 4,
        damage: DAMAGE,
        power: { x: 400, y: -180 },
        speed: 1000
      }
    });
  }
}