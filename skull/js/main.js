// main.js — 게임 루프 및 상태 관리

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
    // NPC 대화 중에는 게임 로직 정지 (NPC 업데이트만 실행)
    if (typeof updateNPCs === 'function') updateNPCs();
    if (Game.npcTalking) {
        updateItemsAndMisc(); // 텍스트 파티클 등 비전투 업데이트만
        return;
    }
    updatePlayer();
    if (typeof updateStamina === 'function') updateStamina();
    updatePlayerCombat();
    if(typeof updateEnemies === 'function') updateEnemies();
    updateProjectiles();
    if (typeof updateTraps === 'function') updateTraps();
    updateCrewMinions();
    if (typeof updateSummons === 'function') updateSummons();
    if (typeof updateCurseDoT === 'function') updateCurseDoT();
    updateItemsAndMisc();

    // 보스 처치 대사 시퀀스 틱 (비차단 — 게임플레이 유지)
    if (Game.bossKillSeq) {
        Game.bossKillSeq.timer--;
        if (Game.bossKillSeq.timer <= 0) {
            Game.bossKillSeq.idx++;
            const seq = Game.bossKillSeq;
            if (seq.idx >= seq.lines.length) {
                Game.bossKillSeq = null;
            } else {
                seq.timer = seq.lines[seq.idx].duration;
            }
        }
    }

    Game.camX += (Game.player.x - CW / 3 - Game.camX) * 0.1;
    Game.camX = Math.max(0, Math.min(Game.levelW - CW, Game.camX));
}

// ==========================================
// HUD 및 기타 업데이트
// ==========================================

// DOM 기반 HUD(HP/MP/DASH/스테이지 표시) 매 프레임 갱신
function updateHUD() {
    const inGame = ["play", "dead", "gameover", "win", "upgrade", "boss_intro"].includes(Game.gs);
    const inPlay = ["play", "dead", "boss_intro"].includes(Game.gs); // 게이지는 실제 플레이 중에만
    
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
    // 게이지(스태미너/스킬/대쉬)는 실제 플레이 중에만 표시
    const uiGauges = document.getElementById("ui-gauges");
    if (uiGauges) uiGauges.style.display = inPlay ? "flex" : "none";
    if (uiSkill) uiSkill.style.display = inPlay ? "flex" : "none";
    const uiDash = document.getElementById("ui-dash");
    if (uiDash) uiDash.style.display = inPlay ? "flex" : "none";

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
        const pct = Math.floor((Game.pMp / (Game.pMaxMp || 15)) * 100);
        mpF.style.width = Math.min(100, pct) + "%";
        if (Game.pMp >= (Game.pMaxMp || 15)) {
            sLab.textContent = "준비완료!"; sLab.style.color = "#ffee00";
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
            dashLab.textContent = dashPct >= 1 ? "준비완료!" : Math.floor(dashPct * 100) + "%";
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
                stamLab.textContent = "최대"; stamLab.style.color = "greenyellow";
            } else if (stam < 15) {
                stamLab.textContent = "부족!"; stamLab.style.color = "#ff4400";
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

    const regionNames = ["", "고블린 숲", "불타는 고블린 숲", "스켈레톤의 영역", "불타는 스켈레톤의 영역", "저주받은 성당", "불타는 저주받은 성당", "어둠의 성당", "마족 성채", "마왕성 입구", "마왕의 왕좌"];
    let rName = regionNames[Math.min(Game.worldN, 10)];
    // 튜토리얼일 때는 STAGE 0으로 표기 — 1-1로 잘못 표시되는 혼란 방지
    if (Game.gs === "win") {
        if (stageLabel) stageLabel.textContent = "★ 클리어 ★";
    } else if (Game.isTutorial) {
        if (stageLabel) stageLabel.textContent = "스테이지 0  [ 튜토리얼 ]";
    } else {
        if (stageLabel) stageLabel.textContent = `[${rName}] 스테이지 ${Game.worldN}-${Game.levelN}${Game.levelN === 3 ? " [BOSS]" : ""}`;
    }
    
    if(scoreLabel) scoreLabel.textContent = "점수: " + Game.score;
    if(killLabel) killLabel.textContent = "처치: " + Game.kills;
}

// 오버레이(overlay) 제목·설명·버튼 텍스트를 갱신하고 표시
function showOv(t, s1, s2, btn) {
    const overlay = document.getElementById("overlay");
    if (overlay) {
        const contentBox = overlay.querySelector("div") || overlay.firstElementChild;
        if (contentBox) {
            contentBox.style.width = "650px"; 
            contentBox.style.maxWidth = "90%";
            contentBox.style.padding = "40px";
        }
        
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

// 로비(메뉴) 화면으로 복귀 — BGM 전환 및 overlay 내용 초기화
function restoreLobbyUI() {
    if (typeof stopBGM === 'function') stopBGM();
    // 로비 복귀 시 로비 BGM 재생
    setTimeout(() => { if (typeof playBGM === 'function') playBGM('lobby'); }, 300);
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.style.display = "flex";
        const h1 = overlay.querySelector("h1");
        if (h1) h1.innerHTML = "해골용사";
        const subs = overlay.querySelectorAll(".sub");
        if (subs.length > 0) subs[0].innerHTML = "저주에 의해 죽었지만 해골로 되살아난 용사. <br />마왕을 물리치고 저주를 풀기 위해 나아가야 한다.";
        if (subs.length > 1) subs[1].innerHTML = "[안내] 패링, 기본 공격 시 스킬 게이지가 충전됩니다.<br/> 게이지를 모아 강력한 기술을 사용하세요.";
        if (subs.length > 2) subs[2].innerHTML = "준비가 끝났다면 아래 버튼 또는 SPACE를 눌러주세요.";
        const btn = document.querySelector(".startBtn") || document.getElementById("startBtn");
        if (btn) btn.innerHTML = "▶ READY TO ADVENTURE";
    }
}

// 새 게임 시작 — 스탯·스코어·월드 초기화 후 직업별 기본값 적용 및 첫 스테이지 진입
function startGame() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    // 사망 BGM 등 이전 BGM을 완전히 끊음 — worldN/levelN 리셋 전에 play 호출 시 보스 BGM 재생되는 버그 방지
    if (typeof stopBGM === 'function') stopBGM();

    Game.score = 0; Game.kills = 0; Game.worldN = 1; Game.levelN = 1; 
    Game.pMp = 0; Game.comboCount = 0; Game.pRangeBonus = 0; Game.pBaseDef = 0; Game.pShield = 0;
    Game.pMaxMp = 15;

    // ── 공통 기본값 (직업별 설정보다 먼저 초기화해야 덮어쓰지 않음) ──
    Game.pAtkSpdMul = 1.0; Game.pParryMp = 3;
    Game.pSkillDmgMul = 1.0; Game.pExtraDmg = 0.0; Game.pHealOnHit = false;
    Game.pLifestealChance = 0.05; Game.pCritDmg = 1.5;
    Game.pReflectDmg = 0; Game.pLowHpDmg = 1.0; Game.pDashInv = 0;
    Game.pProjSlow = 1.0; Game.pSkillWidth = 1.0; Game.pDmgReduction = 1.0; Game.pComboDur = 0; Game.pComboDmg = 0; Game.pRevive = 0;

    // ── 직업별 기본 스탯 ──
    if (Game.pClass === 0) {
        // 전사: 밸런스
        Game.pMaxHp = 60 + (Game.permHpLvl * 10); Game.pBaseDmg = 50 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 1.0;
        Game.pRangeBonus = 15; Game.pCritChance = 0.20; Game.pBaseDef = 5;
    } else if (Game.pClass === 1) {
        // 도적: 쌍단검, 매우 빠름, 낮은 데미지, 높은 치명타
        Game.pMaxHp = 50 + (Game.permHpLvl * 10); Game.pBaseDmg = 30 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.3; Game.pDashCDMul = 0.55; Game.pJmpMul = 1.2; Game.pBaseAtkSpd = 2.0;
        Game.pRangeBonus = 10; Game.pCritChance = 0.35; Game.pBaseDef = -5;
    } else if (Game.pClass === 2) {
        // 마법사: 원거리, 보통 공속
        Game.pMaxHp = 40 + (Game.permHpLvl * 10); Game.pBaseDef = -5; Game.pBaseDmg = 50 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.55; Game.pCritChance = 0.18;
    } else if (Game.pClass === 3) {
        // 버서커: 매우 높은 HP/ATK, 매우 느린 공속, 낮은 치명타 (대신 고정 대미지)
        Game.pMaxHp = 100 + (Game.permHpLvl * 10); Game.pBaseDmg = 80 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 0.85; Game.pDashCDMul = 1.3; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.45;
        Game.pRangeBonus = 30; Game.pCritChance = 0.12; Game.pBaseDef = 10;
    } else if (Game.pClass === 4) {
        // 발키리(해적): 총, 매우 빠른 공속, 낮은 데미지, 8발 리로드, 높은 치명타
        Game.pMaxHp = 50 + (Game.permHpLvl * 10); Game.pBaseDmg = 25 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.1; Game.pDashCDMul = 0.9; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 2.5;
        Game.pGunAmmo = 8; Game.pGunReload = 0; Game.pCritChance = 0.28; Game.pBaseDef = -5;
    } else if (Game.pClass === 5) {
        // 성기사: 망치+방패, 중거리, 보통 공속, 패링 3배, 낮은 치명타 (안정 탱커)
        Game.pMaxHp = 80 + (Game.permHpLvl * 10); Game.pBaseDmg = 40 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 0.9; Game.pDashCDMul = 1.1; Game.pJmpMul = 0.95; Game.pBaseAtkSpd = 0.9;
        Game.pRangeBonus = 30; Game.pCritChance = 0.10; Game.pBaseDef = 15;
    } else if (Game.pClass === 6) {
        // 소환사: 저체력, 소환수가 메인 딜, 기본 공격 약
        Game.pMaxHp = 45 + (Game.permHpLvl * 10); Game.pBaseDmg = 40 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.7;
        Game.pRangeBonus = 20; Game.pCritChance = 0.15; Game.pBaseDef = 0;
    } else if (Game.pClass === 7) {
        // 강령술사: 영혼 스택으로 강화, 중거리 마법탄
        Game.pMaxHp = 55 + (Game.permHpLvl * 10); Game.pBaseDmg = 35 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 0.95; Game.pDashCDMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.8;
        Game.pRangeBonus = 25; Game.pCritChance = 0.20; Game.pBaseDef = 0;
    } else if (Game.pClass === 8) {
        // 혈귀: 피해 받을수록 강해지는 근거리 흡혈귀
        Game.pMaxHp = 70 + (Game.permHpLvl * 10); Game.pBaseDmg = 60 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.05; Game.pDashCDMul = 0.9; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 1.1;
        Game.pRangeBonus = 10; Game.pCritChance = 0.25; Game.pBaseDef = -5;
        Game.pLifestealChance = 0.40;
    } else if (Game.pClass === 9) {
        // 검성: 패링 카운터 폭딜, 균형형
        Game.pMaxHp = 65 + (Game.permHpLvl * 10); Game.pBaseDmg = 55 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 0.95; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 1.1;
        Game.pRangeBonus = 20; Game.pCritChance = 0.20; Game.pBaseDef = 5;
    } else if (Game.pClass === 10) {
        // 마창사: 관통 장거리 창술
        Game.pMaxHp = 60 + (Game.permHpLvl * 10); Game.pBaseDmg = 65 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 0.85; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.85;
        Game.pRangeBonus = 40; Game.pCritChance = 0.15; Game.pBaseDef = 0;
    } else if (Game.pClass === 11) {
        // 귀신병: 대시 후 반투명, 고속 근거리
        Game.pMaxHp = 50 + (Game.permHpLvl * 10); Game.pBaseDmg = 45 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.15; Game.pDashCDMul = 0.7; Game.pJmpMul = 1.1; Game.pBaseAtkSpd = 1.3;
        Game.pRangeBonus = 10; Game.pCritChance = 0.30; Game.pBaseDef = 0;
    } else if (Game.pClass === 12) {
        // 폭탄병 [사기]: 처치 1000회 — 한방 폭발 극대화
        Game.pMaxHp = 90 + (Game.permHpLvl * 10); Game.pBaseDmg = 90 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 0.88; Game.pDashCDMul = 1.3; Game.pJmpMul = 0.92; Game.pBaseAtkSpd = 0.55;
        Game.pRangeBonus = 40; Game.pCritChance = 0.15; Game.pBaseDef = 8;
        Game.pSkillDmgMul = 3.0;
    } else if (Game.pClass === 13) {
        // 빙술사: 빙결 제어, 원거리 저딜
        Game.pMaxHp = 40 + (Game.permHpLvl * 10); Game.pBaseDmg = 45 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 1.0; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.65;
        Game.pRangeBonus = 35; Game.pCritChance = 0.18; Game.pBaseDef = -5;
    } else if (Game.pClass === 14) {
        // 무당 [사기급]: 스킬 200회 — 저주가 극단적으로 강함
        Game.pMaxHp = 55 + (Game.permHpLvl * 10); Game.pBaseDmg = 50 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 0.9; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 0.85;
        Game.pRangeBonus = 30; Game.pCritChance = 0.28; Game.pBaseDef = 0;
        Game.pSkillDmgMul = 2.5;
    } else if (Game.pClass === 15) {
        // 도박사 [사기]: 처치 2000회 — 크리 터지면 게임 끝
        Game.pMaxHp = 60 + (Game.permHpLvl * 10); Game.pBaseDmg = 55 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.15; Game.pDashCDMul = 0.85; Game.pJmpMul = 1.08; Game.pBaseAtkSpd = 1.1;
        Game.pRangeBonus = 15; Game.pCritChance = 0.50; Game.pCritDmg = 7.0;
        Game.pBaseDef = 0;
    } else if (Game.pClass === 16) {
        // 분신술사 [사기]: 엘리트 200회 — 분신들이 진짜 강함
        Game.pMaxHp = 55 + (Game.permHpLvl * 10); Game.pBaseDmg = 60 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.25; Game.pDashCDMul = 0.6; Game.pJmpMul = 1.15; Game.pBaseAtkSpd = 1.5;
        Game.pRangeBonus = 10; Game.pCritChance = 0.40; Game.pBaseDef = -5;
    } else if (Game.pClass === 17) {
        // 연금술사 [사기]: 영구 합산 30 — 포션이 5초마다, 독 극강
        Game.pMaxHp = 70 + (Game.permHpLvl * 10); Game.pBaseDmg = 60 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 1.0; Game.pDashCDMul = 0.95; Game.pJmpMul = 1.0; Game.pBaseAtkSpd = 1.0;
        Game.pRangeBonus = 25; Game.pCritChance = 0.22; Game.pBaseDef = 8;
        Game.pSkillDmgMul = 2.0; Game.pHealOnHit = true;
        Game._alchemistTimer = 300; // 5초 쿨
    } else if (Game.pClass === 18) {
        // 선봉대 [사기]: 영구 방어 레벨 5 — 진짜 무적 탱커
        Game.pMaxHp = 130 + (Game.permHpLvl * 12); Game.pBaseDmg = 50 + (Game.permAtkLvl * 2);
        Game.pMoveSpdMul = 0.88; Game.pDashCDMul = 1.0; Game.pJmpMul = 0.92; Game.pBaseAtkSpd = 0.85;
        Game.pRangeBonus = 20; Game.pCritChance = 0.12; Game.pBaseDef = 35;
        Game.pSkillDmgMul = 1.8;
    }

    // 사거리 역비례 보정: 근거리=높음, 원거리=낮음
    const CLASS_DMG_MUL = [1.5,1.3,0.7,1.5,0.7,1.2,0.5,0.8,1.0, 1.4,1.3,1.1,2.0,0.75,1.2,1.0,1.3,1.0,1.5];
    Game.pBaseDmgMul = CLASS_DMG_MUL[Game.pClass] || 1.0;
    // 영구 강화: 초기화 이후에 적용 (덮어씌워지지 않도록)
    Game.pMaxHp       += (Game.permHpLvl     || 0) * 10;
    Game.pBaseDmg     += (Game.permAtkLvl    || 0) * 2;
    Game.pCritChance  += (Game.permCritLvl   || 0) * 0.02;
    Game.pMoveSpdMul  += (Game.permSpdLvl    || 0) * 0.04;
    Game.pAtkSpdMul   += (Game.permAtkSpdLvl || 0) * 0.05;
    Game.pBaseDef     += (Game.permDefLvl    || 0) * 2;
    Game.pDmgReduction = 1.0;
    Game.pDashCDMul    = Math.max(0.5, Game.pDashCDMul - (Game.permDashLvl || 0) * 0.05);
    Game.pCritDmg     += (Game.permCritDmgLvl || 0) * 0.10;
    
    Game.pFinalDmgMul = 1.0; Game.pMultiplierItems = 0; Game.rerollCoins = 0;
    Game.pRegenFrames = 0; Game.regenT = 0; Game.pHealOnClear = 0;
    Game.pParryBonus = 0; Game.pCursedPendant = false; Game.curseT = 0;
    Game.pDropRate = 0.35; Game.pBloodFestival = false; Game.obtainedItems = [];
    Game.pDoubleSkillChance = 0; Game._doubleCast = false; Game._showItemList = false;
    Game._quartzMul = 1; Game._reviveHpMul = 0.5; Game._pendingInvT = 0;
    if (typeof _appliedSynergies !== 'undefined') _appliedSynergies.clear();
    Game.summons = []; Game.soulStacks = 0;
    Game._bloodFuryStacks = 0; Game._bloodFuryTimer = 0;
    Game._swordParryReady = false;                 // 검성: 패링 후 3배 카운터
    Game._ghostDashInvT = 0; Game._ghostPreDmgReduction = 1.0; // 귀신병: 대시 후 반투명
    Game._alchemistTimer = 600;                    // 연금술사: 포션 타이머
    Game._vanguardDefBuff = 0;                     // 선봉대: 피격 방어력 버프 타이머
    Game._cursedEnemies = new Set();               // 무당: 저주 적 추적
    Game._shadowCloneSpawned = false;              // 분신술사: 패시브 분신
    
    Game.player = null; 
    Game.isPaused = false;
    Game.traps = [];
    Game.bloodDecals = [];
    // 런 결과 기록 초기화
    Game.runStats = { startTime: Date.now(), totalDmgDealt: 0, totalDmgTaken: 0, bossesKilled: 0, maxCombo: 0, itemsObtained: 0 };

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
    startBtn.addEventListener("keydown", e => { if (!Game._menuReady) e.preventDefault(); });
    startBtn.addEventListener("click", () => {
        if (!Game._menuReady) return;
        const overlay = document.getElementById("overlay");
        if(overlay) overlay.style.display = "none";
        if (typeof startCutscene === 'function') startCutscene("opening");
        else { _diffReset(); Game.gs = "difficulty_select"; }
    });
}

let lastTime = 0; const FPS = 60; const interval = 1000 / FPS;

// ── 난이도 선택 씬 ──────────────────────────────────────────
const DIFF_NAMES  = ["쉬움", "보통", "어려움", "지옥"];
const DIFF_COLORS = ["#44ff88", "#ffee44", "#ff8844", "#ff2222"];
const DIFF_DESCS  = [
    "초보자를 위한 난이도. 적의 체력과 공격력이 절반으로 줄어 전투에 익숙해지기 좋습니다.",
    "모험을 처음 떠나는 사람이 즐기기 좋은 난이도. 긴장감 있는 전투가 기다리고 있습니다.",
    "하드코어를 즐기는 사람에게 좋은 난이도. 적들이 훨씬 강인하고 공격적으로 변합니다.",
    "그 모든 것이 죽음을 초래합니다. 모든 적이 엘리트로 등장하며, 감당하기 어려운 힘으로 덤벼옵니다. 조심하십시오, 용사님."
];

// 난이도 선택 씬 상태
let _diffSel = 1;       // 현재 커서
let _diffT   = 0;       // 씬 진입 후 프레임 카운터 (타이핑 효과용)
let _diffUpOld = false, _diffDnOld = false, _diffOkOld = false;
function _diffReset() { _diffT = 0; _diffSel = 1; _diffUpOld = false; _diffDnOld = false; _diffOkOld = false; }
const DIFF_TITLE = "난이도를 설정해주세요.";
const DIFF_TYPING_SPD = 3; // 몇 프레임마다 글자 1개

function tickDifficultySelect(frameNow) {
    _diffT++;

    const upNow = dn("ArrowUp");
    const dnNow = dn("ArrowDown");
    const okNow = dn("Space") || dn("Enter");

    if (upNow && !_diffUpOld) { _diffSel = (_diffSel + 3) % 4; if(typeof playSfx==='function') playSfx('item'); }
    if (dnNow && !_diffDnOld) { _diffSel = (_diffSel + 1) % 4; if(typeof playSfx==='function') playSfx('item'); }
    if (okNow && !_diffOkOld && _diffT > DIFF_TITLE.length * DIFF_TYPING_SPD) {
        Game.difficulty = _diffSel;
        if(typeof playSfx==='function') playSfx('item');
        Game.gs = "class_select";
    }

    _diffUpOld = upNow; _diffDnOld = dnNow; _diffOkOld = okNow;

    // ── 렌더 ──
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CW, CH);

    // 타이핑 효과: 프레임에 따라 글자 수 늘림
    const charsVisible = Math.min(DIFF_TITLE.length, Math.floor(_diffT / DIFF_TYPING_SPD));
    const titleStr = DIFF_TITLE.slice(0, charsVisible);

    ctx.font = "18px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = "#cccccc";
    ctx.textAlign = "center";
    ctx.fillText(titleStr, CW / 2, 90);

    // 타이핑 완료 후 메뉴 표시
    if (charsVisible >= DIFF_TITLE.length) {
        const startY = 138;
        const lineH  = 38;
        for (let i = 0; i < 4; i++) {
            const isSelected = (i === _diffSel);
            const y = startY + i * lineH;

            if (isSelected) {
                ctx.fillStyle = "rgba(255,255,255,0.07)";
                ctx.fillRect(CW/2 - 110, y - 20, 220, 28);
            }

            // 커서 ▶
            ctx.fillStyle = isSelected ? DIFF_COLORS[i] : "#555555";
            ctx.textAlign = "right";
            ctx.font = isSelected ? "bold 18px SkullFont, NeoDunggeunmo" : "16px SkullFont, NeoDunggeunmo";
            ctx.fillText(isSelected ? "▶" : "　", CW/2 - 30, y);

            // 난이도 이름
            ctx.fillStyle = isSelected ? DIFF_COLORS[i] : "#666666";
            ctx.textAlign = "left";
            ctx.fillText(DIFF_NAMES[i], CW/2 - 22, y);
        }

        // 선택된 항목 설명
        ctx.font = "13px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.fillStyle = _diffSel === 3 ? "#ff4444" : "#aaaaaa";
        ctx.fillText(DIFF_DESCS[_diffSel], CW/2, startY + 4 * lineH + 6);

        // 조작 안내
        ctx.fillStyle = "#555555";
        ctx.font = "11px SkullFont, NeoDunggeunmo";
        ctx.fillText("↑↓ 방향키로 선택 / SPACE·Enter 확인", CW/2, CH - 16);
    }

    ctx.textAlign = "left";
}

function updateClassSelect() {
    // ← → 로 6직업 순환 + 슬라이드 애니메이션 트리거
    if (dn("ArrowRight") && !K.rDirOld) {
        Game._classSlideDir = 1;   // 오른쪽으로 슬라이드
        Game._classSlideT   = 0;
        Game.pClass = (Game.pClass + 1) % 19;
        playSfx('item');
    }
    if (dn("ArrowLeft") && !K.lOld) {
        Game._classSlideDir = -1;  // 왼쪽으로 슬라이드
        Game._classSlideT   = 0;
        Game.pClass = (Game.pClass + 18) % 19;
        playSfx('item');
    }
    // 슬라이드 타이머 진행
    if (Game._classSlideT !== undefined && Game._classSlideT < 1) {
        Game._classSlideT = Math.min(1, (Game._classSlideT || 0) + 0.1);
    }

    if (dn("Space") && !K.spcOld) {
        const isUnlocked = (Game.unlockedClasses || Array(19).fill(0).map((v,i)=>i===0?1:0))[Game.pClass] === 1;
        if (!isUnlocked) {
            Game._classLockFlash = 60;
        } else {
            startGame();
        }
    }
    const _noEscGs = ["boss_loot", "event_room", "upgrade", "route_select"];
    if (dn("Escape") && !K.escOld && !_noEscGs.includes(Game.gs)) { Game.gs = "menu"; if (typeof restoreLobbyUI === 'function') restoreLobbyUI(); }
    if (dn("KeyS") && !K.sOld && !_noEscGs.includes(Game.gs)) { Game._prevShopGs = Game.gs; Game.gs = "shop"; playSfx('item'); }
}

// ==========================================
// 게임 상태별 업데이트/렌더 핸들러
// ==========================================

function tickRouteSelect(frameNow) {
    const t = Date.now();
    const pulse = (Math.sin(t * 0.003) + 1) / 2;

    // ── 배경 ──
    ctx.fillStyle = "#04010a"; ctx.fillRect(0, 0, CW, CH);
    const bgGrd = ctx.createRadialGradient(CW/2, CH*0.45, 10, CW/2, CH/2, CW*0.7);
    bgGrd.addColorStop(0, "rgba(44,0,58,0.55)"); bgGrd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, CW, CH);

    // 부유 파티클
    ctx.save();
    for (let i = 0; i < 18; i++) {
        const px = ((i * 91 + t * 0.007 * (i%3===0?1:-0.6)) % CW + CW) % CW;
        const py = ((i * 57 + t * 0.005 * (i%2===0?0.75:-0.4)) % CH + CH) % CH;
        const pa = 0.05 + Math.sin(t * 0.0022 + i * 1.4) * 0.03;
        ctx.fillStyle = `rgba(155,75,255,${pa})`;
        ctx.beginPath(); ctx.arc(px, py, 1 + (i%4)*0.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    // ── 헤더 ──
    ctx.save(); ctx.textAlign = "center";
    ctx.font = "bold 19px SkullFont, NeoDunggeunmo";
    ctx.shadowBlur = 14+pulse*8; ctx.shadowColor = "#9933ff";
    ctx.fillStyle = "#ddaaff";
    ctx.fillText(`WORLD ${Game.worldN}  ―  분기점`, CW/2, 26);
    ctx.shadowBlur = 0;
    ctx.font = "13px SkullFont, NeoDunggeunmo";
    ctx.fillStyle = "#553366";
    ctx.fillText("앞으로 나아갈 길을 선택하라", CW/2, 42);
    ctx.restore();

    // 구분선
    const sg = ctx.createLinearGradient(0,0,CW,0);
    sg.addColorStop(0,"transparent"); sg.addColorStop(0.15,"#551188"); sg.addColorStop(0.5,"#aa55ff"); sg.addColorStop(0.85,"#551188"); sg.addColorStop(1,"transparent");
    ctx.strokeStyle = sg; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,47); ctx.lineTo(CW,47); ctx.stroke();

    // ── 옵션 카드 ──
    const opts = [
        { key:"1", label:"치유의 은혜", lines:["HP 50% 즉시 회복","체력이 위험할 때"], rgb:[255,80,80], icon:"♥", dim:"rgba(52,0,0," },
        { key:"2", label:"마나의 샘",   lines:["마나 100% 즉시 회복","필살기 연계 시"], rgb:[60,150,255], icon:"✦", dim:"rgba(0,8,50," },
        { key:"3", label:"유물의 현현", lines:["패시브 유물 하나 선택","강한 빌드를 원할 때"], rgb:[255,200,50], icon:"◆", dim:"rgba(40,26,0," },
    ];
    const bw = 172, bh = 168, gap = 12;
    const totalW = opts.length*bw + (opts.length-1)*gap;
    const sx = (CW-totalW)/2, by = 55;

    opts.forEach((opt, i) => {
        const bx = sx + i*(bw+gap);
        const [r,g2,b2] = opt.rgb;
        const col = `rgb(${r},${g2},${b2})`;
        const hover = dn("Digit"+opt.key) || dn("Numpad"+opt.key);
        const hp = hover ? pulse : 0;

        // 카드 bg 그라디언트
        const cg = ctx.createLinearGradient(bx, by, bx, by+bh);
        cg.addColorStop(0, hover ? opt.dim+"0.42)" : opt.dim+"0.84)");
        cg.addColorStop(1, hover ? opt.dim+"0.22)" : opt.dim+"0.95)");
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 9); ctx.fill();

        // 상단 컬러 shimmer
        const tg = ctx.createLinearGradient(bx, by, bx+bw, by);
        tg.addColorStop(0,`rgba(${r},${g2},${b2},0)`);
        tg.addColorStop(0.5,`rgba(${r},${g2},${b2},${hover?0.22:0.10})`);
        tg.addColorStop(1,`rgba(${r},${g2},${b2},0)`);
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh*0.30, [9,9,0,0]); ctx.fill();

        // 테두리 글로우
        ctx.shadowBlur = hover ? 10+hp*6 : 3;
        ctx.shadowColor = col;
        ctx.strokeStyle = hover ? col : `rgba(${r},${g2},${b2},0.5)`;
        ctx.lineWidth = hover ? 2 : 1.2;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 9); ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.textAlign = "center";
        // 아이콘
        ctx.font = hover ? "bold 28px SkullFont" : "bold 24px SkullFont";
        ctx.shadowBlur = hover ? 12 : 4; ctx.shadowColor = col;
        ctx.fillStyle = col;
        ctx.fillText(opt.icon, bx+bw/2, by+46);
        ctx.shadowBlur = 0;

        // 키 + 라벨
        ctx.font = "bold 15px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = hover ? "#ffffff" : col;
        ctx.fillText(`[${opt.key}]  ${opt.label}`, bx+bw/2, by+72);

        // 내부 구분선
        ctx.strokeStyle = `rgba(${r},${g2},${b2},0.22)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx+16, by+82); ctx.lineTo(bx+bw-16, by+82); ctx.stroke();

        // 설명
        ctx.font = "13px SkullFont, NeoDunggeunmo";
        opt.lines.forEach((l, j) => {
            ctx.fillStyle = hover ? "#ffffff" : "#999999";
            ctx.fillText(l, bx+bw/2, by+100+j*20);
        });
    });

    ctx.textAlign = "left";

    // 입력
    if (dn("Digit1","Numpad1") && !K.u1Old) {
        if (Game.player) Game.player.hp = Math.min(Game.pMaxHp, Game.player.hp + Math.floor(Game.pMaxHp * 0.5));
        addText(320, 160, "HP +50% 회복!", "#ff4444", 80, 18, 0, 0.5); playSfx('item');
        Game.transState = 2; Game.transT = 255; Game.gs = "play"; playBGM('play');
        if (typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
    } else if (dn("Digit2","Numpad2") && !K.u2Old) {
        Game.pMp = Game.pMaxMp;
        addText(320, 160, "MP 100% 회복!", "#44aaff", 80, 18, 0, 0.5); playSfx('item');
        Game.transState = 2; Game.transT = 255; Game.gs = "play"; playBGM('play');
        if (typeof genStage === 'function') genStage(Game.worldN, Game.levelN);
    } else if (dn("Digit3","Numpad3") && !K.u3Old) {
        playSfx('menu_select');
        if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
        Game._upgradeFromRoute = true; Game._upgradePreview = null; Game._upgradeRouteDelay = 10;
        Game.gs = "upgrade"; playBGM('upgrade');
    }
}

// 메뉴 상태 매 프레임 처리 — 배경 렌더 + Space/Enter 입력으로 게임 시작
function tickMenu() {
    const bgGrd = ctx.createRadialGradient(CW/2, CH/2, 0, CW/2, CH/2, CW);
    bgGrd.addColorStop(0, "#2a0b4e");
    bgGrd.addColorStop(1, "#05020a");
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let x = 0; x < CW; x += TILE) ctx.fillRect(x, CH - TILE, TILE, TILE);

    if (!Game._menuReady) return; // 페이드인 미완료 시 모든 입력 차단
    if ((dn("Space") && !K.spcOld) || (dn("Enter") && !K.entOld)) {
        // 저장/불러오기 패널이 열려 있으면 게임 시작 차단
        const panel = document.getElementById('saveLoadPanel');
        if (panel && panel.style.display !== 'none') return;
        const overlay = document.getElementById("overlay");
        if (overlay) overlay.style.display = "none";
        playSfx('item');
        if (typeof startCutscene === 'function') startCutscene("opening");
        else { _diffReset(); Game.gs = "difficulty_select"; }
    }
}

// 직업 선택 화면 업데이트 + 렌더
function tickClassSelect(frameNow) {
    updateClassSelect();
    if (typeof renderClassSelect === 'function') renderClassSelect(frameNow);
}

// 영구 상점 업데이트 + 렌더
function tickShop() {
    updateShop();
    renderShop();
}

// 업그레이드 선택 화면 — R 키로 리롤, 나머지는 renderUpgrade에서 처리
function tickUpgrade() {
    if (dn("KeyR") && !K.rOld && Game.rerollCoins > 0) {
        Game.rerollCoins--;
        playSfx('item');
        if (typeof generateUpgradeOptions === 'function') generateUpgradeOptions();
    }
    renderUpgrade();
}

// 플레이·사망·게임오버·클리어 상태를 매 프레임 처리하는 메인 플레이 틱
function tickPlay() {
    // 사망 → 게임오버 전환
    if (Game.gs === "dead" && Game.deadTimer <= 0) {
        Game.gs = "gameover";
        if (Game.score > Game.highScore) {
            Game.highScore = Game.score;
            localStorage.setItem("skull_highscore", Game.highScore);
        }
    }

    // 게임오버 캔버스 표시 (YOU DIED + 통계)
    if (Game.gs === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.92)"; ctx.fillRect(0, 0, CW, CH);
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 52px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = "#cc0000";
        ctx.shadowBlur = 28; ctx.shadowColor = "#ff0000";
        ctx.fillText("당신은 죽었습니다", CW / 2, CH / 2 - 30);
        ctx.shadowBlur = 0;
        const rs = Game.runStats;
        const runSec = rs ? Math.floor((Date.now() - rs.startTime) / 1000) : 0;
        const runMin = Math.floor(runSec / 60), runS = runSec % 60;
        ctx.font = "14px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText(`스코어: ${Game.score}   최고: ${Game.highScore}`, CW / 2, CH / 2 + 14);
        ctx.fillText(`스테이지 ${Game.worldN}-${Game.levelN} 도달   최대 ${rs ? rs.maxCombo : 0} 콤보   ${runMin}분 ${runS}초`, CW / 2, CH / 2 + 34);
        ctx.font = "bold 14px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? "#ffffff" : "#555";
        ctx.fillText("[ SPACE ] 로비로 복귀", CW / 2, CH / 2 + 64);
        ctx.textAlign = "left";
        ctx.restore();
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
        const bbw = document.getElementById("bossBarWrap");
        if (bbw) bbw.style.display = "none";
        Game.gs = "menu";
        restoreLobbyUI();
        return;
    }
    if (Game.gs === "win") {
        ctx.fillStyle = "rgba(0,0,0,0.88)"; ctx.fillRect(0, 0, CW, CH);
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 36px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = "#ffcc00";
        ctx.shadowBlur = 22; ctx.shadowColor = "#ffcc00";
        ctx.fillText("해골용사", CW / 2, CH / 2 - 30);
        ctx.shadowBlur = 0;
        ctx.font = "16px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = "#cccccc";
        ctx.fillText("모든 악몽을 정복했습니다.", CW / 2, CH / 2 + 2);
        ctx.fillText(`스코어: ${Game.score}   최고기록: ${Game.highScore}`, CW / 2, CH / 2 + 24);
        ctx.font = "bold 14px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? "#ffcc00" : "#886600";
        ctx.fillText("[ SPACE ] 엔딩 보기", CW / 2, CH / 2 + 56);
        ctx.textAlign = "left";
        ctx.restore();
        if (dn("Space") && !K.spcOld) {
            stopBGM();
            if (typeof startCutscene === 'function') startCutscene("ending");
            else { Game.gs = "menu"; restoreLobbyUI(); }
            return;
        }
    }

    // 로직 업데이트 — Tab 오버레이 열려있으면 물리/AI도 멈춤
    if ((Game.gs === "play" || Game.gs === "dead" || Game.gs === "boss_intro") && !Game.isPaused && !Game._showItemList) {
        if (typeof update === 'function') update();
    }

    // 렌더 — cutscene/opening/win 계열은 별도 처리하므로 여기선 skip
    if (typeof render === 'function'
        && Game.gs !== "win"
        && Game.gs !== "cutscene"
        && Game.gs !== "opening_anim"
        && Game.gs !== "opening_end"
        && Game.gs !== "tutorial_intro") {
        render();
    }

    // 일시정지 오버레이
    if (Game.isPaused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; 
    ctx.fillRect(0, 0, CW, CH);
    
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 40px SkullFont"; // 폰트 이름 변경
    ctx.textAlign = "center";
    ctx.fillText("일시정지", CW/2, CH/2);
    
    ctx.font = "16px SkullFont"; // 폰트 이름 변경
    ctx.fillStyle = "#aaa";
    ctx.fillText("P: 재개 / R: 재시작 / ESC: 로비 복귀", CW/2, CH/2 + 40);
    ctx.textAlign = "left";
}}

// M 키 음소거 토글 및 화면 좌상단 음소거 상태 표시
function tickMuteOverlay() {
    if (dn("KeyM") && !K.mOld) Game.isMuted = !Game.isMuted;
    
    // 적 수 텍스트(y=20) 아래에 배치
    if (Game.isMuted) {
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 11px SkullFont";
        ctx.textAlign = "left";
        ctx.fillText("[ 음소거 ]", 10, 36);
        ctx.textAlign = "left";
    } else {
        ctx.fillStyle = "rgba(200,200,200,0.45)";
        ctx.font = "11px SkullFont";
        ctx.textAlign = "left";
        ctx.fillText("M: 음소거", 10, 36);
        ctx.textAlign = "left";
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
            "↓ + C   :  강하 공격  (공중에서 아래방향+C, 강력한 타격)",
            "Shift 키 :  필살기  (MP 게이지 100% 시 발동)",
            "V 키     :  가드 / 패링",
        ]
    },
    {
        title: "[ 전투 심화: 콤보 & 패링 ]",
        lines: [
            "■ 콤보 시스템",
            "  C를 연속 입력하면 콤보 카운터 상승 → 데미지 보너스 누적.",
            "  피격되면 콤보가 초기화됩니다.",
            "",
            "■ 패링 & 기절(Stun)",
            "  패링(V) 성공 시 일반 몹: HP 30% 확정 피해 + 기절.",
            "  기절 중엔 적이 멈추고 피해가 자유롭게 들어감.",
            "  보스는 패링으로 체간 감소 → 그로기 → C키로 확정 피해!",
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
        if (typeof playSfx === 'function') playSfx('menu_select');
        if (!isLastPage) { Game.tutorialIntroPage++; }
        else if (typeof genTutorial === 'function') { genTutorial(); }
    }
    if (backNow && !Game._tutPageOld.back && page > 0) { if (typeof playSfx === 'function') playSfx('menu_select'); Game.tutorialIntroPage--; }
    Game._tutPageOld.sp   = spNow;
    Game._tutPageOld.back = backNow;
}

// requestAnimationFrame 메인 루프 — 60fps 프레임 제한 후 게임 상태별 틱 디스패치
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

    // Tab: 유물 목록 토글 + 열릴 때 선택 초기화
    if (dn("Tab") && !K.tabOld) {
        if (Game.gs === "play" || Game.gs === "boss_intro") {
            Game._showItemList = !Game._showItemList;
            if (Game._showItemList) { Game._tabSelIdx = 0; Game._tabScrollRow = 0; }
            playSfx('menu_select');
        }
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
        case "difficulty_select": tickDifficultySelect(frameNow); break;
        case "class_select": tickClassSelect(frameNow); break;
        case "shop":         tickShop();              break;
        case "upgrade":      tickUpgrade();           break;
        case "boss_loot":    renderBossLoot();        break;
        case "event_room":   renderEventRoom();       break;
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

    // 음소거 오버레이 (메뉴/클래스선택/상점/튜토리얼인트로 제외 — tutorial_intro는 페이지 번호와 겹침)
    if (Game.gs !== "menu" && Game.gs !== "class_select" && Game.gs !== "difficulty_select" && Game.gs !== "shop" && Game.gs !== "cutscene" && Game.gs !== "opening_anim" && Game.gs !== "tutorial_intro") {
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
    K.upOld    = dn("ArrowUp");
    K.dwnOld   = dn("ArrowDown");
    K.tabOld   = dn("Tab");

    if (typeof updateHUD === 'function') updateHUD();
}

requestAnimationFrame((time) => { lastTime = time; loop(time); });

// ── 반응형 스케일: 뷰포트에 맞게 #wrapper 비율 유지 ──
(function initResponsiveScale() {
    const wrapper = document.getElementById('wrapper');
    const BASE_W = 1280;
    let baseH = 0;

    function applyScale() {
        // 스케일 초기화 후 실제 높이 측정
        wrapper.style.transform = '';
        wrapper.style.marginTop = '';
        wrapper.style.marginBottom = '';
        if (!baseH) baseH = wrapper.offsetHeight || 900;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scaleW = vw / BASE_W;
        const scaleH = vh / baseH;
        const scale = Math.min(scaleW, scaleH); // 제한 없이 완전 축소 가능

        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.transformOrigin = 'top center';
        // transform은 레이아웃 공간을 차지하지 않으므로 축소분만큼 마진으로 보정
        const scaledH = baseH * scale;
        const shrink = baseH - scaledH; // 줄어든 픽셀 (항상 >= 0)
        wrapper.style.marginBottom = `-${shrink}px`;
        wrapper.style.marginTop = '0';
    }

    window.addEventListener('resize', applyScale);
    // 폰트/이미지 로드 후 높이가 확정되면 다시 계산
    window.addEventListener('load', () => { baseH = 0; applyScale(); });
    applyScale();
}());
// ── 쯔꾸르 메뉴 시스템 ──
(function initMainMenu() {
    let menuIdx = 0;
    const MENU_ITEMS  = ['start','load','save','reset'];
    const MENU_LABELS = ['시작하기','불러오기','저장하기','초기화'];

    function getDisplay() {
        return document.getElementById('menuDisplay');
    }

    function updateMenu() {
        const el = getDisplay();
        if (el) {
            el.textContent = '▶ ' + MENU_LABELS[menuIdx];
        }
    }

    function execMenu() {
        if (!Game._menuReady) return;
        const action = MENU_ITEMS[menuIdx];
        if (action === 'start') {
            hideOverlay();
            // 오프닝 컷씬 먼저 → 컷씬 끝나면 class_select로 자동 전환
            if (typeof startCutscene === 'function') startCutscene('opening');
            else if (typeof startGame === 'function') startGame();
        } else if (action === 'save') {
            showSavePanel();
        } else if (action === 'load') {
            // localStorage에 저장 데이터 있으면 바로 이어하기, 없으면 코드 입력창
            if (localStorage.getItem('skull_save')) {
                loadGameData();
                hideOverlay();
                if (typeof startGame === 'function') startGame();
            } else {
                showLoadPanel();
            }
        } else if (action === 'reset') {
            // confirm 닫힌 후 Enter가 keydown으로 재전파되지 않도록 준비 시간 차단
            Game._menuReady = false;
            const doReset = confirm('모든 진행 데이터를 초기화합니다. 계속하시겠습니까?');
            setTimeout(() => { Game._menuReady = true; }, 300);
            if (doReset) {
                localStorage.clear();
                alert('초기화 완료!');
                location.reload();
            }
        }
    }

    function hideOverlay() {
        const ov = document.getElementById('overlay');
        if (ov) ov.style.display = 'none';
    }

    // 저장
    function saveGameData() {
        const data = {
            darkQuartz:     Game.darkQuartz     || 0,
            permHpLvl:      Game.permHpLvl      || 0,
            permAtkLvl:     Game.permAtkLvl     || 0,
            permCritLvl:    Game.permCritLvl    || 0,
            permSpdLvl:     Game.permSpdLvl     || 0,
            permDefLvl:     Game.permDefLvl     || 0,
            permAtkSpdLvl:  Game.permAtkSpdLvl  || 0,
            permDashLvl:    Game.permDashLvl    || 0,
            permCritDmgLvl: Game.permCritDmgLvl || 0,
            permSkillDmgLvl:Game.permSkillDmgLvl|| 0,
        };
        const str = btoa(JSON.stringify(data));
        localStorage.setItem('skull_save', str);
        return str;
    }

    function loadGameData() {
        try {
            const raw = localStorage.getItem('skull_save');
            if (!raw) return false;
            const data = JSON.parse(atob(raw));
            Object.assign(Game, data);
            return true;
        } catch(e) { return false; }
    }

    function showSavePanel() {
        const str = saveGameData();
        const panel = document.getElementById('saveLoadPanel');
        const label = document.getElementById('saveLoadLabel');
        const input = document.getElementById('saveDataInput');
        const menu  = document.getElementById('mainMenu');
        label.textContent = '저장 코드 (복사해두세요):';
        input.value = str;
        input.readOnly = true;
        panel.style.display = 'block';
        menu.style.display = 'none';
        input.select();
        document.getElementById('saveLoadConfirm').onclick = () => {
            navigator.clipboard.writeText(str).catch(()=>{});
            panel.style.display = 'none';
            menu.style.display = 'block';
        };
        document.getElementById('saveLoadCancel').onclick = () => {
            panel.style.display = 'none';
            menu.style.display = 'block';
        };
    }

    function showLoadPanel() {
        const panel = document.getElementById('saveLoadPanel');
        const label = document.getElementById('saveLoadLabel');
        const input = document.getElementById('saveDataInput');
        const menu  = document.getElementById('mainMenu');
        label.textContent = '저장 코드를 붙여넣으세요:';
        input.value = '';
        input.readOnly = false;
        panel.style.display = 'block';
        menu.style.display = 'none';
        document.getElementById('saveLoadConfirm').onclick = () => {
            try {
                const data = JSON.parse(atob(input.value.trim()));
                const str = btoa(JSON.stringify(data));
                localStorage.setItem('skull_save', str);
                Object.assign(Game, data);
                alert('불러오기 완료!');
            } catch(e) { alert('잘못된 코드입니다.'); }
            panel.style.display = 'none';
            menu.style.display = 'block';
        };
        document.getElementById('saveLoadCancel').onclick = () => {
            panel.style.display = 'none';
            menu.style.display = 'block';
        };
    }

    // 키 이벤트
    document.addEventListener('keydown', e => {
        const ov = document.getElementById('overlay');
        if (!ov || ov.style.display === 'none') return;
        // 게임 플레이 중이면 메뉴 입력 차단 (win/gameover 상태에서 오작동 방지)
        if (typeof Game !== 'undefined' && Game.gs && Game.gs !== 'menu' && Game.gs !== 'class_select') return;
        const panel = document.getElementById('saveLoadPanel');
        if (panel && panel.style.display !== 'none') return;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            menuIdx = (menuIdx - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
            updateMenu();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            menuIdx = (menuIdx + 1) % MENU_ITEMS.length;
            updateMenu();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            execMenu();
        }
    });

    // 마우스 클릭
    document.addEventListener('click', e => {
        const li = e.target.closest('.menu-item');
        if (!li) return;
        const items = Array.from(getItems());
        menuIdx = items.indexOf(li);
        updateMenu();
        execMenu();
    });

    // DOM 로드 후 초기화
    window.addEventListener('load', () => {
        // scene_main.png 페이드인
        const bg    = document.getElementById('mainBg');
        const title = document.getElementById('mainTitle');
        const menu  = document.getElementById('mainMenu');
        if (bg) { setTimeout(() => { bg.style.opacity = '1'; }, 100); }
        if (title) { setTimeout(() => { title.style.opacity = '1'; }, 600); }
        if (menu)  { setTimeout(() => { menu.style.opacity = '1'; }, 1100); }
        const hint = document.getElementById('menuSpaceHint');
        if (hint) { setTimeout(() => { hint.style.opacity = '1'; }, 1300); }
        // 페이드인 완료 전 입력 차단
        Game._menuReady = false;
        setTimeout(() => { Game._menuReady = true; }, 2500);
        updateMenu();
        // 선택화면 진입 시 자동 BGM
        setTimeout(() => {
            if (typeof unlockAudio === 'function') unlockAudio();
            if (typeof playBGM === 'function') playBGM('lobby');
        }, 1200);

        // localStorage에서 기존 데이터 복구
        try {
            const raw = localStorage.getItem('skull_save');
            if (raw) {
                const data = JSON.parse(atob(raw));
                Object.assign(Game, data);
            }
        } catch(e) {}
    });
})();
