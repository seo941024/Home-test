function genStage(w, l) {
  platforms = []; enemies = []; bullets = []; eBullets = []; parts = []; doors = []; lasers = []; texts = []; items = [];
  kills = 0; skillCD = 0; invT = 0;
  const isBoss = l === 3;
  levelW = isBoss ? 1400 : 2000;

  for (let x = 0; x < levelW; x += TILE) platforms.push({ x, y: CH - TILE, w: TILE, h: TILE });
  for (let y = 0; y < CH; y += TILE) {
    platforms.push({ x: -TILE, y, w: TILE, h: TILE });
    platforms.push({ x: levelW, y, w: TILE, h: TILE });
  }

  if (!isBoss) {
    const floaters = [];
    for (let i = 0; i < 8 + w * 2 + l; i++) {
      const px = 300 + Math.random() * (levelW - 600);
      const py = CH - TILE - 80 - Math.random() * 100;
      const plat = { x: px, y: py, w: TILE * 3 + Math.floor(Math.random() * TILE * 4), h: TILE, float: true };
      platforms.push(plat);
      floaters.push(plat);
    }
    const pits = [];
    for (let i = 0; i < 3 + w; i++) {
      let gx, gw, safe = false, attempts = 0;
      while (!safe && attempts < 50) {
        attempts++;
        gx = 400 + Math.random() * (levelW - 600);
        gw = TILE * (3 + Math.floor(Math.random() * 2));
        safe = true;
        for (const pit of pits) { if (gx < pit.x + pit.w + 140 && gx + gw > pit.x - 140) { safe = false; break; } }
      }
      if (safe) {
        pits.push({ x: gx, w: gw });
        platforms = platforms.filter((p) => !(p.float == null && p.x >= gx && p.x < gx + gw && p.y === CH - TILE));
      }
    }
    const ec = 5 + w * 3 + l * 2;
    for (let i = 0; i < ec; i++) {
      let ex = 300 + Math.random() * (levelW - 500);
      let ey = CH - TILE - 18;
      if (floaters.length > 0 && Math.random() < 0.4) {
        let f = floaters[Math.floor(Math.random() * floaters.length)];
        ex = f.x + Math.random() * (f.w - 12);
        ey = f.y - 18;
      }
      enemies.push(mkEnemy(ex, ey, w));
    }
  } else {
    platforms.push({ x: 200, y: CH - TILE - 80, w: TILE * 4, h: TILE, float: true });
    platforms.push({ x: 600, y: CH - TILE - 100, w: TILE * 4, h: TILE, float: true });
    platforms.push({ x: 1000, y: CH - TILE - 80, w: TILE * 4, h: TILE, float: true });
    enemies.push(mkBoss(levelW / 2, CH - TILE - 40, w));
    document.getElementById("bossBarWrap").style.display = "block";
    document.getElementById("bossBarLabel").textContent = ["", "고블린 킹 [월드 1]", "스켈레톤 로드 [월드 2]", "데몬 로드 [월드 3]", "타락한 성기사 [월드 4]", "심연의 드래곤 [월드 5]"][Math.min(w, 5)];
  }
  doors.push({ x: levelW - 60, y: CH - TILE - 64, w: 24, h: 64, open: false });
  player = mkP(40, CH - TILE - 20);
  camX = 0;
  updateHUD();
}

function nextStage() {
  levelN++;
  if (levelN > 3) {
    levelN = 1;
    worldN++;
    if (worldN > 5) {
      gs = "win";
      if (score > highScore) { highScore = score; localStorage.setItem("skull_highscore", highScore); }
      showOv("LORD OF SKULLS (CLEAR)", "모든 악몽을 정복했습니다.", "스코어: " + score + " (최고: " + highScore + ")", "▶ PLAY AGAIN");
      return;
    }
    // [신규] 보스 클리어 시 업그레이드 화면으로 이동
    gs = "upgrade";
    return;
  }
  document.getElementById("bossBarWrap").style.display = "none";
  genStage(worldN, levelN);
  updateHUD();
}