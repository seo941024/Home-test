// ==========================================
// 오디오 엔진 - SFX & BGM (Audio Engine)
// 다크판타지 스타일: 날카롭고 무겁고 찢어지는 사운드
// ==========================================

let audioCtx = null, noiseBuffer = null, isBgmPlaying = false, bgmInterval = null, currentBgmScene = '';

function initAudio() {
    if (audioCtx) return;
    try {
        // 브라우저 오디오 정책 대응: AudioContext는 생성하되 suspended 상태일 수 있음
        // 실제 소리는 resume() 후에만 나옴 — 첫 유저 인터랙션 시 unlock
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 0.3;
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (Math.random() < 0.15 ? 1.0 : 0.3);
        }
    } catch(e) {}
}

// 브라우저 오디오 차단 방지용 래퍼 — 첫 키/클릭 입력 시 무조건 resume
function unlockAudio() {
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}

// 페이지 로드 후 첫 인터랙션 시 자동 언락
// once:true 로 등록하되 touchstart도 추가 — 모바일 대응
if (typeof document !== 'undefined') {
    const _unlock = () => {
        unlockAudio();
        // 등록 해제는 once:true가 자동 처리
    };
    document.addEventListener('keydown',     _unlock, { once: true });
    document.addEventListener('pointerdown', _unlock, { once: true });
    document.addEventListener('touchstart',  _unlock, { once: true });
}

// 게임 루프에서도 매 프레임 suspend 체크 — 브라우저 탭 전환 후 복귀 시 대응
function ensureAudioRunning() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}

function stopBGM() {
    if (bgmInterval) clearInterval(bgmInterval);
    isBgmPlaying = false;
    currentBgmScene = '';
}

// 디스토션 커브 생성 헬퍼
function _makeDistortion(amount) {
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}

// 무거운 임팩트음 공통 헬퍼: 저음 강조 + 디스토션
function _heavyImpact(freq1, freq2, dur, gainAmt, distAmt) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc  = audioCtx.createOscillator();
    const dist = audioCtx.createWaveShaper();
    const gain = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq1, now);
    osc.frequency.exponentialRampToValueAtTime(freq2, now + dur);

    dist.curve = _makeDistortion(distAmt);
    filt.type = 'lowpass'; filt.frequency.value = 800;

    gain.gain.setValueAtTime(gainAmt, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(dist); dist.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + dur);
}

function playSfx(type) {
    // 소리 재생 시점에도 언락 시도 (정책 변경 대응)
    if (!audioCtx) unlockAudio(); if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (Game.isMuted) return;
    const now = audioCtx.currentTime;

    if (type === 'jump') {
        // 금속성 도약음 - 짧고 날카롭게
        const osc = audioCtx.createOscillator();
        const dist = audioCtx.createWaveShaper();
        const gain = audioCtx.createGain();
        const filt = audioCtx.createBiquadFilter();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
        dist.curve = _makeDistortion(120);
        filt.type = 'bandpass'; filt.frequency.value = 600; filt.Q.value = 3;
        gain.gain.setValueAtTime(0.55, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(dist); dist.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.18);
    }

    else if (type === 'atk') {
        // 뼈 무기 휘두름 - 찢어지는 바람 소리
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const filt = audioCtx.createBiquadFilter();
            const gain = audioCtx.createGain();
            const dist = audioCtx.createWaveShaper();
            filt.type = 'bandpass'; filt.frequency.value = 2400; filt.Q.value = 2;
            dist.curve = _makeDistortion(200);
            gain.gain.setValueAtTime(0.7, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            src.connect(dist); dist.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
            src.start(now);
        }
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1400, now); osc2.frequency.exponentialRampToValueAtTime(200, now + 0.07);
        gain2.gain.setValueAtTime(0.25, now); gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc2.connect(gain2); gain2.connect(audioCtx.destination); osc2.start(now); osc2.stop(now + 0.07);
    }

    else if (type === 'enemy_atk') {
        // 적 공격 - 굵고 둔중한 타격
        _heavyImpact(300, 40, 0.22, 0.6, 300);
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const filt = audioCtx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.35, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
    }

    else if (type === 'mob_laser') {
        // 마법 레이저 - 고압 방전음
        const osc = audioCtx.createOscillator();
        const dist = audioCtx.createWaveShaper();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2200, now); osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);
        dist.curve = _makeDistortion(400);
        gain.gain.setValueAtTime(0.45, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.35);
    }

    else if (type === 'boss_atk') {
        // 보스 공격 - 대지가 울리는 저음 충격
        _heavyImpact(90, 18, 0.5, 0.9, 500);
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(55, now); osc2.frequency.exponentialRampToValueAtTime(22, now + 0.4);
        gain2.gain.setValueAtTime(0.5, now); gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2); gain2.connect(audioCtx.destination); osc2.start(now); osc2.stop(now + 0.4);
    }

    else if (type === 'hit') {
        // 방어 히트 - 금속 충돌음
        _heavyImpact(500, 60, 0.2, 0.55, 350);
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const filt = audioCtx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 1500;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
    }

    else if (type === 'parry') {
        // 패링 - 고주파 금속 공명 + 충격파
        const osc = audioCtx.createOscillator();
        const dist = audioCtx.createWaveShaper();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.setValueAtTime(3200, now + 0.01);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.35);
        dist.curve = _makeDistortion(180);
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.7, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.35);
        // 저음 펀치
        _heavyImpact(120, 30, 0.2, 0.5, 400);
    }

    else if (type === 'skill') {
        // 필살기 - 폭발적인 에너지 방출
        _heavyImpact(60, 15, 0.8, 1.0, 600);
        const osc = audioCtx.createOscillator();
        const dist = audioCtx.createWaveShaper();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);
        dist.curve = _makeDistortion(500);
        gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.7);
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const filt = audioCtx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 1200;
            const g2 = audioCtx.createGain();
            g2.gain.setValueAtTime(0.6, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            src.connect(filt); filt.connect(g2); g2.connect(audioCtx.destination); src.start(now);
        }
    }

    else if (type === 'dmg') {
        // 플레이어 피격 - 살이 찢어지는 충격음
        _heavyImpact(200, 25, 0.4, 0.8, 450);
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const filt = audioCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 800; filt.Q.value = 1;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
    }

    else if (type === 'player_die') {
        // 사망 - 긴 크런치 + 공명
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const dist = audioCtx.createWaveShaper();
            const filt = audioCtx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600;
            const gain = audioCtx.createGain();
            dist.curve = _makeDistortion(600);
            gain.gain.setValueAtTime(1.0, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            src.connect(dist); dist.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
        _heavyImpact(80, 10, 1.2, 0.9, 700);
    }

    else if (type === 'clear') {
        // 클리어 - 어둡지만 웅장한 팡파르
        const notes = [110, 138, 165, 220];
        notes.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const dist = audioCtx.createWaveShaper();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now + i * 0.12);
            dist.curve = _makeDistortion(150);
            gain.gain.setValueAtTime(0, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.35, now + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
            osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.6);
        });
    }

    else if (type === 'item') {
        // 아이템 - 짧은 마법 효과음
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(660, now + 0.05); osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.25);
    }

    else if (type === 'enemy_die') {
        // 적 사망 - 뼈 부서지는 크런치
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const dist = audioCtx.createWaveShaper();
            const filt = audioCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1200; filt.Q.value = 2;
            const gain = audioCtx.createGain();
            dist.curve = _makeDistortion(500);
            gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            src.connect(dist); dist.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
        _heavyImpact(250, 35, 0.15, 0.4, 300);
    }

    else if (type === 'combo_high') {
        const osc = audioCtx.createOscillator();
        const dist = audioCtx.createWaveShaper();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now); osc.frequency.setValueAtTime(1200, now + 0.03);
        dist.curve = _makeDistortion(300);
        gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.25);
    }

    else if (type === 'fatal_strike') {
        // Fatal Strike - 금속이 폭발하는 듯한 날카로운 임팩트
        _heavyImpact(400, 40, 0.6, 1.0, 700);
        const osc2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
        const dist2 = audioCtx.createWaveShaper();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(3000, now); osc2.frequency.exponentialRampToValueAtTime(120, now + 0.4);
        dist2.curve = _makeDistortion(600);
        g2.gain.setValueAtTime(0.7, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(dist2); dist2.connect(g2); g2.connect(audioCtx.destination);
        osc2.start(now); osc2.stop(now + 0.4);
    }

    else if (type === 'poise_break') {
        // 체간 파괴 - 뼈가 부러지는 크런치음
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const dist = audioCtx.createWaveShaper();
            const filt = audioCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 3;
            const gain = audioCtx.createGain();
            dist.curve = _makeDistortion(700);
            gain.gain.setValueAtTime(0.8, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            src.connect(dist); dist.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
        _heavyImpact(600, 80, 0.15, 0.6, 400);
    }

    else if (type === 'boss_clear') {
        // 보스 처치 징글 - 어둡고 웅장한 승리
        const melody = [110, 130, 165, 220, 196, 220, 262];
        melody.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const dist = audioCtx.createWaveShaper();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth'; dist.curve = _makeDistortion(100);
            osc.frequency.value = freq;
            const t2 = now + i * 0.1;
            gain.gain.setValueAtTime(0, t2); gain.gain.linearRampToValueAtTime(0.3, t2 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.5);
            osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination);
            osc.start(t2); osc.stop(t2 + 0.5);
        });
    }

    else if (type === 'dash') {
        // 대쉬 - 공기 찢는 소리
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const filt = audioCtx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 3000;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
        const osc = audioCtx.createOscillator(); const gain2 = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        gain2.gain.setValueAtTime(0.2, now); gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain2); gain2.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.1);
    }

    else if (type === 'plunge_land') {
        // 강하 착지 충격파
        _heavyImpact(160, 20, 0.3, 0.85, 500);
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const filt = audioCtx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 800;
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.7, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination); src.start(now);
        }
    }

    else if (type === 'phase2') {
        // 보스 페이즈2 전환 - 폭발적 저주파
        _heavyImpact(50, 8, 1.5, 1.0, 800);
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3000, now); osc.frequency.exponentialRampToValueAtTime(40, now + 1.0);
        gain.gain.setValueAtTime(0.7, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 1.0);
    }
}

function playBGM(scene = 'play') {
    // 소리 재생 시점에도 언락 시도 (정책 변경 대응)
    if (!audioCtx) unlockAudio(); if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const sceneId = scene === 'play' ? `play_${Game.worldN}_${Game.levelN}` : scene;
    if (currentBgmScene === sceneId && isBgmPlaying) return;

    if (bgmInterval) clearInterval(bgmInterval);
    currentBgmScene = sceneId; isBgmPlaying = true;
    let step = 0; let chordStep = 0;

    if (scene === 'dead') {
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const dist = audioCtx.createWaveShaper();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            dist.curve = _makeDistortion(200);
            const notes = [73.42, 69.30, 65.41, 55.00];
            osc.frequency.setValueAtTime(notes[step % notes.length], now);
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.35, now + 0.15); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
            osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 1.4);
            step++;
        }, 700);
        return;
    }

    if (scene === 'upgrade') {
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
            osc.type = 'triangle';
            const freqs = [110, 138, 165, 196, 165, 138];
            osc.frequency.value = freqs[step % freqs.length];
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.2, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.5);
            step++;
        }, 300);
        return;
    }

    const isBoss = (scene === 'play' && Game.levelN === 3);
    const wg = getWg();
    let isFinalBoss = (Game.worldN === 10 && isBoss);

    let speed = 140;
    if (isFinalBoss) speed = 500;
    else if (isBoss) speed = 110;
    else if (wg >= 4) speed = 170;
    else if (wg === 3) speed = 190;
    else speed = 140;

    bgmInterval = setInterval(() => {
        if (!isBgmPlaying) return;
        if (Game.isMuted) { step++; if (step % (isBoss && !isFinalBoss ? 2 : 4) === 0) chordStep++; return; }

        const now = audioCtx.currentTime;

        if (step % (isBoss && !isFinalBoss ? 1 : 2) === 0) {
            const osc = audioCtx.createOscillator();
            const dist = audioCtx.createWaveShaper();
            const gain = audioCtx.createGain();
            osc.type = isFinalBoss ? 'sine' : (wg >= 4 || isBoss ? 'sawtooth' : 'square');
            dist.curve = _makeDistortion(isBoss ? 200 : 80);
            const gAmt = isFinalBoss ? 0.25 : (isBoss ? 0.18 : (wg >= 3 ? 0.22 : 0.14));
            gain.gain.setValueAtTime(gAmt, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinalBoss ? 1.4 : (isBoss ? 0.18 : (wg >= 4 ? 0.5 : 0.38))));

            // 월드 그룹별 멜로디 음계 (기존 유지, 옥타브 낮춤으로 무겁게)
            let f = 0;
            if (isFinalBoss) { f = [[41, 36, 32, 27], [36, 32, 27, 24], [32, 27, 24, 20]][chordStep % 3][step % 4]; }
            else if (isBoss) {
                if (wg === 1) f = [[130, 196, 261, 196], [146, 220, 293, 220], [174, 261, 349, 261]][chordStep % 3][step % 4];
                else if (wg === 2) f = [[110, 164, 220, 164], [87, 130, 174, 130], [103, 155, 207, 155]][chordStep % 3][step % 4];
                else if (wg === 3) f = [[261, 329, 392, 523], [246, 311, 370, 493], [220, 277, 329, 440]][chordStep % 3][step % 4];
                else f = [[98, 146, 196, 146], [87, 130, 174, 130], [77, 116, 155, 116]][chordStep % 3][step % 4];
            } else if (wg === 1) {
                const fc = [[130, 164, 196], [146, 174, 220], [174, 220, 261], [196, 246, 293]];
                f = fc[chordStep % 4][(step / 2) % 3];
            } else if (wg === 2) {
                const fc = [[110, 130, 164], [87, 110, 130], [103, 123, 155], [82, 103, 123]];
                f = fc[chordStep % 4][(step / 2) % 3];
            } else if (wg === 3) {
                const fc = [[261, 329, 392], [246, 329, 392], [220, 261, 329], [207, 261, 311]];
                f = fc[chordStep % 4][(step / 2) % 3];
            } else if (wg === 4) {
                const fc = [[98, 116, 146], [87, 103, 130], [77, 98, 116], [73, 87, 110]];
                f = fc[chordStep % 4][(step / 2) % 3];
            } else if (wg >= 5) {
                const fc = [[164, 196, 246], [155, 196, 246], [130, 164, 196], [123, 155, 196]];
                f = fc[chordStep % 4][(step / 2) % 3] * 0.75;
            }
            osc.frequency.value = f;
            osc.connect(dist); dist.connect(gain); gain.connect(audioCtx.destination);
            osc.start(now); osc.stop(now + (isFinalBoss ? 1.4 : (isBoss ? 0.18 : (wg >= 4 ? 0.5 : 0.38))));
        }

        if (step % (isBoss && !isFinalBoss ? 2 : 4) === 0) {
            const bOsc = audioCtx.createOscillator();
            const bDist = audioCtx.createWaveShaper();
            const bGain = audioCtx.createGain();
            bOsc.type = wg >= 4 ? 'sawtooth' : (isBoss ? 'square' : 'triangle');
            bDist.curve = _makeDistortion(300);
            const bgAmt = isFinalBoss ? 0.45 : (isBoss ? 0.4 : 0.28);
            bGain.gain.setValueAtTime(bgAmt, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + (isFinalBoss ? 1.6 : (isBoss ? 0.4 : 0.9)));

            let bf = 0;
            if (isFinalBoss) bf = [16, 15, 13, 12][chordStep % 4];
            else if (isBoss) bf = [32, 27, 24, 20][chordStep % 4];
            else if (wg === 1) bf = [65, 73, 87, 98][chordStep % 4];
            else if (wg === 2) bf = [55, 43, 51, 41][chordStep % 4];
            else if (wg === 3) bf = [32, 30, 27, 25][chordStep % 4];
            else if (wg === 4) bf = [24, 21, 18, 16][chordStep % 4];
            else            bf = [20, 19, 16, 15][chordStep % 4];

            bOsc.frequency.value = bf;
            bOsc.connect(bDist); bDist.connect(bGain); bGain.connect(audioCtx.destination);
            bOsc.start(now); bOsc.stop(now + (isFinalBoss ? 1.6 : (isBoss ? 0.4 : 0.9)));
            chordStep++;
        }
        step++;
    }, speed);
}