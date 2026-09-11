import { describe, expect, it } from "vitest";
import { ambientFor, parseClock, solarTimes } from "../src/sim/daylight";
import { tankGame } from "./helpers";
import { simSpeed, tankHour } from "../src/sim/clock";

describe("daylight", () => {
  it("computes Hanoi's June sunrise and sunset within a quarter hour", () => {
    // Hanoi 21.03 N 105.85 E, 21 June, UTC+7: about 05:15 and 18:40.
    const { sunrise, sunset } = solarTimes(new Date(2026, 5, 21), 21.03, 105.85, 7);
    expect(Math.abs(sunrise - 5.25)).toBeLessThan(0.25);
    expect(Math.abs(sunset - 18.67)).toBeLessThan(0.25);
  });

  it("phases follow the sun", () => {
    expect(ambientFor(3, 6, 18).phase).toBe("night");
    expect(ambientFor(5.5, 6, 18).phase).toBe("dawn");
    expect(ambientFor(12, 6, 18).phase).toBe("day");
    expect(ambientFor(12, 6, 18).alpha).toBe(0);
    expect(ambientFor(18.2, 6, 18).phase).toBe("dusk");
    expect(ambientFor(23, 6, 18).alpha).toBeGreaterThan(0.5);
    expect(parseClock("06:30")).toBe(6.5);
  });

  it("real-time clock pins sim speed and follows the wall clock", () => {
    const g = tankGame(0);
    g.settings.simSpeed = 10;
    expect(simSpeed(g)).toBe(1);
    g.settings.clock = "sim";
    expect(simSpeed(g)).toBe(10);
    g.dayStartHour = 20;
    g.ageHours = 6;
    expect(tankHour(g)).toBe(2);
  });
});
