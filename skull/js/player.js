// player.js — 플레이어/투사체/이벤트 업데이트
// ==========================================
// 메인 게임 로직 및 업데이트 루프 (Main Logic & Loop)
// ==========================================

// 이동 발판(vx) 이동 및 낙하 발판(drop) 타이머 처리
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

// 플레이어 입력·이동·공격·사망 등 매 프레임 전체 처리
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
    Game._breathT = ((Game._breathT || 0) + 1) % 180;
    if (Game.pClass === 8 && (Game._bloodFuryTimer || 0) > 0) {
        Game._bloodFuryTimer--;
        if (Game._bloodFuryTimer <= 0) Game._bloodFuryStacks = 0;
    }
    // 귀신병 패시브 타이머
    if (Game.pClass === 11 && (Game._ghostDashInvT || 0) > 0) {
        Game._ghostDashInvT--;
        if (Game._ghostDashInvT <= 0) Game.pDmgReduction = Game._ghostPreDmgReduction ?? 1.0;
    }
    // 연금술사 패시브 포션 타이머
    if (Game.pClass === 17) {
        Game._alchemistTimer = (Game._alchemistTimer || 600) - 1;
        if (Game._alchemistTimer <= 0) {
            Game._alchemistTimer = 600;
            const roll = Math.random();
            const p17 = Game.player;
            if (roll < 0.33) {
                const heal = Math.floor(Game.pMaxHp * 0.15);
                p17.hp = Math.min(Game.pMaxHp, p17.hp + heal);
                addText(p17.x, p17.y - 25, `포션! +${heal}HP`, "#88ff44", 60, 14);
                for(let i=0;i<15;i++) addPart(p17.x+7, p17.y+9, "#88ff44", 25, 4);
            } else if (roll < 0.66) {
                const _prevMul = Game.pFinalDmgMul || 1.0;
                Game.pFinalDmgMul = Math.min(3.0, _prevMul * 1.25);
                const _addedMul = Game.pFinalDmgMul - _prevMul;
                addText(p17.x, p17.y - 25, "공격 포션!", "#ffee44", 70, 14);
                setTimeout(() => { if(Game.pClass===17) Game.pFinalDmgMul = Math.max(1.0, (Game.pFinalDmgMul||1.0) - _addedMul); }, 5000);
            } else {
                Game.invT = Math.max(Game.invT||0, 180);
                addText(p17.x, p17.y - 25, "무적 포션!", "#ff8844", 70, 14);
            }
            if(typeof playSfx === 'function') playSfx('item');
        }
    }
    // 선봉대 방어 버프 타이머
    if (Game.pClass === 18 && (Game._vanguardDefBuff || 0) > 0) {
        Game._vanguardDefBuff--;
        if (Game._vanguardDefBuff <= 0) Game.pBaseDef = Math.max(20, Game.pBaseDef - 10);
    }
    // 분신술사 패시브: 분신 1기 항상 유지
    if (Game.pClass === 16 && !Game._shadowCloneSpawned) {
        const currentBaseDmg16 = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);
        const p16 = Game.player;
        if (p16 && (!Game.crewMinions || Game.crewMinions.length === 0)) {
            Game.crewMinions = Game.crewMinions || [];
            Game.crewMinions.push({ active: true, x: p16.x - 35, y: p16.y, sideOffset: -35, hp: 999, atk: Math.floor(currentBaseDmg16 * 0.7), life: 99999, atkT: 0, facing: p16.facing, isShadow: true });
            Game._shadowCloneSpawned = true;
        }
    }
    if (Game.pClass === 16 && Game._shadowCloneSpawned) {
        const aliveClones = (Game.crewMinions||[]).filter(c => c.active && c.life > 0);
        if (aliveClones.length === 0) Game._shadowCloneSpawned = false;
    }
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
                addText(p.x, p.y - 20, "스태미너 부족!", "#ff6600", 50, 11);
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
        // 이동속도 상한: 도적 200%, 나머지 160%
        const _maxSpd = Game.pClass === 1 ? 2.0 : 1.6;
        const _spdCap = Math.min(_maxSpd, Game.pMoveSpdMul);
        if (mx !== 0) p.facing = mx; p.vx = mx * 2.4 * _spdCap;
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

    // 상호작용 후 1초간 점프/상호작용 입력 차단 (입력 블리드 방지)
    if (Game._interactLock > 0) Game._interactLock--;

    // 이벤트/문 근처에서 ↑키는 점프 대신 상호작용으로 처리
    const _nearEv = Game.eventObjects && Game.eventObjects.some(ev =>
        !ev.used && ev.type !== 'npc' && Math.abs((p.x + p.w/2) - (ev.x + ev.w/2)) < 55 && Math.abs(p.y - ev.y) < 70);
    const _nearOpenDoor = !!(Game.doors && Game.doors.some(d => d.open && typeof overlap === 'function' && overlap(p, { x: d.x, y: d.y, w: d.w, h: d.h })));
    const _locked = (Game._interactLock || 0) > 0;
    const jpNow = (dn("KeyX") && !_nearEv && !_locked) || (dn("ArrowUp") && !_nearEv && !_nearOpenDoor && !_locked);
    if (jpNow && !p.jpOld && !p.guarding && p.kbT <= 0 && !p.plunging) {
        // 점프력 상한: 도적 170%, 나머지 140%
        const _maxJmp = Game.pClass === 1 ? 1.7 : 1.4;
        const _jmpCap = Math.min(_maxJmp, Game.pJmpMul);
        // 대시 중 점프: 대시 즉시 종료 후 점프 (vx 관성 유지)
        if (p.dashT > 0) {
            p.dashT = 0;
            p.jumpCount = 1;
            p.vy = -7.5 * _jmpCap;
            if(typeof playSfx === 'function') playSfx('jump');
            const _JC = ["#ffffff","#aa00ff","#00ccff","#cc0000","#888888","#ffe080","#ff8800","#44ff88","#cc2244","#aaddff","#dd44ff","#88ccff","#ff6600","#44eeff","#cc55ff","#ffdd00","#9988aa","#88ff44","#8899aa"];
            const jCol1 = _JC[Game.pClass] || "#6060ff";
            for (let i = 0; i < 5; i++) if(typeof addPart === 'function') addPart(p.x + 7, p.y + 18, jCol1, 12);
        } else if (p.onGround) {
            p.vy = -7.5 * _jmpCap; p.jumpCount = 1;
            if(typeof playSfx === 'function') playSfx('jump');
            const _JC2 = ["#ffffff","#aa00ff","#00ccff","#cc0000","#888888","#ffe080","#ff8800","#44ff88","#cc2244","#aaddff","#dd44ff","#88ccff","#ff6600","#44eeff","#cc55ff","#ffdd00","#9988aa","#88ff44","#8899aa"];
            const jCol1 = _JC2[Game.pClass] || "#6060ff";
            for (let i = 0; i < 5; i++) if(typeof addPart === 'function') addPart(p.x + 7, p.y + 18, jCol1, 12);
        } else if (p.jumpCount < 2) {
            p.vy = -6.5 * _jmpCap; p.jumpCount = 2;
            if(typeof playSfx === 'function') playSfx('jump');
            const _JC3 = ["#ffffff","#ee00ff","#88eeff","#ff2200","#aaaaaa","#ffee44","#ffaa33","#22ffaa","#ff3355","#cceeff","#cc22ff","#66aaff","#ff8833","#22ddff","#aa33ff","#ffee22","#776699","#66ff22","#6688aa"];
            const jCol2 = _JC3[Game.pClass] || "#ff60ff";
            for (let i = 0; i < 8; i++) if(typeof addPart === 'function') addPart(p.x + 7, p.y + 18, jCol2, 18, 4);
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
                // 시퀀스 ID: 착지 후 남은 setTimeout이 vy=-5를 걸어 key-lock 유발하는 버그 방지
                p._plungeSeq = (p._plungeSeq || 0) + 1;
                const seq = p._plungeSeq;
                p.vy = -3; p.vx = p.facing * -1.5; // 첫 반동: 위로 튀어오름
                for (let qi = 0; qi < shots; qi++) {
                    setTimeout(() => {
                        if (!Game.player || Game.player.dead) return;
                        if (Game.player._plungeSeq !== seq) return; // 구형 시퀀스 무시
                        const pp = Game.player;
                        if (pp.onGround) return; // 착지 후 콜백 무시
                        // 발사 반동: 매 발마다 위로 살짝 뜨고 뒤로 밀림
                        pp.vy = -5;
                        pp.vx = pp.facing * -1.5;
                        const currentDmg2 = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul||1) * (Game.pFinalDmgMul||1) * 1.6);
                        const yOff = (pp.h/2) - qi * 4;
                        if(typeof spawnBullet === 'function') spawnBullet(pp.x + pp.w/2, pp.y + yOff, pp.facing * 10, 9, 40, 5, 0, currentDmg2, "#ffffff");
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
                p.atkT = 8; // hasPlunged가 재강하를 차단 — atkT는 착지 경직만 (30→8로 단축해 패링/공격/스킬 봉쇄 해제)

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
                    spawnBullet(p.x + 7, p.y + 18, 0, 10, 30, 8, 0, pdmg2, "#ffffff");
                    spawnBullet(p.x + 7, p.y + 18, -2, 9, 30, 8, 0, pdmg2, "#ffffff");
                    spawnBullet(p.x + 7, p.y + 18, 2, 9, 30, 8, 0, pdmg2, "#ffffff");
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
        } else if (Game.pClass === 6) {
            p.vy = 12; p.vx = 0; if(typeof addPart === 'function') addPart(p.x+7, p.y+9, "#ff8800", 5);
        } else if (Game.pClass === 7) {
            p.vy = 12; p.vx = 0; if(typeof addPart === 'function') addPart(p.x+7, p.y+9, "#44ff88", 5);
        } else if (Game.pClass === 8) {
            p.vy = 13; p.vx = 0; if(typeof addPart === 'function') addPart(p.x+7, p.y+9, "#cc2244", 5);
        } else {
            p.vy = 12; p.vx = 0; if(typeof addPart === 'function') addPart(p.x+7, p.y+9, "#ffaa00", 5);
        }
    } else if (p.dashT <= 0 && Game.pClass !== 2) {
        p.vy = Math.min(p.vy + GRAV, 9); 
    } else if (p.dashT <= 0 && Game.pClass === 2) {
        p.vy = Math.min(p.vy + GRAV * 0.8, 8);
    }
    
    if (p.dashT > 0) {
        const dashCols = ["#ffffff","#cc00ff","#00ccff","#ff2200","#aaaaaa","#ffe040","#ff8800","#44ff88","#cc2244","#aaddff","#dd44ff","#88ccff","#ff6600","#44eeff","#cc55ff","#ffdd00","#9988aa","#88ff44","#8899aa"];
        const trailCol = dashCols[Game.pClass] || "#ffffff";
        // 귀신병 패시브: 대시 후 50프레임 반투명 (피해 50% 감소)
        if (Game.pClass === 11) {
            if (Game._ghostDashInvT <= 0) Game._ghostPreDmgReduction = Game.pDmgReduction;
            Game._ghostDashInvT = 50;
            Game.pDmgReduction = Math.min(Game._ghostPreDmgReduction, 0.5);
        }
        const partSz = Game.pClass === 3 ? 5 : 3;
        const partCnt = Game.pClass === 3 ? 5 : 3;
        for (let i = 0; i < partCnt; i++) if(typeof addPart === 'function') addPart(p.x + Math.random() * p.w, p.y + Math.random() * p.h, trailCol, 12, partSz);
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
                    if(typeof spawnBullet === 'function') spawnBullet(pp.x + pp.w/2, pp.y + yOff, pp.facing * 10, 9, 35, 5, 0, pdmg, "#ffffff");
                    if(typeof playSfx === 'function') playSfx('gun_shot');
                    for (let j=0;j<3;j++) if(typeof addPart === 'function') addPart(pp.x+pp.w/2+pp.facing*8, pp.y+yOff, j<2?"#cccccc":"#ffffff", 10, 3);
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

// 평타(C)·스킬(Shift)·강하공격(↓+C) 입력 처리 및 히트박스 판정
function updatePlayerCombat() {
    const p = Game.player;
    if (p.dead) return;
    
    const currentAtkSpd = (Game.pBaseAtkSpd || 1.0) * (Game.pAtkSpdMul || 1.0);
    const currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);

    const _npcTalking = Game.eventObjects && Game.eventObjects.some(ev => ev.type === 'npc' && ev.talking);
    if (dn("KeyC") && !dn("ArrowDown") && p.atkT === 0 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && !_npcTalking) {
        const _valkReloading = Game.pClass === 4 && (Game.pGunReload || 0) > 0;
        if (!_valkReloading && typeof playSfx === 'function') playSfx('atk');
        else if (_valkReloading && typeof playSfx === 'function') playSfx('reload_click');
        let maxCombo = (Game.pClass === 1) ? 5 : 3;
        p.combo = (p.combo % maxCombo) + 1; 
        const isLastHit = p.combo === maxCombo;
        
        if (Game.pClass === 4) {
            p.atkT = Math.max(1, Math.floor(14 / currentAtkSpd));
            p.atkAnim = 12; p.atkAnimMax = 12;
        } else {
            p.atkT = Math.max(1, Math.floor((isLastHit ? 35 : 16) / currentAtkSpd));
            p.atkAnim = Math.max(1, Math.floor((isLastHit ? 20 : 12) / currentAtkSpd));
            p.atkAnimMax = p.atkAnim;
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
        // 성기사 패시브: 방어력 1당 공격력 +0.5
        if (Game.pClass === 5) dmg += Math.floor((Game.pBaseDef || 0) * 0.5);
        // 혈귀 패시브: 분노의 피 — 스택당 공격력 +15%
        if (Game.pClass === 8 && (Game._bloodFuryStacks || 0) > 0) dmg = Math.floor(dmg * (1 + Game._bloodFuryStacks * 0.15));
        // 검성 패시브: 패링 후 3배 강타
        if (Game.pClass === 9 && Game._swordParryReady) { dmg *= 3; Game._swordParryReady = false; addText(p.x, p.y - 42, "검성 일격!", "#aaddff", 45, 15); }
        // 소환사 패시브: 소환수 활성화 시 공격력 +30%
        if (Game.pClass === 6 && Game.summons && Game.summons.length > 0) dmg = Math.floor(dmg * 1.3);
        // 강령술사 패시브: 영혼 스택당 공격력 +5%
        if (Game.pClass === 7 && (Game.soulStacks || 0) > 0) dmg = Math.floor(dmg * (1 + Game.soulStacks * 0.05));
        if (p.hp / Game.pMaxHp < 0.3) dmg = Math.floor(dmg * Game.pLowHpDmg);

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
        } else if (Game.pClass === 4) {
            if ((Game.pGunReload || 0) > 0) {
                if (typeof playSfx === 'function') playSfx('reload_click');
            } else {
                if (Game.pGunAmmo === undefined) Game.pGunAmmo = 8;
                if (Game.pGunAmmo <= 0) {
                    // 탄약 소진 — 재장전 시작 (ammo는 완료 시 복구)
                    if ((Game.pGunReload || 0) <= 0) {
                        Game.pGunReload = Math.max(30, Math.floor(90/((Game.pBaseAtkSpd||1)*(Game.pAtkSpdMul||1))));
                        Game.pGunReloadMax = Game.pGunReload;
                        if (!Game._reloadTextShown) {
                            addText(p.x, p.y - 22, "재장전 중...", "#aaaaaa", 90, 12);
                            Game._reloadTextShown = true;
                            setTimeout(() => { Game._reloadTextShown = false; }, 1500);
                        }
                    }
                } else {
                    const gunRange = 40 + (Game.pRangeBonus || 0);
                    if(typeof spawnBullet === 'function') spawnBullet(cx, cy-2, p.facing*14, -0.1, gunRange, 5, 0, dmg, "#ffffff");
                    Game.pGunAmmo--;
                    if(typeof playSfx === 'function') playSfx('gun_shot');
                    Game.pMp = Math.min(Game.pMaxMp, Game.pMp + 1);
                    if (Game.pGunAmmo <= 0) {
                        Game.pGunReload = Math.max(30, Math.floor(90/((Game.pBaseAtkSpd||1)*(Game.pAtkSpdMul||1))));
                        Game.pGunReloadMax = Game.pGunReload;
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

    if ((dn("ShiftLeft", "ShiftRight") || Game._doubleCast) && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && p.atkT === 0) {
        const _isDC = !!Game._doubleCast;
        if (_isDC) Game._doubleCast = false;
        const skillMpCost = 15;
        const _bloodClass = Game.pClass === 8; // 혈귀는 HP 소모, MP 불필요
        if (!_isDC && !_bloodClass && Game.pMp < skillMpCost) {
            if (!Game._skillWarnT || Game._skillWarnT <= 0) {
                addText(p.x, p.y - 30, "마나 부족!", "#8888ff", 40, 13);
                Game._skillWarnT = 45;
            }
        } else {
            if (!_isDC && !_bloodClass) Game.pMp -= skillMpCost;
            // 스킬 누적 카운터
            Game.totalSkillUses = (Game.totalSkillUses || 0) + 1;
            localStorage.setItem("skull_skillUses", Game.totalSkillUses);
            if (typeof _checkUnlocks === 'function') _checkUnlocks();
            p.atkT = Game.pClass === 3 ? 40 : (Game.pClass === 5 ? 30 : (Game.pClass === 8 ? 25 : 20));
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
                        && Math.abs((e.y+e.h/2) - (p.y+p.h/2)) < 70) {
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
                const sRange1 = 90 + (Game.pRangeBonus || 0);

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

                    // 점멸 도착 후: 방향 무관하게 근거리 적 타격 (텔레포트로 옆에 붙었으므로)
                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        const edx = Math.abs((e.x+e.w/2)-(pp.x+pp.w/2));
                        if (edx < sRange1+60 && Math.abs((e.y+e.h/2)-(pp.y+pp.h/2)) < 55) {
                            if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg*0.7), pp.facing, false);
                            if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 30);
                        }
                    });
                    for (let j = 0; j < 25; j++) if(typeof addPart === 'function') addPart(pp.x+pp.w/2+pp.facing*30, pp.y+pp.h/2, j<15?"#cc00ff":"#550088", 28, 4);
                    Game.camShake = 15;
                }, 6 * 65);

            } else if (Game.pClass === 2) {
                // 아크틱 할로우: 1발, 느리게 전진하는 수속성 블랙홀 (sk=5)
                const voltDmg = Math.floor(skillDmg * 0.5);
                const vx_ = p.x + p.w/2, vy_ = p.y + p.h/2;
                if(typeof spawnBullet === 'function') spawnBullet(vx_, vy_, p.facing*0.6, 0, 480, 48, 5, voltDmg);
                for (let i=0;i<30;i++) if(typeof addPart === 'function') addPart(vx_+p.facing*15, vy_+(Math.random()-0.5)*18, i<10?"#001133":i<22?"#003366":"#0055aa", 50, i<15?7:4);
                for (let i=0;i<30;i++) if(typeof addPart === 'function') addPart(cx+p.facing*15, cy+(Math.random()-0.5)*20, i<12?"#001133":i<22?"#003366":"#0077bb", 50, i<16?8:4);
                addText(p.x, p.y-35, "아크틱 할로우", "#44aaff", 65, 22);
                Game.skillFlashCol = "rgba(0,60,140,0.45)"; Game.skillFlashT = 22; Game.camShake = 8;

            } else if (Game.pClass === 3) {
                p.vy = -14; p.vx = 0; p.onGround = false;
                Game._berserkSlam = true;
                Game._berserkSlamDmg = Math.floor(skillDmg * 1.8);

                setTimeout(() => {
                    if (!Game.player || Game.player.dead) return;
                    Game.player.vy = 20;
                    Game.player.vx = 0;
                    Game._berserkSlamReady = true; // 착지 감지 대기
                }, 220);

                addText(p.x, p.y - 35, "인레이지", "#ff0000", 50, 22);
                Game.skillFlashCol = "rgba(150,0,0,0.35)"; Game.skillFlashT = 20;

            } else if (Game.pClass === 4) {
                Game.crewMinions = Game.crewMinions || [];
                for (let s = -1; s <= 1; s += 2) {
                    const cm = {
                        active: true, x: p.x + s * 30, y: p.y,
                        sideOffset: s * 40,  // 플레이어 기준 고정 오프셋
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

            } else if (Game.pClass === 6) {
                // 소환 삼령: 불/번개/빛 정령 3체 소환 (10초)
                Game.summons = Game.summons || [];
                const existCount = Game.summons.filter(s => s.life > 0).length;
                if (existCount > 0) {
                    addText(p.x, p.y - 30, "소환 중!", "#ff8800", 35, 13);
                    Game.pMp = Math.min(Game.pMaxMp, Game.pMp + skillMpCost); // MP 환불
                    p.atkT = 0;
                } else {
                    const types = ['fire', 'thunder', 'light'];
                    const xOffs = [-55, 0, 55];
                    const yOffs = [0, -20, 0];
                    const cols  = ["#ff4400", "#ffee00", "#ffffff"];
                    for (let si = 0; si < 3; si++) {
                        Game.summons.push({ type: types[si], x: p.x + xOffs[si], y: p.y + yOffs[si], life: 600, atkT: 10 + si * 20, facing: p.facing });
                    }
                    for (let i = 0; i < 40; i++) if(typeof addPart === 'function') addPart(cx + (Math.random()-0.5)*60, cy + (Math.random()-0.5)*30, i<15?"#ff8800":i<28?"#ffee00":"#ffffff", 40, i<20?6:3);
                    addText(p.x, p.y - 35, "소환 삼령!", "#ff8800", 65, 22);
                    Game.skillFlashCol = "rgba(200,100,0,0.35)"; Game.skillFlashT = 18; Game.camShake = 10;
                }

            } else if (Game.pClass === 7) {
                // 영혼 작열: 현재 영혼 스택 수만큼 소울 탄환 발사 (최소 3)
                const shots = Math.max(3, Math.min(10, Game.soulStacks || 3));
                const sDmg = Math.floor(skillDmg * 0.6 * (1 + (Game.soulStacks || 0) * 0.1));
                const spreadAngles = [];
                for (let si = 0; si < shots; si++) spreadAngles.push(-Math.PI*0.3 + (Math.PI*0.6 / Math.max(1, shots-1)) * si);
                for (const ang of spreadAngles) {
                    const bvx = Math.cos(ang) * 11 * p.facing;
                    const bvy = Math.sin(ang) * 11;
                    if(typeof spawnBullet === 'function') spawnBullet(cx, cy, bvx, bvy, 280, 7, 6, sDmg, "#44ff88");
                }
                Game.soulStacks = 0;
                for (let i = 0; i < 35; i++) if(typeof addPart === 'function') addPart(cx + p.facing*(5+Math.random()*40), cy+(Math.random()-0.5)*25, i<15?"#44ff88":i<28?"#00ffaa":"#aaffcc", 38, i<18?5:3);
                addText(p.x, p.y - 35, "영혼 작열!", "#44ff88", 65, 22);
                Game.skillFlashCol = "rgba(0,180,80,0.30)"; Game.skillFlashT = 18; Game.camShake = 8;

            } else if (Game.pClass === 8) {
                // 혈기격: 현재 HP 20% 소모 → 전방 광역 대혈창 + 강력 흡혈
                const hpCost = Math.max(5, Math.floor(p.hp * 0.20));
                if (p.hp <= hpCost) {
                    addText(p.x, p.y - 30, "HP 부족!", "#ff0000", 35, 13);
                    p.atkT = 0; Game.invT = 0; // 실패 시 쿨다운 취소
                } else {
                    p.hp -= hpCost;
                    const bloodRange = 160 + (Game.pRangeBonus || 0);
                    let hitAny = false;
                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        const edx = (e.x+e.w/2)-(p.x+p.w/2);
                        if (Math.sign(edx) === p.facing && Math.abs(edx) < bloodRange && Math.abs((e.y+e.h/2)-(p.y+p.h/2)) < 80) {
                            if (typeof hitE === 'function') hitE(e, Math.floor(skillDmg * 2.0), p.facing, false);
                            if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 40);
                            hitAny = true;
                        }
                    });
                    if (hitAny) {
                        const heal = Math.floor(hpCost * 2.5 + 8);
                        p.hp = Math.min(Game.pMaxHp, p.hp + heal);
                        addText(p.x, p.y - 42, `+${heal} 흡수`, "#ff6688", 55, 16);
                    }
                    for (let i = 0; i < 60; i++) if(typeof addPart === 'function') addPart(cx + p.facing*(5+Math.random()*bloodRange*0.8), cy+(Math.random()-0.5)*40, i<30?"#cc0033":i<50?"#880022":"#ff4466", 50, i<25?7:4);
                    for (let i = 0; i < 20; i++) if(typeof addPart === 'function') addPart(cx, cy, i<12?"#ff0033":"#660011", 60, 9);
                    addText(p.x, p.y - 35, "혈기격!", "#cc2244", 65, 22);
                    Game.skillFlashCol = "rgba(160,0,30,0.40)"; Game.skillFlashT = 22; Game.camShake = 25;
                }

            } else if (Game.pClass === 9) {
                // 십자검기: 8방향 검기 발사
                const dirs8 = [[1,0],[-1,0],[0,-1],[0,1],[1,-1],[1,1],[-1,-1],[-1,1]];
                dirs8.forEach(([dx,dy]) => {
                    if(typeof spawnBullet==='function') spawnBullet(cx, cy, dx*10, dy*10, 260, 7, 3, Math.floor(skillDmg*0.6), "#aaddff");
                });
                for(let i=0;i<50;i++) addPart(cx+(Math.random()-0.5)*40, cy+(Math.random()-0.5)*40, i<25?"#aaddff":"#ffffff", 35, i<20?5:3);
                addText(p.x, p.y-35, "십자검기!", "#aaddff", 60, 22);
                Game.skillFlashCol="rgba(160,200,255,0.35)"; Game.skillFlashT=18; Game.camShake=12;

            } else if (Game.pClass === 10) {
                // 마력 대창: 관통 레이저 창
                if(typeof spawnLaser==='function') spawnLaser(laserX, cy-4, laserW, 8, 35, "#dd44ff", 0, false);
                if(typeof spawnLaser==='function') spawnLaser(laserX+p.facing*20, cy-2, laserW-30, 4, 25, "#ffffff", 0, false);
                Game.enemies.forEach(e => {
                    if(!e.active||e.dead) return;
                    if(Math.abs(e.x+e.w/2-cx) < laserW/2+e.w/2 && Math.abs(e.y+e.h/2-cy) < 45) {
                        if(typeof hitE==='function') hitE(e, Math.floor(skillDmg*1.4), p.facing, false);
                        if(typeof applyPoiseHit==='function') applyPoiseHit(e, 35);
                    }
                });
                for(let i=0;i<35;i++) addPart(cx+p.facing*(10+Math.random()*140), cy+(Math.random()-0.5)*20, i<18?"#dd44ff":"#aa00ff", 30, i<18?5:3);
                addText(p.x, p.y-35, "마력 대창!", "#dd44ff", 60, 22);
                Game.skillFlashCol="rgba(180,0,255,0.30)"; Game.skillFlashT=16; Game.camShake=10;

            } else if (Game.pClass === 11) {
                // 망령 강습: 빠르게 적 관통 후 폭발
                const ghostRange=320, startX11=p.x;
                const hitList11=[];
                Game.enemies.forEach(e => {
                    if(!e.active||e.dead) return;
                    const edx=(e.x+e.w/2)-(p.x+p.w/2);
                    if(Math.sign(edx)===p.facing && Math.abs(edx)<ghostRange && Math.abs((e.y+e.h/2)-(p.y+p.h/2))<50) hitList11.push(e);
                });
                p.x = Math.max(0, Math.min(Game.levelW-p.w, p.x+p.facing*ghostRange));
                p.vx = p.facing*12; Game.invT = Math.max(Game.invT||0, 35);
                for(let i=0;i<20;i++) addPart(startX11+p.facing*(Math.random()*ghostRange), cy+(Math.random()-0.5)*16, "#88ccff", 20, 3);
                hitList11.forEach(e => {
                    if(typeof hitE==='function') hitE(e, Math.floor(skillDmg*0.9), p.facing, false);
                    for(let j=0;j<8;j++) addPart(e.x+e.w/2, e.y+e.h/2, "#88ccff", 20, 4);
                });
                for(let i=0;i<40;i++) addPart(p.x+p.w/2+(Math.random()-0.5)*30, cy+(Math.random()-0.5)*30, i<20?"#88ccff":"#ffffff", 30, i<20?5:3);
                addText(p.x, p.y-35, "망령 강습!", "#88ccff", 60, 22);
                Game.skillFlashCol="rgba(100,180,255,0.28)"; Game.skillFlashT=14; Game.camShake=8;

            } else if (Game.pClass === 12) {
                // 폭탄 투척: 포물선 대폭발 (gravity bullet sk=true)
                if(typeof spawnBullet==='function') spawnBullet(cx, cy-5, p.facing*9, -8, 200, 14, true, Math.floor(skillDmg*2.2), "#ff6600");
                setTimeout(() => {
                    if(!Game.player) return;
                    const bx12=p.x+p.facing*180, by12=p.y+30;
                    Game.enemies.forEach(e => {
                        if(!e.active||e.dead) return;
                        if(Math.abs(e.x+e.w/2-bx12)<100 && Math.abs(e.y+e.h/2-by12)<60) {
                            if(typeof hitE==='function') hitE(e, Math.floor(skillDmg*2.0), p.facing, false);
                            if(typeof applyPoiseHit==='function') applyPoiseHit(e, 50);
                        }
                    });
                    for(let i=0;i<80;i++) { const ang=Math.random()*Math.PI*2, d=Math.random()*90; addPart(bx12+Math.cos(ang)*d, by12+Math.sin(ang)*d, i<40?"#ff6600":i<65?"#ffaa00":"#ff2200", 50, i<35?8:i<60?5:3); }
                    if(typeof playSfx==='function') playSfx('boss_atk');
                    if(typeof spawnLaser==='function') spawnLaser(bx12-60, by12-5, 120, 6, 20, "#ff4400", 0, true);
                    Game.camShake=30;
                }, 700);
                addText(p.x, p.y-35, "폭탄 투척!", "#ff6600", 60, 22);
                Game.skillFlashCol="rgba(220,80,0,0.35)"; Game.skillFlashT=18;

            } else if (Game.pClass === 13) {
                // 빙하 폭발: 전방 광역 빙결 + 피해
                const iceRange=200+(Game.pRangeBonus||0);
                Game.enemies.forEach(e => {
                    if(!e.active||e.dead) return;
                    const edx=(e.x+e.w/2)-(p.x+p.w/2);
                    if(Math.sign(edx)===p.facing && Math.abs(edx)<iceRange && Math.abs((e.y+e.h/2)-(p.y+p.h/2))<70) {
                        if(typeof hitE==='function') hitE(e, Math.floor(skillDmg*0.9), p.facing, false);
                        e.stun=true; e.stunT=90; e.vx=0; e.kbT=90; // 빙결
                        if(typeof applyPoiseHit==='function') applyPoiseHit(e, 60);
                        for(let j=0;j<10;j++) addPart(e.x+e.w/2+(Math.random()-0.5)*16, e.y+(Math.random()-0.5)*16, "#44eeff", 25, 4);
                    }
                });
                for(let i=0;i<50;i++) addPart(cx+p.facing*(10+Math.random()*iceRange*0.9), cy+(Math.random()-0.5)*40, i<25?"#44eeff":i<40?"#aaffff":"#ffffff", 40, i<20?6:4);
                if(typeof spawnLaser==='function') spawnLaser(laserX, cy-3, iceRange, 6, 20, "#44eeff", 0, false);
                addText(p.x, p.y-35, "빙하 폭발!", "#44eeff", 60, 22);
                Game.skillFlashCol="rgba(0,200,240,0.35)"; Game.skillFlashT=20; Game.camShake=12;

            } else if (Game.pClass === 14) {
                // 저주의 환: 전방 적들 저주 + 독
                const curseRange=180+(Game.pRangeBonus||0);
                Game.enemies.forEach(e => {
                    if(!e.active||e.dead) return;
                    const edx=(e.x+e.w/2)-(p.x+p.w/2);
                    if(Math.abs(edx)<curseRange && Math.abs((e.y+e.h/2)-(p.y+p.h/2))<80) {
                        if(typeof hitE==='function') hitE(e, Math.floor(skillDmg*0.7), p.facing, false);
                        e._cursed = 300; // 저주 타이머 (5초)
                        e._curseDmg = Math.floor(currentBaseDmg * 0.15); // 매 30프레임 피해
                        for(let j=0;j<8;j++) addPart(e.x+e.w/2+(Math.random()-0.5)*12, e.y+(Math.random()-0.5)*16, "#cc55ff", 22, 3);
                    }
                });
                for(let i=0;i<40;i++) { const ang=Math.random()*Math.PI*2, d=30+Math.random()*curseRange*0.7; addPart(cx+Math.cos(ang)*d, cy+Math.sin(ang)*d*0.4, i<20?"#cc55ff":"#880099", 35, i<20?5:3); }
                addText(p.x, p.y-35, "저주의 환!", "#cc55ff", 60, 22);
                Game.skillFlashCol="rgba(180,0,220,0.30)"; Game.skillFlashT=18; Game.camShake=8;

            } else if (Game.pClass === 15) {
                // 올인: 50% 확률 초폭딜 or 자해
                const jackpot = Math.random() < 0.5;
                if(jackpot) {
                    const jackDmg = Math.floor(skillDmg * 4.0);
                    Game.enemies.forEach(e => {
                        if(!e.active||e.dead) return;
                        const edx=(e.x+e.w/2)-(p.x+p.w/2);
                        if(Math.sign(edx)===p.facing && Math.abs(edx)<250 && Math.abs((e.y+e.h/2)-(p.y+p.h/2))<80) {
                            if(typeof hitE==='function') hitE(e, jackDmg, p.facing, false);
                        }
                    });
                    for(let i=0;i<80;i++) { const ang=Math.random()*Math.PI*2, d=Math.random()*120; addPart(cx+Math.cos(ang)*d, cy+Math.sin(ang)*d*0.5, i<40?"#ffdd00":i<65?"#ff8800":"#ffffff", 55, i<30?8:i<55?5:3); }
                    addText(p.x, p.y-35, "JACKPOT!!!", "#ffdd00", 90, 26);
                    Game.skillFlashCol="rgba(220,180,0,0.50)"; Game.skillFlashT=25; Game.camShake=30;
                } else {
                    const selfDmg = Math.floor(p.hp * 0.25);
                    p.hp = Math.max(1, p.hp - selfDmg);
                    addText(p.x, p.y-35, `꽝... -${selfDmg}`, "#ff4444", 70, 20);
                    Game.camShake = 20;
                    for(let i=0;i<25;i++) addPart(p.x+7, p.y+9, "#ff4444", 20, 4);
                }

            } else if (Game.pClass === 16) {
                // 삼체분신: 강화 분신 3개 소환
                Game.crewMinions = Game.crewMinions || [];
                Game.crewMinions = Game.crewMinions.filter(c => c.active && c.life > 0 && !c.isShadow);
                for(let s=-2;s<=2;s++) {
                    if(s===0) continue;
                    const cm16 = { active:true, x:p.x+s*45, y:p.y, sideOffset:s*45, hp:999, atk:Math.floor(currentBaseDmg*0.8), life:480, atkT:0, facing:p.facing, isShadow:true };
                    Game.crewMinions.push(cm16);
                }
                Game._shadowCloneSpawned = false;
                for(let i=0;i<30;i++) addPart(cx+(Math.random()-0.5)*50, cy+(Math.random()-0.5)*25, i<15?"#9988aa":"#553366", 28, i<15?5:3);
                addText(p.x, p.y-35, "삼체분신!", "#9988aa", 60, 22);
                Game.skillFlashCol="rgba(100,80,140,0.30)"; Game.skillFlashT=16; Game.camShake=8;

            } else if (Game.pClass === 17) {
                // 폭발 포션: 전방 독 폭탄
                const potRange=160+(Game.pRangeBonus||0);
                Game.enemies.forEach(e => {
                    if(!e.active||e.dead) return;
                    const edx=(e.x+e.w/2)-(p.x+p.w/2);
                    if(Math.sign(edx)===p.facing && Math.abs(edx)<potRange && Math.abs((e.y+e.h/2)-(p.y+p.h/2))<60) {
                        if(typeof hitE==='function') hitE(e, Math.floor(skillDmg*0.8), p.facing, false);
                        e._cursed = 180; e._curseDmg = Math.floor(currentBaseDmg * 0.12); // 독 DoT
                    }
                });
                for(let i=0;i<40;i++) addPart(cx+p.facing*(10+Math.random()*potRange*0.8), cy+(Math.random()-0.5)*35, i<20?"#88ff44":i<32?"#44aa22":"#00ff88", 35, i<20?5:3);
                addText(p.x, p.y-35, "폭발 포션!", "#88ff44", 60, 22);
                Game.skillFlashCol="rgba(60,200,0,0.28)"; Game.skillFlashT=16; Game.camShake=8;

            } else if (Game.pClass === 18) {
                // 방패 돌진: 전방 돌격 + 적 기절
                const vgRange=200+(Game.pRangeBonus||0);
                const startX18=p.x;
                const hitList18=[];
                Game.enemies.forEach(e => {
                    if(!e.active||e.dead) return;
                    const edx=(e.x+e.w/2)-(p.x+p.w/2);
                    if(Math.sign(edx)===p.facing && Math.abs(edx)<vgRange && Math.abs((e.y+e.h/2)-(p.y+p.h/2))<55) hitList18.push(e);
                });
                p.x=Math.max(0, Math.min(Game.levelW-p.w, p.x+p.facing*vgRange));
                p.vx=p.facing*8; Game.invT=Math.max(Game.invT||0, 30);
                hitList18.forEach(e => {
                    if(typeof hitE==='function') hitE(e, Math.floor(skillDmg*1.2), p.facing, false);
                    e.stun=true; e.stunT=120; e.vx=p.facing*5; e.vy=-3; e.kbT=120;
                    if(typeof applyPoiseHit==='function') applyPoiseHit(e, 80);
                });
                for(let i=0;i<20;i++) addPart(startX18+p.facing*(Math.random()*vgRange), cy+(Math.random()-0.5)*20, "#8899aa", 22, 4);
                for(let i=0;i<30;i++) addPart(p.x+p.w/2+(Math.random()-0.5)*25, cy+(Math.random()-0.5)*25, i<15?"#8899aa":"#ccddee", 28, i<15?5:3);
                addText(p.x, p.y-35, "방패 돌진!", "#8899aa", 60, 22);
                Game.skillFlashCol="rgba(120,140,160,0.35)"; Game.skillFlashT=18; Game.camShake=20;

            } else if (Game.pClass === 5) {
                // 헤븐즈콜: 망치 들어올리고 내리찍기 + 하늘에서 거대 십자가 강하
                p.vx = 0;
                Game._paladinSkill = true;
                Game._paladinHammerT = 30; // 망치 올리기 단계 (30프레임)

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
            if (!_isDC && Game.pDoubleSkillChance && Math.random() < Game.pDoubleSkillChance) {
                const dcDelay = Game.pClass === 3 ? 900 : Game.pClass === 5 ? 950 : 700;
                setTimeout(() => { if (Game.player && !Game.player.dead) Game._doubleCast = true; }, dcDelay);
                addText(p.x, p.y - 50, "메아리!", "#ffaa00", 45, 13);
            }
        }
    }
    if (Game._skillWarnT > 0) Game._skillWarnT--;

    // 인레이지 착지 감지 → 착지 순간 타격 발동
    if (Game._berserkSlamReady && p.onGround) {
        Game._berserkSlamReady = false;
        Game._berserkSlam = false;
        const slamDmg = Game._berserkSlamDmg || 0;
        Game.enemies.forEach(e => {
            if (!e.active || e.dead) return;
            if (Math.abs((e.x+e.w/2)-(p.x+p.w/2)) < 200 && Math.abs((e.y+e.h/2)-(p.y+p.h/2)) < 90) {
                if (typeof hitE === 'function') hitE(e, slamDmg, p.facing, false);
                if (typeof applyPoiseHit === 'function') applyPoiseHit(e, 50);
                for (let j=0;j<8;j++) if(typeof addPart === 'function') addPart(e.x+e.w/2, e.y+e.h/2, j<5?"#cc0000":"#ff4400", 25, 5);
            }
        });
        for (let i=0;i<100;i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = Math.random() * 120;
            const col = i<40?"#cc0000":i<70?"#ff4400":i<90?"#550000":"#ff8800";
            if(typeof addPart === 'function') addPart(p.x+p.w/2+Math.cos(ang)*dist, p.y+p.h, col, 65, i<45?8:i<75?5:3);
        }
        if(typeof spawnLaser === 'function') spawnLaser(p.x-100, p.y+p.h-4, 200, 8, 14, "#880000", 0, true);
        Game.camShake = 35; if(typeof playSfx === 'function') playSfx('boss_atk');
    }
}

function updateCrewMinions() {
    if (!Game.crewMinions || !Game.player) return;
    const p = Game.player;
    Game.crewMinions = Game.crewMinions.filter(cm => cm.active && cm.life > 0);
    for (const cm of Game.crewMinions) {
        cm.life--;
        if (cm.life <= 0) { cm.active = false; continue; }
        // 목표 위치: 플레이어 기준 고정 오프셋 유지
        const targetX = p.x + (cm.sideOffset || 40);
        const tdx = targetX - cm.x;
        if (Math.abs(tdx) > 400) {
            cm.x = targetX; // 너무 멀면 순간이동
        } else if (Math.abs(tdx) > 8) {
            cm.x += Math.sign(tdx) * Math.min(Math.abs(tdx) * 0.18, 5);
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

function updateCurseDoT() {
    // 무당(14)/연금술사(17) 저주 DoT 처리
    if (!Game.enemies) return;
    Game.enemies.forEach(e => {
        if (!e.active || e.dead || !(e._cursed > 0)) return;
        e._cursed--;
        if (e._cursed % 30 === 0 && e._curseDmg > 0) {
            if(typeof hitE === 'function') hitE(e, e._curseDmg, 0, false);
            if(typeof addPart === 'function') addPart(e.x+e.w/2+(Math.random()-0.5)*8, e.y+(Math.random()-0.5)*8, "#cc55ff", 15, 3);
        }
    });
}

function updateSummons() {
    if (!Game.summons || !Game.player) return;
    if (Game.pClass !== 6) { Game.summons = []; return; }
    const p = Game.player;
    Game.summons = Game.summons.filter(s => s.life > 0);
    const currentBaseDmg = Game.pBaseDmg * (Game.pBaseDmgMul || 1.0);

    const typeConf = {
        fire:    { xOff: -55, yOff:   0, interval: 38, range:  95, dmgMul: 1.8, col: "#ff6600" },
        thunder: { xOff:   0, yOff: -20, interval: 52, range: 180, dmgMul: 2.0, col: "#ffee00" },
        light:   { xOff:  55, yOff:   0, interval: 68, range: 260, dmgMul: 1.6, col: "#ffffcc" },
    };

    for (const s of Game.summons) {
        s.life--;
        const conf = typeConf[s.type];
        if (!conf) continue;

        const targetX = p.x + conf.xOff;
        const targetY = p.y + conf.yOff;
        s.x += (targetX - s.x) * 0.14;
        s.y += (targetY - s.y) * 0.14;
        s.facing = p.facing;
        s.atkT = (s.atkT || 0) - 1;

        if (s.atkT <= 0) {
            let closest = null, minDist = conf.range;
            for (const e of Game.enemies) {
                if (!e.active || e.dead) continue;
                const dx = e.x + e.w/2 - s.x, dy = e.y + e.h/2 - s.y;
                const d = Math.sqrt(dx*dx + dy*dy*0.5);
                if (d < minDist) { minDist = d; closest = e; }
            }
            if (closest) {
                const sDmg = Math.floor(currentBaseDmg * conf.dmgMul * (Game.pSkillDmgMul || 1) * (Game.pFinalDmgMul || 1));
                if (s.type === 'fire') {
                    if (typeof hitE === 'function') hitE(closest, sDmg, s.facing, false);
                    for (let i = 0; i < 10; i++) if(typeof addPart === 'function') addPart(closest.x+closest.w/2+(Math.random()-0.5)*12, closest.y+closest.h/2+(Math.random()-0.5)*12, i<6?"#ff6600":"#ff3300", 22, 4);
                } else if (s.type === 'thunder') {
                    Game.enemies.forEach(e => {
                        if (!e.active || e.dead) return;
                        if (Math.abs(e.x+e.w/2 - (closest.x+closest.w/2)) < 85) {
                            if (typeof hitE === 'function') hitE(e, sDmg, s.facing, false);
                        }
                    });
                    for (let i = 0; i < 14; i++) if(typeof addPart === 'function') addPart(closest.x+closest.w/2+(Math.random()-0.5)*14, closest.y+(Math.random()-0.5)*20, i<9?"#ffff00":"#ffaa00", 20, 3);
                } else if (s.type === 'light') {
                    const dx = closest.x+closest.w/2 - s.x, dy = closest.y+closest.h/2 - s.y;
                    const len = Math.sqrt(dx*dx+dy*dy) || 1;
                    if(typeof spawnBullet === 'function') spawnBullet(s.x, s.y, dx/len*14, dy/len*10, 280, 5, 0, sDmg, "#ffffcc");
                }
                s.atkT = conf.interval;
            } else {
                s.atkT = 15;
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
                if (b.sk !== 4 && b.sk !== 5 && b.sk !== 6 && typeof overlap === 'function' && overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.active = false; return; }
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
                } else if (b.sk === 5) {
                    // 아크틱 할로우: 10프레임 쿨다운 다단히트, 최대 25회
                    b.nhLastHit = b.nhLastHit || {};
                    const eid = Game.enemies.indexOf(e);
                    const lastF = b.nhLastHit[eid] || -9999;
                    if (Game.frameCount - lastF >= 10 && (b.nhHitCount||0) < 25) {
                        if(typeof hitE === 'function') hitE(e, b.dmg, b.vx > 0 ? 1 : -1, false);
                        b.nhLastHit[eid] = Game.frameCount;
                        b.nhHitCount = (b.nhHitCount||0) + 1;
                    }
                } else if (b.sk === 6) {
                    // 강령술사 소울 탄환: 일반 히트 후 비활성
                    if(typeof hitE === 'function') hitE(e, b.dmg, b.vx > 0 ? 1 : -1, false);
                    if(typeof applyPoiseHit === 'function') applyPoiseHit(e, 8);
                    b.active = false;
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
            
            if (near && dn("ArrowUp") && !K.upOld && !(Game._interactLock > 0)) {
                Game._interactLock = 60; // 1초간 점프 차단
                Game.invT = Math.max(Game.invT || 0, 60); // 1초 무적
                if (ev.type === "curse_altar") {
                    ev.used = true;
                    const dmgAmt = Math.floor(Game.pMaxHp * 0.25);
                    Game.pMaxHp = Math.max(10, Game.pMaxHp - dmgAmt);
                    p.maxHp = Game.pMaxHp;
                    p.hp = Math.min(p.hp, Game.pMaxHp);
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
            d._playerNear = true;
            if (Game.transState === 0 && typeof nextStage === 'function' && dn("ArrowUp") && !K.upOld) {
                Game._interactLock = 60; // 1초간 점프 차단
                Game.invT = Math.max(Game.invT || 0, 60); // 1초 무적
                nextStage();
            }
        } else {
            d._playerNear = false;
        }
    });
}