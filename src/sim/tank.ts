import { BACTERIA, ROOM_TEMP, TAP, WASTE_PER_HOUR, REFERENCE_VOLUME } from "../data/constants";
import { AIR_PUMPS, BASE_AERATION, DECOR, FILTERS, HEATERS, LIGHTS } from "../data/items";
import { clamp } from "../engine/rng";
import type { GameState } from "./state";

/** Below this the tank counts as needing a top-up; the UI will not let it be set lower. */
export const MIN_FILL = 0.7;
export const MAX_FILL = 1.0;

/** Oxygen saturation of fresh water at a temperature (mg/L), quadratic fit of standard tables. */
export function o2Saturation(temp: number): number {
  return 14.62 - 0.36 * temp + 0.0047 * temp * temp;
}

/** Advance water chemistry by `hours`. Callers keep steps small (≤ 1 minute) for stability. */
export function stepTank(state: GameState, hours: number, wasteLoad: number): void {
  const t = state.tank;
  // An empty or nearly empty tank has no water chemistry to speak of.
  if (t.fill < 0.3) return;
  const eq = state.equipment;
  const filter = FILTERS[eq.filter];
  const volumeScale = REFERENCE_VOLUME / t.volumeL;

  // Waste from fish (and decaying food, folded into wasteLoad by the caller).
  const nh3In = wasteLoad * WASTE_PER_HOUR * volumeScale * hours;
  t.nh3 += nh3In;
  t.dirt = Math.min(100, t.dirt + nh3In * 10);

  // Nitrogen cycle: Monod uptake by two bacteria populations growing logistically
  // toward the filter's capacity and starving when their substrate runs out.
  const capacity = filter.bacteriaCapacity;
  const uptakeA = BACTERIA.uptakePerHour * t.bactA * (t.nh3 / (t.nh3 + BACTERIA.halfSat)) * hours;
  const convA = Math.min(t.nh3, uptakeA);
  t.nh3 -= convA;
  t.no2 += convA;
  const uptakeB = BACTERIA.uptakePerHour * t.bactB * (t.no2 / (t.no2 + BACTERIA.halfSat)) * hours;
  const convB = Math.min(t.no2, uptakeB);
  t.no2 -= convB;
  t.no3 += convB;
  t.bactA = growBacteria(t.bactA, t.nh3, capacity, hours);
  t.bactB = growBacteria(t.bactB, t.no2, capacity, hours);

  // Temperature: heater pulls toward target, room pulls toward ambient.
  const heater = HEATERS[eq.heater];
  if (heater.power > 0 && t.temp < eq.heaterTarget) {
    t.temp += Math.min(eq.heaterTarget - t.temp, heater.power * hours);
  }
  t.temp += (ROOM_TEMP - t.temp) * 0.05 * hours;

  // Oxygen: gas exchange toward saturation, consumed by fish and rotting waste.
  const aeration = BASE_AERATION + filter.aeration + AIR_PUMPS[eq.airPump].aeration;
  const sat = o2Saturation(t.temp);
  t.o2 += (sat - t.o2) * clamp(aeration * hours, 0, 1);
  t.o2 -= (wasteLoad * 0.15 + t.dirt * 0.002) * volumeScale * hours;
  t.o2 = clamp(t.o2, 0, sat);

  // pH drifts back to tap water but is dragged down by nitrate and waste (acidic).
  const acid = 7.4 - t.no3 * 0.01 - t.dirt * 0.004;
  t.pH += (Math.min(TAP.pH, acid) - t.pH) * 0.02 * hours;

  for (const d of state.decor) {
    t.no3 = Math.max(0, t.no3 - (DECOR.find((k) => k.id === d.kind)?.no3Uptake ?? 0) * hours);
  }
  t.dirt = Math.max(0, t.dirt - filter.dirtRemovalPerHour * hours);
  t.chlorine = Math.max(0, t.chlorine - 0.15 * hours);
  // Evaporation: about a percent of the glass height per day, more when warm.
  t.fill = Math.max(MIN_FILL, t.fill - (0.0004 + Math.max(0, t.temp - 24) * 0.00005) * hours);
  const light = eq.lightOn ? LIGHTS[eq.light].intensity : 0;
  t.algae = clamp(t.algae + (light * (0.4 + t.no3 * 0.01) - 0.05) * hours, 0, 100);
}

function growBacteria(b: number, substrate: number, capacity: number, hours: number): number {
  const fed = substrate / (substrate + BACTERIA.halfSat);
  const growth = BACTERIA.growthPerHour * b * (1 - b / capacity) * fed;
  const decay = BACTERIA.decayPerHour * b * (1 - fed);
  return Math.max(BACTERIA.seed * 0.5, b + (growth - decay) * hours);
}

/** Replace `fraction` (0..1) of the water with tap water. */
export function waterChange(state: GameState, fraction: number, conditioned: boolean): void {
  const t = state.tank;
  const f = clamp(fraction, 0, 1);
  const keep = 1 - f;
  t.temp = t.temp * keep + TAP.temp * f;
  t.pH = t.pH * keep + TAP.pH * f;
  t.nh3 *= keep;
  t.no2 *= keep;
  t.no3 = t.no3 * keep + TAP.no3 * f;
  t.chlorine += conditioned ? 0 : TAP.chlorine * f;
  t.o2 = t.o2 * keep + o2Saturation(TAP.temp) * f;
  // Refilling is part of any water change.
  t.fill = t.fillTarget;
}

/**
 * Water change that spends a conditioner dose when one is available. Without it
 * the tap water's chlorine goes straight into the tank.
 */
export function doWaterChange(state: GameState, fraction: number): { conditioned: boolean } {
  const doses = state.inventory.conditioner ?? 0;
  const conditioned = doses > 0;
  if (conditioned) state.inventory.conditioner = doses - 1;
  waterChange(state, fraction, conditioned);
  return { conditioned };
}

/**
 * Fill the tank up to its target with tap water. An empty tank simply takes on
 * tap water; a partly full one is treated as a partial water change.
 */
export function fillWater(state: GameState): { conditioned: boolean } {
  const t = state.tank;
  const doses = state.inventory.conditioner ?? 0;
  const conditioned = doses > 0;
  if (conditioned) state.inventory.conditioner = doses - 1;
  if (t.fill < 0.05) {
    Object.assign(t, { temp: TAP.temp, pH: TAP.pH, nh3: 0, no2: 0, no3: TAP.no3, chlorine: conditioned ? 0 : TAP.chlorine, o2: o2Saturation(TAP.temp) });
    t.fill = t.fillTarget;
  } else {
    waterChange(state, Math.max(0, 1 - t.fill / t.fillTarget), conditioned);
  }
  return { conditioned };
}

/** Scrubbing removes algae film; `amount` is percentage points. */
export function scrubGlass(state: GameState, amount: number): void {
  state.tank.algae = Math.max(0, state.tank.algae - amount);
}

/** Gravel vacuuming lifts settled waste; `amount` is percentage points. */
export function vacuumGravel(state: GameState, amount: number): void {
  state.tank.dirt = Math.max(0, state.tank.dirt - amount);
}

/**
 * A tank counts as cycled once both populations are well past the seed level and
 * are keeping ammonia and nitrite down. Populations settle at whatever the
 * bioload supports, so an absolute threshold near capacity would never be met.
 */
export function isCycled(state: GameState): boolean {
  const t = state.tank;
  const established = BACTERIA.seed * 5;
  return t.bactA >= established && t.bactB >= established && t.nh3 < 0.25 && t.no2 < 0.25;
}
