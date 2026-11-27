window.ACM = window.ACM || {};

ACM.World = (function () {
  const WORLD_W = 1600;
  const WORLD_H = 1050;
  const VIEW_W = 840;
  const VIEW_H = 500;

  const STATIONS = [
    {
      id: "blueprint_desk",
      shortLabel: "Blueprint Desk",
      prompt: "Blueprint & Certification Desk — Study NS Prod Tech questions, visual IDs & Tier Exams",
      x: 135,
      y: 125
    },
    {
      id: "layout_bench",
      shortLabel: "Layout & Milling",
      prompt: "Layout & Milling Bench — Fractional tape measure, Jointer, Planer, Table & Band Saws",
      x: 175,
      y: 285
    },
    {
      id: "assembly_table",
      shortLabel: "Assembly & Finish",
      prompt: "Assembly & Finishing Table — Framing square check, pilot holes, fastening & delivery",
      x: 410,
      y: 285
    },
    {
      id: "tool_shop",
      shortLabel: "Seymour's Hardware",
      prompt: "Seymour's Hardware & Tools — Chat with Seymour, buy tools, PPE & sharpen blades",
      x: 830,
      y: 295
    },
    {
      id: "lumber_mill",
      shortLabel: "Routledge's Sawmill",
      prompt: "Routledge's Sawmill & Nursery — Buy S4S/Rough lumber & tree saplings from Routledge",
      x: 1280,
      y: 300
    },
    {
      id: "town_board",
      shortLabel: "Town Commissions",
      prompt: "Village Commission Board — Browse customer jobs, advance day & view Class Leaderboard",
      x: 830,
      y: 605
    },
    {
      id: "woodlot",
      shortLabel: "Your Woodlot",
      prompt: "Alder Creek Woodlot — Plant saplings, watch trees grow & fell mature timber for lumber",
      x: 310,
      y: 635
    },
    {
      id: "homestead",
      shortLabel: "Your Homestead",
      prompt: "Your Homestead Plot — Build & upgrade your own home or rest until morning",
      x: 1245,
      y: 825
    }
  ];

  const player = {
    x: 290,
    y: 220,
    targetX: null,
    targetY: null,
    speed: 3.3,
    facing: "down",
    frame: 0,
    stepTimer: 0
  };

  const camera = { x: 0, y: 0 };
  const keys = {};
  let activeStation = null;
  let tick = 0;

  // Ambient Rabbits
  const rabbits = [
    { x: 220, y: 720, vx: 0, vy: 0, hopZ: 0, hopV: 0, timer: 40 },
    { x: 430, y: 830, vx: 0, vy: 0, hopZ: 0, hopV: 0, timer: 90 },
    { x: 980, y: 460, vx: 0, vy: 0, hopZ: 0, hopV: 0, timer: 120 },
    { x: 1080, y: 790, vx: 0, vy: 0, hopZ: 0, hopV: 0, timer: 60 }
  ];

  // Ambient Birds
  const birds = Array.from({ length: 5 }, (_, i) => ({
    x: 120 + i * 170,
    y: 50 + (i % 3) * 45,
    speed: 1.1 + (i % 3) * 0.35,
    wingPhase: i * 1.4
  }));

  // Weather Particles
  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * VIEW_W,
    y: Math.random() * VIEW_H,
    speedY: 2 + Math.random() * 3,
    speedX: -0.6 - Math.random() * 1.2,
    kind: "leaf"
  }));

  function init(canvas, onInteract) {
    window.addEventListener("keydown", (e) => {
      if (document.activeElement && ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      keys[e.key.toLowerCase()] = true;
      if ((e.key.toLowerCase() === "e" || e.key === "Enter") && activeStation) {
        onInteract(activeStation.id);
      }
    });

    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const worldX = (e.clientX - rect.left) * scaleX + camera.x;
      const worldY = (e.clientY - rect.top) * scaleY + camera.y;

      const clickedStation = STATIONS.find((s) => Math.hypot(worldX - s.x, worldY - s.y) < 62);
      if (clickedStation && Math.hypot(player.x - clickedStation.x, player.y - clickedStation.y) < 105) {
        onInteract(clickedStation.id);
        return;
      }

      player.targetX = Math.max(36, Math.min(WORLD_W - 36, worldX));
      player.targetY = Math.max(54, Math.min(WORLD_H - 36, worldY));
    });
  }

  function updateAmbient(state) {
    // Rabbits hop & scamper if player gets close
    rabbits.forEach((r) => {
      const distPlayer = Math.hypot(player.x - r.x, player.y - r.y);
      if (distPlayer < 95 && r.hopZ === 0) {
        const angle = Math.atan2(r.y - player.y, r.x - player.x);
        r.vx = Math.cos(angle) * 2.4;
        r.vy = Math.sin(angle) * 2.4;
        r.hopV = 4.2;
      } else {
        r.timer--;
        if (r.timer <= 0 && r.hopZ === 0) {
          r.timer = 70 + Math.floor(Math.random() * 110);
          const ang = Math.random() * Math.PI * 2;
          r.vx = Math.cos(ang) * 1.3;
          r.vy = Math.sin(ang) * 1.3;
          r.hopV = 3.2;
        }
      }

      if (r.hopZ > 0 || r.hopV > 0) {
        r.hopZ += r.hopV;
        r.hopV -= 0.35;
        r.x = Math.max(80, Math.min(WORLD_W - 80, r.x + r.vx));
        r.y = Math.max(120, Math.min(WORLD_H - 60, r.y + r.vy));
        if (r.hopZ <= 0) {
          r.hopZ = 0;
          r.hopV = 0;
          r.vx = 0;
          r.vy = 0;
        }
      }
    });

    // Birds glide across sky
    birds.forEach((b) => {
      b.x += b.speed;
      b.wingPhase += 0.16;
      if (b.x > VIEW_W + 20) {
        b.x = -20;
        b.y = 35 + Math.random() * 140;
      }
    });

    // Weather particles
    const weather = state.weather || "Sunny";
    const season = state.season || "Spring";
    particles.forEach((p) => {
      if (weather === "Rain") {
        p.kind = "rain";
        p.y += p.speedY * 2.4;
        p.x += p.speedX * 1.8;
      } else if (weather === "Snow" || season === "Winter") {
        p.kind = "snow";
        p.y += p.speedY * 0.65;
        p.x += Math.sin(tick * 0.03 + p.y * 0.05) * 0.7;
      } else if (season === "Autumn" || weather === "Breezy") {
        p.kind = "leaf";
        p.y += p.speedY * 0.55;
        p.x += p.speedX * 1.6;
      } else {
        p.kind = "none";
      }

      if (p.y > VIEW_H) {
        p.y = -8;
        p.x = Math.random() * VIEW_W;
      }
      if (p.x < -10) p.x = VIEW_W + 8;
    });
  }

  function update(state) {
    tick++;
    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;

    if (dx !== 0 || dy !== 0) {
      player.targetX = null;
      player.targetY = null;
      const len = Math.hypot(dx, dy);
      dx = (dx / len) * player.speed;
      dy = (dy / len) * player.speed;
    } else if (player.targetX !== null && player.targetY !== null) {
      const dist = Math.hypot(player.targetX - player.x, player.y - player.y);
      const fullDist = Math.hypot(player.targetX - player.x, player.targetY - player.y);
      if (fullDist > 4) {
        dx = ((player.targetX - player.x) / fullDist) * player.speed;
        dy = ((player.targetY - player.y) / fullDist) * player.speed;
      } else {
        player.targetX = null;
        player.targetY = null;
      }
    }

    if (dx !== 0 || dy !== 0) {
      player.x = Math.max(36, Math.min(WORLD_W - 36, player.x + dx));
      player.y = Math.max(54, Math.min(WORLD_H - 36, player.y + dy));

      if (Math.abs(dx) > Math.abs(dy)) {
        player.facing = dx > 0 ? "right" : "left";
      } else {
        player.facing = dy > 0 ? "down" : "up";
      }

      player.stepTimer++;
      if (player.stepTimer % 7 === 0) {
        player.frame = (player.frame + 1) % 4;
      }
    } else {
      player.frame = 0;
    }

    // Center camera smoothly on player
    camera.x = Math.max(0, Math.min(WORLD_W - VIEW_W, Math.round(player.x - VIEW_W / 2)));
    camera.y = Math.max(0, Math.min(WORLD_H - VIEW_H, Math.round(player.y - VIEW_H / 2)));

    updateAmbient(state);

    // Closest interactive station
    let nearest = null;
    let minDist = 96;
    STATIONS.forEach((s) => {
      const d = Math.hypot(player.x - s.x, player.y - s.y);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    });
    activeStation = nearest;
  }

  function render(ctx, state) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    const worldData = {
      width: WORLD_W,
      height: WORLD_H,
      stations: STATIONS,
      rabbits,
      birds,
      particles,
      player
    };

    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ACM.ArtSprites.drawWorld(ctx, state, worldData, tick);

    const gear = {
      safety_glasses: state.ownedTools.includes("safety_glasses"),
      ear_muffs: state.ownedTools.includes("ear_muffs")
    };

    ACM.ArtSprites.drawCharacter(
      ctx,
      player.x,
      player.y,
      state.appearance,
      1.3,
      player.frame,
      player.facing,
      gear
    );
    ctx.restore();

    ACM.ArtSprites.drawOverlayEffects(ctx, state, worldData);
  }

  function getActiveStation() {
    return activeStation;
  }

  return {
    init,
    update,
    render,
    getActiveStation
  };
})();
