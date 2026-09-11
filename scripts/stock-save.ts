// Fills the desktop save with a mature, decorated, fully stocked tank (for recording).
// Close the app first, then: bun scripts/stock-save.ts [path/to/save.json]
// Keeps settings, coins, achievements and play style; replaces the tank contents.
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { spawnFish } from "../src/sim/fish";
import { SPECIES } from "../src/data/species";
import { FISH_NAMES } from "../src/data/items";
import { newSand } from "../src/sim/sand";

const path = process.argv[2] ?? `${process.env.HOME}/.local/share/com.an.fisch/save.json`;
const WATER = { x0: 8, y0: 37, x1: 376, y1: 208 };
const STOCK: [string, number][] = [["neon", 8], ["danio", 5], ["guppy", 4], ["molly", 3], ["cory", 4], ["oto", 3], ["angel", 2], ["betta", 1]];

const file = JSON.parse(readFileSync(path, "utf8"));
const s = file["fisch-save"];
copyFileSync(path, `${path}.before-stock`);

s.tank = {
  ...s.tank,
  volumeL: 200, temp: 25.5, pH: 7.0, nh3: 0, no2: 0, no3: 8, o2: 8.5, chlorine: 0, dirt: 4, algae: 3,
  fill: 0.95, fillTarget: 0.95, bactA: 1, bactB: 1, sand: newSand(16),
};
s.equipment = { ...s.equipment, tank: 2, filter: 2, heater: 2, airPump: 1, light: 2, lightOn: true, heaterTarget: 25, thermometer: true, testKit: true };
s.decor = [
  { kind: "plantTall", x: 24 }, { kind: "plant", x: 52 }, { kind: "plantTall", x: 68 },
  { kind: "rock", x: 118 }, { kind: "plant", x: 150 },
  { kind: "wood", x: 196 }, { kind: "plant", x: 236 },
  { kind: "rock", x: 268 }, { kind: "plant", x: 300 }, { kind: "plantTall", x: 322 }, { kind: "plant", x: 352 },
];
s.decal = "deep";
s.inventory = { ...s.inventory, flakes: Math.max(30, s.inventory?.flakes ?? 0), conditioner: Math.max(3, s.inventory?.conditioner ?? 0), "decal:deep": 1 };
s.fish = [];
let n = 0;
for (const [sp, count] of STOCK) {
  for (let i = 0; i < count; i++) {
    const f = spawnFish(SPECIES[sp], FISH_NAMES[(n * 7) % FISH_NAMES.length], WATER, s.nextFishId++);
    f.size = 1; f.ageHours = 24 * (30 + ((n * 37) % 170)); f.hunger = 20 + (n % 5) * 5; f.stress = 10;
    s.fish.push(f);
    n++;
  }
}
s.ageHours = Math.max(s.ageHours ?? 0, 24 * 60);
s.guideSeen = true;
s.onboarded = true;
s.stats = { ...s.stats, bought: (s.stats?.bought ?? 0) + s.fish.length };

writeFileSync(path, JSON.stringify(file));
console.log(`fish=${s.fish.length} decor=${s.decor.length} tank=${s.tank.volumeL}L fill=${s.tank.fill} → ${path}`);
