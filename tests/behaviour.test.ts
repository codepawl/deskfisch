import { beforeEach, describe, expect, it, vi } from "vitest";
import { tankGame } from "./helpers";
import { moveFish, spawnFish } from "../src/sim/fish";
import { SPECIES } from "../src/data/species";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };

// Wander targets are random; a fixed LCG keeps these behaviour checks repeatable.
beforeEach(() => {
  let seed = 12345;
  vi.spyOn(Math, "random").mockImplementation(() => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  });
});

function run(g: ReturnType<typeof newGame>, seconds: number, lure: { x: number } | null = null) {
  for (let i = 0; i < seconds * 60; i++) {
    for (const f of g.fish) moveFish(f, SPECIES[f.speciesId], WATER, 1 / 60, g, lure);
  }
}

describe("behaviour", () => {
  it("schooling fish gather around their leader", () => {
    const g = tankGame(0);
    for (let i = 0; i < 6; i++) {
      const f = spawnFish(SPECIES.neon, `n${i}`, WATER, i + 1);
      f.x = 20 + i * 45;
      g.fish.push(f);
    }
    run(g, 30);
    const cx = g.fish.reduce((a, f) => a + f.x, 0) / g.fish.length;
    const spread = Math.max(...g.fish.map((f) => Math.abs(f.x - cx)));
    expect(spread).toBeLessThan(40);
  });

  it("hungry fish rise toward a hand holding food", () => {
    const g = tankGame(0);
    const f = spawnFish(SPECIES.guppy, "g", WATER, 1);
    f.y = 150;
    f.hunger = 60;
    g.fish.push(f);
    run(g, 10, { x: 150 });
    expect(f.y).toBeLessThan(30);
    expect(Math.abs(f.x - 150)).toBeLessThan(30);
  });

  it("stressed fish hide near decor", () => {
    const g = tankGame(0);
    g.decor.push({ kind: "plant", x: 250 });
    const f = spawnFish(SPECIES.molly, "m", WATER, 1);
    f.x = 20;
    f.stress = 80;
    g.fish.push(f);
    run(g, 20);
    expect(f.x).toBeGreaterThan(200);
  });
});

describe("glass", () => {
  it("a knock sends nearby fish darting away", async () => {
    const { startle } = await import("../src/sim/fish");
    const g = tankGame(0);
    const near = spawnFish(SPECIES.neon, "near", WATER, 1);
    near.x = 100;
    near.y = 100;
    const far = spawnFish(SPECIES.neon, "far", WATER, 2);
    far.x = 280;
    far.y = 100;
    g.fish.push(near, far);
    expect(startle(g, 90, 100, WATER)).toBe(1);
    expect(near.pace).toBeGreaterThan(2);
    expect(near.tx).toBeGreaterThan(near.x);
    expect(far.pace ?? 1).toBe(1);
  });
});
