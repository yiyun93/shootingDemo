const maps = [
    {
        id: 0,
        name: "default",
        height: 600,
        width: 800,
        background: '#87b1dbff',
        platforms: [
            { x: 0, y: 550, width: 800, height: 50, color: '#4CAF50' },
            { x: 150, y: 400, width: 200, height: 20, color: '#795548' },
            { x: 450, y: 300, width: 200, height: 20, color: '#795548' },
            { x: 50, y: 200, width: 100, height: 20, color: '#795548' }
        ]
    },

    // 맵 0: 기본 훈련장 (Basic Training Ground)
    {
        id: 1,
        name: "기본 훈련장",
        width: 800,
        height: 600,
        background: '#2c3e50', // 짙은 밤색
        platforms: [
            // 바닥
            { x: 0, y: 550, width: 800, height: 50, color: '#27ae60' },
            // 낮은 플랫폼
            { x: 100, y: 450, width: 150, height: 20, color: '#c0392b' },
            { x: 550, y: 450, width: 150, height: 20, color: '#c0392b' },
            // 중앙 높은 플랫폼
            { x: 300, y: 300, width: 200, height: 20, color: '#9b59b6' }
        ]
    },

    // ---

    // 맵 2: 거울 대칭 아레나 (Mirror Symmetry Arena)
    {
        id: 2,
        name: "대칭 아레나",
        width: 1000,
        height: 700,
        background: '#34495e', // 어두운 회색
        platforms: [
            // 바닥
            { x: 0, y: 650, width: 1000, height: 50, color: '#7f8c8d' },
            // 2단 플랫폼 (좌/우)
            { x: 50, y: 500, width: 200, height: 20, color: '#d35400' },
            { x: 750, y: 500, width: 200, height: 20, color: '#d35400' },
            // 3단 플랫폼 (좌/우)
            { x: 150, y: 350, width: 100, height: 20, color: '#2980b9' },
            { x: 750, y: 350, width: 100, height: 20, color: '#2980b9' },
            // 중앙 고지대 (스나이핑 위치)
            { x: 450, y: 200, width: 100, height: 20, color: '#e74c3c' }
        ]
    },

    // ---

    // 맵 3: 수직 점령전 (Vertical Capture Point)
    {
        id: 3,
        name: "수직 점령전",
        width: 600,
        height: 800, // 높이가 더 긴 맵
        background: '#1abc9c', // 밝은 청록색
        platforms: [
            // 바닥
            { x: 0, y: 750, width: 600, height: 50, color: '#16a085' },
            // 좌측 벽 타기 플랫폼
            { x: 0, y: 600, width: 150, height: 20, color: '#f39c12' },
            { x: 0, y: 450, width: 150, height: 20, color: '#f39c12' },
            // 우측 벽 타기 플랫폼
            { x: 450, y: 600, width: 150, height: 20, color: '#f39c12' },
            { x: 450, y: 450, width: 150, height: 20, color: '#f39c12' },
            // 최상단 중앙 (핵심 점령지)
            { x: 200, y: 150, width: 200, height: 20, color: '#e67e22' },
            // 중앙 아래 연결 플랫폼
            { x: 250, y: 300, width: 100, height: 20, color: '#d35400' }
        ]
    },

    // ---

    // 맵 4: 작은 요새 (Small Fortress)
    {
        id: 4,
        name: "작은 요새",
        width: 800,
        height: 600,
        background: '#7f8c8d', // 연한 회색 (석조 느낌)
        platforms: [
            // 바닥
            { x: 0, y: 550, width: 800, height: 50, color: '#34495e' },
            // 요새 구조물 (두꺼운 벽)
            { x: 100, y: 400, width: 600, height: 40, color: '#95a5a6' },
            // 요새 내부 진입 플랫폼 (좌)
            { x: 0, y: 300, width: 150, height: 20, color: '#2c3e50' },
            // 요새 내부 진입 플랫폼 (우)
            { x: 650, y: 300, width: 150, height: 20, color: '#2c3e50' },
            // 중앙 요새 최상단 (저격 포인트)
            { x: 300, y: 200, width: 200, height: 20, color: '#e74c3c' }
        ]
    }
];

export { maps };