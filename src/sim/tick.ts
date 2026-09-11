import { CATCHUP_STEP_SECONDS, MAX_CATCHUP_HOURS } from "../data/constants";
import { SPECIES } from "../data/species";
import { happiness, stepFish, wasteLoad } from "./fish";
import type { GameState } from "./state";
import { stepTank } from "./tank";
import { decayPellets } from "./food";

/** Coins per hour from a fully happy fish, as a fraction of its shop price. */
const INCOME_RATE = 0.02;

/** Advance the whole simulation by `seconds` of game time. Returns names of fish that died. */
export function simulate(state: GameState, seconds: number): string[] {
  const hours = seconds / 3600;
  stepTank(state, hours, wasteLoad(state));
  decayPellets(state, hours);
  const died = stepFish(state, hours);
  for (const f of state.fish) {
    state.coins += (happiness(f) / 100) * SPECIES[f.speciesId].price * INCOME_RATE * hours;
  }
  state.ageHours += hours;
  state.simTime += seconds * 1000;
  return died;
}

export interface CatchUp {
  hours: number;
  /** True when the absence exceeded the cap and the remainder was skipped. */
  capped: boolean;
  coinsEarned: number;
  died: string[];
}

/** Gaps at least this long are replayed in coarse steps instead of second by second. */
const COARSE_GAP_SECONDS = 5;

/**
 * Bring the simulation up to wall-clock `now`. Short gaps step one second at a
 * time; anything longer (window hidden, laptop asleep, app closed) is replayed
 * coarsely and summarised. Returns names of fish that died.
 */
export function advance(state: GameState, now = Date.now()): { died: string[]; away: CatchUp | null } {
  const gap = (now - state.simTime) / 1000;
  if (gap >= COARSE_GAP_SECONDS) {
    const away = catchUp(state, now);
    return { died: away?.died ?? [], away };
  }
  const died: string[] = [];
  while (now - state.simTime >= 1000) died.push(...simulate(state, 1));
  return { died, away: null };
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
  const died: string[] = [];
  while (remaining > 0) {
    const step = Math.min(CATCHUP_STEP_SECONDS, remaining);
    died.push(...simulate(state, step));
    remaining -= step;
  }
  state.simTime = now;
  return { hours: elapsed / 3600, capped, coinsEarned: state.coins - coinsBefore, died };
}
