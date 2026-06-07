// ==========================================
// 오디오 엔진 — SFX & BGM (Audio Engine)
// ==========================================

let audioCtx = null, noiseBuffer = null, isBgmPlaying = false;
let bgmInterval = null, bgmInterval2 = null;
let currentBgmScene = '';

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 0.5;
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (Math.random() < 0.15 ? 1.0 : 0.3);
        }
    } catch(e) {}
}

function unlockAudio() {
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}

if (typeof document !== 'undefined') {
    const _unlock = () => { unlockAudio(); };
    document.addEventListener('keydown',     _unlock, { once: true });
    document.addEventListener('pointerdown', _unlock, { once: true });
    document.addEventListener('touchstart',  _unlock, { once: true });
}

function ensureAudioRunning() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}

function stopBGM() {
    if (bgmInterval)  clearInterval(bgmInterval);
    if (bgmInterval2) clearInterval(bgmInterval2);
    bgmInterval = bgmInterval2 = null;
    isBgmPlaying = false;
    currentBgmScene = '';
}

function _makeDistortion(amount) {
    const samples = 256, curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}

// ── SFX ──────────────────────────────────────

function playSfx(type) {
    if (!audioCtx) unlockAudio(); if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (Game.isMuted) return;
    const now = audioCtx.currentTime;

    function osc(t, f, g, d, dist = 0) {
        const o = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        o.type = t; o.frequency.value = f;
        gn.gain.setValueAtTime(g, now);
        gn.gain.exponentialRampToValueAtTime(0.001, now + d);
        if (dist > 0) {
            const dw = audioCtx.createWaveShaper();
            dw.curve = _makeDistortion(dist);
            o.connect(dw); dw.connect(gn);
        } else { o.connect(gn); }
        gn.connect(audioCtx.destination);
        o.start(now); o.stop(now + d);
    }

    function noise(g, d, ft, ff) {
        if (!noiseBuffer) return;
        const s = audioCtx.createBufferSource(); s.buffer = noiseBuffer;
        const f = audioCtx.createBiquadFilter(); f.type = ft; f.frequency.value = ff;
        const gn = audioCtx.createGain();
        gn.gain.setValueAtTime(g, now); gn.gain.exponentialRampToValueAtTime(0.001, now + d);
        s.connect(f); f.connect(gn); gn.connect(audioCtx.destination); s.start(now);
    }

    function sweep(t, f1, f2, g, d, dist = 0) {
        const o = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        o.type = t;
        o.frequency.setValueAtTime(f1, now);
        o.frequency.exponentialRampToValueAtTime(f2, now + d);
        gn.gain.setValueAtTime(g, now);
        gn.gain.exponentialRampToValueAtTime(0.001, now + d);
        if (dist > 0) {
            const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(dist);
            o.connect(dw); dw.connect(gn);
        } else { o.connect(gn); }
        gn.connect(audioCtx.destination);
        o.start(now); o.stop(now + d);
    }

    if (type === 'jump') {
        sweep('square', 180, 420, 0.55, 0.06);
        sweep('square', 420, 80, 0.4, 0.12);
    }
    else if (type === 'atk') {
        sweep('sawtooth', 1400, 200, 0.25, 0.07, 80);
        noise(0.6, 0.08, 'bandpass', 2400);
    }
    else if (type === 'enemy_atk') {
        sweep('sawtooth', 300, 40, 0.6, 0.22, 300);
        noise(0.35, 0.15, 'lowpass', 400);
    }
    else if (type === 'mob_laser') {
        sweep('sawtooth', 2200, 400, 0.4, 0.3, 300);
        osc('sine', 1100, 0.15, 0.25);
    }
    else if (type === 'boss_atk') {
        sweep('sawtooth', 90, 18, 0.9, 0.5, 500);
        osc('square', 55, 0.5, 0.4);
    }
    else if (type === 'hit') {
        sweep('sawtooth', 500, 60, 0.55, 0.2, 350);
        noise(0.4, 0.08, 'highpass', 1500);
    }
    else if (type === 'parry') {
        sweep('sawtooth', 120, 30, 0.5, 0.2, 400);
        osc('square', 1800, 0.5, 0.15);
        osc('square', 3600, 0.3, 0.1);
        noise(0.3, 0.12, 'bandpass', 3000);
    }
    else if (type === 'skill') {
        sweep('sawtooth', 1200, 30, 0.8, 0.7, 600);
        noise(0.6, 0.4, 'lowpass', 1200);
    }
    else if (type === 'dmg') {
        sweep('sawtooth', 200, 25, 0.8, 0.3, 450);
        noise(0.6, 0.3, 'bandpass', 800);
    }
    else if (type === 'player_die') {
        sweep('sawtooth', 80, 10, 0.9, 0.8, 700);
        noise(1.0, 0.8, 'lowpass', 600);
        [55, 65, 82].forEach((f, i) => {
            setTimeout(() => { if (audioCtx) osc.call(null, 'sine', f, 0.3, 1.5); }, i * 50);
        });
        osc('sine', 55, 0.3, 1.5);
    }
    else if (type === 'clear') {
        [110, 138, 165, 220].forEach((f, i) => {
            setTimeout(() => {
                if (!audioCtx) return;
                sweep('sawtooth', f, f * 1.1, 0.35, 0.6, 150);
                osc('sine', f * 2, 0.12, 0.5);
            }, i * 120);
        });
    }
    else if (type === 'item') {
        [440, 660, 880].forEach((f, i) => setTimeout(() => { if (audioCtx) osc('square', f, 0.2, 0.15); }, i * 60));
        setTimeout(() => { if (audioCtx) osc('triangle', 1320, 0.1, 0.2); }, 200);
    }
    else if (type === 'enemy_die') {
        sweep('sawtooth', 250, 35, 0.4, 0.18, 300);
        noise(0.6, 0.18, 'bandpass', 1200);
    }
    else if (type === 'combo_high') {
        osc('sawtooth', 600,  0.4, 0.15, 300);
        setTimeout(() => { if (audioCtx) osc('sawtooth', 1200, 0.3, 0.2, 300); }, 30);
    }
    else if (type === 'fatal_strike') {
        sweep('sawtooth', 400, 40, 1.0, 0.6, 700);
        noise(0.5, 0.3, 'highpass', 2000);
        [3000, 1500, 750].forEach((f, i) => setTimeout(() => { if (audioCtx) osc('sawtooth', f, 0.4, 0.3, 300); }, i * 60));
    }
    else if (type === 'poise_break') {
        noise(0.8, 0.2, 'bandpass', 1800);
        sweep('sawtooth', 600, 80, 0.6, 0.15, 400);
    }
    else if (type === 'boss_clear') {
        [110, 130, 165, 220, 196, 220, 262].forEach((f, i) => {
            setTimeout(() => {
                if (!audioCtx) return;
                sweep('sawtooth', f, f * 1.05, 0.3, 0.5, 100);
                osc('sine', f * 2, 0.1, 0.4);
            }, i * 100);
        });
        sweep('sawtooth', 60, 15, 0.6, 0.5, 500);
    }
    else if (type === 'dash') {
        noise(0.5, 0.1, 'highpass', 3000);
        sweep('square', 800, 120, 0.2, 0.1);
    }
    else if (type === 'plunge_land') {
        sweep('sawtooth', 160, 20, 0.85, 0.25, 500);
        noise(0.7, 0.25, 'lowpass', 800);
        osc('sine', 40, 0.5, 0.3);
    }
    else if (type === 'phase2') {
        sweep('sawtooth', 50, 8, 1.0, 1.5, 800);
        [3000, 1500, 750, 200].forEach((f, i) => setTimeout(() => { if (audioCtx) osc('sawtooth', f, 0.4, 0.6, 300); }, i * 180));
    }
}

// ── BGM ──────────────────────────────────────

function playBGM(scene = 'play') {
    if (!audioCtx) unlockAudio(); if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const sceneId = scene === 'play'
        ? `play_${Game.worldN}_${Game.levelN}`
        : scene;
    if (currentBgmScene === sceneId && isBgmPlaying) return;

    stopBGM();
    currentBgmScene = sceneId;
    isBgmPlaying = true;

    // ── 로비 BGM ─────────────────────────────
    if (scene === 'lobby') {
        const lobbyNotes = [220, 196, 174, 196, 220, 246, 220, 196];
        let ls = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { ls++; return; }
            const now = audioCtx.currentTime;
            const freq = lobbyNotes[ls % lobbyNotes.length];
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            const d = audioCtx.createWaveShaper();
            o.type = 'triangle'; o.frequency.value = freq;
            d.curve = _makeDistortion(60);
            g.gain.setValueAtTime(0.18, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            o.connect(d); d.connect(g); g.connect(audioCtx.destination);
            o.start(now); o.stop(now + 0.45);
            const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
            o2.type = 'sine'; o2.frequency.value = freq * 0.5;
            g2.gain.setValueAtTime(0.12, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now); o2.stop(now + 0.5);
            ls++;
        }, 320);
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const bFreqs = [110, 98, 87, 98];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = bFreqs[Math.floor(ls / 8) % 4];
            g.gain.setValueAtTime(0.22, now); g.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 2.4);
        }, 2560);
        return;
    }

    // ── 프롤로그 BGM ─────────────────────────
    if (scene === 'prologue') {
        const pNotes = [110, 0, 0, 0, 98, 0, 0, 0, 87, 0, 0, 0, 82, 0, 82, 0,
                        77, 0, 0, 0, 69, 0, 0, 0, 65, 0, 0, 0, 65, 0, 0, 0];
        let ps = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { ps++; return; }
            const now = audioCtx.currentTime;
            const freq = pNotes[ps % pNotes.length];
            if (freq > 0) {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(80);
                o.type = 'sawtooth'; o.frequency.value = freq;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.22, now + 0.12);
                g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
                o.connect(dw); dw.connect(g); g.connect(audioCtx.destination);
                o.start(now); o.stop(now + 1.4);
                const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
                o2.type = 'triangle'; o2.frequency.value = freq * 1.5;
                g2.gain.setValueAtTime(0.06, now + 0.1); g2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now + 0.1); o2.stop(now + 1.2);
            }
            ps++;
        }, 380);
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const drones = [55, 49, 43, 41];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = drones[Math.floor(ps / 8) % 4];
            g.gain.setValueAtTime(0.28, now); g.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 3.5);
        }, 3040);
        return;
    }

    // ── 사망 BGM ─────────────────────────────
    if (scene === 'dead') {
        const deadNotes = [110, 98, 87, 82, 77, 69, 65, 55];
        let ds = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { ds++; return; }
            const now = audioCtx.currentTime;
            const freq = deadNotes[ds % deadNotes.length];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(200);
            o.type = 'sawtooth'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.35, now + 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
            o.connect(dw); dw.connect(g); g.connect(audioCtx.destination);
            o.start(now); o.stop(now + 1.4);
            const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
            o2.type = 'sine'; o2.frequency.value = freq * 1.5;
            g2.gain.setValueAtTime(0.08, now + 0.1); g2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now + 0.1); o2.stop(now + 1.2);
            ds++;
        }, 700);
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = 27.5;
            g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 3.0);
        }, 2800);
        return;
    }

    // ── 업그레이드 BGM ────────────────────────
    if (scene === 'upgrade') {
        const upNotes = [261, 293, 329, 349, 329, 293];
        let us = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { us++; return; }
            const now = audioCtx.currentTime;
            const freq = upNotes[us % upNotes.length];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'triangle'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.22, now + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.5);
            us++;
        }, 280);
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = 130;
            g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 1.1);
        }, 1120);
        return;
    }

    // ── 엔딩 BGM ─────────────────────────────
    if (scene === 'ending') {
        const endNotes = [220, 246, 261, 293, 329, 293, 261, 246,
                          220, 196, 174, 196, 220, 246, 293, 261];
        let es = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { es++; return; }
            const now = audioCtx.currentTime;
            const freq = endNotes[es % endNotes.length];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.2, now + 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.9);
            const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
            o2.type = 'triangle'; o2.frequency.value = freq * 2;
            g2.gain.setValueAtTime(0.06, now + 0.08); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now + 0.08); o2.stop(now + 0.8);
            es++;
        }, 380);
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const bPad = [110, 123, 130, 146];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = bPad[Math.floor(es / 8) % 4];
            g.gain.setValueAtTime(0.18, now); g.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 2.8);
        }, 3040);
        return;
    }

    // ── 전투 BGM (기존 방식 그대로) ───────────
    const isBoss      = scene === 'play' && Game.levelN === 3;
    const wg          = typeof getWg === 'function' ? getWg() : 1;
    const isFinalBoss = Game.worldN === 10 && isBoss;

    let speed = 140;
    if (isFinalBoss)   speed = 500;
    else if (isBoss)   speed = 110;
    else if (wg >= 4)  speed = 170;
    else if (wg === 3) speed = 190;
    else               speed = 140;

    let step = 0, chordStep = 0;

    bgmInterval = setInterval(() => {
        if (!isBgmPlaying) return;
        if (Game.isMuted) { step++; if (step % (isBoss && !isFinalBoss ? 2 : 4) === 0) chordStep++; return; }

        const now = audioCtx.currentTime;

        if (step % (isBoss && !isFinalBoss ? 1 : 2) === 0) {
            const osc  = audioCtx.createOscillator();
            const dist = audioCtx.createWaveShaper();
            const gain = audioCtx.createGain();
            osc.type = isFinalBoss ? 'sine' : (wg >= 4 || isBoss ? 'sawtooth' : 'square');
            dist.curve = _makeDistortion(isBoss ? 200 : 80);
            const gAmt = isFinalBoss ? 0.25 : (isBoss ? 0.18 : (wg >= 3 ? 0.22 : 0.14));
            gain.gain.setValueAtTime(gAmt, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinalBoss ? 1.4 : (isBoss ? 0.18 : (wg >= 4 ? 0.5 : 0.38))));

            let f = 0;
            if (isFinalBoss) { f = [[41,36,32,27],[36,32,27,24],[32,27,24,20]][chordStep%3][step%4]; f = 440*Math.pow(2,(f-69)/12); }
            else if (isBoss) {
                if (wg===1) f=[[130,196,261,196],[146,220,293,220],[174,261,349,261]][chordStep%3][step%4];
                else if (wg===2) f=[[110,164,220,164],[87,130,174,130],[103,155,207,155]][chordStep%3][step%4];
                else if (wg===3) f=[[261,329,392,523],[246,311,370,493],[220,277,329,440]][chordStep%3][step%4];
                else f=[[98,146,196,146],[87,130,174,130],[77,116,155,116]][chordStep%3][step%4];
            } else if (wg===1) {
                const fc=[[130,164,196],[146,174,220],[174,220,261],[196,246,293]];
                f=fc[chordStep%4][(step/2)%3];
            } else if (wg===2) {
                const fc=[[110,130,164],[87,110,130],[103,123,155],[82,103,123]];
                f=fc[chordStep%4][(step/2)%3];
            } else if (wg===3) {
                const fc=[[261,329,392],[246,329,392],[220,261,329],[207,261,311]];
                f=fc[chordStep%4][(step/2)%3];
            } else if (wg===4) {
                const fc=[[98,116,146],[87,103,130],[77,98,116],[73,87,110]];
                f=fc[chordStep%4][(step/2)%3];
            } else {
                const fc=[[164,196,246],[155,196,246],[130,164,196],[123,155,196]];
                f=fc[chordStep%4][(step/2)%3]*0.75;
            }
            osc.frequency.value = f;
            osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now); osc.stop(now + (isFinalBoss ? 1.4 : (isBoss ? 0.18 : (wg>=4 ? 0.5 : 0.38))));
        }

        if (step % (isBoss && !isFinalBoss ? 2 : 4) === 0) {
            const bOsc  = audioCtx.createOscillator();
            const bDist = audioCtx.createWaveShaper();
            const bGain = audioCtx.createGain();
            bOsc.type = wg >= 4 ? 'sawtooth' : (isBoss ? 'square' : 'triangle');
            bDist.curve = _makeDistortion(300);
            const bgAmt = isFinalBoss ? 0.45 : (isBoss ? 0.4 : 0.28);
            bGain.gain.setValueAtTime(bgAmt, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + (isFinalBoss ? 1.6 : (isBoss ? 0.4 : 0.9)));

            let bf = 0;
            if (isFinalBoss)    bf = 440*Math.pow(2,([16,15,13,12][chordStep%4]-69)/12);
            else if (isBoss)    bf = [32,27,24,20][chordStep%4];
            else if (wg===1)    bf = [65,73,87,98][chordStep%4];
            else if (wg===2)    bf = [55,43,51,41][chordStep%4];
            else if (wg===3)    bf = [32,30,27,25][chordStep%4];
            else if (wg===4)    bf = [24,21,18,16][chordStep%4];
            else                bf = [20,19,16,15][chordStep%4];

            bOsc.frequency.value = bf;
            bOsc.connect(bDist); bDist.connect(bGain); bGain.connect(audioCtx.destination);
            bOsc.start(now); bOsc.stop(now + (isFinalBoss ? 1.6 : (isBoss ? 0.4 : 0.9)));
            chordStep++;
        }
        step++;
    }, speed);
}