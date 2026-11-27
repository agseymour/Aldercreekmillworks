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

  const WOODLOT_COORDS = [
    [130, 595], [220, 595], [310, 595], [400, 595],
    [130, 725], [220, 725], [310, 725], [400, 725],
    [130, 855], [220, 855], [310, 855], [400, 855]
  ];

  function drawCharacter(ctx, x, y, appearance, scale = 1, frame = 0, facing = "down", gear = {}) {
    if (!ctx) return;
    const app = appearance || {};
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);

    const bob = frame % 2 === 1 ? -1 : 0;

    // Ground Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(-8, 12, 16, 4);

    // Boots
    ctx.fillStyle = "#3a2214";
    const stepOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;
    ctx.fillRect(-6, 9 + (stepOffset > 0 ? -1 : 0), 5, 5);
    ctx.fillRect(1, 9 + (stepOffset < 0 ? -1 : 0), 5, 5);

    // Work Pants
    ctx.fillStyle = "#263849";
    ctx.fillRect(-6, 2 + bob, 12, 8);

    // Flannel Shirt + Shading
    ctx.fillStyle = app.shirt || "#a83232";
    ctx.fillRect(-7, -8 + bob, 14, 11);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(-7, -4 + bob, 14, 2);
    ctx.fillRect(-3, -8 + bob, 2, 11);

    // Shop Apron
    ctx.fillStyle = app.apron || "#6b4423";
    ctx.fillRect(-5, -5 + bob, 10, 12);
    ctx.fillStyle = "#d49b35";
    ctx.fillRect(-3, -1 + bob, 6, 3);

    // Arms & Hands
    ctx.fillStyle = app.shirt || "#a83232";
    ctx.fillRect(-10, -7 + bob, 3, 8);
    ctx.fillRect(7, -7 + bob, 3, 8);
    ctx.fillStyle = app.skin || "#f3c69f";
    ctx.fillRect(-10, 0 + bob, 3, 3);
    ctx.fillRect(7, 0 + bob, 3, 3);

    // Head
    ctx.fillStyle = app.skin || "#f3c69f";
    ctx.fillRect(-6, -20 + bob, 12, 12);

    // Hair
    ctx.fillStyle = app.hair || "#3b2618";
    ctx.fillRect(-7, -22 + bob, 14, 5);
    if (facing !== "up") {
      ctx.fillRect(-7, -19 + bob, 2, 5);
      ctx.fillRect(5, -19 + bob, 2, 5);
    }

    // Face & PPE
    if (facing !== "up") {
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(-4, -15 + bob, 2, 2);
      ctx.fillRect(2, -15 + bob, 2, 2);

      if (gear.safety_glasses) {
        ctx.fillStyle = "rgba(186, 230, 253, 0.8)";
        ctx.fillRect(-5, -16 + bob, 4, 3);
        ctx.fillRect(1, -16 + bob, 4, 3);
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(-1, -15 + bob, 2, 1);
      }
    }

    if (gear.ear_muffs) {
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(-9, -17 + bob, 2, 6);
      ctx.fillRect(7, -17 + bob, 2, 6);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-7, -23 + bob, 14, 2);
    }

    ctx.restore();
  }

  function drawBuildingRoof(ctx, x, y, w, h, roofColor, trimColor, pal) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x + 6, y + 8, w, h);

    ctx.fillStyle = roofColor;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let sy = y + 10; sy < y + h; sy += 10) {
      ctx.fillRect(x, sy, w, 2);
    }

    ctx.fillStyle = trimColor;
    ctx.fillRect(x, y + Math.floor(h * 0.45), w, 5);
    ctx.strokeStyle = "#29180e";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    if (pal.roofTint) {
      ctx.fillStyle = pal.roofTint;
      ctx.fillRect(x + 3, y + 3, w - 6, Math.floor(h * 0.4));
    }
  }

  function drawTreePlot(ctx, x, y, tree, pal, tick) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // Tilled soil mound (shown for both empty plots and planted trees)
    ctx.fillStyle = "#5c3d24";
    ctx.fillRect(-16, 6, 32, 10);
    ctx.strokeStyle = "#3b2416";
    ctx.lineWidth = 1;
    ctx.strokeRect(-16, 6, 32, 10);

    if (!tree) {
      ctx.restore();
      return;
    }

    if (tree.stage === 0) {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(-2, -6, 4, 14);
      ctx.fillStyle = pal.foliage;
      ctx.fillRect(-7, -12, 14, 8);
      ctx.fillRect(-4, -16, 8, 5);
    } else if (tree.stage === 1) {
      ctx.fillStyle = "#5c3822";
      ctx.fillRect(-4, -14, 8, 22);
      ctx.fillStyle = pal.foliage;
      ctx.fillRect(-16, -28, 32, 18);
      ctx.fillRect(-11, -38, 22, 12);
    } else {
      const sway = Math.sin(tick * 0.03 + x) * 1.5;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(-20, 8, 40, 8);

      ctx.fillStyle = "#4a2c18";
      ctx.fillRect(-6, -22, 12, 30);

      const canopy =
        pal === SEASON_PALETTES.Autumn && tree.species && tree.species.includes("Maple")
          ? "#dc2626"
          : pal === SEASON_PALETTES.Autumn && tree.species && tree.species.includes("Cherry")
          ? "#ea580c"
          : tree.canopyColor || pal.foliage;

      ctx.fillStyle = canopy;
      ctx.fillRect(-24 + sway, -48, 48, 28);
      ctx.fillRect(-18 + sway, -62, 36, 18);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(-16 + sway, -58, 16, 10);

      if (pal.roofTint) {
        ctx.fillStyle = pal.roofTint;
        ctx.fillRect(-18 + sway, -62, 36, 9);
      }
    }

    ctx.restore();
  }

  function drawHomestead(ctx, homeStage, pal) {
    const hx = 1140;
    const hy = 640;

    ctx.fillStyle = pal === SEASON_PALETTES.Winter ? "#cbd5e1" : "#8c6d46";
    ctx.fillRect(hx - 20, hy - 20, 260, 210);
    ctx.strokeStyle = "#5c3d24";
    ctx.lineWidth = 2;
    ctx.strokeRect(hx - 20, hy - 20, 260, 210);

    if (homeStage === 0) {
      ctx.fillStyle = "#d97706";
      [[hx + 20, hy + 20], [hx + 190, hy + 20], [hx + 20, hy + 140], [hx + 190, hy + 140]].forEach(([sx, sy]) => {
        ctx.fillRect(sx, sy, 6, 16);
      });
      ctx.strokeStyle = "#fef08a";
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(hx + 23, hy + 24, 170, 120);
      ctx.setLineDash([]);
      return;
    }

    ctx.fillStyle = "#64748b";
    ctx.fillRect(hx + 20, hy + 25, 175, 125);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(hx + 20, hy + 25, 175, 125);

    if (homeStage >= 2) {
      ctx.fillStyle = homeStage >= 4 ? "#b45309" : "#9a6b43";
      ctx.fillRect(hx + 26, hy + 55, 163, 88);
      ctx.fillStyle = "#451a03";
      ctx.fillRect(hx + 96, hy + 102, 24, 41);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(hx + 114, hy + 122, 3, 3);
    }

    if (homeStage >= 3) {
      ctx.fillStyle = "#78350f";
      ctx.fillRect(hx + 20, hy + 143, 175, 22);
      drawBuildingRoof(ctx, hx + 16, hy + 10, 183, 56, "#7c2d12", "#d97706", pal);
    }

    if (homeStage >= 4) {
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(hx + 46, hy + 96, 28, 24);
      ctx.fillRect(hx + 140, hy + 96, 28, 24);
      ctx.strokeStyle = "#451a03";
      ctx.strokeRect(hx + 46, hy + 96, 28, 24);
      ctx.strokeRect(hx + 140, hy + 96, 28, 24);

      ctx.fillStyle = "#475569";
      ctx.fillRect(hx + 162, hy - 8, 22, 34);
    }

    if (homeStage >= 5) {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(hx + 46, hy + 120, 28, 6);
      ctx.fillRect(hx + 140, hy + 120, 28, 6);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(hx + 28, hy + 158, 60, 8);
      ctx.fillRect(hx + 126, hy + 158, 60, 8);
    }
  }

  function drawWorld(ctx, state, worldData, tick) {
    const pal = SEASON_PALETTES[state.season] || SEASON_PALETTES.Spring;
    const W = worldData.width;
    const H = worldData.height;

    // 1. Seasonal Meadow Background
    ctx.fillStyle = pal.grass;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = pal.grassAlt;
    for (let gx = 20; gx < W; gx += 64) {
      for (let gy = 20; gy < H; gy += 64) {
        ctx.fillRect(gx, gy, 10, 6);
        ctx.fillRect(gx + 28, gy + 30, 8, 5);
      }
    }

    // 2. Winding Alder Creek Stream
    ctx.fillStyle = pal.water;
    ctx.fillRect(600, 0, 46, H);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    const ripple = (tick * 1.2) % 40;
    for (let wy = ripple; wy < H; wy += 40) {
      ctx.fillRect(610, wy, 12, 3);
      ctx.fillRect(626, wy + 18, 10, 3);
    }

    // 3. Dirt & Cobblestone Village Paths + Wooden Bridges
    ctx.fillStyle = pal.path;
    ctx.fillRect(280, 335, 1040, 56);
    ctx.fillRect(810, 260, 48, 85);
    ctx.fillRect(1260, 275, 48, 70);
    ctx.fillRect(810, 385, 48, 220);
    ctx.fillRect(340, 560, 920, 48);
    ctx.fillRect(1230, 560, 48, 120);

    [330, 555].forEach((by) => {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(592, by, 62, 64);
      ctx.fillStyle = "#3b2416";
      ctx.fillRect(592, by, 62, 6);
      ctx.fillRect(592, by + 58, 62, 6);
    });

    // 4. PLAYER'S OPEN-BEAM TIMBER WORKSHOP
    ctx.fillStyle = "#7b5233";
    ctx.fillRect(50, 50, 490, 410);
    ctx.fillStyle = "#644026";
    for (let y = 50; y < 460; y += 28) {
      ctx.fillRect(50, y, 490, 2);
    }
    ctx.fillStyle = "#3c2314";
    ctx.fillRect(50, 50, 490, 32);
    ctx.fillRect(50, 50, 16, 410);
    ctx.fillRect(50, 444, 490, 16);
    ctx.fillRect(524, 50, 16, 265);
    ctx.fillRect(524, 405, 16, 55);

    [130, 350].forEach((wx) => {
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(wx, 56, 70, 20);
    });
    if ((state.ownedTools || []).includes("fire_extinguisher")) {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(265, 58, 10, 18);
    }

    const pileCount = Math.floor((state.sawdustHazard || 0) / 12);
    ctx.fillStyle = "#e5c07b";
    const spots = [
      [180, 300], [310, 340], [230, 390], [400, 290],
      [140, 370], [350, 400], [270, 250], [440, 360]
    ];
    for (let i = 0; i < Math.min(pileCount, spots.length); i++) {
      ctx.fillRect(spots[i][0] - 12, spots[i][1] - 5, 24, 10);
    }

    // 5. SEYMOUR'S HARDWARE & TOOLS BUILDING
    ctx.fillStyle = "#8f3b2e";
    ctx.fillRect(720, 145, 220, 115);
    drawBuildingRoof(ctx, 710, 75, 240, 78, "#334155", "#d49b35", pal);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(732, 185, 196, 18);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(745, 206, 54, 36);
    ctx.fillRect(860, 206, 54, 36);
    ctx.fillStyle = "#451a03";
    ctx.fillRect(816, 208, 28, 52);
    drawCharacter(ctx, 795, 268, { skin: "#f3c69f", hair: "#3b2618", shirt: "#2b4c7e", apron: "#6b4423" }, 1.2, 0, "down", { safety_glasses: true });

    // 6. ROUTLEDGE'S SAWMILL & NURSERY
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(1155, 150, 270, 125);
    drawBuildingRoof(ctx, 1140, 75, 300, 82, "#1e3a2f", "#d97706", pal);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(1340, 220, 72, 14);
    ctx.fillStyle = "#d97706";
    ctx.fillRect(1340, 238, 72, 14);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(1170, 235, 16, 16);
    ctx.fillRect(1194, 235, 16, 16);
    drawCharacter(ctx, 1255, 282, { skin: "#e0a97c", hair: "#6e737b", shirt: "#2e5e4e", apron: "#3d4852" }, 1.2, 0, "down", {});

    // 7. TOWN SQUARE COBBLESTONE PLAZA
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(725, 535, 215, 130);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(725, 535, 215, 130);

    // 8. PLAYER'S HOMESTEAD PLOT
    drawHomestead(ctx, state.homeStage || 0, pal);

    // 9. ALDER CREEK WOODLOT TREES (Safely renders all 12 plots including empty null slots)
    const trees = state.trees || [];
    WOODLOT_COORDS.forEach(([px, py], idx) => {
      const tree = trees[idx] || null;
      drawTreePlot(ctx, tree ? tree.x : px, tree ? tree.y : py, tree, pal, tick);
    });

    // 10. Interactive Stations & Signs
    worldData.stations.forEach((st) => drawStationObject(ctx, st, state, tick));

    // 11. Ambient Hopping Rabbits
    worldData.rabbits.forEach((r) => {
      ctx.save();
      ctx.translate(Math.round(r.x), Math.round(r.y - r.hopZ));
      ctx.fillStyle = state.season === "Winter" ? "#f8fafc" : "#d6c7b2";
      ctx.fillRect(-5, -4, 10, 7);
      ctx.fillRect(3, -8, 5, 5);
      ctx.fillRect(4, -14, 2, 6);
      ctx.fillRect(7, -13, 2, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-7, -3, 3, 3);
      ctx.restore();
    });
  }

  function drawStationObject(ctx, st, state, tick) {
    ctx.save();
    ctx.translate(st.x, st.y);

    if (st.id === "blueprint_desk") {
      ctx.fillStyle = "#5c3822";
      ctx.fillRect(-44, -24, 88, 48);
      ctx.fillStyle = "#93c5fd";
      ctx.fillRect(-28, -14, 42, 28);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(22, -12, 12, 12);
    } else if (st.id === "layout_bench") {
      ctx.fillStyle = "#8c5832";
      ctx.fillRect(-54, -26, 108, 52);
      ctx.strokeStyle = "#3b2416";
      ctx.lineWidth = 2;
      ctx.strokeRect(-54, -26, 108, 52);
      if ((state.ownedTools || []).includes("table_saw")) {
        ctx.fillStyle = "#334155";
        ctx.fillRect(-50, 34, 32, 24);
      }
      if ((state.ownedTools || []).includes("jointer") || (state.ownedTools || []).includes("planer")) {
        ctx.fillStyle = "#1e3a5f";
        ctx.fillRect(-10, 34, 34, 24);
      }
      if ((state.ownedTools || []).includes("band_saw")) {
        ctx.fillStyle = "#166534";
        ctx.fillRect(30, 34, 26, 24);
      }
    } else if (st.id === "assembly_table") {
      ctx.fillStyle = "#78492a";
      ctx.fillRect(-48, -24, 96, 48);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(-34, -18, 68, 5);
      ctx.fillRect(-34, 13, 68, 5);
    } else if (st.id === "town_board") {
      ctx.fillStyle = "#5c3822";
      ctx.fillRect(-36, -20, 72, 40);
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(-26, -12, 22, 24);
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(4, -12, 22, 24);
    } else {
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-3, -10, 6, 24);
      ctx.fillStyle = "#92400e";
      ctx.fillRect(-22, -18, 44, 16);
    }

    const pulse = Math.sin(tick * 0.08) * 1.5;
    ctx.fillStyle = "rgba(28, 17, 10, 0.88)";
    ctx.fillRect(-62, -44 + pulse, 124, 18);
    ctx.strokeStyle = "#d49b35";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-62, -44 + pulse, 124, 18);

    ctx.fillStyle = "#fef3c7";
    ctx.font = "bold 11px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(st.shortLabel, 0, -31 + pulse);

    ctx.restore();
  }

  function drawOverlayEffects(ctx, state, worldData) {
    worldData.particles.forEach((p) => {
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

    worldData.birds.forEach((b) => {
      const wingY = Math.sin(b.wingPhase) * 4;
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x - 6, b.y + wingY);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(b.x + 6, b.y + wingY);
      ctx.stroke();
    });

    const mw = 136;
    const mh = 90;
    const mx = 840 - mw - 12;
    const my = 500 - mh - 12;

    ctx.fillStyle = "rgba(24, 15, 9, 0.82)";
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = "#d49b35";
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mw, mh);

    const sx = mw / worldData.width;
    const sy = mh / worldData.height;

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(mx + 600 * sx, my, 4, mh);

    const landmarks = [
      { x: 280, y: 240, c: "#d97706" },
      { x: 830, y: 210, c: "#ef4444" },
      { x: 1280, y: 210, c: "#22c55e" },
      { x: 310, y: 740, c: "#4ade80" },
      { x: 830, y: 600, c: "#94a3b8" },
      { x: 1240, y: 730, c: "#facc15" }
    ];
    landmarks.forEach((lm) => {
      ctx.fillStyle = lm.c;
      ctx.fillRect(mx + lm.x * sx - 3, my + lm.y * sy - 3, 6, 6);
    });

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(mx + worldData.player.x * sx - 3, my + worldData.player.y * sy - 3, 6, 6);
  }

  return {
    drawCharacter,
    drawWorld,
    drawOverlayEffects
  };
})();
