window.ACM = window.ACM || {};

/**
 * Keeps the player on track without nagging:
 *  - the current mission on the pause screen (Esc) and in the bar under the map
 *  - a morning bulletin once per game day
 *  - a smartphone with one feature: texts from neighbours about the current mission (at most 2 a day)
 *  - a full-screen button
 */
ACM.Guide = (function () {
  const G = () => ACM.Game, S = () => ACM.Game && ACM.Game.state;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const modalOpen = () => !document.getElementById("modal-overlay").classList.contains("hidden");
  const npc = (id) => (ACM.NPCS || []).find((n) => n.id === id);
  const nm = (id) => (npc(id) ? npc(id).name.split(" ")[0] : id);
  const hhmm = (m) => { m = Math.round(m); const h = Math.floor(m / 60) % 24, mm = m % 60; return ((h + 11) % 12 + 1) + ":" + String(mm).padStart(2, "0") + (h < 12 ? " AM" : " PM"); };

  // ---------------------------------------------------------------- mission card
  // The on-map mission card was removed (the goal already shows in the bar under the map and on the
  // pause screen). refresh() stays so existing callers keep working; it clears any old card.
  function refresh() {
    const el = document.getElementById("mission-card");
    if (el) el.remove();
  }

  // ---------------------------------------------------------------- morning bulletin
  function bulletin() {
    const s = S(), ms = G().mission();
    s.bulletinDay = s.dayCount;
    let el = document.getElementById("bulletin");
    if (el) el.remove();
    el = document.createElement("div");
    el.id = "bulletin";
    const wx = { Sunny: "Clear skies today.", Cloudy: "Grey and cloudy.", Rain: "Rain today. Dress for mud.", Snow: "Snow is falling.", Windy: "Breezy out." }[s.weather] || "";
    el.innerHTML = `<div class="bl-head">📰 Alder Creek Bulletin <span>${esc(s.season)}, Day ${s.dayCount}</span></div>
      <div class="bl-body">${wx} <strong>Today:</strong> ${ms ? ms.html : "Look around the village."}</div>
      <button class="btn-brass btn-sm" id="bl-ok">Got it</button>`;
    document.getElementById("viewport-wrap").appendChild(el);
    const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 400); };
    el.querySelector("#bl-ok").onclick = close;
    setTimeout(close, 16000);
    if (ACM.Audio) ACM.Audio.sfx("good");
  }

  // ---------------------------------------------------------------- phone
  function phone() {
    const s = S();
    if (!s.phone) s.phone = { msgs: [], day: -1, n: 0, slots: [], last: {}, mute: false };
    return s.phone;
  }
  function unread() { return phone().msgs.filter((m) => !m.read).length; }
  function badge() {
    const b = document.getElementById("phone-badge"); if (!b) return;
    const n = S() ? unread() : 0;
    b.textContent = n; b.classList.toggle("hidden", n === 0);
    const btn = document.getElementById("btn-phone"); if (btn) btn.classList.toggle("ring", n > 0);
  }

  /** what would a neighbour text about right now? */
  function compose(ms) {
    const s = S(); if (!ms) return null;
    const j = ms.job;
    switch (ms.key) {
      case "tut:meet_seymour": return { from: "seymour", text: "Hi, Seymour at the hardware shop. I hear you're setting up a woodshop! Come by and say hello. I'm open 7:30 to 6." };
      case "tut:first_delivery": return { from: "mateo", text: "Mateo here. Heard you have your first commission. Stop by the Blueprint Desk first, then the Layout Bench. Take your time measuring!" };
      case "tut:fell": return { from: "routledge", text: "Routledge at the sawmill. There are good trees by the woodlot just waiting. Equip your axe and keep chopping, they take a few swings each." };
      case "tut:rack": return { from: "seymour", text: "Got a log yet? Mill it into boards at the rack by your workshop, or sell it for some pocket money." };
      case "tut:plant": return { from: "routledge", text: "For every tree you fell, plant one! I have saplings at the nursery if you're short." };
      case "tut:forage": return { from: "clara", text: "Clara here. The berries are ripe in the woods this week. Free snack, if you're quick!" };
      case "tut:meet_clara": return { from: "clara", text: "Hi! Clara from the Harbor Café. Come by for a hot meal when you can. A woodworker needs to eat." };
      case "tut:tier2": return { from: "mateo", text: "Keep up the good work. A few more happy customers and the Town Board will trust you with bigger jobs." };
      case "hand": {
        const id = ms.npc || "mateo";
        return { from: id, text: `Hi, it's ${nm(id)}. Is my ${j ? j.title : "order"} ready? I'd love to see it when you have a minute.` };
      }
      case "story": return { from: "unknown", text: "…the kitchen is quiet today. Come by the gate when you can." };
      case "job": {
        const p = s.jobProgress || {};
        if (ms.missingTool) return { from: "seymour", text: `Seymour here. The ${j.title} needs a tool you don't have yet. I've got it in stock when you want to stop by.` };
        if (!p.lumberAssigned) return { from: "seymour", text: `Hi, Seymour. When are you coming by to get lumber lined up for your ${j.title.toLowerCase()}? I can help you pick good boards.` };
        const cn = (ACM.NPCS || []).find((n) => j.client && j.client.indexOf(n.clientKey) === 0);
        return { from: cn ? cn.id : "mateo", text: `No rush on the ${j.title.toLowerCase()}, but I'm looking forward to it!` };
      }
      case "boat": return { from: "doucet", text: "Captain Doucet. They say you're good with cedar. I need a row boat and the Town Board has the commission. The river's calling." };
      case "board": return { from: "mateo", text: "New postings went up at the Town Board this morning. Come take a look when you're free." };
    }
    return null;
  }

  function sendText(msg, key) {
    const p = phone(), s = S();
    p.msgs.unshift({ id: "m" + s.dayCount + "_" + p.msgs.length, d: s.dayCount, m: Math.round(s.timeMin), from: msg.from, text: msg.text, key, read: false });
    if (p.msgs.length > 40) p.msgs.length = 40;
    p.last[key] = s.dayCount;
    G().logEvent("text", { from: msg.from, key });
    if (ACM.Audio) ACM.Audio.sfx("heart");
    G().toast(`📱 Text from ${msg.from === "unknown" ? "Unknown number" : nm(msg.from)}`, "good");
    badge();
  }
  function maybeText() {
    const s = S(), p = phone();
    if (s.dayCount !== p.day) {                       // a new day: pick two quiet times for possible texts
      p.day = s.dayCount; p.n = 0;
      p.slots = [570 + Math.floor(Math.random() * 90), 870 + Math.floor(Math.random() * 120)];
    }
    if (p.mute || p.n >= 2 || s.timeMin < p.slots[p.n] || s.timeMin > 1080 || modalOpen()) return;
    p.n++;
    const ms = G().mission(), key = ms && ms.key;
    if (!key || (p.last[key] != null && s.dayCount - p.last[key] < 2)) return;   // don't repeat the same nudge within 2 days
    const msg = compose(ms);
    if (msg) sendText(msg, key);
  }
  function openPhone() {
    const s = S(), p = phone();
    const bubble = (m) => `<div class="ph-msg ${m.read ? "" : "new"}"><div class="ph-from">${m.from === "unknown" ? "Unknown number" : esc(npc(m.from) ? npc(m.from).name : m.from)} <span>Day ${m.d}, ${hhmm(m.m)}</span></div><div class="ph-text">${esc(m.text)}</div></div>`;
    G().openModal("📱 Phone", `<div class="ph-wrap"><p class="item-meta" style="margin:0 0 6px;">Texts from neighbours about what to do next. ${p.mute ? "Texts are muted." : "You'll get one or two a day at most."}</p>
      <div class="ph-list">${p.msgs.length ? p.msgs.map(bubble).join("") : '<p class="item-meta">No messages yet.</p>'}</div>
      <div class="dialog-actions"><button class="btn-wood btn-sm" id="ph-mute">${p.mute ? "Unmute texts" : "Mute texts"}</button><button class="btn-brass btn-sm" data-act="close" data-space>Close</button></div></div>`);
    p.msgs.forEach((m) => { m.read = true; });
    badge();
    document.getElementById("ph-mute").onclick = () => { p.mute = !p.mute; openPhone(); };
  }

  // ---------------------------------------------------------------- full screen
  const fsOK = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  function toggleFs() {
    const d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  }
  function fsChanged() {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    document.body.classList.toggle("fs", on);
    const b = document.getElementById("btn-fullscreen"); if (b) b.textContent = on ? "⤡" : "⛶";
  }

  function init() {
    const hud = document.querySelector(".hud-actions");
    if (hud && !document.getElementById("btn-phone")) {
      const ph = document.createElement("button");
      ph.className = "btn-wood btn-sm"; ph.id = "btn-phone"; ph.title = "Phone [P]";
      ph.innerHTML = '📱<span id="phone-badge" class="hidden">0</span>';
      ph.onclick = () => openPhone();
      hud.insertBefore(ph, document.getElementById("btn-sound"));
      if (fsOK()) {
        const fb = document.createElement("button");
        fb.className = "btn-wood btn-sm"; fb.id = "btn-fullscreen"; fb.title = "Full screen"; fb.textContent = "⛶";
        fb.onclick = toggleFs;
        hud.insertBefore(fb, document.getElementById("btn-sound"));
      }
    }
    window.addEventListener("resize", () => refresh());
    document.addEventListener("fullscreenchange", () => setTimeout(refresh, 100));
    document.addEventListener("fullscreenchange", fsChanged);
    document.addEventListener("webkitfullscreenchange", fsChanged);
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if ((e.key === "p" || e.key === "P") && S() && S().tut) { e.preventDefault(); if (modalOpen()) G().closeModal(); else openPhone(); }
    });
    setInterval(() => {
      const s = S(); if (!s || !s.tut || !G().mission) return;
      badge(); refresh();
      if (modalOpen()) return;
      if (s.bulletinDay !== s.dayCount && s.timeMin >= 360) bulletin();
      else maybeText();
    }, 1500);
  }
  window.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  return { refresh, bulletin, openPhone, maybeText, compose, phone, toggleFs };
})();
