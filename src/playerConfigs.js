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
    bullets: [],
    lastShotTime: 0,
    maxAmmo: 6,
    currentAmmo: 6,
    reloading: false,
    reloadTime: 0,
    reloadDelay: 2500, // 2.5초 후 장전
    reloadRate: 500,  // 0.5초당 1발 장전
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
    bullets: [],
    lastShotTime: 0,
    maxAmmo: 6,
    currentAmmo: 6,
    reloading: false,
    reloadTime: 0,
    reloadDelay: 2500,
    reloadRate: 500,  
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
