import { describe, expect, it, vi } from "vitest";
import { newGame } from "../src/sim/state";
import { simulate, catchUp } from "../src/sim/tick";
import { isCycled, waterChange } from "../src/sim/tank";
import { spawnFish } from "../src/sim/fish";
import { SPECIES } from "../src/data/species";
import { MAX_CATCHUP_HOURS } from "../src/data/constants";

const WATER = { x0: 0, y0: 0, x1: 300, y1: 200 };

function runHours(state: ReturnType<typeof newGame>, hours: number) {
  const died: string[] = [];
  for (let s = 0; s < hours * 60; s++) died.push(...simulate(state, 60).died);
  return died;
}

function stocked(count = 6) {
  const g = newGame(0);
  g.equipment.filter = 1;
  g.equipment.heater = 1;
  for (let i = 0; i < count; i++) g.fish.push(spawnFish(SPECIES.neon, `n${i}`, WATER, i + 1));
  return g;
}

describe("nitrogen cycle", () => {
  it("ammonia spikes in an uncycled tank with fish", () => {
    const g = stocked();
    runHours(g, 24);
    expect(g.tank.nh3).toBeGreaterThan(0.5);
  });

  it("a cycled tank keeps ammonia and nitrite near zero and accumulates nitrate", () => {
    const g = stocked();
    g.tank.bactA = 1;
    g.tank.bactB = 1;
    const no3Before = g.tank.no3;
    runHours(g, 24);
    expect(g.tank.nh3).toBeLessThan(0.1);
    expect(g.tank.no2).toBeLessThan(0.1);
    expect(g.tank.no3).toBeGreaterThan(no3Before);
  });

  it("bacteria grow to cycle a fed tank within a few days", () => {
    // Chemistry only: no random disease outbreaks in this scenario.
    vi.spyOn(Math, "random").mockReturnValue(1);
    const g = stocked();
    // Keep fish alive by feeding: reset hunger every hour.
    for (let h = 0; h < 24 * 6; h++) {
      runHours(g, 1);
      for (const f of g.fish) f.hunger = 0;
    }
    expect(isCycled(g)).toBe(true);
    vi.restoreAllMocks();
  });

  it("water change dilutes nitrate and adds chlorine unless conditioned", () => {
    const g = newGame(0);
    g.tank.no3 = 80;
    waterChange(g, 0.5, false);
    expect(g.tank.no3).toBeCloseTo(42.5);
    expect(g.tank.chlorine).toBeGreaterThan(0);
    const h = newGame(0);
    waterChange(h, 0.5, true);
    expect(h.tank.chlorine).toBe(0);
  });
});

describe("temperature", () => {
  it("heater brings the tank to target and holds it", () => {
    const g = newGame(0);
    g.equipment.heater = 2;
    g.equipment.heaterTarget = 26;
    runHours(g, 6);
    expect(g.tank.temp).toBeCloseTo(26, 0);
  });
});

describe("fish", () => {
  it("unfed fish starve and die", () => {
    const g = stocked(1);
    g.tank.bactA = g.tank.bactB = 1;
    const died = runHours(g, 24 * 4);
    expect(died).toContain("n0");
    expect(g.fish[0].alive).toBe(false);
  });

  it("happy fish earn coins", () => {
    const g = stocked();
    g.tank.bactA = g.tank.bactB = 1;
    const before = g.coins;
    runHours(g, 2);
    expect(g.coins).toBeGreaterThan(before);
  });
});

describe("offline catch-up", () => {
  it("simulates elapsed time and caps very long absences", () => {
    const g = stocked();
    g.tank.bactA = g.tank.bactB = 1;
    const now = (MAX_CATCHUP_HOURS + 10) * 3600 * 1000;
    const r = catchUp(g, now)!;
    expect(r.capped).toBe(true);
    expect(g.ageHours).toBeCloseTo(MAX_CATCHUP_HOURS, 1);
    expect(g.simTime).toBe(now);
    expect(r.coinsEarned).toBeGreaterThan(0);
  });

  it("ignores tiny gaps", () => {
    const g = newGame(0);
    expect(catchUp(g, 2000)).toBeNull();
    expect(g.simTime).toBe(2000);
  });
});

describe("advance", () => {
  it("steps whole seconds and leaves the remainder", async () => {
    const { advance } = await import("../src/sim/tick");
    const g = newGame(0);
    advance(g, 2500);
    expect(g.simTime).toBe(2000);
    expect(g.ageHours).toBeCloseTo(2 / 3600, 8);
  });

  it("sim speed multiplies game time per real second", async () => {
    const { advance } = await import("../src/sim/tick");
    const g = newGame(0);
    g.settings.simSpeed = 10;
    advance(g, 3000);
    expect(g.simTime).toBe(3000);
    expect(g.ageHours).toBeCloseTo(30 / 3600, 8);
  });

  it("replays long gaps coarsely", async () => {
    const { advance } = await import("../src/sim/tick");
    const g = newGame(0);
    const r = advance(g, 3600 * 1000);
    expect(r.away?.hours).toBe(1);
    expect(g.simTime).toBe(3600 * 1000);
  });
});

describe("care tools", () => {
  it("water change spends a conditioner dose when available", async () => {
    const { doWaterChange } = await import("../src/sim/tank");
    const g = newGame(0);
    g.inventory.conditioner = 1;
    expect(doWaterChange(g, 0.3).conditioned).toBe(true);
    expect(g.tank.chlorine).toBe(0);
    expect(doWaterChange(g, 0.3).conditioned).toBe(false);
    expect(g.tank.chlorine).toBeGreaterThan(0);
  });

  it("scrubbing and vacuuming clamp at zero", async () => {
    const { scrubGlass, vacuumGravel } = await import("../src/sim/tank");
    const g = newGame(0);
    g.tank.algae = 30;
    g.tank.dirt = 10;
    scrubGlass(g, 50);
    vacuumGravel(g, 50);
    expect(g.tank.algae).toBe(0);
    expect(g.tank.dirt).toBe(0);
  });
});
