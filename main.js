window.ACM = window.ACM || {};

ACM.Game = (function () {
  const state = {
    classCode: "PRODTECH11",
    shopName: "Alder Creek Shop",
    pin: "",
    appearance: {
      skin: "#f3c69f",
      hair: "#3b2618",
      shirt: "#a83232",
      apron: "#6b4423"
    },
    cash: 110,
    stars: 1.0,
    certifiedTier: 1,
    currentAct: 1,
    sawdustHazard: 0,
    safetyIncidents: 0,
    legacyTitle: "Apprentice Woodworker",
    ownedTools: ["tape_measure", "framing_square"],
    toolDurability: {},
    lumberStock: { pine_s4s: 2 },
    answeredQuestions: [],
    completedProjectIds: [],
    activeProjectId: "side_1_tote",
    jobProgress: {
      lumberAssigned: null,
      cutIndex: 0,
      completedTools: [],
      nailChecked: false,
      squared: false,
      piloted: false,
      fastened: false,
      mistakes: 0
    }
  };

  let audioCtx = null;

  function playTone(freq, duration = 0.12) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function toast(msg, type = "") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function updateHUD() {
    document.getElementById("hud-shop-name").textContent = state.shopName;
    const acts = ACM.STORY_ACTS || [];
    const actObj = acts.find((a) => a.act === state.currentAct) || acts[0] || { title: "Act I" };
    document.getElementById("hud-act").textContent = actObj.title;
    document.getElementById("hud-stars").textContent = `★ ${state.stars.toFixed(2)}`;
    document.getElementById("hud-cash").textContent = `$${Math.round(state.cash)}`;

    const dustEl = document.getElementById("hud-sawdust");
    dustEl.textContent = `${state.sawdustHazard}%`;
    dustEl.style.color = state.sawdustHazard >= 75 ? "#f87171" : state.sawdustHazard >= 45 ? "#facc15" : "#fff";

    const job = getActiveProject();
    document.getElementById("hud-job").textContent = job ? job.title.slice(0, 18) + (job.title.length > 18 ? "…" : "") : "None";
  }

  function getActiveProject() {
    return (ACM.PROJECTS || []).find((p) => p.id === state.activeProjectId) || null;
  }

  function resetJobProgress() {
    state.jobProgress = {
      lumberAssigned: null,
      cutIndex: 0,
      completedTools: [],
      nailChecked: false,
      squared: false,
      piloted: false,
      fastened: false,
      mistakes: 0
    };
  }

  function checkShopHazards() {
    if (state.sawdustHazard >= 100) {
      state.sawdustHazard = 15;
      state.safetyIncidents++;
      if (state.ownedTools.includes("fire_extinguisher")) {
        state.cash = Math.max(0, state.cash - 35);
        playTone(150, 0.35);
        toast("SAWDUST SPARK! Your Class ABC Fire Extinguisher contained the blaze (-$35 cleanup).", "bad");
      } else {
        state.cash = Math.max(0, state.cash - 120);
        state.stars = Math.max(1.0, state.stars - 0.25);
        playTone(120, 0.45);
        toast("WORKSHOP FIRE! No extinguisher mounted! -$120 equipment repairs & -0.25★.", "bad");
      }
    }
  }

  function openModal(title, bodyHtml) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = bodyHtml;
    document.getElementById("modal-overlay").classList.remove("hidden");
  }

  function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
  }

  function openToolShop() {
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <p>Equip the <strong>13 core Production Tech tools</strong>, mandatory PPE, and keep blades sharp.</p>
        <button class="btn-wood btn-sm" id="btn-sweep-shop">Sweep Sawdust Floor (Free)</button>
      </div>
      <div class="card-grid">
    `;

    ACM.TOOLS.forEach((tool) => {
      const owned = state.ownedTools.includes(tool.id);
      const lockedByTier = tool.tier > state.certifiedTier;
      const dur = state.toolDurability[tool.id] ?? tool.maxDurability;
      const needsSharpen = owned && tool.maxDurability < 500 && dur < tool.maxDurability;

      html += `
        <div class="item-card ${owned ? "owned" : lockedByTier ? "locked" : ""}">
          <div>
            <div class="item-title">${tool.name}</div>
            <span class="tag">Tier ${tool.tier}★</span> <span class="tag">${tool.category.toUpperCase()}</span>
            <p class="item-meta" style="margin-top:4px;">${tool.desc}</p>
            <p class="item-meta" style="color:#78350f; margin-top:3px;"><em>${tool.curriculumNote}</em></p>
          </div>
          <div>
            ${
              owned
                ? needsSharpen
                  ? `<button class="btn-brass btn-sm sharpen-btn" data-tid="${tool.id}">Sharpen Blade ($${tool.sharpenCost}) [${dur}/${tool.maxDurability}]</button>`
                  : `<span class="tag" style="background:#bbf7d0;">Owned & Ready</span>`
                : lockedByTier
                ? `<span class="tag">Requires Tier ${tool.tier}★ Exam</span>`
                : `<button class="btn-brass btn-sm buy-tool-btn" data-tid="${tool.id}">Buy ($${tool.price})</button>`
            }
          </div>
        </div>
      `;
    });

    html += `</div>`;
    openModal("Alder Creek Tool & Safety Hardware", html);

    document.getElementById("btn-sweep-shop").onclick = () => {
      state.sawdustHazard = 0;
      updateHUD();
      toast("Workshop floor swept clean! Sawdust hazard reset to 0%.", "good");
      openToolShop();
    };

    document.querySelectorAll(".buy-tool-btn").forEach((btn) => {
      btn.onclick = () => {
        const tool = ACM.TOOLS.find((t) => t.id === btn.dataset.tid);
        if (state.cash < tool.price) {
          toast("Not enough cash! Complete commissions or answer Blueprint Desk questions.", "bad");
          return;
        }
        state.cash -= tool.price;
        state.ownedTools.push(tool.id);
        state.toolDurability[tool.id] = tool.maxDurability;
        playTone(580, 0.14);
        updateHUD();
        toast(`Purchased ${tool.name}!`, "good");
        openToolShop();
      };
    });

    document.querySelectorAll(".sharpen-btn").forEach((btn) => {
      btn.onclick = () => {
        const tool = ACM.TOOLS.find((t) => t.id === btn.dataset.tid);
        if (state.cash < tool.sharpenCost) {
          toast("Not enough cash to sharpen blades.", "bad");
          return;
        }
        state.cash -= tool.sharpenCost;
        state.toolDurability[tool.id] = tool.maxDurability;
        playTone(640, 0.12);
        updateHUD();
        toast(`${tool.name} honed razor sharp!`, "good");
        openToolShop();
      };
    });
  }

  function openLumberMill() {
    let html = `<p><strong>Alder Creek Sawmill</strong> — Buy pre-surfaced (S4S) boards early on, or save big on Rough-Sawn hardwoods once you own a Jointer & Planer.</p><div class="card-grid">`;

    ACM.LUMBER.forEach((l) => {
      const locked = l.tier > state.certifiedTier;
      const inStock = state.lumberStock[l.id] || 0;
      html += `
        <div class="item-card ${locked ? "locked" : ""}">
          <div>
            <div class="item-title">${l.name}</div>
            <span class="tag">Tier ${l.tier}★</span> <span class="tag">${l.milled.toUpperCase()}</span>
            <p class="item-meta" style="margin-top:4px;">${l.desc}</p>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
            <span class="item-meta">In Rack: <strong>${inStock}</strong></span>
            ${
              locked
                ? `<span class="tag">Tier ${l.tier}★</span>`
                : `<button class="btn-brass btn-sm buy-lumber-btn" data-lid="${l.id}">+1 ${l.unitLabel} ($${l.pricePerUnit})</button>`
            }
          </div>
        </div>
      `;
    });

    html += `</div>`;
    openModal("Alder Creek Sawmill", html);

    document.querySelectorAll(".buy-lumber-btn").forEach((btn) => {
      btn.onclick = () => {
        const l = ACM.LUMBER.find((x) => x.id === btn.dataset.lid);
        if (state.cash < l.pricePerUnit) {
          toast("Not enough cash for lumber.", "bad");
          return;
        }
        state.cash -= l.pricePerUnit;
        state.lumberStock[l.id] = (state.lumberStock[l.id] || 0) + 1;
        playTone(490, 0.1);
        updateHUD();
        openLumberMill();
      };
    });
  }

  function openTownBoard() {
    const actObj = ACM.STORY_ACTS.find((a) => a.act === state.currentAct) || ACM.STORY_ACTS[0];
    const availableJobs = ACM.PROJECTS.filter((p) => p.tier <= Math.max(1, Math.floor(state.stars + 0.35)));

    let html = `
      <div class="item-card" style="background:#fef3c7; border-color:#d49b35; margin-bottom:12px;">
        <div class="item-title">${actObj.title}</div>
        <p style="font-size:0.88rem; margin-top:4px;">${actObj.mentorNote}</p>
        <p class="item-meta" style="margin-top:4px;"><strong>Chapter Goal:</strong> ${actObj.summary}</p>
      </div>
      <h3>Available Customer Commissions</h3>
      <div class="card-grid">
    `;

    availableJobs.forEach((p) => {
      const isCurrent = state.activeProjectId === p.id;
      const doneBefore = state.completedProjectIds.includes(p.id);
      html += `
        <div class="item-card ${isCurrent ? "owned" : ""}">
          <div>
            <div class="item-title">${p.title} ${p.isAnchor ? "★ STORY" : ""}</div>
            <div class="item-meta">Client: ${p.client} | Payout: <strong>$${p.basePay}</strong> | +${p.starGain}★</div>
            <p class="item-meta" style="margin-top:4px;">${p.desc}</p>
            <p class="item-meta" style="margin-top:4px;"><strong>Stock:</strong> ${p.lumberReq.units} units (${p.lumberReq.allowedIds.map((id) => ACM.LUMBER.find((x) => x.id === id).name).join(" / ")})</p>
          </div>
          <div style="margin-top:6px;">
            ${
              isCurrent
                ? `<span class="tag" style="background:#bbf7d0;">Active Commission</span>`
                : p.isAnchor && doneBefore
                ? `<span class="tag">Anchor Completed</span>`
                : `<button class="btn-brass btn-sm accept-job-btn" data-pid="${p.id}">Accept Commission</button>`
            }
          </div>
        </div>
      `;
    });

    html += `</div>`;
    openModal("Alder Creek Story & Commission Board", html);

    document.querySelectorAll(".accept-job-btn").forEach((btn) => {
      btn.onclick = () => {
        state.activeProjectId = btn.dataset.pid;
        resetJobProgress();
        updateHUD();
        toast("Accepted new commission! Check your lumber rack and head to the Layout Bench.", "good");
        openTownBoard();
      };
    });
  }

  function completeActiveProject() {
    const job = getActiveProject();
    if (!job) return;

    const prog = state.jobProgress;
    const mistakePenalty = prog.mistakes * 15;
    const netPay = Math.max(20, job.basePay - mistakePenalty);
    const preferredBonus = job.lumberReq.preferredId && prog.lumberAssigned === job.lumberReq.preferredId ? 0.15 : 0;
    const starDelta = Math.max(0.05, job.starGain + preferredBonus - prog.mistakes * 0.08);

    state.cash += netPay;
    state.stars = Math.min(5.0, state.stars + starDelta);
    if (!state.completedProjectIds.includes(job.id)) {
      state.completedProjectIds.push(job.id);
    }

    if (job.isAnchor && state.currentAct < 5) {
      state.currentAct++;
    }

    if (state.stars >= 4.8 && state.safetyIncidents === 0) {
      state.legacyTitle = "The Master Artisan";
    } else if (state.cash >= 1500) {
      state.legacyTitle = "The Savvy Entrepreneur";
    } else if (state.safetyIncidents > 0 && state.currentAct >= 4) {
      state.legacyTitle = "The Comeback Kid";
    } else {
      state.legacyTitle = `Tier ${Math.floor(state.stars)}★ Woodworker`;
    }

    state.activeProjectId = null;
    resetJobProgress();
    updateHUD();
    playTone(740, 0.25);

    if (job.choice) {
      openModal(
        `Commission Delivered! (+$${netPay}, +${starDelta.toFixed(2)}★)`,
        `
          <p><strong>${job.client}</strong> inspects your ${job.title}!</p>
          <p style="margin:10px 0; font-weight:bold;">${job.choice.prompt}</p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="btn-green" id="choice-a">${job.choice.optionA.label}</button>
            <button class="btn-wood" id="choice-b">${job.choice.optionB.label}</button>
          </div>
        `
      );
      document.getElementById("choice-a").onclick = () => applyChoice(job.choice.optionA);
      document.getElementById("choice-b").onclick = () => applyChoice(job.choice.optionB);
    } else {
      closeModal();
      toast(`Delivered ${job.title}! Earned $${netPay} & +${starDelta.toFixed(2)}★`, "good");
      ACM.CloudSync.saveToCloud(state);
    }
  }

  function applyChoice(opt) {
    state.cash = Math.max(0, state.cash + opt.cashDelta);
    state.stars = Math.max(1.0, Math.min(5.0, state.stars + opt.starDelta));
    updateHUD();
    closeModal();
    toast(opt.note, "good");
    ACM.CloudSync.saveToCloud(state);
  }

  function openInventoryModal() {
    const ownedList = state.ownedTools
      .map((id) => ACM.TOOLS.find((t) => t.id === id))
      .filter(Boolean);

    const lumberList = Object.entries(state.lumberStock)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const l = ACM.LUMBER.find((x) => x.id === id);
        return `<li><strong>${l.name}:</strong> ${qty} ${l.unitLabel}</li>`;
      })
      .join("");

    openModal(
      `${state.shopName} — Inventory & Stats`,
      `
        <p><strong>Shop Legacy Title:</strong> ${state.legacyTitle} | <strong>Certified Level:</strong> Tier ${state.certifiedTier}★</p>
        <h3 style="margin-top:10px;">Owned Tools & Safety Gear (${ownedList.length}/${ACM.TOOLS.length})</h3>
        <div class="workflow-steps">
          ${ownedList.map((t) => `<span class="step-pill done">${t.name}</span>`).join("")}
        </div>
        <h3 style="margin-top:12px;">Lumber Rack</h3>
        <ul style="margin-left:18px; margin-top:4px;">${lumberList || "<li>Rack is empty — visit the Sawmill outside.</li>"}</ul>
      `
    );
  }

  async function openLeaderboardModal() {
    openModal("Class Leaderboard", `<p>Loading live rankings for class <strong>${state.classCode}</strong>...</p>`);
    const rows = await ACM.CloudSync.fetchLeaderboard(state.classCode);

    if (!rows || rows.length === 0) {
      openModal("Class Leaderboard", `<p>No saved workshops found for <strong>${state.classCode}</strong> yet. Click <strong>Save</strong> to post your shop!</p>`);
      return;
    }

    const tableRows = rows
      .map(
        (r, i) => `
          <tr>
            <td>#${i + 1}</td>
            <td><strong>${r.shopName}</strong></td>
            <td>★ ${Number(r.stars).toFixed(2)}</td>
            <td>$${r.cash}</td>
            <td>Act ${r.act}</td>
            <td>${r.legacyTitle || "Woodworker"}</td>
          </tr>
        `
      )
      .join("");

    openModal(
      `Class Leaderboard — ${state.classCode}`,
      `
        <table class="shop-table">
          <thead>
            <tr><th>Rank</th><th>Workshop</th><th>Rating</th><th>Cash</th><th>Progress</th><th>Legacy Title</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      `
    );
  }

  function handleStationInteract(stationId) {
    if (stationId === "blueprint_desk") ACM.Minigames.openBlueprintDesk(this);
    else if (stationId === "tool_shop") openToolShop();
    else if (stationId === "lumber_mill") openLumberMill();
    else if (stationId === "layout_bench") ACM.Minigames.openLayoutBench(this);
    else if (stationId === "assembly_table") ACM.Minigames.openAssemblyTable(this);
    else if (stationId === "town_board") openTownBoard();
  }

  function checkMissingModules() {
    const required = [
      ["TOOLS", "data-tools.js"],
      ["LUMBER", "data-lumber.js"],
      ["PROJECTS", "data-projects.js"],
      ["QUESTIONS", "data-questions.js"],
      ["ArtSprites", "art-sprites.js"],
      ["ArtDiagrams", "art-diagrams.js"],
      ["Minigames", "minigames.js"],
      ["World", "world.js"],
      ["CloudSync", "cloud-sync.js"]
    ];
    return required.filter(([key]) => !ACM[key]).map(([, file]) => file);
  }

  function initCharacterCreator() {
    const statusEl = document.getElementById("login-status");
    const startBtn = document.getElementById("btn-start-new");
    const missing = checkMissingModules();

    if (missing.length > 0) {
      statusEl.style.color = "#b91c1c";
      statusEl.textContent = `Missing game file(s): ${missing.join(", ")}. Check filenames in GitHub.`;
      return;
    }

    // Bind Start button FIRST so nothing can block it
    startBtn.onclick = async () => {
      startBtn.disabled = true;
      const classCode = document.getElementById("input-class-code").value.trim().toUpperCase() || "PRODTECH11";
      const shopName = document.getElementById("input-shop-name").value.trim() || "Alder Creek Shop";
      const pin = document.getElementById("input-pin").value.trim() || "0000";

      statusEl.style.color = "#3b2416";
      statusEl.textContent = "Opening workshop...";

      try {
        if (ACM.CloudSync && ACM.CloudSync.loadFromCloud) {
          const result = await ACM.CloudSync.loadFromCloud(classCode, shopName, pin);
          if (result && result.error) {
            statusEl.style.color = "#b91c1c";
            statusEl.textContent = result.error;
            startBtn.disabled = false;
            return;
          }
          if (result && result.state) {
            Object.assign(state, result.state);
            toast(`Welcome back to ${state.shopName}!`, "good");
          } else {
            state.classCode = classCode;
            state.shopName = shopName;
            state.pin = pin;
            const saveRes = await ACM.CloudSync.saveToCloud(state);
            if (saveRes && saveRes.error) {
              statusEl.style.color = "#b91c1c";
              statusEl.textContent = saveRes.error;
              startBtn.disabled = false;
              return;
            }
            toast(`Opened ${state.shopName}! Walk to a station to begin.`, "good");
          }
        }
      } catch (err) {
        // Never trap the user on the start screen if cloud sync fails
        state.classCode = classCode;
        state.shopName = shopName;
        state.pin = pin;
      }

      document.getElementById("creator-modal").classList.add("hidden");
      updateHUD();
      startBtn.disabled = false;
    };

    // Draw live character preview
    const previewCanvas = document.getElementById("preview-canvas");
    if (previewCanvas && ACM.ArtSprites) {
      const pCtx = previewCanvas.getContext("2d");
      const drawPreview = () => {
        state.appearance.skin = document.getElementById("pick-skin").value;
        state.appearance.hair = document.getElementById("pick-hair").value;
        state.appearance.shirt = document.getElementById("pick-shirt").value;
        state.appearance.apron = document.getElementById("pick-apron").value;

        pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        pCtx.fillStyle = "#7b5233";
        pCtx.fillRect(0, 115, 140, 45);
        ACM.ArtSprites.drawCharacter(pCtx, 70, 95, state.appearance, 3.0, 0, "down", { safety_glasses: true });
      };

      ["pick-skin", "pick-hair", "pick-shirt", "pick-apron"].forEach((id) => {
        document.getElementById(id).addEventListener("change", drawPreview);
      });
      drawPreview();
    }
  }

  function start() {
    initCharacterCreator();

    const canvas = document.getElementById("game-canvas");
    if (!canvas || !ACM.World) return;
    const ctx = canvas.getContext("2d");

    ACM.World.init(canvas, (sid) => handleStationInteract.call(ACM.Game, sid));

    document.getElementById("modal-close").onclick = closeModal;
    document.getElementById("btn-story").onclick = openTownBoard;
    document.getElementById("btn-inventory").onclick = openInventoryModal;
    document.getElementById("btn-leaderboard").onclick = openLeaderboardModal;
    document.getElementById("btn-save").onclick = async () => {
  const res = await ACM.CloudSync.saveToCloud(state);
  if (res.mode === "cloud") {
    toast("Progress synced to Class Leaderboard!", "good");
  } else {
    toast(`Saved locally (${res.error || res.warning || "Supabase keys not set"}).`, "bad");
  }
};
    const interactBtn = document.getElementById("btn-interact");
    const hintEl = document.getElementById("station-hint");
    interactBtn.onclick = () => {
      const st = ACM.World.getActiveStation();
      if (st) handleStationInteract.call(ACM.Game, st.id);
    };

    function loop() {
      ACM.World.update();
      ACM.World.render(ctx, state);

      const st = ACM.World.getActiveStation();
      if (st) {
        hintEl.textContent = st.prompt;
        interactBtn.disabled = false;
        interactBtn.textContent = `Open ${st.shortLabel} [E]`;
      } else {
        hintEl.textContent = "Walk with WASD / Arrow Keys or click any station in the workshop.";
        interactBtn.disabled = true;
        interactBtn.textContent = "Walk to a Station";
      }

      requestAnimationFrame(loop);
    }

    updateHUD();
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  return {
    state,
    playTone,
    toast,
    updateHUD,
    getActiveProject,
    checkShopHazards,
    openModal,
    closeModal,
    completeActiveProject
  };
})();
