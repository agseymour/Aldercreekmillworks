window.ACM = window.ACM || {};

/** ACM.Story: the Family Kitchen arc (see data-story.js). */
ACM.Story = (function () {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  function st(game) { const S = game.state; if (!S.story) S.story = { stage: 0, met: false, seen: {}, tea: -1 }; return S.story; }
  const stage = (game) => st(game).stage;
  const hearts = (game, id) => ACM.NPC_HELPERS.heartsFor(((game.state.rel || {})[id] || { pts: 0 }).pts);
  const chapter = (game) => ACM.STORY_CHAPTERS.find((c) => c.k === stage(game) + 1) || null;
  const npcName = (id) => ((ACM.NPCS || []).find((n) => n.id === id) || {}).name || id;

  function checks(game, ch) {
    const S = game.state, n = ch.need, out = [];
    if (n.deliveries) out.push([`Deliver ${n.deliveries} commission${n.deliveries > 1 ? "s" : ""}`, (S.completedProjectIds || []).filter((id) => !/^heritage_/.test(id)).length >= n.deliveries]);
    (n.permits || []).forEach((id) => { const t = ACM.SAFETY.find((x) => x.id === id); out.push([`Safety permit: ${t.name}`, ACM.Safety.has(game, id)]); });
    (n.hearts || []).forEach(([id, h]) => out.push([`${npcName(id)} at ${h}♥`, hearts(game, id) >= h]));
    // tools the piece needs (read from its workflow) and the certification tier to buy them
    const proj = ACM.PROJECTS.find((p) => p.id === "heritage_" + ch.k);
    if (proj) {
      const miss = (proj.workflow || []).filter((id) => !(S.ownedTools || []).includes(id)).map((id) => (ACM.TOOLS.find((x) => x.id === id) || { name: id }).name);
      out.push([miss.length ? `Tools to buy: ${miss.join(", ")}` : "All tools for this piece owned", miss.length === 0]);
    }
    if (ch.k >= 2) out.push([`Certified Tier ${ch.k}`, (S.certifiedTier || 1) >= ch.k]);
    if (n.friends) { const c = (ACM.NPCS || []).filter((x) => hearts(game, x.id) >= 3).length; out.push([`Five villagers at 3♥ (${c}/5)`, c >= n.friends]); }
    return out;
  }
  // tier gating mirrors the board: floor(stars + 0.35) >= chapter tier
  const tierOK = (game, ch) => Math.max(1, Math.floor(game.state.stars + 0.35)) >= ch.k;
  function ready(game, ch) { return tierOK(game, ch) && checks(game, ch).every((c) => c[1]); }

  function objective(game) {
    const ch = chapter(game);
    if (!ch) return null;
    const S = game.state;
    const pend = (S.products || []).find((p) => p.pid === "heritage_" + ch.k);
    if (pend) return `<strong>Hand over ${esc(ch.piece)}</strong> to Nell at the old family house gate (south-east of the plaza).`;
    if (S.accepted.includes("heritage_" + ch.k)) return `Nell's request: build <strong>${esc(ch.piece)}</strong> (Layout Bench → Assembly Table).`;
    if (ready(game, ch)) return `<strong>Nell is waiting</strong> at the old family house (south-east of the plaza, along the road past your homestead). Visit the gate.`;
    return null;
  }

  function dialogue(lines) { return lines.map((l) => `<p style="margin-top:8px;${/^\(/.test(l) ? "font-style:italic;color:#6b5a45;" : ""}">${esc(l)}</p>`).join(""); }

  function openHouse(game) {
    const S = game.state, s = st(game), ch = chapter(game);
    if (!s.met) { s.met = true; game.logEvent("story", { ev: "first_visit" }); }
    if (!ch) { game.enterBuilding("legacy"); return; }
    const pend = (game.state.products || []).find((p) => p.pid === "heritage_" + ch.k);
    const accepted = S.accepted.includes("heritage_" + ch.k);
    const cl = checks(game, ch);
    const tierLine = [`Rating tier ${ch.k} (★ ${(ch.k - 0.35).toFixed(2)}+)`, tierOK(game, ch)];
    const list = [tierLine].concat(cl).map((c) => `<li style="list-style:none;">${c[1] ? "✔" : "✘"} ${esc(c[0])}</li>`).join("");
    const intro = (ready(game, ch) || accepted) ? dialogue(ch.intro) : `<p style="margin-top:8px;">The iron gate creaks open an inch. Behind it, the burned house stands in the light. ${s.stage === 0 ? "A hum drifts from the kitchen and fades." : "You feel Nell listening."}</p><p class="item-meta" style="margin-top:8px;">${esc(ch.hint)}</p>`;
    const done = s.stage > 0 ? `<p class="item-meta">Pieces restored: <strong>${s.stage}/5</strong></p>` : "";
    game.openModal(`The Old Family House: ${ch.title}`, `
      <div class="npc-banner" style="background:#fff2e0;"><div><strong>Chapter ${ch.k} of 5: ${esc(ch.piece)}</strong>${done}</div></div>
      ${intro}
      <div class="item-card" style="margin-top:10px;"><div class="item-title">Before Nell can ask this of you</div><ul style="margin-left:6px;">${list}</ul></div>
      <div class="dialog-actions">${pend ? game.handOverButtons("gate") : accepted ? `<span class="tag" style="background:#bbf7d0;">Accepted: find it in your commissions</span>` : ready(game, ch) ? `<button class="btn-brass" id="st-accept">Take on "${esc(ch.piece)}"</button>` : ""}<button class="btn-wood btn-sm" data-act="close">Leave</button></div>`);
    const b = document.getElementById("st-accept");
    if (b) b.onclick = () => {
      if (game._t.acceptJob("heritage_" + ch.k)) { game.logEvent("story", { ev: "accept", k: ch.k }); game.toast(`Heritage piece accepted: ${ch.piece}`, "good"); game.closeModal(); }
    };
  }

  function onDelivered(game, job) {
    const s = st(game), ch = ACM.STORY_CHAPTERS.find((c) => c.k === job.chapter);
    if (!ch || s.stage >= ch.k) return;
    s.stage = ch.k;
    game.logEvent("story", { ev: "piece", k: ch.k });
    game.state.stars = Math.min(5, game.state.stars + 0.05);
    game.updateHUD();
    if (ch.k < 5) {
      game.openModal(`${ch.title} restored`, `${dialogue(ch.done)}<p class="item-meta" style="margin-top:10px;">Pieces restored: <strong>${s.stage}/5</strong>. Visit the gate again when you are ready for the next.</p><div class="dialog-actions"><button class="btn-brass" data-act="close">Continue</button></div>`);
    } else {
      game.state.legacyTitle = "Keeper of the Family Kitchen";
      game.state.stars = Math.min(5, game.state.stars + 0.1);
      game.openModal("The Kitchen Is Home Again", `${dialogue(ACM.STORY_ENDING)}<p class="item-meta" style="margin-top:10px;">The old house is now open to you. Nell's kettle gives you a cup of tea once a day, enough for a fresh start.</p><div class="dialog-actions"><button class="btn-brass" data-act="close">Thank you, Nell</button></div>`);
    }
    if (ACM.Audio) ACM.Audio.sfx("heart");
  }

  const TEA = [
    "\"Sit, dear. You look like a board that's been planed too thin.\"",
    "\"He used to say a kitchen is just a workshop with better smells.\"",
    "\"Mind the pantry shelf, the third one hums when it's pleased.\"",
    "\"Peggy. Ha. He'd be so proud, you know.\""
  ];
  function tea(game) {
    const S = game.state, s = st(game);
    const line = TEA[(S.dayCount + s.stage) % TEA.length];
    if (s.tea === S.dayCount) { game.openModal("Nell's Kitchen", `<p>${esc(line)}</p><p class="item-meta" style="margin-top:8px;">You've had your tea today. Come back tomorrow.</p><div class="dialog-actions"><button class="btn-wood btn-sm" data-act="close">Close</button></div>`); return; }
    s.tea = S.dayCount;
    S.energy = Math.min(S.maxEnergy, S.energy + 40);
    game.updateHUD(); game.logEvent("story", { ev: "tea" });
    if (ACM.Audio) ACM.Audio.sfx("heart");
    game.openModal("Nell's Kitchen", `<p>${esc(line)}</p><p style="margin-top:8px;color:#15803d;font-weight:bold;">A warm cup of tea. +40 energy.</p><div class="dialog-actions"><button class="btn-wood btn-sm" data-act="close">Close</button></div>`);
  }

  return { openHouse, onDelivered, tea, objective, stage, chapter };
})();
