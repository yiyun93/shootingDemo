import Bullet from './Bullet.js';

/*
// 총기 스탯
this.damage = config.damage;
this.shootRate = config.shootRate; // 연사 속도 (ms)
this.maxAmmo = config.maxAmmo;
this.reloadDelay = config.reloadDelay; // 발사 후 재장전까지 딜레이
this.reloadRate = config.reloadRate;   // 1발당 장전 시간
this.bulletConfig = config.bulletConfig; // { color, width, height, damage, power, speed }

// 총기 상태
this.currentAmmo = this.maxAmmo;
this.lastShotTime = 0;
this.reloading = false;
this.reloadTime = 0;
*/

export default class Gun {
    constructor(config) {
        Object.assign(this, config);
        
        // 기본값 할당
        if (this.currentAmmo === undefined) {
            this.currentAmmo = this.maxAmmo;
        }
        if (this.lastShotTime === undefined) {
            this.lastShotTime = 0;
        }
        if (this.reloading === undefined) {
            this.reloading = false;
        }
        if (this.reloadTime === undefined) {
            this.reloadTime = 0;
        }

    }

    // Player가 이 함수를 호출합니다.
    shoot(x, y, facing, timestamp) {
        if (this.reloading) return null; // 재장전 중 발사 불가
        if (this.currentAmmo <= 0) return null; // 탄약 없음
        if (timestamp - this.lastShotTime < this.shootRate) return null; // 연사 속도 제한

        // 발사 성공 : 탄약소모 및 타이머 리셋
        this.lastShotTime = timestamp;
        this.currentAmmo--;

        // Bullet 객체를 생성하여 반환
        return new Bullet(
            {
                x: x,
                y: y,
                dir: facing,
                ...this.bulletConfig
            }
        );
    }


    reload(timestamp) {
        // 탄약이 가득 찼으면 장전 로직 종료
        if (this.currentAmmo >= this.maxAmmo) {
            this.reloading = false;
            return;
        }

        // 탄 소모시 재장전 시작
        if (!this.reloading && this.currentAmmo === 0) {
            this.reloading = true;
            this.reloadTime = timestamp;
        }

        // B. 장전 실행 로직 reloadRate 마다 장전
        if (this.reloading) {
            if (timestamp - this.reloadTime >= this.reloadRate) {
                // [핵심] 한 번에 탄창을 모두 채움
                this.currentAmmo = this.maxAmmo;
                this.reloading = false;
            }
        }
    }

    // 매 프레임 호출되어야 하는 로직 (재장전 등)
    update(timestamp) {
        this.reload(timestamp);
    }
}