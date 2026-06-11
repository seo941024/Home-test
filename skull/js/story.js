// ==========================================
// 컷신 / 오프닝 / 엔딩 / 보스 등장 연출 (Story & Cutscene)
// ==========================================

/*
  게임 상태(Game.gs) 흐름:
  menu → opening_cutscene → class_select → play ...
  boss_intro → boss_cutscene → play
  win → ending_cutscene → menu

  Game.cutscene = {
    type: "opening" | "boss_intro" | "ending",
    step:  현재 대사/씬 인덱스,
    t:     현재 씬에서 흐른 프레임,
    auto:  true면 타이머로 자동 진행,
    fadeAlpha: 페이드 값 0~1,
    lines: [{text, speaker, duration, bg}] 배열
  }
*/

// ── 스토리 데이터 ──────────────────────────────────────────

const STORY = {

  // 오프닝: scene1~6.png 이미지 기반
  opening: [
    { img: "opening/scene1.png", speaker: "내레이터", duration: 450,
      text: "태초부터, 인간과 마족 사이에는 끊임없는 전쟁이 있었다." },

    { img: "opening/scene2.png", speaker: "내레이터", duration: 500,
      text: "수많은 전쟁, 승리와 패배가 있었으며, 마침내 마왕에 도달한 자가 있었으니-" },

    { img: "opening/scene2.png", speaker: "내레이터", duration: 500,
      text: "그렇게 두 종족간의 결착을 내는 승부가 시작되었다." },

    { img: "opening/scene3.png", speaker: "마왕", duration: 450,
      text: "하하하... 인간 따위가 짐에게 도전하다니. 실로 어리석구나." },

    { img: "", speaker: "내레이터", duration: 450,
      text: "이렇게 밤낮없는 싸움이 시작되었다." },

    { img: "", speaker: "내레이터", duration: 450,
      text: "수십시간이 지나, 마침내 쓰러지는 이가 나왔으니-" },

    { img: "opening/scene4.png", speaker: "내레이터", duration: 470,
      text: "인류의 희망이 패배했고, 세상은 혼돈에 휩싸였다." },

    { img: "", speaker: "내레이터", duration: 370,
      text: "......." },

    { img: "", speaker: "내레이터", duration: 500,
      text: ".......시간이 지난 후, 수많은 시체와 해골더미 중 무언가가 움직이기 시작했다." },

    { img: "", speaker: "????", duration: 470,
      text: ".......나.. 죽은 것 아니였어....?....." },

    { img: "opening/scene5.png", speaker: "해골", duration: 470,
      text: ".......그렇군..... 죽지 못하는 저..주..... 인건가.... " },

    { img: "opening/scene6.png", speaker: "용사", duration: 700,
      text: ".... 이 뼈만 남은 몸이라도..... 마왕을 죽이고 세상을 되찾아 보이겠어." },

      { img: "", speaker: "", duration: 400,
      text: "" },
],
  // 보스별 등장 대사 [worldN] = [{speaker, text, duration}]
  boss: {
    1:  [
      { speaker: "고블린 킹",  duration: 140, text: "끼에에엑! 겍겍겍! 침입자로군! 죽이고 죽인다! 캬아아악!" },
      { speaker: "해골용사",   duration: 140, text: "지능 낮은 고블린이군. 단숨에 해치우고 가자." },
    ],
    2:  [
      { speaker: "언데드 고블린 킹", duration: 150, text: "끼에에엑! 겍겍겍! 머릿속이 타오른다! 다시... 다시 찢어주마!" },
      { speaker: "해골용사",         duration: 150, text: ".... 죽음에 먹혀버린건가? 고통에서 해방시켜주자." },
    ],
    3:  [
      { speaker: "스켈레톤 치프틴", duration: 150, text: "동족이여, 왜 산 자들의 편에 서느냐." },
      { speaker: "해골용사",        duration: 150, text: "마족 따위랑 같은 취급하지마!" },
    ],
    4: [
    { speaker: "언데드 스켈레톤 치프틴", duration: 160, text: "이 굴레는 마왕의 의지 그 자체. 우리에게 죽음마저 허락되지 않는군." },
    { speaker: "해골용사",               duration: 150, text: "이 녀석도... 죽어서조차 고통받는군..." },
    ],
    5:  [
      { speaker: "내레이터",        duration: 140, text: "형체도 이성도 없는 것이 눈앞을 막아섰다." },
      { speaker: "거대 괴수 더스크",  duration: 130, text: "GROOAAARGH—!!" },
      { speaker: "내레이터",        duration: 130, text: "분노가 짐승의 형태를 빌려 세상을 짓눌렀다." },
    ],
    6: [
    { speaker: "내레이터",       duration: 150, text: "흩어졌던 뼈들이 뒤틀린 마력으로 억지로 결합한다." },
    { speaker: "내레이터",       duration: 140, text: "놈의 안광이 다시 붉게 타오르기 시작했다." },
    { speaker: "파괴된 더스크", duration: 130, text: "G-G-G-ORRAAAAAAAA...!!" },
    { speaker: "용사",       duration: 150, text: "쳇- " },
],
    7: [
    { speaker: "마족 제1친위대장", duration: 150, text: "일낱 뼈다귀가 여기까지 오다니. 마왕님의 지루함을 달랠 구경거리로군." },
    { speaker: "마족 제1친위대장", duration: 140, text: "하지만 아쉽게도, 그 광대는 내 선에서 정리된다." },
    { speaker: "해골용사",         duration: 140, text: "... 친위대장인가 점점 다가오는군." },
],
    8: [
    { speaker: "마족 제2친위대장", duration: 150, text: "이 마검에 베이면 영혼조차 풍화된다. 네 텅 빈 해골 따위가 버틸 수 있겠나?" },
    { speaker: "해골용사",         duration: 150, text: "내 영혼이 지워져도, 육신에 각인된 이 분노가 널 기어이 베어낼 거다." },
],
    9: [
    { speaker: "마족 제3친위대장", duration: 160, text: "...경의를 표하마. 마왕성에 발을 들인 불청객 중, 네가 가장 위대했다." },
    { speaker: "마족 제3친위대장", duration: 150, text: "그러나 이 문은 마왕성의 경계이자, 내 목숨으로 채워진 빗장이다." },
    { speaker: "해골용사",         duration: 150, text: "... 곧이다.. 잔챙이는 비켜!!" },
],
    10: [
      { speaker: "해골용사",  duration: 160, text: "마왕!!!!!!" },
      { speaker: "마왕",      duration: 170, text: "...누가 겁도없이 짐에게 도전하는가?" },
      { speaker: "마왕",      duration: 180, text: "오호? 자네는 나에게 이미 패배한 용사아닌가. 꼴이 우습군" },
      { speaker: "해골용사",  duration: 170, text: "못 본사이에 말이 많아졌구나?" },
      { speaker: "해골용사",  duration: 180, text: "세계의 혼돈을 가져오는 마왕이여! 이제 한 줌의 재가 되어라." },
      { speaker: "마왕",      duration: 190, text: "하하..! 가소롭구나, 나에게 승리한들 너와 세계가 돌아오리라 믿는가?" },
      { speaker: "해골용사",  duration: 150, text: "그런건 중요하지 않아. 너를 부수고, 평화를 찾아온다." },
      { speaker: "마왕",  duration: 160, text: "덤벼라, 필멸자여!!!!!" },
    ],
  },

  ending: [
    { img: "ending/ending1.png", speaker: "내레이터", duration: 300,
      text: "마침내 — 용사의 검이 마왕을 베었다." },
    { img: "ending/ending2.png", speaker: "마왕",     duration: 340,
      text: "...인간 따위에게...!!!! 짐이.... 짐이 패배하다니...!!!!!" },
    { img: "ending/ending3.png", speaker: "해골용사", duration: 340,
      text: "..... 끝난건가 ........ 아무것도 남지 않았군......" },
    { img: "ending/ending4.png", speaker: "해골용사", duration: 360,
      text: "...... 살아있는 사람은 없는건가..?...." },
    { img: "", speaker: "내레이터", duration: 380,
      text: "... 그렇게 몇날며칠, 수개월을 돌아 다녔지만, 폐허가 된 곳 뿐이었다-" },
    { img: "", speaker: "????", duration: 300,
      text: ".......!!!!!" },
    { img: "ending/ending5.png", speaker: "해골용사", duration: 360,
      text: "...이 곳은 ....... " },
    { img: "ending/ending6.png", speaker: "내레이터", duration: 380,
      text: "따스한 햇살이 내리쬐는 꽃밭. 멀리 호수가 반짝였다. 그는 그 자리에 가만히 앉았다." },
    { img: "ending/ending7.png", speaker: "내레이터", duration: 380,
      text: "기분 좋은 바람이 불고, 향긋한 꽃내음이 풍겼다. 그는 하늘을 올려다 보았다." },
    { img: null, speaker: "", duration: 480, text: "", isTheEnd: true },
  ],
};

// ── 컷신 초기화 ───────────────────────────────────────────

function startCutscene(type, worldN) {
    let lines;
    if (type === "opening") lines = STORY.opening;
    else if (type === "boss")   lines = STORY.boss[worldN] || [];
    else if (type === "ending") lines = STORY.ending;
    else return;

    if (!lines || lines.length === 0) {
        // 대사 없으면 바로 다음 상태로
        _cutsceneEnd(type);
        return;
    }

    Game.cutscene = {
        type,
        worldN: worldN || 0,
        step: 0,
        t: 0,
        fadeAlpha: 1,
        lines,
    };
    // 오프닝 컷신 시작 시 프롤로그 BGM
    if (type === "opening" && typeof playBGM === 'function') playBGM('prologue');
    Game.gs = "cutscene";
}

function _cutsceneEnd(type) {
    Game.cutscene = null;
    if (type === "opening") {
        // 오프닝 컷씬 완료 → 클래스 선택
        if (typeof stopBGM === 'function') stopBGM();
        Game.gs = "class_select";
    } else if (type === "boss") {
        // 컷신 끝나고 플레이로 — 카메라/상태 초기화
        Game.gs = "play";
        Game.camShake = 0;
        Game.hitStop  = 0;
        Game.transT   = 0;
    } else if (type === "ending") {
        if (typeof stopBGM === 'function') stopBGM();
        if (typeof playBGM === 'function') playBGM('lobby');
        Game.gs = "menu";
        if (typeof restoreLobbyUI === 'function') restoreLobbyUI();
    }
}

// ── 컷신 업데이트 (매 프레임 호출) ───────────────────────

function updateCutscene() {
    const cs = Game.cutscene;
    if (!cs) return;

    cs.t++;
    const cur = cs.lines[cs.step];
    if (!cur) { _cutsceneEnd(cs.type); return; }

    // 타이핑 속도: 보스 컷신=2프레임/글자, 오프닝/엔딩=5프레임/글자
    const isBossScene = (cs.type === 'boss');
    const typeSpeed   = isBossScene ? 2 : 5;

    if (cur.text) {
        cs.typeIdx = cs.typeIdx || 0;
        cs.typeT   = (cs.typeT   || 0) + 1;

        if (cs.typeIdx < cur.text.length) {
            if (cs.typeT >= typeSpeed) {
                cs.typeT = 0;
                cs.typeIdx++;
                // 타이핑 SFX — 공백/줄바꿈은 소리 없음
                const ch = cur.text[cs.typeIdx - 1];
                if (ch && ch !== ' ' && ch !== '\n' && typeof playSfx === 'function') {
                    if (typeof Game !== 'undefined' && !Game.isMuted) {
                        playSfx('typing');
                    }
                }
            }
        }
    } else {
        cs.typeIdx = 0;
    }

    // SPACE / ENTER / Z로 스킵 — 타이핑 중이면 전체 표시, 완료면 다음으로
    const skip = dn("Space", "Enter", "KeyZ", "KeyX");
    // ESC: 컷씬 전체 즉시 종료
    if (dn("Escape") && !cs._escOld) {
        _cutsceneEnd(cs.type);
        cs._escOld = true;
        return;
    }
    cs._escOld = dn("Escape");
    if (skip && !cs._skipOld && cs.t > 10) {
        if (cur.text && cs.typeIdx < cur.text.length) {
            // 타이핑 미완성: 전체 즉시 표시
            cs.typeIdx = cur.text.length;
        } else if (cs.t >= 15) {
            // 타이핑 완성: 다음 줄로
            cs.step++;
            cs.t = 0;
            cs.typeIdx = 0;
            cs.typeT   = 0;
            if (cs.step >= cs.lines.length) {
                _cutsceneEnd(cs.type);
            }
        }
    }
    // 시간 초과 자동 진행 (타이핑 완료 후 남은 시간 대기)
    const typingDone = !cur.text || cs.typeIdx >= cur.text.length;
    // duration = max(지정값, 타이핑완료시간 + 읽기여유 60프레임)
    const typeSpeed2 = isBossScene ? 2 : 5;
    const minDuration = cur.text ? (cur.text.length * typeSpeed2 + 80) : cur.duration;
    const effectiveDuration = Math.max(cur.duration, minDuration);
    cs._effectiveDur = effectiveDuration; // renderCutscene에서 페이드 계산용
    if (typingDone && cs.t >= effectiveDuration) {
        cs.step++;
        cs.t = 0;
        cs.typeIdx = 0;
        cs.typeT   = 0;
        if (cs.step >= cs.lines.length) {
            _cutsceneEnd(cs.type);
        }
    }
    cs._skipOld = skip;
}

// ── 컷신 렌더 (매 프레임 호출) ────────────────────────────

function renderCutscene(frameNow) {
    const cs = Game.cutscene;
    if (!cs) return;

    const cur = cs.lines[cs.step];
    if (!cur) return;

    // 배경 — 검정
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);

    // THE END 씬
    if (cur.isTheEnd) {
        const prog = Math.min(1, cs.t / 80);
        ctx.save();
        ctx.globalAlpha = prog;
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px SkullFont, NeoDunggeunmo";
        ctx.shadowBlur = 14; ctx.shadowColor = "#aaaaff";
        ctx.fillText("— THE END —", CW/2, CH/2 - 18);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#666";
        ctx.font = "12px SkullFont, NeoDunggeunmo";
        ctx.fillText("[ 로비로 돌아가려면 SPACE를 눌러주세요 ]", CW/2, CH/2 + 20);
        ctx.restore();
        ctx.textAlign = "left";
        return;
    }

    // 페이드 알파 계산
    const fadeDur = 40; // 페이드 속도 2배 느리게
    let alpha = 1;
    if (cs.t < fadeDur) alpha = cs.t / fadeDur;
    else if (cs.t > (cs._effectiveDur||cur.duration) - fadeDur)
        alpha = Math.max(0, ((cs._effectiveDur||cur.duration) - cs.t) / fadeDur);

    // 이미지 렌더
    if (cur.img) {
        cs._imgCache = cs._imgCache || {};
        if (!cs._imgCache[cur.img]) {
            const img = new Image();
            img.src = cur.img;
            cs._imgCache[cur.img] = img;
        }
        const img = cs._imgCache[cur.img];
        if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.globalAlpha = alpha;
            // 레터박스: 비율 유지하며 꽉 채움
            const iw = img.naturalWidth, ih = img.naturalHeight;
            const scale = Math.max(CW / iw, CH / ih);
            const dw = iw * scale, dh = ih * scale;
            const dx = (CW - dw) / 2, dy = (CH - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
            // 하단 그라데이션 오버레이 (텍스트 가독성)
            const grad = ctx.createLinearGradient(0, CH * 0.55, 0, CH);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, "rgba(0,0,0,0.82)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CW, CH);
            ctx.restore();
        } else {
            ctx.fillStyle = "#0a0a12";
            ctx.fillRect(0, 0, CW, CH);
        }
    }

    // 텍스트 박스
    if (cur.text) {
        const boxY = CH - 95;
        // 화자
        if (cur.speaker) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = "#ffcc44";
            ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
            ctx.fillText(cur.speaker, 18, boxY - 6);
            ctx.restore();
        }

        // 타이핑 텍스트
        const displayText = cur.text.slice(0, cs.typeIdx || 0);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(240,230,220,1)";
        ctx.font = "13px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "left";
        // 줄바꿈
        const maxW = CW - 36;
        let line = "", ly = boxY + 16;
        for (let ch2 of displayText) {
            const test = line + ch2;
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                ctx.fillText(line, 18, ly);
                line = ch2; ly += 18;
            } else { line = test; }
        }
        if (line) ctx.fillText(line, 18, ly);
        // 커서
        if ((cs.typeIdx||0) < cur.text.length) {
            if (Math.floor(frameNow / 200) % 2 === 0) {
                ctx.fillStyle = "rgba(255,220,100,0.9)";
                ctx.fillText("▌", 18 + ctx.measureText(line).width, ly);
            }
        }
        ctx.restore();
    }

    // ESC/SPACE 안내
    if (cs.t > 40) {
        const glow = (Math.sin(frameNow * 0.008) + 1) / 2;
        const skipAlpha = 0.35 + glow * 0.55;
        ctx.save();
        ctx.font = "bold 11px SkullFont, NeoDunggeunmo";

        // ESC — 우측 상단 형광
        ctx.textAlign = "right";
        ctx.fillStyle = `rgba(${Math.floor(120+glow*100)},${Math.floor(200+glow*55)},255,${skipAlpha})`;
        ctx.shadowBlur = glow * 10;
        ctx.shadowColor = `rgba(100,180,255,${glow*0.8})`;
        ctx.fillText("[ESC] 스킵", CW - 12, 22);
        ctx.shadowBlur = 0;

        // SPACE — 중앙 최하단 회색
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(160,160,160,${0.4 + glow * 0.3})`;
        ctx.fillText("[SPACE] 다음", CW / 2, CH - 10);

        ctx.restore();
    }
    ctx.textAlign = "left";
}

function _wrapCutsceneText(text, x, y, maxW, lineH, alpha) {
    const words = text.split(" ");
    let line = "";
    let curY = y;
    ctx.fillStyle = `rgba(240,230,220,${alpha})`;
    for (const w of words) {
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, x, curY);
            line = w;
            curY += lineH;
        } else {
            line = test;
        }
    }
    if (line) ctx.fillText(line, x, curY);
}

function _drawCutsceneBg(bg, frameNow) {
    const t = frameNow;

    if (bg === "black" || !bg) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, CH);
        return;
    }

    // ── night_grave: 컷신 전용 통합 배경 ──
    // 어두운 밤하늘(별+달) + 먼 마을 실루엣 + 전경 묘비
    // 오프닝 전 씬 공통으로 사용 — 배경 전환 없음
    if (bg === "night_grave") {
        ctx.fillStyle = "#060310";
        ctx.fillRect(0, 0, CW, CH);

        // 밤하늘 그라데이션
        const ngSky = ctx.createLinearGradient(0, 0, 0, CH * 0.62);
        ngSky.addColorStop(0, "#18082e");
        ngSky.addColorStop(1, "#22121a");
        ctx.fillStyle = ngSky;
        ctx.fillRect(0, 0, CW, CH * 0.62);

        // 별 (밝기 맥동)
        for (let i = 0; i < 45; i++) {
            const bx = ((i * 137) % CW);
            const by = ((i * 97)  % (CH * 0.48));
            const blink = (Math.sin(t * 0.003 + i) + 1) / 2;
            ctx.fillStyle = `rgba(220,210,180,${0.25 + blink * 0.45})`;
            ctx.fillRect(bx, by, 1, 1);
        }

        // 달 (오른쪽 상단, 이지러진 형태)
        const ngMoonX = CW * 0.78;
        const ngMoonGrd = ctx.createRadialGradient(ngMoonX, 44, 6, ngMoonX, 44, 40);
        ngMoonGrd.addColorStop(0, "rgba(195,180,125,0.88)");
        ngMoonGrd.addColorStop(0.55, "rgba(135,115,78,0.38)");
        ngMoonGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ngMoonGrd;
        ctx.beginPath(); ctx.arc(ngMoonX, 44, 40, 0, Math.PI * 2); ctx.fill();
        // 달 이지러짐 (그림자 원)
        ctx.fillStyle = "rgba(5,2,10,0.52)";
        ctx.beginPath(); ctx.arc(ngMoonX - 11, 38, 32, 0, Math.PI * 2); ctx.fill();

        // 먼 마을 집 실루엣 (흐릿하게, 안쪽 깊이감)
        ctx.fillStyle = "#030108";
        for (let i = 0; i < 8; i++) {
            const hx = i * 84 - 15;
            const hh = 44 + (i % 3) * 18;
            ctx.fillRect(hx, CH - 92 - hh, 64, hh);
            // 지붕
            ctx.beginPath();
            ctx.moveTo(hx - 4, CH - 92 - hh);
            ctx.lineTo(hx + 32, CH - 92 - hh - 22);
            ctx.lineTo(hx + 68, CH - 92 - hh);
            ctx.fill();
            // 창문 (아주 희미한 불빛)
            ctx.fillStyle = `rgba(120,55,10,0.09)`;
            ctx.fillRect(hx + 12, CH - 92 - hh + 14, 10, 8);
            ctx.fillStyle = "#030108";
        }

        // 묘지 지면 (전경)
        ctx.fillStyle = "#0c0818";
        ctx.fillRect(0, CH - 96, CW, 96);

        // 묘비 6기 — 어두운 실루엣, 배경에 자연스럽게 녹아듦
        for (let i = 0; i < 6; i++) {
            const gx = 22 + i * 96;
            const gh = 36 + (i % 2) * 14;
            // 묘비 본체 (거의 검정 — 이질감 없게)
            ctx.fillStyle = "#0d0a0a";
            ctx.fillRect(gx, CH - 74 - gh, 26, gh);
            ctx.beginPath(); ctx.arc(gx + 13, CH - 74 - gh, 13, Math.PI, 0); ctx.fill();
        }

        // 중앙 큰 묘비 (플레이어)
        ctx.fillStyle = "#100d10";
        ctx.fillRect(CW / 2 - 20, CH - 132, 40, 82);
        ctx.beginPath(); ctx.arc(CW / 2, CH - 132, 20, Math.PI, 0); ctx.fill();
        // 묘비 테두리: 거의 안 보이는 수준
        ctx.strokeStyle = "rgba(80,50,80,0.18)"; ctx.lineWidth = 1;
        ctx.strokeRect(CW / 2 - 20, CH - 132, 40, 82);
        ctx.beginPath(); ctx.arc(CW / 2, CH - 132, 20, Math.PI, 0); ctx.stroke();
        // 글자: 채도 없는 아주 어두운 색
        ctx.fillStyle = "rgba(75,55,70,0.5)";
        ctx.font = "10px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText("HERO", CW / 2, CH - 100);
        ctx.textAlign = "left";

        // 안개 (낮은 지면, 보라빛)
        const ngFog = 0.1 + Math.sin(t * 0.001) * 0.035;
        ctx.fillStyle = `rgba(70,45,90,${ngFog})`;
        ctx.fillRect(0, CH - 96, CW, 96);

        // 바닥 마무리
        ctx.fillStyle = "#070510";
        ctx.fillRect(0, CH - 40, CW, 40);
        return;
    }

    if (bg === "village") {
        // 마을 실루엣
        ctx.fillStyle = "#0a0510";
        ctx.fillRect(0, 0, CW, CH);
        // 하늘 그라데이션
        const sky = ctx.createLinearGradient(0, 0, 0, CH * 0.6);
        sky.addColorStop(0, "#1a0a2e");
        sky.addColorStop(1, "#2a1a1a");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, CW, CH * 0.6);
        // 별
        for (let i = 0; i < 40; i++) {
            const bx = ((i * 137) % CW);
            const by = ((i * 97) % (CH * 0.5));
            const blink = (Math.sin(t * 0.003 + i) + 1) / 2;
            ctx.fillStyle = `rgba(255,255,200,${0.3 + blink * 0.5})`;
            ctx.fillRect(bx, by, 1, 1);
        }
        // 마을 집 실루엣
        ctx.fillStyle = "#050208";
        for (let i = 0; i < 8; i++) {
            const bx = i * 85 - 20;
            const bh = 60 + (i % 3) * 20;
            ctx.fillRect(bx, CH - bh, 70, bh);
            // 지붕
            ctx.beginPath();
            ctx.moveTo(bx - 5, CH - bh);
            ctx.lineTo(bx + 35, CH - bh - 30);
            ctx.lineTo(bx + 75, CH - bh);
            ctx.fill();
            // 창문 (희미한 불빛)
            ctx.fillStyle = `rgba(255,150,30,0.25)`;
            ctx.fillRect(bx + 15, CH - bh + 15, 12, 10);
            ctx.fillRect(bx + 40, CH - bh + 15, 12, 10);
            ctx.fillStyle = "#050208";
        }
        // 지면
        ctx.fillStyle = "#080310";
        ctx.fillRect(0, CH - 25, CW, 25);
        return;
    }

    if (bg === "battlefield") {
        // 전쟁터 — 잿빛 하늘, 불타는 땅, 쓰러진 용사들
        const bfT = frameNow;
        // 하늘: 연기 섞인 잿빛
        const bfSky = ctx.createLinearGradient(0, 0, 0, CH);
        bfSky.addColorStop(0,   "#1a1008");
        bfSky.addColorStop(0.4, "#2a1a0a");
        bfSky.addColorStop(0.7, "#3a1a08");
        bfSky.addColorStop(1,   "#150a04");
        ctx.fillStyle = bfSky; ctx.fillRect(0, 0, CW, CH);

        // 불빛 글로우 (지평선)
        const bfGlo = ctx.createRadialGradient(CW*0.5, CH*0.75, 5, CW*0.5, CH*0.75, CW*0.6);
        bfGlo.addColorStop(0, "rgba(220,80,10,0.5)");
        bfGlo.addColorStop(0.5, "rgba(140,40,5,0.2)");
        bfGlo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bfGlo; ctx.fillRect(0, 0, CW, CH);

        // 연기 파티클
        for (let i = 0; i < 12; i++) {
            const sx = ((i * 173 + bfT * 0.012 * (i%2===0?1:-0.5)) % (CW+120)) - 60;
            const sy = CH*0.3 + (i % 4) * 30 - Math.sin(bfT*0.001+i)*15;
            const sr = 30 + (i%3)*20;
            const sa = 0.06 + Math.sin(bfT*0.0008+i)*0.02;
            const sg = ctx.createRadialGradient(sx,sy,0,sx,sy,sr);
            sg.addColorStop(0, `rgba(60,50,40,${sa+0.04})`);
            sg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = sg;
            ctx.beginPath(); ctx.ellipse(sx,sy,sr*1.8,sr*0.7,0,0,Math.PI*2); ctx.fill();
        }

        // 원경 나무/성벽 실루엣 (잿빛)
        ctx.fillStyle = "#0a0804";
        // 성벽/건물 실루엣 — 삼각형 없이 직선 블록만 사용
        ctx.fillStyle = "#0a0804";
        for (let i = 0; i < 10; i++) {
            const tx = i * 140 - 30;
            const th = 55 + (i % 3) * 25;
            const tw = 28 + (i % 2) * 12;
            // 건물 본체
            ctx.fillRect(tx, CH - 90 - th, tw, th);
            // 흉벽 (성벽 위 요철) — 직사각형만 사용
            for (let m = 0; m < 3; m++) {
                ctx.fillRect(tx + m * (tw/3), CH - 90 - th - 8, tw/3 - 2, 8);
            }
        }

        // 지면 (불탄 땅)
        const bfGnd = ctx.createLinearGradient(0,CH-60,0,CH);
        bfGnd.addColorStop(0,"#2a1505"); bfGnd.addColorStop(1,"#0f0803");
        ctx.fillStyle = bfGnd; ctx.fillRect(0,CH-60,CW,60);

        // 불꽃 2~3군데
        for (let fi=0; fi<3; fi++) {
            const fx = 120 + fi*230;
            const fh = 18 + Math.sin(bfT*0.005+fi)*6;
            const flk = 0.4+Math.sin(bfT*0.007+fi*2)*0.2;
            const fg = ctx.createRadialGradient(fx,CH-60,0,fx,CH-60,fh*2);
            fg.addColorStop(0,`rgba(255,160,20,${flk})`);
            fg.addColorStop(0.4,`rgba(200,60,0,${flk*0.6})`);
            fg.addColorStop(1,"rgba(0,0,0,0)");
            ctx.fillStyle = fg;
            ctx.beginPath(); ctx.ellipse(fx,CH-60,fh*0.6,fh,0,0,Math.PI*2); ctx.fill();
        }
        return;
    }

    if (bg === "village_grave") {
        // village 밤하늘 + 묘비를 합친 통합 씬 — 다크 판타지 분위기 통일
        // 하늘 (village 동일)
        ctx.fillStyle = "#0a0510";
        ctx.fillRect(0, 0, CW, CH);
        const sky2 = ctx.createLinearGradient(0, 0, 0, CH * 0.65);
        sky2.addColorStop(0, "#1a0a2e");
        sky2.addColorStop(1, "#2a1a1a");
        ctx.fillStyle = sky2;
        ctx.fillRect(0, 0, CW, CH * 0.65);
        // 별
        for (let i = 0; i < 40; i++) {
            const bx = ((i * 137) % CW);
            const by = ((i * 97) % (CH * 0.5));
            const blink = (Math.sin(t * 0.003 + i) + 1) / 2;
            ctx.fillStyle = `rgba(255,255,200,${0.3 + blink * 0.5})`;
            ctx.fillRect(bx, by, 1, 1);
        }
        // 희미한 달 (오른쪽 상단)
        const moonGrd2 = ctx.createRadialGradient(CW * 0.8, 45, 4, CW * 0.8, 45, 38);
        moonGrd2.addColorStop(0, "rgba(200,185,130,0.85)");
        moonGrd2.addColorStop(0.6, "rgba(140,120,80,0.35)");
        moonGrd2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = moonGrd2;
        ctx.beginPath(); ctx.arc(CW * 0.8, 45, 38, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(5,3,10,0.5)";
        ctx.beginPath(); ctx.arc(CW * 0.8 - 10, 40, 30, 0, Math.PI * 2); ctx.fill();
        // 마을 집 실루엣 (뒤로 물러남)
        ctx.fillStyle = "#04020a";
        for (let i = 0; i < 8; i++) {
            const bx2 = i * 85 - 20;
            const bh = 50 + (i % 3) * 16;
            ctx.fillRect(bx2, CH - 90 - bh, 60, bh);
            ctx.beginPath(); ctx.moveTo(bx2 - 4, CH - 90 - bh); ctx.lineTo(bx2 + 30, CH - 90 - bh - 24); ctx.lineTo(bx2 + 64, CH - 90 - bh); ctx.fill();
            ctx.fillStyle = `rgba(120,60,10,0.12)`;
            ctx.fillRect(bx2 + 12, CH - 90 - bh + 12, 10, 9);
            ctx.fillStyle = "#04020a";
        }
        // 묘지 지면 (전경)
        ctx.fillStyle = "#0e0818";
        ctx.fillRect(0, CH - 95, CW, 95);
        // 묘비들
        ctx.fillStyle = "#141020";
        for (let i = 0; i < 6; i++) {
            const gx = 25 + i * 95;
            const gy = CH - 80;
            const gh = 38 + (i % 2) * 14;
            ctx.fillRect(gx, gy - gh, 26, gh);
            ctx.beginPath(); ctx.arc(gx + 13, gy - gh, 13, Math.PI, 0); ctx.fill();
            // 묘비 이끼 느낌
            ctx.strokeStyle = "rgba(60,80,40,0.3)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(gx + 5, gy - gh + 8); ctx.lineTo(gx + 14, gy - 12); ctx.stroke();
        }
        // 안개
        const fogA2 = 0.12 + Math.sin(t * 0.001) * 0.04;
        ctx.fillStyle = `rgba(80,60,110,${fogA2})`;
        ctx.fillRect(0, CH - 100, CW, 100);
        // 중앙 묘비 (플레이어)
        ctx.fillStyle = "#1e1830";
        ctx.fillRect(CW / 2 - 20, CH - 130, 40, 82);
        ctx.beginPath(); ctx.arc(CW / 2, CH - 130, 20, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = "rgba(120,80,160,0.5)"; ctx.lineWidth = 2;
        ctx.strokeRect(CW / 2 - 20, CH - 130, 40, 82);
        ctx.beginPath(); ctx.arc(CW / 2, CH - 130, 20, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = "#6a5888"; ctx.font = "10px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText("HERO", CW / 2, CH - 100);
        ctx.textAlign = "left";
        // 지면
        ctx.fillStyle = "#08030f";
        ctx.fillRect(0, CH - 40, CW, 40);
        return;
    }

    if (bg === "grave") {
        // 각성 씬 — 노을 제거, night_grave 밤하늘에 묘비만 얹음
        // 암전에서 갑자기 이 장면이 나오므로 배경 톤이 연속되는 게 자연스러움
        ctx.fillStyle = "#060310";
        ctx.fillRect(0, 0, CW, CH);

        // 밤하늘 (night_grave와 동일)
        const gSky = ctx.createLinearGradient(0, 0, 0, CH * 0.62);
        gSky.addColorStop(0, "#18082e");
        gSky.addColorStop(1, "#22121a");
        ctx.fillStyle = gSky;
        ctx.fillRect(0, 0, CW, CH * 0.62);

        // 별
        for (let i = 0; i < 45; i++) {
            const bx = ((i * 137) % CW);
            const by = ((i * 97)  % (CH * 0.48));
            const blink = (Math.sin(t * 0.003 + i) + 1) / 2;
            ctx.fillStyle = `rgba(220,210,180,${0.25 + blink * 0.45})`;
            ctx.fillRect(bx, by, 1, 1);
        }

        // 달
        const gMoonX = CW * 0.78;
        const gMoonGrd = ctx.createRadialGradient(gMoonX, 44, 6, gMoonX, 44, 40);
        gMoonGrd.addColorStop(0, "rgba(195,180,125,0.88)");
        gMoonGrd.addColorStop(0.55, "rgba(135,115,78,0.38)");
        gMoonGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gMoonGrd;
        ctx.beginPath(); ctx.arc(gMoonX, 44, 40, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(5,2,10,0.52)";
        ctx.beginPath(); ctx.arc(gMoonX - 11, 38, 32, 0, Math.PI * 2); ctx.fill();

        // 먼 마을 집 실루엣
        ctx.fillStyle = "#030108";
        for (let i = 0; i < 8; i++) {
            const hx = i * 84 - 15;
            const hh = 44 + (i % 3) * 18;
            ctx.fillRect(hx, CH - 92 - hh, 64, hh);
            ctx.beginPath();
            ctx.moveTo(hx - 4, CH - 92 - hh);
            ctx.lineTo(hx + 32, CH - 92 - hh - 22);
            ctx.lineTo(hx + 68, CH - 92 - hh);
            ctx.fill();
            ctx.fillStyle = `rgba(120,55,10,0.09)`;
            ctx.fillRect(hx + 12, CH - 92 - hh + 14, 10, 8);
            ctx.fillStyle = "#030108";
        }

        // 묘지 지면
        ctx.fillStyle = "#0c0818";
        ctx.fillRect(0, CH - 96, CW, 96);

        // 묘비 6기
        for (let i = 0; i < 6; i++) {
            const gx = 22 + i * 96;
            const gh = 36 + (i % 2) * 14;
            ctx.fillStyle = "#0d0a0a";
            ctx.fillRect(gx, CH - 74 - gh, 26, gh);
            ctx.beginPath(); ctx.arc(gx + 13, CH - 74 - gh, 13, Math.PI, 0); ctx.fill();
        }

        // 중앙 묘비 (플레이어)
        ctx.fillStyle = "#100d10";
        ctx.fillRect(CW / 2 - 20, CH - 132, 40, 82);
        ctx.beginPath(); ctx.arc(CW / 2, CH - 132, 20, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = "rgba(80,50,80,0.18)"; ctx.lineWidth = 1;
        ctx.strokeRect(CW / 2 - 20, CH - 132, 40, 82);
        ctx.beginPath(); ctx.arc(CW / 2, CH - 132, 20, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = "rgba(75,55,70,0.5)";
        ctx.font = "10px SkullFont, NeoDunggeunmo"; ctx.textAlign = "center";
        ctx.fillText("HERO", CW / 2, CH - 100);
        ctx.textAlign = "left";

        // 안개
        const gFog = 0.1 + Math.sin(t * 0.001) * 0.035;
        ctx.fillStyle = `rgba(70,45,90,${gFog})`;
        ctx.fillRect(0, CH - 96, CW, 96);

        ctx.fillStyle = "#070510";
        ctx.fillRect(0, CH - 40, CW, 40);
        return;
    }

    if (bg === "skull") {
        // 검은 배경 + 표창형 빨간 불빛이 밝아졌다 어두워졌다 반복
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, CH);

        // 천천히 맥동하는 붉은 빛 (sin 주기 ~2.5초)
        const pulse = (Math.sin(t * 0.0025 * Math.PI * 2) + 1) / 2; // 0~1
        const cx2 = CW / 2, cy2 = CH / 2;

        // 표창(별) 모양 - 8방향 뾰족한 빛줄기
        const spikes = 8;
        const innerR = 18 + pulse * 12;   // 안쪽 반지름
        const outerR = 90 + pulse * 60;   // 바깥 반지름 (맥동)
        const glowR  = 180 + pulse * 100; // 글로우 범위

        // 바깥 글로우 그라데이션
        const glowGrd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, glowR);
        glowGrd.addColorStop(0,   `rgba(255, 0, 20, ${0.25 + pulse * 0.35})`);
        glowGrd.addColorStop(0.4, `rgba(180, 0, 10, ${0.12 + pulse * 0.18})`);
        glowGrd.addColorStop(1,   "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGrd;
        ctx.beginPath(); ctx.arc(cx2, cy2, glowR, 0, Math.PI * 2); ctx.fill();

        // 표창 본체
        ctx.fillStyle = `rgba(255, 0, 30, ${0.55 + pulse * 0.45})`;
        ctx.shadowBlur = 30 + pulse * 40;
        ctx.shadowColor = "#ff0022";
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            const px2 = cx2 + Math.cos(angle) * r;
            const py2 = cy2 + Math.sin(angle) * r;
            i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // 중심 밝은 핵
        const coreGrd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, innerR * 1.5);
        coreGrd.addColorStop(0,   `rgba(255, 200, 180, ${0.7 + pulse * 0.3})`);
        coreGrd.addColorStop(0.5, `rgba(255, 40, 20, ${0.5 + pulse * 0.3})`);
        coreGrd.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = coreGrd;
        ctx.beginPath(); ctx.arc(cx2, cy2, innerR * 1.5, 0, Math.PI * 2); ctx.fill();

        return;
    }

    if (bg === "throne") {
        // 왕좌 씬
        ctx.fillStyle = "#040004";
        ctx.fillRect(0, 0, CW, CH);
        // 핏빛 달
        const mGrd = ctx.createRadialGradient(CW / 2, 50, 10, CW / 2, 50, 100);
        mGrd.addColorStop(0, "rgba(180,0,0,0.6)");
        mGrd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = mGrd;
        ctx.beginPath(); ctx.arc(CW / 2, 50, 100, 0, Math.PI * 2); ctx.fill();
        // 왕좌 기둥들
        ctx.fillStyle = "#0a0008";
        for (let i = 0; i < 5; i++) {
            const px = 40 + i * 130;
            ctx.fillRect(px, 0, 20, CH - 30);
            ctx.beginPath(); ctx.arc(px + 10, 0, 10, Math.PI, 0); ctx.fill();
        }
        // 왕좌 실루엣
        ctx.fillStyle = "#080006";
        ctx.fillRect(CW / 2 - 45, CH * 0.3, 90, CH * 0.6);
        ctx.beginPath(); ctx.moveTo(CW / 2 - 45, CH * 0.3); ctx.lineTo(CW / 2, CH * 0.1); ctx.lineTo(CW / 2 + 45, CH * 0.3); ctx.fill();
        // 붉은 오라
        ctx.fillStyle = `rgba(150,0,0,${0.1 + Math.sin(t * 0.003) * 0.05})`;
        ctx.beginPath(); ctx.arc(CW / 2, CH * 0.3, 120, 0, Math.PI * 2); ctx.fill();
        // 지면
        ctx.fillStyle = "#060004";
        ctx.fillRect(0, CH - 30, CW, 30);
        return;
    }

    if (bg === "title") {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, CH);
        const pulse = (Math.sin(t * 0.004) + 1) / 2;
        ctx.fillStyle = `rgba(255,0,60,${0.7 + pulse * 0.3})`;
        ctx.font = "bold 52px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.shadowBlur = 25; ctx.shadowColor = "#ff0033";
        ctx.fillText("SKULL YUUSHA", CW / 2, CH / 2 - 10);
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(180,160,120,${0.5 + pulse * 0.3})`;
        ctx.font = "16px SkullFont, NeoDunggeunmo";
        ctx.fillText("— FIN —", CW / 2, CH / 2 + 30);
        ctx.textAlign = "left";
        return;
    }

    // fallback
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);
}


// ==========================================
// 오프닝 애니메이션 - 해골 용사 조립
// ==========================================

function updateOpeningAnim() {
    const a = Game.openingAnim;
    if (!a) return;
    a.t++;

    const done = a.t >= 420; // 애니메이션 자연 종료 (phase4 진입)
    
    if (done && !a.waitPhase) {
        // 조립 완료 → 대기 상태로 전환 (자동 진행 차단)
        a.waitPhase = true;
        a.waitT = 0;
    }
    
    if (a.waitPhase) {
        a.waitT++;
        // waitPhase 진입 직후엔 _spaceOld 강제 리셋 (이전 입력 차단)
        if (a.waitT === 1) { a._spaceOld = true; }
        // 60프레임(약 1초) 후 SPACE 입력 감지
        if (a.waitT > 60) {
            const spaceNow = dn("Space", "Enter", "KeyZ", "KeyX");
            if (spaceNow && !a._spaceOld) {
                Game.openingAnim = null;
                if (typeof stopBGM === 'function') stopBGM();
                Game.gs = "class_select";
                return;
            }
            a._spaceOld = spaceNow;
        }
        return;
    }
    
    // 조립 중 스킵 (phase 2 이상)
    const spaceNow = dn("Space", "Enter", "KeyZ", "KeyX");
    if (a.t > 160 && spaceNow && !a._spaceOld && !a.waitPhase) {
        a.waitPhase = true;
        a.waitT = 0;
        a.t = 420;
    }
    a._spaceOld = spaceNow;
}

function renderOpeningAnim(frameNow) {
    // 해골 조립 애니메이션 삭제 — scene_main.png 페이드인으로 대체
    const a = Game.openingAnim;
    if (!a) return;

    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, CW, CH);

    // scene_main 이미지 페이드인
    if (!Game._mainSceneImg) {
        Game._mainSceneImg = new Image();
        Game._mainSceneImg.src = "scene_main.png";
    }
    const img = Game._mainSceneImg;
    const fadeIn = Math.min(1, a.t / 60);

    if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = fadeIn;
        const scale = Math.max(CW / img.naturalWidth, CH / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.drawImage(img, (CW-dw)/2, (CH-dh)/2, dw, dh);
        ctx.restore();
    }

    // 해골용사 타이틀 — 이미지 위 보라빛 글로우 (a.t > 40부터 페이드인)
    if (a.t > 40) {
        const titleAlpha = Math.min(1, (a.t - 40) / 50);
        const pulse = 0.8 + Math.sin(frameNow * 0.007) * 0.2;
        ctx.save();
        ctx.globalAlpha = titleAlpha;
        ctx.textAlign = "center";
        ctx.font = "bold 48px SkullFont, NeoDunggeunmo";
        ctx.fillStyle = "#d4bfff";
        ctx.shadowBlur = 20 * pulse; ctx.shadowColor = "#9966ff";
        ctx.fillText("해골용사", CW/2, CH * 0.72);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // PRESS SPACE — 노란 깜빡임 (waitPhase 진입 후)
    if (a.waitPhase && a.waitT > 30) {
        const blink = Math.floor(frameNow / 380) % 2 === 0;
        if (blink) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffcc00";
            ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
            ctx.shadowBlur = 8; ctx.shadowColor = "#ffcc00";
            ctx.fillText("PRESS  SPACE", CW/2, CH * 0.72 + 32);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }
    ctx.textAlign = "left";
}