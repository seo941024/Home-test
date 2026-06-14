// ==========================================
// 보스 AI 및 패턴 모듈 (Boss AI)
// ==========================================

// 레이저 시작점에서 facing 방향으로 플랫폼까지의 거리를 계산 — 레이저 충돌 길이 결정
function calcLaser(startX, startY, height, facing) {
    let minHitDist = Game.levelW;
    for (const t of Game.platforms) {
        if (t.y < startY + height && t.y + t.h > startY) {
            if (facing > 0 && t.x > startX) minHitDist = Math.min(minHitDist, t.x - startX);
            else if (facing < 0 && t.x + t.w < startX) minHitDist = Math.min(minHitDist, startX - (t.x + t.w));
        }
    }
    return { x: facing > 0 ? startX : Math.max(0, startX - minHitDist), w: minHitDist };
}

// ==========================================
// 잡몹 원거리 공격 - 경고 방향과 발사 방향 완전 일치
// ==========================================

// 잡몹 원거리 공격 실행 — warnData의 방향 정보로 경고와 발사 방향을 1:1 일치
function fireEnemyRanged(e) {
    const wd = e.warnData;
    if (!wd) return;

    if (e.type === "ranged_bullet") {
        const ang    = wd.ang;
        const count  = e.isElite ? 3 : 1;
        const spread = e.isElite ? 0.18 : 0;
        // 속도 대폭 상향 — 선딜 길게 줬으니 발사 후엔 빠르게
        const bSpd = e.isElite ? 11 : 9;
        for (let s = -count; s <= count; s += (e.isElite ? 1 : 2)) {
            spawnEBullet(
                e.x + e.w / 2, e.y + e.h / 2,
                Math.cos(ang + s * spread) * bSpd,
                Math.sin(ang + s * spread) * bSpd,
                70, 5, e.atk,
                false   // 중력 없음 — 직선 묵직하게
            );
        }
        playSfx('mob_laser');
    } else if (e.type === "ranged_laser") {
        const facing  = wd.facing;
        const originX = facing > 0 ? e.x + e.w : e.x;
        const laserY  = e.y + e.h / 2 - 3;
        const lBox    = calcLaser(originX, laserY, e.isElite ? 10 : 6, facing);
        spawnLaser(lBox.x, laserY, lBox.w, e.isElite ? 10 : 6, 12, "#ff3300", e.atk, false);
        playSfx('mob_laser');
    }
}


// ── 페이즈2 돌입 시 연계 콤보 패턴 큐 반환 ──────────────
// 월드별로 연속 발동할 ap 인덱스 배열 반환
// 예: [0, 1] → ap0 발동 후 35프레임 뒤 ap1 발동
function _getBossP2Combo(w) {
    const combos = {
        1:  [0, 2, 1],         // 슬래시 → 회전슬래시 → 충격파
        2:  [2, 0, 1],         // 도끼투척 → 슬래시 → 충격파
        3:  [0, 3, 1],         // 레이저 → 뼈기둥 → 화살
        4:  [2, 3, 0],         // 확산 → 도끼투척 → 슬래시
        5:  [3, 1, 0],         // 돌진충격파 → 전방위 → 레이저
        6:  [3, 2, 1],         // 저주봉인 → 낙뢰 → 유도탄  (파괴된 더스크)
        7:  [3, 0, 2],         // 사방난무 → 2단레이저 → 전방위
        8:  [3, 0, 1, 3],      // 돌진대검 → 포격 → 레이저 → 돌진대검
        9:  [2, 3, 1],         // 소용돌이 → 영혼낫 → 영혼탄
        10: [0, 3, 1, 2, 3],   // 낙뢰 → 광란탄막 → 지옥의문 → 강림 → 광란탄막
    };
    return [...(combos[w] || [0, 1])]; // 복사본 반환
}



// ── 인간형 소형 보스 AI (Agile Boss) ──
// 플레이어와 비슷한 크기, 빠르고 빈틈없는 엇박자 공격
// w3(스켈레톤 듀얼리스트), w7(마족 암살자)에 사용
const AgileBossAI = {
    3: (e, oX, spd, dmg, p2, wd) => {
        // 스켈레톤 듀얼리스트 — 빠른 접근 후 연속 베기
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (wd.ap === 0) {
            // 앞으로 돌진하며 3연타 투사체
            for (let i = 0; i < 3; i++) {
                const ang = wd.facing > 0 ? 0 : Math.PI;
                spawnEBullet(cx, cy, Math.cos(ang) * (10 + i * 2) * spd,
                    Math.sin(ang) * 2, 50, 4, Math.floor(dmg * 0.7));
            }
            // 돌진
            e.vx = e.facing * 7;
        } else if (wd.ap === 1) {
            // 순간이동 후 등 뒤 공격
            const p = Game.player;
            e.x = p.x - e.facing * 30;
            e.y = p.y;
            e.vx = 0; e.vy = 0;
            addText(e.x, e.y - 20, "순간이동!", "#aaaaff", 30, 14);
            for (let i = 0; i < 8; i++) addPart(e.x + e.w/2, e.y + e.h/2, "#aaaaff", 20, 3);
            // 등 뒤에서 즉시 타격
            if (typeof takeDmg === 'function') takeDmg(dmg, e);
        } else {
            // 전방위 뼈 파편
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                spawnEBullet(cx, cy, Math.cos(a) * 7 * spd, Math.sin(a) * 7 * spd, 60, 4, Math.floor(dmg * 0.5));
            }
        }
    },
    7: (e, oX, spd, dmg, p2, wd) => {
        // 마족 암살자 — 기습, 연막, 독침
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (wd.ap === 0) {
            // 고속 직선 독침 3발
            const ang = Math.atan2(Game.player.y - cy, Game.player.x - cx);
            for (let i = -1; i <= 1; i++) {
                spawnEBullet(cx, cy, Math.cos(ang + i * 0.15) * 12 * spd,
                    Math.sin(ang + i * 0.15) * 12 * spd, 55, 4, dmg, false, true);
            }
        } else if (wd.ap === 1) {
            // 순간이동 4회 연속 포위
            // setTimeout 대신 보스 자체 타이머로 처리 — 씬 전환 후 잔류 방지
            const p = Game.player;
            const offsets = [[-60,0],[60,0],[0,-50],[0,30]];
            if (!e._blinkQueue) e._blinkQueue = [];
            offsets.forEach((off, i) => {
                e._blinkQueue.push({ off, delay: i * 7, timer: 0 }); // 7프레임 간격
            });
        } else {
            // 하늘에서 연속 낙하 투사체
            const p = Game.player;
            for (let i = 0; i < 5; i++) {
                spawnEBullet(p.x - 60 + i * 30, 0, 0, 9 * spd, 180, 5, dmg, false, false, true);
            }
        }
    }
};

// ==========================================
// 보스 패턴 AI - 경고 → 발사 완전 일치, 월드별 다채로운 패턴
// ==========================================

/*
  패턴 선택 구조:
  - e.ap = 패턴 인덱스 (BossAI 내부에서 warnData.ap 기준으로 분기)
  - warnT 가 0 이 되는 순간 실제 발사
  - 경고 표시(render.js)와 여기 발사 코드가 ap 기준으로 1:1 대응되어야 함
*/

const BossAI = {

    // ── W1 고블린 킹: 철퇴 휘두르기 / 점프 폭발 / 2페이즈: 연속 투사체
   1: (e, oX, spd, dmg, p2, wd) => {
        if (wd.ap === 0) {
            // 전방 근접 철퇴 휘두르기 — 범위 크게
            const slashX = e.facing > 0 ? e.x + e.w - 15 : e.x - 100;
            spawnLaser(slashX, e.y - 25, 115, e.h * 1.8, 18, "#ff5500", Math.floor(dmg * 1.2), false, false);
            e.vx = e.facing * 8;
            Game.camShake = 12; playSfx('boss_atk');
        } else if (wd.ap === 1) {
            // 점프 후 지면 강타 충격파 — 경고 범위와 일치, 넓게
            e.vy = -13;
            e.vx = e.facing * 3;
            setTimeout(() => {
                if (!e.dead) {
                    spawnLaser(e.x - 45, e.y + e.h - 20, e.w + 90, 55, 22, "#cc3300", Math.floor(dmg * 1.6), false, false);
                    Game.camShake = 18; playSfx('boss_atk');
                }
            }, 400);
        } else {
            // 회전 슬래시 — 보스 주위 원형 광역 타격
            spawnLaser(e.x - 45, e.y - 45, e.w + 90, e.h + 90, 16, "#ff5500", Math.floor(dmg * 1.1), false, false);
            e.vx = 0;
            Game.camShake = 16; playSfx('boss_atk');
        }
    },

    // ── W2 언데드 고블린 킹: 더 빠르고 연속적인 근접 공격 ──
    2: (e, oX, spd, dmg, p2, wd) => {
        if (wd.ap === 0) {
            // 전방 근접 슬래시 (범위 크게)
            const doSlash = (delay) => {
                setTimeout(() => {
                    if (!e.dead) {
                        const slashX = e.facing > 0 ? e.x + e.w - 10 : e.x - 95;
                        spawnLaser(slashX, e.y - 20, 105, e.h * 1.6, 14, "#ff2200", Math.floor(dmg * 1.1), false, false);
                        e.vx = e.facing * 9; Game.camShake = 10;
                    }
                }, delay);
            };
            doSlash(0);
            if (p2) doSlash(350);
        } else if (wd.ap === 1) {
            // 점프 후 지면 충격파 (W2도 동일 패턴, 좀 더 큰 범위)
            e.vy = -12; e.vx = e.facing * 4;
            setTimeout(() => {
                if (!e.dead) {
                    spawnLaser(e.x - 50, e.y + e.h - 18, e.w + 100, 55, 18, "#aa1100", Math.floor(dmg * 1.5), false, false);
                    Game.camShake = 15; playSfx('boss_atk');
                }
            }, 380);
        } else {
            // 도끼 투척 — 중력 적용 광역 투사체
            const cx2 = e.x + e.w / 2, cy2 = e.y + e.h / 2;
            const ang2 = Math.atan2(Game.player.y - cy2, Game.player.x - cx2);
            spawnEBullet(cx2, cy2, Math.cos(ang2)*7*spd, Math.sin(ang2)*7*spd - 1.5, 160, 10, Math.floor(dmg*1.5), true, true);
            if (p2) {
                spawnEBullet(cx2, cy2, Math.cos(ang2+0.3)*6*spd, Math.sin(ang2+0.3)*6*spd - 1.5, 150, 8, dmg, true, true);
                spawnEBullet(cx2, cy2, Math.cos(ang2-0.3)*6*spd, Math.sin(ang2-0.3)*6*spd - 1.5, 150, 8, dmg, true, true);
            }
            Game.camShake = 10; playSfx('boss_atk');
        }
    },

    // ── W3 스켈레톤 치프틴: 수평 레이저 / 전방 3방향 활 / 2페이즈: 낙하 화살
    3: (e, oX, spd, dmg, p2, wd) => {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (wd.ap === 0) {
            // 수평 레이저 (facing 방향, 정확히 일치)
            const laserY = e.y + e.h / 2 - 5;
            const lBox = calcLaser(oX, laserY, 10, e.facing);
            spawnLaser(lBox.x, laserY, lBox.w, 10, 18, "#ff1111", Math.floor(dmg*1.4), false);
            Game.camShake = 8;
        } else if (wd.ap === 1) {
            // facing 방향 3방향 화살
            const baseAng = e.facing > 0 ? 0 : Math.PI;
            const count = p2 ? 5 : 3;
            for (let s = -(count-1)/2; s <= (count-1)/2; s++) {
                const a = baseAng + s * 0.3;
                spawnEBullet(cx, cy, Math.cos(a)*8*spd, Math.sin(a)*8*spd, 110, 5, dmg, false, false, true);
            }
            playSfx('mob_laser');
        } else if (wd.ap === 2) {
            // 위에서 낙하하는 화살비
            const amt = p2 ? 8 : 5;
            for (let i = 0; i < amt; i++) {
                const tx = Game.player.x + (i - Math.floor(amt/2)) * 40;
                spawnEBullet(tx, 0, 0, 7*spd, 130, 5, dmg, false, false, true);
            }
        } else {
            // 바닥 뼈 기둥 — 플레이어 위치에서 수직 레이저 솟아오름
            const positions3 = p2 ? 5 : 3;
            const baseX3 = wd.targetX || Game.player.x;
            for (let i = 0; i < positions3; i++) {
                const tx = baseX3 + (i - Math.floor(positions3/2)) * 80;
                spawnLaser(tx - 10, CH - 85, 20, 85, 22, "#ddddaa", Math.floor(dmg*1.2), false, true);
            }
            Game.camShake = 10; playSfx('boss_atk');
        }
    },

    // ── W4 언데드 스켈레톤 치프틴: 공격적 근접 + 보조 확산
    4: (e, oX, spd, dmg, p2, wd) => {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        const p = Game.player;
        const dx = p ? p.x - e.x : 0;

        if (wd.ap === 0) {
            // 강력한 대검 내려치기 — 위아래 판정 크게
            const slashX = e.facing > 0 ? e.x + e.w - 10 : e.x - 80;
            spawnLaser(slashX, e.y - 15, 90, e.h * 1.5, 14, "#660000", Math.floor(dmg*1.2), false, false);
            e.vx = e.facing * 6;
            Game.camShake = 12; playSfx('boss_atk');
        } else if (wd.ap === 1) {
            // 전진 슬래시 2연속
            const doSlash = (delay) => {
                setTimeout(() => {
                    if (!e.dead) {
                        const sx = e.facing > 0 ? e.x + e.w - 5 : e.x - 70;
                        spawnLaser(sx, e.y, 75, e.h * 1.1, 8, "#880000", Math.floor(dmg*0.9), false, false);
                        e.vx = e.facing * 8;
                        Game.camShake = 8;
                    }
                }, delay);
            };
            doSlash(0); doSlash(350);
        } else if (wd.ap === 2) {
            // 보조: 2페이즈에서만 소수 확산탄
            if (p2) {
                const amt = 6;
                for (let i = 0; i < amt; i++) {
                    const a = (i / amt) * Math.PI * 2;
                    spawnEBullet(cx, cy, Math.cos(a)*4*spd, Math.sin(a)*4*spd, 70, 5, Math.floor(dmg*0.5));
                }
            } else {
                const slashX = e.facing > 0 ? e.x + e.w - 8 : e.x - 78;
                spawnLaser(slashX, e.y, 86, e.h * 1.2, 10, "#880000", dmg, false, false);
                e.vx = e.facing * 5;
                Game.camShake = 8; playSfx('boss_atk');
            }
        } else {
            // 회전 도끼 투척 — 전방 부채꼴 중력 투사체
            const count4 = p2 ? 5 : 3;
            const baseAng4 = e.facing > 0 ? 0 : Math.PI;
            for (let i = 0; i < count4; i++) {
                const a = baseAng4 + (i - Math.floor(count4/2)) * 0.35;
                spawnEBullet(cx, cy, Math.cos(a)*8*spd, Math.sin(a)*8*spd - 2, 160, 8, Math.floor(dmg*1.2), true, true);
            }
            Game.camShake = 10; playSfx('boss_atk');
        }
    },

    // ── W5 거대 괴수 더스크: 넓은 가로 레이저 / 전방위 / 2페이즈: 추적 탄막
    5: (e, oX, spd, dmg, p2, wd) => {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (wd.ap === 0) {
            // 넓고 긴 수평 레이저 (facing 방향)
            const laserH = p2 ? 100 : 70;
            const laserY = cy - laserH / 2;
            const lBox = calcLaser(oX, laserY, laserH, e.facing);
            spawnLaser(lBox.x, laserY, lBox.w, laserH, 30, "#330066", Math.floor(dmg*2.0), false);
            Game.camShake = 15;
        } else if (wd.ap === 1) {
            // 전방위 탄막
            const amt = p2 ? 24 : 16;
            for (let i = 0; i < amt; i++) {
                const a = (i / amt) * Math.PI * 2;
                spawnEBullet(cx, cy, Math.cos(a)*7*spd, Math.sin(a)*7*spd, 150, 6, dmg);
            }
        } else if (wd.ap === 2) {
            // 플레이어 위치 추적 낙하 폭탄 (중력 적용)
            const amt = p2 ? 6 : 3;
            for (let i = 0; i < amt; i++) {
                const tx = Game.player.x + (i - Math.floor(amt/2)) * 60;
                spawnEBullet(tx, e.y + e.h, (tx - cx) * 0.03, -8, 180, 7, dmg, true, false, false, true);
            }
        } else {
            // 돌진 충격파 — 빠른 수평 이동 후 광역 타격
            e.vx = e.facing * 18;
            setTimeout(() => {
                if (!e.dead) {
                    spawnLaser(e.x - 55, e.y - 25, e.w + 110, e.h + 50, 24, "#552299", Math.floor(dmg*1.8), false, false);
                    e.vx = 0;
                    Game.camShake = 20; playSfx('boss_atk');
                }
            }, 250);
        }
    },

    // ── W6 파괴된 더스크: 같은 방향 3단 레이저 / 추적 유도탄 / 2페이즈: 수직 낙뢰
    6: (e, oX, spd, dmg, p2, wd) => {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (wd.ap === 0) {
            // 플레이어 현재 Y에 정렬된 레이저 (경고 표시와 일치)
            const targetY = Math.max(e.y + 10, Math.min(e.y + e.h - 30, wd.targetY));
            const lBox = calcLaser(oX, targetY, 50, e.facing);
            spawnLaser(lBox.x, targetY, lBox.w, 50, 30, "#ff3300", Math.floor(dmg*2.0), false);
            Game.camShake = 15;
        } else if (wd.ap === 1) {
            // 플레이어 방향 집중 유도탄
            const ang = wd.ang;
            const count = p2 ? 7 : 5;
            for (let s = -(count-1)/2; s <= (count-1)/2; s++) {
                const a = ang + s * 0.12;
                spawnEBullet(cx, cy, Math.cos(a)*8*spd, Math.sin(a)*8*spd, 130, 5, dmg);
            }
        } else if (wd.ap === 2) {
            // 플레이어 위치에 수직 낙뢰 (최대 3개)
            const pX = Game.player.x;
            const offsets = p2 ? [-60, 0, 60] : [0];
            for (const off of offsets) {
                spawnLaser(pX + off - 10, 0, 20, CH, 35, "#ff0055", Math.floor(dmg*1.8), false, true);
            }
            addText(pX, CH - 50, "낙뢰!", "#ff0055", 25, 14);
            Game.camShake = 12;
        } else {
            // 저주의 봉인 — 바닥 지속 장판 다수
            const pX6 = wd.targetX || Game.player.x;
            const count6 = p2 ? 5 : 4;
            for (let i = 0; i < count6; i++) {
                const tx = pX6 + (i - Math.floor(count6/2)) * 90;
                spawnLaser(tx - 18, CH - 35, 36, 35, 45, "#ff0055", Math.floor(dmg*1.6), false, false);
            }
            addText(e.x + e.w/2, e.y - 30, "저주의 봉인", "#ff0055", 30, 12);
            Game.camShake = 14;
        }
    },

    // ── W7 마족 제1친위대장(쌍검): 빠른 수평 2단 레이저 / 대쉬 충격파 / 2페이즈: 난무
    7: (e, oX, spd, dmg, p2, wd) => {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (wd.ap === 0) {
            // 위아래 2단 레이저 (facing 방향, 경고 표시와 동일)
            const y1 = e.y + e.h / 2 - 20;
            const y2 = e.y + e.h / 2 + 10;
            const lBox1 = calcLaser(oX, y1, 14, e.facing);
            const lBox2 = calcLaser(oX, y2, 14, e.facing);
            spawnLaser(lBox1.x, y1, lBox1.w, 14, 22, "#0033ff", Math.floor(dmg*1.6), false);
            spawnLaser(lBox2.x, y2, lBox2.w, 14, 22, "#0033ff", Math.floor(dmg*1.6), false);
            Game.camShake = 10;
        } else if (wd.ap === 1) {
            // 전방 부채꼴 충격파
            const baseAng = e.facing > 0 ? 0 : Math.PI;
            const count = p2 ? 9 : 6;
            for (let s = -(count-1)/2; s <= (count-1)/2; s++) {
                const a = baseAng + s * 0.2;
                spawnEBullet(cx, cy, Math.cos(a)*10*spd, Math.sin(a)*10*spd, 110, 6, dmg);
            }
        } else if (wd.ap === 2) {
            // 전방위 난무 + 수평 레이저 동시
            const amt = p2 ? 20 : 12;
            for (let i = 0; i < amt; i++) {
                const a = (i / amt) * Math.PI * 2;
                spawnEBullet(cx, cy, Math.cos(a)*4, Math.sin(a)*4, 120, 5, Math.floor(dmg*0.8));
            }
            const lBox = calcLaser(oX, cy - 8, 16, e.facing);
            spawnLaser(lBox.x, cy - 8, lBox.w, 16, 18, "#0055ff", Math.floor(dmg*1.2), false);
            Game.camShake = 8;
        } else {
            // 사방 난무 — 전방위 가로 레이저 + 수직 십자 타격
            spawnLaser(0, cy - 8, Game.levelW, 16, 16, "#0044ff", Math.floor(dmg*1.2), false);
            spawnLaser(cx - 10, 0, 20, CH, 16, "#0044ff", Math.floor(dmg*1.2), false, true);
            if (p2) {
                spawnLaser(0, cy + 20, Game.levelW, 16, 16, "#0066ff", Math.floor(dmg*1.0), false);
            }
            addText(cx, cy - 30, "사방 난무!", "#0044ff", 30, 12);
            Game.camShake = 16;
        }
    },

    // ── W8 마족 제2친위대장(대검): 수직 낙하 포격 / 광역 충격파 / 2페이즈: 연속 슬래시
    8: (e, oX, spd, dmg, p2, wd) => {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (wd.ap === 0) {
            // 플레이어 현재 위치에 포격 (경고 X 위치와 일치)
            const pX = wd.targetX || Game.player.x;
            const cols = p2 ? 5 : 3;
            for (let i = 0; i < cols; i++) {
                const tx = pX + (i - Math.floor(cols/2)) * 35;
                spawnLaser(tx - 10, 0, 20, CH, 40, "#ff6600", Math.floor(dmg*2.2), false, true);
            }
            addText(pX, CH - 60, "탄막!", "#ff6600", 30, 14);
            Game.camShake = 18;
        } else if (wd.ap === 1) {
            // 넓은 광역 충격파 레이저 (facing 방향)
            const lBox = calcLaser(oX, cy - 20, 40, e.facing);
            spawnLaser(lBox.x, cy - 20, lBox.w, 40, 25, "#ff3300", Math.floor(dmg*2.0), false);
            Game.camShake = 12;
        } else if (wd.ap === 2) {
            // 위에서 쏟아지는 화살비
            const amt = p2 ? 16 : 10;
            for (let i = 0; i < amt; i++) {
                const tx = Game.player.x + (Math.random() - 0.5) * 400;
                spawnEBullet(tx, 0, 0, 8*spd, 200, 6, dmg, false, true, true);
            }
        } else {
            // 전속력 돌진 대검 — 빠른 이동 후 대형 슬래시
            e.vx = e.facing * 20;
            setTimeout(() => {
                if (!e.dead) {
                    const sx = e.facing > 0 ? e.x + e.w - 15 : e.x - 100;
                    spawnLaser(sx, e.y - 30, 115, e.h * 2.0, 20, "#ff3300", Math.floor(dmg*2.0), false, false);
                    e.vx = 0;
                    Game.camShake = 22; playSfx('boss_atk');
                }
            }, 200);
        }
    },

    // ── W9 마족 제3친위대장(사신): 플레이어 추적 낙뢰 / 영혼 유도탄 / 2페이즈: 죽음의 소용돌이
    9: (e, oX, spd, dmg, p2, wd) => {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (wd.ap === 0) {
            // 플레이어 위치 3연속 낙뢰
            const pX = wd.targetX || Game.player.x;
            const count = p2 ? 4 : 2;
            for (let i = 0; i < count; i++) {
                // 약간의 딜레이 효과를 위해 위치 분산
                const tx = pX + i * 30 * e.facing;
                spawnLaser(tx - 12, 0, 24, CH, 30 + i * 8, "#aa00ff", Math.floor(dmg*2.0), false, true);
            }
            Game.camShake = 15;
        } else if (wd.ap === 1) {
            // 플레이어 추적 8방향 영혼탄
            const ang = wd.ang;
            const amt = p2 ? 12 : 8;
            for (let i = 0; i < amt; i++) {
                const a = ang + (i - Math.floor(amt/2)) * 0.15;
                spawnEBullet(cx, cy, Math.cos(a)*7*spd, Math.sin(a)*7*spd, 150, 6, dmg, false, true);
            }
            addText(cx, cy - 30, "영혼 수확", "#aa00ff", 25, 12);
        } else if (wd.ap === 2) {
            // 죽음의 소용돌이 - 나선형 전방위
            const amt = p2 ? 28 : 18;
            const offset = (Game.frameCount * 0.05) % (Math.PI * 2);
            for (let i = 0; i < amt; i++) {
                const a = (i / amt) * Math.PI * 2 + offset;
                const s2 = 3 + (i % 3) * 1.5;
                spawnEBullet(cx, cy, Math.cos(a)*s2, Math.sin(a)*s2, 160, 5, dmg);
            }
            Game.camShake = 10;
        } else {
            // 영혼의 낫 — 대형 고속 관통 투사체
            const ang9 = wd.ang;
            const count9 = p2 ? 3 : 1;
            for (let i = 0; i < count9; i++) {
                const a = ang9 + (i - Math.floor(count9/2)) * 0.22;
                spawnEBullet(cx, cy, Math.cos(a)*6*spd, Math.sin(a)*6*spd, 200, 16, Math.floor(dmg*2.2), false, true);
            }
            addText(cx, cy - 30, "영혼의 낫", "#aa00ff", 35, 14);
            Game.camShake = 14;
        }
    },

    // ── W10 마왕: 3가지 서명 패턴, 2페이즈에서 확장
    10: (e, oX, spd, dmg, p2, wd) => {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        const pX = wd.targetX || (Game.player.x + Game.player.w / 2);
        const pY = wd.targetY || (Game.player.y + Game.player.h / 2);

        if (wd.ap === 0) {
            // ── 왕관의 뇌격: 5줄기 낙뢰가 플레이어 주변에 내리꽂힘
            const strikes = p2 ? 7 : 5;
            const spread = p2 ? 110 : 80;
            for (let i = 0; i < strikes; i++) {
                const ox = (i - Math.floor(strikes / 2)) * spread / (strikes - 1);
                const lx = pX + ox - 14;
                spawnLaser(lx, 0, 28, CH, 45, i === Math.floor(strikes/2) ? "#ff2200" : "#cc0044",
                    Math.floor(dmg * (i === Math.floor(strikes/2) ? 2.8 : 2.0)), false, true);
            }
            // P2: 동시에 플레이어 높이 수평 레이저
            if (p2) {
                const lBox = calcLaser(oX, pY - 10, 20, e.facing);
                spawnLaser(lBox.x, pY - 10, lBox.w, 20, 35, "#880000", Math.floor(dmg * 1.8), false);
            }
            addText(cx, cy - 50, "왕관의 뇌격", "#ff2200", 40, 14);
            Game.camShake = 22;

        } else if (wd.ap === 1) {
            // ── 지옥의 문: 2파 탄막 — 1파 방사형, 2파 사이사이 채움
            const amt = p2 ? 24 : 18;
            // 1파
            for (let i = 0; i < amt; i++) {
                const a = (i / amt) * Math.PI * 2;
                spawnEBullet(cx, cy, Math.cos(a) * 5.5 * spd, Math.sin(a) * 5.5 * spd, 200, 7, dmg);
            }
            // 2파 (사이사이, 약간 빠름)
            const amt2 = p2 ? amt : Math.floor(amt / 2);
            for (let i = 0; i < amt2; i++) {
                const a = ((i + 0.5) / amt) * Math.PI * 2;
                const delay = p2 ? 18 : 22;
                // 지연 발사를 위해 느린 탄으로 시뮬레이션
                spawnEBullet(cx, cy, Math.cos(a) * 3.2 * spd, Math.sin(a) * 3.2 * spd, 240, 6, Math.floor(dmg * 0.8));
            }
            addText(cx, cy - 50, "지옥의 문", "#ff0000", 45, 16);
            Game.camShake = 28;

        } else if (wd.ap === 2) {
            // ── 어둠의 강림: 플레이어 추적 운석 + 바닥 어둠 확산
            const amt = p2 ? 8 : 5;
            for (let i = 0; i < amt; i++) {
                // 운석은 플레이어 위치를 기준으로 균등 분산
                const spread = 300;
                const tx = pX + (i - Math.floor(amt / 2)) * (spread / Math.max(amt - 1, 1));
                spawnEBullet(tx, -30, (Math.random() - 0.5) * 1.5, 9 * spd,
                    280, 10, Math.floor(dmg * 1.4), false, true, true, true);
            }
            // P2: 마왕 위치에서 방사형 탄 추가
            if (p2) {
                const radAmt = 8;
                for (let i = 0; i < radAmt; i++) {
                    const a = (i / radAmt) * Math.PI * 2;
                    spawnEBullet(cx, cy, Math.cos(a) * 4 * spd, Math.sin(a) * 4 * spd, 200, 7, dmg);
                }
            }
            addText(cx, cy - 50, "어둠의 강림", "#880044", 38, 14);
            Game.camShake = 18;
        } else {
            // ── 광란의 탄막: 전방위 고속 + 3연 낙뢰 동시
            const radAmt2 = p2 ? 32 : 22;
            for (let i = 0; i < radAmt2; i++) {
                const a = (i / radAmt2) * Math.PI * 2;
                spawnEBullet(cx, cy, Math.cos(a)*9*spd, Math.sin(a)*9*spd, 220, 7, dmg, false, true);
            }
            const strikes10 = p2 ? 5 : 3;
            for (let i = 0; i < strikes10; i++) {
                const tx = pX + (i - Math.floor(strikes10/2)) * 65;
                spawnLaser(tx - 12, 0, 24, CH, 40, "#ff2200", Math.floor(dmg*2.5), false, true);
            }
            addText(cx, cy - 50, "광란의 탄막!", "#ff0000", 50, 16);
            Game.camShake = 28;
        }
    }
};

// 보스 매 프레임 업데이트 — 그로기·2페이즈 전환·패턴 쿨다운·BossAI 호출 처리
function updateBoss(e) {
    // 씬 전환 시 잔류 큐 초기화
    if (!e.active || e.dead) {
        if (e._blinkQueue) e._blinkQueue = [];
        return;
    }

    // AgileBoss 순간이동 큐 — setTimeout 대신 프레임 단위 처리 (씬 전환 잔류 방지)
    if (e._blinkQueue && e._blinkQueue.length > 0) {
        const bq = e._blinkQueue[0];
        bq.timer = (bq.timer || 0) + 1;
        if (bq.timer >= bq.delay) {
            e._blinkQueue.shift();
            const pq = Game.player;
            if (pq && !e.dead && Game.gs === "play") {
                e.x = pq.x + bq.off[0]; e.y = pq.y + bq.off[1];
                spawnEBullet(e.x + e.w/2, e.y + e.h/2,
                    -bq.off[0] * 0.15, -bq.off[1] * 0.15, 40, 9, Math.floor(e.atk * 0.6));
                for (let pi = 0; pi < 6; pi++) addPart(e.x + e.w/2, e.y + e.h/2, "#aa00ff", 15, 3);
            }
        }
    }

    const p = Game.player;
    if (!p || p.dead) return;

    // 그로기(스턴) 중: 이동/공격 정지, 빨간 깜빡임
    if (e.stun) {
        e.vx = 0;
        e.vy = Math.min(e.vy + GRAV, 10);
        e.y += e.vy;
        if (typeof resolveAABB === 'function') resolveAABB(e);
        if (Game.frameCount % 6 < 3) e.flash = 3;
        return;
    }

    const isP2 = e.hp < e.maxHp * 0.5; 
    e.phase = isP2 ? 2 : 1; 
    
    const w = e.world; 
    const isFlying = w >= 5 && w < 10;

    // ── 페이즈2 돌입 연출 (HP 50% 최초 돌파 시 1회) ──
    if (isP2 && !e.p2Triggered) {
        e.p2Triggered = true;
        const kbDur = w === 10 ? 70 : 50;
        e.kbT = kbDur;
        Game.camShake = w === 10 ? 45 : 30;
        Game.hitStop = w === 10 ? 14 : 8;
        const p2Label = w === 10 ? "각성" : "PHASE 2 !";
        const p2Color = w === 10 ? "#ff2200" : "#ff0000";
        addText(e.x + e.w/2, e.y - 30, p2Label, p2Color, 80, w === 10 ? 28 : 22);
        const partAmt = w === 10 ? 80 : 40;
        for (let i = 0; i < partAmt; i++) addPart(e.x + e.w/2, e.y + e.h/2, p2Color, 45, 6);
        e.comboQueue = _getBossP2Combo(w);
        e.comboDelay = 0;
        if (typeof playSfx === 'function') playSfx('phase2');
    }

    // ── 광란 상태 돌입 (HP 20% 최초 돌파 시 1회) ──
    const isEnrageNow = e.hp < e.maxHp * 0.2;
    if (isEnrageNow && !e.enrageTriggered) {
        e.enrageTriggered = true;
        e.kbT = 30;
        Game.camShake = 35;
        Game.hitStop = 10;
        addText(e.x + e.w/2, e.y - 50, w === 10 ? "광란" : "격노!!", "#ff6600", 70, 20);
        for (let i = 0; i < 50; i++) addPart(e.x + e.w/2, e.y + e.h/2, "#ff4400", 50, 7);
        if (typeof playSfx === 'function') playSfx('boss_atk');
    }

    // ── 연계 콤보 큐 처리 ──
    if (e.comboQueue && e.comboQueue.length > 0 && e.warnT <= 0 && e.atkAnim <= 0 && e.kbT <= 0) {
        e.comboDelay--;
        if (e.comboDelay <= 0) {
            const nextAp = e.comboQueue.shift();
            const dx2 = Game.player.x - e.x, dy2 = Game.player.y - e.y;
            e.warnData = {
                ang: Math.atan2(dy2, dx2), facing: e.facing,
                ap: nextAp, targetY: Game.player.y + 9, targetX: Game.player.x + 7
            };
            e.warnT = 28; // 연계 예고
            e._warnBase = 28;
            e.comboDelay = 30; // 다음 연계까지 간격
        }
    }
    
    e.isRevived = [2, 4, 6].includes(w); 
    const spdMod = e.isRevived ? 1.5 : 1.0; 
    
    if (isFlying) {
        e.vy += ((p.y - 60) - e.y) * 0.05;
        e.vy *= 0.85; 
        e.onGround = false;
        if (w === 5 || w === 6) {
            e.y = Math.max(150, Math.min(e.y, CH - 250));
        }
    } else {
        e.vy = Math.min(e.vy + GRAV, 10); 
    }
    
    e.vy = Math.max(-20, Math.min(20, e.vy));
    e.vx = Math.max(-15, Math.min(15, e.vx));
    
    const dx = p.x + p.w / 2 - (e.x + e.w / 2);
    const dy = p.y + p.h / 2 - (e.y + e.h / 2);
    if (!e.warnT && e.atkAnim <= 0) e.facing = dx > 0 ? 1 : -1; 
    
    let currentSpd = (isP2 ? 3.0 + w * 0.1 : 2.0 + w * 0.1) * spdMod; 
    
    if (e.atkAnim > 0) e.atkAnim--;
    if (e.kbT > 0) { 
        e.kbT--; e.vx *= 0.88; 
    } else if (e.warnT > 0) {
        e.warnT--; e.vx = 0; 
        if (e.warnT <= 0) {
            e.atkAnim = 20; 
            if(typeof playSfx === 'function') playSfx('boss_atk');
            
            const wd = e.warnData;
            const originX = wd.facing > 0 ? e.x + e.w : e.x;
            const bDmg = e.atk;
            const spdM = (isP2 ? 1.4 : 1.1) * spdMod; 
            
            // 순간이동 (고속 보스)
            if ((w === 2 || w === 7 || w === 10) && isP2 && Math.random() < 0.4) { 
                let targetX = p.x - e.facing * 50;
                let targetY = isFlying ? p.y - 60 : p.y - 10;
                e.x = Math.max(60, Math.min(Game.levelW - e.w - 60, targetX));
                e.y = isFlying ? targetY : Math.min(CH - 40 - e.h, targetY); 
                e.vx = 0; e.vy = 0;
                e.kbT = 35; 
                addText(e.x, e.y - 25, "순간이동!", "#aa00ff", 40, 18); 
                for (let i = 0; i < 15; i++) addPart(e.x + e.w/2, e.y + e.h/2, "#aa00ff", 20, 4);
            }

            // 소용돌이 끌어당기기 (w5, w9, w10)
            if ((w === 5 || w === 9 || w === 10) && isP2 && Math.random() < 0.3) { 
                p.vx -= Math.sign(dx) * 10; p.vy = -3; 
                addText(p.x, p.y, "당겨짐!", "#cc00ff", 30, 20); 
            }
            
            // 메인 BossAI 우선 — AgileBossAI는 BossAI 없을 때만 폴백
            if (BossAI[w]) {
                BossAI[w](e, originX, spdM, bDmg, isP2, wd);
            } else if (AgileBossAI && AgileBossAI[w]) {
                AgileBossAI[w](e, originX, spdM, bDmg, isP2, wd);
            }

            // P2 동반 공격 — W1~6, 몸통 충돌 제거 보완
            if (isP2 && w >= 1 && w <= 6) {
                const _cx = e.x + e.w / 2, _cy = e.y + e.h / 2;
                const _pX = p.x + p.w / 2, _pY = p.y + p.h / 2;
                if (w <= 2) {
                    // W1~2: 전방 확산 3탄
                    for (let i = -1; i <= 1; i++) {
                        const _a = (e.facing > 0 ? 0 : Math.PI) + i * 0.28;
                        spawnEBullet(_cx, _cy, Math.cos(_a) * 5, Math.sin(_a) * 5, 95, 5, Math.floor(bDmg * 0.55));
                    }
                } else if (w <= 4) {
                    // W3~4: 플레이어 조준 2발
                    const _a = Math.atan2(_pY - _cy, _pX - _cx);
                    spawnEBullet(_cx, _cy, Math.cos(_a) * 9, Math.sin(_a) * 9, 110, 5, Math.floor(bDmg * 0.65));
                    spawnEBullet(_cx, _cy, Math.cos(_a + 0.22) * 8, Math.sin(_a + 0.22) * 8, 100, 5, Math.floor(bDmg * 0.50));
                } else {
                    // W5~6: 플레이어 위치 낙하탄 2발
                    spawnEBullet(_pX - 35, 0, 0, 7 * spdM, 150, 6, Math.floor(bDmg * 0.65), false, false, true);
                    spawnEBullet(_pX + 35, 0, 0, 7 * spdM, 150, 6, Math.floor(bDmg * 0.65), false, false, true);
                }
            }
        }
    } else {
        e.mT -= (w === 10 ? 1.5 : 1); 
        if (e.mT <= 0) { 
            // 2페이즈: 이동 주기 단축 + 순간이동 더 자주
        e.mT = isP2 ? 30 : 65; // 공속 감소 
            if (dx * dx > 62500) currentSpd *= 2.2;
            // w1~4: 근접형 — 플레이어에게 더 적극적으로 붙음
            if (w <= 4 && dx * dx > 8000) currentSpd *= 1.5;
            if (!isFlying && e.onGround && dy < -60 && Math.random() < 0.7) { e.vy = -9; } 
        }
        e.vx = e.facing * currentSpd; 
        e.sT--;
        
        if (e.sT <= 0) {
            // 패턴 인터벌: 후반 월드일수록 빠름, 광란 상태에서 더 빠름
            const isEnrage = e.hp < e.maxHp * 0.2;
            let baseInterval = w <= 4 ? 130 : 90;
            e.sI = Math.max(70, baseInterval - w * 3);
            const p2Mul = isP2 ? (w >= 8 ? 0.70 : 0.80) : 1.0;
            const engageMul = isEnrage ? 0.80 : 1.0;
            e.sT = Math.floor(e.sI * p2Mul * engageMul * (e.isRevived ? 0.85 : 1.0));

            // 패턴 순환
            const maxAp = w >= 7 ? 4 : (w >= 3 ? 4 : 3);
            if (isP2 && w >= 6 && (e.patternSeq % 2 === 0)) {
                // P2 짝수 순번: 이전 패턴 강화 반복
            } else {
                e.patternSeq = (e.patternSeq + 1) % maxAp;
                e.ap = e.patternSeq;
            }

            // 선딜레이 — 월드 높을수록 짧아짐
            const warnBase = w <= 2 ? 72 : w <= 4 ? 62 : w <= 6 ? 55 : w <= 8 ? 50 : 42;
            e.warnT = Math.floor(warnBase * (isEnrage ? 0.80 : 1.0));
            e._warnBase = e.warnT; // 렌더링 정규화용

            // warnData에 발사 시점의 플레이어 위치 스냅샷 저장
            e.warnData = {
                ang:     Math.atan2(dy, dx),
                facing:  e.facing,
                ap:      e.ap,
                targetY: p.y + p.h / 2,
                targetX: p.x + p.w / 2
            };
            e.vx = 0;
        }
    }

    if (e.atkAnim > 0) { e.vx = 0; }

    const attemptedVx = e.vx;
    e.x += e.vx;
    e.y += e.vy;

    if (typeof resolveAABB === 'function') resolveAABB(e); 
    // 구석에 몰리면 반발 — 플레이어 쪽으로 돌아오게
    const edgeMargin = 80;
    if (e.x < edgeMargin) {
        e.vx = Math.abs(e.vx) + 1.5;   // 왼쪽 벽 반발
        e.facing = 1;
    } else if (e.x > Game.levelW - e.w - edgeMargin) {
        e.vx = -(Math.abs(e.vx) + 1.5); // 오른쪽 벽 반발
        e.facing = -1;
    }
    e.x = Math.max(0, Math.min(Game.levelW - e.w, e.x));

    if (!isFlying && e.onGround && attemptedVx !== 0 && e.vx === 0 && e.atkAnim <= 0 && e.warnT <= 0) {
        e.vy = -9;
    }

    if (Game.invT === 0 && (Game.difficulty || 0) >= 3 && typeof overlap === 'function' && overlap(Game.player, { x: e.x, y: e.y, w: e.w, h: e.h }) && !Game.player.dead) {
        if(typeof takeDmg === 'function') takeDmg(e.atk, e);
    }
    if (e.y > CH + 60) e.dead = true;
}