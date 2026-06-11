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

    // 짝수 월드 어두운 오버레이
    if (isEven) {
        ctx.fillStyle = "rgba(15, 10, 25, 0.5)";
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

    // ── Layer 4: 화면 전환 페이드 ──────────
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