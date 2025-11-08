// 베이스 클래스 (필요에 따라 외부로 노출)
export { default as Gun } from './Gun.js';

// 모든 자식 무기 클래스를 모아서 노출
export { default as Pistol } from './Pistol.js';
export { default as Uzi } from './Uzi.js';
export { default as Revolver } from './Revolver.js';

// Bullet이 무기와 밀접하게 관련된다면 같이 노출
export { default as Bullet } from './Bullet.js';