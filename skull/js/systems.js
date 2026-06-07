// ==========================================
// 소울라이크 심화 시스템 (Poise / Stamina / Just Dodge)
// 리게인은 삭제 — 즉각 피해가 훨씬 긴장감 있음
// ==========================================

const STAMINA_MAX        = 100;
const STAMINA_REGEN      = 0.45;  // 프레임당 자연회복 (가드 중엔 0)
const STAMINA_DASH       = 35;    // 대시 소모 증가 (기존 28)
const STAMINA_GUARD_TICK = 0.5;   // 가드 유지 소모 증가 (기존 0.3)
const STAMINA_ATK        = 0;     // 평타 스태미나 소모 없음 (공속 영향 차단)
const STAMINA_SKILL      = 45;    // 필살기 소모 증가 (기존 40)
const JUST_DODGE_WINDOW  = 6;     // 대쉬 직후 이 프레임 안에 맞으면 Witch Time

// ── 플레이어 전투 시스템 초기화 ──────────────
function initSystems() {
    const p = Game.player;
    if (!p) return;
    p.stamina        = STAMINA_MAX;
    p.justDodgeT     = 0;
    p.justDodgeReady = false;
    p.guardBreak     = false;
    p.guardBreakT    = 0;
    // grayHp 흔적 완전 제거
    p.grayHp         = 0;
}

// ── 스태미나 매 프레임 업데이트 ──────────────
function updateStamina() {
    const p = Game.player;
    if (!p || p.dead) return;

    if (p.guarding) {
        // 가드 유지 중 스태미나 서서히 소모 — 완전히 바닥나도 자동 브레이크 없음
        // 브레이크는 스태미나 0 상태에서 피격을 받았을 때만 발동 (combat.js에서 처리)
        p.stamina = Math.max(0, (p.stamina || 0) - STAMINA_GUARD_TICK);
    } else if (!p.dashT) {
        // 가드/대쉬 아닐 때만 자연회복
        p.stamina = Math.min(STAMINA_MAX, (p.stamina || 0) + STAMINA_REGEN);
    }

    p.fatRoll = p.stamina < 15;

    if (p.justDodgeT > 0) {
        p.justDodgeT--;
        p.justDodgeReady = p.justDodgeT > 0;
    }

    // 가드 브레이크 경직 카운트다운
    if (p.guardBreakT > 0) p.guardBreakT--;
}

// 가드 브레이크 내부 처리
function _triggerGuardBreak(p) {
    p.guardBreak  = true;
    p.guardBreakT = 50;       // 경직 프레임
    p.guarding    = false;
    p.kbT         = 40;       // 치명적인 넉백
    p.vy          = -5;
    p.vx          = -p.facing * 6;
    Game.camShake = 25;
    addText(p.x, p.y - 30, "GUARD BREAK!", "#ff2200", 70, 18);
    if (typeof playSfx === 'function') playSfx('dmg');
    // 가드 브레이크 직후엔 일정 시간 가드 불가 (약 90프레임)
    // setTimeout 대신 프레임 카운터 — 씬 전환 시 콜백 잔류 방지
    p.guardBreakT = 90;
}

// 스태미나 소모 헬퍼 — false 반환 시 행동 불가
function consumeStamina(amount) {
    const p = Game.player;
    if (!p) return true;
    if (amount <= 0) return true;           // 소모량 0이면 무조건 허용 (평타 등)
    // 정확히 amount 이상일 때만 허용 — 조금이라도 부족하면 불가
    if ((p.stamina || 0) < amount) return false;
    p.stamina = Math.max(0, (p.stamina || 0) - amount);
    return true;
}

// ── 체간(Poise) 시스템 ───────────────────────
// 일반 몹 최대치를 50~100으로 낮춰 스턴이 빠르게 터지도록

function getMaxPoise(e) {
    if (e.isBoss) return 150 + (e.world || 1) * 30; // 보스도 그로기 가능하게
    if (e.isElite) return 80;
    // 일반 몹은 50~100 수준 — 패링 2~3번이면 스턴
    return 50 + (e.world || 1) * 5;
}

function initPoise(e) {
    e.poise   = getMaxPoise(e);
    e.poiseMx = e.poise;
    e.stun    = false;
    e.stunT   = 0;
}

// 체간 데미지 적용 — isCrit 종속 버그 수정, 패링/강하 확정 부여
// poiseHit: 패링=50, 강하=30, 일반타=0 (크리랑 무관)
function applyPoiseHit(e, poiseHit) {
    if (!poiseHit || poiseHit <= 0) return;
    if (e.stun) return;

    e.poise = Math.max(0, (e.poise || 0) - poiseHit);

    if (e.poise <= 0) {
        e.stun    = true;
        e.stunT   = e.isBoss ? 60 : 120;   // 보스 그로기는 1초
        e.poise   = e.poiseMx;             // 체간 리셋
        e.vx      = 0;
        e.kbT     = e.stunT;

        if (e.isBoss) {
            addText(e.x + e.w / 2, e.y - 30, "GROGGY!!", "#ffee00", 90, 22);
        } else {
            addText(e.x + e.w / 2, e.y - 20, "STUN!", "#ffee00", 60, 16);
        }

        Game.camShake = 12;
        Game.hitStop  = Math.max(Game.hitStop || 0, 10);
        if (typeof playSfx === 'function') playSfx('poise_break');
    }
}

function updatePoise(e) {
    if (!e.stun) return;
    e.stunT--;
    if (e.stunT <= 0) { e.stun = false; e.stunT = 0; }
}

// 처형 가능 여부 체크
function canExecute(e) {
    if (!e.stun) return false;
    if (!Game.player) return false;
    const inRange = Math.abs(Game.player.x - e.x) < 70 && Math.abs(Game.player.y - e.y) < 70;
    return inRange; // 보스도 그로기 중엔 처형 가능
}

// 처형 실행 — 처형 모션 전체 무적 보장
function executeEnemy(e) {
    if (!canExecute(e)) return false;

    let dmg;
    if (e.isBoss) {
        // 보스 그로기 처형: 최대 체력의 12% 확정 피해
        dmg = Math.floor(e.maxHp * 0.12);
        e.stun  = false; // 그로기 해제 후 재전투
        e.stunT = 0;
        addText(e.x + e.w / 2, e.y - 40, "STAGGER HIT!!", "#ff6600", 90, 24);
    } else {
        // 일반 처형: 즉사
        dmg    = e.hp;
        e.hp   = 0;
        e.dead = true;
    }

    e.hp = Math.max(0, e.hp - dmg);

    Game.camShake = 22;
    Game.hitStop  = 20;

    // 처형 모션 동안 무적 — 얻어맞으면서 처형하는 꼴 방지
    Game.invT = 45;

    addText(e.x + e.w / 2, e.y - 30, "FATAL STRIKE!!", "#ff0000", 80, 22);
    for (let i = 0; i < 40; i++) {
        addPart(e.x + e.w / 2, e.y + e.h / 2, i < 25 ? "#ff0000" : "#ffaa00", 35, 5);
    }
    if (typeof playSfx === 'function') playSfx('fatal_strike');

    // 처형 보상: MP 한 방에 꽤 많이 채워줌
    Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 30);
    return true;
}

// ── Witch Time (저스트 회피) ──────────────────
function triggerJustDodge() {
    const p = Game.player;
    if (!p) return;
    Game.justDodgeActive    = true;
    Game.justDodgeT         = 90;
    Game.slowMoT            = 90;
    Game.justDodgeDmgBonus  = 2.0;
    addText(p.x, p.y - 30, "WITCH TIME!!", "#ffee00", 70, 18);
    Game.camShake = 10;
    if (typeof playSfx === 'function') playSfx('parry');
}

function updateJustDodge() {
    if (Game.justDodgeT > 0) {
        Game.justDodgeT--;
        if (Game.justDodgeT <= 0) {
            Game.justDodgeActive   = false;
            Game.justDodgeDmgBonus = 1.0;
        }
    }
}

// ── 혈흔 데칼 ────────────────────────────────
function initBloodDecals() {
    if (!Game.bloodDecals) Game.bloodDecals = [];
}

function addBloodDecal(x, y) {
    if (!Game.bloodDecals) Game.bloodDecals = [];
    if (Game.bloodDecals.length >= 60) Game.bloodDecals.shift();
    Game.bloodDecals.push({
        x: x + (Math.random() - 0.5) * 12,
        y,
        r:     2 + Math.random() * 4,
        a:     0.5 + Math.random() * 0.4,
        shape: Math.floor(Math.random() * 3)
    });
}

function renderBloodDecals() {
    if (!Game.bloodDecals || !Game.bloodDecals.length) return;
    ctx.save();
    for (const d of Game.bloodDecals) {
        const sx = d.x - Game.camX;
        if (sx < -20 || sx > CW + 20) continue;
        ctx.globalAlpha = d.a * 0.7;
        ctx.fillStyle   = "#6b0000";
        if (d.shape === 0) {
            ctx.beginPath(); ctx.arc(sx, d.y, d.r, 0, Math.PI * 2); ctx.fill();
        } else if (d.shape === 1) {
            ctx.beginPath(); ctx.ellipse(sx, d.y, d.r * 2, d.r, 0, 0, Math.PI * 2); ctx.fill();
        } else {
            for (let s = 0; s < 3; s++) {
                ctx.beginPath(); ctx.arc(sx + (s - 1) * d.r * 1.5, d.y - s * 1.5, d.r * 0.6, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

// ── 화톳불 ───────────────────────────────────
function initBonfire(x, y) {
    return { type: "bonfire", x, y, w: 24, h: 32, lit: false, used: false };
}

function useBonfire(ev) {
    if (ev.used) return;
    ev.used = true; ev.lit = true;
    const p = Game.player;
    p.hp = Game.pMaxHp;
    p.stamina = STAMINA_MAX;
    Game.pMp = Game.pMaxMp;
    addText(ev.x, ev.y - 30, "REST...", "#ffaa44", 100, 16);
    addText(ev.x, ev.y - 50, "적들이 부활한다!", "#ff4400", 80, 13);
    const w = Game.worldN, floorY = CH - 40, ec = 5 + w * 3 + Game.levelN * 2;
    for (let i = 0; i < ec; i++) {
        if (typeof mkEnemy === 'function') mkEnemy(300 + Math.random() * (Game.levelW - 500), floorY - 30, w);
    }
    playSfx('item');
    Game.camShake = 15;
    for (let i = 0; i < 30; i++) addPart(ev.x + 12, ev.y, "#ffaa44", 30, 4);
}