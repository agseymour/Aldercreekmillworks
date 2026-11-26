window.ACM = window.ACM || {};

ACM.ArtSprites = (function () {
  function drawCharacter(ctx, x, y, appearance, scale = 1, frame = 0, facing = "down", gear = {}) {
    if (!ctx) return;
    const app = appearance || {};
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);

    const bob = frame % 2 === 1 ? -1 : 0;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(-8, 12, 16, 4);

    // Boots
    ctx.fillStyle = "#3a2214";
    const stepOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;
    ctx.fillRect(-6, 9 + (stepOffset > 0 ? -1 : 0), 5, 5);
    ctx.fillRect(1, 9 + (stepOffset < 0 ? -1 : 0), 5, 5);

    // Work Pants
    ctx.fillStyle = "#2d4059";
    ctx.fillRect(-6, 2 + bob, 12, 8);

    // Flannel Shirt
    ctx.fillStyle = app.shirt || "#a83232";
    ctx.fillRect(-7, -8 + bob, 14, 11);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(-7, -4 + bob, 14, 2);

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

    // Eyes & PPE
    if (facing !== "up") {
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(-4, -15 + bob, 2, 2);
      ctx.fillRect(2, -15 + bob, 2, 2);

      if (gear.safety_glasses) {
        ctx.fillStyle = "rgba(165, 243, 252, 0.75)";
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

  function drawWorkshopMap(ctx, state, stations, tick) {
    const W = 840;
    const H = 500;

    // Timber Workshop Floor (Left 580px)
    ctx.fillStyle = "#7b5233";
    ctx.fillRect(0, 0, 580, H);

    ctx.fillStyle = "#644026";
    for (let y = 0; y < H; y += 28) {
      ctx.fillRect(0, y, 580, 2);
      for (let x = (y % 56 === 0 ? 40 : 0); x < 580; x += 96) {
        ctx.fillRect(x, y, 2, 28);
      }
    }

    // Outdoor Courtyard & Cobblestone Path (Right 260px)
    ctx.fillStyle = "#4c7c44";
    ctx.fillRect(580, 0, 260, H);
    ctx.fillStyle = "#5f9655";
    for (let gx = 600; gx < 820; gx += 44) {
      for (let gy = 30; gy < 470; gy += 52) {
        ctx.fillRect(gx, gy, 6, 4);
        ctx.fillRect(gx + 3, gy - 3, 4, 4);
      }
    }
    ctx.fillStyle = "#9c9488";
    ctx.fillRect(580, 210, 220, 80);
    ctx.fillStyle = "#7d7569";
    for (let cx = 590; cx < 790; cx += 24) {
      ctx.fillRect(cx, 222, 16, 12);
      ctx.fillRect(cx + 8, 250, 16, 12);
    }

    // Timber Barn Walls
    ctx.fillStyle = "#3c2314";
    ctx.fillRect(0, 0, 580, 34);
    ctx.fillRect(0, 0, 18, H);
    ctx.fillRect(0, H - 18, 580, 18);
    ctx.fillRect(566, 0, 18, 200);
    ctx.fillRect(566, 300, 18, 200);

    // Sunlit Windows
    [110, 340].forEach((wx) => {
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(wx, 6, 74, 22);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(wx + 35, 6, 4, 22);
      ctx.fillStyle = "rgba(254, 243, 199, 0.12)";
      ctx.beginPath();
      ctx.moveTo(wx, 34);
      ctx.lineTo(wx + 74, 34);
      ctx.lineTo(wx + 94, 130);
      ctx.lineTo(wx - 20, 130);
      ctx.closePath();
      ctx.fill();
    });

    // Fire Extinguisher if owned
    if (state.ownedTools.includes("fire_extinguisher")) {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(255, 10, 10, 18);
      ctx.fillStyle = "#111827";
      ctx.fillRect(257, 7, 6, 3);
    }

    // Sawdust Piles
    const pileCount = Math.floor(state.sawdustHazard / 12);
    ctx.fillStyle = "#e5c07b";
    const spots = [
      [190, 290], [320, 340], [240, 390], [410, 280],
      [150, 360], [360, 410], [280, 250], [450, 370]
    ];
    for (let i = 0; i < Math.min(pileCount, spots.length); i++) {
      const [sx, sy] = spots[i];
      ctx.fillRect(sx - 12, sy - 5, 24, 10);
    }

    stations.forEach((st) => drawStationObject(ctx, st, state, tick));

    // NPCs
    drawCharacter(ctx, 745, 95, { skin: "#e0a97c", hair: "#6e737b", shirt: "#2e5e4e", apron: "#3d4852" }, 1.15, 0, "down", {});
    drawCharacter(ctx, 745, 365, { skin: "#f3c69f", hair: "#8c4a27", shirt: "#2b4c7e", apron: "#8a6d3b" }, 1.15, 0, "down", {});
  }

  function drawStationObject(ctx, st, state, tick) {
    ctx.save();
    ctx.translate(st.x, st.y);

    if (st.id === "blueprint_desk") {
      ctx.fillStyle = "#5c3822";
      ctx.fillRect(-46, -26, 92, 52);
      ctx.fillStyle = "#93c5fd";
      ctx.fillRect(-30, -16, 44, 30);
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(-26, -12, 36, 22);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(24, -14, 12, 12);
    } else if (st.id === "tool_shop") {
      ctx.fillStyle = "#4a2c18";
      ctx.fillRect(-48, -26, 96, 52);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(-48, -26, 96, 8);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(-34, -12, 18, 22);
      ctx.fillRect(-4, -12, 8, 22);
      ctx.fillRect(16, -12, 16, 22);
    } else if (st.id === "layout_bench") {
      ctx.fillStyle = "#8c5832";
      ctx.fillRect(-58, -28, 116, 56);
      ctx.strokeStyle = "#3b2416";
      ctx.lineWidth = 2;
      ctx.strokeRect(-58, -28, 116, 56);
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(-40, -12);
      ctx.lineTo(-40, 12);
      ctx.lineTo(-15, 12);
      ctx.stroke();
      ctx.fillStyle = "#eab308";
      ctx.fillRect(18, -8, 16, 16);

      if (state.ownedTools.includes("table_saw")) {
        ctx.fillStyle = "#334155";
        ctx.fillRect(-56, 36, 34, 28);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-42, 42, 6, 16);
      }
      if (state.ownedTools.includes("jointer") || state.ownedTools.includes("planer")) {
        ctx.fillStyle = "#1e3a5f";
        ctx.fillRect(-14, 36, 36, 28);
      }
      if (state.ownedTools.includes("band_saw")) {
        ctx.fillStyle = "#166534";
        ctx.fillRect(30, 36, 28, 28);
      }
    } else if (st.id === "assembly_table") {
      ctx.fillStyle = "#78492a";
      ctx.fillRect(-52, -26, 104, 52);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(-38, -20, 76, 6);
      ctx.fillRect(-38, 14, 76, 6);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(34, -8, 10, 16);
    } else if (st.id === "lumber_mill") {
      ctx.fillStyle = "#92400e";
      ctx.fillRect(-46, -24, 92, 48);
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(-40, -18, 80, 10);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(-40, -4, 80, 10);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-40, 10, 80, 10);
    } else if (st.id === "town_board") {
      ctx.fillStyle = "#5c3822";
      ctx.fillRect(-42, -24, 84, 48);
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(-32, -16, 26, 30);
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(4, -16, 26, 30);
    }

    const pulse = Math.sin(tick * 0.08) * 1.5;
    ctx.fillStyle = "rgba(28, 17, 10, 0.86)";
    ctx.fillRect(-54, -46 + pulse, 108, 17);
    ctx.strokeStyle = "#d49b35";
    ctx.lineWidth = 1;
    ctx.strokeRect(-54, -46 + pulse, 108, 17);

    ctx.fillStyle = "#fef3c7";
    ctx.font = "bold 11px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(st.shortLabel, 0, -34 + pulse);

    ctx.restore();
  }

  return {
    drawCharacter,
    drawWorkshopMap
  };
})();
