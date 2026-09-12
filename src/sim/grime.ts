/**
 * Grime you can see and clean spot by spot. Two kinds share one shape:
 * mulm (settled waste) lies on the sand and follows `tank.dirt`; algae film
 * grows on the front glass and follows `tank.algae`. The scalars keep driving
 * chemistry; the spots are where the scalars show, and the vacuum and scraper
 * work on the spots under them.
 */
import { rand } from "../engine/rng";
import type { GameState } from "./state";
import type { Bounds } from "./fish";

export interface Spot {
  x: number;
  y: number;
  /** 1 or 2: bigger spots for older grime. */
  s: number;
}

const MULM_PER_DIRT = 0.6;
const MULM_MAX = 60;
const ALGAE_PER_POINT = 0.45;
const ALGAE_MAX = 45;

function lists(state: GameState): { mulm: Spot[]; algae: Spot[] } {
  const t = state.tank as { mulm?: Spot[]; algaeSpots?: Spot[] };
  t.mulm ??= [];
  t.algaeSpots ??= [];
  return { mulm: t.mulm, algae: t.algaeSpots };
}

/** Bring the visible spots in line with the scalars: grow into empty places, thin out when the water clears. */
export function syncGrime(state: GameState, water: Bounds): void {
  const { mulm, algae } = lists(state);
  const mulmTarget = Math.min(MULM_MAX, Math.round(state.tank.dirt * MULM_PER_DIRT));
  while (mulm.length < mulmTarget) mulm.push({ x: Math.round(rand(water.x0 + 2, water.x1 - 3)), y: 0, s: Math.random() < 0.3 ? 2 : 1 });
  while (mulm.length > mulmTarget) mulm.splice(Math.floor(Math.random() * mulm.length), 1);
  const algaeTarget = Math.min(ALGAE_MAX, Math.round(state.tank.algae * ALGAE_PER_POINT));
  while (algae.length < algaeTarget) {
    // Film starts near the top where the light is and creeps down.
    const depth = Math.pow(Math.random(), 1.6);
    algae.push({ x: Math.round(rand(water.x0 + 2, water.x1 - 4)), y: Math.round(water.y0 + 2 + depth * (water.y1 - water.y0 - 20)), s: Math.random() < 0.4 ? 2 : 1 });
  }
  while (algae.length > algaeTarget) algae.splice(Math.floor(Math.random() * algae.length), 1);
}

export function mulmOf(state: GameState): Spot[] {
  return lists(state).mulm;
}

export function algaeOf(state: GameState): Spot[] {
  return lists(state).algae;
}

/**
 * Siphon at x: takes the mulm within reach (and the dirt it stands for), any
 * food lying on the sand there, a pinch of sand, and a little water.
 * Returns how many spots and pellets it swallowed so the scene can show it.
 */
export function vacuumAt(state: GameState, x: number, reach: number, dt: number, floor: (x: number) => number): { spots: number; pellets: number } {
  const { mulm } = lists(state);
  let spots = 0;
  for (let i = mulm.length - 1; i >= 0; i--) {
    if (Math.abs(mulm[i].x - x) <= reach) {
      mulm.splice(i, 1);
      spots++;
    }
  }
  if (spots > 0) state.tank.dirt = Math.max(0, state.tank.dirt - spots / MULM_PER_DIRT);
  // Slow background pull for the fine stuff between spots.
  state.tank.dirt = Math.max(0, state.tank.dirt - 4 * dt);
  const before = state.pellets.length;
  state.pellets = state.pellets.filter((p) => !(p.vy === 0 && p.float === 0 && Math.abs(p.x - x) <= reach && p.y >= floor(p.x) - 2));
  // A siphon takes water with it: a few tenths of a percent a second.
  state.tank.fill = Math.max(0.5, state.tank.fill - 0.0015 * dt);
  return { spots, pellets: before - state.pellets.length };
}

/** Scraper at (x, y): lifts the algae film within reach and the share of algae it stands for. */
export function scrapeAt(state: GameState, x: number, y: number, reach: number, dt: number): number {
  const { algae } = lists(state);
  let n = 0;
  for (let i = algae.length - 1; i >= 0; i--) {
    if (Math.hypot(algae[i].x - x, algae[i].y - y) <= reach) {
      algae.splice(i, 1);
      n++;
    }
  }
  if (n > 0) state.tank.algae = Math.max(0, state.tank.algae - n / ALGAE_PER_POINT);
  state.tank.algae = Math.max(0, state.tank.algae - 3 * dt);
  return n;
}
