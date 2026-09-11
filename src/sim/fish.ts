import { clamp, rand } from "../engine/rng";
import type { Species } from "../data/species";

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
}

export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

let nextId = 1;

export function spawnFish(sp: Species, name: string, water: Bounds): Fish {
  const x = rand(water.x0 + 20, water.x1 - 20);
  const y = depthY(sp, water);
  return { id: nextId++, speciesId: sp.id, name, x, y, vx: 0, vy: 0, facing: 1, retarget: 0, tx: x, ty: y, phase: rand(0, 6) };
}

function depthY(sp: Species, w: Bounds): number {
  const h = w.y1 - w.y0;
  return w.y0 + h * rand(sp.depth[0], sp.depth[1]);
}

/** Wander: drift toward a target, pick a new one when reached or on a timer. */
export function moveFish(f: Fish, sp: Species, water: Bounds, dt: number): void {
  f.retarget -= dt;
  const dx = f.tx - f.x;
  const dy = f.ty - f.y;
  if (f.retarget <= 0 || Math.hypot(dx, dy) < 4) {
    f.tx = rand(water.x0 + sp.frames[0].w, water.x1 - sp.frames[0].w);
    f.ty = depthY(sp, water);
    f.retarget = rand(2, 6);
  }
  // Fish are slow to turn: ease velocity toward the desired direction.
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ease = 1 - Math.exp(-dt * 1.5);
  f.vx += ((dx / dist) * sp.speed - f.vx) * ease;
  f.vy += ((dy / dist) * sp.speed * 0.5 - f.vy) * ease;
  f.x = clamp(f.x + f.vx * dt, water.x0, water.x1 - sp.frames[0].w);
  f.y = clamp(f.y + f.vy * dt, water.y0, water.y1 - sp.frames[0].h);
  if (Math.abs(f.vx) > 2) f.facing = f.vx > 0 ? 1 : -1;
  f.phase += dt * (2 + Math.abs(f.vx) / sp.speed * 4);
}
