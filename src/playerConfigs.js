import { maxJumps } from './constants.js';

export const Player1Config = {
    id: 1,
    x: 50,
    y: 500,
    width: 30,
    height: 50,
    color: 'red',
    yVelocity: 0,
    bullets: [],
    lastShotTime: 0,
    jumpsLeft: maxJumps,
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
    width: 30,
    height: 50,
    color: 'blue',
    yVelocity: 0,
    bullets: [],
    lastShotTime: 0,
    jumpsLeft: maxJumps,
    isAlive: true,
    controls: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'ArrowUp',
        down: 'ArrowDown',
        shoot: '0'
    }
};
