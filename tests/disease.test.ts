import { afterEach, describe, expect, it, vi } from "vitest";
import { tankGame } from "./helpers";
import { spawnFish } from "../src/sim/fish";
import { stepDisease, treat } from "../src/sim/disease";
import { upgradeGear } from "../src/sim/shop";
import { SPECIES } from "../src/data/species";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };

afterEach(() => vi.restoreAllMocks());

describe("disease", () => {
  it("stressed fish catch ich and medicine clears it", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const g = tankGame(0);
    const f = spawnFish(SPECIES.neon, "n", WATER, 1);
    f.stress = 70;
    g.fish.push(f);
    const ill = stepDisease(g, 1);
    expect(ill).toHaveLength(1);
    expect(f.sick).toBe("ich");
    expect(treat(g, "ich")).toBe(1);
    expect(f.sick).toBeUndefined();
  });

  it("calm fish in clean water stay healthy", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const g = tankGame(0);
    const f = spawnFish(SPECIES.neon, "n", WATER, 1);
    f.stress = 10;
    g.tank.temp = 25;
    g.fish.push(f);
    expect(stepDisease(g, 24)).toHaveLength(0);
  });
});

describe("tank upgrade", () => {
  it("raises volume and mixes in tap water", () => {
    const g = tankGame(0);
    g.coins = 1000;
    g.tank.no3 = 80;
    expect(upgradeGear(g, "tank")).toBeNull();
    expect(g.tank.volumeL).toBe(120);
    expect(g.tank.no3).toBeLessThan(80);
    expect(g.coins).toBe(700);
  });
});
