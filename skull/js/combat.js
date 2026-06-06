// ==========================================
// 전투 물리 엔진 및 오브젝트 풀링 (Combat & Physics)
// ==========================================

function getObj(arr) {
    let o = arr.find(x => !x.active);
    if (!o) { o = { active: false }; arr.push(o); }
    o.active = true;
    return o;
}

function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

// 발판 충돌 — 이전 프레임 위치를 역산해 Y축 우선 처리
// 고속 이동 시 벽 타기 버그 방지
function resolveAABB(e) {
    e.onGround = false;
    e.riding   = null;

    for (const t of Game.platforms) {
        if (t.drop && e.vy < 0)           continue;
        if (t.drop && (e.y + e.h) > t.y + 10) continue;
        if (!overlap(e, t))               continue;

        // 이전 프레임 위치 역산으로 진입 방향 판단 (벽 타기 방지 핵심)
        const prevX = e.x - e.vx;
        const prevY = e.y - e.vy;

        const fromTop    = (prevY + e.h) <= t.y + 4;
        const fromBottom = prevY         >= t.y + t.h - 4;
        const fromLeft   = (prevX + e.w) <= t.x + 4;
        const fromRight  = prevX         >= t.x + t.w - 4;

        // Y축 충돌 우선 처리
        if (fromTop) {
            e.y        = t.y - e.h;
            e.vy       = 0;
            e.onGround = true;
            e.riding   = t;
        } else if (fromBottom) {
            e.y  = t.y + t.h;
            e.vy = 0;
        } else if (fromLeft) {
            e.x  = t.x - e.w;
            e.vx = 0;
        } else if (fromRight) {
            e.x  = t.x + t.w;
            e.vx = 0;
        } else {
            // 폴백: 기존 overlap 방식
            const dx = (e.x + e.w / 2) - (t.x + t.w / 2);
            const dy = (e.y + e.h / 2) - (t.y + t.h / 2);
            const aw = (e.w + t.w) / 2;
            const ah = (e.h + t.h) / 2;
            if (aw * dy > ah * dx) {
                if (aw * dy > -ah * dx) { e.y = t.y + t.h; e.vy = 0; }
                else { e.x = t.x - e.w; e.vx = 0; }
            } else {
                if (aw * dy > -ah * dx) { e.x = t.x + t.w; e.vx = 0; }
                else { e.y = t.y - e.h; e.vy = 0; e.onGround = true; e.riding = t; }
            }
        }
    }
}

function spawnBullet(x, y, vx, vy, life, r, sk, dmg) {
    const b = getObj(Game.bullets);
    b.x = x; b.y = y; b.vx = vx; b.vy = vy;
    b.life = life; b.maxLife = life; b.r = r; b.sk = sk; b.dmg = dmg;
}

function spawnEBullet(x, y, vx, vy, life, r, dmg, grav=false, unblockable=false, isArrow=false, isBomb=false) {
    const b = getObj(Game.eBullets);
    b.x = x; b.y = y; b.vx = vx; b.vy = vy;
    b.life = life; b.r = r; b.dmg = dmg;
    b.grav = grav; b.unblockable = unblockable; b.isArrow = isArrow; b.isBomb = isBomb;
}

function spawnLaser(x, y, w, h, life, color, dmg, isPlayer=false, unblockable=false) {
    const l = getObj(Game.lasers);
    l.x = x; l.y = y; l.w = w; l.h = h;
    l.life = life; l.maxLife = life; l.color = color; l.dmg = dmg;
    l.isPlayer = isPlayer; l.unblockable = unblockable;
    l.hitTargets = new Set();
}

function addPart(x, y, col, life, size=3) {
    const p = getObj(Game.parts);
    p.x = x; p.y = y;
    p.vx = (Math.random() - 0.5) * 8;
    p.vy = (Math.random() - 0.5) * 8;
    p.col = col; p.life = life; p.ml = life; p.size = size;
}

function addText(x, y, text, color, life, size=14, vx=0, vy=1.5) {
    const t = getObj(Game.texts);
    t.x = x; t.y = y; t.text = text; t.color = color;
    t.life = life; t.size = size; t.vx = vx; t.vy = vy;
}

function addItem(x, y, w, h, vy, life, type) {
    const i = getObj(Game.items);
    i.x = x; i.y = y; i.w = w; i.h = h;
    i.vy = vy; i.life = life; i.type = type;
}

// 몬스터 피격 처리
function hitE(e, dmg, facing, isCrit, extraDmg=0) {
    if (e.dead) return;

    // 투명 구간 중 피해 무효
    if (e.type === "phantom" && !e.visible) {
        addText(e.x + e.w/2, e.y - 10, "MISS", "#888", 25, 12);
        return;
    }

    // 엘리트/슈퍼아머 몬스터는 넉백 없이 맞음
    const hasSuperArmor = e.superArmor && !e.stun;

    // 일반 몹 피격 무적시간
    if (!e.isBoss) {
        if ((e.hitInv || 0) > 0) return;
        e.hitInv = 8;
    }

    const extraDmgAmt = Math.floor(dmg * extraDmg);
    // Witch Time 보너스 (1회 소모)
    const jdBonus = (Game.justDodgeDmgBonus > 1.0) ? Game.justDodgeDmgBonus : 1.0;
    if (jdBonus > 1.0) Game.justDodgeDmgBonus = 1.0;

    const finalDmg = Math.floor((dmg + extraDmgAmt) * jdBonus);
    e.hp    -= finalDmg;
    e.flash  = 6;

    // 혈흔 데칼
    if (typeof addBloodDecal === 'function') addBloodDecal(e.x + e.w/2, e.y + e.h - 4);

    // 체간 데미지는 isCrit 플래그에 종속하지 않고 caller가 직접 넣어줌
    // (패링=50, 강하=30, 일반=0) → applyPoiseHit은 combat 외부에서 호출

    // 스턴 중 공격 → 처형 시도
    if (e.stun && typeof executeEnemy === 'function') {
        executeEnemy(e);
        return;
    }

    // 넉백 (슈퍼아머면 생략)
    if (!e.isBoss && !hasSuperArmor) {
        e.kbT = 10;
        e.vx  = facing * (e.isElite ? 2 : 4);
        e.vy  = -3;
    }

    addText(e.x + e.w/2, e.y - 10, dmg.toString(),
        isCrit ? "#ffcc00" : "#ffffff", 40, isCrit ? 24 : 16);
    if (extraDmgAmt > 0) addText(e.x + e.w/2 + 10, e.y - 2, "+" + extraDmgAmt, "#aaaaaa", 35, 11);

    for (let i = 0; i < 10; i++) addPart(e.x + e.w/2, e.y + e.h/2, "#ff0000", 15, 3);

    // 흡혈
    if (Game.pLifestealChance > 0 && Math.random() < Game.pLifestealChance && Game.player.hp < Game.pMaxHp) {
        Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + 2);
        addText(Game.player.x, Game.player.y - 10, "ABSORB", "#00ff00", 30, 12);
    }
    if (Game.pHealOnHit && Game.player.hp < Game.pMaxHp && Math.random() < 0.1) {
        Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + 1);
    }

    // 사망 처리
    if (e.hp <= 0) {
        e.hp = 0;
        // Splitter 분열 — dead 블록 전에 여기서 처리해야 안 증발함
        if (e.type === "splitter" && !e.splitDone) {
            e.splitDone = true;
            for (let si = -1; si <= 1; si += 2) {
                const se   = getObj(Game.enemies);
                se.w       = 18; se.h = 24;  // 일반 몬스터(26x34)의 70% — 발 꺼짐 방지
                se.x       = e.x + (e.w/2 - se.w/2) + si * 20;
                se.y       = e.y + e.h - se.h; // 부모 발판 아랫줄 기준 정렬
                se.vx = si * 2.5; se.vy = -4;
                se.hp      = Math.floor(e.maxHp * 0.3); se.maxHp = se.hp;
                se.atk     = Math.floor(e.atk * 0.7);
                se.type    = "melee"; se.isBoss = false; se.isElite = false;
                se.facing  = si; se.fr = 0; se.frT = 0; se.flash = 0;
                se.dead    = false; se.kbT = 8; se.warnT = 0; se.warnData = null;
                se.atkAnim = 0; se.world = e.world; se.isGuarding = false; se.guardT = 0;
                se.sI = 120; se.sT = 60; se.pDir = si; se.pT = 0; se.onGround = false;
                se.id      = (typeof _enemyIdCounter !== 'undefined') ? _enemyIdCounter++ : Math.random();
                se.splitDone = true;
            }
            addText(e.x + e.w/2, e.y - 15, "SPLIT!", "#ff8800", 50, 14);
        }
        e.dead = true;
    }
}

// 플레이어 피격 처리 — 리게인 완전 삭제, 즉시 hp 차감
function takeDmg(dmg, eObj, unblockable=false) {
    const p = Game.player;
    if (!p || p.dead || Game.invT > 0 || p.dashT > 0) return;
    // 튜토리얼: 체력 무적 + 일반 피격과 동일한 85프레임 무적 부여
    // 무적 간격이 너무 짧으면 TUTORIAL 텍스트가 도배되므로 정상 무적시간 적용
    if (Game.isTutorial) {
        Game.invT = 85;
        p.kbT = 20;
        p.vx  = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 4;
        p.vy  = -3;
        Game.camShake = 8;
        addText(p.x, p.y - 20, "TUTORIAL", "#88ffcc", 40, 13);
        for (let i = 0; i < 8; i++) addPart(p.x + 7, p.y + 9, "#88ffcc", 18, 3);
        return;
    }

    // 1. 패링 성공
    if (!unblockable && p.parryT > 0) {
        Game.hitStop = 8;
        if (typeof playSfx === 'function') playSfx('parry');
        Game.pMp = Math.min(Game.pMaxMp, Game.pMp + Game.pParryMp);
        addText(p.x, p.y - 20, "PARRY!", "#ffff00", 50, 16);
        Game.slowMoT = 18;

        // 패링 시 체간 50 확정 부여 (isCrit 종속 아님)
        if (eObj && typeof applyPoiseHit === 'function') applyPoiseHit(eObj, 50);

        p.vy  = -3; p.kbT = 12;
        p.vx  = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 2;
        Game.invT = 40;

        if (eObj && !eObj.isBoss) { eObj.kbT = 30; eObj.vx = (eObj.x < p.x ? -1 : 1) * 4; eObj.vy = -3; }
        return;
    }

    // 2. 가드
    if (!unblockable && p.guarding) {
        // 가드 중 스태미나 추가 소모 — 연속 맞으면 가드 브레이크 유도
        if (typeof consumeStamina === 'function') consumeStamina(20);
        if ((p.stamina || 0) <= 0 && typeof _triggerGuardBreak === 'function') {
            _triggerGuardBreak(p);
            // 가드 브레이크 시엔 dmg 절반은 그냥 들어감
            dmg = Math.floor(dmg * 0.5);
        } else {
            addText(p.x, p.y - 20, "GUARD", "#00ccff", 40, 14);
            p.kbT = 15; p.vy = -3;
            p.vx  = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 3;
            if (eObj && !eObj.isBoss) { eObj.kbT = 15; eObj.vx = (eObj.x < p.x ? -1 : 1) * 2; eObj.vy = -2; }
            if (typeof playSfx === 'function') playSfx('hit');
            Game.invT = 15;
            return;
        }
    }

    // 3. 맨몸 피격
    dmg = Math.floor(dmg * (Game.pDmgReduction || 1));
    if (dmg < 1) dmg = 1;

    // Witch Time 발동 (피해 완전 무효)
    if (p.justDodgeReady && typeof triggerJustDodge === 'function') {
        triggerJustDodge();
        p.justDodgeReady = false;
        return;
    }

    p.kbT = 20;
    p.vx  = (eObj ? (p.x < eObj.x ? -1 : 1) : -p.facing) * 5;
    p.vy  = -4;
    Game.hitStop = 15; Game.camShake = 20;
    if (typeof playSfx === 'function') playSfx('dmg');
    Game.comboCount = 0; Game.comboTimer = 0;

    // 가시 함정 등 eObj=null 환경 피해는 무적 짧게 — 꼼수 방지
    const invDur = eObj ? 85 : 15;

    // 가시 갑옷 반사
    if (Game.pReflectDmg > 0 && eObj && !eObj.isBoss) hitE(eObj, Game.pReflectDmg, p.facing, false);

    // 쉴드 먼저 차감
    if (Game.pShield > 0) {
        if (Game.pShield >= dmg) { Game.pShield -= dmg; dmg = 0; }
        else { dmg -= Game.pShield; Game.pShield = 0; }
    }

    // 리게인 없음 — 즉시 hp 차감
    if (dmg > 0) {
        p.hp -= dmg;
        addText(p.x, p.y - 20, `-${dmg}`, "#ff0000", 40, 22);
        for (let i = 0; i < 20; i++) addPart(p.x + 7, p.y + 9, "#ff0000", 25, 4);
    }

    Game.invT = invDur;

    // 사망/부활 판정 — 즉각적으로
    if (p.hp <= 0) {
        if (Game.pRevive > 0) {
            Game.pRevive--;
            p.hp = Math.floor(Game.pMaxHp * 0.5);
            addText(p.x, p.y - 30, "REVIVED!", "#ffaa00", 60, 20);
            if (typeof playSfx === 'function') playSfx('item');
            for (let i = 0; i < 30; i++) addPart(p.x + 7, p.y + 9, "#ffaa00", 30, 5);
        } else {
            p.hp   = 0; p.dead = true;
            Game.gs = "dead"; Game.deadTimer = 120;
            if (typeof playSfx === 'function') playSfx('player_die');
            for (let i = 0; i < 50; i++) addPart(p.x + 7, p.y + 9, "#ff0000", 40, 6);
            if (typeof stopBGM === 'function') stopBGM();
            if (typeof playBGM === 'function') playBGM('dead');
        }
    }
}