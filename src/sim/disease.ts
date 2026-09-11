import { SPECIES } from "../data/species";
import type { Fish } from "./fish";
import type { GameState } from "./state";

export type Disease = "ich" | "finrot";

/** Chance per hour of catching something when conditions allow it. */
const ICH_RATE = 0.01;
const ICH_CONTAGION = 0.03;
const FINROT_RATE = 0.015;
/** Ich dies off in warm water; this is the recovery chance per hour above ICH_CURE_TEMP. */
const ICH_CURE_TEMP = 29;
const ICH_HEAT_RECOVERY = 0.06;
export const HEALTH_LOSS: Record<Disease, number> = { ich: 1.5, finrot: 1 };

function chance(perHour: number, hours: number): boolean {
  return Math.random() < 1 - Math.exp(-perHour * hours);
}

/** Infect, spread and (in warm water) clear diseases. Returns fish that just fell ill. */
export interface Illness { name: string; disease: Disease }
export function stepDisease(state: GameState, hours: number): Illness[] {
  const t = state.tank;
  const ichAround = state.fish.some((f) => f.alive && f.sick === "ich");
  const fellIll: Illness[] = [];
  for (const f of state.fish) {
    if (!f.alive) continue;
    const sp = SPECIES[f.speciesId];
    if (f.sick === "ich" && t.temp >= ICH_CURE_TEMP && chance(ICH_HEAT_RECOVERY, hours)) {
      f.sick = undefined;
      continue;
    }
    if (f.sick) continue;
    const cold = t.temp < sp.tempRange[0] - 1;
    const ichRisk = (f.stress > 60 || cold ? ICH_RATE : 0) + (ichAround ? ICH_CONTAGION : 0);
    if (ichRisk > 0 && chance(ichRisk, hours)) {
      f.sick = "ich";
      fellIll.push({ name: f.name, disease: "ich" });
      continue;
    }
    if (t.dirt > 60 && f.stress > 40 && chance(FINROT_RATE, hours)) {
      f.sick = "finrot";
      fellIll.push({ name: f.name, disease: "finrot" });
    }
  }
  return fellIll;
}

/** Medicate the whole tank against one disease. Medicine also knocks back the filter bacteria. */
export function treat(state: GameState, disease: Disease): number {
  let cured = 0;
  for (const f of state.fish) {
    if (f.alive && f.sick === disease) {
      f.sick = undefined;
      cured++;
    }
  }
  state.tank.bactA *= 0.8;
  state.tank.bactB *= 0.8;
  return cured;
}

export function isSick(f: Fish): f is Fish & { sick: Disease } {
  return f.sick !== undefined;
}
