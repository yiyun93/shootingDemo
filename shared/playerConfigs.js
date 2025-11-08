import {
    DEFAULT_PLAYER_HEALTH,
    DEFAULT_PLAYER_SPEED,
    DEFAULT_PLAYER_ACCEL,
    DEFAULT_JUMP_STRENGTH,
    DEFAULT_EXTRA_JUMP,
    DEFAULT_RESPAWN_DELAY,
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
    
    // 총기 관련
    gun: null,
    bullets: [],
    
    // 점프판정 관련
    extraJump: DEFAULT_EXTRA_JUMP,
    jumpsLeft: DEFAULT_EXTRA_JUMP,
    onGround: true,
    coyoteTimeCounter: 0, // 남은 코요테 타임을 추적
    jumpBufferCounter: 0, // 남은 점프 버퍼링 시간을 추적
    
    controls: {
        left: 'KeyA',
        right: 'KeyD',
        jump: 'KeyW',
        down: 'KeyS',
        shoot: 'Space'
    },
    killLog: [],
    lastHitTime: -100,
    
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
        left: 'KeyA',
        right: 'KeyD',
        jump: 'KeyW',
        down: 'KeyS',
        shoot: 'Space',
        revolver: 'Digit1',
        pistol: 'Digit2',
        uzi: 'Digit3'
    },
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
        shoot: 'Numpad0',
        revolver: 'Numpad1',
        pistol: 'Numpad2',
        uzi: 'Numpad3'
    }
};
