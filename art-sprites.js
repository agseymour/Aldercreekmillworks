window.ACM = window.ACM || {};

ACM.ArtSprites = (function () {
  const SEASON_PALETTES = {
    Spring: {
      grass: "#568c4a",
      grassAlt: "#67a159",
      path: "#c2a87d",
      foliage: "#40916c",
      roofTint: null,
      water: "#3b82f6"
    },
    Summer: {
      grass: "#467a3c",
      grassAlt: "#558f49",
      path: "#bfa274",
      foliage: "#2d6a4f",
      roofTint: null,
      water: "#2563eb"
    },
    Autumn: {
      grass: "#8c7a3e",
      grassAlt: "#a38c46",
      path: "#b08d57",
      foliage: "#d97706",
      roofTint: null,
      water: "#3b76a8"
    },
    Winter: {
      grass: "#dce8f2",
      grassAlt: "#cbdbe8",
      path: "#9aa8b8",
      foliage: "#264d3b",
      roofTint: "rgba(241, 245, 249, 0.72)",
      water: "#7dd3fc"
    }
  };

  const spriteCache = {};
  const hexShade = (hex, f) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const q = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return "rgb(" + q((n >> 16) & 255) + "," + q((n >> 8) & 255) + "," + q(n & 255) + ")";
  };

  /* 5-step colour ramp: shadows drift slightly cool, highlights blend toward warm white */
  const rampCache = {};
  function ramp(hex) {
    if (rampCache[hex]) return rampCache[hex];
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    const n = m ? parseInt(m[1], 16) : 0x888888;
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const rgb = (R, G, B) => "rgb(" + cl(R) + "," + cl(G) + "," + cl(B) + ")";
    const dk = (f) => rgb(r * f * 0.96, g * f * 0.98, b * Math.min(1.05, f * 1.12) + 6 * (1 - f));
    const lt = (t) => rgb(r + (255 - r) * t, g + (250 - g) * t, b + (225 - b) * t * 0.9);
    return (rampCache[hex] = { d3: dk(0.42), d2: dk(0.62), d1: dk(0.8), b: rgb(r, g, b), l1: lt(0.2), l2: lt(0.42) });
  }

  const DENIM = ramp("#30496a"), BOOT = ramp("#5a3822"), BELT = ramp("#3e2719"), BRASS = ramp("#d4a93a"), POUCH = ramp("#c08532");
  const STEEL = ramp("#9aa3ad"), HANDLE = ramp("#b07a42"), MUFF = ramp("#e11d48");
  const IRIS = "#3b2a1f", PUPIL = "#150d09", WHITE = "#f8f4ee", LIP = "#9a4636", LENS = "rgba(190,232,255,0.55)", FRAME = "#0f5f8a";

  /* paints the character facing down / up / right at the origin (feet ~y=14) onto a 40x50 sprite canvas.
     "left" is drawn as "right" and mirrored by getCharacterSprite. */
  function paintCharacter(c, app, frame, facing, gear) {
    const R = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const P = (col, x, y) => R(col, x, y, 1, 1);
    const b = frame % 2 === 1 ? -1 : 0;
    const S = ramp(app.skin || "#f3c69f"), H = ramp(app.hair || "#3b2618");
    const F = ramp(app.shirt || "#a83232"), A = ramp(app.apron || "#6b4423");
    const liftL = frame === 3 ? 1 : 0, liftR = frame === 1 ? 1 : 0;

    /* tartan flannel: dark bands every 4px, crossing points darkest, a thin light over-check */
    const plaid = (x0, y0, w, h, light) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        const vx = ((x % 4) + 4) % 4, hy = (((y - b) % 4) + 4) % 4;
        let k = vx === 0 && hy === 0 ? 0 : vx === 0 || hy === 0 ? 1 : vx === 2 && hy === 2 ? 3 : 2;
        if (x === x0 && light !== "r") k++;
        if (x === x0 + w - 1 && light !== "l") k--;
        if (y === y0 + h - 1) k--;
        P([F.d3, F.d2, F.d1, F.b, F.l1, F.l2][Math.max(0, Math.min(5, k + 1))], x, y);
      }
    };
    const boot = (x, lift, w, toeRight) => {
      const y = 9 - lift;
      R(BOOT.d2, x, y, w, 5); R(BOOT.b, x, y, w, 3); R(BOOT.d1, x, y + 2, w, 1);
      P(BOOT.l1, x + 1, y); P(BOOT.l1, x + 1, y + 1);
      R(BOOT.b, toeRight ? x + w - 3 : x, y + 3, 3, 1); P(BOOT.l2, toeRight ? x + w - 2 : x + 1, y + 3);
      R("#1a0f08", x, y + 4, w, 1); R(BOOT.d3, x, y + 4, w, 1); P("#120a05", x, y + 4); P("#120a05", x + w - 1, y + 4);
    };
    const leg = (x, lift, inner, D) => {
      const y0 = 2 + b, h = 8 - b - lift;
      R(D.b, x, y0, 6, h);
      R(D.l1, inner === "r" ? x : x + 5, y0 + 1, 1, h - 2);           // outer edge catches light
      R(D.d1, inner === "r" ? x + 5 : x, y0 + 2, 1, h - 2);           // inseam in shadow
      R(D.l1, x + 1, y0 + 3, 3, 1); P(D.l2, x + 2, y0 + 3);           // knee wear
      for (let yy = y0 + 1; yy < y0 + h - 2; yy += 2) P(D.d1, inner === "r" ? x + 1 : x + 4, yy); // stitched seam
      R(D.l1, x, 8 - lift, 6, 1); R(D.d1, x, 9 - lift, 6, 1);         // rolled cuff
    };
    const hand = (x, y, thumbDx) => {
      R(S.b, x, y, 3, 3); P(S.l1, x, y); R(S.d1, x, y + 2, 3, 1); P(S.d2, x + 2, y + 2);
      if (thumbDx) P(S.d1, x + thumbDx, y);
    };
    const sleeveArm = (x, y, light, thumbDx) => {
      plaid(x, y, 3, 5, light);
      R(F.l1, x, y + 5, 3, 1); R(F.d1, x, y + 6, 3, 1); P(F.l2, x + 1, y + 5);  // rolled cuff
      R(S.b, x, y + 7, 3, 1); P(S.d1, light === "l" ? x + 2 : x, y + 7);         // forearm
      hand(x, y + 8, thumbDx);
    };
    const hammer = (x, y) => {
      R(HANDLE.b, x, y + 1, 1, 6); P(HANDLE.l1, x, y + 2); P(HANDLE.d2, x, y + 6);
      R(STEEL.b, x - 1, y, 3, 1); P(STEEL.l2, x - 1, y); P(STEEL.d2, x + 1, y); P(STEEL.d1, x - 1, y + 1);
    };

    if (facing === "right") {
      /* ---------------- profile, facing +x ---------------- */
      const s = frame === 1 ? 2 : frame === 3 ? -2 : 0;
      // far leg + boot (in shade)
      R(DENIM.d2, -3 - s, 2 + b, 5, 8 - b); R(DENIM.d1, -3 - s, 8, 5, 1);
      boot(-3 - s, 0, 6, true); R("rgba(20,12,8,0.35)", -3 - s, 9, 6, 4);
      // near leg + boot
      R(DENIM.b, -3 + s, 2 + b, 5, 8 - b - (s ? 1 : 0)); R(DENIM.l1, -3 + s, 3 + b, 1, 5);
      R(DENIM.l1, -2 + s, 5 + b, 2, 1); P(DENIM.d1, 1 + s, 4 + b); P(DENIM.d1, 1 + s, 6 + b);
      R(DENIM.l1, -3 + s, 8 - (s ? 1 : 0), 5, 1);
      boot(-3 + s, s ? 1 : 0, 6, true);
      // torso
      plaid(-5, -8 + b, 10, 11);
      R(BELT.b, -5, 2 + b, 10, 2); R(BELT.l1, -5, 2 + b, 10, 1); P(BRASS.b, 3, 2 + b);
      // apron front panel and pouch
      R(A.b, 2, -6 + b, 4, 11); R(A.l1, 2, -6 + b, 1, 11); R(A.d1, 5, -5 + b, 1, 10); R(A.d1, 2, 4 + b, 4, 1);
      R(POUCH.b, 3, 1 + b, 3, 3); R(POUCH.l1, 3, 1 + b, 3, 1); R(POUCH.d1, 3, 3 + b, 3, 1); P(STEEL.l1, 4, 0 + b);
      R(A.d1, 0, -8 + b, 2, 1); R(A.d1, 1, -7 + b, 2, 1); P(BRASS.l1, 2, -6 + b);    // strap over shoulder
      P("#e8b830", 3, -7 + b); P("#e8b830", 3, -6 + b); P("#f2a0a0", 3, -8 + b);        // pencil in bib
      hammer(-3, 2 + b);
      // collar + neck
      R(S.d1, -1, -9 + b, 4, 2); R(S.d2, 1, -9 + b, 2, 1); R(F.l1, -2, -9 + b, 2, 2); P(F.l2, 2, -8 + b);
      // head
      R(S.b, -5, -20 + b, 10, 11); R(S.d1, -2, -9 + b, 6, 1); c.clearRect(-5, -11 + b, 3, 2);
      R(S.l1, 2, -19 + b, 2, 2); P(S.d1, 4, -10 + b);
      P(S.b, 5, -15 + b); P(S.b, 5, -14 + b); P(S.d1, 5, -13 + b);                         // nose
      P(S.d2, 4, -12 + b);
      R(WHITE, 2, -15 + b, 1, 3); R(IRIS, 3, -15 + b, 1, 3); P(PUPIL, 3, -14 + b); P("#ffffff", 3, -15 + b);          // eye
      R(H.d2, 2, -17 + b, 3, 1); P(S.d1, 2, -16 + b);
      R(LIP, 3, -11 + b, 2, 1); P(S.l1, 3, -10 + b);
      P("rgba(230,110,100,0.4)", 1, -12 + b); P("rgba(230,110,100,0.4)", 2, -12 + b);
      // hair: back of head, crown, fringe
      R(H.b, -6, -21 + b, 6, 10); R(H.d1, -6, -12 + b, 5, 1); P(H.d2, -6, -12 + b); P(H.b, -5, -11 + b); P(H.d1, -3, -11 + b); R(H.d1, -6, -20 + b, 1, 7);
      R(H.b, -5, -23 + b, 9, 1); R(H.b, -6, -22 + b, 11, 4); R(H.b, 0, -18 + b, 5, 1);
      P(H.b, 5, -21 + b); P(H.b, 5, -20 + b); P(H.b, 4, -18 + b);
      [1, 3].forEach((x) => P(H.d1, x, -18 + b)); P(H.b, 0, -17 + b); P(H.b, 0, -16 + b);
      R(H.l1, -3, -22 + b, 5, 1); P(H.l2, -1, -22 + b); P(H.l1, -4, -21 + b); P(H.l1, 3, -21 + b);
      [[-4, -19], [-2, -20], [-5, -16], [-3, -14], [1, -20]].forEach(([x, y]) => P(H.d1, x, y + b));
      // ear over hair
      R(S.b, -2, -16 + b, 2, 3); P(S.d2, -2, -15 + b); P(S.d1, -1, -14 + b); P(S.l1, -1, -16 + b);
      // near arm, swinging opposite to the near leg
      const a = s > 0 ? -1 : s < 0 ? 1 : 0;
      sleeveArm(-2 + a, -7 + b, null, 0);
      if (gear.safety_glasses) {
        R(LENS, 2, -16 + b, 4, 3); R(FRAME, 2, -16 + b, 4, 1); R(FRAME, -1, -16 + b, 3, 1); P("#e0f4ff", 4, -15 + b);
      }
      if (gear.ear_muffs) {
        R("#1e293b", -3, -24 + b, 4, 1); P("#334155", -3, -23 + b); R("#1e293b", -3, -22 + b, 1, 4);
        R(MUFF.b, -3, -18 + b, 4, 5); R(MUFF.l1, -3, -18 + b, 4, 1); P(MUFF.l2, -2, -18 + b); R(MUFF.d1, -3, -14 + b, 4, 1); R(MUFF.d2, 0, -17 + b, 1, 3);
      }
      return;
    }

    const back = facing === "up";
    // legs + boots
    leg(-6, liftL, "l", DENIM); leg(0, liftR, "r", DENIM);
    if (back) { R(DENIM.d1, -5, 4 + b, 3, 2); R(DENIM.d1, 1, 4 + b, 3, 2); P(DENIM.l1, -4, 4 + b); P(DENIM.l1, 2, 4 + b); }
    else R(DENIM.d2, -1, 5 + b, 2, 4 - Math.max(liftL, liftR));
    boot(-6, liftL, 5, false); boot(1, liftR, 5, true);
    if (back) { R(BOOT.d2, -6, 12 - liftL, 5, 1); R(BOOT.d2, 1, 12 - liftR, 5, 1); }
    else { P("#d8b57e", -4, 9 - liftL); P("#d8b57e", 3, 9 - liftR); P("#d8b57e", -4, 10 - liftL); P("#d8b57e", 3, 10 - liftR); }
    // torso
    plaid(-7, -8 + b, 14, 11);
    R(BELT.b, -7, 2 + b, 14, 2); R(BELT.l1, -7, 2 + b, 14, 1); R(BELT.d1, -7, 3 + b, 14, 1);
    if (back) {
      // cross-back apron straps and the waist tie
      for (let i = 0; i < 10; i++) { P(A.d1, -5 + i, -8 + i + b); P(A.d1, 4 - i, -8 + i + b); }
      P(A.b, -5, -8 + b); P(A.b, 4, -8 + b);
      R(A.b, -2, 2 + b, 4, 2); P(A.d1, 0, 2 + b); P(A.l1, -2, 2 + b);
      R(A.b, -2, 4 + b, 1, 2); R(A.d1, 1, 4 + b, 1, 3); P(A.l1, -2, 4 + b);
    } else {
      R(BRASS.b, -1, 2 + b, 3, 2); P(BELT.d2, 0, 3 + b); P(BRASS.l2, -1, 2 + b);
      // apron bib with stitched hem, straps, rivets, tool pouch
      R(A.b, -5, -6 + b, 10, 12); R(A.l1, -5, -6 + b, 1, 12); R(A.d1, 4, -6 + b, 1, 12);
      R(A.d1, -5, 5 + b, 10, 1); R(A.l1, -4, -6 + b, 8, 1);
      for (let x = -3; x < 4; x += 2) P(A.l1, x, 4 + b);
      R(A.d1, -5, -8 + b, 2, 2); R(A.d1, 3, -8 + b, 2, 2); P(A.d2, -4, -8 + b); P(A.d2, 4, -8 + b);
      P(BRASS.l1, -4, -6 + b); P(BRASS.l1, 3, -6 + b);
      R(A.d1, -3, -3 + b, 6, 1);                                                      // bib pocket seam
      R("#e8b830", -2, -6 + b, 1, 3); P("#f2a0a0", -2, -7 + b); P("#b8861c", -2, -4 + b); // pencil
      R(STEEL.b, 1, -5 + b, 2, 2); P(STEEL.l2, 1, -5 + b); P(STEEL.d1, 2, -4 + b);      // folding rule
      R(POUCH.b, -4, 1 + b, 8, 4); R(POUCH.l1, -4, 1 + b, 8, 1); R(POUCH.d1, -4, 4 + b, 8, 1);
      R(POUCH.d1, 0, 2 + b, 1, 2); P(POUCH.l2, -3, 1 + b); P(STEEL.l2, -2, 0 + b); P(STEEL.b, 2, 0 + b);
      hammer(6, 2 + b);
    }
    // arms (swing when walking)
    const sw = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    sleeveArm(-10, -7 + b + sw, "l", back ? 0 : 3);
    sleeveArm(7, -7 + b - sw, "r", back ? 0 : -1);
    // neck + collar
    R(S.d1, -2, -9 + b, 4, 2); R(S.d2, -2, -9 + b, 4, 1);
    if (back) { R(F.l1, -4, -9 + b, 8, 1); R(F.b, -4, -8 + b, 8, 1); }
    else { R(F.l1, -4, -9 + b, 3, 2); R(F.l1, 1, -9 + b, 3, 2); P(F.l2, -4, -9 + b); P(F.l2, 3, -9 + b); P(F.d1, -2, -8 + b); P(F.d1, 1, -8 + b); }
    // head
    R(S.b, -6, -20 + b, 12, 10); R(S.b, -5, -10 + b, 10, 1); R(S.b, -4, -9 + b, 8, 1);
    R(S.d1, 5, -18 + b, 1, 8); R(S.d1, -4, -9 + b, 8, 1); R(S.d1, -5, -10 + b, 1, 1); R(S.d1, 4, -10 + b, 1, 1);
    R(S.l1, -5, -18 + b, 2, 3); P(S.l2, -5, -18 + b);
    // ears
    R(S.b, -7, -16 + b, 1, 3); P(S.d1, -7, -15 + b); R(S.d1, 6, -16 + b, 1, 3); P(S.d2, 6, -15 + b);
    if (!back) {
      // eyes with whites, iris, catchlight; brows; nose; mouth; cheeks
      [-4, 1].forEach((x) => {
        R(WHITE, x, -15 + b, 3, 3); R(IRIS, x + 1, -15 + b, 2, 3); R(PUPIL, x + 2, -14 + b, 1, 2); P("#ffffff", x + 1, -15 + b); P(S.d1, x, -12 + b);
        R(H.d1, x, -17 + b, 3, 1);
      });
      P(PUPIL, -4, -15 + b); P(PUPIL, 3, -15 + b);
      P(S.d1, 0, -13 + b); P(S.l1, -1, -13 + b);
      R(LIP, -1, -11 + b, 3, 1); P(S.d1, 0, -10 + b);
      R("rgba(230,110,100,0.38)", -5, -12 + b, 2, 1); R("rgba(230,110,100,0.38)", 3, -12 + b, 2, 1);
    }
    // hair
    R(H.b, -6, -23 + b, 12, 1); R(H.b, -7, -22 + b, 14, 4);
    if (back) {
      R(H.b, -6, -18 + b, 12, 8); R(H.d1, -6, -11 + b, 12, 1);
      for (let x = -6; x < 6; x += 2) P(H.d2, x, -10 + b);
      for (let x = -5; x < 6; x++) if (x % 2) P(H.b, x, -10 + b);
      [[-4, -17], [-2, -14], [0, -18], [2, -15], [4, -17], [-5, -13], [3, -12], [-1, -12]].forEach(([x, y]) => P(H.d1, x, y + b));
      R(H.d1, 4, -18 + b, 2, 7); P(H.d2, 1, -21 + b); P(H.d2, 0, -20 + b);             // crown whorl
      R(H.l1, -4, -22 + b, 6, 1); P(H.l2, -3, -22 + b); R(H.l1, -5, -19 + b, 1, 3);
      R(S.b, -7, -16 + b, 1, 3); P(S.d1, -7, -15 + b); R(S.d1, 6, -16 + b, 1, 3);       // ears over hair
    } else {
      for (let x = -6; x < 6; x++) if ((x + 6) % 3 !== 2) P(H.b, x, -18 + b);
      [-5, -2, 1, 4].forEach((x) => P(H.d1, x, -18 + b));
      R(H.b, -6, -18 + b, 1, 3); R(H.b, 5, -18 + b, 1, 3); R(H.b, -7, -18 + b, 1, 2); R(H.b, 6, -18 + b, 1, 2);
      P(H.d1, -6, -16 + b); P(H.d2, 5, -16 + b);
      R(H.d1, 4, -22 + b, 3, 4); P(H.d2, 6, -19 + b);
      R(H.l1, -4, -22 + b, 6, 1); P(H.l2, -3, -22 + b); P(H.l1, -6, -21 + b); P(H.l1, -5, -20 + b);
      [[-2, -20], [1, -21], [3, -19], [-5, -19], [0, -19]].forEach(([x, y]) => P(H.d1, x, y + b));
    }
    if (gear.safety_glasses && !back) {
      R(LENS, -5, -16 + b, 4, 3); R(LENS, 1, -16 + b, 4, 3);
      R(FRAME, -6, -16 + b, 12, 1); R(FRAME, -1, -15 + b, 2, 1);
      P("#e0f4ff", -4, -15 + b); P("#e0f4ff", 2, -15 + b);
    }
    if (gear.ear_muffs) {
      R("#1e293b", -6, -24 + b, 12, 1); P("#475569", -3, -24 + b); R("#1e293b", -8, -23 + b, 2, 1); R("#1e293b", 6, -23 + b, 2, 1);
      R("#1e293b", -9, -22 + b, 1, 4); R("#1e293b", 8, -22 + b, 1, 4);
      [-10, 7].forEach((x) => {
        R(MUFF.b, x, -18 + b, 3, 6); R(MUFF.l1, x, -18 + b, 3, 1); P(MUFF.l2, x + 1, -18 + b);
        R(MUFF.d1, x, -13 + b, 3, 1); R(MUFF.d2, x === -10 ? x + 2 : x, -17 + b, 1, 4);
      });
    }
  }

  /* cached sprite + 1px outline tinted from the neighbouring colour (selective outlining) */
  function getCharacterSprite(app, frame, facing, gear) {
    const key = [app.skin, app.hair, app.shirt, app.apron, frame % 4, facing, gear.safety_glasses ? 1 : 0, gear.ear_muffs ? 1 : 0].join("|");
    if (spriteCache[key]) return spriteCache[key];
    const W = 40, H = 50, OX = 20, OY = 32;
    const raw = document.createElement("canvas"); raw.width = W; raw.height = H;
    const rc = raw.getContext("2d"); rc.imageSmoothingEnabled = false;
    if (facing === "left") { rc.translate(W - OX, OY); rc.scale(-1, 1); }
    else rc.translate(OX, OY);
    paintCharacter(rc, app, frame % 4, facing === "left" ? "right" : facing, gear);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const oc = out.getContext("2d"); oc.imageSmoothingEnabled = false;
    oc.drawImage(raw, 0, 0);
    try {
      const src = rc.getImageData(0, 0, W, H), img = oc.getImageData(0, 0, W, H);
      const s = src.data, d = img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (s[i + 3] > 40) continue;
        let n = -1;
        // prefer the pixel above/below so outlines pick up hair, shirt, boot colours
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = (yy * W + xx) * 4;
          if (s[j + 3] > 160) { n = j; break; }
        }
        if (n < 0) continue;
        const f = y > OY + 8 ? 0.22 : 0.32;
        d[i] = Math.round(s[n] * f + 22 * (1 - f) * 0.6);
        d[i + 1] = Math.round(s[n + 1] * f + 12 * (1 - f) * 0.6);
        d[i + 2] = Math.round(s[n + 2] * f + 10 * (1 - f) * 0.6);
        d[i + 3] = 240;
      }
      oc.putImageData(img, 0, 0);
    } catch (e) {
      // tainted canvas fallback: flat outline as before
      const sil = document.createElement("canvas"); sil.width = W; sil.height = H;
      const sc = sil.getContext("2d");
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => sc.drawImage(raw, dx, dy));
      sc.globalCompositeOperation = "source-in"; sc.fillStyle = "rgba(28,16,8,0.9)"; sc.fillRect(0, 0, W, H);
      oc.clearRect(0, 0, W, H); oc.drawImage(sil, 0, 0); oc.drawImage(raw, 0, 0);
    }
    return (spriteCache[key] = { cv: out, ox: OX, oy: OY });
  }

  function drawCharacter(ctx, x, y, appearance, scale = 1, frame = 0, facing = "down", gear = {}) {
    if (!ctx) return;
    const app = appearance || {};
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(-8, 12, 16, 4);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(-10, 13, 20, 3);
    const sp = getCharacterSprite(app, frame, facing, gear || {});
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sp.cv, -sp.ox, -sp.oy);
    ctx.restore();
  }

  return {
    drawCharacter,
    sprite: (appearance, frame, facing, gear) => getCharacterSprite(appearance || {}, frame || 0, facing || "down", gear || {})
  };
})();
