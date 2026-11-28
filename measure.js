window.ACM = window.ACM || {};

/**
 * ACM.Measure: tape-reading and squaring easter eggs scattered through Alder Creek.
 * tape  -> read a drawn tape measure at the end of the object (fractions get finer as your rating grows)
 * square-> judge a corner: gap against a framing square, or equal / unequal diagonals
 * First success on a spot: +reputation and hearts with the villager nearby. After that a spot only pays a small tip once per day.
 */
ACM.Measure = (function () {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const rnd = (n) => Math.floor(Math.random() * n);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  function fmt(sixteenths) {
    const whole = Math.floor(sixteenths / 16), r = sixteenths % 16;
    if (!r) return `${whole}"`;
    const g = gcd(r, 16);
    return `${whole ? whole + " " : ""}${r / g}/${16 / g}"`;
  }
  const stepFor = (stars) => (stars < 1.7 ? 4 : stars < 3 ? 2 : 1); // in sixteenths: 1/4, 1/8, 1/16
  const REP_FIRST = 0.015, REP_CAP = 0.5;

  const TAPE = { span: 6, x0: 20 };
  const tapeW0 = (L) => Math.max(0, Math.floor(L / 16) - 2);
  /** L: where the board ends, in sixteenths. M: where the player's marker is (sixteenths). */
  function drawTape(cv, L, M) {
    const c = cv.getContext("2d"), W = cv.width, H = cv.height;
    const w0 = tapeW0(L), span = TAPE.span, ppi = (W - 40) / span, x0 = TAPE.x0;
    const X = (s16) => x0 + ((s16 / 16) - w0) * ppi;
    c.fillStyle = "#e9dfc4"; c.fillRect(0, 0, W, H);
    c.fillStyle = "#b98a54"; c.fillRect(0, 12, X(L), 38);
    c.fillStyle = "#a07440"; for (let i = 0; i < 6; i++) c.fillRect(0, 18 + i * 6, X(L), 1);
    c.fillStyle = "#6e4a24"; c.fillRect(X(L) - 2, 10, 3, 42);
    c.fillStyle = "#f7d84a"; c.fillRect(0, 62, W, 62);
    c.fillStyle = "#2a2a2a"; c.fillRect(0, 62, W, 2);
    c.font = "bold 14px monospace"; c.textAlign = "center";
    for (let s = w0 * 16; s <= (w0 + span) * 16; s++) {
      const x = X(s); if (x < 0 || x > W) continue;
      let len = 0;
      if (s % 16 === 0) len = 38; else if (s % 8 === 0) len = 30; else if (s % 4 === 0) len = 22; else if (s % 2 === 0) len = 15; else len = 9;
      c.fillStyle = "#1c1c1c"; c.fillRect(Math.round(x), 64, 1.5, len);
      if (s % 16 === 0) c.fillText(String(s / 16), x, 112);
    }
    // the sliding marker: grab it (or click the tape) and line it up with the end of the board
    const mx = X(M);
    c.strokeStyle = "#c0392b"; c.lineWidth = 3; c.beginPath(); c.moveTo(mx, 6); c.lineTo(mx, 126); c.stroke();
    c.fillStyle = "#c0392b"; c.beginPath(); c.moveTo(mx - 8, 4); c.lineTo(mx + 8, 4); c.lineTo(mx, 18); c.closePath(); c.fill();
    c.fillRect(mx - 9, 120, 18, 8);
  }
  /** pointer x (in canvas pixels) -> sixteenths, snapped to 1/8" */
  function tapeFromX(cv, L, px) {
    const ppi = (cv.width - 40) / TAPE.span, w0 = tapeW0(L);
    const s16 = ((px - TAPE.x0) / ppi + w0) * 16;
    return Math.max(w0 * 16 + 2, Math.min((w0 + TAPE.span) * 16 - 2, Math.round(s16 / 2) * 2));
  }

  function tapeChallenge(part) {
    const L = Math.round(part.v * 8) * 2;                        // sixteenths, always a multiple of 1/8"
    let M = L + (Math.random() < 0.5 ? -1 : 1) * (3 + rnd(5)) * 2;
    const w0 = tapeW0(L);
    M = Math.max(w0 * 16 + 2, Math.min((w0 + TAPE.span) * 16 - 2, M));
    if (M === L) M += 6;
    return { L, M, answer: L, part };
  }

  function drawCorner(cv, deg, deviate) {
    const c = cv.getContext("2d"), W = cv.width, H = cv.height;
    c.fillStyle = "#e9dfc4"; c.fillRect(0, 0, W, H);
    const px = 90, py = H - 40, len = 220;
    // board A along +x, board B at angle
    const th = (deg * Math.PI) / 180;
    const bx = px + Math.cos(-th) * len, by = py + Math.sin(-th) * len;
    c.fillStyle = "#b98a54"; c.strokeStyle = "#6e4a24"; c.lineWidth = 2;
    c.fillRect(px, py, 300, 22); c.strokeRect(px, py, 300, 22);
    c.save(); c.translate(px, py); c.rotate(-th); c.fillRect(0, -22, len + 40, 22); c.strokeRect(0, -22, len + 40, 22); c.restore();
    // framing square: leg along board A inner edge, other leg straight up (true 90)
    c.fillStyle = "#8a97a6"; c.strokeStyle = "#3d4650";
    c.fillRect(px, py - 6, 220, 6); c.fillRect(px, py - 150, 6, 150);
    c.strokeRect(px, py - 6, 220, 6); c.strokeRect(px, py - 150, 6, 150);
    c.fillStyle = "#222"; for (let i = 1; i < 14; i++) { c.fillRect(px + i * 16, py - 6, 1, 3); c.fillRect(px, py - i * 10, 3, 1); }
    // gap highlight
    c.fillStyle = "rgba(255,255,255,0.0)";
    c.font = "13px sans-serif"; c.fillStyle = "#4a3320"; c.textAlign = "left";
    c.fillText("framing square", px + 70, py - 14);
  }

  function drawDiag(cv, w, h, d1, d2) {
    const c = cv.getContext("2d"), W = cv.width, H = cv.height;
    c.fillStyle = "#e9dfc4"; c.fillRect(0, 0, W, H);
    const asp = w / h;
    let rw = 240, rh = rw / asp;
    if (rh > 150) { rh = 150; rw = rh * asp; }
    if (rh < 60) { rh = 60; rw = Math.min(400, rh * asp); }
    const x = (W - rw) / 2, y = 30;
    c.fillStyle = "#b98a54"; c.strokeStyle = "#6e4a24"; c.lineWidth = 3;
    c.fillRect(x, y, rw, rh); c.strokeRect(x, y, rw, rh);
    c.strokeStyle = "#c0392b"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + rw, y + rh); c.stroke();
    c.strokeStyle = "#2e6fb5"; c.beginPath(); c.moveTo(x + rw, y); c.lineTo(x, y + rh); c.stroke();
    c.font = "bold 14px sans-serif"; c.textAlign = "center";
    c.fillStyle = "#3a2a18"; c.fillText(fmt(w * 16), x + rw / 2, y - 8); c.fillText(fmt(h * 16), x - 36, y + rh / 2);
    c.fillStyle = "#c0392b"; c.fillText("A: " + fmt(d1), x + rw * 0.3, y + rh * 0.3 - 4);
    c.fillStyle = "#2e6fb5"; c.fillText("B: " + fmt(d2), x + rw * 0.7, y + rh * 0.3 - 4);
  }

  function squareChallenge(m) {
    if (!m.frame || Math.random() < 0.4) {
      const sq = Math.random() < 0.34;
      const dev = sq ? 0 : (Math.random() < 0.5 ? -1 : 1) * (4 + rnd(6));
      return { style: "gap", deg: 90 + dev, answer: sq ? 0 : dev < 0 ? -1 : 1 };
    }
    const w = m.frame.w, h = m.frame.h;
    const d = Math.round(Math.sqrt(w * w + h * h) * 8) * 2;     // diagonal in sixteenths, a multiple of 1/8"
    const sq = Math.random() < 0.5;
    const off = sq ? 0 : (1 + rnd(4)) * 2;                       // racked by 1/8" to 1/2"
    return { style: "diag", w, h, d1: d, d2: d + off, answer: sq ? 0 : 1, what: m.frame.n };
  }

  let _last = null;
  function open(game, spotId, again) {
    const m = ACM.measureById(spotId);
    if (!m) return;
    const S = game.state;
    const tool = m.kind === "tape" ? "tape_measure" : "framing_square";
    if (!S.ownedTools.includes(tool)) { game.toast(`You need your ${m.kind === "tape" ? "tape measure" : "framing square"}.`, "bad"); return; }
    if (!game.requireHeld(tool)) return;
    if (S.energy < 2) { game.toast("Too tired to measure. Eat something or rest.", "bad"); return; }
    const rec = S.measured[m.id] || (S.measured[m.id] = { ok: 0, n: 0, day: -1 });
    const label = esc(m.label);
    // each object can be measured once per game day
    if (rec.day === S.dayCount) { game.toast(`You already measured the ${m.label} today. Come back tomorrow.`, "bad"); return; }
    let body, ch;
    if (m.kind === "tape") {
      const parts = m.parts && m.parts.length ? m.parts : [{ n: "length", v: 36 }];
      const part = parts[(rec.visits || 0) % parts.length];           // a new part of the object each day you come back
      ch = tapeChallenge(part);
      body = `<p class="item-meta">Hook your tape on the <strong>${label}</strong> and measure its <strong>${esc(part.n)}</strong>. Slide the red marker (drag it, or click the tape) to the end of the board. It snaps to 1/8 inch.</p>
        <div class="diagram-box"><canvas id="ms-cv" width="640" height="130" style="max-width:100%;width:100%;cursor:ew-resize;touch-action:none"></canvas></div>
        <p style="text-align:center;margin:4px 0;">Reading: <strong id="ms-read" style="font-size:1.15rem"></strong></p>
        <div class="dialog-actions" style="justify-content:center"><button class="btn-wood btn-sm" id="ms-l">◀ 1/8"</button><button class="btn-wood btn-sm" id="ms-r">1/8" ▶</button><button class="btn-brass" id="ms-ok" data-space>Record this measurement</button></div>`;
    } else {
      ch = squareChallenge(m);
      body = ch.style === "gap"
        ? `<p class="item-meta">Set your framing square in the corner of the <strong>${label}</strong>. Is the corner square, or is it out?</p>
           <div class="diagram-box"><canvas id="ms-cv" width="640" height="200" style="max-width:100%"></canvas></div>
           <div class="quiz-options"><button class="quiz-opt-btn" data-v="0">Square (90°)</button><button class="quiz-opt-btn" data-v="-1">Too tight: less than 90°</button><button class="quiz-opt-btn" data-v="1">Too open: more than 90°</button></div>`
        : `<p class="item-meta">You measure both diagonals of the <strong>${label}</strong> ${esc(ch.what || "frame")} (${fmt(ch.w * 16)} × ${fmt(ch.h * 16)}). Square frames have equal diagonals. Is it square?</p>
           <div class="diagram-box"><canvas id="ms-cv" width="640" height="180" style="max-width:100%"></canvas></div>
           <div class="quiz-options"><button class="quiz-opt-btn" data-v="0">Square: the diagonals match</button><button class="quiz-opt-btn" data-v="1">Racked: the diagonals differ</button></div>`;
    }
    _last = ch;
    game.openModal(m.kind === "tape" ? "Tape Measure" : "Framing Square", `${body}<div id="ms-fb" style="margin-top:8px;"></div>`);
    const cv = document.getElementById("ms-cv");
    let M = ch.M;
    if (m.kind === "tape") {
      const read = document.getElementById("ms-read");
      const redraw = () => { drawTape(cv, ch.L, M); read.textContent = fmt(M); };
      redraw();
      const px = (e) => (e.clientX - cv.getBoundingClientRect().left) * (cv.width / cv.getBoundingClientRect().width);
      let drag = false;
      cv.addEventListener("pointerdown", (e) => { drag = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} M = tapeFromX(cv, ch.L, px(e)); redraw(); });
      cv.addEventListener("pointermove", (e) => { if (drag) { M = tapeFromX(cv, ch.L, px(e)); redraw(); } });
      cv.addEventListener("pointerup", () => { drag = false; });
      cv.addEventListener("pointercancel", () => { drag = false; });
      document.getElementById("ms-l").onclick = () => { M = Math.max(tapeW0(ch.L) * 16 + 2, M - 2); redraw(); };
      document.getElementById("ms-r").onclick = () => { M = Math.min((tapeW0(ch.L) + TAPE.span) * 16 - 2, M + 2); redraw(); };
      document.getElementById("ms-ok").onclick = () => finish(M === ch.answer, M);
    } else {
      if (ch.style === "gap") drawCornerGap(cv, ch.deg);
      else drawDiag(cv, ch.w, ch.h, ch.d1, ch.d2);
      document.querySelectorAll("#modal-body .quiz-opt-btn").forEach((b) => (b.onclick = () => finish(Number(b.dataset.v) === ch.answer)));
    }

    function finish(ok, picked) {
      document.querySelectorAll("#modal-body .quiz-opt-btn, #ms-ok, #ms-l, #ms-r").forEach((x) => (x.disabled = true));
      game.spendWork(6, 1);
      rec.n++; rec.visits = (rec.visits || 0) + 1;
      const first = ok && !rec.ok, today = S.dayCount;
      rec.day = today;                                               // used up for today, right or wrong
      let msg = "";
      if (ok) {
        rec.ok++;
        if (first) {
          const total = Object.values(S.measured).filter((r) => r.ok).length;
          S._measureRep = (S._measureRep || 0) + REP_FIRST;
          if (S._measureRep <= REP_CAP + 0.0001) S.stars = Math.min(5, S.stars + REP_FIRST);
          if (game.addFriend && m.npc) game.addFriend(m.npc, 6);
          S.cash += 5;
          msg = `<p style="color:#15803d;font-weight:bold;">Spot on! First time measuring this one: +$5, +reputation, and ${esc(((ACM.NPCS || []).find((n) => n.id === m.npc) || {}).name || "a neighbour")} noticed.</p>${m.note ? `<p class="item-meta"><em>${esc(m.note)}</em></p>` : ""}<p class="item-meta">Spots measured: ${total}/${ACM.MEASURE.length}</p>`;
          if (total === ACM.MEASURE.length && !S.eagleEye) { S.eagleEye = true; S.stars = Math.min(5, S.stars + 0.1); game.toast("Eagle Eye! You measured every spot in Alder Creek. +0.1★", "good"); }
        } else { S.cash += 3; msg = `<p style="color:#15803d;font-weight:bold;">Correct. A passer-by tips you $3 for the demonstration.</p>`; }
        if (ACM.Audio) ACM.Audio.sfx("heart");
      } else {
        const right = m.kind === "tape" ? `You marked <strong>${fmt(picked)}</strong>, but the end of the ${esc(ch.part.n)} sits at <strong>${fmt(ch.answer)}</strong>. Find the nearest inch number first, then count the ticks: half-inch is the longest tick after the inch, quarter next, then eighths.`
          : ch.style === "gap" ? `That corner is <strong>${ch.answer === 0 ? "square" : ch.answer < 0 ? "too tight (under 90°)" : "too open (over 90°)"}</strong>. Look at where light shows between the square and the board.`
          : `The diagonals are ${fmt(ch.d1)} and ${fmt(ch.d2)}: the frame is <strong>${ch.answer ? "racked" : "square"}</strong>. Equal diagonals mean square.`;
        msg = `<p style="color:#b91c1c;font-weight:bold;">Not quite.</p><p class="item-meta">${right}</p><p class="item-meta">No penalty. You can measure it again tomorrow${m.kind === "tape" && m.parts && m.parts.length > 1 ? ", and there's another part of it to measure" : ""}.</p>`;
        if (ACM.Audio) ACM.Audio.sfx("bad");
      }
      game.updateHUD();
      game.logEvent("measure", { id: m.id, kind: m.kind, ok, first });
      document.getElementById("ms-fb").innerHTML = msg + `<div class="dialog-actions"><button class="btn-brass btn-sm" id="ms-done" data-space>Done</button></div>`;
      document.getElementById("ms-done").onclick = () => game.closeModal();
    }
  }

  // corner drawing needs the deviation visible: board B is rotated by the real angle, the square stays at 90
  function drawCornerGap(cv, deg) { drawCorner(cv, deg); }

  function summary(game) {
    const S = game.state.measured || {};
    const ev = (game.state.events || []).filter((e) => e.t === "measure");
    return { spots: Object.values(S).filter((r) => r.ok).length, total: ACM.MEASURE.length, tries: ev.length, ok: ev.filter((e) => e.ok).length };
  }
  return { open, summary, fmt, _last: () => _last };
})();
