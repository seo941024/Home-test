// render_entities.js — 엔티티(몬스터/보스/플레이어) 렌더링

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
            ctx.fillStyle = "#00ccff";
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

        // 발키리 총알: 사각형 파티클
        if (!b.sk && b.r <= 5 && Game.pClass === 4) {
            const bulletCol = (Math.floor(b.life / 5) % 3 === 0) ? "#ffdd00"
                : (Math.floor(b.life / 5) % 3 === 1) ? "#cccccc" : "#ffffff";
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
            const outCol = Game.pClass === 0 ? "rgba(214, 236, 255, 0.6)"    // 전사: 주황
                : (Game.pClass === 1 ? "rgba(204, 68, 255, 0.6)"       // 도적: 보라
                : (Game.pClass === 3 ? "rgba(136, 0, 0, 0.8)"          // 버서커: 진한 붉은색
                : (Game.pClass === 5 ? "rgba(255, 255, 0, 0.6)"        // 팔라딘: 밝은 노란색
                : "rgba(0, 204, 255, 0.6)")));                         // 기타: 하늘색
            
            // 직업별 강하 이펙트 중심색 (하이라이트)
            const inCol = Game.pClass === 3 ? "rgba(255, 50, 50, 0.8)" // 버서커 중심 밝은 빨강
                : (Game.pClass === 5 ? "rgba(255, 255, 200, 0.8)"      // 팔라딘 중심 아주 밝은 노랑
                : "rgba(255, 255, 255, 0.7)");                         // 기본 흰색 반투명

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
        } else {
            ctx.fillStyle = b.sk ? "#00ccff" : "#ffcc22"; ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.fill(); 
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
            
            if (p2) { 
                ctx.shadowBlur = 15; 
                ctx.shadowColor = "#ff0000"; 
            }
            if (e.isRevived) {
                // 언데드화: 흑백에 가깝게, 눈은 별도 처리
                ctx.filter = 'grayscale(90%) brightness(0.65) contrast(1.3) sepia(15%)';
            }

            if (e.world <= 2) {
                // 고블린 전사장 — 플레이어보다 약간 큰 중간 보스
                // scale(1.8) 기준 내부: 폭 ±13, 머리~발 -32~+17
                const b = eBob;
                // 다리
                ctx.fillStyle = "#2a4a1a";
                ctx.fillRect(-8, 10+b, 6, 7+Math.abs(legL)); ctx.fillRect(3, 10+b, 6, 7+Math.abs(legR));
                // 발
                ctx.fillStyle = "#1a3010";
                ctx.fillRect(-9, 17+b, 7, 3); ctx.fillRect(3, 17+b, 7, 3);
                // 몸통
                ctx.fillStyle = "#3a7a28"; ctx.fillRect(-12, -4+b, 24, 16);
                // 가슴 갑옷
                ctx.fillStyle = "#4a5a44"; ctx.fillRect(-11, -3+b, 22, 12);
                ctx.fillStyle = "#5a6a54"; ctx.fillRect(-10, -3+b, 22, 3);
                // 팔
                ctx.fillStyle = "#2a5a1a";
                ctx.fillRect(-18, -3+b, 7, 12); ctx.fillRect(12, -3+b, 7, 12);
                // 목
                ctx.fillStyle = "#3a7a28"; ctx.fillRect(-4, -10+b, 8, 8);
                // 머리
                ctx.fillStyle = "#3a7a28"; ctx.fillRect(-10, -24+b, 20, 16);
                // 투구
                ctx.fillStyle = "#4a4a4f"; ctx.fillRect(-11, -26+b, 22, 6);
                // 작은 뿔
                ctx.fillStyle = "#3a3a3f";
                ctx.beginPath(); ctx.moveTo(-8,-26+b); ctx.lineTo(-12,-36+b); ctx.lineTo(-4,-26+b); ctx.fill();
                ctx.beginPath(); ctx.moveTo(8,-26+b); ctx.lineTo(12,-36+b); ctx.lineTo(4,-26+b); ctx.fill();
                // 눈
                ctx.fillStyle = p2 ? "#ff2200" : "#ffcc00";
                ctx.fillRect(-8,-20+b, 5, 3); ctx.fillRect(4,-20+b, 5, 3);
                ctx.fillStyle = "#000"; ctx.fillRect(-7,-20+b, 2, 2); ctx.fillRect(5,-20+b, 2, 2);
                // 이빨
                ctx.fillStyle = "#e8e0d0";
                ctx.fillRect(-6,-9+b, 3, 4); ctx.fillRect(-1,-8+b, 3, 4); ctx.fillRect(4,-9+b, 3, 4);
                // 단검
                ctx.save(); ctx.translate(16, 2+b); ctx.rotate(wRot + 0.3);
                ctx.fillStyle = "#aab8c0"; ctx.fillRect(-1, -14, 3, 16);
                ctx.fillStyle = "#7a5a20"; ctx.fillRect(-3, 1, 7, 4);
                ctx.fillStyle = "#5a3a10"; ctx.fillRect(-1, 5, 3, 5);
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
                // 눈구멍
                ctx.fillStyle = p2 ? "#ff2200" : "#000";
                ctx.shadowBlur = p2 ? 10 : 0; ctx.shadowColor = "#ff0000";
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
                // 검
                ctx.save(); ctx.translate(15, 2+b); ctx.rotate(wRot + 0.2);
                ctx.fillStyle = "#0d0d18"; ctx.fillRect(-2, -22, 4, 26);
                ctx.fillStyle = "#cc0020"; ctx.fillRect(-1, -22, 2, 20);
                ctx.fillStyle = "#333340"; ctx.fillRect(-6, 2, 12, 4);
                ctx.fillStyle = "#222"; ctx.fillRect(-1, 6, 3, 7);
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
                    const auraGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
                    auraGrd.addColorStop(0, rage ? "rgba(255,40,0,0.28)" : (p2 ? "rgba(200,0,0,0.2)" : "rgba(80,0,110,0.22)"));
                    auraGrd.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = auraGrd;
                    ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI*2); ctx.fill();
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

                // 5) 팔 + 손
                {
                    const armDark = rage ? "#2c0000" : (p2 ? "#280000" : "#140022");
                    const armMid  = rage ? "#480000" : (p2 ? "#420000" : "#22003a");
                    ctx.fillStyle = armDark;
                    ctx.fillRect(-35, -20, 13, 28); ctx.fillRect(22, -20, 13, 28);
                    ctx.fillStyle = armMid;
                    ctx.fillRect(-34, -19, 11, 26); ctx.fillRect(23, -19, 11, 26);
                    // 왼손: 어둠 오브
                    ctx.fillStyle = rage ? "#3a0000" : (p2 ? "#300000" : "#1a0030");
                    ctx.beginPath(); ctx.arc(-29, 10, 7, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = rage ? "#ff4400" : (p2 ? "#ff2200" : "#bb00ff");
                    ctx.shadowBlur = 14 + pulse * 8; ctx.shadowColor = ctx.fillStyle;
                    ctx.beginPath(); ctx.arc(-29, 10, 4 + pulse * 1.5, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                    // 오른손: 클로
                    ctx.fillStyle = rage ? "#480000" : (p2 ? "#400000" : "#200038");
                    ctx.beginPath(); ctx.arc(29, 10, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = rage ? "#882200" : (p2 ? "#771100" : "#440077");
                    for (let ci = -2; ci <= 2; ci++) { ctx.fillRect(27 + ci * 2.5, 8, 1.5, 8); }
                }

                // 6) 목 + 머리
                {
                    ctx.fillStyle = rage ? "#220000" : (p2 ? "#1e0000" : "#100020");
                    ctx.fillRect(-6, -50, 12, 9);
                    ctx.fillStyle = rage ? "#2e0000" : (p2 ? "#280000" : "#160026");
                    ctx.fillRect(-13, -70, 26, 22);
                    ctx.fillStyle = rage ? "#3e0000" : (p2 ? "#380000" : "#1e0032");
                    ctx.fillRect(-11, -68, 22, 8);
                    // 이빨
                    ctx.fillStyle = p2 ? "#ccaaaa" : "#bbaacc";
                    ctx.fillRect(-8, -53, 16, 2);
                    for (let ti = 0; ti < 5; ti++) { ctx.fillRect(-7 + ti * 3.5, -53, 2, 3); }
                    // 눈 (맥동)
                    ctx.shadowBlur = 12 + pulse * 8; ctx.shadowColor = "#ff0000";
                    ctx.fillStyle = rage ? "#ff6600" : "#ff0000";
                    ctx.beginPath(); ctx.arc(-4, -60, 3.5 + pulse * 0.8, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(4, -60, 3.5 + pulse * 0.8, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = "#fff8f0";
                    ctx.beginPath(); ctx.arc(-4, -61, 1.2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(4, -61, 1.2, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
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
                ctx.fillText("훈련용 골렘", 0, -54+eb);
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
            // 더미 골렘은 체력바를 DUMMY 텍스트 아래로 올림 (내부 렌더가 scale로 커서 몸 안에 들어감)
            const bw = 24 * 1.5, bx = ex + e.w / 2 - bw / 2;
            const by = e.isTutorialDummy ? (e.y - 52) : (e.y - 10);
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
                    ctx.fillText("기절!", bx + bw/2, by - 3);
                    ctx.shadowBlur = 0; ctx.textAlign = "left";
                }
            }
        }
    });

    // 💡 [수정] 아래부터 플레이어 렌더링 시작 (오류 및 누락 완전 수정본)
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
                ? Math.sin((Game._breathT || 0) * Math.PI * 2 / 120) * 1.2 : 0;

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
            else { mColMain = "#ffffff"; mColShadow = "#cccccc"; }

            // 망토 (뒤)
            ctx.fillStyle = mColShadow;
            if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 10, 4); ctx.fillRect(-14, 6, 6, 4); }
            else if (isFalling) { ctx.fillRect(-12, -8, 8, 8); ctx.fillRect(-14, -12, 6, 4); }
            else if (isMoving) { const flap = Math.sin(p.fr * Math.PI / 2) * 2; ctx.fillRect(-14, 2 + flap, 10, 4); ctx.fillRect(-16, 4 + flap, 6, 4); }
            else { ctx.fillRect(-9, 3, 6, 6); ctx.fillRect(-11, 7, 5, 4); }

            // 몸통
            ctx.fillStyle = "#1a1a25"; ctx.fillRect(-6, 2, 12, 6);
            ctx.fillStyle = "#2a2a35"; ctx.fillRect(-5, 2, 10, 5);
            
            // 머리통
            ctx.fillStyle = "#f8f8fa"; ctx.fillRect(-6, -10, 14, 10); ctx.fillRect(-7, -8, 16, 6);
            
            // 직업별 얼굴 특징
            if (Game.pClass === 1) {
                ctx.fillStyle = "#cc2200"; ctx.fillRect(-5, -10, 2, 8); ctx.fillRect(-3, -8, 2, 4); ctx.fillRect(1, -10, 2, 8); ctx.fillRect(-1, -8, 2, 4);
                ctx.fillStyle = "#991100"; ctx.fillRect(2, -4, 5, 1); ctx.fillRect(-4, -3, 3, 1);
            } else if (Game.pClass === 2) {
                ctx.fillStyle = "#004477"; ctx.beginPath(); ctx.moveTo(1, -22); ctx.lineTo(-8, -10); ctx.lineTo(10, -10); ctx.fill();
                ctx.fillStyle = mColMain; ctx.fillRect(-10, -10, 22, 2); 
            } else { 
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

            // 버서커 어깨
            if (Game.pClass === 3) {
                ctx.fillStyle = "#555"; ctx.fillRect(-8, -8, 4, 6); ctx.fillRect(5, -8, 4, 6); 
                ctx.fillStyle = "#888"; ctx.fillRect(-7, -8, 3, 5); ctx.fillRect(5, -8, 3, 5);
            }

            // ==========================================
            // 3. 무기 및 액션 모션
            // ==========================================
            if (p.plunging || Game._berserkSlam || (Game.pClass === 4 && (p.atkT || 0) > 0 && !p.onGround)) {
                if (Game.pClass === 4) {
                    ctx.save(); ctx.translate(5, 5); ctx.rotate(Math.PI * 0.25); drawBone(false, 4); ctx.restore();
                } else if (Game.pClass === 3 && (p.plunging || Game._berserkSlam)) {
                    // 💡 버서커 강하/스킬 사용 시 완벽한 궤도 및 회전
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
                let isLastHit = (Game.pClass === 1 && p.combo === 5) || (Game.pClass === 3 && p.combo === 2) || (Game.pClass !== 1 && Game.pClass !== 3 && p.combo === 3);
                const maxAnim = isLastHit ? 20 : 12; 
                const progress = Math.max(0, 1 - ((p.atkAnim || 0) / maxAnim)); 
                let angle = 0;
                
                // 정상적인 타격 회전 각도
                if (!isLastHit) { 
                    if (p.combo % 2 === 1) { angle = -Math.PI * 0.7 + (Math.PI * 1.4 * progress); } else { angle = Math.PI * 0.7 - (Math.PI * 1.4 * progress); } 
                } else { 
                    if (progress < 0.3) { angle = -Math.PI * 0.8 - (progress * 1.5); } else { const p2 = (progress - 0.3) / 0.7; angle = -Math.PI * 1.2 + (Math.PI * 2.2 * p2); } 
                }
                
                if (Game.pClass === 4) {
                    ctx.rotate(0); drawBone(false, 4);
                } else if (Game.pClass === 5) {
                    // 💡 팔라딘 십자가 이펙트 (기둥 완벽 삭제)
                    ctx.rotate(angle); drawBone(isLastHit, 5);
                    const fA = progress;
                    if (fA > 0.1 && fA < 0.9) {
                        const hitX = 10 + (Game.pRangeBonus||0)/2;
                        ctx.strokeStyle = `rgba(255, 220, 0, ${fA})`; ctx.lineWidth = 4 + (1-fA)*4; 
                        ctx.beginPath(); ctx.arc(hitX, 0, 10 + (1-fA)*25, 0, Math.PI*2); ctx.stroke();
                        ctx.fillStyle = `rgba(255, 255, 150, ${fA*0.4})`; ctx.fill();
                        
                        ctx.fillStyle = `rgba(255, 255, 200, ${fA*0.8})`;
                        ctx.fillRect(hitX - 2, -25 * fA, 4, 50 * fA); 
                        ctx.fillRect(hitX - 25 * fA, -2, 50 * fA, 4); 
                    }
                } else {
                    ctx.rotate(angle); drawBone(isLastHit, Game.pClass);
                }
                if (Game.pClass === 1) { ctx.save(); ctx.translate(-15, 0); ctx.rotate(-Math.PI * 0.5); drawBone(false, 1); ctx.restore(); }
                ctx.restore();
            } else { 
                ctx.save();
                if (Game.pClass === 3) {
                    ctx.translate(3, 8); ctx.rotate(Math.PI * 0.6 + armRot * 0.3); drawBone(false, 3);
                } else if (Game.pClass === 4) {
                    ctx.translate(5, 3); drawBone(false, 4);
                } else {
                    ctx.translate(5, 5); ctx.rotate(armRot * 0.5); drawBone(false, Game.pClass);
                }
                if (Game.pClass === 1) { ctx.save(); ctx.translate(-15, 0); ctx.rotate(-Math.PI * 0.2); drawBone(false, 1); ctx.restore(); }
                if (Game.pClass === 5) {
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