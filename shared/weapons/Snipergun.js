import Gun from './Gun.js';

const DAMAGE = 50;

const SNIPERGUN_DEFAULT_CONFIG = {
  type: 'Snipergun',
  damage: DAMAGE,
  shootRate: 1000, // ms
  maxAmmo: 5,
  reloadDelay: 0, // ms
  reloadRate: 3500, // ms

  bulletConfig: {
    color: '#fbff00ff',
    width: 55,
    height: 2,
    damage: DAMAGE,
    power: { x: 700, y: -250 },
    speed: 1400
  },

  ammoRenderConfig: {
    width: 12,
    height: 5,
    enum: 11
  }
}

export default class Snipergun extends Gun {
  constructor(config = SNIPERGUN_DEFAULT_CONFIG) {
    super(config);
  }
}