window.ACM = window.ACM || {};

ACM.QUESTIONS = [
  // --- TIER 1 (FOUNDATIONS, SAFETY, BASIC TOOLS & FASTENERS) ---
  {
    id: "q_t1_1",
    tier: 1,
    category: "Visual ID: Fasteners",
    diagram: "fastener_wood_screw",
    prompt: "Identify this fastener, which features an unthreaded upper shank to pull two boards tightly together:",
    options: [
      "Flat-head wood screw",
      "Carriage bolt",
      "Drywall nail",
      "Lag shield anchor"
    ],
    answerIndex: 0,
    explanation: "The smooth upper shank lets the screw spin freely in the top board while the threads bite into the bottom board, clamping them tight."
  },
  {
    id: "q_t1_2",
    tier: 1,
    category: "Visual ID: Fasteners",
    diagram: "fastener_carriage_bolt",
    prompt: "What is this domed-head fastener with a square neck underneath designed to lock into wood as the nut is tightened?",
    options: [
      "Machine screw",
      "Carriage bolt",
      "Finish nail",
      "Pocket-hole screw"
    ],
    answerIndex: 1,
    explanation: "The square neck under the smooth rounded head embeds into the wood so you only need one wrench on the nut side."
  },
  {
    id: "q_t1_3",
    tier: 1,
    category: "Tools & Layout",
    diagram: "tool_framing_square",
    prompt: "Besides marking 90° lines, how do woodworkers use a framing square to verify that an assembled cabinet box is truly square?",
    options: [
      "Measure the two opposite corner-to-corner diagonals to verify they are equal",
      "Tap the corners with the steel blade until they dent",
      "Check the moisture content of the wood fibers",
      "Measure the blade kerf thickness"
    ],
    answerIndex: 0,
    explanation: "If opposite sides are equal and both diagonals measure the exact same length, every corner is 90°."
  },
  {
    id: "q_t1_4",
    tier: 1,
    category: "Tape Measure Accuracy",
    prompt: "Why does the metal hook at the end of a standard tape measure slide back and forth by about 1/16 of an inch?",
    options: [
      "It is worn out and needs to be glued down",
      "It automatically compensates for the thickness of the hook between inside and outside measurements",
      "It accounts for the width of a pencil line",
      "It measures metric millimeters on the back"
    ],
    answerIndex: 1,
    explanation: "When hooked over an edge (outside pull), it slides out by its thickness; when pushed against a wall (inside push), it slides in."
  },
  {
    id: "q_t1_5",
    tier: 1,
    category: "Wood Properties",
    prompt: "Which softwood is naturally rich in aromatic oils, making it ideal for outdoor planters and trail signs in Nova Scotia?",
    options: [
      "Eastern Red Cedar",
      "MDF (Medium-Density Fiberboard)",
      "Tulip Poplar",
      "Hard Maple"
    ],
    answerIndex: 0,
    explanation: "Cedar contains natural thujaplicins (oils) that resist moisture decay and insects without chemical pressure treatment."
  },
  {
    id: "q_t1_6",
    tier: 1,
    category: "Shop Safety",
    prompt: "Why must you drill a pilot hole before driving a wood screw near the end of a solid oak board?",
    options: [
      "To make the screw rust faster",
      "To prevent the screw wedging the wood fibers apart and splitting the board",
      "To cool down the screwdriver",
      "To remove sap from the grain"
    ],
    answerIndex: 1,
    explanation: "Solid wood splits easily along the grain near board ends unless a pilot hole clears space for the screw core."
  },

  // --- TIER 2 (JOINERY, MITRES, HAND SAWS) ---
  {
    id: "q_t2_1",
    tier: 2,
    category: "Visual ID: Joinery",
    diagram: "joint_dado",
    prompt: "Identify this three-sided channel cut ACROSS the wood grain to house a cabinet shelf:",
    options: [
      "Dado joint",
      "Rabbet joint",
      "Lap joint",
      "Finger joint"
    ],
    answerIndex: 0,
    explanation: "A dado runs across the grain (a groove runs parallel with the grain) and supports heavy shelf loads mechanically."
  },
  {
    id: "q_t2_2",
    tier: 2,
    category: "Visual ID: Joinery",
    diagram: "joint_rabbet",
    prompt: "What is this L-shaped recess cut along the EDGE or END of a board, commonly used to recess a cabinet back panel?",
    options: [
      "Through dovetail",
      "Rabbet joint",
      "Mortise and tenon",
      "Bridle joint"
    ],
    answerIndex: 1,
    explanation: "A rabbet is a two-sided step cut along the perimeter of a board."
  },
  {
    id: "q_t2_3",
    tier: 2,
    category: "Visual ID: Tools",
    diagram: "tool_back_saw",
    prompt: "Why does a Western back saw (tenon saw) have a thick brass or steel strip folded along its top edge?",
    options: [
      "To keep the thin blade rigid and straight during precision push-stroke joinery cuts",
      "To act as a magnetic nail holder",
      "To cut metal pipes",
      "To measure 45° angles"
    ],
    answerIndex: 0,
    explanation: "The heavy spine prevents the blade from buckling on the push stroke, keeping tenon shoulders dead straight."
  },
  {
    id: "q_t2_4",
    tier: 2,
    category: "Visual ID: Fasteners",
    diagram: "fastener_pocket_screw",
    prompt: "Identify this washer-head, coarse-thread screw designed to seat inside an angled 15° jig hole without splitting:",
    options: [
      "Pocket-hole screw",
      "Finish brad",
      "Lag bolt",
      "Drywall screw"
    ],
    answerIndex: 0,
    explanation: "The flat washer head seats squarely at the bottom of a pocket hole rather than acting like a wedge like a countersunk bugle head."
  },
  {
    id: "q_t2_5",
    tier: 2,
    category: "Materials & Sheet Goods",
    prompt: "Why is Baltic Birch plywood preferred over solid wide boards for large cabinet carcasses?",
    options: [
      "Cross-banded plies minimize seasonal expansion and contraction across humidity changes",
      "It never needs sanding",
      "It is lighter than balsa wood",
      "It can be bent into tight circles dry"
    ],
    answerIndex: 0,
    explanation: "Alternating grain directions in plywood veneers stabilize the panel against seasonal swelling and shrinking."
  },
  {
    id: "q_t2_6",
    tier: 2,
    category: "Mitre Saw Safety",
    prompt: "When operating a compound mitre saw, how far should your hands stay from the path of the blade?",
    options: [
      "At least 6 inches (outside the 'no-hands' zone)",
      "1 inch so you can steady the cut",
      "Directly behind the fence",
      "Distance does not matter if wearing gloves"
    ],
    answerIndex: 0,
    explanation: "Keep hands at least 6 inches away and use hold-down clamps for short pieces—never wear loose gloves near spinning blades."
  },

  // --- TIER 3 (S4S MILLING, TABLE SAW, BOARD FEET) ---
  {
    id: "q_t3_1",
    tier: 3,
    category: "Milling Sequence",
    diagram: "tool_jointer_vs_planer",
    prompt: "You just bought cupped rough-sawn Hard Maple. Which machine MUST you use first to create one flat reference face?",
    options: [
      "The Jointer (with push blocks)",
      "The Thickness Planer",
      "The Mitre Saw",
      "The Belt Sander"
    ],
    answerIndex: 0,
    explanation: "A planer's feed rollers press a warped board flat temporarily, so it springs back cupped. Always flatten one face on the jointer first."
  },
  {
    id: "q_t3_2",
    tier: 3,
    category: "Table Saw Safety",
    prompt: "What is the primary purpose of a riving knife mounted directly behind a table saw blade?",
    options: [
      "To prevent internal wood tension from pinching the back of the blade and causing kickback",
      "To sand the cut edge smooth",
      "To measure board thickness",
      "To collect sawdust into a bag"
    ],
    answerIndex: 0,
    explanation: "As wood rips, internal stresses can close the kerf onto the rising rear teeth of the blade, launching the board back at the operator."
  },
  {
    id: "q_t3_3",
    tier: 3,
    category: "Trade Math: Board Feet",
    prompt: "How many board feet are in a rough plank measuring 1 inch thick × 6 inches wide × 8 feet long?",
    options: [
      "4 board feet",
      "8 board feet",
      "48 board feet",
      "2 board feet"
    ],
    answerIndex: 0,
    explanation: "Board Feet = (Thickness in inches × Width in inches × Length in feet) ÷ 12 → (1 × 6 × 8) ÷ 12 = 4 bd ft."
  },
  {
    id: "q_t3_4",
    tier: 3,
    category: "Kerf Allowance",
    prompt: "You need two 12\" boards cut from a single 24\" board using a 1/8\" kerf saw blade. What happens after the first 12\" cut?",
    options: [
      "The remaining piece is 11 7/8\" because the blade turned 1/8\" of wood into sawdust",
      "Both pieces are exactly 12\"",
      "The second piece becomes 12 1/8\"",
      "Kerf only applies to plywood"
    ],
    answerIndex: 0,
    explanation: "Every saw cut removes the width of the blade's kerf—always factor kerf into your cut list."
  },
  {
    id: "q_t3_5",
    tier: 3,
    category: "Material Inspection",
    prompt: "Before feeding reclaimed Nova Scotia barn hemlock into a jointer or planer, what critical check must you perform?",
    options: [
      "Scan thoroughly for hidden nails, staples, or embedded grit",
      "Soak the board in water",
      "Apply polyurethane first",
      "Cut it with a finishing hammer"
    ],
    answerIndex: 0,
    explanation: "Hitting a single hidden nail at 5,000 RPM will notch your cutterhead knives and can throw metal shrapnel."
  },
  {
    id: "q_t3_6",
    tier: 3,
    category: "Table Saw Operation",
    prompt: "Why should you NEVER use the table saw rip fence as a stop block while pushing a board with the mitre gauge?",
    options: [
      "The cutoff piece gets trapped between the blade and fence, causing violent kickback",
      "It dulls the rip fence paint",
      "The blade spins backwards",
      "It increases sawdust suction"
    ],
    answerIndex: 0,
    explanation: "Always clamp a clearance block ahead of the blade on the fence so the cutoff has room to move freely away from the blade."
  },

  // --- TIER 4 (FINE JOINERY, BAND SAW, WOOD MOVEMENT) ---
  {
    id: "q_t4_1",
    tier: 4,
    category: "Visual ID: Joinery",
    diagram: "joint_mortise_tenon",
    prompt: "Identify this traditional structural joint consisting of a rectangular tongue fitted into a matching pocket:",
    options: [
      "Mortise-and-tenon joint",
      "Butt joint",
      "Scarf joint",
      "Biscuit joint"
    ],
    answerIndex: 0,
    explanation: "Mortise-and-tenon joinery provides massive long-grain glue surface and mechanical strength for tables and chairs."
  },
  {
    id: "q_t4_2",
    tier: 4,
    category: "Wood Movement",
    prompt: "In which direction does solid wood expand and contract the MOST with seasonal humidity changes?",
    options: [
      "Across the width (tangentially/radially), NOT along its length",
      "Equally in length, width, and thickness",
      "Only along the length of the board",
      "Solid wood never moves once dried"
    ],
    answerIndex: 0,
    explanation: "Longitudinal movement is negligible, while cross-grain expansion on a 30\" tabletop can exceed 1/4\"—requiring elongated screw slots or figure-8 fasteners."
  },
  {
    id: "q_t4_3",
    tier: 4,
    category: "Band Saw Operation",
    prompt: "When cutting a tight curve on the band saw, what technique prevents the blade from binding in the kerf?",
    options: [
      "Make perpendicular relief cuts into the waste area up to the layout line first",
      "Push the board sideways against the flat side of the blade",
      "Raise the upper blade guide 8 inches above the wood",
      "Turn off the saw mid-curve"
    ],
    answerIndex: 0,
    explanation: "Relief cuts let small waste chunks fall away so the back of the blade never jams in a tight radius."
  },
  {
    id: "q_t4_4",
    tier: 4,
    category: "Material Selection",
    prompt: "Why did traditional Nova Scotia boatbuilders choose White Oak over Red Oak for hull ribs and outdoor trim?",
    options: [
      "White Oak pores are sealed with tyloses, making it watertight and rot-resistant",
      "White Oak is much softer than pine",
      "Red Oak cannot be glued",
      "White Oak has no grain"
    ],
    answerIndex: 0,
    explanation: "Red Oak has open straw-like pores that wick water deep into the board, whereas White Oak's pores are naturally plugged."
  },

  // --- TIER 5 (MASTER MILLWORK & JAPANESE PULL SAWS) ---
  {
    id: "q_t5_1",
    tier: 5,
    category: "Visual ID: Joinery",
    diagram: "joint_dovetail",
    prompt: "Identify this interlocking fan-shaped joint prized in drawer boxes for resisting pulling forces even without glue:",
    options: [
      "Through dovetail joint",
      "Spline mitre joint",
      "Tongue-and-groove joint",
      "Pocket-hole joint"
    ],
    answerIndex: 0,
    explanation: "The angled pins and tails mechanically lock the drawer front against the constant pulling force of opening a loaded drawer."
  },
  {
    id: "q_t5_2",
    tier: 5,
    category: "Visual ID: Tools",
    diagram: "tool_japanese_saw",
    prompt: "How does a Japanese Dozuki back saw cut differently from a Western tenon saw?",
    options: [
      "It cuts on the PULL stroke, putting the thin 0.3mm blade in tension for razor-thin kerfs",
      "It cuts on the push stroke with a 3mm thick blade",
      "It only cuts in circles",
      "It uses a battery motor"
    ],
    answerIndex: 0,
    explanation: "Because pulling puts steel in tension rather than compression, Japanese saws can use ultra-thin blades with minimal effort and tear-out."
  },
  {
    id: "q_t5_3",
    tier: 5,
    category: "Finishing & Tear-Out",
    prompt: "When planing highly figured Curly Maple, what adjustment helps prevent grain tear-out?",
    options: [
      "Take ultra-light finishing passes (1/64\" or less) with freshly honed knives",
      "Take a heavy 1/8\" pass as fast as possible",
      "Plane perpendicular to the grain",
      "Skip jointing entirely"
    ],
    answerIndex: 0,
    explanation: "Reversing wave grain in curly maple tears easily under heavy cuts; light passes with sharp edges shear the fibers cleanly."
  },

  // --- ADDED: more questions per tier so exams don't repeat (teacher: please review) ---
  {
    id: "q_t1_7",
    tier: 1,
    category: "Tape Measure Accuracy",
    prompt: "On an imperial tape measure, what measurement is the mark exactly halfway between 3\" and 3 1/4\"?",
    options: [
      "3 1/8\"",
      "3 1/16\"",
      "3 3/8\"",
      "3 1/2\""
    ],
    answerIndex: 0,
    explanation: "Halfway between 2/8 (1/4) and 0/8 is 1/8, so the mark reads 3 1/8\". Count the eighths: 3, 3 1/8, 3 1/4."
  },
  {
    id: "q_t1_8",
    tier: 1,
    category: "Visual ID: Fasteners",
    prompt: "Which nail has a small head you can sink below the surface with a nail set and hide with wood filler?",
    options: [
      "Common nail",
      "Finishing nail",
      "Roofing nail",
      "Duplex (double-headed) nail"
    ],
    answerIndex: 1,
    explanation: "Finishing nails have a small, barely-there head. Set it about 1/16\" below the surface and fill the hole for an almost invisible joint."
  },
  {
    id: "q_t1_9",
    tier: 1,
    category: "Tools & Layout",
    prompt: "What is a crosscut handsaw designed to cut?",
    options: [
      "Along the grain (ripping)",
      "Across the grain",
      "Only plywood",
      "Tight curves"
    ],
    answerIndex: 1,
    explanation: "Crosscut teeth are sharpened like little knives that sever the wood fibres across the grain. A rip saw's chisel-shaped teeth are for cutting along the grain."
  },
  {
    id: "q_t1_10",
    tier: 1,
    category: "Shop Safety",
    prompt: "Planers, routers and table saws are loud enough to damage hearing over time. What should you do?",
    options: [
      "Wear earplugs or earmuffs whenever they're running",
      "Turn up music to cover the noise",
      "Only protect your ears if the noise hurts",
      "Stand behind the machine instead"
    ],
    answerIndex: 0,
    explanation: "Hearing damage is permanent and builds up without pain. Wear hearing protection for loud machines, just like safety glasses."
  },
  {
    id: "q_t2_7",
    tier: 2,
    category: "Visual ID: Joinery",
    prompt: "Why is a plain butt joint (the end of one board glued to the face of another) weak with glue alone?",
    options: [
      "End grain soaks up glue and makes a poor gluing surface",
      "Wood glue doesn't stick to pine",
      "Butt joints are always cut too tight",
      "Clamps can't hold a butt joint"
    ],
    answerIndex: 0,
    explanation: "End grain is like a bundle of straws: it wicks glue away from the joint. Butt joints need screws, nails, dowels or biscuits to be strong."
  },
  {
    id: "q_t2_8",
    tier: 2,
    category: "Assembly & Gluing",
    prompt: "When using yellow PVA wood glue, how long should a typical joint stay clamped?",
    options: [
      "About 30 seconds",
      "About 30–60 minutes, then let it cure for 24 hours before putting stress on it",
      "Until the squeeze-out turns white",
      "At least a full week"
    ],
    answerIndex: 1,
    explanation: "Most yellow glues set enough to unclamp in 30–60 minutes, but they reach full strength in about 24 hours. Don't load the joint before then."
  },
  {
    id: "q_t2_9",
    tier: 2,
    category: "Tools & Layout",
    prompt: "To make a four-sided picture frame with mitred corners, what angle do you cut on each end of every piece?",
    options: [
      "90°",
      "45°",
      "22.5°",
      "60°"
    ],
    answerIndex: 1,
    explanation: "Two 45° cuts meet to make each 90° corner. Four corners × 90° = 360°, a closed frame."
  },
  {
    id: "q_t2_10",
    tier: 2,
    category: "Visual ID: Fasteners",
    prompt: "What does a countersink bit do?",
    options: [
      "Drills the pilot hole deeper",
      "Cuts a cone-shaped recess so a flat-head screw sits flush with the surface",
      "Removes a broken screw",
      "Cuts threads into the wood"
    ],
    answerIndex: 1,
    explanation: "A countersink matches the angled underside of a flat-head screw so the head ends up flush, or just below the surface for filling."
  },
  {
    id: "q_t3_7",
    tier: 3,
    category: "Milling Sequence",
    prompt: "You've jointed one face and one edge flat and square. Which machine brings the board to an even thickness?",
    options: [
      "The jointer again",
      "The thickness planer",
      "The band saw",
      "A belt sander"
    ],
    answerIndex: 1,
    explanation: "The planer copies the flat face you made on the jointer and cuts the opposite face parallel to it. Then rip to width on the table saw."
  },
  {
    id: "q_t3_8",
    tier: 3,
    category: "Table Saw Safety",
    prompt: "Which of these is most likely to cause kickback on the table saw?",
    options: [
      "Feeding the board steadily with a push stick",
      "The board drifting away from the fence and pinching the back of the blade",
      "Keeping the blade guard and riving knife on",
      "Wearing safety glasses"
    ],
    answerIndex: 1,
    explanation: "When wood twists or closes on the back of the blade, the rising teeth can grab it and throw it at you. Keep stock tight to the fence and use the riving knife."
  },
  {
    id: "q_t3_9",
    tier: 3,
    category: "Trade Math: Board Feet",
    prompt: "How many board feet are in a board 2 inches thick × 4 inches wide × 6 feet long?",
    options: [
      "2 bd ft",
      "4 bd ft",
      "8 bd ft",
      "48 bd ft"
    ],
    answerIndex: 1,
    explanation: "Board feet = thickness (in) × width (in) × length (ft) ÷ 12. So 2 × 4 × 6 ÷ 12 = 4 board feet."
  },
  {
    id: "q_t3_10",
    tier: 3,
    category: "Wood Properties",
    prompt: "Kiln-dried hardwood for indoor furniture should have a moisture content of about:",
    options: [
      "0%",
      "6–9%",
      "25–30%",
      "About 50%"
    ],
    answerIndex: 1,
    explanation: "Indoor furniture should be close to the moisture of the home it lives in, about 6–9%. Much wetter wood shrinks and cracks after it's built."
  },
  {
    id: "q_t4_5",
    tier: 4,
    category: "Wood Movement",
    prompt: "How should a solid-wood tabletop be attached to its frame (apron)?",
    options: [
      "Glue it solidly along every edge",
      "With buttons or Z-clips in slots, so the top can expand and contract",
      "Screw it down through tight holes every 10 cm",
      "Nail it with finishing nails"
    ],
    answerIndex: 1,
    explanation: "A solid top moves across its width with the seasons. Fastened solid, it will crack or bow. Buttons and Z-clips hold it flat but let it slide."
  },
  {
    id: "q_t4_6",
    tier: 4,
    category: "Visual ID: Joinery",
    prompt: "A common rule of thumb for how thick to make a tenon is:",
    options: [
      "About one-third the thickness of the stock",
      "The full thickness of the stock",
      "One-tenth the thickness of the stock",
      "Twice the thickness of the stock"
    ],
    answerIndex: 0,
    explanation: "One-third leaves strong cheeks on the tenon and strong walls on each side of the mortise."
  },
  {
    id: "q_t4_7",
    tier: 4,
    category: "Router Safety",
    prompt: "Looking down from above, which way should you move a hand-held router around the OUTSIDE edges of a board?",
    options: [
      "Clockwise",
      "Counter-clockwise",
      "Either way",
      "Back and forth in short strokes"
    ],
    answerIndex: 1,
    explanation: "A router bit spins clockwise from above. Moving counter-clockwise around the outside feeds the wood into the cutter. Going the other way (climb cutting) lets the router grab and run."
  },
  {
    id: "q_t4_8",
    tier: 4,
    category: "Finishing & Tear-Out",
    prompt: "Why sand through the grits in order (for example 80 → 120 → 180) instead of jumping straight to 180?",
    options: [
      "Each grit removes the scratches left by the one before",
      "Fine paper is too expensive to use first",
      "Coarse grits make the wood darker",
      "It doesn't matter what order you use"
    ],
    answerIndex: 0,
    explanation: "Fine paper can't remove deep coarse scratches in a reasonable time. Skipping grits leaves scratches that stain will make stand out."
  },
  {
    id: "q_t4_9",
    tier: 4,
    category: "Wood Movement",
    prompt: "Why is quartersawn lumber more stable than flatsawn lumber?",
    options: [
      "It's always cut from older trees",
      "Its growth rings run roughly at right angles to the face, so it shrinks less in width and resists cupping",
      "It's kiln-dried twice",
      "It has no grain"
    ],
    answerIndex: 1,
    explanation: "Wood moves most along the growth rings. In quartersawn boards that movement goes into thickness, not width."
  },
  {
    id: "q_t4_10",
    tier: 4,
    category: "Boatbuilding",
    prompt: "A traditional rule of thumb for steam-bending boat ribs is to steam the wood for about:",
    options: [
      "1 minute per inch of thickness",
      "1 hour per inch of thickness",
      "1 day per inch of thickness",
      "As long as you like: time doesn't matter"
    ],
    answerIndex: 1,
    explanation: "About an hour per inch of thickness softens the lignin enough to bend. Straight-grained, air-dried White Oak bends best."
  },
  {
    id: "q_t5_4",
    tier: 5,
    category: "Visual ID: Joinery",
    prompt: "What slope is commonly used for dovetails in hardwood?",
    options: [
      "1:2",
      "1:8",
      "1:20",
      "1:1"
    ],
    answerIndex: 1,
    explanation: "About 1:8 is typical for hardwood (1:6 for softwood). Steeper slopes leave weak short grain at the tips; shallower ones lose their locking shape."
  },
  {
    id: "q_t5_5",
    tier: 5,
    category: "Finishing & Tear-Out",
    prompt: "Why brush on a thin washcoat or sanding sealer before staining pine or cherry?",
    options: [
      "It makes the stain dry faster",
      "It evens out how much stain the wood soaks up, reducing blotches",
      "It replaces the need for a top coat",
      "It makes the wood harder to dent"
    ],
    answerIndex: 1,
    explanation: "Blotch-prone woods soak up stain unevenly. A thin sealer partly fills the thirsty spots so colour goes on evenly."
  },
  {
    id: "q_t5_6",
    tier: 5,
    category: "Finishing & Tear-Out",
    prompt: "Which finish builds a protective film ON the surface rather than soaking into the wood?",
    options: [
      "Polyurethane varnish",
      "Pure tung oil",
      "Mineral oil",
      "Paste of beeswax and oil"
    ],
    answerIndex: 0,
    explanation: "Varnishes like polyurethane cure into a hard surface film. Penetrating oils soak in and harden inside the wood, leaving a more natural feel."
  },
  {
    id: "q_t5_7",
    tier: 5,
    category: "Shop Safety",
    prompt: "Why must rags soaked in linseed oil, tung oil or oil stain be laid flat outdoors to dry, or sealed in a metal can with water?",
    options: [
      "They smell bad",
      "They can heat up and catch fire on their own as the oil cures",
      "They stain the floor",
      "Oil evaporates and is wasted"
    ],
    answerIndex: 1,
    explanation: "Drying oils give off heat as they cure. A crumpled pile of rags can trap that heat until it ignites. This has burned down real workshops."
  },
  {
    id: "q_t5_8",
    tier: 5,
    category: "Finishing & Tear-Out",
    prompt: "Why do woodworkers use a card scraper on figured wood like curly maple?",
    options: [
      "It removes wood faster than a power planer",
      "It takes very fine shavings without tearing out the reversing grain",
      "It doesn't need sharpening",
      "It adds texture to the surface"
    ],
    answerIndex: 1,
    explanation: "A scraper's tiny burr shaves the surface instead of levering fibres up, so it smooths tricky grain where a plane would tear out."
  },
  {
    id: "q_t5_9",
    tier: 5,
    category: "Visual ID: Joinery",
    prompt: "When hand-sawing dovetails, where should the saw kerf go?",
    options: [
      "Right down the middle of the layout line",
      "On the waste side of the line",
      "On the keeper side of the line",
      "It doesn't matter"
    ],
    answerIndex: 1,
    explanation: "Saw on the waste side and leave the line. The joint fits exactly to your layout instead of being a saw-kerf too loose."
  },
  {
    id: "q_t5_10",
    tier: 5,
    category: "Wood Movement",
    prompt: "Breadboard ends on a solid tabletop are usually glued or pinned tightly only at the centre. Why?",
    options: [
      "To save glue",
      "So the panel can expand and contract across its width under the breadboard",
      "Because the ends are only decorative",
      "So the breadboard can be removed later"
    ],
    answerIndex: 1,
    explanation: "The panel moves with the seasons but the breadboard doesn't. Fixing only the centre (with elongated pin holes toward the edges) lets the panel slide without cracking."
  }
];
