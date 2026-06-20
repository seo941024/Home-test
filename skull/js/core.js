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
        1, // 0: 검사 (기본)
        1, // 1: 도적 (기본)
        1, // 2: 마법사 (기본)
        parseInt(localStorage.getItem("skull_unlock_3")) || 0, // 3: 버서커
        parseInt(localStorage.getItem("skull_unlock_4")) || 0, // 4: 발키리
        parseInt(localStorage.getItem("skull_unlock_5")) || 0, // 5: 성기사
        parseInt(localStorage.getItem("skull_unlock_6")) || 0, // 6: 혈귀
        parseInt(localStorage.getItem("skull_unlock_7")) || 0, // 7: 조커
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

// Tab 오버레이 툴팁용 마우스 좌표 추적
Game._mouseX = -1; Game._mouseY = -1;
canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    Game._mouseX = (e.clientX - r.left) * (CW / r.width);
    Game._mouseY = (e.clientY - r.top) * (CH / r.height);
}, { passive: true });
canvas.addEventListener('mouseleave', () => { Game._mouseX = -1; Game._mouseY = -1; }, { passive: true });

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
    // 조커 (7): 나머지 모든 직업(3,4,5,6) 해금 시
    if (!uc[7] && uc[3] && uc[4] && uc[5] && uc[6]) {
        uc[7] = 1; localStorage.setItem("skull_unlock_7", 1); changed = true;
        _showUnlockBanner("조커");
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
    // 혈귀 (6): 한 런에서 1000 이상 피해 받고 클리어
    if (!uc[6] && (Game.runStats && (Game.runStats.totalDmgTaken || 0) >= 1000)) {
        uc[6] = 1; localStorage.setItem("skull_unlock_6", 1);
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

// 콘솔에서 unlock() 명령어로 전체 해금
window.unlock = function() {
    const ids = [3, 4, 5, 6, 7];
    ids.forEach(i => {
        Game.unlockedClasses[i] = 1;
        localStorage.setItem(`skull_unlock_${i}`, 1);
    });
    console.log('모든 직업 해금 완료');
};