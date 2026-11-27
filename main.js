window.ACM = window.ACM || {};

ACM.Game = (function () {
  const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
  const WEATHER_BY_SEASON = {
    Spring: ["Sunny", "Rain", "Sunny", "Breezy"],
    Summer: ["Sunny", "Sunny", "Breezy", "Rain"],
    Autumn: ["Breezy", "Sunny", "Breezy", "Rain"],
    Winter: ["Snow", "Sunny", "Snow", "Breezy"]
  };

  function createStarterTrees() {
    const coords = [
      [130, 595], [220, 595], [310, 595], [400, 595],
      [130, 725], [220, 725], [310, 725], [400, 725],
      [130, 855], [220, 855], [310, 855], [400, 855]
    ];
    return coords.map(([x, y], idx) => {
      if (idx < 2) {
        return {
          plotIndex: idx,
          x,
          y,
          species: "Eastern White Pine",
          stage: 2,
          daysGrown: 2,
          growDays: 2,
          yieldLumberId: "pine_s4s",
          yieldUnits: 4,
          canopyColor: "#2d6a4f"
        };
      }
      return null;
    });
  }

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
    dayCount: 1,
    season: "Spring",
    weather: "Sunny",
    homeStage: 0,
    sawdustHazard: 0,
    safetyIncidents: 0,
    legacyTitle: "Apprentice Woodworker",
    ownedTools: ["tape_measure", "framing_square", "crosscut_saw", "hammer", "safety_glasses", "felling_axe"],
    toolDurability: { crosscut_saw: 18 },
    lumberStock: { pine_s4s: 3 },
    saplingBag: { sapling_pine: 2 },
    trees: createStarterTrees(),
    answeredQuestions: [],
    completedProjectIds: [],
    activeProjectId: "side_1_birdhouse",
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
    setTimeout(() => el.remove(), 4500);
  }

  function advanceDay(reasonText = "") {
    state.dayCount = (state.dayCount || 1) + 1;
    const seasonIdx = Math.floor((state.dayCount - 1) / 4) % SEASONS.length;
    state.season = SEASONS[seasonIdx];

    const options = WEATHER_BY_SEASON[state.season] || ["Sunny"];
    state.weather = options[Math.floor(Math.random() * options.length)];

    let maturedCount = 0;
    (state.trees || []).forEach((t) => {
      if (t && t.stage < 2) {
        t.daysGrown = (t.daysGrown || 0) + 1;
        if (t.daysGrown >= t.growDays) {
          t.stage = 2;
          maturedCount++;
        } else if (t.daysGrown >= 1) {
          t.stage = 1;
        }
      }
    });

    updateHUD();
    if (reasonText) {
      toast(`${reasonText} (${state.season}, Day ${state.dayCount} — ${state.weather})`, "good");
    }
    if (maturedCount > 0) {
      toast(`${maturedCount} tree(s) in your Woodlot reached full maturity!`, "good");
    }
  }

  function updateHUD() {
    document.getElementById("hud-shop-name").textContent = state.shopName;
    document.getElementById("hud-season").textContent = `${state.season} • Day ${state.dayCount} • ${state.weather}`;
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
    if (ACM.World && ACM.World.clearKeys) ACM.World.clearKeys();
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = bodyHtml;
    document.getElementById("modal-overlay").classList.remove("hidden");
  }

  function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
    if (ACM.World) {
      if (ACM.World.clearKeys) ACM.World.clearKeys();
      if (ACM.World.focusGameCanvas) {
        ACM.World.focusGameCanvas(document.getElementById("game-canvas"));
      }
    }
  }

  // --- SEYMOUR'S HARDWARE & TOOL SHOP ---
  function openToolShop() {
    let html = `
      <div class="npc-banner">
        <div>
          <strong>Seymour (Hardware Shopkeeper):</strong>
          <p class="item-meta">"Morning! Need sharp blades, a new saw, or safety gear? Keep your edges honed and your shop dust swept."</p>
        </div>
        <button class="btn-wood btn-sm" id="btn-sweep-shop">Sweep Workshop Sawdust (Free)</button>
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
    openModal("Seymour's Hardware & Tool Shop", html);

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
          toast("Seymour: 'Looks like you're a few dollars short—finish a commission or check the Blueprint Desk!'", "bad");
          return;
        }
        state.cash -= tool.price;
        state.ownedTools.push(tool.id);
        state.toolDurability[tool.id] = tool.maxDurability;
        playTone(580, 0.14);
        updateHUD();
        toast(`Seymour: 'Pleasure doing business! Enjoy the ${tool.name}.'`, "good");
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
        toast(`Seymour honed your ${tool.name} razor sharp!`, "good");
        openToolShop();
      };
    });
  }

  // --- ROUTLEDGE'S SAWMILL & TREE NURSERY ---
  function openLumberMill() {
    let html = `
      <div class="npc-banner">
        <div>
          <strong>Routledge (Sawmill & Nursery Owner):</strong>
          <p class="item-meta">"Fresh boards off the carriage! Or grab some saplings to plant in your Woodlot—grow your own timber and save a fortune."</p>
        </div>
      </div>

      <h3>Tree Saplings (Plant in Your Woodlot)</h3>
      <div class="card-grid">
    `;

    (ACM.SAPLINGS || []).forEach((sap) => {
      const inBag = state.saplingBag[sap.id] || 0;
      html += `
        <div class="item-card">
          <div>
            <div class="item-title">${sap.species} Sapling</div>
            <span class="tag">${sap.growDays} Days to Mature</span> <span class="tag">+${sap.yieldUnits} bd ft</span>
            <p class="item-meta" style="margin-top:4px;">${sap.desc}</p>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
            <span class="item-meta">In Bag: <strong>${inBag}</strong></span>
            <button class="btn-green btn-sm buy-sapling-btn" data-sid="${sap.id}">Buy Sapling ($${sap.price})</button>
          </div>
        </div>
      `;
    });

    html += `</div><h3 style="margin-top:16px;">Milled & Rough-Sawn Lumber</h3><div class="card-grid">`;

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
    openModal("Routledge's Sawmill & Tree Nursery", html);

    document.querySelectorAll(".buy-sapling-btn").forEach((btn) => {
      btn.onclick = () => {
        const sap = ACM.SAPLINGS.find((x) => x.id === btn.dataset.sid);
        if (state.cash < sap.price) {
          toast("Routledge: 'You need a few more dollars for that sapling.'", "bad");
          return;
        }
        state.cash -= sap.price;
        state.saplingBag[sap.id] = (state.saplingBag[sap.id] || 0) + 1;
        playTone(540, 0.1);
        updateHUD();
        toast(`Bought 1 ${sap.species} Sapling! Plant it in Your Woodlot.`, "good");
        openLumberMill();
      };
    });

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

  // --- ALDER CREEK WOODLOT (PLANTING & TREE HARVESTING) ---
  function openWoodlotModal() {
    const plotCoords = [
      [130, 595], [220, 595], [310, 595], [400, 595],
      [130, 725], [220, 725], [310, 725], [400, 725],
      [130, 855], [220, 855], [310, 855], [400, 855]
    ];

    const availableSaplings = (ACM.SAPLINGS || []).filter((s) => (state.saplingBag[s.id] || 0) > 0);

    let html = `
      <div class="npc-banner">
        <div>
          <strong>Alder Creek Woodlot (12 Forestry Plots)</strong>
          <p class="item-meta">Plant saplings bought from Routledge, let them grow as days pass, and harvest mature trees into rough-sawn lumber.</p>
        </div>
        <button class="btn-wood btn-sm" id="btn-woodlot-rest">Sleep Until Tomorrow (+1 Day Growth)</button>
      </div>
      <div class="card-grid">
    `;

    for (let i = 0; i < 12; i++) {
      const tree = state.trees[i];
      if (!tree) {
        html += `
          <div class="item-card">
            <div class="item-title">Plot #${i + 1} — Open Soil</div>
            <p class="item-meta">Ready for planting.</p>
            ${
              availableSaplings.length > 0
                ? `<div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
                    ${availableSaplings
                      .map(
                        (s) =>
                          `<button class="btn-green btn-sm plant-tree-btn" data-plot="${i}" data-sid="${s.id}">Plant ${s.species} (${state.saplingBag[s.id]} left)</button>`
                      )
                      .join("")}
                   </div>`
                : `<span class="tag">Buy saplings at Routledge's Mill</span>`
            }
          </div>
        `;
      } else if (tree.stage < 2) {
        html += `
          <div class="item-card">
            <div class="item-title">Plot #${i + 1} — ${tree.species}</div>
            <span class="tag">${tree.stage === 0 ? "Seedling" : "Young Sapling"} (${tree.daysGrown}/${tree.growDays} Days)</span>
            <p class="item-meta">Growing steadily. Complete jobs or rest to advance days.</p>
          </div>
        `;
      } else {
        const lumberInfo = ACM.LUMBER.find((l) => l.id === tree.yieldLumberId);
        html += `
          <div class="item-card owned">
            <div class="item-title">Plot #${i + 1} — Mature ${tree.species}</div>
            <span class="tag" style="background:#bbf7d0;">Ready to Harvest (+${tree.yieldUnits} bd ft)</span>
            <p class="item-meta">Yields ${tree.yieldUnits} ${lumberInfo ? lumberInfo.name : "lumber"}.</p>
            <button class="btn-brass btn-sm harvest-tree-btn" data-plot="${i}">Fell & Harvest Timber</button>
          </div>
        `;
      }
    }

    html += `</div>`;
    openModal("Alder Creek Woodlot & Forestry", html);

    document.getElementById("btn-woodlot-rest").onclick = () => {
      advanceDay("Slept until morning");
      openWoodlotModal();
    };

    document.querySelectorAll(".plant-tree-btn").forEach((btn) => {
      btn.onclick = () => {
        const plotIdx = Number(btn.dataset.plot);
        const sid = btn.dataset.sid;
        if ((state.saplingBag[sid] || 0) <= 0) return;

        const sap = ACM.SAPLINGS.find((s) => s.id === sid);
        state.saplingBag[sid]--;
        const [x, y] = plotCoords[plotIdx];
        state.trees[plotIdx] = {
          plotIndex: plotIdx,
          x,
          y,
          species: sap.species,
          stage: 0,
          daysGrown: 0,
          growDays: sap.growDays,
          yieldLumberId: sap.yieldLumberId,
          yieldUnits: sap.yieldUnits,
          canopyColor: sap.canopyColor
        };
        playTone(500, 0.12);
        toast(`Planted ${sap.species} in Plot #${plotIdx + 1}!`, "good");
        openWoodlotModal();
      };
    });

    document.querySelectorAll(".harvest-tree-btn").forEach((btn) => {
      btn.onclick = () => {
        const plotIdx = Number(btn.dataset.plot);
        const tree = state.trees[plotIdx];
        if (!tree || tree.stage < 2) return;

        state.lumberStock[tree.yieldLumberId] = (state.lumberStock[tree.yieldLumberId] || 0) + tree.yieldUnits;
        state.trees[plotIdx] = null;
        playTone(340, 0.22);
        toast(`TIMBER! Harvested +${tree.yieldUnits} bd ft of ${tree.species} into your lumber rack!`, "good");
        openWoodlotModal();
      };
    });
  }

  // --- BUILD YOUR OWN HOME (HOMESTEAD PLOT) ---
  function openHomesteadModal() {
    const currentStage = state.homeStage || 0;
    const nextSpec = ACM.HOME_STAGES.find((s) => s.stage === currentStage + 1);

    let html = `
      <div class="npc-banner">
        <div>
          <strong>Your Homestead Plot — Stage ${currentStage} / 5</strong>
          <p class="item-meta">Use your woodworking skills and milled lumber to build your own timber-frame home in Alder Creek.</p>
        </div>
        <button class="btn-wood btn-sm" id="btn-home-sleep">Rest Until Morning (+1 Day)</button>
      </div>
    `;

    if (!nextSpec) {
      html += `
        <div class="item-card owned">
          <h3>Master Craftsman's Homestead Complete!</h3>
          <p>Your timber-frame house stands finished overlooking Alder Creek. All customer commissions automatically earn a <strong>+15% cash & reputation bonus</strong>!</p>
        </div>
      `;
    } else {
      const lumberObj = ACM.LUMBER.find((l) => l.id === nextSpec.lumberId);
      const toolObj = ACM.TOOLS.find((t) => t.id === nextSpec.requiredTool);
      const haveLumber = (state.lumberStock[nextSpec.lumberId] || 0) >= nextSpec.lumberUnits;
      const haveCash = state.cash >= nextSpec.cashCost;
      const haveTool = state.ownedTools.includes(nextSpec.requiredTool);

      html += `
        <div class="item-card">
          <div class="item-title">Next Build Stage: ${nextSpec.name}</div>
          <p class="item-meta">${nextSpec.desc}</p>
          <ul style="margin:8px 0 8px 18px; font-size:0.88rem;">
            <li>Materials: <strong>${nextSpec.lumberUnits} ${lumberObj.name}</strong> (You have: ${state.lumberStock[nextSpec.lumberId] || 0}) ${haveLumber ? "✓" : "✗"}</li>
            <li>Supplies & Hardware Cost: <strong>$${nextSpec.cashCost}</strong> (You have: $${Math.round(state.cash)}) ${haveCash ? "✓" : "✗"}</li>
            <li>Required Tool: <strong>${toolObj.name}</strong> ${haveTool ? "✓" : "(Buy at Seymour's Hardware)"}</li>
          </ul>
          <button class="btn-brass" id="btn-build-home" ${haveLumber && haveCash && haveTool ? "" : "disabled"}>
            Construct Stage ${nextSpec.stage}: ${nextSpec.name}
          </button>
        </div>
      `;
    }

    html += `<div class="card-grid" style="margin-top:12px;">`;
    ACM.HOME_STAGES.forEach((st) => {
      const built = currentStage >= st.stage;
      html += `
        <div class="item-card ${built ? "owned" : ""}">
          <div class="item-title">Stage ${st.stage}: ${st.name}</div>
          <span class="tag">${built ? "Built ✓" : "Upcoming"}</span>
          <p class="item-meta">${st.desc}</p>
        </div>
      `;
    });
    html += `</div>`;

    openModal("Your Homestead & Home Builder", html);

    document.getElementById("btn-home-sleep").onclick = () => {
      advanceDay("Rested comfortably at your homestead");
      openHomesteadModal();
    };

    const buildBtn = document.getElementById("btn-build-home");
    if (buildBtn && nextSpec) {
      buildBtn.onclick = () => {
        state.cash -= nextSpec.cashCost;
        state.lumberStock[nextSpec.lumberId] -= nextSpec.lumberUnits;
        state.homeStage = nextSpec.stage;
        state.stars = Math.min(5.0, state.stars + 0.15);
        playTone(680, 0.25);
        updateHUD();
        toast(`Built Stage ${nextSpec.stage}: ${nextSpec.name}! (+0.15★)`, "good");
        ACM.CloudSync.saveToCloud(state);
        openHomesteadModal();
      };
    }
  }

  // --- TOWN COMMISSION BOARD ---
  function openTownBoard() {
    const availableJobs = ACM.PROJECTS.filter((p) => p.tier <= Math.max(1, Math.floor(state.stars + 0.35)));

    let html = `
      <div class="npc-banner">
        <div>
          <strong>Alder Creek Village Commission Board</strong>
          <p class="item-meta">Neighbors post woodworking requests here. Complete builds to earn cash, raise your star rating, and advance the seasons.</p>
        </div>
        <button class="btn-wood btn-sm" id="btn-board-day">Advance to Next Day</button>
      </div>
      <div class="card-grid">
    `;

    availableJobs.forEach((p) => {
      const isCurrent = state.activeProjectId === p.id;
      const doneCount = state.completedProjectIds.filter((id) => id === p.id).length;
      html += `
        <div class="item-card ${isCurrent ? "owned" : ""}">
          <div>
            <div class="item-title">${p.title}</div>
            <div class="item-meta">Client: ${p.client} | Payout: <strong>$${p.basePay}</strong> | +${p.starGain}★</div>
            <p class="item-meta" style="margin-top:4px;">${p.desc}</p>
            <p class="item-meta" style="margin-top:4px;"><strong>Stock:</strong> ${p.lumberReq.units} units (${p.lumberReq.allowedIds.map((id) => ACM.LUMBER.find((x) => x.id === id).name).join(" / ")})</p>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
            ${doneCount > 0 ? `<span class="tag">Built ${doneCount}×</span>` : `<span></span>`}
            ${
              isCurrent
                ? `<span class="tag" style="background:#bbf7d0;">Active Commission</span>`
                : `<button class="btn-brass btn-sm accept-job-btn" data-pid="${p.id}">Accept Commission</button>`
            }
          </div>
        </div>
      `;
    });

    html += `</div>`;
    openModal("Alder Creek Commission Board", html);

    document.getElementById("btn-board-day").onclick = () => {
      advanceDay("A new day dawns in Alder Creek");
      openTownBoard();
    };

    document.querySelectorAll(".accept-job-btn").forEach((btn) => {
      btn.onclick = () => {
        state.activeProjectId = btn.dataset.pid;
        resetJobProgress();
        updateHUD();
        toast("Accepted commission! Head to your Workshop's Layout Bench to begin.", "good");
        openTownBoard();
      };
    });
  }

  function completeActiveProject() {
    const job = getActiveProject();
    if (!job) return;

    const prog = state.jobProgress;
    const mistakePenalty = prog.mistakes * 15;
    const homeMultiplier = (state.homeStage || 0) >= 5 ? 1.15 : 1.0;
    const netPay = Math.round(Math.max(20, job.basePay - mistakePenalty) * homeMultiplier);
    const preferredBonus = job.lumberReq.preferredId && prog.lumberAssigned === job.lumberReq.preferredId ? 0.15 : 0;
    const starDelta = Math.max(0.05, (job.starGain + preferredBonus - prog.mistakes * 0.08) * homeMultiplier);

    state.cash += netPay;
    state.stars = Math.min(5.0, state.stars + starDelta);
    state.completedProjectIds.push(job.id);

    if (state.stars >= 4.8 && state.safetyIncidents === 0) {
      state.legacyTitle = "The Master Artisan";
    } else if (state.cash >= 1500) {
      state.legacyTitle = "The Savvy Entrepreneur";
    } else if ((state.homeStage || 0) >= 5) {
      state.legacyTitle = "Alder Creek Homesteader";
    } else {
      state.legacyTitle = `Tier ${Math.floor(state.stars)}★ Woodworker`;
    }

    state.activeProjectId = null;
    resetJobProgress();
    advanceDay(`Delivered ${job.title}`);
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

    const saplingList = Object.entries(state.saplingBag || {})
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const s = ACM.SAPLINGS.find((x) => x.id === id);
        return `<li><strong>${s.species} Sapling:</strong> ${qty}</li>`;
      })
      .join("");

    openModal(
      `${state.shopName} — Inventory & Stats`,
      `
        <p><strong>Title:</strong> ${state.legacyTitle} | <strong>Certified:</strong> Tier ${state.certifiedTier}★ | <strong>Homestead:</strong> Stage ${state.homeStage || 0}/5</p>
        <h3 style="margin-top:10px;">Owned Tools & Safety Gear (${ownedList.length}/${ACM.TOOLS.length})</h3>
        <div class="workflow-steps">
          ${ownedList.map((t) => `<span class="step-pill done">${t.name}</span>`).join("")}
        </div>
        <h3 style="margin-top:12px;">Lumber Rack</h3>
        <ul style="margin-left:18px; margin-top:4px;">${lumberList || "<li>Rack is empty — visit Routledge's Sawmill or harvest trees.</li>"}</ul>
        <h3 style="margin-top:12px;">Sapling Bag</h3>
        <ul style="margin-left:18px; margin-top:4px;">${saplingList || "<li>No saplings in bag.</li>"}</ul>
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
            <tr><th>Rank</th><th>Workshop</th><th>Rating</th><th>Cash</th><th>Title</th></tr>
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
    else if (stationId === "woodlot") openWoodlotModal();
    else if (stationId === "homestead") openHomesteadModal();
  }

  function migrateLoadedState(loaded) {
    Object.assign(state, loaded);
    if (!Array.isArray(state.trees) || state.trees.length !== 12) {
      state.trees = createStarterTrees();
    }
    if (!state.saplingBag) state.saplingBag = { sapling_pine: 2 };
    if (typeof state.homeStage !== "number") state.homeStage = 0;
    if (typeof state.dayCount !== "number") state.dayCount = 1;
    if (!state.season) state.season = "Spring";
    if (!state.weather) state.weather = "Sunny";
    ["tape_measure", "framing_square", "crosscut_saw", "hammer", "safety_glasses", "felling_axe"].forEach((tid) => {
      if (!state.ownedTools.includes(tid)) state.ownedTools.push(tid);
    });
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
            migrateLoadedState(result.state);
            toast(`Welcome back to ${state.shopName}!`, "good");
          } else {
            state.classCode = classCode;
            state.shopName = shopName;
            state.pin = pin;
            await ACM.CloudSync.saveToCloud(state);
            toast(`Welcome to Alder Creek! Your first commission (Classic Songbird House) is ready at the Layout Bench.`, "good");
          }
        }
      } catch (err) {
        state.classCode = classCode;
        state.shopName = shopName;
        state.pin = pin;
      }

      document.getElementById("creator-modal").classList.add("hidden");
      updateHUD();
      startBtn.disabled = false;

      if (ACM.World && ACM.World.focusGameCanvas) {
        ACM.World.focusGameCanvas(document.getElementById("game-canvas"));
      }
    };

    const previewCanvas = document.getElementById("preview-canvas");
    if (previewCanvas && ACM.ArtSprites) {
      const pCtx = previewCanvas.getContext("2d");
      const drawPreview = () => {
        state.appearance.skin = document.getElementById("pick-skin").value;
        state.appearance.hair = document.getElementById("pick-hair").value;
        state.appearance.shirt = document.getElementById("pick-shirt").value;
        state.appearance.apron = document.getElementById("pick-apron").value;

        pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        pCtx.fillStyle = "#568c4a";
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
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !document.getElementById("modal-overlay").classList.contains("hidden")) {
        closeModal();
      }
    });

    document.getElementById("btn-story").onclick = openTownBoard;
    document.getElementById("btn-inventory").onclick = openInventoryModal;
    document.getElementById("btn-leaderboard").onclick = openLeaderboardModal;

    const saveBtn = document.getElementById("btn-save");
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const res = await ACM.CloudSync.saveToCloud(state);
        if (res.mode === "cloud") {
          toast("Progress synced to Class Leaderboard!", "good");
        } else {
          toast(`Saved locally (${res.error || res.warning || "Supabase keys not set"}).`, "bad");
        }
      };
    }

    const interactBtn = document.getElementById("btn-interact");
    const hintEl = document.getElementById("station-hint");
    interactBtn.onclick = () => {
      const st = ACM.World.getActiveStation();
      if (st) handleStationInteract.call(ACM.Game, st.id);
    };

    function loop() {
      ACM.World.update(state);
      ACM.World.render(ctx, state);

      const st = ACM.World.getActiveStation();
      if (st) {
        hintEl.textContent = st.prompt;
        interactBtn.disabled = false;
        interactBtn.textContent = `Open ${st.shortLabel} [E]`;
      } else {
        hintEl.textContent = "Walk with WASD / Arrow Keys, use the D-Pad, or click anywhere to move.";
        interactBtn.disabled = true;
        interactBtn.textContent = "Walk to a Building";
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
