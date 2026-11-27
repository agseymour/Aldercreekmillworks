window.ACM = window.ACM || {};

ACM.TOOLS = [
  // --- STARTER TOOLKIT (READY FOR BIRDHOUSE & WOODLOT) ---
  {
    id: "tape_measure",
    name: "16' Fractional Tape Measure",
    category: "tool",
    tier: 1,
    price: 0,
    starter: true,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "Essential layout tool with a sliding hook that compensates for its own thickness on inside and outside measurements.",
    curriculumNote: "Always verify the sliding hook rivet isn't bent before laying out joinery."
  },
  {
    id: "framing_square",
    name: "Steel Framing Square",
    category: "tool",
    tier: 1,
    price: 0,
    starter: true,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "L-shaped steel square (24\" blade × 16\" tongue) for marking 90° crosscuts, roof pitches, and checking diagonal squareness.",
    curriculumNote: "Equal diagonal corner-to-corner measurements prove a rectangular box is square."
  },
  {
    id: "crosscut_saw",
    name: "Hand Cross Cut Saw",
    category: "tool",
    tier: 1,
    price: 0,
    starter: true,
    maxDurability: 18,
    sharpenCost: 10,
    requiresSafety: ["safety_glasses"],
    desc: "Bevel-filed teeth act like tiny knives to sever wood fibers cleanly across the grain.",
    curriculumNote: "Start with short pull strokes using your thumb knuckle as a guide, then cut on the push stroke."
  },
  {
    id: "hammer",
    name: "16 oz Curved-Claw Hammer",
    category: "tool",
    tier: 1,
    price: 0,
    starter: true,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: ["safety_glasses"],
    desc: "Drives finish nails and taps dry-fit joints together when paired with a protective wood scrap block.",
    curriculumNote: "Never strike finished hardwood directly with a steel hammer face—use a scrap block or mallet."
  },
  {
    id: "safety_glasses",
    name: "CSA Z94.3 Safety Glasses",
    category: "safety",
    tier: 1,
    price: 0,
    starter: true,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "Impact-rated side-shield eye protection required for every cutting, drilling, and striking operation.",
    curriculumNote: "Mandatory in all Nova Scotia school production labs."
  },
  {
    id: "felling_axe",
    name: "Forestry Felling Axe & Bucksaw",
    category: "forestry",
    tier: 1,
    price: 0,
    starter: true,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: ["safety_glasses"],
    desc: "Used in your Woodlot to fell mature planted trees and buck logs into rough-sawn lumber.",
    curriculumNote: "Plan an escape path at 45° away from the felling direction before making the back cut."
  },

  // --- TIER 1 PURCHASABLE TOOLS ---
  {
    id: "screwdriver",
    name: "Robertson & Slot Screwdriver Set",
    category: "tool",
    tier: 1,
    price: 18,
    starter: false,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "Canadian-invented Robertson square-drive and slotted drivers for controlled final hardware installation.",
    curriculumNote: "Hand-drive brass hinges and delicate hardware so a power drill doesn't strip screw heads."
  },
  {
    id: "cordless_drill",
    name: "18V Cordless Drill & Bit Index",
    category: "tool",
    tier: 1,
    price: 55,
    starter: false,
    maxDurability: 18,
    sharpenCost: 12,
    requiresSafety: ["safety_glasses"],
    desc: "Bores clean twist/Forstner holes and drills pilot holes to prevent screws from splitting boards.",
    curriculumNote: "Always drill pilot holes near board ends in hardwoods like Oak and Maple."
  },

  // --- TIER 2 TOOLS ---
  {
    id: "mitre_saw",
    name: "12\" Sliding Compound Mitre Saw",
    category: "tool",
    tier: 2,
    price: 180,
    starter: false,
    maxDurability: 22,
    sharpenCost: 22,
    requiresSafety: ["safety_glasses", "ear_muffs"],
    desc: "Makes rapid, dead-accurate 90° crosscuts and 45° mitre cuts for frames, trim, and furniture rails.",
    curriculumNote: "Keep hands at least 6 inches from the blade and wait for the blade to stop completely before lifting."
  },
  {
    id: "back_saw",
    name: "Western Brass-Spine Back Saw",
    category: "tool",
    tier: 2,
    price: 45,
    starter: false,
    maxDurability: 16,
    sharpenCost: 12,
    requiresSafety: ["safety_glasses"],
    desc: "Rigid brass spine prevents blade flex during precision tenon shoulder and miter-box joinery cuts.",
    curriculumNote: "Cuts on the push stroke; let the weight of the spine guide a straight kerf."
  },

  // --- TIER 3 STATIONARY MILLWORK ---
  {
    id: "jointer",
    name: "8\" Helical-Head Jointer",
    category: "tool",
    tier: 3,
    price: 390,
    starter: false,
    maxDurability: 25,
    sharpenCost: 35,
    requiresSafety: ["safety_glasses", "ear_muffs", "push_blocks"],
    desc: "Flattens one face of rough-sawn lumber (including trees harvested from your Woodlot!) and squares one edge to 90°.",
    curriculumNote: "Step 1 of S4S milling: always flatten a face on the jointer BEFORE using the thickness planer."
  },
  {
    id: "planer",
    name: "15\" Thickness Planer",
    category: "tool",
    tier: 3,
    price: 375,
    starter: false,
    maxDurability: 25,
    sharpenCost: 35,
    requiresSafety: ["safety_glasses", "ear_muffs"],
    desc: "Planes the opposite face parallel to the jointed reference face to bring rough boards to uniform thickness.",
    curriculumNote: "Take light passes (1/16\" max) and never stand directly behind the board in case of kickback."
  },
  {
    id: "table_saw",
    name: "3HP Cabinet Table Saw",
    category: "tool",
    tier: 3,
    price: 490,
    starter: false,
    maxDurability: 28,
    sharpenCost: 30,
    requiresSafety: ["safety_glasses", "ear_muffs", "push_blocks", "riving_knife"],
    desc: "Rips lumber to exact width against the rip fence and cuts crisp dadoes and rabbets.",
    curriculumNote: "Never use the rip fence and mitre gauge together without a clearance block—trapped offcuts cause kickback."
  },

  // --- TIER 4 & 5 SPECIALTY TOOLS ---
  {
    id: "band_saw",
    name: "14\" Cast-Iron Band Saw",
    category: "tool",
    tier: 4,
    price: 450,
    starter: false,
    maxDurability: 24,
    sharpenCost: 25,
    requiresSafety: ["safety_glasses", "ear_muffs"],
    desc: "Continuous loop blade cuts smooth curves, chair rockers, and resaws thick planks into bookmatched panels.",
    curriculumNote: "Set the upper blade guide 1/4\" above the workpiece and make relief cuts on tight curves."
  },
  {
    id: "japanese_back_saw",
    name: "Japanese Dozuki Pull Back Saw",
    category: "tool",
    tier: 5,
    price: 85,
    starter: false,
    maxDurability: 14,
    sharpenCost: 20,
    requiresSafety: ["safety_glasses"],
    desc: "Ultra-thin 0.3mm impulse-hardened blade cuts on the pull stroke for 1/64\" dovetail and heirloom precision.",
    curriculumNote: "Pull-stroke tension keeps the thin blade straight—never force or twist it mid-cut or it will snap."
  },

  // --- SAFETY GEAR & SHOP UPGRADES ---
  {
    id: "ear_muffs",
    name: "NRR 28dB Hearing Protection",
    category: "safety",
    tier: 2,
    price: 22,
    starter: false,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "Protects hearing from high-decibel power saws, planers, and jointers.",
    curriculumNote: "Required before operating any power or stationary woodworking machine."
  },
  {
    id: "push_blocks",
    name: "High-Friction Push Blocks & Sticks",
    category: "safety",
    tier: 2,
    price: 28,
    starter: false,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "Keeps hands safely away from spinning jointer cutterheads and table saw blades while controlling feed pressure.",
    curriculumNote: "Mandatory for jointing faces and ripping narrow stock on the table saw."
  },
  {
    id: "riving_knife",
    name: "Table Saw Riving Knife & Guard",
    category: "safety",
    tier: 3,
    price: 45,
    starter: false,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "Rides directly behind the table saw blade to prevent internal wood stress from pinching the blade and causing kickback.",
    curriculumNote: "Must match the kerf thickness of your table saw blade."
  },
  {
    id: "fire_extinguisher",
    name: "Class ABC Shop Fire Extinguisher",
    category: "safety",
    tier: 3,
    price: 60,
    starter: false,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "Wall-mounted ABC extinguisher that prevents fine sawdust fires from gutting your workshop.",
    curriculumNote: "Fine wood dust suspended in air or near overheated bearings is a serious fire hazard."
  },
  {
    id: "dust_collector",
    name: "2HP Cyclone Dust Collector",
    category: "safety",
    tier: 4,
    price: 340,
    starter: false,
    maxDurability: 999,
    sharpenCost: 0,
    requiresSafety: [],
    desc: "Captures 99% of fine sawdust at the machine source, keeping your Sawdust Hazard Meter near zero.",
    curriculumNote: "Improves air quality and drastically reduces shop fire risk."
  }
];
