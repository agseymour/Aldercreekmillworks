window.ACM = window.ACM || {};

/**
 * ACM.Map — the tile map of Alder Creek (96 x 64 tiles, 32px each).
 * Pure data + collision queries. No drawing happens here.
 */
ACM.Map = (function () {
  const T = 32, W = 96, H = 64;
  const TYPE = { GRASS: 0, PATH: 1, WATER: 2, SAND: 3, BRIDGE: 4, COBBLE: 5, FLOOR: 6, SCORCH: 7 };
  const { GRASS, PATH, WATER, SAND, BRIDGE, COBBLE, FLOOR, SCORCH } = TYPE;

  const tiles = new Uint8Array(W * H);
  const blocked = new Uint8Array(W * H);   // permanent obstacles
  const noPlant = new Uint8Array(W * H);   // grass tiles where trees may NOT be planted (door fronts, yards)
  const occ = new Uint8Array(W * H);       // occupancy while scattering decoration

  const idx = (x, y) => y * W + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

  function hash(x, y, s) {
    let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967295;
  }

  const setT = (x, y, t) => { if (inb(x, y)) tiles[idx(x, y)] = t; };
  const fillT = (x0, y0, x1, y1, t, onlyIfNotWater) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!inb(x, y)) continue;
      if (onlyIfNotWater && tiles[idx(x, y)] === WATER) continue;
      tiles[idx(x, y)] = t;
    }
  };
  const rect = (arr, x0, y0, x1, y1, v = 1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) arr[idx(x, y)] = v;
  };

  // ---------------------------------------------------------------- water
  const riverCx = (y) => 40 + Math.round(2.2 * Math.sin(y / 5.2));
  for (let y = 0; y <= 52; y++) {
    const cx = riverCx(y);
    fillT(cx - 2, y, cx + 1, y, WATER);
  }
  for (let y = 48; y < H; y++) for (let x = 26; x < 56; x++) {
    const dx = (x - 40) / 8.5, dy = (y - 57) / 5.5;
    if (dx * dx + dy * dy <= 1) setT(x, y, WATER);
  }
  // sandy shores
  const shore = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (tiles[idx(x, y)] !== GRASS) continue;
    let nearWater = false;
    for (let dy = -1; dy <= 1 && !nearWater; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (inb(x + dx, y + dy) && tiles[idx(x + dx, y + dy)] === WATER) { nearWater = true; break; }
    }
    if (nearWater) shore.push([x, y]);
  }
  shore.forEach(([x, y]) => setT(x, y, SAND));

  // ---------------------------------------------------------------- roads (dirt, never over water)
  const road = (x0, y0, x1, y1) => fillT(x0, y0, x1, y1, PATH, true);
  road(15, 21, 91, 22);     // main street
  road(15, 18, 16, 20);     // workshop spur
  road(15, 23, 16, 39);     // meadow road south
  road(15, 38, 46, 39);     // south road to the second bridge
  road(45, 22, 46, 39);     // east-bank road
  road(45, 33, 91, 34);     // south street
  road(51, 13, 52, 20);     // hardware spur
  road(73, 13, 74, 20);     // sawmill spur
  road(62, 13, 63, 20);     // nursery gate spur
  road(88, 14, 89, 20);     // ranger spur
  road(62, 23, 63, 23);     // plaza connector
  road(51, 31, 52, 32);     // cafe spur
  road(75, 31, 76, 32);     // school spur
  road(87, 31, 88, 32);     // town hall spur
  road(66, 35, 67, 50);     // homestead road
  road(58, 49, 67, 50);
  road(58, 48, 59, 48);     // homestead door path
  road(66, 51, 81, 52);     // legacy-house road
  road(80, 50, 81, 51);     // legacy gate path
  road(8, 28, 15, 28);      // shed path
  // bridges
  [[21, 22], [38, 39]].forEach(([y0, y1]) => {
    const cx = riverCx(y0);
    fillT(cx - 3, y0, cx + 2, y1, BRIDGE);
  });
  // plaza + legacy yard + workshop floor
  fillT(58, 24, 68, 32, COBBLE);
  fillT(74, 37, 88, 49, SCORCH);
  fillT(5, 6, 26, 16, FLOOR);
  fillT(15, 17, 16, 17, PATH);

  // ---------------------------------------------------------------- buildings
  const buildings = [];
  function addBuilding(b) {
    b.id = b.id || b.kind;
    buildings.push(b);
    rect(blocked, b.x, b.y, b.x + b.w - 1, b.y + b.h - 1);
    rect(occ, b.x - 1, b.y - 1, b.x + b.w, b.y + b.h + 1);
    rect(noPlant, b.x - 1, b.y - 1, b.x + b.w, b.y + b.h + 2);
    return b;
  }
  addBuilding({ kind: 'hardware', x: 47, y: 6, w: 10, h: 7, doorX: 51, style: 'clapboard', wall: '#8f3b2e', roof: '#3b4a5f', trim: '#e2b04a', windows: 4, awning: ['#c0392b', '#f5e6c8'], chimney: true, sign: "SEYMOUR'S HARDWARE" });
  addBuilding({ kind: 'sawmill', x: 68, y: 5, w: 13, h: 8, doorX: 73, style: 'plank', wall: '#7a5230', roof: '#2d4a3b', trim: '#d9892b', windows: 4, chimney: true, sawblade: true, sign: "ROUTLEDGE'S SAWMILL" });
  addBuilding({ kind: 'cafe', x: 47, y: 25, w: 9, h: 6, doorX: 51, style: 'clapboard', wall: '#e6d3b0', roof: '#9b3d3d', trim: '#fff4dc', windows: 3, awning: ['#2f7d6d', '#f5f1e4'], sign: 'HARBOR CAFE' });
  addBuilding({ kind: 'school', x: 72, y: 25, w: 9, h: 6, doorX: 75, style: 'clapboard', wall: '#b04a3a', roof: '#3a3a4d', trim: '#f2ead3', windows: 4, tower: true, sign: 'SCHOOLHOUSE' });
  addBuilding({ kind: 'council', x: 83, y: 24, w: 9, h: 7, doorX: 87, style: 'stone', wall: '#c8c1ae', roof: '#4a5568', trim: '#f4efe0', windows: 4, columns: true, flag: true, sign: 'TOWN HALL' });
  addBuilding({ kind: 'ranger', x: 86, y: 8, w: 6, h: 6, doorX: 88, style: 'log', wall: '#7b5431', roof: '#3d5a40', trim: '#d9b36a', windows: 2, chimney: true, sign: 'PARKS' });
  addBuilding({ kind: 'shed', x: 6, y: 24, w: 5, h: 4, doorX: 8, style: 'plank', wall: '#8a6a45', roof: '#5a3a22', trim: '#d9b36a', windows: 1, sign: 'WOODLOT' });
  const legacy = addBuilding({ id: 'legacy', kind: 'legacy', x: 76, y: 39, w: 11, h: 9, doorX: 80 });
  // the player's own homestead is blocked dynamically (only once construction starts)
  const home = { id: 'home', kind: 'home', x: 54, y: 40, w: 10, h: 8, doorX: 58 };
  rect(occ, home.x - 1, home.y - 1, home.x + home.w, home.y + home.h + 2);
  rect(noPlant, home.x - 1, home.y - 1, home.x + home.w, home.y + home.h + 3);

  // ---------------------------------------------------------------- workshop compound
  const workshop = { x: 4, y: 4, w: 24, h: 14, doorX: 15 };
  const walls = [];
  for (let x = 4; x <= 27; x++) {
    walls.push({ tx: x, ty: 4, kind: 'north' }, { tx: x, ty: 5, kind: 'north2' });
    if (x !== 15 && x !== 16) walls.push({ tx: x, ty: 17, kind: 'south', post: x === 14 || x === 17 });
  }
  for (let y = 6; y <= 16; y++) walls.push({ tx: 4, ty: y, kind: 'west' }, { tx: 27, ty: y, kind: 'east' });
  // walls and the un-built lots are blocked dynamically (see wallsFor / lotBlocked), because the shop grows with additions
  const wsBounds = (z) => ({ minX: z && z.west ? 4 : 10, maxX: z && z.east ? 27 : 21 });
  function wallsFor(z) {
    const b = wsBounds(z), out = [];
    for (let x = b.minX; x <= b.maxX; x++) {
      out.push({ tx: x, ty: 4, kind: 'north' }, { tx: x, ty: 5, kind: 'north2' });
      if (x !== 15 && x !== 16) out.push({ tx: x, ty: 17, kind: 'south', post: x === 14 || x === 17 });
    }
    for (let y = 6; y <= 16; y++) out.push({ tx: b.minX, ty: y, kind: 'west' }, { tx: b.maxX, ty: y, kind: 'east' });
    return out;
  }
  // tiles of the compound that are NOT walkable for a given footprint: walls and the empty lots
  function lotTiles(z) {
    const b = wsBounds(z), out = [];
    for (let y = 4; y <= 17; y++) for (let x = 4; x <= 27; x++) {
      const inside = x > b.minX && x < b.maxX && y >= 6 && y <= 16;
      const door = y === 17 && (x === 15 || x === 16);
      if (!inside && !door) out.push(y * W + x);
    }
    return out;
  }
  rect(noPlant, 3, 3, 28, 19);
  rect(occ, 3, 3, 28, 19);

  const furniture = [
    { id: 'blueprint_desk', kind: 'desk', x: 11, y: 6, w: 3, h: 2 },
    { id: 'layout_bench', kind: 'bench', x: 11, y: 10, w: 4, h: 2 },
    { id: 'assembly_table', kind: 'assembly', x: 16, y: 10, w: 4, h: 2 },
    { id: 'lumber_rack', kind: 'rack', x: 18, y: 6, w: 3, h: 2 },
    { id: 'sawhorses', kind: 'sawhorses', x: 11, y: 13, w: 2, h: 1 },
    { id: 'drafting_table', kind: 'drafting', x: 15, y: 6, w: 2, h: 2 }
  ];
  furniture.forEach((f) => rect(blocked, f.x, f.y, f.x + f.w - 1, f.y + f.h - 1));
  // power tools appear (and become solid) once the student owns them
  const machines = [
    { tool: 'mitre_saw', x: 19, y: 14, w: 2, h: 2, zone: 'core' },
    { tool: 'dust_collector', x: 11, y: 15, w: 2, h: 2, zone: 'core' },
    { tool: 'table_saw', x: 6, y: 10, w: 3, h: 2, zone: 'west' },
    { tool: 'jointer', x: 6, y: 14, w: 2, h: 2, zone: 'west' },
    { tool: 'planer', x: 23, y: 10, w: 2, h: 2, zone: 'east' },
    { tool: 'band_saw', x: 23, y: 14, w: 2, h: 2, zone: 'east' }
  ];

  // ---------------------------------------------------------------- stations (where the player interacts)
  const bld = (id) => buildings.find((b) => b.id === id);
  const stationDefs = [
    { id: 'blueprint_desk', shortLabel: 'Blueprint Desk', prompt: 'Blueprint & Certification Desk — Study NS Prod Tech questions, visual IDs & Tier Exams', ix: 12.5, iy: 8.5, hit: furniture[0] },
    { id: 'drafting_table', shortLabel: 'Drafting Table', prompt: 'Drafting Table — learn to draw plans to scale, then design your own piece to build', ix: 16, iy: 8.5, hit: furniture[5] },
    { id: 'layout_bench', shortLabel: 'Layout & Milling', prompt: 'Layout & Milling Bench — Fractional tape measure, Jointer, Planer, Table & Band Saws', ix: 13, iy: 12.5, hit: furniture[1] },
    { id: 'assembly_table', shortLabel: 'Assembly & Finish', prompt: 'Assembly & Finishing Table — Framing square check, pilot holes, fastening & delivery', ix: 18, iy: 12.5, hit: furniture[2] },
    { id: 'lumber_rack', shortLabel: 'Lumber Rack & Milling', prompt: 'Lumber Rack — check your boards and logs, and mill logs into lumber if you own the right machines', ix: 19.5, iy: 8.5, hit: furniture[3] },
    { id: 'tool_shop', shortLabel: "Seymour's Hardware", prompt: "Seymour's Hardware & Tools — Chat with Seymour, buy tools, PPE & sharpen blades", ix: 52, iy: 13.5, hit: bld('hardware') },
    { id: 'lumber_mill', shortLabel: "Routledge's Sawmill", prompt: "Routledge's Sawmill & Nursery — Buy S4S/Rough lumber & tree saplings from Routledge", ix: 74, iy: 13.5, hit: bld('sawmill') },
    { id: 'town_board', shortLabel: 'Town Commissions', prompt: 'Village Commission Board — Browse customer jobs, advance day & view Class Leaderboard', ix: 63.5, iy: 27.5, hit: { x: 62, y: 25, w: 3, h: 2 } },
    { id: 'woodlot', shortLabel: 'Forestry Shed', prompt: 'Forestry Shed — Review your woodlot, learn to plant & fell timber, or rest until morning', ix: 9, iy: 28.5, hit: bld('shed') },
    { id: 'homestead', shortLabel: 'Your Homestead', prompt: 'Your Homestead Plot — Build & upgrade your own home or rest until morning', ix: 59, iy: 48.5, hit: home },
    { id: 'cafe', shortLabel: 'Harbor Café', prompt: 'Harbor Café: step inside for hot meals and food that keeps', ix: 52, iy: 31.5, hit: bld('cafe') },
    { id: 'school', shortLabel: 'Schoolhouse', prompt: 'Alder Creek Schoolhouse: step inside', ix: 76, iy: 31.5, hit: bld('school') },
    { id: 'council', shortLabel: 'Town Hall', prompt: 'Alder Creek Town Hall: step inside', ix: 88, iy: 31.5, hit: bld('council') },
    { id: 'ranger', shortLabel: 'Parks Office', prompt: 'Parks & Trails Office: step inside', ix: 89, iy: 14.5, hit: bld('ranger') },
    { id: 'legacy_house', shortLabel: "Grandparents' House", prompt: "The old family house on the hill — burned long ago. Walk up to the gate and take a look.", ix: 81, iy: 51.5, hit: legacy }
  ];
  const stations = stationDefs.map((s) => ({ ...s, sx: s.ix * T, sy: s.iy * T }));
  // keep interaction spots clear of planted trees
  stations.forEach((s) => rect(noPlant, Math.floor(s.ix) - 2, Math.floor(s.iy) - 1, Math.floor(s.ix) + 2, Math.floor(s.iy) + 1));

  // ---------------------------------------------------------------- props
  const props = [];
  const fenceKeys = new Set();
  function addProp(kind, tx, ty, block = true, extra) {
    if (!inb(tx, ty)) return null;
    const p = Object.assign({ kind, tx, ty, block }, extra || {});
    props.push(p);
    if (block) blocked[idx(tx, ty)] = 1;
    occ[idx(tx, ty)] = 1;
    return p;
  }
  function fenceRect(x0, y0, x1, y1, gaps) {
    const isGap = (x, y) => (gaps || []).some(([gx0, gy0, gx1, gy1]) => x >= gx0 && x <= gx1 && y >= gy0 && y <= gy1);
    for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) if (!isGap(x, y)) { addProp('fence', x, y); fenceKeys.add(x + ',' + y); }
    for (let y = y0 + 1; y < y1; y++) for (const x of [x0, x1]) if (!isGap(x, y)) { addProp('fence', x, y); fenceKeys.add(x + ',' + y); }
  }
  fenceRect(58, 7, 66, 12, [[62, 12, 63, 12]]);                 // nursery yard
  fenceRect(72, 36, 90, 50, [[80, 50, 81, 50]]);                // legacy yard
  fenceRect(52, 38, 65, 52, [[58, 52, 59, 52], [58, 38, 59, 38], [65, 49, 65, 50]]); // homestead plot
  for (let x = 59; x <= 65; x += 2) { addProp('pots', x, 9, false); addProp('pots', x, 11, false); }
  [20, 28, 34, 48, 54, 60, 66, 70, 78, 84].forEach((x) => addProp('lamp', x, 20));
  [[56, 23], [70, 23], [60, 33], [66, 33]].forEach(([x, y]) => addProp('lamp', x, y));
  [[60, 30], [66, 30]].forEach(([x, y]) => addProp('bench', x, y, true, { fix: 'anchor_3_square' }));
  addProp('planter', 56, 31, true, { fix: 'side_1_planter' });
  addProp('kiosk', 83, 15, true, { fix: 'anchor_1_kiosk' });
  addProp('birdhouse', 66, 36, true, { fix: 'side_1_birdhouse' });
  addProp('rocker', 35, 26, true, { fix: 'side_4_rocker' });
  addProp('totes', 58, 28, true, { fix: 'side_1_tote' });
  [[49, 13], [50, 13], [55, 13], [54, 12]].forEach(([x, y], i) => addProp(i % 2 ? 'crate' : 'barrel', x, y));
  [[69, 13], [70, 13], [78, 13], [79, 13]].forEach(([x, y], i) => addProp('logpile', x, y, true, { v: i }));
  addProp('cart', 66, 14);
  [[49, 31], [54, 31]].forEach(([x, y]) => addProp('cafetable', x, y));
  [[17, 20, 'W: Workshop  E: Village  S: Woodlot'], [47, 20, 'N: Hardware & Sawmill  S: Plaza']].forEach(([x, y, t]) => addProp('sign', x, y, true, { text: t }));
  addProp('sign', 85, 15, true, { text: 'Trailhead' });
  addProp('well', 67, 31);
  addProp('board', 62, 25, false);
  rect(blocked, 62, 25, 64, 26);
  addProp('flowerbed', 57, 25, false); addProp('flowerbed', 57, 27, false); addProp('flowerbed', 69, 25, false); addProp('flowerbed', 69, 27, false);
  addProp('haybale', 8, 20); addProp('haybale', 9, 20);
  // homestead yard dressing
  addProp('barrel', 55, 49); addProp('crate', 62, 49);
  // legacy yard: charred remains
  [[77, 49, 0], [84, 49, 1], [74, 43, 2], [88, 45, 0], [75, 47, 1], [87, 38, 2]].forEach(([x, y, v]) => addProp('charlog', x, y, true, { v }));
  addProp('sign', 79, 49, true, { text: 'UNSAFE — Keep Out' });
  addProp('well', 73, 41);

  // measuring easter eggs on outdoor props: pick a free neighbouring tile to stand on
  (ACM.MEASURE || []).filter((m) => m.where === 'out').forEach((m) => {
    const spot = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([dx, dy]) => [m.tx + dx, m.ty + dy]).find(([x, y]) => inb(x, y) && !blocked[idx(x, y)] && tiles[idx(x, y)] !== WATER);
    if (!spot) return;
    occ[idx(spot[0], spot[1])] = 1;
    stations.push({ id: 'measure:' + m.id, shortLabel: 'Measure', prompt: ACM.measurePrompt(m), ix: spot[0] + 0.5, iy: spot[1] + 0.5, sx: (spot[0] + 0.5) * T, sy: (spot[1] + 0.5) * T, hit: { x: m.tx, y: m.ty, w: 1, h: 1 }, measure: true });
  });

  // keep-clear around roads / plaza / water so scenery doesn't sit on them
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = tiles[idx(x, y)];
    if (t === GRASS) continue;
    const pad = t === COBBLE ? 1 : t === PATH || t === BRIDGE ? 1 : 0;
    if (t === WATER || t === SAND || t === FLOOR || t === SCORCH) { occ[idx(x, y)] = 1; continue; }
    for (let dy = -pad; dy <= pad; dy++) for (let dx = -pad; dx <= pad; dx++) if (inb(x + dx, y + dy)) occ[idx(x + dx, y + dy)] = 1;
  }

  // ---------------------------------------------------------------- natural trees + small scenery
  const natureTrees = [];
  const natureIndex = new Map();   // "idx" -> tree, so any wild tree can be found / felled
  const scenery = [];
  const treeTypes = ['pine', 'pine', 'pine', 'cedar', 'cedar', 'maple', 'maple', 'oak', 'birch'];
  function forestDensity(x, y) {
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    let d = 0.014;
    if (edge < 2) d = 0.97; else if (edge < 4) d = 0.72; else if (edge < 7) d = 0.3;
    if (x >= 84 && y <= 20 && y >= 15) d = Math.max(d, 0.35);
    if (y >= 53 && x >= 56) d = Math.max(d, 0.34);
    if (x >= 90) d = Math.max(d, 0.6);
    if (x >= 3 && x <= 34 && y >= 22 && y <= 50 && edge >= 4) d = Math.min(d, 0.012); // the woodlot meadow stays open
    return d;
  }
  // Tiles where forest is allowed to regrow. A fixed, limited set: this is the cap that stops overcrowding.
  const regrowCandidates = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    if (tiles[i] !== GRASS || blocked[i] || occ[i]) continue;
    const d = forestDensity(x, y);
    if (d >= 0.25 && hash(x, y, 300) < Math.min(0.9, d + 0.1)) regrowCandidates.push(i);
    if (hash(x, y, 1) < d) {
      const tp = treeTypes[Math.floor(hash(x, y, 2) * treeTypes.length)];
      const tr = { tx: x, ty: y, type: tp, variant: Math.floor(hash(x, y, 4) * 3) };
      natureTrees.push(tr);
      natureIndex.set(i, tr);
      blocked[i] = 1; occ[i] = 1;
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    if (tiles[i] !== GRASS || blocked[i] || occ[i]) continue;
    const r = hash(x, y, 3);
    if (r < 0.012) { scenery.push({ kind: 'bush', tx: x, ty: y, v: Math.floor(hash(x, y, 7) * 3) }); blocked[i] = 1; occ[i] = 1; }
    else if (r < 0.021) { scenery.push({ kind: 'rock', tx: x, ty: y, v: Math.floor(hash(x, y, 8) * 3) }); blocked[i] = 1; occ[i] = 1; }
    else if (r < 0.025) { scenery.push({ kind: 'stump', tx: x, ty: y, v: 0 }); blocked[i] = 1; occ[i] = 1; }
    else if (r < 0.033) { scenery.push({ kind: 'mushroom', tx: x, ty: y, v: Math.floor(hash(x, y, 9) * 2) }); }
  }
  // regrow tiles = candidates that are still either a natural tree or completely free (no bush / rock)
  const regrowTiles = regrowCandidates.filter((i) => natureIndex.has(i) || !blocked[i]);

  // wild forage: berry bushes along the forest edge, mushrooms in the shade. Walk-through, harvested by clicking.
  const forage = [];
  const forageIndex = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y);
    if (tiles[i] !== GRASS || blocked[i] || occ[i] || noPlant[i]) continue;
    const d = forestDensity(x, y);
    let kind = null;
    if (d > 0.0 && d < 0.7 && hash(x, y, 600) < 0.045) kind = 'bush';
    else if (d > 0.08 && hash(x, y, 601) < 0.1) kind = 'mushroom';
    if (kind) { const f = { i, tx: x, ty: y, kind, v: Math.floor(hash(x, y, 602) * 3) }; forage.push(f); forageIndex.set(i, f); }
  }

  // ---------------------------------------------------------------- queries
  const spawn = { x: 16 * T, y: 15 * T + 16 };
  const isStaticBlocked = (tx, ty) => !inb(tx, ty) || blocked[idx(tx, ty)] === 1 || tiles[idx(tx, ty)] === WATER;
  const tileAt = (tx, ty) => (inb(tx, ty) ? tiles[idx(tx, ty)] : WATER);
  const isPlantable = (tx, ty) => inb(tx, ty) && tiles[idx(tx, ty)] === GRASS && !blocked[idx(tx, ty)] && !noPlant[idx(tx, ty)];

  return {
    T, W, H, TYPE, tiles, blocked, noPlant, buildings, legacy, home, workshop, walls, wallsFor, lotTiles, furniture, machines,
    stations, props, fenceKeys, natureTrees, natureIndex, regrowTiles, forage, forageIndex, scenery, spawn, riverCx,
    hash, inb, idx, isStaticBlocked, tileAt, isPlantable
  };
})();
