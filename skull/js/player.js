// player.js — 플레이어/투사체/이벤트 업데이트
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
    // 화톳불 휴식 중: 이동 잠금
    if ((Game._bonfireRestT || 0) > 0) {
        Game._bonfireRestT--;
        p.vx = 0;
        if (p.atkT > 0) p.atkT--;
        if (Game.invT > 0) Game.invT--;
        p.vy = Math.min(p.vy + GRAV, 9);
        p.y += p.vy;
        if (typeof resolveAABB === 'function') resolveAABB(p);
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
    if ((Game.pGunReload || 0) > 0) {
        const currentAtkSpd = (Game.pBaseAtkSpd || 1.0) * (Game.pAtkSpdMul || 1.0);
        Game.pGunReload -= currentAtkSpd; 
        
        if (Game.pGunReload <= 0) {
            Game.pGunReload = 0;
            if (Game.pClass === 4) {
                Game.pGunAmmo = 8;
            }
        }
    }
    Game._breathT = ((Game._breathT || 0) + 1) % 120;
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
        const dashCost = typeof STAMINA_DASH !== 'undefined' ? STAMINA_DASH : 35;
        const hasStamina = typeof consumeStamina !== 'function' || consumeStamina(dashCost);
        if (!hasStamina) {
            if (!p._staminaWarnT || p._staminaWarnT <= 0) {
                addText(p.x, p.y - 20, "STAMINA!", "#ff6600", 50, 11);
                p._staminaWarnT = 60;
            }
        } else {
            p.dashT = 15 + Game.pDashInv;
            p.dashCD = Math.floor(75 * Game.pDashCDMul);
            p.vy = 0; p.plunging = false; if(typeof playSfx === 'function') playSfx('dash');
        }
    }
    
    if (p.dashT > 0) {
        p.dashT--; p.vx = p.facing * 5.3 * Game.pMoveSpdMul; p.vy = 0; 
        if(typeof addPart === 'function') addPart(p.x + 7, p.y + 9, "#ffffff", 10, 3);
        if (p.dashT === 0 && Game.invT === 0) {
            Game.invT = 20; 
        }
    } else if (p.kbT > 0) {
        p.kbT--; p.vx *= 0.9;
    } else {
        let mx = 0; 
        if (!p.guarding && !p.plunging) { 
            if (dn("ArrowLeft")) mx = -1; 
            if (dn("ArrowRight")) mx = 1; 
        }
        if (mx !== 0) p.facing = mx; p.vx = mx * 2.4 * Game.pMoveSpdMul; 
    }
    if (p.dashCD > 0) p.dashCD--;
    if (p.dashGauge < 100) {
        p.dashGauge += 0.8; 
        if (p.dashGauge > 100) p.dashGauge = 100; 
    }
    if (p._staminaWarnT > 0) p._staminaWarnT--;

    if (p.onGround) {
        p.airDashUsed = false; 
        p.jumpCount = 0;
        p.plungeCount = 0; 
        p.hasPlunged = false; 
    }
    
    // 이벤트 오브젝트 근처에서 ↑키는 점프 대신 상호작용으로 처리
    const _nearEv = Game.eventObjects && Game.eventObjects.some(ev =>
        !ev.used && Math.abs((p.x + p.w/2) - (ev.x + ev.w/2)) < 55 && Math.abs(p.y - ev.y) < 70);
    const jpNow = dn("KeyX") || (dn("ArrowUp") && !_nearEv);
    if (jpNow && !p.jpOld && !p.guarding && p.kbT <= 0 && !p.plunging) {
        if (p.onGround) {
            p.vy = -7.5 * Game.pJmpMul; p.jumpCount = 1;
            if(typeof playSfx === 'function') playSfx('jump');
            for (let i = 0; i < 4; i++) if(typeof addPart === 'function') addPart(p.x + 7, p.y + 18, "#6060ff", 12);
        } else if (p.jumpCount < 2) {
            p.vy = -6.5 * Game.pJmpMul; p.jumpCount = 2;
            if(typeof playSfx === 'function') playSfx('jump');
            for (let i = 0; i < 6; i++) if(typeof addPart === 'function') addPart(p.x + 7, p.y + 18, "#ff60ff", 15);
        }
    }
    p.jpOld = jpNow;
    p.gOld  = dn("KeyV"); 

    if (!p.onGround && dn("ArrowDown") && dn("KeyC") && !p.plunging && p.atkT === 0 && p.dashT <= 0 && !p.hasPlunged) {
        let canPlunge = true;

        if (Game.pClass === 4 && ((Game.pGunReload || 0) > 0 || (Game.pGunAmmo !== undefined && Game.pGunAmmo <= 0))) {
            canPlunge = false;
        }
        if (Game.pClass === 2 && (p.plungeCount || 0) >= 3) {
            canPlunge = false;
        }

        if (canPlunge) {
            const hasStamina = typeof consumeStamina !== 'function' || consumeStamina(35);
            if (!hasStamina) {
                if (!p._staminaWarnT || p._staminaWarnT <= 0) {
                    addText(p.x, p.y - 20, "스태미너 부족!", "#ff6600", 50, 11);
                    p._staminaWarnT = 60;
                }
                canPlunge = false;
            }
        }

        if (canPlunge) {
            p.plunging = true;
            
            if (Game.pClass === 4) {
                p.hasPlunged = true;
                if (Game.pGunAmmo === undefined) Game.pGunAmmo = 8;
                const shots = Game.pGunAmmo;
                p.vy = -3; p.vx = p.facing * -1.5; // 첫 반동: 위로 튀어오름
                for (let qi = 0; qi < shots; qi++) {
                    setTimeout(() => {
                        if (!Game.player || Game.player.dead) return;
                        const pp = Game.player;
                        // 발사 반동: 매 발마다 위로 살짝 뜨고 뒤로 밀림
                        pp.vy = -5;
                        pp.vx = pp.facing * -1.5;
                        const currentDmg2 = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul||1) * (Game.pFinalDmgMul||1) * 1.6);
                        const yOff = (pp.h/2) - qi * 4;
                        if(typeof spawnBullet === 'function') spawnBullet(pp.x + pp.w/2, pp.y + yOff, pp.facing * 10, 9, 40, 5, 0, currentDmg2);
                        if(typeof playSfx === 'function') playSfx('gun_shot');
                    }, qi * 60);
                }
                Game.pGunAmmo = 0;
                Game.pGunReload = 90;
                if (!Game._reloadTextShown) {
                    addText(p.x, p.y-22, "재장전 중...", "#aaaaaa", 90, 12);
                    Game._reloadTextShown = true;
                    setTimeout(() => { Game._reloadTextShown = false; }, 1500);
                }
                p.atkT = Math.max(shots * 60 / 16, 20);

            } else if (Game.pClass === 2) {
                p.plunging = false; // 오타 수정 완료
                p.plungeCount = (p.plungeCount || 0) + 1;
                p.atkT = Math.floor(20 / ((Game.pBaseAtkSpd || 1) * (Game.pAtkSpdMul || 1)));
                p.vy = -5;
                if (p.plungeCount >= 3) p.hasPlunged = true; 

                if(typeof playSfx === 'function') playSfx('atk');
                Game.camShake = 5;
                let currentBaseDmg2 = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
                const isCritAir = Math.random() < (Game.pCritChance || 0.2);
                const pdmg2 = Math.floor(currentBaseDmg2 * 1.4 * (isCritAir ? (Game.pCritDmg||1.5) : 1) * (Game.pFinalDmgMul||1));
                
                // 전방 사격 삭제 후 아래 방향 3연발 
                if(typeof spawnBullet === 'function') {
                    spawnBullet(p.x + 7, p.y + 18, 0, 10, 30, 8, 0, pdmg2);
                    spawnBullet(p.x + 7, p.y + 18, -2, 9, 30, 8, 0, pdmg2);
                    spawnBullet(p.x + 7, p.y + 18, 2, 9, 30, 8, 0, pdmg2);
                }
                Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 3);

            } else {
                p.hasPlunged = true; 
                if (Game.pClass === 1) {
                    p.vy = 14; p.vx = p.facing * 6;
                } else {
                    p.vy = 12; p.vx = 0;
                }
            }
        }
    }
    
    if (p.plunging) {
        if (Game.pClass === 1) {
            p.vy = 14; p.vx = p.facing * 6; if(typeof addPart === 'function') addPart(p.x+7, p.y+9, "#ff0055", 5);
        } else if (Game.pClass === 4) {
            p.plunging = false;
        } else if (Game.pClass === 3) {
            p.vy = 14; p.vx = 0; if(typeof addPart === 'function') addPart(p.x+7, p.y+9, "#cc0000", 5);
        } else if (Game.pClass === 5) {
            p.vy = 13; p.vx = 0; if(typeof addPart === 'function') addPart(p.x+7, p.y+9, "#ffdd00", 5);
        } else {
            p.vy = 12; p.vx = 0; if(typeof addPart === 'function') addPart(p.x+7, p.y+9, "#ffaa00", 5);
        }
    } else if (p.dashT <= 0 && Game.pClass === 4 && p.plunging && p.atkT > 0 && !p.onGround) {
        p.vy = 0;
    } else if (p.dashT <= 0 && Game.pClass !== 2) {
        p.vy = Math.min(p.vy + GRAV, 9); 
    } else if (p.dashT <= 0 && Game.pClass === 2) {
        p.vy = Math.min(p.vy + GRAV * 0.8, 8);
    }
    
    if (p.dashT > 0) {
        const trailCol = Game.pClass === 0 ? "#ff2200" : (Game.pClass === 1 ? "#aa00ff" : "#00ccff");
        for (let i = 0; i < 3; i++) if(typeof addPart === 'function') addPart(p.x + Math.random() * p.w, p.y + Math.random() * p.h, trailCol, 10, 3);
    }

    p.x += p.vx;
    p.y += p.vy;

    if (typeof resolveAABB === 'function') resolveAABB(p);
    
    if (p.plunging && p.onGround) {
        p.plunging = false; p.atkT = 20; Game.hitStop = 10; 
        if(typeof playSfx === 'function') playSfx('plunge_land');
        p.hasPlunged = false; 
        
        const plungeCol = Game.pClass === 0 ? "#ff4400"
            : (Game.pClass === 1 ? "#cc44ff"
            : (Game.pClass === 3 ? "#880000"   
            : (Game.pClass === 4 ? "#ffcc00"   
            : (Game.pClass === 5 ? "#ffe040"   
            : "#00ccff"))));
        Game.camShake = Game.pClass === 3 ? 40 : (Game.pClass === 5 ? 28 : 20);
        const plungeRingCol = Game.pClass === 3 ? "#aa0000"  
            : (Game.pClass === 5 ? "#ffee44"              
            : plungeCol);
        for (let i = 0; i < 30; i++) if(typeof addPart === 'function') addPart(p.x + 7, p.y + 18, plungeCol, 25, 4);
        if(typeof spawnLaser === 'function') spawnLaser(p.x - 30, p.y + 14, 60, 6, 8, plungeRingCol, 0, true);
        
        let currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
        const isCritPlunge = Math.random() < (Game.pCritChance || 0.2);
        let pdmg = Math.floor(currentBaseDmg * 1.6 * (Game.pFinalDmgMul || 1)
            * (isCritPlunge ? (Game.pCritDmg || 1.5) : 1)
            * (p.hp / Game.pMaxHp < 0.3 ? (Game.pLowHpDmg || 1.5) : 1));
        pdmg += Math.floor(Game.comboCount / 10) * (Game.pComboDmg || 5);
        if (pdmg < 1) pdmg = 1;
        
        Game.enemies.forEach(e => {
            if (e.active && !e.dead && Math.abs(e.x - p.x) < 80 && Math.abs(e.y - p.y) < 80) {
                if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 15);
            }
        });
        
        let plungeHitAny = false;
        Game.enemies.forEach(e => {
            if (e.active && !e.dead && Math.abs(e.x - p.x) < 80 && Math.abs(e.y - p.y) < 80) {
                plungeHitAny = true;
            }
        });
        
        if (plungeHitAny) {
            Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 5);
            Game.comboCount = (Game.comboCount || 0) + 1;
            Game.comboTimer = 150 + (Game.pComboDur || 0);
            if (Game.runStats) Game.runStats.maxCombo = Math.max(Game.runStats.maxCombo || 0, Game.comboCount);
        }

        if (Game.pClass === 1) {
            if(typeof spawnBullet === 'function') spawnBullet(p.x + 7, p.y + 5, p.facing * 10, 0, 10, 15, 2, pdmg);
            if(typeof spawnBullet === 'function') spawnBullet(p.x + 7, p.y + 5, p.facing * 12, 0, 10, 15, 2, pdmg);
        } else if (Game.pClass === 4) {
            for (let qi = 0; qi < 4; qi++) {
                setTimeout(() => {
                    if (!Game.player) return;
                    const pp = Game.player;
                    const yOff = (pp.h / 2) - qi * 5;
                    if(typeof spawnBullet === 'function') spawnBullet(pp.x + pp.w/2, pp.y + yOff, pp.facing * 10, 9, 35, 5, 0, pdmg);
                    if(typeof playSfx === 'function') playSfx('gun_shot');
                    for (let j=0;j<3;j++) if(typeof addPart === 'function') addPart(pp.x+pp.w/2+pp.facing*8, pp.y+yOff, "#ffcc00", 10, 3);
                }, qi * 80);
            }
        } else {
            if(typeof spawnBullet === 'function') spawnBullet(p.x - 10, p.y + 5, -8, 0, 15, 18, 2, pdmg);
            if(typeof spawnBullet === 'function') spawnBullet(p.x + 10, p.y + 5, 8, 0, 15, 18, 2, pdmg);
        }
    }

    p.x = Math.max(0, Math.min(Game.levelW - p.w, p.x));
    
    if (p.y > CH + 60) { 
        p.guarding = false; p.plunging = false; p.dashT = 0;
        let fallDmg = Math.floor(p.hp * 0.3);
        if (fallDmg < 1) fallDmg = 1;
        if(typeof takeDmg === 'function') takeDmg(fallDmg, null, true); 
        
        let safePlatform = Game.platforms.find(t => t.float && !t.drop && !t.vx) || Game.platforms.find(t => t.float && !t.drop) || Game.platforms[0];
        if (safePlatform) {
            p.x = safePlatform.x + safePlatform.w / 2 - p.w / 2;
            p.y = safePlatform.y - p.h - 20;
        } else {
            p.x = 80; p.y = -50;
        }
        p.vx = 0; p.vy = 0; 
    }

    if (p.atkT > 0) p.atkT--; if (p.atkAnim > 0) p.atkAnim--; if (Game.invT > 0) Game.invT--;
}

function updatePlayerCombat() {
    const p = Game.player;
    if (p.dead) return;
    
    const currentAtkSpd = (Game.pBaseAtkSpd || 1.0) * (Game.pAtkSpdMul || 1.0);
    const currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);

    const _npcTalking = Game.eventObjects && Game.eventObjects.some(ev => ev.type === 'npc' && ev.talking);
    if (dn("KeyC") && !dn("ArrowDown") && p.atkT === 0 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && !_npcTalking) {
        if(typeof playSfx === 'function') playSfx('atk');
        let maxCombo = (Game.pClass === 1) ? 5 : 3;
        p.combo = (p.combo % maxCombo) + 1; 
        const isLastHit = p.combo === maxCombo;
        
        if (Game.pClass === 4) {
            p.atkT = Math.max(1, Math.floor(14 / currentAtkSpd));
            p.atkAnim = 12;
        } else {
            p.atkT = Math.max(1, Math.floor((isLastHit ? 35 : 16) / currentAtkSpd));
            p.atkAnim = Math.max(1, Math.floor((isLastHit ? 20 : 12) / currentAtkSpd));
        }
        
        p.comboT = 50;
        if (!p.onGround) p.vy = Math.min(p.vy, 1);

        // 마법사/발키리는 투사체 사거리만 적용 (무기 길이 시각적 변화 없음)
        const _projOnly = (Game.pClass === 2 || Game.pClass === 4);
        const rangeX = (isLastHit ? 45 : 30) + (_projOnly ? 0 : Game.pRangeBonus);
        const rangeY = (isLastHit ? 55 : 40) + (_projOnly ? 0 : Game.pRangeBonus * 0.5);
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
            const mageRange = 40 + (Game.pRangeBonus || 0);
            if(typeof spawnBullet === 'function') spawnBullet(cx, cy, p.facing * 8, 0, mageRange, 6, 0, dmg);
            if (isLastHit) {
                if(typeof spawnBullet === 'function') {
                    spawnBullet(cx, cy - 10, p.facing * 8, -2, mageRange, 6, 0, dmg);
                    spawnBullet(cx, cy + 10, p.facing * 8, 2, mageRange, 6, 0, dmg);
                }
                Game.camShake = 5;
            }
            Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 3);
            Game.comboCount++; Game.comboTimer = 150 + Game.pComboDur;
        } else if (Game.pClass === 4) {
            if ((Game.pGunReload || 0) > 0) {
            } else {
                if (Game.pGunAmmo === undefined) Game.pGunAmmo = 8;
                if (Game.pGunAmmo <= 0) {
                    // 탄약 소진 — 재장전 시작 (ammo는 완료 시 복구)
                    if ((Game.pGunReload || 0) <= 0) {
                        Game.pGunReload = Math.max(30, Math.floor(90/((Game.pBaseAtkSpd||1)*(Game.pAtkSpdMul||1))));
                        if (!Game._reloadTextShown) {
                            addText(p.x, p.y - 22, "재장전 중...", "#aaaaaa", 90, 12);
                            Game._reloadTextShown = true;
                            setTimeout(() => { Game._reloadTextShown = false; }, 1500);
                        }
                    }
                } else {
                    const gunRange = 40 + (Game.pRangeBonus || 0);
                    if(typeof spawnBullet === 'function') spawnBullet(cx, cy-2, p.facing*14, -0.1, gunRange, 5, 0, dmg);
                    Game.pGunAmmo--;
                    if(typeof playSfx === 'function') playSfx('gun_shot');
                    Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 1);
                    if (Game.pGunAmmo <= 0) {
                        Game.pGunReload = 90;
                        Game.pGunAmmo = 8;
                        if (!Game._reloadTextShown) {
                            addText(p.x, p.y - 22, "재장전 중...", "#aaaaaa", 90, 12);
                            Game._reloadTextShown = true;
                            setTimeout(() => { Game._reloadTextShown = false; }, 1500);
                        }
                    }
                }
            }
        } else {
            let hitTarget = false;
            Game.enemies.forEach((e) => {
                if (!e.active || e.dead) return;
                if (Math.abs(e.x + e.w / 2 - cx) < rangeX / 2 + e.w / 2 && Math.abs(e.y + e.h / 2 - cy) < rangeY / 2 + e.h / 2) {
                    if (e.isBoss && (e.y + e.h) < Game.player.y) return;
                    if(typeof hitE === 'function') hitE(e, dmg, p.facing, isCrit, Game.pExtraDmg);
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
                if (Game.comboCount === 10) { if(typeof playSfx === 'function') playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "10 콤보!", "#dddddd", 50, 18); }
                else if (Game.comboCount === 30) { if(typeof playSfx === 'function') playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "30 콤보!!", "#ff6600", 60, 22); }
                else if (Game.comboCount === 50) { if(typeof playSfx === 'function') playSfx('combo_high'); addText(Game.player.x, Game.player.y - 40, "50 콤보!!!", "#ff0000", 70, 26); }
            } 
            for (let i = 0; i < (isLastHit ? 15 : 6); i++) { if(typeof addPart === 'function') addPart(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20, isLastHit ? "#ff2222" : "#ffffff", 15, 3); }
        }
    }

    if (dn("ShiftLeft", "ShiftRight") && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && p.atkT === 0) {
        const skillMpCost = 15;
        if (Game.pMp < skillMpCost) {
            if (!Game._skillWarnT || Game._skillWarnT <= 0) {
                addText(p.x, p.y - 30, "마나 부족!", "#8888ff", 40, 13);
                Game._skillWarnT = 45;
            }
        } else {
            Game.pMp -= skillMpCost;
            p.atkT = Game.pClass === 3 ? 40 : (Game.pClass === 5 ? 30 : 20);
            // 스킬 시전 중 무적 (시전시간 + 60프레임 = 1초~1.5초)
            Game.invT = Math.max(Game.invT || 0, p.atkT + 60);
            if(typeof playSfx === 'function') playSfx('skill');
            let skillDmg = Math.floor(currentBaseDmg * 5 * Game.pSkillDmgMul * Game.pFinalDmgMul);
            const laserW = 280 + (Game.pRangeBonus || 0);
            const laserX = p.facing > 0 ? p.x + p.w : p.x - laserW;
            const cx = p.x + p.w / 2, cy = p.y + p.h / 2;

            if (Game.pClass === 0) {
                const teleRange = 600; 
                const startX  = p.x;
                const hitList = [];
                Game.enemies.forEach(e => {
                    if (!e.active || e.dead) return;
                    const edx = (e.x + e.w/2) - (p.x + p.w/2);
                    if (Math.sign(edx) === p.facing
                        && Math.abs(edx) < teleRange
                        && Math.abs((e.y+e.h/2) - (p.y+p.h/2)) < 45) {
                        hitList.push(e);
                    }
                });
                if (hitList.length > 0) {
                    const farthest = hitList.reduce((a, b) =>
                        Math.abs((b.x+b.w/2)-(p.x+p.w/2)) > Math.abs((a.x+a.w/2)-(p.x+p.w/2)) ? b : a);
                    p.x = farthest.x + p.facing * 30; 
                } else {
                    p.x = Math.max(0, Math.min(Game.levelW - p.w, p.x + p.facing * teleRange));
                }
                p.vx = 0; p.atkT = 20;
                hitList.forEach(e => {
                    if (typeof hitE === 'function') hitE(e, skillDmg, p.facing, false);
                    if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 25);
                    for (let j=0;j<8;j++) if(typeof addPart === 'function') addPart(e.x+e.w/2, e.y+e.h/2, j<5?"#ff2200":"#ff6600", 22, 4);
                });
                const dist = Math.abs(p.x - startX);
                for (let i = 0; i < 18; i++) {
                    const tx = startX + p.facing * (dist * i / 18);
                    if(typeof addPart === 'function') addPart(tx + (Math.random()-0.5)*8, cy + (Math.random()-0.5)*16, "#ff4400", 18, 3);
                }
                for (let i = 0; i < 50; i++) if(typeof addPart === 'function') addPart(p.x+p.w/2, cy, i<30?"#ff2200":i<45?"#ff6600":"#ffffff", 35, i<25?6:3);
                addText(p.x, p.y - 35, "파워스트라이크", "#ffffff", 50, 20);
                Game.skillFlashCol = "rgba(180,0,0,0.3)"; Game.skillFlashT = 16; Game.camShake = 12;

            } else if (Game.pClass === 1) {
                const sRange1 = 60 + (Game.pRangeBonus || 0);

                addText(p.x, p.y-35, "새비지블로우", "#cc00ff", 50, 20);
                for (let i = 0; i < 20; i++) if(typeof addPart === 'function') addPart(cx + p.facing*(10+Math.random()*40), cy+(Math.random()-0.5)*20, i<12?"#cc00ff":"#6600cc", 22, 3);
                Game.skillFlashCol = "rgba(80,0,150,0.25)"; Game.skillFlashT = 18;

                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        if (!Game.player || Game.player.dead) return;
                        const pp = Game.player;
                        pp.atkAnim = 10; pp.combo = (i % 2) + 1;
                        Game.enemies.forEach(e => {
                            if (!e.active || e.dead) return;
                            const edx = (e.x+e.w/2)-(pp.x+pp.w/2);
                            if (Math.sign(edx) === pp.facing && Math.abs(edx) < sRange1 && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2)) < 35) {
                                if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg*0.22), pp.facing, false);
                            }
                        });
                        for (let j=0;j<6;j++) if(typeof addPart === 'function') addPart(pp.x+pp.w/2+pp.facing*25, pp.y+pp.h/2+(Math.random()-0.5)*20, "#aa00ff", 12, 3);
                        if(typeof playSfx === 'function') playSfx('atk');
                    }, i * 65);
                }

                setTimeout(() => {
                    if (!Game.player || Game.player.dead) return;
                    const pp = Game.player;
                    const blinkRange = 200;
                    const blinkStartX = pp.x;
                    const cy = pp.y + pp.h / 2; 
                    const blinkHitList = [];

                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        const edx = (e.x+e.w/2)-(pp.x+pp.w/2);
                        if (Math.sign(edx)===pp.facing && Math.abs(edx)<blinkRange && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2))<40)
                            blinkHitList.push(e);
                    });

                    if (blinkHitList.length > 0) {
                        const farthest = blinkHitList.reduce((a,b) =>
                            Math.abs((b.x+b.w/2)-(pp.x+pp.w/2))>Math.abs((a.x+a.w/2)-(pp.x+pp.w/2))?b:a);
                        pp.x = farthest.x + pp.facing * 20;
                    } else {
                        pp.x = Math.max(0, Math.min(Game.levelW-pp.w, pp.x+pp.facing*blinkRange));
                    }
                    
                    pp.vx = pp.facing * 10; pp.dashT = 8;
                    const blinkDist = Math.abs(pp.x-blinkStartX);
                    
                    for (let i=0;i<10;i++) {
                        const tx = blinkStartX + pp.facing*(blinkDist*i/10);
                        if(typeof addPart === 'function') addPart(tx+(Math.random()-0.5)*6, cy+(Math.random()-0.5)*12, "#aa00ff", 14, 2);
                    }

                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        const edx = (e.x+e.w/2)-(pp.x+pp.w/2);
                        if (Math.sign(edx) === pp.facing && Math.abs(edx) < sRange1+40 && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2)) < 40) {
                            if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg*0.7), pp.facing, false);
                            if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 30);
                        }
                    });
                    for (let j = 0; j < 25; j++) if(typeof addPart === 'function') addPart(pp.x+pp.w/2+pp.facing*30, pp.y+pp.h/2, j<15?"#cc00ff":"#550088", 28, 4);
                    Game.camShake = 15;
                }, 6 * 65);

            } else if (Game.pClass === 2) {
                if(typeof spawnBullet === 'function') spawnBullet(cx, cy, p.facing*0.8, 0, 300, 30, 4, Math.floor(skillDmg*0.55));
                for (let i=0;i<55;i++) {
                    const ang = (Math.random() - 0.5) * 1.2;
                    if(typeof addPart === 'function') addPart(cx+p.facing*15, cy+(Math.random()-0.5)*20,
                        i<25?"#00ccff":i<45?"#0088cc":"#ffffff", 40, i<30?7:4);
                }
                addText(p.x, p.y-35, "에너지 볼트", "#00ccff", 65, 22);
                Game.skillFlashCol = "rgba(0,160,220,0.35)"; Game.skillFlashT = 18; Game.camShake = 8;

            } else if (Game.pClass === 3) {
                p.vy = -14; p.vx = 0; p.onGround = false;
                Game._berserkSlam = true; 

                setTimeout(() => {
                    if (!Game.player || Game.player.dead) return;
                    Game.player.vy = 18; 
                    Game.player.vx = 0;
                    for (let i=0;i<8;i++) {
                        setTimeout(() => {
                            if (!Game.player) return;
                            for (let j=0;j<4;j++) if(typeof addPart === 'function') addPart(Game.player.x+Game.player.w/2+(Math.random()-0.5)*10, Game.player.y+Game.player.h, "#cc0000", 15, 4);
                        }, i*30);
                    }
                }, 220);

                setTimeout(() => {
                    if (!Game.player) return;
                    const pp = Game.player;
                    Game._berserkSlam = false;
                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        if (Math.abs((e.x+e.w/2)-(pp.x+pp.w/2)) < 180 && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2)) < 80) {
                            if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg*1.8), pp.facing, false);
                            if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 50);
                            for (let j=0;j<8;j++) if(typeof addPart === 'function') addPart(e.x+e.w/2, e.y+e.h/2, j<5?"#cc0000":"#ff4400", 25, 5);
                        }
                    });
                    for (let i=0;i<100;i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 110;
                        const col = i<40?"#cc0000":i<70?"#ff4400":i<90?"#550000":"#ff8800";
                        if(typeof addPart === 'function') addPart(pp.x+pp.w/2+Math.cos(ang)*dist, pp.y+pp.h, col, 65, i<45?8:i<75?5:3);
                    }
                    if(typeof spawnLaser === 'function') spawnLaser(pp.x-90, pp.y+pp.h-4, 180, 8, 12, "#880000", 0, true);
                    Game.camShake = 35; if(typeof playSfx === 'function') playSfx('boss_atk');
                }, 450);

                addText(p.x, p.y - 35, "인레이지", "#ff0000", 50, 22);
                Game.skillFlashCol = "rgba(150,0,0,0.35)"; Game.skillFlashT = 20;

            } else if (Game.pClass === 4) {
                Game.crewMinions = Game.crewMinions || [];
                for (let s = -1; s <= 1; s += 2) {
                    const cm = {
                        active: true, x: p.x + s * 30, y: p.y,
                        hp: Math.floor(currentBaseDmg * 0.6 * 20),
                        atk: Math.floor(currentBaseDmg * 0.6),
                        life: 600, 
                        atkT: 0, facing: p.facing
                    };
                    Game.crewMinions.push(cm);
                }
                for (let i = 0; i < 35; i++) if(typeof addPart === 'function') addPart(cx+(Math.random()-0.5)*50, cy+(Math.random()-0.5)*30, i<15?"#aaaaaa":i<28?"#666666":"#ffffff", 30, i<20?5:3);
                addText(p.x, p.y - 35, "서먼 크루", "#aaaaaa", 50, 20);
                Game.skillFlashCol = "rgba(120,120,120,0.28)"; Game.skillFlashT = 15; Game.camShake = 6;

            } else if (Game.pClass === 5) {
                // 헤븐즈콜: 제자리 망치 내려찍기 + 하늘에서 거대 십자가 강하
                p.vx = 0; // 이동 없음
                Game._paladinSkill = true;

                setTimeout(() => {
                    if (!Game.player) return;
                    const pp = Game.player;
                    Game._paladinSkill = false;
                    Game._paladinCrossT = 70;
                    Game._paladinCrossX = pp.x + pp.w/2;
                    Game._paladinCrossY = pp.y + pp.h;

                    const hammerRange = 140 + (Game.pRangeBonus || 0); // 사거리 대폭 상승
                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        const edx = (e.x+e.w/2)-(pp.x+pp.w/2);
                        if (Math.sign(edx) === pp.facing && Math.abs(edx) < hammerRange && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2)) < 80) {
                            if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg * 1.5), pp.facing, false);
                            if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 60); // 스턴치 폭발적 감소
                        }
                    });

                    const hitX = pp.x + pp.w / 2;
                    const groundY = pp.y + pp.h;
                    // 지면 파열 파티클 — 십자가가 땅에서 솟아오르는 느낌
                    for (let i = 0; i < 60; i++) {
                        const ang = -Math.PI * (0.2 + Math.random() * 0.6); // 위쪽 부채꼴
                        const spd = 3 + Math.random() * 5;
                        if(typeof addPart === 'function') addPart(hitX + pp.facing*(Math.random()*80-10),
                            groundY, i<30?"#ffcc00":i<50?"#ffffff":"#ffaa00", 50 + Math.random()*20, i<25?7:4);
                    }
                    addText(pp.x, pp.y - 35, "헤븐즈콜", "#ffdd00", 50, 18);
                    Game.skillFlashCol = "rgba(255,220,0,0.35)"; Game.skillFlashT = 20; Game.camShake = 20;
                    Game._paladinCrossT = 65; // 십자가 렌더 타이머 (길게)
                    Game._paladinCrossX = hitX;
                    Game._paladinCrossY = groundY; // 발 위치(지면) 기준
                    if(typeof playSfx === 'function') playSfx('boss_atk');
                }, 450);
            }
        }
    }
    if (Game._skillWarnT > 0) Game._skillWarnT--;
}

function updateCrewMinions() {
    if (!Game.crewMinions || !Game.player) return;
    const p = Game.player;
    Game.crewMinions = Game.crewMinions.filter(cm => cm.active && cm.life > 0);
    for (const cm of Game.crewMinions) {
        cm.life--;
        if (cm.life <= 0) { cm.active = false; continue; }
        const tdx = p.x - cm.x;
        if (Math.abs(tdx) > 300) {
            cm.x = p.x + (cm === Game.crewMinions[0] ? -30 : 30);
        } else if (Math.abs(tdx) > 30) {
            cm.x += Math.sign(tdx) * 3.5;
        }
        cm.y = p.y;
        cm.facing = p.facing;
        cm.atkT = (cm.atkT || 0) - 1;
        if (cm.atkT <= 0) {
            let closest = null, minDist = 9999;
            for (const e of Game.enemies) {
                if (!e.active || e.dead) continue;
                const d = Math.abs(e.x - cm.x);
                if (d < minDist) { minDist = d; closest = e; }
            }
            if (closest && minDist < 200 && typeof spawnBullet === 'function') {
                const dir = closest.x > cm.x ? 1 : -1;
                cm.facing = dir;
                if(typeof spawnBullet === 'function') spawnBullet(cm.x + 10*dir, cm.y + 5, dir * 12, -0.2, 40, 4, 0, cm.atk);
                cm.atkT = 25;
            }
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
                if (b.sk !== 4 && typeof overlap === 'function' && overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.active = false; return; } 
            }
        }
        
        Game.enemies.forEach((e) => {
            if (!e.active || e.dead) return;
            const hitR = b.sk === 2 ? b.r * 2.5 : b.r;
            if (Math.abs(e.x + e.w / 2 - b.x) < e.w / 2 + hitR && Math.abs(e.y + e.h / 2 - b.y) < e.h / 2 + hitR) { 
                if (b.sk === 4) {
                    b.nhLastHit = b.nhLastHit || {};
                    const eid = Game.enemies.indexOf(e);
                    const lastF = b.nhLastHit[eid] || -9999;
                    if (Game.frameCount - lastF >= 30 && (b.nhHitCount||0) < 10) {
                        if(typeof hitE === 'function') hitE(e, b.dmg, b.vx > 0 ? 1 : -1, false);
                        b.nhLastHit[eid] = Game.frameCount;
                        b.nhHitCount = (b.nhHitCount||0) + 1;
                    }
                } else {
                    if(typeof hitE === 'function') hitE(e, b.dmg || (Game.pBaseDmg * (Game.pBaseDmgMul||1)), b.vx > 0 ? 1 : -1, false);
                    if (b.sk && b.sk !== 3) Game.hitStop = 3;
                    if (Game.pClass === 2 && !b.sk) Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 1);
                    if (!b.sk) {
                        if (typeof applyPoiseHit === 'function') applyPoiseHit(e, Game.pClass === 4 ? 3 : 10);
                        Game.comboCount++;
                        Game.comboTimer = 150 + Game.pComboDur;
                    }
                    if (b.sk !== 3) b.active = false;
                }
            }
        });
    });

    Game.eBullets.forEach((b) => { 
        if (!b.active) return;
        b.x += b.vx * Game.pProjSlow; b.y += b.vy * Game.pProjSlow;
        if (b.grav) b.vy += 0.4 * Game.pProjSlow;
        b.life--;
        const _floorY = CH - 40;
        if (b.sk === 4) {
            if (b.life <= 0 || b.x < -50 || b.x > (Game.levelW || 3200) + 50) { b.active = false; return; }
        } else {
            if (b.life <= 0 || b.y > _floorY + 50 || b.x < -50 || b.x > (Game.levelW || 3200) + 50) { b.active = false; return; }
        }

        for (const t of Game.platforms) {
            if (typeof overlap === 'function' && overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) {
                b.active = false; return;
            }
            if (b.y > t.y + t.h && b.x >= t.x && b.x <= t.x + t.w) {
                b.active = false; return;
            }
        }
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
                    if (e.active && !e.dead && typeof overlap === 'function' && overlap(e, l) && !l.hitTargets.has(e)) { 
                        if(typeof hitE === 'function') hitE(e, l.dmg, Game.player.facing, true); 
                        l.hitTargets.add(e); 
                    }
                });
            }
        } else {
            if (!l.hitTargets) l.hitTargets = new Set();
            if (l.life > l.maxLife - 5 && !l.hitTargets.has('player')) {
                if (Game.invT === 0 && typeof overlap === 'function' && overlap(Game.player, l) && !Game.player.dead) {
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
    if (Game.isTutorial && Game.tutorialChecks) {
        const p2 = Game.player;
        const tc = Game.tutorialChecks;

        if (p2 && p2.dashT > 0) tc.dash = true;
        if (p2 && dn("KeyX") && !p2.jpOld && !p2.onGround) tc.jump = true;
        if (Game.comboCount > 0) tc.attack = true;
        if (dn("KeyV") && !p2?.gOld) tc.guard = true;
        if (dn("ShiftLeft", "ShiftRight")) tc.skill = true;

        const allDone = tc.dash && tc.jump && tc.attack && tc.guard && tc.skill;
        if (allDone && Game.doors[0] && !Game.doors[0].open) {
            Game.doors[0].open = true;
            addText(Game.camX + CW / 2 - 80, CH / 2 - 30, "ALL DONE! 문이 열렸다!", "#00ffcc", 180, 18);
        }

        Game.enemies.forEach(e => {
            if (e.active && e.isTutorialDummy) {
                e.hp   = e.maxHp; 
                e.dead = false;   
                e.active = true;
            }
        });
    }

    if (Game.isTutorial && Game.tutorialHints) {
        ctx.save();
        ctx.textAlign = "left";
        Game.tutorialHints.forEach(h => {
            const hx = h.x - Game.camX;
            if (hx < -200 || hx > CW + 200) return;
            ctx.font = "bold 10px SkullFont, NeoDunggeunmo";
            const tw = ctx.measureText(h.text).width;
            ctx.fillStyle = "rgba(0,0,0,0.72)";
            ctx.fillRect(hx - 4, h.y - 13, tw + 8, 16);
            ctx.strokeStyle = h.col || "#ffcc44";
            ctx.lineWidth = 1;
            ctx.strokeRect(hx - 4, h.y - 13, tw + 8, 16);
            ctx.fillStyle = h.col || "rgba(255,220,80,0.92)";
            ctx.fillText(h.text, hx, h.y);
        });
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
            
            if (near && dn("ArrowUp") && !K.upOld) {
                if (ev.type === "curse_altar") {
                    ev.used = true;
                    const dmgAmt = Math.floor(p.hp * 0.25);
                    p.hp = Math.max(1, p.hp - dmgAmt);
                    const roll = Math.random();

                    const atkBefore = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul||1) * (Game.pFinalDmgMul||1));

                    if (roll < 0.33) {
                        Game.pBaseDmg   += 15;           
                        Game.pFinalDmgMul += 0.5;         
                        const atkAfter = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul||1) * (Game.pFinalDmgMul||1));
                        addText(ev.x, ev.y - 40, `저주: ATK ${atkBefore} → ${atkAfter}`, "#ff0055", 160, 14);
                        addText(ev.x, ev.y - 20, "공격력 폭증 + 최종데미지 +50%!", "#ff4488", 120, 11);
                    } else if (roll < 0.66) {
                        Game.pSkillDmgMul += 0.5;
                        addText(ev.x, ev.y - 40, "저주: 필살기 위력 +50%!", "#ff0055", 160, 14);
                        addText(ev.x, ev.y - 20, `현재 ATK: ${atkBefore}`, "#ff4488", 100, 11);
                    } else {
                        Game.pCritChance = Math.min(0.95, Game.pCritChance + 0.25);
                        Game.pCritDmg   += 1.0;
                        const critPct = Math.round(Game.pCritChance * 100);
                        addText(ev.x, ev.y - 40, `저주: 치명타 ${critPct}% / 데미지 ×${Game.pCritDmg.toFixed(1)}`, "#ff0055", 160, 13);
                        addText(ev.x, ev.y - 20, "크리 확률+25% / 크리 배율+100%!", "#ff4488", 120, 11);
                    }
                    if (typeof updateHUD === 'function') updateHUD();
                    if(typeof playSfx === 'function') playSfx('skill'); Game.camShake = 20;
                    for (let pi = 0; pi < 30; pi++) if(typeof addPart === 'function') addPart(ev.x + ev.w/2, ev.y + ev.h/2, "#ff0055", 30, 4);
                    
                } else if (ev.type === "relic_chest") {
                    ev.used = true;
                    // UPGRADES에 실제 존재하는 ID만 풀로 사용 (존재하지 않는 ID로 "유물: 유물!" 버그 방지)
                    const pool = (typeof UPGRADES !== 'undefined' ? Object.keys(UPGRADES).map(Number) : [])
                        .filter(id => !Game.obtainedItems || !Game.obtainedItems.includes(id));
                    if (pool.length > 0) {
                        const id = pool[Math.floor(Math.random() * pool.length)];
                        if (typeof applyUpgrade === 'function') applyUpgrade(id);
                        const name = (typeof UPGRADES !== 'undefined' && UPGRADES[id]) ? UPGRADES[id].name.split(':')[0] : '유물';
                        addText(ev.x, ev.y - 20, "유물: " + name + "!", "#ffcc00", 120, 13);
                        if(typeof playSfx === 'function') { playSfx('item'); playSfx('clear'); }
                    }
                    for (let pi = 0; pi < 25; pi++) if(typeof addPart === 'function') addPart(ev.x + ev.w/2, ev.y + ev.h/2, "#ffcc00", 30, 4);
                    
                } else if (ev.type === "bonfire") {
                    if (typeof useBonfire === 'function') useBonfire(ev);
                } else if (ev.type === "mimic_chest") {
                    ev.used = true; 
                    if (typeof triggerMimic === 'function') triggerMimic(ev);
                }
            }
        }
    }

    Game.items.forEach(i => {
        if (!i.active) return;
        i.vy = Math.min(i.vy + GRAV, 8);  i.y += i.vy; let groundFound = false;
        Game.platforms.forEach(t => { if (typeof overlap === 'function' && overlap({x: i.x, y: i.y, w: i.w, h: i.h}, t) && i.vy > 0) { i.y = t.y - i.h; i.vy = 0; groundFound = true; } });
        if(groundFound) i.life--;
        
        if (typeof overlap === 'function' && overlap(Game.player, {x: i.x, y: i.y, w: i.w, h: i.h}) && !Game.player.dead) {
            if(typeof playSfx === 'function') playSfx('item');
            if (i.type === "hp") {
                if (Game.player.hp < Game.pMaxHp) { Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + 20); addText(Game.player.x, Game.player.y - 10, "+20 HP", "#27ae60", 40, 14); } 
                else { Game.score += 100; addText(Game.player.x, Game.player.y - 10, "점수 +100", "#aaaaff", 40, 14); }
            } else if (i.type === "atk_drop") { Game.pBaseDmg += 5; addText(Game.player.x, Game.player.y - 10, "공격력 증가! (+5)", "#af1616", 50, 16);
            } else if (i.type === "def_drop") { Game.pBaseDef += 5; addText(Game.player.x, Game.player.y - 10, "방어력 증가! (+5)", "#32b427", 50, 16); 
            } else if (i.type === "atk_spd_drop") { Game.pBaseAtkSpd += 0.05; addText(Game.player.x, Game.player.y - 10, "공격 속도 증가!", "#f1d13e", 50, 16);
            } else if (i.type === "move_spd_drop") { Game.pMoveSpdMul += 0.05; addText(Game.player.x, Game.player.y - 10, "이동 속도 증가!", "#2e9de7", 50, 16); }
            else if (i.type === "jump_drop") { Game.pJmpMul += 0.05; addText(Game.player.x, Game.player.y - 10, "점프력 증가", "#661ea1", 50, 16); }
            
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
            d.open = true;
        } else {
            d.open = allDead;
        }
        if (d.open && Game.player && typeof overlap === 'function' && overlap(Game.player, { x: d.x, y: d.y, w: d.w, h: d.h }) && !Game.player.dead) {
            if (Game.transState === 0 && typeof nextStage === 'function') {
                nextStage();
            }
        }
    });
}