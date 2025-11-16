import Gun from './Gun.js';

const DAMAGE = 10;

const PISTOL_DEFAULT_CONFIG = {
  type: "Pistol",
  damage: DAMAGE,
  shootRate: 250, // ms
  maxAmmo: 7,
  reloadDelay: 0, // ms
  reloadRate: 2000, // ms

  bulletConfig: {
    color: '#E6AB00',
    width: 25,
    height: 3,
    damage: DAMAGE,
    power: { x: 350, y: -180 },
    speed: 1000
  }
};

export default class Pistol extends Gun {
  constructor(config = PISTOL_DEFAULT_CONFIG) {
    super(config);
  }
}