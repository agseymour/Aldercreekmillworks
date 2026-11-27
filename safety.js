window.ACM = window.ACM || {};

/**
 * ACM.Safety: the Safety Permit board (Alverez's schoolhouse). Each of the 17 shop safety tests is a permit.
 * Pass the written test to earn the permit. A failed attempt has a 60 s cooldown with a review of the missed questions.
 * Machines in the game (jointer, planer, table saw, mitre saw, band saw, cordless drill) need the Orientation permit + their own.
 */
ACM.Safety = (function () {
  let timer = null;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const byId = (id) => ACM.SAFETY.find((t) => t.id === id);
  function rec(game, id) {
    const S = game.state;
    if (!S.safety) S.safety = {};
    if (!S.safety[id]) S.safety[id] = { att: 0, best: 0, passed: false, lockUntil: 0, missed: [] };
    return S.safety[id];
  }
  const allowedMisses = (n) => (n >= 10 ? 1 : 0);
  const graded = (t) => t.q.map((q, i) => ({ q, i })).filter((x) => !x.q[2] || ACM.SAFETY_GRADE_UNCONFIRMED);
  const has = (game, id) => !!(game.state.safety && game.state.safety[id] && game.state.safety[id].passed);
  const passedCount = (game) => ACM.SAFETY.filter((t) => has(game, t.id)).length;

  /** Returns [] if the tool may be used, otherwise names of the permits still needed. */
  function missingFor(game, toolId) {
    const specific = ACM.SAFETY.filter((t) => t.need.includes(toolId));
    if (!specific.length) return [];
    const need = [byId("orientation")].concat(specific);
    return need.filter((t) => !has(game, t.id)).map((t) => t.name);
  }
  function gate(game, toolId) {
    const m = missingFor(game, toolId);
    if (!m.length) return true;
    game.toast(`Safety Permit needed: ${m.join(", ")}. Take the test at the Safety Board in the Schoolhouse.`, "bad");
    game.logEvent("hazard", { type: "no_permit", tool: toolId });
    return false;
  }

  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function openBoard(game) {
    clearTimer();
    const now = Date.now();
    const done = passedCount(game);
    const cards = ACM.SAFETY.map((t) => {
      const r = rec(game, t.id);
      const lock = Math.max(0, Math.ceil((r.lockUntil - now) / 1000));
      const uses = t.need.length ? t.need.map((id) => (ACM.TOOLS.find((x) => x.id === id) || {}).name).filter(Boolean).join(", ") : "";
      const status = r.passed ? `<span style="color:#15803d;font-weight:bold;">✔ Permit earned</span> (best ${r.best}%)` : lock > 0 ? `<span style="color:#b91c1c;">Retry in ${lock}s</span>` : r.att ? `Tries: ${r.att} · best ${r.best}%` : "Not taken yet";
      return `<div class="item-card"><div class="item-title">${t.icon} ${esc(t.name)}</div>
        <p class="item-meta">${t.q.length} questions · ${status}${uses ? `<br>Unlocks in-game: ${esc(uses)}` : ""}</p>
        <div class="dialog-actions"><button class="btn-brass btn-sm" data-sf="${t.id}">${r.passed ? "Retake" : "Take test"}</button></div></div>`;
    }).join("");
    game.openModal("Safety Permit Board", `
      <p class="item-meta">Posted by Dr. Alverez. Every machine in the shop needs a permit: pass the written test, and the rules become habits. Start with <strong>Safety Orientation</strong>, which unlocks the rest. In the real lab your teacher still signs your permit after a demonstration.</p>
      <p><strong>Permits earned: ${done}/${ACM.SAFETY.length}</strong>${done === ACM.SAFETY.length ? " · 🏅 Lab Ready!" : ""}</p>
      <div class="card-grid">${cards}</div>`);
    document.querySelectorAll("#modal-body [data-sf]").forEach((b) => (b.onclick = () => startTest(game, b.dataset.sf)));
  }

  function startTest(game, id) {
    const t = byId(id), r = rec(game, id);
    if (id !== "orientation" && !has(game, "orientation")) { game.toast("Take the Safety Orientation first.", "bad"); return; }
    if (r.lockUntil > Date.now()) { showReview(game, t, r.missed, false); return; }
    const order = t.q.map((_, i) => i).sort(() => Math.random() - 0.5);
    const missed = [];
    let pos = 0;
    const step = () => {
      if (pos >= order.length) return finish(game, t, missed, order.length);
      const i = order[pos], q = t.q[i];
      game.openModal(`${t.name} Safety Test`, `
        <p class="item-meta">Question ${pos + 1} of ${order.length}. Answers are checked at the end.</p>
        <div class="item-card"><canvas id="sf-art" style="width:100%;max-width:640px;image-rendering:pixelated;border:2px solid #2a1d12;border-radius:6px;display:block;margin:0 auto 6px;"></canvas><p id="sf-cap" class="item-meta" style="text-align:center;margin:0 0 8px;"></p><p style="font-weight:bold;font-size:1.05em;">${esc(q[0])}</p>
          <div class="dialog-actions"><button class="btn-brass" data-ans="1">Yes</button><button class="btn-wood" data-ans="0">No</button></div></div>`);
      const cv = document.getElementById("sf-art");
      if (cv && ACM.SafetyArt) { const a = ACM.SafetyArt.render(cv, t.id, q[0]); document.getElementById("sf-cap").innerHTML = "<strong>" + esc(a.cap) + "</strong>" + (a.dim ? " · " + esc(a.dim) : ""); }
      document.querySelectorAll("#modal-body [data-ans]").forEach((b) => (b.onclick = () => {
        const said = b.dataset.ans === "1";
        if (said !== q[1]) missed.push(i);
        pos++; step();
      }));
    };
    step();
  }

  function finish(game, t, missed, n) {
    const r = rec(game, t.id);
    const g = graded(t);
    const gMissed = missed.filter((i) => g.some((x) => x.i === i));
    const total = g.length;
    const score = total - gMissed.length;
    const pct = Math.round((100 * score) / total);
    const pass = gMissed.length <= allowedMisses(total);
    const first = pass && !r.passed;
    r.att++; r.best = Math.max(r.best, pct);
    game.logEvent("safety", { id: t.id, score, total, pct, ok: pass, att: r.att, missed });
    if (pass) {
      r.passed = true; r.lockUntil = 0; r.missed = [];
      if (ACM.Audio) ACM.Audio.sfx("good");
      if (first) {
        const cash = t.id === "orientation" ? 30 : 20;
        game.state.cash += cash; game.updateHUD();
        if (game.addFriend) game.addFriend("alverez", t.id === "orientation" ? 15 : 8);
        game.toast(`Permit earned: ${t.name}! +$${cash}`, "good");
        if (passedCount(game) === ACM.SAFETY.length) game.toast("Every safety permit earned. You are Lab Ready!", "good");
      }
      showReview(game, t, missed, true, score, total, pct);
    } else {
      r.lockUntil = Date.now() + ACM.SAFETY_COOLDOWN_MS;
      r.missed = missed.slice();
      if (ACM.Audio) ACM.Audio.sfx("bad");
      showReview(game, t, missed, false, score, total, pct);
    }
  }

  function showReview(game, t, missed, passed, score, total, pct) {
    clearTimer();
    const r = rec(game, t.id);
    const rows = missed.map((i) => {
      const q = t.q[i];
      return `<div class="item-card" style="margin-top:6px;"><p><strong>${esc(q[0])}</strong></p><p class="item-meta">Correct answer: <strong>${q[1] ? "Yes" : "No"}</strong>${q[2] && !ACM.SAFETY_GRADE_UNCONFIRMED ? " (this one is not graded: your teacher will confirm)" : ""}</p></div>`;
    }).join("");
    const head = passed
      ? `<h3>Permit earned! ${score != null ? `${score}/${total} (${pct}%)` : ""}</h3><p>${missed.length ? "Look over what you missed so it sticks:" : "Perfect. That is how a safe shop runs."}</p>`
      : `<h3>${score != null ? `Score ${score}/${total}` : "Take a minute to review"}</h3><p>${total && total < 10 ? "This test needs a perfect score." : "You can miss at most one question."} You can try again in <strong id="sf-cd">0</strong> s.</p>`;
    game.openModal(`${t.name} Safety Test`, `
      <div class="item-card">${head}</div>
      <div class="dialog-actions"><button class="btn-brass btn-sm" id="sf-retry" ${!passed ? "disabled" : ""}>${passed ? "Back to the board" : "Retry"}</button>${!passed ? `<button class="btn-wood btn-sm" id="sf-back">Safety board</button>` : ""}</div>
      ${rows}
      <div class="item-card" style="margin-top:8px;"><div class="item-title">Remember</div><ul style="margin-left:18px;">${t.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`);
    const retry = document.getElementById("sf-retry"), back = document.getElementById("sf-back");
    if (passed) { retry.onclick = () => openBoard(game); return; }
    back.onclick = () => openBoard(game);
    retry.onclick = () => startTest(game, t.id);
    const tick = () => {
      const cd = document.getElementById("sf-cd");
      if (!cd) { clearTimer(); return; }
      const left = Math.max(0, Math.ceil((r.lockUntil - Date.now()) / 1000));
      cd.textContent = left;
      if (left <= 0) { retry.disabled = false; clearTimer(); }
    };
    tick(); timer = setInterval(tick, 250);
  }

  function summary(game) {
    const S = game.state.safety || {};
    return ACM.SAFETY.map((t) => { const r = S[t.id] || {}; return { id: t.id, name: t.name, att: r.att || 0, best: r.best || 0, passed: !!r.passed }; });
  }

  return { openBoard, has, gate, missingFor, passedCount, summary };
})();
