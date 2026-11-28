window.ACM = window.ACM || {};

ACM.Minigames = (function () {
  // Unbiased Fisher-Yates shuffle (returns a new array).
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function openBlueprintDesk(game) {
    const nextTier = Math.min(5, Math.floor(game.state.stars) + 1);
    const tierCertified = game.state.certifiedTier >= nextTier;
    const pool = ACM.QUESTIONS.filter((q) => q.tier <= nextTier);
    const unanswered = pool.filter((q) => !game.state.answeredQuestions.includes(q.id));

    let html = `
      <p><strong>Blueprint & Trade Certification Desk</strong> — Study Nova Scotia Production Tech manuals to earn startup capital and unlock higher-tier equipment.</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin:12px 0;">
        <button class="btn-brass" id="btn-study-q">Practice Trade Question (+$25)</button>
        <button class="btn-wood" id="btn-workshop-plans">Workshop Plans (additions)</button>
        ${
          !tierCertified && nextTier > 1
            ? `<button class="btn-green" id="btn-take-exam">Take Tier ${nextTier}★ Certification Exam (3 Questions)</button>`
            : `<span class="tag">Certified up to Tier ${game.state.certifiedTier}★</span>`
        }
      </div>
      <p class="item-meta">New curriculum questions remaining at your level: <strong>${unanswered.length}</strong> (Reviewing answered questions pays $5, up to 5 a day).</p>
      <div id="quiz-stage"></div>
    `;

    game.openModal("Blueprint & Certification Desk", html);

    document.getElementById("btn-workshop-plans").onclick = () => ACM.Workshop.openPlans(game);
    document.getElementById("btn-study-q").onclick = () => {
      const q = unanswered.length > 0
        ? unanswered[Math.floor(Math.random() * unanswered.length)]
        : pool[Math.floor(Math.random() * pool.length)];
      renderSingleQuestion(game, q, false);
    };

    const examBtn = document.getElementById("btn-take-exam");
    if (examBtn) {
      examBtn.onclick = () => startCertificationExam(game, nextTier);
    }
  }

  function renderSingleQuestion(game, q, isExam, onExamAnswer) {
    const stage = document.getElementById("quiz-stage");
    const isNew = !game.state.answeredQuestions.includes(q.id);
    // In the data file the right answer is almost always option A, so shuffle the display order every time.
    // Each button keeps its ORIGINAL index in data-idx, so grading below is unchanged.
    const displayOrder = shuffled(q.options.map((_, i) => i));

    stage.innerHTML = `
      <div class="item-card" style="margin-top:10px;">
        <div><span class="tag">${q.category}</span> <span class="tag">Tier ${q.tier}★</span></div>
        <p style="font-weight:bold; margin-top:6px;">${q.prompt}</p>
        ${q.diagram ? `<div class="diagram-box"><canvas id="q-diagram" width="320" height="145"></canvas></div>` : ""}
        <div class="quiz-options">
          ${displayOrder
            .map((origIdx, pos) => `<button class="quiz-opt-btn" data-idx="${origIdx}">${String.fromCharCode(65 + pos)}. ${q.options[origIdx]}</button>`)
            .join("")}
        </div>
        <div id="q-feedback" style="margin-top:8px;"></div>
      </div>
    `;

    if (q.diagram) {
      ACM.ArtDiagrams.drawSchematic(document.getElementById("q-diagram"), q.diagram);
    }

    stage.querySelectorAll(".quiz-opt-btn").forEach((btn) => {
      btn.onclick = () => {
        const chosen = Number(btn.dataset.idx);
        const correct = chosen === q.answerIndex;
        game.logEvent("quiz", { q: q.id, cat: q.category, tier: q.tier, ok: correct, exam: !!isExam });
        stage.querySelectorAll(".quiz-opt-btn").forEach((b) => (b.disabled = true));

        if (isExam) {
          onExamAnswer(correct, q);
          return;
        }

        const fb = document.getElementById("q-feedback");
        if (correct) {
          ACM.Game.playTone(660, 0.14);
          // new questions pay $25 once; reviewing pays $5 for the first 5 correct answers each game day, then nothing
          let payout = 25;
          if (!isNew) {
            const s = game.state;
            if (!s.reviewPaid || s.reviewPaid.day !== s.dayCount) s.reviewPaid = { day: s.dayCount, n: 0 };
            payout = s.reviewPaid.n < 5 ? 5 : 0;
            if (payout) s.reviewPaid.n++;
          }
          game.state.cash += payout;
          if (isNew) game.state.answeredQuestions.push(q.id);
          game.updateHUD();
          fb.innerHTML = `<p style="color:#15803d; font-weight:bold;">Correct!${payout ? " +$" + payout + " earned." : " (Today's paid practice is used up, but the review still counts.)"}</p><p class="item-meta">${q.explanation}</p>`;
        } else {
          ACM.Game.playTone(220, 0.2);
          fb.innerHTML = `<p style="color:#b91c1c; font-weight:bold;">Not quite — review the shop rule below:</p><p class="item-meta">${q.explanation}</p>`;
        }
      };
    });
  }

  function startCertificationExam(game, targetTier) {
    const tierQs = ACM.QUESTIONS.filter((q) => q.tier === targetTier);
    const fallback = ACM.QUESTIONS.filter((q) => q.tier <= targetTier);
    const source = tierQs.length >= 3 ? tierQs : fallback;
    const examSet = shuffled(source).slice(0, 3);
    let idx = 0;
    let score = 0;
    const missed = [];
    const lockMs = (game.state.examLockUntil || 0) - Date.now();
    const reviewHtml = (ids) => ids.map((id) => ACM.QUESTIONS.find((q) => q.id === id)).filter(Boolean).map((q) => `<div class="item-card" style="margin-top:6px;"><p><strong>${q.prompt}</strong></p><p class="item-meta">Answer: <strong>${q.options[q.answerIndex]}</strong></p><p class="item-meta">${q.explanation}</p></div>`).join("");
    if (lockMs > 0) {
      const stage0 = document.getElementById("quiz-stage");
      stage0.innerHTML = `<div class="item-card"><h3>Take a minute to review</h3><p>You can try the exam again in <strong>${Math.ceil(lockMs / 1000)}s</strong>. Read over the questions you missed:</p>${reviewHtml(game.state.lastExamMissed || [])}</div>`;
      return;
    }

    function next() {
      if (idx >= examSet.length) {
        const stage = document.getElementById("quiz-stage");
        game.logEvent("exam", { tier: targetTier, score, pass: score >= 2 });
        if (score >= 2) {
          game.state.certifiedTier = Math.max(game.state.certifiedTier, targetTier);
          ACM.Game.playTone(780, 0.25);
          stage.innerHTML = `<div class="item-card owned"><h3>Passed Tier ${targetTier}★ Certification (${score}/3)!</h3><p>Seymour and Routledge have unlocked Tier ${targetTier}★ tools and lumber for your shop.</p></div>`;
        } else {
          ACM.Game.playTone(190, 0.25);
          game.state.examLockUntil = Date.now() + 60000;
          game.state.lastExamMissed = missed.slice();
          stage.innerHTML = `<div class="item-card"><h3>Exam Score: ${score}/3</h3><p>You need at least 2/3 correct to certify. Review what you missed, then try again in 60 seconds. Practice questions are always open.</p>${reviewHtml(missed)}</div>`;
        }
        return;
      }
      renderSingleQuestion(game, examSet[idx], true, (correct) => {
        if (correct) score++; else missed.push(examSet[idx].id);
        idx++;
        next();
      });
    }
    next();
  }

  function openLayoutBench(game) {
    const job = game.getActiveProject();
    if (!job) {
      game.openModal("Layout & Milling Bench", `<p>No active commission on the bench. Walk down to the <strong>Town Commission Board</strong> in the village square to accept a job!</p>`);
      return;
    }

    const prog = game.state.jobProgress;
    if (!prog.lumberAssigned) {
      const validStocks = ACM.LUMBER.filter(
        (l) => ACM.lumberAllowed(job, l.id) && (game.state.lumberStock[l.id] || 0) >= job.lumberReq.units
      );

      let html = `<p><strong>Active Project:</strong> ${job.title} (Needs ${job.lumberReq.units} units of approved stock)</p>`;
      if (validStocks.length === 0) {
        html += `<p style="color:#b91c1c; margin-top:8px;">You don't have enough approved lumber in stock! Visit <strong>Routledge's Sawmill</strong> or harvest mature trees in <strong>Your Woodlot</strong> to gather ${job.lumberReq.units} units of one kind of board (the stock you mill from your own trees counts too; boards of different kinds can't be mixed). Store-bought options: <strong>${job.lumberReq.allowedIds.map((id) => ACM.LUMBER.find((x) => x.id === id).name).join(", ")}</strong>.</p>`;
      } else {
        html += `<p style="margin-top:8px;">Select lumber from your rack to begin layout:</p><div class="card-grid">`;
        validStocks.forEach((l) => {
          html += `
            <div class="item-card">
              <div class="item-title">${l.name}</div>
              <div class="item-meta">In Rack: ${game.state.lumberStock[l.id]} ${l.unitLabel} | Type: ${l.milled.toUpperCase()}</div>
              <button class="btn-brass btn-sm assign-lumber-btn" data-lid="${l.id}">Use ${job.lumberReq.units} ${l.unitLabel}</button>
            </div>
          `;
        });
        html += `</div>`;
      }
      game.openModal("Layout & Milling Bench", html);
      document.querySelectorAll(".assign-lumber-btn").forEach((b) => {
        b.onclick = () => {
          const lid = b.dataset.lid;
          game.state.lumberStock[lid] -= job.lumberReq.units;
          prog.lumberAssigned = lid;
          prog.cutIndex = 0;
          prog.completedTools = [];
          prog.nailChecked = false;
          openLayoutBench(game);
        };
      });
      return;
    }

    const lumberObj = ACM.LUMBER.find((l) => l.id === prog.lumberAssigned);

    if (prog.cutIndex < job.cuts.length) {
      const cut = job.cuts[prog.cutIndex];
      const stepSize = 1 / job.precisionDenom;
      let currentVal = Math.round((cut.target - stepSize * 5) * job.precisionDenom) / job.precisionDenom;

      const html = `
        <p class="item-meta" style="margin:0 0 4px">Drag the tape sideways, or click a mark on it. It snaps to 1/8". Press Space to strike the line.</p>
        <p><strong>Step 1 — Fractional Tape Measure Layout (${prog.cutIndex + 1}/${job.cuts.length})</strong></p>
        <p>Part: <strong>${cut.part}</strong> | Target Measurement: <strong style="color:#b45309; font-size:1.1rem;">${cut.display}</strong> (Precision: 1/${job.precisionDenom}")</p>
        <div class="diagram-box">
          <canvas id="tape-canvas" width="640" height="130"></canvas>
        </div>
        <div class="tape-controls">
          <button class="btn-wood btn-sm" id="tape-minus-big">- 1/4"</button>
          <button class="btn-wood btn-sm" id="tape-minus">- 1/${job.precisionDenom}"</button>
          <span class="badge badge-wood" id="tape-readout" style="font-size:1rem;">${ACM.ArtDiagrams.formatFraction(currentVal, job.precisionDenom)}</span>
          <button class="btn-wood btn-sm" id="tape-plus">+ 1/${job.precisionDenom}"</button>
          <button class="btn-wood btn-sm" id="tape-plus-big">+ 1/4"</button>
        </div>
        <div style="text-align:center; margin-top:10px;">
          <button class="btn-brass" id="btn-mark-cut" data-space>Strike Layout Line with Framing Square</button>
        </div>
      `;

      game.openModal("Fractional Tape Measure Layout", html);
      const canvas = document.getElementById("tape-canvas");
      const readout = document.getElementById("tape-readout");

      const redraw = () => {
        ACM.ArtDiagrams.drawTapeMeasure(canvas, currentVal, job.precisionDenom);
        readout.textContent = ACM.ArtDiagrams.formatFraction(currentVal, job.precisionDenom);
      };
      redraw();

      // slide the tape with the mouse (drag) or click a spot on it; the value snaps to 1/8" (finer only when the job calls for it)
      const snap = job.precisionDenom > 8 ? 1 / job.precisionDenom : 1 / 8;
      const snapV = (v) => Math.max(0.5, Math.round(v / snap) * snap);
      const ppi = (canvas.width - 40) / 3.0;
      const cx = (e) => (e.clientX - canvas.getBoundingClientRect().left) * (canvas.width / canvas.getBoundingClientRect().width);
      let drag = null;
      canvas.style.cursor = "ew-resize"; canvas.style.touchAction = "none";
      canvas.addEventListener("pointerdown", (e) => { drag = { x: cx(e), v: currentVal, moved: false, start: Math.max(0, currentVal - 1.5) }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
      canvas.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const dx = cx(e) - drag.x;
        if (Math.abs(dx) > 3) drag.moved = true;
        if (drag.moved) { currentVal = snapV(drag.v - dx / ppi); redraw(); }       // the tape slides under your hand
      });
      canvas.addEventListener("pointerup", (e) => {
        if (drag && !drag.moved) { currentVal = snapV(drag.start + (cx(e) - 20) / ppi); redraw(); }   // a click jumps to that mark
        drag = null;
      });
      canvas.addEventListener("pointercancel", () => { drag = null; });

      document.getElementById("tape-minus").onclick = () => { currentVal = Math.max(0.5, currentVal - stepSize); redraw(); };
      document.getElementById("tape-plus").onclick = () => { currentVal += stepSize; redraw(); };
      document.getElementById("tape-minus-big").onclick = () => { currentVal = Math.max(0.5, currentVal - 0.25); redraw(); };
      document.getElementById("tape-plus-big").onclick = () => { currentVal += 0.25; redraw(); };

      document.getElementById("btn-mark-cut").onclick = () => {
        const diff = Math.abs(currentVal - cut.target);
        if (diff <= stepSize * 0.5) {
          ACM.Game.playTone(620, 0.14);
          prog.cutIndex++;
          game.spendWork(15, 2);
          game.toast(`Accurate layout at ${cut.display}!`, "good");
          openLayoutBench(game);
        } else {
          ACM.Game.playTone(180, 0.22);
          prog.mistakes++;
          game.toast(`Miscut layout! Marked ${ACM.ArtDiagrams.formatFraction(currentVal, job.precisionDenom)} instead of ${cut.display}.`, "bad");
        }
      };
      return;
    }

    const millingTools = job.workflow.filter((tid) =>
      ["jointer", "planer", "table_saw", "mitre_saw", "crosscut_saw", "back_saw", "band_saw", "japanese_back_saw"].includes(tid)
    );

    let html = `
      <p><strong>Step 2 — Milling & Sawing Operations</strong> (${lumberObj.name})</p>
      <p class="item-meta">Execute the machines/saws in proper production sequence. Remember: rough lumber must be flattened on the <strong>Jointer</strong> before the <strong>Planer</strong>!</p>
      <div class="workflow-steps">
        ${millingTools
          .map((tid) => {
            const t = ACM.TOOLS.find((x) => x.id === tid);
            const done = prog.completedTools.includes(tid);
            return `<span class="step-pill ${done ? "done" : ""}">${done ? "✓ " : ""}${t.name}</span>`;
          })
          .join("")}
      </div>
    `;

    if (lumberObj.nailRisk > 0 && !prog.nailChecked) {
      html += `
        <div class="item-card" style="border-color:#dc2626; margin:10px 0;">
          <strong>Reclaimed Lumber Alert:</strong> This barn board may contain hidden nails!
          <button class="btn-brass btn-sm" id="btn-scan-nails" style="margin-top:6px;">Inspect & Pull Hidden Nails First</button>
        </div>
      `;
    }

    html += `<div class="card-grid">`;
    millingTools.forEach((tid) => {
      const tool = ACM.TOOLS.find((x) => x.id === tid);
      const owned = game.state.ownedTools.includes(tid);
      const done = prog.completedTools.includes(tid);
      html += `
        <div class="item-card ${done ? "owned" : !owned ? "locked" : ""}">
          <div class="item-title">${tool.name}</div>
          <div class="item-meta">${owned ? `Sharpness: ${game.state.toolDurability[tid] ?? tool.maxDurability}/${tool.maxDurability}` : "Not owned — visit Seymour's Hardware"}</div>
          <button class="btn-wood btn-sm run-tool-btn" data-tid="${tid}" ${!owned || done ? "disabled" : ""} ${owned && !done && millingTools.find((x) => game.state.ownedTools.includes(x) && !prog.completedTools.includes(x)) === tid ? "data-space" : ""}>
            ${done ? "Completed" : owned ? "Run Operation" : "Locked"}
          </button>
        </div>
      `;
    });
    html += `</div>`;

    if (millingTools.every((tid) => prog.completedTools.includes(tid))) {
      html += `<div style="margin-top:14px; text-align:center;"><p style="color:#15803d; font-weight:bold;">All parts milled and cut to spec! Walk to the <strong>Assembly & Finishing Table</strong> to fasten and deliver.</p><button class="btn-brass" data-act="close" data-space>OK</button></div>`;
    }

    game.openModal("Milling & Sawing Floor", html);

    const scanBtn = document.getElementById("btn-scan-nails");
    if (scanBtn) {
      scanBtn.onclick = () => {
        prog.nailChecked = true;
        game.toast("Pulled 2 rusty square nails! Your jointer knives are safe.", "good");
        openLayoutBench(game);
      };
    }

    document.querySelectorAll(".run-tool-btn").forEach((btn) => {
      btn.onclick = () => {
        const tid = btn.dataset.tid;
        if (tid === "planer" && millingTools.includes("jointer") && !prog.completedTools.includes("jointer")) {
          prog.mistakes++;
          ACM.Game.playTone(180, 0.25);
          game.toast("Milling Error! Flatten one reference face on the Jointer BEFORE using the Planer.", "bad");
          return;
        }
        if ((tid === "jointer" || tid === "planer") && lumberObj.nailRisk > 0 && !prog.nailChecked) {
          game.state.cash = Math.max(0, game.state.cash - 45);
          prog.nailChecked = true;
          game.updateHUD();
          ACM.Game.playTone(140, 0.3);
          game.toast("CLANG! Hit a hidden nail in reclaimed wood! -$45 cutterhead knife repair.", "bad");
          openLayoutBench(game);
          return;
        }

        if (ACM.Safety && !ACM.Safety.gate(game, tid)) return;
        const toolObj = ACM.TOOLS.find((x) => x.id === tid);
        const missingGear = toolObj.requiresSafety.filter((sid) => !game.state.ownedTools.includes(sid));
        if (missingGear.length > 0) {
          const names = missingGear.map((sid) => ACM.TOOLS.find((x) => x.id === sid).name).join(", ");
          game.toast(`Safety Stop! Buy ${names} at Seymour's Hardware first.`, "bad");
          return;
        }

        if (game.state.toolDurability[tid] !== undefined && game.state.toolDurability[tid] < 500) {
          game.state.toolDurability[tid] = Math.max(0, game.state.toolDurability[tid] - 1);
          if (game.state.toolDurability[tid] === 0) {
            prog.mistakes++;
            game.toast(`${toolObj.name} blade is dull! Tear-out occurred. Sharpen it at Seymour's Hardware.`, "bad");
          }
        }

        const dustAdded = game.state.ownedTools.includes("dust_collector") ? 2 : 12;
        game.state.sawdustHazard = Math.min(100, game.state.sawdustHazard + dustAdded);
        game.checkShopHazards();

        prog.completedTools.push(tid);
        game.spendWork(25, 3);
        ACM.Game.playTone(440, 0.12);
        game.updateHUD();
        openLayoutBench(game);
      };
    });
  }

  // ---------------------------------------------------------------
  //  FASTENING MINIGAMES: swing the hammer on the beat, turn screws to the right torque
  // ---------------------------------------------------------------
  function fastenGame(game, kinds, onDone) {
    const body = document.getElementById("modal-body");
    const W = 440, H = 190, COUNT = 4;
    let ki = 0, item = 0, depth = 0, torque = 0, holding = false, marker = 0, t0 = performance.now();
    let hammer = 0, flash = 0, msg = "", done = false, result = null, cool = 0;
    const faults = { bent: 0, loose: 0, stripped: 0 };
    const kind = () => kinds[ki];
    const pf = game.perkFx ? game.perkFx() : { nailZone: 1, screwZone: 1 };
    const zone = () => (kind() === "nail" ? { c: 0.5, w: (0.2 - item * 0.01) * pf.nailZone } : { c: 0.72, w: 0.14 * pf.screwZone });

    body.innerHTML = `
      <p><strong id="fx-title"></strong></p>
      <p class="item-meta" id="fx-help"></p>
      <canvas id="fx-canvas" width="${W}" height="${H}" style="width:100%;max-width:${W}px;display:block;margin:8px auto;border:3px solid #8a5c3c;border-radius:8px;image-rendering:pixelated;"></canvas>
      <p id="fx-msg" style="text-align:center;min-height:1.4em;font-weight:bold;"></p>
      <div style="text-align:center;"><button class="btn-brass btn-lg" id="fx-act">Strike!</button></div>`;
    const cv = document.getElementById("fx-canvas"), c = cv.getContext("2d");
    const btn = document.getElementById("fx-act");

    function setText() {
      document.getElementById("fx-title").textContent = kind() === "nail" ? `Hammer nail ${item + 1} of ${COUNT}` : `Drive screw ${item + 1} of ${COUNT}`;
      document.getElementById("fx-help").textContent = kind() === "nail"
        ? "Click Strike (or press Space) when the swing marker is in the green zone. Three good hits drive a nail flush. A bad hit bends it."
        : "Hold the button (or Space) to turn the screwdriver. Let go while the torque is in the green zone: too early leaves it loose, too late strips the head.";
      btn.textContent = kind() === "nail" ? "Strike!" : "Hold to turn";
    }
    setText();

    function finishItem(ok, why) {
      if (why === "bent") faults.bent++;
      if (why === "loose") faults.loose++;
      if (why === "stripped") faults.stripped++;
      msg = ok ? "Clean!" : why === "bent" ? "Bent nail! Pull it and try again with a steadier swing." : why === "loose" ? "Loose screw. It needed more turns." : "Stripped the head! Too much torque.";
      document.getElementById("fx-msg").style.color = ok ? "#15803d" : "#b91c1c";
      document.getElementById("fx-msg").textContent = msg;
      if (ACM.Audio) ACM.Audio.sfx(ok ? "good" : "bad");
      item++; depth = 0; torque = 0; holding = false; cool = 40;
      if (item >= COUNT) { item = 0; ki++; }
      if (ki >= kinds.length) { done = true; result = Object.assign({}, faults); cleanup(); setTimeout(() => onDone(result), 700); }
      else setText();
    }

    function strike() {
      if (done || cool > 0 || kind() !== "nail") return;
      const z = zone();
      hammer = 12;
      if (Math.abs(marker - z.c) <= z.w / 2) {
        depth++; flash = 6;
        if (ACM.Audio) ACM.Audio.sfx("chop");
        document.getElementById("fx-msg").textContent = "";
        if (depth >= 3) finishItem(true);
      } else finishItem(false, "bent");
    }
    function press() {
      if (done || cool > 0) return;
      if (kind() === "nail") strike(); else { holding = true; document.getElementById("fx-msg").textContent = ""; }
    }
    function release() {
      if (kind() === "screw" && holding && !done) {
        holding = false;
        const z = zone();
        if (torque < z.c - z.w / 2) finishItem(false, "loose");
        else if (torque <= z.c + z.w / 2) finishItem(true);
        else finishItem(false, "stripped");
      }
    }
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); press(); });
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", () => { if (holding) release(); });
    const kd = (e) => { if (e.code === "Space" && !e.repeat) { e.preventDefault(); press(); } };
    const ku = (e) => { if (e.code === "Space") release(); };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    function cleanup() { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); }

    function draw() {
      if (!document.body.contains(cv)) { cleanup(); return; }
      if (cool > 0) cool--;
      const now = (performance.now() - t0) / 1000;
      marker = 0.5 + 0.5 * Math.sin(now * (2.2 + item * 0.25));
      if (kind() === "screw" && holding) { torque = Math.min(1, torque + 0.011); if (torque >= 1) release(); }
      c.fillStyle = "#d9c8a0"; c.fillRect(0, 0, W, H);
      // gauge
      const gx = 30, gw = W - 60, gy = 18, gh = 18;
      c.fillStyle = "#3b2a12"; c.fillRect(gx - 3, gy - 3, gw + 6, gh + 6);
      c.fillStyle = "#7a6a52"; c.fillRect(gx, gy, gw, gh);
      const z = zone();
      c.fillStyle = "#59b25c"; c.fillRect(gx + (z.c - z.w / 2) * gw, gy, z.w * gw, gh);
      if (kind() === "nail") { c.fillStyle = "#fff"; c.fillRect(gx + marker * gw - 2, gy - 5, 4, gh + 10); }
      else { c.fillStyle = "#f0be59"; c.fillRect(gx, gy, torque * gw, gh); c.fillStyle = "#fff"; c.fillRect(gx + torque * gw - 2, gy - 5, 4, gh + 10); }
      // board
      const by = 128;
      c.fillStyle = "#b98a54"; c.fillRect(110, by, 220, 62);
      c.fillStyle = "#a47745"; for (let i = 0; i < 5; i++) c.fillRect(110, by + 8 + i * 12, 220, 2);
      c.fillStyle = "#8a5c3c"; c.fillRect(110, by, 220, 3);
      const cx = 220;
      if (kind() === "nail") {
        const len = 44 - depth * 15;
        c.fillStyle = "#555e66"; c.fillRect(cx - 2, by - len, 4, len);
        c.fillStyle = "#8d97a0"; c.fillRect(cx - 7, by - len - 3, 14, 4);
        if (hammer > 0) {
          hammer--;
          c.save(); c.translate(cx + 14, by - len - 6); c.rotate(-0.9 + (12 - hammer) * 0.05);
          c.fillStyle = "#6b4423"; c.fillRect(0, -3, 50, 6); c.fillStyle = "#6e7780"; c.fillRect(-4, -14, 16, 14); c.restore();
        } else {
          c.save(); c.translate(cx + 14, by - len - 6); c.rotate(-1.6 + marker * 0.5);
          c.fillStyle = "#6b4423"; c.fillRect(0, -3, 50, 6); c.fillStyle = "#6e7780"; c.fillRect(-4, -14, 16, 14); c.restore();
        }
        if (flash > 0) { flash--; c.fillStyle = "#ffe9b0"; c.fillRect(cx - 12, by - 4, 24, 4); }
      } else {
        const rise = Math.max(0, (1 - torque / 0.72)) * 34;
        const sx = cx + (holding ? Math.sin(now * 40) * 0.8 : 0);
        c.fillStyle = "#8d97a0"; c.fillRect(sx - 3, by - 6 - rise, 6, 6 + rise);
        c.fillStyle = "#c3ccd4"; c.fillRect(sx - 9, by - 10 - rise, 18, 6);
        c.fillStyle = "#3b3f44"; c.fillRect(sx - 1, by - 10 - rise, 2, 6);
        // screwdriver
        c.fillStyle = "#c0392b"; c.fillRect(sx - 6, by - 52 - rise, 12, 24); c.fillStyle = "#9aa4ad"; c.fillRect(sx - 1, by - 28 - rise, 2, 18);
      }
      // progress dots
      for (let i = 0; i < COUNT; i++) { c.fillStyle = i < item ? "#59b25c" : "#9a8a6c"; c.fillRect(14 + i * 14, H - 16, 10, 10); }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  function openAssemblyTable(game) {
    const job = game.getActiveProject();
    if (!job) {
      game.openModal("Assembly & Finishing Table", `<p>No active build on the bench. Accept a customer order at the <strong>Town Commission Board</strong>.</p>`);
      return;
    }

    const prog = game.state.jobProgress;
    const millingTools = job.workflow.filter((tid) =>
      ["jointer", "planer", "table_saw", "mitre_saw", "crosscut_saw", "back_saw", "band_saw", "japanese_back_saw"].includes(tid)
    );

    if (!prog.lumberAssigned || prog.cutIndex < job.cuts.length || !millingTools.every((tid) => prog.completedTools.includes(tid))) {
      game.openModal("Assembly & Finishing Table", `<p>Your parts aren't ready for assembly yet! Complete all layout measurements and sawing steps at the <strong>Layout & Milling Bench</strong> first.</p>`);
      return;
    }

    // steps are numbered to match the pills; no button is highlighted, so remembering to square up first is the student's call
    const nPilot = job.requiresPilotHole ? 2 : 0, nFasten = job.requiresPilotHole ? 3 : 2;
    let html = `
      <p><strong>Final Dry-Fit & Fastening:</strong> ${job.title}</p>
      <p class="item-meta">Check diagonal squareness with your Framing Square, drill pilot holes if joining hardwood/ends, and fasten cleanly.</p>
      <div class="workflow-steps">
        <span class="step-pill ${prog.squared ? "done" : ""}">${prog.squared ? "✓ " : ""}1. Framing Square Check</span>
        ${job.requiresPilotHole ? `<span class="step-pill ${prog.piloted ? "done" : ""}">${prog.piloted ? "✓ " : ""}${nPilot}. Drill Pilot Holes</span>` : ""}
        <span class="step-pill ${prog.fastened ? "done" : ""}">${prog.fastened ? "✓ " : ""}${nFasten}. Fasten & Finish</span>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
        <button class="btn-wood" id="btn-do-square" ${prog.squared ? "disabled" : ""}>1. Check Diagonals (Framing Square)</button>
        ${job.requiresPilotHole ? `<button class="btn-wood" id="btn-do-pilot" ${prog.piloted ? "disabled" : ""}>${nPilot}. Drill Pilot Holes (Cordless Drill)</button>` : ""}
        <button class="btn-wood" id="btn-do-fasten" ${prog.fastened ? "disabled" : ""}>${nFasten}. Fasten & Finish (minigame)</button>
      </div>
    `;

    if (prog.fastened) {
      html += `
        <div style="margin-top:16px; text-align:center;">
          <button class="btn-green btn-lg" id="btn-deliver-job">Finish & Wrap the Project (then take it to ${job.client})</button>
        </div>
      `;
    }

    game.openModal("Assembly & Finishing Table", html);

    document.getElementById("btn-do-square").onclick = () => {
      prog.squared = true;
      game.spendWork(10, 2);
      ACM.Game.playTone(520, 0.1);
      openAssemblyTable(game);
    };

    const pilotBtn = document.getElementById("btn-do-pilot");
    if (pilotBtn) {
      pilotBtn.onclick = () => {
        if (!game.state.ownedTools.includes("cordless_drill")) {
          game.toast("You need a Cordless Drill from Seymour's Hardware to bore pilot holes!", "bad");
          return;
        }
        if (ACM.Safety && !ACM.Safety.gate(game, "cordless_drill")) return;
        prog.piloted = true;
        game.spendWork(10, 2);
        ACM.Game.playTone(540, 0.1);
        openAssemblyTable(game);
      };
    }

    document.getElementById("btn-do-fasten").onclick = () => {
      if (!prog.squared) {
        prog.mistakes++;
        game.toast("Out-of-square assembly! Always check diagonals with your Framing Square first.", "bad");
      }
      if (job.requiresPilotHole && !prog.piloted) {
        prog.mistakes++;
        game.state.cash = Math.max(0, game.state.cash - 20);
        game.updateHUD();
        game.toast("CRACK! Driving screws without pilot holes split a board (-$20 replacement stock).", "bad");
      }
      const kinds = [];
      if (job.workflow.includes("hammer")) kinds.push("nail");
      if (job.workflow.includes("screwdriver") || job.workflow.includes("cordless_drill")) kinds.push("screw");
      if (!kinds.length) kinds.push("nail");
      fastenGame(game, kinds, (f) => {
        const total = f.bent + f.loose + f.stripped;
        const add = total >= 5 ? 2 : total >= 2 ? 1 : 0;
        prog.mistakes += add;
        prog.fastened = true;
        game.logEvent("fasten", { kinds: kinds.join("+"), bent: f.bent, loose: f.loose, stripped: f.stripped });
        game.spendWork(30, 3);
        game.toast(total === 0 ? "Every fastener went in clean. Beautiful work!" : `Fastening faults: ${f.bent} bent, ${f.loose} loose, ${f.stripped} stripped${add ? ". That will show in the finished quality." : "."}`, total === 0 ? "good" : add ? "bad" : "");
        openAssemblyTable(game);
      });
    };

    const deliverBtn = document.getElementById("btn-deliver-job");
    if (deliverBtn) {
      deliverBtn.onclick = () => game.completeActiveProject();
    }
  }

  return {
    openBlueprintDesk,
    openLayoutBench,
    openAssemblyTable
  };
})();
