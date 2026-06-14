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
            addText(320, 160, `시너지: ${syn.name}!`, "#ffcc00", 120, 16, 0, 0.5);
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

// 설명 텍스트 자동 줄바꿈 (/ 또는 , 기준으로 2줄 분리)
function _wrapDesc(text, maxW) {
    if (ctx.measureText(text).width <= maxW) return [text];
    const si = text.indexOf(' / ');
    if (si >= 0) return [text.slice(0, si), text.slice(si + 3)];
    const cs = text.split(', ');
    const h = Math.ceil(cs.length / 2);
    return [cs.slice(0, h).join(', '), cs.slice(h).join(', ')];
}

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
    localStorage.setItem("skull_permDef",    Game.permDefLvl    || 0);
    localStorage.setItem("skull_permAtkSpd", Game.permAtkSpdLvl || 0);
    localStorage.setItem("skull_permDash",  Game.permDashLvl || 0);
    localStorage.setItem("skull_permCritDmg", Game.permCritDmgLvl || 0);
    localStorage.setItem("skull_permMp",    Game.permMpLvl || 0);
}

// 완만한 우상향 비용: base * (1 + lvl*0.6)
// 예) base=4: 4, 6, 9, 12, 16, 19... (선형에 가까움)
function _shopCost(base, lvl) { return Math.floor(base * (1 + lvl * 0.6)); }

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
