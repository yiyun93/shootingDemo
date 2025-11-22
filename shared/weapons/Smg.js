import Gun from './Gun.js';

const DAMAGE = 7;

const SMG_DEFAULT_CONFIG = {
  type: "Smg",
  damage: DAMAGE,
  shootRate: 70, // ms
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
  },

  ammoRenderConfig: {
    width: 7,
    height: 3,
    enum: 5
  }
}

export default class Smg extends Gun {
  constructor(config = SMG_DEFAULT_CONFIG) {
    super(config);
  }
}