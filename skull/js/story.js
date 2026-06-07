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

  // 오프닝: 텍스트 스토리 → 마지막 씬에서 해골 조립 애니메이션으로 전환
  opening: [
    { bg: "black",       speaker: "",         duration: 90,  text: "" },
    { bg: "village",     speaker: "내레이터", duration: 180, text: "오래전, 인간과 마족 사이에는 끊임없는 전쟁이 있었다." },
    { bg: "village",     speaker: "내레이터", duration: 180, text: "선택받은 용사와 마왕 사이에 마지막 결전이 있던 날-" },
    { bg: "battlefield", speaker: "내레이터", duration: 160, text: "결국 용사는 패배하고 말았고, 인간들의 도시는 화염에 휩싸였다." },
    { bg: "black",       speaker: "",         duration: 80,  text: "" },
    { bg: "black",       speaker: "내레이터", duration: 160, text: "그렇게 끝이 나는줄 알았지만, 주술사의 저주에 의해 용사는 죽지 못했다." },
    { bg: "black",       speaker: "내레이터", duration: 180, text: "살도, 피도, 심장도 없이. 오직 마왕을 죽이겠다는 의지만이 남았다." },
    { bg: "night_grave", speaker: "??",       duration: 180, text: "........" },
    { bg: "grave",       speaker: "용사", duration: 200, text: "이 손에 살이 없어도. 이 가슴에 심장이 없어도—" },
    { bg: "grave",       speaker: "용사", duration: 180, text: "마왕을 죽이고 세상을 되찾아 보이겠어." },
  ],

  // 보스별 등장 대사 [worldN] = [{speaker, text, duration}]
  // 보스별 등장 대사 [worldN] = [{speaker, text, duration}]
  boss: {
    1:  [
      { speaker: "고블린 킹",     duration: 140, text: "이 영역에서 살아 돌아간 자는 없다. 뼈가 됐든 뭐가 됐든." },
      { speaker: "해골용사",      duration: 140, text: "안심해. 난 이미 뼈만 남았으니까." },
    ],
    2:  [
      { speaker: "언데드 고블린 킹", duration: 150, text: "...나도 너처럼 죽어서 일어났다. 그래서 더 두렵다." },
      { speaker: "해골용사",      duration: 150, text: "죽음에 먹힌 자와 죽음을 딛고 일어선 자. 그 차이를 보여주지." },
    ],
    3:  [
      { speaker: "스켈레톤 치프틴", duration: 150, text: "동족이여, 왜 산 자들의 편에 서느냐. 우리는 버림받았다." },
      { speaker: "해골용사",      duration: 150, text: "저주가 아니라 의지로 일어났어. 그게 다른 점이야." },
    ],
    4:  [
      { speaker: "언데드 스켈레톤", duration: 150, text: "...우리는 마왕의 것이다. 돌아설 수 없다." },
      { speaker: "해골용사",      duration: 140, text: "그렇다면 그 사슬, 내 검으로 끊어줄게." },
    ],
    5:  [
      { speaker: "내레이터",        duration: 140, text: "형체도 이성도 없는 것이 눈앞을 막아섰다." },
      { speaker: "거대 괴수 리치", duration: 130, text: "GROOAAARGH—!!" },
      { speaker: "내레이터",        duration: 130, text: "마왕의 분노가 짐승의 형태를 빌려 세상을 짓눌렀다." },
    ],
    6:  [
      { speaker: "언데드 리치",      duration: 160, text: "삶도 죽음도 초월한 자. 나는 수천 년을 기다렸다." },
      { speaker: "언데드 리치",      duration: 150, text: "네 안의 불꽃이 꺼지기 전에 내가 먼저 삼키겠다." },
      { speaker: "해골용사",      duration: 150, text: "수천 년의 기다림도, 오늘로 끝이야." },
    ],
    7:  [
      { speaker: "마족 제1친위대장", duration: 150, text: "뼈다귀 하나가 여기까지 오다니. 마왕님도 흥미로워하시겠군." },
      { speaker: "마족 제1친위대장", duration: 140, text: "하지만 구경은 내가 끝낸다." },
      { speaker: "해골용사",      duration: 140, text: "구경꾼은 원래 말이 많은 법이지. 덤벼." },
    ],
    8:  [
      { speaker: "마족 제2친위대장", duration: 150, text: "이 검에 베이면 영혼조차 남지 않는다. 뼈도 예외는 없어." },
      { speaker: "해골용사",      duration: 150, text: "영혼이 남지 않는다면, 이 분노만으로 널 베어주지." },
    ],
    9:  [
      { speaker: "마족 제3친위대장", duration: 160, text: "...인정한다. 여기까지 온 자는 네가 처음이다." },
      { speaker: "마족 제3친위대장", duration: 150, text: "하지만 이 문은 내 목숨과 함께 닫혀있다." },
      { speaker: "해골용사",      duration: 150, text: "너의 긍지도, 목숨도, 이 문과 함께 부숴버리겠어." },
    ],
    10: [
      { speaker: "해골용사",      duration: 160, text: "마왕!!!!!! " },
      { speaker: "마왕",            duration: 170, text: "...누가 겁도없이 짐에게 도전하는가?" },
      { speaker: "마왕",            duration: 180, text: "살도 피도 없이, 오직 뼈로만 이 길을 걸어왔다니." },
      { speaker: "마왕",            duration: 170, text: "....건방지군" },
      { speaker: "해골용사",            duration: 180, text: "... 뼈만 남은 나일지라도 너를 죽이고 평화를 되찾겠어." },
      { speaker: "마왕",            duration: 170, text: "네가 다시 인간으로 돌아갈 수 있을 거라 생각하나?" },
      { speaker: "해골용사",      duration: 150, text: "상관없어. 처음부터 각오한 길이니까." },
    ],
  },

  ending: [
    { bg: "black",   speaker: "",         duration: 90,  text: "" },
    { bg: "throne",  speaker: "내레이터", duration: 180, text: "마왕이 무너졌다. 마왕성 전체가 무거운 침묵에 잠겼다." },
    { bg: "throne",  speaker: "마왕",     duration: 180, text: "...인간 따위에게 패배하다니... 용사 ...." },
    { bg: "throne",  speaker: "마왕",     duration: 190, text: "하지만 — 해골 뿐인 네가 다시 돌아갈 곳은 아무 곳도 없다..." },
    { bg: "skull",   speaker: "해골용사", duration: 160, text: "....." },
    { bg: "skull",   speaker: "해골용사", duration: 200, text: "처음부터 나 자신을 위해 싸운 게 아니었으니까 상관없어." },
    { bg: "black",   speaker: "",         duration: 120, text: "" },
    { bg: "village", speaker: "내레이터", duration: 200, text: "저주가 걷혔다. 어두웠던 하늘에 다시 빛이 돌아왔다." },
    { bg: "village", speaker: "내레이터", duration: 200, text: "사람들은 세상을 짓누르던 무언가가 사라졌음을 느꼈지만, 누가 그들을 구했는지는 알지 못했다." },
    { bg: "village", speaker: "내레이터", duration: 200, text: "다만 — 따뜻한 바람이 불었다. 어딘가 아주 익숙한 방향으로." },
    { bg: "black",   speaker: "",         duration: 130, text: "" },
    { bg: "title",   speaker: "",         duration: 240, text: "해골용사" },
    { bg: "black",   speaker: "",         duration: 90,  text: "" },
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
        // 텍스트 스토리 끝 → 해골 조립 애니메이션
        Game.openingAnim = { t: 0, phase: 0, eyeOn: false };
        Game.gs = "opening_anim";
    } else if (type === "boss") {
        // 컷신 끝나고 플레이로 — 카메라/상태 초기화
        Game.gs = "play";
        Game.camShake = 0;
        Game.hitStop  = 0;
        Game.transT   = 0;
    } else if (type === "ending") {
        // 엔딩 컷신 종료 → 엔딩 BGM → 로비
        if (typeof stopBGM === 'function') stopBGM();
        if (typeof playBGM === 'function') playBGM('ending');
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

    // SPACE / ENTER / Z 로 스킵
    const skip = dn("Space", "Enter", "KeyZ", "KeyX");
    if ((cs.t >= cur.duration || skip) && cs.t > 10) {
        cs.step++;
        cs.t = 0;
        if (cs.step >= cs.lines.length) {
            _cutsceneEnd(cs.type);
        }
    }
}

// ── 컷신 렌더 (매 프레임 호출) ────────────────────────────

function renderCutscene(frameNow) {
    const cs = Game.cutscene;
    if (!cs) return;

    const cur = cs.lines[cs.step];
    if (!cur) return;

    // 배경
    _drawCutsceneBg(cur.bg, frameNow);

    // 페이드 처리
    const fadeDur = 18;
    let alpha = 1;
    if (cs.t < fadeDur) alpha = cs.t / fadeDur;
    else if (cs.t > cur.duration - fadeDur) alpha = Math.max(0, (cur.duration - cs.t) / fadeDur);

    // 대사 박스
    if (cur.text) {
        // 반투명 하단 박스 — 캔버스 하단 잘림 방지: CH가 360px 기준이므로 여유 확보
        const boxH = 100;
        const boxY = CH - boxH - 4; // 하단에서 4px 여백
        ctx.fillStyle = `rgba(0,0,0,${0.8 * alpha})`;
        ctx.fillRect(0, boxY, CW, boxH + 4);
        ctx.strokeStyle = `rgba(180,30,30,${0.65 * alpha})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(6, boxY + 4, CW - 12, boxH - 4);

        // 화자 이름
        if (cur.speaker) {
            ctx.fillStyle = `rgba(255,180,30,${alpha})`;
            ctx.font = "bold 13px SkullFont, NeoDunggeunmo";
            ctx.textAlign = "left";
            ctx.fillText(cur.speaker, 16, boxY + 22);
        }

        // 대사 텍스트 (줄바꿈 지원)
        ctx.fillStyle = `rgba(240,230,220,${alpha})`;
        ctx.font = "14px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "left";
        _wrapCutsceneText(cur.text, 16, boxY + 42, CW - 32, 22, alpha);
    }

    // 스킵 안내 (박스 안 오른쪽 하단)
    if (cs.t > 40) {
        const boxY2 = CH - 108;
        const blinkAlpha = ((Math.sin(frameNow * 0.006) + 1) / 2) * 0.5 * alpha;
        ctx.fillStyle = `rgba(150,150,150,${blinkAlpha})`;
        ctx.font = "11px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "right";
        ctx.fillText("[SPACE] 다음", CW - 14, boxY2 + 92);
        ctx.textAlign = "left";
    }
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
    const a = Game.openingAnim;
    if (!a) return;
    const t = a.t;

    // 배경
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, CW, CH);

    // 별 (흩뿌려진 뼈 파티클 → 중심으로 모임)
    const cx = CW / 2, cy = CH / 2 - 10;

    // Phase 0 (0~60): 어둠 속 정적
    // Phase 1 (60~160): 뼈 파편들이 흩어져 있다가 중심으로 모임
    // Phase 2 (160~260): 해골 형태로 조립 (뼈 조각들 제자리)
    // Phase 3 (260~340): 눈이 천천히 켜짐
    // Phase 4 (340~420): 붉은 눈 빛남 + 타이틀 텍스트

    const phase = t < 60 ? 0 : t < 160 ? 1 : t < 260 ? 2 : t < 340 ? 3 : 4;
    a.phase = phase;

    if (phase === 0) {
        // 순수 암전 + 미세한 먼지 파티클
        for (let i = 0; i < 12; i++) {
            const px = ((i * 173 + t * 0.5) % CW);
            const py = ((i * 97 + t * 0.3) % CH);
            ctx.fillStyle = `rgba(80,60,60,${0.05 + (i%3)*0.02})`;
            ctx.fillRect(px, py, 1, 1);
        }
        return;
    }

    if (phase >= 1 && phase < 2) {
        // 뼈 파편들이 사방에서 중심으로 날아옴
        const prog = (t - 60) / 100; // 0→1
        const eased = 1 - Math.pow(1 - prog, 3); // ease-out cubic
        const bones = [
            { sx:-200, sy:-150 }, { sx:200, sy:-130 }, { sx:-160, sy:100 },
            { sx:180, sy: 120 }, { sx:0, sy:-220 }, { sx:0, sy:180 },
            { sx:-220, sy:0 }, { sx:220, sy:0 }, { sx:-100, sy:-200 },
            { sx:100, sy:200 },
        ];
        bones.forEach((b, i) => {
            const bx = cx + b.sx * (1 - eased);
            const by = cy + b.sy * (1 - eased);
            const rot = b.sx * 0.05 * (1 - eased);
            ctx.save();
            ctx.translate(bx, by); ctx.rotate(rot);
            ctx.fillStyle = `rgba(200,190,170,${0.3 + eased * 0.5})`;
            ctx.fillRect(-4, -12, 8, 24);
            ctx.fillRect(-8, -14, 16, 5);
            ctx.fillRect(-8, 9, 16, 5);
            ctx.restore();
        });
        return;
    }

    // phase 2+: 두개골만 렌더 — 얼굴 뼈에 집중해 임팩트 강화
    const asmProg = phase === 2 ? Math.min(1, (t - 160) / 80) : 1;
    const skullScale = 1.5 + asmProg * 0.5; // 조립되며 커지는 효과

    ctx.save();
    ctx.globalAlpha = asmProg;
    ctx.translate(cx, cy);
    ctx.scale(skullScale, skullScale);

    // 두개골 본체
    ctx.fillStyle = "#e0ddd5";
    ctx.beginPath(); ctx.arc(0, -10, 28, 0, Math.PI * 2); ctx.fill();

    // 광대뼈 돌출
    ctx.fillStyle = "#c8c5bd";
    ctx.fillRect(-30, -6, 7, 9);
    ctx.fillRect(23, -6, 7, 9);

    // 이마 능선
    ctx.fillStyle = "#d5d2c8";
    ctx.fillRect(-24, -28, 48, 7);

    // 관자놀이 홈
    ctx.fillStyle = "#ccc8bc";
    ctx.fillRect(-28, -22, 5, 12);
    ctx.fillRect(23, -22, 5, 12);

    // 코뼈 구멍
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.moveTo(-4, -2); ctx.lineTo(0, -8); ctx.lineTo(4, -2);
    ctx.closePath(); ctx.fill();

    // 아래턱
    ctx.fillStyle = "#d8d5ca";
    ctx.beginPath();
    ctx.arc(0, 8, 18, 0, Math.PI); ctx.fill();
    ctx.fillRect(-18, 4, 36, 8);

    // 이빨 (위아래)
    ctx.fillStyle = "#eeeae0";
    ctx.fillRect(-16, 7, 32, 5);
    ctx.fillStyle = "#1a1818";
    for (let ti = 0; ti < 5; ti++) {
        ctx.fillRect(-14 + ti * 7, 7, 4, 5);  // 이빨 사이 틈
    }
    ctx.fillStyle = "#eeeae0";
    ctx.fillRect(-14, 12, 28, 4);

    // 눈 구멍 (phase 3 이전)
    if (phase < 3) {
        ctx.fillStyle = "#0a0808";
        ctx.beginPath(); ctx.ellipse(-11, -16, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(11, -16, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
        // 눈구멍 속 어둠 강조
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(-11, -16, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(11, -16, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();

    // Phase 3: 눈이 켜짐 — 새 좌표계(cx,cy 기준 scale 적용)
    if (phase >= 3) {
        const eyeProg  = phase === 3 ? Math.min(1, (t - 260) / 60) : 1;
        const eyeA     = eyeProg * (0.7 + Math.sin(frameNow * 0.004) * 0.3);
        const skScale2 = 1.5 + 0.5; // 완성된 크기

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(skScale2, skScale2);

        // 눈구멍 검정
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(-11, -16, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(11, -16, 8, 10, 0, 0, Math.PI * 2); ctx.fill();

        // 붉은 눈동자 + 글로우
        ctx.fillStyle = `rgba(255, 0, 0, ${eyeA})`;
        ctx.shadowBlur = 20 * eyeProg; ctx.shadowColor = "#ff0000";
        ctx.beginPath(); ctx.ellipse(-11, -16, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(11, -16, 5, 7, 0, 0, Math.PI * 2); ctx.fill();

        // 눈에서 뻗어나오는 빛줄기
        if (eyeProg > 0.5) {
            const rayA = (eyeProg - 0.5) * 2 * 0.3;
            ctx.strokeStyle = `rgba(255,0,0,${rayA})`;
            ctx.lineWidth = 0.8;
            for (let ri = 0; ri < 6; ri++) {
                const ang = ri * Math.PI / 3;
                ctx.beginPath();
                ctx.moveTo(-11 + Math.cos(ang) * 6, -16 + Math.sin(ang) * 7);
                ctx.lineTo(-11 + Math.cos(ang) * 18, -16 + Math.sin(ang) * 20);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(11 + Math.cos(ang) * 6, -16 + Math.sin(ang) * 7);
                ctx.lineTo(11 + Math.cos(ang) * 18, -16 + Math.sin(ang) * 20);
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Phase 4: 타이틀 텍스트 + 대기 상태 PRESS SPACE 깜빡임
    if (phase >= 4 || (a && a.waitPhase)) {
        const txtProg = (a && a.waitPhase) ? 1.0 : Math.min(1, (t - 340) / 60);
        ctx.fillStyle = `rgba(255,0,60,${txtProg * 0.9})`;
        ctx.font = "bold 38px SkullFont, NeoDunggeunmo";
        ctx.textAlign = "center";
        ctx.shadowBlur = 18; ctx.shadowColor = "#ff0033";
        ctx.fillText("SKULL YUUSHA", cx, cy + 115);
        ctx.shadowBlur = 0;
        // 대기 상태에서는 깜빡이는 PRESS SPACE
        if (a && a.waitPhase) {
            const blink = Math.floor(frameNow / 480) % 2 === 0;
            ctx.fillStyle = blink ? "rgba(255,220,80,0.95)" : "rgba(180,160,100,0.3)";
            ctx.font = "bold 15px SkullFont, NeoDunggeunmo";
            ctx.shadowBlur = blink ? 10 : 0; ctx.shadowColor = "#ffcc44";
            ctx.fillText("PRESS  SPACE  TO  START", cx, cy + 142);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = `rgba(180,160,140,${txtProg * 0.4})`;
            ctx.font = "13px SkullFont, NeoDunggeunmo";
            ctx.fillText("[ SPACE ] 계속", cx, cy + 138);
        }
        ctx.textAlign = "left";
    }
}