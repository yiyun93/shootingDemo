import {
    DEFAULT_PLAYER_HEALTH,
    DEFAULT_PLAYER_SPEED,
    DEFAULT_PLAYER_ACCEL,
    DEFAULT_JUMP_STRENGTH,
    DEFAULT_EXTRA_JUMP,
    DEFAULT_MAX_AMMO,
    DEFAULT_RELOAD_DELAY,
    DEFAULT_RELOAD_RATE,
    DEFAULT_SHOOT_RATE,
    DEFAULT_RESPAWN_DELAY,
    DEFAUAT_DAMAGE,
    DEFAULT_INVINC_DURATION
} from './constants.js';

export const Player1Config = {
    // 기본 설정
    id: 1,
    health: DEFAULT_PLAYER_HEALTH,
    x: 50,
    y: 500,
    vx: 0,
    vy: 0,
    speed: DEFAULT_PLAYER_SPEED,
    accel: DEFAULT_PLAYER_ACCEL,
    jumpStrength: DEFAULT_JUMP_STRENGTH,
    width: 30,
    height: 50,
    facing: 1,
    color: 'red',
    // 총알 관련
    damage: DEFAUAT_DAMAGE,
    shootRate: DEFAULT_SHOOT_RATE,
    bullets: [],
    lastShotTime: 0,
    maxAmmo: DEFAULT_MAX_AMMO,
    currentAmmo: DEFAULT_MAX_AMMO,
    reloading: false,
    reloadTime: 0,
    reloadDelay: DEFAULT_RELOAD_DELAY,
    reloadRate: DEFAULT_RELOAD_RATE,
    // 점프판정 관련
    extraJump: DEFAULT_EXTRA_JUMP,
    jumpsLeft: DEFAULT_EXTRA_JUMP,
    onGround: true,
    controls: {
        left: 'a',
        right: 'd',
        jump: 'w',
        down: 's',
        shoot: ' '
    },
    // 무적 관련
    isAlive: true,
    deadTime: 0,
    respawnDelay: DEFAULT_RESPAWN_DELAY,
    isInvincible: true,
    invincibilityStartTime: 0,
    invincibilityDuration: DEFAULT_INVINC_DURATION
};

export const Player2Config = {
    // 기본 설정
    id: 2,
    health: DEFAULT_PLAYER_HEALTH,
    x: 720,
    y: 500,
    vx: 0,
    vy: 0,
    speed: DEFAULT_PLAYER_SPEED,
    accel: DEFAULT_PLAYER_ACCEL,
    jumpStrength: DEFAULT_JUMP_STRENGTH,
    width: 30,
    height: 50,
    facing: -1,
    color: 'blue',
    // 총알 관련
    damage: DEFAUAT_DAMAGE,
    shootRate: DEFAULT_SHOOT_RATE,
    bullets: [],
    lastShotTime: 0,
    maxAmmo: DEFAULT_MAX_AMMO,
    currentAmmo: DEFAULT_MAX_AMMO,
    reloading: false,
    reloadTime: 0,
    reloadDelay: DEFAULT_RELOAD_DELAY,
    reloadRate: DEFAULT_RELOAD_RATE,
    // 점프판정 관련
    extraJump: DEFAULT_EXTRA_JUMP,
    jumpsLeft: DEFAULT_EXTRA_JUMP,
    onGround: true,
    controls: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'ArrowUp',
        down: 'ArrowDown',
        shoot: '0'
    },
    // 무적 관련
    isAlive: true,
    deadTime: 0,
    respawnDelay: DEFAULT_RESPAWN_DELAY,
    isInvincible: true,
    invincibilityStartTime: 0,
    invincibilityDuration: DEFAULT_INVINC_DURATION
};
