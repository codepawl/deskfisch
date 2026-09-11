// Sweetie-16 inspired palette. Sprites index colours by single characters so a
// fish can be drawn as a block of text in species data.
export const PALETTE: Record<string, string> = {
  K: "#1a1c2c", // black
  d: "#333c57", // dark slate
  D: "#566c86", // slate
  L: "#94b0c2", // light slate
  W: "#f4f4f4", // white
  r: "#b13e53", // dark red
  R: "#ef7d57", // orange-red
  y: "#ffcd75", // yellow
  g: "#38b764", // green
  G: "#a7f070", // lime
  n: "#29366f", // navy
  b: "#3b5dc9", // blue
  B: "#41a6f6", // sky
  c: "#73eff7", // cyan
  p: "#5d275d", // purple
  P: "#ff77a8", // pink
  t: "#8f563b", // brown
  s: "#d9a066", // sand
  S: "#eec39a", // light sand
  o: "#ffffff", // pure white for highlights
};

export const TRANSPARENT = ".";

/** Colour as the little-endian 0xAABBGGRR word a Uint32 ImageData view expects. */
export function rgba(hex: string, alpha = 255): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return ((alpha << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export const COLOR: Record<string, number> = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, rgba(v)]),
);
