window.ACM = window.ACM || {};

ACM.STORY_ACTS = [
  {
    act: 1,
    title: "Act I: Sweeping Out the Sawdust",
    requiredStars: 1.0,
    anchorId: "anchor_1_kiosk",
    mentorNote: "Arthur: 'Welcome to Alder Creek. Start with the basics—measure twice, wear your safety glasses, and prove to the town you can cut straight.'",
    summary: "Earn startup cash at the Blueprint Desk, equip basic hand tools, and build the Trailhead Kiosk for Ranger MacLeod."
  },
  {
    act: 2,
    title: "Act II: Word Around Town",
    requiredStars: 2.0,
    anchorId: "anchor_2_cafe",
    mentorNote: "Arthur: 'Shopkeepers are asking for cleaner mitres and stronger joints. Time to invest in a mitre saw and a rigid back saw.'",
    summary: "Pass the Tier 2 Certification Exam and build Clara's Harbor Café Pastry Display with 45° mitres to 1/16\" tolerance."
  },
  {
    act: 3,
    title: "Act III: Going Commercial",
    requiredStars: 3.0,
    anchorId: "anchor_3_square",
    mentorNote: "Arthur: 'Buying S4S lumber eats your profit. Outfit the shop with a jointer, planer, and table saw—and don't skip the fire extinguisher!'",
    summary: "Mill rough-sawn lumber in proper S4S sequence and construct the Town Square Bench."
  },
  {
    act: 4,
    title: "Act IV: The Heritage Restoration",
    requiredStars: 4.0,
    anchorId: "anchor_4_lighthouse",
    mentorNote: "Arthur: 'The Historical Society wants curved boat-rib bracing and mortise-and-tenon joinery that handles coastal humidity.'",
    summary: "Use the band saw and framing square to craft the Alder Creek Lighthouse Archival Table."
  },
  {
    act: 5,
    title: "Act V: The Centennial Masterpiece",
    requiredStars: 5.0,
    anchorId: "anchor_5_centennial",
    mentorNote: "Arthur: 'The whole town is watching Centennial Hall. Break out the Japanese pull saw and hold 1/64\" tolerances.'",
    summary: "Build the Centennial Hall Heirloom Display Case & Lectern to cement your shop's legacy."
  }
];

ACM.PROJECTS = [
  // --- ACT I ---
  {
    id: "side_1_tote",
    title: "Apprentice Carpenter's Tool Tote",
    client: "Mateo (Local Grocer)",
    tier: 1,
    isAnchor: false,
    actNumber: 1,
    desc: "A sturdy pine carry tote for hand tools. Requires clean 90° crosscuts and nailed butt joints.",
    lumberReq: { allowedIds: ["pine_s4s", "spf_s4s", "cedar_s4s"], units: 2 },
    precisionDenom: 8,
    cuts: [
      { part: "Bottom Panel", target: 16.5, display: "16 1/2\"" },
      { part: "End Upright", target: 11.25, display: "11 1/4\"" }
    ],
    workflow: ["tape_measure", "framing_square", "crosscut_saw", "hammer"],
    requiresPilotHole: false,
    basePay: 65,
    starGain: 0.25
  },
  {
    id: "anchor_1_kiosk",
    title: "Trailhead Information Kiosk",
    client: "Ranger MacLeod (Parks)",
    tier: 1,
    isAnchor: true,
    actNumber: 1,
    desc: "Outdoor trail map frame for Cape Split trailhead. Must withstand coastal rain and hold 1/8\" layout accuracy.",
    lumberReq: { allowedIds: ["cedar_s4s", "spf_s4s", "pine_s4s"], preferredId: "cedar_s4s", units: 3 },
    precisionDenom: 8,
    cuts: [
      { part: "Header Beam", target: 24.375, display: "24 3/8\"" },
      { part: "Side Post", target: 18.75, display: "18 3/4\"" }
    ],
    workflow: ["tape_measure", "framing_square", "crosscut_saw", "cordless_drill", "screwdriver"],
    requiresPilotHole: true,
    basePay: 120,
    starGain: 0.55,
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

  // --- ACT II ---
  {
    id: "side_2_frames",
    title: "45° Mitred Gallery Picture Frames",
    client: "Clara (Harbor Café)",
    tier: 2,
    isAnchor: false,
    actNumber: 2,
    desc: "Set of oak display frames for local photography. Demands crisp 45° mitres and 1/16\" accuracy.",
    lumberReq: { allowedIds: ["red_oak_s4s", "poplar_s4s"], units: 2 },
    precisionDenom: 16,
    cuts: [
      { part: "Long Mitre Rail", target: 14.3125, display: "14 5/16\"" },
      { part: "Short Mitre Stile", target: 10.6875, display: "10 11/16\"" }
    ],
    workflow: ["tape_measure", "mitre_saw", "back_saw", "hammer"],
    requiresPilotHole: false,
    basePay: 145,
    starGain: 0.3
  },
  {
    id: "anchor_2_cafe",
    title: "Harbor Café Pastry & Merch Shelving",
    client: "Clara (Harbor Café)",
    tier: 2,
    isAnchor: true,
    actNumber: 2,
    desc: "Wall-mounted Baltic Birch and Oak display rack. Requires mitre cuts, back-saw shoulder joinery, and square assembly.",
    lumberReq: { allowedIds: ["birch_ply", "red_oak_s4s"], preferredId: "birch_ply", units: 3 },
    precisionDenom: 16,
    cuts: [
      { part: "Shelf Carcass", target: 28.5625, display: "28 9/16\"" },
      { part: "Cleat Brace", target: 15.1875, display: "15 3/16\"" }
    ],
    workflow: ["tape_measure", "framing_square", "mitre_saw", "back_saw", "cordless_drill", "screwdriver"],
    requiresPilotHole: true,
    basePay: 240,
    starGain: 0.6,
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

  // --- ACT III ---
  {
    id: "side_3_butcher",
    title: "Hard Maple Edge-Grain Prep Block",
    client: "Harbor Bistro",
    tier: 3,
    isAnchor: false,
    actNumber: 3,
    desc: "Mill rough-sawn Hard Maple into flat, square strips and rip to exact width on the table saw.",
    lumberReq: { allowedIds: ["hard_maple_rough"], units: 3 },
    precisionDenom: 16,
    cuts: [
      { part: "Milled Maple Stave", target: 18.8125, display: "18 13/16\"" },
      { part: "End Trim Strip", target: 12.4375, display: "12 7/16\"" }
    ],
    workflow: ["tape_measure", "jointer", "planer", "table_saw", "mitre_saw"],
    requiresPilotHole: false,
    basePay: 310,
    starGain: 0.35
  },
  {
    id: "anchor_3_square",
    title: "Town Square Commemorative Bench",
    client: "Alder Creek Council",
    tier: 3,
    isAnchor: true,
    actNumber: 3,
    desc: "Heavy-duty public bench milled from rough Cherry or Reclaimed Hemlock. Full S4S milling and table saw ripping required.",
    lumberReq: { allowedIds: ["cherry_rough", "reclaimed_barn", "hard_maple_rough"], units: 4 },
    precisionDenom: 16,
    cuts: [
      { part: "Seat Plank", target: 42.625, display: "42 5/8\"" },
      { part: "Mortised Stretcher", target: 16.9375, display: "16 15/16\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "mitre_saw", "cordless_drill"],
    requiresPilotHole: true,
    basePay: 420,
    starGain: 0.65,
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

  // --- ACT IV ---
  {
    id: "side_4_rocker",
    title: "Steam-Bent Style Curved Rocker Runners",
    client: "Captain Doucet",
    tier: 4,
    isAnchor: false,
    actNumber: 4,
    desc: "Resaw and cut matching curved White Oak runners on the band saw to 1/32\" accuracy.",
    lumberReq: { allowedIds: ["white_oak_rough", "walnut_rough"], units: 3 },
    precisionDenom: 32,
    cuts: [
      { part: "Curved Runner Blank", target: 31.46875, display: "31 15/32\"" },
      { part: "Back Slat", target: 19.28125, display: "19 9/32\"" }
    ],
    workflow: ["tape_measure", "jointer", "planer", "band_saw", "back_saw"],
    requiresPilotHole: true,
    basePay: 480,
    starGain: 0.4
  },
  {
    id: "anchor_4_lighthouse",
    title: "Lighthouse Keeper's Archival Table",
    client: "Historical Society",
    tier: 4,
    isAnchor: true,
    actNumber: 4,
    desc: "Period-accurate White Oak & Walnut council table with band-sawn arched aprons and 1/32\" joinery.",
    lumberReq: { allowedIds: ["white_oak_rough", "walnut_rough"], preferredId: "white_oak_rough", units: 5 },
    precisionDenom: 32,
    cuts: [
      { part: "Breadboard End", target: 36.71875, display: "36 23/32\"" },
      { part: "Arched Apron Rail", target: 27.15625, display: "27 5/32\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "band_saw", "back_saw", "screwdriver"],
    requiresPilotHole: true,
    basePay: 640,
    starGain: 0.7,
    choice: {
      prompt: "A summer estate owner offers $120 to delay the museum table by a day for a quick patio repair:",
      optionA: {
        label: "Honor the Historical Society deadline first (+0.30★ integrity)",
        cashDelta: 0,
        starDelta: 0.3,
        note: "The museum curator recommends your shop for the Centennial Hall bid!"
      },
      optionB: {
        label: "Take the side cash (+$120, -0.20★ museum delay)",
        cashDelta: 120,
        starDelta: -0.2,
        note: "Your bank account swells, though the Historical Society grumbles about the delay."
      }
    }
  },

  // --- ACT V ---
  {
    id: "anchor_5_centennial",
    title: "Centennial Hall Display Case & Lectern",
    client: "Centennial Restoration Committee",
    tier: 5,
    isAnchor: true,
    actNumber: 5,
    desc: "The town's crown jewel: Curly Maple & Walnut casework with resawn bookmatched panels and 1/64\" Japanese pull-saw joinery.",
    lumberReq: { allowedIds: ["figured_maple_rough", "walnut_rough"], preferredId: "figured_maple_rough", units: 6 },
    precisionDenom: 64,
    cuts: [
      { part: "Dovetail Case Side", target: 38.265625, display: "38 17/64\"" },
      { part: "Mullion Stile", target: 22.640625, display: "22 41/64\"" }
    ],
    workflow: ["tape_measure", "framing_square", "jointer", "planer", "table_saw", "band_saw", "japanese_back_saw", "screwdriver"],
    requiresPilotHole: true,
    basePay: 1100,
    starGain: 0.85,
    choice: {
      prompt: "Arthur attends the unveiling and asks you to sign the underside of the lectern:",
      optionA: {
        label: "Dedicate the plaque to Arthur's mentorship (+0.25★ town legend)",
        cashDelta: 0,
        starDelta: 0.25,
        note: "Arthur beams with pride as Alder Creek cheers your shop's grand opening!"
      },
      optionB: {
        label: "Stamp your commercial brand & catalog number (+$100 new orders)",
        cashDelta: 100,
        starDelta: 0.1,
        note: "Regional buyers immediately place orders for custom millwork."
      }
    }
  }
];
