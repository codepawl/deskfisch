import { describe, expect, it } from "vitest";
import { tankGame } from "./helpers";
import { algaeOf, mulmOf, scrapeAt, syncGrime, vacuumAt } from "../src/sim/grime";
import { dropPellets, updatePellets } from "../src/sim/food";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };

describe("grime", () => {
  it("mulm and algae spots follow dirt and algae", () => {
    const g = tankGame(0);
    g.tank.dirt = 50;
    g.tank.algae = 40;
    syncGrime(g, WATER);
    expect(mulmOf(g).length).toBe(30);
    expect(algaeOf(g).length).toBe(18);
    g.tank.dirt = 0;
    syncGrime(g, WATER);
    expect(mulmOf(g).length).toBe(0);
  });

  it("the siphon takes the mulm, the leftover food and a little water under it", () => {
    const g = tankGame(0);
    g.tank.dirt = 50;
    syncGrime(g, WATER);
    mulmOf(g).forEach((m, i) => (m.x = 100 + i));
    dropPellets(g, 100, 3, WATER, 150);
    for (let i = 0; i < 60 * 30; i++) updatePellets(g, WATER, 1 / 60);
    const fill = g.tank.fill;
    const took = vacuumAt(g, 104, 16, 1 / 60, () => WATER.y1 - 1);
    expect(took.spots).toBeGreaterThan(0);
    expect(took.pellets).toBe(3);
    expect(g.tank.dirt).toBeLessThan(50);
    expect(g.tank.fill).toBeLessThan(fill);
  });

  it("the scraper lifts film within reach only", () => {
    const g = tankGame(0);
    g.tank.algae = 60;
    syncGrime(g, WATER);
    const spots = algaeOf(g);
    spots.forEach((a, i) => { a.x = i < 5 ? 50 : 250; a.y = 60; });
    const n = scrapeAt(g, 50, 60, 9, 1 / 60);
    expect(n).toBe(5);
    expect(algaeOf(g).length).toBe(spots.length);
    expect(g.tank.algae).toBeLessThan(60);
  });
});
