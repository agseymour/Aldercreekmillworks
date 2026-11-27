window.ACM = window.ACM || {};

/**
 * The people of Alder Creek. Each one has a daily routine (posts), things they like as gifts,
 * and dialogue that opens up as the friendship (hearts) grows.
 * hearts: 0-10 (100 friendship points per heart).
 */
ACM.NPCS = [
  {
    id: "seymour",
    name: "Seymour",
    role: "Hardware Shop Owner",
    clientKey: "Seymour",
    appearance: { skin: "#f3c69f", hair: "#8d949c", shirt: "#2b4c7e", apron: "#6b4423" },
    gear: { safety_glasses: true },
    posts: { day: [54, 14], evening: [61, 29] },
    loves: ["cedar_s4s", "log_cedar"],
    likes: ["pine_s4s", "log_pine", "sapling_cedar"],
    dislikes: [],
    talk: [
      "Mornin'. Sharp tools, steady hands, and a good cup of tea. That's all a woodworker needs.",
      "Folks think the saw does the work. It's the setup. Measure twice, cut once, and always wear your glasses.",
      "If a blade's dull, it's not working for you — it's working against you. Bring it by and I'll hone it."
    ],
    friend: ["You're getting the hang of this. Your grandfather had the same careful way of squaring a board."],
    close: ["He bought every chisel he ever owned from me. Paid in firewood half the time. Best customer I ever had."],
    deep: ["Some nights I walk past the old house and swear I hear someone humming in the kitchen. Silly old man, eh?"]
  },
  {
    id: "routledge",
    name: "Routledge",
    role: "Sawmill & Nursery Owner",
    clientKey: "Routledge",
    appearance: { skin: "#e0a97c", hair: "#6e737b", shirt: "#2e5e4e", apron: "#3d4852" },
    gear: {},
    posts: { day: [76, 14], evening: [60, 31] },
    loves: ["log_oak", "white_oak_rough", "walnut_rough"],
    likes: ["log_maple", "log_cherry", "log_walnut", "hard_maple_rough", "sapling_walnut"],
    dislikes: [],
    talk: [
      "A tree's got a story in every ring. My job's just to open the book without tearing the pages.",
      "Plant a maple today, and in four days you'll have timber. Patience pays — slowly, but it pays.",
      "Bring me logs and I'll buy 'em, or I'll saw 'em into boards for a few dollars. Your choice."
    ],
    friend: ["Don't leave all your saplings in one spot. A scattered woodlot is a healthy woodlot."],
    close: ["Your grandmother used to bring me jam, and I'd give her cedar offcuts for her pantry shelves. Fair trade."],
    deep: ["The fire took more than the house. It took a whole winter of work with it. But the chimney stood. That means something."]
  },
  {
    id: "clara",
    name: "Clara",
    role: "Owner of the Harbor Café",
    clientKey: "Clara",
    appearance: { skin: "#b97a56", hair: "#1c1c1e", shirt: "#2f7d6d", apron: "#e6d3b0" },
    gear: {},
    posts: { day: [53, 32], evening: [64, 29] },
    loves: ["cedar_s4s", "sapling_cherry"],
    likes: ["birch_rough", "log_birch", "poplar_s4s", "morel", "chanterelle", "blueberry"],
    dislikes: [],
    talk: [
      "Come in out of the wind! A hot chowder and a rest will put your energy right back where it belongs.",
      "Good wood smells like a good kitchen. Cedar, apple, a little woodsmoke — that's home.",
      "Everyone in Alder Creek passes through here eventually. I hear everything. I repeat almost nothing."
    ],
    friend: ["The planter box is thriving! The basil actually grew an inch overnight. Don't tell the basil I said so."],
    close: ["Your grandmother's kitchen was the heart of this village. Every cabinet door had a little carved sprig of alder on it."],
    deep: ["Whoever fixes that kitchen — please, keep the alder sprigs. They were the whole point."]
  },
  {
    id: "mateo",
    name: "Mateo",
    role: "Village Grocer",
    clientKey: "Mateo",
    appearance: { skin: "#e0a97c", hair: "#3b2618", shirt: "#b5651d", apron: "#8a6d3b" },
    gear: {},
    posts: { day: [59, 29], evening: [66, 29] },
    loves: ["sapling_maple", "pine_s4s", "maple_fudge"],
    likes: ["log_pine", "spf_s4s", "sapling_pine"],
    dislikes: ["reclaimed_barn"],
    talk: [
      "Fresh bread, fresh cod, fresh gossip. I carry all three, and the bread's the most reliable.",
      "I carry sixty pounds of groceries a day in baskets that fall apart. A proper tote would change my life.",
      "Maple syrup season is my favorite. Plant a maple and you'll understand."
    ],
    friend: ["That tote you built is the talk of the market. Three people asked where I got it."],
    close: ["I was a boy when the fire happened. The whole village stood in the road and just watched. Nobody said a word."],
    deep: ["There's an old rumour that the ghost in that house is friendly. Mrs. Gable leaves a pie on that gatepost every Sunday, 'for the squirrels'. It's always gone by Monday."]
  },
  {
    id: "macleod",
    name: "Ranger MacLeod",
    role: "Parks & Trails Ranger",
    clientKey: "MacLeod",
    appearance: { skin: "#f7d7c4", hair: "#8c4a27", shirt: "#2e5e4e", apron: "#3d4852" },
    gear: {},
    posts: { day: [90, 15], evening: [85, 33] },
    loves: ["sapling_pine", "sapling_cedar", "log_birch"],
    likes: ["cedar_s4s", "sapling_maple", "chanterelle", "morel"],
    dislikes: [],
    talk: [
      "The forest keeps itself in balance. We just give it a nudge now and then.",
      "Take what you need from the trees, plant what you take, and leave the best ones standing. That's the trail code.",
      "Cape Split's on the far side of the ridge. When you're certified, I'll show you the view."
    ],
    friend: ["I noticed you plant after you fell. Most folks don't. That earns my respect."],
    close: ["Your grandparents helped me build the first trailhead sign. Your grandfather's lettering was dreadful. Heartfelt, though."],
    deep: ["I found a lantern lit in that old house once — no wind, no one inside. It went out when I called out hello."]
  },
  {
    id: "alverez",
    name: "Dr. Alverez",
    role: "Schoolhouse Teacher",
    clientKey: "Alverez",
    appearance: { skin: "#7a4b32", hair: "#6e737b", shirt: "#a83232", apron: "#3d4852" },
    gear: { safety_glasses: true },
    posts: { day: [78, 32], evening: [74, 33] },
    loves: ["birch_rough", "red_oak_s4s"],
    likes: ["hard_maple_rough", "cherry_rough", "log_birch"],
    dislikes: [],
    talk: [
      "Fractions are the quiet hero of woodworking. An eighth of an inch is the difference between joinery and kindling.",
      "I hear you're studying the Production Technology curriculum. Excellent. Safe hands first, clever hands second."
    ],
    fixLines: [{ id: "side_2_bookshelf", broken: "Every child in this village learns their numbers at that bookcase. It hasn't been repaired since before I arrived.", fixed: "The children asked if the new bookcase has secret compartments. I told them every good bookcase does." }],
    friend: ["Safe hands first, clever hands second. Every student I've had who remembered that went far."],
    close: ["Your grandmother taught reading in this schoolhouse for thirty years. Half the village learned their letters from her."],
    deep: ["A child told me they saw a friendly shape in an upstairs window of that house. Children notice things that adults tell themselves they didn't see."]
  },
  {
    id: "doucet",
    name: "Captain Doucet",
    role: "Retired Fishing Captain",
    clientKey: "Doucet",
    appearance: { skin: "#e0a97c", hair: "#d9d6cd", shirt: "#2b4c7e", apron: "#3d4852" },
    gear: {},
    posts: { day: [34, 26], evening: [34, 26] },
    loves: ["white_oak_rough", "log_oak"],
    likes: ["cedar_s4s", "log_cedar", "hard_maple_rough", "herring", "hardtack"],
    dislikes: [],
    talk: [
      "Forty years on the water. Now I sit on a riverbank and watch other people's boats. Best retirement in Nova Scotia.",
      "White oak keeps the sea out. Red oak lets it in. Remember that one.",
      "A rocking chair should creak like a good ship — gently, and only when it has something to say."
    ],
    friend: ["That rocker is the first thing in thirty years that's made my back feel kind to me."],
    close: ["The lighthouse needs doing before the next big storm. The Historical Society will ask you eventually."],
    deep: ["Your grandfather built my first dory. Sixty years on, it's still in the shed. Never leaked a drop."]
  },
  {
    id: "gable",
    name: "Mrs. Gable",
    role: "Orchard Neighbour",
    clientKey: "Gable",
    appearance: { skin: "#f7d7c4", hair: "#d9d6cd", shirt: "#8c4a27", apron: "#e6d3b0" },
    gear: {},
    posts: { day: [64, 36], evening: [63, 37] },
    loves: ["sapling_cherry", "sapling_walnut", "blueberry", "cranberry"],
    likes: ["cedar_s4s", "log_cherry", "pine_s4s"],
    dislikes: [],
    talk: [
      "Oh, a visitor! I've got apples, and I've got opinions about chickadees. Which would you like first?",
      "A chickadee house, I told my husband, is the only thing that'll keep them from nesting in the porch light.",
      "I knew your grandmother for fifty years. She made the best rhubarb jam in Pictou County and wouldn't share the recipe."
    ],
    friend: ["The birds moved in the very next day. I named them Pine and Cedar. Fitting, I thought."],
    close: ["She wrote the jam recipe on the inside of a kitchen cabinet door. Pencil. I always meant to copy it down."],
    deep: ["Between you and me, I leave a pie on the old porch each autumn. Nobody's ever there. The pie always is."]
  }
];

ACM.NPC_HELPERS = {
  // 'day' 7:30-18:00, 'evening' 18:00-21:30, otherwise at home (hidden, windows lit)
  phaseAt(minutes) {
    if (minutes >= 450 && minutes < 1080) return "day";
    if (minutes >= 1080 && minutes < 1290) return "evening";
    return "night";
  },
  heartsFor(points) {
    return Math.max(0, Math.min(10, Math.floor((points || 0) / 100)));
  },
  likeLevel(npc, itemId) {
    if (npc.loves.includes(itemId)) return "love";
    if (npc.likes.includes(itemId)) return "like";
    if (npc.dislikes.includes(itemId)) return "dislike";
    return "neutral";
  }
};

/**
 * Friendship perks. Reaching the heart level unlocks the perk automatically.
 * fx keys: workTime (x time at workshop steps), workEnergy (x energy at workshop steps), fellEnergy, shopMult (x prices),
 * mealMult, maxEnergy (+), payBonus (+fraction), freeMistakes (forgiven per commission; still logged for assessment),
 * starMult, growBonus (days faster for planted trees), sellMult (x log/board sale price), millFree, speedMult.
 */
ACM.PERKS = {
  seymour:   [{ h: 3, name: "Honed Edges",        desc: "Seymour sharpens your hand tools. Workshop steps take 20% less time.", fx: { workTime: 0.8 } },
              { h: 5, name: "Balanced Hammer",     desc: "Seymour rebalances your hammer. The green zone for nails is 30% wider.", fx: { nailZone: 1.3 } },
              { h: 7, name: "Master's Jig",       desc: "Seymour's own jig steadies every cut. Workshop steps use 30% less energy.", fx: { workEnergy: 0.7 } }],
  routledge: [{ h: 3, name: "Nursery Discount",   desc: "Saplings and boards at Routledge's cost 15% less.", fx: { shopMult: 0.85 } },
              { h: 5, name: "Waxed Driver",        desc: "Routledge waxes your screws and driver bits. The green zone for screws is 30% wider.", fx: { screwZone: 1.3 } },
              { h: 7, name: "Sawmill Friend",     desc: "Routledge mills your logs for free, and pays 20% more for them.", fx: { millFree: true, sellMult: 1.2 } }],
  clara:     [{ h: 3, name: "Regular's Table",    desc: "Meals restore 50% more energy.", fx: { mealMult: 1.5 } },
              { h: 7, name: "Café Thermos",       desc: "A thermos of tea in your bag: +20 maximum energy.", fx: { maxEnergy: 20 } }],
  mateo:     [{ h: 3, name: "Market Word-of-Mouth", desc: "Mateo spreads the word. Commissions pay 5% more.", fx: { payBonus: 0.05 } },
              { h: 7, name: "Market Stall",       desc: "A stall on market day. Commissions pay a further 8% more.", fx: { payBonus: 0.08 } }],
  macleod:   [{ h: 3, name: "Trail Sense",        desc: "You know the forest now. Felling uses 40% less energy.", fx: { fellEnergy: 0.6 } },
              { h: 7, name: "Forester's Eye",     desc: "Planted trees mature 1 day sooner.", fx: { growBonus: 1 } }],
  alverez:   [{ h: 3, name: "Tutor's Tips",       desc: "Dr. Alverez checks your numbers. One mistake per commission is forgiven.", fx: { freeMistakes: 1 } },
              { h: 7, name: "Star Pupil",         desc: "Your reputation grows 10% faster.", fx: { starMult: 1.1 } }],
  doucet:    [{ h: 3, name: "Sea Legs",           desc: "Captain Doucet's walking tips. You move 10% faster.", fx: { speedMult: 1.1 } },
              { h: 5, name: "Steady Rope Hands",   desc: "Years on the water steady your grip. Both nail and screw zones are 15% wider.", fx: { nailZone: 1.15, screwZone: 1.15 } },
              { h: 7, name: "Dory Plans",         desc: "His grandfather's shortcuts: workshop steps take 10% less time.", fx: { workTime: 0.9 } }],
  gable:     [{ h: 3, name: "Orchard Pie",        desc: "A pie every few days: +10 maximum energy.", fx: { maxEnergy: 10 } },
              { h: 7, name: "Mrs. Gable's Blessing", desc: "A kind word for your seedlings: they mature 1 day sooner (stacks).", fx: { growBonus: 1 } }]
};


// lines that change when a village repair is finished (see data-repairs.js)
ACM.NPC_FIXLINES = {
  gable: [{ id: "side_1_birdhouse", broken: "The birdhouse on that post was your grandfather's work. The wind took half the roof and the chickadees are homeless.", fixed: "The chickadees moved into the birdhouse before I'd finished my tea." }],
  mateo: [{ id: "side_1_tote", broken: "My tote rack has leaned since the storm. Half the baskets end up in the mud.", fixed: "The tote rack's holding up better than my knees. Thank you." }],
  clara: [
    { id: "side_1_planter", broken: "That planter by the door rotted through last spring. I keep meaning to ask someone.", fixed: "Look at those flowers by the door. Folks stop just to smell them." },
    { id: "side_2_frames", broken: "Half my photographs came off the wall when the old frames gave out.", fixed: "My photographs are back on the wall, and straight for once." },
    { id: "anchor_2_cafe", broken: "My pastry shelves sag so badly the scones slide off. I could really use proper shelving.", fixed: "Proper shelves at last. The scones stay put and the jars shine." },
    { id: "side_3_butcher", broken: "The old butcher block has a crack you could lose a thumb in.", fixed: "Flat, sound, and the right height. The new block is a joy." }
  ],
  macleod: [{ id: "anchor_1_kiosk", broken: "The trailhead kiosk has leaned for a year. Hikers can't even read the map.", fixed: "Visitors say the new kiosk is the best-looking thing on the trail." }],
  seymour: [{ id: "side_3_nightstand", broken: "The display nightstand lost its drawer front. Bad for business, I assure you.", fixed: "That nightstand sells my hinges for me. Best salesman I've got." }],
  doucet: [{ id: "side_4_rocker", broken: "My rocker lost a runner in the last gale. Hard to watch the sea standing up.", fixed: "Back in my rocker with a view of the water. Life is good." }],
  routledge: [{ id: "side_4_coffeetable", broken: "The coffee table in my office has a split leg. I prop it up with a log.", fixed: "No more log under the coffee table. Customers think I've gone upscale." }]
};
