import { ambientFor, parseClock, solarTimes, type Ambient } from "./daylight";
import type { GameState } from "./state";

/** Hour of the day the tank experiences: the real clock, or game time when simulated. */
export function tankHour(state: GameState, now = new Date()): number {
  if (state.settings.clock === "sim") return (state.dayStartHour + state.ageHours) % 24;
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

/** Today's sunrise and sunset as local hours, from coordinates when set, else the configured times. */
export function sunTimes(state: GameState, now = new Date()): { sunrise: number; sunset: number } {
  const s = state.settings;
  if (s.lat !== undefined && s.lon !== undefined) return solarTimes(now, s.lat, s.lon);
  return { sunrise: parseClock(s.sunrise), sunset: parseClock(s.sunset) };
}

export function ambientNow(state: GameState, now = new Date()): Ambient {
  const { sunrise, sunset } = sunTimes(state, now);
  return ambientFor(tankHour(state, now), sunrise, sunset);
}

/** Effective sim speed: real-time mode never runs faster than the wall clock. */
export function simSpeed(state: GameState): number {
  return state.settings.clock === "real" ? 1 : state.settings.simSpeed;
}
