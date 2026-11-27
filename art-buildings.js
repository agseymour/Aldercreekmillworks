window.ACM = window.ACM || {};

/* Shared little pixel helpers */
ACM.ArtUtil = (function () {
  function parse(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, amt) {
    const [r, g, b] = parse(hex);
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  function R(c, col, x, y, w, h) {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  // chunky pixel ellipse
  function blob(c, col, cx, cy, rx, ry, step) {
    step = step || 2;
    c.fillStyle = col;
    for (let dy = -ry; dy < ry; dy += step) {
      const t = (dy + step / 2) / ry;
      const half = Math.floor((rx * Math.sqrt(Math.max(0, 1 - t * t))) / step) * step;
      if (half > 0) c.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, step);
    }
  }
  // thick pixel line
  function beam(c, col, x0, y0, x1, y1, th) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    c.fillStyle = col;
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0;
      c.fillRect(Math.round(x0 + (x1 - x0) * t - th / 2), Math.round(y0 + (y1 - y0) * t - th / 2), th, th);
    }
  }
  function mk(w, h) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    return cv;
  }
  return { parse, shade, R, blob, beam, mk };
})();

ACM.ArtBuildings = (function () {
  const U = ACM.ArtUtil;
  const { shade, R, blob, beam, mk } = U;
  const T = 32;
  const M = ACM.Map;
  const cache = {};

  /* ---------------------------------------------------------- wall surfaces */
  function wallPattern(c, style, x0, y0, w, h, col) {
    R(c, col, x0, y0, w, h);
    if (style === "clapboard") {
      for (let y = y0 + 5, k = 0; y < y0 + h; y += 6, k++) {
        R(c, shade(col, -0.16), x0, y, w, 1);
        R(c, shade(col, 0.1), x0, y + 1, w, 1);
      }
    } else if (style === "plank") {
      for (let x = x0, k = 0; x < x0 + w; x += 8, k++) {
        if (k % 2) R(c, shade(col, 0.06), x, y0, 8, h);
        R(c, shade(col, -0.25), x, y0, 1, h);
        const hh = M.hash(k, y0, 77);
        if (hh < 0.35) R(c, shade(col, -0.3), x + 3, y0 + 10 + Math.floor(hh * 90) % Math.max(10, h - 20), 2, 3);
      }
    } else if (style === "log") {
      for (let y = y0, k = 0; y < y0 + h; y += 8, k++) {
        R(c, shade(col, k % 2 ? -0.07 : 0.05), x0, y, w, 7);
        R(c, shade(col, 0.16), x0, y + 1, w, 1);
        R(c, shade(col, -0.34), x0, y + 7, w, 1);
        for (let x = x0 + 6 + ((k * 23) % 31); x < x0 + w - 8; x += 37) R(c, shade(col, -0.2), x, y + 3, 7, 1);
        R(c, shade(col, 0.2), x0, y, 5, 7);
        R(c, shade(col, 0.2), x0 + w - 5, y, 5, 7);
        R(c, shade(col, -0.25), x0 + 2, y + 2, 1, 3);
      }
    } else if (style === "stone") {
      for (let y = y0, row = 0; y < y0 + h; y += 10, row++) {
        const off = row % 2 ? 10 : 0;
        for (let x = x0 - off; x < x0 + w; x += 20) {
          const t = M.hash(x, y, 31);
          const cx = Math.max(x0, x),
            cw = Math.min(x0 + w, x + 20) - cx;
          if (cw > 0) R(c, shade(col, (t - 0.5) * 0.18), cx, y, cw, 10);
          if (x >= x0) R(c, shade(col, -0.3), x, y, 1, 10);
        }
        R(c, shade(col, -0.3), x0, y + 9, w, 1);
        R(c, shade(col, 0.18), x0, y, w, 1);
      }
    }
  }

  function drawWindow(c, cx, y, wall, trim, season, shutters) {
    const w = 22, h = 26, x = Math.round(cx - w / 2);
    if (shutters) {
      R(c, shade(wall, -0.3), x - 7, y + 1, 5, h - 2);
      R(c, shade(wall, -0.3), x + w + 2, y + 1, 5, h - 2);
      for (let i = 4; i < h - 2; i += 4) {
        R(c, shade(wall, -0.45), x - 7, y + i, 5, 1);
        R(c, shade(wall, -0.45), x + w + 2, y + i, 5, 1);
      }
    }
    R(c, trim, x - 2, y - 3, w + 4, h + 5);
    R(c, "#33424d", x, y, w, h);
    R(c, "#9fcbe0", x + 1, y + 1, w - 2, h - 2);
    R(c, "#cfe9f5", x + 1, y + 1, w - 2, 7);
    R(c, trim, x + w / 2 - 1, y, 2, h);
    R(c, trim, x, y + h / 2 - 1, w, 2);
    R(c, "#ffffff", x + 3, y + 3, 3, 2);
    R(c, shade(trim, -0.25), x - 4, y + h + 2, w + 8, 3);
    if (season === "Winter") R(c, "#f2f7fb", x - 4, y + h - 1, w + 8, 3);
    if (season === "Spring" || season === "Summer") {
      // flower box
      R(c, "#5a3a22", x - 2, y + h + 5, w + 4, 4);
      for (let i = 0; i < 5; i++) R(c, ["#e85d75", "#f2c94c", "#ffffff", "#c04bd9", "#e85d75"][i], x + i * 5, y + h + 3, 3, 3);
    }
  }

  function drawDoor(c, cx, bottom, doorH, trim) {
    const w = 38, x = Math.round(cx - w / 2), y = bottom - doorH;
    R(c, shade(trim, -0.15), x - 5, y - 5, w + 10, doorH + 5);
    R(c, trim, x - 4, y - 4, w + 8, 3);
    R(c, "#4e3220", x, y, w, doorH);
    R(c, "#6b4630", x + 2, y + 2, w - 4, doorH - 2);
    R(c, "#9fcbe0", x + 5, y + 5, 12, 14);
    R(c, "#9fcbe0", x + 21, y + 5, 12, 14);
    R(c, "#4e3220", x + 18, y + 4, 2, 16);
    R(c, shade("#6b4630", -0.25), x + 5, y + 24, 12, doorH - 28);
    R(c, shade("#6b4630", -0.25), x + 21, y + 24, 12, doorH - 28);
    R(c, "#e0b64a", x + 17, y + doorH / 2 + 4, 4, 4);
    R(c, "#8d8478", x - 7, bottom - 3, w + 14, 5);
    R(c, "#a79e90", x - 7, bottom - 3, w + 14, 1);
  }

  function drawAwning(c, cx, y, width, cols) {
    const x = Math.round(cx - width / 2);
    for (let i = 0; i < Math.ceil(width / 8); i++) {
      const col = cols[i % 2];
      R(c, col, x + i * 8, y, 8, 12);
      R(c, col, x + i * 8 + 1, y + 12, 6, 2);
    }
    R(c, "rgba(255,255,255,0.25)", x, y, width, 2);
    R(c, "rgba(0,0,0,0.22)", x, y + 15, width, 3);
  }

  function drawSign(c, text, cx, y) {
    c.font = 'bold 9px "Trebuchet MS", Verdana, sans-serif';
    const tw = Math.ceil(c.measureText(text).width);
    const bw = tw + 14;
    R(c, "#2a1a0e", cx - bw / 2 - 1, y - 1, bw + 2, 16);
    R(c, "#6b4a2c", cx - bw / 2, y, bw, 14);
    R(c, "#7e5a37", cx - bw / 2, y, bw, 2);
    c.fillStyle = "#f6e7bf";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, cx, y + 7.5);
    R(c, "#2a1a0e", cx - bw / 2 + 6, y - 5, 1, 5);
    R(c, "#2a1a0e", cx + bw / 2 - 7, y - 5, 1, 5);
  }

  function drawRoof(c, w, roofH, col, season) {
    const dark = shade(col, -0.26), light = shade(col, 0.2);
    const left = (y) => Math.round(18 - 26 * (y / roofH));
    for (let y = 0; y < roofH; y++) R(c, col, left(y), y, w - 2 * left(y), 1);
    for (let y = 4, row = 0; y < roofH; y += 5, row++) {
      const l = left(y);
      R(c, dark, l, y, w - 2 * l, 1);
      for (let x = l + (row % 2) * 8; x < w - l; x += 16) R(c, dark, x, y - 4, 1, 4);
      for (let x = l + (row % 2) * 8 + 2; x < w - l - 4; x += 16) R(c, light, x, y - 3, 6, 1);
    }
    R(c, light, 18, 0, w - 36, 3);
    R(c, shade(col, -0.45), left(roofH - 1), roofH - 3, w - 2 * left(roofH - 1), 3);
    for (let y = 0; y < roofH; y++) {
      R(c, "rgba(0,0,0,0.18)", left(y), y, 3, 1);
      R(c, "rgba(255,255,255,0.10)", w - left(y) - 3, y, 3, 1);
    }
    R(c, "rgba(0,0,0,0.30)", -8, roofH, w + 16, 5);
    if (season === "Winter") {
      for (let y = 0; y < roofH * 0.5; y++) R(c, "#eef5fa", left(y), y, w - 2 * left(y), 1);
      for (let x = left(roofH * 0.5); x < w - left(roofH * 0.5); x += 4) {
        const dh = Math.floor(M.hash(x, roofH, 5) * 8);
        R(c, "#eef5fa", x, Math.floor(roofH * 0.5), 4, dh);
      }
      R(c, "#d4e2ee", 18, 3, w - 36, 2);
    }
  }

  function drawChimney(c, x, topY, bottomY, season) {
    R(c, "#7e3f33", x, topY, 16, bottomY - topY);
    for (let y = topY + 4; y < bottomY; y += 5) R(c, "#5d2b22", x, y, 16, 1);
    for (let y = topY, k = 0; y < bottomY; y += 5, k++) R(c, "#5d2b22", x + (k % 2 ? 4 : 10), y, 1, 5);
    R(c, "#4a4a52", x - 2, topY - 3, 20, 4);
    R(c, "#1b1410", x + 3, topY - 2, 10, 2);
    R(c, "rgba(255,255,255,0.12)", x + 12, topY, 4, bottomY - topY);
    if (season === "Winter") R(c, "#eef5fa", x - 2, topY - 6, 20, 4);
  }

  function windowSlots(w, doorCx, maxN) {
    const n = Math.max(1, Math.floor(w / 56));
    const slots = [];
    for (let i = 0; i < n; i++) {
      const cx = ((i + 0.5) * w) / n;
      if (Math.abs(cx - doorCx) >= 44) slots.push(cx);
    }
    slots.sort((a, b) => Math.abs(a - doorCx) - Math.abs(b - doorCx));
    return slots.slice(0, maxN);
  }

  /* ---------------------------------------------------------- standard building */
  function standardBuilding(c, b, w, h, season, opts) {
    opts = opts || {};
    const roofH = Math.round((h * 0.45) / 4) * 4;
    const doorCx = (b.doorX - b.x + 1) * T;
    const doorH = Math.min(54, h - roofH - 22);
    const trim = b.trim;

    R(c, "rgba(0,0,0,0.2)", 8, h - 3, w, 9);
    wallPattern(c, b.style, 0, roofH - 6, w, h - roofH + 6, b.wall);
    R(c, shade(b.wall, -0.32), 0, roofH - 6, 3, h - roofH + 6);
    R(c, shade(b.wall, -0.32), w - 3, roofH - 6, 3, h - roofH + 6);
    // stone foundation
    R(c, "#756d60", 0, h - 8, w, 8);
    for (let x = 0; x < w; x += 12) R(c, "#5b554b", x, h - 8, 1, 8);
    R(c, "#8c8475", 0, h - 8, w, 1);

    windowSlots(w, doorCx, b.windows || 4).forEach((cx) => drawWindow(c, cx, roofH + 24, b.wall, trim, season, b.style !== "stone"));
    drawDoor(c, doorCx, h - 6, doorH, trim);
    if (b.awning) drawAwning(c, doorCx, h - 8 - doorH - 12, 72, b.awning);

    if (b.columns) {
      R(c, shade(trim, -0.05), doorCx - 74, roofH + 2, 148, 12);
      R(c, shade(trim, -0.3), doorCx - 74, roofH + 13, 148, 2);
      [-58, -20, 20, 58].forEach((dx) => {
        R(c, trim, doorCx + dx - 5, roofH + 15, 10, h - roofH - 23);
        R(c, shade(trim, -0.2), doorCx + dx + 2, roofH + 15, 3, h - roofH - 23);
        R(c, shade(trim, 0.1), doorCx + dx - 7, roofH + 15, 14, 3);
        R(c, shade(trim, 0.1), doorCx + dx - 7, h - 11, 14, 3);
      });
      c.font = 'bold 9px "Trebuchet MS", Verdana, sans-serif';
      c.fillStyle = "#4a4030";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("TOWN HALL", doorCx, roofH + 9);
    } else if (b.sign && !opts.noSign) {
      drawSign(c, b.sign, doorCx, roofH + 4);
    }

    if (b.sawblade) {
      const sx = w - 62, sy = roofH + 52;
      blob(c, "#8f99a3", sx, sy, 20, 20, 2);
      blob(c, "#b7c0c8", sx - 2, sy - 2, 16, 16, 2);
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        R(c, "#8f99a3", sx + Math.cos(ang) * 20 - 2, sy + Math.sin(ang) * 20 - 2, 4, 4);
      }
      blob(c, "#4a3626", sx, sy, 5, 5, 1);
      R(c, "#6f7a84", sx - 1, sy - 14, 2, 28);
      R(c, "#6f7a84", sx - 14, sy - 1, 28, 2);
    }

    drawRoof(c, w, roofH, opts.roofColor || b.roof, season);

    if (b.chimney) drawChimney(c, Math.round(w * 0.72), -24, Math.round(roofH * 0.55), season);

    if (b.tower) {
      const tx = Math.round(w / 2 - 20);
      R(c, shade(b.wall, 0.05), tx, -34, 40, 44);
      R(c, shade(b.wall, -0.28), tx, -34, 3, 44);
      R(c, trim, tx - 2, -36, 44, 4);
      R(c, "#2b1f1a", tx + 10, -22, 20, 26);
      R(c, "#e0b64a", tx + 15, -14, 10, 10);
      R(c, "#b98d2c", tx + 15, -8, 10, 3);
      R(c, "#e0b64a", tx + 18, -18, 4, 4);
      for (let i = 0; i < 26; i += 2) R(c, b.roof, tx - 4 + i, -36 - 26 + Math.abs(13 - i) * 0 + 0, 0, 0);
      for (let r = 0; r < 26; r++) {
        const half = Math.round(24 * (1 - r / 26));
        R(c, shade(b.roof, r % 4 === 0 ? -0.15 : 0), tx + 20 - half, -36 - r, half * 2, 1);
      }
      if (season === "Winter") for (let r = 8; r < 26; r++) R(c, "#eef5fa", tx + 20 - Math.round(24 * (1 - r / 26)), -36 - r, 3, 1);
    }

    if (b.flag) {
      R(c, "#6a5a4a", Math.round(w / 2) - 1, -56, 3, 64);
      R(c, "#2a4d8f", Math.round(w / 2) + 2, -54, 30, 20);
      for (let i = 0; i < 20; i++) {
        R(c, "#f4f4f4", Math.round(w / 2) + 2 + Math.round((i * 28) / 20), -54 + i, 3, 1);
        R(c, "#f4f4f4", Math.round(w / 2) + 2 + 27 - Math.round((i * 28) / 20), -54 + i, 3, 1);
      }
      R(c, "#e0b64a", Math.round(w / 2) - 2, -59, 5, 4);
    }
  }

  /* ---------------------------------------------------------- the burned legacy house */
  function drawLegacy(c, w, h, season) {
    const ASH = "#2a2420", CHAR = "#1c1714", BURN = "#38302a";
    R(c, "rgba(0,0,0,0.25)", 10, h - 6, w - 14, 10);
    // interior slab
    R(c, "#262220", 14, Math.round(h * 0.52), w - 28, Math.round(h * 0.48) - 18);
    // back wall remnants
    const back = (x0, x1, topBase, jag) => {
      for (let x = x0; x < x1; x += 4) {
        const top = Math.round(topBase + M.hash(x, 3, 41) * jag);
        R(c, CHAR, x, top, 4, h - 20 - top);
        if ((x / 4) % 2 === 0) R(c, BURN, x, top, 2, h - 20 - top);
      }
    };
    back(16, 130, 86, 34);
    back(232, 336, 140, 26);
    // window holes
    R(c, "#100d0b", 52, 118, 24, 30);
    R(c, "#4a3b30", 50, 116, 28, 3);
    R(c, "#4a3b30", 50, 116, 3, 34);
    R(c, "#4a3b30", 75, 116, 3, 34);
    R(c, "#100d0b", 286, 164, 22, 26);
    // charred rafters sticking up
    beam(c, CHAR, 24, 90, 96, 22, 6);
    beam(c, CHAR, 54, 94, 118, 40, 5);
    beam(c, CHAR, 120, 88, 150, 52, 5);
    beam(c, BURN, 26, 92, 70, 50, 2);
    beam(c, CHAR, 238, 144, 300, 98, 5);
    beam(c, CHAR, 330, 140, 288, 112, 4);
    // collapsed beams in the ruin
    beam(c, CHAR, 118, h - 40, 196, h - 62, 7);
    beam(c, BURN, 120, h - 42, 170, h - 56, 2);
    beam(c, CHAR, 80, h - 36, 140, h - 48, 6);
    // stone chimney / fireplace, still standing
    const cx = 196;
    R(c, "#6a5d54", cx, 16, 40, h - 36);
    for (let y = 16, row = 0; y < h - 20; y += 9, row++) {
      R(c, "#4a3f39", cx, y + 8, 40, 1);
      for (let x = cx + (row % 2 ? 8 : 0); x < cx + 40; x += 16) R(c, "#4a3f39", x, y, 1, 9);
    }
    R(c, "rgba(0,0,0,0.5)", cx, 16, 40, 60);
    R(c, "#4a4a52", cx - 3, 12, 46, 5);
    R(c, "#0e0b0a", cx + 8, h - 78, 24, 58);
    blob(c, "#0e0b0a", cx + 20, h - 78, 12, 10, 2);
    R(c, "#5a4a40", cx + 4, h - 80, 32, 4);
    // front wall segments with the doorway gap
    const front = (x0, x1, hgt) => {
      for (let x = x0; x < x1; x += 4) {
        const top = h - 20 - Math.round(hgt * (0.55 + M.hash(x, 5, 43) * 0.5));
        R(c, CHAR, x, top, 4, h - 20 - top);
        R(c, ((x / 4) | 0) % 3 === 0 ? BURN : ASH, x, top, 2, h - 20 - top);
      }
    };
    front(10, 118, 60);
    front(202, 250, 36);
    front(262, 344, 44);
    // door frame (still standing) at the gate
    const dc = (80 - 76 + 1) * T;
    R(c, CHAR, dc - 22, h - 78, 7, 60);
    R(c, CHAR, dc + 15, h - 78, 7, 60);
    R(c, CHAR, dc - 24, h - 82, 52, 7);
    R(c, BURN, dc - 22, h - 78, 2, 60);
    // heritage cabinet, scorched but intact
    R(c, "#2b211b", 248, h - 92, 52, 72);
    R(c, "#5b3b24", 250, h - 90, 4, 68);
    R(c, "#5b3b24", 294, h - 90, 4, 68);
    R(c, "#3b2a20", 255, h - 88, 18, 30);
    R(c, "#3b2a20", 275, h - 88, 18, 30);
    R(c, "#6a4a30", 256, h - 87, 2, 28);
    R(c, "#3b2a20", 255, h - 54, 38, 28);
    R(c, "#8a6a42", 270, h - 72, 3, 3);
    R(c, "#8a6a42", 276, h - 72, 3, 3);
    // foundation
    R(c, "#6b655a", 6, h - 18, w - 12, 14);
    for (let x = 6; x < w - 6; x += 14) R(c, "#4d483f", x, h - 18, 1, 14);
    R(c, "#807a6d", 6, h - 18, w - 12, 2);
    R(c, "#262220", dc - 22, h - 18, 44, 14);
    // soot streaks
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(M.hash(i, 1, 61) * (w - 30)) + 10;
      R(c, "rgba(0,0,0,0.35)", x, h - 130 + Math.floor(M.hash(i, 2, 62) * 90), 2, 10 + Math.floor(M.hash(i, 3, 63) * 16));
    }
    // weeds and seasons
    const weed = season === "Winter" ? "#cfdbe6" : season === "Autumn" ? "#a8742a" : "#4f8a3c";
    for (let i = 0; i < 46; i++) {
      const x = 8 + Math.floor(M.hash(i, 8, 64) * (w - 20));
      const y = h - 8 - Math.floor(M.hash(i, 9, 65) * 18);
      R(c, weed, x, y - 4, 2, 6);
      if (season === "Spring" && i % 5 === 0) R(c, "#f2c94c", x - 1, y - 6, 3, 3);
    }
    if (season === "Winter") {
      R(c, "#eef5fa", 196, 12, 40, 5);
      for (let x = 16; x < 130; x += 4) R(c, "#eef5fa", x, Math.round(86 + M.hash(x, 3, 41) * 34) - 1, 4, 3);
      R(c, "#eef5fa", 10, h - 24, 108, 3);
    }
  }

  /* ---------------------------------------------------------- the player's homestead, built in stages */
  function drawHome(c, w, h, stage, season) {
    const doorCx = 160;
    R(c, "rgba(0,0,0,0.18)", 10, h - 4, w - 6, 9);
    if (stage <= 0) {
      R(c, "rgba(95,64,38,0.40)", 16, Math.round(h * 0.42), w - 32, Math.round(h * 0.58) - 14);
      const stakes = [[18, h * 0.42], [w - 22, h * 0.42], [18, h - 22], [w - 22, h - 22]];
      for (let i = 0; i < 2; i++) {
        c.fillStyle = "#efe4c8";
        c.fillRect(20, Math.round(stakes[0][1] + 6) + i * 0, w - 40, 1);
      }
      c.fillStyle = "#efe4c8";
      c.fillRect(20, Math.round(h * 0.42) + 6, w - 40, 1);
      c.fillRect(20, h - 18, w - 40, 1);
      c.fillRect(21, Math.round(h * 0.42) + 6, 1, Math.round(h * 0.58) - 24);
      c.fillRect(w - 21, Math.round(h * 0.42) + 6, 1, Math.round(h * 0.58) - 24);
      stakes.forEach(([x, y]) => {
        R(c, "#c9a25a", x, y, 4, 22);
        R(c, "#d94b3a", x + 4, y + 2, 7, 5);
      });
      for (let i = 0; i < 5; i++) {
        R(c, i % 2 ? "#c89a62" : "#d9ae74", w - 92, h - 46 + i * 5, 62, 4);
        R(c, "#8a6638", w - 92, h - 43 + i * 5, 62, 1);
      }
      R(c, "#6b4a2c", 46, h - 70, 4, 26);
      drawSign(c, "YOUR HOMESTEAD", 48, h - 86);
      return;
    }
    // stage 1+: stone foundation and timber sill
    const roofH = 116;
    const doorH = 54;
    const wall = "#a9825a", trim = "#f1e7cf";
    if (stage === 1) {
      R(c, "#756d60", 8, h - 70, w - 16, 62);
      for (let y = h - 70; y < h - 8; y += 8) {
        R(c, "#5b554b", 8, y + 7, w - 16, 1);
        for (let x = 8 + ((y / 8) % 2 ? 8 : 0); x < w - 8; x += 16) R(c, "#5b554b", x, y, 1, 8);
      }
      R(c, "#8c8475", 8, h - 70, w - 16, 2);
      R(c, "#a67c4e", 4, h - 76, w - 8, 8);
      R(c, "#c99a62", 4, h - 76, w - 8, 2);
      // sill beam joists
      for (let x = 24; x < w - 24; x += 28) R(c, "#8f6a3f", x, h - 68, 5, 56);
      return;
    }
    if (stage === 2) {
      // framed + sheathed walls, no roof yet
      wallPattern(c, "plank", 0, 70, w, h - 70, "#b99063");
      R(c, "#756d60", 0, h - 8, w, 8);
      [0, 64, 128, 192, 256, 312].forEach((x) => R(c, "#8f6a3f", x, 40, 8, h - 48));
      R(c, "#8f6a3f", 0, 64, w, 8);
      for (let i = 0; i < 6; i++) {
        beam(c, "#8f6a3f", 4 + i * 60, 66, 4 + i * 60 + 30, 8, 7);
        beam(c, "#8f6a3f", w - 4 - i * 60, 66, w - 4 - i * 60 - 30, 8, 7);
      }
      R(c, "#33241a", doorCx - 19, h - 8 - doorH, 38, doorH);
      R(c, "#c9a25a", doorCx - 24, h - 8 - doorH - 4, 48, 4);
      return;
    }
    // stage 3+: roof, porch, doors
    const b = Object.assign({}, M.home, { style: "clapboard", wall, trim, windows: 2 });
    standardBuilding(c, b, w, h, season, { roofColor: "#8a5a3a", noSign: true });
    if (stage >= 3) {
      R(c, "#a77a4a", doorCx - 62, h - 14, 124, 10);
      for (let x = doorCx - 62; x < doorCx + 62; x += 10) R(c, "#8a6038", x, h - 14, 1, 10);
      R(c, "#c99a62", doorCx - 62, h - 14, 124, 2);
      R(c, "#8f6a3f", doorCx - 60, h - 80, 6, 66);
      R(c, "#8f6a3f", doorCx + 54, h - 80, 6, 66);
      R(c, "#7a5230", doorCx - 68, h - 88, 136, 8);
      R(c, "#c99a62", doorCx - 68, h - 88, 136, 2);
      R(c, "rgba(0,0,0,0.22)", doorCx - 66, h - 80, 132, 4);
    }
    if (stage >= 4) {
      drawChimney(c, 250, -22, 70, season);
      R(c, "#c9a25a", 8, h - 30, 18, 4);
      if (season !== "Winter") for (let i = 0; i < 3; i++) R(c, ["#e85d75", "#f2c94c", "#ffffff"][i], 10 + i * 5, h - 34, 4, 4);
    }
    if (stage >= 5) {
      // glass conservatory on the right + veranda rail
      const gx = w - 96, gy = h - 112;
      R(c, "rgba(190,230,245,0.78)", gx, gy, 92, 100);
      R(c, "rgba(255,255,255,0.35)", gx + 6, gy + 6, 14, 60);
      for (let x = gx; x <= gx + 92; x += 23) R(c, "#f1ede2", x, gy, 3, 100);
      for (let y = gy; y <= gy + 100; y += 25) R(c, "#f1ede2", gx, y, 92, 3);
      for (let i = 0; i < 92; i += 4) R(c, "#e8edf2", gx + i, gy - 6 - Math.round(Math.sin((i / 92) * Math.PI) * 14), 4, 8);
      for (let i = 0; i < 8; i++) R(c, ["#e85d75", "#f2c94c", "#c04bd9", "#ffffff"][i % 4], gx + 8 + i * 10, gy + 84 - (i % 3) * 6, 5, 8);
      R(c, "#3f7a3a", gx + 6, gy + 90, 80, 8);
      // railing
      for (let x = 6; x < doorCx - 70; x += 12) R(c, "#f1e7cf", x, h - 30, 3, 20);
      R(c, "#f1e7cf", 6, h - 32, doorCx - 76, 3);
      // lantern
      R(c, "#2a2a2e", doorCx + 66, h - 100, 8, 12);
      R(c, "#f6d060", doorCx + 68, h - 98, 4, 8);
    }
  }


  /* restoration shown on the burned house as Nell's pieces are finished (stage 1-5) */
  function drawRestoration(c, w, h, stage) {
    if (!stage) return;
    const dc = (80 - 76 + 1) * T;
    const WOOD = "#b98550", WOODL = "#d9a86a", WOODD = "#7a5230", GLOW = "#ffd877";
    // 1: the kitchen doorway, new frame + threshold, warm light inside
    R(c, "#3a2616", dc - 15, h - 78, 30, 60);
    R(c, GLOW, dc - 12, h - 74, 24, 54); R(c, "#fff0b8", dc - 6, h - 70, 12, 40);
    R(c, WOOD, dc - 22, h - 78, 7, 60); R(c, WOOD, dc + 15, h - 78, 7, 60); R(c, WOOD, dc - 24, h - 82, 52, 7);
    R(c, WOODL, dc - 22, h - 78, 2, 60); R(c, WOODL, dc - 24, h - 82, 52, 2); R(c, WOODD, dc - 22, h - 20, 44, 3);
    // soft glow in the window holes
    R(c, "#5a4528", 52, 118, 24, 30); R(c, GLOW, 54, 120, 20, 26); R(c, "#7a5a30", 63, 120, 2, 26); R(c, "#7a5a30", 54, 132, 20, 2);
    // 2: pantry shelves with jars on the left of the ruin
    if (stage >= 2) {
      for (let i = 0; i < 3; i++) { const y = h - 86 + i * 20; R(c, WOOD, 140, y + 12, 56, 4); R(c, WOODD, 140, y + 15, 56, 1);
        ["#c0392b", "#7d3c98", "#2e86c1", "#e67e22"].forEach((col, j) => { R(c, col, 144 + j * 13, y, 8, 12); R(c, "#f0e6d0", 144 + j * 13, y, 8, 2); }); }
    }
    // 3: new face frames on the cabinet, 4: doors
    if (stage >= 3) { R(c, WOOD, 246, h - 94, 56, 4); R(c, WOOD, 246, h - 24, 56, 4); R(c, WOOD, 246, h - 94, 4, 74); R(c, WOOD, 298, h - 94, 4, 74); R(c, WOOD, 272, h - 94, 4, 74); R(c, WOODL, 246, h - 94, 56, 1); }
    if (stage >= 4) { R(c, WOODL, 251, h - 89, 20, 32); R(c, WOODL, 278, h - 89, 19, 32); R(c, WOODD, 251, h - 89, 20, 1); R(c, WOODD, 278, h - 89, 19, 1); R(c, "#e8c070", 267, h - 74, 3, 3); R(c, "#e8c070", 280, h - 74, 3, 3);
      R(c, WOODL, 251, h - 55, 20, 28); R(c, WOODL, 278, h - 55, 19, 28); }
    // 5: lantern at the gate, curl of chimney smoke, bright windows
    if (stage >= 5) {
      R(c, "#2a2a2e", dc + 30, h - 100, 8, 12); R(c, "#f6d060", dc + 32, h - 98, 4, 8);
      R(c, "rgba(255,216,119,0.25)", dc + 22, h - 108, 24, 28);
      for (let i = 0; i < 6; i++) R(c, "rgba(225,225,225,0.55)", 206 + Math.round(Math.sin(i) * 4) + i, 8 - i * 7, 6 - (i > 3 ? 2 : 0), 6);
    }
  }

  /* ---------------------------------------------------------- sprite cache access */
  function getSprite(b, season, stage) {
    const key = b.id + "|" + season + "|" + (stage || 0);
    if (cache[key]) return cache[key];
    const PADX = 16, PADT = 72;
    const w = b.w * T, h = b.h * T;
    const cv = mk(w + PADX * 2, h + PADT + 10);
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.translate(PADX, PADT);
    if (b.kind === "legacy") { drawLegacy(c, w, h, season); drawRestoration(c, w, h, stage || 0); }
    else if (b.kind === "home") drawHome(c, w, h, stage || 0, season);
    else standardBuilding(c, b, w, h, season);
    cache[key] = { cv, ox: PADX, oy: PADT };
    return cache[key];
  }

  // world-space rectangles of window glass (and door panes) so the night lighting can make them glow
  const paneCache = {};
  function windowRects(b, stage) {
    if (b.kind === "legacy") return [];
    if (b.kind === "home" && (stage || 0) < 3) return [];
    const key = b.id + "|" + (b.kind === "home" ? stage : 0);
    if (paneCache[key]) return paneCache[key];
    const w = b.w * T, h = b.h * T;
    const roofH = Math.round((h * 0.45) / 4) * 4;
    const doorCx = (b.doorX - b.x + 1) * T;
    const doorH = Math.min(54, h - roofH - 22);
    const out = [];
    windowSlots(w, doorCx, b.kind === "home" ? 2 : b.windows || 4).forEach((cx) =>
      out.push({ x: b.x * T + cx - 10, y: b.y * T + roofH + 25, w: 20, h: 24 })
    );
    const dy = b.y * T + h - 6 - doorH + 5;
    out.push({ x: b.x * T + doorCx - 14, y: dy, w: 12, h: 14 }, { x: b.x * T + doorCx + 2, y: dy, w: 12, h: 14 });
    paneCache[key] = out;
    return out;
  }

  function chimneyPoint(b, stage) {
    if (b.kind === "home") return stage >= 4 ? { x: b.x * T + 258, y: b.y * T - 26 } : null;
    if (!b.chimney) return null;
    return { x: b.x * T + Math.round(b.w * T * 0.72) + 8, y: b.y * T - 28 };
  }

  /* ---------------------------------------------------------- workshop furniture & machines */
  function drawFurniture(c, f) {
    const x = f.x * T, y = f.y * T, w = f.w * T, h = f.h * T;
    R(c, "rgba(0,0,0,0.22)", x + 3, y + h - 6, w, 8);
    if (f.kind === "desk") {
      R(c, "#5d3b20", x + 4, y + h - 14, 8, 12);
      R(c, "#5d3b20", x + w - 12, y + h - 14, 8, 12);
      R(c, "#8a5a30", x, y + 12, w, h - 24);
      R(c, "#a8733f", x, y + 12, w, 3);
      R(c, "#6b4524", x, y + h - 22, w, 8);
      R(c, "#3f2916", x + 10, y + h - 20, 18, 4);
      R(c, "#3f2916", x + w - 28, y + h - 20, 18, 4);
      R(c, "#dcecf6", x + 12, y + 16, 40, 24);
      R(c, "#6a9bc6", x + 12, y + 16, 40, 2);
      for (let i = 0; i < 4; i++) R(c, "#9cbfdc", x + 16, y + 21 + i * 4, 32, 1);
      R(c, "#e9dfc6", x + 56, y + 20, 18, 14);
      R(c, "#2f2f2f", x + 74, y + 22, 8, 2);
      R(c, "#2b2b2b", x + w - 20, y + 4, 4, 14);
      R(c, "#e0b64a", x + w - 26, y + 2, 16, 4);
      R(c, "rgba(255,230,150,0.25)", x + w - 30, y + 4, 24, 26);
    } else if (f.kind === "bench") {
      R(c, "#4b3320", x + 6, y + 22, 8, h - 24);
      R(c, "#4b3320", x + w - 14, y + 22, 8, h - 24);
      R(c, "#6b4a2c", x + 6, y + h - 22, w - 12, 5);
      R(c, "#9a6e3e", x, y + 12, w, 16);
      R(c, "#bf8f55", x, y + 12, w, 3);
      R(c, "#7d5630", x, y + 26, w, 3);
      R(c, "#555a62", x + 4, y + 8, 10, 14);
      R(c, "#8a909a", x + 6, y + 6, 6, 4);
      R(c, "#e8c53a", x + 36, y + 14, 16, 10);
      R(c, "#222", x + 40, y + 17, 8, 3);
      R(c, "#d9b66c", x + 62, y + 15, 28, 8);
      R(c, "#c49a50", x + 62, y + 21, 28, 2);
      R(c, "#c93d2f", x + 100, y + 15, 3, 10);
      R(c, "#8a909a", x + 98, y + 22, 18, 3);
    } else if (f.kind === "assembly") {
      R(c, "#4b3320", x + 6, y + 22, 8, h - 24);
      R(c, "#4b3320", x + w - 14, y + 22, 8, h - 24);
      R(c, "#a07442", x, y + 12, w, 16);
      R(c, "#c49656", x, y + 12, w, 3);
      R(c, "#7d5630", x, y + 26, w, 3);
      R(c, "#c7894a", x + 16, y + 2, 22, 16);
      R(c, "#8a5a2a", x + 16, y + 2, 22, 2);
      R(c, "#2a1a0e", x + 24, y + 8, 6, 6);
      R(c, "#8a909a", x + 52, y + 8, 4, 14);
      R(c, "#d94b3a", x + 50, y + 6, 8, 3);
      R(c, "#8a909a", x + 70, y + 8, 4, 14);
      R(c, "#d94b3a", x + 68, y + 6, 8, 3);
      R(c, "#e9e4d3", x + 94, y + 8, 6, 14);
      R(c, "#c29256", x + 106, y + 14, 14, 6);
      R(c, "#5a3a22", x + 118, y + 10, 3, 10);
    } else if (f.kind === "rack") {
      R(c, "#4b3320", x + 2, y + 6, 6, h - 8);
      R(c, "#4b3320", x + w / 2 - 3, y + 6, 6, h - 8);
      R(c, "#4b3320", x + w - 8, y + 6, 6, h - 8);
      [0, 1, 2].forEach((row) => {
        const ry = y + 10 + row * 16;
        R(c, "#6b4a2c", x, ry + 12, w, 4);
        for (let i = 0; i < 8; i++) {
          const cols = ["#d9b680", "#c28a54", "#8f5a38", "#e6cf9b", "#b0794a"];
          R(c, cols[(i + row * 2) % 5], x + 6 + i * 10, ry, 9, 12);
          R(c, "rgba(0,0,0,0.2)", x + 6 + i * 10, ry + 9, 9, 3);
        }
      });
    } else if (f.kind === "drafting") {
      R(c, "#5d3b20", x + 6, y + 30, 6, h - 32);
      R(c, "#5d3b20", x + w - 12, y + 30, 6, h - 32);
      R(c, "#6b4524", x + 8, y + h - 18, w - 16, 3);
      R(c, "#8a5a30", x + 2, y + 24, w - 4, 8);
      R(c, "#a8733f", x + 2, y + 24, w - 4, 2);
      R(c, "#dcecf6", x + 5, y + 6, w - 10, 20);
      R(c, "#6a9bc6", x + 5, y + 6, w - 10, 2);
      for (let i = 0; i < 4; i++) R(c, "#9cbfdc", x + 7, y + 11 + i * 4, w - 14, 1);
      for (let i = 0; i < 6; i++) R(c, "#9cbfdc", x + 9 + i * 8, y + 8, 1, 16);
      R(c, "#b42b2b", x + 14, y + 12, 22, 2); R(c, "#2f5d8a", x + 14, y + 12, 2, 10); R(c, "#2f5d8a", x + 14, y + 20, 22, 2);
      R(c, "#e8c547", x + w - 16, y + 14, 10, 2);
      R(c, "#c9a46a", x + 3, y + 8, 3, 18);
    } else if (f.kind === "sawhorses") {
      [x + 6, x + w - 18].forEach((px) => {
        R(c, "#7a5230", px, y + 8, 12, 4);
        beam(c, "#7a5230", px + 1, y + 10, px - 4, y + h, 4);
        beam(c, "#7a5230", px + 11, y + 10, px + 16, y + h, 4);
      });
      R(c, "#d2a86a", x + 2, y + 2, w - 4, 7);
      R(c, "#a9824a", x + 2, y + 8, w - 4, 1);
    }
  }

  function drawMachine(c, m) {
    const x = m.x * T, y = m.y * T, w = m.w * T, h = m.h * T;
    R(c, "rgba(0,0,0,0.25)", x + 3, y + h - 6, w, 8);
    const steel = "#9aa3ad", steelD = "#6d767f", red = "#b03a2e";
    if (m.tool === "table_saw") {
      R(c, "#4a4f57", x + 6, y + 30, 8, h - 32);
      R(c, "#4a4f57", x + w - 14, y + 30, 8, h - 32);
      R(c, red, x + 4, y + 22, w - 8, 14);
      R(c, steel, x, y + 10, w, 20);
      R(c, "#c9d1d9", x, y + 10, w, 3);
      R(c, steelD, x, y + 28, w, 2);
      R(c, "#1c1c1c", x + 38, y + 14, 3, 12);
      R(c, "#ddd", x + 36, y + 6, 8, 10);
      R(c, "#c2cad2", x + 10, y + 8, w - 24, 3);
      R(c, "#2a3036", x + 8, y + 5, w - 20, 3);
      R(c, "#e8d44a", x + w - 12, y + 24, 6, 6);
      R(c, "#d33", x + w - 18, y + 31, 6, 4);
    } else if (m.tool === "jointer") {
      R(c, "#4a4f57", x + 6, y + 36, w - 12, h - 38);
      R(c, "#2f7d5a", x + 8, y + 28, w - 16, 14);
      R(c, steel, x + 2, y + 14, w / 2 - 2, 16);
      R(c, "#b9c1c9", x + w / 2 + 2, y + 14, w / 2 - 4, 16);
      R(c, "#c9d1d9", x + 2, y + 14, w - 4, 2);
      R(c, steelD, x + 2, y + 6, w - 4, 7);
      R(c, "#1c1c1c", x + w / 2 - 2, y + 18, 4, 8);
      R(c, "#d33", x + w - 14, y + 34, 6, 6);
    } else if (m.tool === "planer") {
      R(c, "#4a4f57", x + 6, y + 40, w - 12, h - 42);
      R(c, "#2b5d8f", x + 2, y + 12, w - 4, 32);
      R(c, "#3b78b4", x + 2, y + 12, w - 4, 4);
      R(c, "#17314c", x + 8, y + 26, w - 16, 8);
      R(c, steel, x - 4, y + 30, 10, 6);
      R(c, steel, x + w - 6, y + 30, 10, 6);
      R(c, "#d94b3a", x + w / 2 - 6, y + 2, 12, 12);
      R(c, "#2a2a2a", x + w / 2 - 2, y + 6, 4, 4);
      R(c, "#e8d44a", x + w - 12, y + 18, 6, 6);
    } else if (m.tool === "band_saw") {
      R(c, "#4a4f57", x + 8, y + 40, w - 16, h - 42);
      R(c, "#3d4a3a", x + 12, y + 2, w - 24, 44);
      blob(c, "#2a3328", x + w / 2, y + 12, 12, 10, 2);
      blob(c, "#566853", x + w / 2, y + 36, 12, 10, 2);
      R(c, "#1c1c1c", x + w - 18, y + 6, 2, 38);
      R(c, steel, x + 2, y + 38, w - 4, 8);
      R(c, "#c9d1d9", x + 2, y + 38, w - 4, 2);
      R(c, "#d33", x + 10, y + 50, 6, 6);
    } else if (m.tool === "mitre_saw") {
      R(c, "#4a4f57", x + 4, y + 36, w - 8, 20);
      R(c, steel, x, y + 34, w, 8);
      R(c, "#c9d1d9", x, y + 34, w, 2);
      R(c, "#2a3036", x + 4, y + 26, w - 8, 8);
      R(c, "#c93d2f", x + 18, y + 6, 26, 24);
      R(c, "#e4e8ec", x + 20, y + 20, 22, 14);
      R(c, "#1c1c1c", x + 30, y + 20, 2, 14);
      R(c, "#2a2a2a", x + 40, y + 2, 6, 14);
    } else if (m.tool === "dust_collector") {
      R(c, "#4a4f57", x + 14, y + 44, w - 28, 12);
      R(c, "#d3b98a", x + 10, y + 4, w - 20, 44);
      R(c, "#b59a68", x + 10, y + 4, 5, 44);
      R(c, "#e6d1a4", x + w - 22, y + 4, 4, 44);
      for (let i = 0; i < 4; i++) R(c, "#a68a58", x + 10, y + 12 + i * 9, w - 20, 1);
      blob(c, "#c4a876", x + w / 2, y + 4, 22, 5, 2);
      R(c, "#2f2f35", x + w / 2 - 5, y - 8, 10, 12);
      R(c, "#d94b3a", x + w - 22, y + 50, 8, 4);
    }
  }

  return { getSprite, windowRects, chimneyPoint, drawFurniture, drawMachine, drawSign, drawChimney };
})();
