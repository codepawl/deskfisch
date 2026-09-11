import { COLOR, TRANSPARENT } from "./palette";

export interface Sprite {
  w: number;
  h: number;
  /** Packed 0xAABBGGRR per pixel, 0 = transparent. Row-major. */
  px: Uint32Array;
}

/** Parse a block of palette characters into a sprite. Rows are padded to the widest row. */
export function sprite(rows: string[]): Sprite {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const px = new Uint32Array(w * h);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === TRANSPARENT || ch === " ") continue;
      const c = COLOR[ch];
      if (c === undefined) throw new Error(`unknown palette char '${ch}'`);
      px[y * w + x] = c;
    }
  });
  return { w, h, px };
}

/** Frames of the same sprite, e.g. tail animation. */
export function frames(...blocks: string[][]): Sprite[] {
  return blocks.map(sprite);
}
