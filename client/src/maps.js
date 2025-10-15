const maps = [
    {
        id: 0,
        name: "프롤로그",
        height: 600,
        width: 800,
        background: '#87b1dbff',
        platforms: [
            { x: 0, y: 550, width: 800, height: 50, color: '#4CAF50', type: 'wall' },
            { x: 150, y: 450, width: 200, height: 20, color: '#795548', type: 'hover' },
            { x: 450, y: 350, width: 200, height: 20, color: '#795548', type: 'hover' },
            { x: 50, y: 200, width: 100, height: 20, color: '#795548', type: 'hover' }
        ],
        spawnPoints: [
            { x: 50, y: 500 },
            { x: 720, y: 500 }
        ]
    },

    // // 맵 0: 기본 훈련장 (Basic Training Ground)
    // {
    //     id: 1,
    //     name: "기본 훈련장",
    //     width: 800,
    //     height: 600,
    //     background: '#2c3e50', // 짙은 밤색
    //     platforms: [
    //         // 바닥
    //         { x: 0, y: 550, width: 800, height: 50, color: '#27ae60', type: 'wall' },
    //         // 낮은 플랫폼
    //         { x: 100, y: 450, width: 150, height: 20, color: '#c0392b', type: 'hover' },
    //         { x: 550, y: 450, width: 150, height: 20, color: '#c0392b', type: 'hover' },
    //         // 중앙 높은 플랫폼
    //         { x: 300, y: 300, width: 200, height: 20, color: '#9b59b6', type: 'hover' }
    //     ],
    //     spawnPoints: [
    //         { x: 50, y: 500 },
    //         { x: 720, y: 500 }
    //     ]
    // },

    // ---

    // 맵 1: 거울 대칭 아레나 (Mirror Symmetry Arena)
    {
        id: 1,
        name: "대칭 아레나",
        width: 1000,
        height: 700,
        background: '#34495e', // 어두운 회색
        platforms: [
            // 바닥
            { x: 0, y: 650, width: 1000, height: 50, color: '#7f8c8d', type: 'wall' },
            // 2단 플랫폼 (좌/우)
            { x: 50, y: 500, width: 200, height: 20, color: '#d35400', type: 'hover' },
            { x: 750, y: 500, width: 200, height: 20, color: '#d35400', type: 'hover' },
            // 3단 플랫폼 (좌/우)
            { x: 150, y: 350, width: 100, height: 20, color: '#2980b9', type: 'hover' },
            { x: 750, y: 350, width: 100, height: 20, color: '#2980b9', type: 'hover' },
            // 중앙 고지대 (스나이핑 위치)
            { x: 450, y: 200, width: 100, height: 20, color: '#e74c3c', type: 'hover' }
        ],
        // 스폰 지점: 2단 플랫폼(Y=500) 위 또는 바닥(Y=650) 위.
        // 2단 플랫폼 위(500 - 50 = 450)에 배치하여 시작부터 교전 유도.
        spawnPoints: [
            { x: 100, y: 450 }, // 좌측 2단 플랫폼 위
            { x: 870, y: 450 }  // 우측 2단 플랫폼 위 (1000 - 30(너비) - 100(여유) = 870)
        ]
    },

    // ---

    // 맵 2: 수직 점령전 (Vertical Capture Point)
    {
        id: 2,
        name: "수직 점령전",
        width: 600,
        height: 800, // 높이가 더 긴 맵
        background: '#1abc9c', // 밝은 청록색
        platforms: [
            // 바닥
            { x: 0, y: 750, width: 600, height: 50, color: '#16a085', type: 'wall' },
            // 좌측 벽 타기 플랫폼
            { x: 0, y: 600, width: 150, height: 20, color: '#f39c12', type: 'hover' },
            { x: 0, y: 450, width: 150, height: 20, color: '#f39c12', type: 'hover' },
            // 우측 벽 타기 플랫폼
            { x: 450, y: 600, width: 150, height: 20, color: '#f39c12', type: 'hover' },
            { x: 450, y: 450, width: 150, height: 20, color: '#f39c12', type: 'hover' },
            // 최상단 중앙 (핵심 점령지)
            { x: 200, y: 150, width: 200, height: 20, color: '#e67e22', type: 'hover' },
            // 중앙 아래 연결 플랫폼
            { x: 250, y: 300, width: 100, height: 20, color: '#d35400', type: 'hover' }
        ],
        // 스폰 지점: 좌우 1단 플랫폼(Y=600) 위에 배치 (600 - 50 = 550)
        spawnPoints: [
            { x: 50, y: 550 },
            { x: 520, y: 550 } // 600 - 30(너비) - 50(여유) = 520
        ]
    },

    // ---

    // 맵 3: 작은 요새 (Small Fortress)
    {
        id: 3,
        name: "작은 요새",
        width: 800,
        height: 600,
        background: '#7f8c8d', // 연한 회색 (석조 느낌)
        platforms: [
            // 바닥
            { x: 0, y: 550, width: 800, height: 50, color: '#34495e', type: 'wall' },
            // 요새 구조물 (두꺼운 벽)
            { x: 100, y: 400, width: 600, height: 40, color: '#95a5a6', type: 'wall' },
            // 요새 내부 진입 플랫폼 (좌)
            { x: 0, y: 300, width: 150, height: 20, color: '#2c3e50', type: 'hover' },
            // 요새 내부 진입 플랫폼 (우)
            { x: 650, y: 300, width: 150, height: 20, color: '#2c3e50', type: 'hover' },
            // 중앙 요새 최상단 (저격 포인트)
            { x: 300, y: 200, width: 200, height: 20, color: '#e74c3c', type: 'hover' }
        ],
        // 스폰 지점: 좌우 진입 플랫폼(Y=300) 위에 배치 (300 - 50 = 250)
        spawnPoints: [
            { x: 50, y: 250 },
            { x: 720, y: 250 } // 800 - 30 - 50 = 720
        ]
    },

    // --

    // 맵 4: 용암의 깊은 계곡 (Lava Ravine) - 1200px 광폭, 외곽 lava
    {
        id: 4,
        name: "용암 계곡",
        width: 1400,
        height: 700,
        spawnPoints: [{ x: 50, y: 500 }, { x: 720, y : 500 }],
        background: '#000000', // 검은색 (어두운 동굴)
        platforms: [
            // 바닥 용암 (lava)
            { x: 0, y: 650, width: 1400, height: 50, color: '#e74c3c', type: 'lava' },
            
            // 중앙 메인 통로 (wall)
            { x: 300, y: 550, width: 800, height: 40, color: '#34495e', type: 'wall' },
            
            // 2단 호버 플랫폼 (좌/우)
            { x: 150, y: 400, width: 150, height: 20, color: '#f39c12', type: 'hover' },
            { x: 1100, y: 400, width: 150, height: 20, color: '#f39c12', type: 'hover' },
            
            // 중앙 상부 고립 플랫폼 (hover)
            { x: 600, y: 280, width: 200, height: 20, color: '#9b59b6', type: 'hover' },
            
            // 중앙 막다른 벽
            { x: 400, y: 150, width: 600, height: 20, color: '#2c3e50', type: 'hover' }
        ],
        // 스폰 지점: 좌우측 2단 플랫폼 위에 배치 
        spawnPoints: [
            { x: 200, y: 350 }, // 좌측 2단 플랫폼 위
            { x: 1170, y: 350 }  // 우측 2단 플랫폼 위
        ]
    },

    // ---

    // 맵 5: 고공 비행장 (High-Altitude Platform) - 1400px 광폭, 호버 중심
    {
        id: 5,
        name: "고공 비행장",
        width: 1400,
        height: 800,
        background: '#87b1dbff', // 밝은 하늘색
        platforms: [
            // 안전 바닥 (wall)
            { x: 0, y: 750, width: 1400, height: 50, color: '#7f8c8d', type: 'wall' },
            
            // 좌측 탑 (hover)
            { x: 100, y: 600, width: 150, height: 20, color: '#1abc9c', type: 'hover' },
            { x: 100, y: 450, width: 100, height: 20, color: '#1abc9c', type: 'hover' },
            
            // 우측 탑 (hover)
            { x: 1150, y: 600, width: 150, height: 20, color: '#1abc9c', type: 'hover' },
            { x: 1200, y: 450, width: 100, height: 20, color: '#1abc9c', type: 'hover' },
            
            // 중앙 연결 (hover)
            { x: 500, y: 300, width: 400, height: 20, color: '#f1c40f', type: 'hover' },
            
            // 좌/우 아래쪽 은신 플랫폼 (wall - 숨을 수 있음)
            { x: 300, y: 650, width: 200, height: 40, color: '#3498db', type: 'wall' },
            { x: 900, y: 650, width: 200, height: 40, color: '#3498db', type: 'wall' }
        ],
        // 스폰 지점: 좌우 1단 탑(Y=600) 위에 배치 (600 - 50 = 550)
        spawnPoints: [
            { x: 150, y: 550 },
            { x: 1220, y: 550 } // 1300(플랫폼 끝) - 30(너비) - 50(여유) = 1220
        ]
    },

    // ---

    // 맵 6: 중앙 제단 (Central Altar) - 1200px 광폭, 중앙 wall 방어전
    {
        id: 6,
        name: "중앙 제단",
        width: 1200,
        height: 700,
        background: '#34495e', // 어두운 밤하늘
        platforms: [
            // 외곽 용암 (좌/우/아래)
            { x: 0, y: 650, width: 1200, height: 50, color: '#e74c3c', type: 'lava' },
            
            // 시작 지점 (좌/우 wall)
            { x: 0, y: 550, width: 200, height: 50, color: '#7f8c8d', type: 'wall' },
            { x: 1000, y: 550, width: 200, height: 50, color: '#7f8c8d', type: 'wall' },
            
            // 중앙 제단 (가장 중요한 wall)
            { x: 400, y: 300, width: 400, height: 35, color: '#95a5a6', type: 'wall' },
            
            // 중앙 제단으로 가는 호버 점프대 (좌/우)
            { x: 300, y: 450, width: 100, height: 20, color: '#f39c12', type: 'hover' },
            { x: 800, y: 450, width: 100, height: 20, color: '#f39c12', type: 'hover' },
            
            // 중앙 제단 위 호버 플랫폼
            { x: 550, y: 150, width: 100, height: 20, color: '#2980b9', type: 'hover' }
        ],
        // 스폰 지점: 시작 지점 플랫폼(Y=550) 위에 배치 (550 - 50 = 500)
        spawnPoints: [
            { x: 50, y: 500 },
            { x: 1120, y: 500 } // 1200 - 30 - 50 = 1120
        ]
    },

    // ---

    // 맵 7: 격자 통로 (Grid Corridor) - 900x700, wall을 이용한 미로
    {
        id: 7,
        name: "격자 통로",
        width: 900,
        height: 700,
        background: '#bdc3c7', // 매우 밝은 회색
        platforms: [
            // 바닥 (wall)
            { x: 0, y: 650, width: 900, height: 50, color: '#7f8c8d', type: 'wall' },
            
            // 1층 벽
            { x: 170, y: 480, width: 250, height: 30, color: '#34495e', type: 'wall' },
            { x: 520, y: 480, width: 200, height: 30, color: '#34495e', type: 'wall' },
            
            // 2층 벽 (점프 통로를 만듦)
            { x: 100, y: 320, width: 300, height: 30, color: '#34495e', type: 'wall' },
            { x: 500, y: 320, width: 300, height: 30, color: '#34495e', type: 'wall' },
            
            // 3층 중앙 플랫폼 (hover)
            { x: 400, y: 170, width: 100, height: 20, color: '#e74c3c', type: 'hover' }
        ],
        // 스폰 지점: 바닥(Y=650) 위에 배치 (650 - 50 = 600)
        spawnPoints: [
            { x: 50, y: 600 },
            { x: 820, y: 600 } // 900 - 30 - 50 = 820
        ]
    },

    // --

    // 맵 8: 사막의 좁은 길 (Desert Narrow Path) - 1200px 광폭, 좁은 플랫폼, 용암 바닥
{
    id: 8,
    name: "사막의 좁은 길",
    width: 1200,
    height: 700,
    background: '#b8860b', // 어두운 황금색 (사막 느낌)
    platforms: [
        // 1. 용암 바닥 (떨어지기 쉬움)
        { x: 0, y: 650, width: 1200, height: 50, color: '#e74c3c', type: 'lava' }, 
        
        // 2. 시작 플랫폼 (이미지의 2층 높이)
        // 좌측 (hover)
        { x: 100, y: 500, width: 200, height: 30, color: '#6d4c41', type: 'hover' }, 
        // 우측 (hover)
        { x: 900, y: 500, width: 200, height: 30, color: '#6d4c41', type: 'hover' }, 
        
        // 4. 고지대 플랫폼
        // 좌측 (hover)
        { x: 200, y: 350, width: 150, height: 30, color: '#6d4c41', type: 'hover' }, 
        // 우측 (hover)
        { x: 850, y: 350, width: 150, height: 30, color: '#6d4c41', type: 'hover' }, 
        
        // 5. 중앙 (건너기용 좁은 플랫폼)
        { x: 530, y: 380, width: 150, height: 20, color: '#f39c12', type: 'hover' },

        // 3단 플랫폼 (이미지의 2층 높이)
        // 좌측 (hover)
        { x: 150, y: 170, width: 170, height: 30, color: '#6d4c41', type: 'hover' }, 
        // 우측 (hover)
        { x: 900, y: 170, width: 170, height: 30, color: '#6d4c41', type: 'hover' }, 
    ],
    // 스폰 지점: 시작 플랫폼(Y=500) 위에 배치 (500 - 50 = 450)
    spawnPoints: [
        { x: 100, y: 450 }, // 좌측
        { x: 1070, y: 450 } // 우측 (1200 - 30(너비) - 100(여유) = 1070)
    ]
}
];

export { maps };