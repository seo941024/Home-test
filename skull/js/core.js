const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const CW = canvas.width, CH = canvas.height;
const TILE = 40;
const GRAV = 0.4; 

const Game = {
    gs: "menu",
    score: 0, highScore: parseInt(localStorage.getItem("skull_highscore")) || 0,
    kills: 0, worldN: 1, levelN: 1,
    camX: 0, camShake: 0, hitStop: 0, invT: 0, deadTimer: 120,
    
    isPaused: false, isMuted: false,
    transT: 0, transState: 0, bossIntroT: 0, bossKillSeq: null,
    pClass: 0,
    difficulty: 0, // 0=쉬움 1=보통 2=어려움 3=헬

    // 영구 성장 재화 및 스탯 (localStorage 연동)
    darkQuartz: parseInt(localStorage.getItem("skull_quartz")) || 0,
    permHpLvl: parseInt(localStorage.getItem("skull_permHp")) || 0,
    permAtkLvl: parseInt(localStorage.getItem("skull_permAtk")) || 0,
    permCritLvl: parseInt(localStorage.getItem("skull_permCrit")) || 0,
    permSpdLvl: parseInt(localStorage.getItem("skull_permSpd")) || 0,
    permDefLvl: parseInt(localStorage.getItem("skull_permDef")) || 0,
    permAtkSpdLvl: parseInt(localStorage.getItem("skull_permAtkSpd")) || 0,
    permDashLvl: parseInt(localStorage.getItem("skull_permDash")) || 0,
    permCritDmgLvl: parseInt(localStorage.getItem("skull_permCritDmg")) || 0,
    permMpLvl: parseInt(localStorage.getItem("skull_permMp")) || 0,

    platforms: [], doors: [],
    enemies: [], bullets: [], eBullets: [], parts: [], lasers: [], texts: [], items: [],
    offeredItems: [], obtainedItems: [],
    rerollCoins: 0, pMultiplierItems: 0,
    player: null,
    
    pMaxHp: 50, pBaseDmg: 30, pBaseDmgMul: 1.0, 
    pBaseAtkSpd: 1.0, pAtkSpdMul: 1.0, 
    pRangeBonus: 0, pBaseDef: 0, pShield: 0, 
    pMp: 0, pMaxMp: 100, pParryMp: 3, pParryBonus: 0,
    pSkillDmgMul: 1.0, pSkillWidth: 1.0, pExtraDmg: 0.0,
    pHealOnHit: false, pLifestealChance: 0.05,
    pDashCDMul: 1.0, pMoveSpdMul: 1.0, pJmpMul: 1.0, 
    pCritChance: 0.20, pCritDmg: 1.5,
    pReflectDmg: 0, pLowHpDmg: 1.0, pDashInv: 0,
    pProjSlow: 1.0, pDmgReduction: 1.0,
    pComboDur: 0, pComboDmg: 0,
    pRevive: 0, pDropRate: 0.35, pBloodFestival: false, pFinalDmgMul: 1.0, 
    pRegenFrames: 0, regenT: 0, pHealOnClear: 0,
    pCursedPendant: false, curseT: 0,
    comboCount: 0, comboTimer: 0,
    frameCount: 0,
    eventObjects: [],
    cutscene: null,
    slowMoT: 0,
    skillFlashCol: null,
    skillFlashT: 0,
    // 3단계 시스템
    traps: [],
    bloodDecals: [],

    // 해금 시스템
    unlockedClasses: [
        1, // 검사 (기본)
        1, // 도적 (기본)
        1, // 마법사 (기본)
        parseInt(localStorage.getItem("skull_unlock_3")) || 0,
        parseInt(localStorage.getItem("skull_unlock_4")) || 0,
        parseInt(localStorage.getItem("skull_unlock_5")) || 0,
        parseInt(localStorage.getItem("skull_unlock_6")) || 0,
        parseInt(localStorage.getItem("skull_unlock_7")) || 0,
        parseInt(localStorage.getItem("skull_unlock_8")) || 0,
        parseInt(localStorage.getItem("skull_unlock_9")) || 0,
        parseInt(localStorage.getItem("skull_unlock_10")) || 0,
        parseInt(localStorage.getItem("skull_unlock_11")) || 0,
        parseInt(localStorage.getItem("skull_unlock_12")) || 0,
        parseInt(localStorage.getItem("skull_unlock_13")) || 0,
        parseInt(localStorage.getItem("skull_unlock_14")) || 0,
        parseInt(localStorage.getItem("skull_unlock_15")) || 0,
        parseInt(localStorage.getItem("skull_unlock_16")) || 0,
        parseInt(localStorage.getItem("skull_unlock_17")) || 0,
        parseInt(localStorage.getItem("skull_unlock_18")) || 0,
    ],
    totalSkillUses:  parseInt(localStorage.getItem("skull_skillUses"))  || 0,
    totalEliteKills: parseInt(localStorage.getItem("skull_eliteKills")) || 0,
    totalParryCount: parseInt(localStorage.getItem("skull_parryCount")) || 0,
    totalKills:      parseInt(localStorage.getItem("skull_totalKills")) || 0,
};

for (let i = 0; i < 40; i++) Game.enemies.push({ active: false });
for (let i = 0; i < 50; i++) Game.bullets.push({ active: false });
for (let i = 0; i < 250; i++) Game.eBullets.push({ active: false });
for (let i = 0; i < 300; i++) Game.parts.push({ active: false });
for (let i = 0; i < 20; i++) Game.lasers.push({ active: false });
for (let i = 0; i < 50; i++) Game.texts.push({ active: false });
for (let i = 0; i < 40; i++) Game.items.push({ active: false }); 

const K = {};
window.addEventListener("keydown", e => { K[e.code] = true; if (e.code === "Tab") e.preventDefault(); });
window.addEventListener("keyup", e => { K[e.code] = false; });
function dn(...c) { return c.some(k => K[k]); }

// ==========================================
// 해금 조건 체크
// ==========================================
function _checkUnlocks() {
    const uc = Game.unlockedClasses;
    let changed = false;

    const _permSum =(Game.permHpLvl||0)+(Game.permAtkLvl||0)+(Game.permCritLvl||0)+(Game.permSpdLvl||0)
                   +(Game.permDefLvl||0)+(Game.permAtkSpdLvl||0)+(Game.permDashLvl||0)+(Game.permCritDmgLvl||0)+(Game.permMpLvl||0);
    const _permSum2 = _permSum;

    // 발키리 (4): 누적 처치 20회
    if (!uc[4] && (Game.totalKills || 0) >= 20) {
        uc[4] = 1; localStorage.setItem("skull_unlock_4", 1); changed = true;
        _showUnlockBanner("발키리");
    }
    // 성기사 (5): 패링 10회
    if (!uc[5] && (Game.totalParryCount || 0) >= 10) {
        uc[5] = 1; localStorage.setItem("skull_unlock_5", 1); changed = true;
        _showUnlockBanner("성기사");
    }
    // 소환사 (6): 영구 강화 합산 5
    if (!uc[6] && _permSum >= 5) {
        uc[6] = 1; localStorage.setItem("skull_unlock_6", 1); changed = true;
        _showUnlockBanner("소환사");
    }
    // 강령술사 (7): 누적 처치 30회
    if (!uc[7] && (Game.totalKills || 0) >= 30) {
        uc[7] = 1; localStorage.setItem("skull_unlock_7", 1); changed = true;
        _showUnlockBanner("강령술사");
    }
    // 검성 (9): 패링 20회
    if (!uc[9] && (Game.totalParryCount || 0) >= 20) {
        uc[9] = 1; localStorage.setItem("skull_unlock_9", 1); changed = true;
        _showUnlockBanner("검성");
    }
    // 마창사 (10): 스킬 15회
    if (!uc[10] && (Game.totalSkillUses || 0) >= 15) {
        uc[10] = 1; localStorage.setItem("skull_unlock_10", 1); changed = true;
        _showUnlockBanner("마창사");
    }
    // 귀신병 (11): 엘리트 처치 10회
    if (!uc[11] && (Game.totalEliteKills || 0) >= 10) {
        uc[11] = 1; localStorage.setItem("skull_unlock_11", 1); changed = true;
        _showUnlockBanner("귀신병");
    }
    // 폭탄병 (12): 누적 처치 50회
    if (!uc[12] && (Game.totalKills || 0) >= 50) {
        uc[12] = 1; localStorage.setItem("skull_unlock_12", 1); changed = true;
        _showUnlockBanner("폭탄병");
    }
    // 빙술사 (13): 영구 강화 합산 10
    if (!uc[13] && _permSum2 >= 10) {
        uc[13] = 1; localStorage.setItem("skull_unlock_13", 1); changed = true;
        _showUnlockBanner("빙술사");
    }
    // 무당 (14): 스킬 30회
    if (!uc[14] && (Game.totalSkillUses || 0) >= 30) {
        uc[14] = 1; localStorage.setItem("skull_unlock_14", 1); changed = true;
        _showUnlockBanner("무당");
    }
    // 도박사 (15): 누적 처치 100회 (사기급)
    if (!uc[15] && (Game.totalKills || 0) >= 100) {
        uc[15] = 1; localStorage.setItem("skull_unlock_15", 1); changed = true;
        _showUnlockBanner("도박사");
    }
    // 분신술사 (16): 엘리트 처치 30회
    if (!uc[16] && (Game.totalEliteKills || 0) >= 30) {
        uc[16] = 1; localStorage.setItem("skull_unlock_16", 1); changed = true;
        _showUnlockBanner("분신술사");
    }
    // 연금술사 (17): 영구 강화 합산 15
    if (!uc[17] && _permSum2 >= 15) {
        uc[17] = 1; localStorage.setItem("skull_unlock_17", 1); changed = true;
        _showUnlockBanner("연금술사");
    }
    // 선봉대 (18): 영구 방어 레벨 3
    if (!uc[18] && (Game.permDefLvl || 0) >= 3) {
        uc[18] = 1; localStorage.setItem("skull_unlock_18", 1); changed = true;
        _showUnlockBanner("선봉대");
    }
}

// 도적/버서커는 런 내 스탯 달성 조건 — stage 클리어 시 호출
function _checkRunUnlocks() {
    const uc = Game.unlockedClasses;
    const p = Game.player;
    if (!p) return;
    const movPct  = Math.round((Game.pMoveSpdMul || 1) * 100);
    const jmpPct  = Math.round((Game.pJmpMul    || 1) * 100);
    const atkVal  = Math.floor(Game.pBaseDmg * (Game.pBaseDmgMul || 1) * (Game.pFinalDmgMul || 1));
    const asVal   = Math.round((Game.pBaseAtkSpd || 1) * (Game.pAtkSpdMul || 1) * 100);

    // 도적 (1): 이동속도 130% AND 점프력 110%
    if (!uc[1] && movPct >= 130 && jmpPct >= 110) {
        uc[1] = 1; localStorage.setItem("skull_unlock_1", 1);
        _showUnlockBanner("도적");
    }
    // 버서커 (3): 공격력 100 이상
    if (!uc[3] && atkVal >= 100) {
        uc[3] = 1; localStorage.setItem("skull_unlock_3", 1);
        _showUnlockBanner("버서커");
    }
    // 혈귀 (8): 한 런에서 1000 이상 피해 받고 클리어
    if (!uc[8] && (Game.runStats && (Game.runStats.totalDmgTaken || 0) >= 1000)) {
        uc[8] = 1; localStorage.setItem("skull_unlock_8", 1);
        _showUnlockBanner("혈귀");
    }
}

function _showUnlockBanner(className) {
    Game._unlockBanner = { name: className, t: 240 };
    if (typeof playSfx === 'function') playSfx('unlock');
}

// ==========================================
// 유틸리티 - 월드 그룹 계산 (한 곳에서 관리)
// ==========================================

// worldN → 테마 그룹(wg) 변환. render/audio/stage 등에서 공통 사용.
function getWg() {
    const w = Game.worldN;
    if (w >= 3 && w <= 4) return 2;
    if (w >= 5 && w <= 6) return 3;
    if (w >= 7 && w <= 8) return 4;
    if (w === 9) return 5;
    if (w === 10) return 6;
    return 1;
}