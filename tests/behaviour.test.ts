import { beforeEach, describe, expect, it, vi } from "vitest";
import { newGame } from "../src/sim/state";
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
    const g = newGame(0);
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
    const g = newGame(0);
    const f = spawnFish(SPECIES.guppy, "g", WATER, 1);
    f.y = 150;
    f.hunger = 60;
    g.fish.push(f);
    run(g, 10, { x: 150 });
    expect(f.y).toBeLessThan(30);
    expect(Math.abs(f.x - 150)).toBeLessThan(30);
  });

  it("stressed fish hide near decor", () => {
    const g = newGame(0);
    g.decor.push({ kind: "plant", x: 250 });
    const f = spawnFish(SPECIES.molly, "m", WATER, 1);
    f.x = 20;
    f.stress = 80;
    g.fish.push(f);
    run(g, 20);
    expect(f.x).toBeGreaterThan(200);
  });
});
