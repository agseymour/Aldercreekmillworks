window.ACM = window.ACM || {};

/**
 * The workshop starts as a small shop (the "core"). Machines only fit once the right addition is built:
 *   mitre saw + dust collector: core | table saw + jointer: West Bay | planer + band saw: East Bay
 * Additions are bought at the Blueprint Desk. state.workshop = { west: bool, east: bool }.
 */
ACM.WORKSHOP_ADDITIONS = [
  { id: "west", name: "West Machine Bay", cost: 200, stars: 1.35, fits: ["table_saw", "jointer"],
    blurb: "Pours a concrete slab, runs 240 V power and adds a heavy-machine bay with room for the table saw and jointer." },
  { id: "east", name: "East Machine Bay", cost: 250, stars: 2.0, needs: "west", fits: ["planer", "band_saw"],
    blurb: "A second bay with a dust drop and wide infeed space, for the thickness planer and the band saw." }
];
ACM.Workshop = (function () {
  const adds = () => ACM.WORKSHOP_ADDITIONS;
  const zones = (state) => ({ west: !!(state && state.workshop && state.workshop.west), east: !!(state && state.workshop && state.workshop.east) });
  const key = (state) => { const z = zones(state); return (z.west ? "W" : "-") + (z.east ? "E" : "-"); };
  const addFor = (toolId) => adds().find((a) => a.fits.includes(toolId)) || null;
  /** { ok, add } : may this tool be fitted in the workshop right now? */
  function fits(state, toolId) {
    const a = addFor(toolId);
    if (!a) return { ok: true, add: null };
    return { ok: !!(state.workshop && state.workshop[a.id]), add: a };
  }
  /** older saves: anyone who already owns a bay machine gets that bay built */
  function migrate(state) {
    if (!state.workshop || typeof state.workshop !== "object") state.workshop = { west: false, east: false };
    (state.ownedTools || []).forEach((t) => { const a = addFor(t); if (a) state.workshop[a.id] = true; });
  }
  function canBuild(game, a) {
    const S = game.state, why = [];
    if (S.workshop[a.id]) return { ok: false, why: ["Built"] };
    if (S.stars < a.stars) why.push(`Rating ★ ${a.stars.toFixed(2)}`);
    if (a.needs && !S.workshop[a.needs]) why.push(`Build the ${adds().find((x) => x.id === a.needs).name} first`);
    if (S.cash < a.cost) why.push(`$${a.cost} needed`);
    return { ok: why.length === 0, why };
  }
  function buy(game, id) {
    const a = adds().find((x) => x.id === id);
    const c = canBuild(game, a);
    if (!c.ok) { game.toast("Can't build yet: " + c.why.join(", "), "bad"); return false; }
    game.state.cash -= a.cost;
    game.state.workshop[a.id] = true;
    game.logEvent("workshop", { add: a.id, cost: a.cost });
    game.updateHUD();
    if (game.refreshWorld) game.refreshWorld();
    if (ACM.Audio) ACM.Audio.sfx("good");
    game.toast(`${a.name} built! Room now for: ${a.fits.map((t) => (ACM.TOOLS.find((x) => x.id === t) || { name: t }).name).join(", ")}.`, "good");
    return true;
  }
  function openPlans(game) {
    const S = game.state;
    const nm = (t) => (ACM.TOOLS.find((x) => x.id === t) || { name: t }).name;
    const list = adds();
    const card = (a) => {
      const built = S.workshop[a.id], c = canBuild(game, a);
      return `<div class="item-card ${built ? "owned" : ""}"><div class="item-title">${a.name} · $${a.cost}</div>
        <p class="item-meta">${a.blurb}</p><p class="item-meta"><strong>Fits:</strong> ${a.fits.map(nm).join(", ")}</p>
        <div class="dialog-actions">${built ? '<span class="tag" style="background:#bbf7d0;">Built</span>' : `<button class="btn-brass btn-sm" data-wsb="${a.id}" ${c.ok ? "" : "disabled"}>Build ($${a.cost})</button><span class="item-meta">${c.ok ? "" : c.why.join(" · ")}</span>`}</div></div>`;
    };
    const done = list.filter((a) => S.workshop[a.id]);
    const todo = list.filter((a) => !S.workshop[a.id]);
    const later = todo.slice(1);
    const html = `<p class="item-meta">Your workshop is a small shop. The mitre saw and dust collector fit as they are; bigger machines need a bay built first.</p>` + ACM.Reveal.tabs([
      { key: "next", label: todo.length ? "Next addition" : "All built", html: todo.length ? `<div class="card-grid">${card(todo[0])}</div>` : `<p class="item-meta">Every bay is built. Nice shop!</p>` },
      { key: "built", label: "Built", count: done.length || null, html: done.length ? `<div class="card-grid">${done.map(card).join("")}</div>` : "" },
      { key: "later", label: "Later", count: later.length || null, html: later.length ? `<div class="card-grid">${later.map((a) => ACM.Reveal.locked(a.name, "Build the earlier additions first.")).join("")}</div>` : "" }
    ]) ;
    game.openModal("Workshop Plans", html + `<div class="dialog-actions"><button class="btn-wood btn-sm" data-act="close">Close</button></div>`);
    document.querySelectorAll("#modal-body [data-wsb]").forEach((b) => (b.onclick = () => { if (buy(game, b.dataset.wsb)) openPlans(game); }));
  }
  return { zones, key, fits, addFor, migrate, canBuild, buy, openPlans };
})();
