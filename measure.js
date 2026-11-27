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

  function drawTape(cv, L, step) {
    const c = cv.getContext("2d"), W = cv.width, H = cv.height;
    const w0 = Math.max(0, Math.floor(L / 16) - 2), span = 6, ppi = (W - 40) / span, x0 = 20;
    const X = (s16) => x0 + ((s16 / 16) - w0) * ppi;
    c.fillStyle = "#e9dfc4"; c.fillRect(0, 0, W, H);
    // board
    c.fillStyle = "#b98a54"; c.fillRect(0, 12, X(L), 38);
    c.fillStyle = "#a07440"; for (let i = 0; i < 6; i++) c.fillRect(0, 18 + i * 6, X(L), 1);
    c.fillStyle = "#6e4a24"; c.fillRect(X(L) - 2, 10, 3, 42);
    // tape
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
    // pointer line from object end to tape
    c.strokeStyle = "#c0392b"; c.lineWidth = 2; c.setLineDash([4, 3]);
    c.beginPath(); c.moveTo(X(L), 50); c.lineTo(X(L), 90); c.stroke(); c.setLineDash([]);
  }

  function tapeChallenge(stars) {
    const step = stepFor(stars);
    const whole = 4 + rnd(60);
    const L = whole * 16 + step * (1 + rnd(Math.floor(16 / step) - 1)); // never exactly on an inch
    const opts = new Set([L]);
    const cand = [step, -step, 2 * step, -2 * step, 16, -16, 4 * step];
    cand.sort(() => Math.random() - 0.5);
    for (const d of cand) { if (opts.size >= 4) break; if (L + d > 0) opts.add(L + d); }
    const list = Array.from(opts).sort(() => Math.random() - 0.5);
    return { L, step, list, answer: L };
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
    const rw = 240, rh = 120, x = (W - rw) / 2, y = 30;
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

  function squareChallenge(stars) {
    if (Math.random() < 0.5) {
      const sq = Math.random() < 0.34;
      const dev = sq ? 0 : (Math.random() < 0.5 ? -1 : 1) * (4 + rnd(6));
      return { style: "gap", deg: 90 + dev, answer: sq ? 0 : dev < 0 ? -1 : 1 };
    }
    const w = 24 + rnd(24), h = 12 + rnd(18);
    const d = Math.round(Math.sqrt(w * w + h * h) * 16);
    const sq = Math.random() < 0.5;
    const off = sq ? 0 : (2 + rnd(5)) * 2;
    return { style: "diag", w, h, d1: d, d2: d + off, answer: sq ? 0 : 1 };
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
    let body, ch;
    if (m.kind === "tape") {
      ch = tapeChallenge(S.stars);
      body = `<p class="item-meta">Hook your tape on the end of the <strong>${label}</strong>. Where does the end of the board land? Read the tape to the nearest ${S.stars < 1.7 ? "1/4" : S.stars < 3 ? "1/8" : "1/16"} inch.</p>
        <div class="diagram-box"><canvas id="ms-cv" width="640" height="130" style="max-width:100%"></canvas></div>
        <div class="quiz-options">${ch.list.map((v) => `<button class="quiz-opt-btn" data-v="${v}">${fmt(v)}</button>`).join("")}</div>`;
    } else {
      ch = squareChallenge(S.stars);
      body = ch.style === "gap"
        ? `<p class="item-meta">Set your framing square in the corner of the <strong>${label}</strong>. Is the corner square, or is it out?</p>
           <div class="diagram-box"><canvas id="ms-cv" width="640" height="200" style="max-width:100%"></canvas></div>
           <div class="quiz-options"><button class="quiz-opt-btn" data-v="0">Square (90°)</button><button class="quiz-opt-btn" data-v="-1">Too tight: less than 90°</button><button class="quiz-opt-btn" data-v="1">Too open: more than 90°</button></div>`
        : `<p class="item-meta">You measure both diagonals of the <strong>${label}</strong> frame (${ch.w}" × ${ch.h}"). Square frames have equal diagonals. Is it square?</p>
           <div class="diagram-box"><canvas id="ms-cv" width="640" height="180" style="max-width:100%"></canvas></div>
           <div class="quiz-options"><button class="quiz-opt-btn" data-v="0">Square: the diagonals match</button><button class="quiz-opt-btn" data-v="1">Racked: the diagonals differ</button></div>`;
    }
    _last = ch;
    game.openModal(m.kind === "tape" ? "Tape Measure" : "Framing Square", `${body}<div id="ms-fb" style="margin-top:8px;"></div>`);
    const cv = document.getElementById("ms-cv");
    if (m.kind === "tape") drawTape(cv, ch.L, ch.step);
    else if (ch.style === "gap") drawCornerGap(cv, ch.deg);
    else drawDiag(cv, ch.w, ch.h, ch.d1, ch.d2);

    document.querySelectorAll("#modal-body .quiz-opt-btn").forEach((b) => (b.onclick = () => {
      const v = Number(b.dataset.v), ok = v === ch.answer;
      document.querySelectorAll("#modal-body .quiz-opt-btn").forEach((x) => (x.disabled = true));
      game.spendWork(6, 1);
      rec.n++;
      const first = ok && !rec.ok, today = S.dayCount;
      let msg = "";
      if (ok) {
        const tipOk = rec.day !== today;
        rec.ok++;
        if (first) {
          const total = Object.values(S.measured).filter((r) => r.ok).length;
          S._measureRep = (S._measureRep || 0) + REP_FIRST;
          if (S._measureRep <= REP_CAP + 0.0001) S.stars = Math.min(5, S.stars + REP_FIRST);
          if (game.addFriend && m.npc) game.addFriend(m.npc, 6);
          S.cash += 5;
          msg = `<p style="color:#15803d;font-weight:bold;">Spot on! First time measuring this one: +$5, +reputation, and ${esc(((ACM.NPCS || []).find((n) => n.id === m.npc) || {}).name || "a neighbour")} noticed.</p>${m.note ? `<p class="item-meta"><em>${esc(m.note)}</em></p>` : ""}<p class="item-meta">Spots measured: ${total}/${ACM.MEASURE.length}</p>`;
          if (total === ACM.MEASURE.length && !S.eagleEye) { S.eagleEye = true; S.stars = Math.min(5, S.stars + 0.1); game.toast("Eagle Eye! You measured every spot in Alder Creek. +0.1★", "good"); }
        } else if (tipOk) { S.cash += 3; msg = `<p style="color:#15803d;font-weight:bold;">Correct again. A passer-by tips you $3 for the demonstration.</p>`; }
        else msg = `<p style="color:#15803d;font-weight:bold;">Correct! (You already earned today's tip here.)</p>`;
        rec.day = today;
        if (ACM.Audio) ACM.Audio.sfx("heart");
      } else {
        const right = m.kind === "tape" ? `The end of the board sits at <strong>${fmt(ch.answer)}</strong>. Find the nearest inch number first, then count the ticks: half-inch is the longest tick after the inch, quarter next, then eighths and sixteenths.`
          : ch.style === "gap" ? `That corner is <strong>${ch.answer === 0 ? "square" : ch.answer < 0 ? "too tight (under 90°)" : "too open (over 90°)"}</strong>. Look at where light shows between the square and the board.`
          : `The diagonals are ${fmt(ch.d1)} and ${fmt(ch.d2)}: the frame is <strong>${ch.answer ? "racked" : "square"}</strong>. Equal diagonals mean square.`;
        msg = `<p style="color:#b91c1c;font-weight:bold;">Not quite.</p><p class="item-meta">${right}</p><p class="item-meta">No penalty. Try this spot again any time.</p>`;
        if (ACM.Audio) ACM.Audio.sfx("bad");
      }
      game.updateHUD();
      game.logEvent("measure", { id: m.id, kind: m.kind, ok, first });
      document.getElementById("ms-fb").innerHTML = msg + `<div class="dialog-actions"><button class="btn-brass btn-sm" id="ms-again">Measure again</button><button class="btn-wood btn-sm" id="ms-done">Done</button></div>`;
      document.getElementById("ms-again").onclick = () => open(game, spotId);
      document.getElementById("ms-done").onclick = () => game.closeModal();
    }));
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
