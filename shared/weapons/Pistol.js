import ShellReloadGun from './ShellReloadGun.js';

const DAMAGE = 10;

export default class Pistol extends ShellReloadGun {
  constructor() {
    super({
      damage: DAMAGE,
      shootRate: 300, // ms
      maxAmmo: 6,
      reloadDelay: 800, // ms
      reloadRate: 400, // ms

      bulletConfig: {
        color: 'darkgoldenrod',
        width: 28,
        height: 6,
        damage: DAMAGE,
        power: { x: 400, y: -180 },
        speed: 1000
      }
    });
  }
}