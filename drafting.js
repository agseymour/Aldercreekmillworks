window.ACM = window.ACM || {};

/**
 * Drafting Table: guided drafting lessons (scale, drawing, dimensioning, adding up), then a free-design
 * mode where the student draws the parts of a small object on grid paper, labels every dimension,
 * and gets a cut list + lumber estimate. A saved design becomes a buildable commission
 * (ACM.PROJECTS entry with design:true) that is built with the normal mini-games and handed in
 * at the Town Hall board for pay scored on plan accuracy.
 *
 * state.drafting = { lessons: { id: {done, att} } }     state.designs = [{ id, name, cat, parts, score, ... }]
 */
ACM.Drafting = (function () {
  const COLS = 28, ROWS = 14, CELL = 24;
  const fmt = (v) => ACM.ArtDiagrams.formatFraction(v, 8);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // "11 1/2", "11-1/2", "3/4", "11.5", with an optional inch mark. Returns a number or null.
  function parseInches(txt) {
    let s = String(txt == null ? "" : txt).trim().replace(/["”″]|in(ch(es)?)?\.?$/gi, "").trim().replace(/-/g, " ");
    if (!s) return null;
    let m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[1] + +m[2] / +m[3];
    m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[1] / +m[2];
    m = s.match(/^\d+(\.\d+)?$/);
    return m ? parseFloat(s) : null;
  }
  const close = (a, b) => a != null && Math.abs(a - b) <= 1 / 16 + 1e-9;
  const dims = (r) => ({ L: Math.max(r.w, r.h), W: Math.min(r.w, r.h) });

  // ---------------------------------------------------------------- grid paper pad
  function makePad(canvas, o) {
    const snap = o.snap || 1, rects = o.rects || [];
    canvas.width = COLS * CELL; canvas.height = ROWS * CELL;
    const ctx = canvas.getContext("2d");
    let drag = null, sel = -1;
    const api = { rects, get sel() { return sel; }, set sel(v) { sel = v; draw(); }, draw, onChange: o.onChange || (() => {}) };

    function draw() {
      ctx.fillStyle = "#eef3f8"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i <= COLS; i++) { ctx.strokeStyle = i % 4 === 0 ? "#8fb0cf" : "#c9d9e8"; ctx.lineWidth = i % 4 === 0 ? 1.2 : 1; ctx.beginPath(); ctx.moveTo(i * CELL + .5, 0); ctx.lineTo(i * CELL + .5, canvas.height); ctx.stroke(); }
      for (let j = 0; j <= ROWS; j++) { ctx.strokeStyle = j % 4 === 0 ? "#8fb0cf" : "#c9d9e8"; ctx.lineWidth = j % 4 === 0 ? 1.2 : 1; ctx.beginPath(); ctx.moveTo(0, j * CELL + .5); ctx.lineTo(canvas.width, j * CELL + .5); ctx.stroke(); }
      ctx.fillStyle = "#4a6a8a"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
      for (let i = 4; i < COLS; i += 4) ctx.fillText(i + '"', i * CELL + 2, 10);
      for (let j = 4; j < ROWS; j += 4) ctx.fillText(j + '"', 2, j * CELL - 2);
      const all = drag ? rects.concat([drag]) : rects;
      all.forEach((r, i) => {
        const x = r.x * CELL, y = r.y * CELL, w = r.w * CELL, h = r.h * CELL;
        ctx.fillStyle = r.fixed ? "rgba(80,110,150,.30)" : "rgba(196,140,70,.45)"; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = i === sel ? "#b42b2b" : "#6b4423"; ctx.lineWidth = i === sel ? 3 : 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        const tag = [r.name, r.label].filter(Boolean).join("  ");
        if (tag) { ctx.fillStyle = "#2b1d10"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.fillText(tag, x + w / 2, y + h / 2 + 4, Math.max(20, w - 4)); }
        if (r.mark) { ctx.fillStyle = "#0f5132"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillText(r.mark, x + 4, y + 14); }
      });
    }
    const pos = (e) => {
      const b = canvas.getBoundingClientRect();
      const px = (e.clientX - b.left) * (canvas.width / b.width) / CELL, py = (e.clientY - b.top) * (canvas.height / b.height) / CELL;
      return { x: Math.max(0, Math.min(COLS, Math.round(px / snap) * snap)), y: Math.max(0, Math.min(ROWS, Math.round(py / snap) * snap)), rx: px, ry: py };
    };
    if (!o.readonly) {
      canvas.onpointerdown = (e) => { const p = pos(e); drag = { x: p.x, y: p.y, w: 0, h: 0, _x0: p.x, _y0: p.y, _rx: p.rx, _ry: p.ry }; canvas.setPointerCapture(e.pointerId); };
      canvas.onpointermove = (e) => {
        if (!drag) return; const p = pos(e);
        drag.x = Math.min(drag._x0, p.x); drag.y = Math.min(drag._y0, p.y); drag.w = Math.abs(p.x - drag._x0); drag.h = Math.abs(p.y - drag._y0); draw();
      };
      canvas.onpointerup = (e) => {
        if (!drag) return; const d = drag; drag = null;
        if (d.w >= snap && d.h >= snap) {
          if (o.max && rects.length >= o.max) { o.full && o.full(); draw(); return; }
          rects.push(Object.assign({ x: d.x, y: d.y, w: d.w, h: d.h }, o.fresh ? o.fresh(rects.length) : {})); sel = rects.length - 1;
        } else {
          const hit = rects.findIndex((r) => d._rx >= r.x && d._rx <= r.x + r.w && d._ry >= r.y && d._ry <= r.y + r.h);
          sel = hit; // click on a part selects it, click on empty paper deselects
        }
        draw(); api.onChange();
      };
    }
    api.removeSel = () => { if (sel >= 0) { rects.splice(sel, 1); sel = -1; draw(); api.onChange(); } };
    api.clear = () => { rects.length = 0; sel = -1; draw(); api.onChange(); };
    draw();
    return api;
  }

  // ---------------------------------------------------------------- guided lessons
  const matchDims = (r, L, W) => { const d = dims(r); return Math.abs(d.L - L) < 0.01 && Math.abs(d.W - W) < 0.01; };
  const LESSONS = [
    { id: "scale", title: "1. Draw to scale", blurb: "On grid paper, one square is one inch. Drag to draw boards the right size.", type: "draw",
      steps: [{ say: "Draw a board <strong>8\" long and 3\" wide</strong>.", need: [[8, 3]] }] },
    { id: "shelf", title: "2. Draw a shelf plan", blurb: "A plan is a drawing of every part. Draw the back and the shelf board.", type: "draw",
      steps: [{ say: "Draw a <strong>back board 10\" × 6\"</strong> and a <strong>shelf board 10\" × 2\"</strong> (two rectangles).", need: [[10, 6], [10, 2]] }] },
    { id: "read", title: "3. Read the dimensions", blurb: "A plan is no use without measurements. Read them off the paper.", type: "read",
      rects: [{ x: 1, y: 1, w: 11.5, h: 4, fixed: 1, name: "A" }, { x: 14, y: 1, w: 7, h: 5.5, fixed: 1, name: "B" }, { x: 1, y: 7, w: 12, h: 2.5, fixed: 1, name: "C" }] },
    { id: "add", title: "4. Add it up", blurb: "Check your sums before you cut. Wood can't be glued back on.", type: "math",
      qs: [{ q: "A shelf unit has two sides, each <strong>3/4\"</strong> thick, with a <strong>10 1/2\"</strong> shelf between them. How wide is the finished unit?", a: 12 },
           { q: "You cut an <strong>11 1/2\"</strong> piece from a <strong>24\"</strong> board. The saw blade removes <strong>1/8\"</strong> (the kerf). How much board is left?", a: 12.375 }] }
  ];
  const lessonDone = (st, id) => !!(st.drafting && st.drafting.lessons && st.drafting.lessons[id] && st.drafting.lessons[id].done);
  const allLessons = (st) => LESSONS.every((l) => lessonDone(st, l.id));

  function recordLesson(game, id, ok) {
    const st = game.state;
    if (!st.drafting) st.drafting = { lessons: {} };
    const r = st.drafting.lessons[id] || (st.drafting.lessons[id] = { done: false, att: 0 });
    r.att++; if (ok) r.done = true;
    game.logEvent("draft", { lesson: id, ok: !!ok, att: r.att });
    ACM.CloudSync.saveToCloud(st);
  }

  function openLesson(game, id) {
    const L = LESSONS.find((x) => x.id === id);
    const body = (inner) => game.openModal("Drafting Table: " + L.title, `<p class="item-meta">${L.blurb}</p>${inner}<div id="dl-msg" style="margin:8px 0;min-height:1.4em;font-weight:bold"></div><div class="dialog-actions"><button class="btn-wood" id="dl-back">Back to the desk</button></div>`);
    const msg = (t, good) => { const m = document.getElementById("dl-msg"); m.textContent = t; m.style.color = good ? "#166534" : "#b91c1c"; };
    const finish = (ok, extra) => {
      recordLesson(game, id, ok);
      if (ok) { game.toast("Lesson complete: " + L.title.replace(/^\d\. /, ""), "good"); if (ACM.Audio) ACM.Audio.sfx("good"); }
      msg(ok ? "Correct! " + (extra || "") : extra || "Not quite. Check it and try again.", ok);
      if (ok) setTimeout(() => open(game), 900);
    };
    if (L.type === "draw") {
      const step = L.steps[0];
      body(`<p>${step.say}</p><canvas id="dl-pad" style="width:100%;max-width:672px;border:2px solid #6b4423;border-radius:6px;touch-action:none"></canvas>
        <div style="display:flex;gap:8px;margin-top:8px"><button class="btn-brass" id="dl-check">Check my drawing</button><button class="btn-wood btn-sm" id="dl-del">Delete selected</button><button class="btn-wood btn-sm" id="dl-clr">Clear</button></div>`);
      const pad = makePad(document.getElementById("dl-pad"), { snap: 1, max: 6 });
      document.getElementById("dl-del").onclick = () => pad.removeSel();
      document.getElementById("dl-clr").onclick = () => pad.clear();
      document.getElementById("dl-check").onclick = () => {
        const left = pad.rects.slice(); let miss = [];
        step.need.forEach(([l, w]) => { const i = left.findIndex((r) => matchDims(r, l, w)); if (i >= 0) left.splice(i, 1); else miss.push(`${l}" × ${w}"`); });
        if (!miss.length && !left.length) finish(true, "Your drawing matches the sizes.");
        else if (miss.length) finish(false, "Still missing a part that measures " + miss.join(" and ") + ". Count the squares along each edge.");
        else finish(false, "Close, but there's an extra rectangle. Delete it and check again.");
      };
    } else if (L.type === "read") {
      const rows = L.rects.map((r) => `<div class="row" style="display:flex;gap:8px;align-items:center;margin:3px 0"><strong>${r.name}</strong> length <input class="dl-in" data-i="${L.rects.indexOf(r)}" data-k="L" size="8" placeholder='e.g. 11 1/2'> width <input class="dl-in" data-i="${L.rects.indexOf(r)}" data-k="W" size="8" placeholder="e.g. 3/4"></div>`).join("");
      body(`<p>Read the <strong>length</strong> (longer side) and <strong>width</strong> (shorter side) of each board in inches. Fractions like <em>7 1/2</em> are fine. One square is one inch; the thick lines are every 4 inches.</p>
        <canvas id="dl-pad" style="width:100%;max-width:672px;border:2px solid #6b4423;border-radius:6px"></canvas><div style="margin-top:8px">${rows}</div><button class="btn-brass" id="dl-check" style="margin-top:8px">Check my readings</button>`);
      makePad(document.getElementById("dl-pad"), { rects: L.rects.map((r) => Object.assign({}, r)), readonly: true });
      document.getElementById("dl-check").onclick = () => {
        let ok = 0, n = 0;
        document.querySelectorAll(".dl-in").forEach((el) => { const d = dims(L.rects[+el.dataset.i]); n++; if (close(parseInches(el.value), d[el.dataset.k])) { ok++; el.style.background = "#dcfce7"; } else el.style.background = "#fee2e2"; });
        finish(ok === n, ok === n ? "Every measurement is right." : `${ok} of ${n} correct. The red boxes are off: recount the squares.`);
      };
    } else {
      body(`${L.qs.map((q, i) => `<div style="margin:8px 0"><p>${q.q}</p><input class="dl-ans" data-i="${i}" size="10" placeholder="inches"> <span class="item-meta">(fractions OK, like 12 3/8)</span></div>`).join("")}<button class="btn-brass" id="dl-check">Check my sums</button>`);
      document.getElementById("dl-check").onclick = () => {
        let ok = 0;
        document.querySelectorAll(".dl-ans").forEach((el) => { const good = close(parseInches(el.value), L.qs[+el.dataset.i].a); if (good) ok++; el.style.background = good ? "#dcfce7" : "#fee2e2"; });
        finish(ok === L.qs.length, ok === L.qs.length ? "Adding up before cutting saves lumber." : "Re-read the question and add or subtract step by step.");
      };
    }
    document.getElementById("dl-back").onclick = () => open(game);
  }

  // ---------------------------------------------------------------- free design
  const PARTS = ["Base", "Side", "End", "Lid", "Back", "Front", "Shelf", "Seat", "Leg", "Rail", "Roof"];
  const CATS = {
    box: { name: "Storage box", need: ["Base", "Side", "End", "Lid"], base: 55 },
    shelf: { name: "Wall shelf", need: ["Back", "Side", "Shelf"], base: 68 },
    stool: { name: "Stool", need: ["Seat", "Leg", "Rail"], base: 78 },
    planter: { name: "Planter box", need: ["Base", "Side", "End"], base: 52 },
    bird: { name: "Birdhouse", need: ["Base", "Front", "Back", "Roof"], base: 60 }
  };
  const MAXLEN = 24, MAXW = 11, MAXPARTS = 8;

  function summarize(parts, cat) {
    const c = CATS[cat];
    const names = parts.map((p) => p.name);
    const missing = c.need.filter((n) => !names.includes(n));
    let ok = 0, total = 0;
    parts.forEach((p) => { const d = dims(p); total += 2; if (close(parseInches(p.lenTxt), d.L)) ok++; if (close(parseInches(p.widTxt), d.W)) ok++; });
    const pieces = parts.reduce((x, p) => x + (p.qty || 1), 0);
    const area = parts.reduce((x, p) => { const d = dims(p); return x + d.L * d.W * (p.qty || 1); }, 0);
    const units = Math.max(1, Math.ceil((area * 0.75 / 144) * 1.25));
    const problems = [];
    parts.forEach((p) => { const d = dims(p); if (d.L > MAXLEN) problems.push(`${p.name} is ${fmt(d.L)} long; the longest board you can work is ${MAXLEN}".`); if (d.W > MAXW) problems.push(`${p.name} is ${fmt(d.W)} wide; the widest board is ${MAXW}".`); });
    return { missing, ok, total, score: total ? ok / total : 0, pieces, area, units, problems };
  }
  function pricing(st, cat, sum, designId) {
    const c = CATS[cat];
    const same = (st.designs || []).filter((d) => d.cat === cat && d.id !== designId).length;
    const builtBefore = designId ? (st.completedProjectIds || []).filter((id) => id === "design_" + designId).length : 0;
    const complexity = 1 + 0.03 * Math.min(10, sum.pieces);
    const planF = 0.5 + 0.5 * sum.score;
    const repeat = Math.pow(0.85, same) * Math.pow(0.6, builtBefore);
    return Math.max(12, Math.round(c.base * 0.8 * complexity * planF * repeat));
  }

  function projectFor(st, d) {
    const groups = {};
    d.parts.forEach((p) => { const dm = dims(p); const k = p.name + "|" + dm.L + "|" + dm.W; (groups[k] = groups[k] || { name: p.name, L: dm.L, W: dm.W, qty: 0 }).qty += p.qty || 1; });
    const cuts = Object.values(groups).slice(0, 6).map((g) => ({ part: `${g.name}${g.qty > 1 ? " (×" + g.qty + ")" : ""} (length)`, target: g.L, display: fmt(g.L) }));
    const sum = summarize(d.parts, d.cat);
    return {
      id: "design_" + d.id, design: true, title: d.name, client: "Alder Creek Market (your design)", tier: 1,
      desc: `Your own ${CATS[d.cat].name.toLowerCase()}: ${sum.pieces} pieces. Plan accuracy ${Math.round(d.score * 100)}%.`,
      lumberReq: { allowedIds: ["spf_s4s", "pine_s4s", "cedar_s4s"], preferredId: null, units: sum.units }, precisionDenom: 8, cuts,
      workflow: ["tape_measure", "framing_square", "crosscut_saw", "hammer"], requiresPilotHole: false,
      basePay: pricing(st, d.cat, sum, d.id), starGain: 0.12
    };
  }
  function register(st, d) {
    const p = projectFor(st, d), i = ACM.PROJECTS.findIndex((x) => x.id === p.id);
    if (i >= 0) ACM.PROJECTS[i] = p; else ACM.PROJECTS.push(p);
    return p;
  }
  function restore(st) { (st.designs || []).forEach((d) => register(st, d)); }

  function openDesigner(game, existing) {
    const st = game.state;
    const parts = existing ? existing.parts.map((p) => Object.assign({}, p)) : [];
    let cat = existing ? existing.cat : "box";
    const html = `
      <p class="item-meta">Draw each part as a rectangle (one square = 1 inch, snaps to ½"). Click a part to select it, then name it and <strong>write its dimensions yourself</strong>: the game checks them against your drawing.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;align-items:center">
        <input id="ds-name" placeholder="Name your design" maxlength="28" value="${esc(existing ? existing.name : "")}" style="flex:1;min-width:150px">
        <select id="ds-cat">${Object.entries(CATS).map(([k, c]) => `<option value="${k}" ${k === cat ? "selected" : ""}>${c.name}</option>`).join("")}</select>
      </div>
      <div id="ds-need" class="item-meta" style="margin-bottom:6px"></div>
      <canvas id="ds-pad" style="width:100%;max-width:672px;border:2px solid #6b4423;border-radius:6px;touch-action:none"></canvas>
      <div id="ds-edit" style="margin:8px 0;padding:8px;border:1px dashed #6b4423;border-radius:6px"></div>
      <div id="ds-sum" class="item-meta"></div>
      <div id="ds-msg" style="margin:6px 0;font-weight:bold;min-height:1.3em"></div>
      <div class="dialog-actions"><button class="btn-brass" id="ds-save">Save design</button><button class="btn-wood" id="ds-back">Back to the desk</button></div>`;
    game.openModal("Drafting Table: Design an object", html);
    const $ = (id) => document.getElementById(id);
    const pad = makePad($("ds-pad"), { snap: 0.5, rects: parts, max: MAXPARTS, fresh: () => ({ name: "", lenTxt: "", widTxt: "", qty: 1 }), full: () => { $("ds-msg").style.color = "#b91c1c"; $("ds-msg").textContent = `That's the maximum of ${MAXPARTS} parts.`; }, onChange: refresh });
    function refresh() {
      const c = CATS[cat], names = parts.map((p) => p.name);
      $("ds-need").innerHTML = `A ${c.name.toLowerCase()} needs: ` + c.need.map((n) => `<span class="tag" style="${names.includes(n) ? "background:#bbf7d0" : ""}">${n}</span>`).join(" ");
      parts.forEach((p) => { p.label = [p.lenTxt, p.widTxt].filter(Boolean).join(" × "); });
      pad.draw();
      const i = pad.sel, p = parts[i];
      if (!p) { $("ds-edit").innerHTML = '<span class="item-meta">Drag on the paper to draw a part. Click a part to name and measure it.</span>'; }
      else {
        const d = dims(p);
        $("ds-edit").innerHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <select id="pe-name">${["", ...PARTS].map((n) => `<option value="${n}" ${n === p.name ? "selected" : ""}>${n || "— part name —"}</option>`).join("")}</select>
          length <input id="pe-len" size="8" value="${esc(p.lenTxt)}" placeholder='e.g. 11 1/2'> width <input id="pe-wid" size="8" value="${esc(p.widTxt)}" placeholder="e.g. 5 1/2">
          × <input id="pe-qty" type="number" min="1" max="8" value="${p.qty || 1}" style="width:50px"> pcs
          <button class="btn-wood btn-sm" id="pe-del">Delete part</button></div>
          <div class="item-meta" style="margin-top:4px">Longer side = length, shorter side = width. (Count the squares.)</div>`;
        $("pe-name").onchange = (e) => { p.name = e.target.value; refresh(); };
        $("pe-len").oninput = (e) => { p.lenTxt = e.target.value; p.label = [p.lenTxt, p.widTxt].filter(Boolean).join(" × "); pad.draw(); stat(); };
        $("pe-wid").oninput = (e) => { p.widTxt = e.target.value; p.label = [p.lenTxt, p.widTxt].filter(Boolean).join(" × "); pad.draw(); stat(); };
        $("pe-qty").onchange = (e) => { p.qty = Math.max(1, Math.min(8, +e.target.value || 1)); stat(); };
        $("pe-del").onclick = () => pad.removeSel();
      }
      stat();
    }
    function stat() {
      const s = summarize(parts, cat);
      $("ds-sum").innerHTML = parts.length ? `${s.pieces} pieces · about <strong>${s.units}</strong> bd ft of lumber · accuracy is checked when you save` : "";
    }
    $("ds-cat").onchange = (e) => { cat = e.target.value; refresh(); };
    $("ds-back").onclick = () => open(game);
    $("ds-save").onclick = () => {
      const msg = (t, good) => { $("ds-msg").textContent = t; $("ds-msg").style.color = good ? "#166534" : "#b91c1c"; };
      const name = $("ds-name").value.trim();
      if (!name) return msg("Give your design a name first.");
      if (!parts.length || parts.some((p) => !p.name)) return msg("Every rectangle needs a part name. Click each one and choose it.");
      if (parts.some((p) => !p.lenTxt.trim() || !p.widTxt.trim())) return msg("Label the length and width of every part. A plan needs all its measurements.");
      if (parts.some((p) => parseInches(p.lenTxt) == null || parseInches(p.widTxt) == null)) return msg("Some dimensions aren't numbers. Use forms like 11 1/2, 3/4 or 5.5.");
      const s = summarize(parts, cat);
      if (s.missing.length) return msg(`A ${CATS[cat].name.toLowerCase()} also needs: ${s.missing.join(", ")}.`);
      if (s.problems.length) return msg(s.problems[0]);
      const id = existing ? existing.id : Date.now().toString(36);
      const d = { id, name, cat, parts: parts.map((p) => ({ name: p.name, x: p.x, y: p.y, w: p.w, h: p.h, lenTxt: p.lenTxt, widTxt: p.widTxt, qty: p.qty || 1 })), score: s.score, saved: st.dayCount };
      if (!Array.isArray(st.designs)) st.designs = [];
      const idx = st.designs.findIndex((x) => x.id === id);
      if (idx >= 0) st.designs[idx] = d; else st.designs.push(d);
      const proj = register(st, d);
      game.logEvent("design", { cat, parts: s.pieces, ok: s.ok, total: s.total, pay: proj.basePay });
      if (ACM.Audio) ACM.Audio.sfx("good");
      ACM.CloudSync.saveToCloud(st);
      game.toast(`Design saved: ${name}. Plan accuracy ${Math.round(s.score * 100)}%.`, "good");
      open(game);
    };
    refresh();
  }

  // ---------------------------------------------------------------- the desk
  function open(game) {
    const st = game.state;
    if (!st.drafting) st.drafting = { lessons: {} };
    const unlocked = allLessons(st);
    const lessons = LESSONS.map((l) => `<div class="item-card ${lessonDone(st, l.id) ? "owned" : ""}"><div><div class="item-title">${l.title}</div><p class="item-meta">${l.blurb}</p></div>
      <button class="${lessonDone(st, l.id) ? "btn-wood" : "btn-brass"} btn-sm" data-dl="${l.id}">${lessonDone(st, l.id) ? "Practise again" : "Start lesson"}</button></div>`).join("");
    const designs = (st.designs || []).map((d) => {
      const pid = "design_" + d.id, p = ACM.PROJECTS.find((x) => x.id === pid) || register(st, d);
      const acc = st.accepted.includes(pid), pend = (st.products || []).some((x) => x.pid === pid);
      return `<div class="item-card"><div><div class="item-title">${esc(d.name)}</div>
        <p class="item-meta">${CATS[d.cat].name} · plan accuracy ${Math.round(d.score * 100)}% · sells for about <strong>$${pricing(st, d.cat, summarize(d.parts, d.cat), d.id)}</strong> · ${p.lumberReq.units} bd ft</p>
        <p class="item-meta">Cut list: ${p.cuts.map((c) => esc(c.part.replace(" (length)", "")) + " " + c.display).join(" · ")}</p></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${pend ? '<span class="tag">Built: hand it in at the Town Hall board</span>' : acc ? '<span class="tag" style="background:#bbf7d0">On your commission list</span>' : `<button class="btn-green btn-sm" data-build="${d.id}">Build this</button>`}
        <button class="btn-wood btn-sm" data-edit="${d.id}">Edit plan</button><button class="btn-wood btn-sm" data-del="${d.id}">Delete</button></div></div>`;
    }).join("") || '<p class="item-meta">No designs yet.</p>';
    game.openModal("Drafting Table", `
      <p><strong>Drafting Table</strong> — Good makers plan on paper first. Learn to draw to scale and dimension a plan, then invent your own piece to build and sell at the market.</p>
      <h3>Drafting lessons (${LESSONS.filter((l) => lessonDone(st, l.id)).length}/${LESSONS.length})</h3><div class="card-grid">${lessons}</div>
      <h3 style="margin-top:12px">Your designs</h3>
      ${unlocked ? '<button class="btn-brass" id="dt-new">+ Design something new</button>' : '<p class="item-meta">Finish the four lessons to unlock free design.</p>'}
      <div class="card-grid" style="margin-top:8px">${designs}</div>
      <div class="dialog-actions"><button class="btn-wood" data-act="close">Close</button></div>`);
    document.querySelectorAll("[data-dl]").forEach((b) => (b.onclick = () => openLesson(game, b.dataset.dl)));
    const nb = document.getElementById("dt-new"); if (nb) nb.onclick = () => openDesigner(game, null);
    document.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => openDesigner(game, st.designs.find((d) => d.id === b.dataset.edit))));
    document.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => {
      const id = b.dataset.del, pid = "design_" + id;
      if ((st.accepted || []).includes(pid)) game.dropJob(pid);
      st.designs = st.designs.filter((d) => d.id !== id); open(game);
    }));
    document.querySelectorAll("[data-build]").forEach((b) => (b.onclick = () => {
      const d = st.designs.find((x) => x.id === b.dataset.build); register(st, d);
      if (game.acceptJob("design_" + d.id)) game.toast("Added to your commissions. Take it to the Layout Bench.", "good");
      open(game);
    }));
  }

  return { open, restore, parseInches, summarize, CATS, LESSONS, allLessons };
})();
