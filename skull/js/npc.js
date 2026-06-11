// ==========================================
// NPC 시스템 — 유령/생존자 대화
// ==========================================

// ── NPC 대화 데이터 ──────────────────────────
const NPC_DATA = {
    // W1-1: 첫 번째 죽은 용사 유령
    ghost_w1: {
        name: "쓰러진 용사의 유령",
        color: "#88ccff",
        worldN: 1, levelN: 1,
        x_ratio: 0.25, 
        lines: [
            "....또 다른 용사인가.",
            "나는 여기서 쓰러졌다. 이 발판 위에서.",
            "마왕의 저주가 내 다리를 녹였고, 나는 무릎을 꿇었다.",
            "그런데 너는... 산자가 아니군... 그럼에도 움직이는가?",
            "한 가지만 말해두지. 마왕은 힘이 아니라 절망을 먹고 산다.",
            "포기하지 마라. 그게 유일한 무기다.",
        ],
        repeatLine: "포기하지 마라. 그게 유일한 무기다." // 💡 반복 대사
    },

    // W3-1: 저주받은 마을의 노인
    elder_w3: {
        name: "생존자 노인",
        color: "#ffcc88",
        worldN: 3, levelN: 1,
        x_ratio: 0.2,
        lines: [
            "...살아있는 건가? 아니.. 망자로구나....",
            "우리 마을은 저주가 내리기 전엔 풍요로웠다네.",
            ".....하지만 그 날을 기점으로 우리는........",
            "손자 녀석도... 어느 날 눈빛이 사라지더니 전장에 나갔다네.",
            "돌아오지 않았어... 아마 저기 어딘가의 언데드가 됐겠지.",
            "자네가 마왕을 쓰러뜨릴 수 있다면... 부탁이네...",
            "내 손자를 — 아니, 저주받은 모든 이를 구원해다오.....",
        ],
        repeatLine: "내 손자를 — 아니, 저주받은 모든 이를 구원해다오.....",
    },

    // W5-1: 죽어가는 마족 병사
    demon_w5: {
        name: "쓰러진 마족 병사",
        color: "#cc88ff",
        worldN: 5, levelN: 1,
        x_ratio: 0.2,
        lines: [
            "...인간인가....? 스켈레톤......?",
            "하하... 어이없군... 내가 인간한테 도움받을 처지는 아니지만—",
            "마왕은..... 우리도 소모품으로 쓴다.",
            "저 더스크 괴수는 원래 우리 동료였어... 저주가 바꿔놓은 거야.",
            "마왕의 심기를 거스르면, 저 꼴이 되는거지.",
            "내 가족도.. 친구도....., ㅁ..왕을... 마ㅇ..을......!",
            "마왕을 죽여줘. 용사..",
        ],
        repeatLine: "마왕을 죽여줘. 용사..",
    },

    // W7-1: 봉인된 현자
    sage_w7: {
        name: "봉인된 현자",
        color: "#ffff88",
        worldN: 7, levelN: 1,
        x_ratio: 0.2,
        lines: [
            "오오... 여기까지 왔는가.",
            "나는 마왕이 생겨나던 날을 보았다네.",
            "그는 원래 인간이었다네. 그것도 아주 훌륭한.",
            "세상의 진리를 깨우치고, 세상의 이치를 깨달은 순간..",
            "진리의 문을 보고는... 이상한 말만 되풀이하며 사라졌다네.",
            "결국... 수 년뒤에 나타난 그는.... 우리가 아는 그 이가 아니었다네...",
            "모두가 절망하고 포기해버렸어..... 하지만....",
            "뼈에도 의지가 깃들 수 있다는 것을 — 네가 증명하고 있지 않은가.",
            "마왕을 멈추고... 이 세계를 구해주게.",
        ],
        repeatLine: "마왕을 멈추고... 이 세계를 구해주게.",
    },

    // W9-1: 마지막 용사의 유령
    comrade_w9: {
        name: "동료 용사의 유령",
        color: "#88ffcc",
        worldN: 9, levelN: 1,
        x_ratio: 0.2,
        lines: [
            "...돌아왔구나. 영혼마저 바래지 않은 채로.",
            "우리가 함께 맹세했던 날을 기억하나. 이 성의 끝에 도달하겠다던 그 약속을.",
            "나는 이곳에서 멈췄다. 육신이 아니라, 마왕이 드리운 절망에 마음이 먼저 꺾여서.",
            "하지만 너는 살점이 뜯겨나가고 뼈만 남았을지언정, 그 의지만은 부러지지 않았군.",
            "마왕이 기다리는 종착지는 저 문 너머다. 이미 알고 있겠지.",
            "마지막으로 청을 하나만 하마.",
            "마왕의 왕좌를 부수고, 놈이 빼앗아 간 우리의 명예를 되찾아다오.",
            "그리고... 부디 승리자로서 이 지옥을 걸어 나가라.",
        ],
        repeatLine: "마왕을 끝내다오. 무너진 우리 모두의 의지를 걸고, 부탁한다."
    },
};

let NPC_SEEN = {};

function resetNPCSeen() {
    NPC_SEEN = {};
}

function getNPCForStage(worldN, levelN) {
    const entries = Object.values(NPC_DATA);
    return entries.find(n => n.worldN === worldN && n.levelN === levelN) || null;
}

function spawnNPC(worldN, levelN) {
    const data = getNPCForStage(worldN, levelN);
    if (!data) return;
    const x = 80 + (data.worldN % 3) * 20; 
    const floorY = (typeof CH !== 'undefined' ? CH : 360) - 40;
    Game.eventObjects = Game.eventObjects || [];
    Game.eventObjects.push({
        type: "npc",
        npcKey: Object.keys(NPC_DATA).find(k => NPC_DATA[k] === data),
        x, y: floorY - 48, w: 20, h: 48,
        data, used: false, talking: false, dialogStep: 0, dialogT: 0,
    });
}

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

        const alpha = ev.talking ? 1.0 : (0.7 + Math.sin(t * 0.004) * 0.15);
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 14; ctx.shadowColor = col;
        ctx.fillStyle = col;
        ctx.fillRect(-7, -8 + bob, 14, 18);
        for (let i = 0; i < 4; i++) {
            const nx = -6 + i * 4;
            const nh = 4 + Math.sin(t * 0.005 + i) * 2;
            ctx.fillRect(nx, 10 + bob, 4, nh);
        }
        ctx.beginPath();
        ctx.arc(0, -16 + bob, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 6; ctx.shadowColor = "#ffffff";
        ctx.fillRect(-4, -18 + bob, 3, 3);
        ctx.fillRect(2, -18 + bob, 3, 3);
        ctx.shadowBlur = 0;

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

        if (ev.talking) _renderNPCDialog(ev, frameNow);
    }
}

function _renderNPCDialog(ev, frameNow) {
    const data = ev.data;
    // 💡 개별 반복 대사 적용 부분
    const lines = NPC_SEEN[ev.npcKey] ? [data.repeatLine || "..."] : data.lines;
    const step  = ev.dialogStep;
    if (step >= lines.length) return;

    const text = lines[step];
    const ex   = ev.x - Game.camX;
    const boxW = 420, boxH = 70;
    const boxX = Math.max(8, Math.min(CW - boxW - 8, ex - boxW / 2));
    const finalY = ev.y < CH * 0.4 ? ev.y + 55 : ev.y - boxH - 20;

    ctx.save();
    ctx.fillStyle   = "rgba(0,0,0,0.82)";
    ctx.strokeStyle = data.color || "#88ccff";
    ctx.lineWidth   = 1.5;
    ctx.fillRect(boxX, finalY, boxW, boxH);
    ctx.strokeRect(boxX, finalY, boxW, boxH);

    ctx.fillStyle = data.color || "#88ccff";
    ctx.font = "bold 11px SkullFont, NeoDunggeunmo";
    ctx.fillText(data.name, boxX + 10, finalY + 16);

    ctx.fillStyle = "#ffffff";
    ctx.font = "11px SkullFont, NeoDunggeunmo";
    _wrapDialogText(ctx, text, boxX + 10, finalY + 32, boxW - 20, 15);

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

function updateNPCs() {
    if (!Game.eventObjects || !Game.player || Game.player.dead) return;
    const p = Game.player;

    let anyTalking = false;
    for (const ev of Game.eventObjects) {
        if (ev.type !== "npc") continue;
        const inRange = Math.abs(p.x - ev.x) < 60 && Math.abs(p.y - ev.y) < 80;

        if (!ev.talking) {
            if (inRange && dn("KeyC") && !Game._npcCOld) {
                ev.talking = true;
                ev.dialogStep = 0;
                Game._npcCOld = true;
            }
        } else {
            anyTalking = true;
            if (dn("KeyC") && !Game._npcCOld) {
                ev.dialogStep++;
                Game._npcCOld = true;
                const lines = NPC_SEEN[ev.npcKey] ? [ev.data.repeatLine || "..."] : ev.data.lines;
                if (ev.dialogStep >= lines.length) {
                    ev.talking = false;
                    ev.dialogStep = 0;
                    NPC_SEEN[ev.npcKey] = true;
                }
            }
        }
    }
    // 대화 중 플래그 — update()에서 게임 로직 정지에 사용
    Game.npcTalking = anyTalking;
    Game._npcCOld = dn("KeyC");
}