// main.js에 socket.io 클라이언트 추가
const socket = io("YOUR_SERVER_URL");

let serverState = {}; // 서버로부터 받을 게임 상태 저장 변수

// 1. 서버로부터 게임 상태 수신
socket.on('gameState', (state) => {
    serverState = state;
});

function gameLoop(timestamp) {
    // 2. 매 프레임마다 현재 키 입력 상태를 서버로 전송
    socket.emit('input', keys);

    // ... 캔버스 초기화 ...

    // 3. 서버가 보내준 데이터로 모든 플레이어 그리기
    if (serverState.players) {
        for (const playerId in serverState.players) {
            const serverPlayerData = serverState.players[playerId];

            // 내 캐릭터인 경우: 예측과 보정 적용
            if (playerId === socket.id) {
                // 로컬 Player 객체가 자신의 입력을 기반으로 계속 움직임 (예측)
                localPlayer.update({ keys, deltaTime, ... });

                // 서버 위치와 예측 위치의 차이를 부드럽게 보정 (Reconciliation)
                localPlayer.x = lerp(localPlayer.x, serverPlayerData.x, 0.1);
                localPlayer.y = lerp(localPlayer.y, serverPlayerData.y, 0.1);

                localPlayer.draw(gameCtx);
            } else {
                // 다른 플레이어는 서버가 보내준 위치에 그대로 그린다 (보간 추가하면 더 좋음)
                drawOtherPlayer(serverPlayerData);
            }
        }
    }
    requestAnimationFrame(gameLoop);
}

// 선형 보간(Linear Interpolation) 함수. 부드러운 움직임을 위해 추가
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}