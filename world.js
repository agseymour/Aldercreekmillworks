window.ACM = window.ACM || {};

/**
 * ACM.World — the playable engine: tile collision, click-to-walk pathfinding (A*),
 * plant-anywhere trees, y-sorted rendering and ambient life.
 */
ACM.World = (function () {
  const M = ACM.Map;
  const AW = ACM.ArtWorld;
  const AB = ACM.ArtBuildings;
  const T = M.T, W = M.W, H = M.H;
  const WORLD_W = W * T, WORLD_H = H * T;
  const VIEW_W = 840, VIEW_H = 500;
  const WZ = 1.5;                         // outdoor zoom: tighter on the player
  const VW = VIEW_W / WZ, VH = VIEW_H / WZ;
  const HALF_W = 8, BOX_UP = 4, BOX_DOWN = 3;
  const REACH = 76;       // how far (px) the player can plant / chop
  const STATION_RANGE = 58;

  const MACHINE_TOOLS = M.machines.map((m) => m.tool);
  const NPC_DEFS = ACM.NPCS || [];
  const NPC_RANGE = 46;
  const TIME_PER_TICK = 1 / 45;          // one in-game minute every 0.75 real seconds (a day is ~13 real minutes)
  const LAMPS = M.props.filter((p) => p.kind === "lamp");

  const player = {
    x: M.spawn.x,
    y: M.spawn.y,
    speed: 3.2,
    facing: "down",
    frame: 0,
    stepTimer: 0,
    path: [],
    dest: null,
    pendingStationId: null,
    pendingTile: null,
    stuck: 0
  };

  const camera = { x: 0, y: 0 };
  const keys = {};
  const dpad = { up: false, down: false, left: false, right: false };
  const hover = { tx: -1, ty: -1, active: false };
  let handlers = {};
  let activeStation = null;     // nearest thing you can interact with (station or villager)
  let midnightFired = false;
  let waterDist = 99;
  let lastWaterScan = -999;
  let tick = 0;
  let scene = null;             // set while the player is inside a building
  let fade = 0;
  let curState = { season: "Spring", trees: [], ownedTools: [], homeStage: 0 };

  /* ----------------------------------------------------------- dynamic blockers */
  const treeAt = new Map();      // planted + wild-grown trees, by tile index
  const dyn = new Uint8Array(W * H);
  let dynKey = "";
  let felled = {};               // natural trees that have been cut: { tileIndex: dayFelled }

  function refreshDynamic(state) {
    treeAt.clear();
    felled = state.felled || {};
    (state.trees || []).forEach((t) => {
      if (t && typeof t.tx === "number") treeAt.set(t.ty * W + t.tx, t);
    });
    (state.wild || []).forEach((t) => {
      if (t && typeof t.tx === "number") treeAt.set(t.ty * W + t.tx, t);
    });
    const wz = ACM.Workshop ? ACM.Workshop.zones(state) : { west: true, east: true };
    const key = (state.ownedTools || []).filter((t) => MACHINE_TOOLS.includes(t)).join(",") + "|" + (state.homeStage || 0) + "|" + wz.west + wz.east;
    if (key === dynKey) return;
    dynKey = key;
    dyn.fill(0);
    M.lotTiles(wz).forEach((i) => { dyn[i] = 1; });          // walls and the empty lots of the workshop
    M.machines.forEach((m) => {
      if (!(state.ownedTools || []).includes(m.tool)) return;
      for (let y = m.y; y < m.y + m.h; y++) for (let x = m.x; x < m.x + m.w; x++) dyn[y * W + x] = 1;
    });
    if ((state.homeStage || 0) >= 1) {
      const h = M.home;
      for (let y = h.y; y < h.y + h.h; y++) for (let x = h.x; x < h.x + h.w; x++) dyn[y * W + x] = 1;
    }
  }

  function sceneBlocked(tx, ty) {
    const d = scene.def;
    if (tx < 0 || ty < 0 || tx >= d.w || ty >= d.h) return true;
    if (ty < 2 || tx === 0 || tx === d.w - 1) return true;
    if (ty === d.h - 1) return tx !== d.exit;
    return scene.grid[ty * d.w + tx] === 1;
  }

  function shopOpen(def, min) {
    if (!def.open) return true;
    if (def.needsStage != null && (curState.homeStage || 0) < def.needsStage) return false;
    return min >= def.open[0] && min < def.open[1];
  }

  function enterBuilding(id) {
    const def = ACM.INTERIORS && ACM.INTERIORS[id];
    if (!def) return false;
    const grid = new Uint8Array(def.w * def.h);
    def.objs.forEach((o) => { if (o.solid) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) grid[y * def.w + x] = 1; });
    let npc = null;
    if (def.npc) {
      grid[def.npc.y * def.w + def.npc.x] = 1;
      npc = { def: NPC_DEFS.find((n) => n.id === def.npc.id), id: def.npc.id, tx: def.npc.x, ty: def.npc.y, px: def.npc.x * T + 16, py: def.npc.y * T + 24, face: "down", walking: false, hidden: false };
      if (!npc.def) npc = null;
    }
    const stations = def.stations.map((s) => ({ id: s.id, shortLabel: s.label, prompt: s.prompt, ix: s.sx, iy: s.sy, sx: s.sx * T + 16, sy: s.sy * T + 16, hit: s.hit }));
    stations.push({ id: "exit", shortLabel: "Leave", prompt: "Leave " + def.name, ix: def.exit, iy: def.h - 1, sx: def.exit * T + 16, sy: (def.h - 1) * T + 16, hit: { x: def.exit, y: def.h - 1, w: 1, h: 1 } });
    scene = { id, def, grid, npc, stations, ret: { x: player.x, y: player.y }, ticks: 0 };
    cancelWalk();
    player.x = def.exit * T + 16;
    player.y = (def.h - 2) * T + 16;
    player.facing = "up";
    fade = 1;
    if (ACM.Audio) ACM.Audio.sfx("door");
    return true;
  }

  function exitBuilding() {
    if (!scene) return;
    player.x = scene.ret.x; player.y = scene.ret.y; player.facing = "down";
    scene = null;
    cancelWalk();
    fade = 1;
    if (ACM.Audio) ACM.Audio.sfx("door");
  }

  let hypoBlock = -1;            // a tile pretended to be blocked while we test whether planting there would trap someone
  function blockedTile(tx, ty) {
    if (scene) return sceneBlocked(tx, ty);
    if (!M.inb(tx, ty)) return true;
    const k = ty * W + tx;
    if (k === hypoBlock) return true;
    if (M.tiles[k] === M.TYPE.WATER) return true;
    if (M.blocked[k] === 1 && !(felled[k] != null && M.natureIndex.has(k))) return true;
    return dyn[k] === 1 || treeAt.has(k);
  }

  // what kind of tree (if any) stands on this tile?
  function treeInfoAt(tx, ty) {
    if (scene || !M.inb(tx, ty)) return null;
    const k = ty * W + tx;
    const t = treeAt.get(k);
    if (t) return { kind: t.wild ? "wild" : "planted", obj: t, type: t.wild ? t.type : (ACM.ArtWorld.SPECIES[t.saplingId] || "pine"), stage: t.stage == null ? 2 : t.stage };
    const n = M.natureIndex.get(k);
    if (n && felled[k] == null) return { kind: "natural", obj: n, type: n.type, stage: 2 };
    return null;
  }

  function canStand(x, y) {
    const x0 = Math.floor((x - HALF_W) / T), x1 = Math.floor((x + HALF_W) / T);
    const y0 = Math.floor((y - BOX_UP) / T), y1 = Math.floor((y + BOX_DOWN) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (blockedTile(tx, ty)) return false;
    if (scene) return true;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      if (!n.hidden && Math.hypot(x - n.px, (y - n.py) * 1.4) < 15) return false;
    }
    return true;
  }

  function tryMove(dx, dy) {
    let moved = false;
    if (dx && canStand(player.x + dx, player.y)) { player.x += dx; moved = true; }
    if (dy && canStand(player.x, player.y + dy)) { player.y += dy; moved = true; }
    return moved;
  }

  function nearestWalkable(tx, ty, maxR) {
    if (!blockedTile(tx, ty) && M.inb(tx, ty)) return { tx, ty };
    for (let r = 1; r <= maxR; r++) {
      let best = null, bd = 1e9;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = tx + dx, y = ty + dy;
        if (!M.inb(x, y) || blockedTile(x, y)) continue;
        const d = Math.hypot(x * T + 16 - player.x, y * T + 16 - player.y) * 0.01 + Math.hypot(dx, dy);
        if (d < bd) { bd = d; best = { tx: x, ty: y }; }
      }
      if (best) return best;
    }
    return null;
  }

  function unstickIfNeeded() {
    if (canStand(player.x, player.y)) return;
    const ptx = Math.floor(player.x / T), pty = Math.floor(player.y / T);
    for (let r = 1; r < 14; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = (ptx + dx) * T + 16, ny = (pty + dy) * T + 16;
        if (canStand(nx, ny)) {
          player.x = nx;
          player.y = ny;
          player.path = [];
          return;
        }
      }
    }
  }

  /* ----------------------------------------------------------- trap check */
  // How much ground can the player walk to from where they stand (tile centres they can really stand on)?
  function reachable(limit) {
    const seen = new Set(), q = [];
    const sx = Math.floor(player.x / T), sy = Math.floor(player.y / T);
    q.push([sx, sy]); seen.add(sy * W + sx);
    while (q.length && seen.size < limit) {
      const [x, y] = q.pop();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy, k = ny * W + nx;
        if (!M.inb(nx, ny) || seen.has(k)) return;
        if (!canStand(nx * T + 16, ny * T + 16)) return;
        seen.add(k); q.push([nx, ny]);
      });
    }
    return seen;
  }
  /** Would blocking this tile leave the player walled into a small pocket, or cut off from the workshop? */
  function wouldTrap(tx, ty) {
    if (scene) return false;
    const spawnK = Math.floor(M.spawn.y / T) * W + Math.floor(M.spawn.x / T), LIM = 3000;
    const before = reachable(LIM);
    hypoBlock = ty * W + tx;
    let after;
    try { after = reachable(LIM); } finally { hypoBlock = -1; }
    if (after.size >= LIM) return false;                    // still plenty of room
    if (before.has(spawnK) && !after.has(spawnK)) return true;
    return before.size >= 150 && after.size < 150;          // squeezed into a small pocket
  }
  /** emergency exit: put the player back at the workshop */
  function rescue() {
    if (scene) exitBuilding();
    player.x = M.spawn.x; player.y = M.spawn.y; player.path = []; cancelWalk();
    unstickIfNeeded();
  }

  /* ----------------------------------------------------------- A* */
  function findPath(sx, sy, gx, gy) {
    if (!M.inb(gx, gy) || blockedTile(gx, gy)) return null;
    if (sx === gx && sy === gy) return [];
    const N = W * H;
    const g = new Float32Array(N).fill(1e9);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const heap = [];
    const push = (f, i) => {
      heap.push([f, i]);
      let c = heap.length - 1;
      while (c > 0) {
        const p = (c - 1) >> 1;
        if (heap[p][0] <= heap[c][0]) break;
        [heap[p], heap[c]] = [heap[c], heap[p]];
        c = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let c = 0;
        for (;;) {
          const l = c * 2 + 1, r = l + 1;
          let m = c;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === c) break;
          [heap[m], heap[c]] = [heap[c], heap[m]];
          c = m;
        }
      }
      return top;
    };
    const h = (x, y) => {
      const dx = Math.abs(x - gx), dy = Math.abs(y - gy);
      return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
    };
    const s = sy * W + sx;
    g[s] = 0;
    push(h(sx, sy), s);
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    while (heap.length) {
      const [, cur] = pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % W, cy = (cur / W) | 0;
      if (cx === gx && cy === gy) {
        const out = [];
        let i = cur;
        while (i !== s) { out.push({ tx: i % W, ty: (i / W) | 0 }); i = came[i]; }
        return out.reverse();
      }
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (!M.inb(nx, ny) || blockedTile(nx, ny)) continue;
        if (dx && dy && (blockedTile(cx + dx, cy) || blockedTile(cx, cy + dy))) continue;
        const ni = ny * W + nx;
        if (closed[ni]) continue;
        const ng = g[cur] + (dx && dy ? Math.SQRT2 : 1);
        if (ng < g[ni]) {
          g[ni] = ng;
          came[ni] = cur;
          push(ng + h(nx, ny), ni);
        }
      }
    }
    return null;
  }

  function playerTile() {
    return { tx: Math.floor(player.x / T), ty: Math.floor(player.y / T) };
  }

  function walkTo(tx, ty, opts) {
    opts = opts || {};
    const goal = nearestWalkable(tx, ty, 6);
    if (!goal) return false;
    const pt = playerTile();
    const path = findPath(pt.tx, pt.ty, goal.tx, goal.ty);
    if (!path) return false;
    player.path = path;
    player.dest = { x: goal.tx * T + 16, y: goal.ty * T + 16 };
    player.pendingStationId = opts.stationId || null;
    player.pendingTile = opts.tile || null;
    player.stuck = 0;
    if (!path.length) arrive();
    return true;
  }

  function cancelWalk() {
    player.path = [];
    player.dest = null;
    player.pendingStationId = null;
    player.pendingTile = null;
  }

  function tileDistPx(tx, ty) {
    return Math.hypot(tx * T + 16 - player.x, ty * T + 16 - (player.y - 8));
  }

  function faceTile(tx, ty) {
    const dx = tx * T + 16 - player.x, dy = ty * T + 16 - (player.y - 8);
    if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? "right" : "left";
    else player.facing = dy > 0 ? "down" : "up";
  }

  function doTileAction(tx, ty) {
    if (!handlers.onTileAction) return;
    faceTile(tx, ty);
    handlers.onTileAction(tx, ty);
  }

  // If the walk is blocked (an NPC is in the way) but we're close enough to talk, talk instead of giving up.
  function cancelOrArrive() {
    const sid = player.pendingStationId;
    if (sid && sid.indexOf("npc:") === 0) {
      const n = npcs.find((x) => "npc:" + x.id === sid);
      if (n && !n.hidden && Math.hypot(player.x - n.px, player.y - n.py) < NPC_RANGE + 14) { arrive(); return; }
    }
    cancelWalk();
  }

  function arrive() {
    const sid = player.pendingStationId, tile = player.pendingTile;
    player.pendingStationId = null;
    player.pendingTile = null;
    player.dest = null;
    if (sid && handlers.onInteract) {
      clearKeys();
      handlers.onInteract(sid);
    } else if (tile) {
      if (tileDistPx(tile.tx, tile.ty) <= REACH) doTileAction(tile.tx, tile.ty);
    }
  }

  /* ----------------------------------------------------------- villagers */
  const npcs = NPC_DEFS.map((def) => ({ def, id: def.id, tx: 0, ty: 0, px: 0, py: 0, path: [], phase: null, hidden: true, posts: {}, walking: false, face: "down" }));
  let npcsReady = false;

  function setupNpcs() {
    npcs.forEach((n) => {
      ["day", "evening"].forEach((ph) => {
        const p = n.def.posts[ph];
        n.posts[ph] = nearestWalkable(p[0], p[1], 5) || { tx: p[0], ty: p[1] };
      });
    });
    npcsReady = true;
  }

  function placeNpc(n, p) {
    n.tx = p.tx; n.ty = p.ty; n.px = p.tx * T + 16; n.py = p.ty * T + 24; n.path = []; n.hidden = false;
  }

  function updateNpcs(state) {
    if (!npcsReady) setupNpcs();
    const phase = ACM.NPC_HELPERS.phaseAt(state.timeMin == null ? 480 : state.timeMin);
    npcs.forEach((n) => {
      if (n.phase === null) {
        n.phase = phase;
        if (phase === "night") n.hidden = true; else placeNpc(n, n.posts[phase]);
        return;
      }
      if (phase !== n.phase) {
        n.phase = phase;
        n.mode = "idle"; n.legs = []; n.inside = false; n.timer = 120 + Math.floor(Math.random() * 200);
        if (phase === "night") { n.hidden = true; n.path = []; }
        else if (n.hidden) placeNpc(n, n.posts[phase]);
        else {
          const p = n.posts[phase];
          const path = findPath(n.tx, n.ty, p.tx, p.ty);
          if (path) n.path = path; else placeNpc(n, p);
        }
      }
      n.walking = false;
      if (phase === "night") { n.mode = "idle"; n.inside = false; return; }
      const wi = ACM.INTERIORS ? Object.values(ACM.INTERIORS).find((d) => d.owner === n.id) : null;
      const open = !!(wi && shopOpen(wi, state.timeMin));
      const base = n.posts[phase] || n.posts.day;
      if (!n.mode) { n.mode = "idle"; n.timer = 60 + Math.floor(Math.random() * 200); }
      // shop owners slip inside while the shop is open, then come back out
      if (n.mode === "inside") {
        if (!open || --n.timer <= 0) { n.inside = false; placeNpc(n, base); n.mode = "idle"; n.timer = 90 + Math.floor(Math.random() * 160); }
        return;
      }
      if (n.hidden) placeNpc(n, base);
      if (n.mode === "idle") {
        if (n.path.length) { /* still walking to a new post */ }
        else if (--n.timer <= 0) planRoute(n, base);
      }
      if (n.mode === "route" && !n.path.length) {
        if (n.legs.length) {
          const g = n.legs.shift(), path = findPath(n.tx, n.ty, g.tx, g.ty);
          if (path) n.path = path;
        } else if (open && wi && Math.random() < 0.7) {
          n.mode = "inside"; n.inside = true; n.hidden = true; n.timer = 900 + Math.floor(Math.random() * 1500);
          return;
        } else { n.mode = "idle"; n.timer = 160 + Math.floor(Math.random() * 360); }
      }
      if (n.path.length) {
        // wait if the player is right next to this villager, so nobody gets shoved or blocked
        if (Math.hypot(player.x - n.px, player.y - n.py) < 30 && n.mode !== "idle") return;
        const wp = n.path[0];
        const gx = wp.tx * T + 16, gy = wp.ty * T + 24;
        const dx = gx - n.px, dy = gy - n.py, d = Math.hypot(dx, dy), sp = 1.1;
        if (d <= sp) { n.px = gx; n.py = gy; n.tx = wp.tx; n.ty = wp.ty; n.path.shift(); }
        else {
          n.px += (dx / d) * sp; n.py += (dy / d) * sp; n.walking = true;
          n.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        }
      }
    });
  }

  // A villager's routine: a loop of 3 or 4 stops on walkable ground within their radius of home (their shop or house), then back.
  function planRoute(n, base) {
    const R = n.def.radius || 14;
    const tries = [];
    for (let i = 0; i < 40 && tries.length < (3 + Math.floor(Math.random() * 2)); i++) {
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * (R - 4);
      const tx = Math.round(base.tx + Math.cos(a) * r), ty = Math.round(base.ty + Math.sin(a) * r * 0.75);
      const w = M.inb(tx, ty) ? nearestWalkable(tx, ty, 2) : null;
      if (w && M.tiles[w.ty * W + w.tx] !== M.TYPE.WATER) tries.push({ tx: w.tx, ty: w.ty, a });
    }
    if (!tries.length) { n.mode = "idle"; n.timer = 200; return; }
    tries.sort((p, q) => p.a - q.a);                       // go round in a loop instead of zig-zagging
    n.legs = tries.concat([{ tx: base.tx, ty: base.ty }]);
    n.mode = "route";
  }

  /* ----------------------------------------------------------- effects */
  const bursts = [];
  function spawnBurst(tx, ty, kind) {
    const cols = kind === "leaves" ? ["#4f9a3c", "#6fbf55", "#3b7a2e", "#8a5a30"] : kind === "dirt" ? ["#6a4a2a", "#8a6a40"] : ["#d9b680", "#a87a44", "#7a5232"];
    const n = kind === "dirt" ? 8 : 18;
    for (let i = 0; i < n; i++) {
      bursts.push({ x: tx * T + 16 + (Math.random() - 0.5) * 20, y: ty * T + 10 + Math.random() * 20, vx: (Math.random() - 0.5) * 3.2, vy: -1 - Math.random() * 3, life: 26 + Math.random() * 16, col: cols[i % cols.length], s: 2 + Math.floor(Math.random() * 3) });
    }
  }

  /* ----------------------------------------------------------- ambient life */
  const rabbits = [[22, 33], [28, 42], [12, 44], [48, 36], [60, 56], [34, 28]].map(([tx, ty], i) => {
    const w = nearestWalkable(tx, ty, 6) || { tx, ty };
    return { x: w.tx * T + 16, y: w.ty * T + 16, vx: 0, vy: 0, hopZ: 0, hopV: 0, timer: 40 + i * 30, dir: 1 };
  });

  // Songbirds follow looping routes around the map in world coordinates: they fly between waypoints and perch in trees for a while.
  const birds = Array.from({ length: 24 }, (_, i) => {
    const hx = 150 + Math.random() * (W * T - 300), hy = 150 + Math.random() * (H * T - 300), rad = 260 + Math.random() * 360;
    const near = M.natureTrees.filter((t) => Math.hypot(t.tx * T - hx, t.ty * T - hy) < rad);
    const route = [];
    const n = 4 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.random() * 0.8, r = rad * (0.45 + Math.random() * 0.55);
      if (near.length && k % 2 === 1) { const t = near[Math.floor(Math.random() * near.length)]; route.push({ x: t.tx * T + 16, y: t.ty * T - 36, perch: true }); }
      else route.push({ x: Math.max(40, Math.min(W * T - 40, hx + Math.cos(a) * r)), y: Math.max(60, Math.min(H * T - 60, hy + Math.sin(a) * r * 0.7)), perch: false });
    }
    return { x: route[0].x, y: route[0].y, species: ACM.ArtCritters.NAMES[i % ACM.ArtCritters.NAMES.length], dir: 1, state: "fly", flap: Math.random() * 4, hop: 0, timer: 0, wi: 1 % route.length, speed: 0.9 + Math.random() * 0.7, route };
  });

  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * VIEW_W,
    y: Math.random() * VIEW_H,
    speedY: 2 + Math.random() * 3,
    speedX: -0.6 - Math.random() * 1.2,
    kind: "leaf"
  }));

  function updateAmbient(state) {
    rabbits.forEach((r) => {
      const dp = Math.hypot(player.x - r.x, player.y - r.y);
      if (r.hopZ <= 0 && r.hopV <= 0) {
        if (dp < 90) {
          const a = Math.atan2(r.y - player.y, r.x - player.x);
          r.vx = Math.cos(a) * 2.6;
          r.vy = Math.sin(a) * 2.6;
          r.hopV = 4.2;
        } else if (--r.timer <= 0) {
          r.timer = 70 + Math.floor(Math.random() * 110);
          const a = Math.random() * Math.PI * 2;
          r.vx = Math.cos(a) * 1.3;
          r.vy = Math.sin(a) * 1.3;
          r.hopV = 3.2;
        }
      }
      if (r.hopV !== 0 || r.hopZ > 0) {
        r.hopZ += r.hopV;
        r.hopV -= 0.35;
        const nx = r.x + r.vx, ny = r.y + r.vy;
        if (!blockedTile(Math.floor(nx / T), Math.floor(ny / T))) { r.x = nx; r.y = ny; }
        if (r.vx) r.dir = r.vx > 0 ? 1 : -1;
        if (r.hopZ <= 0) { r.hopZ = 0; r.hopV = 0; r.vx = 0; r.vy = 0; }
      }
    });

    birds.forEach((b) => {
      if (b.state === "perch") {
        if (b.hop > 0) b.hop--; else if (Math.random() < 0.012) b.hop = 8;
        if (--b.timer <= 0) { b.state = "fly"; b.wi = (b.wi + 1) % b.route.length; }
        return;
      }
      const wp = b.route[b.wi], dx = wp.x - b.x, dy = wp.y - b.y, d = Math.hypot(dx, dy);
      b.flap += 0.32;
      if (d <= b.speed + 1) {
        b.x = wp.x; b.y = wp.y;
        if (wp.perch) { b.state = "perch"; b.timer = 160 + Math.floor(Math.random() * 420); b.hop = 0; }
        else b.wi = (b.wi + 1) % b.route.length;
      } else { b.x += (dx / d) * b.speed; b.y += (dy / d) * b.speed; b.dir = dx >= 0 ? 1 : -1; }
    });

    const weather = state.weather || "Sunny";
    const season = state.season || "Spring";
    particles.forEach((p) => {
      if (weather === "Rain") { p.kind = "rain"; p.y += p.speedY * 2.4; p.x += p.speedX * 1.8; }
      else if (weather === "Snow" || season === "Winter") { p.kind = "snow"; p.y += p.speedY * 0.65; p.x += Math.sin(tick * 0.03 + p.y * 0.05) * 0.7; }
      else if (season === "Autumn" || weather === "Breezy") { p.kind = "leaf"; p.y += p.speedY * 0.55; p.x += p.speedX * 1.6; }
      else p.kind = "none";
      if (p.y > VIEW_H) { p.y = -8; p.x = Math.random() * VIEW_W; }
      if (p.x < -10) p.x = VIEW_W + 8;
    });
  }

  /* ----------------------------------------------------------- input */
  function clearKeys() {
    Object.keys(keys).forEach((k) => { keys[k] = false; });
    dpad.up = dpad.down = dpad.left = dpad.right = false;
    document.querySelectorAll(".dpad-btn").forEach((b) => b.classList.remove("pressed"));
  }

  function isModalOpen() {
    const creator = document.getElementById("creator-modal");
    const overlay = document.getElementById("modal-overlay");
    return (creator && !creator.classList.contains("hidden")) || (overlay && !overlay.classList.contains("hidden"));
  }

  function focusGameCanvas(canvas) {
    try { window.focus(); if (canvas) canvas.focus({ preventScroll: true }); } catch (e) {}
  }

  function frontTile() {
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing] || [0, 1];
    const pt = playerTile();
    return { tx: pt.tx + f[0], ty: pt.ty + f[1] };
  }

  function stationAtWorld(wx, wy) {
    return (scene ? scene.stations : M.stations).find((s) => {
      const hit = s.hit;
      const inRect = hit && wx >= hit.x * T - 6 && wx <= (hit.x + hit.w) * T + 6 && wy >= hit.y * T - 6 && wy <= (hit.y + hit.h) * T + 6;
      return inRect || Math.hypot(wx - s.sx, wy - s.sy) < 40;
    });
  }

  function init(canvas, onInteract, h) {
    handlers = Object.assign({ onInteract }, h || {});

    window.addEventListener("blur", clearKeys);
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearKeys(); });

    window.addEventListener(
      "keydown",
      (e) => {
        if (document.activeElement && ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
        if (isModalOpen()) return;
        const k = e.key.toLowerCase();
        const code = e.code;
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
        keys[k] = true;
        if (code) keys[code] = true;
        hover.active = false;

        if (e.repeat) return;
        if (k === "e" || code === "KeyE" || k === "enter" || k === " ") {
          if (activeStation) {
            clearKeys();
            handlers.onInteract(activeStation.id);
          } else if (!scene) {
            const ft = frontTile();
            doTileAction(ft.tx, ft.ty);
          }
        } else if (k === "q" && handlers.onCycleSapling) {
          handlers.onCycleSapling();
        }
      },
      { passive: false }
    );

    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
      if (e.code) keys[e.code] = false;
    });

    document.querySelectorAll(".dpad-btn").forEach((btn) => {
      const dir = btn.dataset.dir;
      const press = (ev) => {
        ev.preventDefault();
        if (isModalOpen()) return;
        focusGameCanvas(canvas);
        cancelWalk();
        dpad[dir] = true;
        btn.classList.add("pressed");
      };
      const release = () => { dpad[dir] = false; btn.classList.remove("pressed"); };
      btn.addEventListener("pointerdown", press);
      btn.addEventListener("pointerup", release);
      btn.addEventListener("pointerleave", release);
      btn.addEventListener("pointercancel", release);
    });

    const toWorld = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width) / (scene ? scene.zoom || 1 : WZ) + camera.x,
        y: (e.clientY - rect.top) * (canvas.height / rect.height) / (scene ? scene.zoom || 1 : WZ) + camera.y
      };
    };

    canvas.addEventListener("pointermove", (e) => {
      const p = toWorld(e);
      hover.tx = Math.floor(p.x / T);
      hover.ty = Math.floor(p.y / T);
      hover.active = true;
    });
    canvas.addEventListener("pointerleave", () => { hover.active = false; });

    canvas.addEventListener("pointerdown", (e) => {
      focusGameCanvas(canvas);
      if (isModalOpen()) return;
      const p = toWorld(e);
      const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
      hover.tx = tx; hover.ty = ty; hover.active = true;

      const npcList = scene ? (scene.npc ? [scene.npc] : []) : npcs;
      const nc = npcList.find((n) => !n.hidden && Math.abs(p.x - n.px) < 17 && p.y > n.py - 46 && p.y < n.py + 8);
      if (nc) {
        const id = "npc:" + nc.id;
        const rng = scene ? 90 : NPC_RANGE + 12;
        if (Math.hypot(player.x - nc.px, player.y - nc.py) < rng) { clearKeys(); handlers.onInteract(id); return; }
        if (scene) { const sd = scene.def.npc.stand; walkTo(sd.x, sd.y, { stationId: id }); }
        else walkTo(Math.floor(nc.px / T), Math.floor(nc.py / T) + 1, { stationId: id });
        return;
      }

      const st = stationAtWorld(p.x, p.y);
      if (st) {
        if (Math.hypot(player.x - st.sx, player.y - st.sy) < STATION_RANGE) { clearKeys(); handlers.onInteract(st.id); return; }
        walkTo(Math.floor(st.ix), Math.floor(st.iy), { stationId: st.id });
        return;
      }

      if (scene) { cancelWalk(); if (!walkTo(tx, ty) && handlers.onBlockedClick) handlers.onBlockedClick(tx, ty); return; }
      const planting = handlers.getPlantSapling && handlers.getPlantSapling();
      const fg = M.forageIndex.get(ty * W + tx);
      const fgItem = fg && ACM.Forage.available(curState, fg) && !treeAt.has(fg.i);
      if (treeInfoAt(tx, ty) || planting || fgItem) {
        if (tileDistPx(tx, ty) <= REACH) { cancelWalk(); doTileAction(tx, ty); return; }
        if (!walkTo(tx, ty, { tile: { tx, ty } }) && handlers.onBlockedClick) handlers.onBlockedClick(tx, ty);
        return;
      }
      cancelWalk();
      if (!walkTo(tx, ty) && handlers.onBlockedClick) handlers.onBlockedClick(tx, ty);
    });
  }

  /* ----------------------------------------------------------- update */
  // the giant squirrel: bursts from the felled stump and chases the player; when it reaches them the day ends
  let chaser = null;
  function startChase(tx, ty, onCaught) {
    chaser = { x: tx * T + 16, y: ty * T + 16, dir: 1, frame: 0, age: 0, onCaught };
  }
  function updateChaser() {
    const c = chaser;
    if (!c) return;
    c.age++; c.frame += 0.28;
    const dx = player.x - c.x, dy = player.y - c.y, d = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) > 2) c.dir = dx > 0 ? 1 : -1;
    const spd = Math.max(2.2, Math.min(4.6, player.speed * 1.35 + (c.age > 240 ? 0.6 : 0)));
    c.x += (dx / d) * Math.min(spd, d); c.y += (dy / d) * Math.min(spd, d);
    // inside a building you're caught right away (it follows you in); also caught after a long chase
    if (d < 20 || scene || c.age > 900) { chaser = null; const cb = c.onCaught; if (cb) cb(); }
  }

  // --- goal guide: resolves ACM.Game.goalTarget() to a point in the world (outdoors only) ---
  let goalPt = null, goalAt = -99;
  function resolveGoal() {
    if (tick - goalAt < 20) return goalPt;
    goalAt = tick; goalPt = null;
    if (scene || !ACM.Game || !ACM.Game.goalTarget) return null;
    const g = ACM.Game.goalTarget();
    if (!g) return null;
    const door = (b) => ({ x: (b.doorX + 0.5) * T, y: (b.y + b.h) * T - 8, label: b.kind });
    if (g.npc) {
      const n = npcs.find((q) => q.id === g.npc);
      if (!n) return null;
      if (!n.hidden) goalPt = { x: n.px, y: n.py - 30, label: g.npc };
      else {
        const p = n.def.posts && n.def.posts.day;
        const bs = M.buildings.filter((b) => b.doorX != null).sort((a, b2) => {
          const d = (b) => p ? Math.hypot(b.x + b.w / 2 - p[0], b.y + b.h / 2 - p[1]) : 0; return d(a) - d(b2); });
        if (bs[0]) goalPt = door(bs[0]);
      }
    } else if (g.station) {
      const s = M.stations.find((q) => q.id === g.station);
      if (s) goalPt = { x: s.ix * T, y: s.iy * T - 30, label: s.shortLabel };
    } else if (g.bld) {
      const b = M.buildings.find((q) => q.kind === g.bld || q.id === g.bld);
      if (b) goalPt = door(b);
    } else if (g.tree) {
      let best = null, bd = 1e9;
      M.natureTrees.forEach((t) => { const d = Math.hypot(t.tx * T - player.x, t.ty * T - player.y); if (d < bd) { const i = treeInfoAt(t.tx, t.ty); if (i && i.stage >= 2) { bd = d; best = t; } } });
      if (best) goalPt = { x: best.tx * T + 16, y: best.ty * T - 24, label: "tree" };
    }
    return goalPt;
  }

  function update(state) {
    tick++;
    curState = state;
    refreshDynamic(state);

    if (isModalOpen()) {
      clearKeys();
      updateAmbient(state);
      return;
    }

    if (state.timeMin == null) state.timeMin = 360;
    if (state.energy == null) { state.energy = 100; state.maxEnergy = 100; }
    updateChaser();
    state.timeMin += TIME_PER_TICK;
    if (state.timeMin >= 1440) {
      if (!midnightFired) { midnightFired = true; if (handlers.onMidnight) handlers.onMidnight(); }
    } else midnightFired = false;

    updateNpcs(state);
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.x += b.vx; b.y += b.vy; b.vy += 0.25; b.life--;
      if (b.life <= 0) bursts.splice(i, 1);
    }
    unstickIfNeeded();

    let dx = 0, dy = 0;
    if (keys["w"] || keys["KeyW"] || dpad.up) dy -= 1;
    if (keys["s"] || keys["KeyS"] || dpad.down) dy += 1;
    if (keys["a"] || keys["KeyA"] || dpad.left) dx -= 1;
    if (keys["d"] || keys["KeyD"] || dpad.right) dx += 1;
    const sprint = keys["shift"] || keys["Shift"];
    const tired = state.energy <= 15;
    const spd = player.speed * (sprint && !tired ? 1.55 : 1) * (tired ? 0.8 : 1) * (state.speedMult || 1);

    let moved = false;
    if (dx || dy) {
      cancelWalk();
      const len = Math.hypot(dx, dy);
      dx = (dx / len) * spd;
      dy = (dy / len) * spd;
      moved = tryMove(dx, dy);
      if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? "right" : "left";
      else player.facing = dy > 0 ? "down" : "up";
    } else if (player.path.length) {
      const wp = player.path[0];
      const tx = wp.tx * T + 16, ty = wp.ty * T + 16;
      const ddx = tx - player.x, ddy = ty - player.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist <= spd) {
        const ox = player.x, oy = player.y;
        player.x = tx; player.y = ty;
        if (!canStand(tx, ty)) { player.x = ox; player.y = oy; cancelWalk(); }
        else {
          player.path.shift();
          moved = true;
          if (!player.path.length) arrive();
        }
      } else {
        const sx = (ddx / dist) * spd, sy = (ddy / dist) * spd;
        moved = tryMove(sx, sy);
        if (Math.abs(sx) > Math.abs(sy)) player.facing = sx > 0 ? "right" : "left";
        else player.facing = sy > 0 ? "down" : "up";
        if (!moved) {
          if (++player.stuck > 12) cancelOrArrive();
        } else player.stuck = 0;
      }
    }

    if (moved) {
      player.stepTimer++;
      if (player.stepTimer % (sprint ? 5 : 7) === 0) {
        player.frame = (player.frame + 1) % 4;
        if (player.frame % 2 === 1 && ACM.Audio) {
          const tt = M.tileAt(Math.floor(player.x / T), Math.floor(player.y / T));
          ACM.Audio.step(scene ? "floor" : tt === M.TYPE.PATH ? "path" : tt === M.TYPE.FLOOR ? "floor" : tt === M.TYPE.BRIDGE ? "bridge" : tt === M.TYPE.SAND ? "sand" : tt === M.TYPE.COBBLE ? "cobble" : "grass");
        }
      }
    } else {
      player.frame = 0;
    }

    if (scene) {
      const z = scene.zoom = Math.min(2, Math.floor(Math.min(VIEW_W / (scene.def.w * T), (VIEW_H - 40) / (scene.def.h * T)) * 4) / 4);
      camera.x = -Math.round((VIEW_W / z - scene.def.w * T) / 2);
      camera.y = -Math.round(((VIEW_H - 20) / z - scene.def.h * T) / 2) + 6;
      if (fade > 0) fade = Math.max(0, fade - 0.06);
      if (++scene.ticks % 60 === 0 && !shopOpen(scene.def, state.timeMin)) {
        if (ACM.Game && ACM.Game.toast) ACM.Game.toast(scene.def.name + " is closing for the day.", "");
        exitBuilding();
        return;
      }
      const ptx = Math.floor(player.x / T), pty = Math.floor(player.y / T);
      if (pty === scene.def.h - 1 && ptx === scene.def.exit && handlers.onInteract) { clearKeys(); handlers.onInteract("exit"); return; }
    } else {
      if (fade > 0) fade = Math.max(0, fade - 0.06);
      camera.x = Math.max(0, Math.min(WORLD_W - VW, Math.round(player.x - VW / 2)));
      camera.y = Math.max(0, Math.min(WORLD_H - VH, Math.round(player.y - 20 - VH / 2)));
    }

    updateAmbient(state);

    let nearest = null, minScore = 1e9;
    (scene ? scene.stations : M.stations).forEach((s) => {
      const d = Math.hypot(player.x - s.sx, player.y - s.sy);
      if (d < STATION_RANGE && d < minScore) { minScore = d; nearest = s; }
    });
    (scene ? (scene.npc ? [scene.npc] : []) : npcs).forEach((n) => {
      if (n.hidden) return;
      const d = Math.hypot(player.x - n.px, player.y - n.py);
      if (d < (scene ? 84 : NPC_RANGE) && d - 14 < minScore) {
        minScore = d - 14;
        nearest = { id: "npc:" + n.id, shortLabel: n.def.name, prompt: "Talk to " + n.def.name + " — " + n.def.role, sx: n.px, sy: n.py - 30, npc: true };
      }
    });
    if (!nearest && !scene) {
      for (let i = 0; i < M.forage.length; i++) {
        const f = M.forage[i];
        const fx = f.tx * T + 16, fy = f.ty * T + 20;
        if (Math.abs(fx - player.x) > 44 || Math.abs(fy - player.y) > 44) continue;
        const item = ACM.Forage.available(state, f);
        if (!item || treeAt.has(f.i)) continue;
        if (Math.hypot(fx - player.x, fy - player.y) < 40) { nearest = { id: "forage:" + f.i, shortLabel: "Forage", prompt: "Pick " + ACM.FOODS[item].name.toLowerCase() + " [E]", sx: fx, sy: fy + 6 }; break; }
      }
    }
    activeStation = nearest;

    // ambient sound environment
    if (ACM.Audio && tick % 6 === 0) {
      if (!scene && tick - lastWaterScan > 20) {
        lastWaterScan = tick;
        const ptx = Math.floor(player.x / T), pty = Math.floor(player.y / T);
        let best = 99;
        for (let yy = -8; yy <= 8; yy++) for (let xx = -8; xx <= 8; xx++) {
          if (M.tileAt(ptx + xx, pty + yy) === M.TYPE.WATER) best = Math.min(best, Math.hypot(xx, yy));
        }
        waterDist = best;
      }
      const ptx = player.x / T, pty = player.y / T;
      ACM.Audio.update({
        hour: (state.timeMin / 60) % 24,
        season: state.season,
        weather: state.weather,
        waterDist,
        inside: !!scene || (ptx > 4 && ptx < 28 && pty > 4 && pty < 17.5)
      });
    }
  }

  /* ----------------------------------------------------------- render */
  const statics = [];
  (function buildStatics() {
    M.natureTrees.forEach((t) => statics.push({ k: "ntree", by: t.ty * T + 30, x0: t.tx * T - 16, x1: t.tx * T + 48, y0: t.ty * T - 62, y1: t.ty * T + 34, t }));
    M.scenery.forEach((s) => statics.push({ k: "scen", by: s.ty * T + 31, x0: s.tx * T - 4, x1: s.tx * T + 36, y0: s.ty * T, y1: s.ty * T + 34, s }));
    M.props.forEach((p) => statics.push({ k: "prop", by: p.ty * T + 31, x0: p.tx * T - 40, x1: p.tx * T + 112, y0: p.ty * T - 48, y1: p.ty * T + 36, p }));
    M.buildings.forEach((b) => statics.push({ k: "bld", by: (b.y + b.h) * T, x0: b.x * T - 16, x1: (b.x + b.w) * T + 16, y0: b.y * T - 72, y1: (b.y + b.h) * T + 10, b }));
    M.furniture.forEach((f) => statics.push({ k: "furn", by: (f.y + f.h) * T, x0: f.x * T, x1: (f.x + f.w) * T + 8, y0: f.y * T - 12, y1: (f.y + f.h) * T + 8, f }));
  })();

  function plantedSprite(t, season) {
    const type = AW.SPECIES[t.saplingId] || t.type || "pine";
    const variant = Math.floor(M.hash(t.tx, t.ty, 5) * 3);
    return AW.getTree(type, season, variant, Math.max(0, Math.min(2, t.stage || 0)));
  }

  function drawEntity(ctx, e, state, season) {
    switch (e.k) {
      case "ntree": {
        const t = e.t;
        ctx.drawImage(AW.getTree(t.type, season, t.variant, 2), t.tx * T - 16, t.ty * T + 30 - 92);
        break;
      }
      case "wtree": {
        const t = e.t;
        const variant = Math.floor(M.hash(t.tx, t.ty, 6) * 3);
        ctx.drawImage(AW.getTree(t.type, season, variant, Math.max(0, Math.min(2, t.stage || 0))), t.tx * T - 16, t.ty * T + 30 - 92);
        break;
      }
      case "stump": AW.drawScenery(ctx, { kind: "stump", tx: e.tx, ty: e.ty, v: 0 }, season); break;
      case "ptree": {
        const t = e.t;
        ctx.drawImage(plantedSprite(t, season), t.tx * T - 16, t.ty * T + 30 - 92);
        if ((t.stage || 0) >= 2) AW.drawReadyMark(ctx, t.tx, t.ty, tick);
        break;
      }
      case "scen": AW.drawScenery(ctx, e.s, season); break;
      case "prop": AW.drawProp(ctx, e.p, season, tick); break;
      case "bld": {
        const sp = AB.getSprite(e.b, season, e.b.kind === "legacy" ? ((state.story && state.story.stage) || 0) : 0);
        ctx.drawImage(sp.cv, e.b.x * T - sp.ox, e.b.y * T - sp.oy);
        break;
      }
      case "home": {
        const stage = state.homeStage || 0;
        const sp = AB.getSprite(M.home, season, stage);
        ctx.drawImage(sp.cv, M.home.x * T - sp.ox, M.home.y * T - sp.oy);
        break;
      }
      case "furn": AB.drawFurniture(ctx, e.f); break;
      case "mach": AB.drawMachine(ctx, e.m); break;
      case "npc": {
        const n = e.n;
        const fr = n.walking ? Math.floor(tick / 8) % 4 : 0;
        ACM.ArtSprites.drawCharacter(ctx, n.px, n.py - 18, n.def.appearance, 1.3, fr, n.face, n.def.gear || {});
        const b = handlers.npcBubble && handlers.npcBubble(n.id);
        if (b) AW.drawNpcBubble(ctx, n.px, n.py - 52, tick, b);
        break;
      }
      case "ghost": AW.drawGhost(ctx, e.x, e.y, tick); break;
      case "forage": AW.drawForage(ctx, e.f, e.item, tick); break;
      case "rabbit": AW.drawRabbit(ctx, e.r, season); break;
      case "player": {
        const gear = {
          safety_glasses: (state.ownedTools || []).includes("safety_glasses"),
          ear_muffs: (state.ownedTools || []).includes("ear_muffs")
        };
        const hk = (state.slots || [])[state.sel || 0];
        const held = hk && hk.indexOf("tool:") === 0 && ACM.Icons ? ACM.Icons.get(hk) : null;
        if (held && player.facing === "up") ctx.drawImage(held, Math.round(player.x + 4), Math.round(player.y - 32), 20, 20);
        ACM.ArtSprites.drawCharacter(ctx, player.x, player.y - 19, state.appearance, 1.3, player.frame, player.facing, gear);
        if (held && player.facing !== "up") {
          const hx = player.facing === "left" ? -24 : player.facing === "right" ? 6 : 8;
          const bob = player.frame % 2 === 1 ? -1 : 0;
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.drawImage(held, Math.round(player.x + hx), Math.round(player.y - 24 + bob), 20, 20);
          ctx.restore();
        }
        break;
      }
    }
  }

  function renderScene(ctx, state) {
    const AI = ACM.ArtInteriors, def = scene.def;
    const hour = (state.timeMin / 60) % 24;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#140d08";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    ctx.scale(scene.zoom || 1, scene.zoom || 1);
    ctx.translate(-camera.x, -camera.y);
    ctx.drawImage(AI.getBackground(def, AI.hourKey(hour)), 0, 0);
    const list = [];
    def.objs.forEach((o) => { if (o.t !== "rug" && !o.wall) list.push({ k: "iobj", by: (o.y + o.h) * T - 2, o }); });
    if (scene.npc) list.push({ k: "npc", by: scene.npc.py, n: scene.npc });
    if (scene.id === "legacy") list.push({ k: "ghost", by: 5 * T, x: 10 * T, y: 5 * T });
    list.push({ k: "player", by: player.y });
    list.sort((a, b) => a.by - b.by);
    for (let i = 0; i < list.length; i++) {
      if (list[i].k === "iobj") AI.drawObject(ctx, list[i].o, tick);
      else drawEntity(ctx, list[i], state, state.season || "Spring");
    }
    // evening dimness with warm lamp pools
    const night = hour >= 20 || hour < 5.5, dusk = hour >= 17.5 && hour < 20;
    if (night || dusk) {
      ctx.fillStyle = night ? "rgba(14,10,34,0.30)" : "rgba(60,30,10,0.14)";
      ctx.fillRect(0, 0, def.w * T, def.h * T);
    }
    ctx.globalCompositeOperation = "lighter";
    def.objs.filter((o) => o.t === "lamp").forEach((o) => {
      const g = ctx.createRadialGradient(o.x * T + 16, o.y * T + 14, 4, o.x * T + 16, o.y * T + 14, 110);
      g.addColorStop(0, "rgba(255,200,110," + (night ? 0.38 : 0.2) + ")"); g.addColorStop(1, "rgba(255,200,110,0)");
      ctx.fillStyle = g; ctx.fillRect(o.x * T - 100, o.y * T - 100, 230, 230);
    });
    ctx.globalCompositeOperation = "source-over";
    if (activeStation) AW.drawStationMarker(ctx, activeStation, tick);
    ctx.restore();
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(24,15,9,0.8)"; ctx.fillRect(10, 62, ctx.measureText(def.name).width + 20, 22);
    ctx.fillStyle = "#ffe9b0"; ctx.fillText(def.name, 20, 77);
    AW.drawClockAndEnergy(ctx, state, VIEW_W, VIEW_H);
    if (fade > 0) { ctx.fillStyle = "rgba(0,0,0," + fade + ")"; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  function render(ctx, state) {
    if (scene) { renderScene(ctx, state); return; }
    const season = state.season || "Spring";
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    ctx.scale(WZ, WZ);
    ctx.translate(-camera.x, -camera.y);

    ctx.drawImage(AW.getGround(season), camera.x, camera.y, VW, VH, camera.x, camera.y, VW, VH);
    { const wk = AW.getWorkshop(season, ACM.Workshop ? ACM.Workshop.zones(curState) : { west: true, east: true }); ctx.drawImage(wk.cv, wk.x, wk.y); }
    AW.drawWaterShimmer(ctx, camera.x, camera.y, tick, VW, VH);

    // walk destination marker
    if (player.dest) {
      const r = 7 + Math.sin(tick * 0.2) * 2;
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.dest.x, player.dest.y + 4, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // plant cursor
    const sapId = handlers.getPlantSapling && handlers.getPlantSapling();
    let plantLabel = null;
    if (sapId) {
      const ft = frontTile();
      const c = hover.active && hover.tx >= 0 ? { tx: hover.tx, ty: hover.ty } : ft;
      const ok = handlers.canPlant ? handlers.canPlant(c.tx, c.ty).ok : false;
      const inReach = tileDistPx(c.tx, c.ty) <= REACH;
      AW.drawTileCursor(ctx, c.tx, c.ty, ok && inReach);
      plantLabel = handlers.getPlantLabel ? handlers.getPlantLabel() : "Planting";
    }

    // collect visible entities
    const vx0 = camera.x, vx1 = camera.x + VW, vy0 = camera.y, vy1 = camera.y + VH;
    const list = [];
    for (let i = 0; i < statics.length; i++) {
      const e = statics[i];
      if (e.x1 < vx0 || e.x0 > vx1 || e.y1 < vy0 || e.y0 > vy1) continue;
      if (e.k === "ntree" && felled[e.t.ty * W + e.t.tx] != null) continue;
      list.push(e);
    }
    Object.keys(felled).forEach((ks) => {
      const k = Number(ks), tx = k % W, ty = (k / W) | 0;
      if (tx * T + 32 < vx0 || tx * T > vx1 || ty * T + 34 < vy0 || ty * T > vy1) return;
      if (!treeAt.has(k)) list.push({ k: "stump", by: ty * T + 24, tx, ty });
    });
    (state.wild || []).forEach((t) => {
      if (t.tx * T + 48 < vx0 || t.tx * T - 16 > vx1 || t.ty * T + 34 < vy0 || t.ty * T - 62 > vy1) return;
      list.push({ k: "wtree", by: t.ty * T + 30, t });
    });
    npcs.forEach((n) => { if (!n.hidden) list.push({ k: "npc", by: n.py, n }); });
    M.forage.forEach((f) => {
      if (f.tx * T + 36 < vx0 || f.tx * T > vx1 || f.ty * T + 34 < vy0 || f.ty * T > vy1 || treeAt.has(f.i)) return;
      const item = ACM.Forage.available(state, f);
      if (f.kind === "mushroom" && !item) return;
      list.push({ k: "forage", by: f.ty * T + 26, f, item });
    });
    (state.trees || []).forEach((t) => {
      if (!t || typeof t.tx !== "number") return;
      if (t.tx * T + 48 < vx0 || t.tx * T - 16 > vx1 || t.ty * T + 34 < vy0 || t.ty * T - 62 > vy1) return;
      list.push({ k: "ptree", by: t.ty * T + 30, t });
    });
    list.push({ k: "home", by: (M.home.y + M.home.h) * T });
    M.machines.forEach((m) => {
      if ((state.ownedTools || []).includes(m.tool)) list.push({ k: "mach", by: (m.y + m.h) * T, m });
    });
    rabbits.forEach((r) => list.push({ k: "rabbit", by: r.y, r }));
    { const sg = state.story, hr = (state.timeMin / 60) % 24; if (sg && sg.met && sg.stage < 5 && (hr >= 17.5 || hr < 6)) list.push({ k: "ghost", by: 1e6, x: 76.5 * T, y: 47.5 * T }); }
    list.push({ k: "player", by: player.y });
    list.sort((a, b) => a.by - b.by);
    for (let i = 0; i < list.length; i++) drawEntity(ctx, list[i], state, season);

    // chimney smoke
    M.buildings.forEach((b, i) => {
      const cp = AB.chimneyPoint(b, 0);
      if (cp && cp.x > vx0 - 40 && cp.x < vx1 + 40 && cp.y > vy0 - 80 && cp.y < vy1 + 40) AW.drawSmoke(ctx, cp.x, cp.y, tick, i);
    });
    if ((state.homeStage || 0) >= 4) {
      const cp = AB.chimneyPoint(M.home, state.homeStage);
      if (cp) AW.drawSmoke(ctx, cp.x, cp.y, tick, 9);
    }

    // chopping progress above trees being felled
    if (state.chops) Object.keys(state.chops).forEach((ks) => {
      const k = Number(ks), tx = k % W, ty = (k / W) | 0, ti = treeInfoAt(tx, ty);
      if (!ti || tx * T < vx0 - 40 || tx * T > vx1 + 40 || ty * T < vy0 - 80 || ty * T > vy1 + 40) return;
      const need = ({ pine: 6, cedar: 7, birch: 7, maple: 9, oak: 10, cherry: 9, walnut: 11 })[ti.type] || 7;
      const f = Math.min(1, state.chops[k] / need), bx = tx * T + 2, by = ty * T - 30;
      ctx.fillStyle = "rgba(20,12,6,0.8)"; ctx.fillRect(bx - 1, by - 1, 30, 7);
      ctx.fillStyle = "#e8b84a"; ctx.fillRect(bx, by, Math.round(28 * f), 5);
    });
    bursts.forEach((b) => { ctx.fillStyle = b.col; ctx.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s); });
    if (activeStation) AW.drawStationMarker(ctx, activeStation, tick);
    ctx.restore();

    // day / night lighting (screen space)
    const sky = AW.skyAt(state.timeMin, state.weather);
    if (sky.a > 0.015) {
      const lights = [];
      const panes = [];
      const inView = (x, y, r) => x > vx0 - r && x < vx1 + r && y > vy0 - r && y < vy1 + r;
      LAMPS.forEach((l) => { const x = l.tx * T + 16, y = l.ty * T - 14; if (inView(x, y, 150)) lights.push({ x, y, r: 130, k: 1, warm: true }); });
      // the workshop is open to the sky: light it warmly like a lamplit shop floor
      [[10, 9], [21, 9], [8, 8], [16, 13], [24, 8], [14, 6]].forEach(([tx, ty]) => {
        const x = tx * T + 16, y = ty * T + 16;
        if (inView(x, y, 190)) lights.push({ x, y, r: 175, k: 0.95, warm: true });
      });
      M.buildings.forEach((b) => AB.windowRects(b, 0).forEach((r, i) => {
        if (r.x > vx1 + 80 || r.x < vx0 - 80 || r.y > vy1 + 80 || r.y < vy0 - 80) return;
        panes.push(r);
        if (i % 2 === 0) lights.push({ x: r.x + r.w / 2, y: r.y + r.h + 10, r: 62, k: 0.8, warm: true });
      }));
      const hs = state.homeStage || 0;
      AB.windowRects(M.home, hs).forEach((r) => {
        if (r.x > vx1 + 80 || r.x < vx0 - 80 || r.y > vy1 + 80 || r.y < vy0 - 80) return;
        panes.push(r);
        lights.push({ x: r.x + r.w / 2, y: r.y + r.h + 10, r: 70, k: 0.9, warm: true });
      });
      lights.push({ x: player.x, y: player.y - 12, r: 95, k: 0.55, warm: true });
      ctx.save(); ctx.scale(WZ, WZ);
      AW.drawLighting(ctx, state, camera.x, camera.y, VW, VH, lights, panes);
      ctx.restore();
    }

    AW.drawOverlay(ctx, state, particles, birds, player, M.stations, VIEW_W, VIEW_H, plantLabel, { x: camera.x * WZ, y: camera.y * WZ, wz: WZ }, chaser, resolveGoal());
    if (fade > 0) { ctx.fillStyle = "rgba(0,0,0," + fade + ")"; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  function getActiveStation() { return activeStation; }

  return {
    init,
    update,
    render,
    getActiveStation,
    clearKeys,
    focusGameCanvas,
    getPlayerTile: playerTile,
    treeInfoAt,
    wouldTrap,
    rescue,
    spawnBurst,
    startChase,
    isChasing: () => !!chaser,
    clearChase: () => { chaser = null; },
    getNpcs: () => npcs,
    enterBuilding,
    exitBuilding,
    inBuilding: () => (scene ? scene.id : null),
    shopOpen: (id, min) => shopOpen(ACM.INTERIORS[id], min),
    getFrontTile: frontTile,
    isBlockedTile: blockedTile,
    // helpers used by main.js + the automated tests
    debug: {
      player,
      camera,
      findPath,
      walkTo,
      teleportTile(tx, ty) { player.x = tx * T + 16; player.y = ty * T + 16; cancelWalk(); },
      canStand,
      refresh: refreshDynamic,
      birds
    }
  };
})();
