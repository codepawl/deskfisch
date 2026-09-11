import { describe, expect, it } from "vitest";
import { tankGame } from "./helpers";
import { moveFish, spawnFish } from "../src/sim/fish";
import { dropPellets, updatePellets } from "../src/sim/food";
import { SPECIES } from "../src/data/species";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };

describe("feeding", () => {
  it("pellets sink and settle on the substrate", () => {
    const g = tankGame(0);
    dropPellets(g, 150, 3, WATER);
    for (let i = 0; i < 60 * 30; i++) updatePellets(g, WATER, 1 / 60);
    expect(g.pellets).toHaveLength(3);
    for (const p of g.pellets) {
      expect(p.y).toBe(WATER.y1 - 1);
      expect(p.vy).toBe(0);
    }
  });

  it("a hungry fish swims to food and eats it", () => {
    const g = tankGame(0);
    const f = spawnFish(SPECIES.neon, "n", WATER, 1);
    f.x = 40;
    f.y = 100;
    f.hunger = 60;
    g.fish.push(f);
    dropPellets(g, 120, 2, WATER);
    for (let i = 0; i < 60 * 40; i++) {
      updatePellets(g, WATER, 1 / 60);
      moveFish(f, SPECIES.neon, WATER, 1 / 60, g);
    }
    expect(g.pellets).toHaveLength(0);
    expect(f.hunger).toBe(20);
  });

  it("a full fish ignores food", () => {
    const g = tankGame(0);
    const f = spawnFish(SPECIES.neon, "n", WATER, 1);
    f.hunger = 0;
    g.fish.push(f);
    dropPellets(g, f.x, 2, WATER);
    for (let i = 0; i < 60 * 40; i++) {
      updatePellets(g, WATER, 1 / 60);
      moveFish(f, SPECIES.neon, WATER, 1 / 60, g);
    }
    expect(g.pellets).toHaveLength(2);
  });
});
