// ==========================================
// 오디오 엔진 — SFX & BGM (Audio Engine)
// ==========================================

let audioCtx = null, noiseBuffer = null, isBgmPlaying = false;
let bgmInterval = null, bgmInterval2 = null, bgmInterval3 = null;
let currentBgmScene = '';

// AudioContext 및 노이즈 버퍼 초기화 — 최초 1회만 실행
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

// 브라우저 자동재생 정책 해제 — 첫 유저 인터랙션 시 AudioContext 재개
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

// 매 프레임 호출 — suspended 상태를 감지해 AudioContext를 자동 재개
function ensureAudioRunning() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}

// 현재 재생 중인 BGM 인터벌을 모두 종료하고 상태 초기화
function stopBGM() {
    if (bgmInterval)  clearInterval(bgmInterval);
    if (bgmInterval2) clearInterval(bgmInterval2);
    if (bgmInterval3) clearInterval(bgmInterval3);
    bgmInterval = bgmInterval2 = bgmInterval3 = null;
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

// type 문자열에 따라 Web Audio API로 즉시 음향 효과를 합성 재생
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
        // 발구르기 저음 + 공기 가르는 상승 휘슬
        noise(0.55, 0.04, 'lowpass', 320);
        sweep('square', 90, 38, 0.35, 0.06);
        sweep('sawtooth', 380, 900, 0.18, 0.09);
        noise(0.22, 0.08, 'highpass', 5000);
    }
    else if (type === 'atk') {
        const cls = (typeof Game !== 'undefined') ? (Game.pClass || 0) : 0;
        if (cls === 0) {
            // 검사: 금속 참격 — 고음 슬래시 + 마찰 노이즈
            sweep('sawtooth', 2200, 180, 0.30, 0.055, 220);
            noise(0.55, 0.06, 'bandpass', 3200);
            noise(0.25, 0.12, 'highpass', 6000);
        } else if (cls === 1) {
            // 도적: 초고속 예리한 섬광 — 극단적 하강 슬라이스
            sweep('sawtooth', 3600, 80, 0.22, 0.035, 180);
            noise(0.70, 0.035, 'highpass', 5500);
        } else if (cls === 2) {
            // 발키리: 총성 균열음 + 탄피
            noise(0.90, 0.025, 'highpass', 4500);
            noise(0.40, 0.06, 'bandpass', 1600);
            sweep('sawtooth', 240, 28, 0.45, 0.12, 500);
        } else if (cls === 3) {
            // 마법사: 마법 방출 — 공명 버스트 + 파열
            sweep('sine', 1800, 280, 0.28, 0.12);
            noise(0.50, 0.08, 'bandpass', 2000);
            sweep('sawtooth', 900, 60, 0.20, 0.18, 300);
        } else if (cls === 4) {
            // 버서커: 둔중한 파쇄 — 저음 충격
            sweep('sawtooth', 160, 22, 0.85, 0.18, 700);
            noise(0.60, 0.14, 'lowpass', 500);
            noise(0.35, 0.08, 'bandpass', 900);
        } else if (cls === 5) {
            // 성기사: 신성한 타격 — 맑은 금속음 + 저음 울림
            sweep('sawtooth', 1600, 120, 0.28, 0.09, 150);
            noise(0.40, 0.08, 'highpass', 4000);
            osc('sine', 82, 0.30, 0.25);
        } else if (cls === 6) {
            // 소환사: 마법 채찍 — 기묘한 영체 터치음
            sweep('sine', 600, 1200, 0.22, 0.10);
            noise(0.30, 0.08, 'bandpass', 1400);
        } else if (cls === 7) {
            // 강령술사: 죽음의 손길 — 저음 공명 + 이세계 잡음
            sweep('sine', 220, 80, 0.28, 0.20);
            noise(0.45, 0.15, 'bandpass', 400);
            osc('sine', 160, 0.20, 0.18);
        } else if (cls === 6) {
            // 혈귀: 날카로운 혈창 — 금속 베임 + 젖은 충격
            sweep('sawtooth', 2800, 120, 0.35, 0.08, 300);
            noise(0.55, 0.06, 'lowpass', 600);
            noise(0.30, 0.10, 'bandpass', 1200);
        } else if (cls === 9) {
            // 검성: 검기 — 날카로운 고음 금속음
            sweep('sawtooth', 3200, 200, 0.40, 0.07, 200);
            noise(0.50, 0.05, 'highpass', 5000);
            osc('sine', 880, 0.15, 0.10);
        } else if (cls === 10) {
            // 마창사: 마창 — 전기 충격 + 날카로운 베임
            sweep('sawtooth', 2000, 100, 0.35, 0.10, 250);
            noise(0.45, 0.07, 'bandpass', 2500);
        } else if (cls === 11) {
            // 귀신병: 허공 타격 — 유령 같은 스쳐지나감
            sweep('sine', 800, 1600, 0.20, 0.08);
            noise(0.35, 0.06, 'highpass', 3500);
        } else if (cls === 12) {
            // 폭탄병: 둔탁한 철제 타격
            sweep('sawtooth', 200, 28, 0.70, 0.15, 500);
            noise(0.50, 0.10, 'lowpass', 400);
        } else if (cls === 13) {
            // 빙술사: 냉기 타격 — 얼음 결정 파열
            sweep('sine', 2200, 300, 0.28, 0.09);
            noise(0.40, 0.06, 'highpass', 4500);
            osc('sine', 1100, 0.15, 0.12);
        } else if (cls === 14) {
            // 무당: 저주 접촉 — 오싹한 공명
            sweep('sine', 180, 60, 0.30, 0.20);
            noise(0.40, 0.12, 'bandpass', 400);
        } else if (cls === 7) {
            // 조커: 경쾌한 손장난 — 카드 슬랩
            noise(0.55, 0.04, 'highpass', 3000);
            sweep('sawtooth', 1200, 80, 0.28, 0.08, 200);
        } else if (cls === 16) {
            // 분신술사: 다중 타격 — 잔상 충격음
            sweep('sawtooth', 1000, 80, 0.25, 0.08);
            setTimeout(() => { if (audioCtx) sweep('sawtooth', 1200, 100, 0.20, 0.07); }, 40);
            setTimeout(() => { if (audioCtx) sweep('sawtooth', 1400, 120, 0.15, 0.06); }, 80);
        } else if (cls === 17) {
            // 연금술사: 플라스크 타격 — 유리 파열 + 액체 튐
            noise(0.60, 0.05, 'highpass', 4000);
            sweep('sine', 800, 200, 0.25, 0.12);
            noise(0.35, 0.08, 'bandpass', 1000);
        } else if (cls === 18) {
            // 선봉대: 방패 타격 — 묵직한 금속 충격
            sweep('sawtooth', 280, 30, 0.80, 0.18, 500);
            noise(0.55, 0.08, 'lowpass', 450);
            noise(0.35, 0.06, 'bandpass', 900);
        } else {
            // fallback
            sweep('sawtooth', 800, 80, 0.30, 0.12);
        }
    }
    else if (type === 'enemy_atk') {
        // 몬스터 타격: 둔탁한 마찰 + 살점 충격
        sweep('sawtooth', 320, 38, 0.65, 0.18, 400);
        noise(0.55, 0.10, 'lowpass', 350);
        noise(0.30, 0.06, 'bandpass', 700);
    }
    else if (type === 'mob_laser') {
        sweep('sawtooth', 2200, 400, 0.4, 0.3, 300);
        osc('sine', 1100, 0.15, 0.25);
    }
    else if (type === 'gun_shot') {
        noise(1.0, 0.025, 'highpass', 4500);
        noise(0.45, 0.06, 'bandpass', 1600);
        sweep('sawtooth', 240, 28, 0.50, 0.12, 500);
    }
    else if (type === 'boss_atk') {
        // 보스 타격: 지진 같은 저음 폭발
        sweep('sawtooth', 80, 14, 1.0, 0.55, 600);
        noise(0.70, 0.20, 'lowpass', 300);
        osc('sine', 42, 0.55, 0.45);
        noise(0.30, 0.12, 'bandpass', 600);
    }
    else if (type === 'hit') {
        // 피격: 살에 박히는 둔탁한 충격
        sweep('sawtooth', 480, 55, 0.60, 0.18, 400);
        noise(0.50, 0.06, 'highpass', 2000);
        noise(0.35, 0.12, 'lowpass', 400);
    }
    else if (type === 'parry') {
        // 패링: 금속 격돌 + 고음 섬광
        noise(0.80, 0.05, 'highpass', 5000);
        sweep('sawtooth', 2400, 80, 0.60, 0.12, 500);
        osc('sine', 1760, 0.35, 0.18);
        osc('sine', 3520, 0.20, 0.10);
        noise(0.40, 0.15, 'bandpass', 2800);
    }
    else if (type === 'skill') {
        const cls = (typeof Game !== 'undefined') ? (Game.pClass || 0) : 0;
        if (cls === 0) {
            // 검사: 강렬한 대검 수평베기
            sweep('sawtooth', 180, 22, 0.85, 0.55, 700);
            noise(0.65, 0.35, 'bandpass', 1800);
            noise(0.40, 0.20, 'highpass', 4000);
        } else if (cls === 1) {
            // 도적: 공간 찢는 순간이동
            noise(0.80, 0.04, 'highpass', 6000);
            sweep('sawtooth', 4000, 50, 0.60, 0.08, 300);
            setTimeout(() => { if (audioCtx) { noise(0.50, 0.03, 'highpass', 5000); } }, 80);
        } else if (cls === 2) {
            // 마법사: 얼음 블랙홀 — 냉기 흡수음 + 저주파 공명
            sweep('sine', 800, 60, 0.45, 0.55, 700);
            noise(0.50, 0.40, 'bandpass', 600);
            osc('sine', 80, 0.35, 0.60);
            setTimeout(() => { if (audioCtx) { noise(0.30, 0.25, 'lowpass', 400); } }, 120);
        } else if (cls === 3) {
            // 버서커: 짐승 같은 충격파 슬램
            sweep('sawtooth', 55, 10, 1.0, 0.80, 800);
            noise(0.75, 0.50, 'lowpass', 800);
            [2000, 1000, 500].forEach((f, i) => setTimeout(() => { if (audioCtx) { noise(0.35, 0.12, 'bandpass', f); } }, i * 70));
        } else if (cls === 4) {
            // 헌터: 크루 소환 — 군사 신호음 + 금속 울림
            osc('square', 440, 0.25, 0.08);
            osc('square', 660, 0.20, 0.06);
            setTimeout(() => { if (audioCtx) { osc('square', 880, 0.22, 0.10); noise(0.35, 0.15, 'bandpass', 2200); } }, 90);
            setTimeout(() => { if (audioCtx) { noise(0.40, 0.20, 'highpass', 3000); } }, 180);
        } else if (cls === 5) {
            // 성기사: 신성 회오리 — 찬란한 빛의 폭발
            sweep('sine', 440, 1760, 0.45, 0.35);
            noise(0.55, 0.25, 'highpass', 3000);
            osc('sine', 220, 0.30, 0.50);
            osc('sine', 440, 0.20, 0.40);
        } else if (cls === 6) {
            // 혈귀: 혈기격 — 폭발적 혈창 해방
            sweep('sawtooth', 80, 20, 1.0, 0.55, 600);
            noise(0.70, 0.35, 'lowpass', 600);
            noise(0.45, 0.20, 'bandpass', 1200);
            setTimeout(() => { if (audioCtx) { sweep('sawtooth', 400, 40, 0.50, 0.30, 400); } }, 80);
        } else if (cls === 7) {
            // 조커: 와일드카드 — 카드 7장 연속 투척
            osc('square', 880, 0.25, 0.08);
            setTimeout(() => { if (audioCtx) osc('square', 660, 0.20, 0.06); }, 80);
            setTimeout(() => {
                if (!audioCtx) return;
                if (Math.random() < 0.5) {
                    sweep('sawtooth', 150, 20, 1.0, 0.60, 700); noise(0.80, 0.40, 'lowpass', 400);
                } else {
                    sweep('sine', 400, 40, 0.60, 0.40); noise(0.50, 0.20, 'highpass', 2000);
                }
            }, 180);
        } else {
            sweep('sine', 440, 880, 0.35, 0.40);
            noise(0.40, 0.25, 'highpass', 2500);
        }
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
    else if (type === 'typing') {
        // 기계식 타건음 — 클릭(noise) + 바디(low thud) + 고음 딱 소리
        const t0 = audioCtx.currentTime;
        // 타건 충격 노이즈 (딱)
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const hi = audioCtx.createBiquadFilter(); hi.type = 'highpass'; hi.frequency.value = 5000;
            const gn = audioCtx.createGain();
            gn.gain.setValueAtTime(0.28, t0); gn.gain.exponentialRampToValueAtTime(0.001, t0 + 0.018);
            src.connect(hi); hi.connect(gn); gn.connect(audioCtx.destination); src.start(t0);
        }
        // 바디 저음 (두드림감)
        if (noiseBuffer) {
            const src2 = audioCtx.createBufferSource(); src2.buffer = noiseBuffer;
            const lo = audioCtx.createBiquadFilter(); lo.type = 'bandpass'; lo.frequency.value = 300; lo.Q.value = 1.5;
            const gn2 = audioCtx.createGain();
            gn2.gain.setValueAtTime(0.18, t0); gn2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
            src2.connect(lo); lo.connect(gn2); gn2.connect(audioCtx.destination); src2.start(t0);
        }
        // 고음 클릭 톤 (약하게)
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.type = 'square'; o.frequency.value = 1800 + Math.random() * 600;
        g.gain.setValueAtTime(0.06, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.012);
        o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0 + 0.012);
    }
    else if (type === 'reload_click') {
        // 발키리 재장전 불가 — 찰칵(금속 클릭) 소리
        const t0 = audioCtx.currentTime;
        // 임팩트 노이즈 (짧고 날카로운 금속음)
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
            const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 8000; bp.Q.value = 6;
            const gn = audioCtx.createGain();
            gn.gain.setValueAtTime(0.35, t0); gn.gain.exponentialRampToValueAtTime(0.001, t0 + 0.025);
            src.connect(hp); hp.connect(bp); bp.connect(gn); gn.connect(audioCtx.destination); src.start(t0);
        }
        // 금속 탁음 (낮은 딱)
        const o1 = audioCtx.createOscillator(); const g1 = audioCtx.createGain();
        o1.type = 'square'; o1.frequency.setValueAtTime(3200, t0); o1.frequency.exponentialRampToValueAtTime(1200, t0 + 0.015);
        g1.gain.setValueAtTime(0.18, t0); g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.018);
        o1.connect(g1); g1.connect(audioCtx.destination); o1.start(t0); o1.stop(t0 + 0.02);
        // 공명 잔향 (짧게)
        const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
        o2.type = 'sine'; o2.frequency.value = 900;
        g2.gain.setValueAtTime(0.06, t0 + 0.01); g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
        o2.connect(g2); g2.connect(audioCtx.destination); o2.start(t0 + 0.01); o2.stop(t0 + 0.06);
    }

    else if (type === 'unlock') {
        // 해금: 상승 팡파레 + 반짝임
        [220, 330, 440, 660, 880].forEach((f, i) => {
            setTimeout(() => {
                if (!audioCtx) return;
                osc('sine', f, 0.22, 0.25);
                if (i === 4) osc('triangle', f * 1.5, 0.12, 0.4);
            }, i * 80);
        });
        setTimeout(() => { if (audioCtx) sweep('sawtooth', 880, 1760, 0.18, 0.5, 200); }, 380);
    }
    else if (type === 'menu_select') {
        // 메뉴 선택: 짧고 깔끔한 클릭음
        const t0 = audioCtx.currentTime;
        osc('sine', 660, 0.14, 0.08);
        setTimeout(() => { if (audioCtx) osc('sine', 880, 0.08, 0.07); }, 50);
    }
    else if (type === 'dash') {
        // 대시: 공기 파열 + 마찰 파쇄음
        noise(0.75, 0.035, 'highpass', 4500);
        noise(0.45, 0.08, 'bandpass', 1800);
        sweep('sawtooth', 1200, 80, 0.22, 0.07, 200);
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
    else if (type === 'reload_click') {
        // 탄창 교체: 금속 클릭음 두 번
        noise(0.4, 0.04, 'highpass', 3800);
        sweep('square', 1100, 500, 0.18, 0.07);
        setTimeout(() => {
            if (!audioCtx) return;
            const t2 = audioCtx.currentTime;
            const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
            o2.type = 'square'; o2.frequency.value = 850;
            g2.gain.setValueAtTime(0.14, t2); g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.05);
            o2.connect(g2); g2.connect(audioCtx.destination); o2.start(t2); o2.stop(t2 + 0.05);
        }, 95);
    }
}

// ── BGM ──────────────────────────────────────

// scene에 맞는 BGM 인터벌을 시작 — 이미 재생 중이면 중복 실행 방지
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

    // ── 로비 BGM: 바람소리 + 웅장한 저음 분위기 ──────────
    if (scene === 'lobby') {
        // 바람 소리 — 노이즈 기반 필터링
        function _windLayer() {
            if (!isBgmPlaying || Game.isMuted) return;
            if (!noiseBuffer) return;
            const now = audioCtx.currentTime;
            const src = audioCtx.createBufferSource();
            src.buffer = noiseBuffer;
            src.loop = true;
            const filt = audioCtx.createBiquadFilter();
            filt.type = 'bandpass';
            filt.frequency.value = 400 + Math.random() * 200;
            filt.Q.value = 0.4;
            const gWind = audioCtx.createGain();
            gWind.gain.setValueAtTime(0, now);
            gWind.gain.linearRampToValueAtTime(0.10, now + 3.0);
            gWind.gain.linearRampToValueAtTime(0.06, now + 7.0);
            gWind.gain.linearRampToValueAtTime(0, now + 9.0);
            src.connect(filt); filt.connect(gWind); gWind.connect(audioCtx.destination);
            src.start(now); src.stop(now + 9.0);
        }
        bgmInterval2 = setInterval(_windLayer, 8000);
        _windLayer();

        // 웅장한 저음 화음 — 완전5도 드론
        // C2=65, G2=98, E2=82 (플랫 없음, 자연 단음계)
        const droneSeq = [
            [65, 98],   // C-G
            [65, 98],
            [55, 82],   // A-E
            [58, 87],   // A#-F (반음 한 번만)
            [65, 98],
            [65, 98],
            [61, 92],   // B-F# (자연스러운 긴장감)
            [65, 98],
        ];
        let di = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { di++; return; }
            const now = audioCtx.currentTime;
            const pair = droneSeq[di % droneSeq.length];
            pair.forEach((freq, pi) => {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = pi === 0 ? 'sine' : 'triangle';
                o.frequency.setValueAtTime(freq, now);
                const vol = pi === 0 ? 0.10 : 0.06;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(vol, now + 0.6);
                g.gain.setValueAtTime(vol, now + 2.8);
                g.gain.exponentialRampToValueAtTime(0.001, now + 3.8);
                o.connect(g); g.connect(audioCtx.destination);
                o.start(now); o.stop(now + 3.8);
            });
            di++;
        }, 3800);
        return;
    }

    // ── 프롤로그 BGM: 음산하고 절망적, 프리지안 선법 + 플랫 다수 ────────────
    if (scene === 'prologue') {
        // A Phrygian: A1=55, Bb1=58, C2=65, D2=73, Eb2=78, F2=87, G2=98, Ab2=104, A2=110
        // 반음 하강(Bb)을 강조 — 절망과 무거움의 특징
        const melody = [
            55,  0,   0,   0,    // A1 (지속 — 무거운 시작)
            58,  0,   0,   0,    // Bb1 (반음 강하 — 절망)
            65,  0,   0,   0,    // C2
            58,  0,   0,   0,    // Bb1 (반복 — 집착)
            55,  0,   0,   0,    // A1
            0,   0,   0,   0,    // 침묵 (숨막힘)
            73,  0,   0,   78,   // D2 — Eb2 (플랫 상승 — 긴장)
            87,  0,   0,   0,    // F2
            104, 0,   0,   0,    // Ab2 (증4도 — 불협화 절정)
            87,  0,   78,  0,    // F2 — Eb2 (하강)
            73,  0,   65,  0,    // D2 — C2
            58,  0,   0,   55,   // Bb1 — A1 (암울한 종지)
            55,  0,   0,   0,    // A1 (지속)
            0,   0,   0,   0,    // 침묵
            55,  0,   0,   0,    // A1 (다시 반복)
            58,  0,   0,   0,    // Bb1
        ];
        let ps = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { ps++; return; }
            const now = audioCtx.currentTime;
            const freq = melody[ps % melody.length];
            if (freq > 0) {
                // 메인 멜로디 — 거친 사각파 + 약한 디스토션
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(60);
                o.type = 'sawtooth'; o.frequency.value = freq;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.20, now + 0.25);
                g.gain.setValueAtTime(0.20, now + 0.55);
                g.gain.exponentialRampToValueAtTime(0.001, now + 1.7);
                o.connect(dw); dw.connect(g); g.connect(audioCtx.destination);
                o.start(now); o.stop(now + 1.7);
                // 옥타브 위 희미한 하모닉
                const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
                o2.type = 'sine'; o2.frequency.value = freq * 2;
                g2.gain.setValueAtTime(0, now + 0.1);
                g2.gain.linearRampToValueAtTime(0.045, now + 0.3);
                g2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                o2.connect(g2); g2.connect(audioCtx.destination);
                o2.start(now + 0.1); o2.stop(now + 1.5);
            }
            ps++;
        }, 650);
        // 저음 드론 — A0=27.5, Bb0=29.1, G0=24.5 을 순환하며 불안한 긴장감
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const droneFreqs = [27.5, 29.1, 27.5, 24.5, 27.5, 29.1, 24.5, 27.5];
            const df = droneFreqs[Math.floor(ps / 4) % droneFreqs.length];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = df;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.22, now + 1.2);
            g.gain.setValueAtTime(0.13, now + 3.8);
            g.gain.exponentialRampToValueAtTime(0.001, now + 5.5);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(now); o.stop(now + 5.5);
            // 저역 노이즈 (음산한 숨소리 느낌)
            if (noiseBuffer) {
                const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
                const filt = audioCtx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 180;
                const gn = audioCtx.createGain();
                gn.gain.setValueAtTime(0, now);
                gn.gain.linearRampToValueAtTime(0.03, now + 1.5);
                gn.gain.setValueAtTime(0.04, now + 3.5);
                gn.gain.exponentialRampToValueAtTime(0.001, now + 5.5);
                src.connect(filt); filt.connect(gn); gn.connect(audioCtx.destination); src.start(now);
            }
        }, 5200);
        return;
    }

    // ── 사망 BGM ─────────────────────────────
    if (scene === 'dead') {
        // 템포 2배 느리게(700→1400ms), 음 낮게(반음 낮춤 *0.84)
        const deadNotes = [92, 82, 73, 69, 65, 58, 55, 46];
        let ds = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { ds++; return; }
            const now = audioCtx.currentTime;
            const freq = deadNotes[ds % deadNotes.length];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(180);
            o.type = 'sawtooth'; o.frequency.value = freq;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.30, now + 0.3);
            g.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
            o.connect(dw); dw.connect(g); g.connect(audioCtx.destination);
            o.start(now); o.stop(now + 2.6);
            const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
            o2.type = 'sine'; o2.frequency.value = freq * 1.5;
            g2.gain.setValueAtTime(0.06, now + 0.2); g2.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
            o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now + 0.2); o2.stop(now + 2.2);
            ds++;
        }, 1400);
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = 20.6;
            g.gain.setValueAtTime(0.16, now); g.gain.exponentialRampToValueAtTime(0.001, now + 5.5);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 5.5);
        }, 5600);
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
            g.gain.setValueAtTime(0.09, now); g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
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
            g.gain.setValueAtTime(0.11, now); g.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 2.8);
        }, 3040);
        return;
    }

    // ── 엔딩 다크 BGM: 음산한 D minor + tritone ──────────────
    if (scene === 'ending_dark') {
        // D natural minor: D=73, E=82, F=87, G=98, A=110, Bb=116, C=130
        // tritone: Ab/G#=104 추가로 극적 불협화음
        const darkMel = [
            73,  0,   0,   0,    // D2 (무거운 시작)
            87,  0,   0,   0,    // F2
            73,  0,   0,   0,    // D2
            104, 0,   0,   0,    // Ab2 (증4도 — 암울)
            98,  0,   0,   0,    // G2
            87,  0,   0,   0,    // F2
            82,  0,   0,   0,    // E2
            73,  0,   0,   0,    // D2 (종지)
            0,   0,   0,   0,    // 침묵
            116, 0,   0,   0,    // Bb2 (반음 상행 — 절망)
            104, 0,   0,   0,    // Ab2
            98,  0,   0,   0,    // G2
            87,  0,   0,   0,    // F2
            73,  0,   0,   0,    // D2
            0,   0,   0,   0,
            73,  0,   0,   0,
        ];
        let ds = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { ds++; return; }
            const now = audioCtx.currentTime;
            const freq = darkMel[ds % darkMel.length];
            if (freq > 0) {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(50);
                o.type = 'sawtooth'; o.frequency.value = freq;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.18, now + 0.2);
                g.gain.setValueAtTime(0.18, now + 0.5);
                g.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
                o.connect(dw); dw.connect(g); g.connect(audioCtx.destination);
                o.start(now); o.stop(now + 1.6);
                // 옥타브 아래 하모닉
                const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
                o2.type = 'sine'; o2.frequency.value = freq * 0.5;
                g2.gain.setValueAtTime(0, now); g2.gain.linearRampToValueAtTime(0.08, now + 0.3);
                g2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
                o2.connect(g2); g2.connect(audioCtx.destination);
                o2.start(now); o2.stop(now + 1.4);
            }
            ds++;
        }, 620);
        // 저음 드론 D1 + 저역 노이즈
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const drones = [36.7, 38.9, 36.7, 32.7]; // D1, E1, D1, C1
            const df = drones[Math.floor(ds / 4) % drones.length];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = df;
            g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.12, now + 1.5);
            g.gain.setValueAtTime(0.12, now + 3.5); g.gain.exponentialRampToValueAtTime(0.001, now + 5.0);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(now); o.stop(now + 5.0);
            if (noiseBuffer) {
                const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
                const filt = audioCtx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 150;
                const gn = audioCtx.createGain();
                gn.gain.setValueAtTime(0, now); gn.gain.linearRampToValueAtTime(0.06, now + 2.0);
                gn.gain.exponentialRampToValueAtTime(0.001, now + 5.0);
                src.connect(filt); filt.connect(gn); gn.connect(audioCtx.destination); src.start(now);
            }
        }, 4800);
        return;
    }

    // ── 엔딩 브라이트 BGM: 안식의 화원 — C Major 4성부 풀 화성 ──
    if (scene === 'ending_bright') {
        const STEP = 430; // ~70 BPM 8분음표

        // 주선율 (C major 32스텝 — 상승→안식 구조)
        const mel = [
            523, 659, 784, 659,   // C5 E5 G5 E5
            587, 523, 440, 392,   // D5 C5 A4 G4
            440, 523, 659, 784,   // A4 C5 E5 G5
            880, 784, 659, 0,     // A5 G5 E5 —
            523, 494, 440, 392,   // C5 B4 A4 G4
            440, 523, 494, 440,   // A4 C5 B4 A4
            392, 494, 587, 659,   // G4 B4 D5 E5
            523, 0,   0,   0,     // C5 — — —
        ];

        // 화음성부 (멜로디 3도 아래 — 대위 내성)
        const harm = [
            440, 523, 659, 523,   // A4 C5 E5 C5
            494, 440, 349, 329,   // B4 A4 F4 E4
            349, 440, 523, 659,   // F4 A4 C5 E5
            698, 659, 523, 0,     // F5 E5 C5 —
            440, 392, 349, 329,   // A4 G4 F4 E4
            349, 440, 392, 349,   // F4 A4 G4 F4
            329, 392, 494, 523,   // E4 G4 B4 C5
            440, 0,   0,   0,     // A4 — — —
        ];

        let ms = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { ms++; return; }
            const now = audioCtx.currentTime;
            const mf = mel[ms % mel.length];
            const hf = harm[ms % harm.length];

            if (mf > 0) {
                // 주선율: sine 뮤직박스 + 5도 triangle + 2옥타브 반짝임
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.type = 'sine'; o.frequency.value = mf;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.22, now + 0.015);
                g.gain.setValueAtTime(0.18, now + 0.30);
                g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
                o.connect(g); g.connect(audioCtx.destination);
                o.start(now); o.stop(now + 1.4);

                const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
                o2.type = 'triangle'; o2.frequency.value = mf * 1.5;
                g2.gain.setValueAtTime(0, now + 0.005);
                g2.gain.linearRampToValueAtTime(0.055, now + 0.015);
                g2.gain.exponentialRampToValueAtTime(0.001, now + 0.70);
                o2.connect(g2); g2.connect(audioCtx.destination);
                o2.start(now + 0.005); o2.stop(now + 0.70);

                const o3 = audioCtx.createOscillator(), g3 = audioCtx.createGain();
                o3.type = 'sine'; o3.frequency.value = mf * 4;
                g3.gain.setValueAtTime(0.018, now);
                g3.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                o3.connect(g3); g3.connect(audioCtx.destination);
                o3.start(now); o3.stop(now + 0.18);
            }

            if (hf > 0) {
                // 3도 내성: 부드러운 triangle
                const oh = audioCtx.createOscillator(), gh = audioCtx.createGain();
                oh.type = 'triangle'; oh.frequency.value = hf;
                gh.gain.setValueAtTime(0, now + 0.04);
                gh.gain.linearRampToValueAtTime(0.09, now + 0.14);
                gh.gain.setValueAtTime(0.07, now + 0.35);
                gh.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
                oh.connect(gh); gh.connect(audioCtx.destination);
                oh.start(now + 0.04); oh.stop(now + 1.1);

                // 내성 옥타브 위 (투명한 공기감)
                const oh2 = audioCtx.createOscillator(), gh2 = audioCtx.createGain();
                oh2.type = 'sine'; oh2.frequency.value = hf * 2;
                gh2.gain.setValueAtTime(0, now + 0.06);
                gh2.gain.linearRampToValueAtTime(0.030, now + 0.16);
                gh2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                oh2.connect(gh2); gh2.connect(audioCtx.destination);
                oh2.start(now + 0.06); oh2.stop(now + 0.65);
            }

            ms++;
        }, STEP);

        // 패드 코드 — C / Am / C / G (각 8스텝 = 3440ms, 5성부)
        const pads = [
            [130, 196, 261, 329, 392],   // C: C3 G3 C4 E4 G4
            [110, 165, 220, 329, 440],   // Am: A2 E3 A3 E4 A4
            [130, 196, 261, 329, 392],   // C: C3 G3 C4 E4 G4
            [98,  147, 196, 294, 392],   // G: G2 D3 G3 D4 G4
        ];
        const padVols = [0.09, 0.08, 0.07, 0.06, 0.05];
        let pc = 0;
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { pc++; return; }
            const now = audioCtx.currentTime;
            const chord = pads[pc % pads.length];
            const dur = STEP * 8 / 1000;

            // 5성부 패드 (긴 어택, 따뜻한 sine/triangle 혼합)
            chord.forEach((f, ci) => {
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.type = ci < 2 ? 'sine' : 'triangle';
                o.frequency.value = f;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(padVols[ci], now + 0.65);
                g.gain.setValueAtTime(padVols[ci], now + dur - 0.75);
                g.gain.exponentialRampToValueAtTime(0.001, now + dur);
                o.connect(g); g.connect(audioCtx.destination);
                o.start(now); o.stop(now + dur);
            });

            // 하프 아르페지오 (코드 교체 시 5성부 순차 글리산도)
            chord.forEach((f, ai) => {
                const oa = audioCtx.createOscillator(), ga = audioCtx.createGain();
                oa.type = 'sine'; oa.frequency.value = f * 2;
                const delay = ai * 0.09;
                ga.gain.setValueAtTime(0, now + delay);
                ga.gain.linearRampToValueAtTime(0.016, now + delay + 0.008);
                ga.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.55);
                oa.connect(ga); ga.connect(audioCtx.destination);
                oa.start(now + delay); oa.stop(now + delay + 0.55);
            });

            pc++;
        }, STEP * 8);

        // 베이스 라인 — 코드 루트 저음 (4스텝 = 1720ms, 2박자 간격)
        const bassFreqs = [
            65, 65,   // C: C2
            55, 55,   // Am: A1
            65, 65,   // C: C2
            49, 49,   // G: G1
        ];
        let bs = 0;
        bgmInterval3 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { bs++; return; }
            const now = audioCtx.currentTime;
            const f = bassFreqs[bs % bassFreqs.length];
            const dur = STEP * 4 / 1000;

            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.18, now + 0.10);
            g.gain.setValueAtTime(0.12, now + dur - 0.20);
            g.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.10);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(now); o.stop(now + dur + 0.10);

            // 베이스 2배음 (따뜻한 보디감)
            const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
            o2.type = 'triangle'; o2.frequency.value = f * 2;
            g2.gain.setValueAtTime(0, now);
            g2.gain.linearRampToValueAtTime(0.07, now + 0.08);
            g2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.7);
            o2.connect(g2); g2.connect(audioCtx.destination);
            o2.start(now); o2.stop(now + dur * 0.7);

            bs++;
        }, STEP * 4);

        return;
    }

    // ── 전투 BGM ─────────────────────────────────────────────────────────
    const isBoss      = scene === 'play' && Game.levelN === 3;
    const wg          = typeof getWg === 'function' ? getWg() : 1;
    const isFinalBoss = Game.worldN === 10 && isBoss;

    const midi = n => 440 * Math.pow(2, (n - 69) / 12);

    // ── 드럼/악기 헬퍼 ──────────────────────────────────────────────────
    function _kick(vol) {
        const now = audioCtx.currentTime;
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(110, now);
        o.frequency.exponentialRampToValueAtTime(42, now + 0.07);
        g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
        o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.30);
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
            const gN = audioCtx.createGain();
            gN.gain.setValueAtTime(vol * 0.45, now); gN.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            src.connect(lp); lp.connect(gN); gN.connect(audioCtx.destination); src.start(now);
        }
    }
    function _snare(vol) {
        const now = audioCtx.currentTime;
        if (noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.0;
            const g = audioCtx.createGain();
            g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
            src.connect(bp); bp.connect(g); g.connect(audioCtx.destination); src.start(now);
        }
        const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
        o2.type = 'triangle'; o2.frequency.value = 165;
        g2.gain.setValueAtTime(vol * 0.5, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now); o2.stop(now + 0.07);
    }
    function _hihat(vol) {
        if (!noiseBuffer) return;
        const now = audioCtx.currentTime;
        const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
        const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        src.connect(hp); hp.connect(g); g.connect(audioCtx.destination); src.start(now);
    }
    function _bassNote(freq, vol, dur) {
        const now = audioCtx.currentTime;
        const o = audioCtx.createOscillator(); const dw = audioCtx.createWaveShaper(); const g = audioCtx.createGain();
        o.type = 'sawtooth'; o.frequency.value = freq; dw.curve = _makeDistortion(170);
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol, now + 0.035);
        g.gain.setValueAtTime(vol, now + dur * 0.65); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        o.connect(dw); dw.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + dur);
        const oS = audioCtx.createOscillator(); const gS = audioCtx.createGain();
        oS.type = 'sine'; oS.frequency.value = freq * 0.5;
        gS.gain.setValueAtTime(0, now); gS.gain.linearRampToValueAtTime(vol * 0.55, now + 0.05);
        gS.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.75);
        oS.connect(gS); gS.connect(audioCtx.destination); oS.start(now); oS.stop(now + dur);
    }
    // 일렉기타 파워코드: 톱니파+강왜곡, root+5th 레이어
    function _guitar(freq, vol, dur) {
        const now = audioCtx.currentTime;
        [freq, freq * 1.498].forEach((f, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(680);
            o.type = 'sawtooth'; o.frequency.value = f;
            const v = i === 0 ? vol : vol * 0.50;
            g.gain.setValueAtTime(v, now); g.gain.setValueAtTime(v * 0.72, now + 0.022);
            g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            o.connect(dw); dw.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + dur);
        });
    }

    // ── 마왕 Final Boss: 심연의 저음 + 망자의 울부짖음 ──────────────────
    if (isFinalBoss) {
        function _deathBass() {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(34, now);
            o.frequency.exponentialRampToValueAtTime(22, now + 1.8);
            g.gain.setValueAtTime(0.24, now); g.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 3.0);
            if (noiseBuffer) {
                const src2 = audioCtx.createBufferSource(); src2.buffer = noiseBuffer;
                const lp2 = audioCtx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 65;
                const gN2 = audioCtx.createGain();
                gN2.gain.setValueAtTime(0.18, now); gN2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                src2.connect(lp2); lp2.connect(gN2); gN2.connect(audioCtx.destination); src2.start(now);
            }
        }
        function _ghostMoan() {
            if (!noiseBuffer || !isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const o = audioCtx.createOscillator(); const go = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(90 + Math.random() * 35, now);
            o.frequency.linearRampToValueAtTime(70 + Math.random() * 25, now + 4.2);
            go.gain.setValueAtTime(0, now); go.gain.linearRampToValueAtTime(0.05, now + 1.2);
            go.gain.setValueAtTime(0.05, now + 3.5); go.gain.linearRampToValueAtTime(0, now + 4.8);
            o.connect(go); go.connect(audioCtx.destination); o.start(now); o.stop(now + 5.0);
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer; src.loop = true;
            const bp1 = audioCtx.createBiquadFilter(); bp1.type = 'bandpass'; bp1.Q.value = 22;
            const bp2 = audioCtx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 730; bp2.Q.value = 5;
            const gn = audioCtx.createGain();
            bp1.frequency.setValueAtTime(230, now); bp1.frequency.linearRampToValueAtTime(310, now + 2.5);
            bp1.frequency.linearRampToValueAtTime(230, now + 5.0);
            gn.gain.setValueAtTime(0, now); gn.gain.linearRampToValueAtTime(0.11, now + 1.2);
            gn.gain.setValueAtTime(0.11, now + 3.8); gn.gain.linearRampToValueAtTime(0, now + 5.2);
            src.connect(bp1); bp1.connect(bp2); bp2.connect(gn); gn.connect(audioCtx.destination);
            src.start(now); src.stop(now + 5.5);
        }
        bgmInterval  = setInterval(_deathBass, 2800); _deathBass();
        bgmInterval2 = setInterval(_ghostMoan, 4500); setTimeout(_ghostMoan, 1500);
        return;
    }

    // ── 보스 BGM: wg별 고유 메탈 트랙 ──────────────────────────────────
    if (isBoss) {
        const wgI  = Math.min(wg - 1, 4); // 0..4
        // wg별 루트음 (저→고)
        const roots = [220, 82, 110, 156, 65];
        const bpms  = [200, 150, 130, 185, 140];
        const root  = roots[wgI];
        const BPM   = bpms[wgI];
        const T     = Math.round(60000 / BPM / 2);

        // wg별 16스텝 기타 리프
        const riffs = [
            // wg1: 공격적 파워메탈 — 갤럽+5도 돌진
            [1,0.75,1,0, 1.498,0,1.498,0, 1,0.75,0.89,0, 1.335,0,1,0],
            // wg2: 고딕 둠 — 무겁고 불협화
            [1,0,0,0, 0.75,0,0,0, 1,0,0,0, 0.89,0,0.75,0],
            // wg3: 헤비 둠 — 5도 으스러짐
            [1,0,0,1.498, 0,0,0,0, 1,0,0,0, 1.25,0,1.498,0],
            // wg4: 테크니컬 메탈 — 싱코페이션
            [1,0,1,0.75, 0,1.498,0,1, 0.89,0,1,0, 1.335,1,0,0.75],
            // wg5: 에픽 파워 — 웅장한 화음 진행
            [1,0,0,0, 1.498,0,1.25,0, 1,0,0,1.335, 1.498,0,1,0],
        ];
        // wg별 킥 패턴
        const kicks = [
            [1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0], // wg1: 갤럽
            [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], // wg2: half-time 둠
            [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], // wg3: sparse
            [1,0,1,0, 0,1,0,0, 1,0,0,1, 0,0,1,0], // wg4: complex
            [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,0,0], // wg5: epic
        ];
        const riff = riffs[wgI];
        const kpat = kicks[wgI];
        const bSeqs = [
            [1,1.498,1.335,1],
            [1,0.89,1,0.75],
            [1,1.498,1,1.25],
            [1,1.335,1.498,1.189],
            [1,1,1.498,1.335],
        ];

        let bi = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { bi++; return; }
            const b = bi % 16;
            if (kpat[b]) _kick(b === 0 ? 0.34 : 0.22);
            if (b === 4 || b === 12) _snare(0.26);
            if (wgI === 0 && bi % 2 === 1) _hihat(0.10);
            if (wgI === 3 && bi % 4 === 2) _hihat(0.08);
            const gm = riff[b];
            if (gm > 0) {
                let next = 1;
                for (let k = 1; k < 5; k++) { if (riff[(b+k)%16] > 0) { next = k; break; } }
                const gVol = wgI === 1 ? 0.14 : wgI === 2 ? 0.15 : 0.10;
                _guitar(root * gm, gVol, Math.max(0.07, T * next * 1.6 / 1000));
            }
            bi++;
        }, T);

        let bpi = 0;
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { bpi++; return; }
            _bassNote(root * 0.5 * bSeqs[wgI][bpi % 4], 0.13, T * 3.5 / 1000);
            bpi++;
        }, T * 2);

        // 불타는 보스 전용: 카오틱 크로매틱 슬라이드 레이어
        const _isBurningBoss = Game.worldN % 2 === 0 && Game.worldN >= 2 && Game.worldN <= 6;
        if (_isBurningBoss) {
            bgmInterval3 = setInterval(() => {
                if (!isBgmPlaying || Game.isMuted) return;
                const now = audioCtx.currentTime;
                const chaos = [root * 1.189, root * 0.943, root * 1.414];
                const cf = chaos[Math.floor(Math.random() * chaos.length)];
                [cf, cf * 1.498].forEach(f => {
                    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                    const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(900);
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(f * 1.05, now);
                    o.frequency.exponentialRampToValueAtTime(f * 0.96, now + T * 3 / 1000);
                    g.gain.setValueAtTime(0.10, now); g.gain.exponentialRampToValueAtTime(0.001, now + T * 3 / 1000);
                    o.connect(dw); dw.connect(g); g.connect(audioCtx.destination);
                    o.start(now); o.stop(now + T * 3 / 1000);
                });
                if (noiseBuffer) {
                    const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
                    const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
                    const gn = audioCtx.createGain();
                    gn.gain.setValueAtTime(0.13, now); gn.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
                    src.connect(hp); hp.connect(gn); gn.connect(audioCtx.destination); src.start(now);
                }
            }, T * 5);
        }
        return;
    }

    // ── wg6(10월드) 잡몹 스테이지: 바람소리 + 저음 "우...우..." 공허 ──────
    if (wg === 6) {
        function _w6Wind() {
            if (!isBgmPlaying || Game.isMuted || !noiseBuffer) return;
            const now = audioCtx.currentTime;
            const src = audioCtx.createBufferSource();
            src.buffer = noiseBuffer; src.loop = true;
            const filt = audioCtx.createBiquadFilter();
            filt.type = 'bandpass';
            filt.frequency.value = 380 + Math.random() * 200;
            filt.Q.value = 0.40;
            const gWind = audioCtx.createGain();
            gWind.gain.setValueAtTime(0, now);
            gWind.gain.linearRampToValueAtTime(0.10, now + 3.0);
            gWind.gain.linearRampToValueAtTime(0.06, now + 7.0);
            gWind.gain.linearRampToValueAtTime(0, now + 9.0);
            src.connect(filt); filt.connect(gWind); gWind.connect(audioCtx.destination);
            src.start(now); src.stop(now + 9.0);
        }
        bgmInterval2 = setInterval(_w6Wind, 8000); _w6Wind();

        // 저음 우...우... 드론
        const w6MoanF = [28, 32, 27, 30, 25, 33, 29, 28];
        let w6mi = 0;
        function _w6Moan() {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const bf = w6MoanF[w6mi % w6MoanF.length];
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(bf, now);
            o.frequency.linearRampToValueAtTime(bf * 1.07, now + 2.0);
            o.frequency.linearRampToValueAtTime(bf * 0.95, now + 4.5);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.12, now + 1.0);
            g.gain.setValueAtTime(0.10, now + 3.8);
            g.gain.exponentialRampToValueAtTime(0.001, now + 5.5);
            o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 5.8);
            if (noiseBuffer) {
                const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
                const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 100;
                const gn = audioCtx.createGain();
                gn.gain.setValueAtTime(0, now);
                gn.gain.linearRampToValueAtTime(0.04, now + 1.2);
                gn.gain.exponentialRampToValueAtTime(0.001, now + 5.0);
                src.connect(lp); lp.connect(gn); gn.connect(audioCtx.destination); src.start(now);
            }
            w6mi++;
        }
        function _w6Schedule() {
            if (!isBgmPlaying) return;
            setTimeout(() => { _w6Moan(); _w6Schedule(); }, 4500 + Math.random() * 4000);
        }
        bgmInterval = setInterval(() => {}, 999999);
        _w6Moan(); _w6Schedule();
        return;
    }

    // ── 일반 스테이지 BGM: wg별 6가지 분위기 ────────────────────────────
    // wg1: 고블린 숲  — G major 발랄한 모험 (빠름)
    // wg2: 스켈레톤   — A minor 불길한 행진 (중간)
    // wg3: 저주 성당  — E Phrygian 고딕 오르간 (느림)
    // wg4: 마족 성채  — B Locrian 산업적 어둠 (공격)
    // wg5: 마왕성 입구 — 드론 공허 (아주 느림)
    // wg6: (위에서 별도 처리)
    const profiles = {
        1: {
            spd: 170, melType:'triangle', bassType:'triangle', melVol:0.16, bassVol:0.11, hihat:true, hhVol:0.09, harmony:false,
            mel:  [392,0,440,494, 587,494,440,0,  392,0,523,494, 440,0,392,0,
                   494,523,587,0, 659,587,523,440, 494,440,392,0, 440,494,587,0],
            bass: [196,0,0,0,    196,0,0,0,       196,0,0,0,     220,0,0,0,
                   247,0,0,0,    220,0,0,0,        196,0,0,0,    196,0,0,0],
        },
        // wg2: 언데드 평원 — A minor 불길한 행진 + 스네어 + 현악 패드
        2: {
            spd: 160, melType:'triangle', bassType:'sawtooth', melVol:0.13, bassVol:0.14, distBass:45,
            snare:true, kickBeats:[0,8,16,24], snareBeats:[4,12,20,28],
            mel:  [220,0,261,0, 247,220,0,196, 220,0,247,0, 294,0,261,247,
                   220,0,175,196, 220,0,0,247, 261,247,220,0, 196,0,220,0,
                   330,0,294,0, 261,247,0,220, 294,0,330,0, 349,0,294,261,
                   220,0,196,175, 196,175,0,0, 220,247,261,0, 220,0,0,0],
            bass: [110,0,0,0,  98,0,0,0,  110,0,0,0,  123,0,0,0,
                   110,0,0,0,  98,0,0,0,  87,0,0,0,   110,0,0,0,
                   165,0,0,0,  147,0,0,0, 165,0,0,0,  175,0,0,0,
                   110,0,0,0,  98,0,0,0,  110,0,0,0,  110,0,0,0],
        },
        // wg3: 저주 성당 — E Phrygian 고딕 오르간 + 합창 + 타종
        3: {
            spd: 230, melType:'sine', bassType:'sine', melVol:0.10, bassVol:0.15,
            organ:true, choir:true,
            mel:  [165,0,175,196, 175,165,0,0,   196,0,220,0,   175,165,0,131,
                   165,0,147,0,   131,0,165,175, 196,175,165,0, 147,0,131,0,
                   220,0,196,0,   175,196,220,0, 247,0,220,196, 175,0,165,0,
                   131,0,147,165, 175,165,131,0, 110,0,131,0,   165,0,0,0],
            bass: [82,0,0,0,  87,0,0,0,   82,0,0,0,  65,0,0,0,
                   82,0,0,0,  65,0,0,0,   82,0,0,0,  87,0,0,0,
                   110,0,0,0, 98,0,0,0,   87,0,0,0,  82,0,0,0,
                   65,0,0,0,  73,0,0,0,   82,0,0,0,  82,0,0,0],
        },
        // wg4: 마족 성채 — B Locrian 산업 어둠 + 킥 + 금속 타격 + 왜곡 기타
        4: {
            spd: 140, melType:'sawtooth', bassType:'sawtooth', melVol:0.12, bassVol:0.17,
            distMel:160, distBass:220, kick:true, metalHit:true,
            mel:  [247,0,0,349, 0,247,261,0, 220,0,247,0, 294,261,247,220,
                   247,0,349,0, 294,0,261,0, 247,220,0,247, 196,0,220,0,
                   311,0,0,370, 0,311,294,0, 261,0,311,0,  349,311,294,261,
                   247,0,0,294, 261,0,247,0, 220,196,0,220, 247,0,0,0],
            bass: [123,0,0,0, 116,0,0,0, 123,0,116,0, 130,0,0,0,
                   123,0,0,0, 116,0,0,0, 110,0,116,0, 123,0,0,0,
                   156,0,0,0, 147,0,0,0, 156,0,147,0, 165,0,0,0,
                   123,0,0,0, 116,0,0,0, 110,0,0,0,   123,0,0,0],
        },
        // wg5: 마왕성 입구 — 핏빛 드론 + 유령 멜로디 + 저음 맥동
        5: {
            spd: 380, melType:'sine', bassType:'sine', melVol:0.10, bassVol:0.16,
            drone:true, ghostMel:true,
            mel:  [110,0,0,0, 98,0,0,0,  116,0,0,0, 110,0,0,0,
                   104,0,0,0, 98,0,0,0,  87,0,0,0,  110,0,0,0,
                   116,0,0,0, 110,0,98,0, 87,0,0,0,  98,0,0,0,
                   104,0,0,0, 98,0,0,0,  116,0,98,0, 110,0,0,0],
            bass: [55,0,0,0, 0,0,0,0, 55,0,0,0, 58,0,0,0,
                   55,0,0,0, 0,0,0,0, 49,0,0,0, 55,0,0,0,
                   58,0,0,0, 0,0,0,0, 55,0,0,0, 52,0,0,0,
                   55,0,0,0, 0,0,0,0, 58,0,0,0, 55,0,0,0],
        },
        6: {
            spd: 860, melType:'sine', bassType:'sine', melVol:0, bassVol:0, drone:true, ghost:true,
            mel:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,
                   0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            bass: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,
                   0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
    };
    const p = profiles[Math.min(wg, 6)] || profiles[1];
    const _isBurning = Game.worldN % 2 === 0 && Game.worldN >= 2 && Game.worldN <= 6;

    // 불타는 월드: 메탈 전용 BGM (일반 BGM 없이 기타+드럼만)
    if (_isBurning) {
        const bRoots = [0, 110, 98, 82];
        const bBPMs  = [0, 188, 168, 148];
        const bRoot  = bRoots[Math.min(wg, 3)] || 110;
        const bBPM   = bBPMs[Math.min(wg, 3)] || 168;
        const bT     = Math.round(60000 / bBPM / 2);
        const bRiff  = [1,0,1.498,0, 1,0,1.335,1.498, 1,0,0.89,0, 1.498,0,1,0];
        let bri = 0;
        bgmInterval = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { bri++; return; }
            const b2 = bri % bRiff.length;
            if (bRiff[b2] > 0) _guitar(bRoot * bRiff[b2], 0.14, bT * 1.2 / 1000);
            if (b2 === 0 || b2 === 8) _kick(0.34);
            if (b2 === 4 || b2 === 12) _snare(0.24);
            bri++;
        }, bT);
        const bSeq = [1, 0.75, 0.89, 0.75];
        let bsi = 0;
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { bsi++; return; }
            _bassNote(bRoot * 0.5 * bSeq[bsi % 4], 0.13, bT * 3.0 / 1000);
            bsi++;
        }, bT * 2);
        return;
    }

    let si = 0;

    bgmInterval = setInterval(() => {
        if (!isBgmPlaying || Game.isMuted) { si++; return; }
        const now = audioCtx.currentTime;
        const b   = si % p.mel.length;
        const rB  = b;
        const nd  = p.spd * 0.88 / 1000;

        const mf = p.mel[rB];
        if (mf > 0) {
            const om = audioCtx.createOscillator(); const gm = audioCtx.createGain();
            om.type = p.melType;
            om.frequency.value = mf;
            if (p.distMel) {
                const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(p.distMel);
                om.connect(dw); dw.connect(gm);
            } else { om.connect(gm); }
            gm.gain.setValueAtTime(0, now); gm.gain.linearRampToValueAtTime(p.melVol, now + 0.03);
            gm.gain.exponentialRampToValueAtTime(0.001, now + nd);
            gm.connect(audioCtx.destination); om.start(now); om.stop(now + nd);
            if (p.organ) {
                [[2,0.50],[3,0.25],[4,0.12]].forEach(([r,v]) => {
                    const oo = audioCtx.createOscillator(); const gg = audioCtx.createGain();
                    oo.type = 'sine'; oo.frequency.value = mf * r;
                    gg.gain.setValueAtTime(p.melVol * v, now); gg.gain.exponentialRampToValueAtTime(0.001, now + nd * 0.9);
                    oo.connect(gg); gg.connect(audioCtx.destination); oo.start(now); oo.stop(now + nd * 0.9);
                });
            }
            if (p.harmony) {
                const oh = audioCtx.createOscillator(); const gh = audioCtx.createGain();
                oh.type = 'square'; oh.frequency.value = mf * 1.26;
                gh.gain.setValueAtTime(0, now); gh.gain.linearRampToValueAtTime(p.melVol * 0.50, now + 0.03);
                gh.gain.exponentialRampToValueAtTime(0.001, now + nd);
                oh.connect(gh); gh.connect(audioCtx.destination); oh.start(now); oh.stop(now + nd);
            }
        }

        const bf = p.bass[rB];
        if (bf > 0) {
            const ob = audioCtx.createOscillator(); const gb = audioCtx.createGain();
            ob.type = p.bassType; ob.frequency.value = bf;
            if (p.distBass) {
                const dw = audioCtx.createWaveShaper(); dw.curve = _makeDistortion(p.distBass);
                ob.connect(dw); dw.connect(gb);
            } else { ob.connect(gb); }
            const bd = p.spd * 1.6 / 1000;
            gb.gain.setValueAtTime(0, now); gb.gain.linearRampToValueAtTime(p.bassVol, now + 0.04);
            gb.gain.exponentialRampToValueAtTime(0.001, now + bd);
            gb.connect(audioCtx.destination); ob.start(now); ob.stop(now + bd);
        }

        if (p.hihat && si % 2 === 1) _hihat(p.hhVol || 0.10);
        if (p.kick   && b % 4 === 0) _kick(0.36);
        // wg6: 세찬 바람 — 860ms마다 2.2초 버스트, 중첩으로 연속 바람 효과
        if (p.ghost && noiseBuffer) {
            const wnow = audioCtx.currentTime;
            const wsrc = audioCtx.createBufferSource(); wsrc.buffer = noiseBuffer;
            const whp = audioCtx.createBiquadFilter(); whp.type = 'highpass'; whp.frequency.value = 550;
            const wlp = audioCtx.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 4000;
            const wgn = audioCtx.createGain();
            const wvol = 0.13 + Math.random() * 0.10;
            wgn.gain.setValueAtTime(0, wnow);
            wgn.gain.linearRampToValueAtTime(wvol, wnow + 0.35);
            wgn.gain.setValueAtTime(wvol * (0.75 + Math.random() * 0.25), wnow + 1.1);
            wgn.gain.linearRampToValueAtTime(0, wnow + 2.2);
            wsrc.connect(whp); whp.connect(wlp); wlp.connect(wgn); wgn.connect(audioCtx.destination);
            wsrc.start(wnow); wsrc.stop(wnow + 2.2);
        }
        // wg2 스네어 + 킥
        if (p.snare && noiseBuffer) {
            if (p.kickBeats  && p.kickBeats.includes(b))  _kick(0.42);
            if (p.snareBeats && p.snareBeats.includes(b)) {
                const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
                const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass';
                bp.frequency.value = 220; bp.Q.value = 1.2;
                const gs = audioCtx.createGain();
                gs.gain.setValueAtTime(0.22, now); gs.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                src.connect(bp); bp.connect(gs); gs.connect(audioCtx.destination);
                src.start(now); src.stop(now + 0.14);
            }
        }
        // wg4 금속 타격
        if (p.metalHit && b % 8 === 6 && noiseBuffer) {
            const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
            const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass';
            bp.frequency.value = 900; bp.Q.value = 5;
            const gm2 = audioCtx.createGain();
            gm2.gain.setValueAtTime(0.18, now); gm2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            src.connect(bp); bp.connect(gm2); gm2.connect(audioCtx.destination);
            src.start(now); src.stop(now + 0.22);
        }
        si++;
    }, p.spd);

    // ── 2차 레이어 ─────────────────────────────────────────────────────
    if (p.drone) {
        // wg5: 저음 드론 맥동
        const dFreqs = wg >= 6 ? [18.35, 20.60, 16.35] : [55, 52, 58, 55];
        let di = 0;
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const df = dFreqs[di % dFreqs.length]; di++;
            const od = audioCtx.createOscillator(); const gd = audioCtx.createGain();
            od.type = 'sine'; od.frequency.value = df;
            gd.gain.setValueAtTime(0, now); gd.gain.linearRampToValueAtTime(0.28, now + 1.8);
            gd.gain.setValueAtTime(0.28, now + 3.5); gd.gain.exponentialRampToValueAtTime(0.001, now + 5.5);
            od.connect(gd); gd.connect(audioCtx.destination); od.start(now); od.stop(now + 5.5);
            // 2배음 윙윙 레이어
            const od2 = audioCtx.createOscillator(); const gd2 = audioCtx.createGain();
            od2.type = 'sine'; od2.frequency.value = df * 2;
            gd2.gain.setValueAtTime(0, now); gd2.gain.linearRampToValueAtTime(0.10, now + 2.2);
            gd2.gain.exponentialRampToValueAtTime(0.001, now + 5.0);
            od2.connect(gd2); gd2.connect(audioCtx.destination); od2.start(now); od2.stop(now + 5.0);
            if (p.ghost && noiseBuffer) {
                // "우..." 망자 포르만트 노이즈
                const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer; src.loop = true;
                const bpg = audioCtx.createBiquadFilter(); bpg.type = 'bandpass'; bpg.Q.value = 25;
                const gng = audioCtx.createGain();
                bpg.frequency.setValueAtTime(215 + Math.random() * 55, now);
                bpg.frequency.linearRampToValueAtTime(280 + Math.random() * 45, now + 3.5);
                gng.gain.setValueAtTime(0, now); gng.gain.linearRampToValueAtTime(0.06, now + 1.8);
                gng.gain.setValueAtTime(0.06, now + 5.0); gng.gain.linearRampToValueAtTime(0, now + 7.2);
                src.connect(bpg); bpg.connect(gng); gng.connect(audioCtx.destination);
                src.start(now); src.stop(now + 7.5);
                // 가끔 들리는 괴물 비명 (~60% 확률)
                if (Math.random() < 0.60) {
                    const ssrc = audioCtx.createBufferSource(); ssrc.buffer = noiseBuffer;
                    const sbp = audioCtx.createBiquadFilter(); sbp.type = 'bandpass'; sbp.Q.value = 13;
                    const sgn = audioCtx.createGain();
                    sbp.frequency.setValueAtTime(520, now); sbp.frequency.linearRampToValueAtTime(1700, now + 0.40);
                    sbp.frequency.linearRampToValueAtTime(820, now + 0.90); sbp.frequency.linearRampToValueAtTime(2100, now + 1.40);
                    sbp.frequency.linearRampToValueAtTime(360, now + 2.10);
                    sgn.gain.setValueAtTime(0, now); sgn.gain.linearRampToValueAtTime(0.10, now + 0.22);
                    sgn.gain.setValueAtTime(0.10, now + 1.65); sgn.gain.linearRampToValueAtTime(0, now + 2.30);
                    ssrc.connect(sbp); sbp.connect(sgn); sgn.connect(audioCtx.destination);
                    ssrc.start(now); ssrc.stop(now + 2.6);
                    // 저음 성도 레이어
                    const so = audioCtx.createOscillator(); const sgo = audioCtx.createGain();
                    so.type = 'sawtooth';
                    so.frequency.setValueAtTime(155, now); so.frequency.linearRampToValueAtTime(470, now + 0.32);
                    so.frequency.linearRampToValueAtTime(185, now + 0.82); so.frequency.linearRampToValueAtTime(590, now + 1.35);
                    so.frequency.linearRampToValueAtTime(115, now + 2.10);
                    const sdw = audioCtx.createWaveShaper(); sdw.curve = _makeDistortion(80);
                    sgo.gain.setValueAtTime(0, now); sgo.gain.linearRampToValueAtTime(0.09, now + 0.32);
                    sgo.gain.setValueAtTime(0.09, now + 1.55); sgo.gain.linearRampToValueAtTime(0, now + 2.30);
                    so.connect(sdw); sdw.connect(sgo); sgo.connect(audioCtx.destination); so.start(now); so.stop(now + 2.6);
                }
            }
        }, 4800);
        // wg5 유령 멜로디 레이어
        if (p.ghostMel) {
            const gMel = [110,0,98,0, 116,0,0,0, 104,0,87,0, 98,0,0,0];
            let gmi = 0;
            bgmInterval3 = setInterval(() => {
                if (!isBgmPlaying || Game.isMuted) { gmi++; return; }
                const now = audioCtx.currentTime;
                const gf = gMel[gmi % gMel.length]; gmi++;
                if (gf > 0) {
                    const og = audioCtx.createOscillator(); const gg = audioCtx.createGain();
                    og.type = 'sine'; og.frequency.value = gf;
                    og.frequency.setValueAtTime(gf, now);
                    og.frequency.linearRampToValueAtTime(gf * 1.004, now + 0.3);
                    og.frequency.linearRampToValueAtTime(gf, now + 0.6);
                    gg.gain.setValueAtTime(0, now); gg.gain.linearRampToValueAtTime(0.11, now + 0.18);
                    gg.gain.setValueAtTime(0.11, now + 0.55); gg.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
                    og.connect(gg); gg.connect(audioCtx.destination); og.start(now); og.stop(now + 1.1);
                    // 5도 위 화음
                    const og2 = audioCtx.createOscillator(); const gg2 = audioCtx.createGain();
                    og2.type = 'sine'; og2.frequency.value = gf * 1.498;
                    gg2.gain.setValueAtTime(0, now); gg2.gain.linearRampToValueAtTime(0.05, now + 0.25);
                    gg2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
                    og2.connect(gg2); gg2.connect(audioCtx.destination); og2.start(now); og2.stop(now + 0.9);
                }
            }, p.spd * 2);
        }
    } else if (wg === 1) {
        // 고블린 숲: 화음 아르페지오 반주
        const jChords = [[196,294,392],[220,330,440],[196,294,392],[174,261,349]];
        let ci = 0;
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            jChords[ci % 4].forEach(f => {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'triangle'; o.frequency.value = f;
                g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.07);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.80);
                o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.80);
            });
            ci++;
        }, p.spd * 8);
        // worldN 2(불타는): 메탈 기타 오버레이
        if (_isBurning) {
            const bRiff = [1,0,1.498,0, 1,0,1.335,1.498, 1,0,0.89,0, 1.498,0,1,0];
            const bRoot = 110; const bT = Math.round(p.spd * 1.5); let bri = 0;
            bgmInterval3 = setInterval(() => {
                if (!isBgmPlaying || Game.isMuted) { bri++; return; }
                const b2 = bri % bRiff.length; bri++;
                if (bRiff[b2] > 0) _guitar(bRoot * bRiff[b2], 0.11, bT * 1.2 / 1000);
                if (b2 === 0 || b2 === 8) _kick(0.28);
                if (b2 === 4 || b2 === 12) _snare(0.22);
            }, bT);
        }
    } else if (wg === 2) {
        // 언데드: 현악기풍 서스테인 패드 (Am/G/F/E 진행)
        const strChords = [[220,261,330],[196,247,294],[175,220,262],[165,220,247]];
        let sc = 0;
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const pd = p.spd * 16 / 1000;
            strChords[sc % 4].forEach((f, i) => {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'triangle'; o.frequency.value = f;
                o.detune.value = (i - 1) * 4; // 약간의 두께
                g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.055, now + 0.5);
                g.gain.setValueAtTime(0.055, now + pd - 0.6); g.gain.exponentialRampToValueAtTime(0.001, now + pd);
                o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + pd);
            });
            sc++;
        }, p.spd * 16);
        if (_isBurning) {
            // worldN 4(불타는): 메탈 기타 오버레이
            const bRiff = [1,0,1.498,0, 1,0,1.335,1.498, 1,0,0.89,0, 1.498,0,1,0];
            const bRoot = 98; const bT = Math.round(p.spd * 1.5); let bri = 0;
            bgmInterval3 = setInterval(() => {
                if (!isBgmPlaying || Game.isMuted) { bri++; return; }
                const b2 = bri % bRiff.length; bri++;
                if (bRiff[b2] > 0) _guitar(bRoot * bRiff[b2], 0.12, bT * 1.2 / 1000);
                if (b2 === 0 || b2 === 8) _kick(0.30);
                if (b2 === 4 || b2 === 12) _snare(0.24);
            }, bT);
        } else {
            // 3차: 카운터 멜로디 (한 옥타브 위 피아노풍)
            const cMel = [440,0,494,0, 523,494,0,0, 440,0,392,440, 494,0,0,0];
            let cmi = 0;
            bgmInterval3 = setInterval(() => {
                if (!isBgmPlaying || Game.isMuted) { cmi++; return; }
                const now = audioCtx.currentTime;
                const cf = cMel[cmi % cMel.length]; cmi++;
                if (cf > 0) {
                    const oc = audioCtx.createOscillator(); const gc = audioCtx.createGain();
                    oc.type = 'triangle'; oc.frequency.value = cf;
                    gc.gain.setValueAtTime(0, now); gc.gain.linearRampToValueAtTime(0.07, now + 0.02);
                    gc.gain.exponentialRampToValueAtTime(0.001, now + p.spd * 1.4 / 1000);
                    oc.connect(gc); gc.connect(audioCtx.destination); oc.start(now); oc.stop(now + p.spd * 1.4 / 1000);
                }
            }, p.spd);
        }
    } else if (wg === 3) {
        // 고딕 성당: 합창 + 타종
        const choirNotes = [[165,220,262],[131,165,196],[147,196,247],[110,165,220]];
        let chi = 0;
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const pd = p.spd * 14 / 1000;
            choirNotes[chi % 4].forEach((f, vi) => {
                // 비브라토를 가진 합창 목소리
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'sine'; o.frequency.value = f;
                o.detune.value = (vi - 1) * 7;
                g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.065, now + 0.8);
                g.gain.setValueAtTime(0.065, now + pd - 0.6); g.gain.exponentialRampToValueAtTime(0.001, now + pd);
                o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + pd);
                // 3배음 (choir 음색 두께)
                const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
                o2.type = 'sine'; o2.frequency.value = f * 3;
                g2.gain.setValueAtTime(0, now); g2.gain.linearRampToValueAtTime(0.018, now + 0.6);
                g2.gain.exponentialRampToValueAtTime(0.001, now + pd * 0.8);
                o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now); o2.stop(now + pd * 0.8);
            });
            chi++;
        }, p.spd * 14);
        if (_isBurning) {
            // worldN 6(불타는): 메탈 기타 오버레이
            const bRiff = [1,0,1.498,0, 1,0,1.335,1.498, 1,0,0.89,0, 1.498,0,1,0];
            const bRoot = 82; const bT = Math.round(p.spd * 1.5); let bri = 0;
            bgmInterval3 = setInterval(() => {
                if (!isBgmPlaying || Game.isMuted) { bri++; return; }
                const b2 = bri % bRiff.length; bri++;
                if (bRiff[b2] > 0) _guitar(bRoot * bRiff[b2], 0.13, bT * 1.2 / 1000);
                if (b2 === 0 || b2 === 8) _kick(0.32);
                if (b2 === 4 || b2 === 12) _snare(0.25);
            }, bT);
        } else {
            // 3차: 저음 타종 (교회 종소리)
            bgmInterval3 = setInterval(() => {
                if (!isBgmPlaying || Game.isMuted) return;
                const now = audioCtx.currentTime;
                [82, 110].forEach((f, i) => {
                    const ob = audioCtx.createOscillator(); const gb = audioCtx.createGain();
                    ob.type = 'sine'; ob.frequency.value = f;
                    gb.gain.setValueAtTime(0.18, now + i * 0.04);
                    gb.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
                    ob.connect(gb); gb.connect(audioCtx.destination);
                    ob.start(now + i * 0.04); ob.stop(now + 3.5);
                });
            }, p.spd * 28);
        }
    } else if (wg === 4) {
        // 마족 성채: 왜곡 리듬 기타 + 저음 패드
        const riffSeq = [247,0,247,0, 311,0,294,247, 220,0,261,0, 247,0,0,0];
        let ri = 0;
        bgmInterval2 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) { ri++; return; }
            const now = audioCtx.currentTime;
            const rf = riffSeq[ri % riffSeq.length]; ri++;
            if (rf > 0) _guitar(rf, 0.18, p.spd * 1.8 / 1000);
        }, p.spd);
        // 3차: 저음 패드 화음
        const dChords = [[62,74,98],[52,65,87],[58,69,92],[62,74,98]];
        let dci = 0;
        bgmInterval3 = setInterval(() => {
            if (!isBgmPlaying || Game.isMuted) return;
            const now = audioCtx.currentTime;
            const pd = p.spd * 16 / 1000;
            dChords[dci % 4].forEach(f => {
                const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                o.type = 'sine'; o.frequency.value = f;
                g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.10, now + 0.4);
                g.gain.setValueAtTime(0.10, now + pd - 0.5); g.gain.exponentialRampToValueAtTime(0.001, now + pd);
                o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + pd);
            });
            dci++;
        }, p.spd * 16);
    }
}
