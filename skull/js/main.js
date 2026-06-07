// ==========================================
// 메인 게임 로직 및 업데이트 루프 (Main Logic & Loop)
// ==========================================

function updateEnvironment() {
    Game.platforms.forEach(t => { 
        if (t.vx) { 
            t.x += t.vx; 
            if (t.x < t.boundL || t.x > t.boundR) t.vx *= -1; 
        } 
        if (t.drop) {
            if (Game.player && Game.player.onGround && Game.player.riding === t && Game.gs !== "dead") { 
                t.fallActive = true; 
            }
            if (t.fallActive) {
                t.fallTimer = (t.fallTimer || 0) + 1;
                if (t.fallTimer > 30) { t.vy = (t.vy || 0) + GRAV; t.y += t.vy; }
            }
        }
    });
}

function updatePlayer() {
    const p = Game.player;
    if (Game.gs === "dead" || Game.gs === "gameover") {
        if (Game.deadTimer > 0) { Game.deadTimer--; }
        p.vy += GRAV; p.y += p.vy; 
        return; 
    }

    p.frT++; if (p.frT > 7) { p.fr = (p.fr + 1) % 4; p.frT = 0; }
    
    if (Game.pRegenFrames > 0) {
        Game.regenT = (Game.regenT || 0) + 1;
        if (Game.regenT >= Game.pRegenFrames) {
            Game.regenT = 0;
            p.hp = Math.min(Game.pMaxHp, p.hp + 1);
        }
    }

    if (Game.pCursedPendant) {
        Game.curseT = (Game.curseT || 0) + 1;
        if (Game.curseT >= 60) {
            Game.curseT = 0;
            if (p.hp > 1) p.hp -= 1;
        }
    }

    if (Game.camShake > 0) Game.camShake--;
    if (Game.comboTimer > 0) { Game.comboTimer--; if (Game.comboTimer <= 0) Game.comboCount = 0; }
    if (Game.runStats && Game.comboCount > (Game.runStats.maxCombo || 0)) Game.runStats.maxCombo = Game.comboCount;

    if (p.onGround && p.riding && p.riding.vx) p.x += p.riding.vx;

    const guardNow = dn("KeyV");
    if (guardNow && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && p.atkT === 0) { 
        p.parryT = 10 + Game.pParryBonus;
        if (typeof consumeStamina === 'function') consumeStamina((typeof STAMINA_GUARD !== 'undefined') ? STAMINA_GUARD : 18);
    }
    if (p.parryT > 0) p.parryT--; 
    p.guarding = guardNow;

    if (dn("KeyZ") && p.dashCD <= 0 && !p.guarding && p.kbT <= 0 && p.atkT === 0) {
        const hasStamina = typeof consumeStamina !== 'function' || consumeStamina(typeof STAMINA_DASH !== 'undefined' ? STAMINA_DASH : 28);
        // 스태미나 부족이면 Fat Roll (짧은 무적 대쉬)
        p.dashT = (!hasStamina || p.fatRoll) ? 8 : 15 + Game.pDashInv;
        p.dashCD = Math.floor(75 * Game.pDashCDMul);
        p.vy = 0; p.plunging = false; playSfx('dash');
        // 저스트 회피 윈도우 열기
        p.justDodgeT = typeof JUST_DODGE_WINDOW !== 'undefined' ? JUST_DODGE_WINDOW : 6;
        p.justDodgeReady = true;
    }
    
    if (p.dashT > 0) {
        p.dashT--; p.vx = p.facing * 5.3 * Game.pMoveSpdMul; p.vy = 0; addPart(p.x + 7, p.y + 9, "#ffffff", 10, 3);
        // 대시 종료 프레임에 착지 무적 부여 — dashT가 0이 되는 순간 invT 세팅
        if (p.dashT === 0 && Game.invT === 0) {
            Game.invT = 20; // 대시 후 약 0.33초 무적 — 착지 직후 즉시 피격 방지
        }
    } else if (p.kbT > 0) {
        p.kbT--; p.vx *= 0.9;
    } else {
        let mx = 0; 
        if (!p.guarding && !p.plunging) { 
            // 💡 A, D 키 이동 삭제, 오직 좌우 방향키만 허용
            if (dn("ArrowLeft")) mx = -1; 
            if (dn("ArrowRight")) mx = 1; 
        }
        if (mx !== 0) p.facing = mx; p.vx = mx * 2.4 * Game.pMoveSpdMul; 
    }
    if (p.dashCD > 0) p.dashCD--;

    if (p.onGround) {
        p.airDashUsed = false; // 착지하면 공중 대쉬 충전
        p.jumpCount = 0;
        p.plungeCount = 0; 
    }
    
    // 💡 스페이스바 점프 삭제. 오직 X키로만 점프 가능
    const jpNow = dn("KeyX");
    // 공격 중에도 점프 가능 — 액션 게임 기본 조작감
    if (jpNow && !p.jpOld && !p.guarding && p.kbT <= 0 && !p.plunging) {
        if (p.onGround) {
            // 땅에서만 첫 점프 — 대시 중 점프 리셋 제거 (무한 점프 버그 방지)
            p.vy = -7.5 * Game.pJmpMul; p.jumpCount = 1;
            playSfx('jump');
            for (let i = 0; i < 4; i++) addPart(p.x + 7, p.y + 18, "#6060ff", 12);
        } else if (p.jumpCount < 2) {
            // 공중 2단 점프 — 대시 취소 없이 정직하게
            p.vy = -6.5 * Game.pJmpMul; p.jumpCount = 2;
            playSfx('jump');
            for (let i = 0; i < 6; i++) addPart(p.x + 7, p.y + 18, "#ff60ff", 15);
        }
    }
    p.jpOld = jpNow;
    p.gOld  = dn("KeyV"); // 가드 이전 프레임 상태 — 튜토리얼 체크용

    if (!p.onGround && dn("ArrowDown") && dn("KeyC") && !p.plunging && p.atkT === 0 && p.dashT <= 0) { 
        if (Game.pClass === 2) { 
            if ((p.plungeCount || 0) < 3) {
                p.plungeCount = (p.plungeCount || 0) + 1;
                // 공격속도 배율 적용 — 전 직업 통일
                p.atkT = Math.floor(20 / ((Game.pBaseAtkSpd || 1) * (Game.pAtkSpdMul || 1)));
                p.vy = -5;
                playSfx('atk');
                Game.camShake = 5;
                let currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
                // 크리/콤보/저체력/최종배율 전부 적용
                const isCritAir = Math.random() < (Game.pCritChance || 0.2);
                // 2.5배 폭주 제거 — 일반 공격에 준하는 1.4배 보정
                let pdmg = Math.floor(currentBaseDmg * 1.4 * (Game.pFinalDmgMul || 1)
                    * (isCritAir ? (Game.pCritDmg || 1.5) : 1)
                    * (p.hp / Game.pMaxHp < 0.3 ? (Game.pLowHpDmg || 1.5) : 1));
                const comboBonusAir = Math.floor(Game.comboCount / 10) * (Game.pComboDmg || 5);
                pdmg += comboBonusAir;
                spawnBullet(p.x + 7, p.y + 18, 0, 10, 30, 8, 0, pdmg);
                // 공중 공격도 MP 회복
                Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 2);
            }
        } else {
            p.plunging = true; 
            if (Game.pClass === 1) { 
                p.vy = 14; p.vx = p.facing * 6;
            } else { 
                p.vy = 12; p.vx = 0;
            }
        }
    }
    
    if (p.plunging) { 
        if (Game.pClass === 1) {
            p.vy = 14; p.vx = p.facing * 6; addPart(p.x + 7, p.y + 9, "#ff0055", 5); 
        } else {
            p.vy = 12; p.vx = 0; addPart(p.x + 7, p.y + 9, "#ffaa00", 5); 
        }
    } else if (p.dashT <= 0 && Game.pClass !== 2) { 
        p.vy = Math.min(p.vy + GRAV, 9); 
    } else if (p.dashT <= 0 && Game.pClass === 2) {
        p.vy = Math.min(p.vy + GRAV * 0.8, 8);
    }
    // 대쉬 잔상 파티클
    if (p.dashT > 0) {
        const trailCol = Game.pClass === 0 ? "#ff2200" : (Game.pClass === 1 ? "#aa00ff" : "#00ccff");
        for (let i = 0; i < 3; i++) addPart(p.x + Math.random() * p.w, p.y + Math.random() * p.h, trailCol, 10, 3);
    }

    p.x += p.vx;
    p.y += p.vy;

    if (typeof resolveAABB === 'function') resolveAABB(p);
    
    if (p.plunging && p.onGround) {
        p.plunging = false; p.atkT = 20; Game.camShake = 20; Game.hitStop = 10; playSfx('plunge_land');
        const plungeCol = Game.pClass === 0 ? "#ff4400" : (Game.pClass === 1 ? "#cc44ff" : "#00ccff");
        for (let i = 0; i < 30; i++) addPart(p.x + 7, p.y + 18, plungeCol, 25, 4);
        // 착지 충격파 링
        spawnLaser(p.x - 30, p.y + 14, 60, 6, 8, plungeCol, 0, true);
        
        let currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
        // 강하 착지: 크리/콤보/저체력/최종배율 전부 반영
        const isCritPlunge = Math.random() < (Game.pCritChance || 0.2);
        // 다운어택 폭주 제거 — 체간 30 확정 + 1.6배 적정 배율로 정상화
        let pdmg = Math.floor(currentBaseDmg * 1.6 * (Game.pFinalDmgMul || 1)
            * (isCritPlunge ? (Game.pCritDmg || 1.5) : 1)
            * (p.hp / Game.pMaxHp < 0.3 ? (Game.pLowHpDmg || 1.5) : 1));
        pdmg += Math.floor(Game.comboCount / 10) * (Game.pComboDmg || 5);
        if (pdmg < 1) pdmg = 1;
        // 강하 착지 시 체간 30 확정 부여 — isCrit 종속 아님
        Game.enemies.forEach(e => {
            if (e.active && !e.dead && Math.abs(e.x - p.x) < 80 && Math.abs(e.y - p.y) < 80) {
                if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 15);
            }
        });
        // 강하 착지 범위 내 적에게 실제 데미지 적용
        let plungeHitAny = false;
        Game.enemies.forEach(e => {
            if (e.active && !e.dead && Math.abs(e.x - p.x) < 80 && Math.abs(e.y - p.y) < 80) {
                plungeHitAny = true;
            }
        });
        // MP 회복은 실제로 적에게 닿았을 때만 — 허공 강하는 게이지 안 참
        if (plungeHitAny) {
            Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 5);
        }

        if (Game.pClass === 1) {
            spawnBullet(p.x + 7, p.y + 5, p.facing * 10, 0, 10, 15, 2, pdmg);
            spawnBullet(p.x + 7, p.y + 5, p.facing * 12, 0, 10, 15, 2, pdmg);
        } else {
            spawnBullet(p.x - 10, p.y + 5, -8, 0, 15, 18, 2, pdmg);
            spawnBullet(p.x + 10, p.y + 5, 8, 0, 15, 18, 2, pdmg);
        }
    }

    p.x = Math.max(0, Math.min(Game.levelW - p.w, p.x));
    
    if (p.y > CH + 60) { 
        p.guarding = false; p.plunging = false; 
        let fallDmg = Math.floor(p.hp * 0.3);
        if (fallDmg < 1) fallDmg = 1;
        if(typeof takeDmg === 'function') takeDmg(fallDmg, null, true); 
        
        let safePlatform = Game.platforms.find(t => t.float && !t.drop && !t.vx) || Game.platforms.find(t => t.float && !t.drop) || Game.platforms[0];
        if (safePlatform) {
            p.x = safePlatform.x + safePlatform.w / 2 - p.w / 2;
            // 공중에 스폰해서 즉시 재낙사 방지 — 발판 위로 좀 띄워줌
            p.y = safePlatform.y - p.h - 20;
        } else {
            p.x = 80; p.y = -50;
        }
        // 낙사 직후 속도 완전 초기화 — 관성 때문에 또 떨어지는 꼴 방지
        p.vx = 0; p.vy = 0; 
    }

    if (p.atkT > 0) p.atkT--; if (p.atkAnim > 0) p.atkAnim--; if (Game.invT > 0) Game.invT--;
    // Witch Time 윈도우 감소
    if ((p.justDodgeT || 0) > 0) { p.justDodgeT--; if (p.justDodgeT <= 0) p.justDodgeReady = false; }
}

function updatePlayerCombat() {
    const p = Game.player;
    if (p.dead) return;
    
    const currentAtkSpd = (Game.pBaseAtkSpd || 1.0) * (Game.pAtkSpdMul || 1.0);
    const currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);

    if (dn("KeyC") && !dn("ArrowDown") && p.atkT === 0 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging) {
        // 스태미나 부족하면 공격 자체를 막음 — 무한 콤보 방지
        if (typeof consumeStamina === 'function' && !consumeStamina((typeof STAMINA_ATK !== 'undefined') ? STAMINA_ATK : 10)) return;
        playSfx('atk');
        let maxCombo = (Game.pClass === 1) ? 5 : 3;
        p.combo = (p.combo % maxCombo) + 1; 
        const isLastHit = p.combo === maxCombo;
        
        p.atkT = Math.max(1, Math.floor((isLastHit ? 35 : 16) / currentAtkSpd));
        p.atkAnim = Math.max(1, Math.floor((isLastHit ? 20 : 12) / currentAtkSpd));
        
        p.comboT = 50;
        if (!p.onGround) p.vy = Math.min(p.vy, 1);

        const rangeX = (isLastHit ? 45 : 30) + Game.pRangeBonus; 
        const rangeY = (isLastHit ? 55 : 40) + Game.pRangeBonus * 0.5; 
        const cx = p.x + 7 + p.facing * (rangeX / 2 + 5); const cy = p.y + 9;

        let baseRoll = Math.floor((isLastHit ? currentBaseDmg * 2.2 : currentBaseDmg) * (0.8 + Math.random() * 0.4));
        let comboBon = Math.floor(Game.comboCount / 10) * Game.pComboDmg;
        
        if (Game.pBloodFestival) {
            comboBon += Math.min(150, Math.floor(Game.comboCount / 5) * 15);
        }
        
        let dmg = Math.floor(baseRoll + comboBon); 
        if (p.hp / p.maxHp < 0.3) dmg = Math.floor(dmg * Game.pLowHpDmg); 

        let isCrit = false;
        if (Math.random() < Game.pCritChance) { dmg = Math.floor(dmg * Game.pCritDmg); isCrit = true; }
        dmg = Math.floor(dmg * Game.pFinalDmgMul);
        if (dmg < 1) dmg = 1;

        if (Game.pClass === 2) {
            spawnBullet(cx, cy, p.facing * 8, 0, 40, 6, 0, dmg);
            if (isLastHit) {
                spawnBullet(cx, cy - 10, p.facing * 8, -2, 40, 6, 0, dmg);
                spawnBullet(cx, cy + 10, p.facing * 8, 2, 40, 6, 0, dmg);
                Game.camShake = 5;
            }
        } else {
            let hitTarget = false;
            Game.enemies.forEach((e) => {
                if (!e.active || e.dead) return;
                if (Math.abs(e.x + e.w / 2 - cx) < rangeX / 2 + e.w / 2 && Math.abs(e.y + e.h / 2 - cy) < rangeY / 2 + e.h / 2) {
                    if (e.isBoss && (e.y + e.h) < Game.player.y) return;
                    // 스턴 상태이면 Fatal Strike 처형
                    if (e.stun && typeof executeEnemy === 'function' && executeEnemy(e)) {
                        hitTarget = true;
                        Game.skillFlashCol = "rgba(180,0,0,0.4)"; Game.skillFlashT = 15;
                        return;
                    }
                    if(typeof hitE === 'function') hitE(e, dmg, p.facing, isCrit, Game.pExtraDmg);
                    // 평타도 체간 소량 감소 — 계속 맞으면 결국 스턴 유도
                    const poiseDmgNormal = isCrit ? 12 : 6;
                    if (typeof applyPoiseHit === 'function') applyPoiseHit(e, poiseDmgNormal);
                    hitTarget = true;
                }
            });

            if (isLastHit) Game.camShake = 8; 
            if (hitTarget) { 
                Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 2); 
                if (isLastHit) Game.hitStop = 6;
                Game.comboCount++;
                Game.comboTimer = 150 + Game.pComboDur;
                // 콤보 마일스톤 연출
                if (Game.comboCount === 10) { playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "10 COMBO!", "#ff6600", 50, 18); }
                else if (Game.comboCount === 30) { playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "30 COMBO!!", "#ff0000", 60, 22); }
                else if (Game.comboCount === 50) { playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "50 COMBO!!!", "#ff0000", 70, 26); }
            } 
            for (let i = 0; i < (isLastHit ? 15 : 6); i++) { addPart(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20, isLastHit ? "#ff2222" : "#ffffff", 15, 3); }
        }
    }

    if (dn("ShiftLeft", "ShiftRight") && Game.pMp >= 100 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && p.atkT === 0) {
        Game.pMp -= 100;
        p.atkT = 25;
        // 스태미나 없으면 스킬도 봉인 — MP 있어도 스태미나 없으면 못 씀
        if (typeof consumeStamina === 'function' && !consumeStamina((typeof STAMINA_SKILL !== 'undefined') ? STAMINA_SKILL : 40)) return;
        playSfx('skill'); Game.camShake = 45; Game.hitStop = 12;
        let megaDmg = Math.floor(currentBaseDmg * 15 * Game.pSkillDmgMul);
        let comboBon = Math.floor(Game.comboCount / 10) * Game.pComboDmg * 10;
        if (Game.pBloodFestival) comboBon += Math.min(150, Math.floor(Game.comboCount / 5) * 15) * 15 * Game.pSkillDmgMul;
        megaDmg += comboBon;
        if (p.hp / p.maxHp < 0.3) megaDmg = Math.floor(megaDmg * Game.pLowHpDmg);
        megaDmg = Math.floor(megaDmg * Game.pFinalDmgMul);
        const laserW = 450 + (Game.pRangeBonus || 0);
        const laserX = p.facing > 0 ? p.x + p.w : p.x - laserW;
        const cx = p.x + p.w / 2, cy = p.y + p.h / 2;

        if (Game.pClass === 0) {
            // 전사 - 핏빛 대검 참격 (수평 레이저 + 상하 충격파)
            spawnLaser(laserX, p.y - 25, laserW, 70 * Game.pSkillWidth, 50, "#cc0000", megaDmg, true, true);
            spawnLaser(laserX, p.y + 20, laserW, 20 * Game.pSkillWidth, 30, "#880000", Math.floor(megaDmg * 0.4), true, true);
            for (let i = 0; i < 50; i++) addPart(cx, cy, i < 30 ? "#ff2200" : "#881100", 40, i < 20 ? 5 : 3);
            addText(p.x, p.y - 35, "BLOOD SLASH!!", "#ff0000", 65, 28);
            // 피격 시 화면 붉게
            Game.skillFlashCol = "rgba(180,0,0,0.35)"; Game.skillFlashT = 20;
        } else if (Game.pClass === 1) {
            // 도적 - 암영 폭발 (전방위 단검 + 텔레포트 이후 참격)
            spawnLaser(laserX, p.y - 20, laserW, 50 * Game.pSkillWidth, 40, "#6600cc", megaDmg, true, true);
            // 전방 부채꼴 단검
            for (let s = -3; s <= 3; s++) {
                const ang = (p.facing > 0 ? 0 : Math.PI) + s * 0.22;
                spawnBullet(cx, cy, Math.cos(ang) * 9, Math.sin(ang) * 9, 35, 7, 2, Math.floor(megaDmg * 0.35));
            }
            for (let i = 0; i < 50; i++) addPart(cx, cy, i < 30 ? "#aa00ff" : "#550088", 40, i < 20 ? 5 : 3);
            addText(p.x, p.y - 35, "VOID SLASH!!", "#cc00ff", 65, 28);
            Game.skillFlashCol = "rgba(80,0,150,0.3)"; Game.skillFlashT = 20;
        } else {
            // 마법사 - 현상태 유지 (하늘색 레이저)
            spawnLaser(laserX, p.y - 25, laserW, 70 * Game.pSkillWidth, 50, "#00ccff", megaDmg, true, true);
            for (let i = 0; i < 40; i++) addPart(cx, cy, "#00ccff", 35, 5);
            addText(p.x, p.y - 35, "OBLITERATE!!", "#00ffff", 65, 28);
            Game.skillFlashCol = "rgba(0,150,200,0.25)"; Game.skillFlashT = 18;
        }
    }
}

function updateProjectiles() {
    Game.bullets.forEach((b) => { 
        if (!b.active) return;
        b.x += b.vx; b.y += b.vy; 
        
        b.vy += (b.sk === true || b.sk === 1) ? 0.05 : 0; 
        b.life--; 
        if (b.life <= 0) { b.active = false; return; }
        
        if (b.sk !== 2) {
            for (const t of Game.platforms) { 
                if (overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.active = false; return; } 
            }
        }
        
        Game.enemies.forEach((e) => {
            if (!e.active || e.dead) return;
            const hitR = b.sk === 2 ? b.r * 2.5 : b.r;
            if (Math.abs(e.x + e.w / 2 - b.x) < e.w / 2 + hitR && Math.abs(e.y + e.h / 2 - b.y) < e.h / 2 + hitR) { 
                if(typeof hitE === 'function') hitE(e, b.dmg || (Game.pBaseDmg * (Game.pBaseDmgMul||1)), b.vx > 0 ? 1 : -1, false); 
                if (b.sk) Game.hitStop = 3; 
                if (Game.pClass === 2 && !b.sk) Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 1);
                if (!b.sk) {
                    Game.comboCount++;
                    Game.comboTimer = 150 + Game.pComboDur;
                }
                b.active = false; 
            }
        });
    });

    Game.eBullets.forEach((b) => { 
        if (!b.active) return;
        b.x += b.vx * Game.pProjSlow; b.y += b.vy * Game.pProjSlow; 
        if (b.grav) b.vy += 0.4 * Game.pProjSlow; else b.vy += 0.12 * Game.pProjSlow; 
        b.life--; 
        if (b.life <= 0 || b.y > CH + 30) { b.active = false; return; }
        
        for (const t of Game.platforms) { if (overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.active = false; return; } }
        // 투사체 r이 8~10으로 커졌으므로 히트박스도 r 기반 동적 계산
        const hitR2 = (b.r || 8) * 0.85;
        const pCx = Game.player.x + Game.player.w / 2;
        const pCy = Game.player.y + Game.player.h / 2;
        if (Game.invT === 0 && Math.abs(pCx - b.x) < hitR2 + 8 && Math.abs(pCy - b.y) < hitR2 + 10 && !Game.player.dead) {
            if (typeof takeDmg === 'function') takeDmg(b.dmg || 15, b, b.unblockable); b.active = false;
        }
    });

    Game.lasers.forEach((l) => {
        if (!l.active) return;
        if (l.isPlayer) {
            if (l.life > l.maxLife - 15) { 
                Game.enemies.forEach(e => {
                    if (e.active && !e.dead && overlap(e, l) && !l.hitTargets.has(e)) { 
                        if(typeof hitE === 'function') hitE(e, l.dmg, Game.player.facing, true); 
                        l.hitTargets.add(e); 
                    }
                });
            }
        } else {
            // 적 레이저: 최초 1회만 피격 (hitTargets로 중복 방지)
            if (!l.hitTargets) l.hitTargets = new Set();
            if (l.life > l.maxLife - 5 && !l.hitTargets.has('player')) {
                if (Game.invT === 0 && overlap(Game.player, l) && !Game.player.dead) {
                    if (typeof takeDmg === 'function') takeDmg(l.dmg || 20, null, l.unblockable);
                    l.hitTargets.add('player');
                }
            }
        }
        l.life--;
        if (l.life <= 0) l.active = false;
    });
}

function updateItemsAndMisc() {
    // 튜토리얼 통과 조건 체크 — 각 조작 1회 수행 여부 감지
    if (Game.isTutorial && Game.tutorialChecks) {
        const p2 = Game.player;
        const tc = Game.tutorialChecks;

        // dash: 대시 모션 중 — 정상
        if (p2 && p2.dashT > 0) tc.dash = true;

        // jump: 점프 키(X)를 실제로 누른 순간만 — 낙하나 발판 아래 등 즉시 true 방지
        if (p2 && dn("KeyX") && !p2.jpOld && !p2.onGround) tc.jump = true;

        // attack: 실제 공격이 적에게 닿았을 때(콤보 카운트 증가) — atkAnim 잔류 오감지 방지
        if (Game.comboCount > 0) tc.attack = true;

        // guard: V키 누른 순간만 — 단순 상태 유지로 즉시 체크되는 것 방지
        if (dn("KeyV") && !p2?.gOld) tc.guard = true;

        // skill: Shift 입력 자체 감지
        if (dn("ShiftLeft", "ShiftRight")) tc.skill = true;

        // 모든 조작 완료 시 문 열기
        const allDone = tc.dash && tc.jump && tc.attack && tc.guard && tc.skill;
        if (allDone && Game.doors[0] && !Game.doors[0].open) {
            Game.doors[0].open = true;
            // 화면 중앙 고정 좌표로 — 월드 좌표가 아닌 카메라 기준
            addText(Game.camX + CW / 2 - 80, CH / 2 - 30, "ALL DONE! 문이 열렸다!", "#00ffcc", 180, 18);
        }

        // 더미 몬스터 — 체력만 리셋, 스턴/포이즈는 유지해 처형 연습 가능하게
        Game.enemies.forEach(e => {
            if (e.active && e.isTutorialDummy) {
                e.hp   = e.maxHp; // 죽지 않는 허수아비
                e.dead = false;   // 혹시 dead 처리됐어도 강제 부활
                e.active = true;
                // poise/stun은 건드리지 않음 — 패링→스턴→처형 흐름 체험 가능
            }
        });
    }

    // 튜토리얼 말풍선 힌트 렌더
    if (Game.isTutorial && Game.tutorialHints) {
        ctx.save();
        ctx.textAlign = "left";
        Game.tutorialHints.forEach(h => {
            const hx = h.x - Game.camX;
            if (hx < -200 || hx > CW + 200) return;
            // 말풍선 배경
            ctx.font = "bold 10px SkullFont, NeoDunggeunmo";
            const tw = ctx.measureText(h.text).width;
            ctx.fillStyle = "rgba(0,0,0,0.72)";
            ctx.fillRect(hx - 4, h.y - 13, tw + 8, 16);
            ctx.strokeStyle = h.col || "#ffcc44";
            ctx.lineWidth = 1;
            ctx.strokeRect(hx - 4, h.y - 13, tw + 8, 16);
            // 텍스트
            ctx.fillStyle = h.col || "rgba(255,220,80,0.92)";
            ctx.fillText(h.text, hx, h.y);
        });
        // 통과 조건 현황 (화면 우상단)
        if (Game.tutorialChecks) {
            const tc2 = Game.tutorialChecks;
            const checks = [
                { key: "dash",   label: "Z 대시",   done: tc2.dash   },
                { key: "jump",   label: "X 점프",   done: tc2.jump   },
                { key: "attack", label: "C 평타",   done: tc2.attack },
                { key: "skill",  label: "Shift 스킬", done: tc2.skill },
                { key: "guard",  label: "V 가드",   done: tc2.guard  },
            ];
            ctx.font = "bold 11px SkullFont, NeoDunggeunmo";
            checks.forEach((ch, i) => {
                ctx.fillStyle = ch.done ? "#00ffcc" : "#666";
                ctx.fillText((ch.done ? "✓ " : "○ ") + ch.label, CW - 120, 30 + i * 16);
            });
            const allDone2 = tc2.dash && tc2.jump && tc2.attack && tc2.guard && tc2.skill;
            ctx.fillStyle = allDone2 ? "#ffcc00" : "#555";
            ctx.font = "bold 12px SkullFont, NeoDunggeunmo";
            ctx.textAlign = "center";
            ctx.fillText(allDone2 ? "→ 문 통과하기!" : "모든 조작을 수행하세요", CW / 2, 22);
            ctx.textAlign = "left";
        }
        ctx.restore();
    }
    Game.texts.forEach(t => { 
        if (!t.active) return;
        t.y -= 0.8; t.life--; 
        if (t.life <= 0) t.active = false;
    }); 

    if (Game.eventObjects && Game.player && !Game.player.dead) {
        const p = Game.player;
        for (const ev of Game.eventObjects) {
            if (ev.used) continue;
            const near = Math.abs((p.x + p.w/2) - (ev.x + ev.w/2)) < 55 && Math.abs(p.y - ev.y) < 70;
            ev._nearPlayer = near;
            
            // 🔥 K.upOld를 사용하여 키 씹힘 완벽 방지
            if (near && dn("ArrowUp") && !K.upOld) {
                // 💥 기존 버그: 여기서 ev.used = true를 일괄 처리해서 화톳불이 고장났었음. (삭제 완료)

                if (ev.type === "curse_altar") {
                    ev.used = true; // 제단 사용 완료 처리
                    const dmgAmt = Math.floor(p.hp * 0.25);
                    p.hp = Math.max(1, p.hp - dmgAmt);
                    const roll = Math.random();
                    
                    if (roll < 0.33) {
                        Game.pFinalDmgMul += 0.5;
                        Game.pBaseDmg += 10; // 💡 눈에 보이도록 기본 공격력(ATK)도 확 올려줌!
                        addText(ev.x, ev.y - 20, "저주: 공격력/최종 데미지 폭증!", "#ff0055", 140, 13);
                    } else if (roll < 0.66) {
                        Game.pSkillDmgMul += 0.5;
                        addText(ev.x, ev.y - 20, "저주: 필살기 위력 +50%!", "#ff0055", 120, 13);
                    } else {
                        Game.pCritChance = Math.min(0.95, Game.pCritChance + 0.25);
                        Game.pCritDmg += 1.0;
                        addText(ev.x, ev.y - 20, "저주: 치명타 +25% / 데미지 +100%!", "#ff0055", 140, 13);
                    }
                    playSfx('skill'); Game.camShake = 20;
                    for (let pi = 0; pi < 30; pi++) addPart(ev.x + ev.w/2, ev.y + ev.h/2, "#ff0055", 30, 4);
                    
                } else if (ev.type === "relic_chest") {
                    ev.used = true; // 상자 사용 완료 처리
                    const pool = Array.from({length:33},(_,i)=>i+1)
                        .filter(id => !Game.obtainedItems || !Game.obtainedItems.includes(id));
                    if (pool.length > 0) {
                        const id = pool[Math.floor(Math.random() * pool.length)];
                        if (typeof applyUpgrade === 'function') applyUpgrade(id);
                        const name = (typeof UPGRADES !== 'undefined' && UPGRADES[id]) ? UPGRADES[id].name.split(':')[0] : '유물';
                        addText(ev.x, ev.y - 20, "유물: " + name + "!", "#ffcc00", 120, 13);
                        playSfx('item'); playSfx('clear');
                    }
                    for (let pi = 0; pi < 25; pi++) addPart(ev.x + ev.w/2, ev.y + ev.h/2, "#ffcc00", 30, 4);
                    
                } else if (ev.type === "bonfire") {
                    // 🔥 화톳불 함수 호출. 함수 내부에서 스스로 HP 회복 후 ev.used = true 처리함!
                    if (typeof useBonfire === 'function') useBonfire(ev);
                    
                } else if (ev.type === "mimic_chest") {
                    ev.used = true; // 미믹 사용 완료 처리
                    if (typeof triggerMimic === 'function') triggerMimic(ev);
                }
            }
        }
    }


    Game.items.forEach(i => {
        if (!i.active) return;
        i.vy = Math.min(i.vy + GRAV, 8);  i.y += i.vy; let groundFound = false;
        Game.platforms.forEach(t => { if (overlap({x: i.x, y: i.y, w: i.w, h: i.h}, t) && i.vy > 0) { i.y = t.y - i.h; i.vy = 0; groundFound = true; } });
        if(groundFound) i.life--;
        
        if (overlap(Game.player, {x: i.x, y: i.y, w: i.w, h: i.h}) && !Game.player.dead) {
            playSfx('item');
            if (i.type === "hp") {
                if (Game.player.hp < Game.pMaxHp) { Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + 20); addText(Game.player.x, Game.player.y - 10, "+20 HP", "#27ae60", 40, 14); } 
                else { Game.score += 100; addText(Game.player.x, Game.player.y - 10, "+100 SCORE", "#aaaaff", 40, 14); }
            } else if (i.type === "atk_drop") { Game.pBaseDmg += 5; addText(Game.player.x, Game.player.y - 10, "ATK UP! (+5)", "#ff6200", 50, 16);
            } else if (i.type === "def_drop") { Game.pBaseDef += 5; addText(Game.player.x, Game.player.y - 10, "DEF UP! (+5)", "#b0bec5", 50, 16); 
            } else if (i.type === "atk_spd_drop") { Game.pBaseAtkSpd += 0.05; addText(Game.player.x, Game.player.y - 10, "ATK SPD UP!", "#ffea00", 50, 16);
            } else if (i.type === "move_spd_drop") { Game.pMoveSpdMul += 0.05; addText(Game.player.x, Game.player.y - 10, "MOVE SPD UP!", "#00ffcc", 50, 16); }
            else if (i.type === "jump_drop") { Game.pJmpMul += 0.05; addText(Game.player.x, Game.player.y - 10, "JUMP UP!", "#42a5f5", 50, 16); }
            
            i.active = false;
        } else if (i.life <= 0) {
            i.active = false;
        }
    });

    Game.parts.forEach((p) => { 
        if (!p.active) return;
        p.x += p.vx; p.y += p.vy; p.vx *= 0.87; p.vy *= 0.87; p.life--; 
        if (p.life <= 0) p.active = false;
    }); 
    
    const allDead = !Game.enemies.some(e => e.active && !e.dead);

    Game.doors.forEach((d) => {
        if (Game.isTutorial) {
            // 튜토리얼: 문은 항상 열려 있음 — 조건 복잡도로 막히는 문제 방지
            d.open = true;
        } else {
            d.open = allDead;
        }
        if (d.open && Game.player && overlap(Game.player, { x: d.x, y: d.y, w: d.w, h: d.h }) && !Game.player.dead) {
            if (Game.transState === 0 && typeof nextStage === 'function') {
                nextStage();
            }
        }
    });
}

function update() {
    Game.frameCount++;
    // 슬로모션 처리 (패링 성공 시)
    if (Game.slowMoT > 0) {
        Game.slowMoT--;
        if (Game.slowMoT % 2 !== 0) return; // 짝수 프레임만 실행 → 0.5배속
    }
    if (Game.hitStop > 0) { Game.hitStop--; if (Game.camShake > 0) Game.camShake--; return; }
    if (!Game.player || Game.gs === "gameover") return;

    if (Game.gs === "boss_intro") {
        Game.bossIntroT--;
        if (Game.bossIntroT <= 0) {
            Game.camX = Math.max(0, (Game.levelW / 2) - CW / 2);
            Game.camShake = 0; Game.hitStop = 0;
            // 보스 대사 컷신 — STORY.boss[worldN]에 대사가 있으면 표시
            if (typeof startCutscene === 'function') startCutscene("boss", Game.worldN);
            else Game.gs = "play";
        }
        return;
    }

    updateEnvironment();
    updatePlayer();
    if (typeof updateStamina === 'function') updateStamina();
    if (typeof updateJustDodge === 'function') updateJustDodge();
    updatePlayerCombat();
    if(typeof updateEnemies === 'function') updateEnemies();
    updateProjectiles();
    if (typeof updateTraps === 'function') updateTraps();
    updateItemsAndMisc();

    Game.camX += (Game.player.x - CW / 3 - Game.camX) * 0.1; 
    Game.camX = Math.max(0, Math.min(Game.levelW - CW, Game.camX));
}

// ==========================================
// 업그레이드 데이터 테이블 (이름 + 효과 함수 통합)
// ==========================================
const UPGRADES = {
    1:  { name: "뼈방패: 30 데미지 흡수 배리어",                          apply: g => g.pShield += 30 },
    2:  { name: "뼈의봉: 공격력 소폭(+10) 상승 및 무기 길이 대폭(+50) 증가", apply: g => { g.pBaseDmg += 10; g.pRangeBonus += 50; } },
    3:  { name: "전사의 피: 최대 HP +50",                                apply: g => { g.pMaxHp += 50; g.player.maxHp = g.pMaxHp; g.player.hp += 50; } },
    4:  { name: "파괴의 룬: 필살기 데미지 30% 증폭",                       apply: g => g.pSkillDmgMul += 0.3 },
    5:  { name: "도굴왕: 몬스터 처치 시 아이템 드롭 확률 상승(+15%)",         apply: g => g.pDropRate += 0.15 },
    6:  { name: "광전사의 장갑: 공속 2.3배 상승 / 최종 데미지 0.5배",        apply: g => { g.pAtkSpdMul *= 2.3; g.pFinalDmgMul *= 0.5; } },
    7:  { name: "거인의 힘: 평타 추가 데미지 +15%",                        apply: g => g.pExtraDmg += 0.15 },
    8:  { name: "스컬의 축복: 체력+10, 공격력+3, 방어력+3, 사거리+6, 공속+10%", apply: g => { g.pMaxHp += 10; g.player.maxHp = g.pMaxHp; g.player.hp += 10; g.pBaseDmg += 3; g.pRangeBonus += 6; g.pBaseDef += 3; g.pBaseAtkSpd += 0.1; } },
    9:  { name: "야수의 손톱: 공격속도 20% 증가",                          apply: g => g.pBaseAtkSpd += 0.2 },
    10: { name: "늑대의 피갈퀴손: 평타 타격 시 확률로 HP 회복",               apply: g => g.pHealOnHit = true },
    11: { name: "닌자의 발걸음: 대쉬 쿨타임 25% 감소",                      apply: g => g.pDashCDMul -= 0.25 },
    12: { name: "바람의 망토: 이동 속도 20% 증가",                         apply: g => g.pMoveSpdMul += 0.2 },
    13: { name: "거머리의 송곳니: 흡혈 발동 확률 5% 추가 증가",               apply: g => g.pLifestealChance += 0.05 },
    14: { name: "치명적인 일격: 치명타 확률 15% 증가",                       apply: g => g.pCritChance += 0.15 },
    15: { name: "암살자의 비수: 치명타 데미지 50% 증가",                      apply: g => g.pCritDmg += 0.5 },
    16: { name: "저주받은 대검: 최종 데미지 2.3배 증폭 / 공속 0.5배",         apply: g => { g.pFinalDmgMul *= 2.3; g.pAtkSpdMul *= 0.5; } },
    17: { name: "마력의 근원: 최대 마나 50 증가",                          apply: g => g.pMaxMp += 50 },
    18: { name: "명상의 투구: 패링 성공 시 마나 회복량 2배 증가",              apply: g => g.pParryMp = 40 },
    19: { name: "가시 갑옷: 피격 시 적 1초 경직 및 2초당 HP 1 회복",         apply: g => { g.pReflectDmg += 15; g.pRegenFrames = 120; } },
    20: { name: "광전사의 분노: 체력 30% 이하일 때 데미지 50% 증가",           apply: g => g.pLowHpDmg = 1.5 },
    21: { name: "그림자 망토: 대쉬 무적 시간 소폭 증가",                      apply: g => g.pDashInv += 10 },
    22: { name: "폭군의 도끼: 공격력 50% 증폭, 최대 체력 70% 감소",           apply: g => { g.pBaseDmgMul += 0.5; g.pMaxHp = Math.max(1, Math.floor(g.pMaxHp * 0.3)); g.player.maxHp = g.pMaxHp; g.player.hp = Math.max(1, Math.floor(g.player.hp * 0.3)); } },
    23: { name: "수호자의 긍지: 방어막 +50, 이동 속도 -10%",                apply: g => { g.pShield += 50; g.pMoveSpdMul -= 0.1; } },
    24: { name: "시간의 시계태엽: 적 투사체 속도 15% 감소",                   apply: g => g.pProjSlow -= 0.15 },
    25: { name: "마법사의 안경: 스킬 레이저 두께 50% 증가",                   apply: g => g.pSkillWidth += 0.5 },
    26: { name: "강철의 의지: 받는 피해량 15% 감소",                        apply: g => g.pDmgReduction -= 0.15 },
    27: { name: "피의 축제: 콤보 유지 시간 3배 증가, 5콤보당 공격력 대폭(15) 증가", apply: g => { g.pComboDur += 300; g.pBloodFestival = true; } },
    28: { name: "저주받은 펜던트: 공격력 40% 증가, 1초당 체력 1 감소",         apply: g => { g.pBaseDmgMul += 0.4; g.pCursedPendant = true; } },
    29: { name: "신속의 검: 공속 +15%, 이속 +15%",                        apply: g => { g.pBaseAtkSpd += 0.15; g.pMoveSpdMul += 0.15; } },
    30: { name: "불사조의 깃털: 사망 시 1회에 한해 체력 50% 부활",             apply: g => g.pRevive += 1 },
    31: { name: "도약의 부츠: 점프력 20% 상승",                            apply: g => g.pJmpMul += 0.20 },
    32: { name: "개구리 뒷다리: 점프력 15% 상승 및 이동 속도 10% 상승",        apply: g => { g.pJmpMul += 0.15; g.pMoveSpdMul += 0.10; } },
    33: { name: "페가수스의 깃털: 점프력 30% 상승 및 대쉬 쿨타임 15% 감소",    apply: g => { g.pJmpMul += 0.30; g.pDashCDMul -= 0.15; } },
};

function applyUpgrade(id) {
    const u = UPGRADES[id];
    if (u) u.apply(Game);
    if (!Game.obtainedItems) Game.obtainedItems = [];
    Game.obtainedItems.push(id);
    checkSynergy();

    // 획득 시 화면 중앙에 "획득: [유물 이름]" — 뭘 먹었는지 바로 알 수 있게
    const gotName = UPGRADES[id]?.name?.split(':')[0] ?? "유물";
    addText(CW / 2, CH / 2 - 20, `획득: ${gotName}`, "#ffcc00", 140, 16, 0, 0.3);
}

// ==========================================
// 업그레이드 시너지 시스템
// ==========================================
const SYNERGIES = [
    {
        ids: [13, 10],  // 흡혈 + 타격회복
        name: "생명력 공명",
        desc: "HP+20, 흡혈 확률 추가 +10%",
        apply: g => { g.pMaxHp += 20; g.player.maxHp = g.pMaxHp; g.pLifestealChance += 0.10; }
    },
    {
        ids: [14, 15],  // 치명타 확률 + 치명타 데미지
        name: "암살자의 눈",
        desc: "치명타 확률 +10%, 치명타 데미지 +30%",
        apply: g => { g.pCritChance += 0.10; g.pCritDmg += 0.30; }
    },
    {
        ids: [6, 9],    // 광전사 장갑 + 야수 손톱
        name: "광속 연격",
        desc: "최종 데미지 +20% 추가",
        apply: g => { g.pFinalDmgMul += 0.20; }
    },
    {
        ids: [22, 20],  // 폭군 도끼 + 광전사 분노
        name: "죽음의 투사",
        desc: "체력 50% 이하 시 데미지 2배 효과",
        apply: g => { g.pLowHpDmg = Math.max(g.pLowHpDmg, 2.0); }
    },
    {
        ids: [1, 23],   // 뼈방패 + 수호자 긍지
        name: "철벽 수호",
        desc: "방어막 +30 추가, 받는 피해 -10%",
        apply: g => { g.pShield += 30; g.pDmgReduction = Math.max(0.5, g.pDmgReduction - 0.10); }
    },
    {
        ids: [27, 29],  // 피의 축제 + 신속의 검
        name: "광란의 춤",
        desc: "콤보 유지 시간 추가 +2초, 이속 +10%",
        apply: g => { g.pComboDur += 120; g.pMoveSpdMul += 0.10; }
    },
    {
        ids: [31, 32, 33], // 부츠 3종 세트
        name: "천공의 발",
        desc: "점프력 추가 +20%, 공중 대쉬 가능",
        apply: g => { g.pJmpMul += 0.20; }
    },
];

const _appliedSynergies = new Set();

function checkSynergy() {
    if (!Game.obtainedItems) return;
    for (const syn of SYNERGIES) {
        const key = syn.ids.join(',');
        if (_appliedSynergies.has(key)) continue;
        if (syn.ids.every(id => Game.obtainedItems.includes(id))) {
            _appliedSynergies.add(key);
            syn.apply(Game);
            addText(320, 160, `SYNERGY: ${syn.name}!`, "#ffcc00", 120, 16, 0, 0.5);
            addText(320, 178, syn.desc, "#ffaa00", 100, 11, 0, 0.5);
        }
    }
}

function generateUpgradeOptions() {
    Game.offeredItems = [];
    let pool = Array.from({length: 33}, (_, i) => i + 1);
    
    if (Game.obtainedItems && Game.obtainedItems.length > 0) {
        pool = pool.filter(id => !Game.obtainedItems.includes(id));
    }

    for (let i = 0; i < 3; i++) {
        if (pool.length === 0) break;
        let r = Math.floor(Math.random() * pool.length);
        Game.offeredItems.push(pool[r]);
        pool.splice(r, 1);
    }
}

function renderUpgrade() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)"; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "#ffcc00"; ctx.font = "30px NeoDunggeunmo"; ctx.textAlign = "center"; 
    ctx.fillText("보스 처치 — 유물 선택 (1, 2, 3번 키)", CW / 2, 60);
    
    ctx.fillStyle = "#00ccff"; ctx.font = "16px NeoDunggeunmo";
    ctx.fillText(`[R] 리롤 (코인: ${Game.rerollCoins} / 9)`, CW / 2, 90);
    
    ctx.fillStyle = "#ffffff"; ctx.font = "18px NeoDunggeunmo";
    
    // UPGRADES 테이블에서 이름을 직접 참조
    if (Game.offeredItems.length === 3) {
        ctx.fillText(`[1] ${UPGRADES[Game.offeredItems[0]]?.name ?? "?"}`, CW / 2, 170);
        ctx.fillText(`[2] ${UPGRADES[Game.offeredItems[1]]?.name ?? "?"}`, CW / 2, 230);
        ctx.fillText(`[3] ${UPGRADES[Game.offeredItems[2]]?.name ?? "?"}`, CW / 2, 290);
    } else if (Game.offeredItems.length === 0) {
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText("더 이상 획득할 고유 유물이 없습니다. (최대 성장 완료)", CW / 2, 230);
        ctx.fillText("아무 키나 눌러 다음 스테이지로...", CW / 2, 290);
    } else {
        for(let i=0; i<Game.offeredItems.length; i++) {
            ctx.fillText(`[${i+1}] ${UPGRADES[Game.offeredItems[i]]?.name ?? "?"}`, CW / 2, 170 + i*60);
        }
    }

    if (Game.offeredItems.length === 0 && (dn("Space", "Enter") || dn("Digit1", "Numpad1"))) { exitUpgrade(); }
    else if (Game.offeredItems.length > 0 && (dn("Digit1") || dn("Numpad1"))) { applyUpgrade(Game.offeredItems[0]); exitUpgrade(); } 
    else if (Game.offeredItems.length > 1 && (dn("Digit2") || dn("Numpad2"))) { applyUpgrade(Game.offeredItems[1]); exitUpgrade(); } 
    else if (Game.offeredItems.length > 2 && (dn("Digit3") || dn("Numpad3"))) { applyUpgrade(Game.offeredItems[2]); exitUpgrade(); }
    
    ctx.textAlign = "left";
}

function exitUpgrade() {
    // 짝수 월드 진입 전이면 루트 선택 화면으로
    if (Game._pendingRouteSelect) {
        Game._pendingRouteSelect = false;
        Game.gs = "route_select";
        playBGM('upgrade');
        return;
    }
    Game.transState = 2; Game.transT = 255;
    Game.gs = "play"; playBGM('play'); 
    if (typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
    if (typeof initSystems === 'function') initSystems();
    if (typeof initBloodDecals === 'function') initBloodDecals();
}

function saveProgress() {
    localStorage.setItem("skull_quartz",    Game.darkQuartz);
    localStorage.setItem("skull_permHp",    Game.permHpLvl);
    localStorage.setItem("skull_permAtk",   Game.permAtkLvl);
    localStorage.setItem("skull_permCrit",  Game.permCritLvl);
    localStorage.setItem("skull_permSpd",   Game.permSpdLvl || 0);
    localStorage.setItem("skull_permJmp",   Game.permJmpLvl || 0);
    localStorage.setItem("skull_permDash",  Game.permDashLvl || 0);
    localStorage.setItem("skull_permCritDmg", Game.permCritDmgLvl || 0);
    localStorage.setItem("skull_permMp",    Game.permMpLvl || 0);
}

// 기하급수적 비용: base * 2^lvl
function _shopCost(base, lvl) { return Math.floor(base * Math.pow(1.8, lvl)); }

// 영구 강화 항목 정의
const PERM_UPGRADES = [
    { key:"1", prop:"permHpLvl",      base:8,  max:15, name:"최대 체력",       eff:"+10 HP",     apply: g => { g.pMaxHp += 10; } },
    { key:"2", prop:"permAtkLvl",     base:12, max:15, name:"기본 공격력",     eff:"+2 ATK",     apply: g => { g.pBaseDmg += 2; } },
    { key:"3", prop:"permCritLvl",    base:15, max:10, name:"크리티컬 확률",   eff:"+2% CRIT",   apply: g => { g.pCritChance += 0.02; } },
    { key:"4", prop:"permSpdLvl",     base:18, max:10, name:"이동 속도",       eff:"+4% SPD",    apply: g => { g.pMoveSpdMul += 0.04; } },
    { key:"5", prop:"permJmpLvl",     base:18, max:10, name:"점프력",         eff:"+5% JMP",    apply: g => { g.pJmpMul += 0.05; } },
    { key:"6", prop:"permDashLvl",    base:22, max:10, name:"대시 쿨타임",    eff:"-5% DASH CD",apply: g => { g.pDashCDMul = Math.max(0.5, g.pDashCDMul - 0.05); } },
    { key:"7", prop:"permCritDmgLvl", base:25, max:10, name:"크리티컬 데미지",eff:"+15% CDMG",  apply: g => { g.pCritDmg += 0.15; } },
    { key:"8", prop:"permMpLvl",      base:20, max:10, name:"최대 마나",      eff:"+15 MP",     apply: g => { g.pMaxMp += 15; } },
];

function updateShop() {
    if (dn("Escape") && !K.escOld) { Game.gs = Game._prevShopGs || "class_select"; Game._prevShopGs = null; playSfx('item'); }
    
    for (const u of PERM_UPGRADES) {
        const keys = ["Digit"+u.key, "Numpad"+u.key];
        const oldKey = "u" + u.key + "Old";
        if (dn(...keys) && !K[oldKey]) {
            const lvl = Game[u.prop] || 0;
            const cost = _shopCost(u.base, lvl);
            if (Game.darkQuartz >= cost && lvl < u.max) {
                Game.darkQuartz -= cost;
                Game[u.prop] = lvl + 1;
                u.apply(Game);
                saveProgress();
                playSfx('item');
            }
        }
    }
}

function renderShop() {
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#2a0044"); bgGrd.addColorStop(1, "#05020a");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = "#ff55ff"; ctx.font = "bold 22px NeoDunggeunmo"; ctx.textAlign = "center";
    ctx.shadowBlur = 10; ctx.shadowColor = "#000";
    ctx.fillText("어둠의 제단 (영구 강화)", CW/2, 38);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#00ffff"; ctx.font = "15px NeoDunggeunmo";
    ctx.fillText(`보유 다크 쿼츠: ${Game.darkQuartz}`, CW/2, 60);
    ctx.fillStyle = "#888"; ctx.font = "11px NeoDunggeunmo";
    ctx.fillText("(ESC 뒤로가기 / 강화 레벨이 오를수록 비용 급증)", CW/2, 76);

    const cols = 4, rows = 2;
    const bw = 140, bh = 110, padX = 8, padY = 8;
    const totalW = cols * bw + (cols-1) * padX;
    const startX = (CW - totalW) / 2;
    const startY = 88;

    PERM_UPGRADES.forEach((u, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const bx = startX + col * (bw + padX);
        const by = startY + row * (bh + padY);
        const lvl = Game[u.prop] || 0;
        const cost = _shopCost(u.base, lvl);
        const canBuy = Game.darkQuartz >= cost && lvl < u.max;
        const maxed  = lvl >= u.max;

        ctx.fillStyle = maxed ? "rgba(40,30,10,0.8)" : (canBuy ? "rgba(30,0,50,0.85)" : "rgba(10,0,20,0.7)");
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = maxed ? "#886600" : (canBuy ? "#cc44ff" : "#440066");
        ctx.lineWidth = maxed ? 2 : 1.5; ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = "#ffee88"; ctx.font = "bold 12px NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText(`[${u.key}] ${u.name}`, bx + bw/2, by + 20);

        ctx.fillStyle = "#aaddff"; ctx.font = "11px NeoDunggeunmo";
        ctx.fillText(u.eff, bx + bw/2, by + 36);

        // 레벨 바
        const barW = bw - 20;
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx+10, by+44, barW, 8);
        ctx.fillStyle = maxed ? "#ffcc00" : "#aa44ff";
        ctx.fillRect(bx+10, by+44, barW * Math.min(1, lvl / u.max), 8);
        ctx.fillStyle = "#ccc"; ctx.font = "10px NeoDunggeunmo";
        ctx.fillText(`Lv ${lvl} / ${u.max}`, bx + bw/2, by + 62);

        // 비용
        if (!maxed) {
            ctx.fillStyle = canBuy ? "#ffcc00" : "#ff4444";
            ctx.font = "bold 12px NeoDunggeunmo";
            ctx.fillText(`${cost} 쿼츠`, bx + bw/2, by + 80);
        } else {
            ctx.fillStyle = "#ffcc44"; ctx.font = "bold 13px NeoDunggeunmo";
            ctx.fillText("MAX", bx + bw/2, by + 80);
        }
    });
    ctx.textAlign = "left";
}

function updateHUD() {
    const inGame = ["play", "dead", "gameover", "win", "upgrade", "boss_intro"].includes(Game.gs);
    
    // index.html에 작성된 UI 컴포넌트들을 찾아서 인게임 여부에 따라 보이거나 숨김
    const uiHp = document.getElementById("ui-hp");
    const stageLabel = document.getElementById("stageLabel");
    const scoreLabel = document.getElementById("scoreLabel");
    const killLabel = document.getElementById("killLabel");
    const uiSkill = document.getElementById("ui-skill");
    const reviveLabel = document.getElementById("reviveLabel");
    const bossBarWrap = document.getElementById("bossBarWrap");

    if (uiHp) uiHp.style.display = inGame ? "flex" : "none";
    if (stageLabel) stageLabel.style.display = inGame ? "block" : "none";
    if (scoreLabel) scoreLabel.style.display = inGame ? "block" : "none";
    if (killLabel) killLabel.style.display = inGame ? "block" : "none";
    // 게이지 묶음 전체 표시/숨김 — SKILL만 아니라 DASH, STAMINA 포함
    const uiGauges = document.getElementById("ui-gauges");
    if (uiGauges) uiGauges.style.display = inGame ? "flex" : "none";
    // STAMINA도 항상 flex 유지 (position:absolute이므로 부모 display만 맞으면 됨)
    if (uiSkill) uiSkill.style.display = inGame ? "flex" : "none";

    if (!inGame || !Game.player) {
        if (reviveLabel) reviveLabel.style.display = "none";
        if (bossBarWrap) bossBarWrap.style.display = "none";
        return;
    }

    const fill = document.getElementById("playerHpFill");
    const sFill = document.getElementById("playerShieldFill");
    const hpTxt = document.getElementById("hpText");
    
    if (fill && hpTxt) {
        const hpPct = Math.max(0, Game.player.hp) / Game.pMaxHp;
        fill.style.width = (hpPct * 100) + "%";
        // 리게인 회색 체력 바
        const grayAmt = Game.player.grayHp || 0;
        const grayPct = Math.min(1 - hpPct, grayAmt / Game.pMaxHp);
        let grayFill = document.getElementById("playerGrayHpFill");
        if (!grayFill && fill.parentNode) {
            grayFill = document.createElement("div");
            grayFill.id = "playerGrayHpFill";
            grayFill.style.cssText = "position:absolute;height:100%;background:#ff6600;opacity:0.75;top:0;pointer-events:none;transition:width 0.05s;";
            fill.parentNode.appendChild(grayFill);
        }
        if (grayFill) { grayFill.style.left = (hpPct*100)+"%"; grayFill.style.width = (grayPct*100)+"%"; }
        if (sFill) {
            sFill.style.width = (Math.min(30, Game.pShield) / 30 * 100) + "%";
            sFill.style.display = Game.pShield > 0 ? "block" : "none";
        }
        hpTxt.textContent = Game.player.hp + " / " + Game.pMaxHp + (Game.pShield > 0 ? ` (+${Game.pShield})` : "") + (grayAmt > 0 ? ` [${grayAmt}]` : "");
    }
    
    const mpF = document.getElementById("mpFill");
    const sLab = document.getElementById("skillLabel");
    if (mpF && sLab) {
        const pct = Math.floor((Game.pMp / (Game.pMaxMp || 100)) * 100);
        mpF.style.width = Math.min(100, pct) + "%";
        if (Game.pMp >= (Game.pMaxMp || 100)) {
            sLab.textContent = "READY!"; sLab.style.color = "#ffee00";
        } else {
            sLab.textContent = pct + "%"; sLab.style.color = "#00ffcc";
        }
    }

    // DASH 게이지 DOM 업데이트
    const dashFill = document.getElementById("dashFill");
    const dashLab  = document.getElementById("dashLabel");
    if (dashFill && Game.player) {
        const dashPct = 1 - Math.min(1, Game.player.dashCD / (75 * (Game.pDashCDMul || 1)));
        dashFill.style.width = (dashPct * 100) + "%";
        dashFill.style.background = dashPct >= 1 ? "#ffdd00" : "#aa9900";
        if (dashLab) {
            // SKILL과 동일하게 "READY!" 로 통일
            dashLab.textContent = dashPct >= 1 ? "READY!" : Math.floor(dashPct * 100) + "%";
            dashLab.style.color  = dashPct >= 1 ? "#ffee00" : "#aa9900";
        }
    }

    // STAMINA 게이지 DOM 업데이트
    const stamFill  = document.getElementById("staminaFill");
    const stamLab   = document.getElementById("staminaLabel");
    if (stamFill && Game.player) {
        const stam    = Game.player.stamina || 0;
        const stamMax = typeof STAMINA_MAX !== 'undefined' ? STAMINA_MAX : 100;
        const stamPct = Math.min(1, stam / stamMax);
        // STAMINA 색: greenyellow 기본, 부족하면 red로 경고
        const stamCol = stam < 15 ? "#ff4400" : "greenyellow";
        stamFill.style.width      = (stamPct * 100) + "%";
        stamFill.style.background = stamCol;
        if (stamLab) {
            if (stam >= stamMax) {
                stamLab.textContent = "MAX"; stamLab.style.color = "greenyellow";
            } else if (stam < 15) {
                stamLab.textContent = "EMPTY!"; stamLab.style.color = "#ff4400";
            } else {
                stamLab.textContent = Math.floor(stamPct * 100) + "%";
                stamLab.style.color = stamCol;
            }
        }
    }

    if (reviveLabel) {
        if (Game.pRevive > 0) {
            reviveLabel.style.display = "block";
            reviveLabel.textContent = "[불사조의 깃털 " + Game.pRevive + "개 보유중]";
        } else {
            reviveLabel.style.display = "none";
        }
    }

    const boss = Game.enemies.find(e => e.isBoss && e.active && !e.dead);
    if (boss && bossBarWrap) {
        bossBarWrap.style.display = "flex";
        document.getElementById("bossFill").style.width = (Math.max(0, boss.hp) / boss.maxHp * 100) + "%";
    } else if (bossBarWrap) {
        bossBarWrap.style.display = "none";
    }

    const regionNames = ["", "고블린 초원", "고블린 전초기지", "스켈레톤 무덤", "스켈레톤 감옥", "언데드 묘지", "저주받은 성당", "어둠의 숲", "마족 성채", "마왕성 입구", "마왕의 왕좌"];
    let rName = regionNames[Math.min(Game.worldN, 10)];
    // 튜토리얼일 때는 STAGE 0으로 표기 — 1-1로 잘못 표시되는 혼란 방지
    if (Game.isTutorial) {
        if (stageLabel) stageLabel.textContent = "STAGE 0  [ Tutorial ]";
    } else {
        if (stageLabel) stageLabel.textContent = `[${rName}] STAGE ${Game.worldN}-${Game.levelN}${Game.levelN === 3 ? " [BOSS]" : ""}`;
    }
    
    if(scoreLabel) scoreLabel.textContent = "SCORE: " + Game.score; 
    if(killLabel) killLabel.textContent = "처치: " + Game.kills;
}

// 💡 [패치] innerHTML을 사용하여 <br /> 태그가 정상적으로 줄바꿈되도록 수정
function showOv(t, s1, s2, btn) {
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.querySelector("h1").innerHTML = t;
        const subs = overlay.querySelectorAll(".sub"); 
        if (subs.length > 0) subs[0].innerHTML = s1; 
        if (subs.length > 1) subs[1].innerHTML = s2; 
        if (subs.length > 2) subs[2].innerHTML = "";
        const btnEl = document.querySelector(".startBtn"); 
        if (btnEl) btnEl.innerHTML = btn;
        
        overlay.style.display = "flex";
    }
}

// 💡 [패치] 로비 화면(메뉴) 복구 전용 함수 - innerHTML 사용으로 태그 깨짐 방지
function restoreLobbyUI() {
    // 로비 복귀 시 모든 BGM 완전 정지
    if (typeof stopBGM === 'function') stopBGM();
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.style.display = "flex";
        const h1 = overlay.querySelector("h1");
        if (h1) h1.innerHTML = "SKULL YUUSHA";
        const subs = overlay.querySelectorAll(".sub");
        if (subs.length > 0) subs[0].innerHTML = "저주에 의해 죽었지만 해골로 되살아난 용사. <br />마왕을 물리치고 저주를 풀기 위해 나아가야 한다.";
        if (subs.length > 1) subs[1].innerHTML = "[안내] 패링, 기본 공격 시 스킬 게이지가 충전됩니다.<br/> 게이지를 모아 강력한 기술을 사용하세요.";
        if (subs.length > 2) subs[2].innerHTML = "준비가 끝났다면 아래 버튼 또는 SPACE를 눌러주세요.";
        const btn = document.querySelector(".startBtn") || document.getElementById("startBtn");
        if (btn) btn.innerHTML = "▶ READY TO ADVENTURE";
    }
}

function startGame() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    // 사망 BGM 등 이전 BGM을 완전히 끊고 새로 시작 — 재시작 시 dead BGM 잔류 방지
    if (typeof stopBGM === 'function') stopBGM();
    playBGM('play');
    
    Game.score = 0; Game.kills = 0; Game.worldN = 1; Game.levelN = 1; 
    Game.pMp = 0; Game.comboCount = 0; Game.pRangeBonus = 0; Game.pBaseDef = 0; Game.pShield = 0;
    
    if (Game.pClass === 0) { 
        Game.pMaxHp = 50 + (Game.permHpLvl * 10); Game.pBaseDmg = 30 + (Game.permAtkLvl * 2); 
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 1.0;
    } else if (Game.pClass === 1) { 
        Game.pMaxHp = 35 + (Game.permHpLvl * 10); Game.pBaseDmg = 9999 + (Game.permAtkLvl * 2); 
        Game.pMoveSpdMul = 1.25; Game.pDashCDMul = 0.6; Game.pJmpMul = 1.15; Game.pBaseAtkSpd = 1.6; 
    } else if (Game.pClass === 2) { 
        Game.pMaxHp = 35 + (Game.permHpLvl * 10); Game.pBaseDef = -5; Game.pBaseDmg = 35 + (Game.permAtkLvl * 2); 
        Game.pMaxMp = 150; Game.pMoveSpdMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.5;
    }
    
    Game.pBaseDmgMul = 1.0; Game.pAtkSpdMul = 1.0; Game.pParryMp = 3; 
    Game.pSkillDmgMul = 1.0; Game.pExtraDmg = 0.0; Game.pHealOnHit = false;
    Game.pLifestealChance = 0.05; Game.pCritChance = 0.20; Game.pCritDmg = 1.5;
    // 영구 강화: 클래스 기본값에 더함 (덮어쓰기 아닌 누적)
    Game.pMaxHp  += (Game.permHpLvl  || 0) * 10;
    Game.pBaseDmg += (Game.permAtkLvl || 0) * 2;
    Game.pCritChance += (Game.permCritLvl || 0) * 0.02;
    Game.pMoveSpdMul += (Game.permSpdLvl  || 0) * 0.04;
    Game.pJmpMul     += (Game.permJmpLvl  || 0) * 0.05;
    Game.pDashCDMul   = Math.max(0.5, Game.pDashCDMul - (Game.permDashLvl || 0) * 0.05);
    Game.pCritDmg    += (Game.permCritDmgLvl || 0) * 0.15;
    Game.pMaxMp      += (Game.permMpLvl || 0) * 15;
    Game.pReflectDmg = 0; Game.pLowHpDmg = 1.0; Game.pDashInv = 0;
    Game.pProjSlow = 1.0; Game.pSkillWidth = 1.0; Game.pDmgReduction = 1.0; Game.pComboDur = 0; Game.pComboDmg = 0; Game.pRevive = 0;
    
    Game.pFinalDmgMul = 1.0; Game.pMultiplierItems = 0; Game.rerollCoins = 0; 
    Game.pRegenFrames = 0; Game.regenT = 0; Game.pHealOnClear = 0;
    Game.pParryBonus = 0; Game.pCursedPendant = false; Game.curseT = 0;
    Game.pDropRate = 0.35; Game.pBloodFestival = false; Game.obtainedItems = []; 
    
    Game.player = null; 
    Game.isPaused = false;
    Game.traps = [];
    Game.bloodDecals = [];
    Game.justDodgeActive = false;
    Game.justDodgeT = 0;
    Game.justDodgeDmgBonus = 1.0;
    // 런 결과 기록 초기화
    Game.runStats = { startTime: Date.now(), totalDmgDealt: 0, totalDmgTaken: 0, bossesKilled: 0, maxCombo: 0, itemsObtained: 0 };
    _appliedSynergies.clear(); 

    const bbw = document.getElementById("bossBarWrap");
    if(bbw) bbw.style.display = "none";
    // 조작법 안내 화면(tutorial_intro) → 튜토리얼 맵(play) → 1-1 순서
    // overlay 숨김은 여기서 먼저 처리
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none";

    if (typeof startTutorialIntro === 'function') {
        // tutorial_intro 상태로 전환 — 이후 gs 덮어쓰기 금지!
        startTutorialIntro();
        // transT는 tutorial_intro 렌더에서 별도 처리하므로 여기선 안 건드림
    } else if (typeof genTutorial === 'function') {
        genTutorial(); // genTutorial 내부에서 gs/transState 직접 세팅
    } else {
        if (typeof genStage === 'function') genStage(1, 1);
        if (typeof initSystems === 'function') initSystems();
        if (typeof initBloodDecals === 'function') initBloodDecals();
        Game.transState = 2; Game.transT = 255;
        Game.gs = "play";
    }
}

const startBtn = document.getElementById("startBtn");
if(startBtn) {
    startBtn.addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        if(overlay) overlay.style.display = "none";
        if (typeof startCutscene === 'function') startCutscene("opening");
        else Game.gs = "class_select";
    });
}

let lastTime = 0; const FPS = 60; const interval = 1000 / FPS; 

function updateClassSelect() {
    if (dn("ArrowRight") && !K.rDirOld) { Game.pClass = (Game.pClass + 1) % 3; playSfx('item'); }
    if (dn("ArrowLeft") && !K.lOld) { Game.pClass = (Game.pClass + 2) % 3; playSfx('item'); }

    if (dn("Space") && !K.spcOld) { startGame(); }
    if (dn("KeyS") && !K.sOld) { Game._prevShopGs = Game.gs; Game.gs = "shop"; playSfx('item'); }
}

// ==========================================
// 게임 상태별 업데이트/렌더 핸들러
// ==========================================

function tickRouteSelect(frameNow) {
    // 배경
    ctx.fillStyle = "#08040f";
    ctx.fillRect(0, 0, CW, CH);
    const grd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW*0.6);
    grd.addColorStop(0, "rgba(60,0,80,0.4)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, CW, CH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffcc00"; ctx.font = "bold 22px NeoDunggeunmo";
    ctx.fillText(`WORLD ${Game.worldN} 진입 전 - 루트 선택`, CW/2, 55);
    ctx.fillStyle = "#aaa"; ctx.font = "13px NeoDunggeunmo";
    ctx.fillText("앞으로 나아갈 길을 선택하라.", CW/2, 78);

    const opts = [
        { key: "1", label: "치유의 은혜", desc: "HP 50% 즉시 회복\n체력이 위험할 때 선택", col: "#ff4444" },
        { key: "2", label: "마나의 샘", desc: "마나 100% 즉시 회복\n필살기 연계 시 선택", col: "#44aaff" },
        { key: "3", label: "유물의 현현", desc: "패시브 유물 하나 더 선택\n강한 빌드를 원할 때", col: "#ffcc44" },
    ];
    opts.forEach((opt, i) => {
        const bx = 70 + i * 170, by = 110, bw = 155, bh = 150;
        const hover = (dn("Digit" + opt.key) || dn("Numpad" + opt.key));
        ctx.fillStyle = hover ? opt.col.replace(")", ",0.25)").replace("rgb","rgba") : "rgba(20,10,30,0.7)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = hover ? opt.col : "rgba(100,60,140,0.6)";
        ctx.lineWidth = hover ? 2 : 1;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = opt.col; ctx.font = "bold 16px NeoDunggeunmo";
        ctx.fillText(`[${opt.key}] ${opt.label}`, bx + bw/2, by + 30);
        ctx.fillStyle = "#ccc"; ctx.font = "12px NeoDunggeunmo";
        const lines = opt.desc.split("\n");
        lines.forEach((l, j) => ctx.fillText(l, bx + bw/2, by + 60 + j * 20));
    });
    ctx.textAlign = "left";

    if (dn("Digit1", "Numpad1") && !K.u1Old) {
        // 치유: HP 50% 회복
        if (Game.player) Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + Math.floor(Game.pMaxHp * 0.5));
        addText(320, 160, "HP +50% 회복!", "#ff4444", 80, 18, 0, 0.5);
        playSfx('item');
        Game.transState = 2; Game.transT = 255;
        Game.gs = "play"; playBGM('play');
        if (typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
    } else if (dn("Digit2", "Numpad2") && !K.u2Old) {
        // 마나 100% 회복
        Game.pMp = Game.pMaxMp;
        addText(320, 160, "MP 100% 회복!", "#44aaff", 80, 18, 0, 0.5);
        playSfx('item');
        Game.transState = 2; Game.transT = 255;
        Game.gs = "play"; playBGM('play');
        if (typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
    } else if (dn("Digit3", "Numpad3") && !K.u3Old) {
        // 유물 추가 선택: 업그레이드 화면 다시
        if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
        Game.gs = "upgrade";
        playBGM('upgrade');
    }
}

function tickMenu() {
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#2a0b4e");
    bgGrd.addColorStop(1, "#05020a");
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let x = 0; x < CW; x += TILE) ctx.fillRect(x, CH - TILE, TILE, TILE);

    if (dn("Space") && !K.spcOld) {
        const overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "none";
        playSfx('item');
        if (typeof startCutscene === 'function') startCutscene("opening");
        else Game.gs = "class_select";
    }
}

function tickClassSelect(frameNow) {
    updateClassSelect();
    if (typeof renderClassSelect === 'function') renderClassSelect(frameNow);
}

function tickShop() {
    updateShop();
    renderShop();
}

function tickUpgrade() {
    if (dn("KeyR") && !K.rOld && Game.rerollCoins > 0) {
        Game.rerollCoins--;
        playSfx('item');
        if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
    }
    renderUpgrade();
}

function tickPlay() {
    // 사망 → 게임오버 전환
    if (Game.gs === "dead" && Game.deadTimer <= 0) {
        Game.gs = "gameover";
        if (Game.score > Game.highScore) {
            Game.highScore = Game.score;
            localStorage.setItem("skull_highscore", Game.highScore);
        }
        const rs = Game.runStats;
        const runSec = rs ? Math.floor((Date.now() - rs.startTime) / 1000) : 0;
        const runMin = Math.floor(runSec / 60), runS = runSec % 60;
        const timeStr = `${runMin}분 ${runS}초`;
        const reachStr = `W${Game.worldN}-${Game.levelN} 도달  최대 ${rs ? rs.maxCombo : 0} 콤보`;
        showOv("YOU DIED", `스코어: ${Game.score}  (최고: ${Game.highScore})`, `${reachStr}  플레이 ${timeStr}`, "[Space]키로 로비로 복귀");
    }

    // 게임오버/클리어 → 로비 복귀
    if (Game.gs === "gameover" && dn("Space") && !K.spcOld) {
        stopBGM();
        // 깨진 맵/상태 완전 초기화 — 로비 복귀 후에도 이전 맵이 남아있는 버그 방지
        Game.platforms = []; Game.doors = []; Game.traps = []; Game.eventObjects = [];
        Game.enemies.forEach(e  => { e.active = false; e.isTutorialDummy = false; });
        Game.bullets.forEach(b  => b.active = false);
        Game.eBullets.forEach(b => b.active = false);
        Game.lasers.forEach(l   => l.active = false);
        Game.parts.forEach(p    => p.active = false);
        Game.texts.forEach(t    => t.active = false);
        Game.items.forEach(i    => i.active = false);
        Game.player       = null;
        Game.cutscene     = null;
        Game.isTutorial   = false;
        Game.camX         = 0;
        Game.camShake     = 0;
        Game.hitStop      = 0;
        Game.transT       = 0;
        Game.transState   = 0;
        Game.invT         = 0;
        Game.slowMoT      = 0;
        Game.justDodgeActive = false;
        Game.justDodgeT   = 0;
        const bbw = document.getElementById("bossBarWrap");
        if (bbw) bbw.style.display = "none";
        Game.gs = "menu";
        restoreLobbyUI();
        return;
    }
    if (Game.gs === "win" && dn("Space") && !K.spcOld) {
        stopBGM();
        if (typeof startCutscene === 'function') startCutscene("ending");
        else { Game.gs = "menu"; restoreLobbyUI(); }
        return;
    }

    // 로직 업데이트
    if ((Game.gs === "play" || Game.gs === "dead" || Game.gs === "boss_intro") && !Game.isPaused) {
        if (typeof update === 'function') update();
    }

    // 렌더 — cutscene/opening 계열은 switch에서 별도 처리하므로 여기선 skip
    if (typeof render === 'function'
        && Game.gs !== "cutscene"
        && Game.gs !== "opening_anim"
        && Game.gs !== "opening_end"
        && Game.gs !== "tutorial_intro") {
        render();
    }

    // 일시정지 오버레이
    if (Game.isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = "#fff"; ctx.font = "bold 40px NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText("PAUSED", CW/2, CH/2);
        ctx.font = "16px NeoDunggeunmo"; ctx.fillStyle = "#aaa";
        ctx.fillText("P: 재개 / R: 재시작 / ESC: 로비 복귀", CW/2, CH/2 + 40);
        ctx.textAlign = "left";
    }
}

function tickMuteOverlay() {
    if (dn("KeyM") && !K.mOld) Game.isMuted = !Game.isMuted;
    if (Game.isMuted) {
        ctx.fillStyle = "#ff0000"; ctx.font = "bold 16px NeoDunggeunmo"; ctx.textAlign = "right";
        ctx.fillText("음소거", CW - 20, 30); ctx.textAlign = "left";
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "12px NeoDunggeunmo"; ctx.textAlign = "right";
        ctx.fillText("M: 음소거", CW - 20, 30); ctx.textAlign = "left";
    }
}

// ==========================================
// 메인 루프
// ==========================================

// ── 튜토리얼 사전 안내 화면 렌더 ──────────────
const _TUTORIAL_PAGES = [
    {
        title: "[ 기본 조작 ]",
        lines: [
            "← → 키  :  이동",
            "X 키     :  점프  (공중에서 한 번 더 점프 가능)",
            "Z 키     :  대시  (짧은 무적 회피, 스태미나 소모)",
            "C 키     :  기본 공격  (3연타 콤보)",
            "↓ + C   :  강하 공격  (공중에서 아래방향+C, 체간 대량 감소)",
            "Shift 키 :  필살기  (MP 게이지 100% 시 발동)",
            "V 키     :  가드 / 패링",
        ]
    },
    {
        title: "[ 전투 심화: 콤보 & 체간 ]",
        lines: [
            "■ 콤보 시스템",
            "  C를 연속 입력하면 콤보 카운터 상승 → 데미지 보너스 누적.",
            "  피격되면 콤보가 초기화됩니다.",
            "",
            "■ 체간(Poise) & 기절(Stun)",
            "  모든 적은 HP 바 아래에 파란 체간 게이지를 가집니다.",
            "  체간이 0 → 기절(STUNNED) 상태 진입.",
            "  기절 중 C를 누르면 FATAL STRIKE 처형 (무적 + 고데미지)!",
            "  패링(V) 성공 시 체간 -50, 강하(↓+C) 적중 시 체간 -30.",
        ]
    },
    {
        title: "[ 방어 & 특수 상태 ]",
        lines: [
            "■ 가드 & 패링",
            "  V를 누르고 있으면 가드 (스태미나 서서히 소모).",
            "  공격이 닿는 순간 V를 누르면 패링 → MP 회복 + 적 경직!",
            "",
            "■ 가드 브레이크",
            "  스태미나 0인 채로 피격 → 가드 브레이크 (치명 넉백).",
            "  스태미나 게이지를 항상 확인하세요.",
            "",
            "■ Witch Time (저스트 회피)",
            "  대시 직후 피격되면 슬로모션 발동 → 다음 공격 2배 데미지!",
        ]
    },
];

function _renderTutorialIntro(frameNow) {
    const page = Game.tutorialIntroPage || 0;
    const data = _TUTORIAL_PAGES[Math.min(page, _TUTORIAL_PAGES.length - 1)];

    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = "rgba(180,30,30,0.3)"; ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, CW - 24, CH - 24);

    // 페이지
    ctx.fillStyle = "#555"; ctx.font = "11px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "right";
    ctx.fillText(`${page + 1} / ${_TUTORIAL_PAGES.length}`, CW - 22, 30);
    ctx.textAlign = "left";

    // 제목
    ctx.fillStyle = "#ff4422"; ctx.font = "bold 18px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 8; ctx.shadowColor = "#ff2200";
    ctx.fillText(data.title, 30, 48);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(180,60,40,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, 56); ctx.lineTo(CW - 30, 56); ctx.stroke();

    data.lines.forEach((line, i) => {
        if (!line) return;
        if (line.startsWith("■")) {
            ctx.fillStyle = "#ffcc44"; ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
        } else if (line.startsWith("  ")) {
            ctx.fillStyle = "#cccccc"; ctx.font = "12px SkullFont, NeoDunggeunmo";
        } else {
            ctx.fillStyle = "#eeeeee"; ctx.font = "13px SkullFont, NeoDunggeunmo";
        }
        ctx.fillText(line, 30, 76 + i * 22);
    });

    const blink = Math.floor(frameNow / 400) % 2 === 0;
    ctx.font = "bold 12px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
    if (page < _TUTORIAL_PAGES.length - 1) {
        ctx.fillStyle = blink ? "#ffcc44" : "#886622";
        ctx.fillText("[ SPACE / → ] 다음 페이지  |  [ ← ] 이전", CW / 2, CH - 20);
    } else {
        ctx.fillStyle = blink ? "#00ffcc" : "#008866";
        ctx.shadowBlur = blink ? 8 : 0; ctx.shadowColor = "#00ffcc";
        ctx.fillText("[ SPACE ] 튜토리얼 시작!", CW / 2, CH - 20);
        ctx.shadowBlur = 0;
    }
    ctx.textAlign = "left";

    if (!Game._tutPageOld) Game._tutPageOld = {};
    const isLastPage = page >= _TUTORIAL_PAGES.length - 1;
    // 마지막 페이지는 Space만 진행 — 방향키로 실수 진입 방지
    const spNow   = isLastPage ? dn("Space") : dn("Space", "ArrowRight");
    const backNow = dn("ArrowLeft");
    if (spNow && !Game._tutPageOld.sp) {
        if (!isLastPage) { Game.tutorialIntroPage++; }
        else if (typeof genTutorial === 'function') { genTutorial(); }
    }
    if (backNow && !Game._tutPageOld.back && page > 0) { Game.tutorialIntroPage--; }
    Game._tutPageOld.sp   = spNow;
    Game._tutPageOld.back = backNow;
}

function loop(currentTime) {
    if (typeof ensureAudioRunning === 'function') ensureAudioRunning();
    requestAnimationFrame(loop);
    const deltaTime = currentTime - lastTime;
    if (deltaTime < interval) return;

    lastTime = currentTime - (deltaTime % interval);
    const frameNow = Date.now();

    // P키 일시정지 토글
    if (dn("KeyP") && !K.pOld) {
        if (Game.gs === "play" || Game.gs === "boss_intro") { Game.isPaused = !Game.isPaused; playSfx('item'); }
    }

    // 일시정지 중 단축키
    if (Game.isPaused) {
        if (dn("KeyR") && !K.rOld) { Game.isPaused = false; startGame(); }
        if (dn("Escape") && !K.escOld) {
            Game.isPaused = false;
            stopBGM();
            Game.gs = "menu";
            restoreLobbyUI();
        }
    }

    // 화면 전환 페이드
    if (Game.transState === 1) {
        Game.transT += 15;
        if (Game.transT >= 255) { Game.transT = 255; if (typeof nextStageTrigger === 'function') nextStageTrigger(); }
    } else if (Game.transState === 2) {
        Game.transT -= 15;
        if (Game.transT <= 0) { Game.transT = 0; Game.transState = 0; }
    }

    // 상태별 디스패치
    switch (Game.gs) {
        case "menu":         tickMenu();              break;
        case "class_select": tickClassSelect(frameNow); break;
        case "shop":         tickShop();              break;
        case "upgrade":      tickUpgrade();           break;
        case "route_select": tickRouteSelect(frameNow); break;
        case "cutscene":
            if (typeof updateCutscene === 'function') updateCutscene();
            if (typeof renderCutscene === 'function') renderCutscene(frameNow);
            break;
        case "opening_anim":
            if (typeof updateOpeningAnim === 'function') updateOpeningAnim();
            if (typeof renderOpeningAnim === 'function') renderOpeningAnim(frameNow);
            break;
        case "opening_end":
            if (typeof updateOpeningAnim === 'function') updateOpeningAnim();
            if (typeof renderOpeningAnim === 'function') renderOpeningAnim(frameNow);
            break;
        case "tutorial_intro":
            // 배경 + 페이드인도 같이 처리
            ctx.fillStyle = "#000"; ctx.fillRect(0, 0, CW, CH);
            _renderTutorialIntro(frameNow);
            // 페이드인 오버레이 (startGame에서 transT=255로 세팅됨)
            if (Game.transT > 0) {
                ctx.fillStyle = `rgba(0,0,0,${Game.transT / 255})`;
                ctx.fillRect(0, 0, CW, CH);
            }
            break;
        default:             tickPlay();              break;
    }

    // 음소거 오버레이 (메뉴/클래스선택/상점 제외)
    if (Game.gs !== "menu" && Game.gs !== "class_select" && Game.gs !== "shop" && Game.gs !== "cutscene" && Game.gs !== "opening_anim") {
        tickMuteOverlay();
    }

    // 키 상태 스냅샷 (엣지 감지용)
    K.escOld   = dn("Escape");
    K.mOld     = dn("KeyM");
    K.rOld     = dn("KeyR");
    K.u1Old    = dn("Digit1", "Numpad1");
    K.u2Old    = dn("Digit2", "Numpad2");
    K.u3Old    = dn("Digit3", "Numpad3");
    K.sOld     = dn("KeyS");
    K.lOld     = dn("ArrowLeft");
    K.rDirOld  = dn("ArrowRight");
    K.pOld     = dn("KeyP");
    K.spcOld   = dn("Space");
    // 🔥 [버그 수정] 상호작용 키(ArrowUp) 엣지 감지 추가
    K.upOld    = dn("ArrowUp");

    if (typeof updateHUD === 'function') updateHUD();
}

requestAnimationFrame((time) => { lastTime = time; loop(time); });