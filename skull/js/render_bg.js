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
    const ext = Game.pRangeBonus;

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
        // 방패병 — 짧은 망치 (손잡이 8px만)
        ctx.fillStyle = "#5c3a21";
        ctx.fillRect(0, -1, 8, 3);          // 짧은 손잡이
        ctx.fillStyle = "#888";
        ctx.fillRect(7, -5, 7, 10);         // 작은 망치 머리
        ctx.fillStyle = "#aaa";
        ctx.fillRect(8, -4, 5, 8);
        ctx.fillStyle = "rgba(255,220,0,0.6)";
        ctx.fillRect(9, -3, 2, 2);
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
        const t5 = frameNow;
        // ── 피바다 하늘: 짙은 선홍빛 ──
        const bloodSky = ctx.createLinearGradient(0, 0, 0, CH);
        bloodSky.addColorStop(0,   "#1a0000");
        bloodSky.addColorStop(0.3, "#3a0005");
        bloodSky.addColorStop(0.6, "#5a0008");
        bloodSky.addColorStop(1,   "#1a0003");
        ctx.fillStyle = bloodSky;
        ctx.fillRect(0, 0, CW, CH);

        // 핏빛 원경 광원 (지평선 쪽)
        const horizGrd = ctx.createRadialGradient(CW*0.5, CH*0.85, 20, CW*0.5, CH*0.85, CW*0.7);
        horizGrd.addColorStop(0,   "rgba(200,0,20,0.45)");
        horizGrd.addColorStop(0.4, "rgba(120,0,10,0.2)");
        horizGrd.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = horizGrd;
        ctx.fillRect(0, 0, CW, CH);

        // 피 웅덩이 잔물결 (지면 근처)
        ctx.save();
        for (let i = 0; i < 6; i++) {
            const px = ((i * 180 + Game.camX * 0.3) % (CW + 200)) - 80;
            const py = CH - 55 + (i % 2) * 12;
            const pr = 35 + (i % 3) * 18;
            const pa = 0.15 + Math.sin(t5 * 0.001 + i) * 0.06;
            const poolGrd = ctx.createRadialGradient(px, py, 0, px, py, pr);
            poolGrd.addColorStop(0,   `rgba(180,0,15,${pa+0.1})`);
            poolGrd.addColorStop(0.5, `rgba(120,0,10,${pa})`);
            poolGrd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = poolGrd;
            ctx.beginPath(); ctx.ellipse(px, py, pr*2, pr*0.4, 0, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();

        // 핏방울 낙하
        ctx.save();
        ctx.strokeStyle = "rgba(180,0,20,0.55)"; ctx.lineWidth = 1.2;
        for (let i = 0; i < 60; i++) {
            const bx = ((i * 137 + Game.camX * 0.1) % (CW + 40)) - 20;
            const by = ((i * 97 + t5 * (2 + i % 3) * 0.08) % (CH + 20));
            const bl = 5 + (i % 5) * 2;
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 0.5, by + bl); ctx.stroke();
        }
        ctx.restore();

        // 원경 마왕성 실루엣 (핏빛에 잠긴)
        const cOff5 = Game.camX * 0.05;
        ctx.fillStyle = "rgba(10,0,2,0.92)";
        ctx.beginPath();
        ctx.moveTo(CW*0.1 - cOff5, CH);
        ctx.lineTo(CW*0.1 - cOff5, CH-180);
        ctx.lineTo(CW*0.18 - cOff5, CH-220);
        ctx.lineTo(CW*0.22 - cOff5, CH-180);
        ctx.lineTo(CW*0.5 - cOff5, CH-180);
        ctx.lineTo(CW*0.5 - cOff5, CH-300);
        ctx.lineTo(CW*0.55 - cOff5, CH-360);
        ctx.lineTo(CW*0.6 - cOff5, CH-300);
        ctx.lineTo(CW*0.9 - cOff5, CH-300);
        ctx.lineTo(CW*0.9 - cOff5, CH);
        ctx.fill();
        // 마왕성 창문 핏빛
        const wins = [[0.15,0.55],[0.48,0.35],[0.52,0.45],[0.58,0.38]];
        wins.forEach(([wx,wy]) => {
            const wFlk = (Math.sin(t5*0.0007 + wx*10) + 1) / 2;
            ctx.fillStyle = `rgba(200,0,20,${0.3 + wFlk*0.4})`;
            const wrx = wx * CW - cOff5, wry = wy * CH;
            ctx.fillRect(wrx-3, wry-5, 6, 9);
        });

        // 전경 안개 (피 섞인 붉은 안개)
        for (let f = 0; f < 6; f++) {
            const fx = ((f * 190 + t5 * 0.018 * (f%2===0?1:-0.6)) % (CW+300)) - 120;
            const fogGrd = ctx.createRadialGradient(fx, CH-30, 0, fx, CH-30, 100);
            fogGrd.addColorStop(0,   "rgba(150,0,15,0.18)");
            fogGrd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = fogGrd;
            ctx.beginPath(); ctx.ellipse(fx, CH-30, 140, 35, 0, 0, Math.PI*2); ctx.fill();
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
        else if (i.type === "atk_drop") ctx.fillStyle = "#af1616"; 
        else if (i.type === "def_drop") ctx.fillStyle = "#32b427"; 
        else if (i.type === "atk_spd_drop") ctx.fillStyle = "#f1d13e"; 
        else if (i.type === "move_spd_drop") ctx.fillStyle = "#2e9de7"; 
        else if (i.type === "jump_drop") ctx.fillStyle = "#661ea1"; 
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

    // NPC 렌더
    if (typeof renderNPCs === 'function') renderNPCs(frameNow);
}
