window.ACM = window.ACM || {};

/**
 * Food. Foraged food is perishable (shelf = days it keeps). Provisions bought from Clara keep forever.
 */
ACM.FOODS = {
  blueberry:  { name: "Wild Blueberries",   energy: 12, shelf: 2, icon: "🫐" },
  raspberry:  { name: "Wild Raspberries",   energy: 10, shelf: 2, icon: "🍓" },
  cranberry:  { name: "Bog Cranberries",    energy: 14, shelf: 3, icon: "🍒" },
  morel:      { name: "Morel Mushrooms",    energy: 20, shelf: 3, icon: "🍄" },
  chanterelle:{ name: "Chanterelles",       energy: 22, shelf: 3, icon: "🍄" },
  hardtack:   { name: "Hardtack Biscuits",  energy: 15, shelf: null, price: 4,  icon: "🍪" },
  oatcakes:   { name: "Oatcakes",           energy: 20, shelf: null, price: 5,  icon: "🥠" },
  maple_fudge:{ name: "Maple Fudge",        energy: 18, shelf: null, price: 6,  icon: "🍫" },
  herring:    { name: "Smoked Herring",     energy: 30, shelf: null, price: 8,  icon: "🐟" },
  bean_jar:   { name: "Jar of Baked Beans", energy: 40, shelf: null, price: 10, icon: "🫘" },
  chowder_can:{ name: "Canned Seafood Chowder", energy: 55, shelf: null, price: 13, icon: "🥫" }
};
ACM.PROVISIONS = ["hardtack", "oatcakes", "maple_fudge", "herring", "bean_jar", "chowder_can"];

/**
 * Wild forage, driven by season. Bushes: berries in summer/autumn. Mushrooms: morels in spring, chanterelles in summer/autumn.
 * Winter: nothing grows, so keep some provisions in your pack!
 */
ACM.Forage = {
  respawn: { bush: 4, mushroom: 3 },
  itemFor(spot, season) {
    if (spot.kind === "bush") {
      if (season === "Summer") return ["blueberry", "raspberry", "blueberry"][spot.v];
      if (season === "Autumn") return ["cranberry", "raspberry", "cranberry"][spot.v];
      return null;
    }
    if (season === "Spring") return "morel";
    if (season === "Summer") return spot.v === 0 ? "chanterelle" : null;
    if (season === "Autumn") return "chanterelle";
    return null;
  },
  available(state, spot) {
    const taken = state.forageTaken && state.forageTaken[spot.i];
    if (taken != null && state.dayCount - taken < this.respawn[spot.kind]) return null;
    return this.itemFor(spot, state.season);
  },
  amount(spot) { return spot.kind === "bush" ? 2 + (spot.v % 2) : 1 + (spot.v % 2); }
};
