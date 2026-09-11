import { clamp, rand } from "../engine/rng";
import { HOURS_TO_STARVE, STRESS_EASE_PER_HOUR } from "../data/constants";
import { SPECIES, type Species } from "../data/species";
import type { GameState } from "./state";

export interface Fish {
  id: number;
  speciesId: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  /** Seconds until a new wander target is picked. */
  retarget: number;
  tx: number;
  ty: number;
  /** Animation phase for tail flap and bobbing. */
  phase: number;
  ageHours: number;
  /** 0 = just born .. 1 = full adult size. */
  size: number;
  /** 0 = just fed .. 100 = starving. */
  hunger: number;
  stress: number;
  health: number;
  alive: boolean;
}

export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function spawnFish(sp: Species, name: string, water: Bounds, id: number): Fish {
  const x = rand(water.x0 + 20, water.x1 - 20);
  const y = depthY(sp, water);
  return {
    id, speciesId: sp.id, name, x, y, vx: 0, vy: 0, facing: 1, retarget: 0, tx: x, ty: y, phase: rand(0, 6),
    ageHours: 0, size: 0.5, hunger: 30, stress: 20, health: 100, alive: true,
  };
}

function depthY(sp: Species, w: Bounds): number {
  const h = w.y1 - w.y0;
  return w.y0 + h * rand(sp.depth[0], sp.depth[1]);
}

/** Wander: drift toward a target, pick a new one when reached or on a timer. Dead fish float up. */
export function moveFish(f: Fish, sp: Species, water: Bounds, dt: number): void {
  const w = sp.frames[0].w;
  const h = sp.frames[0].h;
  if (!f.alive) {
    f.vx *= 0.9;
    f.y = Math.max(water.y0 + 1, f.y - 6 * dt);
    f.x = clamp(f.x + f.vx * dt, water.x0, water.x1 - w);
    return;
  }
  f.retarget -= dt;
  const dx = f.tx - f.x;
  const dy = f.ty - f.y;
  if (f.retarget <= 0 || Math.hypot(dx, dy) < 4) {
    f.tx = rand(water.x0 + w, water.x1 - w);
    f.ty = depthY(sp, water);
    f.retarget = rand(2, 6);
  }
  // Stressed fish are sluggish; fish are slow to turn so velocity eases toward the target.
  const speed = sp.speed * (1 - f.stress / 200);
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ease = 1 - Math.exp(-dt * 1.5);
  f.vx += ((dx / dist) * speed - f.vx) * ease;
  f.vy += ((dy / dist) * speed * 0.5 - f.vy) * ease;
  f.x = clamp(f.x + f.vx * dt, water.x0, water.x1 - w);
  f.y = clamp(f.y + f.vy * dt, water.y0, water.y1 - h);
  if (Math.abs(f.vx) > 2) f.facing = f.vx > 0 ? 1 : -1;
  f.phase += dt * (2 + (Math.abs(f.vx) / sp.speed) * 4);
}

/** Ammonia-producing load of everything in the tank, in "standard fish" units. */
export function wasteLoad(state: GameState): number {
  let load = 0;
  for (const f of state.fish) {
    const sp = SPECIES[f.speciesId];
    load += f.alive ? sp.bioload * (0.5 + f.size * 0.5) : sp.bioload * 3;
  }
  return load;
}

export function happiness(f: Fish): number {
  if (!f.alive) return 0;
  return (100 - f.stress) * (1 - f.hunger / 200);
}

/** Stress level the current water and social conditions push a fish toward. */
export function stressTarget(state: GameState, f: Fish): number {
  const sp = SPECIES[f.speciesId];
  const t = state.tank;
  let s = 0;
  s += Math.min(60, outside(t.temp, sp.tempRange) * 15);
  s += Math.min(40, outside(t.pH, sp.phRange) * 25);
  // Free ammonia is far more toxic in alkaline water.
  const toxicNh3 = t.nh3 * (1 + Math.max(0, t.pH - 7) * 0.6);
  s += toxicNh3 * 40;
  s += t.no2 * 30;
  s += Math.max(0, t.no3 - 40) * 0.5;
  s += Math.max(0, 5 - t.o2) * 20;
  s += t.chlorine * 60;
  s += Math.max(0, f.hunger - 60) * 0.5;
  if (sp.minGroup > 1) {
    const kin = state.fish.filter((o) => o.alive && o.speciesId === sp.id).length;
    if (kin < sp.minGroup) s += 15;
  }
  const crowding = wasteLoad(state) - t.volumeL / 10;
  if (crowding > 0) s += crowding * 10;
  return clamp(s, 0, 100);
}

function outside(v: number, [lo, hi]: readonly [number, number]): number {
  return v < lo ? lo - v : v > hi ? v - hi : 0;
}

/** Advance hunger, stress, health and age by `hours`. Returns names of fish that died. */
export function stepFish(state: GameState, hours: number): string[] {
  const died: string[] = [];
  for (const f of state.fish) {
    if (!f.alive) continue;
    const sp = SPECIES[f.speciesId];
    f.hunger = clamp(f.hunger + (100 / HOURS_TO_STARVE) * hours, 0, 100);
    f.stress += (stressTarget(state, f) - f.stress) * Math.min(1, STRESS_EASE_PER_HOUR * hours);
    if (f.stress > 60) {
      f.health -= ((f.stress - 60) / 40) * 4 * hours;
    } else if (f.stress < 30 && f.hunger < 70) {
      f.health += 1 * hours;
    }
    if (f.hunger >= 100) f.health -= 2 * hours;
    f.ageHours += hours;
    f.size = Math.min(1, f.size + hours / (30 * 24));
    if (f.ageHours > sp.lifespanDays * 24) f.health -= 0.5 * hours;
    f.health = clamp(f.health, 0, 100);
    if (f.health <= 0) {
      f.alive = false;
      died.push(f.name);
    }
  }
  return died;
}
