window.ACM = window.ACM || {};

/**
 * Safety test illustrations. ACM.SafetyArt.render(canvas, permitId, questionText) draws
 *   - the machine the test is about (left), and
 *   - an inset picture of the TOPIC of the question (right): glasses, push stick, clamp, guard, kickback ...
 * The pictures show the subject of the question, never the answer (no ticks or crosses).
 * Returns { cap, dim } so the caller can print a caption and any measurement named in the question.
 */
ACM.SafetyArt = (function () {
  const W = 320, H = 150;
  const col = { steel: "#a9b3be", steelD: "#6d7884", steelDD: "#3e4650", dark: "#1f1a17", green: "#456f56", greenD: "#2f4f3d", wood: "#cf9f62", woodD: "#9a6d3a", woodL: "#e6bf86", red: "#b83a2e", yellow: "#f2c230", blue: "#3d6f9e", orange: "#d9791c", skin: "#f0c4a0", skinD: "#d79f78", clear: "rgba(170,220,245,0.55)" };
  let c;
  const R = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const O = (x, y, r, f) => { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const P = (pts, f) => { c.fillStyle = f; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); };
  const L = (x1, y1, x2, y2, f, w) => { c.strokeStyle = f; c.lineWidth = w || 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  const wood = (x, y, w, h) => { R(x, y, w, h, col.wood); R(x, y, w, 2, col.woodL); R(x, y + h - 2, w, 2, col.woodD); for (let i = 6; i < w - 4; i += 11) R(x + i, y + 3, 5, 1, col.woodD); };

  // ---------------------------------------------------------------- machines (drawn in a 160 x 112 box, floor at y=112)
  const M = {};
  M.orientation = () => {
    R(0, 20, 160, 8, "#8a6a48"); R(0, 28, 160, 2, "#5a4028");                       // shelf
    for (let i = 0; i < 6; i++) { R(8 + i * 22, 8, 5, 12, ["#b83a2e", "#3d6f9e", "#f2c230", "#456f56", "#b83a2e", "#3d6f9e"][i]); R(8 + i * 22, 8, 5, 2, "#fff4"); }
    R(10, 62, 140, 8, col.wood); R(10, 70, 140, 3, col.woodD); R(16, 73, 8, 39, col.woodD); R(136, 73, 8, 39, col.woodD);   // workbench
    R(100, 50, 36, 12, col.steelD); R(104, 44, 4, 6, col.steel);                     // vise
    R(24, 52, 28, 10, col.red); R(30, 48, 16, 4, col.red);                           // toolbox
    R(118, 6, 30, 30, col.yellow); for (let i = 0; i < 4; i++) P([[118 + i * 8, 36], [126 + i * 8, 6], [130 + i * 8, 6], [122 + i * 8, 36]], col.dark);  // hazard sign
    R(118, 6, 30, 30, "rgba(255,255,255,0.0)");
    R(60, 38, 18, 24, col.red); R(63, 41, 12, 8, "#fff"); R(66, 52, 6, 8, col.dark);  // extinguisher
  };
  M.band = () => {
    R(48, 100, 64, 12, col.steelDD); R(62, 20, 44, 82, col.green); R(62, 20, 44, 4, "#6b9a80");
    O(84, 34, 16, col.steelD); O(84, 34, 11, col.steel); O(84, 88, 16, col.steelD); O(84, 88, 11, col.steel);
    R(68, 34, 1, 54, col.steelDD);                                                    // blade
    R(40, 70, 56, 6, col.steel); R(40, 76, 56, 2, col.steelD); R(66, 46, 6, 26, col.yellow); R(62, 44, 14, 4, col.yellow);  // table + guard
    wood(44, 63, 30, 7);
  };
  M.drillpress = () => {
    R(36, 104, 66, 8, col.steelDD); R(66, 22, 8, 82, col.steel); R(46, 76, 48, 5, col.steelD);
    R(52, 18, 42, 22, col.green); R(58, 6, 30, 12, col.greenD); R(66, 40, 8, 8, col.steelDD); R(69, 48, 2, 22, col.steel);
    R(94, 26, 22, 3, col.steelD); O(118, 27, 4, col.red);
    wood(52, 70, 34, 6);
  };
  M.handdrill = () => {
    R(0, 104, 160, 8, col.woodD); wood(14, 78, 30, 26);
    R(52, 36, 42, 26, col.orange); R(52, 36, 42, 4, "#f0a050"); R(40, 44, 14, 12, col.steelDD); R(18, 48, 24, 3, col.steel);   // body, chuck, bit
    R(70, 62, 14, 34, col.dark); R(64, 94, 28, 10, col.steelDD); R(84, 52, 6, 6, col.yellow);                                    // handle, battery, trigger
    R(8, 70, 8, 40, col.steelD); R(8, 70, 32, 6, col.steelD);                                                                     // clamp
  };
  M.jigsaw = () => {
    R(0, 100, 160, 12, col.woodD); wood(20, 82, 120, 18);
    R(54, 34, 44, 24, col.blue); R(60, 24, 32, 10, col.dark); R(48, 58, 56, 5, col.steel); R(74, 63, 2, 28, col.steel);
    R(98, 40, 14, 6, col.dark); L(112, 43, 150, 30, col.dark, 2);
  };
  M.recip = () => {
    R(0, 104, 160, 8, col.woodD); R(24, 82, 118, 12, col.wood); R(24, 82, 118, 2, col.woodL);
    R(52, 44, 58, 18, col.orange); R(52, 44, 58, 3, "#f0a050"); R(98, 56, 12, 28, col.dark); R(46, 44, 6, 18, col.steelDD); R(8, 50, 40, 5, col.steel);
    R(84, 40, 4, 4, col.yellow);
  };
  M.jointer = () => {
    R(24, 78, 94, 34, col.greenD); R(10, 70, 52, 6, col.steel); R(66, 70, 62, 6, col.steel); R(58, 66, 10, 4, col.dark);
    R(58, 56, 14, 10, col.yellow); R(12, 46, 112, 6, col.steelD); R(12, 52, 112, 16, col.steel);  // guard, fence
    wood(20, 62, 46, 8);
  };
  M.mitre = () => {
    R(26, 92, 108, 10, col.steelDD); R(26, 80, 108, 12, col.steel); R(26, 100, 20, 12, col.steelD); R(114, 100, 20, 12, col.steelD);
    O(80, 62, 22, col.steelD); O(80, 62, 18, col.steel); O(80, 62, 3, col.dark); P([[58, 62], [80, 40], [102, 62]], col.yellow);
    R(78, 14, 6, 28, col.steelDD); R(88, 34, 24, 14, col.red); R(104, 18, 6, 22, col.dark); wood(36, 84, 90, 8);
  };
  M.scroll = () => {
    R(40, 96, 72, 14, col.steelDD); R(50, 76, 52, 5, col.steel); R(100, 24, 9, 76, col.red); R(46, 24, 64, 7, col.red);
    R(74, 31, 1, 46, col.steelD); R(68, 50, 12, 4, col.steelDD); wood(56, 70, 32, 6);
  };
  M.sander = () => {
    R(60, 72, 40, 40, col.steelDD); R(42, 64, 60, 6, col.steelD); O(98, 48, 30, col.steelD); O(98, 48, 26, "#c5b9a0");
    for (let i = 0; i < 24; i++) R(80 + (i * 7) % 36, 30 + (i * 11) % 36, 2, 1, "#9c8f76"); R(72, 64, 8, 4, col.dark); wood(46, 58, 26, 6);
  };
  M.planer = () => {
    R(40, 90, 80, 22, col.steelDD); R(34, 40, 92, 52, col.blue); R(34, 40, 92, 5, "#6b9bc6"); R(92, 20, 30, 20, col.steelD); O(60, 34, 9, col.red); R(58, 33, 4, 2, "#fff");
    R(34, 68, 92, 8, col.dark); R(8, 77, 28, 5, col.steel); R(124, 77, 28, 5, col.steel); wood(12, 70, 60, 8);
  };
  M.tablesaw = () => {
    R(34, 78, 92, 34, col.steelDD); R(18, 72, 124, 7, col.steel); R(18, 72, 124, 2, "#d3dbe3");
    c.save(); c.beginPath(); c.rect(0, 0, 160, 72); c.clip(); O(80, 78, 24, col.steelD); O(80, 78, 20, col.steel); for (let a = 0; a < 12; a++) R(80 + Math.cos(a / 12 * 6.28) * 22 - 1, 78 + Math.sin(a / 12 * 6.28) * 22 - 1, 3, 3, col.steelDD); c.restore();
    R(78, 34, 3, 24, col.steelD); R(68, 32, 24, 4, col.clear); R(104, 60, 6, 12, col.steelD); wood(30, 64, 38, 8);
  };
  M.circular = () => {
    R(28, 76, 6, 36, col.woodD); R(126, 76, 6, 36, col.woodD); wood(14, 68, 132, 8);
    R(58, 30, 38, 24, col.red); R(50, 26, 14, 28, col.dark); R(56, 22, 38, 6, col.dark); R(46, 56, 70, 4, col.steel);
    O(92, 66, 16, col.steelD); O(92, 66, 12, col.steel); P([[76, 66], [92, 48], [108, 66]], col.yellow);
  };
  M.nailer = () => {
    wood(56, 88, 80, 8); R(110, 90, 20, 8, col.woodD);
    R(30, 38, 64, 16, col.blue); R(30, 54, 54, 7, col.steel); R(94, 42, 10, 26, col.steelDD); R(98, 68, 4, 14, col.steel); R(52, 28, 24, 10, col.dark);
    c.strokeStyle = col.yellow; c.lineWidth = 3; c.beginPath(); c.moveTo(30, 44); c.bezierCurveTo(6, 40, 6, 90, 40, 104); c.stroke(); R(26, 40, 8, 8, col.steel);
  };
  M.router = () => {
    R(0, 100, 160, 12, col.woodD); wood(24, 90, 112, 10);
    R(50, 74, 60, 6, col.clear); R(66, 34, 28, 42, col.red); R(66, 34, 28, 4, "#e0695c"); R(40, 54, 12, 16, col.dark); R(108, 54, 12, 16, col.dark); R(78, 80, 4, 10, col.steel);
  };
  M.routertable = () => {
    R(30, 78, 100, 34, col.steelDD); R(18, 72, 124, 6, col.steel); R(18, 56, 124, 16, col.steelD); R(72, 56, 16, 16, col.dark);
    R(64, 44, 32, 12, col.clear); R(78, 62, 4, 10, col.steel); R(118, 84, 6, 10, col.red); wood(24, 64, 40, 8);
  };
  M.lathe = () => {
    R(8, 86, 144, 8, col.steel); R(14, 94, 10, 18, col.steelD); R(128, 94, 10, 18, col.steelD);
    R(14, 54, 28, 32, col.greenD); R(112, 62, 24, 24, col.green); R(40, 68, 72, 14, col.woodD); R(40, 68, 72, 3, col.wood);
    for (let i = 0; i < 6; i++) R(46 + i * 11, 68, 2, 14, "#b4864e"); R(54, 62, 40, 4, col.steelD); R(70, 66, 4, 20, col.steelD);
  };

  // ---------------------------------------------------------------- topic insets (drawn in an 80 x 84 panel)
  const head = (x, y, r, hair) => { O(x, y, r, col.skin); R(x - r, y - r - 2, r * 2, r - 1, hair || "#5a3a22"); R(x - 3, y + 2, 2, 2, col.dark); R(x + 2, y + 2, 2, 2, col.dark); };
  const hand = (x, y, s) => { R(x, y, 14 * s, 12 * s, col.skin); for (let i = 0; i < 4; i++) R(x + i * 3.5 * s, y - 8 * s, 3 * s, 9 * s, col.skin); R(x - 4 * s, y + 2 * s, 5 * s, 3 * s, col.skin); };
  const I = {};
  I.glasses = () => { head(40, 40, 22); R(20, 36, 18, 10, col.clear); R(42, 36, 18, 10, col.clear); R(20, 36, 18, 2, col.blue); R(42, 36, 18, 2, col.blue); R(38, 39, 4, 2, col.blue); R(14, 38, 6, 3, col.blue); R(60, 38, 6, 3, col.blue); };
  I.hair = () => { O(34, 30, 18, col.skin); R(16, 12, 36, 12, "#5a3a22"); R(48, 16, 8, 8, "#5a3a22"); R(52, 22, 6, 22, "#5a3a22"); R(28, 30, 2, 2, col.dark); R(38, 30, 2, 2, col.dark);
    R(8, 52, 52, 30, "#7d8794"); R(30, 52, 2, 18, "#cfd6dd"); R(40, 52, 2, 22, "#cfd6dd"); R(29, 70, 4, 4, "#cfd6dd"); R(39, 74, 4, 4, "#cfd6dd"); };
  I.ears = () => { head(40, 42, 20); R(14, 28, 10, 22, col.red); R(56, 28, 10, 22, col.red); R(14, 18, 52, 6, col.dark); R(12, 28, 4, 22, "#e0695c"); };
  I.shield = () => { head(40, 42, 20); R(14, 18, 52, 40, col.clear); R(12, 16, 56, 5, col.dark); R(14, 20, 4, 36, "#fff6"); };
  I.drugs = () => { R(10, 22, 24, 40, "#d98e2a"); R(10, 16, 24, 8, "#fff"); R(14, 32, 16, 14, "#fff"); R(40, 38, 12, 40, "#6d8c3a"); R(42, 26, 8, 14, "#6d8c3a"); R(42, 22, 8, 4, col.steel); for (let i = 0; i < 3; i++) O(58 + i * 6, 70 - i * 3, 3, "#fff"); };
  I.distract = () => { R(10, 56, 24, 6, col.steelD); head(22, 44, 8); R(14, 52, 16, 4, col.blue); head(58, 30, 10); R(48, 40, 20, 20, col.orange); R(66, 28, 10, 3, col.skin); R(68, 18, 4, 8, col.red); R(68, 28, 4, 3, col.red); };
  I.teacher = () => { head(24, 36, 14, "#8a8a8a"); R(8, 52, 32, 28, "#3d6f9e"); R(34, 52, 18, 14, "#fff"); R(36, 54, 14, 2, col.steel); P([[40, 14], [74, 14], [74, 34], [54, 34], [48, 42], [48, 34], [40, 34]], "#fff"); R(46, 20, 22, 3, col.steelD); R(46, 26, 14, 3, col.steelD); };
  I.pushstick = () => { wood(6, 54, 68, 10); R(44, 38, 6, 18, col.woodD); R(22, 38, 28, 8, col.woodD); R(22, 38, 6, 14, col.woodD); R(62, 66, 10, 4, col.steelD); hand(34, 18, 1); };
  I.clamp = () => { wood(16, 40, 48, 22); R(10, 26, 6, 52, col.steelD); R(10, 26, 36, 6, col.steelD); R(10, 72, 36, 6, col.steelD); R(42, 32, 8, 14, col.steelDD); R(38, 46, 16, 3, col.steelDD); };
  I.unplug = () => { R(44, 30, 28, 24, col.steel); R(52, 36, 4, 12, col.dark); R(60, 36, 4, 12, col.dark); R(4, 34, 22, 16, col.dark); R(26, 38, 8, 3, col.steel); R(26, 44, 8, 3, col.steel); L(4, 42, 0, 60, col.dark, 3); };
  I.battery = () => { R(18, 28, 44, 30, col.dark); R(24, 34, 32, 8, "#4caf50"); R(28, 48, 24, 6, col.yellow); R(62, 38, 6, 10, col.steelD); };
  I.buttons = () => { R(8, 12, 64, 58, col.steelD); R(12, 16, 56, 50, col.steel); O(28, 38, 12, col.green); O(54, 38, 12, col.red); O(54, 38, 7, "#e0695c"); R(22, 36, 12, 3, "#fff"); };
  I.guard = () => { O(40, 50, 26, col.steelD); O(40, 50, 21, col.steel); P([[10, 50], [40, 16], [70, 50]], col.yellow); P([[18, 50], [40, 24], [62, 50]], "rgba(0,0,0,0.12)"); };
  I.fingers = () => { hand(18, 40, 2); R(50, 6, 4, 70, col.steelD); for (let i = 0; i < 6; i++) R(50, 10 + i * 12, 4, 6, col.steel); c.setLineDash([3, 3]); c.strokeStyle = col.red; c.lineWidth = 2; c.beginPath(); c.arc(52, 40, 28, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); };
  I.onehand = () => { R(18, 40, 40, 20, col.orange); R(54, 44, 14, 8, col.steelDD); hand(26, 56, 1); R(10, 16, 14, 12, col.steelD); };
  I.twohands = () => { R(22, 32, 44, 18, col.red); R(10, 44, 12, 14, col.dark); R(66, 44, 12, 14, col.dark); hand(4, 56, 1); hand(64, 56, 1); };
  I.cross = () => { R(14, 40, 52, 10, "#3d6f9e"); R(34, 30, 24, 10, col.skin); R(22, 54, 36, 10, col.skin); R(30, 66, 8, 12, col.skin); R(52, 56, 8, 8, col.skin); R(10, 72, 60, 6, col.steelDD); };
  I.kickback = () => { wood(20, 46, 44, 10); R(60, 38, 4, 26, col.steelD); P([[56, 24], [46, 16], [46, 32]], col.red); L(46, 24, 8, 24, col.red, 3); P([[8, 24], [18, 18], [18, 30]], col.red); };
  I.defects = () => { wood(8, 32, 64, 22); O(30, 43, 7, col.woodD); O(30, 43, 3, "#5a3a22"); R(48, 36, 2, 14, col.steel); R(46, 35, 6, 2, col.steel); R(58, 40, 8, 2, col.steelD); R(58, 40, 2, 6, col.steelD); R(66, 40, 2, 6, col.steelD); };
  I.debris = () => { for (let i = 0; i < 18; i++) R(8 + (i * 23) % 56, 62 + (i * 7) % 10, 4, 2, i % 3 ? col.woodL : col.woodD); R(46, 14, 4, 44, col.woodD); P([[34, 56], [62, 56], [58, 64], [38, 64]], col.yellow); O(40, 74, 6, col.clear); };
  I.shoe = () => { P([[14, 66], [14, 26], [34, 26], [38, 46], [66, 52], [66, 66]], "#5a3a22"); R(12, 66, 56, 6, col.dark); R(14, 26, 20, 4, "#7a5230"); R(22, 36, 12, 2, col.yellow); R(24, 42, 12, 2, col.yellow); };
  I.spin = () => { O(40, 42, 26, col.steelD); O(40, 42, 20, col.steel); O(40, 42, 4, col.dark); c.strokeStyle = col.red; c.lineWidth = 3; c.beginPath(); c.arc(40, 42, 33, 0.3, 2.6); c.stroke(); P([[18, 66], [28, 62], [24, 72]], col.red); c.beginPath(); c.arc(40, 42, 33, 3.6, 5.8); c.stroke(); P([[62, 18], [52, 20], [58, 28]], col.red); };
  I.gauge = () => { O(40, 48, 30, col.steel); O(40, 48, 25, "#f4ecd8"); for (let a = 0; a < 9; a++) { const t = Math.PI * (1 + a / 8); L(40 + Math.cos(t) * 20, 48 + Math.sin(t) * 20, 40 + Math.cos(t) * 24, 48 + Math.sin(t) * 24, col.dark, 2); } L(40, 48, 58, 32, col.red, 3); O(40, 48, 3, col.dark); R(12, 74, 56, 6, col.steelD); };
  I.cord = () => { c.strokeStyle = col.dark; c.lineWidth = 4; c.beginPath(); c.moveTo(60, 14); c.bezierCurveTo(10, 20, 70, 50, 20, 70); c.stroke(); R(54, 8, 18, 12, col.steel); R(10, 66, 14, 14, col.red); };
  I.stance = () => { head(18, 24, 9); R(10, 34, 16, 26, col.blue); R(10, 60, 6, 16, "#2c3e50"); R(20, 60, 6, 16, "#2c3e50"); R(40, 38, 34, 26, col.steelD); R(46, 30, 20, 8, col.steel); L(30, 48, 40, 48, col.yellow, 3); P([[36, 42], [44, 48], [36, 54]], col.yellow); };
  I.hold = () => { R(8, 50, 64, 8, col.steel); wood(16, 40, 40, 10); R(58, 20, 6, 30, col.steelD); R(56, 20, 20, 4, col.steelD); hand(28, 24, 1); };
  I.feed = () => { wood(6, 44, 40, 10); P([[48, 40], [74, 49], [48, 58]], col.steelD); L(8, 28, 40, 28, col.red, 3); P([[44, 28], [34, 22], [34, 34]], col.red); };
  I.under = () => { wood(8, 20, 64, 10); R(30, 38, 4, 30, col.steelD); R(32, 36, 14, 4, col.steelD); R(50, 46, 22, 8, "#5a7fa8"); L(10, 30, 70, 30, col.red, 1); };
  I.base = () => { R(10, 56, 60, 6, col.clear); R(28, 22, 24, 34, col.red); wood(6, 62, 68, 10); };
  I.bit = () => { R(32, 12, 16, 26, col.red); R(36, 38, 8, 10, col.steelD); R(38, 48, 4, 22, col.steel); R(56, 24, 14, 5, col.steelD); O(70, 26, 6, col.steelD); O(70, 26, 2, col.dark); };
  I.relief = () => { P([[8, 70], [8, 30], [40, 10], [72, 30], [72, 70]], col.wood); c.strokeStyle = col.dark; c.lineWidth = 2; c.beginPath(); c.moveTo(10, 60); c.bezierCurveTo(10, 10, 70, 10, 70, 60); c.stroke(); for (let i = 0; i < 4; i++) L(18 + i * 14, 30 - (i % 2 ? 0 : 4), 24 + i * 12, 44, col.red, 2); };
  I.stock = () => { wood(8, 40, 64, 14); R(8, 60, 64, 8, "#f4ecd8"); for (let i = 0; i <= 16; i++) R(8 + i * 4, 60, 1, i % 4 ? 3 : 6, col.dark); };
  I.toolrest = () => { R(10, 44, 60, 14, col.woodD); R(10, 44, 60, 3, col.wood); R(14, 28, 52, 5, col.steelD); R(36, 30, 6, 24, col.steelD); L(60, 20, 36, 34, col.steelDD, 3); };
  I.pinch = () => { R(6, 56, 68, 8, col.steel); R(6, 30, 68, 10, col.steelD); O(20, 48, 6, col.steelDD); O(60, 48, 6, col.steelDD); R(26, 44, 28, 8, col.wood); hand(8, 24, 1); };
  I.stuck = () => { R(6, 30, 68, 30, col.blue); R(6, 44, 40, 8, col.wood); R(46, 38, 4, 20, col.red); R(28, 8, 24, 20, col.yellow); R(38, 12, 4, 10, col.dark); R(38, 24, 4, 3, col.dark); };
  I.hose = () => { R(10, 42, 40, 16, col.blue); R(50, 38, 10, 24, col.steelDD); c.strokeStyle = col.yellow; c.lineWidth = 4; c.beginPath(); c.moveTo(10, 50); c.bezierCurveTo(0, 20, 40, 14, 66, 22); c.stroke(); R(60, 14, 14, 16, col.steelD); O(67, 22, 4, col.red); };
  I.point = () => { R(14, 40, 44, 14, col.blue); R(56, 44, 8, 26, col.steelDD); P([[18, 30], [8, 40], [20, 44]], col.red); head(14, 62, 8); L(60, 70, 66, 78, col.red, 2); };
  I.sign = () => { P([[40, 8], [74, 68], [6, 68]], col.yellow); P([[40, 16], [66, 62], [14, 62]], col.dark); P([[40, 22], [60, 58], [20, 58]], col.yellow); R(38, 32, 4, 14, col.dark); R(38, 50, 4, 4, col.dark); };

  // ---------------------------------------------------------------- which topic does a question talk about?
  const TOPICS = [
    [/chuck key/i, "key", "Chuck key"],
    [/air hose|pressure|pneumatic nailer from/i, "hose", "Air hose and pressure"],
    [/point the/i, "point", "Where the nailer points"],
    [/power button|know where the power/i, "buttons", "Power and stop buttons"],
    [/push ?stick|push block/i, "pushstick", "Push stick"],
    [/kick ?back|kickback zone/i, "kickback", "Kickback"],
    [/guard/i, "guard", "Blade guard"],
    [/cross one hand|cross your arms/i, "cross", "Crossing your arms or hands"],
    [/both hands|two hands/i, "twohands", "Both hands on the tool"],
    [/one hand|with one hand|free hand/i, "onehand", "Hand position"],
    [/fingers|your hands|hand underneath|hands (?:be|in line|pass)|closer than|hand to be/i, "fingers", "Hands and fingers"],
    [/safety glasses|goggles/i, "glasses", "Safety glasses"],
    [/face shield/i, "shield", "Face shield"],
    [/hearing protection|hearing/i, "ears", "Hearing protection"],
    [/hair|hoodie|loose clothing|tied back/i, "hair", "Hair, hoodie strings and clothing"],
    [/drugs or alcohol|under the influence/i, "drugs", "Drugs, alcohol and machines"],
    [/distract/i, "distract", "Distractions"],
    [/teacher|permission/i, "teacher", "Ask your teacher"],
    [/unplug|battery|disconnect/i, "unplug", "Unplug or remove the battery"],
    [/closed.toe|shoes/i, "shoe", "Closed-toe shoes"],
    [/relief cut/i, "relief", "Relief cuts"],
    [/under the (?:wood|material)|underneath|blade path/i, "under", "Check what is underneath"],
    [/baseplate|saw base/i, "base", "Baseplate flat on the wood"],
    [/bit .*(?:tight|centered)|check the bit|centered in/i, "bit", "Bit and collet"],
    [/tool rest/i, "toolrest", "Tool rest"],
    [/rotate the workpiece|high speed|speed/i, "gauge", "Speed"],
    [/full speed|blade to come|come to a stop|stopped|stop running|still turning|still running|is still|blade has stopped/i, "spin", "Waiting for it to stop or reach speed"],
    [/force|faster than|too fast|lower the bit faster/i, "feed", "Feed rate"],
    [/cord/i, "cord", "Power cord"],
    [/stand (?:to|directly)|in line with the|stand directly/i, "stance", "Where you stand"],
    [/pinch/i, "pinch", "Pinch points"],
    [/stuck/i, "stuck", "A stuck board"],
    [/knot|staple|nail|gravel|ripped|warped|irregular/i, "defects", "Knots, nails, staples and damage"],
    [/chips|sawdust|debris|dust|spill|scrap|clean/i, "debris", "Dust, chips and spills"],
    [/clamp|vice|secure|firmly|flat|fence|rest against|loose on the bench|spinning during|support/i, "hold", "Holding the work"],
    [/shorter than|less than|short|long blade|thick|12\"|12”|\d\s?cm|\d\s?mm/i, "stock", "Size of the work"],
    [/trigger|touching the (?:wood|material)|start/i, "point", "Starting the tool"],
    [/mandatory|required|safe to use any|hand tool/i, "sign", "Shop rules"]
  ];
  const ALIAS = { key: "bit", point: "point" };

  function pick(text) {
    for (const [re, key, cap] of TOPICS) if (re.test(text)) return { key: ALIAS[key] && !I[key] ? ALIAS[key] : key, cap };
    return { key: "sign", cap: "Shop safety" };
  }
  function measure(text) {
    const m = /(\d+(?:\.\d+)?)\s?(cm|mm)(?:\s?\(([^)]+)\))?/i.exec(text);
    if (m) return m[3] ? `${m[1]} ${m[2]} (${m[3]})` : `${m[1]} ${m[2]}`;
    const n = /(\d+)\s?(?:”|")/.exec(text);
    return n ? `${n[1]} in` : "";
  }

  // ---------------------------------------------------------------- render
  function render(canvas, permitId, text) {
    canvas.width = W; canvas.height = H;
    c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    // shop backdrop
    R(0, 0, W, H, "#d9cdb4");
    for (let x = 0; x < W; x += 16) R(x, 0, 1, 112, "rgba(0,0,0,0.05)");
    R(0, 112, W, H - 112, "#8a6a48");
    for (let y = 120; y < H; y += 10) R(0, y, W, 1, "rgba(0,0,0,0.12)");
    R(0, 112, W, 3, "#5a4028");
    R(14, 128, 204, 4, col.yellow);                                                  // safety zone line
    // machine
    c.save(); c.translate(36, 10);
    R(14, 100, 130, 12, "rgba(0,0,0,0.0)");
    (M[permitId] || M.orientation)();
    R(0, 111, 160, 2, "rgba(0,0,0,0.25)");
    c.restore();
    // topic inset
    const t = pick(text);
    R(236, 8, 76, 92, "#2a1d12"); R(238, 10, 72, 88, "#f6efdc");
    c.save(); c.translate(235, 14); c.beginPath(); c.rect(0, 0, 78, 84); c.clip(); (I[t.key] || I.sign)(); c.restore();
    return { cap: t.cap, dim: measure(text) };
  }

  return { render, pick, measure, TOPICS, machines: Object.keys(M) };
})();
