window.ACM = window.ACM || {};

/** The River Dock: where the row boat is launched. The secret area it leads to is not built yet, so the trip ends in a teaser. */
ACM.Dock = (function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function open(game) {
    const S = game.state;
    const pend = game.productsFor ? game.productsFor("dock") : [];
    if (pend.length) {
      game.openModal("River Dock", `<p>Your new row boat is ready to go in the water.</p>
        <div class="dialog-actions">${game.handOverButtons("dock")}<button class="btn-wood btn-sm" data-act="close">Not yet</button></div>`);
      return;
    }
    if (!S.boat) {
      const tierOK = Math.max(1, Math.floor(S.stars + 0.35));
      game.openModal("River Dock", `<p>A little pier juts out into the river. The water is dark and quiet, and it flows away to the south, out of the village.</p>
        <p class="item-meta">${tierOK >= 3 ? "Captain Doucet is looking for someone to build a row boat. Check the Town Board." : "Someday, with the skills of a Tier 3 woodworker, you might build something to float here."}</p>
        <div class="dialog-actions"><button class="btn-wood btn-sm" data-act="close">OK</button></div>`);
      return;
    }
    game.openModal("River Dock", `<p>Your cedar row boat bobs against the pier. The current tugs gently downstream.</p>
      <div class="dialog-actions"><button class="btn-brass" id="dk-row" data-space>Row downriver</button><button class="btn-wood btn-sm" data-act="close">Stay in the village</button></div>`);
    document.getElementById("dk-row").onclick = () => row(game);
  }

  function launched(game) {
    game.openModal("Launched!", `<p><strong>Your row boat is in the water!</strong></p>
      <p class="item-meta">Captain Doucet runs his hand along the gunwale and grins. "She'll float. Where she goes is up to you. They say the river leads somewhere the maps don't show."</p>
      <p class="item-meta">Visit the River Dock whenever you like to row downriver.</p>
      <div class="dialog-actions"><button class="btn-brass" data-act="close" data-space>Wonderful</button></div>`);
  }

  function row(game) {
    const S = game.state;
    S.secret = S.secret || { visits: 0 };
    S.secret.visits++;
    game.logEvent("secret_stub", { n: S.secret.visits });
    game.spendTime(30, 0);
    game.openModal("Beyond the Bend", `<div class="speech">You push off and the village slides away. Reeds close in on both banks. Past the last bend the river widens, and mist hangs low over the water. Something is waiting at the far end, but you can't quite make it out.</div>
      <p class="item-meta" style="margin-top:8px;">The secret area isn't ready yet. Come back after the next update. Your boat will be waiting.</p>
      <div class="dialog-actions"><button class="btn-brass" data-act="close" data-space>Row back to the dock</button></div>`);
  }
  return { open, launched };
})();
