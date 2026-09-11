import { FISH_NAMES } from "../data/items";
import { SPECIES } from "../data/species";
import { pick, rand, randInt } from "../engine/rng";
import type { Bounds, Fish } from "./fish";
import { spawnFish, wasteLoad } from "./fish";
import type { GameState } from "./state";
import { isCycled } from "./tank";

/** Game hours a female carries fry before giving birth. */
export const GESTATION_HOURS = 24;
/** Hours after a birth before she can carry again. */
export const BREED_COOLDOWN_HOURS = 48;
const ADULT_SIZE = 0.8;
const FRY_SIZE = 0.15;

/** A species breeds only when the pair is comfortable and the tank can take more fish. */
export function canBreed(state: GameState, female: Fish): boolean {
  const sp = SPECIES[female.speciesId];
  if (!sp.breeds || !female.alive || female.sex !== "f") return false;
  if (female.size < ADULT_SIZE || female.stress > 30 || female.hunger > 50) return false;
  if ((female.breedCooldown ?? 0) > 0) return false;
  if (!isCycled(state)) return false;
  if (wasteLoad(state) >= state.tank.volumeL / 10) return false;
  return state.fish.some((m) => m.alive && m.speciesId === sp.id && m.sex === "m" && m.size >= ADULT_SIZE && m.stress <= 30);
}

/** Advance gestation and deliver fry. Returns one record per birth. */
export interface Birth { name: string; n: number }
export function stepBreeding(state: GameState, hours: number, water: Bounds): Birth[] {
  const births: Birth[] = [];
  for (const f of state.fish) {
    if (f.breedCooldown) f.breedCooldown = Math.max(0, f.breedCooldown - hours);
    if (!canBreed(state, f)) {
      // Carrying fry survives a rough patch, but starting needs good conditions.
      if (!f.gravidHours) continue;
      if (!f.alive) {
        f.gravidHours = 0;
        continue;
      }
    }
    f.gravidHours = (f.gravidHours ?? 0) + hours;
    if (f.gravidHours < GESTATION_HOURS) continue;
    const count = randInt(2, 4);
    for (let i = 0; i < count; i++) state.fish.push(fry(state, f, water));
    state.stats.born += count;
    f.gravidHours = 0;
    f.breedCooldown = BREED_COOLDOWN_HOURS;
    births.push({ name: f.name, n: count });
  }
  return births;
}

function fry(state: GameState, mother: Fish, water: Bounds): Fish {
  const sp = SPECIES[mother.speciesId];
  const taken = new Set(state.fish.map((x) => x.name));
  const free = FISH_NAMES.filter((n) => !taken.has(n));
  const name = free.length ? pick(free) : `${sp.name} fry ${state.nextFishId}`;
  const baby = spawnFish(sp, name, water, state.nextFishId++);
  baby.x = mother.x + rand(-8, 8);
  baby.y = mother.y + rand(-4, 4);
  baby.size = FRY_SIZE;
  baby.hunger = 40;
  return baby;
}
