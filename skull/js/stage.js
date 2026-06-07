// ── 튜토리얼 스테이지(Stage 0) ──────────────
// 조작법 안내 화면(tutorial_intro) → play 순서로 진행
// 피격 데미지 0 (isTutorial 플래그로 combat.js에서 방어)
function startTutorialIntro() {
    // 튜토리얼 진입 전 키 안내 화면 상태로 전환
    Game.gs = "tutorial_intro";
    Game.tutorialIntroPage = 0;
    Game.isTutorial = true;
    const sl = document.getElementById("stageLabel");
    if (sl) { sl.style.display = "block"; sl.textContent = "STAGE 0  [ Tutorial ]"; }
}

function genTutorial() {
    Game.platforms = []; Game.doors = [];
    Game.enemies.forEach(e => e.active = false);
    Game.bullets.forEach(b => b.active = false);
    Game.eBullets.forEach(b => b.active = false);
    Game.parts.forEach(p => p.active = false);
    Game.lasers.forEach(l => l.active = false);
    Game.texts.forEach(t => t.active = false);
    Game.items.forEach(i => i.active = false);
    Game.kills = 0; Game.invT = 0; Game.hitStop = 0;
    Game.eventObjects = []; Game.traps = [];
    Game.levelW = 1600;

    const floorY = CH - 40;

    // 바닥
    for (let x = 0; x < Game.levelW; x += TILE) {
        Game.platforms.push({ x, y: floorY, w: TILE, h: 40 });
    }
    // 좌우 벽
    for (let y = -1000; y < CH + 40; y += TILE) {
        Game.platforms.push({ x: -TILE, y, w: TILE, h: TILE });
        Game.platforms.push({ x: Game.levelW, y, w: TILE, h: TILE });
    }
    // 강하 공격 연습 발판 (두 단)
    Game.platforms.push({ x: 550, y: floorY - 100, w: 120, h: TILE, float: true });
    Game.platforms.push({ x: 550, y: floorY - 190, w: 120, h: TILE, float: true });

    // ── 더미 골렘 2기 배치 (완전 독립, 일반 몬스터와 무관) ──
    if (typeof mkDummyGolem === 'function') {
        // 골렘 1: 평타/콤보/강하/처형 연습
        const d1 = mkDummyGolem(500, floorY - 40);
        if (d1) { d1.poise = 60; d1.poiseMx = 60; } // 패링 연습용 체간

        // 골렘 2: 패링/가드 연습
        const d2 = mkDummyGolem(780, floorY - 40);
        if (d2) { d2.poise = 60; d2.poiseMx = 60; }
    }

    // ── 구역별 안내 힌트 (말풍선) ──
    Game.tutorialHints = [
        { x: 60,  y: floorY - 46,  text: "← → 이동  /  X 점프  /  Z 대시(무적 회피)",    col: "#ffee88" },
        { x: 380, y: floorY - 46,  text: "C 평타 — 연속 3타 후 콤보 배율 상승",           col: "#ff9944" },
        { x: 380, y: floorY - 62,  text: "Shift 필살기 — MP 게이지 가득 차면 사용 가능", col: "#00ffcc" },
        { x: 380, y: floorY - 78,  text: "↓+C 강하공격 — 공중에서 아래+C (체간 대량 감소)", col: "#ff4444" },
        { x: 620, y: floorY - 46,  text: "V 가드  — 피격 직전 누르면 패링!",             col: "#44aaff" },
        { x: 620, y: floorY - 62,  text: "패링 성공 → 적 체간↓↓ → 기절(STUN) 유도",      col: "#ffcc00" },
        { x: 620, y: floorY - 78,  text: "기절 중 C → FATAL STRIKE (처형, 무적)",         col: "#ff2222" },
        { x: 1350, y: floorY - 46, text: "▶ 모든 조작 완료! 문을 통과하면 모험 시작",    col: "#00ffcc" },
    ];

    // 통과 조건
    Game.tutorialChecks = { dash:false, jump:false, attack:false, skill:false, guard:false };

    // 튜토리얼 문 — 처음부터 열려 있음
    Game.doors.push({ x: Game.levelW - 90, y: floorY - 64, w: 40, h: 64, open: true });

    // 플레이어 배치 + MP 미리 충전 (필살기 바로 써볼 수 있게)
    if (typeof mkP === 'function') Game.player = mkP(60, floorY - 36);
    if (Game.player && typeof initSystems === 'function') initSystems();
    Game.pMp = Game.pMaxMp || 100; // MP 풀충전 — Shift 바로 쓸 수 있게

    Game.camX = 0;
    Game.gs = "play";
    Game.isTutorial = true;
    // tutorial_intro → play 전환 시 페이드인 처리
    Game.transState = 2; Game.transT = 255;
    const sl = document.getElementById("stageLabel");
    if (sl) { sl.style.display = "block"; sl.textContent = "STAGE 0  [ Tutorial ]"; }
    if (typeof playBGM === 'function') playBGM('play');
    if (typeof updateHUD === 'function') updateHUD();
}

// ==========================================
// 스테이지 생성 및 진행 관리 모듈 (Stage & Progression)
// ==========================================

function genStage(w, l) {
    Game.platforms = []; 
    Game.doors = []; 
    
    // 더미 골렘 플래그 클리어 — 일반 스테이지에 더미가 잔존하는 버그 방지
    Game.enemies.forEach(e => { e.active = false; e.isTutorialDummy = false; });
    Game.bullets.forEach(b => b.active = false);
    Game.eBullets.forEach(b => b.active = false);
    Game.parts.forEach(p => p.active = false);
    Game.lasers.forEach(l => l.active = false);
    Game.texts.forEach(t => t.active = false);
    Game.items.forEach(i => i.active = false);

    Game.kills = 0;
    Game.invT = 0;
    Game.hitStop = 0;
    
    Game.eventObjects = [];
    Game.traps = [];

    // 청크 기반 맵 생성 (mapgen.js)
    if (typeof buildChunkMap === 'function') {
        buildChunkMap(w, l);
    }

    const isBoss = l === 3;
    const floorY = CH - 40;

    if (isBoss) {
        // 보스 크기에 따라 스폰 Y를 동적으로 계산 — floorY - 90 고정으로 땅 꺼짐 버그 수정
        // mkBoss 내부에서 e.h가 결정되므로, 예상 높이를 월드별로 계산
        // mob.js의 e.h와 동일하게 계산 — 스폰 Y가 정확히 발판 위에 위치
        // mob.js e.h 와 정확히 동기화
        let bossH;
        if (w === 5 || w === 6)    bossH = 130;
        else if (w === 10)         bossH = Math.floor(CH * 0.65);
        else if (w <= 2)           bossH = 72;
        else if (w <= 4)           bossH = 76;
        else                       bossH = 100;
        const bossSpawnY = floorY - bossH;
        if (typeof mkBoss === 'function') mkBoss(Game.levelW / 2, bossSpawnY, w);
        document.getElementById("bossBarWrap").style.display = "flex";
        const bossNames = [
            "", "고블린 킹", "언데드 고블린 킹", "스켈레톤 치프틴", "언데드 스켈레톤 치프틴", 
            "거대 괴수 더스크", "리치 킹", "마족 제1친위대장 (쌍검)", "마족 제2친위대장 (대검)", "마족 제3친위대장 (사신)", "마왕 (Demon Lord)"
        ];
        document.getElementById("bossBarLabel").textContent = bossNames[Math.min(w, 10)];
        Game.gs = "boss_intro";
        Game.bossIntroT = 90; // 1.5초 — 페이드인과 겹쳐도 충분한 연출
    }
    
    let currentHp = Game.player ? Game.player.hp : Game.pMaxHp; 
    if (typeof mkP === 'function') Game.player = mkP(40, floorY - 30);
    if (Game.player) {
        Game.player.hp = currentHp;
        // 플레이어 생성 직후 시스템 초기화
        if (typeof initSystems === 'function') initSystems();
    }
    
    Game.camX = 0;

    if (typeof updateHUD === 'function') updateHUD();
}

function nextStage() {
    Game.levelN++;
    
    if (Game.player && Game.pHealOnClear > 0) {
        Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + Game.pHealOnClear);
    }

    if (Game.levelN > 3) {
        // 보스전(3스테이지) 클리어 → 월드 진행
        Game.levelN = 1;
        Game.worldN++;

        if (Game.worldN > 10) {
            Game.gs = "win";
            if (Game.score > Game.highScore) {
                Game.highScore = Game.score;
                localStorage.setItem("skull_highscore", Game.highScore);
            }
            if (typeof showOv === 'function') showOv("LORD OF SKULLS (CLEAR)", "모든 악몽을 정복했습니다.", "스코어: " + Game.score + " (최고: " + Game.highScore + ")", "▶ RETURN TO LOBBY");
            return;
        }

        // 보스 클리어 시 유물 선택창 (항상)
        // 짝수 월드이면 유물 선택 후 루트 선택창도 예약
        if (Game.worldN % 2 === 0) {
            Game._pendingRouteSelect = true; // 짝수 월드 보스 클리어 시만 루트 선택
        }
        Game.gs = "upgrade";
        if (typeof playBGM === 'function') playBGM('upgrade');
        if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
        return;
    }

    // 1,2스테이지 클리어는 바로 다음 스테이지 — 유물창 없음
    if (typeof nextStageTrigger === 'function') nextStageTrigger();
    
}

// 💡 [신규] 화면이 완전히 까매졌을 때(Fade Out 완료) 맵을 생성하는 트리거 함수
function nextStageTrigger() {
    document.getElementById("bossBarWrap").style.display = "none";

    // 튜토리얼 클리어 시 진짜 1-1로
    if (Game.isTutorial) {
        Game.isTutorial = false;
        Game.worldN = 1; Game.levelN = 1;
    }

    genStage(Game.worldN, Game.levelN);
    if (typeof updateHUD === 'function') updateHUD();
    // transT=255에서 시작해 페이드인 — transT 없으면 이전값 유지로 화면이 오래 검게 보임
    Game.transState = 2; Game.transT = 255;
    if (typeof playBGM === 'function') playBGM('play');
}