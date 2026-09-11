import { describe, expect, it } from "vitest";
import { newGame } from "../src/sim/state";
import { hasSand, newSand, pourSand, relaxSand, shiftSand, BAG_DEPTH, MAX_DEPTH } from "../src/sim/sand";
import { fillWater } from "../src/sim/tank";
import { buyFish } from "../src/sim/shop";
import { TAP } from "../src/data/constants";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };

describe("sand", () => {
  it("starts empty and pours in bags", () => {
    const g = newGame(0);
    expect(hasSand(g)).toBe(false);
    pourSand(g);
    expect(g.tank.sand.every((h) => h === BAG_DEPTH)).toBe(true);
    pourSand(g);
    pourSand(g);
    expect(Math.max(...g.tank.sand)).toBe(MAX_DEPTH);
  });

  it("a shove piles sand against a wall and slumping conserves volume", () => {
    const sand = newSand(14);
    const before = sand.reduce((a, b) => a + b, 0);
    shiftSand(sand, 3, 1);
    expect(sand[sand.length - 1]).toBeGreaterThan(sand[0]);
    for (let i = 0; i < 200 && relaxSand(sand); i++);
    expect(sand.reduce((a, b) => a + b, 0)).toBe(before);
    for (let x = 0; x < sand.length - 1; x++) expect(Math.abs(sand[x] - sand[x + 1])).toBeLessThanOrEqual(2);
  });
});

describe("empty tank start", () => {
  it("has no water, refuses fish, and fills with tap water", () => {
    const g = newGame(0);
    expect(g.tank.fill).toBe(0);
    expect(buyFish(g, "neon", WATER)).toBe("Fill the tank with water first.");
    g.inventory.conditioner = 1;
    expect(fillWater(g).conditioned).toBe(true);
    expect(g.tank.fill).toBe(g.tank.fillTarget);
    expect(g.tank.temp).toBe(TAP.temp);
    expect(g.tank.chlorine).toBe(0);
    expect(buyFish(g, "neon", WATER)).toBeNull();
  });
});
