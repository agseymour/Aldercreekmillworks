window.ACM = window.ACM || {};

/**
 * ACM.Icons: original 32x32 pixel-art item icons, drawn in code (no image files).
 * Item keys: tool:<id>, board:<lumberId>, log:<type>, sapling:<id>, food:<id>.
 * get(key) returns a cached 32x32 canvas; scale it with image-rendering: pixelated.
 * Every icon is drawn flat, then given a dark 1px outline automatically.
 */
ACM.Icons = (function () {
  const SIZE = 32;
  const cache = {};
  const OUT = "#2b1d12";
  const WOODS = { pine: "#dcb678", cedar: "#c97a4c", birch: "#eadcb4", oak: "#b38b52", maple: "#d8b57e", cherry: "#a85a3c", walnut: "#5e3d28", poplar: "#cbc48c", spf: "#dac48c", reclaimed: "#8c7b62", ply: "#e3c98f" };
  const STEEL = "#aeb8c2", STEELD = "#6e7780", STEELL = "#e4eaf0", WOOD = "#a8743f", RED = "#c0392b", YEL = "#e2b04a", BLUE = "#4a6a8a", GREEN = "#2e9b6a", DARK = "#2a2a2a", CLEAR = "#cfe9f5";
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const q = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return "#" + ((1 << 24) + (q((n >> 16) & 255) << 16) + (q((n >> 8) & 255) << 8) + q(n & 255)).toString(16).slice(1);
  };
  let c;
  const P = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w || 1, h || 1); };
  /* bevelled box: light top/left edge, shaded bottom/right edge */
  const B = (x, y, w, h, col) => {
    P(col, x, y, w, h);
    if (w > 2 && h > 2) { P(shade(col, 1.25), x, y, w, 1); P(shade(col, 1.12), x, y, 1, h); P(shade(col, 0.78), x, y + h - 1, w, 1); P(shade(col, 0.86), x + w - 1, y, 1, h); }
  };
  /* filled ellipse by scanlines (crisp, no antialiasing) */
  const E = (cx, cy, rx, ry, col) => {
    c.fillStyle = col;
    for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.0001))); c.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
  };
  const woodOf = (id) => {
    if (/pine/.test(id)) return WOODS.pine; if (/cedar/.test(id)) return WOODS.cedar; if (/birch/.test(id)) return id.includes("ply") ? WOODS.ply : WOODS.birch;
    if (/oak/.test(id)) return WOODS.oak; if (/maple/.test(id)) return WOODS.maple; if (/cherry/.test(id)) return WOODS.cherry;
    if (/walnut/.test(id)) return WOODS.walnut; if (/poplar/.test(id)) return WOODS.poplar; if (/spf/.test(id)) return WOODS.spf; return WOODS.reclaimed;
  };
  const grain = (x, y, w, h, col) => { for (let i = 1; i < h - 1; i += 3) P(col, x + 2 + (i * 5) % 7, y + i, Math.max(3, w - 8 - ((i * 3) % 6)), 1); };

  /* ------------------------------------------------------------------ logs: bark cylinder with a ringed cut end */
  function log(type) {
    const w = WOODS[type] || WOODS.pine, bark = { birch: "#d8d2c4", pine: "#7a5a3a", cedar: "#8a5a3a", oak: "#6a5238", maple: "#7a6048", walnut: "#4a3326", cherry: "#6a3a2a" }[type] || "#7a5a3a";
    B(8, 9, 21, 16, bark);
    // bark texture: long grooves and scales
    for (let i = 0; i < 7; i++) { const x = 11 + i * 3; P(shade(bark, 0.6), x, 11 + (i % 3) * 2, 1, 8 - (i % 2) * 2); P(shade(bark, 1.3), x + 1, 12 + ((i + 1) % 3) * 2, 1, 4); }
    if (type === "birch") { for (let i = 0; i < 5; i++) P("#3a3630", 12 + i * 4, 12 + (i * 5) % 9, 3, 1); }
    P(shade(bark, 1.35), 9, 10, 19, 2); P(shade(bark, 0.55), 9, 22, 19, 2);
    // knot + branch stub
    E(22, 17, 2, 2, shade(bark, 0.55)); P(shade(bark, 0.35), 22, 17, 1, 1);
    B(17, 5, 5, 5, bark); P(w, 17, 5, 5, 2); P(shade(w, 0.75), 19, 5, 1, 2);
    // moss
    P("#5a8a3a", 24, 10, 4, 2); P("#7aa84c", 25, 10, 2, 1);
    // cut end: ring pattern
    E(8, 17, 6, 8, shade(w, 0.62)); E(8, 17, 5, 7, w);
    E(8, 17, 4, 5, shade(w, 0.86)); E(8, 17, 3, 4, w); E(8, 17, 2, 2, shade(w, 0.8)); P(shade(w, 0.5), 8, 17, 1, 1);
    P(shade(w, 1.2), 5, 13, 3, 1); P(shade(w, 0.5), 11, 17, 1, 6);                // sheen and a check crack
  }

  /* ------------------------------------------------------------------ boards: two planks with end grain */
  function board(id) {
    const w = woodOf(id), rough = /rough|reclaimed/.test(id), ply = /ply/.test(id);
    [[2, 6], [5, 17]].forEach(([x, y], k) => {
      B(x, y, 22, 8, w);
      P(shade(w, 0.62), x + 22, y, 5, 8); P(shade(w, 0.78), x + 22, y, 5, 1);
      if (ply) { for (let i = 1; i < 8; i += 2) P(shade(w, 0.55), x + 22, y + i, 5, 1); for (let i = 3; i < 20; i += 7) P(shade(w, 0.8), x + i, y + 3, 5, 1); }
      else { grain(x, y, 22, 8, shade(w, 0.78)); for (let i = 0; i < 3; i++) P(shade(w, 0.6), x + 23 + (i % 2), y + 1 + i * 2, 3, 1); if (k === 0) { E(x + 10, y + 4, 2, 1, shade(w, 0.66)); } }
      if (rough) { P(shade(w, 0.45), x + 3, y + 1, 2, 1); P(shade(w, 0.45), x + 14, y + 6, 3, 1); P(shade(w, 0.45), x + 8, y + 7, 1, 1); P(shade(w, 1.3), x + 6, y + 2, 2, 1); }
    });
    P("rgba(0,0,0,0.25)", 6, 26, 22, 2);
  }

  /* ------------------------------------------------------------------ saplings */
  function sapling(id) {
    B(9, 21, 14, 9, "#6b4a2a"); P("#c9a45a", 9, 24, 14, 2); P("#8a6a38", 11, 24, 2, 2); P("#8a6a38", 17, 24, 2, 2);   // root ball in burlap
    P("#5a3a1c", 10, 22, 12, 1);
    B(15, 12, 2, 10, "#6b4a2a");
    if (/cedar|pine|spruce|fir/.test(id)) {
      const g = /cedar/.test(id) ? "#2f6f4a" : "#2d7a3a";
      for (let i = 0; i < 4; i++) { const hw = 3 + i * 2, y = 2 + i * 4; B(16 - hw, y + 2, hw * 2, 4, i % 2 ? shade(g, 0.85) : g); P(shade(g, 1.4), 16 - hw + 1, y + 2, hw, 1); P(shade(g, 0.6), 16 - hw, y + 5, hw * 2, 1); }
    } else {
      const g = /maple/.test(id) ? "#d0602a" : /cherry/.test(id) ? "#d986a0" : /birch/.test(id) ? "#8ab84c" : "#5a8a3a";
      E(11, 11, 5, 4, shade(g, 0.85)); E(21, 11, 5, 4, shade(g, 0.85)); E(16, 7, 6, 5, g); E(16, 13, 6, 4, shade(g, 0.9));
      P(shade(g, 1.35), 12, 4, 4, 1); P(shade(g, 1.3), 9, 9, 3, 1); P(shade(g, 0.65), 14, 16, 6, 1); P(shade(g, 0.7), 19, 12, 3, 1);
      if (/cherry/.test(id)) { P("#fff", 13, 6, 1, 1); P("#fff", 19, 9, 1, 1); P("#fff", 11, 12, 1, 1); }
    }
  }

  /* ------------------------------------------------------------------ tools */
  function tool(id) {
    switch (id) {
      case "tape_measure":
        B(5, 7, 21, 20, YEL); E(15, 17, 6, 6, "#3a3a3a"); E(15, 17, 3, 3, STEEL); P(DARK, 15, 17, 1, 1);
        P(shade(YEL, 0.7), 5, 24, 21, 3); B(23, 19, 7, 4, STEEL); for (let i = 0; i < 3; i++) P(DARK, 24 + i * 2, 19, 1, 2); B(29, 18, 2, 6, STEELD); P("#fff", 8, 9, 5, 1); P(DARK, 9, 25, 7, 1); break;
      case "framing_square":
        B(5, 3, 6, 26, STEEL); B(5, 23, 23, 6, STEEL);
        for (let y = 5; y < 22; y += 2) P(DARK, 5, y, y % 4 === 1 ? 4 : 2, 1); for (let x = 12; x < 27; x += 2) P(DARK, x, 23, 1, (x % 4) ? 2 : 4);
        P("#fff", 8, 5, 1, 16); P(STEELD, 9, 4, 1, 18); break;
      case "crosscut_saw":
        B(2, 8, 21, 11, STEEL); P(STEELL, 3, 10, 17, 1); P(shade(STEEL, 0.8), 3, 15, 17, 1);
        for (let x = 2; x < 22; x += 2) { P(STEELD, x, 19, 1, 2); P(STEELD, x + 1, 19, 1, 1); }
        B(21, 5, 10, 17, WOOD); P(DARK, 24, 9, 4, 7); P(shade(WOOD, 0.6), 22, 19, 8, 1); P(STEELL, 23, 8, 1, 1); P(shade(STEEL, 0.6), 21, 17, 3, 1); P("#d8d8d8", 22, 6, 1, 1); break;
      case "back_saw":
        B(2, 12, 21, 9, STEEL); B(2, 8, 21, 4, "#b8863a"); P(STEELL, 3, 14, 17, 1);
        for (let x = 2; x < 22; x++) if (x % 2) P(STEELD, x, 21, 1, 1);
        B(21, 6, 10, 17, "#6b4423"); P(DARK, 24, 10, 4, 7); P("#a8743f", 22, 7, 1, 14); break;
      case "japanese_back_saw":
        B(1, 12, 20, 6, STEEL); B(1, 9, 20, 3, "#6b6b73"); P(STEELL, 2, 14, 16, 1);
        for (let x = 1; x < 20; x++) if (x % 2) P(STEELD, x, 18, 1, 2);
        B(20, 10, 11, 6, "#c9a45a"); for (let x = 21; x < 30; x += 3) P("#7a5a22", x, 10, 1, 6); P(DARK, 30, 11, 1, 4); break;
      case "hammer": {   // claw hammer: small block head with a curved split claw, long ribbed grip
        B(14, 12, 6, 17, "#a8743f"); P("#6b4a2a", 14, 18, 6, 1); for (let y = 19; y < 28; y += 2) P("#5a3a1c", 14, y, 6, 1); B(13, 28, 8, 2, "#5a3a1c");
        B(7, 3, 19, 9, STEEL); B(22, 2, 5, 11, STEELL); P(STEELD, 22, 6, 5, 1);                    // head + striking face
        B(3, 5, 5, 4, STEEL); B(1, 8, 4, 4, STEEL); B(0, 11, 3, 3, STEEL); P(DARK, 4, 7, 1, 5);        // curved claw
        P(DARK, 2, 9, 1, 3); P(STEELL, 9, 4, 11, 1); P(STEELD, 9, 10, 12, 1); break; }
      case "safety_glasses":
        B(2, 10, 13, 10, CLEAR); B(17, 10, 13, 10, CLEAR); P("#fff", 4, 11, 4, 1); P("#fff", 19, 11, 4, 1); P("#fff", 4, 13, 1, 2); P("#fff", 19, 13, 1, 2);
        B(15, 12, 2, 3, YEL); B(0, 11, 3, 4, YEL); B(29, 11, 3, 4, YEL); P(shade(YEL, 0.6), 2, 19, 13, 1); P(shade(YEL, 0.6), 17, 19, 13, 1); break;
      case "felling_axe": {   // long diagonal-free shaft with a big flared crescent bit and a short poll
        B(13, 3, 5, 27, "#a8743f"); P("#6b4a2a", 17, 3, 1, 27); for (let y = 8; y < 28; y += 4) P("#7a5232", 13, y, 4, 1); B(12, 28, 7, 3, "#5a3a1c");
        const w = [8, 11, 13, 14, 15, 15, 15, 15, 14, 13, 11, 8];
        w.forEach((ww, i) => { P(STEEL, 18, 3 + i, ww, 1); P(STEELL, 18, 3 + i, Math.min(3, ww), 1); P(STEELD, 18 + ww - 3, 3 + i, 3, 1); });
        P(STEELL, 18 + 14, 6, 1, 6);                                                               // cutting edge glint
        B(6, 5, 8, 8, STEELD); P(STEEL, 7, 6, 3, 1); P(DARK, 14, 6, 1, 6); P(DARK, 18, 4, 1, 10); break; }
      case "screwdriver":
        B(10, 2, 12, 14, RED); for (let y = 4; y < 15; y += 3) P(shade(RED, 0.6), 10, y, 12, 1); P("#f2a090", 12, 3, 1, 11);
        B(12, 16, 8, 3, STEELD); B(15, 19, 3, 10, STEEL); P(STEELL, 15, 19, 1, 10); B(14, 28, 5, 2, STEELD); P(DARK, 16, 29, 1, 1); break;
      case "cordless_drill":
        B(3, 5, 19, 10, GREEN); for (let i = 0; i < 4; i++) P(shade(GREEN, 0.6), 6 + i * 3, 7, 1, 5); B(21, 7, 6, 6, STEELD); B(26, 8, 4, 4, STEEL); P(STEELL, 29, 9, 3, 2);
        B(7, 15, 8, 11, GREEN); P(DARK, 7, 19, 8, 2); P(DARK, 7, 23, 8, 2); B(15, 14, 3, 4, RED); B(5, 25, 15, 5, "#3a3a3a"); P(YEL, 7, 26, 5, 2); P("#7ad47a", 14, 6, 2, 1); break;
      case "mitre_saw":
        B(2, 25, 28, 5, STEELD); B(3, 21, 26, 4, STEEL); B(10, 9, 14, 9, "#e8eef3"); E(16, 20, 6, 3, STEEL);
        for (let i = 0; i < 5; i++) P(STEELD, 11 + i * 3, 19, 1, 2); B(18, 3, 5, 12, STEELD); B(22, 2, 8, 6, DARK); B(21, 12, 7, 5, RED); B(5, 18, 8, 7, WOOD); P(shade(WOOD, 0.7), 6, 20, 6, 1); P(RED, 12, 11, 4, 1); break;
      case "jointer":
        B(0, 13, 14, 4, STEEL); B(18, 13, 14, 4, STEEL); B(13, 11, 6, 4, YEL); P(DARK, 14, 15, 4, 2); B(4, 17, 24, 11, BLUE); P(STEELL, 1, 13, 12, 1); P(STEELL, 19, 13, 12, 1);
        B(1, 6, 30, 5, STEELD); P(STEELL, 2, 7, 28, 1); B(3, 9, 11, 4, WOOD); P(RED, 23, 20, 3, 3); B(5, 27, 5, 3, DARK); B(22, 27, 5, 3, DARK); break;
      case "planer":
        B(2, 6, 28, 22, BLUE); B(5, 7, 22, 5, STEEL); E(24, 4, 3, 3, RED); P("#fff", 24, 3, 1, 1); B(4, 15, 24, 6, DARK); B(0, 17, 16, 3, WOOD); P(shade(WOOD, 0.7), 2, 19, 14, 1);
        P(YEL, 6, 23, 8, 2); B(3, 27, 5, 3, STEELD); B(24, 27, 5, 3, STEELD); break;
      case "table_saw":
        B(0, 13, 32, 4, STEEL); P(STEELL, 1, 13, 30, 1); B(4, 17, 24, 11, "#4a5560"); B(11, 3, 10, 10, STEELL); E(16, 8, 4, 4, STEEL); P(DARK, 16, 8, 1, 1);
        for (let i = 0; i < 6; i++) P(STEELD, 11 + i * 2, 2, 1, 1); B(8, 1, 16, 2, CLEAR); B(25, 8, 3, 6, RED); B(23, 20, 4, 4, RED); P("#fff", 24, 21, 2, 1); B(5, 27, 5, 3, DARK); B(22, 27, 5, 3, DARK); break;
      case "band_saw":
        B(8, 2, 17, 27, BLUE); E(14, 8, 5, 5, STEEL); E(14, 22, 5, 5, STEEL); E(14, 8, 2, 2, STEELD); E(14, 22, 2, 2, STEELD);
        P(DARK, 9, 8, 1, 14); B(4, 15, 18, 3, STEELD); B(10, 10, 3, 6, YEL); B(19, 20, 4, 3, RED); B(6, 28, 21, 3, DARK); B(18, 13, 4, 2, WOOD); break;
      case "ear_muffs":
        B(8, 2, 16, 3, STEELD); B(5, 4, 4, 9, STEELD); B(23, 4, 4, 9, STEELD); B(2, 11, 9, 15, "#d9892b"); B(21, 11, 9, 15, "#d9892b");
        B(0, 13, 3, 11, DARK); B(29, 13, 3, 11, DARK); P("#f6c47a", 4, 13, 2, 9); P("#f6c47a", 23, 13, 2, 9); P(shade("#d9892b", 0.6), 4, 24, 6, 1); break;
      case "push_blocks":
        B(2, 15, 18, 11, YEL); B(6, 10, 10, 5, YEL); B(2, 25, 18, 3, DARK); P(shade(YEL, 0.6), 4, 19, 14, 1); P("#fff", 7, 11, 6, 1);
        B(17, 3, 14, 10, shade(YEL, 0.95)); B(20, 1, 8, 3, YEL); B(17, 12, 14, 2, DARK); P(shade(YEL, 0.6), 19, 7, 10, 1); break;
      case "riving_knife":
        B(10, 2, 11, 25, STEEL); P(STEELL, 11, 3, 1, 22); B(13, 6, 5, 3, DARK); B(13, 13, 5, 3, DARK); B(8, 26, 15, 4, STEELD); P(DARK, 10, 28, 3, 1); P(DARK, 18, 28, 3, 1); P(STEELD, 19, 2, 2, 25); break;
      case "fire_extinguisher":
        B(9, 9, 14, 20, RED); P("#f2f2f2", 10, 15, 12, 8); P(RED, 15, 16, 2, 6); P(RED, 13, 18, 6, 2); B(12, 5, 9, 5, DARK); B(11, 3, 12, 3, DARK); B(23, 6, 5, 3, DARK); B(26, 6, 3, 12, DARK); E(16, 12, 2, 2, YEL); P(DARK, 16, 12, 1, 1); B(9, 28, 14, 2, "#7a1f16"); break;
      case "dust_collector":
        B(7, 1, 18, 10, STEEL); P(STEELL, 8, 3, 16, 1); P(DARK, 10, 6, 12, 1); B(8, 11, 16, 16, "#d9d2b8"); for (let y = 13; y < 26; y += 3) P("#b6ae92", 8, y, 16, 1); P("#f2eedc", 10, 12, 2, 14);
        B(24, 5, 8, 5, STEELD); P(DARK, 29, 6, 1, 3); B(6, 27, 6, 3, DARK); B(20, 27, 6, 3, DARK); P(RED, 20, 3, 3, 3); break;
      default: B(6, 6, 20, 20, STEEL); P(STEELD, 10, 10, 12, 12);
    }
  }

  /* a finished commission, wrapped in brown paper with twine and a tag */
  function parcel() {
    B(4, 10, 24, 17, "#b98a55"); P("#d9ac76", 5, 11, 22, 1); P("#8a6038", 4, 24, 24, 3);
    B(14, 10, 4, 17, "#e8d9ae"); P("#c9b88a", 4, 17, 24, 1); P("#e8d9ae", 4, 18, 24, 1);          // twine
    B(11, 5, 4, 5, "#e8d9ae"); B(17, 5, 4, 5, "#e8d9ae"); P("#c9b88a", 14, 8, 4, 2);                  // bow
    B(22, 18, 7, 6, "#f2ead3"); P("#c0392b", 24, 20, 3, 1); P(DARK, 23, 22, 5, 1); P("#d9892b", 22, 17, 1, 1);
    P("#a8743f", 7, 13, 5, 1); P("#a8743f", 7, 20, 6, 1);
  }

  /* ------------------------------------------------------------------ food */
  const FOOD = {
    blueberry: () => { P("#2d6e36", 10, 2, 12, 5); P("#4a9a4a", 12, 2, 4, 2); [[6, 10], [15, 8], [10, 17], [20, 15], [14, 22]].forEach(([x, y]) => { E(x + 4, y + 4, 4, 4, "#3b4a9b"); E(x + 4, y + 4, 4, 4, "#3b4a9b"); P("#8aa0e0", x + 2, y + 1, 2, 2); P("#1f2a6a", x + 4, y + 4, 1, 1); P("#a8b8f0", x + 5, y + 7, 2, 1); }); },
    raspberry: () => { P("#2d6e36", 9, 2, 14, 4); P("#4a9a4a", 11, 2, 4, 2); E(16, 17, 9, 10, "#c42f4a"); for (let y = 9; y < 26; y += 4) for (let x = 9 + ((y / 4) % 2) * 2; x < 24; x += 4) { E(x + 1, y + 1, 1, 1, "#f28a9c"); P("#8a1f34", x, y + 2, 3, 1); } P("#6e1226", 10, 24, 12, 1); },
    cranberry: () => { P("#2d6e36", 12, 2, 8, 3); [[5, 9], [15, 7], [22, 12], [8, 18], [17, 18]].forEach(([x, y]) => { E(x + 4, y + 4, 4, 4, "#b3202f"); P("#f06a6a", x + 2, y + 1, 2, 2); P("#7a1220", x + 3, y + 7, 4, 1); P("#5a0e18", x + 4, y + 4, 1, 1); }); },
    morel: () => { E(16, 12, 8, 10, "#a98a5a"); for (let i = 0; i < 12; i++) { const x = 9 + (i % 4) * 4 + (Math.floor(i / 4) % 2) * 2, y = 5 + Math.floor(i / 4) * 5; B(x, y, 3, 4, "#6b5130"); } P("#c8aa78", 11, 6, 3, 1); B(11, 20, 10, 10, "#efe8d4"); P("#cfc6ac", 11, 24, 10, 1); P("#fff", 12, 21, 1, 7); },
    chanterelle: () => { E(16, 9, 12, 6, "#e8a93a"); P(shade("#e8a93a", 1.3), 8, 6, 10, 1); P(shade("#e8a93a", 0.7), 6, 13, 20, 1); for (let i = 0; i < 9; i++) P("#c8861e", 9 + i * 2, 12, 1, 3); B(11, 14, 10, 14, "#f0c060"); for (let y = 15; y < 27; y += 2) P("#c8861e", 12 + (y % 4), y, 1, 2); P("#fff0b0", 12, 15, 1, 11); P("#6a4a1c", 11, 27, 10, 2); },
    hardtack: () => { B(3, 6, 26, 20, "#d9b680"); for (let y = 10; y < 24; y += 5) for (let x = 7; x < 28; x += 6) { P("#8a6a40", x, y, 2, 2); P("#f0dab0", x, y, 1, 1); } P("#a98a58", 3, 23, 26, 3); P("#f2dcb0", 4, 7, 24, 1); P("#7a5a30", 22, 7, 5, 1); },
    oatcakes: () => { E(13, 20, 11, 7, "#cfa86a"); E(13, 18, 11, 7, "#dbb778"); E(19, 12, 11, 7, "#c9a262"); E(19, 10, 11, 7, "#e3c288"); [[10, 17], [16, 20], [20, 9], [26, 11], [14, 8], [8, 21], [18, 14]].forEach(([x, y]) => { P("#8a6a40", x, y, 1, 1); P("#f5e2b8", x + 1, y, 1, 1); }); P("#a98a58", 3, 22, 20, 1); },
    maple_fudge: () => { B(2, 14, 14, 13, "#8a4a1e"); B(16, 12, 14, 14, "#9b5a24"); B(8, 4, 14, 12, "#7a3e18"); [[4, 16, 5], [19, 15, 4], [12, 7, 6]].forEach(([x, y, n]) => { P("#c68a4a", x, y, 8, 1); P("#5a2e10", x + 2, y + 5, 3, 1); P("#d9a468", x + 1, y + 3, 1, 1); }); P("#f6e0b0", 14, 6, 2, 2); },
    herring: () => { P("#8aa0b0", 2, 12, 22, 10); E(14, 17, 12, 6, "#8aa0b0"); P("#c3d0da", 6, 14, 16, 2); P("#5d7080", 6, 19, 16, 3); for (let i = 0; i < 6; i++) P("#aebbc6", 7 + i * 3, 16, 2, 2); P(DARK, 5, 15, 2, 2); P("#fff", 5, 15, 1, 1); B(24, 8, 6, 17, "#6e8494"); P("#4a5e6c", 26, 10, 1, 13); P("#6e8494", 12, 8, 6, 4); P("#6e8494", 14, 23, 5, 3); },
    bean_jar: () => { B(8, 3, 16, 5, STEELD); P(STEELL, 9, 4, 14, 1); B(6, 8, 20, 21, CLEAR); B(8, 14, 16, 14, "#b8651d"); [[10, 16], [15, 15], [20, 17], [12, 21], [18, 22], [10, 25], [21, 25]].forEach(([x, y]) => { E(x + 1, y + 1, 2, 1, "#e8a03a"); P("#7a3e10", x, y + 2, 3, 1); }); P("#fff", 8, 9, 1, 8); P(RED, 8, 11, 16, 1); },
    chowder_can: () => { B(6, 4, 20, 25, "#b9c2cb"); P(STEELD, 6, 4, 20, 2); P(STEELD, 6, 27, 20, 2); B(6, 10, 20, 12, "#2f7d6d"); P("#f2ead3", 10, 13, 12, 5); P("#2f7d6d", 12, 15, 8, 1); P("#f2ead3", 9, 20, 14, 1); P("#fff", 8, 5, 1, 22); P("#e8eef3", 12, 1, 2, 2); P("#e8eef3", 17, 0, 2, 3); }
  };

  function get(key) {
    if (cache[key]) return cache[key];
    const raw = document.createElement("canvas"); raw.width = SIZE; raw.height = SIZE;
    c = raw.getContext("2d"); c.imageSmoothingEnabled = false;
    const [kind, id] = key.split(":");
    if (kind === "tool") tool(id);
    else if (kind === "log") log(id);
    else if (kind === "board") board(id);
    else if (kind === "sapling") sapling(id);
    else if (kind === "prod") parcel();
    else (FOOD[id] || FOOD.hardtack)();
    // 1px outline
    const sil = document.createElement("canvas"); sil.width = SIZE; sil.height = SIZE;
    const sc = sil.getContext("2d"); sc.imageSmoothingEnabled = false;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => sc.drawImage(raw, dx, dy));
    sc.globalCompositeOperation = "source-in"; sc.fillStyle = OUT; sc.fillRect(0, 0, SIZE, SIZE);
    const out = document.createElement("canvas"); out.width = SIZE; out.height = SIZE;
    const oc = out.getContext("2d"); oc.imageSmoothingEnabled = false;
    oc.drawImage(sil, 0, 0); oc.drawImage(raw, 0, 0);
    return (cache[key] = out);
  }
  return { get, SIZE };
})();
