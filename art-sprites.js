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

  /* paints the character at the origin (feet ~y=14) onto a 40x50 sprite canvas */
  function paintCharacter(c, app, frame, facing, gear) {
    const R = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    const bob = frame % 2 === 1 ? -1 : 0;
    const side = facing === "left" || facing === "right";
    const dir = facing === "left" ? -1 : 1;
    const skin = app.skin || "#f3c69f", skinD = hexShade(skin, 0.86), skinL = hexShade(skin, 1.08);
    const hair = app.hair || "#3b2618", hairL = hexShade(hair, 1.55), hairD = hexShade(hair, 0.7);
    const shirt = app.shirt || "#a83232", shirtD = hexShade(shirt, 0.78), shirtL = hexShade(shirt, 1.22);
    const apron = app.apron || "#6b4423", apronD = hexShade(apron, 0.75);
    const stepOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;

    // boots with soles and laces
    R("#2e1a0f", -6, 9 + (stepOffset > 0 ? -1 : 0), 5, 5); R("#2e1a0f", 1, 9 + (stepOffset < 0 ? -1 : 0), 5, 5);
    R("#4a2e1c", -6, 9 + (stepOffset > 0 ? -1 : 0), 5, 2); R("#4a2e1c", 1, 9 + (stepOffset < 0 ? -1 : 0), 5, 2);
    R("#1a0f08", -6, 13 + (stepOffset > 0 ? -1 : 0), 5, 1); R("#1a0f08", 1, 13 + (stepOffset < 0 ? -1 : 0), 5, 1);
    // work pants: seam, knee patch, cuff
    R("#263849", -6, 2 + bob, 12, 8); R("#1b2a39", 0, 3 + bob, 1, 7); R("#33506a", -6, 3 + bob, 2, 6);
    R("#2f4660", -5, 6 + bob, 4, 2); R("#1b2a39", -6, 9 + bob, 12, 1);
    // flannel shirt with plaid
    R(shirt, -7, -8 + bob, 14, 11);
    R(shirtD, -7, 1 + bob, 14, 2);
    R(shirtL, -7, -6 + bob, 14, 1); R(shirtL, -4, -8 + bob, 1, 11); R(shirtL, 2, -8 + bob, 1, 11);
    R(shirtD, -7, -2 + bob, 14, 1); R(shirtD, -1, -8 + bob, 1, 11); R(shirtD, 5, -8 + bob, 1, 11);
    // belt
    R("#3a2418", -7, 2 + bob, 14, 2); R("#d4a93a", -1, 2 + bob, 3, 2);
    // apron: straps, bib, pocket, tool loops
    R(apron, -5, -5 + bob, 10, 12); R(apronD, -5, 5 + bob, 10, 2); R(apronD, -5, -5 + bob, 1, 12); R(apronD, 4, -5 + bob, 1, 12);
    R(apronD, -5, -8 + bob, 1, 4); R(apronD, 4, -8 + bob, 1, 4);
    R("#d49b35", -3, -1 + bob, 6, 3); R("#f0c56a", -3, -1 + bob, 6, 1); R("#8a6420", -3, 1 + bob, 6, 1);
    R("#e8e0d0", 3, -4 + bob, 1, 4); R("#8a8f98", 3, -5 + bob, 1, 2);       // pencil + ruler tip in the bib
    // arms with cuffs, hands with thumbs (arms swing when walking)
    const sw = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    R(shirt, -10, -7 + bob + sw, 3, 8); R(shirtD, -10, -7 + bob + sw, 1, 8); R(shirtD, -10, -1 + bob + sw, 3, 1);
    R(shirt, 7, -7 + bob - sw, 3, 8); R(shirtD, 9, -7 + bob - sw, 1, 8); R(shirtD, 7, -1 + bob - sw, 3, 1);
    R(skin, -10, 0 + bob + sw, 3, 3); R(skinD, -10, 2 + bob + sw, 3, 1);
    R(skin, 7, 0 + bob - sw, 3, 3); R(skinD, 7, 2 + bob - sw, 3, 1);
    // neck + collar
    R(skinD, -2, -9 + bob, 4, 2); R(shirtL, -4, -9 + bob, 3, 2); R(shirtL, 1, -9 + bob, 3, 2);
    // head, ears, jaw shade
    R(skin, -6, -20 + bob, 12, 12); R(skinD, -6, -10 + bob, 12, 2); R(skinL, -5, -19 + bob, 3, 2);
    if (!side) { R(skinD, -7, -15 + bob, 1, 3); R(skinD, 6, -15 + bob, 1, 3); }
    // hair: crown, fringe, sideburns, highlight
    R(hair, -7, -22 + bob, 14, 5); R(hairL, -3, -22 + bob, 5, 1); R(hairL, -6, -21 + bob, 2, 1);
    R(hairD, -7, -18 + bob, 14, 1);
    if (facing === "up") { R(hair, -6, -18 + bob, 12, 9); R(hairD, -6, -11 + bob, 12, 2); R(hairL, -3, -20 + bob, 4, 1); }
    else if (side) { R(hair, dir < 0 ? 1 : -7, -19 + bob, 6, 8); R(hairD, dir < 0 ? 5 : -7, -19 + bob, 2, 8); R(hair, dir < 0 ? -7 : 5, -19 + bob, 2, 3); }
    else { R(hair, -7, -19 + bob, 2, 6); R(hair, 5, -19 + bob, 2, 6); R(hairD, -7, -14 + bob, 2, 1); R(hairD, 5, -14 + bob, 2, 1); }
    // face
    if (facing !== "up") {
      const ex = side ? (dir < 0 ? -5 : 1) : 0;
      const eyes = side ? [ex + (dir < 0 ? 0 : 2)] : [-4, 2];
      eyes.forEach((x) => {
        R("#ffffff", x, -15 + bob, 3, 3); R("#2a1c14", x + (side ? (dir < 0 ? 0 : 1) : 1), -15 + bob, 2, 3); R("#ffffff", x + (side ? (dir < 0 ? 0 : 1) : 1), -15 + bob, 1, 1);
        R(hairD, x - 1, -17 + bob, 4, 1);               // eyebrow
      });
      if (!side) { R("rgba(240,120,110,0.45)", -5, -11 + bob, 2, 2); R("rgba(240,120,110,0.45)", 3, -11 + bob, 2, 2); R(skinD, 0, -13 + bob, 1, 2); R("#8a3b2b", -1, -10 + bob, 3, 1); }
      else { R(skinD, dir < 0 ? -6 : 5, -13 + bob, 1, 2); R("#8a3b2b", dir < 0 ? -4 : 2, -10 + bob, 2, 1); }
      if (gear.safety_glasses) {
        R("rgba(186, 230, 253, 0.8)", -5, -16 + bob, 4, 3); R("rgba(186, 230, 253, 0.8)", 1, -16 + bob, 4, 3);
        R("#0284c7", -1, -15 + bob, 2, 1); R("#e0f4ff", -5, -16 + bob, 1, 1); R("#e0f4ff", 1, -16 + bob, 1, 1);
      }
    }
    if (gear.ear_muffs) {
      R("#e11d48", -9, -17 + bob, 3, 6); R("#e11d48", 6, -17 + bob, 3, 6); R("#f87190", -9, -17 + bob, 3, 1); R("#f87190", 6, -17 + bob, 3, 1);
      R("#1e293b", -7, -23 + bob, 14, 2);
    }
  }

  /* cached sprite + 1px dark outline so characters pop off grass and cobbles */
  function getCharacterSprite(app, frame, facing, gear) {
    const key = [app.skin, app.hair, app.shirt, app.apron, frame % 4, facing, gear.safety_glasses ? 1 : 0, gear.ear_muffs ? 1 : 0].join("|");
    if (spriteCache[key]) return spriteCache[key];
    const W = 40, H = 50, OX = 20, OY = 32;
    const raw = document.createElement("canvas"); raw.width = W; raw.height = H;
    const rc = raw.getContext("2d"); rc.imageSmoothingEnabled = false;
    rc.translate(OX, OY); paintCharacter(rc, app, frame, facing, gear);
    const sil = document.createElement("canvas"); sil.width = W; sil.height = H;
    const sc = sil.getContext("2d"); sc.imageSmoothingEnabled = false;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => sc.drawImage(raw, dx, dy));
    sc.globalCompositeOperation = "source-in"; sc.fillStyle = "rgba(28,16,8,0.9)"; sc.fillRect(0, 0, W, H);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const oc = out.getContext("2d"); oc.imageSmoothingEnabled = false;
    oc.drawImage(sil, 0, 0); oc.drawImage(raw, 0, 0);
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
    drawCharacter
  };
})();
