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
    17: { name: "강화의 룬: 필살기 피해 +20%",                               apply: g => { g.pSkillDmgMul += 0.20; } },
    18: { name: "명상의 투구: 패링 성공 시 마나 회복량 2배 증가",              apply: g => g.pParryMp = 40 },
    19: { name: "가시 갑옷: 피격 시 적 1초 경직 및 2초당 HP 1 회복",         apply: g => { g.pReflectDmg += 15; g.pRegenFrames = 120; } },
    20: { name: "광전사의 분노: 체력 30% 이하일 때 데미지 50% 증가",           apply: g => g.pLowHpDmg = 1.5 },
    21: { name: "그림자 망토: 대쉬 무적 시간 소폭 증가",                      apply: g => g.pDashInv += 10 },
    22: { name: "폭군의 도끼: 공격력 50% 증폭, 최대 체력 70% 감소",           apply: g => { g.pBaseDmgMul += 0.5; g.pMaxHp = Math.max(1, Math.floor(g.pMaxHp * 0.3)); g.player.maxHp = g.pMaxHp; g.player.hp = Math.max(1, Math.floor(g.player.hp * 0.3)); } },
    23: { name: "수호자의 긍지: 방어막 +50, 이동 속도 -10%",                apply: g => { g.pShield += 50; g.pMoveSpdMul -= 0.1; } },
    24: { name: "시간의 시계태엽: 적 투사체 속도 15% 감소",                   apply: g => g.pProjSlow -= 0.15 },
    25: { name: "황혼의 단검: 공격력 +15%, 치명타 확률 +8%",                 apply: g => { g.pBaseDmgMul += 0.15; g.pCritChance += 0.08; } },
    26: { name: "강철의 의지: 받는 피해량 15% 감소",                        apply: g => g.pDmgReduction -= 0.15 },
    27: { name: "피의 축제: 콤보 유지 시간 3배 증가, 5콤보당 공격력 대폭(15) 증가", apply: g => { g.pComboDur += 300; g.pBloodFestival = true; } },
    28: { name: "저주받은 펜던트: 공격력 40% 증가, 1초당 체력 1 감소",         apply: g => { g.pBaseDmgMul += 0.4; g.pCursedPendant = true; } },
    29: { name: "신속의 검: 공속 +15%, 이속 +15%",                        apply: g => { g.pBaseAtkSpd += 0.15; g.pMoveSpdMul += 0.15; } },
    30: { name: "불사조의 깃털: 사망 시 1회에 한해 체력 50% 부활",             apply: g => g.pRevive += 1 },
    31: { name: "도약의 부츠: 점프력 20% 상승",                            apply: g => g.pJmpMul += 0.20 },
    32: { name: "개구리 뒷다리: 점프력 15% 상승 및 이동 속도 10% 상승",        apply: g => { g.pJmpMul += 0.15; g.pMoveSpdMul += 0.10; } },
    33: { name: "페가수스의 깃털: 점프력 30% 상승 및 대쉬 쿨타임 15% 감소",    apply: g => { g.pJmpMul += 0.30; g.pDashCDMul -= 0.15; } },

    // ── 추가 유물 (기존보다 살짝 약한 평범한 성능) ────────────────────────
    34: { name: "낡은 아뮬렛: 최대 HP +25",                                    apply: g => { g.pMaxHp += 25; g.player.maxHp = g.pMaxHp; g.player.hp += 25; } },
    35: { name: "녹슨 칼날: 공격력 +8",                                         apply: g => { g.pBaseDmg += 8; } },
    36: { name: "경량 갑옷: 받는 피해 -10%",                                    apply: g => { g.pDmgReduction -= 0.10; } },
    37: { name: "속보의 부적: 이동속도 +12%",                                    apply: g => { g.pMoveSpdMul += 0.12; } },
    38: { name: "예리한 숫돌: 치명타 확률 +8%",                                  apply: g => { g.pCritChance += 0.08; } },
    39: { name: "메아리의 룬: 25% 확률로 스킬 재시전",                            apply: g => { g.pDoubleSkillChance = (g.pDoubleSkillChance || 0) + 0.25; } },
    40: { name: "낡은 부적: 대쉬 쿨타임 -15%",                                  apply: g => { g.pDashCDMul = Math.max(0.5, g.pDashCDMul - 0.15); } },
    41: { name: "재생의 인장: 2초마다 HP 1씩 자동 회복",                          apply: g => { g.pRegenFrames = 120; } },
    42: { name: "상인의 손길: 아이템 드롭 확률 +8%",                              apply: g => { g.pDropRate += 0.08; } },
    43: { name: "집중의 보석: 치명타 데미지 +25%",                               apply: g => { g.pCritDmg += 0.25; } },

    // ── 추가 유물 (고위험-고보상 및 유틸) ───────────────────────────────────
    44: { name: "파괴의 문장: 최종 데미지 +25%, 최대 HP -20",                     apply: g => { g.pFinalDmgMul += 0.25; g.pMaxHp = Math.max(1, g.pMaxHp - 20); g.player.maxHp = g.pMaxHp; g.player.hp = Math.min(g.player.hp, g.pMaxHp); } },
    45: { name: "전장의 발걸음: 이동속도 +15%, 점프력 +15%",                       apply: g => { g.pMoveSpdMul += 0.15; g.pJmpMul += 0.15; } },
    46: { name: "독수리의 눈: 사거리 +35, 치명타 확률 +8%",                        apply: g => { g.pRangeBonus += 35; g.pCritChance += 0.08; } },
    47: { name: "철의 심장: 최대 HP +35, 방어력 +5",                              apply: g => { g.pMaxHp += 35; g.player.maxHp = g.pMaxHp; g.player.hp += 35; g.pBaseDef += 5; } },
    48: { name: "혈투의 각오: 방어력 -10, 공격력 +20%",                            apply: g => { g.pBaseDef -= 10; g.pBaseDmgMul += 0.20; } },
    49: { name: "회복의 성배: 스테이지 클리어 시 HP +15 회복",                      apply: g => { g.pHealOnClear += 15; } },
    50: { name: "분노의 결정: 받는 피해 +20%, 최종 데미지 +35%",                    apply: g => { g.pDmgReduction += 0.20; g.pFinalDmgMul += 0.35; } },
    51: { name: "광전사의 심장: 받는 피해 -5%, 공격속도 +15%",                      apply: g => { g.pDmgReduction -= 0.05; g.pBaseAtkSpd += 0.15; } },
    52: { name: "사냥꾼의 발: 대쉬 쿨타임 -20%, 이동속도 +10%",                     apply: g => { g.pDashCDMul = Math.max(0.3, g.pDashCDMul - 0.20); g.pMoveSpdMul += 0.10; } },
};

// 유물 id를 즉시 적용하고 obtainedItems에 기록 후 시너지 체크
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
    {
        ids: [44, 48],  // 파괴의 문장 + 혈투의 각오
        name: "자멸의 힘",
        desc: "최종 데미지 추가 +25%, 체력 최대 75%로 제한",
        apply: g => { g.pFinalDmgMul += 0.25; g.pMaxHp = Math.max(1, Math.floor(g.pMaxHp * 0.75)); g.player.maxHp = g.pMaxHp; g.player.hp = Math.min(g.player.hp, g.pMaxHp); }
    },
    {
        ids: [46, 2],   // 독수리의 눈 + 뼈의봉
        name: "사거리의 군주",
        desc: "사거리 추가 +20, 치명타 확률 +8%",
        apply: g => { g.pRangeBonus += 20; g.pCritChance += 0.08; }
    },
    {
        ids: [49, 3],   // 회복의 성배 + 전사의 피
        name: "불사의 몸",
        desc: "클리어 시 HP 회복 +10, 최대 HP +20",
        apply: g => { g.pHealOnClear += 10; g.pMaxHp += 20; g.player.maxHp = g.pMaxHp; }
    },
    {
        ids: [25, 15],  // 황혼의 단검 + 암살자의 비수
        name: "죽음의 낫",
        desc: "치명타 데미지 추가 +40%, 공격력 +8%",
        apply: g => { g.pCritDmg += 0.40; g.pBaseDmgMul += 0.08; }
    },
    {
        ids: [4, 17, 39], // 파괴의 룬 + 강화의 룬 + 메아리의 룬
        name: "마법 폭주",
        desc: "스킬 피해 추가 +30%, 재시전 확률 +10%",
        apply: g => { g.pSkillDmgMul += 0.30; g.pDoubleSkillChance = (g.pDoubleSkillChance||0) + 0.10; }
    },
    {
        ids: [16, 28], // 저주받은 대검 + 저주받은 펜던트
        name: "저주의 계약",
        desc: "최종 데미지 추가 +30%, 받는 피해 +15%",
        apply: g => { g.pFinalDmgMul += 0.30; g.pDmgReduction += 0.15; }
    },
    {
        ids: [20, 50], // 광전사의 분노 + 분노의 결정
        name: "절망의 투혼",
        desc: "체력 30% 이하 시 데미지 효과 2배",
        apply: g => { g.pLowHpDmg = Math.max(g.pLowHpDmg, 2.0); }
    },
    {
        ids: [19, 41], // 가시 갑옷 + 재생의 인장
        name: "생명의 원천",
        desc: "재생 속도 2배 (1초마다 HP 회복)",
        apply: g => { g.pRegenFrames = Math.max(30, Math.floor((g.pRegenFrames||120) / 2)); }
    },
    {
        ids: [5, 42], // 도굴왕 + 상인의 손길
        name: "황금 손",
        desc: "아이템 드롭 확률 추가 +15%",
        apply: g => { g.pDropRate += 0.15; }
    },
    {
        ids: [14, 38, 43], // 치명적인 일격 + 예리한 숫돌 + 집중의 보석
        name: "암살자의 극의",
        desc: "치명타 확률 +10%, 치명타 피해 +30%",
        apply: g => { g.pCritChance += 0.10; g.pCritDmg += 0.30; }
    },
    {
        ids: [11, 52], // 닌자의 발걸음 + 사냥꾼의 발
        name: "그림자 발걸음",
        desc: "대시 쿨타임 추가 -15%, 대시 무적 +5프레임",
        apply: g => { g.pDashCDMul = Math.max(0.2, g.pDashCDMul - 0.15); g.pDashInv += 5; }
    },
    {
        ids: [7, 35], // 거인의 힘 + 녹슨 칼날
        name: "전사의 기백",
        desc: "공격력 추가 +12, 최종 데미지 +10%",
        apply: g => { g.pBaseDmg += 12; g.pFinalDmgMul += 0.10; }
    },
    {
        ids: [47, 1], // 철의 심장 + 뼈방패
        name: "불굴의 수호",
        desc: "방어막 추가 +25, 최대 HP +20",
        apply: g => { g.pShield += 25; g.pMaxHp += 20; g.player.maxHp = g.pMaxHp; }
    },
    {
        ids: [12, 29, 45], // 바람의 망토 + 신속의 검 + 전장의 발걸음
        name: "바람의 화신",
        desc: "이동속도 추가 +20%, 점프력 +10%",
        apply: g => { g.pMoveSpdMul += 0.20; g.pJmpMul += 0.10; }
    },
];

const _appliedSynergies = new Set();

// 획득한 유물 조합이 SYNERGIES 조건을 충족하면 시너지 효과 즉시 발동
function checkSynergy() {
    if (!Game.obtainedItems) return;
    for (const syn of SYNERGIES) {
        const key = syn.ids.join(',');
        if (_appliedSynergies.has(key)) continue;
        if (syn.ids.every(id => Game.obtainedItems.includes(id))) {
            _appliedSynergies.add(key);
            syn.apply(Game);
            addText(320, 160, `시너지: ${syn.name}!`, "#ffcc00", 120, 16, 0, 0.5);
            addText(320, 178, syn.desc, "#ffaa00", 100, 11, 0, 0.5);
        }
    }
}

// 획득하지 않은 유물 풀에서 3개를 무작위 추출해 선택지로 제공
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

// 설명 텍스트 자동 줄바꿈 (/ 또는 , 기준으로 2줄 분리)
function _wrapDesc(text, maxW) {
    if (ctx.measureText(text).width <= maxW) return [text];
    const si = text.indexOf(' / ');
    if (si >= 0) return [text.slice(0, si), text.slice(si + 3)];
    const cs = text.split(', ');
    const h = Math.ceil(cs.length / 2);
    return [cs.slice(0, h).join(', '), cs.slice(h).join(', ')];
}

// 유물 선택 화면 전체 렌더 — 배경, 카드 3장, 키 가이드 포함
function renderUpgrade() {
    const t = Date.now();
    const pulse = (Math.sin(t * 0.003) + 1) / 2;

    // ── 배경 다층 ──
    ctx.fillStyle = "rgba(0,0,0,0.95)"; ctx.fillRect(0, 0, CW, CH);
    const bgGrd = ctx.createRadialGradient(CW/2, CH*0.4, 8, CW/2, CH/2, CW*0.72);
    bgGrd.addColorStop(0, "rgba(45,22,0,0.55)"); bgGrd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    // 부유 파티클 (황금 먼지)
    ctx.save();
    for (let i = 0; i < 14; i++) {
        const px = ((i * 97 + t * 0.008 * (i%3===0?1:-0.55)) % CW + CW) % CW;
        const py = ((i * 59 + t * 0.006 * (i%2===0?0.75:-0.45)) % CH + CH) % CH;
        const pa = 0.04 + Math.sin(t * 0.002 + i * 1.5) * 0.03;
        ctx.fillStyle = `rgba(255,195,55,${pa})`;
        ctx.beginPath(); ctx.arc(px, py, 1 + (i%3)*0.55, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    if (Game._upgradeFromRoute && Game._upgradeRouteDelay > 0) Game._upgradeRouteDelay--;
    const validItems = Game.offeredItems.filter(id => UPGRADES[id]);

    // 구분선 그라디언트 (공통)
    const sepGrd = ctx.createLinearGradient(0,0,CW,0);
    sepGrd.addColorStop(0,"transparent"); sepGrd.addColorStop(0.15,"#aa7700");
    sepGrd.addColorStop(0.5,"#ffcc00"); sepGrd.addColorStop(0.85,"#aa7700"); sepGrd.addColorStop(1,"transparent");

    // ── 루트에서 진입한 단일 유물 미리보기 ──────────────────────────────
    if (Game._upgradeFromRoute && validItems.length > 0) {
        if (Game._upgradePreview == null) Game._upgradePreview = 0;
        const previewId = validItems[Game._upgradePreview] ?? validItems[0];
        const pItem = UPGRADES[previewId];
        if (pItem) {
            ctx.save(); ctx.textAlign = "center";
            ctx.font = "bold 18px SkullFont, NeoDunggeunmo";
            ctx.shadowBlur = 14 + pulse*8; ctx.shadowColor = "#ffaa00";
            ctx.fillStyle = "#ffe066";
            ctx.fillText("✦ 유물 발견 ✦", CW/2, 26);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = sepGrd; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0,34); ctx.lineTo(CW,34); ctx.stroke();

            // 아이템 카드
            const cw2 = 500, ch2 = 96, cx2 = CW/2 - cw2/2, cy2 = (CH - ch2)/2 - 22;
            const colonIdx = pItem.name.indexOf(': ');
            const title = colonIdx >= 0 ? pItem.name.slice(0, colonIdx) : pItem.name;
            const desc  = colonIdx >= 0 ? pItem.name.slice(colonIdx + 2) : "";

            const cg = ctx.createLinearGradient(cx2, cy2, cx2+cw2, cy2+ch2);
            cg.addColorStop(0,"rgba(50,30,0,0.93)"); cg.addColorStop(1,"rgba(20,10,0,0.93)");
            ctx.fillStyle = cg;
            ctx.beginPath(); ctx.roundRect(cx2, cy2, cw2, ch2, 8); ctx.fill();
            ctx.shadowBlur = 10+pulse*8; ctx.shadowColor = "#ffaa00";
            ctx.strokeStyle = `rgba(210,150,0,${0.6+pulse*0.3})`; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.roundRect(cx2, cy2, cw2, ch2, 8); ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#ffe066"; ctx.font = "bold 19px SkullFont, NeoDunggeunmo";
            ctx.shadowBlur = 5; ctx.shadowColor = "#cc8800";
            ctx.fillText(title, CW/2, cy2+32);
            ctx.shadowBlur = 0;

            if (desc) {
                ctx.font = "14px SkullFont, NeoDunggeunmo";
                const lines2 = _wrapDesc(desc, cw2-60);
                ctx.fillStyle = "#ccddff";
                if (lines2.length === 1) {
                    ctx.fillText(lines2[0], CW/2, cy2+60);
                } else {
                    ctx.fillText(lines2[0], CW/2, cy2+54);
                    ctx.fillStyle = "#aabbdd";
                    ctx.fillText(lines2[1], CW/2, cy2+72);
                }
            }

            // 버튼
            const btnY = cy2+ch2+16, btnH = 34;
            ctx.fillStyle = "rgba(0,40,12,0.90)";
            ctx.beginPath(); ctx.roundRect(CW/2-114, btnY, 100, btnH, 6); ctx.fill();
            ctx.shadowBlur = 6; ctx.shadowColor = "#00ff88";
            ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(CW/2-114, btnY, 100, btnH, 6); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#00ff88"; ctx.font = "bold 14px SkullFont, NeoDunggeunmo";
            ctx.fillText("[1]  획득한다", CW/2-64, btnY+22);

            ctx.fillStyle = "rgba(40,0,0,0.90)";
            ctx.beginPath(); ctx.roundRect(CW/2+14, btnY, 100, btnH, 6); ctx.fill();
            ctx.shadowBlur = 6; ctx.shadowColor = "#ff4444";
            ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(CW/2+14, btnY, 100, btnH, 6); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ff4444"; ctx.font = "bold 14px SkullFont, NeoDunggeunmo";
            ctx.fillText("[2]  지나친다", CW/2+64, btnY+22);
            ctx.restore();

            if (Game._upgradeRouteDelay <= 0) {
                if ((dn("Digit1")||dn("Numpad1")) && !K.u1Old) { playSfx('menu_select'); applyUpgrade(previewId); exitUpgrade(); Game._upgradePreview = null; Game._upgradeFromRoute = false; }
                else if ((dn("Digit2")||dn("Numpad2")) && !K.u2Old) { playSfx('menu_select'); exitUpgrade(); Game._upgradePreview = null; Game._upgradeFromRoute = false; }
            }
            return;
        }
    }

    // ── 일반 유물 3선택 ───────────────────────────────────────────────────
    ctx.save(); ctx.textAlign = "center";
    ctx.font = "bold 20px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 14+pulse*8; ctx.shadowColor = "#ffaa00";
    ctx.fillStyle = "#ffe066";
    ctx.fillText("✦ 유물 선택 ✦", CW/2, 26);
    ctx.shadowBlur = 0;
    ctx.font = "13px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = Game.rerollCoins > 0 ? "#55ccff" : "#334455";
    ctx.fillText(`[R]  리롤  (${Game.rerollCoins} / 9)`, CW/2, 43);
    ctx.restore();
    ctx.strokeStyle = sepGrd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,48); ctx.lineTo(CW,48); ctx.stroke();

    if (validItems.length === 0) {
        ctx.save(); ctx.textAlign = "center";
        ctx.fillStyle = "#55556a"; ctx.font = "13px SkullFont, NeoDunggeunmo";
        ctx.fillText("더 이상 획득할 고유 유물이 없습니다.", CW/2, CH/2);
        ctx.fillText("아무 키나 눌러 다음 스테이지로...", CW/2, CH/2+20);
        ctx.restore();
    } else {
        const bw = 580, bh = 82, gap = 10;
        const totalH = validItems.length * bh + (validItems.length-1)*gap;
        const startY = Math.max(55, Math.floor((CH-totalH)/2));
        const startX = (CW-bw)/2;

        for (let i = 0; i < validItems.length; i++) {
            const item = UPGRADES[validItems[i]];
            const iy = startY + i*(bh+gap);
            const bx = startX;

            const colonIdx = item.name.indexOf(': ');
            const title = colonIdx >= 0 ? item.name.slice(0, colonIdx) : item.name;
            const desc  = colonIdx >= 0 ? item.name.slice(colonIdx + 2) : "";

            // 카드 배경
            const cg = ctx.createLinearGradient(bx, iy, bx+bw, iy+bh);
            cg.addColorStop(0,"rgba(42,26,0,0.91)"); cg.addColorStop(1,"rgba(16,8,0,0.91)");
            ctx.fillStyle = cg;
            ctx.beginPath(); ctx.roundRect(bx, iy, bw, bh, 7); ctx.fill();

            // 상단 골드 shimmer 스트라이프
            const tg = ctx.createLinearGradient(bx, iy, bx+bw, iy);
            tg.addColorStop(0,"rgba(255,175,0,0)"); tg.addColorStop(0.5,"rgba(255,175,0,0.09)"); tg.addColorStop(1,"rgba(255,175,0,0)");
            ctx.fillStyle = tg;
            ctx.beginPath(); ctx.roundRect(bx, iy, bw, bh*0.28, [7,7,0,0]); ctx.fill();

            // 테두리 글로우
            ctx.shadowBlur = 4; ctx.shadowColor = "#996600";
            ctx.strokeStyle = "rgba(175,125,0,0.70)"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(bx, iy, bw, bh, 7); ctx.stroke();
            ctx.shadowBlur = 0;

            // 키 뱃지
            ctx.fillStyle = "rgba(100,65,0,0.95)";
            ctx.beginPath(); ctx.roundRect(bx+7, iy+8, 22, 17, 4); ctx.fill();
            ctx.fillStyle = "#ffcc00"; ctx.font = "bold 13px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
            ctx.fillText(i+1, bx+18, iy+20);

            // 제목 (17px 고정)
            ctx.fillStyle = "#ffe066"; ctx.font = "bold 17px SkullFont, NeoDunggeunmo";
            ctx.shadowBlur = 5; ctx.shadowColor = "#cc8800";
            ctx.fillText(title, CW/2, iy+32);
            ctx.shadowBlur = 0;

            // 설명 (최대 2줄, 14px 고정)
            if (desc) {
                ctx.font = "14px SkullFont, NeoDunggeunmo";
                const lines2 = _wrapDesc(desc, bw-80);
                if (lines2.length === 1) {
                    ctx.fillStyle = "#ccddff";
                    ctx.fillText(lines2[0], CW/2, iy+57);
                } else {
                    ctx.fillStyle = "#ccddff"; ctx.fillText(lines2[0], CW/2, iy+52);
                    ctx.fillStyle = "#aabbdd"; ctx.fillText(lines2[1], CW/2, iy+68);
                }
            }
        }
    }

    if (validItems.length === 0 && (dn("Space","Enter") || dn("Digit1","Numpad1"))) { exitUpgrade(); }
    else if (validItems.length > 0 && !Game._upgradeFromRoute) {
        if ((dn("Digit1")||dn("Numpad1")) && !K.u1Old && validItems[0] !== undefined) { playSfx('menu_select'); applyUpgrade(validItems[0]); exitUpgrade(); }
        else if ((dn("Digit2")||dn("Numpad2")) && !K.u2Old && validItems[1] !== undefined) { playSfx('menu_select'); applyUpgrade(validItems[1]); exitUpgrade(); }
        else if ((dn("Digit3")||dn("Numpad3")) && !K.u3Old && validItems[2] !== undefined) { playSfx('menu_select'); applyUpgrade(validItems[2]); exitUpgrade(); }
    }
    ctx.textAlign = "left";
}
// 유물 선택 완료 — 루트 선택 대기 중이면 루트 선택 화면으로, 아니면 다음 스테이지로
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

// 영구 강화 수치를 localStorage에 저장
function saveProgress() {
    localStorage.setItem("skull_quartz",    Game.darkQuartz);
    localStorage.setItem("skull_permHp",    Game.permHpLvl);
    localStorage.setItem("skull_permAtk",   Game.permAtkLvl);
    localStorage.setItem("skull_permCrit",  Game.permCritLvl);
    localStorage.setItem("skull_permSpd",   Game.permSpdLvl || 0);
    localStorage.setItem("skull_permDef",    Game.permDefLvl    || 0);
    localStorage.setItem("skull_permAtkSpd", Game.permAtkSpdLvl || 0);
    localStorage.setItem("skull_permDash",  Game.permDashLvl || 0);
    localStorage.setItem("skull_permCritDmg", Game.permCritDmgLvl || 0);
    localStorage.setItem("skull_permMp",    Game.permMpLvl || 0);
}

// 완만한 우상향 비용: base * (1 + lvl*0.6)
// 예) base=4: 4, 6, 9, 12, 16, 19... (선형에 가까움)
function _shopCost(base, lvl) { return Math.floor(base * (1 + lvl * 0.6)); }

// ==========================================
// 보스 전리품 시스템
// ==========================================
const BOSS_ITEMS = {
    101: { name: "타락한 핵심: 최대 HP +80, 공격력 +20%",           apply: g => { g.pMaxHp += 80; g.player.maxHp = g.pMaxHp; g.player.hp = Math.min(g.pMaxHp, g.player.hp + 80); g.pBaseDmgMul += 0.20; } },
    102: { name: "불사의 갑옷: 받는 피해 -30%, 저체력 시 데미지 +50%", apply: g => { g.pDmgReduction -= 0.30; g.pLowHpDmg += 0.50; } },
    103: { name: "사신의 낫: 공격력 +30%, 치명타 확률 +20%, 치명타 피해 +60%", apply: g => { g.pBaseDmgMul += 0.30; g.pCritChance += 0.20; g.pCritDmg += 0.60; } },
    104: { name: "공허의 룬석: 스킬 피해 +60%, 재시전 확률 +20%",    apply: g => { g.pSkillDmgMul += 0.60; g.pDoubleSkillChance = (g.pDoubleSkillChance||0) + 0.20; } },
    105: { name: "폭풍의 날개: 이동속도 +30%, 공속 +30%, 대시쿨 -30%", apply: g => { g.pMoveSpdMul += 0.30; g.pBaseAtkSpd += 0.30; g.pDashCDMul = Math.max(0.1, g.pDashCDMul - 0.30); } },
    106: { name: "광기의 각인: 최종 데미지 +70%, 최대 HP -30%",       apply: g => { g.pFinalDmgMul += 0.70; g.pMaxHp = Math.max(10, g.pMaxHp - 30); g.player.maxHp = g.pMaxHp; g.player.hp = Math.min(g.player.hp, g.pMaxHp); } },
    107: { name: "전설의 방패: 방어막 +80, 방어력 +15, 받는 피해 -20%", apply: g => { g.pShield += 80; g.pBaseDef += 15; g.pDmgReduction -= 0.20; } },
    108: { name: "불사조의 각인: 부활 +2회, 부활 시 HP 75% 회복",    apply: g => { g.pRevive += 2; g._reviveHpMul = 0.75; } },
    109: { name: "시간의 파편: 적 투사체 속도 -40%, 공격속도 +20%",   apply: g => { g.pProjSlow = Math.max(0.1, g.pProjSlow - 0.40); g.pBaseAtkSpd += 0.20; } },
    110: { name: "운명의 다이스: 아이템 드롭률 +30%, 다크쿼츠 획득 +50%", apply: g => { g.pDropRate += 0.30; g._quartzMul = (g._quartzMul || 1) * 1.5; } },
};

// 보스 클리어 후 전설 유물 선택지 2개를 무작위 추출
function generateBossLoot() {
    const obtained = Game.obtainedItems || [];
    const pool = Object.keys(BOSS_ITEMS).map(Number).filter(id => !obtained.includes(id));
    Game._bossLootOptions = [];
    for (let i = 0; i < Math.min(2, pool.length); i++) {
        const r = Math.floor(Math.random() * pool.length);
        Game._bossLootOptions.push(pool[r]);
        pool.splice(r, 1);
    }
}

// 전설 유물 즉시 적용 및 획득 기록
function applyBossItem(id) {
    const u = BOSS_ITEMS[id];
    if (!u) return;
    u.apply(Game);
    if (!Game.obtainedItems) Game.obtainedItems = [];
    Game.obtainedItems.push(id);
    checkSynergy();
    const gotName = BOSS_ITEMS[id]?.name?.split(':')[0] ?? "전설 유물";
    addText(CW / 2, CH / 2 - 20, `전설 유물: ${gotName}`, "#ff9900", 160, 16, 0, 0.3);
}

// 보스 전리품 선택 화면 렌더 — 전설 유물 카드 2장 표시
function renderBossLoot() {
    const t = Date.now();
    const pulse = (Math.sin(t * 0.003) + 1) / 2;
    const opts = Game._bossLootOptions || [];

    // 배경 — 보스 느낌의 짙은 보라/적
    ctx.fillStyle = "rgba(0,0,0,0.97)"; ctx.fillRect(0, 0, CW, CH);
    const bgGrd = ctx.createRadialGradient(CW/2, CH*0.4, 8, CW/2, CH/2, CW*0.72);
    bgGrd.addColorStop(0, "rgba(60,0,30,0.7)"); bgGrd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    // 부유 파티클 (붉은 먼지)
    ctx.save();
    for (let i = 0; i < 16; i++) {
        const px = ((i * 89 + t * 0.007 * (i%3===0?1:-0.6)) % CW + CW) % CW;
        const py = ((i * 67 + t * 0.005 * (i%2===0?0.8:-0.5)) % CH + CH) % CH;
        const pa = 0.04 + Math.sin(t * 0.002 + i * 1.3) * 0.03;
        ctx.fillStyle = `rgba(220,60,60,${pa})`;
        ctx.beginPath(); ctx.arc(px, py, 1 + (i%3)*0.6, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    const sepGrd = ctx.createLinearGradient(0,0,CW,0);
    sepGrd.addColorStop(0,"transparent"); sepGrd.addColorStop(0.15,"#880033");
    sepGrd.addColorStop(0.5,"#ff3366"); sepGrd.addColorStop(0.85,"#880033"); sepGrd.addColorStop(1,"transparent");

    ctx.save(); ctx.textAlign = "center";
    ctx.font = "bold 20px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 14 + pulse*10; ctx.shadowColor = "#ff0044";
    ctx.fillStyle = "#ff6688";
    ctx.fillText("★ 보스 전리품 ★", CW/2, 26);
    ctx.shadowBlur = 0;
    ctx.font = "12px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = "#884455";
    ctx.fillText("전설 등급 유물 중 하나를 선택하라", CW/2, 42);
    ctx.restore();
    ctx.strokeStyle = sepGrd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,48); ctx.lineTo(CW,48); ctx.stroke();

    if (opts.length === 0) {
        ctx.save(); ctx.textAlign = "center";
        ctx.fillStyle = "#885566"; ctx.font = "13px SkullFont, NeoDunggeunmo";
        ctx.fillText("모든 전설 유물을 이미 획득했습니다.", CW/2, CH/2);
        ctx.fillText("[Enter] 계속", CW/2, CH/2 + 20);
        ctx.restore();
        if (dn("Enter","Space","Digit1","Numpad1")) _exitBossLoot();
        return;
    }

    const bw = 580, bh = 90, gap = 14;
    const totalH = opts.length * bh + (opts.length-1)*gap;
    const startY = Math.max(58, Math.floor((CH - totalH)/2));

    for (let i = 0; i < opts.length; i++) {
        const item = BOSS_ITEMS[opts[i]];
        if (!item) continue;
        const iy = startY + i*(bh+gap);
        const bx = (CW - bw)/2;

        const colonIdx = item.name.indexOf(': ');
        const title = colonIdx >= 0 ? item.name.slice(0, colonIdx) : item.name;
        const desc  = colonIdx >= 0 ? item.name.slice(colonIdx + 2) : "";

        // 카드 — 붉은 계열
        const cg = ctx.createLinearGradient(bx, iy, bx+bw, iy+bh);
        cg.addColorStop(0,"rgba(55,10,20,0.95)"); cg.addColorStop(1,"rgba(25,5,10,0.95)");
        ctx.fillStyle = cg;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, iy, bw, bh, 7); else ctx.rect(bx, iy, bw, bh); ctx.fill();

        const shimGrd = ctx.createLinearGradient(bx, iy, bx+bw, iy);
        shimGrd.addColorStop(0,"rgba(200,50,80,0)"); shimGrd.addColorStop(0.5,"rgba(200,50,80,0.10)"); shimGrd.addColorStop(1,"rgba(200,50,80,0)");
        ctx.fillStyle = shimGrd;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, iy, bw, bh*0.3, [7,7,0,0]); else ctx.rect(bx, iy, bw, bh*0.3); ctx.fill();

        ctx.shadowBlur = 6 + pulse*6; ctx.shadowColor = "#cc0033";
        ctx.strokeStyle = `rgba(200,60,80,${0.55+pulse*0.3})`; ctx.lineWidth = 1.8;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, iy, bw, bh, 7); else ctx.rect(bx, iy, bw, bh); ctx.stroke();
        ctx.shadowBlur = 0;

        // ★ 전설 뱃지
        ctx.fillStyle = "rgba(120,20,40,0.95)";
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx+7, iy+8, 26, 17, 4); else ctx.rect(bx+7, iy+8, 26, 17); ctx.fill();
        ctx.fillStyle = "#ff6688"; ctx.font = "bold 13px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText(i+1, bx+20, iy+20);

        // 전설 태그
        ctx.fillStyle = "rgba(100,20,35,0.9)";
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx+bw-60, iy+8, 52, 17, 4); else ctx.rect(bx+bw-60, iy+8, 52, 17); ctx.fill();
        ctx.fillStyle = "#ff4466"; ctx.font = "bold 10px SkullFont, NeoDunggeunmo";
        ctx.fillText("★ 전설", bx+bw-34, iy+20);

        ctx.fillStyle = "#ff99aa"; ctx.font = "bold 17px SkullFont, NeoDunggeunmo";
        ctx.shadowBlur = 5; ctx.shadowColor = "#aa0033";
        ctx.fillText(title, CW/2, iy+34);
        ctx.shadowBlur = 0;

        if (desc) {
            ctx.font = "14px SkullFont, NeoDunggeunmo";
            const lines2 = _wrapDesc(desc, bw-80);
            if (lines2.length === 1) {
                ctx.fillStyle = "#ffccdd"; ctx.fillText(lines2[0], CW/2, iy+60);
            } else {
                ctx.fillStyle = "#ffccdd"; ctx.fillText(lines2[0], CW/2, iy+54);
                ctx.fillStyle = "#ddaabb"; ctx.fillText(lines2[1], CW/2, iy+70);
            }
        }
    }

    ctx.textAlign = "left";
    if (opts[0] !== undefined && (dn("Digit1")||dn("Numpad1")) && !K.u1Old) { playSfx('menu_select'); applyBossItem(opts[0]); _exitBossLoot(); }
    else if (opts[1] !== undefined && (dn("Digit2")||dn("Numpad2")) && !K.u2Old) { playSfx('menu_select'); applyBossItem(opts[1]); _exitBossLoot(); }
}

function _exitBossLoot() {
    Game._bossLootOptions = null;
    Game.gs = "upgrade";
    if (typeof playBGM === 'function') playBGM('upgrade');
    if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
}

// ==========================================
// 이벤트 방 시스템
// ==========================================
const EVENTS = [
    { name: "고통의 제단",   color: "#ff4444",
      desc: "현재 HP -25%, 공격력 영구 +20%",
      apply: g => { g.player.hp = Math.max(1, g.player.hp - Math.floor(g.player.hp * 0.25)); g.pBaseDmgMul += 0.20; }},
    { name: "신비의 우물",   color: "#44aaff",
      desc: "체력 60% 회복",
      apply: g => { g.player.hp = Math.min(g.pMaxHp, g.player.hp + Math.floor(g.pMaxHp * 0.6)); }},
    { name: "상인의 보따리", color: "#ffcc00",
      desc: "랜덤 유물 1개 무료 획득",
      apply: g => {
          const pool = Object.keys(UPGRADES).map(Number).filter(id => !(g.obtainedItems||[]).includes(id));
          if (pool.length > 0) applyUpgrade(pool[Math.floor(Math.random() * pool.length)]);
      }},
    { name: "다크쿼츠 광맥", color: "#aa88ff",
      desc: "다크쿼츠 +10 획득",
      apply: g => { g.darkQuartz += 10; saveProgress(); }},
    { name: "피의 계약",     color: "#cc2244",
      desc: "최대 HP -20, 공격력 영구 +20",
      apply: g => { g.pMaxHp = Math.max(10, g.pMaxHp - 20); g.player.maxHp = g.pMaxHp; g.player.hp = Math.min(g.player.hp, g.pMaxHp); g.pBaseDmg += 20; }},
    { name: "수호의 가호",   color: "#44ffaa",
      desc: "방어막 +50 획득",
      apply: g => { g.pShield += 50; }},
    { name: "죽음의 도박",   color: "#ff8800",
      desc: "[행운 50%] 유물 2개 획득 / [불운 50%] 현재 HP가 절반으로 감소",
      apply: g => {
          if (Math.random() < 0.5) {
              const pool = Object.keys(UPGRADES).map(Number).filter(id => !(g.obtainedItems||[]).includes(id));
              for (let i = 0; i < 2 && pool.length > 0; i++) {
                  const r = Math.floor(Math.random() * pool.length);
                  applyUpgrade(pool[r]); pool.splice(r, 1);
              }
          } else {
              g.player.hp = Math.max(1, Math.floor(g.player.hp * 0.5));
          }
      }},
    { name: "강인함의 증명", color: "#ffffff",
      desc: "5초간 무적 + 치명타 확률 영구 +10%",
      apply: g => { g._pendingInvT = (g._pendingInvT || 0) + 300; g.pCritChance += 0.10; }},
    { name: "잊혀진 지식",   color: "#66ffff",
      desc: "필살기 피해 +30%, 이동속도 +10%",
      apply: g => { g.pSkillDmgMul += 0.30; g.pMoveSpdMul += 0.10; }},
    { name: "부활의 샘",     color: "#ffaaff",
      desc: "부활 횟수 +1, 최대 HP +15",
      apply: g => { g.pRevive += 1; g.pMaxHp += 15; g.player.maxHp = g.pMaxHp; }},
];

// 이벤트 방 선택지 3개를 EVENTS 풀에서 무작위 추출 — 유물 지급형 이벤트는 미리 유물 결정
function generateEventOptions() {
    const pool = [...EVENTS];
    Game._eventOptions = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
        const r = Math.floor(Math.random() * pool.length);
        const ev = Object.assign({}, pool[r]); // shallow copy

        // 랜덤 유물 지급 이벤트: 어떤 유물 나올지 미리 결정해 설명에 표시
        if (ev.name === "상인의 보따리") {
            const relicPool = Object.keys(UPGRADES).map(Number)
                .filter(id => !(Game.obtainedItems || []).includes(id));
            if (relicPool.length > 0) {
                const pid = relicPool[Math.floor(Math.random() * relicPool.length)];
                const rName = UPGRADES[pid]?.name?.split(':')[0] ?? `유물 ${pid}`;
                ev.desc = `무료 획득 → ${rName}`;
                ev.apply = () => applyUpgrade(pid);
            }
        } else if (ev.name === "죽음의 도박") {
            if (Math.random() < 0.5) {
                const relicPool = Object.keys(UPGRADES).map(Number)
                    .filter(id => !(Game.obtainedItems || []).includes(id));
                const picks = [];
                for (let j = 0; j < 2 && relicPool.length > 0; j++) {
                    const ri = Math.floor(Math.random() * relicPool.length);
                    picks.push(relicPool[ri]); relicPool.splice(ri, 1);
                }
                const names = picks.map(id => UPGRADES[id]?.name?.split(':')[0] ?? `유물 ${id}`).join(', ');
                ev.desc = `[행운] 유물 2개 → ${names}`;
                ev.apply = () => picks.forEach(id => applyUpgrade(id));
            } else {
                ev.desc = "[불운] HP 절반 감소";
                ev.apply = g => { g.player.hp = Math.max(1, Math.floor(g.player.hp * 0.5)); };
            }
        }

        Game._eventOptions.push(ev);
        pool.splice(r, 1);
    }
}

// 이벤트 방 선택 화면 렌더 — 카드 3장 중 하나 선택 시 효과 즉시 적용
function renderEventRoom() {
    const t = Date.now();
    const pulse = (Math.sin(t * 0.003) + 1) / 2;
    const opts = Game._eventOptions || [];

    ctx.fillStyle = "rgba(0,0,0,0.96)"; ctx.fillRect(0, 0, CW, CH);
    const bgGrd = ctx.createRadialGradient(CW/2, CH*0.35, 5, CW/2, CH/2, CW*0.65);
    bgGrd.addColorStop(0, "rgba(10,30,50,0.6)"); bgGrd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    // 부유 파티클 (청록)
    ctx.save();
    for (let i = 0; i < 14; i++) {
        const px = ((i * 83 + t * 0.006 * (i%3===0?1:-0.5)) % CW + CW) % CW;
        const py = ((i * 61 + t * 0.004 * (i%2===0?0.7:-0.4)) % CH + CH) % CH;
        const pa = 0.04 + Math.sin(t * 0.0015 + i * 1.2) * 0.025;
        ctx.fillStyle = `rgba(60,180,200,${pa})`;
        ctx.beginPath(); ctx.arc(px, py, 1 + (i%3)*0.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    const sepGrd = ctx.createLinearGradient(0,0,CW,0);
    sepGrd.addColorStop(0,"transparent"); sepGrd.addColorStop(0.15,"#005577");
    sepGrd.addColorStop(0.5,"#00aacc"); sepGrd.addColorStop(0.85,"#005577"); sepGrd.addColorStop(1,"transparent");

    ctx.save(); ctx.textAlign = "center";
    ctx.font = "bold 20px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 14 + pulse*8; ctx.shadowColor = "#00aacc";
    ctx.fillStyle = "#66ddff";
    ctx.fillText("◈ 이벤트 방 ◈", CW/2, 26);
    ctx.shadowBlur = 0;
    ctx.font = "12px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = "#336677";
    ctx.fillText("하나를 선택하라", CW/2, 42);
    ctx.restore();
    ctx.strokeStyle = sepGrd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,48); ctx.lineTo(CW,48); ctx.stroke();

    const bw = 560, bh = 72, gap = 12;
    const totalH = opts.length * bh + (opts.length-1)*gap;
    const startY = Math.max(58, Math.floor((CH - totalH)/2));

    for (let i = 0; i < opts.length; i++) {
        const ev = opts[i];
        const iy = startY + i*(bh+gap);
        const bx = (CW - bw)/2;

        const cg = ctx.createLinearGradient(bx, iy, bx+bw, iy+bh);
        cg.addColorStop(0,"rgba(5,25,40,0.95)"); cg.addColorStop(1,"rgba(2,12,20,0.95)");
        ctx.fillStyle = cg;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, iy, bw, bh, 7); else ctx.rect(bx, iy, bw, bh); ctx.fill();

        // 색상 포인트 사이드바
        ctx.fillStyle = ev.color + "55";
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, iy, 5, bh, [7,0,0,7]); else ctx.rect(bx, iy, 5, bh); ctx.fill();
        ctx.fillStyle = ev.color;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, iy + bh*0.25, 4, bh*0.5, 2); else ctx.rect(bx, iy+bh*0.25, 4, bh*0.5); ctx.fill();

        ctx.shadowBlur = 4 + pulse*4; ctx.shadowColor = ev.color;
        ctx.strokeStyle = `${ev.color}66`; ctx.lineWidth = 1.5;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, iy, bw, bh, 7); else ctx.rect(bx, iy, bw, bh); ctx.stroke();
        ctx.shadowBlur = 0;

        // 키 뱃지
        ctx.fillStyle = "rgba(0,60,80,0.95)";
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx+10, iy+8, 22, 17, 4); else ctx.rect(bx+10, iy+8, 22, 17); ctx.fill();
        ctx.fillStyle = "#44ddff"; ctx.font = "bold 13px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText(i+1, bx+21, iy+20);

        ctx.fillStyle = ev.color; ctx.font = "bold 16px SkullFont, NeoDunggeunmo";
        ctx.shadowBlur = 4; ctx.shadowColor = ev.color;
        ctx.fillText(ev.name, CW/2, iy+28);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#aaccdd"; ctx.font = "13px SkullFont, NeoDunggeunmo";
        ctx.fillText(ev.desc, CW/2, iy+52);
    }

    ctx.textAlign = "left";
    if (opts[0] && (dn("Digit1")||dn("Numpad1")) && !K.u1Old) { playSfx('menu_select'); opts[0].apply(Game); _exitEventRoom(); }
    else if (opts[1] && (dn("Digit2")||dn("Numpad2")) && !K.u2Old) { playSfx('menu_select'); opts[1].apply(Game); _exitEventRoom(); }
    else if (opts[2] && (dn("Digit3")||dn("Numpad3")) && !K.u3Old) { playSfx('menu_select'); opts[2].apply(Game); _exitEventRoom(); }
}

function _exitEventRoom() {
    Game._eventOptions = null;
    Game.gs = "play";
    if (typeof playBGM === 'function') playBGM('play');
    if (typeof nextStageTrigger === 'function') nextStageTrigger();
}

// 영구 강화 항목 정의
const PERM_UPGRADES = [
    { key:"1", prop:"permHpLvl",      base:4,  max:15, name:"최대 체력",   eff:"+10 HP",        apply: g => { g.pMaxHp += 10; } },
    { key:"2", prop:"permAtkLvl",     base:6,  max:15, name:"기본 공격력", eff:"+2 ATK",        apply: g => { g.pBaseDmg += 2; } },
    { key:"3", prop:"permAtkSpdLvl",  base:8,  max:10, name:"공격 속도",   eff:"+5% ASPD",      apply: g => { g.pAtkSpdMul = (g.pAtkSpdMul||1.0) + 0.05; } },
    { key:"4", prop:"permSpdLvl",     base:9,  max:10, name:"이동 속도",   eff:"+4% SPD",       apply: g => { g.pMoveSpdMul += 0.04; } },
    { key:"5", prop:"permDefLvl",     base:9,  max:10, name:"방어력",      eff:"+2 DEF",        apply: g => { g.pBaseDef = (g.pBaseDef||0) + 2; } },
    { key:"6", prop:"permDashLvl",    base:11, max:10, name:"대시 쿨타임",  eff:"-5% DASH CD",   apply: g => { g.pDashCDMul = Math.max(0.5, g.pDashCDMul - 0.05); } },
    { key:"7", prop:"permCritLvl",   base:7,  max:10, name:"크리티컬 확률",eff:"+2% CRIT",      apply: g => { g.pCritChance += 0.02; } },
    { key:"8", prop:"permCritDmgLvl",base:10, max:10, name:"크리티컬 데미지",eff:"+10% CRIT DMG",apply: g => { g.pCritDmg = (g.pCritDmg||1.5) + 0.10; } },
];

// ── 다크 쿼츠 초기화 시스템 ──────────────────────────────────────────
let _quartzResetConfirm = false;
let _rKeyOld = false, _confK1Old = false, _confK2Old = false;

// 모든 영구 강화를 0으로 초기화하고 소모한 다크쿼츠를 환불
function resetDarkQuartz() {
    let refund = 0;
    for (const u of PERM_UPGRADES) {
        const lvl = Game[u.prop] || 0;
        for (let i = 0; i < lvl; i++) refund += _shopCost(u.base, i);
        Game[u.prop] = 0;
    }
    Game.darkQuartz += refund;
    saveProgress();
    if (typeof playSfx === 'function') playSfx('item');
}

// 영구 상점 입력 처리 — 숫자 키로 항목 구매, R로 초기화 확인
function updateShop() {
    // R 키: 초기화 확인창 토글
    const rKey = dn("KeyR");
    if (rKey && !_rKeyOld) { _quartzResetConfirm = !_quartzResetConfirm; _confK1Old = true; _confK2Old = true; }
    _rKeyOld = rKey;

    if (_quartzResetConfirm) {
        const k1 = dn("Digit1", "Numpad1");
        const k2 = dn("Digit2", "Numpad2");
        if (k1 && !_confK1Old) { resetDarkQuartz(); _quartzResetConfirm = false; }
        if (k2 && !_confK2Old) { _quartzResetConfirm = false; }
        _confK1Old = k1; _confK2Old = k2;
        return; // 확인창 열려있으면 다른 입력 차단
    }

    if (dn("Escape") && !K.escOld) {
        Game.gs = Game._prevShopGs || "class_select";
        Game._prevShopGs = null;
        playSfx('item');
    }

    if (Game._shopDelay > 0) Game._shopDelay--;

    for (const u of PERM_UPGRADES) {
        const keys = ["Digit"+u.key, "Numpad"+u.key];
        if (dn(...keys) && !(Game._shopDelay > 0)) {
            const lvl = Game[u.prop] || 0;
            const cost = _shopCost(u.base, lvl);
            if (Game.darkQuartz >= cost && lvl < u.max) {
                Game.darkQuartz -= cost;
                Game[u.prop] = lvl + 1;
                u.apply(Game);
                saveProgress();
                playSfx('item');
                Game._shopDelay = 15;
            }
        }
    }
}

// 영구 상점 화면 렌더 — 다크쿼츠 잔액, 강화 항목 목록, 초기화 확인창 포함
function renderShop() {
    const t = Date.now();
    const pulse = (Math.sin(t * 0.0028) + 1) / 2;

    // ── 배경: 다층 방사형 그라디언트 ──
    const bgGrd = ctx.createRadialGradient(CW/2, CH * 0.38, 20, CW/2, CH/2, CW * 0.85);
    bgGrd.addColorStop(0,   "#1c0035");
    bgGrd.addColorStop(0.45,"#0e001e");
    bgGrd.addColorStop(1,   "#030008");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    // ── 배경 부유 파티클 (다크 쿼츠 결정) ──
    ctx.save();
    for (let i = 0; i < 22; i++) {
        const px = ((i * 103 + t * 0.009 * (i % 3 === 0 ? 1 : -0.6)) % CW + CW) % CW;
        const py = ((i * 61  + t * 0.007 * (i % 2 === 0 ? 0.8 : -0.5)) % CH + CH) % CH;
        const pa = 0.06 + Math.sin(t * 0.002 + i * 1.4) * 0.04;
        const ps = 1 + (i % 4) * 0.7;
        ctx.fillStyle = `rgba(190,90,255,${pa})`;
        ctx.beginPath(); ctx.arc(px, py, ps, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // ── 구분선 그라디언트 (재사용) ──
    const sepGrd = ctx.createLinearGradient(0, 0, CW, 0);
    sepGrd.addColorStop(0,   "transparent");
    sepGrd.addColorStop(0.15,"#7722aa");
    sepGrd.addColorStop(0.5, "#cc66ff");
    sepGrd.addColorStop(0.85,"#7722aa");
    sepGrd.addColorStop(1,   "transparent");

    // ── 헤더 ──
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 24px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 18 + pulse * 10; ctx.shadowColor = "#cc44ff";
    ctx.fillStyle = "#f0d0ff";
    ctx.fillText("어둠의 제단", CW/2, 28);
    ctx.shadowBlur = 0;
    ctx.font = "10px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = "#7744aa";
    ctx.fillText("— 영구 강화 시스템 —", CW/2, 42);

    // 쿼츠 표시
    ctx.font = "bold 15px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 12 + pulse * 6; ctx.shadowColor = "#bb33ff";
    ctx.fillStyle = "#dd88ff";
    ctx.fillText(`◆  ${Game.darkQuartz}  ◆`, CW/2, 62);
    ctx.shadowBlur = 0;
    ctx.font = "10px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = "#553377";
    ctx.fillText("보유 다크 쿼츠", CW/2, 74);
    ctx.restore();

    // 상단 구분선
    ctx.strokeStyle = sepGrd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 80); ctx.lineTo(CW, 80); ctx.stroke();

    // ── 카드 그리드 ──
    const cols = 4;
    const bw = 144, bh = 116, padX = 5, padY = 5;
    const totalW = cols * bw + (cols-1) * padX;
    const startX = (CW - totalW) / 2;
    const startY = 86;

    PERM_UPGRADES.forEach((u, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const bx = startX + col * (bw + padX);
        const by = startY + row * (bh + padY);
        const lvl   = Game[u.prop] || 0;
        const cost  = _shopCost(u.base, lvl);
        const canBuy = Game.darkQuartz >= cost && lvl < u.max;
        const maxed  = lvl >= u.max;
        const cp = canBuy && !maxed ? pulse : 0;

        // 카드 그림자 (글로우 배경)
        if (canBuy && !maxed) {
            ctx.shadowBlur = 10 + cp * 8; ctx.shadowColor = "#aa33ff";
            ctx.fillStyle = "transparent";
            ctx.beginPath(); ctx.roundRect(bx - 1, by - 1, bw + 2, bh + 2, 8); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 카드 배경 그라디언트
        const cg = ctx.createLinearGradient(bx, by, bx, by + bh);
        if (maxed) {
            cg.addColorStop(0, "rgba(52,38,6,0.95)"); cg.addColorStop(1, "rgba(22,15,2,0.95)");
        } else if (canBuy) {
            cg.addColorStop(0, `rgba(${40+Math.round(cp*14)},0,${64+Math.round(cp*20)},0.94)`);
            cg.addColorStop(1, "rgba(10,0,18,0.94)");
        } else {
            cg.addColorStop(0, "rgba(16,2,26,0.90)"); cg.addColorStop(1, "rgba(6,0,12,0.90)");
        }
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 7); ctx.fill();

        // 최대강화 골드 상단 스트라이프
        if (maxed) {
            const hg = ctx.createLinearGradient(bx, by, bx + bw, by);
            hg.addColorStop(0, "rgba(255,200,0,0)");
            hg.addColorStop(0.5, "rgba(255,200,0,0.10)");
            hg.addColorStop(1, "rgba(255,200,0,0)");
            ctx.fillStyle = hg;
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh * 0.32, [7,7,0,0]); ctx.fill();
        }

        // 카드 테두리
        ctx.lineWidth = 1.5;
        if (maxed) {
            ctx.shadowBlur = 3; ctx.shadowColor = "#996600";
            ctx.strokeStyle = "#886600";
        } else if (canBuy) {
            ctx.shadowBlur = 5 + cp * 7; ctx.shadowColor = "#cc44ff";
            ctx.strokeStyle = `rgba(${185+Math.round(cp*40)},${85+Math.round(cp*30)},255,${0.75+cp*0.25})`;
        } else {
            ctx.shadowBlur = 0; ctx.strokeStyle = "#2d0044";
        }
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 7); ctx.stroke();
        ctx.shadowBlur = 0;

        // 키 뱃지
        ctx.fillStyle = maxed ? "rgba(90,60,0,0.95)" : "rgba(70,0,100,0.95)";
        ctx.beginPath(); ctx.roundRect(bx+5, by+5, 18, 13, 3); ctx.fill();
        ctx.fillStyle = maxed ? "#ffdd44" : "#cc88ff";
        ctx.font = "bold 9px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText(u.key, bx+14, by+14);

        // 이름
        ctx.fillStyle = maxed ? "#ffeebb" : (canBuy ? "#f0ccff" : "#aa88bb");
        ctx.font = "bold 11px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText(u.name, bx + bw/2, by + 27);

        // 효과
        ctx.fillStyle = maxed ? "#bbaa55" : (canBuy ? "#99ccff" : "#666688");
        ctx.font = "10px SkullFont, NeoDunggeunmo";
        ctx.fillText(u.eff, bx + bw/2, by + 40);

        // 레벨 바 트랙
        const barX = bx+10, barY = by+48, barW = bw-20, barH = 7;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 3); ctx.fill();

        if (lvl > 0) {
            const fillW = barW * Math.min(1, lvl / u.max);
            const fg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            if (maxed) { fg.addColorStop(0,"#bb7700"); fg.addColorStop(1,"#ffdd44"); }
            else        { fg.addColorStop(0,"#7711bb"); fg.addColorStop(1,"#dd55ff"); }
            ctx.fillStyle = fg;
            ctx.beginPath(); ctx.roundRect(barX, barY, fillW, barH, 3); ctx.fill();
            // 하이라이트 shimmer
            if (!maxed) {
                ctx.fillStyle = "rgba(255,200,255,0.22)";
                ctx.beginPath(); ctx.roundRect(barX, barY, fillW, barH*0.45, [3,3,0,0]); ctx.fill();
            }
        }

        // Lv 표기
        ctx.fillStyle = maxed ? "#ddaa33" : "#9988aa";
        ctx.font = "10px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText(`Lv ${lvl} / ${u.max}`, bx + bw/2, by + 68);

        // 비용 / MAX
        if (!maxed) {
            ctx.shadowBlur = canBuy ? 7 : 0; ctx.shadowColor = "#ffaa00";
            ctx.fillStyle  = canBuy ? "#ffcc00" : "#cc3333";
            ctx.font = "bold 12px SkullFont, NeoDunggeunmo";
            ctx.fillText(`◆ ${cost}`, bx + bw/2, by + 84);
            ctx.shadowBlur = 0;
            ctx.fillStyle = canBuy ? "#886600" : "#662222";
            ctx.font = "9px SkullFont, NeoDunggeunmo";
            ctx.fillText("쿼츠 필요", bx + bw/2, by + 95);
        } else {
            ctx.shadowBlur = 7; ctx.shadowColor = "#ffaa00";
            ctx.fillStyle = "#ffcc44";
            ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
            ctx.fillText("✦ MAX", bx + bw/2, by + 90);
            ctx.shadowBlur = 0;
        }
    });

    // ── 하단 구분선 & 힌트 ──
    ctx.strokeStyle = sepGrd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, CH - 24); ctx.lineTo(CW, CH - 24); ctx.stroke();

    ctx.save();
    ctx.textAlign = "left";
    ctx.font = "10px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = "#553366";
    ctx.fillText("ESC 뒤로가기  ·  강화 레벨이 오를수록 비용 증가", 14, CH - 9);
    ctx.restore();

    // ── [R] 초기화 버튼 (하단 우측) ──
    ctx.save();
    ctx.textAlign = "right";
    const rBlink = Math.floor(t / 600) % 2 === 0;
    ctx.font = "bold 10px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = rBlink ? "#ff4444" : "#882222";
    ctx.shadowBlur = rBlink ? 6 : 0; ctx.shadowColor = "#ff0000";
    ctx.fillText("[R]  초기화", CW - 14, CH - 9);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── 초기화 확인 다이얼로그 ──
    if (_quartzResetConfirm) {
        // 어두운 오버레이
        ctx.fillStyle = "rgba(0,0,0,0.58)";
        ctx.fillRect(0, 0, CW, CH);

        // 다이얼로그 박스
        const dw = 310, dh = 132;
        const dx = CW/2 - dw/2, dy = CH/2 - dh/2;
        ctx.fillStyle = "rgba(8,0,16,0.82)";
        ctx.beginPath(); ctx.roundRect(dx, dy, dw, dh, 10); ctx.fill();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(dx, dy, dw, dh, 10); ctx.stroke();

        // 제목
        ctx.save(); ctx.textAlign = "center";
        ctx.font = "bold 15px SkullFont, NeoDunggeunmo";
        ctx.shadowBlur = 8; ctx.shadowColor = "#ff0000";
        ctx.fillStyle = "#ff2200";
        ctx.fillText("정말로 초기화 하시겠습니까?", CW/2, dy + 30);
        ctx.shadowBlur = 0;

        // 설명
        ctx.font = "10px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText("모든 영구 강화가 초기화되며 쿼츠가 전액 환불됩니다.", CW/2, dy + 48);

        // 예 버튼
        const btnY = dy + 62, btnH = 34;
        const yesBx = CW/2 - 10 - 90, noBx = CW/2 + 10;
        ctx.fillStyle = "rgba(50,0,0,0.85)";
        ctx.beginPath(); ctx.roundRect(yesBx, btnY, 90, btnH, 6); ctx.fill();
        ctx.strokeStyle = "#ff2200"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(yesBx, btnY, 90, btnH, 6); ctx.stroke();
        ctx.shadowBlur = 6; ctx.shadowColor = "#ff0000";
        ctx.fillStyle = "#ff4422";
        ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
        ctx.fillText("[1]  예", yesBx + 45, btnY + 22);
        ctx.shadowBlur = 0;

        // 아니오 버튼
        ctx.fillStyle = "rgba(20,20,30,0.85)";
        ctx.beginPath(); ctx.roundRect(noBx, btnY, 90, btnH, 6); ctx.fill();
        ctx.strokeStyle = "#cccccc"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(noBx, btnY, 90, btnH, 6); ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
        ctx.fillText("[2]  아니오", noBx + 45, btnY + 22);

        ctx.restore();
    }

    ctx.textAlign = "left";
}
