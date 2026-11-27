window.ACM = window.ACM || {};

/**
 * Building interiors. Tile grid (32px). Rows 0-1 are the back wall, the bottom row holds the door.
 * obj: {t:type, x, y, w, h, solid} (solid = blocks walking). npc: stands behind a counter, 'stand' is where you talk from.
 * stations: {id, label, prompt, sx, sy (tile where you stand), hit:{x,y,w,h}}
 * open: [fromMinute, toMinute] shop hours. owner: the NPC who works here (hidden outdoors while the shop is open).
 */
ACM.INTERIORS = {
  hardware: {
    name: "Seymour's Hardware", w: 14, h: 10, exit: 7, floor: "plank", wall: "#7a4a3a", wallTrim: "#e2b04a", open: [450, 1080], owner: "seymour",
    windows: [3, 10],
    objs: [
      { t: "rug", x: 4, y: 5, w: 6, h: 3, c: "#8a2f2f" },
      { t: "shelf", x: 1, y: 2, w: 3, h: 1, items: "tools", solid: true },
      { t: "shelf", x: 10, y: 2, w: 3, h: 1, items: "tools", solid: true },
      { t: "counter", x: 4, y: 4, w: 6, h: 1, solid: true },
      { t: "barrel", x: 1, y: 6, w: 1, h: 1, solid: true }, { t: "barrel", x: 12, y: 6, w: 1, h: 1, solid: true },
      { t: "crate", x: 1, y: 7, w: 1, h: 1, solid: true }, { t: "crate", x: 12, y: 7, w: 1, h: 1, solid: true },
      { t: "plant", x: 12, y: 8, w: 1, h: 1, solid: true }, { t: "lamp", x: 3, y: 3, w: 1, h: 1, solid: true },
      { t: "nightstand", x: 3, y: 6, w: 1, h: 1, solid: true, fix: "side_3_nightstand" }
    ],
    npc: { id: "seymour", x: 6, y: 3, stand: { x: 6, y: 5 } },
    stations: [{ id: "tool_shop", label: "Browse tools", prompt: "Seymour's counter: buy tools and PPE, sharpen blades", sx: 7, sy: 5, hit: { x: 4, y: 4, w: 6, h: 1 } }]
  },
  sawmill: {
    name: "Routledge's Sawmill", w: 18, h: 10, exit: 9, floor: "plank", wall: "#5a3d24", wallTrim: "#d9892b", open: [450, 1080], owner: "routledge",
    windows: [4, 13],
    objs: [
      { t: "rug", x: 6, y: 5, w: 6, h: 3, c: "#35604a" },
      { t: "logs", x: 1, y: 2, w: 3, h: 2, solid: true },
      { t: "saplings", x: 13, y: 2, w: 4, h: 1, solid: true },
      { t: "counter", x: 6, y: 4, w: 6, h: 1, solid: true },
      { t: "sawmachine", x: 14, y: 5, w: 3, h: 2, solid: true },
      { t: "crate", x: 1, y: 6, w: 1, h: 1, solid: true }, { t: "barrel", x: 1, y: 7, w: 1, h: 1, solid: true },
      { t: "lamp", x: 5, y: 3, w: 1, h: 1, solid: true },
      { t: "coffeetable", x: 4, y: 7, w: 2, h: 1, solid: true, fix: "side_4_coffeetable" }
    ],
    npc: { id: "routledge", x: 8, y: 3, stand: { x: 8, y: 5 } },
    stations: [{ id: "lumber_mill", label: "Lumber & saplings", prompt: "Routledge's counter: boards, saplings, sell or mill your logs", sx: 9, sy: 5, hit: { x: 6, y: 4, w: 6, h: 1 } }]
  },
  cafe: {
    name: "Harbor Café", w: 16, h: 10, exit: 8, floor: "tile", wall: "#d9c7a0", wallTrim: "#2f7d6d", open: [450, 1290], owner: "clara",
    windows: [3, 6, 11],
    objs: [
      { t: "rug", x: 3, y: 5, w: 4, h: 3, c: "#2f7d6d" },
      { t: "counter", x: 4, y: 3, w: 6, h: 1, solid: true },
      { t: "stove", x: 11, y: 2, w: 2, h: 1, solid: true },
      { t: "shelf", x: 1, y: 2, w: 2, h: 1, items: "jars", solid: true, fix: "anchor_2_cafe" },
      { t: "frames", x: 4, y: 0, w: 4, h: 2, wall: true, fix: "side_2_frames" },
      { t: "butcher", x: 14, y: 2, w: 1, h: 1, solid: true, fix: "side_3_butcher" },
      { t: "round_table", x: 9, y: 6, w: 2, h: 2, solid: true }, { t: "round_table", x: 12, y: 6, w: 2, h: 2, solid: true },
      { t: "round_table", x: 12, y: 3, w: 2, h: 2, solid: true },
      { t: "plant", x: 1, y: 7, w: 1, h: 1, solid: true }, { t: "lamp", x: 10, y: 3, w: 1, h: 1, solid: true }
    ],
    npc: { id: "clara", x: 6, y: 2, stand: { x: 6, y: 4 } },
    stations: [{ id: "cafe_counter", label: "Café counter", prompt: "Clara's counter: hot meals and pantry food that keeps", sx: 7, sy: 4, hit: { x: 4, y: 3, w: 6, h: 1 } }]
  },
  school: {
    name: "Alder Creek Schoolhouse", w: 16, h: 10, exit: 8, floor: "plank", wall: "#8d5a48", wallTrim: "#f2ead3", open: [480, 960], owner: "alverez",
    windows: [2, 13],
    objs: [
      { t: "chalkboard", x: 5, y: 0, w: 6, h: 2, wall: true },
      { t: "bookcase", x: 1, y: 2, w: 3, h: 1, solid: true, fix: "side_2_bookshelf" }, { t: "bookcase", x: 12, y: 2, w: 3, h: 1, solid: true },
      { t: "desk", x: 7, y: 3, w: 3, h: 1, solid: true },
      { t: "pupil_desk", x: 3, y: 5, w: 2, h: 1, solid: true }, { t: "pupil_desk", x: 7, y: 5, w: 2, h: 1, solid: true }, { t: "pupil_desk", x: 11, y: 5, w: 2, h: 1, solid: true },
      { t: "pupil_desk", x: 3, y: 7, w: 2, h: 1, solid: true }, { t: "pupil_desk", x: 7, y: 7, w: 2, h: 1, solid: true }, { t: "pupil_desk", x: 11, y: 7, w: 2, h: 1, solid: true },
      { t: "plant", x: 14, y: 8, w: 1, h: 1, solid: true }
    ],
    npc: { id: "alverez", x: 8, y: 2, stand: { x: 8, y: 4 } },
    stations: [{ id: "safety_board", label: "Safety Permit Board", prompt: "The Safety Board: take shop safety tests and earn your machine permits", sx: 6, sy: 3, hit: { x: 5, y: 0, w: 6, h: 2 } }]
  },
  council: {
    name: "Alder Creek Town Hall", w: 18, h: 10, exit: 9, floor: "tile", wall: "#c8c1ae", wallTrim: "#4a5568", open: [450, 1080], owner: null,
    windows: [3, 14],
    objs: [
      { t: "rug", x: 5, y: 4, w: 8, h: 4, c: "#6b2f3a" },
      { t: "flag", x: 1, y: 1, w: 1, h: 2, wall: true }, { t: "flag", x: 16, y: 1, w: 1, h: 2, wall: true },
      { t: "board", x: 6, y: 1, w: 4, h: 2, wall: true },
      { t: "trophy", x: 12, y: 2, w: 3, h: 1, solid: true, fix: "anchor_5_centennial" },
      { t: "long_table", x: 6, y: 5, w: 6, h: 2, solid: true, fix: "anchor_4_lighthouse" },
      { t: "plant", x: 1, y: 7, w: 1, h: 1, solid: true }, { t: "plant", x: 16, y: 7, w: 1, h: 1, solid: true }
    ],
    npc: null,
    stations: [
      { id: "town_board", label: "Commission board", prompt: "The Commission Board: take on jobs from the village", sx: 8, sy: 3, hit: { x: 6, y: 1, w: 4, h: 2 } },
      { id: "leaderboard", label: "Class leaderboard", prompt: "The trophy case: see how the class workshops compare", sx: 13, sy: 3, hit: { x: 12, y: 2, w: 3, h: 1 } }
    ]
  },
  ranger: {
    name: "Parks & Trails Office", w: 12, h: 9, exit: 6, floor: "plank", wall: "#6b4a2b", wallTrim: "#d9b36a", open: [450, 1080], owner: "macleod",
    windows: [2, 8],
    objs: [
      { t: "rug", x: 3, y: 4, w: 5, h: 3, c: "#35604a" },
      { t: "map_table", x: 3, y: 3, w: 3, h: 1, solid: true },
      { t: "bunk", x: 1, y: 2, w: 2, h: 2, solid: true },
      { t: "stove", x: 9, y: 2, w: 2, h: 1, solid: true },
      { t: "barrel", x: 10, y: 6, w: 1, h: 1, solid: true },
      { t: "lamp", x: 7, y: 3, w: 1, h: 1, solid: true }
    ],
    npc: { id: "macleod", x: 7, y: 5, stand: { x: 7, y: 6 } },
    stations: [{ id: "ranger_map", label: "Forest map", prompt: "The ranger's map: check the health of Alder Creek's forest", sx: 4, sy: 4, hit: { x: 3, y: 3, w: 3, h: 1 } }]
  },
  shed: {
    name: "Forestry Shed", w: 10, h: 8, exit: 5, floor: "dirt", wall: "#6b5030", wallTrim: "#d9b36a", open: [0, 1440], owner: null,
    windows: [3],
    objs: [
      { t: "toolrack", x: 1, y: 1, w: 4, h: 2, wall: true },
      { t: "workbench", x: 3, y: 3, w: 4, h: 1, solid: true },
      { t: "crate", x: 8, y: 2, w: 1, h: 1, solid: true }, { t: "barrel", x: 8, y: 3, w: 1, h: 1, solid: true },
      { t: "logs", x: 7, y: 5, w: 2, h: 2, solid: true }
    ],
    npc: null,
    stations: [{ id: "woodlot", label: "Woodlot bench", prompt: "The woodlot bench: review your trees, learn planting, rest until morning", sx: 5, sy: 4, hit: { x: 3, y: 3, w: 4, h: 1 } }]
  },
  home: {
    name: "Your Homestead", w: 14, h: 10, exit: 7, floor: "plank", wall: "#9c7a52", wallTrim: "#f1e3c4", open: [0, 1440], owner: null, needsStage: 3,
    windows: [3, 10],
    objs: [
      { t: "rug", x: 4, y: 5, w: 6, h: 3, c: "#7a4a2a" },
      { t: "bed", x: 1, y: 2, w: 2, h: 2, solid: true },
      { t: "kitchen", x: 6, y: 2, w: 5, h: 1, solid: true },
      { t: "table", x: 6, y: 5, w: 3, h: 2, solid: true },
      { t: "plant", x: 12, y: 3, w: 1, h: 1, solid: true }, { t: "lamp", x: 4, y: 3, w: 1, h: 1, solid: true }
    ],
    npc: null,
    stations: [
      { id: "bed", label: "Bed", prompt: "Your bed: sleep until morning (restores energy, trees grow)", sx: 3, sy: 4, hit: { x: 1, y: 2, w: 2, h: 2 } },
      { id: "homestead", label: "Homestead plans", prompt: "Your plans table: build and upgrade your home", sx: 7, sy: 4, hit: { x: 6, y: 2, w: 5, h: 1 } }
    ]
  }
};
ACM.INTERIORS.legacy = {
  name: "The Family Kitchen", w: 14, h: 10, exit: 7, floor: "plank", wall: "#b08a5a", wallTrim: "#f1e3c4", open: [0, 1440], owner: null, needsLegacy: true,
  windows: [3, 10],
  objs: [
    { t: "rug", x: 4, y: 4, w: 6, h: 4, c: "#8a4a3a" },
    { t: "kitchen", x: 3, y: 2, w: 7, h: 1, solid: true },
    { t: "stove", x: 11, y: 2, w: 2, h: 1, solid: true },
    { t: "table", x: 5, y: 5, w: 3, h: 2, solid: true },
    { t: "shelf", x: 1, y: 2, w: 2, h: 1, items: "jars", solid: true, fix: "anchor_2_cafe" },
      { t: "frames", x: 4, y: 0, w: 4, h: 2, wall: true, fix: "side_2_frames" },
      { t: "butcher", x: 14, y: 2, w: 1, h: 1, solid: true, fix: "side_3_butcher" },
    { t: "plant", x: 12, y: 7, w: 1, h: 1, solid: true }, { t: "lamp", x: 10, y: 4, w: 1, h: 1, solid: true }
  ],
  npc: null,
  stations: [{ id: "nell_tea", label: "Nell's kettle", prompt: "Nell's kettle: sit a moment for a cup of tea (once a day)", sx: 6, sy: 4, hit: { x: 3, y: 2, w: 7, h: 1 } }]
};
ACM.INTERIOR_DOORS = { hardware: "hardware", sawmill: "sawmill", cafe: "cafe", school: "school", council: "council", ranger: "ranger", shed: "shed" };
