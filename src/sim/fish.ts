import { clamp, rand } from "../engine/rng";
import { HOURS_TO_STARVE, STRESS_EASE_PER_HOUR } from "../data/constants";
import { SPECIES, type Species } from "../data/species";
import { DECOR_COMFORT, MAX_DECOR_COMFORT } from "../data/items";
import { HEALTH_LOSS } from "./disease";
import { rulesFor } from "./rules";
import type { GameState } from "./state";
import { EAT_RADIUS, HUNGER_PER_PELLET, nearestPellet } from "./food";

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
  /** Speed multiplier for the current intent (chasing, hiding...). */
  pace?: number;
  /** Seconds of a pending fright: the fish has noticed the knock but not reacted yet. */
  spook?: number;
  spookX?: number;
  spookY?: number;
  /** Seconds the fish keeps its distance from the last scare. */
  wary?: number;
  /** Seconds a picky fish ignores food after turning its nose up at a pellet. */
  snub?: number;
  sex: "m" | "f";
  /** Hours a female has carried fry; 0 or absent when not gravid. */
  gravidHours?: number;
  /** Hours until she can carry again. */
  breedCooldown?: number;
  sick?: "ich" | "finrot";
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
  /** Top of the substrate at a column; defaults to y1 when absent. */
  floor?: (x: number) => number;
}

/** Lowest y an object of height `h` may occupy at column x. */
export function floorAt(b: Bounds, x: number, h = 0): number {
  return (b.floor ? b.floor(x) : b.y1) - h;
}

export function spawnFish(sp: Species, name: string, water: Bounds, id: number): Fish {
  const x = rand(water.x0 + 20, water.x1 - 20);
  const y = depthY(sp, water);
  return {
    id, speciesId: sp.id, name, x, y, vx: 0, vy: 0, facing: 1, retarget: 0, tx: x, ty: y, phase: rand(0, 6),
    ageHours: 0, size: 0.5, hunger: 30, stress: 20, health: 100, alive: true,
    sex: Math.random() < 0.5 ? "m" : "f",
  };
}

function depthY(sp: Species, w: Bounds, x = (w.x0 + w.x1) / 2): number {
  const h = floorAt(w, x, sp.frames[0].h) - w.y0;
  return w.y0 + Math.max(0, h) * rand(sp.depth[0], sp.depth[1]);
}

/** The pointer holding food; hungry fish gather under it. */
export interface Lure {
  x: number;
}

/** About two fish in five care what a finger on the glass is doing. Stable per fish. */
export function isCurious(f: Fish): boolean {
  return (f.id * 7919) % 5 < 2;
}

/** A knock on the glass: fish within `radius` dart away from the point for a moment. */
/**
 * Appetite, species and individual. Species: how keen a kind is on flake
 * (guppies and mollies eat anything, bettas and otos are picky, corys wait
 * for what sinks). Individual: a stable "greed" from the id so two neons
 * are not the same fish. Returns the hunger a fish must reach before it
 * bothers, how much one pellet fills it, and the odds it passes on a pellet.
 */
export function appetite(f: Fish, sp: Species): { threshold: number; fill: number; ignore: number } {
  const greed = 0.75 + ((f.id * 71) % 100) / 100 * 0.5; // 0.75 .. 1.25, fixed per fish
  let keen = 1; // species keenness on dry food
  if (sp.id === "guppy" || sp.id === "molly" || sp.id === "danio") keen = 1.25;
  if (sp.id === "betta" || sp.id === "oto") keen = 0.6;
  if (sp.id === "angel") keen = 0.85;
  const k = keen * greed;
  return {
    threshold: Math.max(5, 40 - 25 * (k - 0.75) / 0.8), // gluttons start at ~5, picky ones wait until ~40
    fill: HUNGER_PER_PELLET * (0.7 + 0.5 * (k - 0.75) / 0.8),
    ignore: Math.max(0, 0.35 - 0.35 * (k - 0.75) / 0.8), // picky fish sometimes look and turn away
  };
}

/**
 * How much a species holds its ground: 0 darts at anything (tetras, danios),
 * 1 barely flinches unless something is right on it (betta, angelfish).
 */
export function boldness(sp: Species): number {
  if (sp.id === "betta" || sp.id === "angel") return 1;
  if (sp.id === "molly" || sp.id === "guppy") return 0.5;
  if (sp.depth[0] >= 0.8) return 0.35;
  return 0;
}

/**
 * A knock on the glass. Nobody moves at once: each fish notices after its own
 * short delay (bold ones later, sometimes not at all), then flees in moveFish.
 */
export function startle(state: GameState, x: number, y: number, _water: Bounds, radius = 90): number {
  let hit = 0;
  for (const f of state.fish) {
    if (!f.alive) continue;
    const sp = SPECIES[f.speciesId];
    const b = boldness(sp);
    const w = sp.frames[0].w;
    const d = Math.hypot(f.x + w / 2 - x, f.y - y);
    if (d > radius * (1.2 - 0.7 * b)) continue;
    if (b >= 1 && d > 45 && Math.random() < 0.6) continue; // a betta mostly just looks
    f.spook = rand(0.04, 0.3) + b * 0.25;
    f.spookX = x;
    f.spookY = y;
    hit++;
  }
  return hit;
}

/** The fright lands: dart away with some scatter, bold fish less far, bottom dwellers then freeze. */
function flee(f: Fish, sp: Species, water: Bounds, x: number, y: number): void {
  const w = sp.frames[0].w;
  const h = sp.frames[0].h;
  const b = boldness(sp);
  const cx = f.x + w / 2;
  const away = cx >= x ? 1 : -1;
  const angle = rand(-0.6, 0.6); // not straight along the line from the knock
  const run = (50 + rand(0, 60)) * (1 - 0.6 * b);
  f.tx = clamp(cx + away * Math.cos(angle) * run - w / 2, water.x0, water.x1 - w);
  f.ty = clamp(f.y + Math.sin(angle) * run * 0.6 + rand(-8, 8), water.y0, floorAt(water, f.tx, h));
  f.retarget = rand(0.5, 1.1);
  f.pace = rand(2, 2.8) * (1 - 0.3 * b);
  f.vx += away * (25 + rand(0, 30)) * (1 - 0.5 * b);
  f.wary = rand(2, 5) * (1 - 0.5 * b);
  f.spookX = x;
  f.spookY = y;
  f.stress = clamp(f.stress + 1.5 * (1 - 0.6 * b), 0, 100);
}

/** A hand or tool working in the water: fish give it room while it is there. */
export interface Threat {
  x: number;
  y: number;
}

/** Nudge away from a threat: a smooth push that grows as it gets closer, plus a bit of nerves. */
function avoid(f: Fish, sp: Species, water: Bounds, dt: number, threat: Threat): void {
  const w = sp.frames[0].w;
  const b = boldness(sp);
  const cx = f.x + w / 2;
  const dx = cx - threat.x;
  const dy = f.y + sp.frames[0].h / 2 - threat.y;
  const d = Math.max(4, Math.hypot(dx, dy));
  const reach = 70 * (1.1 - 0.7 * b);
  if (d > reach) return;
  const push = ((reach - d) / reach) * 140 * (1 - 0.5 * b);
  f.vx += (dx / d) * push * dt + rand(-6, 6) * dt;
  f.vy += (dy / d) * push * dt * 0.7;
  f.wary = Math.max(f.wary ?? 0, 1.2);
  f.spookX = threat.x;
  f.spookY = threat.y;
  // Bottom dwellers scoot a little way and sit tight rather than swim off.
  if (sp.depth[0] >= 0.8 && d < 35 && (f.retarget ?? 0) < 0.2) {
    f.tx = clamp(cx + Math.sign(dx || 1) * rand(25, 45) - w / 2, water.x0, water.x1 - w);
    f.ty = floorAt(water, f.tx + w / 2, sp.frames[0].h);
    f.retarget = rand(1.5, 3);
    f.pace = 2.2;
  }
}

/** Per-fish position inside its school, stable across sessions. */
function schoolOffset(f: Fish): { x: number; y: number } {
  return { x: ((f.id * 37) % 25) - 12, y: ((f.id * 53) % 15) - 7 };
}

/** Wander: drift toward a target, pick a new one when reached or on a timer. Dead fish float up. */
/** A finger resting on the glass; curious fish come over for a look. */
export interface Poke {
  x: number;
  y: number;
}

export function moveFish(f: Fish, sp: Species, water: Bounds, dt: number, state?: GameState, lure: Lure | null = null, poke: Poke | null = null, threat: Threat | null = null): void {
  const w = sp.frames[0].w;
  const h = sp.frames[0].h;
  if (f.alive && f.spook !== undefined) {
    f.spook -= dt;
    if (f.spook <= 0) {
      f.spook = undefined;
      flee(f, sp, water, f.spookX ?? f.x, f.spookY ?? f.y);
    }
  }
  if (f.alive && (f.wary ?? 0) > 0) f.wary! -= dt;
  if (f.alive && threat) avoid(f, sp, water, dt, threat);
  if (!f.alive) {
    f.vx *= 0.9;
    f.y = Math.max(water.y0 + 1, f.y - 6 * dt);
    f.x = clamp(f.x + f.vx * dt, water.x0, water.x1 - w);
    return;
  }
  f.retarget -= dt;
  const ap = appetite(f, sp);
  // Some fish eat past full; the greedy ones keep going a while after hunger hits 0.
  const food = state && f.hunger > ap.threshold && (f.snub ?? 0) <= 0 ? nearestPellet(state, f, sp.depth[0] >= 0.8) : null;
  if ((f.snub ?? 0) > 0) f.snub! -= dt;
  if (food) {
    // Face the pellet and aim the mouth, not the sprite origin, at it. Facing is
    // pinned while seeking so the target does not flip as the fish settles.
    f.facing = food.x >= f.x + w / 2 ? 1 : -1;
    const mouth = mouthOffset(sp, f.facing);
    if (Math.hypot(f.x + mouth.x - food.x, f.y + mouth.y - food.y) < EAT_RADIUS) {
      if (Math.random() < ap.ignore) {
        // Sniffed it and turned away; leave this one alone for a while.
        f.snub = rand(2, 5);
      } else {
        state!.pellets.splice(state!.pellets.indexOf(food), 1);
        f.hunger = Math.max(0, f.hunger - ap.fill);
      }
    }
    f.tx = clamp(food.x - mouth.x, water.x0, water.x1 - w);
    f.ty = clamp(food.y - mouth.y, water.y0, floorAt(water, food.x, h));
    f.retarget = 0.5;
    f.pace = 1.6;
  } else if (f.retarget <= 0 || Math.hypot(f.tx - f.x, f.ty - f.y) < 4) {
    chooseTarget(f, sp, water, state, lure, poke);
    if ((f.wary ?? 0) > 0 && f.spookX !== undefined && f.spookY !== undefined) {
      // Still nervous: do not wander back toward the scare just yet.
      const dx = f.tx - f.spookX;
      const dy = f.ty - f.spookY;
      const d = Math.hypot(dx, dy);
      if (d < 60) {
        const away = d < 1 ? 1 : dx / d;
        f.tx = clamp(f.spookX + away * 70, water.x0, water.x1 - w);
        f.ty = clamp(f.spookY + (d < 1 ? 0 : dy / d) * 40, water.y0, floorAt(water, f.tx + w / 2, h));
      }
    }
  }
  const dx = f.tx - f.x;
  const dy = f.ty - f.y;
  // Stressed fish are sluggish; fish are slow to turn so velocity eases toward the target.
  const dist = Math.max(1, Math.hypot(dx, dy));
  // Slow down on approach so the fish settles on the target instead of overshooting.
  const speed = Math.min(sp.speed * (1 - f.stress / 200) * (f.pace ?? 1), dist * 3);
  const ease = 1 - Math.exp(-dt * 1.5);
  f.vx += ((dx / dist) * speed - f.vx) * ease;
  // Idle cruising is mostly horizontal; anything urgent (food, lure, hiding) climbs freely.
  const vertical = food || (f.pace ?? 1) !== 1 ? 1 : 0.5;
  f.vy += ((dy / dist) * speed * vertical - f.vy) * ease;
  if (state && sp.minGroup >= 4) separate(f, state, dt);
  f.x = clamp(f.x + f.vx * dt, water.x0, water.x1 - w);
  f.y = clamp(f.y + f.vy * dt, water.y0, floorAt(water, f.x + w / 2, h));
  if (!food && Math.abs(f.vx) > 2) f.facing = f.vx > 0 ? 1 : -1;
  f.phase += dt * (2 + (Math.abs(f.vx) / sp.speed) * 4);
}

/** Pick the next place to swim, by priority: food lure, hiding, rivalry, school, foraging, wander. */
function chooseTarget(f: Fish, sp: Species, water: Bounds, state: GameState | undefined, lure: Lure | null, poke: Poke | null): void {
  const w = sp.frames[0].w;
  const h = sp.frames[0].h;
  const off = schoolOffset(f);
  f.pace = 1;
  if (poke && isCurious(f) && f.stress < 50 && Math.hypot(poke.x - f.x, poke.y - f.y) < 130 && Math.random() < 0.6) {
    // Drift over for a look, mouth toward the finger, then hang there a moment.
    const mouth = mouthOffset(sp, poke.x >= f.x + w / 2 ? 1 : -1);
    f.tx = clamp(poke.x - mouth.x + off.x / 4, water.x0, water.x1 - w);
    f.ty = clamp(poke.y - mouth.y + off.y / 3, water.y0, floorAt(water, f.tx + w / 2, h));
    f.retarget = rand(1.2, 2);
    f.pace = 0.7;
    return;
  }
  if (lure && f.hunger > 25) {
    f.tx = clamp(lure.x + off.x, water.x0, water.x1 - w);
    f.ty = water.y0 + 3 + Math.abs(off.y);
    f.retarget = 0.6;
    f.pace = 1.3;
    return;
  }
  if (state && f.stress > 60 && state.decor.length) {
    const spot = state.decor.reduce((a, b) => (Math.abs(a.x - f.x) < Math.abs(b.x - f.x) ? a : b));
    f.tx = clamp(spot.x + off.x / 3, water.x0, water.x1 - w);
    f.ty = floorAt(water, f.tx + w / 2, h) - Math.abs(off.y);
    f.retarget = rand(3, 6);
    f.pace = 1.2;
    return;
  }
  if (sp.id === "betta" && state) {
    const rival = state.fish.find((o) => o !== f && o.alive && o.speciesId === "betta");
    if (rival) {
      f.tx = clamp(rival.x + (f.x < rival.x ? -w - 4 : w + 4), water.x0, water.x1 - w);
      f.ty = rival.y;
      f.retarget = 1;
      f.pace = 1.3;
      return;
    }
  }
  if (sp.minGroup >= 4 && state) {
    const kin = state.fish.filter((o) => o.alive && o.speciesId === sp.id);
    const leader = kin.reduce((a, b) => (a.id < b.id ? a : b));
    if (leader !== f) {
      // Follow the leader's destination, not its body, so the school moves as one.
      f.tx = clamp(leader.tx + off.x, water.x0, water.x1 - w);
      f.ty = clamp(leader.ty + off.y, water.y0, floorAt(water, f.tx + w / 2, h));
      f.retarget = rand(1, 2);
      return;
    }
  }
  if (sp.depth[0] >= 0.8) {
    // Bottom dwellers forage: short hops along the substrate with pauses.
    if (Math.random() < 0.4) {
      f.tx = f.x;
      f.ty = f.y;
      f.retarget = rand(1, 3);
    } else {
      f.tx = clamp(f.x + rand(-40, 40), water.x0, water.x1 - w);
      f.ty = depthY(sp, water, f.tx + w / 2);
      f.retarget = rand(2, 4);
      f.pace = 0.7;
    }
    return;
  }
  f.tx = rand(water.x0 + w, water.x1 - w);
  f.ty = depthY(sp, water, f.tx + w / 2);
  f.retarget = rand(2, 6);
}

/** Nudge schooling fish apart so they do not stack on one pixel. */
function separate(f: Fish, state: GameState, dt: number): void {
  for (const o of state.fish) {
    if (o === f || !o.alive || o.speciesId !== f.speciesId) continue;
    const dx = f.x - o.x;
    const dy = f.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d > 0 && d < 10) {
      f.vx += (dx / d) * 30 * dt;
      f.vy += (dy / d) * 30 * dt;
    }
  }
}

function mouthOffset(sp: Species, facing: 1 | -1): { x: number; y: number } {
  const w = sp.frames[0].w;
  return { x: facing > 0 ? w - 3 : 2, y: 3 };
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
  if (f.sick) s += 15;
  if (sp.minGroup > 1) {
    const kin = state.fish.filter((o) => o.alive && o.speciesId === sp.id).length;
    if (kin < sp.minGroup) s += 15;
  }
  // Bettas fight; two in one tank keep each other on edge.
  if (sp.id === "betta" && state.fish.some((o) => o !== f && o.alive && o.speciesId === "betta")) s += 25;
  const crowding = wasteLoad(state) - t.volumeL / 10;
  if (crowding > 0) s += crowding * 10;
  s -= Math.min(state.decor.length, MAX_DECOR_COMFORT) * DECOR_COMFORT;
  return clamp(s, 0, 100);
}

function outside(v: number, [lo, hi]: readonly [number, number]): number {
  return v < lo ? lo - v : v > hi ? v - hi : 0;
}

/** Advance hunger, stress, health and age by `hours`. Returns names of fish that died. */
export function stepFish(state: GameState, hours: number): string[] {
  const died: string[] = [];
  const rules = rulesFor(state);
  for (const f of state.fish) {
    if (!f.alive) continue;
    const sp = SPECIES[f.speciesId];
    f.hunger = clamp(f.hunger + (100 / HOURS_TO_STARVE) * hours, 0, 100);
    f.stress += (stressTarget(state, f) - f.stress) * Math.min(1, STRESS_EASE_PER_HOUR * hours);
    if (f.stress > 60) {
      f.health -= ((f.stress - 60) / 40) * 4 * hours * rules.harm;
    } else if (f.stress < 30 && f.hunger < 70) {
      f.health += 1 * hours;
    }
    if (f.hunger >= 100) f.health -= 2 * hours * rules.harm;
    if (f.sick) f.health -= HEALTH_LOSS[f.sick] * hours * rules.harm;
    f.ageHours += hours;
    f.size = Math.min(1, f.size + hours / (30 * 24));
    if (f.ageHours > sp.lifespanDays * 24) f.health -= 0.5 * hours;
    // Zen and sandbox fish get miserable, never dead.
    f.health = clamp(f.health, rules.immortal ? 5 : 0, 100);
    if (f.health <= 0) {
      f.alive = false;
      died.push(f.name);
      state.stats.died++;
    }
  }
  return died;
}
