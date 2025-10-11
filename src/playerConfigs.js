import { extraJump } from './constants.js';

export const Player1Config = {
    id: 1,
    x: 50,
    y: 500,
    vx: 0,
    vy: 0,
    width: 30,
    height: 50,
    facing: 1,
    color: 'red',
    shootRate: 300,
    bullets: [],
    lastShotTime: 0,
    maxAmmo: 6,
    currentAmmo: 6,
    reloading: false,
    reloadTime: 0,
    reloadDelay: 1300, // 1.5초 후 장전
    reloadRate: 700,  // 0.7초당 1발 장전
    jumpsLeft: extraJump,
    onGround: true,
    isAlive: true,
    controls: {
        left: 'a',
        right: 'd',
        jump: 'w',
        down: 's',
        shoot: ' '
    }
};

export const Player2Config = {
    id: 2,
    x: 720,
    y: 500,
    vx: 0,
    vy: 0,
    width: 30,
    height: 50,
    facing: -1,
    color: 'blue',
    shootRate: 300,
    bullets: [],
    lastShotTime: 0,
    maxAmmo: 6,
    currentAmmo: 6,
    reloading: false,
    reloadTime: 0,
    reloadDelay: 1500,
    reloadRate: 700,  
    jumpsLeft: extraJump,
    onGround: true,
    isAlive: true,
    controls: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'ArrowUp',
        down: 'ArrowDown',
        shoot: '0'
    }
};
