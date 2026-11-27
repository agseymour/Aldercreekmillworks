window.ACM = window.ACM || {};

ACM.Minigames = (function () {
  function openBlueprintDesk(game) {
    const nextTier = Math.min(5, Math.floor(game.state.stars) + 1);
    const tierCertified = game.state.certifiedTier >= nextTier;
    const pool = ACM.QUESTIONS.filter((q) => q.tier <= nextTier);
    const unanswered = pool.filter((q) => !game.state.answeredQuestions.includes(q.id));

    let html = `
      <p><strong>Blueprint & Trade Certification Desk</strong> — Study Nova Scotia Production Tech manuals to earn startup capital and unlock higher-tier equipment.</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin:12px 0;">
        <button class="btn-brass" id="btn-study-q">Practice Trade Question (+$25)</button>
        ${
          !tierCertified && nextTier > 1
            ? `<button class="btn-green" id="btn-take-exam">Take Tier ${nextTier}★ Certification Exam (3 Questions)</button>`
            : `<span class="tag">Certified up to Tier ${game.state.certifiedTier}★</span>`
        }
      </div>
      <p class="item-meta">New curriculum questions remaining at your level: <strong>${unanswered.length}</strong> (Reviewing answered questions pays $10).</p>
      <div id="quiz-stage"></div>
    `;

    game.openModal("Blueprint & Certification Desk", html);

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

    stage.innerHTML = `
      <div class="item-card" style="margin-top:10px;">
        <div><span class="tag">${q.category}</span> <span class="tag">Tier ${q.tier}★</span></div>
        <p style="font-weight:bold; margin-top:6px;">${q.prompt}</p>
        ${q.diagram ? `<div class="diagram-box"><canvas id="q-diagram" width="320" height="145"></canvas></div>` : ""}
        <div class="quiz-options">
          ${q.options
            .map((opt, idx) => `<button class="quiz-opt-btn" data-idx="${idx}">${String.fromCharCode(65 + idx)}. ${opt}</button>`)
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
        stage.querySelectorAll(".quiz-opt-btn").forEach((b) => (b.disabled = true));

        if (isExam) {
          onExamAnswer(correct, q);
          return;
        }

        const fb = document.getElementById("q-feedback");
        if (correct) {
          ACM.Game.playTone(660, 0.14);
          const payout = isNew ? 25 : 10;
          game.state.cash += payout;
          if (isNew) game.state.answeredQuestions.push(q.id);
          game.updateHUD();
          fb.innerHTML = `<p style="color:#15803d; font-weight:bold;">Correct! +$${payout} earned.</p><p class="item-meta">${q.explanation}</p>`;
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
    const examSet = [...source].sort(() => Math.random() - 0.5).slice(0, 3);
    let idx = 0;
    let score = 0;

    function next() {
      if (idx >= examSet.length) {
        const stage = document.getElementById("quiz-stage");
        if (score >= 2) {
          game.state.certifiedTier = Math.max(game.state.certifiedTier, targetTier);
          ACM.Game.playTone(780, 0.25);
          stage.innerHTML = `<div class="item-card owned"><h3>Passed Tier ${targetTier}★ Certification (${score}/3)!</h3><p>Seymour and Routledge have unlocked Tier ${targetTier}★ tools and lumber for your shop.</p></div>`;
        } else {
          ACM.Game.playTone(190, 0.25);
          stage.innerHTML = `<div class="item-card"><h3>Exam Score: ${score}/3</h3><p>You need at least 2/3 correct to certify. Study the practice questions and try again!</p></div>`;
        }
        return;
      }
      renderSingleQuestion(game, examSet[idx], true, (correct) => {
        if (correct) score++;
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
        (l) => job.lumberReq.allowedIds.includes(l.id) && (game.state.lumberStock[l.id] || 0) >= job.lumberReq.units
      );

      let html = `<p><strong>Active Project:</strong> ${job.title} (Needs ${job.lumberReq.units} units of approved stock)</p>`;
      if (validStocks.length === 0) {
        html += `<p style="color:#b91c1c; margin-top:8px;">You don't have enough approved lumber in stock! Visit <strong>Routledge's Sawmill</strong> or harvest mature trees in <strong>Your Woodlot</strong> to gather ${job.lumberReq.units} units of: <strong>${job.lumberReq.allowedIds.map((id) => ACM.LUMBER.find((x) => x.id === id).name).join(", ")}</strong>.</p>`;
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
          <button class="btn-brass" id="btn-mark-cut">Strike Layout Line with Framing Square</button>
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

      document.getElementById("tape-minus").onclick = () => { currentVal = Math.max(0.5, currentVal - stepSize); redraw(); };
      document.getElementById("tape-plus").onclick = () => { currentVal += stepSize; redraw(); };
      document.getElementById("tape-minus-big").onclick = () => { currentVal = Math.max(0.5, currentVal - 0.25); redraw(); };
      document.getElementById("tape-plus-big").onclick = () => { currentVal += 0.25; redraw(); };

      document.getElementById("btn-mark-cut").onclick = () => {
        const diff = Math.abs(currentVal - cut.target);
        if (diff <= stepSize * 0.5) {
          ACM.Game.playTone(620, 0.14);
          prog.cutIndex++;
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
          <button class="btn-wood btn-sm run-tool-btn" data-tid="${tid}" ${!owned || done ? "disabled" : ""}>
            ${done ? "Completed" : owned ? "Run Operation" : "Locked"}
          </button>
        </div>
      `;
    });
    html += `</div>`;

    if (millingTools.every((tid) => prog.completedTools.includes(tid))) {
      html += `<div style="margin-top:14px; text-align:center;"><p style="color:#15803d; font-weight:bold;">All parts milled and cut to spec! Walk to the <strong>Assembly & Finishing Table</strong> to fasten and deliver.</p></div>`;
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
        ACM.Game.playTone(440, 0.12);
        game.updateHUD();
        openLayoutBench(game);
      };
    });
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

    let html = `
      <p><strong>Final Dry-Fit & Fastening:</strong> ${job.title}</p>
      <p class="item-meta">Check diagonal squareness with your Framing Square, drill pilot holes if joining hardwood/ends, and fasten cleanly.</p>
      <div class="workflow-steps">
        <span class="step-pill ${prog.squared ? "done" : ""}">${prog.squared ? "✓ " : ""}1. Framing Square Check</span>
        ${job.requiresPilotHole ? `<span class="step-pill ${prog.piloted ? "done" : ""}">${prog.piloted ? "✓ " : ""}2. Drill Pilot Holes</span>` : ""}
        <span class="step-pill ${prog.fastened ? "done" : ""}">${prog.fastened ? "✓ " : ""}3. Fasten & Finish</span>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
        <button class="btn-wood" id="btn-do-square" ${prog.squared ? "disabled" : ""}>Check Diagonals (Framing Square)</button>
        ${job.requiresPilotHole ? `<button class="btn-wood" id="btn-do-pilot" ${prog.piloted ? "disabled" : ""}>Drill Pilot Holes (Cordless Drill)</button>` : ""}
        <button class="btn-brass" id="btn-do-fasten" ${prog.fastened ? "disabled" : ""}>Drive Fasteners & Apply Finish</button>
      </div>
    `;

    if (prog.fastened) {
      html += `
        <div style="margin-top:16px; text-align:center;">
          <button class="btn-green btn-lg" id="btn-deliver-job">Deliver Completed Project to ${job.client}!</button>
        </div>
      `;
    }

    game.openModal("Assembly & Finishing Table", html);

    document.getElementById("btn-do-square").onclick = () => {
      prog.squared = true;
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
        prog.piloted = true;
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
      prog.fastened = true;
      ACM.Game.playTone(600, 0.14);
      openAssemblyTable(game);
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
