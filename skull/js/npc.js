// ==========================================
// NPC 시스템 — 유령/생존자 대화
// 각 월드 진입 시 스테이지 특정 위치에 NPC 등장
// ==========================================

// ── NPC 대화 데이터 ──────────────────────────
const NPC_DATA = {

    // W1-1: 첫 번째 죽은 용사 유령 — 자신이 실패한 곳에 남겨진
    ghost_w1: {
        name: "쓰러진 용사의 유령",
        color: "#88ccff",
        worldN: 1, levelN: 1,
        x_ratio: 0.25, // 맵 너비 대비 위치
        lines: [
            "...또 다른 용사인가.",
            "나는 여기서 쓰러졌다. 이 발판 위에서.",
            "마왕의 저주가 내 다리를 녹였고, 나는 무릎을 꿇었다.",
            "그런데 너는... 뼈뿐이로군. 그래도 서있구나.",
            "한 가지만 말해두지. 마왕은 힘이 아니라 절망을 먹고 산다.",
            "포기하지 마라. 그게 유일한 무기다.",
        ]
    },

    // W3-1: 저주받은 마을의 노인 — 마왕의 저주로 모든 것을 잃은
    elder_w3: {
        name: "생존자 노인",
        color: "#ffcc88",
        worldN: 3, levelN: 1,
        x_ratio: 0.2,
        lines: [
            "...살아있는 건가? 아니, 뼈구나.",
            "우리 마을은 저주가 내리기 전엔 풍요로웠다네.",
            "마왕이 내린 저주는 사람의 의지를 갉아먹는다.",
            "손자 녀석도... 어느 날 눈빛이 사라지더니 전장에 나갔다.",
            "돌아오지 않았어. 아마 저기 어딘가의 언데드가 됐겠지.",
            "자네가 마왕을 쓰러뜨릴 수 있다면... 부탁이네.",
            "내 손자를 — 아니, 저주받은 모든 이를 돌려다오.",
        ]
    },

    // W5-1: 죽어가는 마족 병사 — 마왕에게 버려진
    demon_w5: {
        name: "쓰러진 마족 병사",
        color: "#cc88ff",
        worldN: 5, levelN: 1,
        x_ratio: 0.2,
        lines: [
            "...인간인가. 아니, 해골이군.",
            "웃기지 마라. 내가 인간한테 도움받을 처지는 아니지만—",
            "마왕은... 우리도 소모품으로 쓴다.",
            "저 더스크 괴수는 원래 우리 동료였어. 저주가 바꿔놓은 거야.",
            "마왕은 자기 편도 자기 뜻대로 되지 않으면 저주로 짐승을 만들어.",
            "...난 그게 싫어서 도망쳤다가 이꼴이 됐지.",
            "해골 용사. 마왕을 죽여라. 마족을 위해서도.",
        ]
    },

    // W7-1: 봉인된 현자 — 마왕의 본질을 아는 유일한 존재
    sage_w7: {
        name: "봉인된 현자",
        color: "#ffff88",
        worldN: 7, levelN: 1,
        x_ratio: 0.2,
        lines: [
            "오오... 여기까지 왔는가. 해골 용사여.",
            "나는 마왕이 생겨나던 날을 보았다.",
            "그는 원래 인간이었다. 절망한 왕이었지.",
            "세상이 자신을 버렸다고 느낀 날, 그는 스스로 저주를 받아들였다.",
            "즉, 마왕의 저주는 그의 절망이 세상에 흘러넘친 것이다.",
            "단검으로는 부족하다. 네 안의 의지로 부딪혀야 한다.",
            "뼈에도 의지가 깃들 수 있다는 것을 — 네가 증명하고 있지 않은가.",
        ]
    },

    // W9-1: 마지막 용사의 유령 — 주인공의 동료였던 자
    comrade_w9: {
        name: "동료 용사의 유령",
        color: "#88ffcc",
        worldN: 9, levelN: 1,
        x_ratio: 0.2,
        lines: [
            "...너였군. 살아있... 아니, 일어났군.",
            "우리가 함께 왔던 길 기억나? 여기까지 오기로 했잖아.",
            "나는 8번째 관문에서 멈췄다. 다리가 아니라 마음이 먼저 무너져서.",
            "너는 뼈만 남았어도 여기까지 왔어.",
            "마왕이 있는 방은 저 끝이다. 이미 알고 있겠지.",
            "두 가지만 부탁할게.",
            "마왕을 끝내줘. 그리고 — 살아 돌아와.",
            "...살아있는 게 뭔지는 모르겠지만, 뭐든 간에.",
        ]
    },
};

// ── NPC 게임 상태 ─────────────────────────────
// 이미 본 NPC는 다시 대화하지 않음 (짧은 인사만)
const NPC_SEEN = {};

// ── 현재 스테이지에 배치할 NPC 결정 ──────────
function getNPCForStage(worldN, levelN) {
    const entries = Object.values(NPC_DATA);
    return entries.find(n => n.worldN === worldN && n.levelN === levelN) || null;
}

// ── NPC를 맵에 생성 ───────────────────────────
function spawnNPC(worldN, levelN) {
    const data = getNPCForStage(worldN, levelN);
    if (!data) return;
    const x = Math.floor((Game.levelW || 1600) * data.x_ratio);
    const floorY = (typeof CH !== 'undefined' ? CH : 360) - 40;
    Game.eventObjects = Game.eventObjects || [];
    Game.eventObjects.push({
        type: "npc",
        npcKey: Object.keys(NPC_DATA).find(k => NPC_DATA[k] === data),
        x, y: floorY - 48, w: 20, h: 48,
        data,
        used: false,
        talking: false,
        dialogStep: 0,
        dialogT: 0,
    });
}

// ── NPC 렌더 ─────────────────────────────────
function renderNPCs(frameNow) {
    if (!Game.eventObjects) return;
    for (const ev of Game.eventObjects) {
        if (ev.type !== "npc") continue;
        const ex = ev.x - Game.camX;
        if (ex < -60 || ex > CW + 60) continue;

        const t = frameNow;
        const bob = Math.sin(t * 0.003) * 2;
        const data = ev.data;
        const col = data.color || "#88ccff";
        const seen = NPC_SEEN[ev.npcKey];

        ctx.save();
        ctx.translate(Math.round(ex + ev.w / 2), Math.round(ev.y + ev.h / 2));

        // 유령 반투명 효과
        const alpha = ev.talking ? 1.0 : (0.7 + Math.sin(t * 0.004) * 0.15);
        ctx.globalAlpha = alpha;

        // 후광 — shadowBlur만 사용 (createRadialGradient 색상 변환 에러 방지)
        ctx.shadowBlur = 14; ctx.shadowColor = col;

        // 몸통 (로브 형태)
        ctx.fillStyle = col;
        ctx.fillRect(-7, -8 + bob, 14, 18);
        // 로브 하단 너울
        for (let i = 0; i < 4; i++) {
            const nx = -6 + i * 4;
            const nh = 4 + Math.sin(t * 0.005 + i) * 2;
            ctx.fillRect(nx, 10 + bob, 4, nh);
        }
        // 머리
        ctx.beginPath();
        ctx.arc(0, -16 + bob, 9, 0, Math.PI * 2);
        ctx.fill();
        // 눈 (빛나는)
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 6; ctx.shadowColor = "#ffffff";
        ctx.fillRect(-4, -18 + bob, 3, 3);
        ctx.fillRect(2, -18 + bob, 3, 3);
        ctx.shadowBlur = 0;

        // 상호작용 힌트
        if (!seen && !ev.talking) {
            const blink = Math.floor(t / 400) % 2 === 0;
            if (blink) {
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 8px SkullFont, NeoDunggeunmo";
                ctx.textAlign = "center";
                ctx.fillText("[C] 대화", 0, -32 + bob);
            }
        }
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();

        // 대화창
        if (ev.talking) {
            _renderNPCDialog(ev, frameNow);
        }
    }
}

// ── NPC 대화창 렌더 ───────────────────────────
function _renderNPCDialog(ev, frameNow) {
    const data = ev.data;
    const lines = NPC_SEEN[ev.npcKey] ? ["...또 왔군. 잘 가게."] : data.lines;
    const step  = ev.dialogStep;
    if (step >= lines.length) return;

    const text = lines[step];
    const ex   = ev.x - Game.camX;

    // 대화창 배경
    const boxW = 420, boxH = 70;
    const boxX = Math.max(8, Math.min(CW - boxW - 8, ex - boxW / 2));
    const boxY = ev.y - Game.camX * 0 - boxH - 18;
    const bY   = Math.max(8, Math.min(CW * 0 + (ev.y < CH / 2 ? ev.y + 60 : ev.y - boxH - 20), ev.y - boxH - 20));

    const finalY = ev.y < CH * 0.4 ? ev.y + 55 : ev.y - boxH - 20;

    ctx.save();
    ctx.fillStyle   = "rgba(0,0,0,0.82)";
    ctx.strokeStyle = data.color || "#88ccff";
    ctx.lineWidth   = 1.5;
    ctx.fillRect(boxX, finalY, boxW, boxH);
    ctx.strokeRect(boxX, finalY, boxW, boxH);

    // 화자 이름
    ctx.fillStyle = data.color || "#88ccff";
    ctx.font = "bold 11px SkullFont, NeoDunggeunmo";
    ctx.fillText(data.name, boxX + 10, finalY + 16);

    // 대사 텍스트 — 자동 줄바꿈
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px SkullFont, NeoDunggeunmo";
    _wrapDialogText(ctx, text, boxX + 10, finalY + 32, boxW - 20, 15);

    // 진행 힌트
    const prog  = step + 1;
    const total = lines.length;
    ctx.fillStyle = "rgba(180,180,180,0.7)";
    ctx.font = "9px SkullFont, NeoDunggeunmo";
    ctx.textAlign = "right";
    const cont = prog < total ? "[C] 다음" : "[C] 닫기";
    ctx.fillText(`${prog}/${total}  ${cont}`, boxX + boxW - 8, finalY + boxH - 8);
    ctx.textAlign = "left";
    ctx.restore();
}

function _wrapDialogText(ctx, text, x, y, maxW, lineH) {
    const words = text.split("");
    let line = "", cx = x, maxLine = maxW;
    for (let i = 0; i < words.length; i++) {
        const test = line + words[i];
        if (ctx.measureText(test).width > maxLine && line.length > 0) {
            ctx.fillText(line, cx, y);
            y += lineH; line = words[i];
        } else { line = test; }
    }
    if (line) ctx.fillText(line, cx, y);
}

// ── NPC 상호작용 처리 ─────────────────────────
// main.js updateItemsAndMisc에서 호출
function updateNPCs() {
    if (!Game.eventObjects || !Game.player || Game.player.dead) return;
    const p = Game.player;

    for (const ev of Game.eventObjects) {
        if (ev.type !== "npc") continue;

        // 범위 내 C키로 대화 시작/진행
        const inRange = Math.abs(p.x - ev.x) < 60 && Math.abs(p.y - ev.y) < 80;

        if (!ev.talking) {
            if (inRange && dn("KeyC") && !Game._npcCOld) {
                ev.talking = true;
                ev.dialogStep = 0;
                Game._npcCOld = true;
            }
        } else {
            // 대화 진행 — C키로 다음
            if (dn("KeyC") && !Game._npcCOld) {
                ev.dialogStep++;
                Game._npcCOld = true;
                const lines = NPC_SEEN[ev.npcKey]
                    ? ["...또 왔군. 잘 가게."]
                    : ev.data.lines;
                if (ev.dialogStep >= lines.length) {
                    ev.talking = false;
                    ev.dialogStep = 0;
                    NPC_SEEN[ev.npcKey] = true; // 이미 본 NPC 표시
                }
            }
        }
    }
    Game._npcCOld = dn("KeyC");
}