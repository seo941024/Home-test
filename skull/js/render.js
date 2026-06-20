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

    // ── Layer 4: 유물 목록 오버레이 (Tab) — 키보드 네비게이션 지원 ──────────
    if (Game._showItemList) {
        const items = (Game.obtainedItems || []);
        const activeSyn = (typeof SYNERGIES !== 'undefined') ? SYNERGIES.filter(s =>
            s.ids.every(id => items.includes(id))
        ) : [];

        const panW = 324, panX = CW / 2 - panW / 2;
        const rowH = 18, padX = 10, padY = 8;
        const cols = 2, colW = panW / cols;
        const MAX_ROWS = 9; // 최대 표시 행 — 초과 시 스크롤
        const STATS_H = 80;
        const totalRows = Math.ceil(items.length / cols);
        const needsScroll = totalRows > MAX_ROWS;

        // ── 키보드 네비게이션 처리 ──
        if (items.length > 0) {
            let si = Game._tabSelIdx || 0;
            if (dn("ArrowRight") && !K.rDirOld) si = Math.min(items.length - 1, si + 1);
            if (dn("ArrowLeft")  && !K.lOld)    si = Math.max(0, si - 1);
            if (dn("ArrowDown")  && !K.dwnOld)  si = Math.min(items.length - 1, si + cols);
            if (dn("ArrowUp")    && !K.upOld)   si = Math.max(0, si - cols);
            Game._tabSelIdx = si;

            // 선택 행이 뷰포트 밖으로 나가면 자동 스크롤
            const selRow = Math.floor(si / cols);
            let sr = Game._tabScrollRow || 0;
            if (selRow < sr) sr = selRow;
            if (selRow >= sr + MAX_ROWS) sr = selRow - MAX_ROWS + 1;
            Game._tabScrollRow = Math.max(0, sr);
        }

        // 현재 보이는 아이템 슬라이스
        const scrollRow = Game._tabScrollRow || 0;
        const visStart  = scrollRow * cols;
        const visEnd    = Math.min(items.length, visStart + MAX_ROWS * cols);
        const visItems  = items.slice(visStart, visEnd);
        const visRows   = items.length === 0 ? 1 : Math.ceil(visItems.length / cols);

        // 선택된 아이템 설명 준비
        const selIdx  = Game._tabSelIdx || 0;
        const selId   = items[selIdx];
        const selRaw  = selId != null ? (UPGRADES[selId]?.name ?? BOSS_ITEMS?.[selId]?.name ?? '') : '';
        const selCI   = selRaw.indexOf(': ');
        const selTitle = selCI >= 0 ? selRaw.slice(0, selCI) : selRaw;
        const selDesc  = selCI >= 0 ? selRaw.slice(selCI + 2) : '';
        const hasDesc  = items.length > 0 && selDesc.length > 0;

        // 패널 높이 계산 (최대 CH-8 이내)
        const synLine  = activeSyn.length > 0 ? 14 : 0;
        const rawPanH  = padY + 20              // 헤더
            + STATS_H + 4                        // 스탯 + 구분선
            + visRows * rowH                     // 아이템 행
            + (needsScroll ? 12 : 0)             // 스크롤 힌트
            + (hasDesc ? 40 : 0)                 // 선택 유물 설명
            + synLine                             // 시너지 요약
            + padY + 16;                         // 푸터
        const panH = Math.min(rawPanH, CH - 8);
        const panY = Math.max(4, CH / 2 - panH / 2);

        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.93)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(panX, panY, panW, panH, 8);
        else ctx.rect(panX, panY, panW, panH);
        ctx.fill();
        ctx.strokeStyle = "#555555"; ctx.lineWidth = 1.5;
        ctx.stroke();

        // 헤더
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffcc00"; ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
        ctx.fillText(`획득 유물 (${items.length})`, CW / 2, panY + padY + 11);
        ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(panX + 8, panY + padY + 17); ctx.lineTo(panX + panW - 8, panY + padY + 17); ctx.stroke();

        // ── 스탯 섹션 ──
        const statsY = panY + padY + 22;
        const p    = Game.player;
        const hp   = p ? Math.ceil(p.hp) : 0;
        const maxHp = Game.pMaxHp;
        const shield = Game.pShield | 0;
        const atk  = Math.floor((Game.pBaseDmg || 0) * (Game.pBaseDmgMul || 1) * (Game.pFinalDmgMul || 1));
        const def  = Game.pBaseDef | 0;
        const critPct = Math.round((Game.pCritChance || 0) * 100);
        const critMul = Math.round((Game.pCritDmg || 1.5) * 10) / 10;
        const spdPct  = Math.round((Game.pMoveSpdMul || 1) * 100);
        const dr      = Game.pDmgReduction ?? 1.0;
        const drStr   = dr < 0.999 ? `-${Math.round((1 - dr) * 100)}%` : dr > 1.001 ? `+${Math.round((dr - 1) * 100)}%` : '0%';

        const hpBarX = panX + padX, hpBarW = panW - padX * 2, hpBarH = 8;
        ctx.fillStyle = "#2a0808";
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(hpBarX, statsY, hpBarW, hpBarH, 3); else ctx.rect(hpBarX, statsY, hpBarW, hpBarH); ctx.fill();
        const hpR = maxHp > 0 ? Math.min(1, hp / maxHp) : 0;
        ctx.fillStyle = hpR > 0.5 ? "#22bb44" : hpR > 0.25 ? "#ddaa00" : "#cc2222";
        if (hpR > 0) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(hpBarX, statsY, hpBarW * hpR, hpBarH, 3); else ctx.rect(hpBarX, statsY, hpBarW * hpR, hpBarH); ctx.fill(); }
        ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "bold 9px SkullFont, NeoDunggeunmo";
        ctx.fillText(`HP  ${hp} / ${maxHp}${shield > 0 ? `  +${shield}방막` : ''}`, CW / 2, statsY + 7);

        const statDefs = [
            [`공격 ${atk}`, `방어 ${def}`],
            [`치명 ${critPct}%`, `치명피해 ×${critMul}`],
            [`이속 ${spdPct}%`, `피해감소 ${drStr}`],
        ];
        ctx.textAlign = "left"; ctx.font = "10px SkullFont, NeoDunggeunmo";
        statDefs.forEach((row, ri) => {
            const sy = statsY + 20 + ri * 18;
            row.forEach((cell, ci) => {
                const sp = cell.indexOf(' ');
                const label = cell.slice(0, sp), value = cell.slice(sp + 1);
                const sx = panX + padX + ci * (panW / 2);
                ctx.fillStyle = "#6677aa"; ctx.fillText(label, sx, sy);
                ctx.fillStyle = "#e8eaf0"; ctx.fillText(value, sx + ctx.measureText(label).width + 3, sy);
            });
        });

        // 스탯-아이템 구분선
        const statSepY = statsY + STATS_H - 4;
        ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(panX + 8, statSepY); ctx.lineTo(panX + panW - 8, statSepY); ctx.stroke();

        // ── 아이템 목록 ──
        const itemsStartY = statSepY + 8;
        ctx.font = "11px SkullFont, NeoDunggeunmo"; ctx.textAlign = "left";

        if (items.length === 0) {
            ctx.fillStyle = "#555566"; ctx.textAlign = "center";
            ctx.fillText("없음", CW / 2, itemsStartY + rowH - 4);
        } else {
            visItems.forEach((id, vi) => {
                const globalIdx = visStart + vi;
                const col  = vi % cols;
                const row2 = Math.floor(vi / cols);
                const tx   = panX + padX + col * colW;
                const ty   = itemsStartY + row2 * rowH + rowH - 5;
                const isSelected = globalIdx === selIdx;
                const isBoss = id >= 101;

                if (isSelected) {
                    ctx.fillStyle = "rgba(80,80,0,0.5)";
                    ctx.fillRect(tx - 3, itemsStartY + row2 * rowH, colW - 2, rowH - 1);
                }
                ctx.fillStyle = isBoss ? "#cc88ff" : (isSelected ? "#ffee44" : "#dddddd");
                const name = UPGRADES[id]?.name?.split(':')[0] ?? BOSS_ITEMS?.[id]?.name?.split(':')[0] ?? `유물 ${id}`;
                ctx.fillText(`· ${name}`, tx, ty);
            });
        }

        // 스크롤 힌트
        let curY = itemsStartY + visRows * rowH;
        if (needsScroll) {
            ctx.textAlign = "center"; ctx.fillStyle = "#555566"; ctx.font = "9px SkullFont, NeoDunggeunmo";
            const showing = `${visStart + 1}–${Math.min(visEnd, items.length)} / ${items.length}`;
            ctx.fillText(`[↑↓] 스크롤  ${showing}`, CW / 2, curY + 9);
            curY += 12;
        }

        // ── 선택 유물 설명 ──
        if (hasDesc) {
            ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(panX + 8, curY + 2); ctx.lineTo(panX + panW - 8, curY + 2); ctx.stroke();
            curY += 6;
            const isBossSel = selId >= 101;
            ctx.textAlign = "center";
            ctx.fillStyle = isBossSel ? "#cc88ff" : "#ffe066"; ctx.font = "bold 11px SkullFont, NeoDunggeunmo";
            ctx.fillText(selTitle, CW / 2, curY + 11);
            ctx.fillStyle = "#99bbdd"; ctx.font = "10px SkullFont, NeoDunggeunmo";
            const descLines = (typeof _wrapDesc === 'function') ? _wrapDesc(selDesc, panW - padX * 2 - 4) : [selDesc];
            descLines.slice(0, 2).forEach((ln, li) => ctx.fillText(ln, CW / 2, curY + 24 + li * 13));
            curY += 40;
        }

        // 시너지 요약 라인
        if (activeSyn.length > 0) {
            ctx.textAlign = "center"; ctx.fillStyle = "#ffaa00"; ctx.font = "10px SkullFont, NeoDunggeunmo";
            ctx.fillText(`✦ 활성 시너지 ${activeSyn.length}개`, CW / 2, curY + 10);
        }

        // 푸터
        ctx.textAlign = "center"; ctx.fillStyle = "#555555"; ctx.font = "10px SkullFont, NeoDunggeunmo";
        ctx.fillText("[Tab] 닫기  ·  [←→↑↓] 탐색", CW / 2, panY + panH - 4);

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