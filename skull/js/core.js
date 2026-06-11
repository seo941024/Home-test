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
    transT: 0, transState: 0, bossIntroT: 0,
    pClass: 0,

    // 영구 성장 재화 및 스탯 (localStorage 연동)
    darkQuartz: parseInt(localStorage.getItem("skull_quartz")) || 0,
    permHpLvl: parseInt(localStorage.getItem("skull_permHp")) || 0,
    permAtkLvl: parseInt(localStorage.getItem("skull_permAtk")) || 0,
    permCritLvl: parseInt(localStorage.getItem("skull_permCrit")) || 0,
    permSpdLvl: parseInt(localStorage.getItem("skull_permSpd")) || 0,
    permJmpLvl: parseInt(localStorage.getItem("skull_permJmp")) || 0,
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
};

for (let i = 0; i < 40; i++) Game.enemies.push({ active: false });
for (let i = 0; i < 50; i++) Game.bullets.push({ active: false });
for (let i = 0; i < 250; i++) Game.eBullets.push({ active: false });
for (let i = 0; i < 300; i++) Game.parts.push({ active: false });
for (let i = 0; i < 20; i++) Game.lasers.push({ active: false });
for (let i = 0; i < 30; i++) Game.texts.push({ active: false });
for (let i = 0; i < 40; i++) Game.items.push({ active: false }); 

const K = {};
window.addEventListener("keydown", e => { K[e.code] = true; });
window.addEventListener("keyup", e => { K[e.code] = false; });
function dn(...c) { return c.some(k => K[k]); }

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