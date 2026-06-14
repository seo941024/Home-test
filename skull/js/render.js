// ==========================================
// 렌더링 메인 컨트롤러 (Render Controller)
// 모든 렌더링 모듈을 레이어 순서에 따라 호출
// render_stage.js → render_ui.js → render.js(controller)
// ==========================================

function render() {
    ctx.imageSmoothingEnabled = false;
    const frameNow = Date.now();
    const isEven   = Game.worldN % 2 === 0;

    // ── Layer 0: 배경 ──────────────────────
    const tColors = drawBackground(frameNow); // render_stage.js

    // ── Layer 1: 월드 공간 (카메라 쉐이크 적용) ──
    ctx.save();
    if (Game.camShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * Game.camShake,
            (Math.random() - 0.5) * Game.camShake
        );
    }

    // 짝수 월드 어두운 오버레이 — 후반 너무 어두워지지 않도록 월드별 제한
    if (isEven) {
        const darkAmount = Math.min(0.3, 0.12 + Game.worldN * 0.02);
        ctx.fillStyle = `rgba(15, 10, 25, ${darkAmount})`;
        ctx.fillRect(-Game.camX, 0, Game.levelW, CH);
    }

    drawEnvironment(tColors, frameNow); // 발판 + 함정 + 이벤트 오브젝트 (render_stage.js)
    drawEntities(frameNow);             // 적 + 투사체 + 파티클 (render_stage.js)

    ctx.restore();

    // ── Layer 2: HUD / UI (카메라와 독립) ──
    drawUI(); // render_ui.js

    // ── Layer 3: 보스 등장 컷신 오버레이 ──
    if (Game.gs === "boss_intro") {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, 70);
        ctx.fillRect(0, CH - 70, CW, 70);
        ctx.fillStyle = "#ff0033";
        ctx.font = "bold 40px NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20; ctx.shadowColor = "#ff0033";
        const bossName = document.getElementById("bossBarLabel")?.textContent || "";
        ctx.fillText(bossName, CW / 2, CH / 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "18px NeoDunggeunmo";
        if (Math.floor(frameNow / 250) % 2 === 0) {
            ctx.fillText("▶ WARNING ◀", CW / 2, CH / 2 - 48);
        }
        ctx.textAlign = "left";
    }

    // ── Layer 3.5: 보스 처치 대사 말풍선 (비차단 오버레이) ──
    if (Game.bossKillSeq) {
        const seq = Game.bossKillSeq;
        const line = seq.lines[seq.idx];
        if (line) {
            const totalDur = line.duration;
            const elapsed  = totalDur - seq.timer;
            // 페이드인 10프레임, 페이드아웃 마지막 12프레임
            const fadeIn  = Math.min(1, elapsed / 10);
            const fadeOut = Math.min(1, seq.timer / 12);
            const alpha   = Math.min(fadeIn, fadeOut);

            const bx = 14, bw = CW - 28;
            const by = CH - 62, bh = 50;
            const isHero = line.speaker === "해골용사";
            const isNarr = line.speaker === "내레이터";

            ctx.save();
            ctx.globalAlpha = alpha;

            // 말풍선 배경
            ctx.fillStyle   = "rgba(0,0,0,0.90)";
            ctx.strokeStyle = "#444444";
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) { ctx.roundRect(bx, by, bw, bh, 6); }
            else { ctx.rect(bx, by, bw, bh); }
            ctx.fill(); ctx.stroke();

            // 화자명
            ctx.font      = "bold 11px NeoDunggeunmo";
            ctx.fillStyle = "#ffcc00";
            ctx.textAlign = "left";
            ctx.fillText(line.speaker, bx + 10, by + 16);

            // 대사 본문
            ctx.font      = "13px NeoDunggeunmo";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(line.text, bx + 10, by + 35);

            ctx.restore();
        }
    }

    // ── Layer 4: 유물 목록 오버레이 (Tab) ──────────
    if (Game._showItemList) {
        const items = (Game.obtainedItems || []);
        const panW = 260, panX = CW / 2 - panW / 2;
        const rowH = 18, padX = 12, padY = 10;
        const cols = 2, colW = panW / cols;
        const rows = Math.ceil(items.length / cols);
        const panH = padY * 2 + 20 + rows * rowH + (items.length === 0 ? rowH : 0);
        const panY = CH / 2 - panH / 2;

        ctx.save();
        // 배경
        ctx.fillStyle = "rgba(0,0,0,0.88)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(panX, panY, panW, panH, 8);
        else ctx.rect(panX, panY, panW, panH);
        ctx.fill();
        ctx.strokeStyle = "#555555"; ctx.lineWidth = 1.5;
        ctx.stroke();

        // 타이틀
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
        ctx.fillText(`획득 유물 (${items.length})`, CW / 2, panY + padY + 11);

        // 구분선
        ctx.strokeStyle = "#444"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(panX + 8, panY + padY + 17); ctx.lineTo(panX + panW - 8, panY + padY + 17); ctx.stroke();

        // 아이템 목록
        ctx.textAlign = "left";
        ctx.font = "11px SkullFont, NeoDunggeunmo";
        if (items.length === 0) {
            ctx.fillStyle = "#666666";
            ctx.textAlign = "center";
            ctx.fillText("없음", CW / 2, panY + padY + 34);
        } else {
            items.forEach((id, idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const tx = panX + padX + col * colW;
                const ty = panY + padY + 28 + row * rowH;
                const name = UPGRADES[id]?.name?.split(':')[0] ?? `유물 ${id}`;
                ctx.fillStyle = "#dddddd";
                ctx.fillText(`· ${name}`, tx, ty);
            });
        }

        // 닫기 힌트
        ctx.textAlign = "center";
        ctx.fillStyle = "#555555";
        ctx.font = "10px SkullFont, NeoDunggeunmo";
        ctx.fillText("[Tab] 닫기", CW / 2, panY + panH - 5);

        ctx.restore();
    }

    // ── Layer 5: 화면 전환 페이드 ──────────
    if (Game.transT > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Game.transT / 255})`;
        ctx.fillRect(0, 0, CW, CH);
    }


    // ── Layer 6: 리게인 체력 회복 타이머 시각화 ──
    if (Game.player && (Game.player.grayHp || 0) > 0) {
        const timerPct = Math.max(0, (Game.player.regainTimer || 0) / 140);
        ctx.fillStyle = `rgba(255, 80, 0, ${0.25 + (1-timerPct) * 0.2})`;
        ctx.fillRect(0, CH - 3, CW * (1 - timerPct), 3);
        // 회복 촉구 맥동
        if (timerPct < 0.3) {
            const pulse = (Math.sin(frameNow * 0.02) + 1) / 2;
            ctx.fillStyle = `rgba(255, 60, 0, ${pulse * 0.2})`;
            ctx.fillRect(0, 0, CW, CH);
        }
    }
}