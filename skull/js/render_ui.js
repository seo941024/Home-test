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
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#2a0b4e"); 
    bgGrd.addColorStop(1, "#05020a"); 
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = "#ffcc00"; 
    ctx.font = "28px SkullFont, NeoDunggeunmo"; 
    ctx.textAlign = "center";
    ctx.shadowBlur = 10; 
    ctx.shadowColor = "#aa00ff";
    ctx.fillText("클래스 선택", CW/2, 45);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "#aaa"; 
    ctx.font = "12px SkullFont, NeoDunggeunmo";
    ctx.fillText("(좌/우 방향키 이동, 스페이스바로 결정, S키로 상점 이동)", CW/2, 70);

    const classes = [
        { name: "검사 (Sword)", hp: 50, atk: 30, desc: "[근거리] 밸런스가 가장 잘 잡힌 기본 스컬 클래스입니다." },
        { name: "도적 (Rogue)", hp: 35, atk: 20, desc: "[근거리] 매우 빠른 이동속도와 짧은 대쉬 쿨타임을 가집니다." },
        { name: "마법사 (Wizard)", hp: 40, atk: 35, desc: "[원거리] 마법 뼈다귀를 발사하며 마나통(150)이 넓습니다." }
    ];

    let boxW = 160;
    let boxH = 220; 
    let startY = 95;
    let totalW = boxW * 3 + 40; 
    let startX = CW/2 - totalW/2;

    for (let i = 0; i < 3; i++) {
        let isSel = (Game.pClass === i);
        let boxX = startX + i*(boxW + 20);
        
        ctx.fillStyle = isSel ? "rgba(255, 200, 0, 0.15)" : "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(boxX, startY, boxW, boxH); 
        
        if (isSel) {
            ctx.strokeStyle = "#ffcc00"; 
            ctx.lineWidth = 3;
            ctx.strokeRect(boxX, startY, boxW, boxH);
            
            if (Math.floor(frameNow / 400) % 2 === 0) {
                ctx.fillStyle = "#ff0055"; 
                ctx.font = "bold 12px SkullFont, NeoDunggeunmo";
                ctx.fillText("▶ PRESS SPACE ◀", boxX + boxW/2, startY + boxH - 15);
            }
        }
        
        ctx.fillStyle = isSel ? "#fff" : "#888";
        ctx.font = "bold 16px SkullFont, NeoDunggeunmo";
        ctx.fillText(classes[i].name, boxX + boxW/2, startY + 30);
        
        ctx.font = "12px SkullFont, NeoDunggeunmo";
        ctx.fillText(`HP: ${classes[i].hp}`, boxX + boxW/2, startY + 60);
        if (Game.permHpLvl > 0) { ctx.fillStyle = "#00ff00"; ctx.fillText(`(+${Game.permHpLvl*10})`, boxX + boxW/2, startY + 75); ctx.fillStyle = isSel ? "#fff" : "#888"; }
        
        ctx.fillText(`ATK: ${classes[i].atk}`, boxX + boxW/2, startY + 95);
        if (Game.permAtkLvl > 0) { ctx.fillStyle = "#00ff00"; ctx.fillText(`(+${Game.permAtkLvl*2})`, boxX + boxW/2, startY + 110); }

        ctx.fillStyle = isSel ? "#00ccff" : "#555";
        ctx.font = "12px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        
        wrapText(ctx, classes[i].desc, boxX + boxW/2, startY + 140, boxW - 20, 16);
    }
    ctx.textAlign = "left";
}

function drawUI() {
    if (Game.gs === "menu" || Game.gs === "class_select" || Game.gs === "shop") return;

    Game.texts.forEach(t => { 
        if (!t.active) return;
        const tx = t.x - Game.camX; 
        if (tx < -20 || tx > CW + 20) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.life / 20);
        ctx.fillStyle = t.color === "#ffffff" ? "#00ccff" : t.color;
        ctx.font = `bold ${t.size || 14}px NeoDunggeunmo`;
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
                ctx.fillText("▼ FATAL STRIKE [C]", stx + stunTarget.w/2, stunTarget.y - 20);
                ctx.shadowBlur = 0; ctx.textAlign = "left";
            }
        }
    }

    if (Game.comboCount > 1) {
        ctx.save();
        const comboX = CW - 170, comboY = 55;
        const isHighCombo = Game.comboCount >= 10;
        const isMegaCombo = Game.comboCount >= 30;
        // 높은 콤보일수록 크게 + 진동
        const shake = isMegaCombo ? (Math.random()-0.5)*3 : 0;
        const scale = isMegaCombo ? 1.3 : (isHighCombo ? 1.15 : 1.0);
        ctx.translate(comboX + shake, comboY);
        ctx.scale(scale, scale);
        // 배경 반투명 박스
        ctx.fillStyle = isMegaCombo ? "rgba(180,0,0,0.25)" : (isHighCombo ? "rgba(100,0,180,0.2)" : "rgba(0,0,0,0.3)");
        ctx.fillRect(-8, -22, 165, 32);
        // 콤보 숫자
        const comboCol = isMegaCombo ? "#ff0000" : (isHighCombo ? "#ff6600" : "#ffcc00");
        ctx.font = `bold ${isMegaCombo ? 26 : (isHighCombo ? 22 : 18)}px NeoDunggeunmo`;
        ctx.fillStyle = comboCol;
        ctx.shadowColor = comboCol; ctx.shadowBlur = isMegaCombo ? 15 : (isHighCombo ? 8 : 4);
        ctx.fillText(`${Game.comboCount} COMBO`, 0, 0);
        ctx.shadowBlur = 0;
        // 콤보 타이머 바
        const barW = 155 * (Game.comboTimer / (150 + Game.pComboDur));
        ctx.fillStyle = "rgba(80,0,0,0.4)"; ctx.fillRect(-5, 6, 155, 5);
        ctx.fillStyle = comboCol; ctx.fillRect(-5, 6, barW, 5);
        ctx.restore();
    }

    if (!Game.enemies.some(e=>e.active && !e.dead) && Game.doors.length > 0 && Game.doors[0].open) {
        ctx.fillStyle = "rgba(0,255,100,0.06)"; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = "#00ccff"; ctx.font = "16px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center"; 
        ctx.fillText("AREA CLEARED → ENTER THE DOOR", CW / 2, 30); ctx.textAlign = "left";
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
        const movPct  = Math.round((Game.pMoveSpdMul || 1) * 100);
        const jmpPct  = Math.round((Game.pJmpMul || 1) * 100);

        ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(10, 50, 120, 112);
        ctx.font = "11px SkullFont, NeoDunggeunmo"; ctx.textAlign = "left";

        const rows = [
            { label: "ATK", val: `${atkVal}`,      col: "#ff8844" },
            { label: "DEF", val: `${Game.pBaseDef}`, col: "#88aaff" },
            { label: "CRIT",val: `${critPct}%`,    col: "#ffcc00" },
            { label: "SPD", val: `${asVal}%`,      col: "#00ffcc" },
            { label: "MOV", val: `${movPct}%`,     col: "#aaffaa" },
            { label: "JMP", val: `${jmpPct}%`,     col: "#ffaaff" },
        ];
        rows.forEach((r, i) => {
            ctx.fillStyle = "#888";
            ctx.fillText(r.label, 16, 64 + i * 16);
            ctx.fillStyle = r.col;
            ctx.fillText(r.val, 46, 64 + i * 16);
        });
    }
    
    // 스태미나/대시/스킬은 위의 하단 게이지 3종으로 통합
    // 체간 게이지 (스턴 가능 적 위에 표시) - drawEntities에서 처리
    if (Game.invT > 85) { ctx.fillStyle = `rgba(255, 0, 0, ${(Game.invT - 85) / 15 * 0.4})`; ctx.fillRect(0, 0, CW, CH); }
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
    }
    
    ctx.textAlign = "left"; ctx.fillStyle = "#00ccff"; ctx.font = "14px SkullFont, NeoDunggeunmo"; 
    ctx.fillText("Enemies: " + Game.enemies.filter(e=>e.active && !e.dead).length, 10, 20);
}
