import ShellReloadGun from './ShellReloadGun.js';

const DAMAGE = 13;

const REVOLVER_DEFAULT_CONFIG = {
  type: "Revolver",
  damage: DAMAGE,
  shootRate: 320, // ms
  maxAmmo: 6,
  reloadDelay: 800, // ms
  reloadRate: 400, // ms

  bulletConfig: {
    color: '#c79709ff',
    width: 35,
    height: 4,
    damage: DAMAGE,
    power: { x: 550, y: -220 },
    speed: 1100
  }
}

export default class Revolver extends ShellReloadGun {
  constructor(config = REVOLVER_DEFAULT_CONFIG) {
    super(config);
  }
}