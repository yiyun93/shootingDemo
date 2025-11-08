import Gun from './Gun.js';
import Bullet from './Bullet.js'; // Bullet 생성을 위해 임포트 필요

export default class ShellReloadGun extends Gun {

    shoot(x, y, facing, timestamp) {
        // [핵심] 장전 중 발사 불가 로직 제거
        if (this.currentAmmo <= 0) return null;
        if (timestamp - this.lastShotTime < this.shootRate) return null;

        // 발사 성공 : 탄약소모 및 타이머 리셋
        this.lastShotTime = timestamp;
        this.currentAmmo--;
        this.reloading = false;

        return new Bullet(x, y, facing, this.bulletConfig);
    }

    reload(timestamp) {
        // 탄약이 가득 찼으면 장전 로직 종료
        if (this.currentAmmo >= this.maxAmmo) {
            this.reloading = false;
            return;
        }

        // A. 자동 장전 시작 조건
        if (!this.reloading && (
            timestamp - this.lastShotTime >= this.reloadDelay)) {
            this.reloading = true;
            this.reloadTime = timestamp;
        }

        // B. 장전 실행 로직 reloadRate 마다 장전
        if (this.reloading) {
            if (timestamp - this.reloadTime >= this.reloadRate) {
                this.currentAmmo++;
                this.reloadTime = timestamp;

                // 장전 완료 시
                if (this.currentAmmo === this.maxAmmo) {
                    this.reloading = false;
                }
            }
        }
    }
}