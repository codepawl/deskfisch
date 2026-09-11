import { FISH_NAMES, SUPPLIES, DECOR, FILTERS, HEATERS, AIR_PUMPS, LIGHTS, TANKS } from "../data/items";
import { doWaterChange } from "./tank";
import { treat } from "./disease";
import { SPECIES } from "../data/species";
import { pick, rand } from "../engine/rng";
import type { Bounds } from "./fish";
import { newBag } from "./bag";
import type { GameState } from "./state";

/** Purchase rules for every shop item. Each returns an error message or null on success. */

function pay(state: GameState, price: number): string | null {
  if (state.coins < price) return "Not enough coins.";
  state.coins -= price;
  return null;
}

export function buyFish(state: GameState, speciesId: string, water: Bounds): string | null {
  const sp = SPECIES[speciesId];
  const err = pay(state, sp.price);
  if (err) return err;
  const taken = new Set([...state.fish, ...state.bags].map((f) => f.name));
  const free = FISH_NAMES.filter((n) => !taken.has(n));
  const name = free.length ? pick(free) : `${sp.name} ${state.nextFishId}`;
  state.bags.push(newBag(state, sp.id, name, water));
  return null;
}

export function buySupply(state: GameState, id: string): string | null {
  const item = SUPPLIES.find((i) => i.id === id)!;
  if ((id === "thermometer" || id === "testKit") && state.equipment[id]) return "Already owned.";
  const err = pay(state, item.price);
  if (err) return err;
  switch (id) {
    case "flakes":
      state.inventory.flakes = (state.inventory.flakes ?? 0) + 10;
      break;
    case "conditioner":
      state.inventory.conditioner = (state.inventory.conditioner ?? 0) + 5;
      break;
    case "bacteria":
      state.tank.bactA += 0.15;
      state.tank.bactB += 0.15;
      break;
    case "thermometer":
    case "testKit":
      state.equipment[id] = true;
      break;
    case "ichMed":
      treat(state, "ich");
      break;
    case "finrotMed":
      treat(state, "finrot");
      break;
  }
  return null;
}

export function buyDecor(state: GameState, kind: string, water: Bounds): string | null {
  const item = DECOR.find((d) => d.id === kind)!;
  const err = pay(state, item.price);
  if (err) return err;
  state.decor.push({ kind, x: Math.round(rand(water.x0 + 10, water.x1 - 30)) });
  return null;
}

export type GearKey = "tank" | "filter" | "heater" | "airPump" | "light";
export const GEAR: Record<GearKey, { label: string; tiers: { name: string; price: number }[] }> = {
  tank: { label: "Tank", tiers: TANKS },
  filter: { label: "Filter", tiers: FILTERS },
  heater: { label: "Heater", tiers: HEATERS },
  airPump: { label: "Air pump", tiers: AIR_PUMPS },
  light: { label: "Light", tiers: LIGHTS },
};

/** Upgrade one piece of gear to the next tier. */
export function upgradeGear(state: GameState, key: GearKey): string | null {
  const next = GEAR[key].tiers[state.equipment[key] + 1];
  if (!next) return "Already the best.";
  const err = pay(state, next.price);
  if (err) return err;
  state.equipment[key] += 1;
  if (key === "light") state.equipment.lightOn = true;
  if (key === "tank") {
    // The extra volume is fresh tap water, so it behaves like a partial water change.
    const before = state.tank.volumeL;
    state.tank.volumeL = TANKS[state.equipment.tank].volumeL;
    doWaterChange(state, 1 - before / state.tank.volumeL);
  }
  return null;
}

/** Resale value drops for young fish. */
export function sellPrice(state: GameState, fishId: number): number {
  const f = state.fish.find((x) => x.id === fishId)!;
  return Math.floor(SPECIES[f.speciesId].price * (0.4 + f.size * 0.5));
}

/** Sell a live fish, or scoop a dead one out for nothing. */
export function removeFish(state: GameState, fishId: number): void {
  const idx = state.fish.findIndex((x) => x.id === fishId);
  if (idx < 0) return;
  if (state.fish[idx].alive) state.coins += sellPrice(state, fishId);
  state.fish.splice(idx, 1);
}
