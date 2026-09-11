import { describe, expect, it } from "vitest";
import { newGame } from "../src/sim/state";
import { spawnFish } from "../src/sim/fish";
import { canBreed, GESTATION_HOURS, stepBreeding } from "../src/sim/breeding";
import { SPECIES } from "../src/data/species";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };

function pair() {
  const g = newGame(0);
  g.tank.bactA = g.tank.bactB = 1;
  const f = spawnFish(SPECIES.guppy, "f", WATER, 1);
  const m = spawnFish(SPECIES.guppy, "m", WATER, 2);
  f.sex = "f";
  m.sex = "m";
  for (const x of [f, m]) {
    x.size = 1;
    x.stress = 10;
    x.hunger = 10;
  }
  g.fish.push(f, m);
  g.nextFishId = 3;
  return { g, f, m };
}

describe("breeding", () => {
  it("a comfortable guppy pair produces fry after gestation", () => {
    const { g, f } = pair();
    expect(canBreed(g, f)).toBe(true);
    const births: string[] = [];
    for (let h = 0; h <= GESTATION_HOURS; h++) births.push(...stepBreeding(g, 1, WATER));
    expect(births).toHaveLength(1);
    expect(g.fish.length).toBeGreaterThanOrEqual(4);
    expect(g.fish.slice(2).every((x) => x.speciesId === "guppy" && x.size < 0.5)).toBe(true);
    expect(f.breedCooldown).toBeGreaterThan(0);
  });

  it("needs a male, a cycled tank and low stress", () => {
    const { g, f, m } = pair();
    m.sex = "f";
    expect(canBreed(g, f)).toBe(false);
    m.sex = "m";
    g.tank.bactA = 0.02;
    expect(canBreed(g, f)).toBe(false);
    g.tank.bactA = 1;
    f.stress = 50;
    expect(canBreed(g, f)).toBe(false);
  });

  it("non-livebearers do not breed", () => {
    const g = newGame(0);
    const f = spawnFish(SPECIES.neon, "n", WATER, 1);
    f.sex = "f";
    expect(canBreed(g, f)).toBe(false);
  });
});

describe("decals", () => {
  it("are bought once and then switched for free", async () => {
    const { buyDecal, ownsDecal } = await import("../src/sim/shop");
    const g = newGame(0);
    g.coins = 100;
    expect(buyDecal(g, "sunset")).toBeNull();
    expect(g.coins).toBe(70);
    expect(g.decal).toBe("sunset");
    expect(buyDecal(g, "black")).toBeNull();
    expect(g.coins).toBe(55);
    expect(buyDecal(g, "sunset")).toBeNull();
    expect(g.coins).toBe(55);
    expect(ownsDecal(g, "coral")).toBe(false);
    g.coins = 0;
    expect(buyDecal(g, "coral")).toBe("Not enough coins.");
  });
});
