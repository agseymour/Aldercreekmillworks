window.ACM = window.ACM || {};

ACM.Game = (function () {
  const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
  const WEATHER_BY_SEASON = {
    Spring: ["Sunny", "Rain", "Sunny", "Breezy"],
    Summer: ["Sunny", "Sunny", "Breezy", "Rain"],
    Autumn: ["Breezy", "Sunny", "Breezy", "Rain"],
    Winter: ["Snow", "Sunny", "Snow", "Breezy"]
  };

  // ---- Trees live on the tile map: {tx, ty, saplingId, species, stage 0-2, daysGrown, growDays, yield...}
  function makeTree(sap, tx, ty, grown) {
    const d = Math.min(grown, sap.growDays);
    return {
      tx,
      ty,
      saplingId: sap.id,
      species: sap.species,
      stage: d >= sap.growDays ? 2 : d >= 1 ? 1 : 0,
      daysGrown: d,
      growDays: sap.growDays,
      yieldLumberId: sap.yieldLumberId,
      yieldUnits: sap.yieldUnits,
      canopyColor: sap.canopyColor
    };
  }

  function meadowSpots() {
    const out = [];
    for (let y = 30; y <= 46; y += 2) for (let x = 9; x <= 13; x += 2) if (ACM.Map.isPlantable(x, y)) out.push([x, y]);
    return out;
  }

  function createStarterTrees() {
    const pine = (ACM.SAPLINGS || []).find((s) => s.id === "sapling_pine");
    const spots = meadowSpots();
    return pine && spots.length >= 2 ? [makeTree(pine, spots[0][0], spots[0][1], pine.growDays), makeTree(pine, spots[1][0], spots[1][1], pine.growDays)] : [];
  }

  // Old saves stored 12 fixed pixel-plots; spread any surviving trees out over the meadow.
  function convertOldTrees(old) {
    if (!Array.isArray(old)) return createStarterTrees();
    const spots = meadowSpots();
    const out = [];
    old.filter(Boolean).forEach((t) => {
      const sap = (ACM.SAPLINGS || []).find((x) => x.species === t.species) || (ACM.SAPLINGS || [])[0];
      const spot = spots.shift();
      if (!sap || !spot) return;
      out.push(makeTree(sap, spot[0], spot[1], t.stage >= 2 ? sap.growDays : t.daysGrown || 0));
    });
    return out;
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
    safety: {},
    measured: {},
    story: { stage: 0, met: false, seen: {}, tea: -1 },
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
    treeFormat: 2,
    selectedSapling: null,
    slots: [],
    sel: 0,
    answeredQuestions: [],
    completedProjectIds: [],
    timeMin: 360,
    energy: 150,
    maxEnergy: 150,
    felled: {},
    wild: [],
    pantry: {},
    forageTaken: {},
    workshop: { west: false, east: false },
    products: [],
    logs: {},
    accepted: ["side_1_birdhouse"],
    jobStash: {},
    rel: {},
    tut: { done: [] },
    stats: {},
    events: [],
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
    if (ACM.Audio && ACM.Audio.isMuted()) return;
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

  // Student-supplied text (workshop names, titles, class codes) must never be injected as raw HTML.
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
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

    growForest();
    updateHUD();
    renderPlantBar();
    if (reasonText) {
      toast(`${reasonText} (${state.season}, Day ${state.dayCount} — ${state.weather})`, "good");
    }
    if (maturedCount > 0) {
      toast(`${maturedCount} tree(s) you planted are ready to harvest — look for the sparkle!`, "good");
    }
  }

  function updateHUD() {
    applyMaxEnergy();
    if (typeof renderHotbar === "function" && document.getElementById("hotbar")) renderHotbar();
    state.speedMult = perkFx().speedMult;
    document.getElementById("hud-shop-name").textContent = state.shopName;
    document.getElementById("hud-season").textContent = `${state.season} • Day ${state.dayCount} • ${state.weather}`;
    document.getElementById("hud-stars").textContent = `★ ${state.stars.toFixed(2)}`;
    document.getElementById("hud-cash").textContent = `$${Math.round(state.cash)}`;

    const dustEl = document.getElementById("hud-sawdust");
    dustEl.textContent = `${state.sawdustHazard}%`;
    dustEl.style.color = state.sawdustHazard >= 75 ? "#f87171" : state.sawdustHazard >= 45 ? "#facc15" : "#fff";

    const job = getActiveProject();
    const extra = Math.max(0, (state.accepted || []).length - (job ? 1 : 0));
    document.getElementById("hud-job").textContent = (job ? job.title.slice(0, 16) + (job.title.length > 16 ? "…" : "") : "None") + (extra ? ` +${extra}` : "");
    const snd = document.getElementById("btn-sound");
    if (snd && ACM.Audio) snd.textContent = ACM.Audio.isMuted() ? "🔇" : "🔊";
  }

  function getActiveProject() {
    return (ACM.PROJECTS || []).find((p) => p.id === state.activeProjectId) || null;
  }

  // If a player drops a half-finished commission, give back the lumber that was already pulled from the rack.
  function refundAssignedLumber() {
    const job = getActiveProject();
    const prog = state.jobProgress;
    if (job && prog && prog.lumberAssigned) {
      state.lumberStock[prog.lumberAssigned] = (state.lumberStock[prog.lumberAssigned] || 0) + job.lumberReq.units;
      return true;
    }
    return false;
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
      logEvent("hazard", { type: "sawdust_fire", extinguisher: state.ownedTools.includes("fire_extinguisher") });
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
    if (ACM.Calculator) ACM.Calculator.sync(title, bodyHtml);
  }

  function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
    if (ACM.Calculator) ACM.Calculator.hide();
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
    `;

    const card = (tool) => {
      const owned = state.ownedTools.includes(tool.id);
      const fit = ACM.Workshop ? ACM.Workshop.fits(state, tool.id) : { ok: true };
      const dur = state.toolDurability[tool.id] ?? tool.maxDurability;
      const needsSharpen = owned && tool.maxDurability < 500 && dur < tool.maxDurability;
      return `
        <div class="item-card ${owned ? "owned" : ""}">
          <div>
            <div class="item-title">${tool.name}</div>
            <span class="tag">Tier ${tool.tier}★</span> <span class="tag">${tool.category.toUpperCase()}</span>
            <p class="item-meta" style="margin-top:4px;">${tool.desc}</p>
            <p class="item-meta" style="color:#78350f; margin-top:3px;"><em>${tool.curriculumNote}</em></p>
          </div>
          <div>
            ${owned
              ? needsSharpen
                ? `<button class="btn-brass btn-sm sharpen-btn" data-tid="${tool.id}">Sharpen Blade ($${tool.sharpenCost}) [${dur}/${tool.maxDurability}]</button>`
                : `<span class="tag" style="background:#bbf7d0;">Owned & Ready</span>`
              : !fit.ok
              ? `<span class="tag" style="background:#fde68a;">No room: build the ${fit.add.name} ($${fit.add.cost}) at the Blueprint Desk first</span>`
              : `<button class="btn-brass btn-sm buy-tool-btn" data-tid="${tool.id}">Buy ($${tool.price})</button>`}
          </div>
        </div>`;
    };
    const forSale = ACM.TOOLS.filter((t) => !state.ownedTools.includes(t.id) && t.tier <= state.certifiedTier);
    const mine = ACM.TOOLS.filter((t) => state.ownedTools.includes(t.id));
    const nextTier = ACM.TOOLS.filter((t) => t.tier === state.certifiedTier + 1 && !state.ownedTools.includes(t.id));
    const teaser = nextTier.length
      ? `<p class="item-meta">Pass the Tier ${state.certifiedTier + 1}★ exam and Seymour will stock ${nextTier.length} more tool${nextTier.length > 1 ? "s" : ""}.</p><div class="card-grid">${nextTier.map((t) => ACM.Reveal.locked(t.name, `Requires the Tier ${t.tier}★ exam.`)).join("")}</div>`
      : "";
    html += ACM.Reveal.tabs([
      { key: "sale", label: "For sale", count: forSale.length, html: forSale.length ? `<div class="card-grid">${forSale.map(card).join("")}</div>` : `<p class="item-meta">You have everything Seymour stocks at your level.</p>` },
      { key: "mine", label: "Your tools", count: mine.length, html: mine.length ? `<div class="card-grid">${mine.map(card).join("")}</div>` : `<p class="item-meta">No tools yet.</p>` },
      { key: "next", label: "Next tier", html: teaser }
    ]);
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
        if (ACM.Workshop && !ACM.Workshop.fits(state, tool.id).ok) { toast("Seymour: 'Where would you put it? Your workshop needs the " + ACM.Workshop.fits(state, tool.id).add.name + " first.'", "bad"); return; }
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
          <p class="item-meta">"Fresh boards off the carriage! Or grab some saplings and plant them on any open grass—grow your own timber and save a fortune."</p>
        </div>
      </div>

      <p><button class="btn-wood btn-sm" data-act="rack">Sell or mill your logs…</button></p>
      <h3>Tree Saplings (Plant on any open grass)</h3>
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
            <button class="btn-green btn-sm buy-sapling-btn" data-sid="${sap.id}">Buy Sapling ($${money(sap.price)})</button>
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
                : `<button class="btn-brass btn-sm buy-lumber-btn" data-lid="${l.id}">+1 ${l.unitLabel} ($${money(l.pricePerUnit)})</button>`
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
        if (state.cash < money(sap.price)) {
          toast("Routledge: 'You need a few more dollars for that sapling.'", "bad");
          return;
        }
        state.cash -= money(sap.price);
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
        if (state.cash < money(l.pricePerUnit)) {
          toast("Not enough cash for lumber.", "bad");
          return;
        }
        state.cash -= money(l.pricePerUnit);
        state.lumberStock[l.id] = (state.lumberStock[l.id] || 0) + 1;
        playTone(490, 0.1);
        updateHUD();
        openLumberMill();
      };
    });
  }

  // --- PLANTING & HARVESTING (trees go on any open grass) ---
  function treeAtTile(tx, ty) {
    return (state.trees || []).find((t) => t && t.tx === tx && t.ty === ty) || null;
  }

  function plantCheck(tx, ty) {
    const Map_ = ACM.Map;
    if (!Map_.inb(tx, ty)) return { ok: false, reason: "That's off the edge of the map." };
    const type = Map_.tileAt(tx, ty);
    if (type === Map_.TYPE.WATER) return { ok: false, reason: "Trees can't grow in water." };
    if (type === Map_.TYPE.SAND) return { ok: false, reason: "The sandy shore is too salty for saplings." };
    if (type !== Map_.TYPE.GRASS) return { ok: false, reason: "Saplings need soft grass, not a road or floor." };
    if (treeAtTile(tx, ty)) return { ok: false, reason: "There's already a tree here." };
    if (Map_.forageIndex.has(ty * Map_.W + tx)) return { ok: false, reason: "Wild berries or mushrooms grow here. Pick another spot." };
    const pt = ACM.World.getPlayerTile();
    if (pt.tx === tx && pt.ty === ty) return { ok: false, reason: "You're standing there—step aside first." };
    if (!Map_.isPlantable(tx, ty)) {
      return { ok: false, reason: Map_.blocked[Map_.idx(tx, ty)] ? "Something is already growing or standing there." : "Keep this spot clear so people can get through." };
    }
    if (ACM.World.isBlockedTile(tx, ty)) return { ok: false, reason: "Something is in the way." };
    if (ACM.World.wouldTrap && ACM.World.wouldTrap(tx, ty)) return { ok: false, reason: "A tree there would wall you in! Leave a way through for yourself." };
    return { ok: true };
  }

  function availableSaplingIds() {
    return (ACM.SAPLINGS || []).filter((s) => (state.saplingBag[s.id] || 0) > 0).map((s) => s.id);
  }

  function selectedSaplingId() {
    const key = state.slots[state.sel];
    if (!key || key.indexOf("sapling:") !== 0) return null;
    const id = key.slice(8);
    return (state.saplingBag[id] || 0) > 0 ? id : null;
  }

  function plantLabel() {
    const sap = (ACM.SAPLINGS || []).find((s) => s.id === selectedSaplingId());
    return sap ? `Planting ${sap.species} (${state.saplingBag[sap.id]} left) — click open grass or press E` : "Planting";
  }

  function harvestTree(tree) {
    state.lumberStock[tree.yieldLumberId] = (state.lumberStock[tree.yieldLumberId] || 0) + tree.yieldUnits;
    state.trees = state.trees.filter((t) => t !== tree);
    playTone(340, 0.22);
    toast(`TIMBER! Harvested +${tree.yieldUnits} bd ft of ${tree.species} into your lumber rack!`, "good");
  }

  // =====================================================================
  //  CLOCK, ENERGY, SLEEP
  // =====================================================================
  function logEvent(type, data) {
    if (!state.events) state.events = [];
    state.events.push(Object.assign({ t: type, d: state.dayCount, m: Math.round(state.timeMin || 0) }, data || {}));
    if (state.events.length > 600) state.events.splice(0, state.events.length - 600);
  }

  // ----- friendship perks -----
  function perkFx() {
    const fx = { workTime: 1, workEnergy: 1, fellEnergy: 1, shopMult: 1, mealMult: 1, maxEnergy: 0, payBonus: 0, freeMistakes: 0, starMult: 1, growBonus: 0, sellMult: 1, millFree: false, speedMult: 1, nailZone: 1, screwZone: 1 };
    Object.entries(ACM.PERKS || {}).forEach(([id, list]) => {
      const h = ACM.NPC_HELPERS.heartsFor((state.rel[id] || {}).pts);
      list.forEach((p) => {
        if (h < p.h) return;
        Object.entries(p.fx).forEach(([k, v]) => {
          if (typeof v === "boolean") fx[k] = fx[k] || v;
          else if (["workTime", "workEnergy", "fellEnergy", "shopMult", "mealMult", "starMult", "sellMult", "speedMult", "nailZone", "screwZone"].includes(k)) fx[k] *= v;
          else fx[k] += v;
        });
      });
    });
    return fx;
  }
  function applyMaxEnergy() {
    const want = 150 + perkFx().maxEnergy;
    if (state.maxEnergy !== want) { state.energy += Math.max(0, want - state.maxEnergy); state.maxEnergy = want; }
  }
  function spendWork(min, energy) {
    const fx = perkFx();
    spendTime(Math.round(min * fx.workTime), Math.max(1, Math.round(energy * 0.6 * fx.workEnergy)));
  }
  function money(n) { return Math.max(1, Math.round(n * perkFx().shopMult)); }

  function spendTime(min, energy) {
    state.timeMin = Math.min(1439.5, (state.timeMin == null ? 360 : state.timeMin) + (min || 0));
    if (energy) state.energy = Math.max(0, (state.energy == null ? 100 : state.energy) - energy);
  }

  function needEnergy(n) {
    if ((state.energy == null ? 100 : state.energy) >= n) return true;
    toast("You're too tired. Eat something at Clara's Café or Mateo's, or head home and sleep.", "bad");
    if (ACM.Audio) ACM.Audio.sfx("bad");
    return false;
  }

  function sleepNow(passedOut) {
    advanceDay("");
    spoilFood();
    state.timeMin = passedOut ? 480 : 360;
    applyMaxEnergy();
    state.energy = passedOut ? Math.round(state.maxEnergy * 0.7) : state.maxEnergy;
    if (ACM.Audio) ACM.Audio.sfx("sleep");
    toast(passedOut ? `You woke at 8:00. (${state.season}, Day ${state.dayCount} — ${state.weather})` : `You slept well. A new day dawns: ${state.season}, Day ${state.dayCount} — ${state.weather}.`, "good");
    logEvent("sleep", { passedOut: !!passedOut });
    updateHUD();
    ACM.CloudSync.saveToCloud(state);
  }

  // At midnight the player collapses: screen fades to black, they wake at home next morning minus $100.
  let collapsing = false;
  function collapseAtMidnight(opts) {
    opts = opts || {};
    if (collapsing) return;
    collapsing = true;
    let el = document.getElementById("blackout");
    if (!el) { el = document.createElement("div"); el.id = "blackout"; document.body.appendChild(el); }
    el.textContent = "";
    if (ACM.World.clearKeys) ACM.World.clearKeys();
    el.classList.add("on");
    setTimeout(() => {
      if (ACM.World.inBuilding && ACM.World.inBuilding()) ACM.World.exitBuilding();
      closeModal();
      const lost = opts.noLoss ? 0 : Math.min(100, Math.max(0, Math.round(state.cash)));
      state.cash -= lost;
      const sp = ACM.Map.spawn || { tx: 16, ty: 15 };
      if (ACM.World.debug && ACM.World.debug.teleportTile) ACM.World.debug.teleportTile(sp.tx != null ? sp.tx : Math.floor(sp.x / 32), sp.ty != null ? sp.ty : Math.floor(sp.y / 32));
      sleepNow(true);
      logEvent(opts.event || "midnight_collapse", { lost });
      el.textContent = "Zzz…";
    }, 1100);
    setTimeout(() => {
      el.classList.remove("on");
      collapsing = false;
      openModal(opts.title || "You collapsed at midnight", opts.html || `<p><strong>You fell asleep and lost your wallet!</strong></p>
        <p class="item-meta">Working past midnight caught up with you. You woke up at home the next morning. It cost you $100 (or all you were carrying). Wrap up by evening and sleep in your bed to avoid this.</p>
        <div class="dialog-actions"><button class="btn-wood" data-act="close">OK</button></div>`);
    }, 2800);
  }

  function eat(cost, energy, label) {
    if (state.cash < cost) { toast("Not enough cash for that.", "bad"); return false; }
    state.cash -= cost;
    energy = Math.round(energy * perkFx().mealMult);
    state.energy = Math.min(state.maxEnergy, state.energy + energy);
    spendTime(10, 0);
    if (ACM.Audio) ACM.Audio.sfx("coin");
    toast(`${label}: +${energy} energy.`, "good");
    updateHUD();
    return true;
  }


  // =====================================================================
  //  FOOD: foraging, pantry, café provisions, eating
  // =====================================================================
  function foodCount(id) { return ((state.pantry || {})[id] || []).reduce((s, b) => s + b.n, 0); }
  function addFood(id, n) {
    const l = state.pantry[id] || (state.pantry[id] = []);
    const b = l.find((x) => x.d === state.dayCount);
    if (b) b.n += n; else l.push({ n, d: state.dayCount });
  }
  function takeFood(id) {
    const l = state.pantry[id];
    if (!l || !l.length) return false;
    l[0].n--;
    if (l[0].n <= 0) l.shift();
    return true;
  }
  function spoilFood() {
    const lost = [];
    Object.entries(state.pantry).forEach(([id, l]) => {
      const f = ACM.FOODS[id];
      if (!f || f.shelf == null) return;
      const keep = l.filter((b) => state.dayCount - b.d < f.shelf);
      const gone = l.reduce((s, b) => s + b.n, 0) - keep.reduce((s, b) => s + b.n, 0);
      if (gone > 0) lost.push(`${gone} ${f.name}`);
      state.pantry[id] = keep;
    });
    Object.keys(state.forageTaken).forEach((k) => { if (state.dayCount - state.forageTaken[k] > 12) delete state.forageTaken[k]; });
    if (lost.length) toast(`Spoiled overnight: ${lost.join(", ")}. Foraged food only keeps a few days. Pantry food from Clara keeps forever.`, "bad");
  }
  function eatFood(id) {
    const f = ACM.FOODS[id];
    if (!f || !foodCount(id)) return false;
    if (state.energy >= state.maxEnergy) { toast("You're not hungry right now.", ""); return false; }
    takeFood(id);
    const gain = Math.round(f.energy * perkFx().mealMult);
    state.energy = Math.min(state.maxEnergy, state.energy + gain);
    spendTime(5, 0);
    if (ACM.Audio) ACM.Audio.sfx("good");
    toast(`${f.name}: +${gain} energy.`, "good");
    logEvent("eat", { id });
    updateHUD();
    return true;
  }
  function quickEat() {
    // eat what would spoil soonest, otherwise the smallest snack
    const have = Object.keys(state.pantry).filter((id) => foodCount(id) > 0 && ACM.FOODS[id]);
    if (!have.length) { toast("Your pack has no food. Forage berries and mushrooms, or buy provisions at Clara's.", "bad"); return; }
    have.sort((a, b) => (ACM.FOODS[a].shelf == null) - (ACM.FOODS[b].shelf == null) || ACM.FOODS[a].energy - ACM.FOODS[b].energy);
    eatFood(have[0]);
  }
  function harvestForage(i) {
    const f = ACM.Map.forageIndex.get(i);
    if (!f) return;
    const item = ACM.Forage.available(state, f);
    if (!item) { toast("Nothing ripe here right now.", ""); return; }
    if (!needEnergy(1)) return;
    const n = ACM.Forage.amount(f);
    addFood(item, n);
    state.forageTaken[i] = state.dayCount;
    spendTime(5, 1);
    if (ACM.World.spawnBurst) ACM.World.spawnBurst(f.tx, f.ty, "leaves");
    if (ACM.Audio) ACM.Audio.sfx("plant");
    toast(`Picked ${n} ${ACM.FOODS[item].name}. This spot regrows in ${ACM.Forage.respawn[f.kind]} days. They keep ${ACM.FOODS[item].shelf} days. Press F to eat, or open your Inventory.`, "good");
    logEvent("forage", { item, n });
    tutDone("forage");
    updateHUD();
  }
  function openProvisions(note) {
    const rows = ACM.PROVISIONS.map((id) => {
      const f = ACM.FOODS[id];
      return `<tr><td>${f.icon} <strong>${f.name}</strong> <span class="item-meta">+${f.energy}⚡ · never spoils</span></td><td>You have ${foodCount(id)}</td><td><button class="btn-brass btn-sm" data-act="buy-food" data-id="${id}">Buy ($${f.price})</button></td></tr>`;
    }).join("");
    const hot = MEALS.clara;
    openModal("Harbor Café Counter", `
      ${note ? `<p class="tag" style="background:#bbf7d0;margin-bottom:8px;">${escapeHtml(note)}</p>` : ""}
      <div class="tut-box"><strong>Clara:</strong> "A hot meal is best, but folks who work out in the bush take provisions. They keep in your pack and won't spoil. Eat one any time with the <strong>F</strong> key or from your Inventory."</div>
      <p><button class="btn-green btn-sm" data-act="meal" data-npc="clara">${hot.name} here, hot ($${hot.cost}, +${Math.round(hot.energy * perkFx().mealMult)}⚡)</button>
      <button class="btn-wood btn-sm" data-act="npc" data-npc="clara" data-view="">Chat with Clara</button></p>
      <h3>Provisions to carry</h3><table class="shop-table"><tbody>${rows}</tbody></table>`);
  }
  function openForestReport() {
    const M = ACM.Map;
    const felledN = Object.keys(state.felled).length;
    const cap = M.natureTrees.length;
    const alive = cap - felledN + state.wild.length;
    const f = state.stats.felled || 0, p = state.stats.planted || 0;
    const rating = f === 0 ? "Untouched" : p >= f ? "Excellent steward" : p >= f * 0.5 ? "Good steward" : "Take more than you plant";
    openModal("Forest Report", `
      <p class="item-meta">Ranger MacLeod keeps this map of Alder Creek's forest.</p>
      <div class="card-grid">
        <div class="item-card"><div class="item-title">The forest</div><p class="item-meta">Wild trees standing: <strong>${alive}</strong> of ${cap} (the valley's limit)<br>Young wild trees: ${state.wild.filter((t) => t.stage < 2).length}<br>Stumps waiting to regrow: ${felledN}</p></div>
        <div class="item-card"><div class="item-title">Your stewardship</div><p class="item-meta">Trees felled: <strong>${f}</strong> · Trees planted: <strong>${p}</strong><br>MacLeod's verdict: <strong>${rating}</strong></p></div>
        <div class="item-card"><div class="item-title">Seasonal forage</div><p class="item-meta">Spring: morel mushrooms<br>Summer: blueberries, raspberries, some chanterelles<br>Autumn: cranberries, raspberries, chanterelles<br>Winter: nothing. Pack provisions!</p></div>
      </div>`);
  }
  function enterBuilding(bid) {
    const def = ACM.INTERIORS[bid];
    if (!def) return;
    if (def.needsLegacy && ACM.Story.stage(ACM.Game) < 5) { toast("The house is not ready yet.", ""); return; }
    if (def.needsStage != null && (state.homeStage || 0) < def.needsStage) { toast("Your homestead isn't ready to walk into yet. Keep building!", ""); return; }
    if (!ACM.World.shopOpen(bid, state.timeMin)) {
      toast(`${def.name} is closed. It opens ${ACM.ArtWorld.fmtTime(def.open[0])} to ${ACM.ArtWorld.fmtTime(def.open[1])}.`, "bad");
      if (ACM.Audio) ACM.Audio.sfx("bad");
      return;
    }
    logEvent("enter", { b: bid });
    ACM.World.enterBuilding(bid);
  }

  // =====================================================================
  //  TREES: fell, logs, regrowth
  // =====================================================================
  function logName(type) { return (ACM.LOGS[type] || {}).name || type; }

  // ---- equipped tool = the selected hotbar slot ----
  function heldTool() { const k = state.slots[state.sel]; return k && k.indexOf("tool:") === 0 ? k.slice(5) : null; }
  function equipHint(toolId) {
    const t = (ACM.TOOLS.find((x) => x.id === toolId) || {}).name || toolId;
    const i = state.slots.indexOf("tool:" + toolId);
    return i >= 0 && i < 12 ? `Equip your ${t} first: press ${SLOT_KEYS[i]} (it's in hotbar slot ${i + 1}).` : `Equip your ${t} first: open the backpack (I), pick it and press E.`;
  }
  function requireHeld(toolId) {
    if (heldTool() === toolId) return true;
    toast(equipHint(toolId), "bad");
    if (ACM.Audio) ACM.Audio.sfx("bad");
    return false;
  }
  // Felling takes several chops: harder woods take longer, each chop costs a little energy and time.
  const CHOPS = { pine: 6, cedar: 7, birch: 7, maple: 9, oak: 10, cherry: 9, walnut: 11 };
  let lastChop = 0;
  function fellTree(tx, ty, info) {
    if (!state.ownedTools.includes("felling_axe")) { toast("You need a felling axe to cut trees.", "bad"); return; }
    if (!requireHeld("felling_axe")) return;
    const L = ACM.LOGS[info.type];
    if (!L) { toast("That tree isn't worth cutting.", "bad"); return; }
    const now = Date.now();
    if (now - lastChop < 700) return;          // one swing at a time
    const ce = Math.max(1, Math.round(2 * perkFx().fellEnergy));
    if (!needEnergy(ce)) return;
    lastChop = now;
    const kk = ty * ACM.Map.W + tx;
    if (!state.chops) state.chops = {};
    const need = CHOPS[info.type] || 7;
    const done = (state.chops[kk] || 0) + 1;
    spendTime(6, ce);
    if (done < need) {
      state.chops[kk] = done;
      if (ACM.Audio) ACM.Audio.sfx("chop");
      if (ACM.World.spawnBurst) ACM.World.spawnBurst(tx, ty, "leaves");
      if (done === 1) toast(`Chop! This ${logName(info.type).toLowerCase()} tree will take about ${need} chops. Keep swinging.`, "");
      updateHUD();
      return;
    }
    delete state.chops[kk];
    const k = ty * ACM.Map.W + tx;
    let n = L.yieldFell;
    if (info.kind === "planted") {
      state.trees = state.trees.filter((t) => t !== info.obj);
      n += 1;
    } else if (info.kind === "wild") {
      state.wild = state.wild.filter((t) => t !== info.obj);
      state.trees = state.trees.filter((t) => t !== info.obj);
    } else {
      if (!state.felled) state.felled = {};
      state.felled[k] = state.dayCount;
    }
    state.logs[info.type] = (state.logs[info.type] || 0) + n;
    state.stats.felled = (state.stats.felled || 0) + 1;
    let extra = "";
    const sid = "sapling_" + info.type;
    if (ACM.SAPLINGS.some((s) => s.id === sid) && Math.random() < 0.4) {
      state.saplingBag[sid] = (state.saplingBag[sid] || 0) + 1;
      extra = ` A ${logName(info.type).toLowerCase()} sapling was lying in the leaf litter. It's in your bag!`;
    }
    if (ACM.Audio) { ACM.Audio.sfx("chop"); setTimeout(() => ACM.Audio.sfx("chop"), 230); setTimeout(() => ACM.Audio.sfx("fell"), 520); }
    if (ACM.World.spawnBurst) ACM.World.spawnBurst(tx, ty, "leaves");
    toast(`TIMBER! +${n} ${logName(info.type)} log${n > 1 ? "s" : ""}.${extra}`, "good");
    logEvent("fell", { type: info.type, kind: info.kind });
    tutDone("fell");
    updateHUD();
    renderPlantBar();
    maybeSquirrel(tx, ty);
  }

  // A rare surprise: a giant squirrel lives in some hollow trunks. The more trees you fell in one day, the likelier it is.
  function squirrelChance(n) { return Math.min(0.4, 0.02 + 0.015 * (n - 1)); }
  function maybeSquirrel(tx, ty) {
    if (!state.feltToday || state.feltToday.day !== state.dayCount) state.feltToday = { day: state.dayCount, n: 0 };
    state.feltToday.n++;
    const n = state.feltToday.n;
    if (Math.random() >= squirrelChance(n)) return false;
    logEvent("squirrel", { n });
    setTimeout(() => {
      openModal("A GIANT SQUIRREL!", `<div style="text-align:center">
        <canvas id="sq-art" style="width:288px;height:256px;image-rendering:pixelated;max-width:100%"></canvas>
        <p><strong>The tree was hollow, and something enormous was living in it!</strong></p>
        <p class="item-meta">A squirrel the size of a dog launches out of the stump, chattering furiously. You drop your axe and run.</p>
        <div class="dialog-actions"><button class="btn-brass" id="sq-run">Run for it!</button></div></div>`);
      if (ACM.ArtCritters) ACM.ArtCritters.drawSquirrel(document.getElementById("sq-art"));
      if (ACM.Audio) ACM.Audio.sfx("bad");
      document.getElementById("sq-run").onclick = () => {
        closeModal();
        const caught = () => collapseAtMidnight({
          noLoss: true, event: "squirrel_day_end", title: "Chased home",
          html: `<p><strong>The giant squirrel chased you all the way home!</strong></p>
            <p class="item-meta">It caught up, and you hid in the workshop until dark, bruised and out of breath. The day is over. Felling lots of trees in a single day makes it more likely that you'll disturb something living in them.</p>
            <div class="dialog-actions"><button class="btn-wood" data-act="close">OK</button></div>`
        });
        if (ACM.World.startChase && tx != null) { toast("RUN! The squirrel is right behind you!", "bad"); ACM.World.startChase(tx, ty, caught); }
        else caught();
      };
    }, 700);
    return true;
  }

  function handleTileAction(tx, ty) {
    const fg = ACM.Map.forageIndex.get(ty * ACM.Map.W + tx);
    if (fg && !ACM.World.treeInfoAt(tx, ty) && ACM.Forage.available(state, fg)) { harvestForage(fg.i); return; }
    const info = ACM.World.treeInfoAt(tx, ty);
    if (info) {
      if (info.stage >= 2) fellTree(tx, ty, info);
      else if (heldTool() === "felling_axe") {
        // young trees can't be felled, but they can be dug up again (so nobody gets boxed in by their own saplings)
        if (info.kind === "planted") {
          state.trees = state.trees.filter((t) => t !== info.obj);
          const sid = info.obj.saplingId;
          if (sid) state.saplingBag[sid] = (state.saplingBag[sid] || 0) + 1;
          toast(`You dug up the young ${logName(info.type).toLowerCase()}. The sapling is back in your bag.`, "good");
        } else {
          state.wild = state.wild.filter((t) => t !== info.obj);
          toast(`You pulled up a wild ${logName(info.type).toLowerCase()} seedling.`, "good");
        }
        spendTime(3, 1);
        if (ACM.Audio) ACM.Audio.sfx("plant");
        renderPlantBar();
        updateHUD();
      } else {
        const o = info.obj;
        toast(`${logName(info.type)} — ${info.stage === 0 ? "just a seedling" : "young sapling"} (${o.daysGrown}/${o.growDays} days). Check back later!`);
      }
      return;
    }
    const sid = selectedSaplingId();
    if (!sid) return;
    const res = plantCheck(tx, ty);
    if (!res.ok) { toast(res.reason, "bad"); return; }
    if (!needEnergy(2)) return;
    const sap = ACM.SAPLINGS.find((s) => s.id === sid);
    state.saplingBag[sid]--;
    state.trees.push(makeTree(sap, tx, ty, Math.min(perkFx().growBonus, sap.growDays - 1)));
    if (state.saplingBag[sid] <= 0) state.selectedSapling = availableSaplingIds()[0] || null;
    state.stats.planted = (state.stats.planted || 0) + 1;
    spendTime(5, 2);
    if (ACM.Audio) ACM.Audio.sfx("plant");
    toast(`Planted ${sap.species}! It will be ready in ${sap.growDays} days.`, "good");
    logEvent("plant", { sap: sid });
    tutDone("plant");
    renderPlantBar();
    updateHUD();
  }

  // Wild trees spread slowly from existing trees, only on the forest's own tiles, and never past the original forest size.
  function growForest() {
    const M = ACM.Map, W = M.W;
    if (!state.wild) state.wild = [];
    if (!state.felled) state.felled = {};
    state.wild.forEach((t) => {
      if (t.stage < 2) {
        t.daysGrown = (t.daysGrown || 0) + 1;
        t.stage = t.daysGrown >= t.growDays ? 2 : t.daysGrown >= 1 ? 1 : 0;
      }
    });
    const cap = M.natureTrees.length;
    let alive = cap - Object.keys(state.felled).length + state.wild.length;
    const pt = ACM.World.getPlayerTile();
    const wildAt = new Map();
    state.wild.forEach((t) => wildAt.set(t.ty * W + t.tx, t));
    let seeded = 0;
    for (let a = 0; a < 500 && seeded < 5 && alive < cap; a++) {
      const i = M.regrowTiles[Math.floor(Math.random() * M.regrowTiles.length)];
      const tx = i % W, ty = Math.floor(i / W);
      if (state.felled[i] != null && state.dayCount - state.felled[i] < 3) continue;
      if (ACM.World.isBlockedTile(tx, ty) || wildAt.has(i)) continue;
      if (Math.abs(tx - pt.tx) <= 1 && Math.abs(ty - pt.ty) <= 1) continue;
      let near = null;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) {
        const j = (ty + dy) * W + (tx + dx);
        if (!M.inb(tx + dx, ty + dy)) continue;
        const w = wildAt.get(j);
        if (w) near = w.type;
        else if (M.natureIndex.has(j) && state.felled[j] == null) near = M.natureIndex.get(j).type;
      }
      if (!near) continue;
      if (ACM.World.wouldTrap && ACM.World.wouldTrap(tx, ty)) continue;   // never let the forest wall the player in
      const nt = { tx, ty, type: near, stage: 0, daysGrown: 0, growDays: 4, wild: true };
      state.wild.push(nt);
      wildAt.set(i, nt);
      seeded++; alive++;
    }
  }

  // =====================================================================
  //  LUMBER RACK: sell or mill logs, sell boards
  // =====================================================================
  function lumberDef(id) { return ACM.LUMBER.find((x) => x.id === id); }
  function missingMillTools(L) { return L.needs.filter((t) => !state.ownedTools.includes(t)); }
  function toolName(id) { const t = ACM.TOOLS.find((x) => x.id === id); return t ? t.name : id; }

  // The sawmill only needs so much wood each day: the first 12 items sold are paid in full, the rest at a quarter.
  const MARKET_FULL = 12;
  function marketValue(unit, n) {
    if (!state.market || state.market.day !== state.dayCount) state.market = { day: state.dayCount, n: 0 };
    let tot = 0;
    for (let i = 0; i < n; i++) tot += Math.max(1, Math.round(unit * (state.market.n + i < MARKET_FULL ? 1 : 0.25)));
    return tot;
  }
  function marketNote() {
    if (!state.market || state.market.day !== state.dayCount) return "";
    const left = Math.max(0, MARKET_FULL - state.market.n);
    return left > 0 ? `Routledge will buy ${left} more item${left === 1 ? "" : "s"} at full price today.` : "Routledge has all the wood he needs today. Anything more sells at a quarter price. Try again tomorrow.";
  }
  function openLumberRack(note) {
    const logRows = Object.entries(state.logs || {}).filter(([, n]) => n > 0).map(([type, n]) => {
      const L = ACM.LOGS[type];
      const ld = lumberDef(L.lumberId);
      const miss = missingMillTools(L);
      return `<tr><td><strong>${L.name}</strong> × ${n}</td>
        <td><button class="btn-brass btn-sm" data-act="log-sell" data-type="${type}" data-n="1">Sell 1 ($${Math.round(L.sell * perkFx().sellMult)})</button>
            <button class="btn-brass btn-sm" data-act="log-sell" data-type="${type}" data-n="${n}">Sell all ($${Math.round(L.sell * perkFx().sellMult) * n})</button></td>
        <td>${miss.length ? `<span class="tag">Needs ${miss.map(toolName).join(", ")}</span>` : `<button class="btn-green btn-sm" data-act="log-mill" data-type="${type}">Mill it myself (+${ACM.LOG_BOARDS} bd ft)</button>`}
            <button class="btn-wood btn-sm" data-act="log-mill-paid" data-type="${type}">Routledge mills (${perkFx().millFree ? "free" : "$" + ACM.LOG_MILL_FEE})</button></td></tr>`;
    }).join("");
    const boardRows = Object.entries(state.lumberStock || {}).filter(([, n]) => n > 0).map(([id, n]) => {
      const l = lumberDef(id);
      if (!l) return "";
      const p = Math.max(1, Math.round(l.pricePerUnit * ACM.LUMBER_SELL_RATIO));
      return `<tr><td><strong>${l.name}</strong> × ${n} ${l.unitLabel}</td><td><button class="btn-brass btn-sm" data-act="board-sell" data-id="${id}">Sell 1 ($${p})</button></td></tr>`;
    }).join("");
    openModal("Lumber Rack & Log Pile", `
      ${note ? `<p class="tag" style="background:#bbf7d0;margin-bottom:8px;">${escapeHtml(note)}</p>` : ""}
      <p class="item-meta" style="margin-bottom:6px">${marketNote() || "Routledge will buy 12 items at full price each day."}</p>
      <div class="tut-box"><strong>How wood works:</strong> Fell trees for <em>logs</em>. Sell logs for quick cash, or <em>mill</em> them into boards you can use in commissions (save the money you'd spend on lumber). Milling yourself is free but takes time and energy, and needs the right machines. Routledge will do it for a small fee.</div>
      <h3>Logs</h3>
      ${logRows ? `<table class="shop-table"><tbody>${logRows}</tbody></table>` : "<p class='item-meta'>No logs. Click a tree with your axe to fell it.</p>"}
      <h3 style="margin-top:12px;">Boards on the rack</h3>
      ${boardRows ? `<table class="shop-table"><tbody>${boardRows}</tbody></table><p class="item-meta">Boards sell for ${Math.round(ACM.LUMBER_SELL_RATIO * 100)}% of their buying price. Keep what you need for commissions!</p>` : "<p class='item-meta'>The rack is empty.</p>"}
    `);
  }

  function rackAction(el) {
    const act = el.dataset.act, type = el.dataset.type;
    const L = type ? ACM.LOGS[type] : null;
    if (act === "log-sell") {
      const n = Math.min(Number(el.dataset.n) || 1, state.logs[type] || 0);
      if (n <= 0) return;
      state.logs[type] -= n;
      const sellVal = marketValue(L.sell * perkFx().sellMult, n);
      state.market.n += n;
      state.cash += sellVal;
      if (ACM.Audio) ACM.Audio.sfx("coin");
      logEvent("sell_log", { type, n, val: sellVal });
      tutDone("rack");
      updateHUD();
      openLumberRack(`Sold ${n} ${L.name} log${n > 1 ? "s" : ""} for $${sellVal}.`);
    } else if (act === "log-mill" || act === "log-mill-paid") {
      if ((state.logs[type] || 0) < 1) return;
      const paid = act === "log-mill-paid";
      if (paid) {
        const fee = perkFx().millFree ? 0 : ACM.LOG_MILL_FEE;
        if (state.cash < fee) { toast("Not enough cash for Routledge's fee.", "bad"); return; }
        state.cash -= fee;
      } else {
        if (missingMillTools(L).length) { toast("You don't own the machines for that yet.", "bad"); return; }
        if (!needEnergy(2)) return;
        spendTime(15, 2);
      }
      state.logs[type]--;
      state.lumberStock[L.lumberId] = (state.lumberStock[L.lumberId] || 0) + ACM.LOG_BOARDS;
      if (ACM.Audio) ACM.Audio.sfx("good");
      logEvent("mill", { type, paid });
      tutDone("rack");
      updateHUD();
      openLumberRack(`Milled 1 ${L.name} log into ${ACM.LOG_BOARDS} ${lumberDef(L.lumberId).unitLabel} of ${lumberDef(L.lumberId).name}.`);
    } else if (act === "board-sell") {
      const l = lumberDef(el.dataset.id);
      if (!l || (state.lumberStock[l.id] || 0) < 1) return;
      state.lumberStock[l.id]--;
      const p = marketValue(l.pricePerUnit * ACM.LUMBER_SELL_RATIO, 1);
      state.market.n += 1;
      state.cash += p;
      if (ACM.Audio) ACM.Audio.sfx("coin");
      logEvent("sell_board", { id: l.id });
      updateHUD();
      openLumberRack(`Sold 1 ${l.unitLabel} of ${l.name} for $${p}.`);
    }
  }

  // =====================================================================
  //  COMMISSIONS: take on several, work on one at a time
  // =====================================================================
  const MAX_JOBS = 4;
  function freshProgress() {
    return { lumberAssigned: null, cutIndex: 0, completedTools: [], nailChecked: false, squared: false, piloted: false, fastened: false, mistakes: 0 };
  }
  function projectById(id) { return (ACM.PROJECTS || []).find((p) => p.id === id) || null; }

  function switchActive(pid) {
    if (state.activeProjectId && state.activeProjectId !== pid) state.jobStash[state.activeProjectId] = state.jobProgress;
    state.activeProjectId = pid;
    if (pid) { state.jobProgress = state.jobStash[pid] || freshProgress(); delete state.jobStash[pid]; }
    else state.jobProgress = freshProgress();
  }

  function acceptJob(pid) {
    if (state.accepted.includes(pid)) return false;
    if (state.accepted.length >= MAX_JOBS) { toast(`You can carry ${MAX_JOBS} commissions at a time. Finish or drop one first.`, "bad"); return false; }
    state.accepted.push(pid);
    if (!state.activeProjectId) switchActive(pid);
    logEvent("accept", { pid });
    if (ACM.Audio) ACM.Audio.sfx("good");
    updateHUD();
    return true;
  }

  function dropJob(pid) {
    const job = projectById(pid);
    const prog = pid === state.activeProjectId ? state.jobProgress : state.jobStash[pid];
    if (job && prog && prog.lumberAssigned) state.lumberStock[prog.lumberAssigned] = (state.lumberStock[prog.lumberAssigned] || 0) + job.lumberReq.units;
    state.accepted = state.accepted.filter((x) => x !== pid);
    delete state.jobStash[pid];
    if (pid === state.activeProjectId) { state.activeProjectId = null; switchActive(state.accepted[0] || null); }
    logEvent("drop", { pid });
    updateHUD();
  }

  function openTownBoard() {
    const tierOK = Math.max(1, Math.floor(state.stars + 0.35));
    const mine = state.accepted.map(projectById).filter(Boolean);
    const open = ACM.PROJECTS.filter((p) => !p.heritage && !p.design && p.tier <= tierOK && !state.accepted.includes(p.id) && !pendingProduct(p.id));
    const card = (p, mineFlag) => {
      const isActive = state.activeProjectId === p.id;
      const doneCount = state.completedProjectIds.filter((id) => id === p.id).length;
      return `<div class="item-card ${isActive ? "owned job-slot" : ""}">
        <div>
          <div class="item-title">${p.title}</div>
          <div class="item-meta">Client: ${p.client} | Pays: <strong>$${doneCount && !p.design ? Math.max(1, Math.round(p.basePay * Math.max(0.1, Math.pow(0.5, doneCount)))) + " (repeat order)" : p.basePay}</strong> | +${p.starGain}★ | Tier ${p.tier}</div>
          <p class="item-meta" style="margin-top:4px;">${p.desc}</p>
          <p class="item-meta" style="margin-top:4px;"><strong>Stock:</strong> ${p.lumberReq.units} units (${p.lumberReq.allowedIds.map((id) => (lumberDef(id) || {}).name || id).join(" / ")}, or boards you milled yourself)</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; gap:6px; flex-wrap:wrap;">
          ${doneCount > 0 ? `<span class="tag">Built ${doneCount}×</span>` : `<span></span>`}
          ${mineFlag
            ? `<span>${isActive ? `<span class="tag" style="background:#bbf7d0;">Working on this</span>` : `<button class="btn-green btn-sm" data-act="job-switch" data-pid="${p.id}">Work on this</button>`}
               <button class="btn-wood btn-sm" data-act="job-drop" data-pid="${p.id}">Drop</button></span>`
            : `<button class="btn-brass btn-sm" data-act="job-accept" data-pid="${p.id}">Accept</button>`}
        </div></div>`;
    };
    const hoBoard = handOverButtons("board");
    openModal("Alder Creek Commission Board", `
      ${hoBoard ? `<div class="item-card owned"><div class="item-title">Ready to hand in</div><p class="item-meta">The Town Hall clerk will take finished pieces for the Council, the Historical Society and the Centennial Committee.</p><div class="dialog-actions" style="flex-wrap:wrap;">${hoBoard}</div></div>` : ""}
      <div class="npc-banner"><div><strong>Village Commission Board</strong>
        <p class="item-meta">Take on up to ${MAX_JOBS} commissions at once. You build one at a time: pick which one you're working on at the Layout Bench. Cash buys tools and wood. Rating (★) unlocks higher-tier, better-paid work.</p></div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <button class="btn-wood btn-sm" data-act="sleep">Sleep until morning</button>
          <button class="btn-wood btn-sm" data-act="howto">How it works</button></div>
      </div>
      <h3>Your commissions (${mine.length}/${MAX_JOBS})</h3>
      <div class="card-grid">${mine.map((p) => card(p, true)).join("") || "<p class='item-meta'>None yet. Pick one below.</p>"}</div>
      <h3 style="margin-top:12px;">Available now (★${tierOK} or below)</h3>
      <div class="card-grid">${open.map((p) => card(p, false)).join("") || "<p class='item-meta'>Nothing new. Raise your rating to unlock more.</p>"}</div>
    `);
  }

  // =====================================================================
  //  NPC DIALOGUE, GIFTS, FRIENDSHIP
  // =====================================================================
  const MEALS = { clara: { name: "Bowl of chowder", cost: 6, energy: 45 }, mateo: { name: "Fresh bread & cheese", cost: 3, energy: 20 } };
  const INTROS = {
    seymour: `Ah, there you are. I'm Seymour. I sold your grandfather every chisel he owned. Now, listen. Everything in Alder Creek runs on three things. <strong>Cash</strong> buys tools, boards and saplings. <strong>Rating (★)</strong> is your reputation: careful work raises it, and a higher rating unlocks bigger commissions that pay better. And <strong>energy</strong> runs out as you work, so eat and sleep. Start with that birdhouse in your workshop. Careless mistakes mean lower pay and less rating, so take your time.`,
    routledge: `Routledge, sawmill and nursery. If you've got an axe, you can fell any tree in the valley for logs. Sell the logs to me, or mill them into boards for your commissions. Plant a sapling for every tree you take and the forest will thank you.`,
    clara: `Welcome to the Harbor Café! If your energy is running low, a hot bowl of chowder will set you right. I keep the best seat for woodworkers.`
  };

  function relOf(id) {
    if (!state.rel[id]) state.rel[id] = { pts: 0, talkDay: -1, giftDay: -1, met: false, seen: {} };
    return state.rel[id];
  }
  function npcById(id) { return (ACM.NPCS || []).find((n) => n.id === id); }
  function heartsHtml(h) { let s = ""; for (let i = 0; i < 10; i++) s += i < h ? "♥" : `<span class="empty">♥</span>`; return `<span class="hearts">${s}</span>`; }

  function addFriend(id, pts) {
    const r = relOf(id);
    const before = ACM.NPC_HELPERS.heartsFor(r.pts);
    r.pts = Math.max(0, Math.min(1000, r.pts + pts));
    const after = ACM.NPC_HELPERS.heartsFor(r.pts);
    if (after > before) { if (ACM.Audio) ACM.Audio.sfx("heart"); toast(`${npcById(id).name} is warming up to you! (${after}♥)`, "good");
      (ACM.PERKS[id] || []).filter((p) => p.h === after).forEach((p) => { toast(`Reward unlocked: ${p.name}! ${p.desc}`, "good"); logEvent("perk", { npc: id, perk: p.name }); });
      updateHUD(); }
  }

  function itemName(key) {
    if (key.startsWith("log_")) return logName(key.slice(4)) + " log";
    if (ACM.FOODS[key]) return ACM.FOODS[key].name;
    const l = lumberDef(key); if (l) return l.name;
    const s = ACM.SAPLINGS.find((x) => x.id === key); if (s) return s.species + " sapling";
    return key;
  }
  function giftables() {
    const out = [];
    Object.entries(state.lumberStock).forEach(([id, n]) => n > 0 && out.push([id, n]));
    Object.entries(state.logs).forEach(([t, n]) => n > 0 && out.push(["log_" + t, n]));
    Object.entries(state.saplingBag).forEach(([id, n]) => n > 0 && out.push([id, n]));
    Object.keys(state.pantry).forEach((id) => foodCount(id) > 0 && ACM.FOODS[id] && out.push([id, foodCount(id)]));
    return out;
  }
  function takeItem(key) {
    if (ACM.FOODS[key]) takeFood(key);
    else if (key.startsWith("log_")) state.logs[key.slice(4)]--;
    else if (key.startsWith("sapling_")) { state.saplingBag[key]--; if (state.saplingBag[key] <= 0 && state.selectedSapling === key) state.selectedSapling = availableSaplingIds()[0] || null; renderPlantBar(); }
    else state.lumberStock[key]--;
  }

  function pickLine(npc, r) {
    const h = ACM.NPC_HELPERS.heartsFor(r.pts);
    // lines about something the player has (or hasn't yet) repaired come first, once per state
    const fx = (npc.fixLines || []).concat((ACM.NPC_FIXLINES || {})[npc.id] || []);
    for (const f of fx) {
      const done = ACM.Repairs && ACM.Repairs.fixed(f.id), key = "fx_" + f.id + (done ? "_fixed" : "_broken");
      if (!r.seen[key]) { r.seen[key] = 1; return done ? f.fixed : f.broken; }
    }
    const pools = [["talk", npc.talk]];
    if (h >= 3) pools.push(["friend", npc.friend]);
    if (h >= 6) pools.push(["close", npc.close]);
    if (h >= 8) pools.push(["deep", npc.deep]);
    for (let p = pools.length - 1; p >= 0; p--) {
      const [cat, arr] = pools[p];
      const unseen = arr.map((_, i) => i).filter((i) => !r.seen[cat + i]);
      if (unseen.length) { const i = unseen[0]; r.seen[cat + i] = 1; return arr[i]; }
    }
    const all = pools.flatMap(([, a]) => a);
    return all[Math.floor(Math.random() * all.length)];
  }

  function npcJobs(npc) {
    const tierOK = Math.max(1, Math.floor(state.stars + 0.35));
    return ACM.PROJECTS.filter((p) => !p.heritage && !p.design && p.client.indexOf(npc.clientKey) >= 0 && p.tier <= tierOK && !state.accepted.includes(p.id) && !pendingProduct(p.id));
  }

  function openNpcDialog(id, speech, view) {
    const npc = npcById(id);
    if (!npc) return;
    const r = relOf(id);
    const h = ACM.NPC_HELPERS.heartsFor(r.pts);
    if (speech == null) {
      if (!r.met) {
        r.met = true;
        speech = INTROS[id] || `Hello! I'm ${npc.name}, the ${npc.role.toLowerCase()}. You must be the new owner of the old Alder Creek workshop.`;
        addFriend(id, 10);
        logEvent("meet", { npc: id });
        if (id === "seymour") tutDone("meet_seymour");
        if (id === "clara") tutDone("meet_clara");
      } else speech = r.talkDay === state.dayCount ? "Good to see you again. Anything I can do for you?" : "Hello again, " + escapeHtml(state.shopName) + ".";
    }
    let body = `<div class="npc-dialog"><div class="npc-portrait"><canvas id="npc-portrait" width="84" height="110"></canvas></div>
      <div style="flex:1;"><div><strong>${escapeHtml(npc.name)}</strong> <span class="item-meta">${escapeHtml(npc.role)}</span></div>
      <div>${heartsHtml(h)}</div><div class="speech" style="margin-top:6px;">${speech}</div></div></div>`;
    if (view === "gift") {
      const items = giftables();
      body += `<h3 style="margin-top:10px;">Choose a gift for ${escapeHtml(npc.name)}</h3><div class="dialog-actions">` +
        (items.length ? items.map(([k, n]) => `<button class="btn-brass btn-sm" data-act="gift" data-npc="${id}" data-item="${k}">${escapeHtml(itemName(k))} ×${n}</button>`).join("") : "<span class='item-meta'>You have nothing to give yet.</span>") +
        `</div><div class="dialog-actions"><button class="btn-wood btn-sm" data-act="npc" data-npc="${id}" data-view="">Back</button></div>`;
    } else if (view === "jobs") {
      const jobs = npcJobs(npc);
      body += `<h3 style="margin-top:10px;">${escapeHtml(npc.name)} could use some help</h3><div class="dialog-actions" style="flex-direction:column;align-items:stretch;">` +
        (jobs.length ? jobs.map((p) => `<div class="item-card"><div class="item-title">${p.title}</div><div class="item-meta">Pays $${p.basePay} · +${p.starGain}★</div><p class="item-meta">${p.desc}</p><button class="btn-brass btn-sm" data-act="job-accept-npc" data-pid="${p.id}" data-npc="${id}">Accept commission</button></div>`).join("") : "<span class='item-meta'>Nothing right now. Check back as your rating grows.</span>") +
        `</div><div class="dialog-actions"><button class="btn-wood btn-sm" data-act="npc" data-npc="${id}" data-view="">Back</button></div>`;
    } else {
      const meal = MEALS[id];
      const jobs = npcJobs(npc);
      const ho = handOverButtons(id);
      if (ho) body += `<div class="dialog-actions" style="flex-wrap:wrap;">${ho}</div>`;
      body += `<div class="dialog-actions">
        <button class="btn-green btn-sm" data-act="chat" data-npc="${id}">${r.talkDay === state.dayCount ? "Chat again" : "Chat (+friendship)"}</button>
        <button class="btn-brass btn-sm" data-act="npc" data-npc="${id}" data-view="gift">Give a gift</button>
        ${jobs.length ? `<button class="btn-brass btn-sm" data-act="npc" data-npc="${id}" data-view="jobs">Commissions (${jobs.length})</button>` : ""}
        ${id === "clara" ? `<button class="btn-brass btn-sm" data-act="provisions">Pantry food that keeps</button>` : ""}
        ${meal ? `<button class="btn-green btn-sm" data-act="meal" data-npc="${id}">${meal.name} ($${meal.cost}, +${meal.energy}⚡)</button>` : ""}
        ${id === "seymour" ? `<button class="btn-wood btn-sm" data-act="shop-tools">Browse tools</button>` : ""}
        ${id === "routledge" ? `<button class="btn-wood btn-sm" data-act="shop-mill">Saplings & lumber</button><button class="btn-wood btn-sm" data-act="rack">Sell / mill logs</button>` : ""}
        <button class="btn-wood btn-sm" data-act="close">Goodbye</button></div>`;
    }
    const perks = (ACM.PERKS[id] || []).map((p) => `<div class="item-meta" style="margin-top:3px;${h >= p.h ? "" : "opacity:.6;"}">${h >= p.h ? "✅" : "🔒 " + p.h + "♥"} <strong>${p.name}</strong>: ${p.desc}</div>`).join("");
    if (!view) body += `<div class="tut-box" style="margin-top:10px;"><strong>Friendship rewards</strong>${perks}</div>`;
    openModal(npc.name, body);
    const pc = document.getElementById("npc-portrait");
    if (pc && ACM.ArtSprites) {
      const c = pc.getContext("2d");
      c.fillStyle = "#cfe0b0"; c.fillRect(0, 0, 84, 110);
      c.fillStyle = "#8aa86a"; c.fillRect(0, 84, 84, 26);
      ACM.ArtSprites.drawCharacter(c, 42, 80, npc.appearance, 3.4, 0, "down", npc.gear || {});
    }
    if (ACM.Audio) ACM.Audio.sfx("talk");
  }

  function npcAction(el) {
    const act = el.dataset.act, id = el.dataset.npc;
    if (act === "npc") openNpcDialog(id, "What can I do for you?", el.dataset.view || "");
    else if (act === "chat") {
      const npc = npcById(id), r = relOf(id);
      let gain = 0;
      if (r.talkDay !== state.dayCount) { gain = 25; r.talkDay = state.dayCount; addFriend(id, 25); logEvent("talk", { npc: id }); }
      spendTime(5, 0);
      openNpcDialog(id, pickLine(npc, r) + (gain ? "" : ""), "");
    } else if (act === "gift") {
      const npc = npcById(id), r = relOf(id), key = el.dataset.item;
      if (r.giftDay === state.dayCount) { openNpcDialog(id, "You've already been generous today. Thank you!", ""); return; }
      takeItem(key);
      r.giftDay = state.dayCount;
      const lvl = ACM.NPC_HELPERS.likeLevel(npc, key);
      const pts = { love: 80, like: 45, neutral: 20, dislike: -20 }[lvl];
      const say = { love: "This is wonderful. Exactly what I'd have wished for!", like: "Oh, that's lovely. Thank you!", neutral: "How thoughtful. Thank you.", dislike: "Hm. Well... it's the thought that counts." }[lvl];
      addFriend(id, pts);
      logEvent("gift", { npc: id, item: key, lvl });
      if (ACM.Audio) ACM.Audio.sfx(lvl === "dislike" ? "bad" : "heart");
      openNpcDialog(id, say, "");
    } else if (act === "meal") {
      const m = MEALS[id];
      if (eat(m.cost, m.energy, m.name)) openNpcDialog(id, "Enjoy! Eat well, work well.", "");
    } else if (act === "job-accept-npc") {
      if (acceptJob(el.dataset.pid)) toast("Commission accepted! Open the Layout Bench in your workshop to work on it.", "good");
      openNpcDialog(id, "Wonderful. I'll be here when it's done.", "jobs");
    }
  }

  function npcBubble(id) {
    const r = relOf(id);
    if (state.tut && state.tut.target === id) return "job";
    if (r.talkDay === state.dayCount) return null;
    return npcJobs(npcById(id)).length ? "job" : "talk";
  }

  // =====================================================================
  //  TUTORIAL / OBJECTIVES
  // =====================================================================
  const TUT = [
    { id: "meet_seymour", npc: "seymour", text: "Meet <strong>Seymour</strong>: walk up to the Hardware Shop door (it is open 7:30 AM to 6 PM) and press E to go inside. Then talk to him." },
    { id: "first_delivery", text: "Build your first commission: <strong>Blueprint Desk → Layout Bench → Assembly Table</strong> in your workshop, then take the finished piece to the person who asked for it and hand it over for cash and ★." },
    { id: "fell", text: "<strong>Equip your felling axe</strong> (select it in the hotbar), then click a tree again and again (it takes several chops) to <strong>fell</strong> it. Mind your energy (⚡ bar, bottom right)." },
    { id: "rack", text: "Sell or mill a log at the <strong>Lumber Rack</strong> beside your workshop." },
    { id: "plant", text: "<strong>Plant a sapling</strong>: pick one in the green bar, then click open grass." },
    { id: "forage", text: "<strong>Forage</strong>: pick berries or mushrooms in the woods (in season) and press <strong>F</strong> to eat. Foraged food spoils in a few days." },
    { id: "meet_clara", npc: "clara", text: "Visit <strong>Clara</strong> inside the Harbor Café. Buy pantry food that keeps, or a hot meal." },
    { id: "tier2", text: "Reach <strong>★ 1.65</strong> to unlock Tier 2 commissions and better pay." }
  ];
  function tutDone(id) {
    if (!state.tut) state.tut = { done: [] };
    if (state.tut.done.includes(id)) return;
    state.tut.done.push(id);
    logEvent("tut", { id });
    if (ACM.Audio) ACM.Audio.sfx("good");
    updateObjective();
  }
  function updateObjective() {
    const el = document.getElementById("objective-bar");
    if (!el || !state.tut) return;
    if (state.stars >= 1.65 && !state.tut.done.includes("tier2")) state.tut.done.push("tier2");
    const step = TUT.find((s) => !state.tut.done.includes(s.id) && !(s.id === "forage" && state.season === "Winter"));
    state.tut.target = step && step.npc ? step.npc : null;
    el.classList.remove("hidden");
    if (step) el.innerHTML = `<strong>Next:</strong> ${step.text}`;
    else {
      const j = getActiveProject();
      const pend = (state.products || [])[0];
      const so = !j && ACM.Story && ACM.Story.objective(ACM.Game);
      if (pend && !j) { const pj = projectById(pend.pid); if (pj) { el.innerHTML = `<strong>Next:</strong> Hand over your ${escapeHtml(pj.title)}: ${escapeHtml(targetText(pj))}`; return; } }
      el.innerHTML = so ? `<strong>Next:</strong> ${so}` : j ? `<strong>Working on:</strong> ${escapeHtml(j.title)} (${escapeHtml(j.client)})` : `<strong>Next:</strong> Pick a commission at the Town Board, then talk with neighbours to build friendships.`;
    }
  }

  /** Where should the player go next? Mirrors the objective bar. Returns { npc | station | bld | tree } or null. */
  function goalTarget() {
    if (state.guide === false || !state.tut) return null;
    const done = state.tut.done || [];
    const step = TUT.find((s) => !done.includes(s.id) && !(s.id === "forage" && state.season === "Winter"));
    const j = getActiveProject(), pend = (state.products || [])[0];
    const clientNpc = (pj) => { const n = ACM.NPCS.find((x) => pj && pj.client && pj.client.indexOf(x.clientKey) === 0); return n ? { npc: n.id } : null; };
    const jobStation = () => {
      const p = state.jobProgress || {};
      return { station: (!p.lumberAssigned || (j.cuts && p.cutIndex < j.cuts.length)) ? "layout_bench" : "assembly_table" };
    };
    if (step) {
      if (step.id === "meet_seymour") return { npc: "seymour" };
      if (step.id === "meet_clara") return { npc: "clara" };
      if (step.id === "fell") return { tree: true };
      if (step.id === "rack") return { station: "lumber_rack" };
      if (step.id === "first_delivery") {
        if (pend && !j) return clientNpc(projectById(pend.pid)) || { station: "town_board" };
        if (j) return jobStation();
        return { station: "town_board" };
      }
      return null;
    }
    if (pend && !j) return clientNpc(projectById(pend.pid)) || { station: "town_board" };
    if (j) return jobStation();
    const so = ACM.Story && ACM.Story.objective(ACM.Game);
    if (so) return { bld: "legacy" };
    return { station: "town_board" };
  }

  function openHowItWorks(intro) {
    openModal(intro ? "Welcome to Alder Creek" : "How Alder Creek works", `
      ${intro ? `<p style="line-height:1.55;">Your grandparents' house burned down years ago, but their workshop still stands. The village still remembers their craftsmanship. Rebuild the workshop's name one careful commission at a time, and maybe, one day, restore the old house and its kitchen. They say it still has a friendly visitor...</p>` : ""}
      <div class="tut-box">
        <div class="tut-row"><span class="tut-ico">💰</span><div><strong>Cash</strong> buys tools, boards and saplings, and pays for repairs. Earn it by delivering commissions, or by selling logs.</div></div>
        <div class="tut-row"><span class="tut-ico">★</span><div><strong>Rating</strong> is your reputation. Good work raises it. Higher rating unlocks harder commissions that pay much more. Mistakes cost you pay and rating.</div></div>
        <div class="tut-row"><span class="tut-ico">⚡</span><div><strong>Energy &amp; time.</strong> Every cut, swing and conversation takes a little time and energy. Eat at the café, sleep at night (the day ends at midnight).</div></div>
        <div class="tut-row"><span class="tut-ico">🌲</span><div><strong>Trees.</strong> Fell any tree for logs, then sell or mill them. Plant saplings to keep the forest healthy. Wild trees also slowly regrow.</div></div>
        <div class="tut-row"><span class="tut-ico">💬</span><div><strong>Neighbours.</strong> Click people to chat, give gifts and earn ♥. Friends offer commissions and tell you their stories.</div></div>
      </div>
      <p class="item-meta">Your next goal always shows in the bar under the map. Sound can be switched with the 🔊 button.</p>
      <div class="dialog-actions"><button class="btn-green" data-act="close">${intro ? "Let's get started" : "Got it"}</button></div>`);
  }

  // =====================================================================
  //  BACKPACK + HOTBAR (slots hold item keys: tool:, sapling:, food:, log:, board:)
  // =====================================================================
  const SLOT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];
  let hoverKey = null, invCur = 0, invHeld = null, invTab = "items";

  function invItems() {
    const out = new Map();
    (state.ownedTools || []).forEach((id) => {
      const t = ACM.TOOLS.find((x) => x.id === id);
      if (!t) return;
      const dur = (state.toolDurability || {})[id];
      out.set("tool:" + id, { key: "tool:" + id, name: t.name, qty: 1, desc: t.desc, extra: t.maxDurability < 500 && dur != null ? `Blade condition ${dur}/${t.maxDurability}` : "" });
    });
    (ACM.SAPLINGS || []).forEach((s) => {
      const n = state.saplingBag[s.id] || 0;
      if (n > 0) out.set("sapling:" + s.id, { key: "sapling:" + s.id, name: s.species + " sapling", qty: n, desc: `${s.desc} Matures in ${s.growDays} days. Select it, then click open grass to plant.` });
    });
    Object.keys(state.pantry || {}).forEach((id) => {
      const f = ACM.FOODS[id], n = foodCount(id);
      if (f && n > 0) out.set("food:" + id, { key: "food:" + id, name: f.name, qty: n, desc: `Restores ${f.energy} energy. ` + (f.shelf == null ? "Keeps forever." : `Spoils ${f.shelf} days after picking.`), food: id });
    });
    Object.entries(state.logs || {}).forEach(([t, n]) => {
      const L = ACM.LOGS[t];
      if (L && n > 0) out.set("log:" + t, { key: "log:" + t, name: L.name + " log", qty: n, desc: `Sell for $${L.sell}, or mill into ${ACM.LOG_BOARDS} bd ft of ${(lumberDef(L.lumberId) || {}).name || "lumber"} at the Lumber Rack.` });
    });
    Object.entries(state.lumberStock || {}).forEach(([id, n]) => {
      const l = lumberDef(id);
      if (l && n > 0) out.set("board:" + id, { key: "board:" + id, name: l.name, qty: n, desc: `${l.desc} (${l.unitLabel})` });
    });
    (state.products || []).forEach((p) => {
      const job = projectById(p.pid);
      if (!job) return;
      out.set("prod:" + p.id, { key: "prod:" + p.id, name: job.title, qty: 1, desc: `Your finished work (${p.quality.name}). ${targetText(job)}`, extra: "For " + deliveryTarget(job).label });
    });
    return out;
  }

  function reconcileSlots() {
    const items = invItems();
    if (!Array.isArray(state.slots)) state.slots = [];
    while (state.slots.length < 36) state.slots.push(null);
    const seen = new Set();
    state.slots = state.slots.map((k) => (k && items.has(k) && !seen.has(k) && seen.add(k) ? k : null));
    items.forEach((_, k) => {
      if (seen.has(k)) return;
      let i = state.slots.indexOf(null);
      if (i < 0) { state.slots.push(...new Array(12).fill(null)); i = state.slots.length - 12; }
      state.slots[i] = k;
    });
    return items;
  }

  function makeSlot(i, items, big) {
    const key = state.slots[i];
    const it = key ? items.get(key) : null;
    const el = document.createElement("div");
    el.className = "slot" + (i === state.sel && !big ? " sel" : "") + (big && i === invCur ? " sel" : "") + (big && invHeld === i ? " held" : "");
    el.dataset.i = i;
    if (!big || i < 12) { const n = document.createElement("span"); n.className = "num"; n.textContent = i < 12 ? SLOT_KEYS[i] : ""; el.appendChild(n); }
    if (it) {
      const cv = document.createElement("canvas");
      cv.width = 32; cv.height = 32;
      cv.getContext("2d").drawImage(ACM.Icons.get(key), 0, 0);
      el.appendChild(cv);
      if (it.qty > 1) { const q = document.createElement("span"); q.className = "qty"; q.textContent = it.qty; el.appendChild(q); }
    }
    return el;
  }

  function infoText(items, key) {
    const it = key ? items.get(key) : null;
    if (!it) return "";
    return `<strong>${escapeHtml(it.name)}</strong> ×${it.qty}`;
  }

  function renderHotbar() {
    const bar = document.getElementById("hotbar");
    if (!bar) return;
    const items = reconcileSlots();
    bar.innerHTML = "";
    for (let i = 0; i < 12; i++) bar.appendChild(makeSlot(i, items, false));
    const info = document.getElementById("info-bar");
    const key = hoverKey || state.slots[state.sel];
    const it = key ? items.get(key) : null;
    info.innerHTML = it ? `${infoText(items, key)}${it.extra ? " · " + escapeHtml(it.extra) : ""} <span class="item-meta" style="color:#d9c08a;">— ${escapeHtml(String(it.desc || "").split(". ")[0].slice(0, 100))}</span>` : `<span style="color:#b9a47a;">Empty slot. Number keys 1–0, - and = pick a slot; ← → or Q or the mouse wheel cycle.</span>`;
  }
  function renderPlantBar() { renderHotbar(); }

  function selectSlot(i) {
    state.sel = ((i % 12) + 12) % 12;
    hoverKey = null;
    renderHotbar();
    if (ACM.Audio) ACM.Audio.sfx("click");
  }
  function cycleSapling() { selectSlot(state.sel + 1); }

  function useSelected() {
    const key = state.slots[state.sel];
    if (key && key.indexOf("food:") === 0) { eatFood(key.slice(5)); return; }
    quickEat();
  }

  // ---- full backpack window ----
  function openInventoryModal(tab) {
    if (tab) invTab = tab;
    const items = reconcileSlots();
    if (invTab === "stats") return openStatsTab();
    const rows = Math.ceil(state.slots.length / 12);
    const tabs = `<div class="inv-tabs"><button class="btn-brass btn-sm active" data-act="inv-tab" data-tab="items">Backpack</button><button class="btn-wood btn-sm" data-act="inv-tab" data-tab="stats">Skills &amp; stats</button><button class="btn-wood btn-sm" data-act="controls">Controls [H]</button></div>`;
    openModal(`${state.shopName}: Backpack`, `${tabs}<div class="inv-grid" id="inv-grid"></div><div class="inv-info" id="inv-info"></div>
      <p class="item-meta" style="margin-top:6px;">Arrow keys move the cursor · Enter picks up / puts down an item to rearrange · E equips a tool or eats one food item · the top row is your hotbar · Esc closes.</p>`);
    drawInvGrid(items);
  }

  function drawInvGrid(items) {
    items = items || invItems();
    const grid = document.getElementById("inv-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 0; i < state.slots.length; i++) grid.appendChild(makeSlot(i, items, true));
    const key = state.slots[invCur];
    const it = key ? items.get(key) : null;
    const held = invHeld != null ? ` <span class="tag">Holding: ${escapeHtml((items.get(state.slots[invHeld]) || {}).name || "")}. Pick a slot to swap.</span>` : "";
    document.getElementById("inv-info").innerHTML = it
      ? `<div><strong>${escapeHtml(it.name)}</strong> ×${it.qty}${held}</div><div class="item-meta" style="color:#d9c08a;margin-top:4px;">${escapeHtml(it.desc || "")}${it.extra ? " " + escapeHtml(it.extra) : ""}</div>
         <div class="dialog-actions">${it.food ? `<button class="btn-green btn-sm" data-act="eat" data-id="${it.food}">Eat one [E] (+${ACM.FOODS[it.food].energy}⚡)</button>` : ""}${key.indexOf("sapling:") === 0 || key.indexOf("tool:") === 0 ? `<button class="btn-brass btn-sm" data-act="inv-hold" data-i="${invCur}">Equip [E]</button>` : ""}</div>`
      : `<div class="item-meta" style="color:#b9a47a;">Empty slot.${held}</div>`;
  }

  function invClickSlot(i) {
    invCur = i;
    if (invHeld == null) { if (state.slots[i]) invHeld = i; }
    else if (invHeld === i) invHeld = null;
    else { const t = state.slots[i]; state.slots[i] = state.slots[invHeld]; state.slots[invHeld] = t; invHeld = null; }
    renderHotbar();
    drawInvGrid();
  }
  function equipOrUse(i) {
    const key = state.slots[i];
    if (!key) return;
    if (key.indexOf("food:") === 0) { eatFood(key.slice(5)); drawInvGrid(); return; }
    if (key.indexOf("prod:") === 0) { const it = invItems().get(key); toast(it ? `${it.name}: ${it.desc}` : "Take it to the person who asked for it.", ""); return; }
    if (key.indexOf("tool:") === 0 || key.indexOf("sapling:") === 0) {
      if (i >= 12) { const t = state.slots[state.sel]; state.slots[state.sel] = key; state.slots[i] = t; i = state.sel; }
      selectSlot(i); invHeld = null; drawInvGrid();
      const it = invItems().get(key);
      toast(`Equipped: ${it ? it.name : key}`, "good");
    }
  }
  function invMove(dx, dy) {
    const n = state.slots.length;
    let c = invCur + dx + dy * 12;
    if (dx && Math.floor(c / 12) !== Math.floor(invCur / 12)) c = invCur;
    invCur = Math.max(0, Math.min(n - 1, c));
    drawInvGrid();
  }

  function openStatsTab() {
    const perks = Object.entries(ACM.PERKS).flatMap(([id, list]) => list.filter((p) => ACM.NPC_HELPERS.heartsFor((state.rel[id] || {}).pts) >= p.h).map((p) => `<li><strong>${p.name}</strong> (${npcById(id).name}): ${p.desc}</li>`)).join("");
    openModal(`${state.shopName}: Skills & stats`, `
      <div class="inv-tabs"><button class="btn-wood btn-sm" data-act="inv-tab" data-tab="items">Backpack</button><button class="btn-brass btn-sm active" data-act="inv-tab" data-tab="stats">Skills &amp; stats</button><button class="btn-wood btn-sm" data-act="controls">Controls [H]</button></div>
      <p><strong>Title:</strong> ${escapeHtml(state.legacyTitle)} | <strong>Certified:</strong> Tier ${state.certifiedTier}★ | <strong>Homestead:</strong> Stage ${state.homeStage || 0}/5</p>
      <p><strong>Energy:</strong> ${Math.round(state.energy)}/${state.maxEnergy} | Rating ★ ${state.stars.toFixed(2)} | Cash $${Math.round(state.cash)}</p>
      <h3 style="margin-top:10px;">Friendship rewards earned</h3>
      <ul style="margin-left:18px;margin-top:4px;">${perks || "<li>None yet. Chat and give gifts to earn hearts.</li>"}</ul>
      <div class="dialog-actions"><button class="btn-brass btn-sm" data-act="report">My progress report</button><button class="btn-wood btn-sm" data-act="howto">How it works</button></div>`);
  }

  function openControls() {
    const k = (t) => `<span class="keycap">${t}</span>`;
    openModal("Controls", `<table class="ctl-table"><tbody>
      <tr><td>${k("W")}${k("A")}${k("S")}${k("D")}</td><td>Move (or click the ground to walk there; hold ${k("Shift")} to hurry)</td></tr>
      <tr><td>${k("E")}</td><td>Interact: talk, enter a door, pick forage, fell a tree, plant, use a station</td></tr>
      <tr><td>${k("1")}–${k("0")} ${k("-")} ${k("=")}</td><td>Pick a hotbar slot (the bar under the map)</td></tr>
      <tr><td>${k("←")}${k("→")} ${k("Q")} wheel</td><td>Cycle the selected hotbar slot</td></tr>
      <tr><td>${k("F")}</td><td>Eat the selected food (or a snack from your pack)</td></tr>
      <tr><td>${k("I")} ${k("Tab")}</td><td>Open the backpack: arrows move the cursor, ${k("Enter")} picks up and swaps items</td></tr>
      <tr><td>${k("Esc")}</td><td>Close any window</td></tr>
      <tr><td>${k("↑")}${k("↓")}${k("←")}${k("→")}</td><td>In menus: move between buttons and options, ${k("Enter")} chooses</td></tr>
      <tr><td>${k("G")}</td><td>Show or hide the goal arrow that points to your next objective</td></tr>
      <tr><td>${k("H")} ${k("M")}</td><td>This help · mute or unmute sound</td></tr>
    </tbody></table>
    <p class="item-meta" style="margin-top:8px">Young trees can be dug up again: click one while holding your felling axe. Full-grown trees take several chops.</p>
    <div class="dialog-actions"><button class="btn-wood btn-sm" data-act="unstuck">I'm stuck! Take me back to the workshop</button></div>`);
  }

  function openWoodlotModal() {
    const trees = (state.trees || []).filter(Boolean);
    const ready = trees.filter((t) => t.stage >= 2);
    const growing = trees.filter((t) => t.stage < 2);
    const bagList = (ACM.SAPLINGS || [])
      .filter((s) => (state.saplingBag[s.id] || 0) > 0)
      .map((s) => `<li>${escapeHtml(s.species)} × ${state.saplingBag[s.id]}</li>`)
      .join("");
    const rows = trees
      .map((t) => {
        const status = t.stage >= 2 ? `<span class="tag" style="background:#bbf7d0;">Ready (+${t.yieldUnits} bd ft)</span>` : `<span class="tag">${t.stage === 0 ? "Seedling" : "Young"} (${t.daysGrown}/${t.growDays} days)</span>`;
        return `<tr><td>${escapeHtml(t.species)}</td><td>${status}</td></tr>`;
      })
      .join("");

    openModal(
      "Forestry Shed — Your Woodlot",
      `
      <div class="npc-banner">
        <div>
          <strong>Alder Creek Woodlot</strong>
          <p class="item-meta">Trees can be planted on <em>any</em> open grass in town — not just here. Pick a sapling in the green bar under the map, then click a grass tile (or stand next to it and press E). Mature trees sparkle; click one or face it and press E to fell it into logs.</p>
        </div>
        <button class="btn-wood btn-sm" id="btn-woodlot-rest">Sleep Until Morning (restores energy, trees grow)</button>
      </div>
      <p><strong>${trees.length}</strong> tree(s) planted — <strong>${ready.length}</strong> ready, <strong>${growing.length}</strong> still growing.</p>
      <h3 style="margin-top:10px;">Saplings in your bag</h3>
      <ul style="margin-left:18px;">${bagList || "<li>None — visit Routledge's Sawmill &amp; Nursery.</li>"}</ul>
      ${trees.length ? `<table class="shop-table"><thead><tr><th>Tree</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      <p class="item-meta" style="margin-top:10px;">Rules of the woodlot: no planting in water, on roads, or in front of doors. Rabbits are welcome.</p>
    `
    );
    document.getElementById("btn-woodlot-rest").onclick = () => {
      sleepNow(false);
      openWoodlotModal();
    };
  }

  // --- BUILD YOUR OWN HOME (HOMESTEAD PLOT) ---
  function openHomesteadModal() {
    const currentStage = state.homeStage || 0;
    const nextSpec = ACM.HOME_STAGES.find((s) => s.stage === currentStage + 1);

    const banner = `
      <div class="npc-banner">
        <div>
          <strong>Your Homestead Plot: Stage ${currentStage} / 5</strong>
          <p class="item-meta">Use your woodworking skills and milled lumber to build your own timber-frame home in Alder Creek.</p>
        </div>
        <button class="btn-wood btn-sm" id="btn-home-sleep">Rest Until Morning (+1 Day)</button>
      </div>`;

    let nextHtml;
    if (!nextSpec) {
      nextHtml = `
        <div class="item-card owned">
          <h3>Master Craftsman's Homestead Complete!</h3>
          <p>Your timber-frame house stands finished overlooking Alder Creek. All customer commissions automatically earn a <strong>+15% cash & reputation bonus</strong>!</p>
        </div>`;
    } else {
      const lumberObj = ACM.LUMBER.find((l) => l.id === nextSpec.lumberId);
      const toolObj = ACM.TOOLS.find((t) => t.id === nextSpec.requiredTool);
      const haveLumber = (state.lumberStock[nextSpec.lumberId] || 0) >= nextSpec.lumberUnits;
      const haveCash = state.cash >= nextSpec.cashCost;
      const haveTool = state.ownedTools.includes(nextSpec.requiredTool);
      nextHtml = `
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
        </div>`;
    }

    // only the next step is shown in full; finished stages sit in a tab; later stages stay hidden until they matter
    const built = ACM.HOME_STAGES.filter((st) => currentStage >= st.stage);
    const later = ACM.HOME_STAGES.filter((st) => st.stage > currentStage + 1);
    const laterHtml = later.length ? `<div class="card-grid">${later.map((st, i) => (i === 0
      ? ACM.Reveal.locked(`Stage ${st.stage}: ${st.name}`, `Unlocks once you finish Stage ${st.stage - 1}.`)
      : ACM.Reveal.locked(`Stage ${st.stage}: ???`, "Keep building to find out."))).join("")}</div>` : "";
    const builtHtml = built.length ? `<div class="card-grid">${built.map((st) => `<div class="item-card owned"><div class="item-title">Stage ${st.stage}: ${st.name}</div><span class="tag">Built ✓</span><p class="item-meta">${st.desc}</p></div>`).join("")}</div>` : "";
    const html = banner + ACM.Reveal.tabs([
      { key: "next", label: nextSpec ? "Next step" : "Finished", html: nextHtml },
      { key: "built", label: "Built", count: built.length || null, html: builtHtml },
      { key: "later", label: "Coming up", count: later.length || null, html: laterHtml }
    ]);

    openModal("Your Homestead & Home Builder", html);

    document.getElementById("btn-home-sleep").onclick = () => {
      closeModal();
      sleepNow(false);
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

  function completeActiveProject() {
    const job = getActiveProject();
    if (!job) return;

    const prog = state.jobProgress;
    const fx = perkFx();
    const eff = Math.max(0, prog.mistakes - fx.freeMistakes);
    const Q = eff === 0 ? { name: "Excellent", pay: 1.1, star: 1.1 } : eff === 1 ? { name: "Good", pay: 1, star: 1 } : eff <= 3 ? { name: "Fair", pay: 0.75, star: 0.55 } : { name: "Rough", pay: 0, star: 0 };
    if (Q.name === "Rough") {
      logEvent("refused", { pid: job.id, mistakes: prog.mistakes });
      state.stats.refused = (state.stats.refused || 0) + 1;
      state.jobStash[job.id] = null; delete state.jobStash[job.id];
      state.jobProgress = freshProgress();
      spendTime(45, 0);
      updateHUD();
      if (ACM.Audio) ACM.Audio.sfx("bad");
      openModal("Delivery refused", `<p><strong>${escapeHtml(job.client)}</strong> looks it over and shakes their head.</p>
        <div class="speech" style="margin:8px 0;">"I can see you tried, but this isn't up to standard. Please make it again, and take your time with the measuring."</div>
        <p class="item-meta">The wood is spoiled, but the commission is still yours. Restart it at the Layout Bench. (${prog.mistakes} mistakes this attempt.) Mistakes are how we learn: check your measurements and tool choices next time.</p>
        <div class="dialog-actions"><button class="btn-wood" data-act="close">OK</button></div>`);
      return;
    }
    // the build is finished: wrap it up. It sits in the backpack until it is handed to the client.
    if (!Array.isArray(state.products)) state.products = [];
    const prod = { id: "pr" + Date.now().toString(36) + state.products.length, pid: job.id, quality: Q, mistakes: prog.mistakes, lumber: prog.lumberAssigned, built: state.dayCount };
    state.products.push(prod);
    state.accepted = state.accepted.filter((x) => x !== job.id);
    state.activeProjectId = null;
    state.jobProgress = freshProgress();
    delete state.jobStash[job.id];
    switchActive(state.accepted[0] || null);
    spendTime(30, 0);
    logEvent("build", { pid: job.id, mistakes: prog.mistakes, quality: Q.name, lumber: prog.lumberAssigned });
    if (ACM.Audio) ACM.Audio.sfx("coin");
    updateHUD();
    updateObjective();
    renderHotbar();
    closeModal();
    toast(`Finished the ${job.title} (${Q.name} work). It's in your backpack: ${targetText(job)}`, "good");
    ACM.CloudSync.saveToCloud(state);
  }

  // ---- who receives a finished piece? ----
  function deliveryTarget(job) {
    if (job.heritage) return { type: "gate", label: "Nell, at the old family house" };
    const c = job.client || "";
    const map = [["Gable", "gable"], ["Mateo", "mateo"], ["Clara", "clara"], ["Harbor Bistro", "clara"], ["MacLeod", "macleod"], ["Alverez", "alverez"], ["Seymour", "seymour"], ["Doucet", "doucet"], ["Routledge", "routledge"]];
    const hit = map.find(([k]) => c.indexOf(k) >= 0);
    if (hit) { const n = npcById(hit[1]); return { type: "npc", id: hit[1], label: n ? n.name : hit[1] }; }
    return { type: "board", label: "the Town Hall commission board (" + c + ")" };
  }
  const targetText = (job) => { const t = deliveryTarget(job); return t.type === "npc" ? `take it to ${t.label} and hand it over.` : t.type === "gate" ? `take it to ${t.label}.` : `hand it in at ${t.label}.`; };
  const pendingProduct = (pid) => (state.products || []).some((p) => p.pid === pid);
  function productsFor(t) {   // products addressed to an npc id / "board" / "gate"
    return (state.products || []).filter((p) => { const job = projectById(p.pid); if (!job) return false; const d = deliveryTarget(job); return t === "board" ? d.type === "board" : t === "gate" ? d.type === "gate" : d.type === "npc" && d.id === t; });
  }
  function handOverButtons(t) {
    return productsFor(t).map((p) => `<button class="btn-green btn-sm" data-act="handover" data-prod="${p.id}">Hand over: ${escapeHtml((projectById(p.pid) || {}).title || "project")} (${p.quality.name})</button>`).join("");
  }

  function handOver(prodId) {
    const prod = (state.products || []).find((p) => p.id === prodId);
    const job = prod && projectById(prod.pid);
    if (!prod || !job) return;
    const Q = prod.quality, fx = perkFx();
    const prog = { lumberAssigned: prod.lumber, mistakes: prod.mistakes };
    const homeMultiplier = (state.homeStage || 0) >= 5 ? 1.15 : 1.0;
    // repeat orders of the same commission pay less (so the board can't be farmed); designs and heritage pieces have their own rules
    const repeats = state.completedProjectIds.filter((id) => id === job.id).length;
    const repeatF = job.design || job.heritage ? 1 : Math.max(0.1, Math.pow(0.5, repeats));
    const netPay = Math.max(1, Math.round(job.basePay * Q.pay * (1 + fx.payBonus) * homeMultiplier * repeatF));
    const preferredBonus = job.lumberReq.preferredId && prog.lumberAssigned === job.lumberReq.preferredId ? 0.15 : 0;
    // reputation from easy or repeated work shrinks, so stars can't be farmed on one small job
    const prevBuilds = state.completedProjectIds.filter((id) => id === job.id).length;
    const outgrown = state.stars - job.tier >= 1 ? 0.3 : state.stars - job.tier >= 0.5 ? 0.65 : 1;
    const freshness = job.heritage ? 1 : outgrown * (prevBuilds ? 0.5 : 1);
    const starDelta = Math.max(0.02, (job.starGain + preferredBonus) * Q.star * fx.starMult * homeMultiplier * freshness);

    state.cash += netPay;
    state.stars = Math.min(5.0, state.stars + starDelta);
    state.completedProjectIds.push(job.id);
    if (ACM.Repairs && ACM.Repairs.note(job.id)) setTimeout(() => toast("Village repaired: " + ACM.Repairs.note(job.id), "good"), 2200);

    if (state.stars >= 4.8 && state.safetyIncidents === 0) {
      state.legacyTitle = "The Master Artisan";
    } else if (state.cash >= 1500) {
      state.legacyTitle = "The Savvy Entrepreneur";
    } else if ((state.homeStage || 0) >= 5) {
      state.legacyTitle = "Alder Creek Homesteader";
    } else {
      state.legacyTitle = `Tier ${Math.floor(state.stars)}★ Woodworker`;
    }

    state.products = state.products.filter((p) => p.id !== prodId);
    const who = deliveryTarget(job);
    if (who.type === "npc") addFriend(who.id, 20);
    logEvent("deliver", { pid: job.id, pay: netPay, stars: Number(starDelta.toFixed(2)), mistakes: prog.mistakes, quality: Q.name, lumber: prog.lumberAssigned });
    if (ACM.Audio) ACM.Audio.sfx("coin");
    tutDone("first_delivery");
    updateHUD();
    updateObjective();
    renderHotbar();

    if (job.choice) {
      openModal(
        `${Q.name} work! (+$${netPay}, +${starDelta.toFixed(2)}★)`,
        `
          <p><strong>${job.client}</strong> inspects your ${job.title}!</p>
          <p style="margin:10px 0; font-weight:bold;">${job.choice.prompt}</p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="btn-green" id="choice-a">${job.choice.optionA.label}</button>
            <button class="btn-wood" id="choice-b">${job.choice.optionB.label}</button>
          </div>
        `
      );
      ACM.CloudSync.saveToCloud(state);
      document.getElementById("choice-a").onclick = () => applyChoice(job.choice.optionA);
      document.getElementById("choice-b").onclick = () => applyChoice(job.choice.optionB);
    } else {
      closeModal();
      if (job.heritage && ACM.Story) setTimeout(() => ACM.Story.onDelivered(ACM.Game, job), 50);
      toast(`Delivered ${job.title} (${Q.name} quality). Earned $${netPay} & +${starDelta.toFixed(2)}★${Q.name === "Fair" ? ". Fair work sells for less. Careful measuring pays!" : ""}${freshness < 1 ? " Easy or repeat jobs earn less ★." : ""}`, "good");
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


  // =====================================================================
  //  PROGRESS REPORT (for the student and the teacher)
  // =====================================================================
  function buildReport() {
    const ev = state.events || [];
    const dels = ev.filter((e) => e.t === "deliver");
    const quizzes = ev.filter((e) => e.t === "quiz");
    const exams = ev.filter((e) => e.t === "exam");
    const byQ = { Excellent: 0, Good: 0, Fair: 0 };
    dels.forEach((d) => { byQ[d.quality] = (byQ[d.quality] || 0) + 1; });
    const half = Math.floor(dels.length / 2);
    const avg = (a) => (a.length ? a.reduce((s, d) => s + d.mistakes, 0) / a.length : null);
    const cats = {};
    quizzes.forEach((q) => { const c = cats[q.cat] || (cats[q.cat] = { ok: 0, n: 0 }); c.n++; if (q.ok) c.ok++; });
    return {
      shop: state.shopName, classCode: state.classCode, days: state.dayCount, stars: state.stars, cash: Math.round(state.cash), tier: state.certifiedTier,
      delivered: dels.length, quality: byQ, refused: state.stats.refused || 0,
      avgMistakesEarly: avg(dels.slice(0, Math.max(1, half))), avgMistakesLate: dels.length >= 2 ? avg(dels.slice(half)) : null,
      quizTotal: quizzes.length, quizOk: quizzes.filter((q) => q.ok).length, cats,
      examsTaken: exams.length, examsPassed: exams.filter((e) => e.pass).length,
      measure: ACM.Measure ? ACM.Measure.summary(ACM.Game) : { spots: 0, total: 0, tries: 0, ok: 0 }, permits: ACM.Safety ? ACM.Safety.summary(ACM.Game) : [], incidents: state.safetyIncidents || 0, felled: state.stats.felled || 0, planted: state.stats.planted || 0,
      friends: Object.entries(state.rel || {}).map(([id, r]) => [npcById(id).name, ACM.NPC_HELPERS.heartsFor(r.pts)]).filter((x) => x[1] > 0)
    };
  }

  function openReportModal() {
    const r = buildReport();
    const pct = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "—");
    const f1 = (x) => (x == null ? "—" : x.toFixed(1));
    const catRows = Object.entries(r.cats).map(([c, v]) => `<tr><td>${escapeHtml(c)}</td><td>${v.ok}/${v.n}</td><td>${pct(v.ok, v.n)}</td></tr>`).join("");
    openModal("My Progress Report", `
      <p class="item-meta">This is the record your teacher sees: how your skills and habits are growing. Mistakes are part of learning. What matters is the trend.</p>
      <div class="card-grid">
        <div class="item-card"><div class="item-title">Workshop</div>
          <p class="item-meta">Commissions delivered: <strong>${r.delivered}</strong><br>Excellent ${r.quality.Excellent} · Good ${r.quality.Good} · Fair ${r.quality.Fair} · Remade ${r.refused}<br>Avg mistakes, early → recent: <strong>${f1(r.avgMistakesEarly)} → ${f1(r.avgMistakesLate)}</strong></p></div>
        <div class="item-card"><div class="item-title">Safety &amp; knowledge</div>
          <p class="item-meta">Quiz accuracy: <strong>${pct(r.quizOk, r.quizTotal)}</strong> (${r.quizOk}/${r.quizTotal})<br>Certification exams passed: <strong>${r.examsPassed}/${r.examsTaken}</strong><br>Shop safety incidents: <strong>${r.incidents}</strong><br>Measuring &amp; squaring: <strong>${r.measure.ok}/${r.measure.tries}</strong> correct · ${r.measure.spots}/${r.measure.total} spots found<br>Safety permits: <strong>${r.permits.filter((p) => p.passed).length}/${r.permits.length}</strong> (${r.permits.reduce((s, p) => s + p.att, 0)} attempts)</p></div>
        <div class="item-card"><div class="item-title">Stewardship &amp; community</div>
          <p class="item-meta">Trees felled / planted: <strong>${r.felled} / ${r.planted}</strong><br>Friends: ${r.friends.map((f) => `${escapeHtml(f[0])} ${f[1]}♥`).join(", ") || "none yet"}<br>Game days played: ${r.days}</p></div>
      </div>
      ${catRows ? `<h3 style="margin-top:10px;">Quiz results by topic</h3><table class="shop-table"><thead><tr><th>Topic</th><th>Correct</th><th>%</th></tr></thead><tbody>${catRows}</tbody></table>` : ""}
      <div class="dialog-actions"><button class="btn-brass btn-sm" data-act="csv">Download my data (CSV)</button></div>`);
  }

  function downloadCsv() {
    const rows = [["shop", "class", "day", "minute", "event", "details"]];
    (state.events || []).forEach((e) => {
      const { t, d, m: mm, ...rest } = e;
      rows.push([state.shopName, state.classCode, d, mm, t, JSON.stringify(rest)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${state.classCode}_${state.shopName}_progress.csv`.replace(/\s+/g, "_");
    a.click();
  }

  async function openLeaderboardModal() {
    openModal("Class Leaderboard", `<p>Loading live rankings for class <strong>${escapeHtml(state.classCode)}</strong>...</p>`);
    const rows = await ACM.CloudSync.fetchLeaderboard(state.classCode);

    if (!rows || rows.length === 0) {
      openModal("Class Leaderboard", `<p>No saved workshops found for <strong>${escapeHtml(state.classCode)}</strong> yet. Click <strong>Save</strong> to post your shop!</p>`);
      return;
    }

    const tableRows = rows
      .map(
        (r, i) => `
          <tr>
            <td>#${i + 1}</td>
            <td><strong>${escapeHtml(r.shopName)}</strong></td>
            <td>★ ${(Number(r.stars) || 1).toFixed(2)}</td>
            <td>$${Math.round(Number(r.cash) || 0)}</td>
            <td>${escapeHtml(r.legacyTitle || "Woodworker")}</td>
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
    const id = stationId;
    const inside = ACM.World.inBuilding();
    const OWNER = { tool_shop: "seymour", lumber_mill: "routledge", cafe_counter: "clara" };
    if (inside && OWNER[id] && !relOf(OWNER[id]).met) { openNpcDialog(OWNER[id]); return; }
    const DOORS = { tool_shop: "hardware", lumber_mill: "sawmill", woodlot: "shed", cafe: "cafe", school: "school", council: "council", ranger: "ranger" };
    if (typeof id === "string" && id.indexOf("npc:") === 0) openNpcDialog(id.slice(4));
    else if (typeof id === "string" && id.indexOf("forage:") === 0) harvestForage(Number(id.slice(7)));
    else if (typeof id === "string" && id.indexOf("measure:") === 0) ACM.Measure.open(ACM.Game, id.slice(8));
    else if (id === "exit") ACM.World.exitBuilding();
    else if (!inside && DOORS[id]) enterBuilding(DOORS[id]);
    else if (!inside && id === "homestead" && (state.homeStage || 0) >= 3) enterBuilding("home");
    else if (id === "cafe_counter") openProvisions();
    else if (id === "leaderboard") openLeaderboardModal();
    else if (id === "safety_board") ACM.Safety.openBoard(ACM.Game);
    else if (id === "ranger_map") openForestReport();
    else if (id === "bed") { sleepNow(false); }
    else if (id === "lumber_rack") openLumberRack();
    else if (id === "blueprint_desk") ACM.Minigames.openBlueprintDesk(this);
    else if (id === "drafting_table") ACM.Drafting.open(ACM.Game);
    else if (id === "tool_shop") openToolShop();
    else if (id === "lumber_mill") openLumberMill();
    else if (id === "layout_bench") ACM.Minigames.openLayoutBench(this);
    else if (id === "assembly_table") ACM.Minigames.openAssemblyTable(this);
    else if (id === "town_board") openTownBoard();
    else if (id === "woodlot") openWoodlotModal();
    else if (id === "homestead") openHomesteadModal();
    else if (id === "legacy_house") { if (ACM.Story.stage(ACM.Game) >= 5) enterBuilding("legacy"); else ACM.Story.openHouse(ACM.Game); }
    else if (id === "nell_tea") ACM.Story.tea(ACM.Game);
  }

  function migrateLoadedState(loaded) {
    Object.assign(state, loaded);
    if (loaded.treeFormat !== 2) {
      state.trees = convertOldTrees(loaded.trees);
      state.treeFormat = 2;
    } else {
      state.trees = (Array.isArray(state.trees) ? state.trees : []).filter((t) => t && typeof t.tx === "number" && ACM.Map.inb(t.tx, t.ty));
    }
    state.selectedSapling = null;
    if (typeof state.timeMin !== "number") state.timeMin = 360;
    if (typeof state.energy !== "number") state.energy = 100;
    if (!state.maxEnergy) state.maxEnergy = 100;
    if (!state.felled || Array.isArray(state.felled)) state.felled = {};
    if (!state.chops) state.chops = {};
    (state.wild || []).forEach((t) => { t.wild = true; });   // older saves: regrown trees were never flagged, so chopping them never removed them
    if (!Array.isArray(state.wild)) state.wild = [];
    if (!state.logs) state.logs = {};
    if (!state.pantry) state.pantry = {};
    if (!Array.isArray(state.slots)) state.slots = [];
    if (typeof state.sel !== "number") state.sel = 0;
    if (!state.forageTaken) state.forageTaken = {};
    if (!state.rel) state.rel = {};
    if (!state.stats) state.stats = {};
    if (!Array.isArray(state.events)) state.events = [];
    if (!state.jobStash) state.jobStash = {};
    if (!state.safety) state.safety = {};
    if (!state.measured) state.measured = {};
    if (!state.story) state.story = { stage: 0, met: false, seen: {}, tea: -1 };
    if (!state.tut) {
      state.tut = { done: [] };
      if ((state.completedProjectIds || []).length) state.tut.done.push("meet_seymour", "first_delivery");
    }
    if (!Array.isArray(state.accepted)) state.accepted = state.activeProjectId ? [state.activeProjectId] : [];
    if (state.activeProjectId && !state.accepted.includes(state.activeProjectId)) state.accepted.push(state.activeProjectId);
    if (!state.saplingBag) state.saplingBag = { sapling_pine: 2 };
    if (typeof state.homeStage !== "number") state.homeStage = 0;
    if (ACM.Workshop) ACM.Workshop.migrate(state);
    if (ACM.Drafting) ACM.Drafting.restore(state);
    applyMaxEnergy();
    if (!Array.isArray(state.products)) state.products = [];
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
      ["NPCS", "data-npcs.js"],
      ["Audio", "audio.js"],
      ["FOODS", "data-foods.js"],
      ["INTERIORS", "data-interiors.js"],
      ["ArtInteriors", "art-interiors.js"],
      ["Icons", "art-icons.js"],
      ["Map", "world-map.js"],
      ["ArtBuildings", "art-buildings.js"],
      ["ArtWorld", "art-world.js"],
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
      if (ACM.Audio) ACM.Audio.init();
      let isNew = false;
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
          const attemptKey = `${classCode}|${shopName}`.toLowerCase();
          if (result && result.unreachable && startBtn.dataset.offlineOk !== attemptKey) {
            statusEl.style.color = "#b45309";
            statusEl.textContent =
              "Couldn't reach the save server, so we can't check for an existing save. Check your connection and try again — or click Start again to begin offline (progress is kept on this device).";
            startBtn.dataset.offlineOk = attemptKey;
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
            isNew = true;
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
      renderPlantBar();
      startBtn.disabled = false;
      updateObjective();
      if (isNew || !state.tut.seenIntro) { state.tut.seenIntro = true; openHowItWorks(true); }
      else if (ACM.World && ACM.World.focusGameCanvas) ACM.World.focusGameCanvas(document.getElementById("game-canvas"));
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

    ACM.World.init(canvas, (sid) => handleStationInteract.call(ACM.Game, sid), {
      onTileAction: handleTileAction,
      getPlantSapling: selectedSaplingId,
      getPlantLabel: plantLabel,
      canPlant: plantCheck,
      onCycleSapling: cycleSapling,
      onBlockedClick: () => toast("You can't walk there.", "bad"),
      onMidnight: () => collapseAtMidnight(),
      npcBubble: npcBubble
    });

    document.getElementById("modal-body").addEventListener("click", (e) => {
      const el = e.target.closest("[data-act]");
      if (!el) return;
      const act = el.dataset.act;
      if (act === "close") closeModal();
      else if (act === "howto") openHowItWorks(false);
      else if (act === "report") openReportModal();
      else if (act === "eat") { eatFood(el.dataset.id); openInventoryModal(); }
      else if (act === "inv-tab") { openInventoryModal(el.dataset.tab); }
      else if (act === "unstuck") { closeModal(); ACM.World.rescue(); toast("Back at the workshop.", "good"); logEvent("unstuck", {}); }
      else if (act === "controls") openControls();
      else if (act === "inv-hold") { equipOrUse(Number(el.dataset.i)); }
      else if (act === "provisions") openProvisions();
      else if (act === "buy-food") { const f = ACM.FOODS[el.dataset.id]; if (state.cash < f.price) toast("Not enough cash.", "bad"); else { state.cash -= f.price; addFood(el.dataset.id, 1); if (ACM.Audio) ACM.Audio.sfx("coin"); updateHUD(); openProvisions(`Bought ${f.name}.`); } }
      else if (act === "csv") downloadCsv();
      else if (act === "handover") { closeModal(); handOver(el.dataset.prod); }
      else if (act === "sleep") { sleepNow(false); closeModal(); }
      else if (act === "rack") openLumberRack();
      else if (act === "shop-tools") openToolShop();
      else if (act === "shop-mill") openLumberMill();
      else if (act === "job-accept") { if (acceptJob(el.dataset.pid)) toast("Commission accepted!", "good"); openTownBoard(); }
      else if (act === "job-switch") { switchActive(el.dataset.pid); updateHUD(); updateObjective(); toast("Now working on that commission. Go to the Layout Bench.", "good"); openTownBoard(); }
      else if (act === "job-drop") { dropJob(el.dataset.pid); updateObjective(); openTownBoard(); }
      else if (["log-sell", "log-mill", "log-mill-paid", "board-sell"].includes(act)) rackAction(el);
      else if (["npc", "chat", "gift", "meal", "job-accept-npc"].includes(act)) npcAction(el);
    });

    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!document.getElementById("creator-modal").classList.contains("hidden")) return;
      const k = e.key;
      const modalOpen = !document.getElementById("modal-overlay").classList.contains("hidden");
      if (modalOpen) {
        if (document.getElementById("inv-grid")) {
          if (k === "ArrowLeft") { e.preventDefault(); invMove(-1, 0); }
          else if (k === "ArrowRight") { e.preventDefault(); invMove(1, 0); }
          else if (k === "ArrowUp") { e.preventDefault(); invMove(0, -1); }
          else if (k === "ArrowDown") { e.preventDefault(); invMove(0, 1); }
          else if (k === "Enter") { e.preventDefault(); invClickSlot(invCur); }
          else if (k.toLowerCase() === "e") { e.preventDefault(); equipOrUse(invCur); }
          else if (k === "Tab" || k.toLowerCase() === "i") { e.preventDefault(); closeModal(); }
          return;
        }
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) {
          const btns = Array.from(document.querySelectorAll("#modal-body button:not([disabled])"));
          if (!btns.length) return;
          e.preventDefault();
          const cur = btns.indexOf(document.activeElement);
          const next = k === "ArrowDown" || k === "ArrowRight" ? (cur + 1) % btns.length : (cur - 1 + btns.length) % btns.length;
          btns[cur < 0 ? 0 : next].focus();
        } else if (k.toLowerCase() === "h" && !document.getElementById("fx-canvas")) { openControls(); }
        return;
      }
      if (e.repeat) return;
      const lk = k.toLowerCase();
      const idx = SLOT_KEYS.indexOf(lk);
      if (idx >= 0) selectSlot(idx);
      else if (k === "ArrowLeft") { e.preventDefault(); selectSlot(state.sel - 1); }
      else if (k === "ArrowRight") { e.preventDefault(); selectSlot(state.sel + 1); }
      else if (lk === "f") useSelected();
      else if (lk === "i" || k === "Tab") { e.preventDefault(); openInventoryModal("items"); }
      else if (lk === "h") openControls();
      else if (lk === "g") { state.guide = state.guide === false; toast(state.guide === false ? "Goal guide off (press G to turn it on)" : "Goal guide on", "good"); }
      else if (lk === "m") { ACM.Audio.init(); ACM.Audio.setMuted(!ACM.Audio.isMuted()); updateHUD(); }
    });

    document.getElementById("modal-body").addEventListener("click", (e) => {
      const s = e.target.closest("#inv-grid .slot");
      if (s) invClickSlot(Number(s.dataset.i));
    });
    document.getElementById("modal-body").addEventListener("mouseover", (e) => {
      const s = e.target.closest("#inv-grid .slot");
      if (s && Number(s.dataset.i) !== invCur) { invCur = Number(s.dataset.i); drawInvGrid(); }
    });
    const hb = document.getElementById("hotbar");
    hb.addEventListener("click", (e) => { const s = e.target.closest(".slot"); if (s) { selectSlot(Number(s.dataset.i)); ACM.World.focusGameCanvas(canvas); } });
    hb.addEventListener("mouseover", (e) => { const s = e.target.closest(".slot"); if (s) { hoverKey = state.slots[Number(s.dataset.i)] || null; renderHotbar(); } });
    hb.addEventListener("mouseleave", () => { hoverKey = null; renderHotbar(); });
    canvas.addEventListener("wheel", (e) => { if (!document.getElementById("modal-overlay").classList.contains("hidden")) return; e.preventDefault(); selectSlot(state.sel + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });

    const sndBtn = document.getElementById("btn-sound");
    if (sndBtn) sndBtn.onclick = () => { ACM.Audio.init(); ACM.Audio.setMuted(!ACM.Audio.isMuted()); updateHUD(); };

    const plantBar = document.getElementById("plant-bar");
    if (plantBar) {
      plantBar.addEventListener("click", (e) => {
        const chip = e.target.closest(".plant-chip");
        if (!chip) return;
        state.selectedSapling = chip.dataset.sid || null;
        renderPlantBar();
        ACM.World.focusGameCanvas(canvas);
      });
    }

    document.getElementById("modal-close").onclick = closeModal;
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !document.getElementById("modal-overlay").classList.contains("hidden")) {
        closeModal();
      }
    });

    document.getElementById("btn-story").onclick = openTownBoard;
    document.getElementById("btn-inventory").onclick = () => openInventoryModal("items");
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

  let frameN = 0, lastT = 0, acc = 16;
  const STEP = 1000 / 60;
  function loop(now) {
      try {
        if ((frameN = (frameN || 0) + 1) % 30 === 0) updateObjective();
        // the game logic runs at a fixed 60 steps a second, so a 120 or 144 Hz screen doesn't make everything faster
        now = now || performance.now();
        acc += Math.min(100, lastT ? now - lastT : STEP);
        lastT = now;
        let steps = 0;
        while (acc >= STEP - 0.5 && steps < 4) { ACM.World.update(state); acc -= STEP; steps++; }
        if (acc > STEP * 4) acc = 0;
        ACM.World.render(ctx, state);

        const st = ACM.World.getActiveStation();
        if (st) {
          hintEl.textContent = st.prompt;
          interactBtn.disabled = false;
          interactBtn.textContent = st.id === "exit" ? "Leave [E]" : String(st.id).indexOf("forage:") === 0 ? "Pick [E]" : st.measure ? "Measure [E]" : st.npc ? `Talk to ${st.shortLabel} [E]` : `Open ${st.shortLabel} [E]`;
        } else {
          hintEl.textContent = selectedSaplingId()
            ? "Planting mode: click an open grass tile within reach (or face one and press E). Q or ← → changes slot."
            : "WASD to move · click to travel · E interact · 1–0 hotbar · F eat · I backpack · H help";
          interactBtn.disabled = true;
          interactBtn.textContent = "Walk to a Building";
        }
      } catch (err) {
        console.error("Frame render error:", err);
      }
      requestAnimationFrame(loop);
    }

    updateHUD();
    renderPlantBar();
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
    completeActiveProject,
    handOver,
    acceptJob,
    dropJob,
    handOverButtons,
    productsFor,
    deliveryTarget,
    spendTime,
    spendWork,
    logEvent,
    eatFood,
    harvestForage,
    enterBuilding,
    perkFx,
    addFriend,
    heldTool,
    requireHeld,
    goalTarget,
    _t: { maybeSquirrel, squirrelChance, plantCheck, openHomesteadModal, invItems, reconcileSlots, selectSlot, invClickSlot, openInventoryModal, openControls, openNpcDialog, fellTree, growForest, acceptJob, switchActive, dropJob, sleepNow, openLumberRack, openTownBoard, handleTileAction, npcAction, rackAction }
  };
})();
