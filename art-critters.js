window.ACM = window.ACM || {};

/**
 * Small creatures: lively songbirds (drawn in the world overlay) and the giant squirrel (drawn on a canvas for its pop-up).
 */
ACM.ArtCritters = (function () {
  const SPECIES = {
    robin:    { body: "#7a6a5a", belly: "#e0743a", head: "#4a4038", wing: "#5a4a3c", beak: "#f2c230" },
    jay:      { body: "#4f86c6", belly: "#e8eef5", head: "#3f6fb0", wing: "#2f5a9a", beak: "#262626", crest: true },
    finch:    { body: "#f0cf3a", belly: "#f7e27a", head: "#f0cf3a", wing: "#2b2b2b", beak: "#e8903a" },
    cardinal: { body: "#c8382e", belly: "#d9524a", head: "#b02a22", wing: "#8f1f1a", beak: "#f2a03a", crest: true },
    chickadee:{ body: "#9aa3ab", belly: "#f0ece4", head: "#25272b", wing: "#6f7880", beak: "#222222" },
    bluebird: { body: "#3f86d9", belly: "#e8924a", head: "#3f86d9", wing: "#2b62b0", beak: "#262626" }
  };
  const NAMES = Object.keys(SPECIES);

  /** draw one bird at screen position (sx, sy). b: { species, dir, state: "fly"|"perch", flap, hop } */
  function drawBird(ctx, b, sx, sy) {
    const s = SPECIES[b.species] || SPECIES.robin, u = 2, perched = b.state === "perch";
    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy));
    // soft shadow on the ground below
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    const sh = perched ? 6 : 22;
    ctx.beginPath(); ctx.ellipse(0, sh, perched ? 7 : 6, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    if (b.dir < 0) ctx.scale(-1, 1);
    const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x * u, y * u, w * u, h * u); };
    const hop = perched ? (b.hop > 0 ? -2 : 0) : 0, bob = perched ? 0 : Math.round(Math.sin(b.flap * 0.5) * 1);
    ctx.translate(0, (hop + bob) * u);
    const O = "#2a1d14";
    // tail
    R(O, -7, -1, 4, 3); R(s.wing, -6, -1, 3, 2);
    if (perched) R(s.wing, -6, 1, 2, 2);
    // body outline then fill
    R(O, -4, -2, 8, 6); R(s.body, -3, -1, 6, 4); R(s.belly, -2, 1, 4, 2);
    // head
    R(O, 2, -4, 5, 5); R(s.head, 3, -3, 3, 3);
    if (s.crest) { R(O, 2, -5, 2, 2); R(s.head, 2, -5, 2, 1); }
    // eye + beak
    R("#fff", 4, -3, 1, 1); R("#111", 5, -3, 1, 1);
    R(s.beak, 6, -2, 2, 1);
    // wings
    if (perched) { R(O, -3, -1, 5, 3); R(s.wing, -2, -1, 4, 2); R("#fff", -1, 0, 1, 1); }
    else {
      const f = Math.floor(b.flap) % 4;
      const y = f === 0 ? -6 : f === 1 ? -3 : f === 2 ? 2 : -1;
      const wx = f === 0 ? -5 : -3;                     // raised wings sweep back, away from the head
      R(O, wx, y - 1, 6, 4); R(s.wing, wx + 1, y, 4, 2);
    }
    // legs when perched
    if (perched) { R(O, -1, 4, 1, 2); R(O, 1, 4, 1, 2); }
    ctx.restore();
  }

  /** the giant squirrel, drawn at low resolution and scaled up with CSS so it looks like pixel art */
  function drawSquirrel(canvas) {
    const W = 72, H = 64;
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, W, H);
    const col = { o: "#2e1c0e", b: "#8a5a2c", B: "#b87a3e", c: "#f0dcb0", t: "#e6b878", w: "#ffffff", r: "#e23a2a", k: "#14100a", n: "#e08a8a" };
    const E = (cx, cy, rx, ry, k) => {
      c.fillStyle = col[k];
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) c.fillRect(x, y, 1, 1);
      }
    };
    const P = (k, x, y, w, h) => { c.fillStyle = col[k]; c.fillRect(x, y, w, h); };
    // huge curling tail
    [[52, 54, 9], [58, 45, 10], [62, 35, 11], [61, 24, 11], [55, 14, 9]].forEach(([x, y, r]) => E(x, y, r, r, "b"));
    [[54, 52, 5], [59, 44, 6], [63, 35, 7], [62, 24, 7], [56, 14, 5]].forEach(([x, y, r]) => E(x, y, r, r, "B"));
    E(54, 12, 4, 4, "t");
    // body, belly
    E(36, 44, 14, 16, "b"); E(33, 48, 8, 11, "c");
    // feet
    E(28, 60, 7, 3, "B"); E(44, 60, 7, 3, "B");
    // arms raised to attack, with claws
    E(22, 44, 4, 9, "b"); E(46, 42, 4, 9, "b");
    P("w", 18, 34, 1, 3); P("w", 20, 33, 1, 3); P("w", 22, 33, 1, 3);
    P("w", 44, 32, 1, 3); P("w", 46, 31, 1, 3); P("w", 48, 32, 1, 3);
    // head, muzzle, ears
    E(30, 22, 12, 11, "b"); E(24, 27, 7, 5, "c");
    E(23, 9, 4, 5, "b"); E(37, 9, 4, 5, "b"); E(23, 10, 2, 3, "n"); E(37, 10, 2, 3, "n");
    // furious eyes and brows
    E(25, 19, 3, 3, "w"); E(36, 19, 3, 3, "w");
    P("r", 24, 19, 2, 2); P("r", 35, 19, 2, 2); P("k", 25, 19, 1, 1); P("k", 36, 19, 1, 1);
    P("o", 21, 14, 3, 1); P("o", 24, 15, 3, 1); P("o", 34, 15, 3, 1); P("o", 37, 14, 3, 1);
    // nose, open mouth, enormous teeth
    E(19, 25, 2, 2, "n"); P("k", 21, 30, 9, 2); P("k", 22, 32, 7, 1);
    P("w", 22, 30, 3, 5); P("w", 26, 30, 3, 5); P("o", 22, 35, 3, 1); P("o", 26, 35, 3, 1);
    // outline pass: any opaque pixel touching transparency gets a dark edge
    const img = c.getImageData(0, 0, W, H), d = img.data, out = new Uint8ClampedArray(d);
    const a = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[(y * W + x) * 4 + 3]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (a(x, y)) continue;
      if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) { const i = (y * W + x) * 4; out[i] = 46; out[i + 1] = 28; out[i + 2] = 14; out[i + 3] = 255; }
    }
    c.putImageData(new ImageData(out, W, H), 0, 0);
  }

  return { SPECIES, NAMES, drawBird, drawSquirrel };
})();
