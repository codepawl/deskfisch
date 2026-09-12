import { afterEach, describe, expect, it, vi } from "vitest";
import { tankGame } from "./helpers";
import { moveFish, spawnFish } from "../src/sim/fish";
import { dropPellets, nearestPellet, updatePellets } from "../src/sim/food";
import { SPECIES } from "../src/data/species";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };

describe("feeding", () => {
  afterEach(() => vi.restoreAllMocks());

  it("flakes dropped from above float first, then sink and settle", () => {
    const g = tankGame(0);
    vi.spyOn(Math, "random").mockReturnValue(0.9); // every flake floats
    dropPellets(g, 150, 3, WATER);
    vi.restoreAllMocks();
    for (let i = 0; i < 60 * 5; i++) updatePellets(g, WATER, 1 / 60);
    for (const p of g.pellets) expect(p.y).toBe(WATER.y0 + 1);
    for (let i = 0; i < 60 * 60; i++) updatePellets(g, WATER, 1 / 60);
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
    dropPellets(g, 120, 2, WATER, 100);
    for (let i = 0; i < 60 * 90; i++) {
      updatePellets(g, WATER, 1 / 60);
      moveFish(f, SPECIES.neon, WATER, 1 / 60, g);
    }
    // Two pellets gone (a picky pass or two is allowed), each worth roughly a fifth of the bar.
    expect(g.pellets).toHaveLength(0);
    expect(f.hunger).toBeLessThan(30);
    expect(f.hunger).toBeGreaterThan(10);
  });

  it("food placed under water sinks at once; bottom dwellers ignore floating flakes", () => {
    const g = tankGame(0);
    dropPellets(g, 100, 1, WATER, 120);
    expect(g.pellets[0].float).toBe(0);
    expect(g.pellets[0].y).toBe(120);
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    dropPellets(g, 100, 1, WATER);
    vi.restoreAllMocks();
    const cory = spawnFish(SPECIES.cory, "c", WATER, 2);
    cory.hunger = 80;
    const floating = g.pellets[1];
    expect(floating.float).toBeGreaterThan(0);
    // the sunk pellet is the only one a cory will go for
    cory.x = 100; cory.y = 118;
    expect(nearestPellet(g, cory, true)).toBe(g.pellets[0]);
  });

  it("some of a pinch sinks straight away", () => {
    const g = tankGame(0);
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    dropPellets(g, 100, 2, WATER);
    expect(g.pellets.every((p) => p.float === 0 && p.vy > 0)).toBe(true);
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
