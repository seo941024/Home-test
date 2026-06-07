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
// 일반 mkEnemy와 완전히 분리되어 일반 스테이지에 영향 없음
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
    return e;
}

function mkBoss(x, y, w) {
    // 45스테이지 템포에 맞춘 스케일링 — 보스는 5배로 묵직하게
    const hps = [0, 4000, 6000, 9000, 12500, 17500, 24000, 30000, 37500, 45000, 30000];
    const hp = hps[Math.min(w, 10)]; 
    let e = getObj(Game.enemies);
    
    // 히트박스 = scale(1.8) × 내부 렌더 좌표 정확히 일치
    // 공식: e.w = 내부폭 * 1.8, e.h = 내부발끝 * 2 * 1.8
    if (w === 5 || w === 6) {
        e.w = 130; e.h = 130;  // 더스크/리치킹 — 부유형
    } else if (w === 10) {
        e.w = Math.floor(CW * 0.55);
        e.h = Math.floor(CH * 0.65);
    } else if (w <= 2) {
        e.w = 47; e.h = 72;   // 고블린 전사장: 내부±13, 발끝y=20 → 26*1.8=47, 20*2*1.8=72
    } else if (w <= 4) {
        e.w = 50; e.h = 76;   // 언데드 기사: 내부±14, 발끝y=21 → 28*1.8≈50, 21*2*1.8≈76
    } else {
        e.w = 65; e.h = 100;  // 마족 친위대: 내부±18, 발끝y=28 → 36*1.8≈65, 28*2*1.8≈100
    }
    
    e.x = x; e.y = y; e.vx = 0; e.vy = 0; e.onGround = false;
    e.hp = hp; e.maxHp = hp; e.type = "boss"; e.isBoss = true; e.isElite = false; e.facing = 1;
    e.isTutorialDummy = false; // 재사용 슬롯에 더미 플래그 잔존 방지 
    e.fr = 0; e.frT = 0; e.flash = 0;
    
    e.sT = 60; e.sI = 60; e.phase = 1; e.mT = 50; e.ap = 0; 
    
    const bossBaseAtk = Math.floor(Math.random() * 5) + 8; 
    const atkMul = 1 + Math.floor((w - 1) / 2) * 0.5;
    e.atk = Math.floor(bossBaseAtk * atkMul * 1.5);
    
    e.dead = false; e.kbT = 0; e.warnT = 0; e.warnData = null; e.atkAnim = 0; e.world = w;
    // 보스 고유 패턴 카운터
    e.patternSeq = 0;
    // 페이즈2 돌입 연출
    e.p2Triggered = false;
    // 연계 콤보 큐 (패턴 인덱스 배열, 순서대로 발동)
    e.comboQueue = [];
    e.comboDelay = 0;
        // 체간 초기화
    if (typeof initPoise === 'function') initPoise(e);
    else { e.poise = 200 + (e.world||1)*80; e.poiseMx = e.poise; e.stun = false; e.stunT = 0; }
    return e;
}

function updateEnemies() {
    Game.enemies.forEach(e => {
        if (!e.active) return;
        
        if (e.y > CH + 50 && !e.dead) { e.hp = 0; e.dead = true; } 
        
        if (e.dead) {
            Game.score += e.isBoss ? 500 : (e.isElite ? 150 : 50); Game.kills++; 
            
            if (e.isElite) {
                Game.darkQuartz += Math.floor(Math.random() * 3) + 1;
                addText(e.x, e.y - 30, "+ DARK QUARTZ", "#aa00ff", 60, 16);
                if (typeof saveProgress === 'function') saveProgress();
            } else if (e.isBoss) {
                Game.darkQuartz += Math.floor(Math.random() * 10) + 10;
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
                if(typeof addItem === 'function') addItem(e.x + e.w/2 - 5, Math.min(e.y, CH - 20), 10, 10, -4, 600, randType);
            }
            if (Game.enemies.filter(x => x.active && !x.dead).length === 0 && !e.isBoss) {
                if(typeof playSfx === 'function') playSfx('clear'); 
            } else if (e.isBoss) {
                if(typeof playSfx === 'function') { playSfx('boss_clear'); playSfx('clear'); }
                if(typeof stopBGM === 'function') stopBGM();
                // 보스 처치 화면 연출
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

        // 더미 골렘: 중력+충돌만 적용, AI/이동/공격 전부 건너뜀
        // 일반 몬스터 함수엔 전혀 영향 없음 — 플래그 없으면 그냥 통과
        if (e.isTutorialDummy) {
            e.vy = Math.min(e.vy + 0.4, 9);
            e.vx = 0;           // 이동속도 강제 0
            e.kbT = 0;          // 넉백도 없음 (위치 고정)
            e.warnT = 0;        // 경고 표시 안 함
            e.atkAnim = 0;      // 공격 모션 없음
            e.sT = 999999;      // 공격 쿨타임 리셋 방지
            e.x += e.vx; e.y += e.vy;
            if (typeof resolveAABB === 'function') resolveAABB(e);
            e.x = Math.max(0, Math.min((Game.levelW || 1600) - e.w, e.x));
            return; // AI 루프 완전 종료
        }

        e.vy = Math.min(e.vy + 0.4, 9);
        if (e.onGround && e.riding && e.riding.vx) e.x += e.riding.vx;

        if (e.kbT > 0 || e.stun) { 
            e.kbT = Math.max(0, e.kbT - 1);
            e.vx *= 0.7;
            // 스턴 중 깜빡임
            if (e.stun) e.flash = (e.flash + 1) % 4;
        } 
        else {
            const dx = Game.player.x - e.x; const dy = Game.player.y - e.y;
            const distSq = dx * dx + dy * dy;
            
            if (e.type === "melee") {
                e.sT--;
                if (Math.abs(dx) < 55 && Math.abs(dy) < 40 && e.sT <= 0 && e.warnT <= 0 && e.atkAnim <= 0) {
                    // 선딜레이 충분히 — 유저가 패링(V) 타이밍 잡을 수 있게
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
                    } else { e.pT--; if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; } e.vx = e.pDir * (e.isElite ? 1.5 : 1.0); }
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
                // ranged_bullet / ranged_laser - 경고 방향과 발사 방향 완전 일치
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
                        e.vx = Math.max(-1.4, Math.min(1.4, e.vx)); e.sT--;
                        if (e.sT <= 0) {
                            e.sT = e.sI;
                            // 원거리도 선딜 충분히 — 보고 피하거나 패링 유도
                        e.warnT = e.type === "ranged_laser" ? 90 : 65;
                            // warnData에 발사 시점 방향과 facing 저장
                            e.warnData = {
                                ang: Math.atan2(dy, dx),
                                facing: e.facing
                            };
                        }
                    } else { e.pT--; if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; } e.vx = e.pDir * (e.isElite ? 1.2 : 0.8); }
                }
            }

            // ── 특수 타입 AI ─────────────────────────────────────

            if (e.type === "bomber") {
                // 자폭형: 플레이어 근처 접근 → 퓨즈 → 폭발
                const distSqB = dx * dx + dy * dy;
                if (!e.exploding) {
                    if (distSqB < 50000) { // 약 220px 이내 접근 시 퓨즈 시작
                        e.fuseT++;
                        e.vx *= 0.7; // 느려짐
                        if (e.fuseT === 1) addText(e.x + e.w/2, e.y - 15, "BOOM!", "#ff4400", 80, 13);
                        if (e.fuseT >= 80) { // 약 1.3초 후 폭발
                            e.exploding = true;
                            Game.camShake = 18; playSfx('boss_atk');
                            // 폭발 범위 피해
                            const boomR = 80;
                            const pdx = Game.player.x - e.x, pdy = Game.player.y - e.y;
                            if (pdx*pdx + pdy*pdy < boomR*boomR) {
                                takeDmg(e.atk * 3, e, false);
                            }
                            for (let pi = 0; pi < 40; pi++) addPart(e.x+e.w/2, e.y+e.h/2, pi<25?"#ff4400":"#ffaa00", 30, 5);
                            spawnLaser(e.x - boomR, e.y - boomR/2, boomR*2, boomR, 12, "#ff4400", e.atk*2, false, false);
                            e.hp = 0; e.dead = true;
                        }
                    } else {
                        // 멀면 돌진
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
                // 투명형: 주기적으로 투명해짐 / 투명 중 공격 불가(hitE에서 막음)
                e.phantomT++;
                const cycle = e.invisDur + e.visDur;
                const phase = e.phantomT % cycle;
                e.visible = phase >= e.invisDur; // 투명 구간 중엔 false
                // 투명 중 플레이어 방향으로 빠르게 접근
                const distSqPh = dx * dx + dy * dy;
                if (!e.visible) {
                    e.facing = dx > 0 ? 1 : -1;
                    e.vx += e.facing * 0.4; e.vx = Math.max(-3.0, Math.min(3.0, e.vx));
                } else {
                    // 가시 상태: 기본 melee AI
                    if (distSqPh < 100000) {
                        e.facing = dx > 0 ? 1 : -1;
                        e.vx += e.facing * 0.2; e.vx = Math.max(-2.0, Math.min(2.0, e.vx));
                        // 근접 시 공격
                        if (Math.abs(dx) < 55 && Math.abs(dy) < 40 && e.atkAnim <= 0 && e.warnT <= 0) {
                            e.warnT = 20; e.vx = 0;
                        }
                        if (e.warnT > 0) {
                            e.warnT--; e.vx = 0;
                            if (e.warnT <= 0) {
                                e.atkAnim = 25; playSfx('enemy_atk');
                                if (Math.abs(dx) < 70 && Math.abs(dy) < 45) takeDmg(e.atk, e);
                            }
                        } else if (e.atkAnim > 0) { e.atkAnim--; e.vx = 0; }
                    } else {
                        e.pT--; if (e.pT <= 0) { e.pT = 60; e.pDir *= -1; }
                        e.vx = e.pDir * 1.0;
                    }
                }
            }

            // ── 낭떠러지 감지 ────────────────────────────────
            // 매 프레임 체크: 진행 방향 앞 발판이 없으면 멈춤
            // 플로팅 발판에서만 점프 허용 (바닥 구덩이는 점프 금지)
            if (e.onGround && e.atkAnim <= 0 && e.kbT <= 0) {
                const floorY = CH - 40; // stage.js의 바닥 발판 Y값
                const isOnFloor = e.y + e.h >= floorY - 2; // 바닥 발판 위에 있는지
                const checkX = e.facing > 0 ? e.x + e.w + 8 : e.x - 8;
                const checkY = e.y + e.h + 8;
                let frontSafe = false;
                for (const t of Game.platforms) {
                    if (checkX >= t.x && checkX <= t.x + t.w &&
                        checkY >= t.y && checkY <= t.y + t.h + 12) {
                        frontSafe = true; break;
                    }
                }

                if (!frontSafe) {
                    if (isOnFloor) {
                        // 바닥 구덩이: 절대 점프 금지, 그냥 멈추고 방향 전환
                        e.vx = 0;
                        e.pDir *= -1;
                        e.pT = 40 + Math.random() * 40;
                    } else if (e.type === "melee" && (Game.frameCount + (e.id || 0)) % 30 === 0) {
                        // 플로팅 발판 끝: 타겟 방향이면 도약, 아니면 방향 전환
                        const towardPlayer = (e.facing > 0) === (Game.player.x > e.x);
                        if (towardPlayer) {
                            e.vy = -7.5;
                            e.vx = e.facing * 3.0;
                            e.onGround = false;
                        } else {
                            e.vx = 0;
                            e.pDir *= -1;
                        }
                    } else if (e.type !== "melee") {
                        // 원거리 몹 절벽 앞: vx=0 완전 정지 — 낙사 자살 방지
                        e.vx = 0;
                        e.pDir = 0;      // 이동 의지 초기화
                        e.pT = 60;       // 충분히 멈춘 뒤 반대 방향 재탐색
                        e.pDir = (Game.player && Game.player.x < e.x) ? -1 : 1; // 플레이어 방향으로만 이동
                    }
                }
            }
        }
        
        e.x += e.vx;
        e.y += e.vy;

        if (typeof resolveAABB === 'function') resolveAABB(e); 
        e.x = Math.max(0, Math.min(Game.levelW - e.w, e.x));
        
        if (Game.invT === 0 && typeof overlap === 'function' && overlap(Game.player, { x: e.x, y: e.y, w: e.w, h: e.h }) && !Game.player.dead) { 
            if(typeof takeDmg === 'function') takeDmg(e.atk, e); 
        }
    });
}