// render_bg.js — 배경/타일/환경 렌더링
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
    // 무기가 늘어나면 안 되는 클래스: 마법/투사체형은 사거리가 발사체/스킬 범위로 적용
    const _noExt = [2, 4, 6, 7, 8, 12, 13, 14, 15, 17];
    const ext = _noExt.includes(classType) ? 0 : (Game.pRangeBonus || 0);

    if (classType === 1) {
        // 도적 쌍단검 — 날렵한 단검 2개
        // 단검 1 (위)
        ctx.fillStyle = "#aaa";
        ctx.fillRect(0, -4, 10 + ext, 2);
        ctx.fillStyle = "#ddd";
        ctx.fillRect(7 + ext, -5, 5, 2); // 날끝
        ctx.fillStyle = "#664400";
        ctx.fillRect(-2, -5, 4, 4); // 손잡이
        // 단검 2 (아래)
        ctx.fillStyle = "#aaa";
        ctx.fillRect(0, 2, 10 + ext, 2);
        ctx.fillStyle = "#ddd";
        ctx.fillRect(7 + ext, 1, 5, 2);
        ctx.fillStyle = "#664400";
        ctx.fillRect(-2, 1, 4, 4);
    } else if (classType === 2) {
        // 마법사 지팡이 (하늘색 오브)
        ctx.fillStyle = "#5c3a21";
        ctx.fillRect(0, -1, 16 + ext, 4);
        ctx.fillStyle = "#00ccff";
        ctx.beginPath(); ctx.arc(16 + ext, 1, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(16 + ext, 1, 2, 0, Math.PI*2); ctx.fill();
    } else if (classType === 3) {
        // 버서커 대검 — 역수 그립, 굵고 무거운 대검
        // 손잡이 (두꺼운 가죽 손잡이)
        ctx.fillStyle = "#3a2000";
        ctx.fillRect(-3, -10, 7, 12); // 두꺼운 손잡이
        ctx.fillStyle = "#5a3a10";
        ctx.fillRect(-2, -9, 5, 10);  // 손잡이 하이라이트
        // 가드 (넓은 크로스가드)
        ctx.fillStyle = "#666";
        ctx.fillRect(-6, -2, 13, 3);  // 넓은 가드
        ctx.fillStyle = "#888";
        ctx.fillRect(-5, -2, 11, 2);
        // 칼날 (굵고 무거운 대검 — 아래로)
        ctx.fillStyle = "#888";
        ctx.fillRect(-4, 0, 9, 22 + ext);  // 굵은 칼날 본체
        ctx.fillStyle = "#aaa";
        ctx.fillRect(-2, 0, 5, 20 + ext);  // 중앙 하이라이트
        ctx.fillStyle = "#ccc";
        ctx.fillRect(-1, 0, 2, 18 + ext);  // 날끝 반짝임
        // 칼날 가장자리
        ctx.fillStyle = "#555";
        ctx.fillRect(-4, 0, 1, 22 + ext);  // 왼쪽 날
        ctx.fillRect(4, 0, 1, 22 + ext);   // 오른쪽 날
        // 두꺼운 칼끝
        ctx.fillStyle = "#666";
        ctx.fillRect(-3, 19 + ext, 7, 5);
        // 핏자국
        ctx.fillStyle = "rgba(160,0,0,0.7)";
        ctx.fillRect(-2, 16 + ext, 5, 7);
    } else if (classType === 4) {
        // 발키리 총 — 레트로 권총
        // 총몸
        ctx.fillStyle = "#555";
        ctx.fillRect(0, -3, 14 + ext, 6);
        ctx.fillStyle = "#333";
        ctx.fillRect(2, -2, 10 + ext, 4);
        // 총구
        ctx.fillStyle = "#222";
        ctx.fillRect(12 + ext, -2, 5, 3);
        // 손잡이
        ctx.fillStyle = "#4a3000";
        ctx.fillRect(2, 3, 5, 7);
        ctx.fillStyle = "#333";
        ctx.fillRect(1, 2, 4, 2); // 방아쇠 가드
        // 총구 불꽃 (발사 중)
        if (Game.player && Game.player.atkAnim > 0) {
            ctx.fillStyle = "#ffcc00";
            ctx.fillRect(17 + ext, -3, 5, 4);
            ctx.fillStyle = "#ff6600";
            ctx.fillRect(18 + ext, -2, 3, 2);
        }
    } else if (classType === 5) {
        // 성기사 — 짧은 망치
        ctx.fillStyle = "#5c3a21";
        ctx.fillRect(0, -1, 8, 3);
        ctx.fillStyle = "#888";
        ctx.fillRect(7, -5, 7, 10);
        ctx.fillStyle = "#aaa";
        ctx.fillRect(8, -4, 5, 8);
        ctx.fillStyle = "rgba(255,220,0,0.6)";
        ctx.fillRect(9, -3, 2, 2);
    } else if (classType === 6) {
        // 혈귀 — 혈조 (혈기 집중된 클로)
        ctx.fillStyle = "#550011";
        ctx.fillRect(0, -2, 6, 5);
        ctx.fillStyle = "#cc2244";
        ctx.shadowBlur = 4; ctx.shadowColor = "#cc2244";
        for(let c=0;c<3;c++) {
            const yOff = (c-1)*4;
            ctx.beginPath(); ctx.moveTo(6, yOff); ctx.lineTo(18+ext, yOff-3+c*1); ctx.lineTo(16+ext, yOff+1+c*1); ctx.closePath(); ctx.fill();
        }
        ctx.shadowBlur = 0;
    } else if (classType === 7) {
        // 조커 — 카드 패
        const cards = ["#ff2222","#2222ff","#ff2222","#000000"];
        for(let c=0;c<4;c++) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(c*5, -6+c*2, 7, 10);
            ctx.fillStyle = cards[c];
            ctx.fillRect(c*5+1, -5+c*2, 5, 8);
        }
    } else {
        // 검사: 날렵한 정통 한손검 (뼈검 완전 삭제)
        // 1. 손잡이 끝 장식 (Pommel)
        ctx.fillStyle = "#c8a030";
        ctx.fillRect(-2, -2, 2, 6);
        
        // 2. 손잡이 (Hilt)
        ctx.fillStyle = "#4a2a10";
        ctx.fillRect(0, -1, 5, 4);
        
        // 3. 코등이 (Guard)
        ctx.fillStyle = "#c8a030";
        ctx.fillRect(5, -5, 3, 12);
        ctx.fillStyle = "#e8c050";
        ctx.fillRect(6, -4, 1, 10); // 코등이 하이라이트
        
        // 4. 칼날 본체 (Blade)
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(8, -2, 12 + ext, 6);
        
        // 5. 칼날 빛반사 (상단 하이라이트)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(8, -1, 10 + ext, 2);
        
        // 6. 칼날 그림자 (하단 어두운 부분)
        ctx.fillStyle = "#909090";
        ctx.fillRect(8, 2, 10 + ext, 2);
        
        // 7. 뾰족한 칼끝 (Tip)
        ctx.fillStyle = "#e0e0e0";
        ctx.beginPath();
        ctx.moveTo(20 + ext, -2);
        ctx.lineTo(24 + ext, 1);
        ctx.lineTo(20 + ext, 4);
        ctx.fill();
        
        // 칼끝 빛반사 디테일
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(18 + ext, -1);
        ctx.lineTo(23 + ext, 1);
        ctx.lineTo(18 + ext, 1);
        ctx.fill();
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
    const isDestroyed = Game.worldN % 2 === 0 && Game.worldN >= 2 && Game.worldN <= 6;

    const tColors = themes[wg];

    const skyGrd = ctx.createLinearGradient(0, 0, 0, CH);
    skyGrd.addColorStop(0, "#000000"); 
    skyGrd.addColorStop(1, tColors[0]);
    ctx.fillStyle = skyGrd; 
    ctx.fillRect(0, 0, CW, CH);
    
    if (wg === 1) {
        // ── W1 고블린 숲: 무겁고 음산한 밤의 숲 ──────────────────────

        // 원경: 핏빛 달 (더 크고 불길하게)
        const moonX = CW * 0.75 - Game.camX * 0.015;
        const moonGrd = ctx.createRadialGradient(moonX, 48, 10, moonX, 48, 62);
        moonGrd.addColorStop(0, "rgba(210,170,90,0.90)");
        moonGrd.addColorStop(0.45, "rgba(160,110,50,0.55)");
        moonGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = moonGrd;
        ctx.beginPath(); ctx.arc(moonX, 48, 62, 0, Math.PI * 2); ctx.fill();
        // 달 표면 크레이터
        ctx.fillStyle = "rgba(5,3,8,0.55)";
        ctx.beginPath(); ctx.arc(moonX - 14, 40, 45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(5,3,8,0.30)";
        ctx.beginPath(); ctx.arc(moonX + 18, 62, 22, 0, Math.PI * 2); ctx.fill();
        // 달 주변 불길한 글로우
        const moonGlow = ctx.createRadialGradient(moonX, 48, 30, moonX, 48, 120);
        moonGlow.addColorStop(0, "rgba(80,40,0,0.12)");
        moonGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = moonGlow;
        ctx.beginPath(); ctx.arc(moonX, 48, 120, 0, Math.PI * 2); ctx.fill();

        // 원경 산맥 (3레이어, 더 어둡게)
        const mts = [
            { spd: 0.04, col: "rgba(12,7,20,0.95)", hBase: 210, var: 90 },
            { spd: 0.10, col: "rgba(20,10,28,0.88)", hBase: 155, var: 65 },
            { spd: 0.20, col: "rgba(30,14,35,0.82)", hBase: 115, var: 48 },
        ];
        mts.forEach(m => {
            ctx.fillStyle = m.col;
            ctx.beginPath(); ctx.moveTo(0, CH);
            for (let x = 0; x <= CW + 20; x += 8) {
                const wx = (x + Game.camX * m.spd) * 0.017;
                const h = m.hBase + Math.sin(wx * 1.05) * m.var + Math.sin(wx * 2.2 + 1.2) * (m.var * 0.42);
                ctx.lineTo(x, CH - h);
            }
            ctx.lineTo(CW, CH); ctx.fill();
        });

        // 원경 폐탑 실루엣 (숲 뒤로 탑 꼭대기만 보임)
        const wrap = CW + 200;
        for (let i = 0; i < 9; i++) {
            const bx = ((i * 300 + 60) % Game.levelW) * 0.28 - Game.camX * 0.28;
            const mod = ((bx % wrap) + wrap) % wrap - 100;
            if (mod < -130 || mod > CW + 60) continue;
            const ht = 165 + (i % 4) * 38; // 165~279px
            ctx.fillStyle = "rgba(6,3,10,0.95)";
            ctx.fillRect(mod, CH - ht, 26, ht);
            // 첨탑 끝
            ctx.beginPath();
            ctx.moveTo(mod - 4, CH - ht);
            ctx.lineTo(mod + 13, CH - ht - 40 - (i % 3) * 14);
            ctx.lineTo(mod + 30, CH - ht);
            ctx.fill();
            // 총안 (탑 꼭대기 위)
            for (let c2 = 0; c2 < 3; c2++) {
                ctx.fillRect(mod + c2 * 8, CH - ht - 18, 6, 18);
                ctx.clearRect(mod + c2 * 8 + 2, CH - ht - 18, 3, 12);
            }
            // 탑창 (붉은 빛, 탑 상단부에만)
            if (ht > 170) {
                const wFlk = (Math.sin(frameNow * 0.00045 + i * 1.9) + 1) / 2;
                const wA = 0.15 + wFlk * 0.45;
                ctx.fillStyle = `rgba(180,25,0,${wA})`;
                ctx.beginPath(); ctx.arc(mod + 13, CH - ht + 28, 5, Math.PI, 0); ctx.fill();
                ctx.fillRect(mod + 8, CH - ht + 28, 10, 8);
                if (wFlk > 0.4) {
                    const grd = ctx.createRadialGradient(mod+13, CH-ht+30, 0, mod+13, CH-ht+30, 18);
                    grd.addColorStop(0, `rgba(200,30,0,${wFlk * 0.22})`);
                    grd.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(mod+13, CH-ht+30, 18, 0, Math.PI*2); ctx.fill();
                }
            }
        }

        // ── 숲 나무 레이어 ──────────────────────────────
        // 나무 그리기 헬퍼: 어두운 고목 실루엣
        function drawForestTree(tx, treeH, trunkW, col) {
            // 줄기
            ctx.fillStyle = col;
            ctx.fillRect(tx - trunkW/2, CH - treeH, trunkW, treeH);
            // 불규칙 수관 (3단)
            const cw1 = trunkW * 5.5, cw2 = trunkW * 4.0, cw3 = trunkW * 2.8;
            const cy1 = CH - treeH - trunkW * 2.5;
            const cy2 = CH - treeH - trunkW * 5.5;
            const cy3 = CH - treeH - trunkW * 8.0;
            ctx.fillStyle = col;
            // 하단 수관
            ctx.beginPath(); ctx.moveTo(tx - cw1, CH - treeH + 6);
            ctx.lineTo(tx, cy1); ctx.lineTo(tx + cw1, CH - treeH + 6); ctx.fill();
            // 중단 수관
            ctx.beginPath(); ctx.moveTo(tx - cw2, cy1 + 4);
            ctx.lineTo(tx, cy2); ctx.lineTo(tx + cw2, cy1 + 4); ctx.fill();
            // 상단 수관
            ctx.beginPath(); ctx.moveTo(tx - cw3, cy2 + 4);
            ctx.lineTo(tx, cy3); ctx.lineTo(tx + cw3, cy2 + 4); ctx.fill();
            // 앙상한 가지 몇 개
            ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, trunkW * 0.35);
            ctx.beginPath(); ctx.moveTo(tx, CH - treeH);
            ctx.lineTo(tx - trunkW * 4, CH - treeH - trunkW * 3.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(tx, CH - treeH + trunkW);
            ctx.lineTo(tx + trunkW * 3.5, CH - treeH - trunkW * 2); ctx.stroke();
        }

        // 중경 나무 (시차 0.25, 탑 중단을 가림)
        const midSeed = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
        midSeed.forEach(i => {
            const bx = ((i * 220 + 40) % Game.levelW) * 0.25 - Game.camX * 0.25;
            const mod = ((bx % (CW + 300)) + (CW + 300)) % (CW + 300) - 120;
            if (mod < -140 || mod > CW + 80) return;
            const h = 130 + (i * 31 % 60);   // 130~190px
            const tw = 5 + (i % 3);           // 트렁크 폭
            const col = `rgba(${6 + i%3},${8 + i%4},${5},0.94)`;
            drawForestTree(mod, h, tw, col);
        });

        // 중경 안개 레이어 (나무 사이 낮게 깔림)
        for (let f = 0; f < 7; f++) {
            const fx = ((f * 160 + frameNow * 0.008 * (f % 2 === 0 ? 1 : -1) + Game.camX * 0.26) % (CW + 300)) - 100;
            const fogGrd = ctx.createRadialGradient(fx, CH - 55, 0, fx, CH - 55, 90);
            fogGrd.addColorStop(0, "rgba(15,8,22,0.22)");
            fogGrd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = fogGrd;
            ctx.beginPath(); ctx.ellipse(fx, CH - 55, 130, 42, 0, 0, Math.PI * 2); ctx.fill();
        }

        // 전경 나무 (시차 0.5, 가장 가깝고 큼)
        const fgSeed = [0,1,2,3,4,5,6,7,8,9,10];
        fgSeed.forEach(i => {
            const bx = ((i * 260 + 110) % Game.levelW) * 0.5 - Game.camX * 0.5;
            const mod = ((bx % (CW + 350)) + (CW + 350)) % (CW + 350) - 150;
            if (mod < -180 || mod > CW + 100) return;
            const h = 160 + (i * 43 % 70);   // 160~230px
            const tw = 7 + (i % 4);
            const col = `rgba(${4 + i%2},${6 + i%3},${3},0.97)`;
            drawForestTree(mod, h, tw, col);
        });

        // 지면 잡초/풀 (시차 0.6, 전경 하단)
        for (let g2 = 0; g2 < 18; g2++) {
            const gx = ((g2 * 140 + 20) % Game.levelW) * 0.6 - Game.camX * 0.6;
            const gmod = ((gx % (CW + 200)) + (CW + 200)) % (CW + 200) - 80;
            if (gmod < -100 || gmod > CW + 60) continue;
            const gh = 18 + (g2 % 5) * 6;
            ctx.fillStyle = `rgba(${5 + g2%3},${9 + g2%4},${3},0.90)`;
            ctx.beginPath();
            ctx.moveTo(gmod, CH - 35);
            ctx.lineTo(gmod - 6 + g2%5, CH - 35 - gh);
            ctx.lineTo(gmod + 6 - g2%4, CH - 35 - gh + 8);
            ctx.lineTo(gmod + 12, CH - 35); ctx.fill();
        }

        // 전경 지면 (어두운 흙빛 언덕)
        const hillGrd = ctx.createLinearGradient(0, CH - 70, 0, CH);
        hillGrd.addColorStop(0, "#0e0a16"); hillGrd.addColorStop(1, "#06040c");
        ctx.fillStyle = hillGrd;
        ctx.beginPath(); ctx.moveTo(0, CH);
        for (let x = 0; x <= CW; x += 10) {
            const wx = (x + Game.camX * 0.55) * 0.014;
            ctx.lineTo(x, CH - 36 - Math.sin(wx) * 20 - Math.sin(wx * 2.6) * 10);
        }
        ctx.lineTo(CW, CH); ctx.fill();

        // 전경 안개 (지면 밀착)
        for (let f2 = 0; f2 < 5; f2++) {
            const fx2 = ((f2 * 200 + frameNow * 0.012 * (f2 % 2 === 0 ? 1 : -1) + Game.camX * 0.55) % (CW + 300)) - 80;
            const fogGrd2 = ctx.createRadialGradient(fx2, CH - 30, 0, fx2, CH - 30, 75);
            fogGrd2.addColorStop(0, "rgba(12,5,18,0.28)");
            fogGrd2.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = fogGrd2;
            ctx.beginPath(); ctx.ellipse(fx2, CH - 30, 110, 30, 0, 0, Math.PI * 2); ctx.fill();
        }
    }
    else if (wg === 2) {
        const t2 = frameNow;

        // ── 원거리(parallax 0.03): 죽은 달 + 하늘 그라데이션 ──
        const moonX2 = CW * 0.72 - Game.camX * 0.018;
        const moonG2 = ctx.createRadialGradient(moonX2, 55, 8, moonX2, 55, 55);
        moonG2.addColorStop(0, "rgba(170,160,130,0.80)");
        moonG2.addColorStop(0.4, "rgba(100,90,80,0.40)");
        moonG2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = moonG2;
        ctx.beginPath(); ctx.arc(moonX2, 55, 55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(4,3,6,0.60)";
        ctx.beginPath(); ctx.arc(moonX2 - 12, 48, 38, 0, Math.PI * 2); ctx.fill();

        // ── 원거리(parallax 0.04): 폐허 도시 능선 ──
        ctx.fillStyle = "rgba(10,7,14,0.90)";
        ctx.beginPath(); ctx.moveTo(0, CH);
        const cityOff = Game.camX * 0.04;
        const cityPts = [0,220, 60,210, 90,170, 110,210, 160,195, 200,155, 230,195,
                         280,200, 320,160, 360,200, 410,185, 450,145, 480,185,
                         530,195, 580,165, 620,195, CW+20,200, CW+20,CH];
        for (let ci2 = 0; ci2 < cityPts.length; ci2 += 2)
            ctx.lineTo(cityPts[ci2] - cityOff % (CW + 20), cityPts[ci2 + 1]);
        ctx.closePath(); ctx.fill();
        // 도시 창문 빛
        for (let i = 0; i < 30; i++) {
            const wx = ((i * 97 + 20) - cityOff % (CW + 20) + CW + 20) % (CW + 20);
            const wy = CH - 175 + (i % 5) * 14;
            const wf = (Math.sin(t2 * 0.0003 + i * 1.7) + 1) / 2;
            if (wf > 0.35 && wx > 0 && wx < CW) {
                ctx.fillStyle = `rgba(180,40,0,${wf * 0.5})`;
                ctx.fillRect(wx, wy, 4, 5);
            }
        }

        // ── 중거리(parallax 0.12): 묘지 + 오벨리스크 ──
        const midOff2 = Game.camX * 0.12;
        for (let i = 0; i < 14; i++) {
            const gx = ((i * 210 + 30) - midOff2 % (CW + 300) + CW + 300) % (CW + 300) - 60;
            if (gx < -60 || gx > CW + 40) continue;
            const gh = 55 + (i % 4) * 18;
            ctx.fillStyle = "rgba(14,9,18,0.92)";
            // 비석 본체
            ctx.fillRect(gx - 8, CH - gh, 16, gh);
            // 비석 상단 아치
            ctx.beginPath(); ctx.arc(gx, CH - gh, 8, Math.PI, 0); ctx.fill();
            // 십자 새김
            ctx.fillStyle = "rgba(25,15,30,0.95)";
            ctx.fillRect(gx - 1, CH - gh + 6, 2, 12);
            ctx.fillRect(gx - 5, CH - gh + 10, 10, 2);
        }
        // 오벨리스크 (더 높고 뾰족)
        for (let i = 0; i < 5; i++) {
            const ox = ((i * 380 + 120) - midOff2 % (CW + 400) + CW + 400) % (CW + 400) - 60;
            if (ox < -60 || ox > CW + 40) continue;
            const oh = 90 + (i % 3) * 25;
            ctx.fillStyle = "rgba(12,7,16,0.95)";
            ctx.beginPath();
            ctx.moveTo(ox - 8, CH); ctx.lineTo(ox - 6, CH - oh);
            ctx.lineTo(ox, CH - oh - 25); ctx.lineTo(ox + 6, CH - oh);
            ctx.lineTo(ox + 8, CH); ctx.fill();
        }

        // ── 중거리(parallax 0.18): 폐허 성벽 + 아치 ──
        const wallOff = Game.camX * 0.18;
        for (let i = 0; i < 10; i++) {
            const wx2 = ((i * 260 + 60) - wallOff % (CW + 300) + CW + 300) % (CW + 300) - 80;
            if (wx2 < -80 || wx2 > CW + 60) continue;
            const wh = 110 + (i % 3) * 28;
            ctx.fillStyle = "rgba(18,11,22,0.88)";
            ctx.fillRect(wx2 - 18, CH - wh, 36, wh);
            // 아치 창
            ctx.fillStyle = "rgba(8,4,12,0.95)";
            ctx.beginPath(); ctx.arc(wx2, CH - wh + 22, 10, Math.PI, 0); ctx.fill();
            ctx.fillRect(wx2 - 10, CH - wh + 22, 20, 18);
            // 창문 불빛
            const wfl = (Math.sin(t2 * 0.0004 + i * 2.3) + 1) / 2;
            ctx.fillStyle = `rgba(200,30,5,${0.08 + wfl * 0.45})`;
            ctx.beginPath(); ctx.arc(wx2, CH - wh + 22, 9, Math.PI, 0); ctx.fill();
            ctx.fillRect(wx2 - 9, CH - wh + 22, 18, 16);
            if (wfl > 0.5) {
                const wg2 = ctx.createRadialGradient(wx2, CH - wh + 30, 0, wx2, CH - wh + 30, 30);
                wg2.addColorStop(0, `rgba(200,25,0,${wfl * 0.22})`);
                wg2.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = wg2; ctx.beginPath(); ctx.arc(wx2, CH - wh + 30, 30, 0, Math.PI * 2); ctx.fill();
            }
            // 흉벽
            for (let m = -2; m <= 2; m++) {
                if (m % 2 === 0) {
                    ctx.fillStyle = "rgba(18,11,22,0.88)";
                    ctx.fillRect(wx2 + m * 9 - 4, CH - wh - 14, 8, 14);
                }
            }
        }

        // ── 근거리(parallax 0.30): 죽은 나무 ──
        const nearOff2 = Game.camX * 0.30;
        for (let i = 0; i < 8; i++) {
            const tx2 = ((i * 290 + 40) - nearOff2 % (CW + 350) + CW + 350) % (CW + 350) - 80;
            if (tx2 < -80 || tx2 > CW + 30) continue;
            const sway = Math.sin(t2 * 0.0008 + i) * 2;
            ctx.strokeStyle = "rgba(12,7,16,0.98)"; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(tx2, CH);
            ctx.quadraticCurveTo(tx2 + sway * 3, CH - 50, tx2 + sway, CH - 95);
            ctx.stroke();
            ctx.lineWidth = 2.5;
            for (let b2 = 0; b2 < 4; b2++) {
                const by2 = CH - 50 - b2 * 14;
                const bd = b2 % 2 === 0 ? 1 : -1;
                ctx.beginPath(); ctx.moveTo(tx2 + sway * 0.5, by2);
                ctx.quadraticCurveTo(tx2 + bd * 18, by2 - 12, tx2 + bd * 26, by2 - 20); ctx.stroke();
                if (b2 < 2) {
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(tx2 + bd * 22, by2 - 16);
                    ctx.lineTo(tx2 + bd * 28, by2 - 8); ctx.stroke();
                    ctx.lineWidth = 2.5;
                }
            }
        }

        // ── 지면 안개 ──
        for (let f = 0; f < 6; f++) {
            const fx = ((f * 220 + t2 * 0.012 * (f % 2 === 0 ? 1 : -0.7)) % (CW + 300)) - 100;
            const fGrd = ctx.createRadialGradient(fx, CH - 35, 0, fx, CH - 35, 120);
            fGrd.addColorStop(0, "rgba(20,10,25,0.20)");
            fGrd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = fGrd;
            ctx.beginPath(); ctx.ellipse(fx, CH - 35, 160, 38, 0, 0, Math.PI * 2); ctx.fill();
        }
        // 부유하는 도깨비불
        for (let i = 0; i < 6; i++) {
            const wx3 = ((i * 240 + t2 * 0.022 * (i % 2 === 0 ? 1 : -0.8)) % (CW + 200)) - 60;
            const wy3 = CH - 70 - (i % 3) * 22 + Math.sin(t2 * 0.002 + i * 1.1) * 10;
            const wa = 0.12 + Math.sin(t2 * 0.003 + i) * 0.06;
            const wGrd = ctx.createRadialGradient(wx3, wy3, 0, wx3, wy3, 10);
            wGrd.addColorStop(0, `rgba(60,200,80,${wa + 0.12})`);
            wGrd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = wGrd; ctx.beginPath(); ctx.arc(wx3, wy3, 10, 0, Math.PI * 2); ctx.fill();
        }
    }
    else if (wg === 3) {
        const t = frameNow;

        // ── 핏빛 하늘 ──
        const skyB = ctx.createLinearGradient(0, 0, 0, CH);
        skyB.addColorStop(0, "#0e0005"); skyB.addColorStop(0.45, "#1c000e"); skyB.addColorStop(1, "#08000a");
        ctx.fillStyle = skyB; ctx.fillRect(0, 0, CW, CH);

        // 혈색 달 (원거리)
        const bMoonX = CW * 0.8 - Game.camX * 0.016;
        const bMoonGrd = ctx.createRadialGradient(bMoonX, 42, 6, bMoonX, 42, 48);
        bMoonGrd.addColorStop(0, "rgba(200,30,10,0.85)");
        bMoonGrd.addColorStop(0.5, "rgba(120,10,5,0.45)");
        bMoonGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bMoonGrd;
        ctx.beginPath(); ctx.arc(bMoonX, 42, 48, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(5,0,8,0.55)";
        ctx.beginPath(); ctx.arc(bMoonX - 8, 38, 36, 0, Math.PI * 2); ctx.fill();

        // ── 핏빛 구름 (원거리 0.05) ──
        for (let i = 0; i < 12; i++) {
            const cx2 = ((i * 175 + Game.camX * 0.05) % (CW + 200)) - 80;
            const cy2 = 25 + (i % 5) * 22;
            const r   = 40 + (i % 4) * 18;
            const cA  = 0.10 + (i % 3) * 0.05;
            const cGrd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
            cGrd.addColorStop(0, `rgba(90,0,25,${cA})`);
            cGrd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = cGrd;
            ctx.beginPath(); ctx.ellipse(cx2, cy2, r * 2.0, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        }

        // ── 원거리(0.035): 박쥐 떼 ──
        for (let i = 0; i < 10; i++) {
            const btx = ((i * 190 + t * 0.022 * (i % 2 === 0 ? 1 : -0.75)) % (CW + 230) + CW + 230) % (CW + 230) - 90;
            const bty = 18 + (i % 5) * 22 + Math.sin(t * 0.0018 + i * 1.2) * 7;
            const bsz = 4 + (i % 3) * 2.5;
            const flap = Math.sin(t * 0.01 + i * 0.85) > 0;
            ctx.fillStyle = "rgba(3,0,6,0.78)";
            ctx.save(); ctx.translate(btx, bty);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-bsz * 2.2, flap ? -bsz * 0.9 : bsz * 0.4); ctx.lineTo(-bsz * 0.6, 0); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bsz * 2.2, flap ? -bsz * 0.9 : bsz * 0.4); ctx.lineTo(bsz * 0.6, 0); ctx.fill();
            ctx.restore();
        }

        // ── 원거리(0.06): 산맥 능선 ──
        ctx.fillStyle = "rgba(6,2,10,0.92)";
        ctx.beginPath(); ctx.moveTo(0, CH);
        const mtOff3 = Game.camX * 0.06;
        const mt3Pts = [0,195, 55,155, 100,175, 155,130, 210,165, 270,120, 330,155,
                        390,125, 450,155, 510,135, 570,160, CW+30,170, CW+30,CH];
        for (let mi3 = 0; mi3 < mt3Pts.length; mi3 += 2)
            ctx.lineTo(mt3Pts[mi3] - mtOff3 % (CW + 60), mt3Pts[mi3 + 1]);
        ctx.closePath(); ctx.fill();

        // ── 원중거리(0.09): 고딕 성채 5탑 — 좌우로 넓게 ──
        const cOff3 = Game.camX * 0.09;
        const towers3 = [
            { rx: 0.08, h: 220, w: 28 }, { rx: 0.28, h: 280, w: 38 },
            { rx: 0.50, h: 340, w: 50 }, { rx: 0.72, h: 275, w: 36 },
            { rx: 0.92, h: 215, w: 26 },
        ];
        towers3.forEach((tw, ti) => {
            const tx3 = tw.rx * CW - cOff3 % (CW * 0.6);
            ctx.fillStyle = "rgba(7,3,11,0.96)";
            // 탑 본체
            ctx.fillRect(tx3 - tw.w/2, CH - tw.h, tw.w, tw.h);
            // 첨탑
            ctx.beginPath();
            ctx.moveTo(tx3 - tw.w/2 - 5, CH - tw.h);
            ctx.lineTo(tx3, CH - tw.h - 80 - ti * 10);
            ctx.lineTo(tx3 + tw.w/2 + 5, CH - tw.h);
            ctx.fill();
            // 플라잉 버트레스 (좌우 보조 아치)
            if (tw.w > 30) {
                ctx.strokeStyle = "rgba(7,3,11,0.90)"; ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(tx3 - tw.w/2 - 28, CH - tw.h + 40);
                ctx.quadraticCurveTo(tx3 - tw.w/2 - 10, CH - tw.h + 10, tx3 - tw.w/2, CH - tw.h + 55);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(tx3 + tw.w/2 + 28, CH - tw.h + 40);
                ctx.quadraticCurveTo(tx3 + tw.w/2 + 10, CH - tw.h + 10, tx3 + tw.w/2, CH - tw.h + 55);
                ctx.stroke();
            }
            // 창문 3개
            for (let wi = 0; wi < 3; wi++) {
                const wyOff = CH - tw.h + 25 + wi * 50;
                const wFlk  = (Math.sin(t * 0.0004 + ti * 2.1 + wi * 0.9) + 1) / 2;
                ctx.fillStyle = `rgba(200,30,0,${0.15 + wFlk * 0.55})`;
                ctx.beginPath(); ctx.arc(tx3, wyOff, 6, Math.PI, 0); ctx.fill();
                ctx.fillRect(tx3 - 6, wyOff, 12, 9);
                if (wFlk > 0.45) {
                    const wGrd3 = ctx.createRadialGradient(tx3, wyOff + 4, 0, tx3, wyOff + 4, 20);
                    wGrd3.addColorStop(0, `rgba(220,35,0,${wFlk * 0.28})`);
                    wGrd3.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = wGrd3; ctx.beginPath(); ctx.arc(tx3, wyOff + 4, 20, 0, Math.PI * 2); ctx.fill();
                }
            }
            // 십자가
            ctx.fillStyle = "rgba(5,2,9,0.98)";
            ctx.fillRect(tx3 - 2, CH - tw.h - 40, 4, 25);
            ctx.fillRect(tx3 - 9, CH - tw.h - 32, 18, 4);
        });

        // ── 중거리(0.15): 성벽 + 흉벽 ──
        const wallOff3 = Game.camX * 0.15;
        ctx.fillStyle = "rgba(8,4,12,0.92)";
        ctx.fillRect(-10, CH - 105, CW + 20, 105);
        // 흉벽 (crenellations)
        for (let m = 0; m < Math.ceil((CW + 80) / 26); m++) {
            const mx3 = m * 26 - wallOff3 % 26 - 10;
            if (m % 2 === 0) {
                ctx.clearRect(mx3, CH - 122, 13, 17);
            }
        }
        ctx.fillStyle = "rgba(8,4,12,0.92)";
        ctx.fillRect(-10, CH - 105, CW + 20, 105);
        // 성벽 위 작은 원형탑
        for (let i = 0; i < 5; i++) {
            const tx4 = ((i * 180 + 40) - wallOff3 % (CW + 200) + CW + 200) % (CW + 200) - 30;
            ctx.fillStyle = "rgba(9,5,13,0.95)";
            ctx.beginPath(); ctx.arc(tx4, CH - 115, 14, Math.PI, 0); ctx.fill();
            ctx.fillRect(tx4 - 14, CH - 115, 28, 20);
        }

        // ── 근거리(0.28): 뒤틀린 나무 + 가고일 ──
        const nearOff3 = Game.camX * 0.28;
        for (let i = 0; i < 7; i++) {
            const ntx = ((i * 270 + 50) - nearOff3 % (CW + 320) + CW + 320) % (CW + 320) - 60;
            if (ntx < -60 || ntx > CW + 30) continue;
            const sway3 = Math.sin(t * 0.0009 + i) * 3;
            ctx.strokeStyle = "rgba(8,4,12,0.98)"; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(ntx, CH);
            ctx.bezierCurveTo(ntx + sway3, CH - 40, ntx + sway3 * 2, CH - 75, ntx + sway3, CH - 110);
            ctx.stroke();
            ctx.lineWidth = 3;
            for (let b = 0; b < 5; b++) {
                const by3 = CH - 45 - b * 13;
                const bd3 = b % 2 === 0 ? 1 : -1;
                ctx.beginPath(); ctx.moveTo(ntx + sway3 * 0.4, by3);
                ctx.quadraticCurveTo(ntx + bd3 * 20, by3 - 10, ntx + bd3 * 30, by3 - 18); ctx.stroke();
            }
        }

        // ── 중거리(0.12): 떠오르는 불씨 파티클 ──
        for (let i = 0; i < 22; i++) {
            const ex3 = ((i * 83 + t * 0.016 * (i % 2 === 0 ? 1 : -0.6) - Game.camX * 0.12) % (CW + 100) + CW + 100) % (CW + 100) - 20;
            const ey3 = ((CH - 35) - ((i * 57 + t * (0.55 + i % 5 * 0.28)) % (CH - 40)));
            const ea3 = 0.20 + Math.sin(t * 0.007 + i * 0.85) * 0.14;
            if (ea3 <= 0.06) continue;
            ctx.shadowBlur = 5; ctx.shadowColor = "#ff5500";
            ctx.fillStyle = `rgba(240,70,0,${ea3})`;
            ctx.beginPath(); ctx.arc(ex3, ey3, 1.0 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;

        // ── 안개 레이어 (근거리) ──
        for (let f = 0; f < 7; f++) {
            const fx3 = ((f * 195 + t * 0.015 * (f % 2 === 0 ? 1 : -0.65)) % (CW + 300)) - 110;
            const fGrd3 = ctx.createRadialGradient(fx3, CH - 38, 0, fx3, CH - 38, 110);
            fGrd3.addColorStop(0, "rgba(35,5,18,0.20)");
            fGrd3.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = fGrd3;
            ctx.beginPath(); ctx.ellipse(fx3, CH - 38, 155, 42, 0, 0, Math.PI * 2); ctx.fill();
        }
        // 촛불 빛 (성벽 위)
        for (let i = 0; i < 8; i++) {
            const cx3 = ((i * 155 + 20) - wallOff3 % (CW + 200) + CW + 200) % (CW + 200) - 30;
            const cfl3 = (Math.sin(t * 0.005 + i * 1.8) + 1) / 2;
            const cGrd3 = ctx.createRadialGradient(cx3, CH - 115, 0, cx3, CH - 115, 18);
            cGrd3.addColorStop(0, `rgba(220,120,0,${0.20 + cfl3 * 0.35})`);
            cGrd3.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = cGrd3; ctx.beginPath(); ctx.arc(cx3, CH - 115, 18, 0, Math.PI * 2); ctx.fill();
        }
    } 
    else if (wg === 4) {
        const t = frameNow;

        // ── 하늘: 용암 빛 그라데이션 ──
        const skyG = ctx.createLinearGradient(0, 0, 0, CH);
        skyG.addColorStop(0, "#060010"); skyG.addColorStop(0.5, "#120008"); skyG.addColorStop(1, "#200002");
        ctx.fillStyle = skyG; ctx.fillRect(0, 0, CW, CH);
        // 지평선 용암 글로우
        const lavaGlow = ctx.createLinearGradient(0, CH * 0.7, 0, CH);
        lavaGlow.addColorStop(0, "rgba(0,0,0,0)");
        lavaGlow.addColorStop(1, "rgba(200,40,0,0.35)");
        ctx.fillStyle = lavaGlow; ctx.fillRect(0, CH * 0.7, CW, CH * 0.3);

        // ── 원거리(0.04): 화산 산맥 + 용암 흘림 ──
        const volOff = Game.camX * 0.04;
        ctx.fillStyle = "rgba(5,0,8,0.95)";
        ctx.beginPath(); ctx.moveTo(-volOff % (CW + 50), CH);
        const volPts = [0,240, 40,200, 80,220, 130,160, 180,195, 240,135,
                        300,175, 360,125, 420,160, 480,130, 540,165, 600,140, CW+40,170, CW+40,CH];
        for (let vi = 0; vi < volPts.length; vi += 2)
            ctx.lineTo(volPts[vi] - volOff % (CW + 50), volPts[vi + 1]);
        ctx.closePath(); ctx.fill();
        // 화산 정상 용암 빛
        [[130,160],[300,175],[480,130]].forEach(([px, py]) => {
            const vx4 = px - volOff % (CW + 50);
            const vp4 = (Math.sin(t * 0.0015 + px * 0.01) + 1) / 2;
            const vGrd = ctx.createRadialGradient(vx4, py, 0, vx4, py, 55);
            vGrd.addColorStop(0, `rgba(255,80,0,${0.35 + vp4 * 0.30})`);
            vGrd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = vGrd; ctx.beginPath(); ctx.arc(vx4, py, 55, 0, Math.PI * 2); ctx.fill();
        });

        // ── 원중거리(0.08): 마왕성 성채 실루엣 ──
        const castOff = Game.camX * 0.08;
        ctx.fillStyle = "rgba(4,0,8,0.98)";
        const ctX4 = CW * 0.5 - castOff % (CW * 0.4);
        // 중앙 거대 탑
        ctx.beginPath();
        ctx.moveTo(ctX4 - 65, CH); ctx.lineTo(ctX4 - 58, CH - 290);
        ctx.lineTo(ctX4 - 32, CH - 320); ctx.lineTo(ctX4 - 18, CH - 395);
        ctx.lineTo(ctX4, CH - 440); ctx.lineTo(ctX4 + 18, CH - 395);
        ctx.lineTo(ctX4 + 32, CH - 320); ctx.lineTo(ctX4 + 58, CH - 290);
        ctx.lineTo(ctX4 + 65, CH);
        ctx.fill();
        // 좌우 보조 탑
        [ctX4 - 140, ctX4 + 140].forEach(bx4 => {
            ctx.fillStyle = "rgba(4,0,8,0.96)";
            ctx.fillRect(bx4 - 22, CH - 230, 44, 230);
            ctx.beginPath(); ctx.moveTo(bx4 - 24, CH - 230);
            ctx.lineTo(bx4, CH - 285); ctx.lineTo(bx4 + 24, CH - 230); ctx.fill();
        });
        // 성벽 연결
        ctx.fillStyle = "rgba(4,0,8,0.92)";
        ctx.fillRect(ctX4 - 210, CH - 140, 80, 140);
        ctx.fillRect(ctX4 + 130, CH - 140, 80, 140);
        // 탑 정상 오라
        const topPulse4 = (Math.sin(t * 0.002) + 1) / 2;
        const topGrd4 = ctx.createRadialGradient(ctX4, CH - 440, 5, ctX4, CH - 440, 60);
        topGrd4.addColorStop(0, `rgba(220,0,60,${0.65 + topPulse4 * 0.35})`);
        topGrd4.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = topGrd4; ctx.beginPath(); ctx.arc(ctX4, CH - 440, 60, 0, Math.PI * 2); ctx.fill();
        // 창문들 (성채)
        [[ctX4, CH-350], [ctX4, CH-270], [ctX4-140, CH-200], [ctX4+140, CH-200]].forEach(([wx4, wy4]) => {
            const wfl4 = (Math.sin(t * 0.0005 + wx4 * 0.01) + 1) / 2;
            ctx.fillStyle = `rgba(220,40,0,${0.20 + wfl4 * 0.50})`;
            ctx.beginPath(); ctx.arc(wx4, wy4, 8, Math.PI, 0); ctx.fill();
            ctx.fillRect(wx4 - 8, wy4, 16, 12);
        });

        // ── 중거리(0.16): 부유하는 잔해 돌덩이 ──
        for (let i = 0; i < 16; i++) {
            const dbx4 = ((i * 165 + t * 0.013 * (i % 2 === 0 ? 1 : -0.6)) % (CW + 150)) - 50;
            const dby4 = 35 + (i % 5) * 30 + Math.sin(t * 0.001 + i * 0.8) * 9;
            const ds4  = 6 + (i % 5) * 4;
            ctx.save(); ctx.translate(dbx4, dby4);
            ctx.rotate(t * 0.00018 * (i % 2 === 0 ? 1 : -1) + i);
            ctx.fillStyle = `rgba(12,3,18,${0.75 + (i % 3) * 0.08})`;
            ctx.fillRect(-ds4/2, -ds4*0.4, ds4, ds4 * 0.8);
            // 균열 빛
            ctx.strokeStyle = `rgba(180,30,0,${0.25 + (i%3)*0.12})`; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(-ds4*0.3, -ds4*0.15); ctx.lineTo(ds4*0.35, ds4*0.2); ctx.stroke();
            ctx.restore();
        }

        // ── 중거리(0.20): 해골 창 + 쇠사슬 ──
        const chainOff = Game.camX * 0.20;
        for (let i = 0; i < 9; i++) {
            const sx4 = ((i * 220 + 30) - chainOff % (CW + 250) + CW + 250) % (CW + 250) - 40;
            if (sx4 < -40 || sx4 > CW + 20) continue;
            ctx.strokeStyle = "rgba(10,5,14,0.95)"; ctx.lineWidth = 2.5;
            // 창대
            ctx.beginPath(); ctx.moveTo(sx4, CH); ctx.lineTo(sx4, CH - 80); ctx.stroke();
            ctx.lineWidth = 1;
            // 쇠사슬 (지그재그)
            for (let c = 0; c < 6; c++) {
                const cy4 = CH - 80 - c * 8;
                ctx.beginPath(); ctx.moveTo(sx4 - 4, cy4); ctx.lineTo(sx4 + 4, cy4 - 4); ctx.stroke();
            }
            // 해골 (간단하게)
            ctx.fillStyle = "rgba(14,8,18,0.95)";
            ctx.beginPath(); ctx.arc(sx4, CH - 88, 7, 0, Math.PI * 2); ctx.fill();
        }

        // ── 중거리(0.09): 낙하하는 화산재 ──
        for (let i = 0; i < 40; i++) {
            const ax4 = ((i * 71 + t * 0.009 * (1 + i % 3 * 0.3) - Game.camX * 0.09) % (CW + 90) + CW + 90) % (CW + 90) - 20;
            const ay4 = ((i * 59 + t * (0.9 + i % 5 * 0.22)) % (CH + 20));
            const aa4 = 0.07 + (i % 5) * 0.04;
            ctx.fillStyle = `rgba(170,70,10,${aa4})`;
            ctx.beginPath(); ctx.arc(ax4, ay4, 0.8 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
        }

        // ── 근거리(0.32): 뒤틀린 나무 ──
        const nearOff4 = Game.camX * 0.32;
        for (let i = 0; i < 7; i++) {
            const ntx4 = ((i * 255 + 70) - nearOff4 % (CW + 300) + CW + 300) % (CW + 300) - 60;
            if (ntx4 < -60 || ntx4 > CW + 30) continue;
            const sway4 = Math.sin(t * 0.0007 + i) * 4;
            ctx.strokeStyle = "rgba(6,2,10,0.98)"; ctx.lineWidth = 7;
            ctx.beginPath(); ctx.moveTo(ntx4, CH);
            ctx.bezierCurveTo(ntx4 + sway4, CH - 40, ntx4 + sway4 * 1.5, CH - 70, ntx4 + sway4, CH - 105);
            ctx.stroke();
            ctx.lineWidth = 3;
            for (let b = 0; b < 4; b++) {
                const by4 = CH - 45 - b * 15;
                const bd4 = b % 2 === 0 ? 1 : -1;
                ctx.beginPath(); ctx.moveTo(ntx4 + sway4 * 0.4, by4);
                ctx.quadraticCurveTo(ntx4 + bd4 * 22, by4 - 11, ntx4 + bd4 * 32, by4 - 20); ctx.stroke();
            }
        }

        // ── 간헐적 배경 번개 ──
        if (Math.sin(t * 0.0028) > 0.95) {
            const lx4 = CW * (0.15 + ((Math.sin(t * 0.007) + 1) / 2) * 0.70);
            ctx.strokeStyle = `rgba(200,0,50,${0.25 + Math.random() * 0.20})`; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(lx4, 0);
            let ly4 = 0;
            while (ly4 < CH * 0.65) {
                ly4 += 18 + Math.random() * 22;
                ctx.lineTo(lx4 + (Math.random() - 0.5) * 35, ly4);
            }
            ctx.stroke();
        }

        // ── 근거리(0.36): 지면 용암 균열 발광 ──
        for (let i = 0; i < 7; i++) {
            const lcx4 = ((i * 158 + 25) - Game.camX * 0.36 % (CW + 200) + CW + 200) % (CW + 200) - 40;
            const lca4 = 0.16 + Math.sin(t * 0.0022 + i * 1.5) * 0.10;
            ctx.shadowBlur = 8; ctx.shadowColor = "#ff4400";
            ctx.strokeStyle = `rgba(255,90,0,${lca4})`; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(lcx4 - 20, CH - 40); ctx.lineTo(lcx4 + 8, CH - 18); ctx.lineTo(lcx4 + 22, CH - 32); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(lcx4 + 5, CH - 38); ctx.lineTo(lcx4 + 18, CH - 22); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // ── 근경 용암 안개 ──
        for (let f = 0; f < 5; f++) {
            const fx4 = ((f * 210 + t * 0.014 * (f % 2 === 0 ? 1 : -0.7)) % (CW + 280)) - 90;
            const fGrd4 = ctx.createRadialGradient(fx4, CH - 30, 0, fx4, CH - 30, 100);
            fGrd4.addColorStop(0, "rgba(180,25,0,0.14)");
            fGrd4.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = fGrd4;
            ctx.beginPath(); ctx.ellipse(fx4, CH - 30, 145, 32, 0, 0, Math.PI * 2); ctx.fill();
        }
    } 
    else if (wg === 5) {
        const t5 = frameNow;

        // ── 피바다 하늘 (밝기 상향) ──
        const bloodSky = ctx.createLinearGradient(0, 0, 0, CH);
        bloodSky.addColorStop(0,   "#2a0008");
        bloodSky.addColorStop(0.3, "#520010");
        bloodSky.addColorStop(0.65, "#7a0018");
        bloodSky.addColorStop(1,   "#3a0008");
        ctx.fillStyle = bloodSky; ctx.fillRect(0, 0, CW, CH);

        // 지평선 핏빛 광원 (강화)
        const horizGrd5 = ctx.createRadialGradient(CW * 0.5, CH, 10, CW * 0.5, CH, CW * 0.85);
        horizGrd5.addColorStop(0,   "rgba(255,20,30,0.65)");
        horizGrd5.addColorStop(0.35, "rgba(180,0,15,0.35)");
        horizGrd5.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = horizGrd5; ctx.fillRect(0, 0, CW, CH);

        // 하늘 중앙 붉은 달
        const moonX5 = CW * 0.72 - Game.camX * 0.01;
        const moonR5 = 22; const moonPulse5 = (Math.sin(t5 * 0.0009) + 1) / 2;
        const moonGrd5 = ctx.createRadialGradient(moonX5, CH * 0.22, 0, moonX5, CH * 0.22, moonR5 * 3.5);
        moonGrd5.addColorStop(0,   `rgba(255,40,40,${0.55 + moonPulse5 * 0.25})`);
        moonGrd5.addColorStop(0.4, `rgba(200,0,20,${0.25 + moonPulse5 * 0.15})`);
        moonGrd5.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = moonGrd5; ctx.beginPath(); ctx.arc(moonX5, CH * 0.22, moonR5 * 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(220,30,30,${0.85 + moonPulse5 * 0.15})`;
        ctx.beginPath(); ctx.arc(moonX5, CH * 0.22, moonR5, 0, Math.PI * 2); ctx.fill();

        // ── 원거리(0.03): 악마 조각상 2개 (거대) ──
        const statOff = Game.camX * 0.03;
        [CW * 0.2 - statOff, CW * 0.78 - statOff].forEach((sx5, si5) => {
            const flip5 = si5 === 1 ? -1 : 1;
            ctx.save(); ctx.translate(sx5, 0); ctx.scale(flip5, 1);
            ctx.fillStyle = "rgba(28,4,8,0.95)";
            // 받침대
            ctx.fillRect(-30, CH - 50, 60, 50);
            // 몸통
            ctx.fillRect(-18, CH - 190, 36, 140);
            // 머리
            ctx.beginPath(); ctx.arc(0, CH - 198, 20, 0, Math.PI * 2); ctx.fill();
            // 뿔
            ctx.beginPath(); ctx.moveTo(-10, CH - 212); ctx.lineTo(-4, CH - 238); ctx.lineTo(2, CH - 212); ctx.fill();
            ctx.beginPath(); ctx.moveTo(5, CH - 210); ctx.lineTo(14, CH - 232); ctx.lineTo(18, CH - 210); ctx.fill();
            // 날개 (펼침)
            ctx.beginPath();
            ctx.moveTo(0, CH - 185); ctx.bezierCurveTo(35, CH - 210, 75, CH - 175, 90, CH - 140);
            ctx.lineTo(20, CH - 160); ctx.fill();
            // 눈 빛
            const efl5 = (Math.sin(t5 * 0.002 + si5 * 1.5) + 1) / 2;
            const eGrd5 = ctx.createRadialGradient(-6, CH - 200, 0, -6, CH - 200, 8);
            eGrd5.addColorStop(0, `rgba(220,0,20,${0.6 + efl5 * 0.4})`);
            eGrd5.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = eGrd5; ctx.beginPath(); ctx.arc(-6, CH - 200, 8, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });

        // ── 원중거리(0.05): 부유하는 영혼 오브 ──
        for (let i = 0; i < 14; i++) {
            const sox5 = ((i * 148 + t5 * 0.013 * (i % 2 === 0 ? 1 : -0.65) - Game.camX * 0.05) % (CW + 170) + CW + 170) % (CW + 170) - 40;
            const soy5 = CH * 0.15 + (i % 6) * 28 + Math.sin(t5 * 0.0011 + i * 1.0) * 13;
            const spa5 = 0.17 + Math.sin(t5 * 0.0019 + i * 1.4) * 0.09;
            const spR5 = 1.8 + (i % 3) * 0.9;
            const spGrd5 = ctx.createRadialGradient(sox5, soy5, 0, sox5, soy5, spR5 * 3.5);
            spGrd5.addColorStop(0, `rgba(255,45,15,${spa5 + 0.18})`);
            spGrd5.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = spGrd5; ctx.beginPath(); ctx.arc(sox5, soy5, spR5 * 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,130,60,${spa5 + 0.28})`;
            ctx.beginPath(); ctx.arc(sox5, soy5, spR5, 0, Math.PI * 2); ctx.fill();
        }

        // ── 원중거리(0.06): 마왕성 실루엣 ──
        const cOff5 = Game.camX * 0.06;
        ctx.fillStyle = "rgba(20,2,5,0.94)";
        ctx.beginPath();
        ctx.moveTo(0, CH);
        ctx.lineTo(0, CH - 150);
        ctx.lineTo(CW*0.12 - cOff5, CH - 185); ctx.lineTo(CW*0.18 - cOff5, CH - 225);
        ctx.lineTo(CW*0.22 - cOff5, CH - 185); ctx.lineTo(CW*0.38 - cOff5, CH - 185);
        ctx.lineTo(CW*0.45 - cOff5, CH - 255); ctx.lineTo(CW*0.50 - cOff5, CH - 310);
        ctx.lineTo(CW*0.52 - cOff5, CH - 370); ctx.lineTo(CW*0.54 - cOff5, CH - 310);
        ctx.lineTo(CW*0.60 - cOff5, CH - 255); ctx.lineTo(CW*0.68 - cOff5, CH - 255);
        ctx.lineTo(CW*0.72 - cOff5, CH - 310); ctx.lineTo(CW*0.76 - cOff5, CH - 255);
        ctx.lineTo(CW*0.88 - cOff5, CH - 185); ctx.lineTo(CW*0.93 - cOff5, CH - 215);
        ctx.lineTo(CW*0.97 - cOff5, CH - 185); ctx.lineTo(CW + 20, CH - 150);
        ctx.lineTo(CW + 20, CH);
        ctx.closePath(); ctx.fill();
        // 마왕성 창문 핏빛
        [[0.45, 0.38],[0.50, 0.28],[0.60, 0.38],[0.72, 0.25]].forEach(([wx5, wy5]) => {
            const wFlk5 = (Math.sin(t5 * 0.0007 + wx5 * 12) + 1) / 2;
            const wrx5  = wx5 * CW - cOff5;
            const wGrd5 = ctx.createRadialGradient(wrx5, wy5 * CH, 0, wrx5, wy5 * CH, 14);
            wGrd5.addColorStop(0, `rgba(220,0,20,${0.35 + wFlk5 * 0.45})`);
            wGrd5.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = wGrd5; ctx.beginPath(); ctx.arc(wrx5, wy5 * CH, 14, 0, Math.PI * 2); ctx.fill();
        });

        // ── 중거리(0.14): 거대 기둥들 ──
        const pilOff = Game.camX * 0.14;
        for (let i = 0; i < 10; i++) {
            const px5 = ((i * 230 + 40) - pilOff % (CW + 280) + CW + 280) % (CW + 280) - 50;
            if (px5 < -50 || px5 > CW + 30) continue;
            const ph5 = 130 + (i % 3) * 30;
            ctx.fillStyle = "rgba(30,4,8,0.92)";
            ctx.fillRect(px5 - 10, CH - ph5, 20, ph5);
            // 기둥 상단 장식
            ctx.fillRect(px5 - 14, CH - ph5 - 8, 28, 8);
            // 기둥 하단
            ctx.fillRect(px5 - 13, CH - 18, 26, 18);
            // 수직 홈
            ctx.fillStyle = "rgba(5,0,1,0.80)";
            ctx.fillRect(px5 - 2, CH - ph5 + 5, 4, ph5 - 20);
            // 기둥 균열 빛
            const pfl5 = (Math.sin(t5 * 0.0008 + i * 1.4) + 1) / 2;
            if (pfl5 > 0.4) {
                ctx.strokeStyle = `rgba(180,0,10,${pfl5 * 0.25})`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(px5 + 5, CH - ph5 + 10); ctx.lineTo(px5 - 3, CH - ph5 + 50); ctx.stroke();
            }
        }

        // ── 중거리(0.11): 공중 분진 입자 ──
        for (let i = 0; i < 25; i++) {
            const dpx5 = ((i * 105 + t5 * 0.010 * (i % 2 === 0 ? 1 : -0.5) - Game.camX * 0.11) % (CW + 120) + CW + 120) % (CW + 120) - 25;
            const dpy5 = 20 + (i % 7) * 30 + Math.sin(t5 * 0.0008 + i * 0.9) * 12;
            const dpa5 = 0.12 + (i % 4) * 0.05;
            ctx.fillStyle = `rgba(120,10,15,${dpa5})`;
            ctx.beginPath(); ctx.arc(dpx5, dpy5, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
        }

        // ── 핏방울 낙하 ──
        ctx.strokeStyle = "rgba(180,0,20,0.50)"; ctx.lineWidth = 1.2;
        for (let i = 0; i < 70; i++) {
            const bx5 = ((i * 131 + Game.camX * 0.12) % (CW + 40)) - 20;
            const by5 = ((i * 93  + t5 * (2 + i % 4) * 0.07) % (CH + 20));
            const bl5 = 4 + (i % 5) * 2;
            ctx.beginPath(); ctx.moveTo(bx5, by5); ctx.lineTo(bx5 - 0.5, by5 + bl5); ctx.stroke();
        }

        // ── 근거리(0.28): 뼈 더미 + 해골 ──
        const boneOff5 = Game.camX * 0.28;
        for (let i = 0; i < 8; i++) {
            const bnx5 = ((i * 250 + 60) - boneOff5 % (CW + 300) + CW + 300) % (CW + 300) - 50;
            if (bnx5 < -50 || bnx5 > CW + 30) continue;
            ctx.fillStyle = "rgba(12,3,4,0.95)";
            // 뼈 더미 (타원)
            ctx.beginPath(); ctx.ellipse(bnx5, CH - 12, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
            // 해골
            ctx.beginPath(); ctx.arc(bnx5, CH - 28, 9, 0, Math.PI * 2); ctx.fill();
            // 눈구멍
            ctx.fillStyle = `rgba(255,20,10,${0.45 + (Math.sin(t5 * 0.003 + i) + 1) * 0.25})`;
            ctx.beginPath(); ctx.arc(bnx5 - 3, CH - 29, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(bnx5 + 3, CH - 29, 2.5, 0, Math.PI * 2); ctx.fill();
        }

        // ── 피 웅덩이 잔물결 (지면) ──
        for (let i = 0; i < 7; i++) {
            const px5 = ((i * 170 + Game.camX * 0.32) % (CW + 200)) - 80;
            const py5 = CH - 50 + (i % 2) * 10;
            const pr5 = 32 + (i % 3) * 16;
            const pa5 = 0.16 + Math.sin(t5 * 0.001 + i * 0.8) * 0.07;
            const poolGrd5 = ctx.createRadialGradient(px5, py5, 0, px5, py5, pr5);
            poolGrd5.addColorStop(0,   `rgba(190,0,15,${pa5 + 0.12})`);
            poolGrd5.addColorStop(0.5, `rgba(120,0,8,${pa5})`);
            poolGrd5.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = poolGrd5;
            ctx.beginPath(); ctx.ellipse(px5, py5, pr5 * 2.2, pr5 * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        }

        // ── 전경 핏빛 안개 ──
        for (let f = 0; f < 7; f++) {
            const fx5 = ((f * 185 + t5 * 0.017 * (f % 2 === 0 ? 1 : -0.65)) % (CW + 300)) - 110;
            const fGrd5 = ctx.createRadialGradient(fx5, CH - 28, 0, fx5, CH - 28, 105);
            fGrd5.addColorStop(0,   "rgba(160,0,12,0.22)");
            fGrd5.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = fGrd5;
            ctx.beginPath(); ctx.ellipse(fx5, CH - 28, 150, 36, 0, 0, Math.PI * 2); ctx.fill();
        }
    }
    else if (wg === 6) {
        const t6 = frameNow;
        const coronaPulse = (Math.sin(t6 * 0.0015) + 1) / 2;
        const sunX = CW / 2 - Game.camX * 0.01, sunY = CH * 0.32;

        // ── 하늘: 심연의 보라-검붉은 그라디언트 ──
        const sky6 = ctx.createLinearGradient(0, 0, 0, CH);
        sky6.addColorStop(0,    "#0a0010");
        sky6.addColorStop(0.35, "#1a0020");
        sky6.addColorStop(0.7,  "#2a0010");
        sky6.addColorStop(1,    "#120005");
        ctx.fillStyle = sky6; ctx.fillRect(0, 0, CW, CH);

        // ── 일식 배경 발광 ──
        const eclipseGlow = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, CW * 0.75);
        eclipseGlow.addColorStop(0,   `rgba(180,60,0,${0.35 + coronaPulse * 0.20})`);
        eclipseGlow.addColorStop(0.3, `rgba(100,20,0,${0.22 + coronaPulse * 0.10})`);
        eclipseGlow.addColorStop(0.7, `rgba(40,0,30,0.15)`);
        eclipseGlow.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = eclipseGlow; ctx.fillRect(0, 0, CW, CH);

        // ── 원거리(0.02): 무너진 성벽 + 고딕 아치 창문 ──
        const wallOff6 = Game.camX * 0.02;
        ctx.fillStyle = "rgba(8,2,12,0.98)";
        // 좌측 성벽
        ctx.beginPath();
        ctx.moveTo(-wallOff6, CH);
        ctx.lineTo(-wallOff6, CH - 200);
        for (let m = 0; m < 6; m++) {
            const mx = -wallOff6 + m * 28;
            ctx.lineTo(mx, CH - 200 - (m % 2 === 0 ? 22 : 0));
            ctx.lineTo(mx + 14, CH - 200 - (m % 2 === 0 ? 22 : 0));
        }
        ctx.lineTo(168 - wallOff6, CH - 175);
        ctx.lineTo(168 - wallOff6, CH);
        ctx.fill();
        // 우측 성벽
        ctx.beginPath();
        ctx.moveTo(CW - wallOff6 + 20, CH);
        ctx.lineTo(CW - wallOff6 + 20, CH - 200);
        for (let m = 0; m < 6; m++) {
            const mx = CW - wallOff6 + 20 - m * 28;
            ctx.lineTo(mx, CH - 200 - (m % 2 === 0 ? 22 : 0));
            ctx.lineTo(mx - 14, CH - 200 - (m % 2 === 0 ? 22 : 0));
        }
        ctx.lineTo(CW - 148 - wallOff6, CH - 175);
        ctx.lineTo(CW - 148 - wallOff6, CH);
        ctx.fill();

        // 고딕 아치 창문 (발광)
        [[0.2, 0.44], [0.38, 0.38], [0.62, 0.38], [0.80, 0.44]].forEach(([wx6, wy6]) => {
            const wrx6 = wx6 * CW - wallOff6;
            const wFlk6 = (Math.sin(t6 * 0.0006 + wx6 * 9) + 1) / 2;
            // 창문 아치
            ctx.fillStyle = `rgba(90,10,60,${0.30 + wFlk6 * 0.35})`;
            ctx.beginPath();
            ctx.ellipse(wrx6, wy6 * CH + 5, 14, 20, 0, Math.PI, 0);
            ctx.fillRect(wrx6 - 14, wy6 * CH + 5, 28, 18);
            ctx.fill();
            // 창문 빛 번짐
            const wGrd6 = ctx.createRadialGradient(wrx6, wy6 * CH, 0, wrx6, wy6 * CH, 35);
            wGrd6.addColorStop(0, `rgba(160,20,100,${0.25 + wFlk6 * 0.30})`);
            wGrd6.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = wGrd6; ctx.beginPath(); ctx.arc(wrx6, wy6 * CH, 35, 0, Math.PI * 2); ctx.fill();
        });

        // ── 중거리(0.05): 마왕 왕좌 실루엣 ──
        const throneOff6 = Game.camX * 0.05;
        const tx6 = CW * 0.5 - throneOff6;
        ctx.fillStyle = "rgba(6,1,10,0.99)";
        // 왕좌 받침
        ctx.fillRect(tx6 - 45, CH - 90, 90, 90);
        // 왕좌 등받이
        ctx.fillRect(tx6 - 32, CH - 210, 64, 120);
        // 왕좌 팔걸이
        ctx.fillRect(tx6 - 52, CH - 150, 20, 60);
        ctx.fillRect(tx6 + 32, CH - 150, 20, 60);
        // 왕좌 상단 장식 (뾰족 첨탑)
        ctx.beginPath();
        ctx.moveTo(tx6 - 32, CH - 210);
        ctx.lineTo(tx6 - 20, CH - 250); ctx.lineTo(tx6 - 8,  CH - 210);
        ctx.lineTo(tx6 + 8,  CH - 210);
        ctx.lineTo(tx6 + 20, CH - 255); ctx.lineTo(tx6 + 32, CH - 210);
        ctx.fill();
        // 왕좌 눈 광원 (왕좌 위 공중에 타오르는 눈)
        const eyePulse6 = (Math.sin(t6 * 0.0018) + 1) / 2;
        [-12, 12].forEach(ex => {
            const eGrd6 = ctx.createRadialGradient(tx6 + ex, CH - 228, 0, tx6 + ex, CH - 228, 12);
            eGrd6.addColorStop(0, `rgba(255,30,0,${0.70 + eyePulse6 * 0.30})`);
            eGrd6.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = eGrd6; ctx.beginPath(); ctx.arc(tx6 + ex, CH - 228, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,80,0,${0.90 + eyePulse6 * 0.10})`;
            ctx.beginPath(); ctx.arc(tx6 + ex, CH - 228, 3.5, 0, Math.PI * 2); ctx.fill();
        });

        // ── 중거리(0.10): 거대 열주 ──
        const pilOff6 = Game.camX * 0.10;
        [0.12, 0.28, 0.72, 0.88].forEach((px6ratio, pi6) => {
            const px6 = px6ratio * CW - pilOff6;
            const ph6 = 200 + (pi6 % 2) * 30;
            ctx.fillStyle = "rgba(14,3,20,0.97)";
            ctx.fillRect(px6 - 12, CH - ph6, 24, ph6);
            ctx.fillRect(px6 - 16, CH - ph6 - 10, 32, 10);
            ctx.fillRect(px6 - 16, CH - 20, 32, 20);
            // 열주 균열 빛
            const crk6 = (Math.sin(t6 * 0.0007 + pi6 * 2.1) + 1) / 2;
            if (crk6 > 0.3) {
                ctx.strokeStyle = `rgba(200,30,80,${crk6 * 0.35})`; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(px6 + 4, CH - ph6 + 20); ctx.lineTo(px6 - 2, CH - ph6 + 80); ctx.stroke();
            }
        });

        // ── 코로나 (일식 후광) ──
        for (let layer = 4; layer >= 1; layer--) {
            const r = 50 + layer * 30 + coronaPulse * 18;
            const a = (0.14 - layer * 0.025) * (0.65 + coronaPulse * 0.35);
            const grd = ctx.createRadialGradient(sunX, sunY, 38, sunX, sunY, r);
            grd.addColorStop(0,   `rgba(220,70,0,${a})`);
            grd.addColorStop(0.5, `rgba(140,20,0,${a * 0.45})`);
            grd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(sunX, sunY, r, 0, Math.PI * 2); ctx.fill();
        }

        // 코로나 스파이크 (12방향)
        ctx.save(); ctx.translate(sunX, sunY);
        for (let s = 0; s < 12; s++) {
            ctx.save();
            ctx.rotate(s * Math.PI / 6 + t6 * 0.00025);
            const spikeLen = 35 + (s % 3 === 0 ? 20 : 0) + coronaPulse * 22;
            const sGrd = ctx.createLinearGradient(0, -40, 0, -(40 + spikeLen));
            sGrd.addColorStop(0,   `rgba(240,80,0,${0.45 + coronaPulse * 0.30})`);
            sGrd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = sGrd;
            ctx.beginPath();
            ctx.moveTo(-2.5, -38); ctx.lineTo(0, -(40 + spikeLen)); ctx.lineTo(2.5, -38);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // 일식 본체
        ctx.strokeStyle = `rgba(255,230,190,${0.75 + coronaPulse * 0.25})`;
        ctx.lineWidth = 3 + coronaPulse * 2;
        ctx.shadowBlur = 25 + coronaPulse * 18; ctx.shadowColor = "#ffddaa";
        ctx.beginPath(); ctx.arc(sunX, sunY, 42, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(sunX, sunY, 40, 0, Math.PI * 2); ctx.fill();

        // ── 원중거리(0.08): 허공 심연 파티클 ──
        for (let i = 0; i < 20; i++) {
            const vpx6 = ((i * 113 + t6 * 0.009 * (i % 2 === 0 ? 1 : -0.55) - Game.camX * 0.08) % (CW + 135) + CW + 135) % (CW + 135) - 30;
            const vpy6 = 12 + (i % 7) * 36 + Math.sin(t6 * 0.0009 + i * 1.0) * 14;
            const vpa6 = 0.16 + Math.sin(t6 * 0.0014 + i * 0.7) * 0.10;
            const vpR6 = 1.5 + (i % 4) * 0.8;
            const vpGrd6 = ctx.createRadialGradient(vpx6, vpy6, 0, vpx6, vpy6, vpR6 * 4);
            vpGrd6.addColorStop(0, `rgba(130,20,90,${vpa6})`);
            vpGrd6.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = vpGrd6; ctx.beginPath(); ctx.arc(vpx6, vpy6, vpR6 * 4, 0, Math.PI * 2); ctx.fill();
        }

        // ── 중거리(0.14): 망령 유체 (수평 유동) ──
        for (let i = 0; i < 6; i++) {
            const wsx6 = ((i * 265 + t6 * 0.009 * (i % 2 === 0 ? 1 : -0.80) - Game.camX * 0.14) % (CW + 290) + CW + 290) % (CW + 290) - 80;
            const wsy6 = CH * 0.32 + (i % 4) * 36 + Math.sin(t6 * 0.0008 + i * 2.0) * 16;
            const wsA6 = 0.06 + Math.sin(t6 * 0.0013 + i * 1.2) * 0.04;
            if (wsA6 <= 0.02) continue;
            const wsGrd6 = ctx.createLinearGradient(wsx6 - 65, wsy6, wsx6 + 65, wsy6);
            wsGrd6.addColorStop(0, "rgba(0,0,0,0)");
            wsGrd6.addColorStop(0.5, `rgba(110,25,85,${wsA6})`);
            wsGrd6.addColorStop(1, "rgba(0,0,0,0)");
            ctx.strokeStyle = wsGrd6; ctx.lineWidth = 3 + (i % 3);
            ctx.beginPath();
            ctx.moveTo(wsx6 - 65, wsy6 + Math.sin(t6 * 0.0022 + i) * 5);
            ctx.bezierCurveTo(wsx6 - 22, wsy6 - 5, wsx6 + 22, wsy6 + 5, wsx6 + 65, wsy6 + Math.sin(t6 * 0.0022 + i + 1) * 5);
            ctx.stroke();
        }

        // ── 근거리(0.22): 부서진 석상 파편 ──
        const debrisOff6 = Game.camX * 0.22;
        for (let i = 0; i < 6; i++) {
            const dx6 = ((i * 220 + 50) - debrisOff6 % (CW + 260) + CW + 260) % (CW + 260) - 50;
            if (dx6 < -50 || dx6 > CW + 30) continue;
            ctx.fillStyle = "rgba(16,4,22,0.96)";
            ctx.beginPath();
            ctx.moveTo(dx6 - 18, CH - 8); ctx.lineTo(dx6 - 12, CH - 35 - (i % 3) * 10);
            ctx.lineTo(dx6 + 5, CH - 28 - (i % 2) * 8); ctx.lineTo(dx6 + 16, CH - 10);
            ctx.fill();
            // 파편 핏빛 균열
            const crfl6 = (Math.sin(t6 * 0.001 + i * 1.7) + 1) / 2;
            ctx.strokeStyle = `rgba(200,20,60,${0.20 + crfl6 * 0.30})`; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(dx6 - 8, CH - 12); ctx.lineTo(dx6 + 6, CH - 30); ctx.stroke();
        }

        // ── 근거리(0.38): 지면 균열 발광 (핏빛) ──
        for (let i = 0; i < 9; i++) {
            const ckx6 = ((i * 105 + 18) - Game.camX * 0.38 % (CW + 130) + CW + 130) % (CW + 130) - 30;
            const cka6 = 0.13 + Math.sin(t6 * 0.0019 + i * 1.5) * 0.08;
            ctx.shadowBlur = 5; ctx.shadowColor = "#aa0040";
            ctx.strokeStyle = `rgba(185,15,65,${cka6})`; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(ckx6 - 14, CH - 38); ctx.lineTo(ckx6 + 7, CH - 18); ctx.lineTo(ckx6 - 5, CH - 8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ckx6 + 12, CH - 34); ctx.lineTo(ckx6 + 24, CH - 14); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // ── 지면 반사 (왕좌 바닥 대리석 광택) ──
        const floorGrd6 = ctx.createLinearGradient(0, CH - 70, 0, CH);
        floorGrd6.addColorStop(0, "rgba(60,10,40,0.18)");
        floorGrd6.addColorStop(1, "rgba(20,2,15,0.35)");
        ctx.fillStyle = floorGrd6; ctx.fillRect(0, CH - 70, CW, 70);
        // 바닥 타일 금 (균열선)
        ctx.strokeStyle = "rgba(120,10,60,0.20)"; ctx.lineWidth = 0.8;
        for (let tl = 0; tl < 8; tl++) {
            const tlx = (tl * 90 - Game.camX * 0.40 % 90 + 90) % (CW + 90) - 30;
            ctx.beginPath(); ctx.moveTo(tlx, CH - 70); ctx.lineTo(tlx, CH); ctx.stroke();
        }
    }

    const _vigStr = (wg >= 5) ? 0.45 : 0.75;
    const vig = ctx.createRadialGradient(CW/2, CH/2, CH*0.3, CW/2, CH/2, CW*0.7);
    vig.addColorStop(0, "transparent");
    vig.addColorStop(1, `rgba(0,0,0,${_vigStr})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CW, CH);

    // ── 날씨/파티클 레이어 ──
    _drawWeather(wg, frameNow);

    // 불타는 스테이지(짝수 월드): 붉은 불꽃 오버레이
    if (isDestroyed) {
        ctx.fillStyle = "rgba(80,10,0,0.45)";
        ctx.fillRect(0, 0, CW, CH);
        // 아래쪽 불길 그라디언트
        const fireGrd = ctx.createLinearGradient(0, CH * 0.6, 0, CH);
        fireGrd.addColorStop(0, "rgba(120,20,0,0)");
        fireGrd.addColorStop(1, "rgba(180,40,0,0.35)");
        ctx.fillStyle = fireGrd;
        ctx.fillRect(0, CH * 0.6, CW, CH * 0.4);
    }
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

    // wg1: 흩날리는 잎사귀
    if (wg === 1) {
        ctx.save();
        for (let i = 0; i < 30; i++) {
            const p = pts[i];
            p.x += Math.sin(frameNow * 0.0012 + i * 0.9) * 0.7 - 0.4;
            p.y += 0.5 + Math.sin(frameNow * 0.0018 + i * 1.2) * 0.3;
            if (p.y > CH + 8 || p.x < -10) { p.y = -8; p.x = Math.random() * CW; }
            const a = 0.25 + Math.sin(frameNow * 0.003 + i) * 0.12;
            const rot = frameNow * 0.02 + i * 0.8;
            const leafColors = ["rgba(60,100,30,", "rgba(80,130,20,", "rgba(50,80,15,", "rgba(100,140,30,"];
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(rot);
            ctx.fillStyle = leafColors[i % 4] + `${a})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, 4 + (i % 3), 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
        return;
    }

    // wg2: 회색 재 (언데드 스테이지)
    if (wg === 2) {
        ctx.save();
        for (let i = 0; i < 60; i++) {
            const p = pts[i];
            p.x += Math.sin(frameNow * 0.0008 + i) * 0.5 - 0.3;
            p.y += 0.6 + Math.cos(i * 0.7) * 0.3;
            if (p.y > CH) { p.y = -6; p.x = Math.random() * CW; }
            const a = 0.22 + Math.sin(frameNow * 0.002 + i) * 0.10;
            ctx.fillStyle = `rgba(180, 160, 145, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.8 + (i % 4) * 0.9, 0, Math.PI * 2);
            ctx.fill();
        }
        // 굵은 재 조각 (크고 느리게)
        for (let i = 0; i < 18; i++) {
            const p = pts[i + 60] || pts[i];
            const bx = ((p.x * 1.7 + frameNow * 0.18 + i * 37) % (CW + 40)) - 20;
            const by = ((p.y * 1.3 + frameNow * (0.25 + i * 0.01) + i * 53) % (CH + 40)) - 20;
            const ba = 0.10 + (i % 5) * 0.03;
            ctx.fillStyle = `rgba(150, 130, 120, ${ba})`;
            ctx.beginPath();
            ctx.arc(bx, by, 3.5 + (i % 3) * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }

    // wg4: 먹구름 연기 + 불티 (마왕성 외곽)
    if (wg === 4) {
        ctx.save();
        // 굵은 연기 구름
        for (let i = 0; i < 40; i++) {
            const p = pts[i];
            p.x -= 0.7 + (i % 3) * 0.25;
            p.y += Math.sin(frameNow * 0.001 + i) * 0.2;
            if (p.x < -80) { p.x = CW + 60; p.y = Math.random() * CH * 0.65; }
            const a = 0.10 + Math.sin(frameNow * 0.0015 + i) * 0.04;
            ctx.fillStyle = `rgba(30, 12, 8, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 28 + (i % 5) * 10, 0, Math.PI * 2);
            ctx.fill();
        }
        // 작은 불티 파티클
        for (let i = 0; i < 35; i++) {
            const bx = ((i * 73 + frameNow * (0.8 + i * 0.04)) % (CW + 20));
            const by = ((i * 59 + frameNow * -(0.6 + i * 0.03)) % CH + CH) % CH;
            const ba = 0.30 + Math.sin(frameNow * 0.005 + i) * 0.20;
            const r = 180 + (i % 70);
            ctx.fillStyle = `rgba(${r}, ${Math.floor(r * 0.28)}, 0, ${ba})`;
            ctx.beginPath();
            ctx.arc(bx, by, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }

    // wg5: 핏빛 비 (기괴한 마왕성)
    if (wg === 5) {
        ctx.save();
        // 가는 빗줄기
        ctx.lineWidth = 1;
        for (let i = 0; i < 80; i++) {
            const p = pts[i];
            p.x -= 1.4;
            p.y += 6 + (i % 3);
            if (p.y > CH + 10) { p.y = -10; p.x = Math.random() * CW; }
            const a = 0.30 + (i % 5) * 0.06;
            ctx.strokeStyle = `rgba(140, 0, 0, ${a})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 2.5, p.y + 10);
            ctx.stroke();
        }
        // 굵은 핏방울 (일부)
        for (let i = 0; i < 20; i++) {
            const p = pts[i];
            const a = 0.18 + (i % 4) * 0.05;
            ctx.fillStyle = `rgba(160, 10, 10, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x + 5, p.y + 4, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }

    // wg6: 마왕 불꽃 부유 파티클 + 보라 먼지
    if (wg === 6) {
        ctx.save();
        // 불꽃 파티클 (크고 선명하게)
        for (let i = 0; i < 50; i++) {
            const p = pts[i];
            p.x += Math.sin(frameNow * 0.002 + i * 1.3) * 0.9;
            p.y -= 1.0 + (i % 3) * 0.4;
            if (p.y < -8) { p.y = CH + 4; p.x = Math.random() * CW; }
            const a = 0.22 + Math.sin(frameNow * 0.003 + i) * 0.12;
            const r = 140 + (i % 80);
            ctx.fillStyle = `rgba(${r}, ${Math.floor(r * 0.18)}, 0, ${a})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5 + (i % 3) * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        // 보라빛 먼지 흐름
        for (let i = 0; i < 25; i++) {
            const bx = ((i * 83 + frameNow * (0.4 + i * 0.02)) % (CW + 40)) - 20;
            const by = ((i * 67 + frameNow * -(0.3 + i * 0.015)) % CH + CH) % CH;
            const ba = 0.12 + Math.sin(frameNow * 0.004 + i) * 0.08;
            ctx.fillStyle = `rgba(160, 80, 220, ${ba})`;
            ctx.beginPath();
            ctx.arc(bx, by, 2.0 + (i % 4) * 1.0, 0, Math.PI * 2);
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
        else if (i.type === "atk_drop") ctx.fillStyle = "#af1616"; 
        else if (i.type === "def_drop") ctx.fillStyle = "#32b427"; 
        else if (i.type === "atk_spd_drop") ctx.fillStyle = "#f1d13e"; 
        else if (i.type === "move_spd_drop") ctx.fillStyle = "#2e9de7"; 
        else if (i.type === "jump_drop") ctx.fillStyle = "#661ea1"; 
        else ctx.fillStyle = "#00ccff"; 
        
        ctx.fillRect(ix, i.y, 10, 10); ctx.fillStyle = "#ffffff"; ctx.fillRect(ix + 3, i.y + 2, 4, 4); 
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; ctx.strokeRect(ix, i.y, 10, 10);
    });

    const _isDestTile = Game.worldN % 2 === 0 && Game.worldN >= 2 && Game.worldN <= 6;
    Game.platforms.forEach((t) => {
        const tx = t.x - Game.camX, ty = t.y;
        if (tx > CW + TILE || tx + t.w < -TILE) return;
        ctx.save();
        if (_isDestTile) ctx.globalAlpha = 0.62;
        if (t.float && t.fallTimer > 0) {
            ctx.globalAlpha = Math.max(0, 1 - (t.fallTimer / 50)) * (_isDestTile ? 0.62 : 1);
            const shake = t.fallTimer < 30 ? (Math.random() * 2 - 1) : 0;
            drawTile(tx + shake, ty, t.w, t.h, t, wg, tColors, frameNow);
        } else {
            drawTile(tx, ty, t.w, t.h, t, wg, tColors, frameNow);
        }
        ctx.restore();
        // 파괴 스테이지: 타일 위에 어두운 오버레이
        if (_isDestTile) {
            ctx.fillStyle = "rgba(5,3,8,0.45)";
            ctx.fillRect(tx, ty, t.w, t.h);
        }
    });

    Game.doors.forEach((d) => {
        const dx = d.x - Game.camX;
        if (d.open) {
            ctx.shadowColor = "#aa00ff"; ctx.shadowBlur = 15;
            ctx.fillStyle = "#2a0044"; ctx.fillRect(dx, d.y, d.w, d.h);
            ctx.fillStyle = "#7700ff"; ctx.fillRect(dx + 4, d.y + 4, d.w - 8, d.h - 8);
            ctx.fillStyle = "#cc88ff"; ctx.fillRect(dx + 10, d.y + 10, d.w - 20, d.h - 20);
            ctx.shadowBlur = 0;
            ctx.textAlign = "center";
            // 플레이어 근처일 때 위 키 안내
            if (d._playerNear) {
                const blink = Math.floor(Date.now() / 400) % 2 === 0;
                ctx.globalAlpha = blink ? 1.0 : 0.55;
                ctx.shadowColor = "#ffee00"; ctx.shadowBlur = 8;
                ctx.fillStyle = "#ffee00"; ctx.font = "bold 11px SkullFont, NeoDunggeunmo";
                ctx.fillText("↑ 입장", dx + d.w / 2, d.y - 12);
                ctx.shadowBlur = 0; ctx.globalAlpha = 1;
            }
        } else {
            ctx.fillStyle = "#3e2723"; ctx.fillRect(dx, d.y, d.w, d.h); 
            ctx.fillStyle = "#271714"; ctx.fillRect(dx + 4, d.y + 4, d.w - 8, d.h - 8); 
            ctx.fillStyle = "#4e342e"; ctx.fillRect(dx + 8, d.y + 8, d.w - 16, d.h - 16); 
            ctx.fillStyle = "#111"; ctx.fillRect(dx, d.y + 15, d.w, 4); ctx.fillRect(dx, d.y + 45, d.w, 4);
            ctx.fillStyle = "#757575"; ctx.fillRect(dx + d.w / 2 - 4, d.y + d.h / 2 - 4, 8, 8);
            ctx.fillStyle = "#00ccff"; ctx.font = "10px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center"; 
            ctx.fillText("봉인됨", dx + d.w / 2, d.y - 8); 
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

    // NPC 렌더
    if (typeof renderNPCs === 'function') renderNPCs(frameNow);
}
