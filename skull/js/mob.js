// ==========================================
// 일반 몹 AI 모듈 (Mob AI)
// ==========================================

// ==========================================
// 엔티티 생성 및 보스 AI 모듈 (Entities & AI)
// ==========================================

function mkP(x, y) {
    return {
        x: x, y: y, w: 14, h: 18, vx: 0, vy: 0, onGround: false, 
        hp: Game.pMaxHp, maxHp: Game.pMaxHp, 
        facing: 1, atkT: 0, atkAnim: 0, fr: 0, frT: 0, 
        jpOld: false, kbT: 0, guarding: false, 
        jumpCount: 0, combo: 0, comboT: 0, dashT: 0, dashCD: 0, parryT: 0, 
        plunging: false, dead: false 
    };
}

let _enemyIdCounter = 0;

// ── 튜토리얼 전용 더미 골렘 ──────────────
// 이동속도 0, 공격력 0, 방어력 0 — 때리는 연습용 허수아비
function mkDummyGolem(x, y) {
    let e = getObj(Game.enemies);
    e.x = x; e.y = y;
    e.w = 32; e.h = 40;         // 골렘 크기 (플레이어보다 약간 큼)
    e.vx = 0; e.vy = 0; e.onGround = false;
    e.hp = 9999; e.maxHp = 9999;
    e.type = "melee";
    e.isBoss = false; e.isElite = false;
    e.facing = -1;               // 플레이어 쪽 바라봄
    e.fr = 0; e.frT = 0; e.flash = 0;
    e.isGuarding = false; e.guardT = 0;
    // AI 완전 비활성 — sI/sT 매우 크게 설정
    e.sI = 999999; e.sT = 999999;
    e.atk = 0;                   // 공격력 0
    e.pDir = 0;                  // 이동 없음
    e.pT = 0; e.dead = false; e.kbT = 0; e.warnT = 0; e.warnData = null; e.atkAnim = 0;
    e.world = 1;
    e.id = _enemyIdCounter++;
    e.isTutorialDummy = true;    // 더미 식별 플래그 (체력 리셋용)
    e.superArmor = false;        // 넉백은 받음 — 타격감 체험
    // 체간 초기화
    if (typeof initPoise === 'function') initPoise(e);
    else { e.poise = 60; e.poiseMx = 60; e.stun = false; e.stunT = 0; }
    return e;
}

function mkEnemy(x, y, w) {
    const rand = Math.random(); 
    let type = "melee";
    
    if (w >= 1) { 
        if (rand < 0.2) type = "ranged_laser"; 
        else if (rand < 0.4) type = "ranged_bullet"; 
        else if (rand < 0.55 && w >= 2) type = "shield";
        // 특수 타입 (월드 조건)
        else if (rand < 0.65 && w >= 3 && w <= 4) type = "bomber";     // 자폭형 w3~4
        else if (rand < 0.65 && w >= 5 && w <= 6) type = "splitter";   // 분열형 w5~6
        else if (rand < 0.65 && w >= 7)            type = "phantom";   // 투명형 w7~10
    }
    
    let e = getObj(Game.enemies); 
    
    const isElite = (w >= 2 && Math.random() < 0.1);
    const baseHp = (20 + w * 25 + (type === "melee" ? 5 : 0)) * 5;
    const hp = isElite ? Math.floor(baseHp * 3) : baseHp;
    
    e.x = x; e.y = y;
    e.isTutorialDummy = false; // 재사용 슬롯 잔존 플래그 클리어
    e.w = isElite ? 36 : 26;
    e.h = isElite ? 46 : 34; 
    e.vx = 0; e.vy = 0; e.onGround = false; 
    e.hp = hp; e.maxHp = hp; e.type = type; e.isBoss = false; 
    e.isElite = isElite; 
    e.facing = 1; e.fr = 0; e.frT = 0; e.flash = 0;
    
    e.isGuarding = false; e.guardT = 0; 
    e.sI = isElite ? 100 : 160; 
    e.sT = 80 + Math.random() * 50; 
    
    const baseAtk = Math.floor(Math.random() * 5) + 3; 
    const atkMul = 1 + Math.floor((w - 1) / 2) * 0.5;  
    e.atk = Math.floor(baseAtk * atkMul * (isElite ? 1.5 : 1.0));
    
    e.pDir = Math.random() < 0.5 ? 1 : -1; 
    e.pT = 0; e.dead = false; e.kbT = 0; e.warnT = 0; e.warnData = null; e.atkAnim = 0; e.world = w;
    e.id = _enemyIdCounter++;
    // 체간(Poise) 초기화
    if (typeof initPoise === 'function') initPoise(e);
    else { e.poise = 30; e.poiseMx = 30; e.stun = false; e.stunT = 0; }
    // 특수 타입 초기값
    if (type === "bomber")   { e.fuseT = 0; e.exploding = false; e.hp = Math.floor(e.hp * 0.6); }
    if (type === "splitter") { e.splitDone = false; e.hp = Math.floor(e.hp * 1.5); }
    if (type === "phantom")  { e.phantomT = 0; e.visible = true; e.invisDur = 90; e.visDur = 120; }
    // 엘리트는 슈퍼아머 — 평타에 흔들리지 않고 공격 이어감
    if (isElite) e.superArmor = true;

    // 스폰 즉시 가장 가까운 발판 위로 정렬
    _snapToNearestPlatform(e);
    return e;
}

// 가장 가까운 발판 위로 즉시 이동 — 공중 스폰 낙사 방지
function _snapToNearestPlatform(e) {
    if (!Game.platforms || Game.platforms.length === 0) return;
    const foot = e.y + e.h; // 현재 발 위치
    let best = null, bestDist = 9999;
    for (const pt of Game.platforms) {
        if (e.x + e.w < pt.x + 4 || e.x > pt.x + pt.w - 4) continue;
        const surfaceY = pt.y;
        if (surfaceY < e.y - 5) continue; 
        const dist = Math.abs(surfaceY - foot);
        if (dist < bestDist) { bestDist = dist; best = pt; }
    }
    if (best) {
        e.y = best.y - e.h;
        e.vy = 0;
        e.onGround = true;
    }
}

function mkBoss(x, y, w) {
    const hps = [0, 2000, 3000, 4500, 6250, 8750, 12000, 17000, 21000, 26000, 35000];
    const hp = hps[Math.min(w, 10)]; 
    let e = getObj(Game.enemies);
    
    if (w === 5 || w === 6) {
        e.w = 130; e.h = 130;  
    } else if (w === 10) {
        e.w = Math.floor(CW * 0.55);
        e.h = Math.floor(CH * 0.65);
    } else if (w <= 2) {
        e.w = 47; e.h = 72;   
    } else if (w <= 4) {
        e.w = 50; e.h = 76;   
    } else {
        e.w = 65; e.h = 100;  
    }
    
    e.x = x; e.y = y; e.vx = 0; e.vy = 0; e.onGround = false;
    e.hp = hp; e.maxHp = hp; e.type = "boss"; e.isBoss = true; e.isElite = false; e.facing = 1;
    e.isTutorialDummy = false; 
    e.fr = 0; e.frT = 0; e.flash = 0;
    
    e.sT = 60; e.sI = 60; e.phase = 1; e.mT = 50; e.ap = 0; 
    
    const bossBaseAtk = Math.floor(Math.random() * 5) + 8; 
    const atkMul = 1 + Math.floor((w - 1) / 2) * 0.5;
    e.atk = Math.floor(bossBaseAtk * atkMul * 1.5);
    
    e.dead = false; e.kbT = 0; e.warnT = 0; e.warnData = null; e.atkAnim = 0; e.world = w;
    e.patternSeq = 0;
    e.p2Triggered = false;
    e.enrageTriggered = false;
    e.comboQueue = [];
    e.comboDelay = 0;
    
    if (typeof initPoise === 'function') initPoise(e);
    else { e.poise = 200 + (e.world||1)*80; e.poiseMx = e.poise; e.stun = false; e.stunT = 0; }
    return e;
}

function updateEnemies() {
    Game.enemies.forEach(e => {
        if (!e.active) return;
        
        if (e.y > CH + 50 && !e.dead) {
            if (!e.isBoss) {
                _snapToNearestPlatform(e);
                e.vx = 0; e.vy = 0; e.kbT = 0;
                e._cliffDir = 0; 
                if (e.y > CH + 50) { e.hp = 0; e.dead = true; } 
            } else {
                e.hp = 0; e.dead = true;
            }
        } 
        
        if (e.dead) {
            Game.score += e.isBoss ? 500 : (e.isElite ? 150 : 50); Game.kills++; 
            
            if (e.isElite) {
                Game.darkQuartz += Math.floor(Math.random() * 5) + 2;
                addText(e.x, e.y - 30, "+ DARK QUARTZ", "#aa00ff", 60, 16);
                if (typeof saveProgress === 'function') saveProgress();
            } else if (e.isBoss) {
                Game.darkQuartz += Math.floor(Math.random() * 15) + 20;
                Game.rerollCoins += 1;
                if (typeof saveProgress === 'function') saveProgress();
            }

            if(typeof playSfx === 'function') playSfx('enemy_die'); 
            for (let i = 0; i < 25; i++) {
                if(typeof addPart === 'function') addPart(e.x + e.w / 2, Math.min(e.y, CH-20), Math.random() < 0.5 ? "#ff0000" : "#aa0000", 20 + Math.random() * 20, 4);
            }

            if (Math.random() < Game.pDropRate || e.isBoss || e.isElite) {
                let randType = "hp"; let roll = Math.random();
                if (e.isBoss || e.isElite) { 
                    if(roll < 0.2) randType = "atk_drop"; else if(roll < 0.4) randType = "def_drop"; else if(roll < 0.6) randType = "atk_spd_drop"; else if(roll < 0.8) randType = "move_spd_drop"; else randType = "jump_drop"; 
                } else { 
                    if (roll < 0.35) randType = "hp"; else if (roll < 0.5) randType = "atk_drop"; else if (roll < 0.65) randType = "def_drop"; else if (roll < 0.8) randType = "atk_spd_drop"; else if (roll < 0.9) randType = "move_spd_drop"; else randType = "jump_drop"; 
                }
                
                // 💡 [패치] 아이템(구슬) 스폰 높이를 낮추고 위로 튀는 힘(vy)을 -4에서 -2로 감소!
                if(typeof addItem === 'function') {
                    addItem(e.x + e.w/2 - 5, e.y + e.h - 15, 10, 10, -2, 600, randType);
                }
            }
            if (Game.enemies.filter(x => x.active && !x.dead).length === 0 && !e.isBoss) {
                if(typeof playSfx === 'function') playSfx('clear'); 
            } else if (e.isBoss) {
                if(typeof playSfx === 'function') { playSfx('boss_clear'); playSfx('clear'); }
                if(typeof stopBGM === 'function') stopBGM();
                if (typeof Game !== 'undefined') {
                    Game.camShake = 30;
                    Game.hitStop = 20;
                }
            }
            e.active = false;
            return;
        }
        
        e.frT++; if (e.frT > 10) { e.fr = (e.fr + 1) % 2; e.frT = 0; }
        if (e.flash > 0) e.flash--;
        if ((e.hitInv || 0) > 0) e.hitInv--;
        if (typeof updatePoise === 'function') updatePoise(e);

        if (e.isBoss) { if (typeof updateBoss === 'function') updateBoss(e); return; }

        if (e._spawnDelay > 0) {
            e._spawnDelay--;
            e.vx = 0; e.sT = 80; e.warnT = 0; e.atkAnim = 0;
            e.vy = Math.min(e.vy + 0.4, 9);
            e.x += e.vx; e.y += e.vy;
            if (typeof resolveAABB === 'function') resolveAABB(e);
            return;
        }

        if (e.isTutorialDummy) {
            e.vy = Math.min(e.vy + 0.4, 9);
            e.vx = 0;           
            e.kbT = 0;          
            e.warnT = 0;        
            e.atkAnim = 0;      
            e.sT = 999999;      
            e.x += e.vx; e.y += e.vy;
            if (typeof resolveAABB === 'function') resolveAABB(e);
            e.x = Math.max(0, Math.min((Game.levelW || 1600) - e.w, e.x));
            return; 
        }

        e.vy = Math.min(e.vy + 0.4, 9);
        if (e.onGround && e.riding && e.riding.vx) e.x += e.riding.vx;

        if (e.kbT > 0 || e.stun) { 
            e.kbT = Math.max(0, e.kbT - 1);
            e.vx *= 0.7;
            if (e.stun) e.flash = (e.flash + 1) % 4;
        } 
        else {
            const dx = Game.player.x - e.x; const dy = Game.player.y - e.y;
            const distSq = dx * dx + dy * dy;
            
            if (e.type === "melee") {
                e.sT--;
                if (Math.abs(dx) < 55 && Math.abs(dy) < 40 && e.sT <= 0 && e.warnT <= 0 && e.atkAnim <= 0) {
                    e.warnT = 70;
                    e.sT = e.sI; e.vx = 0; e.facing = dx > 0 ? 1 : -1; 
                }
                if (e.warnT > 0) {
                    e.warnT--; e.vx = 0; 
                    if (e.warnT <= 0) {
                        e.atkAnim = 30; 
                        if(typeof playSfx === 'function') playSfx('enemy_atk'); 
                        if ((e.facing > 0 && dx > 0 && dx < 80) || (e.facing < 0 && dx < 0 && dx > -80)) {
                            if (Math.abs(dy) < 45 && typeof takeDmg === 'function') takeDmg(e.atk, e);
                        }
                    }
                } else if (e.atkAnim > 0) { e.atkAnim--; e.vx = 0; } 
                else {
                    if (distSq < 100000) { 
                        let eSpd = e.isElite ? 0.30 : 0.20;
                        let maxSpd = e.isElite ? 2.2 : 1.7;
                        e.facing = dx > 0 ? 1 : -1; e.vx += (dx > 0 ? 1 : -1) * eSpd; e.vx = Math.max(-maxSpd, Math.min(maxSpd, e.vx)); 
                    } else {
                        e.pT--;
                        if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; }
                        if (e._cliffDir && e.pDir === e._cliffDir) e.pDir *= -1;
                        e.vx = e.pDir * (e.isElite ? 1.5 : 1.0);
                    }
                }
            } 
            else if (e.type === "shield") {
                e.guardT = (e.guardT + 1) % 360; 
                e.isGuarding = e.guardT < 180;   
                if (distSq < 100000) {
                    e.facing = dx > 0 ? 1 : -1; 
                    let spdAdd = e.isGuarding ? 0.05 : (e.isElite ? 0.25 : 0.15); 
                    let spdMax = e.isGuarding ? 0.4 : (e.isElite ? 1.5 : 1.0);
                    e.vx += (dx > 0 ? 1 : -1) * spdAdd; 
                    e.vx = Math.max(-spdMax, Math.min(spdMax, e.vx)); 
                } else { 
                    e.pT--; if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; } 
                    e.vx = e.pDir * (e.isGuarding ? 0.4 : (e.isElite ? 1.1 : 0.8)); 
                }
            } 
            else {
                if (e.warnT > 0) {
                    e.warnT--; e.vx *= 0.8;
                    if (e.warnT <= 0) {
                        e.atkAnim = 40;
                        if(typeof fireEnemyRanged === 'function') fireEnemyRanged(e);
                    }
                } else if (e.atkAnim > 0) {
                    e.atkAnim--; e.vx = 0;
                } else {
                    if (distSq < 80000) {
                        e.facing = dx > 0 ? 1 : -1;
                        if (distSq < 14400) e.vx += (dx > 0 ? -1 : 1) * 0.15; else e.vx *= 0.9;
                        e.vx = Math.max(-1.4, Math.min(1.4, e.vx));
                        if (e._cliffDir && Math.sign(e.vx) === e._cliffDir) e.vx = 0;
                        e.sT--;
                        if (e.sT <= 0) {
                            e.sT = e.sI;
                            e.warnT = e.type === "ranged_laser" ? 90 : 65;
                            e.warnData = {
                                ang: Math.atan2(dy, dx),
                                facing: e.facing
                            };
                        }
                    } else {
                        e.pT--;
                        if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; }
                        if (e._cliffDir && e.pDir === e._cliffDir) e.pDir *= -1;
                        e.vx = e.pDir * (e.isElite ? 1.2 : 0.8);
                        if (e._cliffDir && Math.sign(e.vx) === e._cliffDir) e.vx = 0;
                    }
                }
            }

            if (e.type === "bomber") {
                const distSqB = dx * dx + dy * dy;
                if (!e.exploding) {
                    if (distSqB < 50000) { 
                        e.fuseT++;
                        e.vx *= 0.7; 
                        if (e.fuseT === 1) addText(e.x + e.w/2, e.y - 15, "BOOM!", "#ff4400", 80, 13);
                        if (e.fuseT >= 80) { 
                            e.exploding = true;
                            Game.camShake = 18; if(typeof playSfx === 'function') playSfx('boss_atk');
                            const boomR = 80;
                            const pdx = Game.player.x - e.x, pdy = Game.player.y - e.y;
                            if (pdx*pdx + pdy*pdy < boomR*boomR) {
                                if(typeof takeDmg === 'function') takeDmg(e.atk * 3, e, false);
                            }
                            for (let pi = 0; pi < 40; pi++) if(typeof addPart === 'function') addPart(e.x+e.w/2, e.y+e.h/2, pi<25?"#ff4400":"#ffaa00", 30, 5);
                            if(typeof spawnLaser === 'function') spawnLaser(e.x - boomR, e.y - boomR/2, boomR*2, boomR, 12, "#ff4400", e.atk*2, false, false);
                            e.hp = 0; e.dead = true;
                        }
                    } else {
                        e.fuseT = Math.max(0, e.fuseT - 2);
                        if (distSqB < 100000) {
                            e.facing = dx > 0 ? 1 : -1;
                            e.vx += e.facing * 0.35; e.vx = Math.max(-2.5, Math.min(2.5, e.vx));
                        } else {
                            e.pT--; if (e.pT <= 0) { e.pT = 60; e.pDir *= -1; }
                            e.vx = e.pDir * 1.2;
                        }
                    }
                }
            }

            else if (e.type === "phantom") {
                e.phantomT++;
                const cycle = e.invisDur + e.visDur;
                const phase = e.phantomT % cycle;
                e.visible = phase >= e.invisDur; 
                const distSqPh = dx * dx + dy * dy;
                if (!e.visible) {
                    e.facing = dx > 0 ? 1 : -1;
                    e.vx += e.facing * 0.4; e.vx = Math.max(-3.0, Math.min(3.0, e.vx));
                } else {
                    if (distSqPh < 100000) {
                        e.facing = dx > 0 ? 1 : -1;
                        e.vx += e.facing * 0.2; e.vx = Math.max(-2.0, Math.min(2.0, e.vx));
                        if (Math.abs(dx) < 55 && Math.abs(dy) < 40 && e.atkAnim <= 0 && e.warnT <= 0) {
                            e.warnT = 20; e.vx = 0;
                        }
                        if (e.warnT > 0) {
                            e.warnT--; e.vx = 0;
                            if (e.warnT <= 0) {
                                e.atkAnim = 25; if(typeof playSfx === 'function') playSfx('enemy_atk');
                                if (Math.abs(dx) < 70 && Math.abs(dy) < 45 && typeof takeDmg === 'function') takeDmg(e.atk, e);
                            }
                        } else if (e.atkAnim > 0) { e.atkAnim--; e.vx = 0; }
                    } else {
                        e.pT--; if (e.pT <= 0) { e.pT = 60; e.pDir *= -1; }
                        e.vx = e.pDir * 1.0;
                    }
                }
            }

            if (e.onGround && e.kbT <= 0) {
                const floorY = CH - 40;
                const isOnFloor = e.y + e.h >= floorY - 4;
                const moveDir = e.vx !== 0 ? Math.sign(e.vx) : e.facing;

                function hasPlatformAhead(dir) {
                    const foot = e.y + e.h;
                    for (let dist = 4; dist <= 28; dist += 4) {
                        const cx = dir > 0 ? e.x + e.w + dist : e.x - dist;
                        for (const t of Game.platforms) {
                            if (cx >= t.x && cx < t.x + t.w &&
                                foot >= t.y - 4 && foot <= t.y + t.h + 16) {
                                return true;
                            }
                        }
                    }
                    return false;
                }

                const frontSafe = hasPlatformAhead(moveDir);

                if (!frontSafe && e.vx !== 0) {
                    e._cliffDir = moveDir;
                    e.vx = 0;

                    if (isOnFloor) {
                        e.pDir = -moveDir;
                        e.pT   = 40 + Math.random() * 40;
                    } else if (e.type === "melee") {
                        const towardPlayer = Game.player && (moveDir > 0) === (Game.player.x > e.x);
                        if (towardPlayer && (Game.frameCount + (e.id || 0)) % 20 === 0) {
                            e.vy = -7.5; e.vx = moveDir * 3.0; e.onGround = false;
                            e._cliffDir = 0;
                        } else {
                            e.pDir = -moveDir; e.pT = 30 + Math.random() * 30;
                        }
                    } else {
                        e.pDir = -moveDir;
                        e.pT   = 80 + Math.random() * 40;
                        e._cliffDir = moveDir; 
                        if (Game.player) e.facing = Game.player.x > e.x ? 1 : -1;
                    }
                } else if (frontSafe) {
                    e._cliffDir = 0;
                }
            }
        }
        
        e.x += e.vx;
        e.y += e.vy;

        if (typeof resolveAABB === 'function') resolveAABB(e); 
        e.x = Math.max(0, Math.min(Game.levelW - e.w, e.x));
        
        // 💡 [패치] 스턴(stun) 뿐만 아니라 넉백 경직(kbT) 중일 때도 유저에게 데미지를 주지 않음!
        if (!e.stun && e.kbT <= 0 && Game.invT === 0 && typeof overlap === 'function' && overlap(Game.player, { x: e.x, y: e.y, w: e.w, h: e.h }) && !Game.player.dead) {
            if(typeof takeDmg === 'function') takeDmg(e.atk, e);
        }
    });
}