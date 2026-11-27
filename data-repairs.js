window.ACM = window.ACM || {};

/**
 * Village repairs: every side job and anchor commission fixes something visible in the village.
 * Before the commission is delivered the item is drawn broken; afterwards it is drawn repaired.
 * Anything drawn with a `fix: <projectId>` flag (props, interior furniture) reads from here.
 */
ACM.REPAIRS = {
  side_1_birdhouse: { label: "Mrs. Gable's birdhouse", fixed: "The birdhouse is back on its post, and a chickadee has already moved in." },
  side_1_tote: { label: "Mateo's market totes", fixed: "Mateo's tote rack is whole again and the baskets are hanging straight." },
  side_1_planter: { label: "The café planter box", fixed: "Clara's planter box is full of fresh flowers." },
  anchor_1_kiosk: { label: "The trailhead map kiosk", fixed: "The trailhead kiosk stands straight with its map back under glass." },
  side_2_frames: { label: "The café picture frames", fixed: "The café's photographs hang square on the wall again." },
  side_2_bookshelf: { label: "The schoolhouse bookcase", fixed: "The schoolhouse bookcase is whole again, and the children are already sorting their books." },
  anchor_2_cafe: { label: "The café pastry shelving", fixed: "The café shelves are up, and Clara is stacking them with jars and loaves." },
  side_3_butcher: { label: "The café butcher block", fixed: "The café butcher block is flat and sound again." },
  side_3_nightstand: { label: "The display nightstand at the hardware shop", fixed: "Seymour's display nightstand is back on show." },
  anchor_3_square: { label: "The plaza benches", fixed: "The plaza benches are repaired, and people are sitting on them already." },
  side_4_rocker: { label: "Captain Doucet's rocking chair", fixed: "Captain Doucet's rocker is back on his porch, creaking happily." },
  side_4_coffeetable: { label: "The sawmill coffee table", fixed: "The sawmill coffee table is solid again." },
  anchor_4_lighthouse: { label: "The Town Hall archive table", fixed: "The archive table in Town Hall is steady again." },
  anchor_5_centennial: { label: "The Town Hall display case", fixed: "The Centennial display case shines in Town Hall." }
};
ACM.Repairs = {
  fixed(id) {
    const g = ACM.Game, s = g && g.state;
    return !!(s && Array.isArray(s.completedProjectIds) && s.completedProjectIds.includes(id));
  },
  /* cache signature for pre-rendered interior backgrounds */
  sig() { return Object.keys(ACM.REPAIRS).map((k) => (this.fixed(k) ? 1 : 0)).join(""); },
  note(id) { return ACM.REPAIRS[id] ? ACM.REPAIRS[id].fixed : null; },
  count() { const ids = Object.keys(ACM.REPAIRS); return [ids.filter((k) => this.fixed(k)).length, ids.length]; }
};
