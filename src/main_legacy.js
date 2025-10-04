const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

//상수값
const gravity = 0.5;
const playerSpeed = 5;
const jumpStrength = -10;
const bulletSpeed = 8;
const bulletSize = 5;
const bulletCooldown = 300;
const maxJumps = 2;
//새로추가
let isGameOver = false; // 게임 상태를 추적하는 변수
const restartButton = document.getElementById('restartButton'); // 버튼 엘리먼트 가져오기

//승리 횟수 변수
let player1Wins = 0;
let player2Wins = 0;
const player1ScoreElement = document.getElementById('player1Score');
const player2ScoreElement = document.getElementById('player2Score');


const initialPlayer1 = {
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

const initialPlayer2 = {
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

let players = [
    { ...initialPlayer1 },
    { ...initialPlayer2 }
];

const platforms = [
    { x: 0, y: 550, width: 800, height: 50, color: '#4CAF50' },
    { x: 150, y: 400, width: 200, height: 20, color: '#795548' },
    { x: 450, y: 300, width: 200, height: 20, color: '#795548' },
    { x: 50, y: 200, width: 100, height: 20, color: '#795548' }
];

const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if(isGameOver && e.key === 'Enter') resetGame();
    
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});



// Delta Time 기법을 이용한 프레임 속도 보정
let lastTime = 0;

// 게임 루프를 제어할 변수 선언
let animationId = null;

function gameLoop(timestamp) {
    if (isGameOver) {
        // 게임 오버 상태일 때는 루프를 실행하지 않음
        return;
    }

    // 델타 타임 계산 (밀리초를 초 단위로 변환)
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    platforms.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    const activePlayers = players.filter(p => p.isAlive);

    activePlayers.forEach(player => {
        // Player movement
        // 델타 타임을 곱하여 속도 보정
        if (keys[player.controls.left]) {
            player.x -= playerSpeed * deltaTime * 60; // 60 FPS 기준 보정
        }
        if (keys[player.controls.right]) {
            player.x += playerSpeed * deltaTime * 60;
        }

        // X축 경계 설정
        if (player.x < 0) {
            player.x = 0;
        }
        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
        }

        // Apply gravity
        player.yVelocity += gravity * deltaTime * 60;
        player.y += player.yVelocity * deltaTime * 60;

        if (player.y < 0) {
            player.y = 0;
            player.yVelocity = 0; // 캔버스 상단에 부딪히면 튕기지 않게 속도를 0으로 만듦
        }

        // Double jump logic
        if (keys[player.controls.jump] && player.jumpsLeft > 0) {
            player.yVelocity = jumpStrength;
            player.jumpsLeft--;
            keys[player.controls.jump] = false;
        }

        // Player-to-player stomping collision detection
        const otherPlayer = activePlayers.find(p => p.id !== player.id);
        if (otherPlayer) {
            // Check for stomping collision
            if (player.yVelocity > 0 && // Player is falling
                player.x < otherPlayer.x + otherPlayer.width &&
                player.x + player.width > otherPlayer.x &&
                player.y + player.height > otherPlayer.y &&
                player.y + player.height < otherPlayer.y + otherPlayer.height / 2) {

                // Player stomped on otherPlayer!
                player.yVelocity = jumpStrength; // Bounce up
                player.jumpsLeft = maxJumps; // Reset jumps
                otherPlayer.isAlive = false; // Remove the stomped player
                console.log(`${player.color} player stomped on ${otherPlayer.color}!`);
            }
        }

        // Collision detection with platforms
        platforms.forEach(p => {
            if (player.x < p.x + p.width &&
                player.x + player.width > p.x &&
                player.y + player.height > p.y &&
                player.y + player.height < p.y + p.height + player.height) {

                if (player.yVelocity > 0) {
                    player.y = p.y - player.height;
                    player.yVelocity = 0;
                    player.jumpsLeft = maxJumps;
                }
            }
        });

        // Shooting logic with cooldown
        if (keys[player.controls.shoot] && (timestamp - player.lastShotTime > bulletCooldown)) {
            let dir = 1;
            if (keys[player.controls.left]) {
                dir = -1;
            } else if (keys[player.controls.right]) {
                dir = 1;
            } else {
                dir = (player.id === 1) ? 1 : -1;
            }

            player.bullets.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                dir: dir
            });
            player.lastShotTime = timestamp;
        }

        // Draw the player
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    });

    // Update and draw bullets for all players
    activePlayers.forEach(player => {
        player.bullets = player.bullets.filter(bullet => {
            bullet.x += bullet.dir * bulletSpeed * deltaTime * 60;

            const otherPlayer = activePlayers.find(p => p.id !== player.id);
            if (otherPlayer) {
                if (bullet.x > otherPlayer.x &&
                    bullet.x < otherPlayer.x + otherPlayer.width &&
                    bullet.y > otherPlayer.y &&
                    bullet.y < otherPlayer.y + otherPlayer.height) {

                    console.log(`${player.color} player hit ${otherPlayer.color} player!`);
                    otherPlayer.isAlive = false;
                    return false;
                }
            }

            return bullet.x > 0 && bullet.x < canvas.width;
        });

        player.bullets.forEach(bullet => {
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bulletSize, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    // If a player is no longer alive, a simple game over message can be added here.
    if (activePlayers.length < 2 && !isGameOver) {
        isGameOver = true;

        // 승리 횟수 추가 로직
        const winner = players.find(p => p.isAlive);
        if (winner) {
            if (winner.id === 1) {
                player1Wins++;
                player1ScoreElement.innerText = `Player 1 : ${player1Wins}`;
            } else if (winner.id === 2) {
                player2Wins++;
                player2ScoreElement.innerText = `Player 2 : ${player2Wins}`;
            }
        }

        ctx.font = '40px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);

        // 게임 루프를 멈추고 버튼을 표시
        restartButton.style.display = 'block';
        return; // 게임 루프 중단
    }

    animationId = requestAnimationFrame(gameLoop);

}

// 탭 가시성 변경 이벤트 리스너 추가
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // 탭이 숨겨지면 게임 루프를 일시 중지
        cancelAnimationFrame(animationId);
    } else {
        // 탭이 다시 보이면 게임 루프를 재개
        // lastTime을 현재 시간으로 초기화하여 deltaTime 오차 방지
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
});

//새로추가
function resetGame() {
    // 플레이어의 초기 상태를 다시 설정
    //스프레드 문법으로 객체복사
    players = [
        { ...initialPlayer1 },
        { ...initialPlayer2 }
    ];

    // 게임 상태 초기화
    isGameOver = false;
    restartButton.style.display = 'none'; // 버튼 숨기기
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

restartButton.addEventListener('click', resetGame);

requestAnimationFrame(gameLoop);