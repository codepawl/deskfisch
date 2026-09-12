import { CATCHUP_STEP_SECONDS, MAX_CATCHUP_HOURS } from "../data/constants";
import { SPECIES } from "../data/species";
import { happiness, stepFish, wasteLoad } from "./fish";
import type { GameState } from "./state";
import { syncGrime } from "./grime";
import { stepTank } from "./tank";
import { decayPellets } from "./food";
import { stepBags } from "./bag";
import { stepBreeding, type Birth } from "./breeding";
import { stepDisease, type Illness } from "./disease";
import { simSpeed } from "./clock";
import type { Bounds } from "./fish";

/** Where fry appear; the scene sets the real tank bounds at boot. */
export const SIM_WATER: Bounds = { x0: 0, y0: 0, x1: 384, y1: 240 };

/** Coins per hour from a fully happy fish, as a fraction of its shop price. */
const INCOME_RATE = 0.02;

export interface SimEvents {
  /** Names of fish that died. */
  died: string[];
  born: Birth[];
  sick: Illness[];
}

/**
 * Advance the whole simulation by `seconds` of game time. Callers own
 * `simTime`, the wall-clock anchor, since game time can run faster than real time.
 */
export function simulate(state: GameState, seconds: number): SimEvents {
  const hours = seconds / 3600;
  stepTank(state, hours, wasteLoad(state));
  syncGrime(state, SIM_WATER);
  decayPellets(state, hours);
  stepBags(state, hours);
  const sick = stepDisease(state, hours);
  const died = stepFish(state, hours);
  const born = stepBreeding(state, hours, SIM_WATER);
  for (const f of state.fish) {
    const income = (happiness(f) / 100) * SPECIES[f.speciesId].price * INCOME_RATE * hours;
    state.coins += income;
    state.stats.coinsEarned += income;
  }
  state.ageHours += hours;
  return { died, born, sick };
}

function merge(into: SimEvents, from: SimEvents): void {
  into.died.push(...from.died);
  into.born.push(...from.born);
  into.sick.push(...from.sick);
}

export interface CatchUp extends SimEvents {
  hours: number;
  /** True when the absence exceeded the cap and the remainder was skipped. */
  capped: boolean;
  coinsEarned: number;
}

/** Gaps at least this long are replayed in coarse steps instead of second by second. */
const COARSE_GAP_SECONDS = 5;

/**
 * Bring the simulation up to wall-clock `now`. Short gaps step one second at a
 * time; anything longer (window hidden, laptop asleep, app closed) is replayed
 * coarsely and summarised. Returns names of fish that died.
 */
export function advance(state: GameState, now = Date.now()): SimEvents & { away: CatchUp | null } {
  const gap = (now - state.simTime) / 1000;
  if (gap >= COARSE_GAP_SECONDS) {
    const away = catchUp(state, now);
    return { died: away?.died ?? [], born: away?.born ?? [], sick: away?.sick ?? [], away };
  }
  const events: SimEvents = { died: [], born: [], sick: [] };
  while (now - state.simTime >= 1000) {
    merge(events, simulate(state, simSpeed(state)));
    state.simTime += 1000;
  }
  return { ...events, away: null };
}

/** Simulate time that passed while the app was closed, in coarse steps. */
export function catchUp(state: GameState, now = Date.now()): CatchUp | null {
  const elapsed = Math.max(0, (now - state.simTime) / 1000);
  if (elapsed < 5) {
    state.simTime = now;
    return null;
  }
  const capped = elapsed > MAX_CATCHUP_HOURS * 3600;
  let remaining = Math.min(elapsed, MAX_CATCHUP_HOURS * 3600);
  const coinsBefore = state.coins;
  const events: SimEvents = { died: [], born: [], sick: [] };
  // Offline time is replayed at normal speed; a sped-up sim would otherwise
  // burn through days of chemistry while the app was closed.
  while (remaining > 0) {
    const step = Math.min(CATCHUP_STEP_SECONDS, remaining);
    merge(events, simulate(state, step));
    remaining -= step;
  }
  state.simTime = now;
  return { ...events, hours: elapsed / 3600, capped, coinsEarned: state.coins - coinsBefore };
}
