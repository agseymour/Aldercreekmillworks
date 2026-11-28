window.ACM = window.ACM || {};

/**
 * Teacher test panel (hidden). Click the shop-name badge at the top-left 5 times quickly.
 * Lets a teacher speed-run the game and try every feature. Every use is logged as a "test" event, so
 * the class dashboard flags the account.
 */
ACM.TestPanel = (function () {
  const G = () => ACM.Game, S = () => ACM.Game.state;
  function log(a) { const s = S(); s.testMode = true; G().logEvent("test", { a }); }
  const done = (msg) => { G().updateHUD(); G().toast("Test panel: " + msg, "good"); };

  const ACTIONS = [
    ["Do the next task", "Finish the next commission or tutorial step (build and hand over)", () => G().testAuto()],
    ["+ $1000", "", () => { S().cash += 1000; return "+$1000"; }],
    ["Rating +0.5★", "", () => { S().stars = Math.min(5, S().stars + 0.5); return "rating " + S().stars.toFixed(2); }],
    ["Rating 5★", "", () => { S().stars = 5; return "rating 5"; }],
    ["Certify all tiers", "Unlocks every tool tier and lumber", () => { S().certifiedTier = 5; return "certified to Tier 5"; }],
    ["All tools", "Owns every tool, sharp", () => { ACM.TOOLS.forEach((t) => { if (!S().ownedTools.includes(t.id)) S().ownedTools.push(t.id); S().toolDurability[t.id] = t.maxDurability; }); return "all tools"; }],
    ["All safety permits", "", () => { S().safety = S().safety || {}; ACM.SAFETY.forEach((t) => { const r = S().safety[t.id] || (S().safety[t.id] = { att: 0, best: 0, passed: false, lockUntil: 0, missed: [] }); r.passed = true; r.best = Math.max(r.best, 100); r.att = Math.max(r.att, 1); }); return "all permits"; }],
    ["Build all workshop bays", "", () => { ACM.WORKSHOP_ADDITIONS.forEach((a) => { S().workshop[a.id] = true; }); if (G().refreshWorld) G().refreshWorld(); return "workshop complete"; }],
    ["Stock lumber, logs, saplings", "+10 of each", () => { ACM.LUMBER.forEach((l) => { if (/^sapling_/.test(l.id)) S().saplingBag[l.id] = (S().saplingBag[l.id] || 0) + 5; else S().lumberStock[l.id] = (S().lumberStock[l.id] || 0) + 10; }); Object.keys(ACM.LOGS).forEach((k) => { S().logs[k] = (S().logs[k] || 0) + 10; }); return "stocked"; }],
    ["Full energy", "", () => { S().energy = S().maxEnergy || 150; return "energy full"; }],
    ["Skip to morning", "Sleep and start the next day", () => { G()._t.sleepNow(false); return "next morning"; }],
    ["Homestead +1 stage", "", () => { S().homeStage = Math.min(5, (S().homeStage || 0) + 1); if (G().refreshWorld) G().refreshWorld(); return "homestead stage " + S().homeStage; }],
    ["Story +1 piece", "Restore the next piece of the family kitchen", () => { const s = S().story || (S().story = { stage: 0, met: true, seen: {}, tea: -1 }); s.met = true; s.stage = Math.min(5, s.stage + 1); return "story piece " + s.stage; }],
    ["Max all friendships", "", () => { ACM.NPCS.forEach((n) => G().addFriend(n.id, 200)); return "friendships up"; }],
    ["Answer all quiz questions", "Marks every curriculum question as answered", () => { S().answeredQuestions = ACM.QUESTIONS.map((q) => q.id); return "quiz bank answered"; }],
    ["Text me now", "Sends the next phone text and the morning bulletin immediately", () => { const p = ACM.Guide.phone(); p.n = 0; p.last = {}; p.slots = [0, 0]; ACM.Guide.maybeText(); S().bulletinDay = -1; return "text sent"; }],
    ["Giant squirrel!", "", () => { const r = Math.random; Math.random = () => 0; const p = ACM.World.getPlayerTile(); G()._t.maybeSquirrel(p.tx + 1, p.ty); Math.random = r; return "squirrel"; }],
    ["Midnight blackout", "", () => { S().timeMin = 1438; return "almost midnight"; }]
  ];

  function tele(label, tx, ty) { return [label, () => { ACM.World.exitBuilding && ACM.World.inBuilding() && ACM.World.exitBuilding(); ACM.World.debug.teleportTile(tx, ty); return "teleported to " + label; }]; }
  function places() {
    const M = ACM.Map, out = [tele("Workshop", 15, 16)];
    const nm = { hardware: "Hardware", sawmill: "Sawmill", cafe: "Café", school: "School", council: "Town Hall", ranger: "Parks", shed: "Woodlot", legacy: "Family house", home: "Homestead" };
    M.buildings.forEach((b) => { if (b.doorX != null && nm[b.kind]) out.push(tele(nm[b.kind], b.doorX, b.y + b.h + 1)); });
    return out;
  }

  function open(msg) {
    const g = G();
    if (!msg) log("open");
    const btn = (label, hint, i) => `<button class="btn-wood btn-sm" data-tp="${i}" title="${hint || ""}">${label}</button>`;
    const pl = places();
    g.openModal("Teacher test panel", `
      <p class="item-meta">Speed-run and test every feature. Each use is logged, and the class dashboard flags this account as a test account.</p>
      <div class="dialog-actions" style="gap:6px">${ACTIONS.map((a, i) => btn(a[0], a[1], i)).join("")}</div>
      <p style="margin-top:10px"><strong>Go to</strong></p>
      <div class="dialog-actions" style="gap:6px">${pl.map((p, i) => `<button class="btn-brass btn-sm" data-tpp="${i}">${p[0]}</button>`).join("")}</div>
      <p class="item-meta" id="tp-msg" style="margin-top:8px">${msg ? "Done: " + msg : ""}</p>
      <div class="dialog-actions"><button class="btn-wood btn-sm" data-act="close">Close</button></div>`);
    document.querySelectorAll("#modal-body [data-tp]").forEach((b) => (b.onclick = () => {
      const a = ACTIONS[Number(b.dataset.tp)];
      log(a[0]);
      let r; try { r = a[2](); } catch (e) { r = "error: " + e.message; }
      g.updateHUD();
      open(r);                       // some actions close the window (e.g. finishing a build), so draw the panel again
    }));
    document.querySelectorAll("#modal-body [data-tpp]").forEach((b) => (b.onclick = () => {
      const p = pl[Number(b.dataset.tpp)]; log("go " + p[0]); p[1](); g.closeModal();
    }));
  }

  // secret trigger: five quick clicks on the shop-name badge
  let clicks = [];
  document.addEventListener("click", (e) => {
    if (!e.target.closest || !e.target.closest("#hud-shop-name")) return;
    const now = Date.now();
    clicks = clicks.filter((t) => now - t < 2500); clicks.push(now);
    if (clicks.length >= 5) { clicks = []; open(); }
  });
  return { open };
})();
