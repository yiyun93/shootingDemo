import Gun from './Gun.js';

const DAMAGE = 4;

export default class Pistol extends Gun {
  constructor() {
    super({
      damage: DAMAGE,
      shootRate: 80, // ms
      maxAmmo: 20,
      reloadDelay: 0, // ms
      reloadRate: 2000, // ms

      bulletConfig: {
        color: 'goldenrod',
        width: 20,
        height: 4,
        damage: DAMAGE,
        power: { x: 180, y: -120 },
        speed: 900
      }
    });
  }
}