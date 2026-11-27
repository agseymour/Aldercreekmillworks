window.ACM = window.ACM || {};

/** ACM.ArtInteriors: paints the inside of buildings (floor, walls, furniture) in the same pixel style as the village. */
ACM.ArtInteriors = (function () {
  const T = 32;
  const R = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const WOOD = "#a9774a", WOOD_D = "#6b4423", WOOD_L = "#c9a06a", WOOD_DD = "#4a2f18";

  function windowColors(hour) {
    if (hour >= 7.5 && hour < 17.5) return ["#a9d6f2", "#d8eefb"];
    if (hour >= 17.5 && hour < 20) return ["#f2a65a", "#f9d49a"];
    if (hour >= 5.5 && hour < 7.5) return ["#f6c1a0", "#fbe3cf"];
    return ["#1b2745", "#2c3a63"];
  }

  function drawFloor(c, def, w, h) {
    for (let y = 2; y < h; y++) for (let x = 0; x < w; x++) {
      const px = x * T, py = y * T;
      if (def.floor === "tile") {
        R(c, (x + y) % 2 ? "#e4d9c0" : "#d6c9aa", px, py, T, T);
        R(c, "rgba(0,0,0,0.06)", px, py, T, 1); R(c, "rgba(0,0,0,0.06)", px, py, 1, T);
      } else if (def.floor === "dirt") {
        R(c, "#8b6b45", px, py, T, T);
        R(c, "#7a5c39", px + ((x * 7 + y * 3) % 20), py + ((x * 5 + y * 11) % 22), 6, 3);
      } else {
        R(c, (y % 2) ? "#b88a58" : "#c19564", px, py, T, T);
        R(c, "rgba(60,35,15,0.35)", px, py + 15, T, 1);
        R(c, "rgba(60,35,15,0.25)", px + ((x * 13 + y * 7) % 24) + 4, py, 1, 15);
        R(c, "rgba(60,35,15,0.25)", px + ((x * 5 + y * 17) % 24) + 4, py + 16, 1, 16);
      }
    }
  }

  function drawWalls(c, def, w, h, hour) {
    // back wall
    R(c, def.wall, 0, 0, w * T, 2 * T);
    for (let x = 0; x < w; x++) { R(c, "rgba(0,0,0,0.08)", x * T, 0, 1, 2 * T); }
    R(c, "rgba(255,255,255,0.08)", 0, 0, w * T, 3);
    R(c, def.wallTrim, 0, 2 * T - 8, w * T, 4);
    R(c, "rgba(0,0,0,0.25)", 0, 2 * T - 4, w * T, 4);
    // windows
    const [g1, g2] = windowColors(hour);
    (def.windows || []).forEach((wx) => {
      const x = wx * T + 4, y = 10;
      R(c, WOOD_DD, x - 3, y - 3, 30, 38);
      R(c, g1, x, y, 24, 32); R(c, g2, x, y, 24, 14);
      R(c, WOOD_DD, x + 11, y, 2, 32); R(c, WOOD_DD, x, y + 15, 24, 2);
      R(c, def.wallTrim, x - 4, y + 34, 32, 3);
    });
    // side walls and front wall
    R(c, WOOD_DD, 0, 2 * T, 6, (h - 2) * T);
    R(c, WOOD_DD, w * T - 6, 2 * T, 6, (h - 2) * T);
    R(c, "rgba(0,0,0,0.18)", 6, 2 * T, 8, (h - 2) * T);
    R(c, "rgba(0,0,0,0.18)", w * T - 14, 2 * T, 8, (h - 2) * T);
    const fy = (h - 1) * T;
    for (let x = 0; x < w; x++) { if (x === def.exit) continue; R(c, def.wall, x * T, fy + 8, T, T - 8); R(c, def.wallTrim, x * T, fy + 8, T, 3); R(c, "rgba(0,0,0,0.25)", x * T, fy + 11, T, 3); }
    // door
    const dx = def.exit * T;
    R(c, "#e8d49a", dx + 2, fy + 8, T - 4, T - 8);
    R(c, "rgba(255,240,170,0.5)", dx + 4, fy + 6, T - 8, T - 6);
    R(c, WOOD_DD, dx - 2, fy + 4, 4, T - 4); R(c, WOOD_DD, dx + T - 2, fy + 4, 4, T - 4); R(c, WOOD_DD, dx - 2, fy + 2, T + 4, 4);
  }

  function shelfItems(c, o, kind) {
    const w = o.w * T;
    for (let row = 0; row < 2; row++) {
      R(c, WOOD_DD, o.x * T, o.y * T + 6 + row * 16, w, 3);
      for (let i = 0; i < o.w * 3; i++) {
        const x = o.x * T + 5 + i * 10.5, y = o.y * T + 8 + row * 16 - 10 + (row ? 0 : 2);
        if (kind === "tools") { R(c, ["#8d97a0", "#c0392b", "#d9892b", "#555e66"][(i + row) % 4], x, y, 4, 10); R(c, WOOD_D, x + 1, y + 7, 2, 4); }
        else if (kind === "jars") { R(c, ["#c0392b", "#e8a93a", "#6b8e4e", "#8a5a30"][(i + row * 2) % 4], x, y + 2, 7, 9); R(c, "#e8e8e8", x, y + 1, 7, 2); }
        else { R(c, "#6b8e4e", x, y + 2, 7, 8); }
      }
    }
  }


  /* damage before, fresh wood after, for furniture that already has a normal drawing */
  function overlayRepair(c, o, x, y, w, h) {
    const fixed = ACM.Repairs && ACM.Repairs.fixed(o.fix);
    if (o.t === "bookcase") {
      if (!fixed) {
        R(c, "#1b120a", x + w - 36, y - 8, 30, 3); R(c, "#1b120a", x + w - 36, y + 12, 26, 14);                    // collapsed shelf boards
        R(c, WOOD_DD, x + w - 30, y + 20, 26, 4); R(c, "#8a2f2f", x + w - 28, y + 24, 12, 4); R(c, "#2f5d8a", x + w - 14, y + 25, 10, 3);   // books slid to the bottom
        R(c, "#1b120a", x + 8, y - 6, 1, 14); R(c, "#1b120a", x + 9, y + 8, 3, 1);
        R(c, "#6a3d7a", x + w + 1, y + 24, 8, 3); R(c, "#d9a43a", x + w + 6, y + 27, 7, 3);                          // books on the floor
      } else {
        R(c, "#e6bf86", x + 2, y - 8, w - 4, 2); R(c, "#e6bf86", x + 2, y + 9, w - 4, 2); R(c, "#e2b04a", x + w / 2 - 6, y - 2, 12, 4); R(c, "#fff6d8", x + 2, y - 8, 1, 30);
      }
    } else if (o.t === "shelf") {
      if (!fixed) { R(c, "#2a1d12", x + 3, y + 3, w - 6, T - 8); R(c, WOOD_DD, x + 4, y + 14, w - 8, 3); R(c, "#6a5a40", x + 6, y + 8, 10, 3); }
      else { R(c, "#e6bf86", x + 2, y + 2, w - 4, 1); for (let i = 0; i < o.w * 3; i++) { R(c, i % 2 ? "#d9a96a" : "#f0d9a8", x + 6 + i * 10, y + 8, 8, 5); R(c, "#a8743f", x + 6 + i * 10, y + 11, 8, 2); } }
    } else if (o.t === "trophy") {
      if (!fixed) { R(c, "rgba(20,20,20,0.35)", x + 3, y + 9, w - 6, T - 12); R(c, "#e8eef3", x + 16, y + 9, 1, 14); R(c, "#e8eef3", x + 17, y + 14, 12, 1); R(c, "#e8eef3", x + w - 30, y + 9, 1, 18); R(c, "#e8eef3", x + w - 29, y + 18, 9, 1); R(c, "#3b2813", x + 40, y + 12, 18, 18); }
      else { R(c, "rgba(190,230,250,0.35)", x + 3, y + 9, w - 6, T - 12); R(c, "rgba(255,255,255,0.6)", x + 6, y + 10, 2, 14); R(c, "rgba(255,255,255,0.4)", x + 12, y + 10, 8, 1); R(c, "#e2b04a", x + w / 2 - 8, y + T - 4, 16, 3); }
    } else if (o.t === "long_table") {
      if (!fixed) { R(c, "#1b120a", x + w / 2 - 2, y + 6, 3, 14); R(c, "#1b120a", x + w / 2, y + 12, 22, 2); R(c, "#3b2813", x + w - 16, y + h - 14, 8, 10); R(c, "#8a2f2f", x + w - 24, y + h - 12, 10, 8); R(c, "#2f5d8a", x + w - 24, y + h - 20, 10, 8); }
      else { R(c, "#e6bf86", x + 2, y + 5, w - 4, 2); R(c, "#e2b04a", x + 2, y + 18, 6, 3); R(c, "#e2b04a", x + w - 8, y + 18, 6, 3); }
    }
  }

  function drawObject(c, o, tick) {
    const x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T;
    switch (o.t) {
      case "rug": R(c, o.c || "#8a2f2f", x, y, w, h); R(c, "rgba(255,255,255,0.15)", x + 3, y + 3, w - 6, 2); R(c, "rgba(255,255,255,0.15)", x + 3, y + h - 5, w - 6, 2); R(c, "rgba(255,255,255,0.12)", x + 8, y + 8, w - 16, h - 16); R(c, o.c || "#8a2f2f", x + 10, y + 10, w - 20, h - 20); break;
      case "counter":
        R(c, "rgba(0,0,0,0.2)", x + 2, y + h - 2, w, 5);
        R(c, WOOD_D, x, y + 6, w, h - 6); R(c, WOOD, x, y + 6, w, 4);
        for (let i = 0; i < o.w; i++) { R(c, WOOD_DD, x + i * T + 3, y + 16, T - 6, h - 20); R(c, WOOD, x + i * T + 5, y + 18, T - 10, h - 24); }
        R(c, WOOD_L, x - 2, y + 2, w + 4, 6); R(c, "rgba(255,255,255,0.25)", x - 2, y + 2, w + 4, 1);
        break;
      case "shelf": R(c, WOOD_D, x, y, w, T); R(c, "#3b2813", x + 2, y + 2, w - 4, T - 4); shelfItems(c, o, o.items); break;
      case "bookcase": R(c, WOOD_D, x, y - 10, w, T + 10); R(c, "#3b2813", x + 2, y - 8, w - 4, T + 6);
        for (let r = 0; r < 2; r++) { R(c, WOOD_D, x + 2, y - 8 + r * 20 + 17, w - 4, 3); for (let i = 0; i < o.w * 5; i++) R(c, ["#8a2f2f", "#2f5d8a", "#d9a43a", "#4e7a4a", "#6a3d7a"][(i + r) % 5], x + 5 + i * 6, y - 5 + r * 20, 5, 15 - (i % 3)); } break;
      case "barrel": R(c, "rgba(0,0,0,0.2)", x + 4, y + 26, 24, 5); R(c, WOOD_D, x + 5, y + 6, 22, 22); R(c, WOOD, x + 7, y + 6, 6, 22); R(c, "#555e66", x + 5, y + 11, 22, 2); R(c, "#555e66", x + 5, y + 22, 22, 2); R(c, WOOD_L, x + 6, y + 4, 20, 4); break;
      case "crate": R(c, "rgba(0,0,0,0.2)", x + 3, y + 26, 26, 5); R(c, WOOD, x + 4, y + 8, 24, 20); R(c, WOOD_D, x + 4, y + 8, 24, 3); R(c, WOOD_D, x + 4, y + 25, 24, 3); R(c, WOOD_D, x + 14, y + 8, 3, 20); R(c, WOOD_L, x + 6, y + 12, 6, 2); break;
      case "plant": R(c, "#8a4a2a", x + 10, y + 18, 12, 10); R(c, "#6b3820", x + 10, y + 18, 12, 2); R(c, "#3f8c47", x + 8, y + 6, 6, 14); R(c, "#5bb25d", x + 14, y + 2, 6, 18); R(c, "#2d6e36", x + 18, y + 8, 6, 12); break;
      case "lamp": R(c, "#3b2813", x + 14, y + 12, 4, 16); R(c, "#3b2813", x + 10, y + 26, 12, 3); R(c, "#f6d98a", x + 9, y + 4, 14, 10); R(c, "#fff1b8", x + 11, y + 6, 10, 5); R(c, "rgba(255,225,140,0.18)", x - 8, y - 6, 48, 40); break;
      case "logs": for (let i = 0; i < o.w; i++) for (let j = 0; j < o.h; j++) { R(c, "#6b4423", x + i * T + 2, y + j * T + 8, T - 4, T - 6); R(c, "#c8a068", x + i * T + 4, y + j * T + 10, T - 8, T - 10); R(c, "#a98048", x + i * T + 10, y + j * T + 16, 10, 8); } break;
      case "saplings": R(c, WOOD_D, x, y + 12, w, 20); R(c, "#3b2813", x + 2, y + 14, w - 4, 16); for (let i = 0; i < o.w * 2; i++) { R(c, "#8a4a2a", x + 6 + i * 14, y + 20, 10, 9); R(c, "#4f9a3c", x + 8 + i * 14, y + 8, 6, 14); R(c, "#6fbf55", x + 6 + i * 14, y + 12, 4, 6); } break;
      case "sawmachine": R(c, "rgba(0,0,0,0.2)", x + 4, y + h - 4, w, 6); R(c, "#555e66", x + 4, y + 22, w - 8, h - 22); R(c, "#7b8590", x + 4, y + 22, w - 8, 6); R(c, "#c3ccd4", x + w / 2 - 18, y + 4, 36, 36); R(c, "#555e66", x + w / 2 - 6, y + 16, 12, 12); R(c, WOOD, x + 8, y + h - 20, w - 16, 8); for (let a = 0; a < 12; a++) R(c, "#e8eef3", x + w / 2 - 20 + Math.cos(a / 12 * 6.28 + tick / 12) * 20 + 18, y + 22 + Math.sin(a / 12 * 6.28 + tick / 12) * 18, 3, 3); break;
      case "stove": R(c, "rgba(0,0,0,0.2)", x + 2, y + 26, w, 6); R(c, "#3a3f46", x + 2, y + 2, w - 4, 28); R(c, "#555e66", x + 2, y + 2, w - 4, 5); R(c, "#1b1d21", x + 8, y + 12, 16, 12); R(c, "#e8742a", x + 11, y + 16, 10, 6); R(c, "#f6c04a", x + 14, y + 18, 4, 4); R(c, "#3a3f46", x + w - 16, y - 12, 10, 16); break;
      case "round_table": R(c, "rgba(0,0,0,0.2)", x + 6, y + h - 6, w - 8, 6); R(c, WOOD_D, x + w / 2 - 4, y + 22, 8, h - 24); R(c, "#f1e6c8", x + 6, y + 8, w - 12, h - 28); R(c, "#2f7d6d", x + 10, y + 12, w - 20, 4); R(c, "#d9a43a", x + w / 2 - 3, y + 8, 6, 5); R(c, WOOD, x - 4, y + h - 14, 10, 10); R(c, WOOD, x + w - 6, y + h - 14, 10, 10); break;
      case "table": R(c, "rgba(0,0,0,0.2)", x + 4, y + h - 3, w - 4, 6); R(c, WOOD_D, x + 6, y + 14, 6, h - 14); R(c, WOOD_D, x + w - 12, y + 14, 6, h - 14); R(c, WOOD_L, x, y + 6, w, 12); R(c, WOOD, x, y + 14, w, 5); R(c, "#e8d49a", x + w / 2 - 8, y + 8, 16, 7); break;
      case "long_table": R(c, "rgba(0,0,0,0.2)", x + 4, y + h - 3, w, 6); R(c, WOOD_D, x + 8, y + 16, 8, h - 16); R(c, WOOD_D, x + w - 16, y + 16, 8, h - 16); R(c, "#5a2d2d", x, y + 6, w, 14); R(c, "#6e3a3a", x, y + 6, w, 4); for (let i = 0; i < o.w; i++) R(c, "#f2ead3", x + i * T + 8, y + 9, 14, 8); break;
      case "drafting": R(c, "rgba(0,0,0,0.2)", x + 3, y + h - 3, w - 2, 6); R(c, WOOD_D, x + 4, y + 22, 6, h - 22); R(c, WOOD_D, x + w - 10, y + 22, 6, h - 22); R(c, WOOD_L, x, y + 8, w, 6); R(c, "#dfe9f3", x + 3, y + 3, w - 6, 16); R(c, "#9fb9d4", x + 3, y + 3, w - 6, 1); for (let gx = 9; gx < w - 6; gx += 6) R(c, "#b7cde2", x + gx, y + 4, 1, 14); for (let gy = 8; gy < 18; gy += 5) R(c, "#b7cde2", x + 4, y + gy, w - 8, 1); R(c, "#b42b2b", x + 12, y + 9, 16, 2); R(c, "#2f5d8a", x + 12, y + 9, 2, 8); R(c, "#2f5d8a", x + 12, y + 15, 16, 2); R(c, "#e8c547", x + w - 12, y + 12, 8, 2); break;
      case "desk": R(c, "rgba(0,0,0,0.2)", x + 4, y + h - 3, w, 6); R(c, WOOD_D, x, y + 8, w, h - 8); R(c, WOOD_L, x, y + 4, w, 8); R(c, "#f2ead3", x + 14, y + 4, 18, 6); R(c, "#8a2f2f", x + w - 20, y + 3, 10, 7); R(c, "#2f5d8a", x + w - 30, y + 4, 8, 6); break;
      case "pupil_desk": R(c, "rgba(0,0,0,0.2)", x + 2, y + 26, w, 5); R(c, WOOD_L, x + 2, y + 8, w - 4, 10); R(c, WOOD_D, x + 4, y + 18, 4, 10); R(c, WOOD_D, x + w - 8, y + 18, 4, 10); R(c, "#f2ead3", x + 10, y + 9, 12, 6); R(c, WOOD, x + 6, y + 26, w - 12, 5); break;
      case "chalkboard": R(c, WOOD_D, x, y + 12, w, h - 14); R(c, "#2a3d34", x + 4, y + 16, w - 8, h - 22); R(c, "#e8eef3", x + 12, y + 24, 30, 2); R(c, "#e8eef3", x + 12, y + 32, 52, 2); R(c, "#e8eef3", x + 12, y + 40, 22, 2); R(c, "#e8eef3", x + w - 54, y + 26, 8, 8); break;
      case "board": R(c, WOOD_D, x, y + 8, w, h - 10); R(c, "#c9a06a", x + 4, y + 12, w - 8, h - 18); [[10, 16, "#f6ecd0"], [40, 20, "#f2dca0"], [72, 16, "#f6ecd0"], [100, 22, "#e8d4a8"]].forEach(([dx, dy, col]) => { if (dx < w - 20) { R(c, col, x + dx, y + dy, 18, 20); R(c, "#c0392b", x + dx + 8, y + dy - 1, 3, 3); } }); break;
      case "flag": R(c, WOOD_DD, x + 14, y + 6, 3, h); R(c, "#2f5d8a", x + 17, y + 8, 16, 22); R(c, "#f2ead3", x + 21, y + 14, 8, 8); break;
      case "trophy": R(c, WOOD_D, x, y + 6, w, T - 6); R(c, "#3b2813", x + 3, y + 9, w - 6, T - 12); for (let i = 0; i < o.w; i++) { R(c, "#e2b04a", x + i * T + 12, y + 14, 8, 10); R(c, "#e2b04a", x + i * T + 9, y + 12, 14, 3); R(c, "#e2b04a", x + i * T + 14, y + 24, 4, 3); } break;
      case "map_table": R(c, "rgba(0,0,0,0.2)", x + 4, y + T - 3, w, 6); R(c, WOOD_D, x, y + 10, w, T - 10); R(c, "#e8d9ae", x + 2, y + 4, w - 4, 14); R(c, "#4e7a4a", x + 8, y + 7, 22, 8); R(c, "#5a8ab0", x + 36, y + 8, 14, 6); R(c, "#c0392b", x + 28, y + 6, 3, 3); break;
      case "bunk": R(c, "rgba(0,0,0,0.2)", x + 2, y + h - 4, w, 6); R(c, WOOD_D, x, y + 6, w, h - 6); R(c, "#4e6a4a", x + 4, y + 10, w - 8, 14); R(c, "#e8e8e0", x + 4, y + 10, 14, 14); R(c, "#4e6a4a", x + 4, y + 36, w - 8, 18); R(c, "#e8e8e0", x + 4, y + 36, 14, 14); break;
      case "bed": R(c, "rgba(0,0,0,0.2)", x + 2, y + h - 4, w, 6); R(c, WOOD_D, x, y + 4, w, h - 4); R(c, "#e8e0cc", x + 4, y + 8, w - 8, 22); R(c, "#f6f2e6", x + 6, y + 10, w - 12, 12); R(c, "#2f5d8a", x + 4, y + 30, w - 8, h - 36); R(c, "#2a4d78", x + 4, y + 30, w - 8, 3); break;
      case "kitchen": R(c, "rgba(0,0,0,0.2)", x + 2, y + T - 4, w, 6); R(c, WOOD_D, x, y - 6, w, T + 6); for (let i = 0; i < o.w; i++) { R(c, WOOD, x + i * T + 2, y - 4, T - 4, 18); R(c, WOOD_L, x + i * T + 4, y - 2, T - 8, 14); R(c, "#e2b04a", x + i * T + 22, y + 4, 3, 3); } R(c, "#c8c1ae", x, y + 14, w, 6); R(c, WOOD, x + 2, y + 20, w - 4, 10); break;
      case "toolrack": R(c, WOOD_D, x, y + 6, w, h - 8); R(c, "#3b2813", x + 3, y + 9, w - 6, h - 14); for (let i = 0; i < o.w * 2; i++) { R(c, "#8d97a0", x + 8 + i * 15, y + 14, 3, 22); R(c, WOOD, x + 7 + i * 15, y + 34, 5, 10); } break;
      case "workbench": R(c, "rgba(0,0,0,0.2)", x + 4, y + T - 3, w, 6); R(c, WOOD_D, x + 4, y + 14, 6, T - 14); R(c, WOOD_D, x + w - 10, y + 14, 6, T - 14); R(c, WOOD_L, x, y + 4, w, 12); R(c, WOOD, x, y + 14, w, 4); R(c, "#8d97a0", x + 10, y + 2, 14, 4); R(c, "#c0392b", x + 40, y + 1, 10, 6); break;
      case "frames": {
        const fixed = !o.fix || (ACM.Repairs && ACM.Repairs.fixed(o.fix));
        for (let i = 0; i < 4; i++) {
          const fx = x + 6 + i * 30, fy = y + 14 + (i % 2) * 6, tilt = fixed ? 0 : [3, -4, 5, -2][i];
          if (!fixed && i === 2) { R(c, "#2a1d12", fx - 1, fy + 28, 24, 4); R(c, WOOD_D, fx + 2, fy + 28, 8, 2); continue; }   // one frame has fallen
          R(c, WOOD_DD, fx, fy + tilt, 22, 26); R(c, fixed ? "#c9a06a" : "#a98048", fx + 2, fy + 2 + tilt, 18, 22); R(c, ["#5a8ab0", "#7aa84c", "#c9744a", "#8a6ab0"][i], fx + 4, fy + 5 + tilt, 14, 10); R(c, "#f2ead3", fx + 4, fy + 17 + tilt, 14, 3);
          if (!fixed) { R(c, "#1b120a", fx + 6, fy + 3 + tilt, 1, 12); R(c, "#e8e8e8", fx + 5, fy + 8 + tilt, 4, 1); } else { R(c, "#e2b04a", fx + 8, fy + 24, 6, 2); }
        }
        break; }
      case "butcher": { const fixed = !o.fix || ACM.Repairs.fixed(o.fix);
        R(c, "rgba(0,0,0,0.2)", x + 2, y + 26, 28, 5); R(c, WOOD_D, x + 4, y + 12, 24, 16); R(c, fixed ? "#d9a96a" : "#a98048", x + 2, y + 6, 28, 10);
        for (let i = 0; i < 5; i++) R(c, fixed ? "#c4935a" : "#7a5a30", x + 5 + i * 5, y + 7, 1, 8);
        if (!fixed) { R(c, "#1b120a", x + 14, y + 6, 2, 10); R(c, "#1b120a", x + 16, y + 10, 5, 2); R(c, WOOD_DD, x + 18, y + 14, 8, 4); } else { R(c, "#8d97a0", x + 20, y + 3, 7, 4); R(c, "#e8eef3", x + 20, y + 3, 7, 1); }
        break; }
      case "nightstand": { const fixed = !o.fix || ACM.Repairs.fixed(o.fix);
        R(c, "rgba(0,0,0,0.2)", x + 4, y + 27, 24, 5); R(c, WOOD_D, x + 5, y + 8, 22, 20); R(c, fixed ? WOOD_L : WOOD, x + 3, y + 6, 26, 5);
        if (fixed) { R(c, WOOD, x + 7, y + 13, 18, 6); R(c, "#e2b04a", x + 14, y + 15, 4, 2); R(c, WOOD, x + 7, y + 20, 18, 6); R(c, "#e2b04a", x + 14, y + 22, 4, 2); R(c, "#f6d98a", x + 20, y + 0, 6, 6); }
        else { R(c, "#1b120a", x + 7, y + 13, 18, 6); R(c, WOOD, x + 7, y + 20, 18, 6); R(c, "#555e66", x + 12, y + 14, 2, 2); R(c, "#1b120a", x + 10, y + 6, 1, 5); R(c, WOOD_DD, x + 22, y + 22, 6, 7); }
        break; }
      case "coffeetable": { const fixed = !o.fix || ACM.Repairs.fixed(o.fix);
        R(c, "rgba(0,0,0,0.2)", x + 4, y + 26, w - 4, 6); R(c, WOOD_D, x + 6, y + 16, 5, 13); R(c, WOOD_D, x + w - 12, y + 16, 5, fixed ? 13 : 7);
        R(c, fixed ? WOOD_L : WOOD, x + 2, y + 8, w - 4, 10); R(c, WOOD_D, x + 2, y + 16, w - 4, 3);
        if (fixed) { R(c, "#2f7d6d", x + 18, y + 4, 12, 6); R(c, "#f2ead3", x + 20, y + 5, 8, 3); } else { R(c, "#1b120a", x + 20, y + 8, 2, 10); R(c, WOOD_DD, x + w - 14, y + 22, 8, 6); R(c, "#555e66", x + w - 16, y + 18, 2, 6); }
        break; }
      default: R(c, WOOD, x, y, w, h);
    }
    if (o.fix && o.t !== "frames" && o.t !== "butcher" && o.t !== "nightstand" && o.t !== "coffeetable") overlayRepair(c, o, x, y, w, h);
  }

  function drawBackground(c, def, hour) {
    c.imageSmoothingEnabled = false;
    drawFloor(c, def, def.w, def.h);
    drawWalls(c, def, def.w, def.h, hour);
    // flat decor first (rugs); wall-mounted items too
    def.objs.forEach((o) => { if (o.t === "rug") drawObject(c, o, 0); });
  }

  const cache = {};
  function getBackground(def, hourKey) {
    const k = def.name + "|" + hourKey + "|" + (ACM.Repairs ? ACM.Repairs.sig() : "");
    if (cache[k]) return cache[k];
    const cv = document.createElement("canvas");
    cv.width = def.w * T; cv.height = def.h * T;
    const c = cv.getContext("2d");
    drawBackground(c, def, hourKey === "d" ? 12 : hourKey === "e" ? 18 : hourKey === "m" ? 6.5 : 23);
    def.objs.forEach((o) => { if (o.wall) drawObject(c, o, 0); });
    return (cache[k] = cv);
  }
  const hourKey = (hour) => (hour >= 7.5 && hour < 17.5 ? "d" : hour >= 17.5 && hour < 20 ? "e" : hour >= 5.5 && hour < 7.5 ? "m" : "n");

  return { drawObject, getBackground, hourKey };
})();
