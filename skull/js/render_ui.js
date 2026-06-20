// ==========================================
// UI / HUD / 클래스선택 렌더링 (UI Renderer)
// ==========================================

// wrapText 헬퍼 (render_stage.js와 공유)
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else { line = testLine; }
    }
    context.fillText(line, x, y);
}

function renderClassSelect(frameNow) {
    // 배경
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#1e0840"); bgGrd.addColorStop(1, "#04010a");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffcc00"; ctx.font = "bold 24px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 10; ctx.shadowColor = "#aa00ff";
    ctx.fillText("직업 선택", CW/2, 35);
    ctx.shadowBlur = 0;

    // ── 9직업 데이터 ──
    const classes = [
        { name:"검사",   color:"#ffffff", diffStars:3,
          hp:60,  atk:70,  def:5,   crit:20, atkSpd:100, movSpd:100,
          ratings:[["체력","중상"],["공격력","상"],["방어","중상"],["공격속도","보통"],["이동속도","보통"],["치명타","중상"]],
          skill:"파워스트라이크", skillDesc:"적을 향해 돌진하며 일도양단한다.",
          passive:"강철의지", passiveDesc:"HP 30% 이하 시 공격력 +25%",
          charDesc:"마왕에게 도전한 용기있는 검사\n패배했지만 상처를 딛고 맞서 싸운다\n검과 방어가 균형잡힌 밸런스형 전사이다.",
          unlockCond: null },
        { name:"도적",   color:"#cc44ff", diffStars:5,
          hp:50,  atk:30,  def:-5,  crit:35, atkSpd:200, movSpd:130,
          ratings:[["체력","중하"],["공격력","중하"],["방어","최하"],["공격속도","최상"],["이동속도","최상"],["치명타","최상"]],
          skill:"새비지블로우", skillDesc:"6연타로 무차별 난도질 후 돌진 마무리.",
          passive:"잔상", passiveDesc:"대시 직후 1.5초간 치명타율 +20%",
          charDesc:"초고속 쌍단검으로\n누구보다 빠르고 높게 이동하며\n눈 앞의 적을 빠르게 섬멸한다.",
          unlockCond: null },
        { name:"마법사", color:"#00ccff", diffStars:2, _default:true,
          hp:40,  atk:50,  def:-5,  crit:18, atkSpd:55,  movSpd:100,
          ratings:[["체력","최하"],["공격력","중하"],["방어","최하"],["공격속도","최하"],["이동속도","보통"],["치명타","중하"]],
          skill:"아크틱 할로우", skillDesc:"수속성 블랙홀를 발사해 적을 여러 번 흡수한다.",
          passive:"연쇄 시전", passiveDesc:"스킬 시전 시 20% 확률로 추가 발사",
          charDesc:"마법능력이 높아 스킬을\n빨리 시전할 수 있으며\n원거리에서 마법탄을 쏘는 것이 특징이다.",
          unlockCond: null },
        { name:"버서커", color:"#ff2200", diffStars:1,
          hp:100, atk:80,  def:10,  crit:12, atkSpd:45,  movSpd:85,
          ratings:[["체력","최상"],["공격력","최상"],["방어","중상"],["공격속도","최하"],["이동속도","하"],["치명타","하"]],
          skill:"인레이지", skillDesc:"공중 도약 후 내려찍어 핏빛 폭발을 일으킨다.",
          passive:"광기", passiveDesc:"처치 시 공격력 +5% (최대 5스택, 15초간 지속)",
          charDesc:"역수 대검으로 지면을 끌며 \n싸우는 전장의 포효자\n 적을 죽일 수록 강해진다.",
          unlockCond: "공격력 120 이상 · 공격속도 60% 이하 동시 달성" },
        { name:"발키리", color:"#aaaaaa", diffStars:2,
          hp:50,  atk:25,  def:-5,  crit:28, atkSpd:250, movSpd:110,
          ratings:[["체력","중하"],["공격력","최하"],["방어","최하"],["공격속도","최상"],["이동속도","중상"],["치명타","상"]],
          skill:"서먼 크루", skillDesc:"10초간 선원 2명을 소환해 함께 싸운다.",
          passive:"현상금", passiveDesc:"엘리트 처치 시 3초간 크리티컬 확정",
          charDesc:"자신의 마력으로 재빠르게 \n총을 장전하며 싸운다.\n 손이 매우 빠르다.",
          unlockCond: "누적 처치 20회" },
        { name:"성기사", color:"#ffcc00", diffStars:4,
          hp:80,  atk:40,  def:15,  crit:10, atkSpd:90,  movSpd:90,
          ratings:[["체력","상"],["공격력","하"],["방어","최상"],["공격속도","중하"],["이동속도","중하"],["치명타","최하"]],
          skill:"헤븐즈콜", skillDesc:"망치를 내리쳐 전방 광역에 신성 충격파를 날린다.",
          passive:"신성방패", passiveDesc:"패링 성공 시 3초간 피해 30% 감소",
          charDesc:"신성력을 이용해 싸우는 수호자\n패링 능력이 매우 탁월하며\n방어력이 올라갈수록 강해진다.",
          unlockCond: "패링 10회" },
        { name:"혈귀", color:"#cc2244", diffStars:4,
          hp:70,  atk:60,  def:-5,  crit:25, atkSpd:110, movSpd:105,
          ratings:[["체력","중상"],["공격력","상"],["방어","최하"],["공격속도","상"],["이동속도","중상"],["치명타","상"]],
          skill:"혈기격", skillDesc:"HP 20% 소모, 전방 광역 흡혈 대참격을 날린다.",
          passive:"흡혈", passiveDesc:"공격 시 40% 확률로 피해량의 일부를 HP로 회복",
          charDesc:"피를 마시며 싸우는 저주받은 존재\n높은 흡혈로 적을 쓰러뜨릴수록\n자신의 생존력이 올라가는 공세형 직업.",
          unlockCond: "한 런에서 피해 1000 이상 받고 클리어" },
        { name:"조커", color:"#ffdd00", diffStars:5,
          hp:55,  atk:42,  def:0,  crit:45, atkSpd:110, movSpd:115,
          ratings:[["체력","중하"],["공격력","중하"],["방어","최하"],["공격속도","상"],["이동속도","상"],["치명타","최상"]],
          skill:"와일드카드", skillDesc:"7장의 카드를 연속으로 투척. 색에 따라 강타/기본/MP 회복 효과.",
          passive:"행운아", passiveDesc:"치명타 45%, 치명타 피해 500% / 카드 색에 따라 MP 회복",
          charDesc:"모든 직업을 해금한 자만 선택 가능한 최종 직업\n빨강(강타)·검정(기본)·파랑(MP 회복) 카드를 무작위 투척\n와일드카드 스킬로 7장을 연속으로 날린다.",
          unlockCond: "모든 캐릭터 해금" },
    ];

    const RATING_COLORS = {
        "최상":"#00ffaa", "상":"#88ff44", "중상":"#ccff44",
        "보통":"#aaaaaa", "중하":"#ffcc44", "하":"#ff8844", "최하":"#ff4444"
    };

    const cur = Game.pClass || 0;
    const cl  = classes[cur];
    const isUnlocked = (Game.unlockedClasses || Array(8).fill(0).map((v,i)=>i<3?1:0))[cur] === 1;

    const slideDir = Game._classSlideDir || 0;
    const slideT   = Game._classSlideT !== undefined ? Game._classSlideT : 1;
    const eased    = slideT < 1 ? 1 - Math.pow(1 - slideT, 2) : 1;

    // ── 2패널 카드 (CW=640 기준, 좌우 대칭) ──
    const CARD_X = 8,  CARD_Y = 58;
    const CARD_W = 624, CARD_H = 275;
    const PANEL_W = 306;               // 좌=우 동일 너비
    const DIV_X  = CARD_X + PANEL_W;  // 구분선 x=314
    const DIV_W  = 12;
    const LC = CARD_X + PANEL_W / 2;         // 왼쪽 패널 중심 = 8+153 = 161
    const RC = DIV_X + DIV_W + PANEL_W / 2;  // 오른쪽 패널 중심 = 314+12+153 = 479
    const CARD_CX = CARD_X + CARD_W / 2;     // 카드 전체 중심 = 320

    const slideOff = slideDir !== 0 && eased < 1
        ? Math.round((CARD_W + 20) * slideDir * (1 - eased))
        : 0;

    const _blink = Math.floor(frameNow / 700) % 2 === 0;

    const r = parseInt(cl.color.slice(1,3),16);
    const g = parseInt(cl.color.slice(3,5),16);
    const b = parseInt(cl.color.slice(5,7),16);

    ctx.save();
    ctx.beginPath(); ctx.rect(0, 50, CW, CH - 50); ctx.clip();

    ctx.save();
    ctx.translate(slideOff, 0);

    // ── 카드 배경 & 테두리 ──
    ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;
    ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
    ctx.strokeStyle = cl.color; ctx.lineWidth = 2;
    ctx.shadowBlur = 10; ctx.shadowColor = cl.color;
    ctx.strokeRect(CARD_X, CARD_Y, CARD_W, CARD_H);
    ctx.shadowBlur = 0;

    // ── 중앙 구분선 (하단 SPACE 공간 확보) ──
    ctx.fillStyle = `rgba(${r},${g},${b},0.20)`;
    ctx.fillRect(DIV_X + 4, CARD_Y + 10, 3, CARD_H - 47);  // 하단 36px 남기고 끊음

    // ════════════════════════════════
    // 왼쪽 패널
    // ════════════════════════════════

    // 직업명
    ctx.fillStyle = cl.color;
    ctx.font = "bold 26px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "center";
    ctx.shadowBlur = 10; ctx.shadowColor = cl.color;
    ctx.fillText(cl.name, LC, CARD_Y + 30);
    ctx.shadowBlur = 0;

    // 난이도 별
    const starStr = "★".repeat(cl.diffStars) + "☆".repeat(5 - cl.diffStars);
    ctx.font = "14px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = "#ffcc44";
    ctx.shadowBlur = 4; ctx.shadowColor = "#ffaa00";
    ctx.fillText("난이도  " + starStr, LC, CARD_Y + 50);
    ctx.shadowBlur = 0;

    // 구분선 A
    const DA_Y = CARD_Y + 60;
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(CARD_X + 10, DA_Y); ctx.lineTo(CARD_X + PANEL_W - 4, DA_Y); ctx.stroke();

    // 스킬명
    ctx.fillStyle = cl.color;
    ctx.font = "bold 16px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 5; ctx.shadowColor = cl.color;
    ctx.fillText("스킬: " + cl.skill, LC, DA_Y + 40);
    ctx.shadowBlur = 0;

    // 스킬 설명
    ctx.fillStyle = "#ccccee";
    ctx.font = "13px SkullFont, NeoDunggeunmo";
    const skMaxW = PANEL_W - 20;
    let skLine = "", skY = DA_Y + 62;
    for (let i = 0; i < cl.skillDesc.length; i++) {
        const test = skLine + cl.skillDesc[i];
        if (ctx.measureText(test).width > skMaxW && skLine.length > 0) {
            ctx.fillText(skLine, LC, skY); skLine = cl.skillDesc[i]; skY += 18;
        } else { skLine = test; }
    }
    if (skLine) ctx.fillText(skLine, LC, skY);

    // 구분선 B
    const DB_Y = DA_Y + 96;
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(CARD_X + 10, DB_Y); ctx.lineTo(CARD_X + PANEL_W - 4, DB_Y); ctx.stroke();

    // 패시브 헤더
    ctx.fillStyle = "#ffdd88";
    ctx.font = "bold 15px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "center";
    ctx.shadowBlur = 4; ctx.shadowColor = "#cc8800";
    ctx.fillText("[ 패시브 ]  " + cl.passive, LC, DB_Y + 40);
    ctx.shadowBlur = 0;

    // 패시브 설명
    ctx.fillStyle = "#bbbbcc";
    ctx.font = "13px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "center";
    let paLine = "", paY = DB_Y + 60;
    for (let i = 0; i < cl.passiveDesc.length; i++) {
        const test = paLine + cl.passiveDesc[i];
        if (ctx.measureText(test).width > skMaxW && paLine.length > 0) {
            ctx.fillText(paLine, LC, paY); paLine = cl.passiveDesc[i]; paY += 16;
        } else { paLine = test; }
    }
    if (paLine) ctx.fillText(paLine, LC, paY);

    // ════════════════════════════════
    // 오른쪽 패널
    // ════════════════════════════════
    const RX = DIV_X + DIV_W; // 오른쪽 패널 시작 x = 326

    // ── 상단: 스탯 수치 (다크쿼츠 보너스 포함) ──
    const bonusHp     = (Game.permHpLvl    || 0) * 10;
    const bonusAtk    = (Game.permAtkLvl   || 0) * 2;
    const bonusCrit   = (Game.permCritLvl  || 0) * 2;
    const bonusSpd    = (Game.permSpdLvl   || 0) * 4;
    const bonusDef    = (Game.permDefLvl   || 0) * 2;
    const bonusAtkSpd = (Game.permAtkSpdLvl|| 0) * 5;

    const defVal = cl.def >= 0 ? "+" + cl.def : String(cl.def);
    const statPairs = [
        [{ lbl:"체력",     val:`${cl.hp}`,      bonus: bonusHp     > 0 ? `+${bonusHp}`      : "", col:"#ff8888" },
         { lbl:"공격력",   val:`${cl.atk}`,     bonus: bonusAtk    > 0 ? `+${bonusAtk}`     : "", col:"#ffaa66" }],
        [{ lbl:"방어",     val:defVal,           bonus: bonusDef    > 0 ? `+${bonusDef}`     : "", col:"#88ff88" },
         { lbl:"치명타",   val:`${cl.crit}%`,   bonus: bonusCrit   > 0 ? `+${bonusCrit}%`   : "", col:"#ff88cc" }],
        [{ lbl:"공격속도", val:`${cl.atkSpd}%`, bonus: bonusAtkSpd > 0 ? `+${bonusAtkSpd}%` : "", col:"#ffee88" },
         { lbl:"이동속도", val:`${cl.movSpd}%`, bonus: bonusSpd    > 0 ? `+${bonusSpd}%`    : "", col:"#88ccff" }],
    ];

    const STAT_TOP = CARD_Y + 16;
    const STAT_ROW_H = 26;
    const CELL_W = 144, LBL_W = 58;
    const STAT_BX = RX + 4;

    ctx.font = "14px SkullFont, NeoDunggeunmo";
    statPairs.forEach((pair, row) => {
        const sy = STAT_TOP + row * STAT_ROW_H + 11;
        pair.forEach((st, col) => {
            const cellX = STAT_BX + col * CELL_W;
            ctx.fillStyle = "#888";
            ctx.textAlign = "right";
            ctx.fillText(st.lbl, cellX + LBL_W, sy);
            ctx.fillStyle = st.col;
            ctx.textAlign = "left";
            ctx.fillText(st.val, cellX + LBL_W + 5, sy);
            if (st.bonus) {
                const valW = ctx.measureText(st.val).width;
                ctx.fillStyle = "#df40ff";
                ctx.fillText(st.bonus, cellX + LBL_W + 5 + valW + 2, sy);
            }
        });
    });

    // 구분선 (스탯/배지 경계)
    const RDIV_Y = STAT_TOP + 3 * STAT_ROW_H + 10;
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(RX + 6, RDIV_Y); ctx.lineTo(RX + PANEL_W - 4, RDIV_Y); ctx.stroke();

    // ── 하단: 등급 배지 ──
    const BADGE_COLS = 3;
    const BADGE_W = 92, BADGE_H = 28, BADGE_GAP_X = 4, BADGE_GAP_Y = 6;
    const badgeBlockW = BADGE_COLS * BADGE_W + (BADGE_COLS - 1) * BADGE_GAP_X;
    const badgeSX = RX + (PANEL_W - badgeBlockW) / 2;
    const badgeSY = RDIV_Y + 10;

    (cl.ratings || []).forEach((rt, i) => {
        const col = i % BADGE_COLS, row = Math.floor(i / BADGE_COLS);
        const tx = badgeSX + col * (BADGE_W + BADGE_GAP_X);
        const ty = badgeSY + row * (BADGE_H + BADGE_GAP_Y);
        const rCol = RATING_COLORS[rt[1]] || "#aaaaaa";
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(tx, ty, BADGE_W, BADGE_H);
        ctx.strokeStyle = rCol + "99"; ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, BADGE_W, BADGE_H);
        ctx.fillStyle = "#888";
        ctx.font = "12px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "left";
        ctx.fillText(rt[0], tx + 6, ty + 17);
        ctx.fillStyle = rCol;
        ctx.font = "bold 12px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "right";
        ctx.fillText(rt[1], tx + BADGE_W - 6, ty + 17);
    });

    // ── 배지 아래 구분선 + 캐릭터 설명 ──
    const badgeBlockH = 2 * (BADGE_H + BADGE_GAP_Y);
    const descDivY = badgeSY + badgeBlockH + 4;
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(RX + 10, descDivY); ctx.lineTo(RX + PANEL_W - 10, descDivY); ctx.stroke();
    if (cl.charDesc) {
        ctx.fillStyle = "#aaaaaa";
        ctx.font = "13px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        cl.charDesc.split("\n").forEach((line, i) => {
            ctx.fillText(line, RX + PANEL_W / 2, descDivY + 20 + i * 16);
        });
    }

    // ── SPACE 선택 (카드 정중앙 하단) ──
    ctx.font = "bold 15px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "center";
    if (_blink) {
        ctx.fillStyle = cl.color;
        ctx.shadowBlur = 8; ctx.shadowColor = cl.color;
    } else {
        const _dr = Math.floor(r * 0.3).toString(16).padStart(2,'0');
        const _dg = Math.floor(g * 0.3).toString(16).padStart(2,'0');
        const _db = Math.floor(b * 0.3).toString(16).padStart(2,'0');
        ctx.fillStyle = `#${_dr}${_dg}${_db}`;
        ctx.shadowBlur = 0;
    }
    ctx.fillText("▶  SPACE 선택  ◀", CARD_CX, CARD_Y + CARD_H - 16);
    ctx.shadowBlur = 0;

    // ── 해금 오버레이 (미해금 시) ──
    if (!isUnlocked) {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);

        const boxW = 420, boxH = 80;
        const boxX = CARD_CX - boxW / 2;
        const boxY = CARD_Y + (CARD_H - boxH) / 2;

        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = cl.color; ctx.lineWidth = 2;
        ctx.shadowBlur = 14; ctx.shadowColor = cl.color;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.shadowBlur = 0;

        ctx.fillStyle = cl.color;
        ctx.font = "bold 14px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.shadowBlur = 8; ctx.shadowColor = cl.color;
        ctx.fillText("[ 해금 조건 ]", CARD_CX, boxY + 24);
        ctx.shadowBlur = 0;

        ctx.fillStyle = cl.color;
        ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
        ctx.shadowBlur = 6; ctx.shadowColor = cl.color;
        ctx.fillText(cl.unlockCond || "", CARD_CX, boxY + 46);
        ctx.shadowBlur = 0;

        const prog = _getUnlockProgress(cur);
        if (prog) {
            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.font = "11px SkullFont, NeoDunggeunmo";
            ctx.fillText(prog, CARD_CX, boxY + 64);
        }

        if ((Game._classLockFlash || 0) > 0) {
            Game._classLockFlash--;
            ctx.fillStyle = cl.color;
            ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
            ctx.shadowBlur = 8; ctx.shadowColor = "#ff0000";
            ctx.fillText("해금 조건을 달성하세요!", CARD_CX, CARD_Y + CARD_H - 18);
            ctx.shadowBlur = 0;
        }
    }

    ctx.restore(); // translate

    // ── 페이지 인디케이터 (8직업) ──
    const _dotVc = typeof VALID_CLASSES !== 'undefined' ? VALID_CLASSES : [0,1,2,3,4,5,6,7];
    for (let i = 0; i < _dotVc.length; i++) {
        const _cid = _dotVc[i];
        const dotX = CW/2 - ((_dotVc.length - 1) / 2) * 10 + i * 10;
        const dotY = CARD_Y + CARD_H + 14;
        const ulk = (Game.unlockedClasses || Array(8).fill(0))[_cid] === 1;
        ctx.fillStyle = _cid === cur ? "#ffcc00" : (ulk ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)");
        ctx.beginPath(); ctx.arc(dotX, dotY, _cid === cur ? 5 : 3, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore(); // clip

    // ── ESC 돌아가기 (우측 상단) ──
    ctx.save();
    ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "right";
    if (_blink) { ctx.fillStyle = "#aaaaaa"; ctx.shadowBlur = 0; }
    else         { ctx.fillStyle = "#444444"; ctx.shadowBlur = 0; }
    ctx.fillText("[ESC]  돌아가기", CW - 14, 20);
    ctx.restore();

    // ── 하단 힌트 ──
    ctx.save();
    ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "left";
    if (_blink) { ctx.fillStyle = "#00ffee"; ctx.shadowBlur = 8; ctx.shadowColor = "#00cccc"; }
    else         { ctx.fillStyle = "#006655"; ctx.shadowBlur = 0; }
    ctx.fillText("← → 이동", 16, CH - 10);
    ctx.shadowBlur = 0; ctx.restore();

    ctx.save();
    ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "right";
    if (_blink) { ctx.fillStyle = "#cc66ff"; ctx.shadowBlur = 9; ctx.shadowColor = "#aa22ff"; }
    else         { ctx.fillStyle = "#4a2266"; ctx.shadowBlur = 0; }
    ctx.fillText("S  다크 쿼츠 시스템", CW - 14, CH - 10);
    ctx.shadowBlur = 0; ctx.restore();

    ctx.textAlign = "left"; ctx.lineWidth = 1;
}

function _getUnlockProgress(classIdx) {
    switch(classIdx) {
        case 4: return `처치: ${Game.totalKills || 0} / 20회`;
        case 5: return `패링: ${Game.totalParryCount || 0} / 10회`;
        case 6: {
            const s = (Game.permHpLvl||0)+(Game.permAtkLvl||0)+(Game.permCritLvl||0)+(Game.permSpdLvl||0)
                    +(Game.permDefLvl||0)+(Game.permAtkSpdLvl||0)+(Game.permDashLvl||0)+(Game.permCritDmgLvl||0)+(Game.permMpLvl||0);
            return `영구 강화 합산: ${s} / 5`;
        }
        case 7: return `처치: ${Game.totalKills || 0} / 30회`;
        case 8: return `한 런에서 피해 1000 이상 받고 클리어`;
        case 9: return `패링: ${Game.totalParryCount || 0} / 20회`;
        case 10: return `스킬 사용: ${Game.totalSkillUses || 0} / 15회`;
        case 11: return `엘리트 처치: ${Game.totalEliteKills || 0} / 10회`;
        case 12: return `처치: ${Game.totalKills || 0} / 50회`;
        case 13: {
            const s = (Game.permHpLvl||0)+(Game.permAtkLvl||0)+(Game.permCritLvl||0)+(Game.permSpdLvl||0)
                    +(Game.permDefLvl||0)+(Game.permAtkSpdLvl||0)+(Game.permDashLvl||0)+(Game.permCritDmgLvl||0)+(Game.permMpLvl||0);
            return `영구 강화 합산: ${s} / 10`;
        }
        case 14: return `스킬 사용: ${Game.totalSkillUses || 0} / 30회`;
        case 15: return `처치: ${Game.totalKills || 0} / 100회`;
        case 16: return `엘리트 처치: ${Game.totalEliteKills || 0} / 30회`;
        case 17: {
            const s = (Game.permHpLvl||0)+(Game.permAtkLvl||0)+(Game.permCritLvl||0)+(Game.permSpdLvl||0)
                    +(Game.permDefLvl||0)+(Game.permAtkSpdLvl||0)+(Game.permDashLvl||0)+(Game.permCritDmgLvl||0)+(Game.permMpLvl||0);
            return `영구 강화 합산: ${s} / 15`;
        }
        case 18: return `영구 방어 레벨: ${Game.permDefLvl || 0} / 3`;
        default: return null;
    }
}
function drawUI() {
    if (Game.gs === "menu" || Game.gs === "class_select" || Game.gs === "shop") return;

    Game.texts.forEach(t => {
        if (!t.active) return;
        const tx = t.x - Game.camX;
        if (tx < -20 || tx > CW + 20) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.life / 20);
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size || 14}px SkullFont, NeoDunggeunmo`;
        // 데미지 텍스트에 그림자 효과
        if (t.color === "#ff0000" || t.color === "#ffcc00" || t.color === "#ff6600") {
            ctx.shadowBlur = 4; ctx.shadowColor = t.color;
        }
        ctx.fillText(t.text, tx, t.y);
        ctx.shadowBlur = 0;
        ctx.restore();
    });

    // Fatal Strike 가능 표시 (스턴 상태 근접 적이 있을 때)
    if (typeof canExecute === 'function') {
        const stunTarget = Game.enemies && Game.enemies.find(e => e.active && !e.dead && e.stun && canExecute(e));
        if (stunTarget) {
            const stx = stunTarget.x - Game.camX;
            const blink = Math.floor(Date.now() / 300) % 2 === 0;
            if (blink) {
                ctx.fillStyle = "#ff0000";
                ctx.font = "bold 13px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                ctx.shadowBlur = 8; ctx.shadowColor = "#ff0000";
                ctx.fillText("▼ 처형 공격 [C]", stx + stunTarget.w/2, stunTarget.y - 20);
                ctx.shadowBlur = 0; ctx.textAlign = "left";
            }
        }
    }

   if (Game.comboCount > 1) {
    ctx.save();

    const comboX = CW - 170;
    const comboY = 55;

    const isHighCombo = Game.comboCount >= 10;
    const isMegaCombo = Game.comboCount >= 30;

    // 높은 콤보일수록 크게 + 진동
    const shake = isMegaCombo ? (Math.random() - 0.5) * 3 : 0;
    const scale = isMegaCombo ? 1.3 : (isHighCombo ? 1.15 : 1.0);

    ctx.translate(comboX + shake, comboY);
    ctx.scale(scale, scale);

    // 배경 반투명 박스
    ctx.fillStyle = isMegaCombo
        ? "rgba(180,0,0,0.25)"
        : (isHighCombo
            ? "rgba(100,0,180,0.2)"
            : "rgba(0,0,0,0.3)");

    ctx.fillRect(-8, -22, 165, 32);

    // 콤보 숫자
    const comboCol = isMegaCombo
        ? "#ff0000"
        : (isHighCombo ? "#fdd85e" : "#e7e7e7");

    ctx.font = `bold ${
        isMegaCombo ? 26 : (isHighCombo ? 22 : 18)
    }px SkullFont`;

    ctx.fillStyle = comboCol;
    ctx.shadowColor = comboCol;
    ctx.shadowBlur = isMegaCombo ? 15 : (isHighCombo ? 8 : 4);

    ctx.fillText(`${Game.comboCount} 콤보`, 0, 0);

    ctx.shadowBlur = 0;

    // 콤보 타이머 바
    const barW = 155 * (Game.comboTimer / (150 + Game.pComboDur));

    ctx.fillStyle = "rgba(80,0,0,0.4)";
    ctx.fillRect(-5, 6, 155, 5);

    ctx.fillStyle = comboCol;
    ctx.fillRect(-5, 6, barW, 5);

    ctx.restore();
}

if (
    !Game.enemies.some(e => e.active && !e.dead) &&
    Game.doors.length > 0 &&
    Game.doors[0].open
) {
    ctx.fillStyle = "rgba(0,255,100,0.06)";
    ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = "#00ccff";
    ctx.font = "16px SkullFont";
    ctx.textAlign = "center";

    ctx.fillText(
        "구역 정화 완료 → 문으로 입장하세요.",
        CW / 2,
        30
    );

    ctx.textAlign = "left";
}

    // ── 게이지 3종은 index.html DOM 요소(ui-skill 등)로 표시 — 캔버스 중복 렌더링 제거 ──
    
    if (Game.gs === "play" || Game.gs === "dead" || Game.gs === "boss_intro") {
        // 스탯창: ATK→DEF→CRIT→SPD→MOV→JMP 세로 정렬, 쿼츠/스테이지/킬 제거
        const atkVal = Math.floor(
            Game.pBaseDmg * (Game.pBaseDmgMul || 1)
            * (Game.pFinalDmgMul || 1) * (1 + (Game.pExtraDmg || 0))
        );
        const asVal  = Math.round((Game.pBaseAtkSpd || 1) * (Game.pAtkSpdMul || 1) * 100);
        const critPct = Math.round((Game.pCritChance || 0.2) * 100);
        const _maxMovPct = Game.pClass === 1 ? 200 : 160;
        const _maxJmpPct = Game.pClass === 1 ? 170 : 140;
        const movPct  = Math.min(_maxMovPct, Math.round((Game.pMoveSpdMul || 1) * 100));
        const jmpPct  = Math.min(_maxJmpPct, Math.round((Game.pJmpMul || 1) * 100));

        ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(10, 50, 138, 132);
        ctx.font = "13px SkullFont, NeoDunggeunmo"; ctx.textAlign = "left";

        const rows = [
            { label: "공격력",   val: `${atkVal}`       },
            { label: "방어력",   val: `${Game.pBaseDef}` },
            { label: "치명타",   val: `${critPct}%`     },
            { label: "공격속도", val: `${asVal}%`       },
            { label: "이동속도", val: `${movPct}%`      },
            { label: "점프력",   val: `${jmpPct}%`      },
        ];
        rows.forEach((r, i) => {
            ctx.fillStyle = "#aaaaaa";
            ctx.fillText(r.label, 16, 75 + i * 19);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(r.val, 78, 75 + i * 19);
        });
    }
    
    // 스태미나/대시/스킬은 위의 하단 게이지 3종으로 통합
    // 체간 게이지 (스턴 가능 적 위에 표시) - drawEntities에서 처리
    if (Game.invT > 85) { ctx.fillStyle = `rgba(255, 0, 0, ${(Game.invT - 85) / 15 * 0.4})`; ctx.fillRect(0, 0, CW, CH); }
    // 헤븐즈콜 — 하늘에서 내리꽂히는 신성 십자가 (강화판)
    if ((Game._paladinCrossT || 0) > 0) {
        Game._paladinCrossT--;
        const ct    = Game._paladinCrossT;
        const TOTAL = 65;
        const cx_     = (Game._paladinCrossX || CW/2) - (Game.camX || 0);
        const groundY = Game._paladinCrossY || (CH - 60);
        const prog    = 1 - ct / TOTAL;
        const alpha   = ct < 20 ? ct / 20 : (prog < 0.06 ? prog / 0.06 : 1);
        ctx.save();

        // ── 낙하 단계 (prog 0→0.55): 화면 위 → groundY ──
        const fallP  = Math.min(prog / 0.55, 1.0);
        const eased  = 1 - Math.pow(1 - fallP, 3);
        const crossTop = -240 + eased * (groundY - 60 + 240);

        // 크기: 낙하 중 0.6→1.2 (더 크게)
        const sc = 0.6 + eased * 0.6;
        const H  = Math.round(170 * sc);
        const W  = Math.round(22  * sc);
        const AW = Math.round(130 * sc);
        const AH = Math.round(22  * sc);
        const armY = crossTop + Math.round(H * 0.3);

        // ── 배경 전체 엷은 황금빛 (낙하~착지 구간) ──
        if (prog < 0.65) {
            ctx.globalAlpha = alpha * eased * 0.12;
            ctx.fillStyle = "#ffeeaa";
            ctx.fillRect(0, 0, CW, CH);
        }

        // ── 하늘 빛기둥 (화면 전체 위에서 crossTop까지, 매우 넓고 밝게) ──
        ctx.globalAlpha = alpha * 0.65;
        const beamW = W * 2.5;
        const beamGrd = ctx.createLinearGradient(cx_, 0, cx_, crossTop);
        beamGrd.addColorStop(0, "rgba(255,255,200,0)");
        beamGrd.addColorStop(0.5, `rgba(255,240,100,0.22)`);
        beamGrd.addColorStop(1, `rgba(255,220,40,0.70)`);
        ctx.fillStyle = beamGrd;
        ctx.fillRect(cx_ - beamW * 1.5, 0, beamW * 3, Math.max(0, crossTop));
        // 보조 넓은 빛기둥
        ctx.globalAlpha = alpha * 0.25;
        ctx.fillStyle = beamGrd;
        ctx.fillRect(cx_ - AW * 1.2, 0, AW * 2.4, Math.max(0, crossTop));

        // ── 후광 (십자가 중심부) ──
        ctx.globalAlpha = alpha;
        const gCY = crossTop + H * 0.3;
        const glowR = 130 * sc;
        const grd = ctx.createRadialGradient(cx_, gCY, 0, cx_, gCY, glowR);
        grd.addColorStop(0,   `rgba(255,255,200,${alpha * 0.7})`);
        grd.addColorStop(0.35,`rgba(255,220,60,${alpha * 0.35})`);
        grd.addColorStop(0.7, `rgba(255,180,0,${alpha * 0.12})`);
        grd.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(cx_, gCY, glowR, 0, Math.PI*2); ctx.fill();

        // ── 십자가 본체 ──
        ctx.globalAlpha = alpha;
        // shadowBlur 없이 먼저 본체 그리기 (shadow가 십자가 위에 네모 잔상 남기는 현상 방지)
        ctx.shadowBlur = 0;
        // 세로 본체
        ctx.fillStyle = `rgba(255,230,50,1)`;
        ctx.fillRect(cx_ - W/2, crossTop, W, H);
        ctx.fillStyle = `rgba(255,255,220,0.95)`;
        ctx.fillRect(cx_ - W*0.25, crossTop + 2, W*0.5, H - 4);
        // 가로 본체
        ctx.fillStyle = `rgba(255,230,50,1)`;
        ctx.fillRect(cx_ - AW/2, armY, AW, AH);
        ctx.fillStyle = `rgba(255,255,220,0.95)`;
        ctx.fillRect(cx_ - AW/2 + 2, armY + AH*0.2, AW - 4, AH*0.6);

        // 발광 테두리는 radial gradient로 (flat rect shadow 잔상 없이)
        ctx.shadowBlur = 28; ctx.shadowColor = "#ffe060";
        ctx.strokeStyle = `rgba(255,240,100,${alpha * 0.85})`; ctx.lineWidth = 3;
        ctx.strokeRect(cx_ - W/2 - 1, crossTop - 1, W + 2, H + 2);
        ctx.strokeRect(cx_ - AW/2 - 1, armY - 1, AW + 2, AH + 2);
        ctx.shadowBlur = 0;

        // 4방향 끝 보석 장식
        ctx.shadowBlur = 18; ctx.shadowColor = "#ffe880";
        [[cx_, crossTop],[cx_, crossTop+H],[cx_-AW/2, armY+AH/2],[cx_+AW/2, armY+AH/2]].forEach(([ex,ey])=>{
            ctx.fillStyle = `rgba(255,255,160,${alpha})`;
            ctx.beginPath(); ctx.arc(ex, ey, 7 * sc, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${alpha*0.85})`;
            ctx.beginPath(); ctx.arc(ex, ey, 3.5 * sc, 0, Math.PI*2); ctx.fill();
        });
        ctx.shadowBlur = 0;

        // ── 착지 충격파 3중 링 (prog 0.52~0.85) ──
        if (prog > 0.52 && prog < 0.85) {
            const sp  = (prog - 0.52) / 0.33;
            const sw1 = 220 * Math.sqrt(sp);
            const sw2 = 140 * Math.sqrt(sp);
            const sw3 =  70 * Math.sqrt(sp);
            const sa  = (1 - sp) * alpha;
            ctx.strokeStyle = `rgba(255,220,60,${sa * 1.0})`; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(cx_, groundY, sw1, 0, Math.PI*2); ctx.stroke();
            ctx.strokeStyle = `rgba(255,240,140,${sa * 0.7})`; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(cx_, groundY, sw2, 0, Math.PI*2); ctx.stroke();
            ctx.strokeStyle = `rgba(255,255,220,${sa * 0.55})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx_, groundY, sw3, 0, Math.PI*2); ctx.stroke();
            // 지면 수평 빛 (넓게)
            const hg = ctx.createLinearGradient(cx_ - sw1, groundY, cx_ + sw1, groundY);
            hg.addColorStop(0, "rgba(255,220,80,0)");
            hg.addColorStop(0.5, `rgba(255,235,100,${sa * 0.5})`);
            hg.addColorStop(1, "rgba(255,220,80,0)");
            ctx.fillStyle = hg;
            ctx.fillRect(cx_ - sw1, groundY - 7, sw1 * 2, 14);
        }

        // ── 착지 섬광 (prog 0.50~0.64) — 더 강하게 ──
        if (prog > 0.50 && prog < 0.64) {
            const f = 1 - Math.abs(prog - 0.57) / 0.07;
            ctx.globalAlpha = f * 0.42 * alpha;
            ctx.fillStyle = "#fffff0";
            ctx.fillRect(0, 0, CW, CH);
            ctx.globalAlpha = alpha;
        }

        // ── 착지 후 8방향 광선 (prog 0.55~0.92) ──
        if (prog > 0.55 && prog < 0.92) {
            const rp = (prog - 0.55) / 0.37;
            const rl = 130 * rp;
            const ra = (1 - rp) * alpha * 0.85;
            // 4 축방향
            ctx.strokeStyle = `rgba(255,240,100,${ra})`; ctx.lineWidth = 4;
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dy])=>{
                ctx.beginPath(); ctx.moveTo(cx_, groundY);
                ctx.lineTo(cx_ + dx * rl, groundY + dy * rl); ctx.stroke();
            });
            // 4 대각선 (얇게)
            ctx.strokeStyle = `rgba(255,230,80,${ra * 0.6})`; ctx.lineWidth = 2;
            const d45 = rl * 0.707;
            [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{
                ctx.beginPath(); ctx.moveTo(cx_, groundY);
                ctx.lineTo(cx_ + dx * d45, groundY + dy * d45); ctx.stroke();
            });
        }

        // ── 착지 파편 (prog 0.53~0.75): 황금 파티클 방사 ──
        if (prog > 0.53 && prog < 0.75) {
            const fp = (prog - 0.53) / 0.22;
            ctx.fillStyle = `rgba(255,220,60,${(1-fp) * alpha * 0.8})`;
            for (let fi = 0; fi < 8; fi++) {
                const fang = fi * Math.PI / 4 + fp * 0.5;
                const fdist = 60 * fp;
                const fx = cx_ + Math.cos(fang) * fdist;
                const fy = groundY + Math.sin(fang) * fdist * 0.4;
                ctx.beginPath(); ctx.arc(fx, fy, 3 * (1-fp), 0, Math.PI*2); ctx.fill();
            }
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // 필살기 플래시
    if (Game.skillFlashT > 0) {
        Game.skillFlashT--;
        const sfAlpha = Game.skillFlashT / 20;
        ctx.fillStyle = Game.skillFlashCol ? Game.skillFlashCol.replace(/[\d.]+\)$/, `${sfAlpha})`) : `rgba(0,200,255,${sfAlpha * 0.3})`;
        ctx.fillRect(0, 0, CW, CH);
    }
    // 슬로모션 비네트 (파란빛 테두리)
    if (Game.slowMoT > 0) {
        const smA = Math.min(1, Game.slowMoT / 18) * 0.4;
        ctx.strokeStyle = `rgba(255,230,0,${smA})`;
        ctx.lineWidth = 6; ctx.strokeRect(3, 3, CW-6, CH-6);
    }
    if (Game.player && Game.player.hp / Game.pMaxHp <= 0.3 && !Game.player.dead) {
        const pulse = (Math.sin(Date.now() / 150) + 1) / 2; ctx.fillStyle = `rgba(150, 0, 0, ${0.1 + pulse * 0.3})`;
        ctx.fillRect(0, 0, CW, 15); ctx.fillRect(0, CH - 15, CW, 15); ctx.fillRect(0, 0, 15, CH); ctx.fillRect(CW - 15, 0, 15, CH); 
    }

    if (Game.player && Game.player.dead) {
        let alpha = 1; if (Game.gs === "dead") { alpha = Math.max(0, Math.min(1, 1 - (Game.deadTimer / 120))); }
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; ctx.fillRect(0, 0, CW, CH);
        if (alpha >= 0.85) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.font = "bold 52px SkullFont, NeoDunggeunmo";
            ctx.fillStyle = "#cc0000";
            ctx.shadowBlur = 24; ctx.shadowColor = "#ff0000";
            ctx.fillText("당신은 죽었습니다", CW / 2, CH / 2);
            ctx.shadowBlur = 0;
            ctx.font = "14px SkullFont, NeoDunggeunmo";
            ctx.fillStyle = "#888";
            ctx.fillText("[ SPACE ] 로비로 복귀", CW / 2, CH / 2 + 38);
            ctx.textAlign = "left";
            ctx.restore();
        }
    }
    // NPC 대화 중 어두운 배경 오버레이 (대화창은 오버레이 위에 다시 그림)
    if (Game.npcTalking) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, CW, CH);
        if (typeof renderNPCDialogsOnly === 'function') renderNPCDialogsOnly(Date.now());
    }
    
    // 헌터 탄약 UI — 플레이어 중앙 기준으로 정렬
    if (Game.pClass === 4 && Game.player && !Game.player.dead) {
        const ammo   = Game.pGunAmmo !== undefined ? Game.pGunAmmo : 8;
        const reload = Game.pGunReload || 0;
        const p = Game.player;
        const pcx = Math.round(p.x + p.w / 2 - Game.camX);
        const pcy = Math.round(p.y);
        const t = Date.now();

        // 탄약 8칸: 각 7px 너비, 간격 2px
        const SLOT = 7, GAP = 2, SLOTS = 8;
        const barW = SLOTS * SLOT + (SLOTS - 1) * GAP; // 69px
        const barX = pcx - Math.floor(barW / 2);
        const barY = pcy - 34;

        // 배경
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(barX - 3, barY - 3, barW + 6, 14, 3);
        else ctx.rect(barX - 3, barY - 3, barW + 6, 14);
        ctx.fill();

        // 탄약 칸
        for (let a = 0; a < SLOTS; a++) {
            const filled = a < ammo;
            // 마지막 2발은 주황으로 경고
            const col = filled ? (ammo <= 2 ? "#ff8800" : "#ffcc00") : "#2a2a2a";
            ctx.fillStyle = col;
            if (filled && ctx.shadowBlur !== undefined) {
                ctx.shadowBlur = ammo <= 2 ? 4 : 0;
                ctx.shadowColor = "#ff8800";
            }
            ctx.fillRect(barX + a * (SLOT + GAP), barY, SLOT, 8);
        }
        ctx.shadowBlur = 0;

        // 재장전 게이지
        if (reload > 0) {
            const reloadMax = Game.pGunReloadMax || 90;
            const prog = 1 - reload / reloadMax;
            const rgY = barY - 16;
            // 배경
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(barX - 3, rgY - 3, barW + 6, 12, 2);
            else ctx.rect(barX - 3, rgY - 3, barW + 6, 12);
            ctx.fill();
            // 트랙
            ctx.fillStyle = "#333";
            ctx.fillRect(barX, rgY, barW, 6);
            // 진행
            const progW = Math.floor(barW * prog);
            const pulse = 0.7 + Math.sin(t * 0.015) * 0.3;
            ctx.fillStyle = `rgba(180,180,180,${pulse})`;
            ctx.fillRect(barX, rgY, progW, 6);
            // 텍스트
            ctx.fillStyle = "#888";
            ctx.font = "9px SkullFont, NeoDunggeunmo";
            ctx.textAlign = "center";
            ctx.fillText("재장전", pcx, rgY - 2);
            ctx.textAlign = "left";
        }
    }



    // ── 조커 UI: 치명타 강조 표시 ──
    if (Game.pClass === 7 && Game.player && !Game.player.dead) {
        const p = Game.player;
        const pcx = Math.round(p.x + p.w/2 - Game.camX);
        const pcy = Math.round(p.y) - 44;
        ctx.fillStyle = "#ffdd00";
        ctx.font = "10px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.fillText(`크리 ${Math.round((Game.pCritChance||0.4)*100)}%`, pcx, pcy);
        ctx.textAlign = "left";
    }


    // 크루 미니언 렌더 (해적 픽셀아트)
    if (Game.crewMinions && Game.crewMinions.length > 0) {
        for (const cm of Game.crewMinions) {
            if (!cm.active) continue;
            const mx = cm.x - Game.camX, my = cm.y;
            const t = Date.now();
            const walk = Math.sin(t * 0.012) * 1.5;
            const legL = Math.sin(t * 0.012) * 3;
            const legR = -legL;
            const facing = cm.facing || 1;
            const lifeRatio = cm.life / 300;
            const flicker = cm.life < 60 ? (Math.floor(t / 80) % 2 === 0 ? 0.5 : 1.0) : 1.0;

            ctx.save();
            ctx.globalAlpha = Math.min(1, cm.life / 40) * flicker;
            ctx.translate(mx, my + walk);
            ctx.scale(facing, 1);

            // 그림자
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.beginPath(); ctx.ellipse(0, 2, 8, 2, 0, 0, Math.PI*2); ctx.fill();

            // 다리 (교차 걸음)
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(-4, 2, 3, 5 + legL * 0.3); // 왼다리
            ctx.fillRect(1, 2, 3, 5 - legL * 0.3);  // 오른다리
            // 부츠
            ctx.fillStyle = "#3d1a00";
            ctx.fillRect(-5, 6 + legL * 0.3, 4, 3);
            ctx.fillRect(0, 6 - legL * 0.3, 4, 3);

            // 조끼 본체
            ctx.fillStyle = "#7a3010"; ctx.fillRect(-5, -6, 10, 9);
            // 조끼 음영
            ctx.fillStyle = "#5a2008"; ctx.fillRect(3, -5, 2, 8);
            ctx.fillStyle = "#9a4020"; ctx.fillRect(-5, -6, 2, 8);
            // 셔츠 (앞 트임)
            ctx.fillStyle = "#e8e8e8"; ctx.fillRect(-2, -5, 4, 6);
            ctx.fillStyle = "#cccccc"; ctx.fillRect(-1, -5, 2, 6);
            // 벨트
            ctx.fillStyle = "#2a1500"; ctx.fillRect(-5, 2, 10, 2);
            ctx.fillStyle = "#d4aa00"; ctx.fillRect(-1, 2, 2, 2); // 버클

            // 팔 (총 든 팔)
            ctx.fillStyle = "#c87040"; ctx.fillRect(5, -5, 3, 6); // 앞팔
            ctx.fillStyle = "#a85828"; ctx.fillRect(5, -4, 1, 5); // 음영

            // 머스켓 총 (더 디테일하게)
            ctx.fillStyle = "#3a2800"; ctx.fillRect(3, -5, 5, 3);  // 개머리판
            ctx.fillStyle = "#2a2a2a"; ctx.fillRect(8, -5, 13, 2); // 총신
            ctx.fillStyle = "#444444"; ctx.fillRect(8, -4, 12, 1); // 하이라이트
            ctx.fillStyle = "#888888"; ctx.fillRect(20, -5, 2, 2); // 총구
            // 총구 화염 (cm.atkT > 0 이면 발사)
            if ((cm.atkT || 0) > 0) {
                ctx.fillStyle = `rgba(255,200,0,${(cm.atkT || 0) / 8})`;
                ctx.beginPath(); ctx.arc(22, -4, 4, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "rgba(255,255,200,0.9)";
                ctx.beginPath(); ctx.arc(22, -4, 2, 0, Math.PI*2); ctx.fill();
            }

            // 얼굴
            ctx.fillStyle = "#c87040"; ctx.fillRect(-4, -14, 8, 8); // 피부
            ctx.fillStyle = "#a85828"; ctx.fillRect(2, -13, 2, 6);  // 음영 (오른뺨)
            // 눈/안대
            ctx.fillStyle = "#111"; ctx.fillRect(-3, -11, 4, 2); // 안대 밴드
            ctx.fillStyle = "#000"; ctx.fillRect(-3, -11, 4, 1); // 안대
            ctx.fillStyle = "#ff3300"; ctx.fillRect(-4, -11, 1, 2); // 안대 매듭
            ctx.fillStyle = "#222"; ctx.fillRect(2, -11, 2, 2);  // 오른눈
            ctx.fillStyle = "#66ccff"; ctx.fillRect(2, -11, 1, 1); // 눈동자 하이라이트
            // 입 (결연한 표정)
            ctx.fillStyle = "#7a3010"; ctx.fillRect(-2, -7, 4, 1);
            // 수염 (짧은 흉터)
            ctx.fillStyle = "#5a2000"; ctx.fillRect(-3, -8, 1, 1); ctx.fillRect(1, -8, 1, 1);

            // 해적 모자 (빨간 두건 + 해적 모자)
            ctx.fillStyle = "#cc1100"; ctx.fillRect(-5, -16, 10, 4); // 두건
            ctx.fillStyle = "#aa0000"; ctx.fillRect(-5, -16, 2, 4); // 두건 음영
            ctx.fillStyle = "#ff2200"; ctx.fillRect(-6, -14, 2, 3); // 두건 매듭
            // 해적 모자
            ctx.fillStyle = "#111"; ctx.fillRect(-4, -20, 8, 5);
            ctx.fillStyle = "#222"; ctx.fillRect(-4, -20, 2, 5);
            ctx.fillStyle = "#333"; ctx.fillRect(-6, -16, 12, 2); // 챙
            // 해골 마크
            ctx.fillStyle = "#f0f0f0"; ctx.fillRect(-1, -19, 2, 2);
            ctx.fillStyle = "#111"; ctx.fillRect(-1, -19, 1, 1); ctx.fillRect(0, -18, 1, 1);

            ctx.restore();

            // 수명 바 (머리 위)
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(mx - 12, my - 30 + walk, 24, 4);
            ctx.fillStyle = lifeRatio > 0.5 ? "#00ffcc" : lifeRatio > 0.25 ? "#ffdd00" : "#ff4444";
            ctx.fillRect(mx - 12, my - 30 + walk, Math.round(24 * lifeRatio), 4);
            ctx.restore();
        }
    }

    ctx.textAlign = "left"; ctx.fillStyle = "#00ccff"; ctx.font = "14px SkullFont, NeoDunggeunmo";
    ctx.fillText("적 수: " + Game.enemies.filter(e=>e.active && !e.dead).length, 10, 20);

    // ── 해금 배너 ──
    if (Game._unlockBanner && Game._unlockBanner.t > 0) {
        const ub = Game._unlockBanner;
        ub.t--;
        const alpha = ub.t < 60 ? ub.t / 60 : (ub.t > 180 ? (240 - ub.t) / 60 : 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        const bw = 320, bh = 50;
        const bx = (CW - bw) / 2, by = 50;
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2;
        ctx.shadowBlur = 14; ctx.shadowColor = "#ffcc00";
        ctx.strokeRect(bx, by, bw, bh);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 11px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.fillText("[ 캐릭터 해금 완료! ]", CW/2, by + 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = "13px SkullFont, NeoDunggeunmo";
        ctx.fillText(ub.name + " 해금!!", CW/2, by + 36);
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}