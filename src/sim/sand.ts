import type { GameState } from "./state";

/** Sand is a heightmap, one column per water pixel column. Heights are pixels above the glass bottom. */
export const SAND_COLS = 368;
export const BAG_DEPTH = 14;
export const MAX_DEPTH = 26;
/** Slopes steeper than this many pixels per column slump. */
const REPOSE = 2;

export function newSand(depth = 0): number[] {
  return new Array(SAND_COLS).fill(depth);
}

/** Pour a bag of sand: every column rises by BAG_DEPTH, capped. */
export function pourSand(state: GameState): void {
  const s = state.tank.sand;
  for (let i = 0; i < s.length; i++) s[i] = Math.min(MAX_DEPTH, s[i] + BAG_DEPTH);
}

export function hasSand(state: GameState): boolean {
  return state.tank.sand.some((h) => h > 0);
}

/** Height of the sand at a column index (clamped to the tank). */
export function sandAt(sand: number[], i: number): number {
  return sand[Math.max(0, Math.min(sand.length - 1, i | 0))];
}

/**
 * The tank was shoved sideways: friction drags the top grains the other way.
 * `grains` per column move `dir` (+1 right, −1 left), cascading so a hard
 * shove piles sand against one wall.
 */
export function shiftSand(sand: number[], grains: number, dir: 1 | -1): void {
  if (grains <= 0) return;
  const n = sand.length;
  if (dir > 0) {
    for (let x = n - 2; x >= 0; x--) {
      const g = Math.min(grains, sand[x], MAX_DEPTH - sand[x + 1]);
      if (g > 0) {
        sand[x] -= g;
        sand[x + 1] += g;
      }
    }
  } else {
    for (let x = 1; x < n; x++) {
      const g = Math.min(grains, sand[x], MAX_DEPTH - sand[x - 1]);
      if (g > 0) {
        sand[x] -= g;
        sand[x - 1] += g;
      }
    }
  }
}

/** One pass of slumping: any step steeper than the angle of repose sheds a grain downhill. Returns true if anything moved. */
export function relaxSand(sand: number[]): boolean {
  let moved = false;
  for (let x = 0; x < sand.length - 1; x++) {
    const d = sand[x] - sand[x + 1];
    if (d > REPOSE) {
      sand[x]--;
      sand[x + 1]++;
      moved = true;
    } else if (d < -REPOSE) {
      sand[x]++;
      sand[x + 1]--;
      moved = true;
    }
  }
  return moved;
}
