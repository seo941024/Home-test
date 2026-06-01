function mkP(x, y) {
  return {
    x, y, w: 14, h: 18, vx: 0, vy: 0, onGround: false,
    hp: 3, maxHp: 3, facing: 1, atkT: 0, atkAnim: 0, fr: 0, frT: 0,
    jpOld: false, kbT: 0, guarding: false, jumpCount: 0,
    combo: 0, comboT: 0, 
    // [신규] 대쉬, 패링, 내려찍기 속성 추가
    dashT: 0, dashCD: 0, parryT: 0, plunging: false
  };
}

function mkEnemy(x, y, w) {
  const rand = Math.random();
  let type = "melee";
  if (w >= 1) {
    if (rand < 0.25) type = "ranged_laser";
    else if (rand < 0.5) type = "ranged_bullet";
  }
  const hp = 2 + w * 2;
  return {
    x, y, w: 12, h: 16, vx: 0, vy: 0, onGround: false, hp, maxHp: hp, type,
    isBoss: false, facing: 1, fr: 0, frT: 0, flash: 0,
    sT: 80 + Math.random() * 60, sI: 60 + Math.random() * 30,
    pDir: Math.random() < 0.5 ? 1 : -1, pT: 0, dead: false, kbT: 0,
    warnT: 0, warnData: null, world: w,
  };
}

function mkBoss(x, y, w) {
  const hp = 50 + w * 30;
  return {
    x, y, w: 28, h: 36, vx: 0, vy: 0, onGround: false, hp, maxHp: hp, type: "boss",
    isBoss: true, facing: 1, fr: 0, frT: 0, flash: 0, sT: 90, sI: 80, phase: 1,
    mT: 80, ap: 0, dead: false, kbT: 0, warnT: 0, warnData: null, world: w,
  };
}

function calcLaser(startX, startY, height, facing) {
  let minHitDist = levelW;
  for (const t of platforms) {
    if (t.y < startY + height && t.y + t.h > startY) {
      if (facing > 0 && t.x > startX) minHitDist = Math.min(minHitDist, t.x - startX);
      else if (facing < 0 && t.x + t.w < startX) minHitDist = Math.min(minHitDist, startX - (t.x + t.w));
    }
  }
  return { x: facing > 0 ? startX : Math.max(0, startX - minHitDist), w: minHitDist };
}

function takeDmg(d, attacker, unblockable = false) {
  if (!player) return;
  // [신규] 대쉬 중 무적 처리
  if (player.dashT > 0) return;
  if (invT > 0) return;

  let dir = player.facing;
  if (attacker) { dir = player.x < attacker.x ? -1 : 1; } 
  else { dir = -player.facing; }

  // [신규] 패링 성공 판정 (가드 올린 직후 12프레임 내 피격)
  if (player.parryT > 0 && !unblockable) {
    camShake = 20;
    hitStop = 15; // 강력한 역경직
    skillCD = 0;  // 스킬 즉시 쿨초기화 쾌감
    player.parryT = 0;
    invT = 40;
    texts.push({ x: player.x, y: player.y - 20, text: "PARRY!", color: "#ffee00", life: 50, size: 24 });
    for (let i = 0; i < 15; i++) addPart(player.x + 7, player.y + 9, "#ffee00", 25);
    
    if (attacker && attacker.hp !== undefined) {
      attacker.vx = -dir * (attacker.isBoss ? 3 : 8); 
      attacker.kbT = 30;
    }
    return;
  }

  if (player.guarding) {
    if (unblockable) {
      player.guarding = false;
      camShake = 10;
    } else {
      for (let i = 0; i < 5; i++) addPart(player.x + 7, player.y + 9, "#80d0ff", 15);
      player.vx = dir * 6.5; player.vy = -3.5; player.kbT = 18; invT = 40;
      texts.push({ x: player.x, y: player.y, text: "GUARD", color: "#80d0ff", life: 30 }); 
      if (attacker && attacker.hp !== undefined) { attacker.vx = -dir * (attacker.isBoss ? 1.5 : 5); attacker.kbT = 15; }
      return;
    }
  }

  player.hp -= d;
  invT = 70;
  player.vx = dir * 4.5; player.vy = -4.5; player.kbT = 15;
  camShake = 15;
  for (let i = 0; i < 10; i++) addPart(player.x + 7, player.y + 9, "#ff2222", 20);
  texts.push({ x: player.x, y: player.y - 10, text: `-${d}`, color: "#ff2222", life: 40 });
  
  if (player.hp <= 0) {
    gs = "dead";
    if (score > highScore) { highScore = score; localStorage.setItem("skull_highscore", highScore); }
    showOv("YOU DIED", "스코어: " + score, "최고 스코어: " + highScore, "▶ RETRY");
  }
  updateHUD();
}

function hitE(e, d, dir) {
  if (e.dead) return;
  e.hp -= d;
  e.flash = 8;
  e.vx = dir * (e.isBoss ? 2 : 5);
  e.vy = -3;
  e.kbT = 12;
  for (let i = 0; i < 4; i++) addPart(e.x + e.w / 2, e.y + e.h / 2, "#ffa040", 12);
  
  texts.push({ 
    x: e.x + e.w / 2 + (Math.random() - 0.5) * 10, y: e.y - 5, 
    text: d.toString(), color: d > pBaseDmg ? "#ffeb3b" : "#ffffff", 
    life: 30, size: d > pBaseDmg ? 20 : 14
  });

  if (e.hp <= 0) e.dead = true;
}

function updateBoss(e) {
  const p = player;
  if (!p) return;
  if (e.hp < e.maxHp * 0.5) e.phase = 2;
  e.vy = Math.min(e.vy + GRAV, 14);

  const dx = p.x + p.w / 2 - (e.x + e.w / 2),
    dy = p.y + p.h / 2 - (e.y + e.h / 2);
  if (!e.warnT) e.facing = dx > 0 ? 1 : -1;
  const spd = e.phase === 1 ? 2.2 : 3.5;

  if (e.kbT > 0) {
    e.kbT--; e.vx *= 0.88;
  } else if (e.warnT > 0) {
    e.warnT--; e.vx *= 0.8;
    if (e.warnT <= 0) {
      const wd = e.warnData; const w = e.world; const originX = wd.facing > 0 ? e.x + e.w : e.x;

      if (w === 1) { 
        if (e.ap === 0) { for (let s = -2; s <= 2; s++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos(wd.ang + s * 0.15) * 7, vy: Math.sin(wd.ang + s * 0.15) * 7, life: 100, r: 4 }); } 
        else if (e.ap === 1) { for (let s = -3; s <= 3; s++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos(wd.ang + s * 0.2) * 5, vy: Math.sin(wd.ang + s * 0.2) * 5, life: 100, r: 4 }); } 
        else { for (let i = 0; i < 16; i++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos((i * Math.PI) / 8) * 6, vy: Math.sin((i * Math.PI) / 8) * 6, life: 120, r: 5 }); }
      } else if (w === 2) { 
        if (e.ap === 0) { for (let i = 0; i < 6; i++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: wd.facing * (3 + i * 1.5), vy: -8, life: 150, r: 5 }); } 
        else if (e.ap === 1) { const lBox = calcLaser(originX, e.y + 18, 16, wd.facing); lasers.push({ x: lBox.x, y: e.y + 18, w: lBox.w, h: 16, life: 18, maxLife: 18, color: "#aa00ff", dmg: 2, unblockable: true }); camShake = 5; } 
        else { const lBox = calcLaser(originX, e.y - 5, 30, wd.facing); lasers.push({ x: lBox.x, y: e.y - 5, w: lBox.w, h: 30, life: 25, maxLife: 25, color: "#ff0044", dmg: 2, unblockable: true }); camShake = 8; }
      } else if (w === 3) { 
        if (e.ap === 0) {
          const lBox = calcLaser(originX, e.y + 18, 10, wd.facing); lasers.push({ x: lBox.x, y: e.y + 18, w: lBox.w, h: 10, life: 15, maxLife: 15, color: "#ff1111", dmg: 2, unblockable: true });
          for (let i = 0; i < 8; i++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos((i * Math.PI) / 4) * 8, vy: Math.sin((i * Math.PI) / 4) * 8, life: 100, r: 4 });
        } else if (e.ap === 1) {
          for (let i = 0; i < 8; i++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos((i * Math.PI) / 4) * 4, vy: Math.sin((i * Math.PI) / 4) * 4, life: 100, r: 5 });
          for (let i = 0; i < 5; i++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: wd.facing * (4 + i * 1.5), vy: -9, life: 120, r: 4 });
        } else {
          const lBox1 = calcLaser(originX, e.y + 5, 12, wd.facing); const lBox2 = calcLaser(originX, e.y + 30, 12, wd.facing);
          lasers.push({ x: lBox1.x, y: e.y + 5, w: lBox1.w, h: 12, life: 20, maxLife: 20, color: "#ff0000", dmg: 2, unblockable: true });
          lasers.push({ x: lBox2.x, y: e.y + 30, w: lBox2.w, h: 12, life: 20, maxLife: 20, color: "#ff0000", dmg: 2, unblockable: true });
          for (let i = 0; i < 16; i++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos((i * Math.PI) / 8) * 5, vy: Math.sin((i * Math.PI) / 8) * 5, life: 120, r: 5 }); camShake = 12;
        }
      } else if (w === 4) { 
        if (e.ap === 0) { for (let s = -1; s <= 1; s++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos(wd.ang + s * 0.1) * 9, vy: Math.sin(wd.ang + s * 0.1) * 9, life: 120, r: 4, unblockable: false }); } 
        else if (e.ap === 1) { const lBox = calcLaser(originX, e.y + 18, 20, wd.facing); lasers.push({ x: lBox.x, y: e.y + 18, w: lBox.w, h: 20, life: 15, maxLife: 15, color: "#ffd700", dmg: 2, unblockable: true }); camShake = 6; } 
        else { for (let i = 0; i < 12; i++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos((i * Math.PI) / 6) * 5, vy: Math.sin((i * Math.PI) / 6) * 5, life: 100, r: 6 }); }
      } else { 
        if (e.ap === 0) { const lBox = calcLaser(originX, e.y + 10, 40, wd.facing); lasers.push({ x: lBox.x, y: e.y + 10, w: lBox.w, h: 40, life: 30, maxLife: 30, color: "#330066", dmg: 3, unblockable: true }); camShake = 15; } 
        else if (e.ap === 1) { for (let i = 0; i < 20; i++) eBullets.push({ x: e.x + 14, y: e.y + 18, vx: Math.cos((i * Math.PI) / 10) * 7, vy: Math.sin((i * Math.PI) / 10) * 7, life: 150, r: 5 }); } 
        else {
          const lBox = calcLaser(originX, e.y + 20, 16, wd.facing); lasers.push({ x: lBox.x, y: e.y + 20, w: lBox.w, h: 16, life: 20, maxLife: 20, color: "#ff00ff", dmg: 2, unblockable: true });
          for (let s = -3; s <= 3; s++) eBullets.push({ x: e.x + 14, y: e.y, vx: Math.cos(wd.ang + s * 0.3) * 6, vy: Math.sin(wd.ang + s * 0.3) * 6, life: 120, r: 4 });
        }
      }
    }
  } else {
    e.mT--;
    if (e.mT <= 0) { e.mT = e.phase === 1 ? 60 : 30; e.vx = e.facing * spd; if (Math.abs(dx) < 200 && e.onGround) e.vy = -10.5; }
    e.vx *= 0.84;
    e.sT--;
    if (e.sT <= 0) { e.sT = e.sI * (e.phase === 1 ? 1 : 0.5); e.ap = Math.floor(Math.random() * (e.phase === 1 ? 2 : 3)); e.warnT = e.phase === 1 ? 35 : 25; e.warnData = { ang: Math.atan2(dy, dx), facing: e.facing, ap: e.ap }; }
  }

  resolveAABB(e);
  e.x = Math.max(0, Math.min(levelW - e.w, e.x));
  if (invT === 0 && overlap(player, { x: e.x, y: e.y, w: e.w, h: e.h })) takeDmg(1, e);
  if (e.y > CH + 60) e.dead = true;
  document.getElementById("bossFill").style.width = (Math.max(0, e.hp) / e.maxHp) * 100 + "%";
}