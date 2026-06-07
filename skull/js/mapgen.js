// ==========================================
// 청크 기반 맵 생성 모듈 (Chunk Map Generator)
// ==========================================

const CHUNK_W = 400;  // 청크 하나의 너비
const floorY  = CH - 40;

// ── 청크 템플릿 정의 ──────────────────────
// 각 청크: { platforms, traps, enemies, events }
// x 좌표는 청크 삽입 시 오프셋 적용

const CHUNK_TEMPLATES = {

    // [1] 평지 - 공중 발판 포함
    flat: (ox, w) => ({
        platforms: [
            { x: ox, y: floorY, w: CHUNK_W, h: 40 },
            // 공중 발판 2~3개 랜덤 배치
            { x: ox + 60,  y: floorY - 100, w: 90,  h: TILE, float: true, drop: false },
            { x: ox + 220, y: floorY - 160, w: 80,  h: TILE, float: true, drop: false },
            { x: ox + 310, y: floorY - 90,  w: 70,  h: TILE, float: true, drop: Math.random() < 0.3 },
        ],
        traps: [],
        enemySlots: [
            { x: ox + 80,  y: floorY - 30 },
            { x: ox + 230, y: floorY - 30 },
            { x: ox + 320, y: floorY - 30 },
        ]
    }),

    // [2] 구덩이 구간 - 낙사 위험 (징검다리로 건널 수 있게)
    pit: (ox, w) => ({
        platforms: [
            { x: ox,       y: floorY, w: 130, h: 40 },           // 좌측 발판 조금 늘림
            { x: ox + 270, y: floorY, w: 130, h: 40 },           // 우측 발판
            // 징검다리 2개 — 중간에 발판이 충분해서 몬스터 스폰 가능
            { x: ox + 130, y: floorY - 70, w: 70, h: TILE, float: true, drop: false },
            { x: ox + 210, y: floorY - 70, w: 60, h: TILE, float: true, drop: false },
        ],
        traps: [],
        enemySlots: []  // pit 슬롯은 안전 스폰 시스템에서 처리
    }),

    // [3] 좁은 통로 - 압박 전투
    corridor: (ox, w) => ({
        platforms: [
            { x: ox, y: floorY, w: CHUNK_W, h: 40 },
            { x: ox + 80,  y: floorY - 80,  w: 70, h: TILE, float: true },
            { x: ox + 240, y: floorY - 140, w: 80, h: TILE, float: true },
        ],
        traps: [],
        enemySlots: [
            { x: ox + 90,  y: floorY - 30 },   // 바닥 - 공중 스폰 방지
            { x: ox + 250, y: floorY - 30 },
        ]
    }),

    // [4] 계단형 발판 - 수직 이동
    stairs: (ox, w) => ({
        platforms: [
            { x: ox,         y: floorY,       w: 100, h: 40 },
            { x: ox + 100,   y: floorY - 60,  w: 80,  h: TILE, float: true },
            { x: ox + 200,   y: floorY - 120, w: 80,  h: TILE, float: true },
            { x: ox + 300,   y: floorY - 180, w: 80,  h: TILE, float: true },
            // 아래 바닥 연결
            { x: ox + 300,   y: floorY,       w: 100, h: 40 },
        ],
        traps: [],
        enemySlots: [
            { x: ox + 120, y: floorY - 30 },
            { x: ox + 310, y: floorY - 30 },
        ]
    }),

    // [5] 가시 함정 구간
    spikes: (ox, w) => ({
        platforms: [
            { x: ox, y: floorY, w: CHUNK_W, h: 40 },
        ],
        traps: [
            // 가시 데미지: 3+w*1 → w1=4, w3=6, w5=8, w7=10 (몬스터 딜의 60% 수준)
            { type: "spike", x: ox + 80,  y: floorY - 16, w: 40, h: 16, dmg: 3 + w * 1, active: true, timer: 0, period: 90, onTime: 40 },
            { type: "spike", x: ox + 200, y: floorY - 16, w: 40, h: 16, dmg: 3 + w * 1, active: true, timer: 30, period: 90, onTime: 40 },
            { type: "spike", x: ox + 300, y: floorY - 16, w: 40, h: 16, dmg: 3 + w * 1, active: true, timer: 60, period: 90, onTime: 40 },
        ],
        enemySlots: [
            { x: ox + 350, y: floorY - 30 }
        ]
    }),

    // [6] 독 늪 구간 - 서있으면 DoT
    swamp: (ox, w) => ({
        platforms: [
            { x: ox, y: floorY, w: CHUNK_W, h: 40 },
        ],
        traps: [
            { type: "swamp", x: ox + 40, y: floorY - 12, w: CHUNK_W - 80, h: 12,
              dmg: 1, tickRate: 20, timer: 0 }  // 독: 약한 연속 틱 — 즉시 인지하고 벗어나도록
        ],
        enemySlots: [
            { x: ox + 100, y: floorY - 30 },
            { x: ox + 280, y: floorY - 30 },
        ]
    }),

    // [7] 미믹 상자 (가짜 보물)
    mimic: (ox, w) => ({
        platforms: [
            { x: ox, y: floorY, w: CHUNK_W, h: 40 },
        ],
        traps: [],
        enemySlots: [],
        events: [
            { type: "mimic_chest", x: ox + CHUNK_W / 2 - 14, y: floorY - 32, w: 28, h: 32 }
        ]
    }),

    // [8] 이동 발판 구간
    moving: (ox, w) => ({
        platforms: [
            { x: ox,         y: floorY,       w: 80,  h: 40 },
            { x: ox + 120,   y: floorY - 100, w: 100, h: TILE, float: true, vx: 1.2, boundL: ox + 80, boundR: ox + 280 },
            { x: ox + 300,   y: floorY,       w: 100, h: 40 },
        ],
        traps: [],
        enemySlots: [
            { x: ox + 320, y: floorY - 30 }
        ]
    }),
};

// 월드별 청크 풀 (사용 가능한 청크 조합)
function getChunkPool(worldN) {
    if (worldN <= 2) return ['flat','stairs','pit','stairs','moving','flat'];
    if (worldN <= 4) return ['stairs','corridor','pit','spikes','moving','flat','stairs'];
    if (worldN <= 6) return ['stairs','spikes','swamp','corridor','moving','pit','flat'];
    return ['stairs','spikes','swamp','corridor','moving','pit','mimic','flat','stairs'];
}

// ── 청크 기반 맵 생성 메인 함수 ───────────
function buildChunkMap(worldN, levelN) {
    const isBoss = levelN === 3;
    const levelW = isBoss ? 1400 : 2800;
    Game.levelW = levelW;
    Game.platforms = [];
    Game.traps = [];
    Game.eventObjects = Game.eventObjects || [];

    const pool = getChunkPool(worldN);
    const enemyPositions = [];

    if (isBoss) {
        // 보스 스테이지: 단순 넓은 방
        for (let x = 0; x < levelW; x += TILE) {
            Game.platforms.push({ x, y: floorY, w: TILE, h: 40 });
        }
    } else {
        // 시작 안전지대
        for (let x = 0; x < 200; x += TILE) {
            Game.platforms.push({ x, y: floorY, w: TILE, h: 40 });
        }

        let curX = 200;
        // 청크 수 = 맵 너비에 맞게
        const chunkCount = Math.floor((levelW - 400) / CHUNK_W);
        for (let c = 0; c < chunkCount; c++) {
            // 풀에서 랜덤 청크 선택 (연속 같은 청크 방지)
            let type = pool[Math.floor(Math.random() * pool.length)];
            const chunk = CHUNK_TEMPLATES[type](curX, worldN);

            // 플랫폼 등록
            chunk.platforms.forEach(p => Game.platforms.push(p));

            // 함정 등록
            if (chunk.traps) chunk.traps.forEach(t => Game.traps.push(t));

            // 이벤트 등록
            if (chunk.events) chunk.events.forEach(ev => Game.eventObjects.push(ev));

            // 적 위치 수집
            if (chunk.enemySlots) chunk.enemySlots.forEach(s => enemyPositions.push(s));

            curX += CHUNK_W;
        }

        // 끝 안전지대
        for (let x = curX; x < levelW; x += TILE) {
            Game.platforms.push({ x, y: floorY, w: TILE, h: 40 });
        }

        // 화톳불 (월드 3+, 맵 중간에 1개)
        if (worldN >= 3) {
            const bfX = Math.floor(levelW / 2);
            Game.eventObjects.push(initBonfire(bfX, floorY - 32));
        }

        // 저주 제단 / 유물 상자 (기존 로직)
        if (worldN >= 2) {
            // x 좌표를 시작/끝 안전지대(바닥 확실히 있는 구간)에만 배치 — 공중 생성 방지
            if (Math.random() < 0.5) {
                // 저주 제단: 맵 초반 안전지대 (x: 120~180)
                Game.eventObjects.push({
                    type: "curse_altar",
                    x: 100 + Math.random() * 80, y: floorY - 48, w: 32, h: 48, used: false
                });
            }
            if (Math.random() < 0.4) {
                // 유물 상자: 맵 후반 끝 안전지대 (levelW - 300 ~ levelW - 100)
                const safeX = levelW - 300 + Math.random() * 200;
                Game.eventObjects.push({
                    type: "relic_chest",
                    x: safeX, y: floorY - 32, w: 28, h: 32, used: false
                });
            }
        }

        // ── 발판 위 안전 스폰 시스템 ──
        // 해당 x 위치에 실제로 바닥 발판이 있는지 검사
        function hasPlatformAt(x) {
            // 발판 중심이 x에서 TILE/2 이내에 있으면 유효
            return Game.platforms.some(pt =>
                pt.y === floorY &&
                pt.h >= 20 &&
                x >= pt.x &&       // 발판 x 범위 안
                x < pt.x + pt.w    // (경계 조건 완화 — _snapToNearestPlatform이 보정)
            );
        }

        // 안전한 발판 x 좌표 목록 — 실제로 발판이 있는 위치만
        const validSpawnX = [];
        // 전체 맵을 TILE 간격으로 스캔해서 안전한 위치 수집
        for (let sx = 250; sx < levelW - 100; sx += TILE) {
            if (hasPlatformAt(sx)) validSpawnX.push(sx);
        }

        // 적 배치 — validSpawnX에서 직접 선택 (오프셋 없이 검증된 위치만)
        const baseCount = 3 + worldN * 2 + levelN;
        if (validSpawnX.length > 0) {
            // validSpawnX를 셔플해서 겹치지 않게 배치
            const shuffled = [...validSpawnX].sort(() => Math.random() - 0.5);
            for (let i = 0; i < baseCount; i++) {
                const sx = shuffled[i % shuffled.length];
                // 같은 위치에 겹치면 약간 오프셋 (단, hasPlatformAt 재검증)
                const finalX = sx + (i >= shuffled.length ? (i - shuffled.length + 1) * 8 : 0);
                if (typeof mkEnemy === 'function') mkEnemy(finalX, floorY - 30, worldN);
            }
        }
    }

    // 벽 (좌우 경계)
    for (let y = 0; y < CH; y += TILE) {
        Game.platforms.push({ x: -TILE, y, w: TILE, h: TILE });
        Game.platforms.push({ x: levelW, y, w: TILE, h: TILE });
    }

    // 문
    Game.doors = [];
    Game.doors.push({ x: levelW - 70, y: floorY - 64, w: 40, h: 64, open: false });
}

// ── 함정 업데이트 (update()에서 호출) ────
function updateTraps() {
    if (!Game.traps || !Game.player) return;
    const p = Game.player;

    for (const t of Game.traps) {
        t.timer = (t.timer || 0) + 1;

        if (t.type === "spike") {
            // 주기적으로 튀어나오는 가시
            const cyclePos = t.timer % t.period;
            t.active = cyclePos < t.onTime;

            if (t.active && Game.invT === 0) {
                if (overlap(p, { x: t.x, y: t.y, w: t.w, h: t.h })) {
                    if (typeof takeDmg === 'function') takeDmg(t.dmg, null, false);
                    // 가시 피격 후 무적시간 = 일반 피격과 동일 (연속 피격 방지)
                    Game.invT = Math.max(Game.invT, 85);
                }
            }
        } else if (t.type === "swamp") {
            // 독 늪: 서있으면 빠른 틱 DoT — 데미지 약하고 무적 짧아서 즉시 인지 가능
            if (t.timer % t.tickRate === 0) {
                if (overlap(p, { x: t.x, y: t.y, w: t.w, h: t.h }) && p.onGround) {
                    if (typeof takeDmg === 'function') takeDmg(t.dmg, null, false);
                    // 독 전용 짧은 무적 — 넉백/경직 없이 연속 틱만
                    Game.invT = Math.min(Game.invT, 8);
                    addText(p.x, p.y - 20, "POISON!", "#44ff44", 20, 10);
                }
            }
        }
    }
}

// ── 미믹 상자 처리 ───────────────────────
function triggerMimic(ev) {
    ev.triggered = true;
    ev.type = "mimic_active";
    if (typeof mkEnemy === 'function') {
        const e = mkEnemy(ev.x, ev.y - 24, Game.worldN);
        if (e) {
            e.isElite = true; e.hp *= 2; e.maxHp = e.hp;
            // 스폰 직후 1초(60프레임) 동안 공격/피격 없음 — 플레이어가 피할 시간
            e.sT  = 80;       // 공격 쿨다운 초기 딜레이
            e.kbT = 0;
            e.warnT = 0;
            e.atkAnim = 0;
            e._spawnDelay = 60; // 커스텀 플래그 — 60프레임 후 활성
        }
    }
    addText(ev.x, ev.y - 20, "MIMIC!!", "#ff4400", 80, 18);
    Game.camShake = 15;
    if (typeof playSfx === 'function') playSfx('enemy_atk');
}