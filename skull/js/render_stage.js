// ==========================================
// 배경/발판/환경/엔티티 렌더링 (Stage & Entity Renderer)
// ==========================================

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

function drawBone(isLarge, classType) {
    ctx.save();
    if (isLarge) ctx.scale(1.5, 1.5);
    const ext = Game.pRangeBonus; 
    
    if (classType === 1) { // 도적 단검
        ctx.fillStyle = "#888"; 
        ctx.fillRect(0, 0, 12 + ext, 3);
        ctx.fillStyle = "#555"; 
        ctx.fillRect(0, 5, 12 + ext, 3);
        ctx.fillStyle = "#fff"; 
        ctx.fillRect(10 + ext, -1, 4, 5); 
        ctx.fillRect(10 + ext, 4, 4, 5);
    } else if (classType === 2) { // 마법사 지팡이
        ctx.fillStyle = "#5c3a21"; 
        ctx.fillRect(0, -1, 16 + ext, 4); 
        ctx.fillStyle = "#aa00ff"; 
        ctx.beginPath(); 
        ctx.arc(16 + ext, 1, 6, 0, Math.PI*2); 
        ctx.fill(); 
        ctx.fillStyle = "#fff"; 
        ctx.beginPath(); 
        ctx.arc(16 + ext, 1, 2, 0, Math.PI*2); 
        ctx.fill();
    } else { // 기본 검사 뼈검
        ctx.fillStyle = "#d4b895"; 
        ctx.fillRect(0, -2, 10 + ext, 4); 
        ctx.fillStyle = "#f8f8fa"; 
        ctx.fillRect(2, -3, 14 + ext, 6); 
        ctx.fillRect(14 + ext, -5, 4, 4); 
        ctx.fillRect(14 + ext, 1, 4, 4);  
        ctx.fillStyle = "#d0d0d5"; 
        ctx.fillRect(4, 1, 10 + ext, 2);  
        ctx.fillRect(15 + ext, 3, 2, 2);
    }
    ctx.restore();
}

function drawBackground(frameNow) {
    const themes = [
        ["#050508", "#0d0d14", "#1a1a25"], 
        ["#1e3623", "#2a4a33", "#4d7358"], 
        ["#0a0a0c", "#141416", "#252528"], 
        ["#0a050a", "#150a12", "#1e0f1f"], 
        ["#150202", "#250505", "#350a0a"], 
        ["#1c0512", "#280a1a", "#3f1025"], 
        ["#000000", "#000000", "#000000"]  
    ];
    
    const wg = getWg();
    
    const tColors = themes[wg];
    
    const skyGrd = ctx.createLinearGradient(0, 0, 0, CH);
    skyGrd.addColorStop(0, "#000000"); 
    skyGrd.addColorStop(1, tColors[0]);
    ctx.fillStyle = skyGrd; 
    ctx.fillRect(0, 0, CW, CH);
    
    if (wg === 1) {
        // 원경: 핏빛 달
        const moonX = CW * 0.78 - Game.camX * 0.02;
        const moonGrd = ctx.createRadialGradient(moonX, 55, 8, moonX, 55, 55);
        moonGrd.addColorStop(0, "rgba(200,180,110,0.85)");
        moonGrd.addColorStop(0.5, "rgba(140,100,60,0.5)");
        moonGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = moonGrd;
        ctx.beginPath(); ctx.arc(moonX, 55, 55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(5,3,8,0.5)";
        ctx.beginPath(); ctx.arc(moonX - 12, 48, 40, 0, Math.PI * 2); ctx.fill();

        // 원경 산맥 (3레이어 시차)
        const mts = [
            { spd: 0.05, col: "rgba(18,12,28,0.9)", hBase: 200, var: 80 },
            { spd: 0.12, col: "rgba(28,16,36,0.85)", hBase: 150, var: 60 },
            { spd: 0.22, col: "rgba(38,20,42,0.8)", hBase: 110, var: 45 },
        ];
        mts.forEach(m => {
            ctx.fillStyle = m.col;
            ctx.beginPath(); ctx.moveTo(0, CH);
            for (let x = 0; x <= CW + 20; x += 8) {
                const wx = (x + Game.camX * m.spd) * 0.018;
                const h = m.hBase + Math.sin(wx * 1.1) * m.var + Math.sin(wx * 2.3 + 1) * (m.var * 0.4);
                ctx.lineTo(x, CH - h);
            }
            ctx.lineTo(CW, CH); ctx.fill();
        });

        // 중경: 폐허 성탑 실루엣
        const wrap = CW + 200;
        for (let i = 0; i < 8; i++) {
            const bx = ((i * 280) % Game.levelW) * 0.3 - Game.camX * 0.3;
            const mod = ((bx % wrap) + wrap) % wrap - 100;
            if (mod < -120 || mod > CW + 50) continue;
            const ht = 140 + (i % 3) * 40;
            ctx.fillStyle = "rgba(8,5,12,0.92)";
            ctx.fillRect(mod, CH - ht, 28, ht);
            // 무너진 성벽 총안
            for (let c2 = 0; c2 < 3; c2++) {
                ctx.clearRect(mod + c2 * 8 + 2, CH - ht - 14, 5, 14);
                ctx.fillStyle = "rgba(8,5,12,0.92)";
                ctx.fillRect(mod + c2 * 8, CH - ht, 8, 14);
            }
            // 갈라진 창문 (희미한 붉은빛)
            if (ht > 150) {
                const wFlk = (Math.sin(frameNow * 0.0005 + i * 1.7) + 1) / 2 * 0.3;
                ctx.fillStyle = `rgba(180,30,0,${wFlk})`;
                ctx.fillRect(mod + 8, CH - ht + 30, 12, 16);
                ctx.fillStyle = `rgba(255,60,0,${wFlk * 0.5})`;
                ctx.fillRect(mod + 11, CH - ht + 33, 6, 10);
            }
        }

        // 전경: 황량한 언덕 라인
        const hillGrd = ctx.createLinearGradient(0, CH - 80, 0, CH);
        hillGrd.addColorStop(0, "#1a0f24"); hillGrd.addColorStop(1, "#080510");
        ctx.fillStyle = hillGrd;
        ctx.beginPath(); ctx.moveTo(0, CH);
        for (let x = 0; x <= CW; x += 12) {
            const wx = (x + Game.camX * 0.5) * 0.015;
            ctx.lineTo(x, CH - 40 - Math.sin(wx) * 25 - Math.sin(wx * 2.8) * 12);
        }
        ctx.lineTo(CW, CH); ctx.fill();
    } 
    else if (wg === 2) { 
        let wrap = CW + 300;
        // 성벽 실루엣
        for (let i = 0; i < 15; i++) {
            let bx = ((i * 200) % Game.levelW) * 0.2 - Game.camX * 0.2;
            let mod = ((bx % wrap) + wrap) % wrap - 100;
            if (mod > -100 && mod < CW + 100) {
                ctx.fillStyle = "rgba(15, 10, 12, 0.6)";
                ctx.fillRect(mod + 40, CH - 200 + (i%5)*10, 14, 80);
                ctx.fillRect(mod + 20, CH - 175 + (i%5)*10, 55, 14);
                ctx.beginPath(); ctx.arc(mod + 47, CH - 125 + (i%5)*10, 42, Math.PI, 0); ctx.fill();
            }
        }
        // 창문 - 천천히 켜지고 꺼지는 붉은 불빛 (sin 주기를 길게)
        for (let i = 0; i < 25; i++) {
            let bx = ((i * 120) % Game.levelW) * 0.4 - Game.camX * 0.4;
            let mod = ((bx % wrap) + wrap) % wrap - 50;
            if (mod > -50 && mod < CW + 50) {
                let yOff = CH - 110 + (i%3)*18;
                // 창틀
                ctx.fillStyle = "#1c1518";
                ctx.beginPath(); ctx.arc(mod + 30, yOff, 18, Math.PI, 0); ctx.fill();
                ctx.fillRect(mod + 12, yOff, 37, 28);
                // 창문 불빛: 각 창마다 위상(i*1.3) 다르게 해서 분산, 주기 4~6초
                const flickerPhase = (frameNow * 0.0004 + i * 1.3);
                const glow = (Math.sin(flickerPhase) + 1) / 2; // 0~1 천천히
                const glowAlpha = 0.05 + glow * 0.55;
                ctx.fillStyle = `rgba(220, 40, 10, ${glowAlpha})`;
                ctx.beginPath(); ctx.arc(mod + 30, yOff, 17, Math.PI, 0); ctx.fill();
                ctx.fillRect(mod + 13, yOff, 35, 26);
                // 창문 오버레이 흐린 불빛 (바깥으로 번지는 글로우)
                if (glow > 0.3) {
                    const glowGrd = ctx.createRadialGradient(mod + 30, yOff + 10, 0, mod + 30, yOff + 10, 40);
                    glowGrd.addColorStop(0, `rgba(200, 30, 0, ${glow * 0.25})`);
                    glowGrd.addColorStop(1, 'rgba(200, 30, 0, 0)');
                    ctx.fillStyle = glowGrd;
                    ctx.beginPath(); ctx.arc(mod + 30, yOff + 10, 40, 0, Math.PI * 2); ctx.fill();
                }
                // 창살
                ctx.strokeStyle = "rgba(10, 5, 8, 0.8)"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(mod + 30, yOff - 18); ctx.lineTo(mod + 30, yOff + 28); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(mod + 13, yOff + 10); ctx.lineTo(mod + 48, yOff + 10); ctx.stroke();
            }
        }
    }
    else if (wg === 3) {
        const t = frameNow;
        // 핏빛 하늘 그라데이션
        const skyB = ctx.createLinearGradient(0, 0, 0, CH * 0.7);
        skyB.addColorStop(0, "#100006"); skyB.addColorStop(0.5, "#200010"); skyB.addColorStop(1, "#0a0008");
        ctx.fillStyle = skyB; ctx.fillRect(0, 0, CW, CH * 0.7);

        // 핏빛 구름 (느리게 흐름)
        for (let i = 0; i < 10; i++) {
            const cx2 = ((i * 190 + Game.camX * 0.06) % (CW + 200)) - 80;
            const cy2 = 30 + (i % 4) * 28;
            const r = 45 + (i % 3) * 20;
            const cA = 0.12 + (i % 3) * 0.04;
            const cloudGrd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
            cloudGrd.addColorStop(0, `rgba(80,0,20,${cA})`);
            cloudGrd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = cloudGrd;
            ctx.beginPath(); ctx.ellipse(cx2, cy2, r * 1.8, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        }

        // 원경: 고딕 성채 (3탑)
        const cOff = Game.camX * 0.08;
        const towers = [
            { x: CW * 0.15 - cOff, h: 250, w: 35 },
            { x: CW * 0.45 - cOff, h: 310, w: 45 },
            { x: CW * 0.75 - cOff, h: 270, w: 38 },
        ];
        towers.forEach((tw, ti) => {
            // 탑 본체
            ctx.fillStyle = "rgba(8,4,12,0.95)";
            ctx.fillRect(tw.x - tw.w/2, CH - tw.h, tw.w, tw.h);
            // 고딕 첨탑
            ctx.beginPath();
            ctx.moveTo(tw.x - tw.w/2 - 4, CH - tw.h);
            ctx.lineTo(tw.x, CH - tw.h - 70 - ti * 15);
            ctx.lineTo(tw.x + tw.w/2 + 4, CH - tw.h);
            ctx.fill();
            // 탑 창문들 (붉은 빛)
            for (let wi = 0; wi < 3; wi++) {
                const wyOff = CH - tw.h + 30 + wi * 55;
                const wFlk = (Math.sin(t * 0.0004 + ti * 2.1 + wi * 0.8) + 1) / 2;
                const wA = 0.2 + wFlk * 0.5;
                ctx.fillStyle = `rgba(200,30,0,${wA})`;
                ctx.beginPath(); ctx.arc(tw.x, wyOff, 7, Math.PI, 0); ctx.fill();
                ctx.fillRect(tw.x - 7, wyOff, 14, 10);
                if (wFlk > 0.5) {
                    const gGrd = ctx.createRadialGradient(tw.x, wyOff + 5, 0, tw.x, wyOff + 5, 22);
                    gGrd.addColorStop(0, `rgba(220,40,0,${wFlk * 0.3})`);
                    gGrd.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = gGrd; ctx.beginPath(); ctx.arc(tw.x, wyOff + 5, 22, 0, Math.PI * 2); ctx.fill();
                }
            }
            // 십자가 장식
            ctx.fillStyle = "rgba(6,3,10,0.98)";
            ctx.fillRect(tw.x - 2, CH - tw.h - 35, 4, 22);
            ctx.fillRect(tw.x - 8, CH - tw.h - 28, 16, 4);
        });

        // 성벽 연결
        ctx.fillStyle = "rgba(7,4,11,0.9)";
        ctx.fillRect(0, CH - 110, CW, 110);
        // 성벽 흉벽
        for (let m = 0; m < Math.ceil(CW / 30); m++) {
            const mx = m * 30 - (Game.camX * 0.08) % 30;
            if (m % 2 === 0) ctx.clearRect(mx, CH - 130, 14, 20);
        }
        ctx.fillStyle = "rgba(7,4,11,0.9)";
        ctx.fillRect(0, CH - 110, CW, 110);

        // 안개 레이어
        for (let f = 0; f < 5; f++) {
            const fx = ((f * 200 + t * 0.02 * (f % 2 === 0 ? 1 : -1)) % (CW + 300)) - 150;
            const fogGrd = ctx.createRadialGradient(fx, CH - 40, 0, fx, CH - 40, 100);
            fogGrd.addColorStop(0, "rgba(30,5,15,0.18)");
            fogGrd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = fogGrd; ctx.beginPath(); ctx.ellipse(fx, CH - 40, 140, 40, 0, 0, Math.PI * 2); ctx.fill();
        }
    } 
    else if (wg === 4) {
        const t = frameNow;
        // 뒤틀린 마왕성 하늘
        const skyG = ctx.createLinearGradient(0, 0, 0, CH);
        skyG.addColorStop(0, "#08000e"); skyG.addColorStop(0.4, "#150010"); skyG.addColorStop(1, "#050008");
        ctx.fillStyle = skyG; ctx.fillRect(0, 0, CW, CH);

        // 원경: 마왕성 실루엣
        const castOff = Game.camX * 0.06;
        ctx.fillStyle = "rgba(4,0,8,0.98)";
        // 중앙 거대 탑
        const ctX = CW * 0.5 - castOff;
        ctx.beginPath();
        ctx.moveTo(ctX - 60, CH);
        ctx.lineTo(ctX - 55, CH - 280);
        ctx.lineTo(ctX - 30, CH - 310);
        ctx.lineTo(ctX - 15, CH - 380);
        ctx.lineTo(ctX,      CH - 420);
        ctx.lineTo(ctX + 15, CH - 380);
        ctx.lineTo(ctX + 30, CH - 310);
        ctx.lineTo(ctX + 55, CH - 280);
        ctx.lineTo(ctX + 60, CH);
        ctx.fill();
        // 탑 정상 붉은 오라
        const topPulse = (Math.sin(t * 0.002) + 1) / 2;
        const topGrd = ctx.createRadialGradient(ctX, CH - 420, 5, ctX, CH - 420, 50);
        topGrd.addColorStop(0, `rgba(200,0,50,${0.6 + topPulse * 0.4})`);
        topGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = topGrd; ctx.beginPath(); ctx.arc(ctX, CH - 420, 50, 0, Math.PI * 2); ctx.fill();

        // 부유하는 잔해 돌덩이
        for (let i = 0; i < 12; i++) {
            const dbx = ((i * 180 + t * 0.015 * (i % 2 === 0 ? 1 : -0.7)) % (Game.levelW)) * 0.25 - Game.camX * 0.25;
            const dby = 40 + (i % 5) * 35 + Math.sin(t * 0.001 + i) * 8;
            const dmod = ((dbx % (CW + 100)) + CW + 100) % (CW + 100) - 40;
            if (dmod < -40 || dmod > CW + 20) continue;
            const ds = 8 + (i % 4) * 5;
            ctx.fillStyle = `rgba(15,5,20,${0.7 + (i%3)*0.1})`;
            ctx.save(); ctx.translate(dmod, dby); ctx.rotate(t * 0.0002 * (i%2 === 0 ? 1 : -1) + i);
            ctx.fillRect(-ds/2, -ds/3, ds, ds * 0.7);
            // 잔해 붉은 균열
            ctx.strokeStyle = `rgba(150,0,30,${0.3 + (i%3)*0.1})`; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(-ds/4, -ds/6); ctx.lineTo(ds/3, ds/5); ctx.stroke();
            ctx.restore();
        }

        // 뒤틀린 나무 실루엣
        for (let i = 0; i < 6; i++) {
            const tx2 = ((i * 220) % Game.levelW) * 0.35 - Game.camX * 0.35;
            const tmod = ((tx2 % (CW + 160)) + CW + 160) % (CW + 160) - 60;
            if (tmod < -60 || tmod > CW + 30) continue;
            ctx.strokeStyle = "rgba(8,3,12,0.95)"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(tmod, CH);
            ctx.quadraticCurveTo(tmod + (i%2===0?-15:15), CH - 55, tmod + (i%2===0?-8:8), CH - 100);
            ctx.stroke();
            // 가지
            ctx.lineWidth = 2;
            for (let b = 0; b < 3; b++) {
                const by2 = CH - 55 - b * 18;
                const bDir = b % 2 === 0 ? 1 : -1;
                ctx.beginPath(); ctx.moveTo(tmod + bDir * (b * 3), by2);
                ctx.quadraticCurveTo(tmod + bDir * (22 - b * 5), by2 - 15, tmod + bDir * (30 - b * 4), by2 - 25);
                ctx.stroke();
            }
        }

        // 간헐적 붉은 번개 (먼 배경)
        if (Math.sin(t * 0.003) > 0.96) {
            const lx = CW * (0.2 + Math.sin(t * 0.007) * 0.6);
            ctx.strokeStyle = `rgba(180,0,40,${0.3 + Math.random() * 0.2})`; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(lx, 0);
            let ly = 0;
            while (ly < CH * 0.6) {
                ly += 20 + Math.random() * 20;
                ctx.lineTo(lx + (Math.random() - 0.5) * 30, ly);
            }
            ctx.stroke();
        }
    } 
    else if (wg === 5) { 
        ctx.lineWidth = 3;
        let wrap = CW + 150;
        for (let i = 0; i < 18; i++) {
            ctx.strokeStyle = (i % 2 === 0) ? "#3d1010" : "#5c1a0a"; // 검붉은 갈색
            ctx.shadowColor = "rgba(80, 15, 5, 0.4)"; 
            ctx.shadowBlur = 5;
            ctx.beginPath();
            for (let y = 0; y <= CH; y += 30) {
                let bx = ((i * 140) % Game.levelW) * 0.4 - Game.camX * 0.4;
                let mod = ((bx % wrap) + wrap) % wrap - 50;
                let wave = Math.sin((y + frameNow * 0.05 + i * 100) * 0.03) * 20;
                if (y === 0) ctx.moveTo(mod + wave, y);
                else ctx.lineTo(mod + wave, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0; 
        }
    }
    else if (wg === 6) {
        // 검은 태양 (일식) - 화면 정중앙
        const sunX = CW / 2, sunY = CH * 0.38;
        const coronaPulse = (Math.sin(frameNow * 0.0015) + 1) / 2;

        // 검붉은 하늘 오버레이
        const skyRed = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, CW * 0.8);
        skyRed.addColorStop(0, "rgba(80,0,0,0.45)");
        skyRed.addColorStop(0.5, "rgba(40,0,0,0.3)");
        skyRed.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = skyRed; ctx.fillRect(0, 0, CW, CH);

        // 코로나 (일식 후광) - 여러 겹
        for (let layer = 3; layer >= 1; layer--) {
            const r = 55 + layer * 28 + coronaPulse * 15;
            const a = (0.12 - layer * 0.03) * (0.6 + coronaPulse * 0.4);
            const grd = ctx.createRadialGradient(sunX, sunY, 40, sunX, sunY, r);
            grd.addColorStop(0,   `rgba(200,50,0,${a})`);
            grd.addColorStop(0.6, `rgba(120,20,0,${a*0.4})`);
            grd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(sunX, sunY, r, 0, Math.PI * 2); ctx.fill();
        }

        // 코로나 스파이크 (8방향 빛줄기)
        ctx.save();
        ctx.translate(sunX, sunY);
        for (let s = 0; s < 8; s++) {
            ctx.save();
            ctx.rotate(s * Math.PI / 4 + frameNow * 0.0003);
            const spikeLen = 45 + coronaPulse * 25;
            const sGrd = ctx.createLinearGradient(0, -42, 0, -(42 + spikeLen));
            sGrd.addColorStop(0,   `rgba(220,60,0,${0.4 + coronaPulse * 0.3})`);
            sGrd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = sGrd;
            ctx.beginPath();
            ctx.moveTo(-3, -40); ctx.lineTo(0, -(42 + spikeLen)); ctx.lineTo(3, -40);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // 검은 태양 본체 (테두리 흰색 - 일식)
        ctx.strokeStyle = `rgba(255,220,180,${0.7 + coronaPulse * 0.3})`;
        ctx.lineWidth = 3 + coronaPulse * 2;
        ctx.shadowBlur = 20 + coronaPulse * 15; ctx.shadowColor = "#ffddaa";
        ctx.beginPath(); ctx.arc(sunX, sunY, 42, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(sunX, sunY, 40, 0, Math.PI * 2); ctx.fill();
    }

    const vig = ctx.createRadialGradient(CW/2, CH/2, CH*0.3, CW/2, CH/2, CW*0.7);
    vig.addColorStop(0, "transparent");
    vig.addColorStop(1, "rgba(0, 0, 0, 0.75)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CW, CH);

    // ── 날씨/파티클 레이어 ──
    _drawWeather(wg, frameNow);

    return tColors;
}

// 날씨 파티클 - Game.weatherParticles 풀 활용
function _drawWeather(wg, frameNow) {
    // 풀 초기화 (첫 호출 시)
    if (!Game.weatherParticles) {
        Game.weatherParticles = [];
        for (let i = 0; i < 120; i++) {
            Game.weatherParticles.push({
                x: Math.random() * CW,
                y: Math.random() * CH,
                vx: 0, vy: 0,
                life: Math.random(),
                size: 1,
                alpha: 0
            });
        }
    }
    const pts = Game.weatherParticles;

    // wg2: 회색 재 (언데드 스테이지)
    if (wg === 2) {
        ctx.save();
        for (let i = 0; i < 60; i++) {
            const p = pts[i];
            p.x += Math.sin(frameNow * 0.0008 + i) * 0.4 - 0.2;
            p.y += 0.4 + Math.cos(i * 0.7) * 0.2;
            if (p.y > CH) { p.y = -4; p.x = Math.random() * CW; }
            const a = 0.1 + Math.sin(frameNow * 0.002 + i) * 0.08;
            ctx.fillStyle = `rgba(160, 140, 130, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }

    // wg4: 먹구름 연기 (마왕성 외곽)
    if (wg === 4) {
        ctx.save();
        for (let i = 0; i < 40; i++) {
            const p = pts[i];
            p.x -= 0.6 + (i % 3) * 0.2;
            p.y += Math.sin(frameNow * 0.001 + i) * 0.15;
            if (p.x < -60) { p.x = CW + 40; p.y = Math.random() * CH * 0.6; }
            const a = 0.04 + Math.sin(frameNow * 0.0015 + i) * 0.02;
            ctx.fillStyle = `rgba(20, 10, 10, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 20 + (i % 5) * 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }

    // wg5: 핏빛 비 (기괴한 마왕성)
    if (wg === 5) {
        ctx.save();
        ctx.strokeStyle = "rgba(120, 0, 0, 0.35)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 80; i++) {
            const p = pts[i];
            p.x -= 1.2;
            p.y += 5 + (i % 3);
            if (p.y > CH + 10) { p.y = -10; p.x = Math.random() * CW; }
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 2, p.y + 8);
            ctx.stroke();
        }
        ctx.restore();
        return;
    }

    // wg6: 마왕 불꽃 부유 파티클
    if (wg === 6) {
        ctx.save();
        for (let i = 0; i < 50; i++) {
            const p = pts[i];
            p.x += Math.sin(frameNow * 0.002 + i * 1.3) * 0.8;
            p.y -= 0.8 + (i % 3) * 0.3;
            if (p.y < -8) { p.y = CH + 4; p.x = Math.random() * CW; }
            const a = 0.08 + Math.sin(frameNow * 0.003 + i) * 0.05;
            const r = 120 + (i % 80);
            ctx.fillStyle = `rgba(${r}, ${Math.floor(r * 0.2)}, 0, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }
}

function drawTile(tx, ty, w, h, t, wg, tColors, frameNow) {
    if (wg === 1) { 
        ctx.fillStyle = t.drop ? "#4a3020" : "#3e2723"; 
        ctx.fillRect(tx, ty, w, h); 
        ctx.fillStyle = "#271714"; 
        for(let i=0; i<w; i+=15) { 
            for(let j=10; j<h; j+=15) { 
                if((i+j)%2===0) ctx.fillRect(tx+i, ty+j, 4, 4); 
            } 
        }
        ctx.fillStyle = t.drop ? "#6b472e" : tColors[2]; 
        ctx.fillRect(tx, ty, w, 8); 
    } 
    else if (wg === 2) { 
        ctx.fillStyle = t.drop ? "#1a1a1c" : "#2a2a2c"; 
        ctx.fillRect(tx, ty, w, h);
        ctx.fillStyle = "#111";
        for(let i=0; i<w; i+=8) {
            for(let j=0; j<h; j+=8) {
                if ((i * 7 + j * 3) % 5 === 0) ctx.fillRect(tx+i, ty+j, 3, 3);
            }
        }
        ctx.fillStyle = t.drop ? "#111112" : "#3a3a3c";
        ctx.beginPath();
        for(let i=0; i<w; i+=10) { 
            let jag = ((i * 13) % 7) - 3; 
            ctx.lineTo(tx+i, ty+jag); 
        }
        ctx.lineTo(tx+w, ty); 
        ctx.lineTo(tx, ty); 
        ctx.fill();
    } 
    else if (wg === 3) { 
        const isDark = !t.float;
        ctx.fillStyle = isDark ? "#1a1c22" : "#2a2d33"; 
        ctx.fillRect(tx, ty, w, h);
        ctx.fillStyle = isDark ? "#111" : "#1f2226"; 
        for(let j=0; j<h; j+=12) ctx.fillRect(tx, ty+j, w, 2); 
        for(let j=0; j<h; j+=12) { 
            let off = (j/12)%2===0 ? 0 : 12; 
            for(let i=off; i<w; i+=24) ctx.fillRect(tx+i, ty+j, 2, 12); 
        } 
        ctx.fillStyle = t.drop ? "#3a2222" : (isDark ? "#2f343d" : "#4a5059"); 
        ctx.fillRect(tx, ty, w, 4); 
    } 
    else if (wg === 4 || wg === 5) { 
        ctx.fillStyle = "#1f0a0a"; 
        ctx.fillRect(tx, ty, w, h);
        ctx.fillStyle = "#3a1111";
        for(let i=0; i<w; i+=12) {
            ctx.beginPath(); ctx.moveTo(tx+i, ty); ctx.lineTo(tx+i+6, ty+h/2); ctx.lineTo(tx+i, ty+h);
            ctx.strokeStyle = "#4a0f0f"; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.fillStyle = t.drop ? "#330000" : "#551111"; 
        ctx.fillRect(tx, ty, w, 4);
    } 
    else if (wg === 6) { 
        ctx.fillStyle = "#050505"; 
        ctx.fillRect(tx, ty, w, h);
        ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + Math.sin(frameNow*0.005)*0.2})`; 
        for(let i=10; i<w; i+=35) { ctx.fillRect(tx+i, ty, 2, h); ctx.fillRect(tx+i-8, ty+15, 18, 2); }
        ctx.fillStyle = "#110000"; ctx.fillRect(tx, ty, w, 4); ctx.fillStyle = "#ff0000"; ctx.fillRect(tx, ty, w, 1); 
    }

    if (wg < 5) { 
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(tx, ty + h - 8, w, 8); 
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(tx + w - 6, ty, 6, h); 
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; ctx.fillRect(tx, ty, 6, h);         
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)"; ctx.fillRect(tx, ty + 4, w, 4); 
    } else { 
        ctx.fillStyle = "rgba(255, 0, 0, 0.15)"; ctx.fillRect(tx, ty + h - 4, w, 4); 
    }
}

function drawEnvironment(tColors, frameNow) {
    const wg = getWg();

    Game.items.forEach(i => {
        if (!i.active) return;
        const ix = i.x - Game.camX; 
        if (ix < -10 || ix > CW) return;
        if (i.life < 100 && Math.floor(i.life / 5) % 2 === 0) return; 
        
        if (i.type === "hp") ctx.fillStyle = "#ff1111"; 
        else if (i.type === "atk_drop") ctx.fillStyle = "#ff6200"; 
        else if (i.type === "def_drop") ctx.fillStyle = "#b0bec5"; 
        else if (i.type === "atk_spd_drop") ctx.fillStyle = "#ffea00"; 
        else if (i.type === "move_spd_drop") ctx.fillStyle = "#00ffcc"; 
        else if (i.type === "jump_drop") ctx.fillStyle = "#42a5f5"; 
        else ctx.fillStyle = "#00ccff"; 
        
        ctx.fillRect(ix, i.y, 10, 10); ctx.fillStyle = "#ffffff"; ctx.fillRect(ix + 3, i.y + 2, 4, 4); 
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; ctx.strokeRect(ix, i.y, 10, 10);
    });

    Game.platforms.forEach((t) => {
        const tx = t.x - Game.camX, ty = t.y; 
        if (tx > CW + TILE || tx + t.w < -TILE) return;
        ctx.save();
        if (t.float && t.fallTimer > 0) {
            ctx.globalAlpha = Math.max(0, 1 - (t.fallTimer / 50));
            const shake = t.fallTimer < 30 ? (Math.random() * 2 - 1) : 0;
            drawTile(tx + shake, ty, t.w, t.h, t, wg, tColors, frameNow);
        } else {
            drawTile(tx, ty, t.w, t.h, t, wg, tColors, frameNow);
        }
        ctx.restore();
    });

    Game.doors.forEach((d) => {
        const dx = d.x - Game.camX;
        if (d.open) { 
            ctx.shadowColor = "#aa00ff"; ctx.shadowBlur = 15;
            ctx.fillStyle = "#2a0044"; ctx.fillRect(dx, d.y, d.w, d.h);
            ctx.fillStyle = "#7700ff"; ctx.fillRect(dx + 4, d.y + 4, d.w - 8, d.h - 8);
            ctx.fillStyle = "#cc88ff"; ctx.fillRect(dx + 10, d.y + 10, d.w - 20, d.h - 20);
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#00ccff"; ctx.font = "12px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center"; 
            ctx.fillText("ENTER", dx + d.w / 2, d.y + d.h / 2 + 4); 
        } else {
            ctx.fillStyle = "#3e2723"; ctx.fillRect(dx, d.y, d.w, d.h); 
            ctx.fillStyle = "#271714"; ctx.fillRect(dx + 4, d.y + 4, d.w - 8, d.h - 8); 
            ctx.fillStyle = "#4e342e"; ctx.fillRect(dx + 8, d.y + 8, d.w - 16, d.h - 16); 
            ctx.fillStyle = "#111"; ctx.fillRect(dx, d.y + 15, d.w, 4); ctx.fillRect(dx, d.y + 45, d.w, 4);
            ctx.fillStyle = "#757575"; ctx.fillRect(dx + d.w / 2 - 4, d.y + d.h / 2 - 4, 8, 8);
            ctx.fillStyle = "#00ccff"; ctx.font = "10px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center"; 
            ctx.fillText("SEALED", dx + d.w / 2, d.y - 8); 
        }
        ctx.textAlign = "left";
    });

    // ── 혈흔 데칼 렌더 ──
    if (typeof renderBloodDecals === 'function') renderBloodDecals();

    // ── 함정 렌더 ──
    if (Game.traps) {
        for (const t of Game.traps) {
            const tx = t.x - Game.camX;
            if (tx < -10 || tx > CW + 10) continue;
            if (t.type === "spike") {
                const active = t.active;
                ctx.fillStyle = active ? "#cc2200" : "#553311";
                for (let s = 0; s < Math.floor(t.w / 8); s++) {
                    ctx.beginPath();
                    const bx = tx + s * 8 + 4;
                    const topY = active ? t.y - 4 : t.y + 4;
                    ctx.moveTo(bx - 3, t.y + t.h);
                    ctx.lineTo(bx, topY);
                    ctx.lineTo(bx + 3, t.y + t.h);
                    ctx.fill();
                }
                // 테두리 박스 제거 — 어색한 사각형 없이 가시 실루엣만 표시
            } else if (t.type === "swamp") {
                // 독 늪: 반투명 초록 액체
                const swampA = 0.35 + Math.sin(Date.now() * 0.002 + t.x) * 0.1;
                ctx.fillStyle = `rgba(20, 120, 30, ${swampA})`;
                ctx.fillRect(tx, t.y, t.w, t.h);
                // 거품
                for (let b = 0; b < 5; b++) {
                    const bx = tx + (b * 73 + Math.floor(Date.now() * 0.001) * 7) % t.w;
                    ctx.fillStyle = "rgba(60,200,60,0.3)";
                    ctx.beginPath(); ctx.arc(bx, t.y + 4, 3, 0, Math.PI*2); ctx.fill();
                }
            }
        }
    }

    // ── 이벤트 오브젝트 렌더 ──
    if (Game.eventObjects) {
        const t = frameNow;
        Game.eventObjects.forEach(ev => {
            if (ev.used) return;
            const ex = ev.x - Game.camX;
            if (ex < -60 || ex > CW + 60) return;

            if (ev.type === "curse_altar") {
                // 저주 제단 - 어두운 제단 + 붉은 불꽃
                ctx.fillStyle = "#1a0008"; ctx.fillRect(ex, ev.y + 24, ev.w, 24);
                ctx.fillStyle = "#2a0010"; ctx.fillRect(ex + 4, ev.y + 10, ev.w - 8, 18);
                ctx.fillStyle = "#0f0005"; ctx.fillRect(ex + 8, ev.y, ev.w - 16, 14);
                // 불꽃
                const flk = (Math.sin(t * 0.008 + ev.x) + 1) / 2;
                ctx.fillStyle = `rgba(200, 0, 40, ${0.5 + flk * 0.5})`;
                ctx.shadowBlur = 12 + flk * 10; ctx.shadowColor = "#ff0033";
                ctx.beginPath(); ctx.arc(ex + ev.w/2, ev.y + 5, 5 + flk * 3, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                // 안내 텍스트
                if (ev._nearPlayer) {
                    ctx.fillStyle = "#ff6688"; ctx.font = "11px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                    ctx.fillText("↑ 저주 계약 (HP -25%)", ex + ev.w/2, ev.y - 12);
                    ctx.textAlign = "left";
                }
            } else if (ev.type === "relic_chest") {
                // 유물 상자 - 황금빛 상자
                const chestGlow = (Math.sin(t * 0.005 + ev.x) + 1) / 2;
                ctx.fillStyle = "#2a1800"; ctx.fillRect(ex, ev.y + 8, ev.w, ev.h - 8);
                ctx.fillStyle = "#3d2200"; ctx.fillRect(ex + 2, ev.y + 10, ev.w - 4, ev.h - 12);
                // 뚜껑
                ctx.fillStyle = "#3a2000"; ctx.fillRect(ex - 2, ev.y, ev.w + 4, 12);
                // 금속 테두리
                ctx.strokeStyle = `rgba(200, 150, 0, ${0.5 + chestGlow * 0.5})`;
                ctx.lineWidth = 2; ctx.strokeRect(ex, ev.y + 8, ev.w, ev.h - 8);
                ctx.strokeRect(ex - 2, ev.y, ev.w + 4, 12);
                // 열쇠구멍
                ctx.fillStyle = "#ffcc00"; ctx.shadowBlur = 6 + chestGlow * 8; ctx.shadowColor = "#ffcc00";
                ctx.fillRect(ex + ev.w/2 - 2, ev.y + 16, 4, 6);
                ctx.beginPath(); ctx.arc(ex + ev.w/2, ev.y + 15, 3, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                if (ev._nearPlayer) {
                    ctx.fillStyle = "#ffcc44"; ctx.font = "11px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                    ctx.fillText("↑ 유물 획득", ex + ev.w/2, ev.y - 8);
                    ctx.textAlign = "left";
                }
            } else if (ev.type === "bonfire") {
                const bfX = ev.x - Game.camX;
                if (bfX < -40 || bfX > CW + 40) return;
                const lit = ev.lit || ev.used;
                const fFlk = (Math.sin(t * 0.006 + ev.x) + 1) / 2;
                ctx.fillStyle = "#2a1a0a"; ctx.fillRect(bfX + 2, ev.y + 18, ev.w - 4, 14);
                ctx.fillStyle = "#3a2a1a"; ctx.fillRect(bfX,     ev.y + 22, ev.w, 10);
                ctx.fillStyle = "#4a2a10";
                ctx.fillRect(bfX + 2,      ev.y + 16, 6, 6);
                ctx.fillRect(bfX + ev.w-8, ev.y + 16, 6, 6);
                ctx.fillRect(bfX + 8,      ev.y + 18, ev.w-16, 4);
                if (!ev.used) {
                    ctx.fillStyle = `rgba(255,140,0,${0.7 + fFlk*0.3})`;
                    ctx.shadowBlur = 18; ctx.shadowColor = "#ff8800";
                    ctx.beginPath();
                    ctx.moveTo(bfX + ev.w/2, ev.y);
                    ctx.quadraticCurveTo(bfX + ev.w/2 + 8, ev.y + 8, bfX + ev.w/2, ev.y + 16);
                    ctx.quadraticCurveTo(bfX + ev.w/2 - 8, ev.y + 8, bfX + ev.w/2, ev.y);
                    ctx.fill(); ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = "rgba(80,30,0,0.6)";
                    ctx.fillRect(bfX + ev.w/2 - 3, ev.y + 8, 6, 8);
                }
                if (ev._nearPlayer && !ev.used) {
                    ctx.fillStyle = "#ffaa44"; ctx.font = "11px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                    ctx.fillText("↑ 쉬기 (HP 완전 회복, 몬스터 부활)", bfX + ev.w/2, ev.y - 10);
                    ctx.textAlign = "left";
                }
            } else if (ev.type === "mimic_chest" && !ev.triggered) {
                const mfX = ev.x - Game.camX;
                if (mfX < -40 || mfX > CW + 40) return;
                const mFlk = (Math.sin(t * 0.003 + ev.x) + 1) / 2;
                ctx.fillStyle = "#2a1800"; ctx.fillRect(mfX, ev.y + 8, ev.w, ev.h - 8);
                ctx.fillStyle = "#3a2000"; ctx.fillRect(mfX + 2, ev.y + 10, ev.w - 4, ev.h - 12);
                ctx.fillStyle = "#3a2000"; ctx.fillRect(mfX - 2, ev.y, ev.w + 4, 12);
                ctx.strokeStyle = `rgba(200,150,0,${0.4 + mFlk*0.4})`; ctx.lineWidth = 2;
                ctx.strokeRect(mfX, ev.y + 8, ev.w, ev.h - 8);
                if (mFlk > 0.85) {
                    ctx.fillStyle = "#ff2200"; ctx.shadowBlur = 6; ctx.shadowColor = "#ff0000";
                    ctx.fillRect(mfX + 6, ev.y + 14, 4, 3); ctx.fillRect(mfX + ev.w - 10, ev.y + 14, 4, 3);
                    ctx.shadowBlur = 0;
                }
                if (ev._nearPlayer) {
                    ctx.fillStyle = "#ffaa44"; ctx.font = "11px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                    ctx.fillText("↑ 상자 열기", mfX + ev.w/2, ev.y - 8); ctx.textAlign = "left";
                }
            }
        });
    }
}

function drawEntities(frameNow) {
    ctx.imageSmoothingEnabled = false; 

    Game.eBullets.forEach(b => {
        if (!b.active) return; 
        const bx = b.x - Game.camX; 
        if (bx < -10 || bx > CW + 10) return;
        
        if (b.unblockable) {
            // 막을 수 없는 투사체: 맥동하는 보라+빨강
            const pulse = (Math.sin(frameNow * 0.015 + b.x) + 1) / 2;
            ctx.shadowBlur = 12 + pulse * 6; ctx.shadowColor = "#aa00ff";
            ctx.fillStyle = "#7700cc";
            ctx.beginPath(); ctx.arc(bx, b.y, b.r * 1.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ff0033";
            ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.75, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "rgba(255,200,255,0.6)";
            ctx.beginPath(); ctx.arc(bx - b.r*0.3, b.y - b.r*0.3, b.r * 0.3, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        } else if (b.isArrow) {
            // 화살: 방향 따라 회전
            const arrAng = Math.atan2(b.vy, b.vx);
            ctx.save(); ctx.translate(bx, b.y); ctx.rotate(arrAng);
            ctx.fillStyle = "#4a2a0a"; ctx.fillRect(-b.r*1.8, -b.r*0.3, b.r*3.6, b.r*0.6);
            ctx.fillStyle = "#2ecc71";
            ctx.beginPath(); ctx.moveTo(b.r*1.8, 0); ctx.lineTo(b.r*0.8, -b.r*0.7); ctx.lineTo(b.r*0.8, b.r*0.7); ctx.fill();
            ctx.fillStyle = "#888"; ctx.fillRect(-b.r*1.8, -b.r*0.2, b.r*0.8, b.r*0.4);
            ctx.restore();
        } else if (b.isBomb) {
            // 폭탄: 맥동하는 불덩이
            const bPulse = (Math.sin(frameNow * 0.02 + b.x) + 1) / 2;
            ctx.shadowBlur = 10 + bPulse * 8; ctx.shadowColor = "#ff4400";
            ctx.fillStyle = "#cc3300";
            ctx.beginPath(); ctx.arc(bx, b.y, b.r * (1.2 + bPulse*0.2), 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ff8800";
            ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ffee00";
            ctx.beginPath(); ctx.arc(bx - b.r*0.2, b.y - b.r*0.2, b.r*0.35, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // 일반 적 투사체: 속도 방향 회전 + 글로우 이펙트
            const eAng = Math.atan2(b.vy, b.vx);
            ctx.save();
            ctx.translate(bx, b.y);
            ctx.rotate(eAng);
            // 외부 글로우
            ctx.shadowBlur = 8; ctx.shadowColor = "#ff2200";
            ctx.fillStyle = "#cc1100";
            ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.8, b.r * 0.8, 0, 0, Math.PI*2); ctx.fill();
            // 밝은 코어
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ff4422";
            ctx.beginPath(); ctx.ellipse(b.r * 0.3, 0, b.r * 1.2, b.r * 0.55, 0, 0, Math.PI*2); ctx.fill();
            // 앞부분 하이라이트
            ctx.fillStyle = "#ffccaa";
            ctx.beginPath(); ctx.arc(b.r * 0.9, 0, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    });

    Game.bullets.forEach(b => { 
        if (!b.active) return; 
        const bx = b.x - Game.camX; 
        if (bx < -10 || bx > CW + 10) return; 
        
        if (b.sk === 2) { 
            const height = b.r * 3 * (b.life / 15);
            ctx.fillStyle = "rgba(200, 240, 255, 0.8)"; ctx.fillRect(bx - b.r/2, b.y + 10 - height, b.r, height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; ctx.fillRect(bx - b.r/4, b.y + 10 - height, b.r/2, height);
        } else if (b.sk === 0 && Game.pClass === 2) {
            // 마법사 투사체: 진행 방향 + Glowing Orb
            const bAngle = Math.atan2(b.vy, b.vx);
            ctx.save();
            ctx.translate(bx, b.y);
            ctx.rotate(bAngle);
            // 외부 글로우
            const orbR = b.r * 2.4;
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, orbR);
            grd.addColorStop(0,   "rgba(240, 230, 180, 0.95)");
            grd.addColorStop(0.3, "rgba(160,  80, 220, 0.8)");
            grd.addColorStop(0.7, "rgba( 60,  20, 180, 0.4)");
            grd.addColorStop(1,   "rgba(  0,   0,  80, 0)");
            ctx.shadowBlur = 12; ctx.shadowColor = "#aa44ff";
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(0, 0, orbR, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            // 뼈 코어 (방향 따라 회전)
            ctx.fillStyle = "rgba(220, 200, 255, 0.92)";
            ctx.fillRect(-b.r * 1.2, -b.r * 0.35, b.r * 2.4, b.r * 0.7);
            ctx.beginPath(); ctx.arc(-b.r * 1.1, 0, b.r * 0.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc( b.r * 1.1, 0, b.r * 0.5, 0, Math.PI * 2); ctx.fill();
            // 미세 파티클
            const fNow = frameNow;
            ctx.fillStyle = "rgba(180, 120, 255, 0.55)";
            for (let pi = 0; pi < 3; pi++) {
                const ppx = Math.sin(fNow * 0.01 + pi * 2.09) * orbR * 0.75;
                const ppy = Math.cos(fNow * 0.013 + pi * 1.75) * orbR * 0.55;
                ctx.beginPath(); ctx.arc(ppx, ppy, 1.4, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        } else {
            ctx.fillStyle = b.sk ? "#00ccff" : "#ffcc22"; ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.fill(); 
        }
    });
    
    Game.lasers.forEach(l => { 
        if (!l.active) return; 
        const lx = l.x - Game.camX; 
        if (lx + l.w < 0 || lx > CW) return; 
        ctx.save(); ctx.globalAlpha = l.life / l.maxLife; ctx.fillStyle = l.color; ctx.fillRect(lx, l.y, l.w, l.h); 
        ctx.fillStyle = "#ffffff"; ctx.fillRect(lx, l.y + l.h * 0.2, l.w, l.h * 0.6); 
        ctx.restore(); 
    });
    
    Game.parts.forEach(pt => { 
        if (!pt.active) return; 
        const px = pt.x - Game.camX; 
        if (px < -10 || px > CW + 10) return; 
        ctx.globalAlpha = pt.life / pt.ml; ctx.fillStyle = pt.col; ctx.fillRect(px - (pt.size / 2), pt.y - (pt.size / 2), pt.size, pt.size); ctx.globalAlpha = 1; 
    });

    Game.enemies.forEach(e => {
        if (!e.active) return; 
        const ex = e.x - Game.camX; 
        if (ex < -100 || ex > CW + 100) return;
        
        ctx.save(); 
        ctx.translate(Math.round(ex + e.w / 2), Math.round(e.y + e.h / 2));

        if (e.warnT > 0) {
            ctx.save();
            if (e.isBoss) {
                const maxW = e.phase === 1 ? 38 : 25;
                const warnProg = 1 - e.warnT / maxW; // 0→1
                ctx.globalAlpha = 0.1 + warnProg * 0.6;
                // ap별 경고색 (레이저=주황, 탄막=노랑, 기타=보라)
                const wd = e.warnData;
                const w = e.world;
                
                const warnCols = ["#ff4400", "#ffcc00", "#cc00ff"];
                ctx.fillStyle = warnCols[Math.min(2, wd.ap || 0)];
                // 마지막 0.3초 깜빡임 효과
                if (e.warnT <= 8 && Math.floor(e.warnT / 2) % 2 === 0) ctx.globalAlpha = 0.85;

                if (wd.ap === 0) {
                    if (w <= 2) {
                        // 전방 부채꼴 + 중앙선 (실제 발사 각도 표시)
                        const baseAng = wd.facing > 0 ? 0 : Math.PI;
                        ctx.fillStyle = "rgba(255,80,0,0.25)";
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 360, baseAng - 0.6, baseAng + 0.6);
                        ctx.fill();
                        // 5발 방향선
                        ctx.strokeStyle = "rgba(255,120,0,0.4)"; ctx.lineWidth = 2;
                        const cnt = wd.p2 ? 5 : 3;
                        for (let si = -(cnt-1)/2; si <= (cnt-1)/2; si++) {
                            const a = baseAng + si * 0.25;
                            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*360, Math.sin(a)*360); ctx.stroke();
                        }
                    } else if (w <= 4) {
                        // 수평 레이저 (facing 방향)
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -8, 800, 16);
                    } else if (w <= 6) {
                        // 넓은 수평 레이저
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -50, 800, 100);
                    } else if (w <= 8) {
                        // 수직 낙뢰 - 플레이어 위치 기준 (경고를 플레이어 위에 그림)
                        ctx.fillStyle = "#ff6600";
                        // 렌더는 e 중심 기준이라 targetX 오프셋 적용
                        const pOffX = (wd.targetX || 0) - (e.x + e.w/2);
                        ctx.fillRect(pOffX - 15, -CH, 30, CH * 2);
                    } else {
                        // w9~10: 십자 표시
                        ctx.fillStyle = "#aa00ff";
                        const pOffX = (wd.targetX || 0) - (e.x + e.w/2);
                        ctx.fillRect(pOffX - 15, -CH, 30, CH * 2);
                    }
                } else if (wd.ap === 1) {
                    if (w <= 2) {
                        // w1~2: 수평 레이저 경고 (실제와 일치)
                        ctx.fillStyle = "rgba(200,100,0,0.35)";
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -10, 800, 20);
                        ctx.strokeStyle = "rgba(255,150,0,0.6)"; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(wd.facing > 0 ? 0:-800, 0); ctx.lineTo(wd.facing > 0 ? 800:-0, 0); ctx.stroke();
                    } else if (w <= 4) {
                        // 전방 화살 부채꼴
                        const baseAng = wd.facing > 0 ? 0 : Math.PI;
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 380, baseAng - 0.55, baseAng + 0.55);
                        ctx.fill();
                    } else if (w <= 6) {
                        // 플레이어 방향 호
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 400, wd.ang - 0.4, wd.ang + 0.4);
                        ctx.fill();
                    } else if (w <= 8) {
                        // 광역 수평 레이저
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -25, 800, 50);
                    } else {
                        // w9: 플레이어 방향 부채꼴
                        ctx.fillStyle = "#aa00ff";
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 400, wd.ang - 0.5, wd.ang + 0.5);
                        ctx.fill();
                    }
                } else {
                    if (w <= 4) {
                        // 전방위
                        ctx.beginPath(); ctx.arc(0, 0, 380, 0, Math.PI*2); ctx.fill();
                    } else if (w === 5) {
                        // 낙하 폭탄 (아래 방향)
                        ctx.fillStyle = "#cc6600";
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 350, Math.PI*0.3, Math.PI*0.7);
                        ctx.fill();
                    } else if (w === 6) {
                        // 수직 낙뢰 예고
                        const pOffX = (wd.targetX || 0) - (e.x + e.w/2);
                        ctx.fillStyle = "#ff0055";
                        ctx.fillRect(pOffX - 12, -CH, 24, CH * 2);
                    } else if (w === 7) {
                        // 전방위 + 수평 레이저 동시
                        ctx.beginPath(); ctx.arc(0, 0, 320, 0, Math.PI*2); ctx.fill();
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -8, 800, 16);
                    } else if (w === 8) {
                        // 화살비 (위에서 아래)
                        ctx.fillStyle = "#ff3300";
                        for(let ri=0; ri<5; ri++) {
                            ctx.fillRect(-100 + ri*50, -CH, 20, CH*2);
                        }
                    } else {
                        // w9~10: 소용돌이 표시
                        ctx.fillStyle = w === 10 ? "#ff0000" : "#aa00ff";
                        ctx.beginPath(); ctx.arc(0, 0, 400, 0, Math.PI*2); ctx.fill();
                    }
                }
            } else {
                if (e.type === "ranged_bullet") {
                    // 경고 범위: 붉은 계열, 범위 대폭 축소, shadowBlur 없음
                    const wProg  = 1 - e.warnT / (e.isElite ? 35 : 25);
                    ctx.globalAlpha = 0.12 + wProg * 0.22;
                    ctx.fillStyle = "#cc2200";    // 다른 몹과 같은 붉은색 계열
                    // 마지막 0.25초 깜빡임
                    if (e.warnT <= 8 && Math.floor(e.warnT / 2) % 2 === 0) ctx.globalAlpha = 0.4;
                    const spreadAngle = e.isElite ? 0.28 : 0.18; // 대폭 축소
                    const maxR = e.isElite ? 180 : 140;           // 사거리도 축소
                    ctx.beginPath(); ctx.moveTo(0, 0);
                    ctx.arc(0, 0, maxR, e.warnData.ang - spreadAngle, e.warnData.ang + spreadAngle);
                    ctx.fill();
                    // 중심선 (실제 발사 방향 명시)
                    ctx.globalAlpha *= 1.5;
                    ctx.strokeStyle = "rgba(220,60,40,0.45)"; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(e.warnData.ang) * maxR, Math.sin(e.warnData.ang) * maxR);
                    ctx.stroke();
                }
                else if (e.type === "ranged_laser") {
                    // 레이저 경고: 붉은 계열, 눈부심 없이 얇게
                    const lProg = 1 - e.warnT / 40;
                    ctx.globalAlpha = 0.15 + lProg * 0.25;
                    ctx.fillStyle = "#cc2200";
                    if (e.warnT <= 8 && Math.floor(e.warnT / 2) % 2 === 0) ctx.globalAlpha = 0.5;
                    const lFacing = e.warnData.facing;
                    const lH = e.isElite ? 8 : 5;
                    ctx.fillRect(lFacing > 0 ? 0 : -600, -Math.floor(lH/2), 600, lH);
                    // 레이저 중심선
                    ctx.strokeStyle = "rgba(220,60,40,0.5)"; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lFacing * 600, 0); ctx.stroke();
                }
                else if (e.type === "shield" || e.type === "melee") {
                    ctx.globalAlpha = 0.1 + (1 - e.warnT / 50) * 0.2;
                    ctx.fillStyle = "#cc1122";
                    if (e.warnT <= 8 && Math.floor(e.warnT / 2) % 2 === 0) ctx.globalAlpha = 0.38;
                    ctx.beginPath(); ctx.moveTo(0, 0);
                    ctx.arc(0, 0, 55, e.facing > 0 ? -0.6 : Math.PI - 0.6, e.facing > 0 ? 0.6 : Math.PI + 0.6);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        ctx.scale(e.facing, 1); 
        if (e.flash > 0 && e.flash % 2 === 0) ctx.globalAlpha = 0.4;
        
        const eBob = (!e.isBoss || e.world < 5) && e.onGround && e.vx !== 0 ? (e.fr === 0 ? -1 : 0) : 0;
        const wRot = e.warnT > 0 ? -Math.PI * 0.3 : (e.atkAnim > 0 ? Math.PI * 0.6 : 0); 

        if (e.isBoss) {
            ctx.save();
            // ── 텔레그래프 오라: warnT 동안 공격 예고색 표시 ──
            if (e.warnT > 0 && e.warnData) {
                ctx.save(); ctx.scale(2.5, 2.5);
                const wProg = Math.min(1, 1 - e.warnT / 38);
                let oraR = 255, oraG = 60, oraB = 0;
                if (e.warnData.ap === 1)      { oraR=255; oraG=200; oraB=0; }
                else if (e.warnData.ap === 2) { oraR=180; oraG=0;   oraB=255; }
                const oraA = wProg * 0.5;
                const oGrd = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
                oGrd.addColorStop(0,   `rgba(${oraR},${oraG},${oraB},${oraA})`);
                oGrd.addColorStop(0.5, `rgba(${oraR},${oraG},${oraB},${oraA*0.3})`);
                oGrd.addColorStop(1,   'rgba(0,0,0,0)');
                ctx.fillStyle = oGrd;
                ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 20 * wProg; ctx.shadowColor = `rgb(${oraR},${oraG},${oraB})`;
                ctx.restore();
            }
            ctx.scale(2.5, 2.5); 
            const p2 = e.phase === 2;
            
            if (p2) { 
                ctx.shadowBlur = 15; 
                ctx.shadowColor = "#ff0000"; 
            }
            if (e.isRevived) {
                // 언데드화: 흑백에 가깝게, 눈은 별도 처리
                ctx.filter = 'grayscale(90%) brightness(0.65) contrast(1.3) sepia(15%)';
            }

            if (e.world <= 2) { 
                // 고블린 킹 - 거대 오우거형, 뿔투구+철퇴
                const b = eBob;
                // 다리 (굵고 짧음)
                ctx.fillStyle = "#2a4a1a";
                ctx.fillRect(-15, 14+b, 11, 18); ctx.fillRect(4, 14+b, 11, 18);
                ctx.fillStyle = "#1a3010";
                ctx.fillRect(-16, 28+b, 12, 6); ctx.fillRect(4, 28+b, 12, 6);
                // 몸통 (덩치 크게)
                ctx.fillStyle = "#3a7a28";
                ctx.fillRect(-22, -8+b, 44, 24);
                // 가슴 갑옷판
                ctx.fillStyle = "#4a4a55"; ctx.fillRect(-18, -6+b, 36, 18);
                ctx.fillStyle = "#5a5a66"; ctx.fillRect(-16, -4+b, 32, 3);
                ctx.fillStyle = "#333"; ctx.fillRect(-8, 2+b, 16, 8); // 배
                // 어깨 스파이크
                ctx.fillStyle = "#555";
                for (let sp = 0; sp < 3; sp++) {
                    ctx.beginPath(); ctx.moveTo(-22+sp*2, -8+b); ctx.lineTo(-26+sp, -18+b); ctx.lineTo(-18+sp*2, -10+b); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(22-sp*2, -8+b); ctx.lineTo(26-sp, -18+b); ctx.lineTo(18-sp*2, -10+b); ctx.fill();
                }
                // 팔
                ctx.fillStyle = "#2a5a1a";
                ctx.fillRect(-36, -6+b, 14, 20); ctx.fillRect(22, -6+b, 14, 20);
                // 머리 (크고 둥근)
                ctx.fillStyle = "#3a7a28";
                ctx.beginPath(); ctx.arc(0, -22+b, 17, 0, Math.PI*2); ctx.fill();
                ctx.fillRect(-15, -28+b, 30, 10);
                // 눈 (빨간 or 노란)
                ctx.fillStyle = p2 ? "#ff0000" : "#ffcc00";
                ctx.fillRect(-11, -26+b, 7, 5); ctx.fillRect(4, -26+b, 7, 5);
                ctx.fillStyle = "#000"; ctx.fillRect(-9, -25+b, 3, 3); ctx.fillRect(5, -25+b, 3, 3);
                // 이빨 (아랫니)
                ctx.fillStyle = "#e8e0d0";
                ctx.fillRect(-10, -10+b, 5, 5); ctx.fillRect(-3, -9+b, 4, 6); ctx.fillRect(3, -9+b, 4, 6); ctx.fillRect(7, -10+b, 5, 5);
                // 투구 (뿔)
                ctx.fillStyle = "#444";
                ctx.fillRect(-18, -32+b, 36, 8);
                ctx.fillStyle = "#555"; ctx.fillRect(-18, -28+b, 36, 4);
                // 큰 뿔 2개
                ctx.fillStyle = "#3a3a40";
                ctx.beginPath(); ctx.moveTo(-18,-28+b); ctx.lineTo(-30,-55+b); ctx.lineTo(-6,-30+b); ctx.fill();
                ctx.beginPath(); ctx.moveTo(18,-28+b); ctx.lineTo(30,-55+b); ctx.lineTo(6,-30+b); ctx.fill();
                // 철퇴
                ctx.save(); ctx.translate(32, 14+b); ctx.rotate(wRot+0.3);
                ctx.fillStyle = "#4a2a0a"; ctx.fillRect(-2, 0, 4, 30);
                ctx.strokeStyle = "#555"; ctx.lineWidth = 2;
                for (let ch = 0; ch < 3; ch++) { ctx.beginPath(); ctx.arc(0, 34+ch*5, 4, 0, Math.PI*2); ctx.stroke(); }
                ctx.fillStyle = "#555";
                ctx.beginPath(); ctx.arc(0, 48, 12, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#777";
                for (let sp = 0; sp < 8; sp++) {
                    const sa = sp*Math.PI/4; const sr = 12;
                    ctx.beginPath(); ctx.moveTo(Math.cos(sa)*sr, 48+Math.sin(sa)*sr);
                    ctx.lineTo(Math.cos(sa)*sr*1.7, 48+Math.sin(sa)*sr*1.7);
                    ctx.lineTo(Math.cos(sa+0.3)*sr*0.9, 48+Math.sin(sa+0.3)*sr*0.9); ctx.fill();
                }
                ctx.restore();
            } 
                        else if (e.world <= 4) { 
                // 언데드 해골 마법사 (이미지2 참고)
                const b = eBob;
                const t = frameNow;
                // 로브 하단 (너덜너덜)
                ctx.fillStyle = "#aa2200";
                ctx.beginPath();
                ctx.moveTo(-20, 14+b);
                for(let i=0; i<=8; i++) {
                    let rx = -20 + i*5;
                    let ry = 14 + (i%2===0 ? 12 : 6);
                    ctx.lineTo(rx, ry+b);
                }
                ctx.lineTo(20, 14+b); ctx.fill();
                // 로브 몸통
                ctx.fillStyle = "#cc2800";
                ctx.beginPath();
                ctx.moveTo(-20, -10+b);
                ctx.lineTo(-22, 14+b);
                ctx.lineTo(22, 14+b);
                ctx.lineTo(20, -10+b);
                ctx.fill();
                // 로브 어깨/소매
                ctx.fillStyle = "#bb2200";
                ctx.fillRect(-28, -8+b, 10, 20);
                ctx.fillRect(18, -8+b, 10, 20);
                // 로브 장식선
                ctx.strokeStyle = "#ff6622"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-4, -10+b); ctx.lineTo(-4, 14+b); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(4, -10+b); ctx.lineTo(4, 14+b); ctx.stroke();
                // 목/뼈
                ctx.fillStyle = "#d8d8cc";
                ctx.fillRect(-5, -16+b, 10, 8);
                // 해골 머리
                ctx.fillStyle = "#e0ddd5";
                ctx.beginPath(); ctx.arc(0, -26+b, 14, 0, Math.PI*2); ctx.fill();
                // 광대뼈
                ctx.fillStyle = "#c8c5bd";
                ctx.fillRect(-14, -24+b, 5, 6);
                ctx.fillRect(9, -24+b, 5, 6);
                // 눈구멍
                ctx.fillStyle = p2 ? "#ff0000" : "#000";
                ctx.shadowBlur = p2 ? 12 : 0; ctx.shadowColor = "#ff0000";
                ctx.beginPath(); ctx.ellipse(-6, -28+b, 4, 5, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(6, -28+b, 4, 5, 0, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
                // 코 구멍
                ctx.fillStyle = "#aaa";
                ctx.fillRect(-2, -23+b, 2, 3); ctx.fillRect(1, -23+b, 2, 3);
                // 이빨 (아랫턱)
                ctx.fillStyle = "#e0ddd5";
                ctx.fillRect(-10, -16+b, 20, 4);
                ctx.fillStyle = "#222";
                for(let i=0; i<5; i++) ctx.fillRect(-8+i*4, -16+b, 2, 4);
                // 후드 (로브 모자)
                ctx.fillStyle = "#991a00";
                ctx.beginPath();
                ctx.moveTo(-18, -22+b);
                ctx.quadraticCurveTo(-20, -50+b, 0, -52+b);
                ctx.quadraticCurveTo(20, -50+b, 18, -22+b);
                ctx.fill();
                ctx.fillStyle = "#bb2200";
                ctx.beginPath(); ctx.arc(0, -22+b, 18, Math.PI, 0); ctx.fill();
                // 지팡이
                ctx.save();
                ctx.translate(22, -4+b);
                ctx.rotate(wRot - 0.2);
                // 지팡이 막대
                ctx.fillStyle = "#4a2e0a";
                ctx.fillRect(-2, -60, 4, 70);
                // 지팡이 상단 해골 장식
                ctx.fillStyle = "#d8d4c8";
                ctx.beginPath(); ctx.arc(0, -62, 8, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.ellipse(-3, -64, 2, 3, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(3, -64, 2, 3, 0, 0, Math.PI*2); ctx.fill();
                // 지팡이 마법석
                const gemColor = p2 ? "#ff2200" : "#dd0077";
                ctx.fillStyle = gemColor;
                ctx.shadowBlur = 15; ctx.shadowColor = gemColor;
                ctx.beginPath(); ctx.arc(0, -72, 6, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
                // 가시
                ctx.fillStyle = "#666";
                for(let sp=0; sp<4; sp++) { ctx.fillRect(-1+sp*3, -78, 2, 6); }
                ctx.restore();
            } 
            else if (e.world <= 6) { 
                // 거대 봉인석 - 석판+사슬+보라 핵 (이미지3 참고)
                const t = frameNow;
                const floatY = Math.sin(t / 600) * 8;
                const rot = t / 3000;
                
                ctx.save();
                ctx.translate(0, floatY);
                
                // 사슬 + 파편 (4방향)
                for(let i=0; i<4; i++) {
                    ctx.save();
                    ctx.rotate(i * Math.PI / 2 + rot * 0.3);
                    // 사슬
                    ctx.strokeStyle = "#333"; ctx.lineWidth = 2;
                    for(let ch=0; ch<5; ch++) {
                        ctx.beginPath(); ctx.arc(55 + ch*7, 0, 3, 0, Math.PI*2); ctx.stroke();
                    }
                    // 파편 (적색 균열 있는 돌)
                    ctx.fillStyle = "#2a2a2e";
                    ctx.fillRect(82, -12, 20, 22);
                    ctx.fillStyle = "#1a1a1e";
                    ctx.fillRect(84, -10, 16, 18);
                    ctx.strokeStyle = "#880000"; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(85, -8); ctx.lineTo(96, 5); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(92, -6); ctx.lineTo(88, 8); ctx.stroke();
                    ctx.restore();
                }
                
                // 외곽 석판 링 (룬 문자 새겨진)
                ctx.strokeStyle = "#2a2a30"; ctx.lineWidth = 18;
                ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI*2); ctx.stroke();
                ctx.strokeStyle = "#1a1a20"; ctx.lineWidth = 14;
                ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI*2); ctx.stroke();
                // 룬 눈금
                ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 1;
                for(let r=0; r<12; r++) {
                    const a = r * Math.PI / 6;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(a)*38, Math.sin(a)*38);
                    ctx.lineTo(Math.cos(a)*55, Math.sin(a)*55);
                    ctx.stroke();
                }
                
                // 뾰족한 십자 기둥 (상하)
                ctx.fillStyle = "#222226";
                ctx.beginPath();
                ctx.moveTo(-6, -48); ctx.lineTo(0, -75); ctx.lineTo(6, -48); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-6, 48); ctx.lineTo(0, 75); ctx.lineTo(6, 48); ctx.fill();
                
                // 내부 어두운 공간
                ctx.fillStyle = "#0a0810";
                ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI*2); ctx.fill();
                
                // 핵 - 보라빛 소용돌이
                const coreColor = p2 ? "#ff0033" : "#aa00ff";
                const coreGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
                coreGrd.addColorStop(0, p2 ? "#ff88aa" : "#ff88ff");
                coreGrd.addColorStop(0.4, coreColor);
                coreGrd.addColorStop(1, "rgba(60,0,80,0)");
                ctx.shadowBlur = p2 ? 40 : 25;
                ctx.shadowColor = coreColor;
                ctx.fillStyle = coreGrd;
                ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
                
                // 핵 중심 눈 (세로 동공)
                ctx.fillStyle = p2 ? "#fff" : "#eeddff";
                ctx.beginPath(); ctx.ellipse(0, 0, 6, 16, rot*2, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.ellipse(0, 0, 2, 14, rot*2, 0, Math.PI*2); ctx.fill();
                
                ctx.restore();
            } 
            else if (e.world <= 9) { 
                // 마족 친위대장 - 검은 갑옷 기사 (이미지4 참고)
                const t = frameNow;
                const isW7 = e.world === 7;
                const isW8 = e.world === 8;
                const isW9 = e.world === 9;
                const b = eBob;
                const capeFlap = Math.sin(t / 250) * 8;
                
                // 망토 (흰 연기 느낌, 뒤쪽)
                ctx.fillStyle = "rgba(240, 240, 255, 0.18)";
                ctx.beginPath();
                ctx.moveTo(-8, -25+b);
                ctx.quadraticCurveTo(-40, -10+b, -50+capeFlap, 20+b);
                ctx.lineTo(-35+capeFlap*0.5, 30+b);
                ctx.quadraticCurveTo(-20, 10+b, -6, 18+b);
                ctx.fill();
                ctx.fillStyle = "rgba(220, 220, 240, 0.12)";
                ctx.beginPath();
                ctx.moveTo(8, -22+b);
                ctx.quadraticCurveTo(38, -8+b, 45-capeFlap, 18+b);
                ctx.lineTo(30-capeFlap*0.5, 28+b);
                ctx.quadraticCurveTo(18, 8+b, 6, 16+b);
                ctx.fill();
                
                // 다리 (갑옷)
                ctx.fillStyle = "#0a0a10";
                ctx.fillRect(-13, 12+b, 10, 16);
                ctx.fillRect(3, 12+b, 10, 16);
                ctx.fillStyle = "#1a1a22"; // 무릎 갑옷
                ctx.fillRect(-14, 14+b, 11, 6);
                ctx.fillRect(3, 14+b, 11, 6);
                ctx.fillStyle = "#111118"; // 부츠
                ctx.fillRect(-14, 24+b, 12, 5);
                ctx.fillRect(2, 24+b, 12, 5);
                
                // 몸통 갑옷
                ctx.fillStyle = "#0d0d14";
                ctx.fillRect(-18, -8+b, 36, 22);
                // 갑옷 장식 (금색 라인)
                ctx.strokeStyle = "#8B7536"; ctx.lineWidth = 1;
                ctx.strokeRect(-17, -7+b, 34, 20);
                ctx.beginPath(); ctx.moveTo(0, -8+b); ctx.lineTo(0, 14+b); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-17, 4+b); ctx.lineTo(17, 4+b); ctx.stroke();
                // 갑옷 어깨 (날카로운 각)
                ctx.fillStyle = "#111118";
                ctx.beginPath(); ctx.moveTo(-18, -8+b); ctx.lineTo(-28, -18+b); ctx.lineTo(-28, -4+b); ctx.lineTo(-18, 4+b); ctx.fill();
                ctx.beginPath(); ctx.moveTo(18, -8+b); ctx.lineTo(28, -18+b); ctx.lineTo(28, -4+b); ctx.lineTo(18, 4+b); ctx.fill();
                ctx.fillStyle = "#8B7536";
                ctx.beginPath(); ctx.moveTo(-28, -18+b); ctx.lineTo(-24, -22+b); ctx.lineTo(-20, -16+b); ctx.fill();
                ctx.beginPath(); ctx.moveTo(28, -18+b); ctx.lineTo(24, -22+b); ctx.lineTo(20, -16+b); ctx.fill();
                
                // 목
                ctx.fillStyle = "#111";
                ctx.fillRect(-6, -14+b, 12, 8);
                
                // 투구 (날카로운 각, 마족 스타일)
                ctx.fillStyle = "#0a0a10";
                ctx.beginPath();
                ctx.moveTo(-16, -14+b);
                ctx.lineTo(-18, -30+b);
                ctx.lineTo(-10, -22+b);
                ctx.lineTo(-5, -38+b);
                ctx.lineTo(0, -24+b);
                ctx.lineTo(5, -38+b);
                ctx.lineTo(10, -22+b);
                ctx.lineTo(18, -30+b);
                ctx.lineTo(16, -14+b);
                ctx.fill();
                // 투구 챙
                ctx.fillStyle = "#151520";
                ctx.fillRect(-17, -20+b, 34, 8);
                // 눈 (붉은 빛)
                ctx.fillStyle = p2 ? "#ff6600" : "#ff0000";
                ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
                ctx.fillRect(-12, -17+b, 8, 4);
                ctx.fillRect(4, -17+b, 8, 4);
                ctx.shadowBlur = 0;
                
                // 왼팔
                ctx.fillStyle = "#0a0a10";
                ctx.fillRect(-30, -6+b, 12, 16);
                ctx.fillStyle = "#111118";
                ctx.fillRect(-31, -2+b, 14, 6);
                
                // 오른팔 + 무기
                ctx.fillStyle = "#0a0a10";
                ctx.fillRect(18, -6+b, 12, 16);
                ctx.fillStyle = "#111118";
                ctx.fillRect(19, -2+b, 13, 6);
                
                ctx.save();
                ctx.translate(30, 10+b);
                ctx.rotate(wRot + 0.2);
                
                if (isW7) {
                    // 큰 검 (거대한 양날검)
                    ctx.fillStyle = "#0d0d0d";
                    ctx.fillRect(-6, -55, 12, 65); // 손잡이+날
                    ctx.fillStyle = "#cc0033";
                    ctx.fillRect(-1, -55, 2, 55); // 검날 붉은 선
                    // 가드
                    ctx.fillStyle = "#8B7536";
                    ctx.fillRect(-18, -2, 36, 6);
                    // 날 끝 (역삼각)
                    ctx.fillStyle = "#0d0d0d";
                    ctx.beginPath(); ctx.moveTo(-6, -55); ctx.lineTo(0, -75); ctx.lineTo(6, -55); ctx.fill();
                    ctx.fillStyle = "#cc0033";
                    ctx.beginPath(); ctx.moveTo(-1, -55); ctx.lineTo(0, -70); ctx.lineTo(1, -55); ctx.fill();
                } else if (isW8) {
                    // 활
                    ctx.strokeStyle = "#1a0a0a"; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(-5, -15, 35, -0.9, 0.9); ctx.stroke();
                    ctx.strokeStyle = "#888"; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(8, -45); ctx.lineTo(8, 15); ctx.stroke(); // 줄
                    // 화살 장전 중
                    ctx.fillStyle = "#4a2a0a";
                    ctx.fillRect(6, -40, 3, 50);
                    ctx.fillStyle = "#cc2200";
                    ctx.beginPath(); ctx.moveTo(5, -40); ctx.lineTo(9, -45); ctx.lineTo(13, -40); ctx.fill();
                } else if (isW9) {
                    // 마법 지팡이 (마족 친위대 마법사)
                    ctx.fillStyle = "#1a0a1a";
                    ctx.fillRect(-3, -65, 6, 75);
                    // 지팡이 끝 크리스탈
                    const crystalColor = p2 ? "#ff0066" : "#cc00ff";
                    ctx.fillStyle = crystalColor;
                    ctx.shadowBlur = 20; ctx.shadowColor = crystalColor;
                    ctx.beginPath();
                    ctx.moveTo(0, -78); ctx.lineTo(-8, -62); ctx.lineTo(0, -55); ctx.lineTo(8, -62); ctx.fill();
                    ctx.shadowBlur = 0;
                    // 마법 고리
                    ctx.strokeStyle = "#8800cc"; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(0, -62, 12, 0, Math.PI*2); ctx.stroke();
                }
                ctx.restore();
            } 
            else { 
                // 마왕 (Demon Lord) - 다크판타지 위압감 마왕
                const b = eBob;
                const t = frameNow;
                const oraFlicker = (Math.sin(t * 0.002) + 1) / 2;
                const cloak = Math.sin(t * 0.003) * 5;

                // ── 외부 오라 (검붉은 에너지장) ──
                for (let layer = 0; layer < 4; layer++) {
                    const oR = 60 + layer * 18 + oraFlicker * 10;
                    const oA = (0.18 - layer * 0.04) * (0.5 + oraFlicker * 0.5);
                    const oGrd = ctx.createRadialGradient(0, -10+b, 10, 0, -10+b, oR);
                    oGrd.addColorStop(0, `rgba(180,0,20,${oA})`);
                    oGrd.addColorStop(0.7, `rgba(80,0,10,${oA*0.3})`);
                    oGrd.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = oGrd;
                    ctx.beginPath(); ctx.arc(0, -10+b, oR, 0, Math.PI*2); ctx.fill();
                }

                // ── 망토 (거대한 너덜너덜) ──
                ctx.fillStyle = "#050005";
                ctx.beginPath();
                ctx.moveTo(-32, -18+b);
                for (let i = 0; i <= 14; i++) {
                    const rx = -32 + i * 4.6;
                    const ry = 18 + (i % 2 === 0 ? 20 : 12) + Math.sin(t * 0.004 + i) * 4;
                    ctx.lineTo(rx, ry + b);
                }
                ctx.lineTo(32, -18+b); ctx.fill();
                // 망토 본체
                ctx.fillStyle = "#07000a";
                ctx.beginPath();
                ctx.moveTo(-30, -22+b);
                ctx.quadraticCurveTo(-36, 0+b, -32+cloak*0.5, 18+b);
                ctx.lineTo(32-cloak*0.5, 18+b);
                ctx.quadraticCurveTo(36, 0+b, 30, -22+b); ctx.fill();
                // 망토 내부 문양
                ctx.strokeStyle = `rgba(150,0,20,0.35)`; ctx.lineWidth = 1;
                for (let m = 0; m < 4; m++) {
                    ctx.beginPath(); ctx.moveTo(-22+m*14, -18+b); ctx.quadraticCurveTo(-16+m*14, 5+b, -22+m*14, 18+b); ctx.stroke();
                }

                // ── 소매/팔 ──
                ctx.fillStyle = "#050005";
                ctx.beginPath(); ctx.moveTo(-30,-18+b); ctx.quadraticCurveTo(-50,-5+b,-54,10+b); ctx.lineTo(-44,14+b); ctx.quadraticCurveTo(-36,0+b,-22,-10+b); ctx.fill();
                ctx.beginPath(); ctx.moveTo(30,-18+b); ctx.quadraticCurveTo(50,-5+b,54,10+b); ctx.lineTo(44,14+b); ctx.quadraticCurveTo(36,0+b,22,-10+b); ctx.fill();
                // 발톱 손
                ctx.fillStyle = "#110010";
                ctx.fillRect(-58, 8+b, 9, 12);
                ctx.fillRect(49, 8+b, 9, 12);
                ctx.strokeStyle = "#330020"; ctx.lineWidth = 1;
                for (let cl = 0; cl < 3; cl++) {
                    ctx.beginPath(); ctx.moveTo(-56+cl*2, 20+b); ctx.lineTo(-58+cl*2, 28+b); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(51+cl*2, 20+b); ctx.lineTo(49+cl*2, 28+b); ctx.stroke();
                }

                // ── 몸통 갑옷 ──
                ctx.fillStyle = "#080008";
                ctx.fillRect(-20, -16+b, 40, 26);
                // 갑옷 금장
                ctx.strokeStyle = `rgba(160,120,0,0.6)`; ctx.lineWidth = 1.5;
                ctx.strokeRect(-19, -15+b, 38, 24);
                ctx.beginPath(); ctx.moveTo(0,-16+b); ctx.lineTo(0,10+b); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-19,0+b); ctx.lineTo(19,0+b); ctx.stroke();
                // 가슴 문양 (펜타그램 느낌)
                ctx.strokeStyle = `rgba(180,0,0,${0.5 + oraFlicker*0.4})`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, -4+b, 8, 0, Math.PI*2); ctx.stroke();
                ctx.shadowBlur = 6; ctx.shadowColor = "#ff0000";
                ctx.beginPath(); ctx.arc(0, -4+b, 3, 0, Math.PI*2);
                ctx.fillStyle = `rgba(200,0,0,${0.6+oraFlicker*0.4})`; ctx.fill();
                ctx.shadowBlur = 0;

                // ── 목 ──
                ctx.fillStyle = "#0a0008";
                ctx.fillRect(-8, -24+b, 16, 10);

                // ── 왕관 (마왕 왕관) ──
                ctx.fillStyle = "#0a0006";
                for (let k = 0; k < 7; k++) {
                    const kh = k % 2 === 0 ? 16 : 9;
                    ctx.fillRect(-24 + k * 7, -56 - kh + b, 6, kh);
                }
                ctx.fillRect(-26, -56+b, 52, 6);
                // 왕관 보석들
                const gemCols = ["#cc0040","#aa0000","#cc0040","#aa0000","#cc0040","#aa0000","#cc0040"];
                ctx.shadowBlur = 8; ctx.shadowColor = "#ff0033";
                for (let k = 0; k < 4; k++) {
                    ctx.fillStyle = p2 ? "#ff4400" : gemCols[k*2];
                    ctx.beginPath(); ctx.arc(-18 + k * 12, -57 + b, 3, 0, Math.PI*2); ctx.fill();
                }
                ctx.shadowBlur = 0;

                // ── 후드/머리 ──
                ctx.fillStyle = "#050008";
                ctx.beginPath();
                ctx.moveTo(-24, -24+b);
                ctx.quadraticCurveTo(-28, -58+b, 0, -66+b);
                ctx.quadraticCurveTo(28, -58+b, 24, -24+b); ctx.fill();
                // 후드 테두리 문양
                ctx.strokeStyle = `rgba(160,0,30,0.5)`; ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-24, -24+b);
                ctx.quadraticCurveTo(-28, -58+b, 0, -66+b);
                ctx.quadraticCurveTo(28, -58+b, 24, -24+b); ctx.stroke();

                // ── 눈 (세로 동공, 강렬한 붉은빛) ──
                const eyeGlow = 0.8 + oraFlicker * 0.2;
                ctx.fillStyle = `rgba(255, 0, 30, ${eyeGlow})`;
                ctx.shadowBlur = p2 ? 28 : 18; ctx.shadowColor = "#ff0022";
                ctx.beginPath(); ctx.ellipse(-9, -42+b, 5, 8, 0.15, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(9, -42+b, 5, 8, -0.15, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.ellipse(-9, -42+b, 2, 6, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(9, -42+b, 2, 6, 0, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
            }

            ctx.filter = 'none'; 
            ctx.restore();
        } 
        else {
            const scaleVal = e.isElite ? 1.8 : 1.5;
            ctx.scale(scaleVal, scaleVal);
            // scale 후 Y 보정 — 발바닥이 히트박스 아래에 닿도록
            // e.h/2 (히트박스 중심) → 실제 발바닥은 히트박스 하단
            // scale로 커진 만큼 위로 올려서 발이 지면에 맞닿게
            const yFix = (e.h / 2) * (1 - 1/scaleVal);
            ctx.translate(0, -yFix);
            // ── 특수 타입 시각 처리 ──
            if (e.type === 'phantom' && !e.visible) {
                ctx.globalAlpha = 0.18 + Math.sin(frameNow * 0.015) * 0.08;
            }
            if (e.type === 'bomber' && e.fuseT > 0) {
                const fuseProg = e.fuseT / 80;
                ctx.shadowBlur = 8 + fuseProg * 20; ctx.shadowColor = '#ff4400';
            }
            
            if (e.isElite) {
                ctx.shadowBlur = 15; 
                ctx.shadowColor = "#ff0000"; 
                ctx.filter = 'sepia(1) hue-rotate(320deg) saturate(5) brightness(0.8)';
            }
            
            let legL = e.fr === 0 ? 0 : -2, legR = e.fr === 0 ? -2 : 0;
            
            const eb = eBob;

            // ── 튜토리얼 더미 골렘 전용 렌더 ──
            if (e.isTutorialDummy) {
                // 회색 돌 골렘 — 단순하고 명확하게
                // 몸통
                ctx.fillStyle = "#6a6a72"; ctx.fillRect(-14, -18+eb, 28, 24);
                ctx.fillStyle = "#555560"; ctx.fillRect(-14, -18+eb, 28, 4); // 어깨선
                ctx.fillStyle = "#78787f"; ctx.fillRect(-12, -14+eb, 24, 16); // 가슴 하이라이트
                // 머리
                ctx.fillStyle = "#6a6a72"; ctx.fillRect(-10, -32+eb, 20, 16);
                ctx.fillStyle = "#78787f"; ctx.fillRect(-8, -30+eb, 16, 10);
                // 눈 (빨간 점 — 마법 골렘 느낌)
                ctx.fillStyle = "#ff3300"; ctx.shadowBlur = 4; ctx.shadowColor = "#ff3300";
                ctx.fillRect(-6, -27+eb, 3, 3); ctx.fillRect(3, -27+eb, 3, 3);
                ctx.shadowBlur = 0;
                // 팔
                ctx.fillStyle = "#5a5a62";
                ctx.fillRect(-22, -16+eb, 9, 18); ctx.fillRect(13, -16+eb, 9, 18);
                // 다리
                ctx.fillRect(-10, 6+eb, 8, 8+legL); ctx.fillRect(2, 6+eb, 8, 8+legR);
                // DUMMY 라벨 — facing scale 역적용해서 텍스트 뒤집힘 방지
                ctx.save();
                ctx.scale(e.facing, 1); // facing=-1이면 다시 +1 방향으로 되돌림
                ctx.fillStyle = "rgba(255,255,100,0.85)";
                ctx.font = "bold 7px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                ctx.fillText("DUMMY", 0, -42+eb);
                ctx.textAlign = "left";
                ctx.restore();
                // 렌더 완료 — 아래 월드별 렌더 건너뜀 + 무기도 skip
            } else if (e.world <= 2) {
                // ── 고블린: 납작 머리, 큰 귀, 황색 눈, 가죽 갑옷 ──
                ctx.fillStyle = "#2a6b28"; // 귀
                ctx.fillRect(-8, -10+eb, 4, 7); ctx.fillRect(5, -10+eb, 4, 7);
                ctx.fillStyle = "#8b2020";
                ctx.fillRect(-7, -9+eb, 2, 4); ctx.fillRect(6, -9+eb, 2, 4);
                ctx.fillStyle = "#4e342e"; // 몸통 가죽 조끼
                ctx.fillRect(-6, -1+eb, 12, 11);
                ctx.fillStyle = "#6d4c41"; ctx.fillRect(-1, -1+eb, 2, 11);
                ctx.fillStyle = "#5d4037"; ctx.fillRect(-7, -1+eb, 4, 3); ctx.fillRect(4, -1+eb, 4, 3);
                ctx.fillStyle = "#388e3c"; // 머리
                ctx.fillRect(-5, -12+eb, 10, 12);
                ctx.fillStyle = "#2e7d32"; ctx.fillRect(-6, -10+eb, 12, 4);
                ctx.fillStyle = "#f9a825"; // 황금 눈
                ctx.fillRect(-4, -9+eb, 3, 3); ctx.fillRect(2, -9+eb, 3, 3);
                ctx.fillStyle = "#000"; ctx.fillRect(-3, -8+eb, 1, 2); ctx.fillRect(3, -8+eb, 1, 2);
                ctx.fillStyle = "#fafafa"; // 이빨
                ctx.fillRect(-4, -1+eb, 2, 2); ctx.fillRect(-1, -1+eb, 2, 2); ctx.fillRect(2, -1+eb, 2, 2);
                ctx.fillStyle = "#388e3c"; // 팔
                ctx.fillRect(-9, -1+eb, 4, 9); ctx.fillRect(6, -1+eb, 4, 9);
                ctx.fillStyle = "#2e7d32"; // 다리
                ctx.fillRect(-5, 10+eb, 4, 5+legL); ctx.fillRect(2, 10+eb, 4, 5+legR);
                ctx.fillStyle = "#1b5e20";
                ctx.fillRect(-6, 14+eb+legL, 5, 3); ctx.fillRect(2, 14+eb+legR, 5, 3);
            } else if (e.world <= 4) {
                // ── 언데드 해골: 뼈 몸통, 갈비뼈, 이빨 노출 ──
                ctx.fillStyle = "#c8c5bc"; ctx.fillRect(-4, -1+eb, 8, 11);
                ctx.strokeStyle = "#aaa89e"; ctx.lineWidth = 1;
                for (let ri = 0; ri < 3; ri++) {
                    ctx.beginPath(); ctx.moveTo(-3, 1+ri*3+eb); ctx.lineTo(-7, 2+ri*3+eb); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(3, 1+ri*3+eb); ctx.lineTo(7, 2+ri*3+eb); ctx.stroke();
                }
                ctx.fillStyle = "#ddd8cf";
                ctx.beginPath(); ctx.arc(0, -8+eb, 7, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#c5c2b8"; ctx.fillRect(-8, -8+eb, 3, 4); ctx.fillRect(5, -8+eb, 3, 4);
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.ellipse(-3, -9+eb, 2.5, 3.5, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(3, -9+eb, 2.5, 3.5, 0, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#111"; ctx.fillRect(-1, -5+eb, 1, 2); ctx.fillRect(1, -5+eb, 1, 2);
                ctx.fillStyle = "#e8e4da"; ctx.fillRect(-5, -1+eb, 10, 3);
                ctx.fillStyle = "#1a1a1a"; for (let ti=0;ti<4;ti++) ctx.fillRect(-4+ti*3, -1+eb, 1, 3);
                ctx.fillStyle = "#c8c5bc";
                ctx.fillRect(-9, -1+eb, 3, 10); ctx.fillRect(6, -1+eb, 3, 10);
                ctx.fillRect(-4, 10+eb, 3, 6+legL); ctx.fillRect(2, 10+eb, 3, 6+legR);
            } else if (e.world <= 6) {
                // ── 어둠 기사: 판갑, 붉은 눈, 자주 망토 ──
                ctx.fillStyle = "rgba(50,0,30,0.85)";
                ctx.beginPath(); ctx.moveTo(-5, -5+eb); ctx.quadraticCurveTo(-12, 4+eb, -10+legL*0.4, 14+eb); ctx.lineTo(-4, 10+eb); ctx.fill();
                ctx.fillStyle = "#111118"; ctx.fillRect(-7, -4+eb, 14, 15);
                ctx.fillStyle = "#1a1a22"; ctx.fillRect(-7, -4+eb, 14, 3);
                ctx.strokeStyle = "#4a3a18"; ctx.lineWidth = 1; ctx.strokeRect(-6, -3+eb, 12, 13);
                ctx.beginPath(); ctx.moveTo(0, -4+eb); ctx.lineTo(0, 11+eb); ctx.stroke();
                ctx.fillStyle = "#0d0d14"; ctx.fillRect(-7, -16+eb, 14, 13);
                ctx.fillStyle = "#151520"; ctx.fillRect(-8, -9+eb, 16, 5);
                ctx.fillStyle = "#111118";
                ctx.beginPath(); ctx.moveTo(-5, -16+eb); ctx.lineTo(-8, -24+eb); ctx.lineTo(-2, -16+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(5, -16+eb); ctx.lineTo(8, -24+eb); ctx.lineTo(2, -16+eb); ctx.fill();
                ctx.fillStyle = "#ff0033"; ctx.shadowBlur = 6; ctx.shadowColor = "#ff0033";
                ctx.fillRect(-5, -12+eb, 4, 2); ctx.fillRect(2, -12+eb, 4, 2);
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#111118"; ctx.fillRect(-11, -4+eb, 5, 12); ctx.fillRect(7, -4+eb, 5, 12);
                ctx.fillStyle = "#0d0d14"; ctx.fillRect(-6, 11+eb, 5, 7+legL); ctx.fillRect(2, 11+eb, 5, 7+legR);
                ctx.fillStyle = "#111118"; ctx.fillRect(-7, 15+eb, 6, 4); ctx.fillRect(2, 15+eb, 6, 4);
            } else if (e.world <= 8) {
                // ── 마족: 굽은 뿔, 보라 눈, 로브+갑옷 ──
                ctx.fillStyle = "#220022";
                ctx.beginPath(); ctx.moveTo(-3,-16+eb); ctx.quadraticCurveTo(-8,-22+eb,-6,-26+eb); ctx.lineTo(-4,-24+eb); ctx.quadraticCurveTo(-5,-20+eb,-1,-16+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(3,-16+eb); ctx.quadraticCurveTo(8,-22+eb,6,-26+eb); ctx.lineTo(4,-24+eb); ctx.quadraticCurveTo(5,-20+eb,1,-16+eb); ctx.fill();
                ctx.fillStyle = "#0d000d"; ctx.fillRect(-8, -3+eb, 16, 15);
                ctx.beginPath(); ctx.moveTo(-8,12+eb); ctx.lineTo(-10+legL*0.5,18+eb); ctx.lineTo(-5,12+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,12+eb); ctx.lineTo(10-legR*0.5,18+eb); ctx.lineTo(5,12+eb); ctx.fill();
                ctx.fillStyle = "#1a0022"; ctx.fillRect(-6, -2+eb, 12, 10);
                ctx.strokeStyle = "#440044"; ctx.lineWidth = 1; ctx.strokeRect(-5, -1+eb, 10, 8);
                ctx.fillStyle = "#180018"; ctx.fillRect(-6, -16+eb, 12, 14);
                ctx.fillStyle = "#cc00ff"; ctx.shadowBlur = 6; ctx.shadowColor = "#aa00ff";
                ctx.beginPath(); ctx.ellipse(-3, -11+eb, 2, 3.5, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(3, -11+eb, 2, 3.5, 0, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#000"; ctx.fillRect(-3,-11+eb,1,3); ctx.fillRect(3,-11+eb,1,3);
                ctx.fillStyle = "#ddd"; ctx.fillRect(-4,-2+eb,2,2); ctx.fillRect(-1,-2+eb,2,2); ctx.fillRect(2,-2+eb,2,2);
                ctx.fillStyle = "#0d000d"; ctx.fillRect(-11,-3+eb,4,12); ctx.fillRect(8,-3+eb,4,12);
                ctx.fillStyle = "#180018"; ctx.fillRect(-6,12+eb,4,5+legL); ctx.fillRect(3,12+eb,4,5+legR);
            } else {
                // ── w9~10 악령: 다수 눈, 촉수 다리 ──
                ctx.fillStyle = "#1a0008";
                ctx.beginPath();
                ctx.moveTo(-7,-3+eb); ctx.lineTo(-8,-10+eb); ctx.lineTo(-4,-16+eb);
                ctx.lineTo(-1,-18+eb); ctx.lineTo(2,-16+eb); ctx.lineTo(6,-18+eb);
                ctx.lineTo(8,-10+eb); ctx.lineTo(7,-3+eb); ctx.lineTo(6,12+eb); ctx.lineTo(-6,12+eb); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = "#550010"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-2,-10+eb); ctx.lineTo(0,-3+eb); ctx.lineTo(-1,5+eb); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(3,-8+eb); ctx.lineTo(2,2+eb); ctx.stroke();
                const eyeD = [[-4,-12],[-1,-14],[3,-10],[5,-13]];
                eyeD.forEach((ep, ei) => {
                    const ec = ei < 2 ? "#ff0000" : "#ff6600";
                    ctx.fillStyle = ec; ctx.shadowBlur = 5; ctx.shadowColor = ec;
                    ctx.beginPath(); ctx.ellipse(ep[0], ep[1]+eb, 1.8, 2.5, 0, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(ep[0], ep[1]+eb, 0.6, 2, 0, 0, Math.PI*2); ctx.fill();
                });
                ctx.shadowBlur = 0;
                ctx.strokeStyle = "#2a0010"; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(-4,12+eb); ctx.quadraticCurveTo(-6,15+eb+legL,-5,18+eb+legL); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(4,12+eb); ctx.quadraticCurveTo(6,15+eb+legR,5,18+eb+legR); ctx.stroke();
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(-2,12+eb); ctx.quadraticCurveTo(-3,16+eb,-1,19+eb); ctx.stroke();
            }

            if (e.type === "shield") {
                if (e.isGuarding) {
                    // 방패 (가드 중: 세로로 세워서 막는 자세)
                    ctx.fillStyle = "#8090a0"; ctx.fillRect(3, -14 + eBob, 9, 26);
                    ctx.fillStyle = "#b0bec5"; ctx.fillRect(4, -13 + eBob, 7, 24);
                    ctx.fillStyle = "#78909c"; ctx.fillRect(5, -7 + eBob, 5, 3);   // 가로 손잡이
                    ctx.strokeStyle = "#607d8b"; ctx.lineWidth = 1;
                    ctx.strokeRect(4, -13 + eBob, 7, 24);
                } else {
                    // 방패 (내린 상태: 옆구리에 차고 있음)
                    ctx.fillStyle = "#8090a0"; ctx.fillRect(-2, 5 + eBob, 13, 5);
                    ctx.fillStyle = "#b0bec5"; ctx.fillRect(-1, 6 + eBob, 11, 3);
                }
                // 방패 타입 배지 (하늘색 S)
                ctx.fillStyle = "#00aaff"; ctx.font = "bold 6px SkullFont, NeoDunggeunmo";
                ctx.fillText("S", -8, -8 + eBob);
            } 
            else if (e.type === "melee" && !e.isTutorialDummy) {
                ctx.save(); ctx.translate(5, -6 + eBob); ctx.rotate(wRot);
                if (e.world <= 2) {
                    // 단검 (고블린)
                    ctx.fillStyle = "#c0c8d0"; ctx.fillRect(-1, -12, 4, 14);
                    ctx.fillStyle = "#8b6914"; ctx.fillRect(-2, 0, 6, 5); // 가드
                    ctx.fillStyle = "#5d4037"; ctx.fillRect(0, 4, 2, 6);  // 손잡이
                } else if (e.world <= 4) {
                    // 긴 뼈 검 (해골)
                    ctx.fillStyle = "#ddd8cf"; ctx.fillRect(-1, -16, 3, 18);
                    ctx.fillStyle = "#b0a898"; ctx.fillRect(-3, 0, 7, 3);   // 가드
                    ctx.fillStyle = "#ccc"; ctx.fillRect(-1, -18, 3, 3);    // 끝 뾰족
                } else if (e.world <= 6) {
                    // 암흑검 (어둠 기사)
                    ctx.fillStyle = "#1a1a22"; ctx.fillRect(-2, -18, 5, 20);
                    ctx.fillStyle = "#ff0033"; ctx.fillRect(-1, -18, 2, 18); // 붉은 날
                    ctx.fillStyle = "#333340"; ctx.fillRect(-5, -1, 11, 4);  // 가드
                    ctx.fillStyle = "#222"; ctx.fillRect(-1, 3, 3, 6);       // 손잡이
                } else if (e.world <= 8) {
                    // 황금 마족검
                    ctx.fillStyle = "#0d0d14"; ctx.fillRect(-2, -20, 5, 22);
                    ctx.fillStyle = "#ffd700"; ctx.fillRect(-1, -20, 2, 20); // 황금 날
                    ctx.fillStyle = "#aa8800"; ctx.fillRect(-5, -1, 11, 4);
                    ctx.fillStyle = "#cc9900"; ctx.fillRect(-1, 3, 3, 7);
                } else {
                    // 마왕성 죽음의 낫
                    ctx.fillStyle = "#0a000f"; ctx.fillRect(-1, -22, 4, 24);
                    ctx.fillStyle = "#00ffcc"; ctx.fillRect(-1, -22, 2, 22); // 청록 날
                    ctx.fillStyle = "#330066"; ctx.fillRect(-4, -2, 10, 4);
                    ctx.fillStyle = "#1a0033"; ctx.fillRect(-1, 2, 3, 8);
                }
                ctx.restore();
            }
            
            // ── 원거리 타입 구분 배지 ──
            if (e.type === "ranged_bullet") {
                // 탄환형: 주황 원 + B 표시
                ctx.fillStyle = "rgba(255,120,0,0.85)";
                ctx.beginPath(); ctx.arc(-7, -12 + eBob, 5, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = "bold 6px SkullFont, NeoDunggeunmo";
                ctx.textAlign = "center"; ctx.fillText("B", -7, -9 + eBob); ctx.textAlign = "left";
            } else if (e.type === "ranged_laser") {
                // 레이저형: 빨간 다이아 + L 표시
                ctx.fillStyle = "rgba(255,30,30,0.9)";
                ctx.save(); ctx.translate(-7, -12 + eBob); ctx.rotate(Math.PI/4);
                ctx.fillRect(-4, -4, 8, 8); ctx.restore();
                ctx.fillStyle = "#fff"; ctx.font = "bold 6px SkullFont, NeoDunggeunmo";
                ctx.textAlign = "center"; ctx.fillText("L", -7, -9 + eBob); ctx.textAlign = "left";
            } else if (e.type === "bomber") {
                // 자폭형: 빨주 폭탄 아이콘
                ctx.fillStyle = "rgba(255,60,0,0.9)";
                ctx.beginPath(); ctx.arc(-7, -12 + eBob, 5, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#ffdd00"; ctx.font = "bold 6px SkullFont, NeoDunggeunmo";
                ctx.textAlign = "center"; ctx.fillText("!", -7, -9 + eBob); ctx.textAlign = "left";
            } else if (e.type === "phantom") {
                // 투명형: 보라 눈 아이콘
                ctx.fillStyle = "rgba(180,0,255,0.8)";
                ctx.beginPath(); ctx.ellipse(-7, -12 + eBob, 5, 3, 0, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = "bold 6px SkullFont, NeoDunggeunmo";
                ctx.textAlign = "center"; ctx.fillText("P", -7, -9 + eBob); ctx.textAlign = "left";
            }
            ctx.filter = 'none';
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        if (!e.isBoss) {
            const bw = 24 * 1.5, bx = ex + e.w / 2 - bw / 2, by = e.y - 10;
            if (bx > -10 && bx < CW) {
                // HP 바
                ctx.fillStyle = "#220000"; ctx.fillRect(bx, by, bw, 3);
                let hpCol = e.isElite ? "#aa00ff" : (e.hp / e.maxHp > 0.5 ? "#22aa22" : "#cc2222");
                if (e.type === "shield" && !e.isElite) hpCol = e.hp / e.maxHp > 0.5 ? "#607d8b" : "#455a64";
                ctx.fillStyle = hpCol; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 3);
                // 체간(Poise) 바
                if ((e.poiseMx || 0) > 0 && !e.stun) {
                    const poisePct = Math.max(0, (e.poise || 0) / e.poiseMx);
                    ctx.fillStyle = "rgba(20,0,0,0.6)"; ctx.fillRect(bx, by + 4, bw, 2);
                    ctx.fillStyle = poisePct > 0.5 ? "#4488ff" : (poisePct > 0.25 ? "#ffaa00" : "#ff2200");
                    ctx.fillRect(bx, by + 4, bw * poisePct, 2);
                }
                // 스턴 표시
                if (e.stun) {
                    ctx.fillStyle = "rgba(255,238,0,0.85)";
                    ctx.font = "bold 10px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                    ctx.shadowBlur = 6; ctx.shadowColor = "#ffee00";
                    ctx.fillText("STUNNED!", bx + bw/2, by - 3);
                    ctx.shadowBlur = 0; ctx.textAlign = "left";
                }
            }
        }
    });

    if (Game.player && !Game.player.dead) {
        const p = Game.player, px = Math.round(p.x - Game.camX), py = Math.round(p.y);
        if (Game.invT === 0 || Math.floor(Game.invT / 4) % 2 === 0 || p.dashT > 0) {
            const isMoving = p.vx !== 0, isJumping = p.vy < 0, isFalling = p.vy > 0;
            let pyOffset = 0, pLegL_Y = 0, pLegR_Y = 0, pLegL_X = 0, pLegR_X = 0, armRot = 0;
            
            if (isJumping || p.plunging || p.dashT > 0) { 
                pyOffset = -2; pLegL_Y = -2; pLegR_Y = -4; pLegL_X = -2; pLegR_X = 2; armRot = -0.5;
            } else if (isFalling) { 
                pyOffset = 0; pLegL_Y = -1; pLegR_Y = -2; pLegL_X = -1; pLegR_X = 1; armRot = 0.5;
            } else if (isMoving) { 
                const swing = Math.sin(p.fr * Math.PI / 2);
                pyOffset = Math.abs(swing) * 1.5; 
                pLegL_Y = -Math.abs(swing) * 2; 
                pLegR_Y = -Math.abs(Math.cos(p.fr * Math.PI / 2)) * 2;
                pLegL_X = swing * 3; pLegR_X = -swing * 3; armRot = swing * 0.6; 
            }

            ctx.save(); 
            ctx.translate(px + 7, py + 9 + pyOffset); 
            ctx.scale(p.facing, 1);

            // 💡 [패치] 가드 시청각 효과 (가드는 하늘색)
            if (p.guarding || p.parryT > 0) {
                const parryPulse = p.parryT > 0 ? p.parryT / (10 + Game.pParryBonus) : 1;
                if (p.parryT > 0) {
                    // 패링 성공: 황금빛 확장 링
                    const parryR = 18 + (1-parryPulse) * 14;
                    ctx.strokeStyle = `rgba(255, 215, 0, ${parryPulse * 0.95})`;
                    ctx.lineWidth = 3 + (1-parryPulse) * 2;
                    ctx.shadowBlur = 15 * parryPulse; ctx.shadowColor = "#ffdd00";
                    ctx.beginPath(); ctx.arc(1, -pyOffset, parryR, 0, Math.PI*2); ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = `rgba(255, 238, 0, ${parryPulse * 0.35})`;
                    ctx.beginPath(); ctx.arc(1, -pyOffset, parryR, 0, Math.PI*2); ctx.fill();
                } else {
                    // 가드: 하늘색 방패
                    ctx.fillStyle = "rgba(0, 204, 255, 0.25)";
                    ctx.beginPath(); ctx.arc(1, -pyOffset, 17, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = "rgba(0, 204, 255, 0.8)";
                    ctx.lineWidth = 2; ctx.stroke();
                }
            }

            if (Game.pClass === 1) { 
                ctx.fillStyle = "#111"; 
                if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 8, 6); ctx.fillRect(-14, 6, 6, 4); }
                else if (isFalling) { ctx.fillRect(-12, -8, 8, 10); ctx.fillRect(-14, -12, 6, 4); }
                else if (isMoving) { const flap = Math.sin(p.fr * Math.PI / 2) * 2; ctx.fillRect(-14, 2 + flap, 10, 5); ctx.fillRect(-16, 4 + flap, 6, 4); }
                else { ctx.fillRect(-9, 3, 5, 8); ctx.fillRect(-11, 8, 5, 5); }
            } else if (Game.pClass === 2) { 
                ctx.fillStyle = "#4a0088"; 
                if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 10, 6); ctx.fillRect(-14, 6, 8, 4); }
                else if (isFalling) { ctx.fillRect(-12, -8, 10, 10); ctx.fillRect(-14, -12, 8, 4); }
                else if (isMoving) { const flap = Math.sin(p.fr * Math.PI / 2) * 2; ctx.fillRect(-14, 2 + flap, 12, 5); ctx.fillRect(-16, 4 + flap, 8, 4); }
                else { ctx.fillRect(-9, 3, 7, 8); ctx.fillRect(-11, 8, 7, 5); }
            } else { 
                ctx.fillStyle = "#990000";
                if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 8, 6); ctx.fillRect(-14, 6, 6, 4); }
                else if (isFalling) { ctx.fillRect(-12, -8, 8, 10); ctx.fillRect(-14, -12, 6, 4); }
                else if (isMoving) { const flap = Math.sin(p.fr * Math.PI / 2) * 2; ctx.fillRect(-14, 2 + flap, 10, 5); ctx.fillRect(-16, 4 + flap, 6, 4); }
                else { ctx.fillRect(-9, 3, 5, 8); ctx.fillRect(-11, 8, 5, 5); }
            }

            ctx.fillStyle = "#1a1a25"; ctx.fillRect(-6, 2, 12, 6); ctx.fillStyle = "#2a2a35"; ctx.fillRect(-5, 2, 10, 5);
            ctx.fillStyle = "#f8f8fa";
            if (!p.guarding) { ctx.fillRect(-5 + pLegL_X, 7 + pLegL_Y, 3, 5); ctx.fillRect(1 + pLegR_X, 7 + pLegR_Y, 3, 5); } 
            else { ctx.fillRect(-5, 5, 4, 2); ctx.fillRect(3, 5, 4, 2); }
            
            ctx.fillStyle = "#f8f8fa"; ctx.fillRect(-6, -10, 14, 10); ctx.fillRect(-7, -8, 16, 6); 
            
            if (Game.pClass === 1) { 
                ctx.fillStyle = "#222"; ctx.fillRect(-6, -10, 14, 4); ctx.fillRect(-7, -8, 16, 4);
                ctx.fillStyle = "#444"; ctx.fillRect(-4, -1, 10, 3);
            } else if (Game.pClass === 2) { 
                ctx.fillStyle = "#2a0044"; ctx.beginPath(); ctx.moveTo(1, -22); ctx.lineTo(-8, -10); ctx.lineTo(10, -10); ctx.fill();
                ctx.fillStyle = "#4a0088"; ctx.fillRect(-10, -10, 22, 2);
            } else { 
                ctx.fillStyle = "#d0d0d5"; ctx.fillRect(-4, 0, 10, 3);
                ctx.fillStyle = "#808085"; ctx.fillRect(-2, 0, 1, 3); ctx.fillRect(1, 0, 1, 3); ctx.fillRect(4, 0, 1, 3);
            }
            
            let eyeW = 4, eyeH = 4;
            if (isMoving) { let pulse = (p.fr % 2 === 0) ? 1 : 0; eyeW += pulse; eyeH += pulse; }
            ctx.fillStyle = "#0a0a0f"; ctx.fillRect(2, -7 - (eyeH - 4), eyeW, eyeH); ctx.fillRect(-4 - (eyeW - 4), -7 - (eyeH - 4), eyeW, eyeH);
            ctx.fillStyle = p.atkAnim > 0 ? "#ff0000" : "#fff"; ctx.fillRect(3, -6, 2, 2); ctx.fillRect(-3, -6, 2, 2);
            if (Game.pClass !== 1) { ctx.fillStyle = "#cc0000"; ctx.fillRect(-7, -1, 14, 4); ctx.fillStyle = "#ff3333"; ctx.fillRect(-6, -1, 12, 2); }

            if (p.plunging) {
                // 강하 모션: 아래 향한 무기 + 속도감 잔상
                ctx.save(); ctx.translate(5, 5); ctx.rotate(Math.PI * 0.75 * p.facing); drawBone(true, Game.pClass); ctx.restore();
                const plCol = Game.pClass === 0 ? "rgba(255,40,0" : (Game.pClass === 1 ? "rgba(180,0,255" : "rgba(0,180,255");
                for (let pl = 1; pl <= 3; pl++) {
                    ctx.strokeStyle = `${plCol},${0.45/pl})`;
                    ctx.lineWidth = 3/pl;
                    ctx.beginPath(); ctx.moveTo(-6+pl*2, -12+pl*2); ctx.lineTo(-6+pl*2, 10); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(6-pl*2, -12+pl*2); ctx.lineTo(6-pl*2, 10); ctx.stroke();
                }
            } else if (p.atkAnim > 0) {
                ctx.save(); ctx.translate(5, 5);
                let isLastHit = (Game.pClass === 1 && p.combo === 5) || (Game.pClass !== 1 && p.combo === 3);
                const maxAnim = isLastHit ? 20 : 12; 
                const progress = 1 - (p.atkAnim / maxAnim); 
                let angle = 0;
                
                if (!isLastHit) { 
                    if (p.combo % 2 === 1) { angle = -Math.PI * 0.7 + (Math.PI * 1.4 * progress); } 
                    else { angle = Math.PI * 0.7 - (Math.PI * 1.4 * progress); } 
                } else { 
                    if (progress < 0.3) { angle = -Math.PI * 0.8 - (progress * 1.5); } 
                    else { const p2 = (progress - 0.3) / 0.7; angle = -Math.PI * 1.2 + (Math.PI * 2.2 * p2); } 
                }
                
                ctx.rotate(angle * p.facing); drawBone(isLastHit, Game.pClass);
                if (Game.pClass === 1) { ctx.save(); ctx.translate(-15, 0); ctx.rotate(-Math.PI * 0.5); drawBone(false, 1); ctx.restore(); }
                // 클래스별 공격 이펙트 슬래시 자국
                if (isLastHit && progress > 0.3 && progress < 0.8) {
                    const slashProg = (progress - 0.3) / 0.5;
                    if (Game.pClass === 0) {
                        // 전사: 붉은 참격 잔상
                        ctx.fillStyle = `rgba(200, 0, 0, ${(1-slashProg)*0.5})`;
                        ctx.fillRect(0, -14, 22 + Game.pRangeBonus, 28);
                        ctx.strokeStyle = `rgba(255, 50, 0, ${(1-slashProg)*0.7})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(22 + Game.pRangeBonus, 14); ctx.stroke();
                    } else if (Game.pClass === 1) {
                        // 도적: 보라빛 잔상 + 다중선
                        for (let sl = 0; sl < 3; sl++) {
                            ctx.strokeStyle = `rgba(180, 0, 255, ${(1-slashProg)*(0.5-sl*0.12)})`;
                            ctx.lineWidth = 2 - sl * 0.5;
                            ctx.beginPath(); ctx.moveTo(sl*3, -12+sl*4); ctx.lineTo(20+Game.pRangeBonus+sl*3, 12-sl*4); ctx.stroke();
                        }
                    } else {
                        // 마법사: 파란 마법진 원
                        ctx.strokeStyle = `rgba(0, 200, 255, ${(1-slashProg)*0.6})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(12+Game.pRangeBonus/2, 0, 14, 0, Math.PI*2); ctx.stroke();
                        ctx.fillStyle = `rgba(0, 180, 255, ${(1-slashProg)*0.2})`;
                        ctx.fill();
                    }
                }
                ctx.restore();
            } else { 
                ctx.save(); ctx.translate(5, 5); ctx.rotate(armRot * 0.5); drawBone(false, Game.pClass); 
                if (Game.pClass === 1) { ctx.save(); ctx.translate(-15, 0); ctx.rotate(-Math.PI * 0.2); drawBone(false, 1); ctx.restore(); }
                ctx.restore(); 
            }
            ctx.restore();
        }
    }
}

// 💡 [수정] 640x360 캔버스 크기에 맞춰 박스와 텍스트 높이 완벽 픽셀 재조정