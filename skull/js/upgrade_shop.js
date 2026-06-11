// upgrade_shop.js — 유물/상점/영구강화 시스템

const UPGRADES = {
    1:  { name: "뼈방패: 30 데미지 흡수 배리어",                          apply: g => g.pShield += 30 },
    2:  { name: "뼈의봉: 공격력 소폭(+10) 상승 및 무기 길이 대폭(+50) 증가", apply: g => { g.pBaseDmg += 10; g.pRangeBonus += 50; } },
    3:  { name: "전사의 피: 최대 HP +50",                                apply: g => { g.pMaxHp += 50; g.player.maxHp = g.pMaxHp; g.player.hp += 50; } },
    4:  { name: "파괴의 룬: 필살기 데미지 30% 증폭",                       apply: g => g.pSkillDmgMul += 0.3 },
    5:  { name: "도굴왕: 몬스터 처치 시 아이템 드롭 확률 상승(+15%)",         apply: g => g.pDropRate += 0.15 },
    6:  { name: "광전사의 장갑: 공속 2.3배 상승 / 최종 데미지 0.5배",        apply: g => { g.pAtkSpdMul *= 2.3; g.pFinalDmgMul *= 0.5; } },
    7:  { name: "거인의 힘: 평타 추가 데미지 +15%",                        apply: g => g.pExtraDmg += 0.15 },
    8:  { name: "스컬의 축복: 체력+10, 공격력+3, 방어력+3, 사거리+6, 공속+10%", apply: g => { g.pMaxHp += 10; g.player.maxHp = g.pMaxHp; g.player.hp += 10; g.pBaseDmg += 3; g.pRangeBonus += 6; g.pBaseDef += 3; g.pBaseAtkSpd += 0.1; } },
    9:  { name: "야수의 손톱: 공격속도 20% 증가",                          apply: g => g.pBaseAtkSpd += 0.2 },
    10: { name: "늑대의 피갈퀴손: 평타 타격 시 확률로 HP 회복",               apply: g => g.pHealOnHit = true },
    11: { name: "닌자의 발걸음: 대쉬 쿨타임 25% 감소",                      apply: g => g.pDashCDMul -= 0.25 },
    12: { name: "바람의 망토: 이동 속도 20% 증가",                         apply: g => g.pMoveSpdMul += 0.2 },
    13: { name: "거머리의 송곳니: 흡혈 발동 확률 5% 추가 증가",               apply: g => g.pLifestealChance += 0.05 },
    14: { name: "치명적인 일격: 치명타 확률 15% 증가",                       apply: g => g.pCritChance += 0.15 },
    15: { name: "암살자의 비수: 치명타 데미지 50% 증가",                      apply: g => g.pCritDmg += 0.5 },
    16: { name: "저주받은 대검: 최종 데미지 2.3배 증폭 / 공속 0.5배",         apply: g => { g.pFinalDmgMul *= 2.3; g.pAtkSpdMul *= 0.5; } },
    18: { name: "명상의 투구: 패링 성공 시 마나 회복량 2배 증가",              apply: g => g.pParryMp = 40 },
    19: { name: "가시 갑옷: 피격 시 적 1초 경직 및 2초당 HP 1 회복",         apply: g => { g.pReflectDmg += 15; g.pRegenFrames = 120; } },
    20: { name: "광전사의 분노: 체력 30% 이하일 때 데미지 50% 증가",           apply: g => g.pLowHpDmg = 1.5 },
    21: { name: "그림자 망토: 대쉬 무적 시간 소폭 증가",                      apply: g => g.pDashInv += 10 },
    22: { name: "폭군의 도끼: 공격력 50% 증폭, 최대 체력 70% 감소",           apply: g => { g.pBaseDmgMul += 0.5; g.pMaxHp = Math.max(1, Math.floor(g.pMaxHp * 0.3)); g.player.maxHp = g.pMaxHp; g.player.hp = Math.max(1, Math.floor(g.player.hp * 0.3)); } },
    23: { name: "수호자의 긍지: 방어막 +50, 이동 속도 -10%",                apply: g => { g.pShield += 50; g.pMoveSpdMul -= 0.1; } },
    24: { name: "시간의 시계태엽: 적 투사체 속도 15% 감소",                   apply: g => g.pProjSlow -= 0.15 },
    26: { name: "강철의 의지: 받는 피해량 15% 감소",                        apply: g => g.pDmgReduction -= 0.15 },
    27: { name: "피의 축제: 콤보 유지 시간 3배 증가, 5콤보당 공격력 대폭(15) 증가", apply: g => { g.pComboDur += 300; g.pBloodFestival = true; } },
    28: { name: "저주받은 펜던트: 공격력 40% 증가, 1초당 체력 1 감소",         apply: g => { g.pBaseDmgMul += 0.4; g.pCursedPendant = true; } },
    29: { name: "신속의 검: 공속 +15%, 이속 +15%",                        apply: g => { g.pBaseAtkSpd += 0.15; g.pMoveSpdMul += 0.15; } },
    30: { name: "불사조의 깃털: 사망 시 1회에 한해 체력 50% 부활",             apply: g => g.pRevive += 1 },
    31: { name: "도약의 부츠: 점프력 20% 상승",                            apply: g => g.pJmpMul += 0.20 },
    32: { name: "개구리 뒷다리: 점프력 15% 상승 및 이동 속도 10% 상승",        apply: g => { g.pJmpMul += 0.15; g.pMoveSpdMul += 0.10; } },
    33: { name: "페가수스의 깃털: 점프력 30% 상승 및 대쉬 쿨타임 15% 감소",    apply: g => { g.pJmpMul += 0.30; g.pDashCDMul -= 0.15; } },
};

function applyUpgrade(id) {
    const u = UPGRADES[id];
    if (u) u.apply(Game);
    if (!Game.obtainedItems) Game.obtainedItems = [];
    Game.obtainedItems.push(id);
    checkSynergy();

    // 획득 시 화면 중앙에 "획득: [유물 이름]" — 뭘 먹었는지 바로 알 수 있게
    const gotName = UPGRADES[id]?.name?.split(':')[0] ?? "유물";
    addText(CW / 2, CH / 2 - 20, `획득: ${gotName}`, "#ffcc00", 140, 16, 0, 0.3);
}

// ==========================================
// 업그레이드 시너지 시스템
// ==========================================
const SYNERGIES = [
    {
        ids: [13, 10],  // 흡혈 + 타격회복
        name: "생명력 공명",
        desc: "HP+20, 흡혈 확률 추가 +10%",
        apply: g => { g.pMaxHp += 20; g.player.maxHp = g.pMaxHp; g.pLifestealChance += 0.10; }
    },
    {
        ids: [14, 15],  // 치명타 확률 + 치명타 데미지
        name: "암살자의 눈",
        desc: "치명타 확률 +10%, 치명타 데미지 +30%",
        apply: g => { g.pCritChance += 0.10; g.pCritDmg += 0.30; }
    },
    {
        ids: [6, 9],    // 광전사 장갑 + 야수 손톱
        name: "광속 연격",
        desc: "최종 데미지 +20% 추가",
        apply: g => { g.pFinalDmgMul += 0.20; }
    },
    {
        ids: [22, 20],  // 폭군 도끼 + 광전사 분노
        name: "죽음의 투사",
        desc: "체력 50% 이하 시 데미지 2배 효과",
        apply: g => { g.pLowHpDmg = Math.max(g.pLowHpDmg, 2.0); }
    },
    {
        ids: [1, 23],   // 뼈방패 + 수호자 긍지
        name: "철벽 수호",
        desc: "방어막 +30 추가, 받는 피해 -10%",
        apply: g => { g.pShield += 30; g.pDmgReduction = Math.max(0.5, g.pDmgReduction - 0.10); }
    },
    {
        ids: [27, 29],  // 피의 축제 + 신속의 검
        name: "광란의 춤",
        desc: "콤보 유지 시간 추가 +2초, 이속 +10%",
        apply: g => { g.pComboDur += 120; g.pMoveSpdMul += 0.10; }
    },
    {
        ids: [31, 32, 33], // 부츠 3종 세트
        name: "천공의 발",
        desc: "점프력 추가 +20%, 공중 대쉬 가능",
        apply: g => { g.pJmpMul += 0.20; }
    },
];

const _appliedSynergies = new Set();

function checkSynergy() {
    if (!Game.obtainedItems) return;
    for (const syn of SYNERGIES) {
        const key = syn.ids.join(',');
        if (_appliedSynergies.has(key)) continue;
        if (syn.ids.every(id => Game.obtainedItems.includes(id))) {
            _appliedSynergies.add(key);
            syn.apply(Game);
            addText(320, 160, `SYNERGY: ${syn.name}!`, "#ffcc00", 120, 16, 0, 0.5);
            addText(320, 178, syn.desc, "#ffaa00", 100, 11, 0, 0.5);
        }
    }
}

function generateUpgradeOptions() {
    Game.offeredItems = [];
    // UPGRADES에 실제 정의된 id만 풀로 사용 (없는 id 뽑히는 버그 방지)
    let pool = Object.keys(UPGRADES).map(Number);

    if (Game.obtainedItems && Game.obtainedItems.length > 0) {
        pool = pool.filter(id => !Game.obtainedItems.includes(id));
    }

    for (let i = 0; i < 3; i++) {
        if (pool.length === 0) break;
        let r = Math.floor(Math.random() * pool.length);
        Game.offeredItems.push(pool[r]);
        pool.splice(r, 1);
    }
}

function renderUpgrade() {
    ctx.fillStyle = "rgba(0,0,0,0.92)"; ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = "center";

    if (Game._upgradeFromRoute && Game._upgradeRouteDelay > 0) {
        Game._upgradeRouteDelay--;
    }

    // 💡 [수정] 빈 데이터(undefined)를 걸러내어 1번 자리가 비는 버그 완벽 차단
    const validItems = Game.offeredItems.filter(id => UPGRADES[id]);

    if (Game._upgradeFromRoute && validItems.length > 0) {
        if (Game._upgradePreview === null || Game._upgradePreview === undefined) {
            Game._upgradePreview = 0; // 랜덤 대신 첫 번째 유효 항목으로 안전하게 설정
        }
        const previewId = validItems[Game._upgradePreview] || validItems[0];
        const pItem = UPGRADES[previewId];
        
        if (pItem) {
            ctx.fillStyle = "#ffcc00"; ctx.font = "bold 16px SkullFont, NeoDunggeunmo";
            ctx.shadowBlur = 10; ctx.shadowColor = "#ffcc00";
            ctx.fillText("유물 선택", CW/2, 50); ctx.shadowBlur = 0;
            ctx.fillStyle = "#ffffff"; ctx.font = "bold 20px SkullFont, NeoDunggeunmo";
            ctx.fillText(pItem.name, CW/2, 100);
            ctx.fillStyle = "rgba(255,200,0,0.25)"; ctx.fillRect(CW/2-150, 112, 300, 1);
            ctx.fillStyle = "#aaddff"; ctx.font = "11px SkullFont, NeoDunggeunmo";
            ctx.fillText("아래에서 획득 여부를 결정하세요", CW/2, 130);
            
            ctx.fillStyle = "#003311"; ctx.fillRect(CW/2-140, 148, 120, 36);
            ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 2; ctx.strokeRect(CW/2-140, 148, 120, 36);
            ctx.fillStyle = "#00ff88"; ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
            ctx.fillText("[1] 획득한다", CW/2-80, 171);
            
            ctx.fillStyle = "#330000"; ctx.fillRect(CW/2+20, 148, 120, 36);
            ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 2; ctx.strokeRect(CW/2+20, 148, 120, 36);
            ctx.fillStyle = "#ff4444"; ctx.fillText("[2] 지나친다", CW/2+80, 171);
            
            ctx.lineWidth = 1; ctx.textAlign = "left"; 
            
            if (Game._upgradeRouteDelay <= 0) {
                if ((dn("Digit1")||dn("Numpad1")) && !K.u1Old) {
                    applyUpgrade(previewId);
                    exitUpgrade(); Game._upgradePreview = null; Game._upgradeFromRoute = false;
                } else if ((dn("Digit2")||dn("Numpad2")) && !K.u2Old) {
                    exitUpgrade(); Game._upgradePreview = null; Game._upgradeFromRoute = false;
                }
            }
            return;
        }
    }
    
    ctx.fillStyle = "#ffcc00"; ctx.font = "bold 22px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 10; ctx.shadowColor = "#ffcc00";
    ctx.fillText("유물 선택", CW/2, 28);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#00ccff"; ctx.font = "14px SkullFont, NeoDunggeunmo";
    ctx.fillText(`[R] 리롤 (코인: ${Game.rerollCoins} / 9)`, CW/2, 48);

    if (validItems.length === 0) {
        ctx.fillStyle = "#888"; ctx.font = "13px SkullFont, NeoDunggeunmo";
        ctx.fillText("더 이상 획득할 고유 유물이 없습니다.", CW/2, 190);
        ctx.fillText("아무 키나 눌러 다음 스테이지로...", CW/2, 212);
    } else {
        const bw = 500;
        const bh = 72;
        const totalH = validItems.length * bh + (validItems.length - 1) * 10;
        const startIY = Math.max(60, Math.floor((CH - totalH) / 2));

        for (let i = 0; i < validItems.length; i++) {
            const item = UPGRADES[validItems[i]];
            const iy = startIY + i * (bh + 10);
            const bx = CW/2 - bw/2;

            ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(bx, iy, bw, bh);
            ctx.strokeStyle = "rgba(200,160,0,0.5)"; ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, iy, bw, bh);

            ctx.fillStyle = "#ffcc00"; ctx.font = "bold 16px SkullFont, NeoDunggeunmo";
            ctx.textAlign = "left"; ctx.fillText(`[${i+1}]`, bx + 14, iy + bh/2 + 6);

            // 이름 글자 수에 따라 폰트 크기 조절 (긴 이름도 잘리지 않게)
            const _nl = item.name.length;
            const _fs = _nl > 28 ? 11 : (_nl > 22 ? 12 : (_nl > 16 ? 14 : 16));
            ctx.fillStyle = "#ffffff"; ctx.font = `bold ${_fs}px SkullFont, NeoDunggeunmo`;
            ctx.textAlign = "center";
            ctx.fillText(item.name, CW/2, iy + bh/2 + 6);
        }
    }

    if (validItems.length === 0 && (dn("Space", "Enter") || dn("Digit1", "Numpad1"))) { 
        exitUpgrade(); 
    } else if (validItems.length > 0 && !Game._upgradeFromRoute) {
        if ((dn("Digit1")||dn("Numpad1")) && !K.u1Old && validItems[0] !== undefined) { applyUpgrade(validItems[0]); exitUpgrade(); }
        else if ((dn("Digit2")||dn("Numpad2")) && !K.u2Old && validItems[1] !== undefined) { applyUpgrade(validItems[1]); exitUpgrade(); }
        else if ((dn("Digit3")||dn("Numpad3")) && !K.u3Old && validItems[2] !== undefined) { applyUpgrade(validItems[2]); exitUpgrade(); }
    }
    ctx.textAlign = "left";
}
function exitUpgrade() {
    // 짝수 월드 진입 전이면 루트 선택 화면으로
    if (Game._pendingRouteSelect) {
        Game._pendingRouteSelect = false;
        Game.gs = "route_select";
        playBGM('upgrade');
        return;
    }
    Game.transState = 2; Game.transT = 255;
    Game.gs = "play"; playBGM('play'); 
    if (typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
    if (typeof initSystems === 'function') initSystems();
    if (typeof initBloodDecals === 'function') initBloodDecals();
}

function saveProgress() {
    localStorage.setItem("skull_quartz",    Game.darkQuartz);
    localStorage.setItem("skull_permHp",    Game.permHpLvl);
    localStorage.setItem("skull_permAtk",   Game.permAtkLvl);
    localStorage.setItem("skull_permCrit",  Game.permCritLvl);
    localStorage.setItem("skull_permSpd",   Game.permSpdLvl || 0);
    localStorage.setItem("skull_permJmp",   Game.permJmpLvl || 0);
    localStorage.setItem("skull_permDash",  Game.permDashLvl || 0);
    localStorage.setItem("skull_permCritDmg", Game.permCritDmgLvl || 0);
    localStorage.setItem("skull_permMp",    Game.permMpLvl || 0);
}

// 완만한 우상향 비용: base * (1 + lvl*0.6)
// 예) base=4: 4, 6, 9, 12, 16, 19... (선형에 가까움)
function _shopCost(base, lvl) { return Math.floor(base * (1 + lvl * 0.6)); }

// 영구 강화 항목 정의
const PERM_UPGRADES = [
    { key:"1", prop:"permHpLvl",      base:4,  max:15, name:"최대 체력",       eff:"+10 HP",     apply: g => { g.pMaxHp += 10; } },
    { key:"2", prop:"permAtkLvl",     base:6,  max:15, name:"기본 공격력",     eff:"+2 ATK",     apply: g => { g.pBaseDmg += 2; } },
    { key:"3", prop:"permCritLvl",    base:7,  max:10, name:"크리티컬 확률",   eff:"+2% CRIT",   apply: g => { g.pCritChance += 0.02; } },
    { key:"4", prop:"permSpdLvl",     base:9,  max:10, name:"이동 속도",       eff:"+4% SPD",    apply: g => { g.pMoveSpdMul += 0.04; } },
    { key:"5", prop:"permJmpLvl",     base:9,  max:10, name:"점프력",         eff:"+5% JMP",    apply: g => { g.pJmpMul += 0.05; } },
    { key:"6", prop:"permDashLvl",    base:11, max:10, name:"대시 쿨타임",    eff:"-5% DASH CD",apply: g => { g.pDashCDMul = Math.max(0.5, g.pDashCDMul - 0.05); } },
    { key:"7", prop:"permCritDmgLvl", base:12, max:10, name:"크리티컬 데미지",eff:"+15% CDMG",  apply: g => { g.pCritDmg += 0.15; } },
    { key:"8", prop:"permSkillDmgLvl", base:15, max:10, name:"스킬 위력", eff:"+10% SKILL DMG", apply: g => { g.pSkillDmgMul = (g.pSkillDmgMul||1.0)+0.10; } },
];

function updateShop() {
    if (dn("Escape") && !K.escOld) { 
        Game.gs = Game._prevShopGs || "class_select"; 
        Game._prevShopGs = null; 
        playSfx('item'); 
    }
    
    // 💡 [핵심 패치] 상점 전용 쿨타임 감소 로직
    if (Game._shopDelay > 0) Game._shopDelay--;
    
    for (const u of PERM_UPGRADES) {
        const keys = ["Digit"+u.key, "Numpad"+u.key];
        
        // 💡 고장난 oldKey 검사를 없애고 상점 쿨타임이 0일 때만 작동하도록 변경
        if (dn(...keys) && !(Game._shopDelay > 0)) {
            const lvl = Game[u.prop] || 0;
            const cost = _shopCost(u.base, lvl);
            
            if (Game.darkQuartz >= cost && lvl < u.max) {
                Game.darkQuartz -= cost;
                Game[u.prop] = lvl + 1;
                u.apply(Game);
                saveProgress();
                playSfx('item');
                
                // 💡 15프레임 (약 0.25초) 쿨타임 부여!
                // 꾹 누르고 있어도 "다다다닥" 안 오르고 "탁- 탁- 탁-" 기분 좋게 강화됩니다.
                Game._shopDelay = 15; 
            }
        }
    }
}

function renderShop() {
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#2a0044"); bgGrd.addColorStop(1, "#05020a");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = "#ff55ff"; ctx.font = "bold 22px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
    ctx.shadowBlur = 10; ctx.shadowColor = "#000";
    ctx.fillText("어둠의 제단 (영구 강화)", CW/2, 38);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#00ffff"; ctx.font = "15px SkullFont, NeoDunggeunmo";
    ctx.fillText(`보유 다크 쿼츠: ${Game.darkQuartz}`, CW/2, 60);
    ctx.fillStyle = "#888"; ctx.font = "11px SkullFont, NeoDunggeunmo";
    ctx.fillText("(ESC 뒤로가기 / 강화 레벨이 오를수록 비용 급증)", CW/2, 76);

    const cols = 4, rows = 2;
    const bw = 140, bh = 110, padX = 8, padY = 8;
    const totalW = cols * bw + (cols-1) * padX;
    const startX = (CW - totalW) / 2;
    const startY = 88;

    PERM_UPGRADES.forEach((u, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const bx = startX + col * (bw + padX);
        const by = startY + row * (bh + padY);
        const lvl = Game[u.prop] || 0;
        const cost = _shopCost(u.base, lvl);
        const canBuy = Game.darkQuartz >= cost && lvl < u.max;
        const maxed  = lvl >= u.max;

        ctx.fillStyle = maxed ? "rgba(40,30,10,0.8)" : (canBuy ? "rgba(30,0,50,0.85)" : "rgba(10,0,20,0.7)");
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = maxed ? "#886600" : (canBuy ? "#cc44ff" : "#440066");
        ctx.lineWidth = maxed ? 2 : 1.5; ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = "#ffee88"; ctx.font = "bold 12px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText(`[${u.key}] ${u.name}`, bx + bw/2, by + 20);

        ctx.fillStyle = "#aaddff"; ctx.font = "11px SkullFont, NeoDunggeunmo";
        ctx.fillText(u.eff, bx + bw/2, by + 36);

        // 레벨 바
        const barW = bw - 20;
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx+10, by+44, barW, 8);
        ctx.fillStyle = maxed ? "#ffcc00" : "#aa44ff";
        ctx.fillRect(bx+10, by+44, barW * Math.min(1, lvl / u.max), 8);
        ctx.fillStyle = "#ccc"; ctx.font = "10px SkullFont, NeoDunggeunmo";
        ctx.fillText(`Lv ${lvl} / ${u.max}`, bx + bw/2, by + 62);

        // 비용
        if (!maxed) {
            ctx.fillStyle = canBuy ? "#ffcc00" : "#ff4444";
            ctx.font = "bold 12px SkullFont, NeoDunggeunmo";
            ctx.fillText(`${cost} 쿼츠`, bx + bw/2, by + 80);
        } else {
            ctx.fillStyle = "#ffcc44"; ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
            ctx.fillText("MAX", bx + bw/2, by + 80);
        }
    });
    ctx.textAlign = "left";
}
