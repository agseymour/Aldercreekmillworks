window.ACM = window.ACM || {};

/**
 * ACM.ArtWorld — everything that paints the Alder Creek tile map:
 * seasonal ground cache, tree sprites, props, scenery, weather overlay, minimap.
 */
ACM.ArtWorld = (function () {
  const U = ACM.ArtUtil;
  const { shade, R, blob, beam, mk } = U;
  const M = ACM.Map;
  const T = M.T, W = M.W, H = M.H, TYPE = M.TYPE;
  const hash = M.hash;

  const PAL = {
    Spring: { grass: "#5b9a4c", alt: "#68ab58", dark: "#4a8640", path: "#c4a97c", pathD: "#a98f63", water: "#4a8fd6", waterD: "#3b7bc0", waterL: "#8cc4f0", sand: "#e0cf9c", cobble: "#9a9a96", flower: ["#f5e663", "#ffffff", "#f4a7c3", "#c8a2e8"] },
    Summer: { grass: "#4c8a3f", alt: "#589b49", dark: "#3d7634", path: "#c0a374", pathD: "#a48a5c", water: "#2f78d0", waterD: "#2663ac", waterL: "#7ab6ec", sand: "#e8d49a", cobble: "#9c9c97", flower: ["#f5e663", "#ffffff", "#ef6f6f", "#f4a7c3"] },
    Autumn: { grass: "#908442", alt: "#a2954c", dark: "#7a6f36", path: "#b08d57", pathD: "#957446", water: "#3d78a6", waterD: "#2f6590", waterL: "#7fb0d2", sand: "#d6c08a", cobble: "#8f8c86", flower: ["#d9742a", "#e8b030", "#b9472a", "#d9742a"] },
    Winter: { grass: "#e1ebf3", alt: "#d3e1ec", dark: "#bccfde", path: "#a9b4c0", pathD: "#8b97a5", water: "#9fd2ee", waterD: "#7fbbdc", waterL: "#e6f5fc", sand: "#d8d9d2", cobble: "#a5abb4", flower: ["#ffffff", "#e6f0f8", "#ffffff", "#ffffff"] }
  };

  Object.keys(PAL).forEach((k) => {
    const p = PAL[k], g = U.parse(p.grass), l = U.parse(p.alt);
    p.alt2 = "#" + g.map((v, i) => Math.round(v * 0.5 + l[i] * 0.5).toString(16).padStart(2, "0")).join("");
  });

  /* ------------------------------------------------------------------ ground */
  const groundCache = {};
  const miniCache = {};

  function tileT(tx, ty) {
    return M.inb(tx, ty) ? M.tiles[ty * W + tx] : TYPE.WATER;
  }

  function fringe(c, tx, ty, x, y, col, dark) {
    // jagged grass fringe on any edge of a non-grass tile that touches grass
    const nb = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    nb.forEach(([dx, dy]) => {
      if (tileT(tx + dx, ty + dy) !== TYPE.GRASS) return;
      for (let i = 0; i < T; i += 2) {
        const d = 2 + Math.floor(hash(tx * 32 + i, ty * 3 + dx * 7 + dy, 90) * 4);
        if (dy === -1) { R(c, col, x + i, y, 2, d); R(c, dark, x + i, y + d, 2, 1); }
        else if (dy === 1) { R(c, col, x + i, y + T - d, 2, d); R(c, dark, x + i, y + T - d - 1, 2, 1); }
        else if (dx === -1) { R(c, col, x, y + i, d, 2); R(c, dark, x + d, y + i, 1, 2); }
        else { R(c, col, x + T - d, y + i, d, 2); R(c, dark, x + T - d - 1, y + i, 1, 2); }
      }
    });
  }

  function drawTile(c, tx, ty, season, p) {
    const t = tileT(tx, ty), x = tx * T, y = ty * T;
    if (t === TYPE.GRASS) {
      const patch = hash(tx >> 2, ty >> 2, 50) * 0.45 + hash(tx >> 1, ty >> 1, 51) * 0.3 + hash(tx, ty, 52) * 0.25 > 0.64;
      R(c, patch ? p.alt2 : p.grass, x, y, T, T);
      for (let k = 0; k < 6; k++) {
        const fx = x + Math.floor(hash(tx, ty, 10 + k) * 29), fy = y + Math.floor(hash(tx, ty, 20 + k) * 29);
        const r = hash(tx, ty, 30 + k);
        if (r < 0.4) { R(c, p.dark, fx, fy, 1, 3); R(c, p.dark, fx + 1, fy + 1, 1, 2); }
        else if (r < 0.7) R(c, p.alt, fx, fy, 3, 1);
        else R(c, p.dark, fx, fy + 2, 2, 1);
      }
      const r2 = hash(tx, ty, 99);
      if ((season === "Spring" || season === "Summer") && r2 < 0.09) {
        const col = p.flower[Math.floor(hash(tx, ty, 98) * 4)];
        const fx = x + 6 + Math.floor(hash(tx, ty, 97) * 18), fy = y + 6 + Math.floor(hash(tx, ty, 96) * 18);
        R(c, "#3c7a35", fx + 1, fy + 2, 1, 3);
        R(c, col, fx, fy, 3, 3);
        R(c, "#f7e08a", fx + 1, fy + 1, 1, 1);
      } else if (season === "Autumn" && r2 < 0.12) {
        const fx = x + 4 + Math.floor(hash(tx, ty, 95) * 22), fy = y + 4 + Math.floor(hash(tx, ty, 94) * 22);
        R(c, p.flower[Math.floor(hash(tx, ty, 93) * 4)], fx, fy, 3, 2);
      } else if (season === "Winter" && r2 < 0.18) {
        const fx = x + Math.floor(hash(tx, ty, 92) * 26), fy = y + Math.floor(hash(tx, ty, 91) * 26);
        R(c, "#ffffff", fx, fy, 4, 2);
        R(c, "#c3d6e5", fx + 1, fy + 2, 3, 1);
      }
      return;
    }
    if (t === TYPE.PATH) {
      R(c, p.path, x, y, T, T);
      for (let k = 0; k < 7; k++) {
        const fx = Math.floor(hash(tx, ty, 40 + k) * 28), fy = Math.floor(hash(tx, ty, 50 + k) * 28);
        R(c, hash(tx, ty, 60 + k) < 0.5 ? p.pathD : shade(p.path, 0.14), x + fx, y + fy, 3, 2);
      }
      fringe(c, tx, ty, x, y, p.grass, p.dark);
      return;
    }
    if (t === TYPE.SAND) {
      R(c, p.sand, x, y, T, T);
      for (let k = 0; k < 6; k++) R(c, shade(p.sand, hash(tx, ty, 70 + k) < 0.5 ? -0.1 : 0.12), x + Math.floor(hash(tx, ty, 80 + k) * 29), y + Math.floor(hash(tx, ty, 85 + k) * 29), 2, 1);
      fringe(c, tx, ty, x, y, p.grass, p.dark);
      return;
    }
    if (t === TYPE.WATER) {
      R(c, p.water, x, y, T, T);
      for (let k = 0; k < 3; k++) R(c, p.waterD, x + Math.floor(hash(tx, ty, 100 + k) * 22), y + 4 + k * 10 + Math.floor(hash(tx, ty, 103 + k) * 4), 8 + Math.floor(hash(tx, ty, 106 + k) * 8), 2);
      const edge = (dx, dy) => tileT(tx + dx, ty + dy) !== TYPE.WATER && tileT(tx + dx, ty + dy) !== TYPE.BRIDGE;
      if (edge(0, -1)) R(c, p.waterL, x, y, T, 2);
      if (edge(0, 1)) R(c, p.waterL, x, y + T - 2, T, 2);
      if (edge(-1, 0)) R(c, p.waterL, x, y, 2, T);
      if (edge(1, 0)) R(c, p.waterL, x + T - 2, y, 2, T);
      if (season === "Winter") {
        R(c, "rgba(255,255,255,0.5)", x + 4, y + 6, 10, 1);
        R(c, "rgba(120,170,200,0.6)", x + 14, y + 6, 1, 8);
        R(c, "rgba(120,170,200,0.6)", x + 6, y + 20, 12, 1);
      }
      return;
    }
    if (t === TYPE.BRIDGE) {
      R(c, p.water, x, y, T, T);
      R(c, "#a8794a", x, y, T, T);
      for (let i = 0; i < T; i += 8) {
        R(c, i % 16 ? "#b98a56" : "#a37244", x + i, y, 8, T);
        R(c, "#6e4a2a", x + i, y, 1, T);
      }
      const top = tileT(tx, ty - 1) !== TYPE.BRIDGE, bot = tileT(tx, ty + 1) !== TYPE.BRIDGE;
      if (top) { R(c, "#5a3a22", x, y, T, 7); R(c, "#7e5632", x, y, T, 2); R(c, "#3a2414", x + 12, y, 5, 9); }
      if (bot) { R(c, "#5a3a22", x, y + T - 7, T, 7); R(c, "#7e5632", x, y + T - 7, T, 2); R(c, "#3a2414", x + 12, y + T - 9, 5, 9); R(c, "rgba(0,0,0,0.25)", x, y + T, T, 0); }
      if (season === "Winter") { R(c, "#f2f7fb", x, y + (top ? 7 : 0), T, 3); }
      return;
    }
    if (t === TYPE.COBBLE) {
      R(c, p.cobble, x, y, T, T);
      for (let cy = 0; cy < T; cy += 8) {
        for (let cx = ((cy / 8) % 2) * 5; cx < T; cx += 10) {
          const v = hash(tx * 4 + cx, ty * 4 + cy, 110);
          R(c, shade(p.cobble, (v - 0.5) * 0.28), x + cx, y + cy, 9, 7);
          R(c, shade(p.cobble, 0.2), x + cx, y + cy, 9, 1);
        }
      }
      fringe(c, tx, ty, x, y, p.grass, p.dark);
      return;
    }
    if (t === TYPE.FLOOR) {
      R(c, "#a9784a", x, y, T, T);
      for (let i = 0; i < T; i += 8) {
        R(c, hash(tx, ty + i, 120) < 0.5 ? "#b88655" : "#a06f43", x, y + i, T, 7);
        R(c, "#7f5733", x, y + i + 7, T, 1);
        const sx = Math.floor(hash(tx, ty + i, 121) * 26);
        R(c, "#7f5733", x + sx, y + i, 1, 7);
        if (hash(tx, ty, 122 + i) < 0.12) R(c, "#e6d3a8", x + sx + 3, y + i + 3, 3, 1);
      }
      return;
    }
    if (t === TYPE.SCORCH) {
      R(c, "#3b342e", x, y, T, T);
      for (let k = 0; k < 8; k++) {
        const v = hash(tx, ty, 130 + k);
        R(c, v < 0.5 ? "#2b2622" : "#4a4139", x + Math.floor(hash(tx, ty, 140 + k) * 26), y + Math.floor(hash(tx, ty, 150 + k) * 26), 5, 3);
      }
      if (hash(tx, ty, 160) < 0.07) R(c, "#6a3a22", x + 8, y + 10, 4, 2);
      if (season === "Winter") for (let k = 0; k < 3; k++) R(c, "rgba(240,246,250,0.8)", x + Math.floor(hash(tx, ty, 170 + k) * 24), y + Math.floor(hash(tx, ty, 180 + k) * 24), 6, 3);
      if (season === "Spring" || season === "Summer") {
        if (hash(tx, ty, 190) < 0.14) { R(c, "#4f8a3c", x + 10, y + 10, 2, 5); R(c, "#6fae55", x + 13, y + 12, 2, 3); }
      }
      return;
    }
  }

  function drawWallTile(c, w, p) {
    const x = w.tx * T, y = w.ty * T;
    const plank = "#8a5d37", dark = "#5c3b22", light = "#b3834f";
    if (w.kind === "north") {
      R(c, "#3d2616", x, y, T, T);
      R(c, "#4d321d", x, y, T, 10);
      R(c, "#2d1b0f", x, y + 10, T, 3);
      R(c, "#6b4a2c", x, y + 13, T, 19);
      for (let i = 0; i < T; i += 8) R(c, dark, x + i, y + 13, 1, 19);
      if (p === "Winter") R(c, "#eef5fa", x, y, T, 4);
    } else if (w.kind === "north2") {
      R(c, plank, x, y, T, T);
      for (let i = 0; i < T; i += 8) { R(c, i % 16 ? light : plank, x + i, y, 8, T - 8); R(c, dark, x + i, y, 1, T - 8); }
      R(c, "#4d321d", x, y + T - 9, T, 9);
      R(c, "#6b4a2c", x, y + T - 9, T, 2);
      R(c, "rgba(0,0,0,0.18)", x, y, T, 3);
      if ([9, 10, 19, 20].includes(w.tx)) {
        const wx = x + (w.tx % 2 ? 2 : 0);
        R(c, "#e6cf9b", x + 3, y + 2, 26, 18);
        R(c, "#9fcbe0", x + 5, y + 4, 22, 14);
        R(c, "#cfe9f5", x + 5, y + 4, 22, 5);
        R(c, "#e6cf9b", x + 15, y + 4, 2, 14);
        R(c, "#e6cf9b", x + 5, y + 10, 22, 2);
      }
    } else if (w.kind === "south") {
      R(c, plank, x, y, T, T);
      for (let i = 0; i < T; i += 8) { R(c, i % 16 ? light : plank, x + i, y + 6, 8, T - 6); R(c, dark, x + i, y + 6, 1, T - 6); }
      R(c, "#4d321d", x, y, T, 9);
      R(c, "#2d1b0f", x, y + 9, T, 2);
      R(c, "#4d321d", x, y + T - 6, T, 6);
      if (w.post) R(c, "#3d2616", x + (w.tx === 14 ? T - 8 : 0), y, 8, T);
      if (p === "Winter") R(c, "#eef5fa", x, y, T, 3);
      if (w.tx % 4 === 1 && !w.post && (w.tx < 12 || w.tx > 19)) {
        R(c, "#e6cf9b", x + 3, y + 11, 26, 14);
        R(c, "#9fcbe0", x + 5, y + 13, 22, 10);
        R(c, "#e6cf9b", x + 15, y + 13, 2, 10);
      }
    } else if (w.kind === "west") {
      R(c, "#3d2616", x, y, 10, T);
      R(c, plank, x + 10, y, T - 10, T);
      for (let i = 0; i < T; i += 8) R(c, dark, x + 10, y + i + 7, T - 10, 1);
      R(c, "rgba(0,0,0,0.2)", x + 10, y, 4, T);
    } else if (w.kind === "east") {
      R(c, "#3d2616", x + T - 10, y, 10, T);
      R(c, plank, x, y, T - 10, T);
      for (let i = 0; i < T; i += 8) R(c, dark, x, y + i + 7, T - 10, 1);
      R(c, "rgba(0,0,0,0.2)", x + T - 14, y, 4, T);
    }
  }

  /* extra ground detail: light/dark meadow patches, grass tufts, flower clumps, pebbles, moss on cobbles, seasonal litter */
  function dressGround(c, season, p, tx0, ty0, tx1, ty1) {
    const hs = M.hash, Wd = M.W, G = TYPE.GRASS;
    const flowerCols = season === "Spring" ? ["#ff8fb3", "#fff3b0", "#ffffff", "#c7a6ff", "#ffd447"] : season === "Summer" ? ["#ffd447", "#ff7a6b", "#ffffff", "#7ec8ff"] : season === "Autumn" ? ["#e8a23a", "#c0562f", "#d9b36a"] : ["#dfeaf3"];
    for (let ty = ty0; ty < ty1; ty++) for (let tx = tx0; tx < tx1; tx++) {
      const t = M.tiles[ty * Wd + tx], x = tx * T, y = ty * T;
      if (t === G) {
        // grass tufts: three short blades
        for (let k = 0; k < 3; k++) {
          if (hs(tx, ty, 80 + k) > 0.34) continue;
          const bx = x + 3 + Math.floor(hs(tx, ty, 90 + k) * 24), by = y + 6 + Math.floor(hs(tx, ty, 100 + k) * 22);
          c.fillStyle = shade(p.grass, -0.22); c.fillRect(bx, by, 1, 4); c.fillRect(bx + 2, by + 1, 1, 3); c.fillRect(bx - 2, by + 1, 1, 3);
          c.fillStyle = shade(p.grass, 0.2); c.fillRect(bx, by, 1, 2);
        }
        // flower clumps (rarer, in groups of 2-4)
        if (hs(tx, ty, 120) < 0.05) {
          const base = Math.floor(hs(tx, ty, 121) * flowerCols.length), n = 2 + Math.floor(hs(tx, ty, 122) * 3);
          for (let k = 0; k < n; k++) {
            const fx = x + 6 + Math.floor(hs(tx, ty, 130 + k) * 20), fy = y + 8 + Math.floor(hs(tx, ty, 140 + k) * 18);
            if (season === "Winter") { c.fillStyle = "rgba(255,255,255,0.85)"; c.fillRect(fx, fy, 3, 2); continue; }
            c.fillStyle = season === "Autumn" ? flowerCols[(base + k) % flowerCols.length] : "#3a7a3a"; c.fillRect(fx, fy + 2, 1, 3);
            c.fillStyle = flowerCols[(base + k) % flowerCols.length]; c.fillRect(fx - 1, fy, 3, 3); c.fillStyle = "rgba(255,255,255,0.55)"; c.fillRect(fx, fy, 1, 1);
          }
        }
        // pebbles and twigs
        if (hs(tx, ty, 150) < 0.035) { const px = x + 5 + Math.floor(hs(tx, ty, 151) * 20), py = y + 10 + Math.floor(hs(tx, ty, 152) * 16); c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(px, py + 2, 5, 1); c.fillStyle = "#9a9a92"; c.fillRect(px, py, 4, 3); c.fillStyle = "#c4c4bb"; c.fillRect(px, py, 2, 1); }
        if (season === "Autumn" && hs(tx, ty, 160) < 0.12) { const lx = x + Math.floor(hs(tx, ty, 161) * 26), ly = y + Math.floor(hs(tx, ty, 162) * 26); c.fillStyle = ["#d9531e", "#e8a23a", "#c0562f"][Math.floor(hs(tx, ty, 163) * 3)]; c.fillRect(lx, ly, 3, 2); }
      } else if (t === TYPE.COBBLE) {
        if (hs(tx, ty, 170) < 0.07) { c.fillStyle = "rgba(80,130,60,0.5)"; c.fillRect(x + 4 + Math.floor(hs(tx, ty, 171) * 16), y + 4 + Math.floor(hs(tx, ty, 172) * 16), 6, 3); c.fillRect(x + 8, y + 6, 4, 2); }
        if (hs(tx, ty, 173) < 0.05) { c.fillStyle = "rgba(0,0,0,0.18)"; c.fillRect(x + 6, y + 12, 12, 1); c.fillRect(x + 12, y + 13, 1, 6); }
      } else if (t === TYPE.PATH) {
        if (hs(tx, ty, 180) < 0.22) { c.fillStyle = shade(p.path, -0.2); c.fillRect(x + 4 + Math.floor(hs(tx, ty, 181) * 22), y + 4 + Math.floor(hs(tx, ty, 182) * 22), 3, 2); }
        if (hs(tx, ty, 183) < 0.12) { c.fillStyle = shade(p.path, 0.18); c.fillRect(x + 6 + Math.floor(hs(tx, ty, 184) * 18), y + 8 + Math.floor(hs(tx, ty, 185) * 18), 2, 2); }
      }
    }
  }

  /* ---------------- per-pixel ground ----------------
     Grass, path, sand, cobble and water are painted pixel by pixel from world-space noise, so patches
     flow across tile borders and the edges between materials are organic instead of tile-shaped.
     Bridges, the workshop floor and scorched ground keep their tile drawings on top. */
  function noiseField(cw, ch, seed) {
    const f = new Float32Array(cw * ch);
    for (let i = 0; i < f.length; i++) f[i] = hash(i % cw, (i / cw) | 0, seed);
    return f;
  }
  function sampler(field, cw, ch, cell) {
    return (px, py) => {
      const fx = px / cell, fy = py / cell, x0 = Math.floor(fx), y0 = Math.floor(fy);
      let u = fx - x0, v = fy - y0; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
      const xa = Math.min(cw - 1, x0), xb = Math.min(cw - 1, x0 + 1), ya = Math.min(ch - 1, y0), yb = Math.min(ch - 1, y0 + 1);
      const a = field[ya * cw + xa], b = field[ya * cw + xb], c = field[yb * cw + xa], d = field[yb * cw + xb];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }

  let fields = null;
  function paintGroundPixels(c, season, p, tx0, ty0, tx1, ty1) {
    const PW = W * T, PH = H * T, RW0 = (tx1 - tx0) * T, RH0 = (ty1 - ty0) * T, OX = tx0 * T, OY = ty0 * T;
    const img = c.createImageData(RW0, RH0), D = img.data;
    if (!fields) fields = {
      big: sampler(noiseField(PW / 96 + 2, PH / 96 + 2, 301), PW / 96 + 2, PH / 96 + 2, 96),
      mid: sampler(noiseField(PW / 24 + 2, PH / 24 + 2, 302), PW / 24 + 2, PH / 24 + 2, 24),
      sml: sampler(noiseField(PW / 6 + 2, PH / 6 + 2, 303), PW / 6 + 2, PH / 6 + 2, 6)
    };
    const { big, mid, sml } = fields;
    const RG = season === "Winter" ? [hx("#a9bccd"), hx(p.dark), hx(p.grass), hx(p.alt), hx("#f6fafd")] : ramp5(p.dark, p.grass, p.alt), RP = ramp5(p.pathD, p.path, shade(p.path, 0.18));
    const RS = ramp5(shade(p.sand, -0.22), p.sand, shade(p.sand, 0.16)), RC = ramp5(shade(p.cobble, -0.32), p.cobble, shade(p.cobble, 0.22));
    const RW = ramp5(p.waterD, p.water, p.waterL), WET = hx(shade(p.sand, -0.28));
    const winter = season === "Winter";
    const put = (i, col) => { D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255; };
    const q = (l, x, y) => { const b = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * 0.5; return Math.max(0, Math.min(4, Math.floor(l * 4.6 + b))); };
    const G = TYPE.GRASS, WA = TYPE.WATER, BR = TYPE.BRIDGE;
    // distance (px) from a pixel to the nearest neighbouring tile that matches pred
    const distTo = (tx, ty, lx, ly, pred) => {
      let d = 99;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        if (!pred(tileT(tx + dx, ty + dy))) continue;
        const ax = dx < 0 ? lx + 0.5 : dx > 0 ? T - lx - 0.5 : 0, ay = dy < 0 ? ly + 0.5 : dy > 0 ? T - ly - 0.5 : 0;
        const v = dx && dy ? Math.hypot(ax, ay) : dx ? ax : ay;
        if (v < d) d = v;
      }
      return d;
    };
    const isGrass = (t) => t === G, notWater = (t) => t !== WA && t !== BR, isWater = (t) => t === WA || t === BR;

    for (let ty = ty0; ty < ty1; ty++) for (let tx = tx0; tx < tx1; tx++) {
      const t = tileT(tx, ty);
      if (t === TYPE.FLOOR || t === TYPE.SCORCH || t === BR) continue;    // drawn by drawTile
      const nearGrass = t !== G && t !== WA && [[0, -1], [0, 1], [-1, 0], [1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => tileT(tx + dx, ty + dy) === G);
      const nearWater = t !== WA && [[0, -1], [0, 1], [-1, 0], [1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => isWater(tileT(tx + dx, ty + dy)));
      const nearBank = t === WA && [[0, -1], [0, 1], [-1, 0], [1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => notWater(tileT(tx + dx, ty + dy)));
      for (let ly = 0; ly < T; ly++) for (let lx = 0; lx < T; lx++) {
        const px = tx * T + lx, py = ty * T + ly, i = ((py - OY) * RW0 + (px - OX)) * 4;
        let mat = t;
        if (nearGrass) {
          // grass creeps over the edge along a ragged line
          const dg = distTo(tx, ty, lx, ly, isGrass), reach = 2 + sml(px, py) * 6 + (hash(px >> 1, py >> 1, 304) < 0.2 ? 2 : 0);
          if (dg < reach) mat = G;
        }
        if (mat === G) {
          const amp = winter ? 0.45 : 1;
          let l = 0.5 + ((big(px, py) - 0.5) * 0.5 + (mid(px, py) - 0.5) * 0.3 + (sml(px, py) - 0.5) * 0.12) * amp;
          // short grass blades: a light tip with a dark root under it (sparse, so the lawn stays calm)
          const bs = hash(px, (py + ((px * 7) & 3)) >> 2, 305);
          if (bs > 0.94) l += (((py + ((px * 7) & 3)) & 3) === 0 ? 0.2 : 0.07) * amp;
          else if (bs < 0.035) l -= 0.15 * amp;
          if (t !== G) l -= 0.08;                       // fringe a touch darker where it overhangs
          l = Math.max(0.2, Math.min(0.84, l));
          // organic (noise) rather than ordered dithering, so big patches don't show a checkerboard
          put(i, RG[Math.max(0, Math.min(4, Math.floor(l * 4.6 + (hash(px >> 1, py, 320) - 0.5) * 0.45)))]);
          continue;
        }
        if (mat === TYPE.PATH) {
          let l = 0.5 + (mid(px, py) - 0.5) * 0.5 + (hash(px, py, 306) - 0.5) * 0.18;
          const pb = hash(px >> 1, py >> 1, 307);
          if (pb > 0.975) l += 0.35; else if (pb > 0.955) l -= 0.3;        // pebbles and pits
          if (nearGrass && distTo(tx, ty, lx, ly, isGrass) < 9) l -= 0.12;   // packed edge
          put(i, RP[q(l, px, py)]);
          continue;
        }
        if (mat === TYPE.SAND) {
          let l = 0.52 + (mid(px, py) - 0.5) * 0.35 + (hash(px, py, 308) - 0.5) * 0.2;
          l += Math.sin(px * 0.12 + py * 0.55 + mid(px, py) * 7) * 0.08;      // wind ripples
          const dw = nearWater ? distTo(tx, ty, lx, ly, isWater) : 99;
          if (dw < 6 + sml(px, py) * 4 && !winter) { const k = Math.max(0, 1 - dw / 10); const col = RS[q(l - 0.2, px, py)]; put(i, [col[0] + (WET[0] - col[0]) * k, col[1] + (WET[1] - col[1]) * k, col[2] + (WET[2] - col[2]) * k]); continue; }
          put(i, RS[q(l, px, py)]);
          continue;
        }
        if (mat === TYPE.COBBLE) {
          // jittered-grid stones, lit from the upper left, with mortar lines
          const cs = 9, gx = Math.floor(px / cs), gy = Math.floor(py / cs);
          let d1 = 1e9, d2 = 1e9, bx = 0, by = 0, id = 0;
          for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
            const cx = (gx + ox) * cs + 1.5 + hash(gx + ox, gy + oy, 309) * (cs - 3), cy = (gy + oy) * cs + 1.5 + hash(gx + ox, gy + oy, 310) * (cs - 3);
            const d = (px - cx) * (px - cx) + (py - cy) * (py - cy);
            if (d < d1) { d2 = d1; d1 = d; bx = px - cx; by = py - cy; id = hash(gx + ox, gy + oy, 311); } else if (d < d2) d2 = d;
          }
          const edge = Math.sqrt(d2) - Math.sqrt(d1);
          if (edge < 1.3) { put(i, RC[0]); continue; }
          let l = 0.55 + (id - 0.5) * 0.3 - (bx + by) * 0.045 + (hash(px, py, 312) - 0.5) * 0.08;
          if (edge < 2.3 && (bx > 0 || by > 0)) l -= 0.18;
          put(i, RC[q(l, px, py)]);
          continue;
        }
        if (mat === WA) {
          const db = nearBank ? distTo(tx, ty, lx, ly, notWater) : 99;
          let l = 0.42 + (mid(px, py) - 0.5) * 0.18;
          if (db < 2) l = winter ? 0.75 : 0.95;                       // foam line / ice rim
          else if (db < 7 + sml(px, py) * 4) l += 0.22;               // shallows
          // ripple lines drifting across the current
          const rw = (py + Math.round(Math.sin(px * 0.07 + ty) * 2.2)) % 11;
          if (rw === 0 && hash(px >> 3, py, 313) > 0.35) l += 0.22;
          else if (rw === 1 && hash(px >> 3, py - 1, 313) > 0.35) l -= 0.1;
          if (winter && hash(px >> 2, py >> 2, 314) > 0.985) l -= 0.3;   // cracks in the ice
          put(i, RW[q(l, px, py)]);
        }
      }
    }
    c.putImageData(img, OX, OY);
  }

  /* The ground is painted lazily in 8x8-tile chunks: the ones in view first (ensureGround), then a few
     more each frame in the background (warmGround), so there's no long pause at load or season change. */
  const CH = 8, CW = Math.ceil(W / CH), CHH = Math.ceil(H / CH);
  function getGround(season) {
    let g = groundCache[season];
    if (!g) g = groundCache[season] = { cv: mk(W * T, H * T), done: new Uint8Array(CW * CHH), left: CW * CHH };
    return g.cv;
  }
  function paintChunk(season, cx, cy) {
    const g = groundCache[season], k = cy * CW + cx;
    if (g.done[k]) return;
    g.done[k] = 1; g.left--;
    const p = PAL[season] || PAL.Spring, c = g.cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    const tx0 = cx * CH, ty0 = cy * CH, tx1 = Math.min(W, tx0 + CH), ty1 = Math.min(H, ty0 + CH);
    paintGroundPixels(c, season, p, tx0, ty0, tx1, ty1);
    for (let ty = ty0; ty < ty1; ty++) for (let tx = tx0; tx < tx1; tx++) {
      const t = M.tiles[ty * W + tx];
      if (t === TYPE.FLOOR || t === TYPE.SCORCH || t === TYPE.BRIDGE) drawTile(c, tx, ty, season, p);
    }
    dressGround(c, season, p, tx0, ty0, tx1, ty1);
  }
  function ensureGround(season, x, y, w, h) {
    getGround(season);
    const cx0 = Math.max(0, Math.floor(x / (CH * T))), cy0 = Math.max(0, Math.floor(y / (CH * T)));
    const cx1 = Math.min(CW - 1, Math.floor((x + w) / (CH * T))), cy1 = Math.min(CHH - 1, Math.floor((y + h) / (CH * T)));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) paintChunk(season, cx, cy);
    return groundCache[season].cv;
  }
  // paint up to n more chunks, nearest to (x, y) first
  let warmTick = 0;
  function warmGround(season, x, y, n) {
    const g = groundCache[season]; if (!g || !g.left) return;
    if (++warmTick % 3) return;      // a chunk costs ~10ms; spread them out so walking stays smooth
    const ccx = x / (CH * T), ccy = y / (CH * T);
    for (let k = 0; k < n && g.left; k++) {
      let best = -1, bd = 1e9;
      for (let i = 0; i < g.done.length; i++) if (!g.done[i]) { const d = Math.hypot((i % CW) + 0.5 - ccx, ((i / CW) | 0) + 0.5 - ccy); if (d < bd) { bd = d; best = i; } }
      if (best < 0) return;
      paintChunk(season, best % CW, (best / CW) | 0);
    }
  }


  /* the workshop: walls, un-built lots and the floor rug depend on which additions the student has built */
  const wsCache = {};
  function getWorkshop(season, z) {
    const k = season + "|" + (z.west ? "W" : "-") + (z.east ? "E" : "-");
    if (wsCache[k]) return wsCache[k];
    const X0 = 3, Y0 = 3, cw = 26, ch = 16;
    const cv = mk(cw * T, ch * T), c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.translate(-X0 * T, -Y0 * T);
    const hs = M.hash, bMin = z.west ? 4 : 10, bMax = z.east ? 27 : 21;
    // empty lots: packed dirt, stakes and a string line, so it is obvious a bay can go here
    for (let ty = 4; ty <= 17; ty++) for (let tx = 4; tx <= 27; tx++) {
      const inside = tx > bMin && tx < bMax && ty >= 6 && ty <= 16, wall = (tx === bMin || tx === bMax) || ty <= 5 || ty === 17;
      const inFoot = tx >= bMin && tx <= bMax;
      if (inFoot && (inside || wall)) continue;
      const x = tx * T, y = ty * T;
      R(c, season === "Winter" ? "#d8dde2" : "#8b7352", x, y, T, T);
      for (let i = 0; i < 6; i++) R(c, season === "Winter" ? "#c3cad1" : (i % 2 ? "#7a6445" : "#a08a64"), x + Math.floor(hs(tx, ty, 300 + i) * 28), y + Math.floor(hs(tx, ty, 310 + i) * 28), 3, 2);
    }
    const lots = [];
    if (!z.west) lots.push([4, 9]);
    if (!z.east) lots.push([22, 27]);
    lots.forEach(([x0, x1]) => {
      const a0 = x0 * T + 6, a1 = (x1 + 1) * T - 6;
      for (let x = a0; x < a1; x += 5) { R(c, "#e8d9ae", x, 6 * T + 10, 3, 1); R(c, "#e8d9ae", x, 16 * T + 6, 3, 1); }
      [[x0 * T + 8, 6 * T + 4], [(x1 + 1) * T - 10, 6 * T + 4], [x0 * T + 8, 16 * T], [(x1 + 1) * T - 10, 16 * T]].forEach(([sx, sy]) => { R(c, "#7b5431", sx, sy, 3, 14); R(c, "#e2b04a", sx, sy, 3, 3); });
      const cx = Math.round((x0 + x1 + 1) / 2 * T) - 28, cy = 10 * T;
      R(c, "#5a3a1c", cx + 26, cy + 26, 4, 22); R(c, "#7b5431", cx, cy, 56, 30); R(c, "#a9824a", cx + 2, cy + 2, 52, 26);
      R(c, "#3b2813", cx + 8, cy + 8, 40, 3); R(c, "#3b2813", cx + 12, cy + 14, 32, 3); R(c, "#3b2813", cx + 16, cy + 20, 24, 3);
      // a little pile of lumber and cinder blocks waiting for the build
      R(c, "#c49656", cx - 8, cy + 36, 24, 5); R(c, "#a77a44", cx - 6, cy + 41, 24, 5); R(c, "#8a8f98", cx + 66, cy + 40, 10, 8); R(c, "#6e7780", cx + 66, cy + 40, 10, 2);
    });
    // walls of the footprint
    M.wallsFor(z).forEach((w) => drawWallTile(c, w, season));
    // doormat and rug (the rug always sits in the core)
    R(c, "#7a2d2d", 15 * T + 2, 16 * T + 8, T * 2 - 4, 16); R(c, "#a94a3d", 15 * T + 5, 16 * T + 11, T * 2 - 10, 10);
    R(c, "#5b3f6b", 13 * T, 13 * T + 8, 6 * T, 40); R(c, "#7a5a8c", 13 * T + 4, 13 * T + 12, 6 * T - 8, 32);
    for (let i = 0; i < 6 * T - 12; i += 8) R(c, "#d9b36a", 13 * T + 6 + i, 13 * T + 26, 4, 4);
    return (wsCache[k] = { cv, x: X0 * T, y: Y0 * T });
  }

  /* ------------------------------------------------------------------ minimap */
  function getMini(season) {
    if (miniCache[season]) return miniCache[season];
    const p = PAL[season] || PAL.Spring;
    const cv = mk(W, H);
    const c = cv.getContext("2d");
    const col = {};
    col[TYPE.GRASS] = shade(p.grass, -0.08);
    col[TYPE.PATH] = p.path;
    col[TYPE.WATER] = p.water;
    col[TYPE.SAND] = p.sand;
    col[TYPE.BRIDGE] = "#8a5d37";
    col[TYPE.COBBLE] = p.cobble;
    col[TYPE.FLOOR] = "#a9784a";
    col[TYPE.SCORCH] = "#3b342e";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) R(c, col[M.tiles[y * W + x]], x, y, 1, 1);
    M.natureTrees.forEach((t) => R(c, season === "Winter" ? "#c9d9e4" : shade(p.grass, -0.35), t.tx, t.ty, 1, 1));
    M.buildings.forEach((b) => R(c, b.kind === "legacy" ? "#3b2a20" : b.wall || "#9a7a5a", b.x, b.y, b.w, b.h));
    M.wallsFor({}).forEach((w) => R(c, "#4d321d", w.tx, w.ty, 1, 1));
    R(c, "#a9784a", 11, 6, 10, 11);
    miniCache[season] = cv;
    return cv;
  }

  /* ------------------------------------------------------------------ trees */
  const treeCache = {};
  const SPECIES = {
    sapling_pine: "pine",
    sapling_cedar: "cedar",
    sapling_maple: "maple",
    sapling_cherry: "cherry",
    sapling_walnut: "walnut"
  };

  function leafColors(type, season, variant) {
    const v = variant % 3;
    const t = {
      maple: { Spring: ["#6dbb5a", "#4f9b45", "#8fd47a"], Summer: ["#3f9a45", "#2f7d37", "#5db25a"], Autumn: [["#d9531e", "#b53d16", "#f08a3a"], ["#e8912a", "#c46f18", "#f5b84a"], ["#c93d24", "#9c2c18", "#e8663a"]][v] },
      oak: { Spring: ["#6aa84f", "#528a3c", "#88c26a"], Summer: ["#4a8a3a", "#386f2d", "#62a550"], Autumn: [["#b9772a", "#935a1c", "#d9993e"], ["#a85f24", "#844518", "#c8802f"], ["#c18a30", "#9a6a1e", "#dca64a"]][v] },
      walnut: { Spring: ["#5f9a4a", "#497e38", "#7ab563"], Summer: ["#3e7d38", "#2f642b", "#559c4d"], Autumn: ["#9a7430", "#755520", "#bb9242"] },
      birch: { Spring: ["#8fc76a", "#74ad52", "#b0dc8c"], Summer: ["#6fae52", "#589440", "#8ac76c"], Autumn: [["#e6c23a", "#c59f22", "#f5dc6a"], ["#d9a02a", "#b68018", "#efc455"], ["#e8d04a", "#c4aa2c", "#f7e57c"]][v] },
      cherry: { Spring: ["#f4b6c8", "#e48fa8", "#fbd5e0"], Summer: ["#3f8f43", "#2f7335", "#5aae58"], Autumn: ["#c0562f", "#963f20", "#df7a46"] }
    };
    const set = t[type] && t[type][season];
    return set || null;
  }

  /* ---------------- per-pixel tree painter ----------------
     Trees are painted into a 64x96 buffer (anchor at 32,92) with lit-sphere leaf clumps or drooping
     conifer tiers, 5-tone hue-shifted ramps, ordered dithering between tones and a selective outline. */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const hx = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function ramp5(dark, mid, light) {
    const D = hx(dark), Mi = hx(mid), L = hx(light);
    return [mixc(D, [18, 28, 58], 0.5), D, Mi, L, mixc(L, [255, 246, 176], 0.42)];
  }
  function TreeBuf(s) {
    const w = 64, h = 96, tone = new Int8Array(w * h).fill(-1), pal = new Uint8Array(w * h), col = [];
    const idx = (x, y) => (y + 92) * w + (x + 32);
    const inb = (x, y) => x >= -32 && x < 32 && y >= -92 && y < 4;
    return {
      s, tone, pal, col,
      addRamp(r) { col.push(r); return col.length - 1; },
      get(x, y) { return inb(x, y) ? tone[idx(x, y)] : -1; },
      set(x, y, t, p) { if (!inb(x, y)) return; const i = idx(x, y); tone[i] = Math.max(0, Math.min(4, t)); pal[i] = p; },
      dim(x, y, k) { if (!inb(x, y)) return; const i = idx(x, y); if (tone[i] >= 0) tone[i] = Math.max(0, tone[i] - k); },
      q(l, x, y) { const b = (BAYER[((y + 96) & 3) * 4 + ((x + 64) & 3)] / 16 - 0.47) * 0.55; return Math.max(0, Math.min(4, Math.floor(l * 4.6 + b))); },
      outline(excludeTop) {
        // bottom/right silhouette pixels drop to the darkest tone; top-left edge keeps its light
        const t2 = tone.slice();
        for (let y = -92; y < 4; y++) for (let x = -32; x < 32; x++) {
          const i = idx(x, y); if (t2[i] < 0) continue;
          const e = (xx, yy) => !inb(xx, yy) || t2[idx(xx, yy)] < 0;
          if (e(x, y + 1) || e(x + 1, y)) tone[i] = 0;
          else if ((e(x - 1, y) || e(x, y - 1)) && !excludeTop) tone[i] = Math.min(4, t2[i] + 1);
        }
      },
      blit(c) {
        const cv = mk(w, h), x = cv.getContext("2d"), img = x.createImageData(w, h);
        for (let i = 0; i < w * h; i++) {
          if (tone[i] < 0) continue;
          const cc = col[pal[i]][tone[i]];
          img.data[i * 4] = cc[0]; img.data[i * 4 + 1] = cc[1]; img.data[i * 4 + 2] = cc[2]; img.data[i * 4 + 3] = 255;
        }
        x.putImageData(img, 0, 0);
        c.drawImage(cv, -32, -92);
      }
    };
  }
  const LX = -0.55, LY = -0.72, LZ = 0.42;   // light from the upper left, slightly in front

  function paintTrunk(B, type, s, top) {
    const birch = type === "birch";
    const P = B.addRamp(birch ? ramp5("#9c978a", "#d8d3c6", "#f4f1e8") : type === "walnut" ? ramp5("#2e1c12", "#4a3020", "#6b4630") : ramp5("#3a2414", "#5a3b22", "#7f5634"));
    const hw = Math.max(2, Math.round(4 * s)), y0 = Math.round(top * s);
    for (let y = y0; y <= 0; y++) {
      const flare = y > -4 * s ? Math.round((4 * s + y) * 1.2) : 0;
      for (let x = -hw - flare; x < hw + flare; x++) {
        const nx = (x + 0.5) / (hw + flare);
        let l = 0.62 - nx * 0.42;
        if (!birch && hash(x + 40, Math.floor(y / 3), 77) < 0.28) l -= 0.25;          // bark grooves
        if (!birch && hash(x, y, 78) < 0.08) l += 0.15;
        B.set(x, y, B.q(l, x, y), P);
      }
      if (birch && hash(0, y, 79) < 0.22 && y < -2) { const bx = -hw + Math.floor(hash(1, y, 80) * hw); B.set(bx, y, 0, P); B.set(bx + 1, y, 0, P); B.set(bx + 2, y, 1, P); }
    }
    // roots
    [[-1, 1], [1, 1]].forEach(([d]) => { for (let k = 0; k < Math.round(4 * s); k++) B.set(d * (hw + 2 + k), -1 + Math.floor(k / 2), k < 2 ? 1 : 2, P); });
    return P;
  }

  function paintBranches(B, s, P, spread) {
    const line = (x0, y0, x1, y1, th) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t); for (let k = 0; k < th; k++) B.set(x + k, y, k === 0 ? 3 : 1, P); }
    };
    line(0, Math.round(-26 * s), Math.round(-16 * spread * s), Math.round(-50 * s), 2);
    line(0, Math.round(-26 * s), Math.round(15 * spread * s), Math.round(-48 * s), 2);
    line(0, Math.round(-30 * s), Math.round(2 * s), Math.round(-66 * s), 2);
  }

  const SHAPES = {
    oak: { rx: 30, ry: 23, cy: -52, n: 13, cr: 0.42, top: -30 },
    maple: { rx: 27, ry: 25, cy: -54, n: 12, cr: 0.44, top: -30 },
    walnut: { rx: 30, ry: 20, cy: -50, n: 12, cr: 0.4, top: -30 },
    birch: { rx: 19, ry: 29, cy: -56, n: 11, cr: 0.42, top: -34 },
    cherry: { rx: 30, ry: 21, cy: -50, n: 13, cr: 0.42, top: -28 }
  };

  function drawLeafyRich(c, type, season, variant, s) {
    const B = TreeBuf(s), sh = SHAPES[type] || SHAPES.oak, seed = variant * 31 + type.length * 7;
    const tP = paintTrunk(B, type, s, sh.top + 4);
    const cols = season === "Winter" ? null : leafColors(type, season, variant);
    if (!cols) {
      const snowP = B.addRamp(ramp5("#9fb4c8", "#dfeaf3", "#ffffff"));
      const grow = (x, y, ang, len, th, depth) => {
        const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len, n = Math.max(1, Math.round(len));
        for (let i = 0; i <= n; i++) {
          const t = i / n, px = Math.round(x + (x1 - x) * t), py = Math.round(y + (y1 - y) * t), w = Math.max(1, Math.round(th * (1 - t * 0.4)));
          for (let k = 0; k < w; k++) B.set(px + k, py, k === 0 ? 3 : k === w - 1 ? 1 : 2, tP);
          if (B.get(px, py - 1) < 0 && Math.cos(ang) !== 0 && Math.abs(Math.sin(ang)) < 0.85 && hash(px, py, 86) < 0.7) B.set(px, py - 1, 3, snowP);
        }
        if (depth <= 0) return;
        const sp = 0.42 + hash(Math.round(x1), Math.round(y1), 87) * 0.25;
        grow(x1, y1, ang - sp, len * 0.68, th * 0.62, depth - 1);
        grow(x1, y1, ang + sp, len * 0.66, th * 0.62, depth - 1);
      };
      const ty = Math.round((SHAPES[type] || SHAPES.oak).top * s) + 4;
      grow(0, ty, -Math.PI / 2 - 0.5, 14 * s, 3 * s, 3);
      grow(1, ty, -Math.PI / 2 + 0.5, 14 * s, 3 * s, 3);
      grow(0, ty - 2, -Math.PI / 2 + (hash(variant, 1, 88) - 0.5) * 0.3, 18 * s, 3 * s, 3);
      B.outline(true); B.blit(c);
      return;
    }
    paintBranches(B, s, tP, 1);
    const P = B.addRamp(ramp5(cols[1], cols[0], cols[2]));
    const ox = (variant - 1) * 2 * s, cx0 = ox, cy0 = sh.cy * s, RX = sh.rx * s, RY = sh.ry * s;
    // clumps: one core, then a ring placed around the canopy ellipse, back (high) to front (low)
    const clumps = [{ x: cx0, y: cy0, r: Math.min(RX, RY) * 0.82 }];
    for (let i = 0; i < sh.n; i++) {
      const a = (i / sh.n) * Math.PI * 2 + hash(i, seed, 90) * 0.6, d = 0.45 + hash(i, seed, 91) * 0.35;
      clumps.push({ x: cx0 + Math.cos(a) * RX * d * 0.92, y: cy0 + Math.sin(a) * RY * d * 0.86, r: Math.min(RX, RY) * (sh.cr + hash(i, seed, 92) * 0.18) });
    }
    clumps.sort((a, b) => a.y - b.y);
    clumps.forEach((k, ci) => {
      // occlusion: shade what's already painted just outside this clump's lower-right rim
      for (let y = Math.floor(k.y - k.r - 3); y <= k.y + k.r + 3; y++) for (let x = Math.floor(k.x - k.r - 3); x <= k.x + k.r + 3; x++) {
        const d = Math.hypot(x - k.x, y - k.y);
        if (d > k.r && y > k.y - k.r * 0.35) { if (d < k.r + 1.3) B.dim(x, y, 2); else if (d < k.r + 2.6) B.dim(x, y, 1); }
      }
      for (let y = Math.floor(k.y - k.r - 1); y <= k.y + k.r + 1; y++) for (let x = Math.floor(k.x - k.r - 1); x <= k.x + k.r + 1; x++) {
        const ang = Math.atan2(y - k.y, x - k.x), rr = k.r * (1 + 0.13 * Math.sin(ang * 5 + ci * 1.7) + 0.06 * Math.sin(ang * 11 + ci));
        const dx = (x + 0.5 - k.x) / rr, dy = (y + 0.5 - k.y) / rr, d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2);
        // blend the clump's own roundness with the whole canopy's form
        const gx = (x - cx0) / RX, gy = (y - cy0) / RY, gz = Math.sqrt(Math.max(0, 1 - Math.min(1, gx * gx + gy * gy)));
        let nx = dx * 0.75 + gx * 0.25, ny = dy * 0.75 + gy * 0.25, nzz = nz * 0.75 + gz * 0.25;
        const nl = Math.hypot(nx, ny, nzz) || 1; nx /= nl; ny /= nl; nzz /= nl;
        let l = (nx * LX + ny * LY + nzz * LZ) * 0.7 + 0.2;
        // leaf texture: sparse 2px leaf glints and pockets rather than noise
        const lh = hash((x + (y >> 1 & 1)) >> 1, y >> 1, seed + 93);
        if (lh > 0.84) l += 0.2; else if (lh < 0.12) l -= 0.2;
        if (y > cy0 + RY * 0.4) l -= ((y - (cy0 + RY * 0.4)) / (RY * 0.6)) * 0.16;          // underside in shade
        B.set(x, y, B.q(l, x, y), P);
      }
    });
    // stray leaves on the rim
    for (let i = 0; i < 26; i++) {
      const a = hash(i, seed, 95) * Math.PI * 2, x = Math.round(cx0 + Math.cos(a) * (RX + 1)), y = Math.round(cy0 + Math.sin(a) * (RY + 1));
      if (B.get(x, y) < 0 && (B.get(x - 1, y) >= 0 || B.get(x + 1, y) >= 0 || B.get(x, y - 1) >= 0 || B.get(x, y + 1) >= 0)) B.set(x, y, Math.sin(a) < 0 ? 3 : 1, P);
    }
    B.outline(false);
    // blossoms, fruit, autumn speckle
    if (type === "cherry" && season === "Spring") {
      const W2 = B.addRamp(ramp5("#d98aa4", "#fbd5e0", "#ffffff"));
      for (let i = 0; i < 34; i++) { const x = Math.round(cx0 - RX + hash(i, seed, 96) * RX * 2), y = Math.round(cy0 - RY + hash(i, seed, 97) * RY * 1.6); if (B.get(x, y) >= 2) B.set(x, y, 4, W2); }
    }
    if (type === "cherry" && season === "Summer") {
      const F = B.addRamp(ramp5("#5a0e18", "#a8202f", "#f06a6a"));
      for (let i = 0; i < 9; i++) { const x = Math.round(cx0 - RX * 0.8 + hash(i, seed, 98) * RX * 1.6), y = Math.round(cy0 - RY * 0.2 + hash(i, seed, 99) * RY * 0.9); if (B.get(x, y) >= 0) { B.set(x, y, 2, F); B.set(x, y + 1, 1, F); B.set(x - 1, y, 3, F); } }
    }
    B.blit(c);
  }

  function drawConiferRich(c, type, season, variant, s) {
    const B = TreeBuf(s), cedar = type === "cedar", seed = variant * 17 + (cedar ? 5 : 0);
    paintTrunk(B, "pine", s, -16);
    const base = cedar ? ["#2c5a49", "#1f4538", "#437a63"] : [["#2f7a4c", "#215c38", "#4ea56a"], ["#2a7046", "#1d5233", "#46996a"], ["#36824f", "#256340", "#58b074"]][variant % 3];
    const P = B.addRamp(ramp5(base[1], base[0], base[2]));
    const snowP = season === "Winter" ? B.addRamp(ramp5("#8fa6bc", "#d6e4ef", "#ffffff")) : -1;
    const tiers = cedar ? 5 : 4, hwMax = (cedar ? 17 : 24) * s, tierH = (cedar ? 20 : 23) * s, step = (cedar ? 15 : 16) * s;
    for (let i = 0; i < tiers; i++) {
      const bottom = Math.round(-12 * s - i * step), top = Math.round(bottom - tierH), hw = hwMax - i * (cedar ? 3 : 5) * s;
      // occlusion on the tier below, under this tier's hem
      for (let x = Math.floor(-hw - 1); x <= hw + 1; x++) for (let k = 1; k <= 2; k++) B.dim(x, bottom + k + (Math.abs(x) % 4 === 1 ? 1 : 0), 1);
      for (let y = top; y <= bottom + 2; y++) {
        const t = (y - top) / (bottom - top);
        const half = hw * Math.pow(Math.max(0, Math.min(1, t)), 0.85) + (hash(i * 31 + y, seed, 100) - 0.5) * 2;
        for (let x = Math.floor(-half); x <= Math.ceil(half); x++) {
          // drooping needle tufts along the hem
          if (y > bottom) { const tuft = ((x + i * 2 + 64) % 4); if (y - bottom > (tuft === 1 ? 2 : tuft === 0 || tuft === 2 ? 1 : 0)) continue; }
          const nx = x / Math.max(1, half);
          let l = 0.56 + (-nx) * 0.3 * (nx < 0 ? 1.15 : 1) + (1 - t) * 0.16 - Math.max(0, (t - 0.72) / 0.28) * 0.3;
          // needle strokes slanting down and outward
          const sx = x < 0 ? -x : x;
          if ((sx * 2 + (y - top) * 3 + i) % 7 === 0) l -= 0.18;
          else if ((sx * 2 + (y - top) * 3 + i) % 7 === 3) l += 0.1;
          l += (hash(x, y, seed + 101) - 0.5) * 0.06;
          if (snowP >= 0 && t < (i === tiers - 1 ? 0.4 : 0.58) + (hash(x, i, 102) - 0.5) * 0.16) { B.set(x, y, B.q(0.62 + (-nx) * 0.3 - t * 0.5, x, y), snowP); continue; }
          B.set(x, y, B.q(l, x, y), P);
        }
      }
      // small cones
      if (i < 2 && hash(i, variant, 243) < 0.7) {
        const C = B.addRamp(ramp5("#3a2414", "#6a4528", "#8a5e36")), cx = Math.round(hw * 0.4);
        B.set(cx, bottom - 4, 3, C); B.set(cx, bottom - 3, 2, C); B.set(cx + 1, bottom - 3, 1, C); B.set(cx, bottom - 2, 1, C);
      }
    }
    // leader at the top
    const topY = Math.round(-12 * s - (tiers - 1) * step - tierH);
    for (let y = topY - Math.round(4 * s); y < topY + 2; y++) B.set(0, y, y < topY - 1 ? 3 : 2, P);
    B.outline(false);
    B.blit(c);
  }

  function drawSprout(c, season) {
    R(c, "rgba(0,0,0,0.2)", -7, -2, 14, 4);
    R(c, season === "Winter" ? "#c9d6e0" : "#6a4a2a", -6, -4, 12, 3);
    R(c, "#4f9a3c", -1, -14, 2, 12);
    blob(c, "#5fb04a", -5, -12, 5, 3, 1);
    blob(c, "#74c65c", 5, -15, 5, 3, 1);
    R(c, "#3f7f2e", 0, -16, 1, 3);
  }

  function getTree(type, season, variant, stage) {
    const key = type + "|" + season + "|" + variant + "|" + stage;
    if (treeCache[key]) return treeCache[key];
    const cv = mk(64, 96);
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.translate(32, 92);
    if (stage === 0) {
      drawSprout(c, season);
    } else {
      const k = stage === 1 ? 0.52 : 1;
      R(c, "rgba(0,0,0,0.22)", Math.round(-16 * k), Math.round(-3 * k), Math.round(32 * k), Math.max(3, Math.round(6 * k)));
      if (type === "pine" || type === "cedar") drawConiferRich(c, type, season, variant, k);
      else drawLeafyRich(c, type, season, variant, k);
    }
    treeCache[key] = cv;
    return cv;
  }

  /* ------------------------------------------------------------------ props & scenery (direct draw) */
  function drawProp(c, p, season, tick) {
    const x = p.tx * T, y = p.ty * T;
    const k = p.kind;
    if (k === "fence") {
      const right = M.fenceKeys.has(p.tx + 1 + "," + p.ty), down = M.fenceKeys.has(p.tx + "," + (p.ty + 1));
      const wood = "#a07a4a", woodD = "#6e502e";
      if (right) { R(c, woodD, x + 14, y + 12, T, 3); R(c, wood, x + 14, y + 11, T, 3); R(c, woodD, x + 14, y + 21, T, 3); R(c, wood, x + 14, y + 20, T, 3); }
      if (down) { R(c, wood, x + 14, y + 14, 4, T); R(c, woodD, x + 17, y + 14, 1, T); }
      R(c, "rgba(0,0,0,0.2)", x + 11, y + 28, 10, 3);
      R(c, woodD, x + 12, y + 6, 8, 24);
      R(c, wood, x + 12, y + 6, 6, 24);
      R(c, "#c49a62", x + 12, y + 6, 8, 3);
      if (season === "Winter") R(c, "#f2f7fb", x + 11, y + 4, 10, 3);
    } else if (k === "lamp") {
      R(c, "rgba(0,0,0,0.2)", x + 10, y + 28, 12, 3);
      R(c, "#2b2b30", x + 14, y - 18, 4, 46);
      R(c, "#2b2b30", x + 10, y - 22, 12, 6);
      R(c, "#f5d56a", x + 12, y - 16, 8, 10);
      R(c, "#fff3b8", x + 14, y - 14, 4, 5);
      R(c, "#2b2b30", x + 10, y - 24, 12, 3);
      R(c, "#2b2b30", x + 10, y + 26, 12, 4);
    } else if (k === "planter") {
      const fx = p.fix && ACM.Repairs.fixed(p.fix);
      R(c, "rgba(0,0,0,0.2)", x + 1, y + 27, 30, 4);
      R(c, fx ? "#8a5a30" : "#6a5a48", x + 2, y + 14, 28, 14); R(c, fx ? "#a8743f" : "#4a3f34", x + 2, y + 14, 28, 3);
      if (fx) { R(c, "#3a2a18", x + 4, y + 12, 24, 4); for (let i = 0; i < 5; i++) { R(c, "#3f8c47", x + 5 + i * 5, y + 6, 2, 8); R(c, ["#e8566a", "#f2c230", "#fff", "#c27ae0", "#e8566a"][i], x + 3 + i * 5, y + 2, 5, 5); } }
      else { R(c, "#1b120a", x + 12, y + 14, 2, 14); R(c, "#1b120a", x + 20, y + 20, 8, 2); R(c, "#6a5a48", x + 4, y + 11, 6, 3); R(c, "#4a3f34", x + 20, y + 11, 8, 3); R(c, "#6b5a3a", x + 8, y + 9, 3, 3); }
    } else if (k === "kiosk") {
      const fx = p.fix && ACM.Repairs.fixed(p.fix), t = fx ? 0 : 3;
      R(c, "rgba(0,0,0,0.2)", x + 2, y + 28, 28, 4);
      R(c, "#5a3a1c", x + 5 + t, y - 6, 4, 34); R(c, "#5a3a1c", x + 23 + t, y - 6, 4, 34);
      R(c, "#7b5431", x + 2 + t, y - 14, 28, 6); R(c, "#3d5a40", x, y - 18 + t, 32, 6);
      R(c, "#e8d9ae", x + 9 + t, y - 6, 14, 16); R(c, fx ? "#4e7a4a" : "#6b7a5a", x + 11 + t, y - 4, 10, 6); R(c, "#5a8ab0", x + 11 + t, y + 3, 10, 3);
      if (fx) R(c, "rgba(200,235,250,0.45)", x + 8, y - 7, 16, 18); else { R(c, "#1b120a", x + 9 + t, y - 6, 1, 8); R(c, "#e8d9ae", x + 20 + t, y + 12, 8, 6); R(c, "#5a3a1c", x + 22, y + 26, 10, 3); }
    } else if (k === "birdhouse") {
      const fx = p.fix && ACM.Repairs.fixed(p.fix);
      R(c, "#5a3a1c", x + 14, y - 4, 4, 32); R(c, "rgba(0,0,0,0.2)", x + 8, y + 28, 16, 3);
      if (fx) { R(c, "#c9744a", x + 7, y - 14, 18, 14); R(c, "#8a3b2e", x + 4, y - 20, 24, 8); R(c, "#6e2a20", x + 4, y - 14, 24, 2); R(c, "#2a1d12", x + 13, y - 10, 6, 6); R(c, "#e2b04a", x + 14, y - 3, 4, 2); R(c, "#f2c230", x + 22, y - 24, 4, 4); R(c, "#2a1d12", x + 25, y - 23, 1, 1); }
      else { R(c, "#8a6a45", x + 9, y - 8, 14, 10); R(c, "#6a4a2a", x + 6, y - 12, 12, 5); R(c, "#1b120a", x + 12, y - 4, 6, 5); R(c, "#1b120a", x + 18, y - 8, 2, 8); R(c, "#6a4a2a", x + 20, y + 20, 8, 4); }
    } else if (k === "rocker") {
      const fx = p.fix && ACM.Repairs.fixed(p.fix);
      R(c, "rgba(0,0,0,0.2)", x + 2, y + 27, 28, 4);
      R(c, fx ? "#a8743f" : "#8a6a45", x + 8, y - 8, 4, 24); R(c, fx ? "#a8743f" : "#8a6a45", x + 12, y - 2, 14, 4);
      R(c, fx ? "#c49656" : "#9a7a50", x + 6, y - 10, 8, 3); R(c, fx ? "#a8743f" : "#8a6a45", x + 20, y + 2, 4, 14);
      R(c, "#6e502e", x + 4, y + 18, fx ? 26 : 10, 3); R(c, "#6e502e", x + 6, y + 21, 22, 2);
      if (!fx) { R(c, "#1b120a", x + 14, y - 2, 2, 5); R(c, "#6e502e", x + 22, y + 22, 8, 3); R(c, "#6a4a2a", x + 18, y + 20, 5, 3); } else { R(c, "#d9a43a", x + 12, y + 4, 10, 4); R(c, "#e6bf86", x + 8, y - 8, 1, 22); }
    } else if (k === "totes") {
      const fx = p.fix && ACM.Repairs.fixed(p.fix);
      R(c, "rgba(0,0,0,0.2)", x + 2, y + 27, 28, 4); R(c, "#6e502e", x + 4, y - 8, 4, 36); R(c, "#6e502e", x + 24, y - 8, 4, 36); R(c, "#7b5431", x + 2, y - 10, 28, 4);
      [[8, "#c0392b"], [16, "#2f7d6d"], [22, "#d9a43a"]].forEach(([dx, cc], i) => { const hang = fx || i !== 1; R(c, cc, x + dx, y - 4 + (hang ? 0 : 6), 7, 12); R(c, "#f2ead3", x + dx + 1, y + (hang ? 0 : 6), 5, 2); if (!fx && i === 1) { R(c, "#1b120a", x + dx + 2, y + 8, 1, 6); R(c, "#1b120a", x + dx + 3, y + 12, 3, 1); } });
      if (!fx) R(c, "#c0392b", x + 2, y + 22, 8, 5);
    } else if (k === "bench") {
      const fx = !p.fix || ACM.Repairs.fixed(p.fix);
      R(c, "rgba(0,0,0,0.2)", x + 2, y + 26, 28, 4);
      R(c, "#4b3320", x + 4, y + 18, 4, 10); R(c, "#4b3320", x + 24, y + 18, 4, 10);
      R(c, fx ? "#b08650" : "#8f6a3f", x, y + 12, T, 7); R(c, fx ? "#c9a068" : "#a9824a", x, y + 12, T, 2);
      R(c, fx ? "#8f6a3f" : "#6e502e", x, y + 4, T, 6); R(c, fx ? "#a9824a" : "#8f6a3f", x, y + 4, T, 2);
      if (!fx) { R(c, "#1b120a", x + 10, y + 12, 8, 7); R(c, "#1b120a", x + 20, y + 4, 2, 6); R(c, "#4b3320", x + 22, y + 24, 8, 4); R(c, "#6e502e", x + 14, y + 26, 6, 2); }
      else { R(c, "#e2b04a", x + 2, y + 14, 2, 2); R(c, "#e2b04a", x + T - 4, y + 14, 2, 2); }
      if (season === "Winter") R(c, "#f2f7fb", x, y + 2, T, 3);
    } else if (k === "crate") {
      R(c, "rgba(0,0,0,0.2)", x + 2, y + 27, 28, 4);
      R(c, "#a77a44", x + 3, y + 8, 26, 21);
      R(c, "#c49656", x + 3, y + 8, 26, 3);
      R(c, "#6e4a26", x + 3, y + 8, 3, 21);
      R(c, "#6e4a26", x + 26, y + 8, 3, 21);
      R(c, "#6e4a26", x + 3, y + 17, 26, 3);
      R(c, "#6e4a26", x + 3, y + 26, 26, 3);
    } else if (k === "barrel") {
      R(c, "rgba(0,0,0,0.2)", x + 4, y + 27, 24, 4);
      blob(c, "#7a5230", x + 16, y + 20, 11, 10, 2);
      R(c, "#8f6a3f", x + 6, y + 8, 20, 20);
      R(c, "#a9824a", x + 8, y + 8, 6, 20);
      R(c, "#3a3a40", x + 6, y + 11, 20, 2);
      R(c, "#3a3a40", x + 6, y + 23, 20, 2);
      R(c, "#5a3a22", x + 8, y + 6, 16, 3);
    } else if (k === "logpile") {
      R(c, "rgba(0,0,0,0.2)", x, y + 26, T, 5);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - (r === 2 ? 1 : 0); i++) {
        const lx = x + 2 + i * 10 + (r === 2 ? 5 : 0), ly = y + 16 - r * 8 + (p.v || 0) % 2;
        blob(c, "#7a5230", lx + 5, ly + 5, 5, 5, 1);
        blob(c, "#d9b680", lx + 5, ly + 5, 3, 3, 1);
      }
      if (season === "Winter") R(c, "#f2f7fb", x + 2, y + 5, 26, 3);
    } else if (k === "cart") {
      R(c, "rgba(0,0,0,0.2)", x - 2, y + 28, 36, 4);
      R(c, "#7a5230", x - 2, y + 8, 36, 14);
      R(c, "#9a6e3e", x - 2, y + 8, 36, 3);
      blob(c, "#4a3626", x + 4, y + 24, 6, 6, 2);
      blob(c, "#4a3626", x + 26, y + 24, 6, 6, 2);
      for (let i = 0; i < 4; i++) R(c, "#c49a62", x + i * 8, y + 2, 6, 7);
    } else if (k === "cafetable") {
      R(c, "rgba(0,0,0,0.2)", x + 2, y + 27, 28, 4);
      R(c, "#4b3320", x + 14, y + 14, 4, 14);
      blob(c, "#d9d2bf", x + 16, y + 12, 13, 5, 2);
      blob(c, "#efe8d6", x + 16, y + 11, 11, 4, 2);
      R(c, "#c93d2f", x + 8, y + 6, 6, 6);
      R(c, "#2f7d6d", x + 20, y + 6, 6, 6);
    } else if (k === "dock") {
      // a short wooden pier reaching east over the water, with a row boat tied up once you have built one
      const len = (p.len || 3) * 32 - 8;
      R(c, "rgba(0,0,0,0.18)", x + 8, y + 22, len + 6, 6);
      R(c, "#7a5632", x + 4, y + 8, len, 14);
      for (let i = 0; i < len; i += 6) R(c, i % 12 ? "#8a6439" : "#6b4a2a", x + 4 + i, y + 8, 5, 14);
      R(c, "#4b3320", x + 4, y + 8, len, 1); R(c, "#4b3320", x + 4, y + 21, len, 1);
      [6, len - 4].forEach((o) => { R(c, "#3a2616", x + o, y + 3, 4, 22); R(c, "#5a3d22", x + o, y + 3, 4, 2); });
      const G = ACM.Game && ACM.Game.state;
      if (G && G.boat) {
        const bx = x + len - 30, by = y + 26;
        R(c, "rgba(0,0,0,0.2)", bx - 2, by + 11, 46, 4);
        R(c, "#2e1c0e", bx, by + 2, 44, 10); R(c, "#9b6b3a", bx + 2, by + 3, 40, 7); R(c, "#c4965a", bx + 2, by + 3, 40, 2);
        R(c, "#2e1c0e", bx - 4, by - 1, 6, 4); R(c, "#2e1c0e", bx + 42, by - 1, 6, 4);
        R(c, "#6e4a24", bx + 12, by + 4, 3, 5); R(c, "#6e4a24", bx + 28, by + 4, 3, 5);
        R(c, "#d9d2bf", bx + 8, by - 6, 2, 9); R(c, "#4b3320", bx + 6, by - 7, 10, 2);
      }
    } else if (k === "sign") {
      // one compact board: small type, sized to its text (long signs become a few short lines)
      R(c, "rgba(0,0,0,0.2)", x + 8, y + 28, 16, 3);
      R(c, "#4b3320", x + 14, y + 8, 4, 22);
      const lines = String(p.text || "").split("  ").map((l) => l.trim()).filter(Boolean);
      c.font = 'bold 7px "Trebuchet MS", sans-serif';
      const bw = Math.ceil(Math.max(...lines.map((l) => c.measureText(l).width))) + 8, bh = lines.length * 8 + 4, top = y + 10 - bh;
      R(c, "#2a1a0e", x + 16 - bw / 2 - 1, top - 1, bw + 2, bh + 2);
      R(c, "#6b4a2c", x + 16 - bw / 2, top, bw, bh);
      R(c, "#7e5a37", x + 16 - bw / 2, top, bw, 1);
      c.fillStyle = "#f6e7bf"; c.textAlign = "center"; c.textBaseline = "top";
      lines.forEach((ln, i) => c.fillText(ln, x + 16, top + 3 + i * 8));
    } else if (k === "well") {
      R(c, "rgba(0,0,0,0.2)", x + 2, y + 28, 28, 4);
      R(c, "#8a8478", x + 3, y + 12, 26, 18);
      for (let i = 0; i < 26; i += 8) R(c, "#6b655a", x + 3 + i, y + 12, 1, 18);
      R(c, "#a49e90", x + 3, y + 12, 26, 3);
      R(c, "#1d3550", x + 7, y + 14, 18, 5);
      R(c, "#4b3320", x + 3, y - 8, 3, 22);
      R(c, "#4b3320", x + 26, y - 8, 3, 22);
      R(c, "#7a2d2d", x - 1, y - 14, 34, 8);
      R(c, "#a04040", x - 1, y - 14, 34, 2);
      R(c, "#9a8a6a", x + 15, y - 6, 2, 12);
      if (season === "Winter") R(c, "#f2f7fb", x - 1, y - 16, 34, 3);
    } else if (k === "flowerbed") {
      R(c, "#5a3a22", x + 2, y + 14, 28, 12);
      R(c, "#3f2a18", x + 2, y + 22, 28, 4);
      const cols = season === "Winter" ? ["#ffffff", "#c9d9e6"] : season === "Autumn" ? ["#d9742a", "#e8b030", "#b9472a"] : ["#e85d75", "#f2c94c", "#ffffff", "#c04bd9"];
      if (season !== "Winter") for (let i = 0; i < 7; i++) R(c, "#3f8a3a", x + 4 + i * 4, y + 10 + (i % 2) * 3, 2, 8);
      for (let i = 0; i < 7; i++) R(c, cols[i % cols.length], x + 3 + i * 4, y + 8 + (i % 2) * 3 + (season === "Winter" ? 6 : 0), 4, 4);
    } else if (k === "haybale") {
      R(c, "rgba(0,0,0,0.2)", x + 2, y + 27, 28, 4);
      R(c, "#d2b04a", x + 2, y + 10, 28, 19);
      R(c, "#e6c866", x + 2, y + 10, 28, 3);
      for (let i = 0; i < 4; i++) R(c, "#a88a30", x + 2, y + 15 + i * 4, 28, 1);
      R(c, "#7a5a2a", x + 8, y + 10, 2, 19);
      R(c, "#7a5a2a", x + 21, y + 10, 2, 19);
    } else if (k === "pots") {
      R(c, "#b0653a", x + 10, y + 18, 12, 10);
      R(c, "#8a4a28", x + 8, y + 16, 16, 4);
      if (season !== "Winter") {
        R(c, "#3f8a3a", x + 14, y + 8, 4, 10);
        R(c, "#4f9d48", x + 9, y + 10, 6, 4);
        R(c, "#4f9d48", x + 17, y + 11, 6, 4);
      } else R(c, "#f2f7fb", x + 8, y + 14, 16, 3);
    } else if (k === "board") {
      R(c, "rgba(0,0,0,0.22)", x + 2, y + 58, 92, 6);
      R(c, "#4b3320", x + 8, y + 10, 6, 52);
      R(c, "#4b3320", x + 82, y + 10, 6, 52);
      R(c, "#7a2d2d", x + 2, y - 2, 92, 10);
      R(c, "#a04040", x + 2, y - 2, 92, 3);
      R(c, "#3a2414", x + 6, y + 8, 84, 40);
      R(c, "#d9c9a0", x + 8, y + 10, 80, 36);
      R(c, "#c4b080", x + 48, y + 10, 1, 36);
      const notes = [[12, 14, "#fffbe8"], [30, 20, "#f6e9b8"], [54, 13, "#fffbe8"], [70, 22, "#dcecf6"], [20, 32, "#f6e9b8"], [58, 31, "#fffbe8"]];
      notes.forEach(([nx, ny, col], i) => {
        R(c, "rgba(0,0,0,0.2)", x + nx + 1, y + ny + 1, 14, 12);
        R(c, col, x + nx, y + ny, 14, 12);
        R(c, "#c0392b", x + nx + 6, y + ny - 1, 2, 2);
        for (let l = 0; l < 3; l++) R(c, "#8a7a5a", x + nx + 2, y + ny + 3 + l * 3, 9 - (l === 2 ? 3 : 0), 1);
      });
      c.font = 'bold 8px "Trebuchet MS", sans-serif';
      c.fillStyle = "#f6e7bf";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("COMMISSIONS", x + 48, y + 3);
      if (season === "Winter") R(c, "#f2f7fb", x + 2, y - 5, 92, 4);
    } else if (k === "charlog") {
      R(c, "rgba(0,0,0,0.25)", x + 2, y + 24, 28, 5);
      const v = p.v || 0;
      if (v === 0) { R(c, "#1c1714", x + 2, y + 16, 28, 9); R(c, "#38302a", x + 2, y + 16, 28, 2); R(c, "#4a3a2e", x + 24, y + 18, 5, 5); }
      else if (v === 1) { beam(c, "#1c1714", x + 4, y + 26, x + 28, y + 8, 7); R(c, "#38302a", x + 12, y + 16, 3, 3); }
      else { R(c, "#1c1714", x + 6, y + 8, 7, 20); R(c, "#1c1714", x + 16, y + 14, 12, 12); R(c, "#38302a", x + 6, y + 8, 2, 20); }
    }
  }

  function drawScenery(c, s, season) {
    const x = s.tx * T, y = s.ty * T, v = s.v || 0;
    if (s.kind === "bush") {
      R(c, "rgba(0,0,0,0.2)", x + 3, y + 25, 26, 5);
      const cols = season === "Winter" ? ["#9fb4c4", "#bccfdd", "#e7f0f7"] : season === "Autumn" ? ["#8a5a1e", "#b8761e", "#d99a38"] : ["#2f7a3a", "#3f9248", "#5bb25d"];
      blob(c, cols[0], x + 16, y + 20, 14, 8, 2);
      blob(c, cols[1], x + 14, y + 17, 11, 7, 2);
      blob(c, cols[2], x + 11, y + 14, 5, 3, 1);
      if (v === 1 && (season === "Spring" || season === "Summer")) { R(c, "#e85d75", x + 8, y + 15, 3, 3); R(c, "#e85d75", x + 20, y + 19, 3, 3); R(c, "#f2c94c", x + 15, y + 12, 3, 3); }
      if (v === 2 && season !== "Winter") { R(c, "#c0392b", x + 9, y + 18, 3, 3); R(c, "#c0392b", x + 19, y + 15, 3, 3); R(c, "#c0392b", x + 15, y + 21, 3, 3); }
    } else if (s.kind === "rock") {
      R(c, "rgba(0,0,0,0.22)", x + 3, y + 25, 26, 5);
      blob(c, "#7b7f86", x + 16, y + 21, 12 - v, 8, 2);
      blob(c, "#9aa0a8", x + 14, y + 18, 9 - v, 6, 2);
      blob(c, "#bcc2c9", x + 11, y + 15, 4, 2, 1);
      if (v === 1) { blob(c, "#6e7279", x + 24, y + 24, 5, 4, 1); }
      if (season === "Winter") R(c, "#f2f7fb", x + 8, y + 13, 14, 3);
      else if (season !== "Autumn") R(c, "#5fa04e", x + 6, y + 22, 6, 2);
    } else if (s.kind === "stump") {
      R(c, "rgba(0,0,0,0.22)", x + 4, y + 25, 24, 5);
      R(c, "#5a3b22", x + 7, y + 14, 18, 14);
      R(c, "#7a5232", x + 7, y + 14, 5, 14);
      blob(c, "#c8a068", x + 16, y + 14, 9, 4, 2);
      blob(c, "#a98048", x + 16, y + 14, 5, 2, 1);
      if (season === "Winter") R(c, "#f2f7fb", x + 8, y + 11, 16, 3);
    } else if (s.kind === "mushroom") {
      R(c, "#efe8d4", x + 14, y + 20, 3, 6);
      blob(c, v ? "#c0392b" : "#b0763c", x + 15, y + 19, 5, 3, 1);
      R(c, "#ffffff", x + 13, y + 18, 1, 1);
    }
  }

  const FORAGE_COL = { blueberry: "#3b4a9b", raspberry: "#d6405a", cranberry: "#b3202f", morel: "#a98a5a", chanterelle: "#e8a93a" };
  // Wild forage. Bushes are always drawn (berries show when ripe); mushrooms appear only when there is something to pick.
  function drawForage(c, f, item, tick) {
    const x = f.tx * T, y = f.ty * T;
    if (f.kind === "bush") {
      const winter = false;
      R(c, "rgba(0,0,0,0.18)", x + 6, y + 24, 20, 4);
      blob(c, "#2d6e36", x + 16, y + 21, 10, 6, 2);
      blob(c, "#3f8c47", x + 14, y + 18, 8, 5, 2);
      blob(c, "#5bb25d", x + 11, y + 16, 3, 2, 1);
      if (item) {
        const col = FORAGE_COL[item];
        [[9, 17], [19, 20], [14, 21], [21, 16], [12, 14]].forEach((p) => R(c, col, x + p[0], y + p[1], 3, 3));
        const s = 0.5 + 0.5 * Math.sin(tick / 16 + f.tx);
        if (s > 0.9) R(c, "#fff6c8", x + 22, y + 13, 2, 2);
      }
    } else if (item) {
      const col = FORAGE_COL[item];
      R(c, "rgba(0,0,0,0.15)", x + 8, y + 24, 16, 3);
      R(c, "#efe8d4", x + 11, y + 20, 3, 5); R(c, "#efe8d4", x + 19, y + 21, 3, 4);
      blob(c, col, x + 12, y + 19, 5, 3, 1); blob(c, col, x + 20, y + 20, 4, 3, 1);
    }
  }

  /* ------------------------------------------------------------------ misc world overlays */
  function drawWaterShimmer(c, camX, camY, tick, vw, vh) {
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(W - 1, Math.floor((camX + vw) / T));
    const y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(H - 1, Math.floor((camY + vh) / T));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (M.tiles[ty * W + tx] !== TYPE.WATER) continue;
      const ph = (tick / 70 + hash(tx, ty, 300)) % 1;
      if (ph < 0.45) {
        const w = Math.round(Math.sin((ph / 0.45) * Math.PI) * 10);
        c.fillStyle = "rgba(255,255,255,0.55)";
        c.fillRect(tx * T + Math.floor(hash(tx, ty, 301) * 16), ty * T + 6 + Math.floor(hash(tx, ty, 302) * 18), w, 2);
      }
    }
  }

  function drawSmoke(c, px, py, tick, seed) {
    for (let i = 0; i < 5; i++) {
      const ph = ((tick + i * 24 + seed * 17) % 120) / 120;
      const x = px + Math.sin(ph * 6 + seed) * 4 + ph * 14;
      const y = py - ph * 46;
      const s = 4 + ph * 8;
      c.fillStyle = "rgba(235,235,235," + (0.55 * (1 - ph)).toFixed(2) + ")";
      c.fillRect(Math.round(x), Math.round(y), Math.round(s), Math.round(s));
    }
  }

  function drawRabbit(c, r, season) {
    const x = Math.round(r.x), y = Math.round(r.y - r.hopZ);
    const body = season === "Winter" ? "#f3f3f3" : "#b79a78";
    R(c, "rgba(0,0,0,0.25)", x - 6, Math.round(r.y) - 1, 12, 3);
    R(c, body, x - 5, y - 6, 10, 6);
    R(c, body, x + (r.dir >= 0 ? 3 : -8), y - 9, 5, 5);
    R(c, body, x + (r.dir >= 0 ? 4 : -7), y - 14, 2, 6);
    R(c, body, x + (r.dir >= 0 ? 6 : -5), y - 14, 2, 6);
    R(c, "#fff", x + (r.dir >= 0 ? -7 : 5), y - 5, 3, 3);
    R(c, "#222", x + (r.dir >= 0 ? 6 : -5), y - 8, 1, 1);
  }

  function drawStationMarker(c, st, tick) {
    const x = st.sx, y = st.sy - 34 + Math.sin(tick / 10) * 3;
    R(c, "rgba(0,0,0,0.3)", x - 10, st.sy - 2, 20, 4);
    R(c, "#f0be59", x - 3, y, 6, 6);
    R(c, "#f0be59", x - 6, y - 4, 12, 4);
    R(c, "#f0be59", x - 9, y - 8, 18, 4);
    R(c, "#6b4a15", x - 9, y - 9, 18, 1);
    c.font = 'bold 10px "Trebuchet MS", sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    const tw = Math.ceil(c.measureText("E").width);
    c.fillStyle = "#241509";
    c.fillText("E", x, y - 4);
  }

  function drawTileCursor(c, tx, ty, ok) {
    const x = tx * T, y = ty * T;
    c.fillStyle = ok ? "rgba(120,230,120,0.28)" : "rgba(235,90,80,0.30)";
    c.fillRect(x, y, T, T);
    c.strokeStyle = ok ? "#9cf09c" : "#ff7a6e";
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, T - 2, T - 2);
  }

  function drawReadyMark(c, tx, ty, tick) {
    const x = tx * T + 16, y = ty * T - 66 + Math.sin(tick / 12 + tx) * 3;
    R(c, "#fff3b8", x - 2, y, 4, 4);
    R(c, "#f0be59", x - 5, y + 1, 10, 2);
    R(c, "#f0be59", x - 1, y - 3, 2, 10);
  }

  /* ------------------------------------------------------------------ screen-space overlay */
  /** a bouncing, glowing arrow over the goal; when it is off screen, a pointer on the screen edge shows the way */
  function drawGoalArrow(ctx, goal, cam, VIEW_W, VIEW_H, player) {
    const t = Date.now() / 1000, sx = goal.x * cam.wz - cam.x, sy = goal.y * cam.wz - cam.y;
    const pulse = 0.5 + 0.5 * Math.sin(t * 5);
    const shape = (x, y, rot, s) => {
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(rot);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 34 * s);
      g.addColorStop(0, "rgba(255,224,110," + (0.55 + 0.3 * pulse) + ")"); g.addColorStop(1, "rgba(255,224,110,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 34 * s, 0, Math.PI * 2); ctx.fill();
      // pixel-style down arrow: shaft + head, dark outline, gold fill
      const P = (c, px, py, w, h) => { ctx.fillStyle = c; ctx.fillRect(px * 3 * s, py * 3 * s, w * 3 * s, h * 3 * s); };
      P("#3b2410", -3, -5, 6, 5); P("#3b2410", -5, -1, 10, 3); P("#3b2410", -3, 2, 6, 2); P("#3b2410", -1, 4, 2, 1);
      P("#ffd84a", -2, -4, 4, 4); P("#ffd84a", -4, -1, 8, 1); P("#ffd84a", -3, 0, 6, 1); P("#ffd84a", -2, 1, 4, 1); P("#ffd84a", -1, 2, 2, 1);
      P("#fff5b8", -1, -4, 1, 3);
      ctx.restore();
    };
    const m = 36;
    if (sx > m && sx < VIEW_W - m && sy > m && sy < VIEW_H - m) {
      shape(sx, sy - 22 - Math.abs(Math.sin(t * 4)) * 14, 0, 1);
    } else {
      const cx = VIEW_W / 2, cy = VIEW_H / 2, dx = sx - cx, dy = sy - cy, k = Math.min((VIEW_W / 2 - m) / Math.abs(dx || 1e-6), (VIEW_H / 2 - m) / Math.abs(dy || 1e-6));
      shape(cx + dx * k, cy + dy * k, Math.atan2(dy, dx) - Math.PI / 2, 0.8 + 0.1 * pulse);
    }
  }

  function drawOverlay(ctx, state, particles, birds, player, stations, VIEW_W, VIEW_H, plantInfo, cam, chaser, goal) {
    cam = cam || { x: 0, y: 0, wz: 1 };
    const wrap = (v, m) => ((v % m) + m) % m;
    particles.forEach((q) => {
      // weather lives in the world: it scrolls with the ground instead of sticking to the screen
      const p = { kind: q.kind, x: wrap(q.x - cam.x, VIEW_W), y: wrap(q.y - cam.y, VIEW_H) };
      if (p.kind === "rain") {
        ctx.strokeStyle = "rgba(186, 230, 253, 0.65)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 4, p.y + 12);
        ctx.stroke();
      } else if (p.kind === "snow") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(p.x, p.y, 4, 4);
      } else if (p.kind === "leaf") {
        ctx.fillStyle = state.season === "Autumn" ? "#ea580c" : "#fbcfe8";
        ctx.fillRect(p.x, p.y, 6, 4);
      }
    });
    const tm = state.timeMin == null ? 480 : state.timeMin;
    if (tm >= 360 && tm < 1170 && state.weather !== "Rain" && state.weather !== "Snow" && ACM.ArtCritters) {
      birds.forEach((b) => {
        const bx = b.x * cam.wz - cam.x, by = b.y * cam.wz - cam.y;
        if (bx < -30 || bx > VIEW_W + 30 || by < -30 || by > VIEW_H + 30) return;
        ACM.ArtCritters.drawBird(ctx, b, bx, by);
      });
    }

    if (chaser && ACM.ArtCritters) ACM.ArtCritters.drawSquirrelRun(ctx, chaser, chaser.x * cam.wz - cam.x, chaser.y * cam.wz - cam.y);

    if (goal) drawGoalArrow(ctx, goal, cam, VIEW_W, VIEW_H, player);

    // minimap
    const mw = 144, mh = 96, mx = VIEW_W - mw - 10, my = 10;
    ctx.fillStyle = "rgba(24, 15, 9, 0.88)";
    ctx.fillRect(mx - 3, my - 3, mw + 6, mh + 6);
    ctx.strokeStyle = "#d49b35";
    ctx.lineWidth = 2;
    ctx.strokeRect(mx - 3, my - 3, mw + 6, mh + 6);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(getMini(state.season || "Spring"), mx, my, mw, mh);
    const sx = mw / (W * T), sy = mh / (H * T);
    stations.forEach((s) => {
      if (s.measure) return;
      ctx.fillStyle = s.id === "legacy_house" ? "#e85d3a" : "#fff3b8";
      ctx.fillRect(Math.round(mx + s.sx * sx - 1), Math.round(my + s.sy * sy - 1), 3, 3);
    });
    if (goal) {
      const on = Math.floor(Date.now() / 350) % 2 === 0, gx = mx + goal.x * sx, gy = my + goal.y * sy;
      ctx.strokeStyle = on ? "#ffd84a" : "rgba(255,216,74,0.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gx, gy, on ? 6 : 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = on ? "#ffd84a" : "#c9962a"; ctx.fillRect(Math.round(gx - 2), Math.round(gy - 2), 4, 4);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(mx + player.x * sx - 2), Math.round(my + player.y * sy - 2), 4, 4);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(mx + player.x * sx - 2) + 0.5, Math.round(my + player.y * sy - 2) + 0.5, 4, 4);

    drawClockAndEnergy(ctx, state, VIEW_W, VIEW_H);

    if (plantInfo) {
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const label = plantInfo;
      const tw = Math.ceil(ctx.measureText(label).width) + 16;
      ctx.fillStyle = "rgba(24, 15, 9, 0.85)";
      ctx.fillRect(10, 70, tw, 24);
      ctx.strokeStyle = "#6fc46a";
      ctx.strokeRect(10.5, 70.5, tw - 1, 23);
      ctx.fillStyle = "#c9f2c4";
      ctx.fillText(label, 18, 82);
    }
  }


  /* ------------------------------------------------------------------ time of day */
  const SKY = [
    [360, 255, 150, 100, 0.30],
    [420, 255, 200, 150, 0.12],
    [480, 255, 232, 200, 0],
    [1020, 255, 232, 200, 0],
    [1110, 255, 140, 70, 0.30],
    [1200, 76, 52, 112, 0.50],
    [1290, 14, 20, 60, 0.66],
    [1440, 10, 14, 44, 0.72]
  ];

  function skyAt(min, weather) {
    const m = Math.max(360, Math.min(1440, min == null ? 600 : min));
    let r = SKY[0], g = SKY[0], i = 0;
    for (i = 0; i < SKY.length - 1; i++) if (m <= SKY[i + 1][0]) break;
    const A = SKY[Math.min(i, SKY.length - 2)], B = SKY[Math.min(i + 1, SKY.length - 1)];
    const t = B[0] === A[0] ? 0 : (m - A[0]) / (B[0] - A[0]);
    const lerp = (x, y) => x + (y - x) * t;
    let a = lerp(A[4], B[4]);
    if (weather === "Rain") a = Math.min(0.8, a + 0.1);
    return { r: Math.round(lerp(A[1], B[1])), g: Math.round(lerp(A[2], B[2])), b: Math.round(lerp(A[3], B[3])), a };
  }

  let lightCanvas = null;
  // lights: [{x,y,r,k,warm}] in world px. panes: [{x,y,w,h}] window glass that glows after dusk.
  function drawLighting(ctx, state, camX, camY, vw, vh, lights, panes) {
    const sky = skyAt(state.timeMin, state.weather);
    if (sky.a < 0.015) return sky;
    if (!lightCanvas) lightCanvas = mk(vw, vh);
    const o = lightCanvas.getContext("2d");
    o.globalCompositeOperation = "source-over";
    o.clearRect(0, 0, vw, vh);
    o.fillStyle = "rgba(" + sky.r + "," + sky.g + "," + sky.b + "," + sky.a.toFixed(3) + ")";
    o.fillRect(0, 0, vw, vh);
    const dark = Math.max(0, Math.min(1, (sky.a - 0.12) / 0.5));
    o.globalCompositeOperation = "destination-out";
    lights.forEach((l) => {
      const x = l.x - camX, y = l.y - camY;
      if (x < -l.r || y < -l.r || x > vw + l.r || y > vh + l.r) return;
      const gr = o.createRadialGradient(x, y, 2, x, y, l.r);
      const s = Math.min(1, dark * 1.6 * (l.k == null ? 1 : l.k));
      gr.addColorStop(0, "rgba(0,0,0," + s.toFixed(2) + ")");
      gr.addColorStop(0.55, "rgba(0,0,0," + (s * 0.55).toFixed(2) + ")");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      o.fillStyle = gr;
      o.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2);
    });
    o.globalCompositeOperation = "source-over";
    ctx.drawImage(lightCanvas, 0, 0);

    // warm glow where light sources are, and lit windows
    if (dark > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      lights.forEach((l) => {
        if (!l.warm) return;
        const x = l.x - camX, y = l.y - camY;
        if (x < -l.r || y < -l.r || x > vw + l.r || y > vh + l.r) return;
        const gr = ctx.createRadialGradient(x, y, 2, x, y, l.r * 0.9);
        gr.addColorStop(0, "rgba(255,170,70," + (0.26 * dark * (l.k == null ? 1 : l.k)).toFixed(3) + ")");
        gr.addColorStop(1, "rgba(255,170,70,0)");
        ctx.fillStyle = gr;
        ctx.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2);
      });
      ctx.restore();
      panes.forEach((p) => {
        const x = p.x - camX, y = p.y - camY;
        if (x < -40 || y < -40 || x > vw + 40 || y > vh + 40) return;
        ctx.fillStyle = "rgba(255,214,130," + Math.min(0.95, dark * 1.5).toFixed(2) + ")";
        ctx.fillRect(x, y, p.w, p.h);
        ctx.fillStyle = "rgba(255,244,205," + Math.min(0.9, dark * 1.3).toFixed(2) + ")";
        ctx.fillRect(x + 2, y + 2, Math.max(2, p.w - 4), 3);
      });
    }
    return sky;
  }

  function fmtTime(min) {
    const m = Math.floor(min == null ? 360 : min);
    const h24 = Math.floor(m / 60) % 24;
    const mm = Math.floor((m % 60) / 10) * 10;
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    return h + ":" + (mm === 0 ? "00" : mm);
  }

  function drawClockAndEnergy(ctx, state, VIEW_W, VIEW_H) {
    // clock panel (top-left)
    const px = 10, py = 10, pw = 150, ph = 52;
    ctx.fillStyle = "rgba(24, 15, 9, 0.88)";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#d49b35";
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.fillStyle = "#f0be59";
    ctx.fillText((state.season || "Spring") + " " + (state.dayCount || 1) + "  •  " + (state.weather || "Sunny"), px + 10, py + 15);
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillStyle = "#fff3d0";
    const ap = ((state.timeMin || 360) / 60) % 24 >= 12 ? "PM" : "AM";
    ctx.fillText(fmtTime(state.timeMin) + " " + ap, px + 10, py + 37);
    // sun / moon dot
    const hr = ((state.timeMin || 360) / 60) % 24;
    const night = hr >= 20.5 || hr < 5.5;
    ctx.fillStyle = night ? "#cfd8ff" : "#ffd54a";
    ctx.beginPath();
    ctx.arc(px + pw - 18, py + 36, 8, 0, Math.PI * 2);
    ctx.fill();
    if (night) { ctx.fillStyle = "rgba(24,15,9,1)"; ctx.beginPath(); ctx.arc(px + pw - 14, py + 34, 7, 0, Math.PI * 2); ctx.fill(); }

    // energy bar (bottom-right)
    const bw = 22, bh = 104, bx = VIEW_W - bw - 14, by = VIEW_H - bh - 26;
    const max = state.maxEnergy || 100;
    const ratio = Math.max(0, Math.min(1, (state.energy == null ? max : state.energy) / max));
    ctx.fillStyle = "rgba(24, 15, 9, 0.88)";
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    ctx.strokeStyle = "#d49b35";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 4, by - 4, bw + 8, bh + 8);
    ctx.fillStyle = "#3b2a1e";
    ctx.fillRect(bx, by, bw, bh);
    const col = ratio > 0.5 ? "#6fcf5a" : ratio > 0.2 ? "#f0be59" : "#e0553d";
    const fh = Math.round(bh * ratio);
    ctx.fillStyle = col;
    ctx.fillRect(bx, by + bh - fh, bw, fh);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(bx + 3, by + bh - fh, 4, fh);
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff3d0";
    ctx.fillText("E", bx + bw / 2, by - 14);
    ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
    ctx.fillText(Math.round(ratio * max), bx + bw / 2, by + bh + 15);
  }

  /* friendly ghost (Nell): a soft, translucent figure with a scarf */
  function drawGhost(ctx, x, y, tick) {
    const bob = Math.sin(tick / 22) * 3, al = 0.5 + Math.sin(tick / 37) * 0.12;
    ctx.save();
    ctx.globalAlpha = al;
    const X = Math.round(x), Y = Math.round(y + bob);
    ctx.fillStyle = "rgba(180,220,255,0.35)"; ctx.fillRect(X - 14, Y - 40, 28, 40);
    ctx.fillStyle = "#e9f4ff";
    ctx.fillRect(X - 8, Y - 38, 16, 8); ctx.fillRect(X - 10, Y - 32, 20, 22); ctx.fillRect(X - 12, Y - 22, 24, 14);
    for (let i = -12; i < 12; i += 8) ctx.fillRect(X + i, Y - 8, 6, 6 + ((i + tick / 10) % 3 > 1 ? 3 : 0));
    ctx.fillStyle = "#c98f8f"; ctx.fillRect(X - 10, Y - 29, 20, 3);
    ctx.fillStyle = "#3a4560"; ctx.fillRect(X - 5, Y - 34, 2, 3); ctx.fillRect(X + 3, Y - 34, 2, 3); ctx.fillRect(X - 3, Y - 28, 6, 1);
    ctx.globalAlpha = al * 0.6; ctx.fillStyle = "#fff"; ctx.fillRect(X - 3, Y - 50 + Math.sin(tick / 15) * 2, 2, 2); ctx.fillRect(X + 6, Y - 56 + Math.sin(tick / 12) * 2, 2, 2);
    ctx.restore();
  }

  function drawNpcBubble(ctx, x, y, tick, kind) {
    const bob = Math.sin(tick / 14) * 2;
    ctx.fillStyle = "#fffbe8";
    ctx.fillRect(x - 9, y - 12 + bob, 18, 14);
    ctx.fillRect(x - 2, y + 2 + bob, 5, 4);
    ctx.strokeStyle = "#6b4a2c";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 8.5, y - 11.5 + bob, 17, 13);
    ctx.fillStyle = kind === "job" ? "#d9892b" : "#6b4a2c";
    if (kind === "job") { ctx.fillRect(x - 1, y - 9 + bob, 3, 6); ctx.fillRect(x - 1, y - 1 + bob, 3, 2); }
    else { ctx.fillRect(x - 5, y - 6 + bob, 3, 3); ctx.fillRect(x - 1, y - 6 + bob, 3, 3); ctx.fillRect(x + 3, y - 6 + bob, 3, 3); }
  }

  return {
    PAL,
    skyAt,
    drawLighting,
    fmtTime,
    drawNpcBubble,
    drawGhost,
    drawClockAndEnergy,
    SPECIES,
    getGround,
    ensureGround,
    warmGround,
    getWorkshop,
    getTree,
    drawProp,
    drawScenery,
    drawForage,
    drawWaterShimmer,
    drawSmoke,
    drawRabbit,
    drawStationMarker,
    drawTileCursor,
    drawReadyMark,
    drawOverlay
  };
})();
