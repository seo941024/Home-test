function update() {
  if (hitStop > 0) { hitStop--; if (camShake > 0) camShake--; return; }
  if (gs !== "play" || !player) return;
  const p = player; p.frT++; if (p.frT > 7) { p.fr = (p.fr + 1) % 4; p.frT = 0; }
  if (camShake > 0) camShake--;
  if (comboTimer > 0) { comboTimer--; if (comboTimer <= 0) comboCount = 0; }

  const guardNow = dn("KeyV");
  if (guardNow && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && p.atkT === 0) { p.parryT = 12; }
  if (p.parryT > 0) p.parryT--; p.guarding = guardNow;

  if (dn("ShiftLeft", "ShiftRight") && p.dashCD <= 0 && !p.guarding && p.kbT <= 0 && p.atkT === 0) {
    p.dashT = 15; p.dashCD = 75; p.vy = 0; p.plunging = false;
  }
  
  if (p.dashT > 0) {
    p.dashT--; p.vx = p.facing * 8; p.vy = 0; addPart(p.x + 7, p.y + 9, "#ffffff", 10); 
  } else if (p.kbT > 0) {
    p.kbT--; p.vx *= 0.9;
  } else {
    let mx = 0; if (!p.guarding && !p.plunging) { if (dn("ArrowLeft", "KeyA")) mx = -1; if (dn("ArrowRight", "KeyD")) mx = 1; }
    if (mx !== 0) p.facing = mx; p.vx = mx * 2.8;
  }
  if (p.dashCD > 0) p.dashCD--;

  if (p.onGround) p.jumpCount = 0;
  const jpNow = dn("KeyZ", "ArrowUp", "Space");
  if (jpNow && !p.jpOld && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging && p.atkT === 0) {
    if (p.onGround) { p.vy = -9.6; p.jumpCount = 1; for (let i = 0; i < 4; i++) addPart(p.x + 7, p.y + 18, "#6060ff", 12); } 
    else if (p.jumpCount < 2) { p.vy = -8.8; p.jumpCount = 2; for (let i = 0; i < 6; i++) addPart(p.x + 7, p.y + 18, "#ff60ff", 15); }
  }
  p.jpOld = jpNow;

  if (!p.onGround && dn("ArrowDown") && dn("KeyX") && !p.plunging && p.atkT === 0 && p.dashT <= 0) { p.plunging = true; p.vy = 16; p.vx = 0; }
  if (p.plunging) { p.vy = 16; p.vx = 0; addPart(p.x + 7, p.y + 9, "#ffaa00", 5); } 
  else if (p.dashT <= 0) { p.vy = Math.min(p.vy + GRAV, 14); }

  resolveAABB(p);
  
  if (p.plunging && p.onGround) {
    p.plunging = false; p.atkT = 20; camShake = 15; hitStop = 8; 
    for (let i = 0; i < 20; i++) addPart(p.x + 7, p.y + 18, "#ffffff", 20);
    bullets.push({ x: p.x - 10, y: p.y + 5, vx: -10, vy: 0, life: 15, r: 12, sk: false, dmg: Math.floor(pBaseDmg * 2.5) });
    bullets.push({ x: p.x + 10, y: p.y + 5, vx: 10, vy: 0, life: 15, r: 12, sk: false, dmg: Math.floor(pBaseDmg * 2.5) });
  }

  p.x = Math.max(0, Math.min(levelW - p.w, p.x));
  if (p.y > CH + 60) { p.guarding = false; p.plunging = false; takeDmg(1, null, true); if (player) { p.x = 80; p.y = CH - TILE - 22; p.vx = 0; p.vy = 0; } }

  if (!player) return;
  if (p.atkT > 0) p.atkT--; if (p.atkAnim > 0) p.atkAnim--; if (invT > 0) invT--; if (skillCD > 0) skillCD--;
  if (p.comboT > 0) { p.comboT--; if (p.comboT <= 0) p.combo = 0; }

  // [확인 완료] 평타 공격 + 랜덤 계산 + 크리티컬 
  if (dn("KeyX") && !dn("ArrowDown") && p.atkT === 0 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging) {
    p.combo = (p.combo % 3) + 1; const isLastHit = p.combo === 3;
    p.atkT = isLastHit ? 35 : 16; p.atkAnim = isLastHit ? 20 : 12; p.comboT = 50;
    if (!p.onGround) p.vy = Math.min(p.vy, 1);

    const rangeX = (isLastHit ? 52 : 36) + pRangeBonus; 
    const rangeY = isLastHit ? 45 : 35; 
    const cx = p.x + 7 + p.facing * (rangeX / 2 + 5); const cy = p.y + 9;

    // 랜덤 분산도 (80% ~ 120%) 및 크리티컬
    let variance = 0.8 + Math.random() * 0.4;
    let dmg = Math.floor((isLastHit ? pBaseDmg * 2.2 : pBaseDmg) * variance);
    let isCrit = false;

    if (Math.random() < 0.20) {
      dmg = Math.floor(dmg * 1.5);
      isCrit = true;
    }
    if (dmg < 1) dmg = 1;

    let hitTarget = false;
    enemies.forEach((e) => {
      if (!e.dead && Math.abs(e.x + e.w / 2 - cx) < rangeX / 2 + e.w / 2 && Math.abs(e.y + e.h / 2 - cy) < rangeY / 2 + e.h / 2) {
        hitE(e, dmg, p.facing, isCrit); hitTarget = true;
      }
    });

    if (isLastHit) camShake = 8; if (hitTarget && isLastHit) hitStop = 6; 
    for (let i = 0; i < (isLastHit ? 15 : 6); i++) { addPart(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20, isLastHit ? "#ff2222" : "#ffffff", 15); }
  }

  if (dn("KeyC") && skillCD === 0 && !p.guarding && p.kbT <= 0 && p.dashT <= 0 && !p.plunging) {
    skillCD = pSkillMax; camShake = 25;
    for (let i = -2; i <= 2; i++) { bullets.push({ x: p.x + 7, y: p.y + 9, vx: p.facing * 14, vy: i * 2, life: 35, r: 5, sk: true, dmg: Math.floor(pBaseDmg * 2.5) }); }
    bullets.push({ x: p.x + 7, y: p.y + 9, vx: p.facing * 18, vy: 0, life: 40, r: 15, sk: true, dmg: pBaseDmg * 8 });
    for (let i = 0; i < 15; i++) addPart(p.x + 7, p.y + 9, "#80d0ff", 25);
  }

  bullets.forEach((b) => { b.x += b.vx; b.y += b.vy; b.vy += b.sk ? 0.05 : 0; b.life--; }); bullets = bullets.filter((b) => b.life > 0);
  bullets.forEach((b) => {
    for (const t of platforms) { if (overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.life = 0; return; } }
    enemies.forEach((e) => {
      if (!e.dead && Math.abs(e.x + e.w / 2 - b.x) < e.w / 2 + b.r && Math.abs(e.y + e.h / 2 - b.y) < e.h / 2 + b.r) { 
        hitE(e, b.dmg || pBaseDmg, b.vx > 0 ? 1 : -1, false); if (b.sk) hitStop = 3; b.life = 0; 
      }
    });
  });

  eBullets.forEach((b) => { b.x += b.vx; b.y += b.vy; b.vy += 0.12; b.life--; }); eBullets = eBullets.filter((b) => b.life > 0 && b.y < CH + 30);
  eBullets.forEach((b) => {
    for (const t of platforms) { if (overlap({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, t)) { b.life = 0; return; } }
    if (invT === 0 && Math.abs(p.x + 7 - b.x) < 11 && Math.abs(p.y + 9 - b.y) < 12) { takeDmg(1, b, b.unblockable); b.life = 0; }
  });

  lasers.forEach((l) => {
    if (l.life > l.maxLife - 5) { if (invT === 0 && p.x + p.w > l.x && p.x < l.x + l.w && p.y + p.h > l.y && p.y < l.y + l.h) takeDmg(1, null, l.unblockable); } 
    l.life--;
  });
  lasers = lasers.filter((l) => l.life > 0);

  texts.forEach(t => { t.y -= 0.8; t.life--; }); texts = texts.filter(t => t.life > 0);

  // [확인 완료] 신규 아이템 적용 (체력 / 공격력 / 사거리)
  items.forEach(i => {
    i.vy = Math.min(i.vy + GRAV, 8);  i.y += i.vy; let groundFound = false;
    platforms.forEach(t => { if (overlap({x: i.x, y: i.y, w: i.w, h: i.h}, t) && i.vy > 0) { i.y = t.y - i.h; i.vy = 0; groundFound = true; } });
    if(groundFound) i.life--;
    if (overlap(player, {x: i.x, y: i.y, w: i.w, h: i.h})) {
      if (i.type === "hp") {
        if (player.hp < player.maxHp) { player.hp++; texts.push({ x: player.x, y: player.y - 10, text: "+1 HP", color: "#27ae60", life: 40, size: 14 }); } 
        else { score += 100; texts.push({ x: player.x, y: player.y - 10, text: "+100 SCORE", color: "#aaaaff", life: 40, size: 14 }); }
      } else if (i.type === "atk_drop") { 
        pBaseDmg += 5; texts.push({ x: player.x, y: player.y - 10, text: "ATK UP!", color: "#ff6200", life: 50, size: 16 });
      } else if (i.type === "range_drop") { 
        pRangeBonus += 6; texts.push({ x: player.x, y: player.y - 10, text: "RANGE UP!", color: "#00ccff", life: 50, size: 16 });
      }
      i.life = 0; updateHUD();
    }
  });
  items = items.filter(i => i.life > 0);

  enemies.forEach((e) => {
    if (e.dead) return;
    e.frT++; if (e.frT > 10) { e.fr = (e.fr + 1) % 2; e.frT = 0; }
    if (e.flash > 0) e.flash--; if (e.isBoss) { updateBoss(e); return; }
    e.vy = Math.min(e.vy + GRAV, 14);

    if (e.kbT > 0) { e.kbT--; e.vx *= 0.88; } 
    else if ((e.type === "ranged_bullet" || e.type === "ranged_laser") && e.warnT > 0) {
      e.warnT--; e.vx *= 0.8;
      if (e.warnT <= 0) {
        const ang = e.warnData.ang;
        if (e.type === "ranged_bullet") { for (let s = -1; s <= 1; s++) eBullets.push({ x: e.x + 6, y: e.y + 8, vx: Math.cos(ang + s * 0.15) * 7, vy: Math.sin(ang + s * 0.15) * 7, life: 80, r: 4 }); } 
        else { const originX = e.facing > 0 ? e.x + e.w : e.x; const lBox = calcLaser(originX, e.y + 6, 6, e.facing); lasers.push({ x: lBox.x, y: e.y + 6, w: lBox.w, h: 6, life: 12, maxLife: 12, color: "#ff3300", dmg: 1, unblockable: false }); }
      }
    } else {
      const dx = p.x + 7 - (e.x + e.w / 2), dy = p.y + 9 - (e.y + e.h / 2); const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 220) {
        e.facing = dx > 0 ? 1 : -1;
        if (e.type === "melee") { e.vx += (dx > 0 ? 1 : -1) * 0.2; e.vx = Math.max(-2.8, Math.min(2.8, e.vx)); } 
        else {
          if (dist < 110) e.vx += (dx > 0 ? -1 : 1) * 0.15; else e.vx *= 0.9;
          e.vx = Math.max(-2.0, Math.min(2.0, e.vx)); e.sT--;
          if (e.sT <= 0) { e.sT = e.sI; e.warnT = e.type === "ranged_laser" ? 40 : 25; e.warnData = { ang: Math.atan2(dy, dx), facing: e.facing }; }
        }
      } else { e.pT--; if (e.pT <= 0) { e.pT = 60 + Math.random() * 60; e.pDir *= -1; } e.vx = e.pDir * 1.2; }
    }
    if (!e.isBoss && e.onGround && e.kbT <= 0) {
      let cx = e.vx > 0 ? e.x + e.w + e.vx + 2 : e.x + e.vx - 2; let cy = e.y + e.h + 4; let safe = false;
      for (const t of platforms) { if (cx >= t.x && cx <= t.x + t.w && cy >= t.y && cy <= t.y + t.h) { safe = true; break; } }
      if (!safe) { e.vx = 0; e.pDir *= -1; }
    }
    resolveAABB(e); if (e.vx === 0 && e.kbT <= 0) e.pDir *= -1;
    e.x = Math.max(0, Math.min(levelW - e.w, e.x));
    if (invT === 0 && overlap(p, { x: e.x, y: e.y, w: e.w, h: e.h })) takeDmg(1, e);
    if (e.y > CH + 60) e.dead = true;
  });

  enemies = enemies.filter((e) => {
    if (e.dead) {
      score += e.isBoss ? 500 : 50; kills++;
      // [확인 완료] 처치 시 3종 아이템 랜덤 사이클 적용
      if (Math.random() < 0.28 || e.isBoss) {
        let randType = "hp"; let roll = Math.random();
        if (e.isBoss) { randType = Math.random() < 0.5 ? "atk_drop" : "range_drop"; } 
        else { if (roll < 0.50) randType = "hp"; else if (roll < 0.75) randType = "atk_drop"; else randType = "range_drop"; }
        items.push({ x: e.x + e.w/2 - 5, y: e.y, w: 10, h: 10, vy: -4, life: 600, type: randType });
      }
      for (let i = 0; i < 8; i++) addPart(e.x + e.w / 2, e.y + e.h / 2, e.isBoss ? "#ff40a0" : "#ff8040", 25);
      return false;
    }
    return true;
  });

  parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vx *= 0.87; p.vy *= 0.87; p.life--; }); parts = parts.filter((p) => p.life > 0);
  const allDead = enemies.length === 0;
  doors.forEach((d) => { d.open = allDead; if (d.open && player && overlap(player, { x: d.x, y: d.y, w: d.w, h: d.h })) nextStage(); });

  if (!player) return;
  camX += (p.x - CW / 3 - camX) * 0.1; camX = Math.max(0, Math.min(levelW - CW, camX));
  updateHUD();
}

function render() {
  ctx.fillStyle = "#050508"; ctx.fillRect(0, 0, CW, CH);
  ctx.save(); if (camShake > 0) ctx.translate((Math.random() - 0.5) * camShake, (Math.random() - 0.5) * camShake);

  ctx.fillStyle = "#0d0d14";
  for (let i = 0; i < 18; i++) {
    const bx = ((i * 173) % levelW) * 0.3 - camX * 0.3; const mod = bx % CW;
    if (mod > -20 && mod < CW + 20) ctx.fillRect(mod, 20 + ((i * 61) % 100), 4, 30 + ((i * 7) % 60));
  }

  items.forEach(i => {
    const ix = i.x - camX; if (ix < -10 || ix > CW) return;
    if (i.life < 100 && Math.floor(i.life / 5) % 2 === 0) return;
    if (i.type === "hp") ctx.fillStyle = "#ff1111"; 
    else if (i.type === "atk_drop") ctx.fillStyle = "#ff6200"; 
    else ctx.fillStyle = "#00ccff"; 
    ctx.fillRect(ix, i.y, 10, 10);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(ix + 3, i.y + 2, 4, 4);
    ctx.strokeStyle = "#000000"; ctx.strokeRect(ix, i.y, 10, 10);
  });

  platforms.forEach((t) => {
    const tx = t.x - camX, ty = t.y; if (tx > CW + TILE || tx < -TILE) return;
    if (t.float) { ctx.fillStyle = "#1a1a25"; ctx.fillRect(tx, ty, t.w, t.h); ctx.fillStyle = "#333344"; ctx.fillRect(tx, ty, t.w, 4); } 
    else { ctx.fillStyle = "#110d0d"; ctx.fillRect(tx, ty, t.w, t.h); ctx.fillStyle = "#2a1a1a"; ctx.fillRect(tx, ty, t.w, 4); ctx.fillStyle = "#0a0505"; ctx.fillRect(tx, ty + 4, t.w, t.h - 4); ctx.fillStyle = "#150a0a"; for (let i = 0; i < t.w; i += TILE) ctx.fillRect(tx + i, ty, 1, t.h); }
  });

  doors.forEach((d) => {
    const dx = d.x - camX;
    ctx.fillStyle = d.open ? "#00220a" : "#110000"; ctx.fillRect(dx, d.y, d.w, d.h);
    ctx.fillStyle = d.open ? "#00aa44" : "#551111"; ctx.fillRect(dx + 4, d.y + 4, d.w - 8, d.h - 8);
    if (d.open) { ctx.fillStyle = "#44ff88"; ctx.fillRect(dx + 8, d.y + 8, d.w - 16, d.h - 16); }
    ctx.fillStyle = d.open ? "#ffffff" : "#ff5555"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText(d.open ? "ENTER" : "SEALED", dx + d.w / 2, d.y + d.h / 2 + 3); ctx.textAlign = "left";
  });

  eBullets.forEach((b) => {
    const bx = b.x - camX; if (bx < -10 || bx > CW + 10) return;
    if (b.unblockable) { ctx.fillStyle = "#9900ff"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 1.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ff0000"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.7, 0, Math.PI * 2); ctx.fill(); } 
    else { ctx.fillStyle = "#ff2222"; ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffaaaa"; ctx.beginPath(); ctx.arc(bx, b.y, b.r * 0.5, 0, Math.PI * 2); ctx.fill(); }
  });

  bullets.forEach((b) => { const bx = b.x - camX; if (bx < -10 || bx > CW + 10) return; ctx.fillStyle = b.sk ? "#44ddff" : "#ffcc22"; ctx.beginPath(); ctx.arc(bx, b.y, b.r, 0, Math.PI * 2); ctx.fill(); });
  lasers.forEach((l) => { const lx = l.x - camX; if (lx + l.w < 0 || lx > CW) return; ctx.save(); ctx.globalAlpha = l.life / l.maxLife; ctx.fillStyle = l.color; ctx.fillRect(lx, l.y, l.w, l.h); ctx.fillStyle = "#ffffff"; ctx.fillRect(lx, l.y + l.h * 0.3, l.w, l.h * 0.4); ctx.restore(); });
  parts.forEach((pt) => { const px = pt.x - camX; if (px < -10 || px > CW + 10) return; ctx.globalAlpha = pt.life / pt.ml; ctx.fillStyle = pt.col; ctx.fillRect(px - 2, pt.y - 2, 4, 4); ctx.globalAlpha = 1; });

  enemies.forEach((e) => {
    const ex = e.x - camX; if (ex < -50 || ex > CW + 50) return;
    ctx.save(); ctx.translate(Math.round(ex + e.w / 2), Math.round(e.y + e.h / 2));

    if (e.warnT > 0) {
      ctx.save();
      if (e.isBoss) {
        const maxW = e.phase === 1 ? 35 : 25; ctx.globalAlpha = 0.2 + (1 - e.warnT / maxW) * 0.5; ctx.fillStyle = "#ff0033"; const wd = e.warnData;
        if (e.world === 1) {
          if (wd.ap === 0) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 450, wd.ang - 0.3, wd.ang + 0.3); ctx.fill(); }
          else if (wd.ap === 1) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 450, wd.ang - 0.5, wd.ang + 0.5); ctx.fill(); }
          else { ctx.beginPath(); ctx.arc(0, 0, 500, 0, Math.PI * 2); ctx.fill(); }
        } else if (e.world === 2) {
          if (wd.ap === 0) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 400, wd.facing > 0 ? -Math.PI * 0.8 : -Math.PI, wd.facing > 0 ? 0 : -Math.PI * 0.2); ctx.fill(); }
          else if (wd.ap === 1) { ctx.fillStyle = "#9900ff"; ctx.fillRect(wd.facing > 0 ? 0 : -800, -28, 800, 16); ctx.fillRect(wd.facing > 0 ? 0 : -800, 4, 800, 16); }
          else { ctx.fillStyle = "#ff0033"; ctx.fillRect(wd.facing > 0 ? 0 : -800, -23, 800, 35); }
        } else if (e.world === 3) {
          if (wd.ap === 0) { ctx.fillStyle = "#ff0000"; ctx.fillRect(-800, 0, 1600, 10); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 500, wd.ang - 0.2, wd.ang + 0.2); ctx.fill(); }
          else if (wd.ap === 1) { ctx.beginPath(); ctx.arc(0, 0, 400, 0, Math.PI * 2); ctx.fill(); }
          else { ctx.fillRect(-800, -28, 1600, 12); ctx.fillRect(-800, 17, 1600, 12); ctx.beginPath(); ctx.arc(0, 0, 500, 0, Math.PI * 2); ctx.fill(); }
        } else if (e.world === 4) {
          ctx.fillStyle = "#ffd700";
          if (wd.ap === 0) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 400, wd.ang - 0.4, wd.ang + 0.4); ctx.fill(); }
          else if (wd.ap === 1) { ctx.fillRect(wd.facing > 0 ? 0 : -800, -10, 800, 20); }
          else { ctx.beginPath(); ctx.arc(0, 0, 400, 0, Math.PI * 2); ctx.fill(); }
        } else {
          ctx.fillStyle = "#330066";
          if (wd.ap === 0) { ctx.fillRect(wd.facing > 0 ? 0 : -800, -20, 800, 40); }
          else if (wd.ap === 1) { ctx.beginPath(); ctx.arc(0, 0, 600, 0, Math.PI * 2); ctx.fill(); }
          else { ctx.fillRect(wd.facing > 0 ? 0 : -800, -10, 800, 16); ctx.beginPath(); ctx.arc(0, 0, 400, wd.ang - 0.5, wd.ang + 0.5); ctx.fill(); }
        }
      } else {
        if (e.type === "ranged_bullet") { ctx.globalAlpha = 0.2 + (1 - e.warnT / 25) * 0.4; ctx.fillStyle = "#ffaa00"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 350, e.warnData.ang - 0.3, e.warnData.ang + 0.3); ctx.fill(); }
        else if (e.type === "ranged_laser") { ctx.globalAlpha = 0.5 + (1 - e.warnT / 40) * 0.5; ctx.fillStyle = "#ff2222"; ctx.fillRect(e.warnData.facing > 0 ? 0 : -800, -2, 800, 4); }
      }
      ctx.restore();
    }

    ctx.scale(e.facing, 1); if (e.flash > 0 && e.flash % 2 === 0) ctx.globalAlpha = 0.4;
    const eBob = e.onGround && e.vx !== 0 ? (e.fr === 0 ? -1 : 0) : 0;
    const legL = e.fr === 0 ? 0 : -2; const legR = e.fr === 0 ? -2 : 0;

    // [확인 완료] 몬스터 세부 도트 디자인 (무기/투구/갑옷 분리)
    if (e.isBoss) {
      ctx.scale(1.4, 1.4);
      if (e.world === 1) { ctx.fillStyle = "#1a552a"; ctx.fillRect(-12, -12 + eBob, 24, 22); ctx.fillStyle = "#2e8b57"; ctx.fillRect(-8, -20 + eBob, 16, 14); ctx.fillStyle = "#eeaa00"; ctx.fillRect(-8, -24 + eBob, 16, 4); ctx.fillRect(-8, -26 + eBob, 3, 2); ctx.fillRect(-2, -26 + eBob, 3, 2); ctx.fillRect(5, -26 + eBob, 3, 2); ctx.fillStyle = e.phase === 2 ? "#ff2222" : "#000"; ctx.fillRect(-4, -16 + eBob, 3, 3); ctx.fillRect(4, -16 + eBob, 3, 3); ctx.fillStyle = "#8b4513"; ctx.fillRect(10, -5 + eBob, 6, 15); } 
      else if (e.world === 2) { ctx.fillStyle = "#e0e0e0"; ctx.fillRect(-10, -22 + eBob, 20, 16); ctx.fillStyle = e.phase === 2 ? "#ff0033" : "#aa00ff"; ctx.fillRect(-6, -16 + eBob, 4, 4); ctx.fillRect(4, -16 + eBob, 4, 4); ctx.fillStyle = "#ccc"; ctx.fillRect(-8, -4 + eBob, 16, 14); ctx.fillStyle = "#111"; ctx.fillRect(-6, -2 + eBob, 12, 2); ctx.fillRect(-6, 2 + eBob, 12, 2); ctx.fillRect(-6, 6 + eBob, 12, 2); ctx.fillStyle = "#fff"; ctx.fillRect(-4, -6 + eBob, 8, 2); } 
      else if (e.world === 3) { ctx.fillStyle = "#050505"; ctx.fillRect(-12, -20 + eBob, 4, 12); ctx.fillRect(8, -20 + eBob, 4, 12); ctx.fillStyle = "#8b0000"; ctx.fillRect(-8, -16 + eBob, 16, 14); ctx.fillStyle = "#1a0000"; ctx.fillRect(-12, -2 + eBob, 24, 16); ctx.fillStyle = e.phase === 2 ? "#ff0000" : "#ffea00"; ctx.fillRect(-4, -10 + eBob, 3, 3); ctx.fillRect(3, -10 + eBob, 3, 3); ctx.fillStyle = "#ff4500"; ctx.fillRect(-4, 4 + eBob, 8, 8); ctx.fillStyle = "#111"; ctx.fillRect(-18, -10 + eBob, 6, 16); ctx.fillRect(12, -10 + eBob, 6, 16); } 
      else if (e.world === 4) { ctx.fillStyle = "#ffffff"; ctx.fillRect(-10, -22 + eBob, 20, 18); ctx.fillStyle = "#ffd700"; ctx.fillRect(-4, -18 + eBob, 8, 8); ctx.fillStyle = "#0055ff"; ctx.fillRect(-8, -4 + eBob, 16, 14); ctx.fillStyle = e.phase === 2 ? "#ff2222" : "#00bbff"; ctx.fillRect(-2, -16 + eBob, 4, 4); ctx.fillStyle = "#ffd700"; ctx.fillRect(8, -12 + eBob, 4, 20); ctx.fillStyle = "#fff"; ctx.fillRect(7, -2 + eBob, 6, 2); } 
      else { ctx.fillStyle = "#111111"; ctx.fillRect(-14, -24 + eBob, 28, 20); ctx.fillStyle = "#330066"; ctx.fillRect(-10, -20 + eBob, 20, 16); ctx.fillStyle = e.phase === 2 ? "#ff0000" : "#ff00ff"; ctx.fillRect(-6, -16 + eBob, 4, 4); ctx.fillRect(6, -16 + eBob, 4, 4); ctx.fillStyle = "#222"; ctx.fillRect(-22, -20 + eBob, 8, 14); ctx.fillRect(14, -20 + eBob, 8, 14); ctx.fillStyle = "#440088"; ctx.fillRect(-12, -4 + eBob, 24, 14); }
    } else if (e.type === "melee") {
      if (e.world === 1) { ctx.fillStyle = "#3cb371"; ctx.fillRect(-4, -8 + eBob, 8, 6); ctx.fillStyle = "#795548"; ctx.fillRect(-5, -9 + eBob, 10, 2); ctx.fillStyle = "#708090"; ctx.fillRect(-3, -2 + eBob, 6, 6); ctx.fillStyle = "#ffeb3b"; ctx.fillRect(2, -6 + eBob, 1, 1); ctx.fillStyle = "#3cb371"; ctx.fillRect(-3, 4, 2, 4 + legL); ctx.fillRect(2, 4, 2, 4 + legR); ctx.fillStyle = "#b0bec5"; ctx.fillRect(4, -5 + eBob, 3, 4); ctx.fillStyle = "#5d4037"; ctx.fillRect(5, -1 + eBob, 1, 7); } 
      else if (e.world === 2) { ctx.fillStyle = "#eceff1"; ctx.fillRect(-4, -8 + eBob, 8, 6); ctx.fillStyle = "#263238"; ctx.fillRect(-2, -6 + eBob, 4, 2); ctx.fillStyle = "#546e7a"; ctx.fillRect(-3, -2 + eBob, 6, 6); ctx.fillStyle = "#b0bec5"; ctx.fillRect(-3, 4, 1, 4 + legL); ctx.fillRect(2, 4, 1, 4 + legR); ctx.fillStyle = "#cfd8dc"; ctx.fillRect(4, -2 + eBob, 3, 6); } 
      else if (e.world === 3) { ctx.fillStyle = "#ff3d00"; ctx.fillRect(-5, -8 + eBob, 10, 6); ctx.fillStyle = "#212121"; ctx.fillRect(-3, -11 + eBob, 2, 3); ctx.fillRect(1, -11 + eBob, 2, 3); ctx.fillStyle = "#37474f"; ctx.fillRect(-5, -2 + eBob, 10, 6); ctx.fillStyle = "#ff9100"; ctx.fillRect(-4, 4, 2, 4 + legL); ctx.fillRect(2, 4, 2, 4 + legR); } 
      else if (e.world === 4) { ctx.fillStyle = "#cfd8dc"; ctx.fillRect(-5, -9 + eBob, 10, 7); ctx.fillStyle = "#ffd700"; ctx.fillRect(-1, -7 + eBob, 3, 3); ctx.fillStyle = "#b0bec5"; ctx.fillRect(-4, -2 + eBob, 8, 7); ctx.fillStyle = "#ffd700"; ctx.fillRect(-3, 0 + eBob, 6, 2); ctx.fillStyle = "#eceff1"; ctx.fillRect(-3, 5, 2, 3 + legL); ctx.fillRect(1, 5, 2, 3 + legR); ctx.fillStyle = "#ffd700"; ctx.fillRect(4, -4 + eBob, 2, 9); ctx.fillStyle = "#78909c"; ctx.fillRect(3, -7 + eBob, 4, 3); } 
      else { ctx.fillStyle = "#1a0033"; ctx.fillRect(-5, -8 + eBob, 10, 6); ctx.fillStyle = "#00ffcc"; ctx.fillRect(-2, -6 + eBob, 4, 1); ctx.fillStyle = "#2a004d"; ctx.fillRect(-4, -2 + eBob, 8, 7); ctx.fillStyle = "#1a0033"; ctx.fillRect(-2, 5, 1, 3 + legL); ctx.fillRect(1, 5, 1, 3 + legR); ctx.fillStyle = "#00ffcc"; ctx.fillRect(4, -6 + eBob, 2, 12); ctx.fillStyle = "#330066"; ctx.fillRect(3, -2 + eBob, 4, 2); }
    } else {
      if (e.world === 1) { ctx.fillStyle = "#2e8b57"; ctx.fillRect(-4, -8 + eBob, 8, 6); ctx.fillStyle = "#4e342e"; ctx.fillRect(-5, -9 + eBob, 10, 3); ctx.fillStyle = "#556b2f"; ctx.fillRect(-3, -2 + eBob, 6, 6); ctx.fillStyle = "#2e8b57"; ctx.fillRect(-3, 4, 2, 4 + legL); ctx.fillRect(2, 4, 2, 4 + legR); ctx.fillStyle = "#a1887f"; ctx.fillRect(4, -6 + eBob, 1, 10); ctx.fillStyle = "#ffffff"; ctx.fillRect(5, -3 + eBob, 2, 1); } 
      else if (e.world === 2) { ctx.fillStyle = "#4a148c"; ctx.fillRect(-5, -9 + eBob, 10, 13); ctx.fillStyle = "#e0e0e0"; ctx.fillRect(-3, -5 + eBob, 6, 4); ctx.fillStyle = "#00e5ff"; ctx.fillRect(-2, -4 + eBob, 4, 1); ctx.fillStyle = "#4e342e"; ctx.fillRect(5, -4 + eBob, 1, 12); ctx.fillStyle = "#ff1744"; ctx.fillRect(4, -6 + eBob, 3, 2); } 
      else if (e.world === 3) { ctx.fillStyle = "#d81b60"; ctx.fillRect(-5, -7 + eBob, 10, 6); ctx.fillStyle = "#212121"; ctx.fillRect(-4, -8 + eBob, 8, 1); ctx.fillStyle = "#3e2723"; ctx.fillRect(-4, -1 + eBob, 8, 7); ctx.fillStyle = "#ff3d00"; ctx.fillRect(4, -2 + eBob, 3, 3); ctx.fillStyle = "#212121"; ctx.fillRect(-9, -4 + eBob, 4, 4); ctx.fillRect(5, -4 + eBob, 4, 4); } 
      else if (e.world === 4) { ctx.fillStyle = "#eceff1"; ctx.fillRect(-6, -7 + eBob, 12, 13); ctx.fillStyle = "#ffd700"; ctx.fillRect(-2, -5 + eBob, 4, 4); ctx.fillStyle = "#0055ff"; ctx.fillRect(-3, -1 + eBob, 6, 1); ctx.fillStyle = "#ffd700"; ctx.fillRect(5, -7 + eBob, 1, 14); ctx.fillStyle = "#00e5ff"; ctx.fillRect(4, -9 + eBob, 3, 3); } 
      else { ctx.fillStyle = "#311b92"; ctx.fillRect(-6, -11 + eBob, 12, 4); ctx.fillRect(-4, -7 + eBob, 8, 13); ctx.fillStyle = "#111111"; ctx.fillRect(-3, -5 + eBob, 6, 4); ctx.fillStyle = "#d500f9"; ctx.fillRect(-2, -4 + eBob, 4, 1); ctx.fillStyle = "#d500f9"; ctx.fillRect(4, -3 + eBob, 4, 4); }
    }
    ctx.restore();

    if (!e.isBoss) {
      const bw = 24, bx = ex + e.w / 2 - bw / 2, by = e.y - 6;
      if (bx > -10 && bx < CW) { ctx.fillStyle = "#220000"; ctx.fillRect(bx, by, bw, 3); ctx.fillStyle = e.hp / e.maxHp > 0.5 ? "#22aa22" : "#cc2222"; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 3); }
    }
  });

  if (player) {
    const p = player, px = Math.round(p.x - camX), py = Math.round(p.y);
    if (invT === 0 || Math.floor(invT / 4) % 2 === 0 || p.dashT > 0) {
      const isMoving = p.vx !== 0, isJumping = p.vy < 0, isFalling = p.vy > 0;
      let pyOffset = 0; if (isJumping) pyOffset = -2; else if (isFalling) pyOffset = 0; else if (isMoving) pyOffset = Math.sin(p.fr * Math.PI) * 1.5; if (p.guarding) pyOffset += 3; 

      ctx.save(); ctx.translate(px + 7, py + 9 + pyOffset); ctx.scale(p.facing, 1);

      if (p.guarding || p.parryT > 0) {
        ctx.fillStyle = p.parryT > 0 ? "rgba(255, 238, 0, 0.4)" : "rgba(100, 220, 255, 0.4)"; ctx.beginPath(); ctx.arc(1, -pyOffset, 17, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = p.parryT > 0 ? "rgba(255, 255, 255, 0.9)" : "rgba(100, 220, 255, 0.9)"; ctx.lineWidth = p.parryT > 0 ? 3 : 2; ctx.stroke();
      }

      ctx.fillStyle = "#990000";
      if (isJumping || p.plunging || p.dashT > 0) { ctx.fillRect(-12, 2, 8, 6); ctx.fillRect(-14, 6, 6, 4); }
      else if (isFalling) { ctx.fillRect(-12, -8, 8, 10); ctx.fillRect(-14, -12, 6, 4); }
      else if (isMoving) { const flap = Math.sin(p.fr * Math.PI) * 2; ctx.fillRect(-14, 2 + flap, 10, 5); ctx.fillRect(-16, 4 + flap, 6, 4); }
      else { ctx.fillRect(-9, 3, 5, 8); ctx.fillRect(-11, 8, 5, 5); }

      ctx.fillStyle = "#1a1a25"; ctx.fillRect(-6, 2, 12, 6); ctx.fillStyle = "#2a2a35"; ctx.fillRect(-5, 2, 10, 5);

      let pLegL = 0, pLegR = 0; if (isJumping || p.plunging || p.dashT > 0) { pLegL = -2; pLegR = -4; } else if (isFalling) { pLegL = -1; pLegR = -2; } else if (isMoving) { pLegL = Math.sin(p.fr * Math.PI) * 3; pLegR = -Math.sin(p.fr * Math.PI) * 3; }

      ctx.fillStyle = "#f8f8fa";
      if (!p.guarding) { ctx.fillRect(-4, 7, 3, 4 + pLegL); ctx.fillRect(2, 7, 3, 4 + pLegR); } else { ctx.fillRect(-5, 5, 4, 2); ctx.fillRect(3, 5, 4, 2); }

      ctx.fillStyle = "#f8f8fa"; ctx.fillRect(-6, -10, 14, 10); ctx.fillRect(-7, -8, 16, 6); ctx.fillStyle = "#d0d0d5"; ctx.fillRect(-4, 0, 10, 3);
      ctx.fillStyle = "#808085"; ctx.fillRect(-2, 0, 1, 3); ctx.fillRect(1, 0, 1, 3); ctx.fillRect(4, 0, 1, 3);
      ctx.fillStyle = "#0a0a0f"; ctx.fillRect(2, -7, 4, 4); ctx.fillRect(-4, -7, 4, 4);
      ctx.fillStyle = p.atkAnim > 0 ? "#ff0000" : "#fff"; ctx.fillRect(3, -6, 2, 2); ctx.fillRect(-3, -6, 2, 2);
      ctx.fillStyle = "#cc0000"; ctx.fillRect(-7, -1, 14, 4); ctx.fillStyle = "#ff3333"; ctx.fillRect(-6, -1, 12, 2);

      if (p.plunging) {
        ctx.save(); ctx.translate(5, 2); ctx.rotate(Math.PI * 0.8 * p.facing);
        ctx.fillStyle = "#5c4033"; ctx.fillRect(-2, -1, 4, 3); ctx.fillStyle = "#f8f8fa"; ctx.fillRect(2, -2, 12, 5); ctx.fillRect(12, -4, 4, 4); ctx.restore();
      } else if (p.atkAnim > 0) {
        ctx.save(); ctx.translate(5, 2);
        const maxAnim = p.combo === 3 ? 20 : 12; const progress = 1 - (p.atkAnim / maxAnim); let angle = 0;
        if (p.combo === 1) { angle = -Math.PI * 0.7 + (Math.PI * 1.4 * progress); } 
        else if (p.combo === 2) { angle = Math.PI * 0.7 - (Math.PI * 1.4 * progress); } 
        else { ctx.scale(1.6, 1.6); if (progress < 0.3) { angle = -Math.PI * 0.8 - (progress * 1.5); } else { const p2 = (progress - 0.3) / 0.7; angle = -Math.PI * 1.2 + (Math.PI * 2.2 * p2); } }
        ctx.rotate(angle * p.facing);
        ctx.fillStyle = "#5c4033"; ctx.fillRect(-2, -1, 4, 3); ctx.fillStyle = "#f8f8fa"; ctx.fillRect(2, -2, 12, 5); ctx.fillRect(12, -4, 4, 4);
        if (p.combo === 3 && progress > 0.3 && progress < 0.8) { ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.fillRect(2, -10, 16, 20); }
        ctx.restore();
      } else {
        ctx.fillStyle = "#5c4033"; ctx.fillRect(2, 2, 3, 4); ctx.fillStyle = "#f8f8fa"; ctx.fillRect(5, 1, 10, 4); ctx.fillRect(13, -1, 3, 3);
      }
      ctx.restore();
    }
  }
  ctx.restore();

  texts.forEach(t => { const tx = t.x - camX; if (tx < -20 || tx > CW + 20) return; ctx.save(); ctx.globalAlpha = Math.max(0, t.life / 20); ctx.fillStyle = t.color; ctx.font = `bold ${t.size || 14}px NeoDunggeunmo`; ctx.fillText(t.text, tx, t.y); ctx.restore(); });

  if (comboCount > 1) {
    ctx.save(); ctx.fillStyle = "#ffee00"; ctx.font = "italic bold 24px NeoDunggeunmo"; ctx.shadowColor = "#ff3300"; ctx.shadowBlur = 4; ctx.fillText(`${comboCount} COMBOS`, CW - 160, 60);
    ctx.fillStyle = "rgba(255,0,0,0.2)"; ctx.fillRect(CW - 160, 70, 120, 4); ctx.fillStyle = "#ffcc00"; ctx.fillRect(CW - 160, 70, 120 * (comboTimer / 150), 4); ctx.restore();
  }

  if (enemies.length === 0 && doors.length > 0 && doors[0].open) {
    ctx.fillStyle = "rgba(0,255,100,0.06)"; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "#44ff88"; ctx.font = "16px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText("AREA CLEARED → ENTER THE DOOR", CW / 2, 30); ctx.textAlign = "left";
  }

  const skillPct = skillCD / pSkillMax; ctx.fillStyle = "#111118"; ctx.fillRect(CW - 100, CH - 22, 90, 12);
  if (skillCD > 0) { ctx.fillStyle = "#3344aa"; ctx.fillRect(CW - 100, CH - 22, 90 * (1 - skillPct), 12); ctx.fillStyle = "#8899ff"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText("SKILL CD", CW - 55, CH - 13); } 
  else { ctx.fillStyle = "#113322"; ctx.fillRect(CW - 100, CH - 22, 90, 12); ctx.fillStyle = "#33ff88"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText("SKILL READY", CW - 55, CH - 13); }

  const dashPct = player ? player.dashCD / 75 : 0; ctx.fillStyle = "#111118"; ctx.fillRect(CW - 200, CH - 22, 90, 12);
  if (dashPct > 0) { ctx.fillStyle = "#aa5533"; ctx.fillRect(CW - 200, CH - 22, 90 * (1 - dashPct), 12); ctx.fillStyle = "#ffaa88"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText("DASH CD", CW - 155, CH - 13); } 
  else { ctx.fillStyle = "#332211"; ctx.fillRect(CW - 200, CH - 22, 90, 12); ctx.fillStyle = "#ffaa00"; ctx.font = "10px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText("DASH READY", CW - 155, CH - 13); }
  
  ctx.textAlign = "left"; ctx.fillStyle = "#ffffff"; ctx.font = "14px NeoDunggeunmo"; ctx.fillText("Enemies: " + enemies.length, 10, 20);
}

function renderUpgrade() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.9)"; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = "#ffcc00"; ctx.font = "30px NeoDunggeunmo"; ctx.textAlign = "center"; ctx.fillText("보스 처치 보상 (키보드 숫자 선택)", CW / 2, 80);
  ctx.fillStyle = "#ffffff"; ctx.font = "18px NeoDunggeunmo";
  ctx.fillText("[1] 전사의 뼈: 최대 HP +1 & 전체 회복", CW / 2, 160);
  ctx.fillText("[2] 사신의 낫: 기본 공격력 +5 증가", CW / 2, 210);
  ctx.fillText("[3] 마력 두개골: 스킬 쿨타임 30% 감소", CW / 2, 260);

  if (dn("Digit1") || dn("Numpad1")) { player.maxHp++; player.hp = player.maxHp; exitUpgrade(); } 
  else if (dn("Digit2") || dn("Numpad2")) { pBaseDmg += 5; exitUpgrade(); } 
  else if (dn("Digit3") || dn("Numpad3")) { pSkillMax = Math.floor(pSkillMax * 0.7); exitUpgrade(); }
  ctx.textAlign = "left";
}

function exitUpgrade() {
  K["Digit1"] = false; K["Numpad1"] = false; K["Digit2"] = false; K["Numpad2"] = false; K["Digit3"] = false; K["Numpad3"] = false;
  gs = "play"; genStage(worldN, levelN);
}

function updateHUD() {
  if (!player) return; const hc = document.getElementById("hearts"); hc.innerHTML = "";
  for (let i = 0; i < player.maxHp; i++) { const d = document.createElement("div"); d.className = "heart" + (i >= player.hp ? " empty" : ""); hc.appendChild(d); }
  document.getElementById("stageLabel").textContent = `STAGE ${worldN}-${levelN}${levelN === 3 ? " [BOSS]" : ""}`;
  document.getElementById("scoreLabel").textContent = "SCORE: " + score; document.getElementById("killLabel").textContent = "처치: " + kills;
  document.getElementById("skillLabel").textContent = skillCD > 0 ? "SKILL CD" : "SKILL READY"; document.getElementById("skillLabel").style.color = skillCD > 0 ? "#e74c3c" : "#27ae60";
}

function showOv(t, s1, s2, btn) {
  document.getElementById("overlay").querySelector("h1").textContent = t;
  const subs = document.querySelectorAll("#overlay .sub"); if (subs.length > 0) subs[0].textContent = s1; if (subs.length > 1) subs[1].textContent = s2; if (subs.length > 2) subs[2].textContent = "";
  const btnEl = document.querySelector(".startBtn"); if (btnEl) btnEl.textContent = btn;
  document.getElementById("overlay").style.display = "flex";
}

function startGame() {
  score = 0; kills = 0; worldN = 1; levelN = 1; pBaseDmg = 10; pSkillMax = 600; comboCount = 0; pRangeBonus = 0;
  document.getElementById("bossBarWrap").style.display = "none";
  genStage(1, 1); gs = "play"; document.getElementById("overlay").style.display = "none";
}

document.getElementById("startBtn").addEventListener("click", startGame);
initTouchControls();

let lastTime = 0; const FPS = 60; const interval = 1000 / FPS; 
function loop(currentTime) {
  requestAnimationFrame(loop); const deltaTime = currentTime - lastTime;
  if (deltaTime >= interval) {
    lastTime = currentTime - (deltaTime % interval);
    if (gs === "upgrade") { renderUpgrade(); } 
    else { update(); if (gs === "menu") { ctx.fillStyle = "#050508"; ctx.fillRect(0, 0, CW, CH); ctx.fillStyle = "#0a0505"; for (let x = 0; x < CW; x += TILE) ctx.fillRect(x, CH - TILE, TILE, TILE); } else if (gs === "play" || gs === "dead" || gs === "win") { render(); } }
  }
}
requestAnimationFrame((time) => { lastTime = time; loop(time); });