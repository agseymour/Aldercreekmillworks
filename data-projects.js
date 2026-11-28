window.ACM = window.ACM || {};

ACM.HOME_STAGES = [
  {
    stage: 1,
    name: "Stone Foundation & Timber Sill",
    cashCost: 75,
    lumberId: "spf_s4s",
    lumberUnits: 4,
    requiredTool: "framing_square",
    desc: "Square the perimeter with your Framing Square and lay pressure-treated sills."
  },
  {
    stage: 2,
    name: "Post-and-Beam Framing & Plank Walls",
    cashCost: 160,
    lumberId: "pine_s4s",
    lumberUnits: 6,
    requiredTool: "crosscut_saw",
    desc: "Raise heavy White Pine wall studs, headers, and rough plank sheathing."
  },
  {
    stage: 3,
    name: "Cedar Shingle Roof & Front Porch",
    cashCost: 290,
    lumberId: "cedar_s4s",
    lumberUnits: 6,
    requiredTool: "mitre_saw",
    desc: "Cut angled rafters and weatherproof the roof with aromatic Red Cedar shingles."
  },
  {
    stage: 4,
    name: "Hardwood Floors, Windows & Stone Hearth",
    cashCost: 480,
    lumberId: "hard_maple_rough",
    lumberUnits: 8,
    requiredTool: "planer",
    desc: "Mill tongue-and-groove Maple floorboards and trim out sunny multi-pane windows."
  },
  {
    stage: 5,
    name: "Master Craftsman's Veranda & Conservatory",
    cashCost: 820,
    lumberId: "walnut_rough",
    lumberUnits: 8,
    requiredTool: "band_saw",
    desc: "Complete your dream homestead with curved Walnut brackets (+15% bonus on all future payouts!)."
  }
];

ACM.PROJECTS = [
  // --- TIER 1 COMMISSIONS (BIRDHOUSE IS FIRST!) ---
  {
    id: "side_1_birdhouse",
    title: "Classic Songbird House",
    client: "Mrs. Gable (Orchard Neighbor)",
    tier: 1,
    desc: "A sloped-roof backyard chickadee house with drainage holes. You already have all the tools and pine boards needed to build this!",
    lumberReq: { allowedIds: ["pine_s4s", "cedar_s4s", "spf_s4s"], preferredId: "cedar_s4s", units: 2 },
    precisionDenom: 8,
    cuts: [
      { part: "Back Mounting Board", target: 11.375, display: "11 3/8\"" },
      { part: "Sloped Roof Panel", target: 7.625, display: "7 5/8\"" }
    ],
    workflow: ["tape_measure", "framing_square", "crosscut_saw", "hammer"],
    requiresPilotHole: false,
    basePay: 65,
    starGain: 0.3
  },
  {
    id: "side_1_tote",
    title: "Apprentice Carpenter's Tool Tote",
    client: "Mateo (Village Grocer)",
    tier: 1,
    desc: "A sturdy pine carry tote for hand tools with a comfortable dowel handle and nailed butt joints.",
    lumberReq: { allowedIds: ["pine_s4s", "spf_s4s", "cedar_s4s"], units: 2 },
    precisionDenom: 8,
    cuts: [
      { part: "Bottom Panel", target: 16.625, display: "16 5/8\"" },
      { part: "End Upright", target: 11.875, display: "11 7/8\"" }
    ],
    workflow: ["tape_measure", "framing_square", "crosscut_saw", "hammer"],
    requiresPilotHole: false,
    basePay: 75,
    starGain: 0.25
  },
  {
    id: "side_1_planter",
    title: "Cedar Herb & Strawberry Planter Box",
    client: "Clara (Harbor Café)",
    tier: 1,
    desc: "Raised patio planter box for fresh café herbs. Rot-resistant cedar and clean 90° crosscuts required.",
    lumberReq: { allowedIds: ["cedar_s4s", "spf_s4s", "pine_s4s"], preferredId: "cedar_s4s", units: 3 },
    precisionDenom: 8,
    cuts: [
      { part: "Long Side Slats", target: 22.375, display: "22 3/8\"" },
      { part: "Corner Post", target: 14.125, display: "14 1/8\"" }
    ],
    workflow: ["tape_measure", "framing_square", "crosscut_saw", "hammer"],
    requiresPilotHole: false,
    basePay: 95,
    starGain: 0.3
  },
  {
    id: "anchor_1_kiosk",
    title: "Cape Split Trailhead Map Kiosk",
    client: "Ranger MacLeod (Parks)",
    tier: 1,
    desc: "Outdoor trail map frame for Cape Split trailhead. Requires pilot holes so screws don't split the posts.",
    lumberReq: { allowedIds: ["cedar_s4s", "spf_s4s", "pine_s4s"], preferredId: "cedar_s4s", units: 3 },
    precisionDenom: 8,
    cuts: [
      { part: "Header Beam", target: 24.375, display: "24 3/8\"" },
      { part: "Side Post", target: 18.875, display: "18 7/8\"" }
    ],
    workflow: ["tape_measure", "framing_square", "crosscut_saw", "cordless_drill", "screwdriver"],
    requiresPilotHole: true,
    basePay: 135,
    starGain: 0.45,
    choice: {
      prompt: "Ranger MacLeod asks how you sealed the joints against Bay of Fundy fog:",
      optionA: {
        label: "Apply exterior marine spar varnish (-$15 cost, +0.25★ reputation)",
        cashDelta: -15,
        starDelta: 0.25,
        note: "MacLeod praises your weatherproofing across town!"
      },
      optionB: {
        label: "Leave raw to save supply money (+$0 cost, -0.10★ reputation)",
        cashDelta: 0,
        starDelta: -0.1,
        note: "You kept the profit, though the boards swell slightly after the first storm."
      }
    }
  },

  // --- TIER 2 COMMISSIONS ---
  {
    id: "side_2_frames",
    title: "45° Mitred Gallery Picture Frames",
    client: "Clara (Harbor Café)",
    tier: 2,
    desc: "Set of oak display frames for local photography. Demands crisp 45° mitres and 1/16\" accuracy.",
    lumberReq: { allowedIds: ["red_oak_s4s", "poplar_s4s"], units: 2 },
    precisionDenom: 16,
    cuts: [
      { part: "Long Mitre Rail", target: 14.3125, display: "14 5/16\"" },
      { part: "Short Mitre Stile", target: 10.6875, display: "10 11/16\"" }
    ],
    workflow: ["tape_measure", "mitre_saw", "back_saw", "hammer"],
    requiresPilotHole: false,
    basePay: 155,
    starGain: 0.3
  },
  {
    id: "side_2_bookshelf",
    title: "3-Tier Cottage Bookcase",
    client: "Dr. Alverez (Schoolhouse)",
    tier: 2,
    desc: "Compact classroom reading shelf built from Poplar or Baltic Birch plywood.",
    lumberReq: { allowedIds: ["poplar_s4s", "birch_ply", "red_oak_s4s"], units: 3 },
    precisionDenom: 16,
    cuts: [
      { part: "Vertical Side Gable", target: 32.1875, display: "32 3/16\"" },
      { part: "Fixed Shelf", target: 23.8125, display: "23 13/16\"" }
    ],
    workflow: ["tape_measure", "framing_square", "mitre_saw", "cordless_drill", "screwdriver"],
    requiresPilotHole: true,
    basePay: 185,
    starGain: 0.35
  },
  {
    id: "anchor_2_cafe",
    title: "Harbor Café Pastry & Merch Shelving",
    client: "Clara (Harbor Café)",
    tier: 2,
    desc: "Wall-mounted Baltic Birch and Oak display rack with back-saw shoulder joinery and square carcass assembly.",
    lumberReq: { allowedIds: ["birch_ply", "red_oak_s4s"], preferredId: "birch_ply", units: 3 },
    precisionDenom: 16,
    cuts: [
      { part: "Shelf Carcass", target: 28.5625, display: "28 9/16\"" },
      { part: "Cleat Brace", target: 15.1875, display: "15 3/16\"" }
    ],
    workflow: ["tape_measure", "framing_square", "mitre_saw", "back_saw", "cordless_drill", "screwdriver"],
    requiresPilotHole: true,
    basePay: 250,
    starGain: 0.5,
    choice: {
      prompt: "Clara offers a $50 rush bonus if you deliver tonight—skipping final hand-sanding:",
      optionA: {
        label: "Decline rush and hand-sand all edges (+0.25★ quality bonus)",
        cashDelta: 0,
        starDelta: 0.25,
        note: "Customers run their hands over the silky-smooth edges. Five-star word of mouth!"
      },
      optionB: {
        label: "Take the $50 rush bonus and deliver immediately (+$50, -0.15★)",
        cashDelta: 50,
        starDelta: -0.15,
        note: "Fast cash in the register, though Clara notices minor fuzz on the birch edges."
      }
    }
  },

  // --- TIER 3 COMMISSIONS ---
  {
    id: "side_3_butcher",
    title: "Hard Maple Edge-Grain Prep Block",
    client: "Harbor Bistro",
    tier: 3,
    desc: "Mill rough-sawn Hard Maple into flat, square strips and rip to exact width on the table saw.",
    lumberReq: { allowedIds: ["hard_maple_rough"], units: 3 },
    precisionDenom: 16,
    cuts: [
      { part: "Milled Maple Stave", target: 18.8125, display: "18 13/16\"" },
      { part: "End Trim Strip", target: 12.4375, display: "12 7/16\"" }
    ],
    workflow: ["tape_measure", "jointer", "planer", "table_saw", "mitre_saw"],
    requiresPilotHole: false,
    basePay: 320,
    starGain: 0.35
  },
  {
    id: "side_3_nightstand",
    title: "Shaker Cherry Bedside Table",
    client: "Seymour (Hardware Shop)",
    tier: 3,
    desc: "Seymour wants a solid Black Cherry nightstand with dadoed drawer runners and tapered legs.",
    lumberReq: { allowedIds: ["cherry_rough", "hard_maple_rough"], preferredId: "cherry_rough", units: 4 },
    precisionDenom: 16,
    cuts: [
      { part: "Tabletop Plank", target: 20.375, display: "20 3/8\"" },
      { part: "Drawer Front", target: 14.625, display: "14 5/8\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "mitre_saw", "cordless_drill"],
    requiresPilotHole: true,
    basePay: 380,
    starGain: 0.4
  },
  {
    id: "anchor_3_square",
    title: "Town Square Commemorative Bench",
    client: "Alder Creek Council",
    tier: 3,
    desc: "Heavy-duty public bench milled from rough Cherry or Reclaimed Hemlock. Full S4S milling and table saw ripping required.",
    lumberReq: { allowedIds: ["cherry_rough", "reclaimed_barn", "hard_maple_rough"], units: 4 },
    precisionDenom: 16,
    cuts: [
      { part: "Seat Plank", target: 42.625, display: "42 5/8\"" },
      { part: "Mortised Stretcher", target: 16.9375, display: "16 15/16\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "mitre_saw", "cordless_drill"],
    requiresPilotHole: true,
    basePay: 440,
    starGain: 0.55,
    choice: {
      prompt: "The Town Council asks you to engrave the town crest on the backrest:",
      optionA: {
        label: "Spend extra shop hours hand-fitting the crest (+0.25★ civic pride)",
        cashDelta: -20,
        starDelta: 0.25,
        note: "The bench becomes the most photographed spot in Alder Creek."
      },
      optionB: {
        label: "Keep the clean minimalist slats (+$35 saved labor)",
        cashDelta: 35,
        starDelta: 0.05,
        note: "Clean, sturdy, and right on budget."
      }
    }
  },

  {
    id: "boat_rowboat",
    boat: true,
    title: "Cedar Row Boat",
    client: "Captain Doucet",
    tier: 3,
    desc: "Captain Doucet wants a sturdy little row boat, launched from the dock on the river. Cedar planks, a square transom, and tight joints that keep the water out. Where the river leads, nobody in Alder Creek will say.",
    lumberReq: { allowedIds: ["cedar_s4s", "pine_s4s", "cherry_rough"], preferredId: "cedar_s4s", units: 6 },
    precisionDenom: 16,
    cuts: [
      { part: "Side Plank", target: 71.4375, display: "71 7/16\"" },
      { part: "Transom Board", target: 34.8125, display: "34 13/16\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "mitre_saw", "cordless_drill"],
    requiresPilotHole: true,
    basePay: 520,
    starGain: 0.5
  },
  // --- TIER 4 COMMISSIONS ---
  {
    id: "side_4_rocker",
    title: "Curved White Oak Rocker Runners",
    client: "Captain Doucet",
    tier: 4,
    desc: "Resaw and cut matching curved White Oak runners on the band saw to 1/32\" accuracy.",
    lumberReq: { allowedIds: ["white_oak_rough", "walnut_rough"], units: 3 },
    precisionDenom: 32,
    cuts: [
      { part: "Curved Runner Blank", target: 31.46875, display: "31 15/32\"" },
      { part: "Back Slat", target: 19.28125, display: "19 9/32\"" }
    ],
    workflow: ["tape_measure", "jointer", "planer", "band_saw", "back_saw"],
    requiresPilotHole: true,
    basePay: 490,
    starGain: 0.4
  },
  {
    id: "side_4_coffeetable",
    title: "Black Walnut Live-Edge Coffee Table",
    client: "Routledge (Sawmill Owner)",
    tier: 4,
    desc: "Routledge saved his best slab of Black Walnut for a low-profile living room table with arched stretchers.",
    lumberReq: { allowedIds: ["walnut_rough", "white_oak_rough"], preferredId: "walnut_rough", units: 4 },
    precisionDenom: 32,
    cuts: [
      { part: "Bookmatched Top", target: 40.21875, display: "40 7/32\"" },
      { part: "Arched Apron", target: 28.84375, display: "28 27/32\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "band_saw", "screwdriver"],
    requiresPilotHole: true,
    basePay: 560,
    starGain: 0.45
  },
  {
    id: "anchor_4_lighthouse",
    title: "Lighthouse Keeper's Archival Table",
    client: "Historical Society",
    tier: 4,
    desc: "Period-accurate White Oak & Walnut council table with band-sawn arched aprons and 1/32\" joinery.",
    lumberReq: { allowedIds: ["white_oak_rough", "walnut_rough"], preferredId: "white_oak_rough", units: 5 },
    precisionDenom: 32,
    cuts: [
      { part: "Breadboard End", target: 36.71875, display: "36 23/32\"" },
      { part: "Arched Apron Rail", target: 27.15625, display: "27 5/32\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "band_saw", "back_saw", "screwdriver"],
    requiresPilotHole: true,
    basePay: 660,
    starGain: 0.6,
    choice: {
      prompt: "A summer estate owner offers $120 to delay the museum table by a day for a quick patio repair:",
      optionA: {
        label: "Honor the Historical Society deadline first (+0.30★ integrity)",
        cashDelta: 0,
        starDelta: 0.3,
        note: "The museum curator recommends your shop across the entire county!"
      },
      optionB: {
        label: "Take the side cash (+$120, -0.20★ museum delay)",
        cashDelta: 120,
        starDelta: -0.2,
        note: "Your bank account swells, though the Historical Society grumbles about the delay."
      }
    }
  },

  // --- TIER 5 COMMISSION ---
  {
    id: "anchor_5_centennial",
    title: "Centennial Hall Display Case & Lectern",
    client: "Centennial Restoration Committee",
    tier: 5,
    desc: "Heirloom Curly Maple & Walnut casework with resawn bookmatched panels and 1/64\" Japanese pull-saw dovetails.",
    lumberReq: { allowedIds: ["figured_maple_rough", "walnut_rough"], preferredId: "figured_maple_rough", units: 6 },
    precisionDenom: 64,
    cuts: [
      { part: "Dovetail Case Side", target: 38.265625, display: "38 17/64\"" },
      { part: "Mullion Stile", target: 22.640625, display: "22 41/64\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "band_saw", "japanese_back_saw", "screwdriver"],
    requiresPilotHole: true,
    basePay: 1150,
    starGain: 0.8
  }
];
