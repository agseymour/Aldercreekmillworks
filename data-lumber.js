window.ACM = window.ACM || {};

ACM.LUMBER = [
  {
    id: "spf_s4s",
    name: "SPF Construction Lumber (S4S)",
    type: "softwood",
    milled: "s4s",
    tier: 1,
    pricePerUnit: 6,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: false,
    nailRisk: 0,
    desc: "Spruce-Pine-Fir surfaced on four sides. Affordable and easy to cut, great for framing and utility builds."
  },
  {
    id: "pine_s4s",
    name: "Eastern White Pine (S4S)",
    type: "softwood",
    milled: "s4s",
    tier: 1,
    pricePerUnit: 10,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: false,
    nailRisk: 0,
    desc: "Classic Nova Scotia softwood. Straight grain, light weight, ideal for birdhouses, boxes, and shelving."
  },
  {
    id: "cedar_s4s",
    name: "Eastern Red Cedar (S4S)",
    type: "softwood",
    milled: "s4s",
    tier: 1,
    pricePerUnit: 16,
    unitLabel: "bd ft",
    weatherResistant: true,
    hardwood: false,
    nailRisk: 0,
    desc: "Naturally aromatic softwood rich in oils that resist moisture, insects, and outdoor decay."
  },
  {
    id: "poplar_s4s",
    name: "Tulip Poplar (S4S)",
    type: "hardwood",
    milled: "s4s",
    tier: 2,
    pricePerUnit: 14,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: true,
    nailRisk: 0,
    desc: "Economical utility hardwood with tight grain—ideal for painted cabinetry and secondary drawer parts."
  },
  {
    id: "birch_ply",
    name: "3/4\" Baltic Birch Plywood",
    type: "sheet",
    milled: "sheet",
    tier: 2,
    pricePerUnit: 38,
    unitLabel: "panel",
    weatherResistant: false,
    hardwood: true,
    nailRisk: 0,
    desc: "Cross-banded void-free veneer plies. Dimensionally stable across seasonal humidity swings."
  },
  {
    id: "red_oak_s4s",
    name: "Red Oak (S4S)",
    type: "hardwood",
    milled: "s4s",
    tier: 2,
    pricePerUnit: 20,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: true,
    nailRisk: 0,
    desc: "Strong, open-grained hardwood. Requires pilot holes to avoid splitting near board ends."
  },
  {
    id: "hard_maple_rough",
    name: "Rough-Sawn Hard Maple",
    type: "hardwood",
    milled: "rough",
    tier: 3,
    pricePerUnit: 13,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: true,
    nailRisk: 0,
    desc: "Dense, wear-resistant hardwood. Buy rough or harvest from your Woodlot, then joint and plane."
  },
  {
    id: "cherry_rough",
    name: "Rough-Sawn Black Cherry",
    type: "hardwood",
    milled: "rough",
    tier: 3,
    pricePerUnit: 15,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: true,
    nailRisk: 0,
    desc: "Prized furniture hardwood that darkens to a rich reddish-brown patina with age."
  },
  {
    id: "birch_rough",
    name: "Rough-Sawn Yellow Birch",
    type: "hardwood",
    milled: "rough",
    tier: 3,
    pricePerUnit: 12,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: true,
    nailRisk: 0,
    desc: "Pale, fine-grained Nova Scotia hardwood. Takes stain beautifully; great for school furniture."
  },
  {
    id: "reclaimed_barn",
    name: "Reclaimed NS Barn Hemlock (Rough)",
    type: "reclaimed",
    milled: "rough",
    tier: 3,
    pricePerUnit: 8,
    unitLabel: "bd ft",
    weatherResistant: true,
    hardwood: false,
    nailRisk: 0.45,
    desc: "Bargain salvaged timber with character—WARNING: high chance of hidden nails that chip cutterhead knives!"
  },
  {
    id: "white_oak_rough",
    name: "Rough-Sawn White Oak",
    type: "hardwood",
    milled: "rough",
    tier: 4,
    pricePerUnit: 18,
    unitLabel: "bd ft",
    weatherResistant: true,
    hardwood: true,
    nailRisk: 0,
    desc: "Closed-pore hardwood prized in Nova Scotia boatbuilding and outdoor furniture for water resistance."
  },
  {
    id: "walnut_rough",
    name: "Rough-Sawn Black Walnut",
    type: "hardwood",
    milled: "rough",
    tier: 4,
    pricePerUnit: 22,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: true,
    nailRisk: 0,
    desc: "Rich chocolate-brown North American fine furniture hardwood. Requires sharp blades and careful milling."
  },
  {
    id: "figured_maple_rough",
    name: "Rough-Sawn Curly Maple",
    type: "hardwood",
    milled: "rough",
    tier: 5,
    pricePerUnit: 30,
    unitLabel: "bd ft",
    weatherResistant: false,
    hardwood: true,
    nailRisk: 0,
    desc: "Rare chatoyant ripple grain for heirloom commissions. Prone to tear-out if planed aggressively."
  }
];

ACM.SAPLINGS = [
  {
    id: "sapling_pine",
    species: "Eastern White Pine",
    price: 8,
    growDays: 2,
    yieldLumberId: "pine_s4s",
    yieldUnits: 4,
    canopyColor: "#2d6a4f",
    desc: "Fast-growing Nova Scotia evergreen. Matures in 2 days and yields 4 bd ft of White Pine."
  },
  {
    id: "sapling_cedar",
    species: "Eastern Red Cedar",
    price: 12,
    growDays: 3,
    yieldLumberId: "cedar_s4s",
    yieldUnits: 4,
    canopyColor: "#1b4332",
    desc: "Hardy coastal evergreen. Matures in 3 days and yields 4 bd ft of rot-resistant Cedar."
  },
  {
    id: "sapling_maple",
    species: "Sugar / Hard Maple",
    price: 18,
    growDays: 4,
    yieldLumberId: "hard_maple_rough",
    yieldUnits: 5,
    canopyColor: "#40916c",
    desc: "Turns brilliant crimson in Autumn. Matures in 4 days and yields 5 bd ft of Hard Maple."
  },
  {
    id: "sapling_cherry",
    species: "Black Cherry",
    price: 22,
    growDays: 4,
    yieldLumberId: "cherry_rough",
    yieldUnits: 5,
    canopyColor: "#52b788",
    desc: "Blossoms in Spring. Matures in 4 days and yields 5 bd ft of furniture-grade Cherry."
  },
  {
    id: "sapling_walnut",
    species: "Black Walnut",
    price: 32,
    growDays: 5,
    yieldLumberId: "walnut_rough",
    yieldUnits: 6,
    canopyColor: "#386641",
    desc: "Slow-growing heirloom hardwood. Matures in 5 days and yields 6 bd ft of Black Walnut."
  }
];

// Logs from felled trees. Sell them, pay Routledge to mill them, or mill them yourself once you own the machines.
ACM.LOGS = {
  pine:   { name: "Pine",   lumberId: "pine_s4s",         needs: ["band_saw", "jointer", "planer"], sell: 3,  yieldFell: 3 },
  cedar:  { name: "Cedar",  lumberId: "cedar_s4s",        needs: ["band_saw", "jointer", "planer"], sell: 5,  yieldFell: 3 },
  birch:  { name: "Birch",  lumberId: "birch_rough",      needs: ["band_saw"],                      sell: 4,  yieldFell: 3 },
  oak:    { name: "Oak",    lumberId: "white_oak_rough",  needs: ["band_saw"],                      sell: 8, yieldFell: 4 },
  maple:  { name: "Maple",  lumberId: "hard_maple_rough", needs: ["band_saw"],                      sell: 7, yieldFell: 4 },
  cherry: { name: "Cherry", lumberId: "cherry_rough",     needs: ["band_saw"],                      sell: 8, yieldFell: 4 },
  walnut: { name: "Walnut", lumberId: "walnut_rough",     needs: ["band_saw"],                      sell: 11, yieldFell: 5 }
};
/** Boards you mill yourself are always accepted by the shop: any species from your own trees works for any commission
 *  (the job's "preferred" wood still earns the quality bonus). Jobs list the store-bought stock they were written for. */
ACM.lumberAllowed = function (job, id) {
  if (!job || !job.lumberReq) return false;
  if (job.lumberReq.allowedIds.includes(id)) return true;
  return Object.keys(ACM.LOGS || {}).some((k) => ACM.LOGS[k].lumberId === id);
};
ACM.LOG_BOARDS = 2;          // 1 log -> 2 bd ft of lumber
ACM.LOG_MILL_FEE = 6;        // Routledge's service fee per log
ACM.LUMBER_SELL_RATIO = 0.35; // lumber sells for 35% of its buying price
