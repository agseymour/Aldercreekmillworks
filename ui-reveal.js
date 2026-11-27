window.ACM = window.ACM || {};

/**
 * Progressive reveal: show the next step in full, keep what's done in a tab, and keep future steps out of sight
 * (or as a hint) until they become relevant. Panes are switched in the page with no re-render.
 */
ACM.Reveal = (function () {
  let n = 0;
  /** panes: [{ key, label, html, count? }]. The first pane is shown first unless `active` names another. */
  function tabs(panes, active) {
    const id = "rv" + (++n);
    panes = panes.filter((p) => p && p.html);
    if (!panes.length) return "";
    const on = (active && panes.find((p) => p.key === active)) || panes[0];
    if (panes.length === 1) return `<div class="rv-pane">${on.html}</div>`;
    return `<div class="rv" id="${id}">
      <div class="rv-tabs" role="tablist">${panes.map((p) => `<button type="button" role="tab" class="rv-tab ${p === on ? "on" : ""}" data-rv="${id}" data-key="${p.key}">${p.label}${p.count != null ? ` <span class="rv-n">${p.count}</span>` : ""}</button>`).join("")}</div>
      ${panes.map((p) => `<div class="rv-pane" role="tabpanel" data-rvp="${id}" data-key="${p.key}" ${p === on ? "" : "hidden"}>${p.html}</div>`).join("")}
    </div>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".rv-tab");
    if (!b) return;
    const id = b.dataset.rv;
    document.querySelectorAll(`.rv-tab[data-rv="${id}"]`).forEach((x) => x.classList.toggle("on", x === b));
    document.querySelectorAll(`[data-rvp="${id}"]`).forEach((p) => { p.hidden = p.dataset.key !== b.dataset.key; });
  });
  /** a muted card for something that isn't available yet */
  const locked = (title, why) => `<div class="item-card locked"><div class="item-title">🔒 ${title}</div><p class="item-meta">${why}</p></div>`;
  return { tabs, locked };
})();
