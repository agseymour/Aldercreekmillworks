window.ACM = window.ACM || {};

ACM.World = (function () {
  const STATIONS = [
    {
      id: "blueprint_desk",
      shortLabel: "Blueprint Desk",
      prompt: "Blueprint & Certification Desk — Study questions, visual IDs & Tier Exams",
      x: 115,
      y: 105
    },
    {
      id: "tool_shop",
      shortLabel: "Tool & Safety Shop",
      prompt: "Tool & Safety Hardware — Buy the 13 core tools, safety gear & sharpen blades",
      x: 365,
      y: 105
    },
    {
      id: "layout_bench",
      shortLabel: "Layout & Milling",
      prompt: "Layout & Milling Bench — Tape measure cuts, Jointer, Planer, Table & Band Saws",
      x: 155,
      y: 265
    },
    {
      id: "assembly_table",
      shortLabel: "Assembly & Finish",
      prompt: "Assembly & Finishing Table — Framing square check, pilot holes, fastening & delivery",
      x: 410,
      y: 265
    },
    {
      id: "lumber_mill",
      shortLabel: "Lumber Mill",
      prompt: "Alder Creek Sawmill — Buy S4S, Rough-Sawn hardwoods, Baltic Birch & Reclaimed boards",
      x: 685,
      y: 135
    },
    {
      id: "town_board",
      shortLabel: "Client & Story Board",
      prompt: "Town Commission Board — View Act Storyline, accept jobs & check Class Leaderboard",
      x: 685,
      y: 385
    }
  ];

  const player = {
    x: 270,
    y: 210,
    targetX: null,
    targetY: null,
    speed: 2.8,
    facing: "down",
    frame: 0,
    stepTimer: 0
  };

  const keys = {};
  let activeStation = null;
  let tick = 0;

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
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;

      // Check if clicked directly on a station while already close
      const clickedStation = STATIONS.find((s) => Math.hypot(cx - s.x, cy - s.y) < 58);
      if (clickedStation && Math.hypot(player.x - clickedStation.x, player.y - clickedStation.y) < 92) {
        onInteract(clickedStation.id);
        return;
      }

      player.targetX = Math.max(32, Math.min(805, cx));
      player.targetY = Math.max(48, Math.min(465, cy));
    });
  }

  function update() {
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
      const dist = Math.hypot(player.targetX - player.x, player.targetY - player.y);
      if (dist > 4) {
        dx = ((player.targetX - player.x) / dist) * player.speed;
        dy = ((player.targetY - player.y) / dist) * player.speed;
      } else {
        player.targetX = null;
        player.targetY = null;
      }
    }

    if (dx !== 0 || dy !== 0) {
      player.x = Math.max(32, Math.min(805, player.x + dx));
      player.y = Math.max(48, Math.min(465, player.y + dy));

      if (Math.abs(dx) > Math.abs(dy)) {
        player.facing = dx > 0 ? "right" : "left";
      } else {
        player.facing = dy > 0 ? "down" : "up";
      }

      player.stepTimer++;
      if (player.stepTimer % 8 === 0) {
        player.frame = (player.frame + 1) % 4;
      }
    } else {
      player.frame = 0;
    }

    // Find closest interactive station within range
    let nearest = null;
    let minDist = 86;
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
    ctx.clearRect(0, 0, 840, 500);
    ACM.ArtSprites.drawWorkshopMap(ctx, state, STATIONS, tick);

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
