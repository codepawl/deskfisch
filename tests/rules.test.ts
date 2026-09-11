import { describe, expect, it } from "vitest";
import { tankGame as fresh } from "./helpers";
import { setPlaystyle } from "../src/sim/shop";
import { spawnFish, stepFish } from "../src/sim/fish";
import { SPECIES } from "../src/data/species";
const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };
import { stepDisease } from "../src/sim/disease";
import { RULES } from "../src/sim/rules";

function stressed(style: "zen" | "normal" | "hardcore" | "sandbox") {
  const g = fresh();
  setPlaystyle(g, style);
  g.tank.fill = 1;
  const f = spawnFish(SPECIES.neon, "n", WATER, 1);
  f.health = 30;
  f.stress = 100;
  f.hunger = 100;
  g.fish.push(f);
  return g;
}

describe("play styles", () => {
  it("zen fish get miserable but never die", () => {
    const g = stressed("zen");
    for (let i = 0; i < 200; i++) stepFish(g, 1);
    expect(g.fish.every((f) => f.alive)).toBe(true);
    expect(g.fish[0].health).toBeGreaterThan(0);
  });
  it("normal fish die under the same neglect", () => {
    const g = stressed("normal");
    for (let i = 0; i < 200; i++) stepFish(g, 1);
    expect(g.fish.some((f) => !f.alive)).toBe(true);
  });
  it("zen and sandbox never catch anything", () => {
    for (const style of ["zen", "sandbox"] as const) {
      const g = stressed(style);
      g.tank.temp = 18;
      for (let i = 0; i < 500; i++) stepDisease(g, 1);
      expect(g.fish.every((f) => !f.sick)).toBe(true);
    }
  });
  it("starting coins follow the style on a new tank", () => {
    const g = fresh();
    setPlaystyle(g, "hardcore");
    expect(g.coins).toBe(RULES.hardcore.coins);
    setPlaystyle(g, "sandbox");
    expect(g.coins).toBe(RULES.sandbox.coins);
  });
});
