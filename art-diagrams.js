window.ACM = window.ACM || {};

ACM.ArtDiagrams = (function () {
  /**
   * Renders an authentic imperial fractional tape measure centered around targetInches
   */
  function drawTapeMeasure(canvas, currentInches, denom, showTarget = false, targetInches = 0) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Yellow steel tape blade background
    const grad = ctx.createLinearGradient(0, 20, 0, H - 20);
    grad.addColorStop(0, "#fde047");
    grad.addColorStop(0.5, "#facc15");
    grad.addColorStop(1, "#eab308");
    ctx.fillStyle = grad;
    ctx.fillRect(10, 22, W - 20, H - 44);
    ctx.strokeStyle = "#422006";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 22, W - 20, H - 44);

    // Center view around currentInches (showing a 3-inch window)
    const spanInches = 3.0;
    const startInch = Math.max(0, currentInches - 1.5);
    const pxPerInch = (W - 40) / spanInches;

    const totalTicks = Math.ceil(spanInches * denom);
    const firstTick = Math.floor(startInch * denom);

    for (let t = firstTick; t <= firstTick + totalTicks; t++) {
      const val = t / denom;
      const x = 20 + (val - startInch) * pxPerInch;
      if (x < 14 || x > W - 14) continue;

      let tickHeight = 14;
      let lineWidth = 1;

      if (t % denom === 0) {
        tickHeight = 46;
        lineWidth = 2.5;
      } else if (t % (denom / 2) === 0) {
        tickHeight = 36;
        lineWidth = 2;
      } else if (denom >= 4 && t % (denom / 4) === 0) {
        tickHeight = 28;
        lineWidth = 1.6;
      } else if (denom >= 8 && t % (denom / 8) === 0) {
        tickHeight = 21;
        lineWidth = 1.2;
      } else if (denom >= 16 && t % (denom / 16) === 0) {
        tickHeight = 15;
      } else {
        tickHeight = 10;
      }

      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x, 22 + tickHeight);
      ctx.stroke();

      // Whole inch number label
      if (t % denom === 0) {
        ctx.fillStyle = val % 16 === 0 && val > 0 ? "#dc2626" : "#1c1917";
        ctx.font = "bold 16px Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(Math.round(val)), x, H - 32);
      }
    }

    // Student's Red Pencil Layout Mark
    const markerX = 20 + (currentInches - startInch) * pxPerInch;
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(markerX, 12);
    ctx.lineTo(markerX, H - 12);
    ctx.stroke();

    // Pencil triangle pointer
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(markerX - 7, 10);
    ctx.lineTo(markerX + 7, 10);
    ctx.lineTo(markerX, 21);
    ctx.closePath();
    ctx.fill();

    // Optional target reveal after check
    if (showTarget) {
      const tx = 20 + (targetInches - startInch) * pxPerInch;
      ctx.strokeStyle = "#16a34a";
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx, 14);
      ctx.lineTo(tx, H - 14);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function formatFraction(val, denom = 64) {
    const whole = Math.floor(val + 1e-9);
    let num = Math.round((val - whole) * denom);
    let d = denom;
    if (num === 0) return `${whole}"`;
    if (num === d) return `${whole + 1}"`;
    while (num % 2 === 0 && d % 2 === 0) {
      num /= 2;
      d /= 2;
    }
    return whole > 0 ? `${whole} ${num}/${d}"` : `${num}/${d}"`;
  }

  /**
   * Draws visual identification diagrams for Blueprint Desk questions
   */
  function drawSchematic(canvas, diagramId) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e293b";
    ctx.fillStyle = "#d9a066";
    ctx.lineWidth = 2;

    switch (diagramId) {
      case "joint_dado":
        // Horizontal board with 3-sided channel cut across grain
        ctx.beginPath();
        ctx.moveTo(40, 55);
        ctx.lineTo(135, 55);
        ctx.lineTo(135, 80);
        ctx.lineTo(185, 80);
        ctx.lineTo(185, 55);
        ctx.lineTo(280, 55);
        ctx.lineTo(280, 115);
        ctx.lineTo(40, 115);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Mating shelf hovering above
        ctx.fillStyle = "#b87a44";
        ctx.fillRect(136, 15, 48, 32);
        ctx.strokeRect(136, 15, 48, 32);
        break;

      case "joint_rabbet":
        // L-shaped step cut on board edge
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(210, 50);
        ctx.lineTo(210, 80);
        ctx.lineTo(260, 80);
        ctx.lineTo(260, 115);
        ctx.lineTo(50, 115);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case "joint_mortise_tenon":
        // Left board with mortise hole, right board with protruding tenon
        ctx.fillRect(35, 40, 95, 80);
        ctx.strokeRect(35, 40, 95, 80);
        ctx.fillStyle = "#334155";
        ctx.fillRect(95, 65, 35, 30); // Mortise pocket
        ctx.fillStyle = "#b87a44";
        ctx.beginPath();
        ctx.moveTo(165, 66);
        ctx.lineTo(200, 66);
        ctx.lineTo(200, 40);
        ctx.lineTo(285, 40);
        ctx.lineTo(285, 120);
        ctx.lineTo(200, 120);
        ctx.lineTo(200, 94);
        ctx.lineTo(165, 94);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case "joint_dovetail":
        // Interlocking flared tails
        ctx.fillRect(45, 35, 110, 90);
        ctx.strokeRect(45, 35, 110, 90);
        ctx.fillStyle = "#9a6332";
        [45, 85].forEach((ty) => {
          ctx.beginPath();
          ctx.moveTo(155, ty + 6);
          ctx.lineTo(185, ty);
          ctx.lineTo(185, ty + 28);
          ctx.lineTo(155, ty + 22);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
        break;

      case "fastener_wood_screw":
        // Flat head + smooth upper shank + threaded tip
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.moveTo(60, 62);
        ctx.lineTo(75, 72);
        ctx.lineTo(155, 72); // Smooth shank
        ctx.lineTo(255, 74);
        ctx.lineTo(270, 80);
        ctx.lineTo(255, 86);
        ctx.lineTo(155, 88);
        ctx.lineTo(75, 88);
        ctx.lineTo(60, 98);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Threads only on right half
        for (let tx = 160; tx < 252; tx += 9) {
          ctx.beginPath();
          ctx.moveTo(tx, 68);
          ctx.lineTo(tx + 4, 92);
          ctx.stroke();
        }
        break;

      case "fastener_carriage_bolt":
        // Domed head + square neck + machine threads
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(75, 80, 22, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(75, 67, 22, 26); // Square neck
        ctx.strokeRect(75, 67, 22, 26);
        ctx.fillRect(97, 72, 165, 16);
        ctx.strokeRect(97, 72, 165, 16);
        for (let tx = 185; tx < 258; tx += 7) {
          ctx.beginPath();
          ctx.moveTo(tx, 70);
          ctx.lineTo(tx + 3, 90);
          ctx.stroke();
        }
        break;

      case "fastener_pocket_screw":
        // Washer head + smooth shank + coarse self-tapping tip
        ctx.fillStyle = "#64748b";
        ctx.fillRect(62, 62, 10, 36); // Flat washer head
        ctx.strokeRect(62, 62, 10, 36);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(72, 74, 180, 12);
        ctx.strokeRect(72, 74, 180, 12);
        for (let tx = 155; tx < 248; tx += 10) {
          ctx.beginPath();
          ctx.moveTo(tx, 69);
          ctx.lineTo(tx + 4, 91);
          ctx.stroke();
        }
        break;

      case "tool_framing_square":
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.moveTo(50, 25);
        ctx.lineTo(76, 25);
        ctx.lineTo(76, 110);
        ctx.lineTo(260, 110);
        ctx.lineTo(260, 130);
        ctx.lineTo(50, 130);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case "tool_back_saw":
        // Thick brass spine + rectangular blade + pistol handle
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(85, 58, 185, 44);
        ctx.strokeRect(85, 58, 185, 44);
        ctx.fillStyle = "#d97706"; // Brass spine
        ctx.fillRect(85, 50, 185, 10);
        ctx.strokeRect(85, 50, 185, 10);
        ctx.fillStyle = "#78350f";
        ctx.fillRect(45, 52, 40, 38);
        ctx.strokeRect(45, 52, 40, 38);
        break;

      case "tool_japanese_saw":
        // Long straight rattan-wrapped handle + thin back-ribbed blade
        ctx.fillStyle = "#d97706";
        ctx.fillRect(25, 72, 105, 14);
        ctx.strokeRect(25, 72, 105, 14);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(130, 62, 160, 34);
        ctx.strokeRect(130, 62, 160, 34);
        ctx.fillStyle = "#334155";
        ctx.fillRect(130, 58, 160, 5);
        break;

      case "tool_jointer_vs_planer":
        // Cupped board arrow -> flat reference face
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(40, 65);
        ctx.quadraticCurveTo(95, 85, 150, 65);
        ctx.stroke();
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 13px Trebuchet MS";
        ctx.fillText("Cupped Board  →  Flat Reference Face", 45, 115);
        break;
    }
  }

  return {
    drawTapeMeasure,
    formatFraction,
    drawSchematic
  };
})();
