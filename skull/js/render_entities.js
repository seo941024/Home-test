// render_entities.js — 엔티티(몬스터/보스/플레이어) 렌더링

function drawEntities(frameNow) {
    ctx.imageSmoothingEnabled = false; 

    Game.eBullets.forEach(b => {
        if (!b.active) return; 
        const bx = b.x - Game.camX; 
        if (bx < -10 || bx > CW + 10) return;
        
        if (b.unblockable) {
            // 막을 수 없는 투사체: shadowBlur 제거, 색으로만 구분
            ctx.fillStyle = "#7700cc";
            ctx.beginPath(); ctx.arc(bx, b.y, b.r * 1.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ff0033";
            ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.75, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "rgba(255,200,255,0.6)";
            ctx.beginPath(); ctx.arc(bx - b.r*0.3, b.y - b.r*0.3, b.r * 0.3, 0, Math.PI*2); ctx.fill();
        } else if (b.isArrow) {
            // 화살: 방향 따라 회전
            const arrAng = Math.atan2(b.vy, b.vx);
            ctx.save(); ctx.translate(bx, b.y); ctx.rotate(arrAng);
            ctx.fillStyle = "#4a2a0a"; ctx.fillRect(-b.r*1.8, -b.r*0.3, b.r*3.6, b.r*0.6);
            ctx.fillStyle = "#00ccff";
            ctx.beginPath(); ctx.moveTo(b.r*1.8, 0); ctx.lineTo(b.r*0.8, -b.r*0.7); ctx.lineTo(b.r*0.8, b.r*0.7); ctx.fill();
            ctx.fillStyle = "#888"; ctx.fillRect(-b.r*1.8, -b.r*0.2, b.r*0.8, b.r*0.4);
            ctx.restore();
        } else if (b.isBomb) {
            // 폭탄: shadowBlur 제거
            ctx.fillStyle = "#cc3300";
            ctx.beginPath(); ctx.arc(bx, b.y, b.r * 1.2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ff8800";
            ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ffee00";
            ctx.beginPath(); ctx.arc(bx - b.r*0.2, b.y - b.r*0.2, b.r*0.35, 0, Math.PI*2); ctx.fill();
        } else {
            // 일반 적 투사체: 속도 방향 회전 (shadowBlur 제거 — 다수 동시 존재 시 성능 저하 방지)
            const eAng = Math.atan2(b.vy, b.vx);
            ctx.save();
            ctx.translate(bx, b.y);
            ctx.rotate(eAng);
            ctx.fillStyle = "#cc1100";
            ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.8, b.r * 0.8, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ff4422";
            ctx.beginPath(); ctx.ellipse(b.r * 0.3, 0, b.r * 1.2, b.r * 0.55, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ffccaa";
            ctx.beginPath(); ctx.arc(b.r * 0.9, 0, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    });

    Game.bullets.forEach(b => {
        if (!b.active) return;
        const bx = b.x - Game.camX;
        if (bx < -10 || bx > CW + 10) return;

        // Night Hollow 대형 구체 (sk=4) — 마법사 평타 스타일 (안쪽 밝은 원)
        if (b.sk === 4) {
            ctx.save();
            ctx.translate(bx, b.y);
            const nhLife  = b.life / (b.maxLife || 300);
            const nhPulse = 0.92 + Math.sin(frameNow * 0.006) * 0.08;
            const nhR     = b.r * nhPulse;
            // 외부 글로우 (마법사 평타 스타일)
            const nhGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, nhR * 2.0);
            nhGrd.addColorStop(0,   `rgba(200,240,255,${nhLife * 0.95})`);
            nhGrd.addColorStop(0.3, `rgba(0,200,255,${nhLife * 0.75})`);
            nhGrd.addColorStop(0.7, `rgba(0,100,200,${nhLife * 0.35})`);
            nhGrd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = nhGrd;
            ctx.beginPath(); ctx.arc(0, 0, nhR * 2.0, 0, Math.PI * 2); ctx.fill();
            // 본체 (하늘색 반투명)
            ctx.fillStyle = `rgba(0,180,255,${nhLife * 0.6})`;
            ctx.beginPath(); ctx.arc(0, 0, nhR, 0, Math.PI * 2); ctx.fill();
            // 안쪽 밝은 흰색 코어 (마법사 평타와 동일 스타일)
            ctx.fillStyle = `rgba(220,245,255,${nhLife * 0.9})`;
            ctx.beginPath(); ctx.arc(0, 0, nhR * 0.45, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${nhLife * 0.95})`;
            ctx.beginPath(); ctx.arc(0, 0, nhR * 0.2, 0, Math.PI * 2); ctx.fill();
            // shadowBlur 글로우
            ctx.shadowBlur = 18; ctx.shadowColor = "rgba(0,200,255,0.8)";
            ctx.fillStyle = `rgba(0,220,255,${nhLife * 0.4})`;
            ctx.beginPath(); ctx.arc(0, 0, nhR * 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
            return;
        }

        // 조커 카드 투사체
        if (b.isCard) {
            const angle = Math.atan2(b.vy, b.vx);
            const spin = (1 - b.life / b.maxLife) * Math.PI * 4 * (b.vx > 0 ? 1 : -1);
            ctx.save();
            ctx.translate(bx, b.y);
            ctx.rotate(angle + spin);
            const cCol = b.cardCol || "#ffffff";
            // 카드 테두리
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-6, -4, 12, 8);
            // 카드 본체
            ctx.fillStyle = cCol;
            ctx.fillRect(-5, -3, 10, 6);
            // 흰색일 경우 검정 윤곽
            if (cCol === "#222222") {
                ctx.strokeStyle = "#666666"; ctx.lineWidth = 0.8;
                ctx.strokeRect(-5, -3, 10, 6);
            }
            // 카드 심볼 (작은 흰 점)
            ctx.fillStyle = cCol === "#222222" ? "#ffffff" : "rgba(255,255,255,0.7)";
            ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.restore();
            return;
        }

        // 발키리 총알: 사각형 파티클
        if (!b.sk && b.r <= 5 && Game.pClass === 4) {
            const bulletCol = (Math.floor(b.life / 5) % 3 === 0) ? "#ffffff"
                : (Math.floor(b.life / 5) % 3 === 1) ? "#ffffff" : "#ffffff";
            ctx.fillStyle = bulletCol;
            ctx.fillRect(bx - 3, b.y - 2, 6, 4);
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillRect(bx - 1, b.y - 1, 2, 2);
            return;
        }

        if (b.sk === 2) { 
            // 강하 공격 이펙트: 투명도 있는 날카로운 검기/충격파 연출
            const height = b.r * 3 * (b.life / 15);
            
            // 직업별 강하 이펙트 색상 부여 (외곽선)
            const _pc = Game.pClass;
            const outCol = _pc === 0 ? "rgba(214, 236, 255, 0.6)"
                : _pc === 1  ? "rgba(204, 68, 255, 0.6)"
                : _pc === 3  ? "rgba(136, 0, 0, 0.8)"
                : _pc === 5  ? "rgba(255, 255, 0, 0.6)"
                : _pc === 6  ? "rgba(200, 30, 60, 0.8)"
                : _pc === 7 ? "rgba(255, 221, 0, 0.8)"
                : "rgba(0, 204, 255, 0.6)";
            const inCol = _pc === 3  ? "rgba(255, 50, 50, 0.8)"
                : _pc === 5  ? "rgba(255, 255, 200, 0.8)"
                : _pc === 6  ? "rgba(255, 80, 100, 0.9)"
                : _pc === 7 ? "rgba(255, 240, 100, 0.9)"
                : "rgba(255, 255, 255, 0.7)";

            // 렌더링
            ctx.fillStyle = outCol; 
            ctx.fillRect(bx - b.r/2, b.y + 10 - height, b.r, height);
            ctx.fillStyle = inCol; 
            ctx.fillRect(bx - b.r/4, b.y + 10 - height, b.r/2, height);
            
        } else if (b.sk === 0 && Game.pClass === 2) {
            // 마법사 투사체: 진행 방향 + Glowing Orb
            const bAngle = Math.atan2(b.vy, b.vx);
            ctx.save();
            ctx.translate(bx, b.y);
            ctx.rotate(bAngle);
            // 외부 글로우
            const orbR = b.r * 2.4;
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, orbR);
            grd.addColorStop(0,   "rgba(200, 240, 255, 0.95)");
            grd.addColorStop(0.3, "rgba(  0, 200, 255, 0.8)");
            grd.addColorStop(0.7, "rgba(  0, 100, 200, 0.4)");
            grd.addColorStop(1,   "rgba(  0,  30,  80, 0)");
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
        } else if (b.sk === 5) {
            // 아크틱 할로우: 수속성 블랙홀
            ctx.save();
            ctx.translate(bx, b.y);
            const evLife = Math.max(0, b.life / (b.maxLife || 480));
            const spin = frameNow * 0.040;
            const pulse = 0.90 + Math.sin(frameNow * 0.020) * 0.10;
            const evR = b.r * pulse;

            // 최외곽 넓은 빙한기 오라 (더 넓고 밝게)
            const auraGrd = ctx.createRadialGradient(0, 0, evR * 0.5, 0, 0, evR * 4.5);
            auraGrd.addColorStop(0,   `rgba(60,160,255,${evLife * 0.35})`);
            auraGrd.addColorStop(0.4, `rgba(20,80,200,${evLife * 0.22})`);
            auraGrd.addColorStop(0.75,`rgba(0,30,120,${evLife * 0.10})`);
            auraGrd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = auraGrd;
            ctx.beginPath(); ctx.arc(0, 0, evR * 4.5, 0, Math.PI * 2); ctx.fill();

            // 외부 수속성 오라 (청색 글로우)
            const outerGrd = ctx.createRadialGradient(0, 0, evR * 0.3, 0, 0, evR * 3.2);
            outerGrd.addColorStop(0,   `rgba(0,20,60,${evLife * 0.98})`);
            outerGrd.addColorStop(0.35,`rgba(0,60,140,${evLife * 0.80})`);
            outerGrd.addColorStop(0.65,`rgba(0,110,220,${evLife * 0.55})`);
            outerGrd.addColorStop(0.85,`rgba(40,170,255,${evLife * 0.30})`);
            outerGrd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = outerGrd;
            ctx.beginPath(); ctx.arc(0, 0, evR * 3.2, 0, Math.PI * 2); ctx.fill();

            // 회전하는 빙하 소용돌이 아암 8개 (6→8, 굵게)
            ctx.shadowBlur = 10; ctx.shadowColor = "rgba(100,200,255,0.8)";
            for (let ai = 0; ai < 8; ai++) {
                const armAng = spin + ai * (Math.PI / 4);
                ctx.save();
                ctx.rotate(armAng);
                const armGrd = ctx.createLinearGradient(evR * 0.35, 0, evR * 2.4, 0);
                armGrd.addColorStop(0,   `rgba(150,230,255,${evLife * 0.95})`);
                armGrd.addColorStop(0.4, `rgba(80,170,255,${evLife * 0.70})`);
                armGrd.addColorStop(0.75,`rgba(30,100,220,${evLife * 0.40})`);
                armGrd.addColorStop(1,   "rgba(0,40,140,0)");
                ctx.strokeStyle = armGrd;
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(evR * 0.35, 0);
                ctx.quadraticCurveTo(evR * 1.0, evR * 0.6, evR * 2.4, evR * 0.3);
                ctx.stroke();
                ctx.restore();
            }
            ctx.shadowBlur = 0;

            // 역회전 얼음 결정 파편 (더 많고 크게)
            for (let ci = 0; ci < 12; ci++) {
                const cAng = -spin * 1.4 + ci * (Math.PI / 6);
                const cr = evR * (0.65 + 0.35 * Math.sin(frameNow * 0.02 + ci));
                const cx2 = Math.cos(cAng) * cr, cy2 = Math.sin(cAng) * cr;
                const cAlpha = evLife * (0.65 + 0.35 * Math.sin(frameNow * 0.025 + ci));
                ctx.fillStyle = `rgba(200,240,255,${cAlpha})`;
                ctx.beginPath(); ctx.arc(cx2, cy2, 3.2, 0, Math.PI * 2); ctx.fill();
            }

            // 블랙홀 본체 (어두운 중심)
            const coreGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, evR * 0.9);
            coreGrd.addColorStop(0,   `rgba(0,0,8,${evLife})`);
            coreGrd.addColorStop(0.5, `rgba(0,8,30,${evLife * 0.95})`);
            coreGrd.addColorStop(0.85,`rgba(0,30,80,${evLife * 0.8})`);
            coreGrd.addColorStop(1,   "rgba(0,50,120,0)");
            ctx.fillStyle = coreGrd;
            ctx.beginPath(); ctx.arc(0, 0, evR * 0.9, 0, Math.PI * 2); ctx.fill();

            // 중심 빙하 발광 링 (더 밝고 선명하게)
            ctx.shadowBlur = 22; ctx.shadowColor = "rgba(100,210,255,1.0)";
            ctx.strokeStyle = `rgba(140,230,255,${evLife})`;
            ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, evR * 0.42, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 12;
            ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(230,250,255,${evLife * 0.85})`;
            ctx.beginPath(); ctx.arc(0, 0, evR * 0.20, 0, Math.PI * 2); ctx.stroke();
            // 중심 밝은 점
            ctx.fillStyle = `rgba(220,245,255,${evLife * 0.95})`;
            ctx.beginPath(); ctx.arc(0, 0, evR * 0.08, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        } else if (b.sk === 6) {
            // 강령술사 소울 탄환: 녹색 유령불꽃
            ctx.save();
            ctx.translate(bx, b.y);
            const sLife = Math.max(0, b.life / (b.maxLife || 280));
            const sPulse = 0.88 + Math.sin(frameNow * 0.022 + b.x * 0.01) * 0.12;
            const sR = b.r * 1.6 * sPulse;
            const sGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, sR * 2.2);
            sGrd.addColorStop(0,   `rgba(200,255,230,${sLife * 0.95})`);
            sGrd.addColorStop(0.35,`rgba(60,255,140,${sLife * 0.80})`);
            sGrd.addColorStop(0.7, `rgba(0,180,80,${sLife * 0.45})`);
            sGrd.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = sGrd;
            ctx.beginPath(); ctx.arc(0, 0, sR * 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 10; ctx.shadowColor = "rgba(60,255,140,0.8)";
            ctx.fillStyle = `rgba(160,255,200,${sLife * 0.9})`;
            ctx.beginPath(); ctx.arc(0, 0, sR * 0.55, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        } else {
            ctx.fillStyle = b.col || (b.sk ? "#00ccff" : "#ffffff"); ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        }
    });

    Game.lasers.forEach(l => { 
        if (!l.active) return; 
        const lx = l.x - Game.camX; 
        if (lx + l.w < 0 || lx > CW) return; 
        ctx.save(); ctx.globalAlpha = l.life / l.maxLife;
        ctx.fillStyle = l.color; ctx.fillRect(lx, l.y, l.w, l.h);
        // 중앙 하이라이트 — 색상 계열 유지 (흰색 덮어쓰기 제거)
        if (l.color && l.color !== '#000000') {
            ctx.globalAlpha *= 0.55;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(lx, l.y + l.h*0.25, l.w, l.h*0.5);
        }
        ctx.restore(); 
    });
    
    Game.parts.forEach(pt => { 
        if (!pt.active) return; 
        const px = pt.x - Game.camX; 
        if (px < -10 || px > CW + 10) return; 
        ctx.globalAlpha = pt.life / pt.ml; ctx.fillStyle = pt.col; ctx.fillRect(px - (pt.size / 2), pt.y - (pt.size / 2), pt.size, pt.size); ctx.globalAlpha = 1; 
    });

    const _isDest = Game.worldN % 2 === 0 && Game.worldN >= 2 && Game.worldN <= 6;
    const _eyeCol = _isDest ? "#ff2200" : null; // 파괴된 스테이지: 빨간눈

    Game.enemies.forEach(e => {
        if (!e.active) return;
        const ex = e.x - Game.camX;
        if (ex < -100 || ex > CW + 100) return;

        ctx.save();
        ctx.translate(Math.round(ex + e.w / 2), Math.round(e.y + e.h / 2));

        if (e.warnT > 0) {
            ctx.save();
            if (e.isBoss) {
                const maxW = e._warnBase || (e.phase === 1 ? 80 : 55);
                const warnProg = Math.max(0, 1 - e.warnT / maxW);
                ctx.globalAlpha = 0.08 + warnProg * 0.55;
                const wd = e.warnData;
                const w = e.world;
                const warnCols = ["#ff4400", "#ffcc00", "#cc00ff", "#00ffee"];
                ctx.fillStyle = warnCols[Math.min(3, wd.ap || 0)];
                // 마지막 0.5초 깜빡임
                if (e.warnT <= 12 && Math.floor(e.warnT / 3) % 2 === 0) ctx.globalAlpha = 0.9;

                const eHalf = e.w / 2;
                const pOX = (wd.targetX || 0) - (e.x + eHalf);
                const pOY = (wd.targetY || 0) - (e.y + e.h / 2);

                if (wd.ap === 0) {
                    if (w <= 2) {
                        // W1/W2: 전방 근접 슬래시
                        const sx = wd.facing > 0 ? 10 : -90;
                        ctx.fillStyle = "rgba(255,80,0,0.35)";
                        ctx.fillRect(sx, -20, 90, 55);
                        ctx.strokeStyle = "rgba(255,140,0,0.7)"; ctx.lineWidth = 2;
                        ctx.strokeRect(sx, -20, 90, 55);
                    } else if (w === 3) {
                        // W3: 수평 레이저
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -5, 800, 10);
                    } else if (w === 4) {
                        // W4: 대검 내려치기 (근접 슬래시)
                        const sx4 = wd.facing > 0 ? 10 : -80;
                        ctx.fillStyle = "rgba(100,0,0,0.35)";
                        ctx.fillRect(sx4, -15, 90, e.h * 1.5);
                        ctx.strokeStyle = "rgba(180,0,0,0.7)"; ctx.lineWidth = 2;
                        ctx.strokeRect(sx4, -15, 90, e.h * 1.5);
                    } else if (w <= 6) {
                        // W5: 넓은 수평 레이저 / W6: targetY 레이저
                        if (w === 5) {
                            ctx.fillRect(wd.facing > 0 ? 0 : -800, -35, 800, 70);
                        } else {
                            // W6: 플레이어 Y 위치에 맞춘 수평 레이저
                            ctx.fillRect(wd.facing > 0 ? 0 : -800, pOY - 25, 800, 50);
                        }
                    } else if (w === 7) {
                        // W7: 위아래 2단 레이저
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -22, 800, 14);
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, 8, 800, 14);
                    } else if (w === 8) {
                        // W8: 포격 수직 기둥
                        ctx.fillStyle = "#ff6600";
                        for (let ri = -1; ri <= 1; ri++) {
                            ctx.fillRect(pOX + ri*35 - 10, -CH, 20, CH*2);
                        }
                    } else {
                        // W9: 낙뢰 수직 기둥 / W10: 여러 낙뢰
                        ctx.fillStyle = w === 10 ? "#ff2200" : "#aa00ff";
                        const strikes = w === 10 ? 5 : 2;
                        const sp10 = w === 10 ? 80 : 30;
                        for (let ri = 0; ri < strikes; ri++) {
                            const ox = (ri - Math.floor(strikes/2)) * sp10;
                            ctx.fillRect(pOX + ox - 12, -CH, 24, CH*2);
                        }
                    }
                } else if (wd.ap === 1) {
                    if (w <= 2) {
                        // W1/W2: 점프 후 지면 충격파
                        ctx.fillStyle = "rgba(200,60,0,0.3)";
                        ctx.fillRect(-40, 15, e.w + 80, 50);
                        ctx.strokeStyle = "rgba(255,100,0,0.7)"; ctx.lineWidth = 2;
                        ctx.strokeRect(-40, 15, e.w + 80, 50);
                    } else if (w === 3) {
                        // W3: 전방 3방향 화살 부채꼴
                        const ba3 = wd.facing > 0 ? 0 : Math.PI;
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 370, ba3 - 0.55, ba3 + 0.55);
                        ctx.fill();
                    } else if (w === 4) {
                        // W4: 전진 슬래시 2연속
                        const sx4b = wd.facing > 0 ? 5 : -70;
                        ctx.fillStyle = "rgba(136,0,0,0.3)";
                        ctx.fillRect(sx4b, 0, 75, e.h * 1.1);
                        ctx.strokeStyle = "rgba(180,0,0,0.6)"; ctx.lineWidth = 2;
                        ctx.strokeRect(sx4b, 0, 75, e.h * 1.1);
                    } else if (w === 5) {
                        // W5: 전방위 탄막
                        ctx.beginPath(); ctx.arc(0, 0, 380, 0, Math.PI*2); ctx.fill();
                    } else if (w === 6) {
                        // W6: 플레이어 방향 유도탄 호
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 400, wd.ang - 0.4, wd.ang + 0.4);
                        ctx.fill();
                    } else if (w === 7) {
                        // W7: 전방 부채꼴 충격파
                        const ba7 = wd.facing > 0 ? 0 : Math.PI;
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 380, ba7 - 0.6, ba7 + 0.6);
                        ctx.fill();
                    } else if (w === 8) {
                        // W8: 넓은 광역 레이저
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -20, 800, 40);
                    } else if (w === 9) {
                        // W9: 플레이어 방향 영혼탄
                        ctx.fillStyle = "#aa00ff";
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 400, wd.ang - 0.5, wd.ang + 0.5);
                        ctx.fill();
                    } else {
                        // W10: 전방위 지옥의 문
                        ctx.fillStyle = "#ff0000";
                        ctx.beginPath(); ctx.arc(0, 0, 420, 0, Math.PI*2); ctx.fill();
                    }
                } else if (wd.ap === 2) {
                    if (w <= 2) {
                        // W1/W2: ap=2 없음 (빈 표시)
                        ctx.beginPath(); ctx.arc(0, 0, 200, 0, Math.PI*2); ctx.fill();
                    } else if (w === 3) {
                        // W3: 낙하 화살비 — 플레이어 위치 수직 기둥
                        ctx.fillStyle = "#ff4400";
                        for (let ri = -2; ri <= 2; ri++) {
                            ctx.fillRect(pOX + ri*40 - 10, -CH, 20, CH*2);
                        }
                    } else if (w === 4) {
                        // W4: 전방위 확산탄
                        ctx.beginPath(); ctx.arc(0, 0, 380, 0, Math.PI*2); ctx.fill();
                    } else if (w === 5) {
                        // W5: 낙하 폭탄 (아래 방향)
                        ctx.fillStyle = "#cc6600";
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 350, Math.PI*0.3, Math.PI*0.7);
                        ctx.fill();
                    } else if (w === 6) {
                        // W6: 수직 낙뢰 (targetX)
                        ctx.fillStyle = "#ff0055";
                        ctx.fillRect(pOX - 12, -CH, 24, CH * 2);
                    } else if (w === 7) {
                        // W7: 전방위 + 수평 레이저
                        ctx.beginPath(); ctx.arc(0, 0, 320, 0, Math.PI*2); ctx.fill();
                        ctx.fillRect(wd.facing > 0 ? 0 : -800, -8, 800, 16);
                    } else if (w === 8) {
                        // W8: 화살비 수직 기둥
                        ctx.fillStyle = "#ff3300";
                        for (let ri = 0; ri < 5; ri++) {
                            ctx.fillRect(pOX - 100 + ri*50, -CH, 20, CH*2);
                        }
                    } else if (w === 9) {
                        // W9: 소용돌이
                        ctx.fillStyle = "#aa00ff";
                        ctx.beginPath(); ctx.arc(0, 0, 400, 0, Math.PI*2); ctx.fill();
                    } else {
                        // W10: 낙하 운석 기둥
                        ctx.fillStyle = "#880000";
                        const amt10 = 5;
                        for (let ri = 0; ri < amt10; ri++) {
                            const ox = (ri - Math.floor(amt10/2)) * 75;
                            ctx.fillRect(pOX + ox - 12, -CH, 24, CH*2);
                        }
                    }
                } else {
                    // ap=3 신규 패턴 경고
                    ctx.fillStyle = "#00ffee";
                    if (w <= 2) {
                        // W1: 회전슬래시 / W2: 도끼투척 — 보스 주변 원형
                        ctx.beginPath(); ctx.arc(0, 0, e.w/2 + 45, 0, Math.PI*2); ctx.fill();
                    } else if (w === 3) {
                        // W3: 바닥 뼈기둥 수직 기둥
                        ctx.fillStyle = "#ddddaa";
                        for (let ri = -1; ri <= 1; ri++) {
                            ctx.fillRect(pOX + ri*80 - 10, CH/2 - e.y - e.h/2, 20, CH);
                        }
                    } else if (w === 4) {
                        // W4: 전방 부채꼴 도끼투척
                        const ba4r = wd.facing > 0 ? 0 : Math.PI;
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 350, ba4r - 0.7, ba4r + 0.7);
                        ctx.fill();
                    } else if (w === 5) {
                        // W5: 돌진 충격파 — 보스 주변 원형
                        ctx.beginPath(); ctx.arc(0, 0, e.w/2 + 55, 0, Math.PI*2); ctx.fill();
                    } else if (w === 6) {
                        // W6: 저주의 봉인 — 바닥 줄무늬
                        ctx.fillStyle = "#ff0055";
                        for (let ri = -1; ri <= 2; ri++) {
                            ctx.fillRect(pOX + ri*90 - 18, CH/2 - e.y - e.h/2, 36, CH);
                        }
                    } else if (w === 7) {
                        // W7: 사방 난무 — 수평+수직 십자
                        ctx.fillRect(-800, -8, 1600, 16);
                        ctx.fillRect(-10, -CH, 20, CH*2);
                    } else if (w === 8) {
                        // W8: 전속력 돌진 대검 — 전방 슬래시 박스
                        const sx8r = wd.facing > 0 ? 10 : -115;
                        ctx.fillStyle = "rgba(255,51,0,0.35)";
                        ctx.fillRect(sx8r, -30, 115, e.h * 2.0);
                        ctx.strokeStyle = "rgba(255,100,0,0.7)"; ctx.lineWidth = 2;
                        ctx.strokeRect(sx8r, -30, 115, e.h * 2.0);
                    } else if (w === 9) {
                        // W9: 영혼의 낫 — 플레이어 방향 넓은 호
                        ctx.fillStyle = "#aa00ff";
                        ctx.beginPath(); ctx.moveTo(0,0);
                        ctx.arc(0, 0, 450, wd.ang - 0.35, wd.ang + 0.35);
                        ctx.fill();
                    } else {
                        // W10: 광란의 탄막 — 전방위 + 낙뢰 기둥
                        ctx.fillStyle = "#ff0000";
                        ctx.beginPath(); ctx.arc(0, 0, 430, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = "#ff2200";
                        for (let ri = -1; ri <= 1; ri++) {
                            ctx.fillRect(pOX + ri*65 - 12, -CH, 24, CH*2);
                        }
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
        // wRot: warnT 중 무기 들기 → atkAnim 중 휘두르기 (월드별 다른 호 각도)
        const meleeWorlds = [1, 2, 3, 4]; // 근접 주체 보스
        const _atkProg = e.atkAnim > 0 ? (1 - e.atkAnim / 20) : 0; // 0→1 (공격 진행)
        const wRot = e.warnT > 0
            ? -Math.PI * 0.5                        // 들어올리기 (더 크게)
            : (e.atkAnim > 0
                ? -Math.PI * 0.5 + Math.PI * 1.2 * _atkProg  // 위→아래+앞 스윙
                : 0);


        if (e.isBoss) {
            ctx.save();
            // ── 텔레그래프 오라: warnT 동안 공격 예고색 표시 ──
            if (e.warnT > 0 && e.warnData) {
                ctx.save(); ctx.scale(1.8, 1.8);
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
            ctx.scale(1.8, 1.8); // 히트박스와 렌더 크기 일치
            // 보스 다리 애니메이션 변수 — 잡몹 블록보다 먼저 선언
            const legL = e.fr === 0 ? 0 : -2;
            const legR = e.fr === 0 ? -2 : 0;
            const p2 = e.phase === 2;

            // ── 근접 스윙 아크 이펙트 (atkAnim > 0, 근접 보스만) ──
            if (e.atkAnim > 0 && e.world <= 4) {
                const ap = e.warnData ? e.warnData.ap : 0;
                const isMeleeAtk = (e.world <= 4 && ap <= 1) || (e.world === 1 && ap === 2);
                if (isMeleeAtk) {
                    const prog = 1 - e.atkAnim / 20; // 0→1
                    const alpha = prog < 0.5 ? prog * 2 : (1 - prog) * 2;
                    ctx.save();
                    ctx.globalAlpha = alpha * 0.75;

                    if (e.world <= 2) {
                        // 고블린 킹: 철퇴 수직 내려치기 아크
                        const startAng = -Math.PI * 0.8;
                        const endAng   = startAng + Math.PI * 1.2 * prog;
                        const R = 30;
                        // 두꺼운 무기 궤적 (오렌지-빨강)
                        ctx.strokeStyle = `rgba(255,${Math.floor(120*(1-prog))},0,${alpha})`;
                        ctx.lineWidth = 8 + prog * 6;
                        ctx.lineCap = 'round';
                        ctx.beginPath(); ctx.arc(12, 2, R, startAng, endAng); ctx.stroke();
                        // 안쪽 밝은 테두리
                        ctx.strokeStyle = `rgba(255,200,100,${alpha * 0.6})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(12, 2, R, startAng, endAng); ctx.stroke();
                        // 충격 스파크 (끝 지점)
                        if (prog > 0.7) {
                            const ex = 12 + Math.cos(endAng) * R;
                            const ey = 2 + Math.sin(endAng) * R;
                            ctx.shadowBlur = 12; ctx.shadowColor = "#ff6600";
                            ctx.fillStyle = `rgba(255,180,0,${alpha})`;
                            ctx.beginPath(); ctx.arc(ex, ey, 4 + prog * 3, 0, Math.PI*2); ctx.fill();
                            // 스파크 선
                            ctx.strokeStyle = "#ffdd00"; ctx.lineWidth = 1.5;
                            for (let si = 0; si < 5; si++) {
                                const sa = endAng + (si - 2) * 0.4;
                                ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(sa)*8, ey + Math.sin(sa)*8); ctx.stroke();
                            }
                            ctx.shadowBlur = 0;
                        }
                        // 바닥 충격파 (ap=1 점프 내리찍기)
                        if (ap === 1 && prog > 0.5) {
                            const shockW = (prog - 0.5) * 2 * 60;
                            ctx.strokeStyle = `rgba(200,60,0,${alpha * 0.8})`;
                            ctx.lineWidth = 3;
                            ctx.beginPath(); ctx.moveTo(-shockW, 20); ctx.lineTo(shockW, 20); ctx.stroke();
                            ctx.fillStyle = `rgba(255,100,0,${alpha * 0.3})`;
                            ctx.fillRect(-shockW, 16, shockW * 2, 8);
                        }

                    } else {
                        // 언데드 기사 (W3~4): 검 수평/수직 베기 아크
                        const startAng = -Math.PI * 0.7;
                        const endAng   = startAng + Math.PI * 1.1 * prog;
                        const R = 28;
                        // 검 궤적 (검정+붉은 핏빛)
                        ctx.strokeStyle = `rgba(180,0,30,${alpha})`;
                        ctx.lineWidth = 5 + prog * 4;
                        ctx.lineCap = 'round';
                        ctx.beginPath(); ctx.arc(14, 0, R, startAng, endAng); ctx.stroke();
                        // 날카로운 흰 궤적
                        ctx.strokeStyle = `rgba(220,200,180,${alpha * 0.5})`;
                        ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.arc(14, 0, R, startAng, endAng); ctx.stroke();
                        // 뼈 가루/핏방울 파티클
                        if (prog > 0.3) {
                            const ex = 14 + Math.cos(endAng) * R;
                            const ey = Math.sin(endAng) * R;
                            ctx.shadowBlur = 8; ctx.shadowColor = "#cc0020";
                            ctx.fillStyle = `rgba(200,0,20,${alpha * 0.9})`;
                            ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI*2); ctx.fill();
                            ctx.shadowBlur = 0;
                            // 핏방울 흩뿌림
                            ctx.fillStyle = `rgba(180,0,0,${alpha * 0.5})`;
                            for (let di = 0; di < 4; di++) {
                                const da = endAng + (di - 1.5) * 0.5;
                                const dr = 6 + di * 3;
                                ctx.beginPath(); ctx.arc(ex + Math.cos(da)*dr, ey + Math.sin(da)*dr, 1.5, 0, Math.PI*2); ctx.fill();
                            }
                        }
                        // 연속 베기 (ap=1) — 두 번째 슬래시선
                        if (ap === 1 && prog > 0.6) {
                            ctx.strokeStyle = `rgba(160,0,20,${alpha * 0.5})`;
                            ctx.lineWidth = 3;
                            ctx.beginPath(); ctx.arc(14, -5, R * 0.8, startAng + 0.3, endAng - 0.2); ctx.stroke();
                        }
                    }
                    ctx.restore();
                }
            }
            
            if (p2) { 
                ctx.shadowBlur = 15; 
                ctx.shadowColor = "#ff0000"; 
            }
            if (e.isRevived) {
                // 언데드화: globalAlpha 낮춰 어둡게 (filter 대신 성능 보존)
                ctx.globalAlpha = 0.65;
            }

            if (e.world === 1) {
                // w1 고블린 킹 — 초록 피부
                const b = eBob;
                ctx.fillStyle = "#2a4a1a";
                ctx.fillRect(-8, 10+b, 6, 7+Math.abs(legL)); ctx.fillRect(3, 10+b, 6, 7+Math.abs(legR));
                ctx.fillStyle = "#1a3010";
                ctx.fillRect(-9, 17+b, 7, 3); ctx.fillRect(3, 17+b, 7, 3);
                ctx.fillStyle = "#3a7a28"; ctx.fillRect(-12, -4+b, 24, 16);
                ctx.fillStyle = "#4a5a44"; ctx.fillRect(-11, -3+b, 22, 12);
                ctx.fillStyle = "#5a6a54"; ctx.fillRect(-10, -3+b, 22, 3);
                ctx.fillStyle = "#2a5a1a";
                ctx.fillRect(-18, -3+b, 7, 12); ctx.fillRect(12, -3+b, 7, 12);
                ctx.fillStyle = "#3a7a28"; ctx.fillRect(-4, -10+b, 8, 8);
                ctx.fillStyle = "#3a7a28"; ctx.fillRect(-10, -24+b, 20, 16);
                ctx.fillStyle = "#4a4a4f"; ctx.fillRect(-11, -26+b, 22, 6);
                ctx.fillStyle = "#3a3a3f";
                ctx.beginPath(); ctx.moveTo(-8,-26+b); ctx.lineTo(-12,-36+b); ctx.lineTo(-4,-26+b); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,-26+b); ctx.lineTo(12,-36+b); ctx.lineTo(4,-26+b); ctx.fill();
                ctx.fillStyle = p2 ? "#ff2200" : "#ffcc00";
                ctx.fillRect(-8,-20+b, 5, 3); ctx.fillRect(4,-20+b, 5, 3);
                ctx.fillStyle = "#000"; ctx.fillRect(-7,-20+b, 2, 2); ctx.fillRect(5,-20+b, 2, 2);
                ctx.fillStyle = "#e8e0d0";
                ctx.fillRect(-6,-9+b, 3, 4); ctx.fillRect(-1,-8+b, 3, 4); ctx.fillRect(4,-9+b, 3, 4);
                ctx.save(); ctx.translate(16, 2+b); ctx.rotate(wRot + 0.3);
                ctx.fillStyle = "#4a3010"; ctx.fillRect(-2, -20, 5, 24);
                ctx.fillStyle = "#6a4820"; ctx.fillRect(-1, -19, 2, 22);
                ctx.fillStyle = "#888"; ctx.fillRect(-4, -3, 9, 3);
                ctx.fillStyle = "#777c80"; ctx.fillRect(-7, -28, 15, 12);
                ctx.fillStyle = "#9aa0a8"; ctx.fillRect(-5, -27, 11, 10);
                ctx.fillStyle = "#888";
                ctx.beginPath(); ctx.moveTo(-7,-24); ctx.lineTo(-13,-22); ctx.lineTo(-7,-20); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,-24); ctx.lineTo(14,-22); ctx.lineTo(8,-20); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(1,-35); ctx.lineTo(2,-28); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,-17); ctx.lineTo(1,-12); ctx.lineTo(2,-17); ctx.fill();
                if (p2) { ctx.fillStyle = "rgba(255,50,0,0.3)"; ctx.fillRect(-7,-28,15,12); }
                ctx.restore();
            } else if (e.world === 2) {
                // w2 언데드 고블린 킹 — 검정 피부 + 빨간 눈
                const b = eBob;
                ctx.fillStyle = "#0e0e12";
                ctx.fillRect(-8, 10+b, 6, 7+Math.abs(legL)); ctx.fillRect(3, 10+b, 6, 7+Math.abs(legR));
                ctx.fillStyle = "#080810";
                ctx.fillRect(-9, 17+b, 7, 3); ctx.fillRect(3, 17+b, 7, 3);
                ctx.fillStyle = "#141418"; ctx.fillRect(-12, -4+b, 24, 16);
                ctx.fillStyle = "#1e1e28"; ctx.fillRect(-11, -3+b, 22, 12);
                ctx.fillStyle = "#2a2a38"; ctx.fillRect(-10, -3+b, 22, 3);
                ctx.strokeStyle = "#550010"; ctx.lineWidth = 1;
                ctx.strokeRect(-10, -2+b, 20, 10);
                ctx.fillStyle = "rgba(180,0,20,0.40)"; ctx.fillRect(-2, 0+b, 4, 6);
                ctx.fillStyle = "#0e0e12";
                ctx.fillRect(-18, -3+b, 7, 12); ctx.fillRect(12, -3+b, 7, 12);
                ctx.fillStyle = "#1e1e28";
                ctx.beginPath(); ctx.moveTo(-18,-3+b); ctx.lineTo(-23,-11+b); ctx.lineTo(-13,-3+b); ctx.fill();
                ctx.beginPath(); ctx.moveTo(19,-3+b); ctx.lineTo(24,-11+b); ctx.lineTo(14,-3+b); ctx.fill();
                ctx.fillStyle = "#141418"; ctx.fillRect(-4, -10+b, 8, 8);
                ctx.fillStyle = "#141418"; ctx.fillRect(-10, -24+b, 20, 16);
                ctx.fillStyle = "#1e1e28"; ctx.fillRect(-11, -26+b, 22, 6);
                ctx.fillStyle = "#2a2a38"; ctx.fillRect(-11, -26+b, 22, 2);
                ctx.fillStyle = "#1a1a22";
                ctx.beginPath(); ctx.moveTo(-8,-26+b); ctx.lineTo(-14,-40+b); ctx.lineTo(-3,-26+b); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,-26+b); ctx.lineTo(14,-40+b); ctx.lineTo(3,-26+b); ctx.fill();
                ctx.shadowBlur = p2 ? 14 : 8; ctx.shadowColor = "#ff2200";
                ctx.fillStyle = p2 ? "#ff6600" : "#ff2200";
                ctx.fillRect(-8,-20+b, 5, 3); ctx.fillRect(4,-20+b, 5, 3);
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#aaaaaa";
                ctx.fillRect(-6,-9+b, 3, 4); ctx.fillRect(-1,-8+b, 3, 4); ctx.fillRect(4,-9+b, 3, 4);
                ctx.save(); ctx.translate(16, 2+b); ctx.rotate(wRot + 0.3);
                ctx.fillStyle = "#2a1a08"; ctx.fillRect(-2, -20, 5, 24);
                ctx.fillStyle = "#4a3010"; ctx.fillRect(-1, -19, 2, 22);
                ctx.fillStyle = "#555560"; ctx.fillRect(-4, -3, 9, 3);
                ctx.fillStyle = "#333340"; ctx.fillRect(-7, -28, 15, 12);
                ctx.fillStyle = "#444450"; ctx.fillRect(-5, -27, 11, 10);
                ctx.fillStyle = "#333340";
                ctx.beginPath(); ctx.moveTo(-7,-24); ctx.lineTo(-13,-22); ctx.lineTo(-7,-20); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,-24); ctx.lineTo(14,-22); ctx.lineTo(8,-20); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(1,-35); ctx.lineTo(2,-28); ctx.fill();
                ctx.beginPath(); ctx.moveTo(0,-17); ctx.lineTo(1,-12); ctx.lineTo(2,-17); ctx.fill();
                if (p2) { ctx.shadowBlur = 8; ctx.shadowColor = "#ff2200"; ctx.fillStyle = "rgba(255,30,0,0.35)"; ctx.fillRect(-7,-28,15,12); ctx.shadowBlur = 0; }
                ctx.restore();
            } else if (e.world <= 4) {
                // 언데드 기사 — 뼈 갑옷, 어두운 검
                const b = eBob;
                // 다리 (갑옷 정강이)
                ctx.fillStyle = "#2a2a32";
                ctx.fillRect(-9, 10+b, 7, 8+Math.abs(legL)); ctx.fillRect(3, 10+b, 7, 8+Math.abs(legR));
                ctx.fillStyle = "#1a1a22";
                ctx.fillRect(-10, 18+b, 8, 3); ctx.fillRect(3, 18+b, 8, 3);
                // 몸통 갑옷
                ctx.fillStyle = "#252530"; ctx.fillRect(-13, -5+b, 26, 17);
                ctx.fillStyle = "#1a1a25"; ctx.fillRect(-12, -4+b, 24, 3);
                ctx.strokeStyle = "#3a3a4a"; ctx.lineWidth = 1;
                ctx.strokeRect(-12, -4+b, 24, 14);
                ctx.beginPath(); ctx.moveTo(0,-4+b); ctx.lineTo(0,10+b); ctx.stroke();
                // 뼈 갈비뼈 무늬
                ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = 1;
                for (let ri=0; ri<3; ri++) {
                    ctx.beginPath(); ctx.moveTo(-10, -1+ri*4+b); ctx.lineTo(-14, ri*4+b); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(10, -1+ri*4+b); ctx.lineTo(14, ri*4+b); ctx.stroke();
                }
                // 어깨 갑옷
                ctx.fillStyle = "#2a2a35";
                ctx.fillRect(-18, -5+b, 6, 10); ctx.fillRect(13, -5+b, 6, 10);
                // 팔
                ctx.fillStyle = "#222230";
                ctx.fillRect(-17, 5+b, 5, 8); ctx.fillRect(13, 5+b, 5, 8);
                // 목
                ctx.fillStyle = "#c8c4b8"; ctx.fillRect(-4, -12+b, 8, 9);
                // 해골 머리
                ctx.fillStyle = "#d8d4c8";
                ctx.beginPath(); ctx.arc(0, -22+b, 11, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "#c0bcb0"; ctx.fillRect(-11, -16+b, 4, 5); ctx.fillRect(7, -16+b, 4, 5);
                // 눈구멍 — p2 또는 파괴된 스테이지(짝수월드)면 빨간 눈
                const _skEyeRed = p2 || _isDest;
                ctx.fillStyle = _skEyeRed ? "#ff2200" : "#000";
                ctx.shadowBlur = _skEyeRed ? 10 : 0; ctx.shadowColor = "#ff0000";
                ctx.beginPath(); ctx.ellipse(-5, -24+b, 3, 4, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(5, -24+b, 3, 4, 0, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
                // 코 구멍
                ctx.fillStyle = "#888"; ctx.fillRect(-1,-19+b,2,3); ctx.fillRect(1,-19+b,2,3);
                // 이빨
                ctx.fillStyle = "#d8d4c8"; ctx.fillRect(-7,-12+b,14,3);
                ctx.fillStyle = "#1a1a1a"; for(let i=0;i<4;i++) ctx.fillRect(-5+i*3,-12+b,1,3);
                // 투구 (해골 헬멧)
                ctx.fillStyle = "#1e1e28"; ctx.fillRect(-12, -28+b, 24, 8);
                ctx.fillStyle = "#2a2a34"; ctx.fillRect(-11, -30+b, 22, 5);
                // 투구 볏
                ctx.fillStyle = "#550022";
                for(let i=0;i<5;i++) ctx.fillRect(-8+i*4,-32+b,3,4);
                // 처형용 대검 (언데드 기사)
                ctx.save(); ctx.translate(15, 2+b); ctx.rotate(wRot + 0.2);
                // 두꺼운 칼날
                ctx.fillStyle = "#0d0d18"; ctx.fillRect(-3, -30, 7, 34);
                ctx.fillStyle = "#1a1a28"; ctx.fillRect(-4, -30, 3, 32); // 두꺼운 등
                ctx.fillStyle = "#cc0020"; ctx.fillRect(-1, -30, 2, 28); // 핏빛 홈
                ctx.fillStyle = "#4a4a60"; ctx.fillRect(0, -30, 2, 28);  // 날 하이라이트
                // 칼끝
                ctx.beginPath(); ctx.moveTo(-3,-30); ctx.lineTo(0,-38); ctx.lineTo(4,-30); ctx.fill();
                ctx.fillStyle = "#cc0020"; ctx.beginPath(); ctx.moveTo(-1,-30); ctx.lineTo(0,-35); ctx.lineTo(2,-30); ctx.fill();
                // 넓은 크로스가드
                ctx.fillStyle = "#333344"; ctx.fillRect(-10, 2, 21, 5);
                ctx.fillStyle = "#4a4a60"; ctx.fillRect(-9, 3, 19, 3);
                // 손잡이
                ctx.fillStyle = "#1a1a22"; ctx.fillRect(-2, 7, 5, 9);
                ctx.fillStyle = "#880010"; ctx.fillRect(-1, 8, 2, 7); // 핏빛 감싸기
                // p2: 칼날에서 어둠의 에너지
                if (p2) { ctx.shadowBlur = 8; ctx.shadowColor = "#ff0033"; ctx.fillStyle = "rgba(180,0,40,0.4)"; ctx.fillRect(-3,-30,7,34); ctx.shadowBlur = 0; }
                ctx.restore();
            } else if (e.world <= 6) { 
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
                
                // 핵 - 보라빛 소용돌이 (w6=파괴된 더스크: 붉은 핵)
                const _orcRed = e.world === 6 || p2;
                const coreColor = _orcRed ? "#ff2200" : "#aa00ff";
                const coreGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
                coreGrd.addColorStop(0, _orcRed ? "#ff9977" : "#ff88ff");
                coreGrd.addColorStop(0.4, coreColor);
                coreGrd.addColorStop(1, "rgba(60,0,80,0)");
                ctx.shadowBlur = (p2 || e.world === 6) ? 40 : 25;
                ctx.shadowColor = coreColor;
                ctx.fillStyle = coreGrd;
                ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;

                // 핵 중심 눈 (세로 동공) — w6: 핏빛 홍채
                ctx.fillStyle = _orcRed ? "#ff4422" : "#eeddff";
                ctx.beginPath(); ctx.ellipse(0, 0, 6, 16, rot*2, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = _orcRed ? "#220000" : "#000";
                ctx.beginPath(); ctx.ellipse(0, 0, 2, 14, rot*2, 0, Math.PI*2); ctx.fill();
                
                ctx.restore();
            } else if (e.world <= 9) { 
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
                // ── 마왕 (Demon Lord) — 거대 인간형 악마왕 ──
                const t = frameNow;
                const bob   = Math.sin(t * 0.0015) * 4;
                const pulse = (Math.sin(t * 0.0022) + 1) / 2;
                const wingB = Math.sin(t * 0.002) * 5;
                const rage  = e.hp < e.maxHp * 0.2; // 광란 상태 (HP 20% 미만)

                ctx.save();
                ctx.translate(0, bob);

                // 1) 어둠 오라
                {
                    const auraR = 105 + pulse * 8;
                    const auraGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, auraR);
                    auraGrd.addColorStop(0, rage ? "rgba(255,40,0,0.32)" : (p2 ? "rgba(200,0,0,0.24)" : "rgba(90,0,130,0.26)"));
                    auraGrd.addColorStop(0.55, rage ? "rgba(160,0,0,0.10)" : (p2 ? "rgba(100,0,0,0.08)" : "rgba(40,0,70,0.10)"));
                    auraGrd.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = auraGrd;
                    ctx.beginPath(); ctx.arc(0, 0, auraR, 0, Math.PI*2); ctx.fill();
                    // 오라 바깥 링 (얇은 경계)
                    ctx.globalAlpha = 0.12 + pulse * 0.10;
                    ctx.strokeStyle = rage ? "#ff2200" : (p2 ? "#aa0000" : "#9900cc");
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(0, 0, auraR * 0.88, 0, Math.PI*2); ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                // 2) 날개 (몸통 뒤)
                {
                    const wc = rage ? "#3a0000" : (p2 ? "#220000" : "#18002e");
                    const we = rage ? "#ff3300" : (p2 ? "#aa0000" : "#7700cc");
                    ctx.fillStyle = wc;
                    ctx.shadowBlur = 12; ctx.shadowColor = we;
                    // 왼쪽 날개
                    ctx.beginPath();
                    ctx.moveTo(-18, -28);
                    ctx.bezierCurveTo(-44 + wingB, -68, -86, -52, -78 + wingB * 0.5, 10);
                    ctx.bezierCurveTo(-60, 24, -30, 14, -18, 2);
                    ctx.closePath(); ctx.fill();
                    // 오른쪽 날개
                    ctx.beginPath();
                    ctx.moveTo(18, -28);
                    ctx.bezierCurveTo(44 - wingB, -68, 86, -52, 78 - wingB * 0.5, 10);
                    ctx.bezierCurveTo(60, 24, 30, 14, 18, 2);
                    ctx.closePath(); ctx.fill();
                    // 날개 뼈대
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = we; ctx.lineWidth = 1; ctx.globalAlpha = 0.55;
                    for (let wi = 0; wi < 3; wi++) {
                        const wx = 20 + wi * 18, wy = -26 + wi * 6;
                        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(70 - wi * 8, -42 + wi * 22); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(-wx, wy); ctx.lineTo(-70 + wi * 8, -42 + wi * 22); ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                }

                // 3) 로브 하단
                {
                    ctx.fillStyle = rage ? "#200000" : (p2 ? "#180000" : "#0e001c");
                    ctx.beginPath();
                    ctx.moveTo(-22, 4);
                    ctx.bezierCurveTo(-34, 28, -42, 52, -30, 63);
                    ctx.lineTo(30, 63);
                    ctx.bezierCurveTo(42, 52, 34, 28, 22, 4);
                    ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = p2 ? "#550000" : "#2c0052"; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
                    ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(-18, 62); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, 62); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(8, 5); ctx.lineTo(18, 62); ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                // 4) 몸통 + 갑옷
                {
                    ctx.fillStyle = rage ? "#2c0000" : (p2 ? "#280000" : "#140022");
                    ctx.fillRect(-20, -42, 40, 46);
                    ctx.fillStyle = rage ? "#480000" : (p2 ? "#420000" : "#22003a");
                    ctx.fillRect(-16, -40, 32, 38);
                    // 어깨 패드
                    ctx.fillStyle = rage ? "#3c0000" : (p2 ? "#360000" : "#1c002e");
                    ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(-33, -34); ctx.lineTo(-30, -20); ctx.lineTo(-20, -19); ctx.closePath(); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(20, -40); ctx.lineTo(33, -34); ctx.lineTo(30, -20); ctx.lineTo(20, -19); ctx.closePath(); ctx.fill();
                    // 어깨 스파이크
                    ctx.fillStyle = rage ? "#aa0000" : (p2 ? "#880000" : "#6600aa");
                    ctx.beginPath(); ctx.moveTo(-24, -36); ctx.lineTo(-34, -52); ctx.lineTo(-19, -36); ctx.closePath(); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(24, -36); ctx.lineTo(34, -52); ctx.lineTo(19, -36); ctx.closePath(); ctx.fill();
                    // 가슴 룬 문양
                    ctx.fillStyle = rage ? "#ff2200" : (p2 ? "#cc0000" : "#9900cc");
                    ctx.shadowBlur = 6 + pulse * 5; ctx.shadowColor = ctx.fillStyle;
                    ctx.fillRect(-2, -36, 4, 28);
                    ctx.fillRect(-10, -26, 20, 4);
                    ctx.shadowBlur = 0;
                }

                // 5) 부유하는 어둠 오브 — 팔 없음, 마왕의 의지로 공중에 떠있는 어둠 에너지
                {
                    const orbDrift  = Math.sin(t * 0.0018) * 7;
                    const orbP1 = (Math.sin(t * 0.003) + 1) / 2;
                    const orbP2 = (Math.sin(t * 0.003 + 1.6) + 1) / 2;
                    const orbCol1 = rage ? "#ff3300" : (p2 ? "#ee1100" : "#bb00ff");
                    const orbCol2 = rage ? "#ff4400" : (p2 ? "#dd2200" : "#cc00ff");

                    // 왼쪽 오브
                    const lx = -40, ly = -6 + orbDrift;
                    ctx.fillStyle = rage ? "#300000" : (p2 ? "#280000" : "#1a0030");
                    ctx.beginPath(); ctx.arc(lx, ly, 10, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = orbCol1;
                    ctx.shadowBlur = 18 + orbP1 * 12; ctx.shadowColor = orbCol1;
                    ctx.beginPath(); ctx.arc(lx, ly, 5.5 + orbP1 * 2.5, 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 0;

                    // 오른쪽 오브 (위상 반전)
                    const rx = 40, ry = -6 - orbDrift;
                    ctx.fillStyle = rage ? "#300000" : (p2 ? "#280000" : "#1a0030");
                    ctx.beginPath(); ctx.arc(rx, ry, 10, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = orbCol2;
                    ctx.shadowBlur = 16 + orbP2 * 10; ctx.shadowColor = orbCol2;
                    ctx.beginPath(); ctx.arc(rx, ry, 5.5 + orbP2 * 2.5, 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 0;

                    // 오브↔몸통 에너지 실
                    ctx.globalAlpha = 0.28 + orbP1 * 0.18;
                    ctx.strokeStyle = rage ? "#ff2200" : (p2 ? "#bb1100" : "#8800cc");
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 5]);
                    ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(lx + 10, ly); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(20, -12); ctx.lineTo(rx - 10, ry); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.globalAlpha = 1;
                }

                // 6) 목 + 머리
                {
                    ctx.fillStyle = rage ? "#220000" : (p2 ? "#1e0000" : "#100020");
                    ctx.fillRect(-6, -50, 12, 9);
                    ctx.fillStyle = rage ? "#2e0000" : (p2 ? "#280000" : "#160026");
                    ctx.fillRect(-13, -70, 26, 22);
                    ctx.fillStyle = rage ? "#3e0000" : (p2 ? "#380000" : "#1e0032");
                    ctx.fillRect(-11, -68, 22, 8);
                    // 눈 — 원형 대신 어둠 속 빛나는 균열 형태
                    const eyeGlow = 14 + pulse * 10;
                    const eyeCol  = rage ? "#ff6600" : (p2 ? "#ff1100" : "#cc0000");
                    ctx.shadowBlur = eyeGlow; ctx.shadowColor = eyeCol;
                    // 좌눈 균열 (가로 슬릿)
                    ctx.fillStyle = eyeCol;
                    ctx.fillRect(-7, -62, 5, 2);
                    ctx.fillRect(-6, -61, 3, 1);
                    // 우눈 균열
                    ctx.fillRect(2, -62, 5, 2);
                    ctx.fillRect(3, -61, 3, 1);
                    // 눈 주변 어둠 오버레이 (눈두덩)
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = `rgba(0,0,0,${0.35 + pulse * 0.15})`;
                    ctx.fillRect(-10, -65, 8, 6);
                    ctx.fillRect(2, -65, 8, 6);
                }

                // 7) 왕관 (크고 위엄있게)
                {
                    const gc = rage ? "#aa0000" : (p2 ? "#880000" : "#4a0088");
                    const gg = rage ? "#ff6600" : (p2 ? "#ff2200" : "#dd00ff");
                    ctx.fillStyle = gc;
                    ctx.fillRect(-15, -71, 30, 5);
                    const cSpikes = [[-13, 12], [-7, 17], [0, 22], [7, 17], [13, 12]];
                    cSpikes.forEach(([sx, sh]) => {
                        ctx.beginPath();
                        ctx.moveTo(sx - 3, -71); ctx.lineTo(sx, -71 - sh); ctx.lineTo(sx + 3, -71);
                        ctx.closePath(); ctx.fill();
                    });
                    ctx.fillStyle = gg;
                    ctx.shadowBlur = 12 + pulse * 8; ctx.shadowColor = gg;
                    ctx.beginPath(); ctx.arc(0, -74, 3.5, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                }

                // 8) P2 뿔 (악마 변신)
                if (p2 || rage) {
                    const hornCol = rage ? "#cc2200" : "#770000";
                    ctx.fillStyle = hornCol;
                    ctx.shadowBlur = rage ? 10 : 6; ctx.shadowColor = "#ff0000";
                    ctx.beginPath(); ctx.moveTo(-10, -69); ctx.lineTo(-22, -88); ctx.lineTo(-5, -69); ctx.closePath(); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(10, -69); ctx.lineTo(22, -88); ctx.lineTo(5, -69); ctx.closePath(); ctx.fill();
                    ctx.shadowBlur = 0;
                }

                // 9) 광란 상태: 붉은 균열 효과
                if (rage) {
                    ctx.strokeStyle = `rgba(255,80,0,${0.4 + pulse * 0.4})`;
                    ctx.lineWidth = 1;
                    [[-12,-35,-4,-10],[5,-30,14,-5],[-2,-18,6,2]].forEach(([x1,y1,x2,y2]) => {
                        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                    });
                }

                ctx.restore();

            } // 마왕 블록 종료

            // ── W5+ 보스 공격 발동 임팩트 플래시 (원거리 공격 발동 시) ──
            if (e.atkAnim > 0 && e.world >= 5) {
                const prog = 1 - e.atkAnim / 20;
                const alpha = prog < 0.4 ? prog / 0.4 : (1 - prog) / 0.6;
                ctx.save();
                ctx.globalAlpha = alpha * 0.6;
                const fc = e.world >= 9 ? "#ff0000" : (e.world >= 7 ? "#0044ff" : "#aa00ff");
                ctx.shadowBlur = 20 * alpha; ctx.shadowColor = fc;
                ctx.strokeStyle = fc; ctx.lineWidth = 2;
                // 발동 링 이펙트
                const R2 = 18 + prog * 20;
                ctx.beginPath(); ctx.arc(12, -5, R2, 0, Math.PI*2); ctx.stroke();
                ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(12, -5, R2 * 0.6, 0, Math.PI*2); ctx.stroke();
                ctx.shadowBlur = 0; ctx.restore();
            }

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
                ctx.globalAlpha = 0.85;
            }
            
            let legL = e.fr === 0 ? 0 : -2, legR = e.fr === 0 ? -2 : 0;
            
            const eb = eBob;

            // ── 튜토리얼 더미 골렘 전용 렌더 ──
            if (e.isTutorialDummy) {
                // 회색 돌 골렘 — 땅에 고정, 다리/몸 흔들림 없음
                const gb = 0; // 골렘은 bob 없음 — 정확히 땅에 붙임
                // 몸통
                ctx.fillStyle = "#6a6a72"; ctx.fillRect(-14, -18+gb, 28, 24);
                ctx.fillStyle = "#555560"; ctx.fillRect(-14, -18+gb, 28, 4); // 어깨선
                ctx.fillStyle = "#78787f"; ctx.fillRect(-12, -14+gb, 24, 16); // 가슴 하이라이트
                // 머리
                ctx.fillStyle = "#6a6a72"; ctx.fillRect(-10, -32+gb, 20, 16);
                ctx.fillStyle = "#78787f"; ctx.fillRect(-8, -30+gb, 16, 10);
                // 눈 (빨간 점 — 마법 골렘 느낌)
                ctx.fillStyle = "#ff3300"; ctx.shadowBlur = 4; ctx.shadowColor = "#ff3300";
                ctx.fillRect(-6, -27+gb, 3, 3); ctx.fillRect(3, -27+gb, 3, 3);
                ctx.shadowBlur = 0;
                // 팔
                ctx.fillStyle = "#5a5a62";
                ctx.fillRect(-22, -16+gb, 9, 18); ctx.fillRect(13, -16+gb, 9, 18);
                // 다리 — 고정 (애니메이션 없음)
                ctx.fillRect(-10, 6+gb, 8, 8); ctx.fillRect(2, 6+gb, 8, 8);
                // DUMMY 라벨 — facing scale 역적용해서 텍스트 뒤집힘 방지
                ctx.save();
                ctx.scale(e.facing, 1); // facing=-1이면 다시 +1 방향으로 되돌림
                ctx.fillStyle = "#ffff88";
                ctx.shadowBlur = 6; ctx.shadowColor = "#ffcc00";
                ctx.font = "bold 12px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                ctx.fillText("훈련용 골렘", 0, -58+gb);
                ctx.shadowBlur = 0; ctx.textAlign = "left";
                ctx.restore();
                // 렌더 완료 — 아래 월드별 렌더 건너뜀 + 무기도 skip
            } else if (e.world <= 2) {
                // ── 고블린: 흉포한 전투 고블린 — 피 묻은 가죽갑옷, 돌출된 엄니, 찢긴 귀 ──
                // 망토 찢김
                ctx.fillStyle = "rgba(60,10,0,0.7)";
                ctx.beginPath(); ctx.moveTo(-5,-1+eb); ctx.lineTo(-10,8+eb); ctx.lineTo(-6,10+eb); ctx.lineTo(-8,18+eb); ctx.lineTo(-4,12+eb); ctx.fill();
                // 가죽 갑옷 (혈흔)
                ctx.fillStyle = "#3e2218"; ctx.fillRect(-7,-1+eb,14,12);
                ctx.fillStyle = "#2a1510"; ctx.fillRect(-7,-1+eb,14,3);
                ctx.strokeStyle = "#6a3820"; ctx.lineWidth = 1; ctx.strokeRect(-6,0+eb,12,10);
                // 혈흔
                ctx.fillStyle = "rgba(180,0,0,0.5)";
                ctx.fillRect(-4,1+eb,3,2); ctx.fillRect(0,4+eb,2,3); ctx.fillRect(3,2+eb,3,1);
                // 어깨 패드 (뼈 조각)
                ctx.fillStyle = "#c8b89e";
                ctx.beginPath(); ctx.moveTo(-7,-1+eb); ctx.lineTo(-10,-5+eb); ctx.lineTo(-5,-5+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(7,-1+eb); ctx.lineTo(10,-5+eb); ctx.lineTo(5,-5+eb); ctx.fill();
                // 팔 (근육질)
                ctx.fillStyle = "#2d6b22"; ctx.fillRect(-11,-1+eb,5,10); ctx.fillRect(7,-1+eb,5,10);
                // 다리 + 피 묻은 부츠
                ctx.fillStyle = "#2e5c22"; ctx.fillRect(-5,11+eb,4,5+legL); ctx.fillRect(2,11+eb,4,5+legR);
                ctx.fillStyle = "#1a0a00"; ctx.fillRect(-6,15+eb+legL,5,4); ctx.fillRect(2,15+eb+legR,5,4);
                // 찢긴 큰 귀
                ctx.fillStyle = "#2a6b28";
                ctx.beginPath(); ctx.moveTo(-7,-4+eb); ctx.lineTo(-13,-14+eb); ctx.lineTo(-10,-4+eb); ctx.fill(); // 왼쪽 귀 뾰족
                ctx.beginPath(); ctx.moveTo(7,-4+eb); ctx.lineTo(13,-14+eb); ctx.lineTo(10,-4+eb); ctx.fill(); // 오른쪽 귀
                // 귀 안쪽 (분홍)
                ctx.fillStyle = "#7a1a20";
                ctx.beginPath(); ctx.moveTo(-8,-5+eb); ctx.lineTo(-12,-12+eb); ctx.lineTo(-10,-5+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,-5+eb); ctx.lineTo(12,-12+eb); ctx.lineTo(10,-5+eb); ctx.fill();
                // 귀 찢긴 자국
                ctx.strokeStyle = "#1a4a18"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-11,-10+eb); ctx.lineTo(-9,-8+eb); ctx.stroke();
                // 머리 (울퉁불퉁한 두개골)
                ctx.fillStyle = "#1e6b1c"; ctx.fillRect(-6,-13+eb,12,13);
                ctx.fillStyle = "#288228"; ctx.fillRect(-7,-11+eb,14,5);
                // 이마 돌기 (뿔 초기)
                ctx.fillStyle = "#155015";
                ctx.beginPath(); ctx.moveTo(-4,-13+eb); ctx.lineTo(-3,-18+eb); ctx.lineTo(-1,-13+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(4,-13+eb); ctx.lineTo(3,-18+eb); ctx.lineTo(1,-13+eb); ctx.fill();
                // 눈 (혈안 — 노란 홍채 + 빨간 혈관)
                ctx.fillStyle = "#cc8800"; ctx.shadowBlur = 5; ctx.shadowColor = "#ff8800";
                ctx.fillRect(-5,-9+eb,4,4); ctx.fillRect(2,-9+eb,4,4);
                ctx.fillStyle = "#000"; ctx.fillRect(-4,-8+eb,2,3); ctx.fillRect(3,-8+eb,2,3);
                // 혈관
                ctx.strokeStyle = "rgba(200,0,0,0.6)"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-5,-7+eb); ctx.lineTo(-3,-7+eb); ctx.stroke();
                ctx.shadowBlur = 0;
                // 코 구멍
                ctx.fillStyle = "#0a2a08"; ctx.fillRect(-2,-4+eb,2,2); ctx.fillRect(1,-4+eb,2,2);
                // 엄니 (위아래)
                ctx.fillStyle = "#e8e0a0";
                ctx.beginPath(); ctx.moveTo(-5,-1+eb); ctx.lineTo(-4,-5+eb); ctx.lineTo(-2,-1+eb); ctx.fill(); // 왼쪽 엄니
                ctx.beginPath(); ctx.moveTo(2,-1+eb); ctx.lineTo(3,-5+eb); ctx.lineTo(5,-1+eb); ctx.fill(); // 오른쪽 엄니
                // 피 묻은 엄니
                ctx.fillStyle = "rgba(180,0,0,0.4)"; ctx.fillRect(-5,-2+eb,2,2); ctx.fillRect(3,-2+eb,2,2);

            } else if (e.world <= 4) {
                // ── 언데드 해골 전사: 부서진 뼈, 썩은 살점, 빛나는 마안 ──
                // 로브 찢김 (흑색)
                ctx.fillStyle = "rgba(10,0,0,0.85)";
                ctx.beginPath(); ctx.moveTo(-5,0+eb); ctx.lineTo(-9,10+eb); ctx.lineTo(-4,8+eb); ctx.lineTo(-7,18+eb); ctx.lineTo(-2,11+eb); ctx.fill();
                // 갈빗대 몸통 (뼈 노출)
                ctx.fillStyle = "#b8b4a8"; ctx.fillRect(-5,-1+eb,10,12);
                // 갈비뼈 라인
                ctx.strokeStyle = "#888480"; ctx.lineWidth = 1.5;
                for (let ri=0; ri<4; ri++) {
                    ctx.beginPath(); ctx.moveTo(-4,1+ri*2.5+eb); ctx.bezierCurveTo(-8,2+ri*2.5+eb,-9,3+ri*2.5+eb,-8,4+ri*2.5+eb); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(4,1+ri*2.5+eb); ctx.bezierCurveTo(8,2+ri*2.5+eb,9,3+ri*2.5+eb,8,4+ri*2.5+eb); ctx.stroke();
                }
                // 척추
                ctx.fillStyle = "#ccc8be"; ctx.fillRect(-1,0+eb,2,12);
                for (let si=0;si<4;si++) { ctx.fillStyle = "#aaa49a"; ctx.fillRect(-2,1+si*3+eb,4,2); }
                // 팔 (뼈)
                ctx.fillStyle = "#c0bcb0"; ctx.fillRect(-11,-1+eb,5,11); ctx.fillRect(7,-1+eb,5,11);
                ctx.fillStyle = "#aaa49a"; ctx.fillRect(-10,3+eb,3,2); ctx.fillRect(8,3+eb,3,2); // 팔꿈치 관절
                // 다리 (뼈)
                ctx.fillStyle = "#b8b4a8"; ctx.fillRect(-5,11+eb,4,7+legL); ctx.fillRect(2,11+eb,4,7+legR);
                ctx.fillStyle = "#9a9690"; ctx.fillRect(-6,17+eb+legL,5,3); ctx.fillRect(2,17+eb+legR,5,3);
                // 해골 머리 (불규칙 균열)
                ctx.fillStyle = "#d8d4c8";
                ctx.beginPath();
                ctx.moveTo(-8,-1+eb); ctx.lineTo(-9,-8+eb); ctx.lineTo(-7,-16+eb); ctx.lineTo(0,-18+eb);
                ctx.lineTo(7,-16+eb); ctx.lineTo(9,-8+eb); ctx.lineTo(8,-1+eb); ctx.closePath(); ctx.fill();
                // 균열
                ctx.strokeStyle = "#888480"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-3,-12+eb); ctx.lineTo(0,-8+eb); ctx.lineTo(2,-14+eb); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-6,-6+eb); ctx.lineTo(-4,-4+eb); ctx.stroke();
                // 광대뼈 돌출
                ctx.fillStyle = "#c0bcb0"; ctx.fillRect(-10,-8+eb,3,4); ctx.fillRect(7,-8+eb,3,4);
                // 마안 (빈 안와에 어둠의 불꽃)
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.ellipse(-4,-10+eb,3.5,4.5,0,0,Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(4,-10+eb,3.5,4.5,0,0,Math.PI*2); ctx.fill();
                const eyeC = e.isElite ? "#ff4400" : "#1a00ff";
                ctx.fillStyle = eyeC; ctx.shadowBlur = 8; ctx.shadowColor = eyeC;
                ctx.beginPath(); ctx.ellipse(-4,-10+eb,2,3,0,0,Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(4,-10+eb,2,3,0,0,Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
                // 코 구멍 (삼각형 뼈)
                ctx.fillStyle = "#1a1a1a"; ctx.fillRect(-1,-4+eb,2,3);
                // 이빨 (들쭉날쭉)
                ctx.fillStyle = "#e8e4d8"; ctx.fillRect(-7,-1+eb,14,3);
                ctx.fillStyle = "#0a0a0a";
                for (let ti=0;ti<5;ti++) ctx.fillRect(-6+ti*3,-1+eb,1,3);
                // 부서진 이빨
                ctx.fillStyle = "#e8e4d8"; ctx.beginPath(); ctx.moveTo(-2,-1+eb); ctx.lineTo(-1,2+eb); ctx.lineTo(0,-1+eb); ctx.fill();

            } else if (e.world <= 6) {
                // ── 어둠의 기사: 저주받은 흑철 갑옷, 피 흘리는 눈 틈, 뿔 투구 ──
                // 망토 (피 같은 짙은 붉은)
                ctx.fillStyle = "rgba(80,0,20,0.75)";
                ctx.beginPath(); ctx.moveTo(-6,-2+eb); ctx.bezierCurveTo(-14,4+eb,-13+legL*0.5,12+eb,-11+legL*0.3,20+eb); ctx.lineTo(-5,18+eb); ctx.lineTo(-4,11+eb); ctx.fill();
                // 다리 갑옷
                ctx.fillStyle = "#0a0a12"; ctx.fillRect(-7,11+eb,5,9+legL); ctx.fillRect(3,11+eb,5,9+legR);
                // 무릎 가시
                ctx.fillStyle = "#181820";
                ctx.beginPath(); ctx.moveTo(-8,14+eb); ctx.lineTo(-11,12+eb); ctx.lineTo(-8,11+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,14+eb); ctx.lineTo(11,12+eb); ctx.lineTo(8,11+eb); ctx.fill();
                ctx.fillStyle = "#060608"; ctx.fillRect(-8,19+eb+legL,6,4); ctx.fillRect(3,19+eb+legR,6,4);
                // 발 가시돌기
                ctx.fillStyle = "#0a0a14";
                ctx.beginPath(); ctx.moveTo(-8,22+eb+legL); ctx.lineTo(-11,20+eb+legL); ctx.lineTo(-8,20+eb+legL); ctx.fill();
                // 몸통 갑옷 (저주 룬 새김)
                ctx.fillStyle = "#0c0c15"; ctx.fillRect(-8,-4+eb,16,17);
                ctx.fillStyle = "#181825"; ctx.fillRect(-7,-3+eb,14,4); // 어깨선
                ctx.strokeStyle = "#2a1a00"; ctx.lineWidth = 1;
                ctx.strokeRect(-7,-3+eb,14,15);
                ctx.beginPath(); ctx.moveTo(0,-4+eb); ctx.lineTo(0,13+eb); ctx.stroke(); // 중앙선
                // 룬 (가슴 문양)
                ctx.strokeStyle = "#330000"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-3,2+eb); ctx.lineTo(0,-1+eb); ctx.lineTo(3,2+eb); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-3,5+eb); ctx.lineTo(3,5+eb); ctx.stroke();
                // 어깨 가시
                ctx.fillStyle = "#0c0c15";
                ctx.beginPath(); ctx.moveTo(-8,-4+eb); ctx.lineTo(-13,-8+eb); ctx.lineTo(-8,2+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,-4+eb); ctx.lineTo(13,-8+eb); ctx.lineTo(8,2+eb); ctx.fill();
                ctx.fillStyle = "#1a1a20"; ctx.fillRect(-13,-8+eb,2,4); ctx.fillRect(12,-8+eb,2,4);
                // 팔 갑옷
                ctx.fillStyle = "#0c0c15"; ctx.fillRect(-13,-3+eb,6,13); ctx.fillRect(8,-3+eb,6,13);
                ctx.fillStyle = "#181820"; ctx.fillRect(-12,1+eb,4,4); ctx.fillRect(9,1+eb,4,4); // 팔꿈치
                // 투구 (뿔 2개 + 면갑)
                ctx.fillStyle = "#0a0a14"; ctx.fillRect(-8,-17+eb,16,14);
                ctx.fillStyle = "#151520"; ctx.fillRect(-9,-10+eb,18,6); // 면갑
                // 뿔 (비틀린)
                ctx.fillStyle = "#080810";
                ctx.beginPath(); ctx.moveTo(-6,-17+eb); ctx.bezierCurveTo(-10,-24+eb,-14,-20+eb,-12,-14+eb); ctx.lineTo(-8,-17+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(6,-17+eb); ctx.bezierCurveTo(10,-24+eb,14,-20+eb,12,-14+eb); ctx.lineTo(8,-17+eb); ctx.fill();
                // 뿔 끝 (뼈색)
                ctx.fillStyle = "#c8b090"; ctx.fillRect(-13,-21+eb,2,4); ctx.fillRect(12,-21+eb,2,4);
                // 눈 틈 (피 흐르는 붉은 광채)
                ctx.fillStyle = "#cc0022"; ctx.shadowBlur = 10; ctx.shadowColor = "#ff0033";
                ctx.fillRect(-6,-11+eb,5,3); ctx.fillRect(2,-11+eb,5,3);
                // 피 (흘러내림)
                ctx.shadowBlur = 0;
                ctx.fillStyle = "rgba(180,0,20,0.75)";
                ctx.fillRect(-4,-8+eb,1,5); ctx.fillRect(4,-8+eb,1,5);

            } else if (e.world <= 8) {
                // ── 마족 병사: 두 개의 뿔, 가죽 검은 피부, 마법 인장, 날카로운 발톱 ──
                // 로브/망토 (심연색)
                ctx.fillStyle = "#0d000d";
                ctx.beginPath(); ctx.moveTo(-7,-1+eb); ctx.bezierCurveTo(-14,5+eb,-12+legL*0.4,14+eb,-10,20+eb); ctx.lineTo(-4,18+eb); ctx.lineTo(-5,11+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(7,-1+eb); ctx.bezierCurveTo(14,5+eb,12-legR*0.4,14+eb,10,20+eb); ctx.lineTo(4,18+eb); ctx.lineTo(5,11+eb); ctx.fill();
                // 다리
                ctx.fillStyle = "#120010"; ctx.fillRect(-6,11+eb,5,7+legL); ctx.fillRect(2,11+eb,5,7+legR);
                // 발 (날카로운 발톱)
                ctx.fillStyle = "#0a0008"; ctx.fillRect(-7,17+eb+legL,6,4); ctx.fillRect(2,17+eb+legR,6,4);
                ctx.fillStyle = "#cc0088";
                ctx.beginPath(); ctx.moveTo(-7,21+eb+legL); ctx.lineTo(-9,18+eb+legL); ctx.lineTo(-6,19+eb+legL); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,21+eb+legR); ctx.lineTo(10,18+eb+legR); ctx.lineTo(7,19+eb+legR); ctx.fill();
                // 몸통 (인장 새긴 흑색 피부)
                ctx.fillStyle = "#0d000f"; ctx.fillRect(-7,-2+eb,14,14);
                // 마법 인장 (마나 문양)
                ctx.strokeStyle = "#440055"; ctx.lineWidth = 1;
                const cx0=0, cy0=5+eb;
                ctx.beginPath(); ctx.arc(cx0,cy0,5,0,Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx0-5,cy0); ctx.lineTo(cx0+5,cy0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx0,cy0-5); ctx.lineTo(cx0,cy0+5); ctx.stroke();
                // 팔 (뿔+발톱 달린)
                ctx.fillStyle = "#0d000f"; ctx.fillRect(-12,-2+eb,5,13); ctx.fillRect(8,-2+eb,5,13);
                // 손 발톱
                ctx.fillStyle = "#880066";
                ctx.beginPath(); ctx.moveTo(-12,10+eb); ctx.lineTo(-15,8+eb); ctx.lineTo(-11,8+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(12,10+eb); ctx.lineTo(15,8+eb); ctx.lineTo(11,8+eb); ctx.fill();
                // 머리 (뿔 2개 달린 마족 두개골)
                ctx.fillStyle = "#160010"; ctx.fillRect(-7,-16+eb,14,15);
                // 뿔 (비틀린 굽은 뿔)
                ctx.fillStyle = "#220022";
                ctx.beginPath(); ctx.moveTo(-4,-16+eb); ctx.bezierCurveTo(-7,-22+eb,-10,-20+eb,-8,-14+eb); ctx.lineTo(-5,-16+eb); ctx.fill();
                ctx.beginPath(); ctx.moveTo(4,-16+eb); ctx.bezierCurveTo(7,-22+eb,10,-20+eb,8,-14+eb); ctx.lineTo(5,-16+eb); ctx.fill();
                // 뿔 끝 (섬뜩한 보라)
                ctx.fillStyle = "#aa00cc"; ctx.shadowBlur = 5; ctx.shadowColor = "#cc00ff";
                ctx.fillRect(-9,-22+eb,2,3); ctx.fillRect(8,-22+eb,2,3);
                ctx.shadowBlur = 0;
                // 얼굴 (밤색 피부)
                ctx.fillStyle = "#1e0018"; ctx.fillRect(-6,-15+eb,12,12);
                // 눈 (심연 보라, 날카로운)
                ctx.fillStyle = "#ff00ff"; ctx.shadowBlur = 7; ctx.shadowColor = "#cc00ff";
                ctx.beginPath(); ctx.moveTo(-6,-10+eb); ctx.lineTo(-3,-7+eb); ctx.lineTo(0,-10+eb); ctx.fill(); // 삼각형 눈 좌
                ctx.beginPath(); ctx.moveTo(6,-10+eb); ctx.lineTo(3,-7+eb); ctx.lineTo(0,-10+eb); ctx.fill(); // 삼각형 눈 우 (합쳐진 형태)
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#000"; ctx.fillRect(-4,-9+eb,2,2); ctx.fillRect(3,-9+eb,2,2); // 동공
                // 입 (과도하게 찢긴)
                ctx.fillStyle = "#550028"; ctx.fillRect(-6,-4+eb,12,3);
                ctx.fillStyle = "#e8c0d8"; // 이빨
                for (let ti=0;ti<5;ti++) { ctx.fillRect(-5+ti*2,-4+eb,1,3); }
                // 턱에서 흐르는 붉은 액체
                ctx.fillStyle = "rgba(200,0,80,0.7)";
                ctx.fillRect(-3,-1+eb,2,4); ctx.fillRect(2,-1+eb,1,3);

            } else {
                // ── w9~10 심연의 괴물: 녹아든 형체, 다수 비틀린 눈, 촉수 ──
                const t9 = frameNow * 0.001;
                // 본체 (끊임없이 맥동하는 덩어리)
                ctx.fillStyle = "#100005";
                ctx.beginPath();
                ctx.moveTo(-7,-2+eb);
                ctx.bezierCurveTo(-10,-8+eb,-9,-14+eb,-5,-17+eb);
                ctx.bezierCurveTo(-2,-20+eb,2,-20+eb,5,-17+eb);
                ctx.bezierCurveTo(9,-14+eb,10,-8+eb,7,-2+eb);
                ctx.bezierCurveTo(9,5+eb,8,13+eb,5,14+eb);
                ctx.bezierCurveTo(2,15+eb,-2,15+eb,-5,14+eb);
                ctx.bezierCurveTo(-8,13+eb,-9,5+eb,-7,-2+eb);
                ctx.fill();
                // 근육/혈관 무늬
                ctx.strokeStyle = "#330008"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-3,-12+eb); ctx.bezierCurveTo(-5,-5+eb,-4,5+eb,-2,12+eb); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(3,-10+eb); ctx.bezierCurveTo(4,-3+eb,3,6+eb,2,12+eb); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-6,2+eb); ctx.bezierCurveTo(0,0+eb,6,3+eb,7,6+eb); ctx.stroke();
                // 촉수 다리 (4개, 흐느적거림)
                ctx.strokeStyle = "#1a0008"; ctx.lineWidth = 3;
                const tOff = [[-5,13],[-2,14],[2,14],[5,13]];
                const tEnd = [[-8,21],[-4,22],[4,22],[8,21]];
                tOff.forEach((tp, ti) => {
                    const wave = Math.sin(t9 * 3 + ti * 1.5) * 2;
                    ctx.beginPath();
                    ctx.moveTo(tp[0],tp[1]+eb);
                    ctx.quadraticCurveTo(tp[0]+wave,tp[1]+5+eb+legL*(ti<2?1:0),tEnd[ti][0]+wave,tEnd[ti][1]+eb);
                    ctx.stroke();
                    // 촉수 끝 흡반
                    ctx.fillStyle = "#550010";
                    ctx.beginPath(); ctx.arc(tEnd[ti][0]+wave,tEnd[ti][1]+eb,2,0,Math.PI*2); ctx.fill();
                });
                // 다수 비틀린 눈
                const eyes9 = [[-4,-14],[-1,-16],[3,-13],[5,-16],[-6,-8],[6,-8]];
                eyes9.forEach((ep, ei) => {
                    const ec = ei < 3 ? "#ff0000" : (ei < 5 ? "#ff6600" : "#ffaa00");
                    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(ep[0],ep[1]+eb,3,3.5,0,0,Math.PI*2); ctx.fill();
                    ctx.fillStyle = ec; ctx.shadowBlur = 6; ctx.shadowColor = ec;
                    ctx.beginPath(); ctx.ellipse(ep[0],ep[1]+eb,2,2.8,0,0,Math.PI*2); ctx.fill();
                    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(ep[0],ep[1]+eb,0.7,2.5,0,0,Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 0;
                });
                // 입 (수평으로 찢어진, 날카로운 이빨들)
                ctx.fillStyle = "#2a0005"; ctx.fillRect(-7,-4+eb,14,4);
                ctx.fillStyle = "#c8b0b0";
                for (let ti=0;ti<7;ti++) {
                    ctx.beginPath(); ctx.moveTo(-6+ti*2,-4+eb); ctx.lineTo(-5+ti*2,-1+eb); ctx.lineTo(-4+ti*2,-4+eb); ctx.fill();
                }
                // 흘러내리는 심연의 액체
                ctx.fillStyle = "rgba(150,0,30,0.5)";
                ctx.fillRect(-4,13+eb,2,5); ctx.fillRect(2,14+eb,2,4); ctx.fillRect(-1,12+eb,1,6);
            }

            if (e.type === "shield" && !e.isTutorialDummy) {
                if (e.isGuarding) {
                    ctx.fillStyle = "#8090a0"; ctx.fillRect(3, -14 + eBob, 9, 26);
                    ctx.fillStyle = "#b0bec5"; ctx.fillRect(4, -13 + eBob, 7, 24);
                    ctx.fillStyle = "#78909c"; ctx.fillRect(5, -7 + eBob, 5, 3);
                    ctx.strokeStyle = "#607d8b"; ctx.lineWidth = 1;
                    ctx.strokeRect(4, -13 + eBob, 7, 24);
                } else {
                    ctx.fillStyle = "#8090a0"; ctx.fillRect(-2, 5 + eBob, 13, 5);
                    ctx.fillStyle = "#b0bec5"; ctx.fillRect(-1, 6 + eBob, 11, 3);
                }
                ctx.fillStyle = "#00aaff"; ctx.font = "bold 6px SkullFont, NeoDunggeunmo";
                ctx.fillText("S", -8, -8 + eBob);
            } 
            else if (e.type === "melee" && !e.isTutorialDummy) {
                ctx.save(); ctx.translate(5, -6 + eBob); ctx.rotate(wRot);
                if (e.world <= 2) {
                    // 고블린 이빨 단도 — 뼈 손잡이 + 빠진 이빨 날
                    ctx.fillStyle = "#c8b88a"; ctx.fillRect(-1, 0, 3, 8); // 뼈 손잡이
                    ctx.fillStyle = "#a09070"; ctx.fillRect(0, 2, 1, 4);
                    ctx.fillStyle = "#7a5a28"; ctx.fillRect(-2, -2, 5, 4); // 가드 (혁대)
                    ctx.fillStyle = "#d8d0b0"; ctx.fillRect(-1, -14, 3, 13); // 날
                    ctx.fillStyle = "#f0e8c0"; ctx.fillRect(0, -14, 1, 12); // 날 하이라이트
                    // 날에 피 묻힘
                    ctx.fillStyle = "rgba(180,0,0,0.6)"; ctx.fillRect(-1,-10,2,4);
                    ctx.beginPath(); ctx.moveTo(-1,-14); ctx.lineTo(1,-18); ctx.lineTo(2,-14); ctx.fill(); // 끝 뾰족
                } else if (e.world <= 4) {
                    // 해골 척추검 — 척추뼈를 이어 만든 검
                    ctx.fillStyle = "#c0bcb0"; ctx.fillRect(-1, 0, 3, 9); // 손잡이(뼈)
                    for (let bi=0;bi<3;bi++) ctx.fillRect(-2, 1+bi*3, 5, 2); // 매듭 마디
                    ctx.fillStyle = "#b8b4a8"; ctx.fillRect(-3, -2, 7, 3); // 가드(갈비뼈 조각)
                    ctx.fillStyle = "#d8d4c8"; ctx.fillRect(-1, -18, 3, 17); // 날 (뼈)
                    ctx.fillStyle = "#f0ecd8"; ctx.fillRect(0, -16, 1, 14);
                    // 이빨 모양 거치(notch)
                    ctx.fillStyle = "#aaa49a";
                    ctx.fillRect(-2,-15,1,2); ctx.fillRect(-2,-10,1,2); ctx.fillRect(-2,-5,1,2);
                    ctx.beginPath(); ctx.moveTo(-1,-18); ctx.lineTo(1,-22); ctx.lineTo(2,-18); ctx.fill();
                } else if (e.world <= 6) {
                    // 흑철 처형검 — 두껍고 무겁고 피묻은
                    ctx.fillStyle = "#1a1820"; ctx.fillRect(-2, 0, 5, 9); // 손잡이
                    ctx.fillStyle = "#cc2200"; ctx.fillRect(-1, 1, 1, 6); // 피 흔적 손잡이
                    ctx.fillStyle = "#333344"; ctx.fillRect(-6, -3, 13, 5); // 넓은 가드
                    ctx.fillStyle = "#0a0a14"; ctx.fillRect(-2, -20, 5, 18); // 날
                    ctx.fillStyle = "#dd1100"; ctx.fillRect(-1, -20, 2, 18); // 붉은 홈
                    ctx.fillStyle = "#22222e"; ctx.fillRect(-3, -20, 2, 18); // 두꺼운 등
                    // 날 끝 (찌르개 형태)
                    ctx.beginPath(); ctx.moveTo(-2,-20); ctx.lineTo(0,-26); ctx.lineTo(3,-20); ctx.fill();
                    ctx.fillStyle = "#dd1100"; ctx.beginPath(); ctx.moveTo(-1,-20); ctx.lineTo(0,-24); ctx.lineTo(2,-20); ctx.fill();
                    // 피 (흘러내림)
                    ctx.fillStyle = "rgba(200,0,0,0.55)"; ctx.fillRect(-1,-14,2,5);
                } else if (e.world <= 8) {
                    // 저주 황금창 — 뒤틀린 황금빛 날 + 마나석
                    ctx.fillStyle = "#1a1200"; ctx.fillRect(-1, 0, 3, 10); // 손잡이 (흑목)
                    ctx.fillStyle = "#554000"; ctx.fillRect(0, 1, 1, 8);
                    ctx.fillStyle = "#886600"; ctx.fillRect(-3, -3, 7, 4); // 가드
                    ctx.fillStyle = "#ffd700"; ctx.shadowBlur = 6; ctx.shadowColor = "#ffaa00";
                    ctx.fillRect(-2, -22, 5, 20); // 황금 날
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "#ffe840"; ctx.fillRect(-1, -22, 2, 20); // 날 하이라이트
                    ctx.fillStyle = "#aa7700"; ctx.fillRect(-3,-22,2,20); // 두꺼운 등
                    // 날 끝 (삼각 갈래)
                    ctx.fillStyle = "#ffd700";
                    ctx.beginPath(); ctx.moveTo(-2,-22); ctx.lineTo(-4,-28); ctx.lineTo(0,-24); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(3,-22); ctx.lineTo(5,-28); ctx.lineTo(1,-24); ctx.fill();
                    // 마나석 (보라)
                    ctx.fillStyle = "#cc00ff"; ctx.shadowBlur = 5; ctx.shadowColor = "#aa00ff";
                    ctx.beginPath(); ctx.arc(0, -3, 2.5, 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    // 심연 낫 — 마왕성 죽음의 낫
                    ctx.fillStyle = "#0a0008"; ctx.fillRect(-1, 0, 3, 10); // 손잡이
                    ctx.fillStyle = "#220033"; ctx.fillRect(-3, -3, 7, 4); // 가드
                    // 낫 날 (휜 형태)
                    ctx.strokeStyle = "#00ffaa"; ctx.lineWidth = 3;
                    ctx.shadowBlur = 8; ctx.shadowColor = "#00ffcc";
                    ctx.beginPath(); ctx.moveTo(0, -3); ctx.bezierCurveTo(14, -6, 12, -22, 2, -22); ctx.stroke();
                    ctx.lineWidth = 1; ctx.strokeStyle = "#aaffee";
                    ctx.beginPath(); ctx.moveTo(1, -4); ctx.bezierCurveTo(10, -7, 10, -20, 2, -20); ctx.stroke();
                    ctx.shadowBlur = 0;
                    // 낫 끝 뾰족
                    ctx.fillStyle = "#00ffcc";
                    ctx.beginPath(); ctx.arc(2, -22, 2.5, 0, Math.PI*2); ctx.fill();
                    // 어둠 방울 떨어짐
                    ctx.fillStyle = "rgba(0,180,100,0.4)"; ctx.fillRect(0,-12,1,3);
                }
                ctx.restore();

                // ── 잡몹 스윙 아크 잔상 ──
                if (e.atkAnim > 0) {
                    const atkP = 1 - e.atkAnim / 30;
                    const arcAlpha = atkP < 0.5 ? atkP * 2 : (1 - atkP) * 2;
                    const arcStart = -Math.PI * 0.5;
                    const arcEnd   = arcStart + Math.PI * 1.2 * atkP;
                    const arcR     = e.world <= 2 ? 16 : (e.world <= 4 ? 20 : (e.world <= 6 ? 22 : 24));
                    const arcCol   = e.world <= 2 ? `rgba(255,${Math.floor(120*(1-atkP))},0,${arcAlpha})`
                                   : (e.world <= 4 ? `rgba(180,0,30,${arcAlpha})`
                                   : (e.world <= 6 ? `rgba(80,40,220,${arcAlpha})`
                                   : `rgba(200,150,0,${arcAlpha})`));
                    ctx.save();
                    ctx.globalAlpha = arcAlpha * 0.6;
                    ctx.strokeStyle = arcCol;
                    ctx.lineWidth = 5 + atkP * 3;
                    ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.arc(5, -6 + eBob, arcR, arcStart, arcEnd); ctx.stroke();
                    ctx.strokeStyle = `rgba(255,255,255,${arcAlpha * 0.35})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(5, -6 + eBob, arcR, arcStart, arcEnd); ctx.stroke();
                    ctx.restore();
                }
            }

            // ── 원거리 타입 구분 배지 ──
            if (e.type === "bomber") {
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
            ctx.shadowBlur = 0;
        }
        // 파괴된 스테이지 눈 효과는 각 보스 스프라이트 코드에서 직접 처리

        ctx.restore();

        if (!e.isBoss) {
            // 더미 골렘은 체력바를 DUMMY 텍스트 아래로 올림 (내부 렌더가 scale로 커서 몸 안에 들어감)
            const bw = 24 * 1.5, bx = ex + e.w / 2 - bw / 2;
            const by = e.isTutorialDummy ? (e.y - 52) : (e.y - 10);
            if (bx > -10 && bx < CW) {
                // HP 바
                ctx.fillStyle = "#220000"; ctx.fillRect(bx, by, bw, 3);
                let hpCol = e.isElite ? "#aa00ff" : (e.hp / e.maxHp > 0.5 ? "#22aa22" : "#cc2222");
                if (e.type === "shield" && !e.isElite) hpCol = e.hp / e.maxHp > 0.5 ? "#607d8b" : "#455a64";
                ctx.fillStyle = hpCol; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 3);
                // 체간(Poise) 바 — 보스만 표시
                if (e.isBoss && (e.poiseMx || 0) > 0 && !e.stun) {
                    const poisePct = Math.max(0, (e.poise || 0) / e.poiseMx);
                    ctx.fillStyle = "rgba(20,0,0,0.6)"; ctx.fillRect(bx, by + 4, bw, 2);
                    ctx.fillStyle = poisePct > 0.5 ? "#4488ff" : (poisePct > 0.25 ? "#ffaa00" : "#ff2200");
                    ctx.fillRect(bx, by + 4, bw * poisePct, 2);
                }
                // 그로기/기절 표시 — 보스만 표시
                if (e.isBoss && e.stun) {
                    ctx.fillStyle = "rgba(255,238,0,0.85)";
                    ctx.font = "bold 10px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
                    ctx.shadowBlur = 6; ctx.shadowColor = "#ffee00";
                    ctx.fillText("그로기!", bx + bw/2, by - 3);
                    ctx.shadowBlur = 0; ctx.textAlign = "left";
                }
            }
        }
    });

    // 플레이어 렌더링 — 무적 프레임 중엔 4프레임마다 깜빡임
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
                // 스톱모션: sin 제거, 이진 스텝으로 딱딱하게
                const step = p.fr % 2 === 0 ? 1 : -1;
                pyOffset = 1;
                pLegL_Y = step > 0 ? -2 : 0;
                pLegR_Y = step > 0 ? 0 : -2;
                pLegL_X = step * 3; pLegR_X = -step * 3; armRot = step * 0.4;
            }

            ctx.save(); 
            ctx.translate(px + 7, py + 9 + pyOffset); 
            ctx.scale(p.facing, 1);


            // 가드 및 패링 효과
            if (p.guarding || p.parryT > 0) {
                const parryPulse = p.parryT > 0 ? p.parryT / (10 + (Game.pParryBonus||0)) : 1;
                if (p.parryT > 0) {
                    const parryR = 18 + (1-parryPulse) * 14;
                    ctx.strokeStyle = `rgba(255, 215, 0, ${parryPulse * 0.95})`;
                    ctx.lineWidth = 3 + (1-parryPulse) * 2;
                    ctx.shadowBlur = 15 * parryPulse; ctx.shadowColor = "#ffdd00";
                    ctx.beginPath(); ctx.arc(1, -pyOffset, parryR, 0, Math.PI*2); ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = `rgba(255, 238, 0, ${parryPulse * 0.35})`;
                    ctx.beginPath(); ctx.arc(1, -pyOffset, parryR, 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.fillStyle = "rgba(0, 204, 255, 0.25)";
                    ctx.beginPath(); ctx.arc(1, -pyOffset, 17, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = "rgba(0, 204, 255, 0.8)";
                    ctx.lineWidth = 2; ctx.stroke();
                }
            }

            // 숨쉬기 오프셋
            const breathOff = (!isMoving && !isJumping && !isFalling && p.atkAnim <= 0 && p.dashT <= 0 && !p.plunging && !p.guarding)
                ? Math.sin((Game._breathT || 0) * Math.PI * 2 / 180) * 0.4 : 0;

            // 하체 (고정)
            ctx.fillStyle = "#f8f8fa";
            if (!p.guarding) { ctx.fillRect(-5 + pLegL_X, 7 + pLegL_Y, 3, 5); ctx.fillRect(1 + pLegR_X, 7 + pLegR_Y, 3, 5); }
            else { ctx.fillRect(-5, 5, 4, 2); ctx.fillRect(3, 5, 4, 2); }

            // 상체 그룹 (전체 숨쉬기 적용)
            ctx.save();
            ctx.translate(0, -breathOff); 

            // 머플러 색상
            let mColMain, mColShadow;
            if (Game.pClass === 0) { mColMain = "#ffffff"; mColShadow = "#cccccc"; }
            else if (Game.pClass === 1) { mColMain = "#aa00ff"; mColShadow = "#7700cc"; }
            else if (Game.pClass === 2) { mColMain = "#00ccff"; mColShadow = "#0088cc"; }
            else if (Game.pClass === 3) { mColMain = "#e60026"; mColShadow = "#99001a"; }
            else if (Game.pClass === 4) { mColMain = "#666666"; mColShadow = "#444444"; }
            else if (Game.pClass === 5) { mColMain = "#ffcc00"; mColShadow = "#aa8800"; }
            else if (Game.pClass === 6)  { mColMain = "#cc2244"; mColShadow = "#880022"; } // 혈귀: 혈홍
            else if (Game.pClass === 7) { mColMain = "#ffdd00"; mColShadow = "#cc9900"; } // 조커: 황금
            else { mColMain = "#ffffff"; mColShadow = "#cccccc"; }

            // 망토 (뒤)
            ctx.fillStyle = mColShadow;
            if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 10, 4); ctx.fillRect(-14, 6, 6, 4); }
            else if (isFalling) { ctx.fillRect(-12, -8, 8, 8); ctx.fillRect(-14, -12, 6, 4); }
            else if (isMoving) { const flap = p.fr % 2 === 0 ? 2 : -1; ctx.fillRect(-14, 2 + flap, 10, 4); ctx.fillRect(-16, 4 + flap, 6, 4); }
            else { ctx.fillRect(-9, 3, 6, 6); ctx.fillRect(-11, 7, 5, 4); }

            // 몸통
            ctx.fillStyle = "#1a1a25"; ctx.fillRect(-6, 2, 12, 6);
            ctx.fillStyle = "#2a2a35"; ctx.fillRect(-5, 2, 10, 5);
            
            // 머리통
            ctx.fillStyle = "#f8f8fa"; ctx.fillRect(-6, -10, 14, 10); ctx.fillRect(-7, -8, 16, 6);
            
            // ── 직업별 머리/얼굴 특징 ──
            const _pc = Game.pClass;
            if (_pc === 0) {
                // 검사: 하얀 머리띠
                ctx.fillStyle = "#dddddd"; ctx.fillRect(-7, -11, 16, 3);
                ctx.fillStyle = "#bbbbbb"; ctx.fillRect(-7, -11, 16, 1);
                // 기본 마스크
                ctx.fillStyle = "#d0d0d5"; ctx.fillRect(-4, 0, 10, 3);
                ctx.fillStyle = "#808085"; ctx.fillRect(-2, 0, 1, 3); ctx.fillRect(1, 0, 1, 3); ctx.fillRect(4, 0, 1, 3);
            } else if (_pc === 1) {
                // 도적: 후드 + 얼굴 흉터
                ctx.fillStyle = "#550088"; ctx.fillRect(-7, -12, 16, 4); // 후드
                ctx.fillStyle = "#330055"; ctx.fillRect(-8, -12, 2, 14); // 후드 옆
                ctx.fillStyle = "#cc2200"; ctx.fillRect(-5, -10, 2, 8); ctx.fillRect(-3, -8, 2, 4); ctx.fillRect(1, -10, 2, 8); ctx.fillRect(-1, -8, 2, 4);
            } else if (_pc === 2) {
                // 마법사: 뾰족 모자 + 챙
                ctx.fillStyle = "#004477"; ctx.beginPath(); ctx.moveTo(1, -22); ctx.lineTo(-8, -10); ctx.lineTo(10, -10); ctx.fill();
                ctx.fillStyle = mColMain; ctx.fillRect(-10, -10, 22, 2);
            } else if (_pc === 3) {
                // 버서커: 뿔 달린 헬멧
                ctx.fillStyle = "#333"; ctx.fillRect(-7, -12, 16, 4);
                ctx.fillStyle = "#555"; ctx.fillRect(-6, -12, 14, 3);
                ctx.fillStyle = "#888"; ctx.fillRect(-9, -14, 3, 6); ctx.fillRect(7, -14, 3, 6); // 뿔
                ctx.fillStyle = "#aaa"; ctx.fillRect(-8, -14, 2, 5); ctx.fillRect(8, -14, 2, 5);
                // 핏자국
                ctx.fillStyle = "rgba(160,0,0,0.7)";
                ctx.fillRect(-3, -10, 2, 5); ctx.fillRect(2, -9, 1, 4);
            } else if (_pc === 4) {
                // 발키리: 해적 삼각모자 + 눈가리개
                ctx.fillStyle = "#333"; ctx.fillRect(-8, -13, 18, 5); // 모자 챙
                ctx.fillStyle = "#222"; ctx.beginPath(); ctx.moveTo(-2,-13); ctx.lineTo(4,-20); ctx.lineTo(10,-13); ctx.fill(); // 삼각 꼭지
                ctx.fillStyle = "#1a1a1a"; ctx.fillRect(-3, -8, 5, 3); // 안대
                ctx.fillStyle = "#444"; ctx.fillRect(-4, -7, 1, 2); ctx.fillRect(2, -7, 1, 2);
            } else if (_pc === 5) {
                // 성기사: 황금 후광 + 바이저
                ctx.fillStyle = "rgba(255,220,0,0.35)";
                ctx.shadowBlur = 10; ctx.shadowColor = "#ffdd00";
                ctx.beginPath(); ctx.arc(1, -10, 12, Math.PI, 0); ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#aa8800"; ctx.fillRect(-7, -11, 16, 3); // 투구
                ctx.fillStyle = "#ccaa00"; ctx.fillRect(-6, -11, 14, 2);
                ctx.fillStyle = "#886600"; ctx.fillRect(-4, -8, 10, 3); // 바이저
            } else if (_pc === 6) {
                // 혈귀: 오니 마스크 (뿔+송곳니)
                ctx.fillStyle = "#880022"; ctx.fillRect(-7,-10,16,10); // 마스크
                ctx.fillStyle = "#aa0033"; ctx.fillRect(-6,-9,14,8);
                ctx.fillStyle = "#cc2244"; ctx.fillRect(-4,-8,10,6);
                // 뿔
                ctx.fillStyle = "#441111"; ctx.fillRect(-6,-17,3,8); ctx.fillRect(4,-17,3,8);
                ctx.fillStyle = "#662222"; ctx.fillRect(-5,-17,2,7); ctx.fillRect(5,-17,2,7);
                // 송곳니
                ctx.fillStyle = "#f8f8fa"; ctx.fillRect(-3,0,3,4); ctx.fillRect(1,0,3,4);
                ctx.fillStyle = "#dddddd"; ctx.fillRect(-2,0,2,3); ctx.fillRect(2,0,2,3);
            } else if (_pc === 7) {
                // 조커: 탑햇 + 카드 장식
                ctx.fillStyle = "#111"; ctx.fillRect(-6,-18,14,10); // 탑햇 본체
                ctx.fillStyle = "#222"; ctx.fillRect(-5,-17,12,8);
                ctx.fillStyle = "#333"; ctx.fillRect(-8,-10,18,3); // 탑햇 챙
                ctx.fillStyle = "#ffdd00"; ctx.fillRect(-4,-10,3,3); // 황금 띠
                ctx.fillStyle = "#ff2222"; ctx.fillRect(-2,-15,2,4); // 카드 장식
                ctx.fillStyle = "#2222ff"; ctx.fillRect(1,-15,2,4);
            } else {
                // 기본 마스크
                ctx.fillStyle = "#d0d0d5"; ctx.fillRect(-4, 0, 10, 3);
                ctx.fillStyle = "#808085"; ctx.fillRect(-2, 0, 1, 3); ctx.fillRect(1, 0, 1, 3); ctx.fillRect(4, 0, 1, 3);
            }
            
            // 눈
            let eyeW = 4, eyeH = 4;
            if (isMoving) { let pulse = (p.fr % 2 === 0) ? 1 : 0; eyeW += pulse; eyeH += pulse; }
            ctx.fillStyle = "#0a0a0f"; ctx.fillRect(2, -7 - (eyeH - 4), eyeW, eyeH); ctx.fillRect(-4 - (eyeW - 4), -7 - (eyeH - 4), eyeW, eyeH);
            ctx.fillStyle = p.atkAnim > 0 ? "#ff0000" : "#fff"; ctx.fillRect(3, -6, 2, 2); ctx.fillRect(-3, -6, 2, 2);

            // 머플러 (앞)
            ctx.fillStyle = mColShadow; ctx.fillRect(-7, -1, 14, 4);
            ctx.fillStyle = mColMain; ctx.fillRect(-6, -1, 12, 2);

            // ── 직업별 어깨/갑옷/특수 바디 ──
            if (_pc === 3) {
                // 버서커: 스파이크 어깨
                ctx.fillStyle = "#555"; ctx.fillRect(-9,-8,5,7); ctx.fillRect(5,-8,5,7);
                ctx.fillStyle = "#888"; ctx.fillRect(-8,-8,4,6); ctx.fillRect(6,-8,4,6);
                ctx.fillStyle = "#aaa"; ctx.fillRect(-7,-11,2,4); ctx.fillRect(7,-11,2,4); // 스파이크
            } else if (_pc === 5) {
                // 성기사: 황금 어깨판
                ctx.fillStyle = "#886600"; ctx.fillRect(-9,-8,5,7); ctx.fillRect(5,-8,5,7);
                ctx.fillStyle = "#aa8800"; ctx.fillRect(-8,-8,4,6); ctx.fillRect(6,-8,4,6);
                ctx.fillStyle = "#ffcc00"; ctx.fillRect(-7,-7,3,1); ctx.fillRect(6,-7,3,1);
            } else if (_pc === 6) {
                // 혈귀: 가시 어깨
                ctx.fillStyle = "#330011"; ctx.fillRect(-8,-8,4,6); ctx.fillRect(5,-8,4,6);
                ctx.fillStyle = "#550022"; ctx.fillRect(-7,-8,3,5); ctx.fillRect(6,-8,3,5);
                ctx.fillStyle = "#880033"; ctx.fillRect(-7,-11,2,4); ctx.fillRect(6,-11,2,4);
            }

            // ==========================================
            // 3. 무기 및 액션 모션
            // ==========================================
            // 헤븐즈 콜 망치 내리찍기 모션 (별도 렌더)
            if (Game._paladinSkill && Game.pClass === 5) {
                if (typeof Game._paladinHammerT === 'number') Game._paladinHammerT--;
                const ht = Game._paladinHammerT || 0;
                const raising = ht > 0; // 올리기 단계 vs 내리찍기 단계
                const prog = raising ? (1 - ht / 30) : 1;
                // 망치 올리기: 위로 들어올림 → 내리찍기: 앞아래로 강타
                const hammerAngle = raising
                    ? -Math.PI * 0.9 * prog              // -0 → -162도 (머리 위로)
                    : -Math.PI * 0.9 + Math.PI * 1.7 * Math.min(1, (30 - ht) / 15); // 내려찍기
                ctx.save();
                ctx.translate(p.facing * 8, -4);
                ctx.scale(p.facing, 1);
                ctx.rotate(hammerAngle);
                // 망치 자루
                ctx.fillStyle = "#8B6914"; ctx.fillRect(-2, -28, 4, 32);
                // 망치 헤드
                ctx.fillStyle = "#cccccc"; ctx.fillRect(-7, -32, 14, 10);
                ctx.fillStyle = "#aaaaaa"; ctx.fillRect(-6, -31, 12, 8);
                // 황금 빛 이펙트
                if (!raising) {
                    const glow = Math.max(0, 1 - (30 - ht) / 15);
                    ctx.shadowBlur = 12 * glow; ctx.shadowColor = "#ffdd00";
                    ctx.fillStyle = `rgba(255,220,0,${glow * 0.6})`; ctx.fillRect(-7, -32, 14, 10);
                }
                ctx.shadowBlur = 0;
                ctx.restore();
            }
            if (p.plunging || Game._berserkSlam || (Game.pClass === 4 && (p.atkT || 0) > 0 && !p.onGround)) {
                if (Game.pClass === 4) {
                    ctx.save(); ctx.translate(5, 5); ctx.rotate(Math.PI * 0.25); drawBone(false, 4); ctx.restore();
                } else if (Game.pClass === 3 && (p.plunging || Game._berserkSlam)) {
                    // 버서커 강하/슬램 중 무기 회전 각도 분기
                    let rot = (Game._berserkSlam && p.vy < 0) ? -Math.PI * 0.2 : Math.PI * 0.9;
                    ctx.save(); ctx.translate(3, 12); ctx.scale(p.facing, 1); ctx.rotate(rot); drawBone(true, 3); ctx.restore();
                } else if (Game.pClass === 5) {
                    ctx.save(); ctx.translate(0, 5);
                    ctx.fillStyle = "#607080"; ctx.fillRect(-6, 0, 12, 16);
                    ctx.fillStyle = "#8090a0"; ctx.fillRect(-5, 1, 10, 14);
                    ctx.fillStyle = "#ffcc00"; ctx.fillRect(-2, 6, 4, 8);
                    ctx.restore();
                } else {
                    ctx.save(); ctx.translate(5, 5); ctx.rotate(Math.PI * 0.75 * p.facing); drawBone(true, Game.pClass); ctx.restore();
                }
                
                // 강하 타격 궤적 (발키리 제외)
                if (p.vy > 0 && Game.pClass !== 4) {
                    const plCol = Game.pClass === 0 ? "rgba(255,40,0" : (Game.pClass === 3 ? "rgba(200,0,0" : (Game.pClass === 1 ? "rgba(180,0,255" : (Game.pClass === 5 ? "rgba(255,200,0" : "rgba(0,180,255")));
                    for (let pl = 1; pl <= 3; pl++) {
                        ctx.strokeStyle = `${plCol},${0.45/pl})`; ctx.lineWidth = 3/pl;
                        ctx.beginPath(); ctx.moveTo(-6+pl*2, -12+pl*2); ctx.lineTo(-6+pl*2, 10); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(6-pl*2, -12+pl*2); ctx.lineTo(6-pl*2, 10); ctx.stroke();
                    }
                }
            } else if (p.atkAnim > 0) {
                ctx.save(); ctx.translate(5, 5);
                let isLastHit = (Game.pClass === 1 && p.combo === 5) || (Game.pClass === 3 && p.combo === 3) || (Game.pClass !== 1 && Game.pClass !== 3 && p.combo === 3);
                const maxAnim = p.atkAnimMax || (isLastHit ? 20 : 12);
                const rawP = Math.max(0, 1 - ((p.atkAnim || 0) / maxAnim));
                // ease-out cubic for smoother deceleration at end of swing
                const progress = 1 - Math.pow(1 - rawP, 2);
                let angle = 0;

                if (Game.pClass === 3) {
                    // 버서커: 묵직한 대형 스윙 — 1타 위→아래, 2타 아래→위, 3타(last) 머리 위 → 앞 강타
                    if (!isLastHit) {
                        if (p.combo % 2 === 1) { angle = -Math.PI * 1.0 + (Math.PI * 1.8 * progress); }
                        else                   { angle =  Math.PI * 0.8 - (Math.PI * 1.8 * progress); }
                    } else {
                        // 마지막: 머리 위 → 앞 → 아래 대형 내려찍기
                        if (progress < 0.25) { angle = -Math.PI * 1.1 - progress * 0.5; }
                        else { const p2 = (progress - 0.25) / 0.75; angle = -Math.PI * 1.2 + Math.PI * 2.4 * p2; }
                    }
                } else if (!isLastHit) {
                    if (p.combo % 2 === 1) { angle = -Math.PI * 0.7 + (Math.PI * 1.4 * progress); } else { angle = Math.PI * 0.7 - (Math.PI * 1.4 * progress); }
                } else {
                    if (progress < 0.3) { angle = -Math.PI * 0.8 - (progress * 1.5); } else { const p2 = (progress - 0.3) / 0.7; angle = -Math.PI * 1.2 + (Math.PI * 2.2 * p2); }
                }

                if (Game.pClass === 4) {
                    // 발키리: 총 들고 조준 (공격 모션 없음, 탄환이 이펙트)
                    ctx.rotate(0); drawBone(false, 4);
                } else if (Game.pClass === 5) {
                    // 성기사: 망치 스윙 + 신성 링
                    ctx.rotate(angle); drawBone(isLastHit, 5);
                    if (progress > 0.2 && progress < 0.95) {
                        const hitX = 10 + (Game.pRangeBonus||0)/2;
                        const fA = Math.sin((progress - 0.2) / 0.75 * Math.PI); // 0→1→0
                        ctx.strokeStyle = `rgba(255,220,60,${fA * 0.85})`; ctx.lineWidth = 3 + (1-fA)*3;
                        ctx.beginPath(); ctx.arc(hitX, 0, 8 + (1-fA)*20, 0, Math.PI*2); ctx.stroke();
                        ctx.fillStyle = `rgba(255,255,160,${fA*0.22})`; ctx.fill();
                        // 신성 십자 섬광
                        ctx.fillStyle = `rgba(255,255,200,${fA*0.7})`;
                        ctx.fillRect(hitX - 1.5, -18*fA, 3, 36*fA);
                        ctx.fillRect(hitX - 18*fA, -1.5, 36*fA, 3);
                    }
                } else if (Game.pClass === 3) {
                    // 버서커: 묵직한 스윙 + 3타 충격파 (무기 끝에 붙어서 이동)
                    ctx.rotate(angle); drawBone(isLastHit, 3);
                    if (isLastHit && progress > 0.4) {
                        const ef = (progress - 0.4) / 0.6;
                        // 무기 끝 위치 (angle 방향으로 약 22px)
                        const tipX = Math.cos(angle) * 22;
                        const tipY = Math.sin(angle) * 22;
                        // 충격파: 퍼지면서 사라지는 링
                        ctx.strokeStyle = `rgba(200,0,0,${(1-ef) * 0.9})`; ctx.lineWidth = 4 - ef*2;
                        ctx.beginPath(); ctx.arc(tipX, tipY, 6 + ef * 18, 0, Math.PI*2); ctx.stroke();
                        // 핏빛 내부
                        ctx.fillStyle = `rgba(180,0,0,${(1-ef)*0.18})`; ctx.fill();
                        // 2번째 빠른 링
                        if (ef > 0.25) {
                            const ef2 = (ef - 0.25) / 0.75;
                            ctx.strokeStyle = `rgba(255,40,0,${(1-ef2)*0.5})`; ctx.lineWidth = 2;
                            ctx.beginPath(); ctx.arc(tipX, tipY, 6 + ef2 * 12, 0, Math.PI*2); ctx.stroke();
                        }
                    }
                } else if (_pc === 2) {
                    // 마법사: 지팡이 스윙 + 마법 잔상
                    ctx.rotate(angle); drawBone(isLastHit, 2);
                    if (progress > 0.15) {
                        const fA = Math.min(1, (progress - 0.15) * 2.5);
                        const tipX = Math.cos(angle) * 18;
                        const tipY = Math.sin(angle) * 18;
                        ctx.shadowBlur = 8; ctx.shadowColor = "#00ccff";
                        ctx.strokeStyle = `rgba(0,200,255,${fA * 0.7})`; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(tipX, tipY, 4 + (1-fA)*10, 0, Math.PI*2); ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                } else if (_pc === 1) {
                    // 도적: 빠른 이중검
                    ctx.rotate(angle); drawBone(isLastHit, 1);
                    if (progress > 0.1 && progress < 0.8) {
                        const trailA = angle - (p.combo % 2 === 1 ? 0.45 : -0.45);
                        ctx.globalAlpha = (1-progress) * 0.35;
                        ctx.save(); ctx.rotate(trailA - angle); drawBone(false, 1); ctx.restore();
                        ctx.globalAlpha = 1;
                    }
                } else if (_pc === 6) {
                    // 혈귀: 클로 슬래시 + 혈흔
                    ctx.rotate(angle); drawBone(isLastHit, 8);
                    if (isLastHit && progress > 0.3) {
                        const fA = (progress-0.3)/0.7;
                        ctx.strokeStyle = `rgba(200,20,50,${(1-fA)*0.8})`; ctx.lineWidth = 3-fA;
                        ctx.beginPath(); ctx.arc(Math.cos(angle)*16, Math.sin(angle)*16, 5+fA*16, 0, Math.PI*2); ctx.stroke();
                    }
                } else if (_pc === 7) {
                    // 조커: 카드 던지기 모션 (팔 앞으로 뻗기)
                    ctx.rotate(angle * 0.5);
                    drawBone(isLastHit, 15);
                    // 카드 비주얼 — 작은 직사각형
                    if (progress > 0.2 && progress < 0.75) {
                        const cardAlpha = Math.sin((progress - 0.2) / 0.55 * Math.PI);
                        const cardColors = ["#ff4444","#222222","#4488ff"];
                        ctx.fillStyle = cardColors[Math.floor(Date.now() / 150) % 3];
                        ctx.globalAlpha = cardAlpha * 0.9;
                        ctx.fillRect(10, -3, 8, 11);
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 0.8;
                        ctx.strokeRect(10, -3, 8, 11);
                        ctx.globalAlpha = 1;
                    }
                } else {
                    // 검사: 스윙 + 마지막 타격 섬광
                    ctx.rotate(angle); drawBone(isLastHit, 0);
                    if (isLastHit && progress > 0.45 && progress < 0.85) {
                        const fA = Math.sin((progress - 0.45) / 0.4 * Math.PI);
                        const tipX = Math.cos(angle) * 20;
                        const tipY = Math.sin(angle) * 20;
                        ctx.strokeStyle = `rgba(255,255,255,${fA*0.7})`; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(tipX, tipY, 5 + (1-fA)*14, 0, Math.PI*2); ctx.stroke();
                    }
                }
                if (_pc === 1) { ctx.save(); ctx.translate(-15, 0); ctx.rotate(-Math.PI * 0.5); drawBone(false, 1); ctx.restore(); }
                ctx.restore();
            } else {
                ctx.save();
                if (_pc === 3) {
                    ctx.translate(3, 8); ctx.rotate(Math.PI * 0.6 + armRot * 0.3); drawBone(false, 3);
                } else if (_pc === 4) {
                    ctx.translate(5, 3); drawBone(false, 4);
                } else {
                    ctx.translate(5, 5); ctx.rotate(armRot * 0.5); drawBone(false, _pc);
                }
                // 도적: 보조검
                if (_pc === 1) { ctx.save(); ctx.translate(-15, 0); ctx.rotate(-Math.PI * 0.2); drawBone(false, 1); ctx.restore(); }
                // 성기사: 방패 (왼손)
                if (_pc === 5) {
                    ctx.save();
                    ctx.translate(-12, 0); ctx.rotate(armRot * 0.2);
                    ctx.fillStyle = "#607080"; ctx.fillRect(-4, -10, 8, 20);
                    ctx.fillStyle = "#8090a0"; ctx.fillRect(-3, -9, 6, 18);
                    ctx.fillStyle = "#aa8800"; ctx.fillRect(-1, -4, 2, 8);
                    ctx.fillRect(-3, -1, 6, 2);
                    ctx.restore();
                }
                ctx.restore();
            }
            ctx.restore(); 
            ctx.restore(); 
        }
    }
}