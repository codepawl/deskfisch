import { COLOR, rgba } from "../engine/palette";

/** Sunrise and sunset as local hours (0–24) for a date, latitude and longitude. NOAA algorithm. */
export function solarTimes(date: Date, lat: number, lon: number, tzOffsetHours = -date.getTimezoneOffset() / 60): { sunrise: number; sunset: number } {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const doy = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  const gamma = ((2 * Math.PI) / 365) * (doy - 1 + (12 - 12) / 24);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const zenith = 90.833 * rad;
  const cosHa = Math.cos(zenith) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl);
  // Polar day or night: fall back to a plain 6/18 split.
  if (cosHa < -1 || cosHa > 1) return { sunrise: 6, sunset: 18 };
  const ha = Math.acos(cosHa) / rad;
  const sunriseUtcMin = 720 - 4 * (lon + ha) - eqTime;
  const sunsetUtcMin = 720 - 4 * (lon - ha) - eqTime;
  const wrap = (h: number) => ((h % 24) + 24) % 24;
  return { sunrise: wrap(sunriseUtcMin / 60 + tzOffsetHours), sunset: wrap(sunsetUtcMin / 60 + tzOffsetHours) };
}

export type SkyPhase = "night" | "dawn" | "day" | "dusk";

export interface Ambient {
  phase: SkyPhase;
  /** Tint colour and strength to lay over the water when the tank light is off. */
  color: number;
  alpha: number;
}

const NIGHT = COLOR.n;
const GOLDEN = rgba("#ef7d57");
const ROSE = rgba("#b13e53");
const NIGHT_ALPHA = 0.6;
/** Dawn runs from an hour before sunrise to half an hour after; dusk mirrors it. */
const BEFORE = 1;
const AFTER = 0.5;

/** Room light for an hour of the day given today's sunrise and sunset (local hours). */
export function ambientFor(hour: number, sunrise: number, sunset: number): Ambient {
  const h = ((hour % 24) + 24) % 24;
  if (h >= sunrise - BEFORE && h < sunrise + AFTER) {
    // Night → rose → golden → day.
    const t = (h - (sunrise - BEFORE)) / (BEFORE + AFTER);
    return t < 0.5
      ? { phase: "dawn", color: mixColor(NIGHT, ROSE, t * 2), alpha: NIGHT_ALPHA - t * 2 * (NIGHT_ALPHA - 0.35) }
      : { phase: "dawn", color: mixColor(ROSE, GOLDEN, (t - 0.5) * 2), alpha: 0.35 - (t - 0.5) * 2 * 0.35 };
  }
  if (h >= sunset - AFTER && h < sunset + BEFORE) {
    // Day → golden → rose → night.
    const t = (h - (sunset - AFTER)) / (BEFORE + AFTER);
    return t < 0.5
      ? { phase: "dusk", color: mixColor(GOLDEN, ROSE, t * 2), alpha: t * 2 * 0.35 }
      : { phase: "dusk", color: mixColor(ROSE, NIGHT, (t - 0.5) * 2), alpha: 0.35 + (t - 0.5) * 2 * (NIGHT_ALPHA - 0.35) };
  }
  if (h >= sunrise + AFTER && h < sunset - AFTER) return { phase: "day", color: NIGHT, alpha: 0 };
  return { phase: "night", color: NIGHT, alpha: NIGHT_ALPHA };
}

function mixColor(a: number, b: number, t: number): number {
  const r = ((a & 0xff) * (1 - t) + (b & 0xff) * t) | 0;
  const g = (((a >>> 8) & 0xff) * (1 - t) + ((b >>> 8) & 0xff) * t) | 0;
  const bl = (((a >>> 16) & 0xff) * (1 - t) + ((b >>> 16) & 0xff) * t) | 0;
  return ((0xff << 24) | (bl << 16) | (g << 8) | r) >>> 0;
}

/** "06:30" → 6.5 */
export function parseClock(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}
