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

const BasePlayerConfig = {
    // 기본 설정
    id: 0,
    maxHealth: DEFAULT_PLAYER_HEALTH,
    health: DEFAULT_PLAYER_HEALTH,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: DEFAULT_PLAYER_SPEED,
    accel: DEFAULT_PLAYER_ACCEL,
    jumpStrength: DEFAULT_JUMP_STRENGTH,
    width: 30,
    height: 50,
    facing: 1,
    color: 'red', // 색상은 Player1의 기본값으로 일단 설정
    lastHit: null,
    
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
    coyoteTimeCounter: 0, // 남은 코요테 타임을 추적
    jumpBufferCounter: 0, // 남은 점프 버퍼링 시간을 추적
    
    controls: {
        left: 'a',
        right: 'd',
        jump: 'w',
        down: 's',
        shoot: ' '
    },
    killLog: [],
    
    // 무적 관련
    isAlive: true,
    deadTime: 0,
    respawnDelay: DEFAULT_RESPAWN_DELAY,
    isInvincible: false,
    invincibilityStartTime: 0,
    invincibilityDuration: DEFAULT_INVINC_DURATION
};

export const Player1Config = {
    ...BasePlayerConfig, 
    
    // 고유 설정
    id: 0,
    facing: 1,
    color: 'red',
    controls: {
        left: 'a',
        right: 'd',
        jump: 'w',
        down: 's',
        shoot: ' '
    }
};

// 💡 [수정] Player 2 설정
export const Player2Config = {
    ...BasePlayerConfig, 
    
    // 고유 설정
    id: 1,
    y: 500,
    facing: -1,
    color: 'blue',
    controls: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'ArrowUp',
        down: 'ArrowDown',
        shoot: '0'
    }
};
