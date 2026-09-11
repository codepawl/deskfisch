import { describe, expect, it } from "vitest";
import { tankGame } from "./helpers";
import { addTankWater, newBag, releaseBag, releaseShock, stepBags, ADDS_NEEDED } from "../src/sim/bag";
import { buyFish } from "../src/sim/shop";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };
const MIN = 60_000;

describe("acclimation", () => {
  it("buying a fish floats a bag instead of adding a fish", () => {
    const g = tankGame(0);
    expect(buyFish(g, "neon", WATER)).toBeNull();
    expect(g.bags).toHaveLength(1);
    expect(g.fish).toHaveLength(0);
  });

  it("a floated bag reaches tank temperature in about ten minutes", () => {
    const g = tankGame(0);
    g.tank.temp = 26;
    const b = newBag(g, "neon", "n", WATER, 0);
    g.bags.push(b);
    for (let s = 0; s < 600; s++) stepBags(g, 1 / 3600);
    expect(Math.abs(b.temp - 26)).toBeLessThan(0.3);
  });

  it("adds are spaced out and blend the bag toward tank pH", () => {
    const g = tankGame(0);
    g.tank.pH = 8;
    const b = newBag(g, "neon", "n", WATER, 0);
    g.bags.push(b);
    expect(addTankWater(g, b, 0)).not.toBeNull();
    for (let i = 0; i < ADDS_NEEDED; i++) expect(addTankWater(g, b, (i + 1) * 2 * MIN)).toBeNull();
    expect(addTankWater(g, b, 10 * MIN)).toBe("The bag is full.");
    expect(b.pH).toBeGreaterThan(7.5);
  });

  it("releasing early shocks the fish; a patient release does not", () => {
    const g = tankGame(0);
    g.tank.temp = 28;
    g.tank.pH = 7.8;
    const rushed = newBag(g, "neon", "a", WATER, 0);
    g.bags.push(rushed);
    expect(releaseShock(g, rushed)).toBeGreaterThan(40);
    const f = releaseBag(g, rushed, 100, 100, WATER);
    expect(f.stress).toBeGreaterThan(60);
    expect(g.bags).toHaveLength(0);
    expect(g.fish[0]).toBe(f);

    const patient = newBag(g, "neon", "b", WATER, 0);
    g.bags.push(patient);
    for (let s = 0; s < 900; s++) stepBags(g, 1 / 3600);
    for (let i = 0; i < ADDS_NEEDED; i++) addTankWater(g, patient, (i + 1) * 2 * MIN);
    expect(releaseShock(g, patient)).toBeLessThan(10);
  });
});
