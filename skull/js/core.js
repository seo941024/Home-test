const C = document.getElementById("c");
const ctx = C.getContext("2d");
ctx.imageSmoothingEnabled = false;

const CW = 640, CH = 360, GRAV = 0.55, TILE = 20;

// 스탯 10배 스케일 상향 및 성장 변수
let hitStop = 0; 
let pBaseDmg = 10; // 기본 공격력 상향
let pSkillMax = 600; 
let pRangeBonus = 0; // 사거리 증가 누적

let comboCount = 0;
let comboTimer = 0;

let gs = "menu", score = 0, kills = 0, worldN = 1, levelN = 1, camX = 0, invT = 0, skillCD = 0, camShake = 0;
let player = null, platforms = [], enemies = [], bullets = [], eBullets = [], parts = [], doors = [], lasers = [];
let levelW = 0;

let texts = []; 
let items = [];
let highScore = localStorage.getItem("skull_highscore") || 0;

const K = {};
document.addEventListener("keydown", (e) => {
  K[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
document.addEventListener("keyup", (e) => { K[e.code] = false; });
const dn = (...c) => c.some((x) => K[x]);

// 모바일 멀티터치 제어
function initTouchControls() {
  const bindings = [
    { id: "btnLeft", code: "ArrowLeft" }, { id: "btnRight", code: "ArrowRight" },
    { id: "btnDash", code: "ShiftLeft" }, { id: "btnJump", code: "KeyZ" },
    { id: "btnAtk", code: "KeyX" }, { id: "btnSkill", code: "KeyC" }, { id: "btnGuard", code: "KeyV" }
  ];
  bindings.forEach(bind => {
    const btn = document.getElementById(bind.id);
    if (!btn) return;
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); K[bind.code] = true; }, { passive: false });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); K[bind.code] = false; }, { passive: false });
    btn.addEventListener("touchcancel", (e) => { e.preventDefault(); K[bind.code] = false; }, { passive: false });
  });
}

function overlap(a, b) { return (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y); }

function resolveAABB(obj) {
  obj.x += obj.vx;
  for (const t of platforms) { if (overlap(obj, t)) { if (obj.vx > 0) obj.x = t.x - obj.w; else if (obj.vx < 0) obj.x = t.x + t.w; obj.vx = 0; } }
  obj.y += obj.vy; obj.onGround = false;
  for (const t of platforms) { if (overlap(obj, t)) { if (obj.vy > 0) { obj.y = t.y - obj.h; obj.onGround = true; } else if (obj.vy < 0) obj.y = t.y + t.h; obj.vy = 0; } }
}

function addPart(x, y, col, life) { parts.push({ x, y, col, vx: (Math.random() - 0.5) * 4.5, vy: (Math.random() - 0.5) * 4.5, life, ml: life }); }