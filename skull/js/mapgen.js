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
            { x: ox + 80,  y: floorY - 130 },
            { x: ox + 230, y: floorY - 190 },
            { x: ox + 320, y: floorY - 30  },
        ]
    }),

    // [2] 구덩이 구간 - 낙사 위험
    pit: (ox, w) => ({
        platforms: [
            { x: ox,          y: floorY, w: 120, h: 40 },
            { x: ox + 240,    y: floorY, w: 160, h: 40 },
            // 징검다리 발판
            { x: ox + 140, y: floorY - 80, w: 60, h: TILE, float: true, drop: false },
        ],
        traps: [],
        enemySlots: [
            { x: ox + 280, y: floorY - 30 },
        ]
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
            { x: ox + 90,  y: floorY - 110 },
            { x: ox + 250, y: floorY - 30  },
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
            { x: ox + 120, y: floorY - 90 },
            { x: ox + 310, y: floorY - 210 },
        ]
    }),

    // [5] 가시 함정 구간
    spikes: (ox, w) => ({
        platforms: [
            { x: ox, y: floorY, w: CHUNK_W, h: 40 },
        ],
        traps: [
            // 가시 데미지: 5+w*2 → w3=11, w4=13 (기존 w3=17, w4=20에서 완화)
            { type: "spike", x: ox + 80,  y: floorY - 16, w: 40, h: 16, dmg: 5 + w * 2, active: true, timer: 0, period: 90, onTime: 40 },
            { type: "spike", x: ox + 200, y: floorY - 16, w: 40, h: 16, dmg: 5 + w * 2, active: true, timer: 30, period: 90, onTime: 40 },
            { type: "spike", x: ox + 300, y: floorY - 16, w: 40, h: 16, dmg: 5 + w * 2, active: true, timer: 60, period: 90, onTime: 40 },
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
              dmg: 2 + w, tickRate: 45, timer: 0 }
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

        // 적 배치 (수집된 슬롯 + 여분)
        const baseCount = 3 + worldN * 2 + levelN;
        const positions = [...enemyPositions];
        while (positions.length < baseCount) {
            positions.push({
                x: 300 + Math.random() * (levelW - 500),
                y: floorY - 30
            });
        }
        positions.forEach(pos => {
            if (typeof mkEnemy === 'function') mkEnemy(pos.x, pos.y, worldN);
        });
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
                const tx = t.x - Game.camX;
                if (overlap(p, { x: t.x, y: t.y, w: t.w, h: t.h })) {
                    if (typeof takeDmg === 'function') takeDmg(t.dmg, null, false);
                }
            }
        } else if (t.type === "swamp") {
            // 독 늪: 서있으면 주기적 DoT
            if (t.timer % t.tickRate === 0) {
                if (overlap(p, { x: t.x, y: t.y, w: t.w, h: t.h }) && p.onGround) {
                    if (typeof takeDmg === 'function') takeDmg(t.dmg, null, false);
                    addText(p.x, p.y - 20, "POISON!", "#44ff44", 30, 12);
                }
            }
        }
    }
}

// ── 미믹 상자 처리 ───────────────────────
function triggerMimic(ev) {
    ev.triggered = true;
    ev.type = "mimic_active";
    // 미믹 → 즉시 엘리트 적 스폰
    if (typeof mkEnemy === 'function') {
        const e = mkEnemy(ev.x, ev.y - 24, Game.worldN);
        // 강제로 엘리트 설정
        if (e) { e.isElite = true; e.hp *= 2; e.maxHp = e.hp; }
    }
    addText(ev.x, ev.y - 20, "MIMIC!!", "#ff4400", 80, 18);
    Game.camShake = 15;
    if (typeof playSfx === 'function') playSfx('enemy_atk');
}