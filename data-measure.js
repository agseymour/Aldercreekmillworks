window.ACM = window.ACM || {};

/**
 * Measuring & squaring easter eggs. Walk up to a bench, sign, crate or table and use your tape measure (tape)
 * or framing square (square) on it. where: "out" = outdoors (tx,ty = the prop's tile; the stand tile is found automatically)
 * or an interior id (x,y,w,h = the furniture rect, sx,sy = tile you stand on).
 * npc: the villager who notices and warms up to you.  note: a little story line shown on the first success.
 */
ACM.MEASURE = [
  { id: "o_bench1", where: "out", tx: 60, ty: 30, kind: "tape", label: "plaza bench", npc: "mateo" },
  { id: "o_bench2", where: "out", tx: 66, ty: 30, kind: "square", label: "plaza bench corner", npc: "mateo" },
  { id: "o_sign1", where: "out", tx: 17, ty: 20, kind: "tape", label: "crossroads signpost", npc: "seymour" },
  { id: "o_sign2", where: "out", tx: 47, ty: 20, kind: "square", label: "village signboard", npc: "seymour" },
  { id: "o_trail", where: "out", tx: 85, ty: 15, kind: "tape", label: "trailhead sign", npc: "macleod" },
  { id: "o_well", where: "out", tx: 67, ty: 31, kind: "tape", label: "village well rim", npc: "clara" },
  { id: "o_cart", where: "out", tx: 66, ty: 14, kind: "tape", label: "sawmill hand cart", npc: "routledge" },
  { id: "o_logs", where: "out", tx: 69, ty: 13, kind: "tape", label: "log pile stake", npc: "routledge" },
  { id: "o_crate", where: "out", tx: 50, ty: 13, kind: "square", label: "hardware crate", npc: "seymour" },
  { id: "o_cafe1", where: "out", tx: 49, ty: 31, kind: "tape", label: "café patio table", npc: "clara" },
  { id: "o_cafe2", where: "out", tx: 54, ty: 31, kind: "square", label: "café patio table", npc: "clara" },
  { id: "o_hay", where: "out", tx: 8, ty: 20, kind: "square", label: "hay-bale frame", npc: "routledge" },
  { id: "o_fence", where: "out", tx: 58, ty: 9, kind: "tape", label: "nursery fence rail", npc: "routledge" },
  { id: "o_home", where: "out", tx: 55, ty: 49, kind: "tape", label: "homestead barrel", npc: "seymour" },
  { id: "o_legacy1", where: "out", tx: 73, ty: 41, kind: "tape", label: "old well at the family house", npc: "seymour", note: "Faint pencil ticks climb the stone, each with a name and a year. Someone measured their children here. Somewhere nearby, a soft humming stops when you look up." },
  { id: "o_legacy2", where: "out", tx: 79, ty: 49, kind: "square", label: "signpost at the family gate", npc: "seymour", note: "The post is still true after the fire. Whoever set it knew their square. You think of the chimney that stood." },

  { id: "i_hw1", where: "hardware", x: 10, y: 2, w: 3, h: 1, sx: 11, sy: 3, kind: "tape", label: "tool shelf", npc: "seymour" },
  { id: "i_hw2", where: "hardware", x: 12, y: 7, w: 1, h: 1, sx: 11, sy: 7, kind: "square", label: "stock crate", npc: "seymour" },
  { id: "i_sm1", where: "sawmill", x: 1, y: 2, w: 3, h: 2, sx: 2, sy: 4, kind: "tape", label: "stacked logs", npc: "routledge" },
  { id: "i_sm2", where: "sawmill", x: 1, y: 6, w: 1, h: 1, sx: 2, sy: 6, kind: "square", label: "lumber crate", npc: "routledge" },
  { id: "i_cf1", where: "cafe", x: 9, y: 6, w: 2, h: 2, sx: 8, sy: 6, kind: "tape", label: "round table", npc: "clara" },
  { id: "i_cf2", where: "cafe", x: 12, y: 3, w: 2, h: 2, sx: 11, sy: 4, kind: "square", label: "corner table", npc: "clara" },
  { id: "i_sc1", where: "school", x: 3, y: 5, w: 2, h: 1, sx: 3, sy: 6, kind: "tape", label: "pupil desk", npc: "alverez" },
  { id: "i_sc2", where: "school", x: 12, y: 2, w: 3, h: 1, sx: 13, sy: 3, kind: "square", label: "bookcase", npc: "alverez" },
  { id: "i_ch1", where: "council", x: 6, y: 5, w: 6, h: 2, sx: 7, sy: 7, kind: "tape", label: "long council table", npc: "doucet" },
  { id: "i_ch2", where: "council", x: 12, y: 2, w: 3, h: 1, sx: 13, sy: 3, kind: "square", label: "trophy case", npc: "doucet" },
  { id: "i_rg1", where: "ranger", x: 10, y: 6, w: 1, h: 1, sx: 9, sy: 6, kind: "tape", label: "water barrel", npc: "macleod" },
  { id: "i_rg2", where: "ranger", x: 1, y: 2, w: 2, h: 2, sx: 2, sy: 4, kind: "square", label: "bunk frame", npc: "macleod" },
  { id: "i_sh1", where: "shed", x: 8, y: 2, w: 1, h: 1, sx: 7, sy: 2, kind: "tape", label: "supply crate", npc: "gable" },
  { id: "i_sh2", where: "shed", x: 7, y: 5, w: 2, h: 2, sx: 6, sy: 5, kind: "square", label: "log stack", npc: "gable" }
];
ACM.measureById = (id) => ACM.MEASURE.find((m) => m.id === id);
ACM.measurePrompt = (m) => `Equip your ${m.kind === "tape" ? "tape measure" : "framing square"} to measure the ${m.label}`;

// interior spots become ordinary stations inside their buildings
ACM.MEASURE.forEach((m) => {
  if (m.where === "out" || !ACM.INTERIORS || !ACM.INTERIORS[m.where]) return;
  ACM.INTERIORS[m.where].stations.push({ id: "measure:" + m.id, label: "Measure", prompt: ACM.measurePrompt(m), sx: m.sx, sy: m.sy, hit: { x: m.x, y: m.y, w: m.w, h: m.h }, measure: true });
});
