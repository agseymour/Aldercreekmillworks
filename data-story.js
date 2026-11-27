window.ACM = window.ACM || {};

/**
 * The Family Kitchen: five heritage pieces rebuild the kitchen of the grandparents' burned house.
 * A friendly spirit (Nell) asks for one piece at a time. Each piece is a normal commission (same minigames, quality and permits),
 * cloned from a tier project, and is unlocked by rating tier, safety permits and friendships with the village.
 * need: stars (rating), permits (safety permit ids), hearts [[npcId, hearts]], friends (count of villagers at 3 hearts)
 */
ACM.GHOST = { name: "Nell" };
ACM.STORY_CHAPTERS = [
  { k: 1, from: "anchor_1_kiosk", title: "The Kitchen Doorway", piece: "Kitchen Door Frame & Threshold", parts: ["Door Header", "Door Jamb"],
    need: { stars: 1.0, permits: ["orientation", "handdrill"], deliveries: 1 },
    hint: "Finish your first commission, then earn the Safety Orientation and Hand Drill permits at the Schoolhouse, and buy a cordless drill and screwdriver at Seymour's. Then come back.",
    intro: ["(A thin voice hums an old tune, then stops, as if caught.)", "Oh! You can hear me? ...Forgive the fright. I do so love company, even the kind that walks through the gate.", "The kitchen was the heart of this house. Before there can be cabinets, there must be a doorway to walk through. Frame it true, dear, and I will hum a little louder."],
    done: ["The frame stands square in the ash and light. Somewhere a kettle seems to sing.", "Yes. That's it. That is exactly how he set a door. Thank you."] },
  { k: 2, from: "side_2_bookshelf", title: "The Pantry Shelves", piece: "Pantry Shelves", parts: ["Shelf Board", "Shelf Cleat"],
    need: { stars: 1.65, hearts: [["seymour", 3]], permits: ["orientation", "handdrill", "mitre"] },
    hint: "Befriend Seymour (3♥), earn the Mitre & Chop Saw permit, and get certified for Tier 2 so you can buy the saw. He knew your grandfather's tools best.",
    intro: ["You came back. I hoped you would.", "Seymour has a good heart. He used to leave a chisel on the gatepost 'by accident' for your grandfather to find.", "My jars need shelves. Cut them with the mitre saw, and mind your fingers. He never did."],
    done: ["The shelves hold nothing yet, but the room remembers what they carried.", "Rhubarb, raspberry, blueberry, cranberry... I can almost smell them."] },
  { k: 3, from: "anchor_3_square", title: "The Cabinet Frames", piece: "Cabinet Face Frames", parts: ["Face Frame Stile", "Face Frame Rail"],
    need: { stars: 2.65, hearts: [["routledge", 3]], permits: ["orientation", "handdrill", "mitre", "jointer", "planer", "tablesaw"] },
    hint: "Befriend Routledge (3♥), earn the Mitre, Jointer, Planer and Table Saw permits, and get certified for Tier 3 so you can buy those machines. He keeps the best hardwood in the valley.",
    intro: ["You are growing into those hands. He had a way of squaring a board that I can see in you.", "My name is Nell, by the way. I was your grandmother, if you hadn't guessed. Everyone called me Nell. Everyone but him. He called me 'Peggy' just to tease.", "Now the face frames, the bones of the cabinets. Mill them flat, cut them true. Routledge knows where the good hardwood sleeps."],
    done: ["The frames catch the light. A tear of sawdust drifts down like snow. Nell laughs, a soft sound like a spoon on a cup.", "Peggy. Hm. I never did admit I liked it."] },
  { k: 4, from: "anchor_4_lighthouse", title: "The Cabinet Doors", piece: "Cabinet Doors", parts: ["Door Panel", "Door Rail"],
    need: { stars: 3.65, hearts: [["clara", 3], ["alverez", 3]], permits: ["orientation", "jointer", "planer", "tablesaw", "band"] },
    hint: "Befriend Clara and Dr. Alverez (3♥ each), earn the Band Saw permit, and get certified for Tier 4 so you can buy the band saw.",
    intro: ["Doors, now. A cabinet without doors is just a secret with no lock.", "Clara's mother used to sit at that table and trade gossip for biscuits. And I taught half this village their letters in that schoolhouse, with Dr. Alverez's bookshelf still standing where mine did.", "Curved panels, tight cuts. Use the band saw and use relief cuts, my dear. I know a thing or two about safety, having learned it all too late."],
    done: ["The doors swing on their hinges without a sound. The kitchen seems less ruined by the minute.", "Thank you. Nearly home. Nearly."] },
  { k: 5, from: "anchor_5_centennial", title: "Grandmother's Jam Cabinet", piece: "The Jam Cabinet", parts: ["Cabinet Side", "Cabinet Stile"],
    need: { stars: 4.65, friends: 5, permits: ["orientation", "handdrill", "jointer", "planer", "tablesaw", "band"] },
    hint: "Reach 4.65★, have five villagers at 3♥, and get certified for Tier 5 to buy the last saw. The whole village will help when the time comes.",
    intro: ["The last piece. The one he made me, the winter before.", "Everything you have learned: the measuring, the squaring, the patience, the stewardship, the friends. This is where it all goes.", "Make it the way he would have. And make it yours."],
    done: []
  }
];
ACM.STORY_ENDING = [
  "The last hinge settles. Warm light fills the kitchen from nowhere, from everywhere.",
  "Nell stands in the doorway, no longer faint, a woman with flour on her sleeves and a kettle in her hand.",
  "\"It smells like home again. You did this, dear. Not the village, not the tools. You.\"",
  "\"The door is always open. The kettle is always on. Come by when you are tired, and I will see you right.\""
];

// heritage pieces are ordinary commissions cloned from the tier projects
(function () {
  ACM.STORY_CHAPTERS.forEach((ch) => {
    const src = ACM.PROJECTS.find((p) => p.id === ch.from);
    if (!src) return;
    const p = JSON.parse(JSON.stringify(src));
    p.id = "heritage_" + ch.k;
    p.title = ch.piece;
    p.client = "Nell (Family Kitchen)";
    p.heritage = true;
    p.chapter = ch.k;
    p.desc = "A heritage piece for the grandparents' kitchen. Build it with love, and the old house will remember.";
    p.cuts.forEach((c, i) => { if (ch.parts[i]) c.part = ch.parts[i]; });
    p.basePay = Math.round(src.basePay * 1.0);
    delete p.choice;
    ACM.PROJECTS.push(p);
  });
})();
