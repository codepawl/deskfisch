import { clamp } from "../engine/rng";
import { SPECIES } from "../data/species";
import { spawnFish, type Bounds, type Fish } from "./fish";
import type { GameState } from "./state";

/** A new fish floating in its shop bag until the player acclimates and releases it. */
export interface Bag {
  id: number;
  speciesId: string;
  name: string;
  /** Position of the bag's left edge along the surface. */
  x: number;
  temp: number;
  pH: number;
  /** Epoch ms when the bag was floated. */
  floatedAt: number;
  /** Times tank water has been mixed in. */
  waterAdds: number;
  /** Epoch ms of the last mix, so adds are spaced out. */
  lastAddAt: number;
}

/** Water the fish shop keeps its fish in. */
export const SHOP_WATER = { temp: 24, pH: 7.0 };
/** Float this long for the bag temperature to match the tank. */
export const FLOAT_MINUTES = 10;
export const ADDS_NEEDED = 3;
export const ADD_INTERVAL_MINUTES = 2;
/** Fraction of bag water replaced by tank water per add. */
const MIX_FRACTION = 0.35;

export function newBag(state: GameState, speciesId: string, name: string, water: Bounds, now = Date.now()): Bag {
  // Space bags along the surface so several can float at once.
  const slot = state.bags.length;
  return {
    id: state.nextFishId++,
    speciesId,
    name,
    x: clamp(water.x0 + 30 + slot * 40, water.x0, water.x1 - 30),
    temp: SHOP_WATER.temp,
    pH: SHOP_WATER.pH,
    floatedAt: now,
    waterAdds: 0,
    lastAddAt: 0,
  };
}

/** Bag temperature drifts toward the tank's; a 10 minute float closes most of the gap. */
export function stepBags(state: GameState, hours: number): void {
  const rate = 1 - Math.exp((-hours * 60 * 3) / FLOAT_MINUTES);
  for (const b of state.bags) b.temp += (state.tank.temp - b.temp) * rate;
}

export function secondsUntilNextAdd(bag: Bag, now = Date.now()): number {
  const since = (now - Math.max(bag.floatedAt, bag.lastAddAt)) / 1000;
  return Math.max(0, ADD_INTERVAL_MINUTES * 60 - since);
}

export function addTankWater(state: GameState, bag: Bag, now = Date.now()): string | null {
  if (bag.waterAdds >= ADDS_NEEDED) return "The bag is full.";
  if (secondsUntilNextAdd(bag, now) > 0) return "Wait a little between adds.";
  bag.pH += (state.tank.pH - bag.pH) * MIX_FRACTION;
  bag.temp += (state.tank.temp - bag.temp) * MIX_FRACTION;
  bag.waterAdds += 1;
  bag.lastAddAt = now;
  return null;
}

/** Extra stress from releasing before the bag matches the tank. 0 when fully acclimated. */
export function releaseShock(state: GameState, bag: Bag): number {
  const tempGap = Math.abs(state.tank.temp - bag.temp);
  const phGap = Math.abs(state.tank.pH - bag.pH);
  const missingAdds = ADDS_NEEDED - bag.waterAdds;
  return clamp(tempGap * 15 + phGap * 40 + missingAdds * 8, 0, 80);
}

/** Take the fish out of the bag into the tank at (x, y). */
export function releaseBag(state: GameState, bag: Bag, x: number, y: number, water: Bounds): Fish {
  const sp = SPECIES[bag.speciesId];
  const f = spawnFish(sp, bag.name, water, bag.id);
  f.x = clamp(x, water.x0, water.x1 - sp.frames[0].w);
  f.y = clamp(y, water.y0, water.y1 - sp.frames[0].h);
  f.stress = clamp(20 + releaseShock(state, bag), 0, 100);
  state.fish.push(f);
  state.bags.splice(state.bags.indexOf(bag), 1);
  return f;
}
