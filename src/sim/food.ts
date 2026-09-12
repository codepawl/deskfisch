import { rand } from "../engine/rng";
import { floorAt, type Bounds, type Fish } from "./fish";
import type { GameState } from "./state";

export interface Pellet {
  x: number;
  y: number;
  /** Sink speed px/s; 0 while floating or once it rests on the substrate. */
  vy: number;
  /** Seconds left held at the surface by surface tension; 0 once it has sunk or was placed under water. */
  float: number;
  /** Hours since dropped. */
  age: number;
}

/** A pellet a fish can reach and eat within this distance. */
export const EAT_RADIUS = 5;
/** How far a hungry fish notices food. */
export const SMELL_RADIUS = 160;
export const HUNGER_PER_PELLET = 20;
/** Uneaten food rots after this long, dumping ammonia into the water. */
export const ROT_HOURS = 2;
/** Older than this a pellet is visibly going off: pale fuzz, fish stop wanting it. */
export const STALE_HOURS = 0.75;
const NH3_PER_ROTTEN_PELLET = 0.03;

export function isStale(p: Pellet): boolean {
  return p.age >= STALE_HOURS;
}

/** Seconds a dry flake sits on the surface before it soaks and sinks. */
const FLOAT_SECONDS: [number, number] = [12, 35];
/** Share of a pinch that sinks straight away instead of floating. */
const SINK_AT_ONCE = 0.35;

/**
 * Drop a pinch. From above the water (no `y`, or `y` at the surface) the flakes
 * land dry and float for a while, where only surface feeders reach them. Placed
 * under water, as with a pipette or a wet hand, they sink from that depth at once.
 */
export function dropPellets(state: GameState, x: number, count: number, water: Bounds, y?: number): void {
  const underWater = y !== undefined && y > water.y0 + 2;
  for (let i = 0; i < count; i++) {
    if (underWater) {
      state.pellets.push({ x: x + rand(-4, 4), y: Math.min(y, floorAt(water, x, 1)), vy: rand(10, 16), float: 0, age: 0 });
    } else if (Math.random() < SINK_AT_ONCE) {
      // The bigger, heavier bits break the surface and go straight down.
      state.pellets.push({ x: x + rand(-6, 6), y: water.y0 + 1, vy: rand(10, 16), float: 0, age: 0 });
    } else {
      state.pellets.push({ x: x + rand(-6, 6), y: water.y0 + 1, vy: 0, float: rand(FLOAT_SECONDS[0], FLOAT_SECONDS[1]), age: 0 });
    }
  }
}

export function isFloating(p: Pellet): boolean {
  return p.float > 0;
}

/** Per-frame: pellets sink and settle on the substrate. */
export function updatePellets(state: GameState, water: Bounds, dt: number): void {
  for (const p of state.pellets) {
    if (p.float > 0) {
      // Drifting on the surface film until it soaks through.
      p.float -= dt;
      p.y = water.y0 + 1;
      p.x = Math.min(water.x1 - 2, Math.max(water.x0, p.x + Math.sin(p.age * 700 + p.x * 0.2) * 2 * dt));
      if (p.float <= 0) {
        p.float = 0;
        p.vy = rand(10, 16);
      }
      continue;
    }
    if (p.vy === 0) continue;
    p.y += p.vy * dt;
    p.x += Math.sin(p.y * 0.3) * 4 * dt;
    const floor = floorAt(water, p.x, 1);
    if (p.y >= floor) {
      p.y = floor;
      p.vy = 0;
    }
  }
}

/** Nearest pellet a hungry fish would go for, or null. */
export function nearestPellet(state: GameState, f: Fish, bottomDweller = false): Pellet | null {
  let best: Pellet | null = null;
  let bestD = SMELL_RADIUS;
  for (const p of state.pellets) {
    // Bottom dwellers do not come up for floating flakes; they wait for what sinks.
    if (bottomDweller && p.float > 0) continue;
    // Nobody eats food that has started to rot; the siphon is the only way out for it.
    if (isStale(p)) continue;
    const d = Math.hypot(p.x - f.x, p.y - f.y);
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

/** Per-tick: age pellets; rotten ones become ammonia and dirt. */
export function decayPellets(state: GameState, hours: number): void {
  let rotten = 0;
  state.pellets = state.pellets.filter((p) => {
    p.age += hours;
    if (p.age < ROT_HOURS) return true;
    rotten++;
    return false;
  });
  state.tank.nh3 += rotten * NH3_PER_ROTTEN_PELLET;
  state.tank.dirt = Math.min(100, state.tank.dirt + rotten * 2);
}

/** Leftover food lying on the sand that nobody will eat any more. */
export function leftovers(state: GameState): Pellet[] {
  return state.pellets.filter((p) => p.vy === 0 && p.float === 0 && isStale(p));
}
