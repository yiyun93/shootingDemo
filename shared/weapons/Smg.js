import Gun from './Gun.js';

const DAMAGE = 4;

const SMG_DEFAULT_CONFIG = {
  type: "Smg",
  damage: DAMAGE,
  shootRate: 80, // ms
  maxAmmo: 20,
  reloadDelay: 0, // ms
  reloadRate: 2800, // ms

  bulletConfig: {
    color: '#FDBE02',
    width: 20,
    height: 3,
    damage: DAMAGE,
    power: { x: 200, y: -80 },
    speed: 900
  }
}

export default class Smg extends Gun {
  constructor(config = SMG_DEFAULT_CONFIG) {
    super(config);
  }
}