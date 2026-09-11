import { SPECIES } from "../data/species";
import type { GameState } from "./state";
import { isCycled } from "./tank";

export interface Achievement {
  id: string;
  title: string;
  reward: number;
  done(state: GameState): boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "firstFish", title: "First fish released", reward: 20, done: (s) => s.fish.length > 0 },
  { id: "cycled", title: "Tank cycled", reward: 80, done: (s) => isCycled(s) && s.ageHours > 24 },
  { id: "school", title: "A proper school", reward: 50, done: (s) => Object.values(SPECIES).some((sp) => sp.minGroup >= 5 && s.fish.filter((f) => f.alive && f.speciesId === sp.id).length >= sp.minGroup) },
  { id: "week", title: "One week old fish", reward: 100, done: (s) => s.fish.some((f) => f.alive && f.ageHours >= 24 * 7) },
  { id: "fullKit", title: "Fully equipped", reward: 60, done: (s) => s.equipment.filter > 0 && s.equipment.heater > 0 && s.equipment.light > 0 && s.equipment.testKit },
  { id: "spotless", title: "Spotless", reward: 30, done: (s) => s.tank.algae < 1 && s.tank.dirt < 1 && s.ageHours > 48 },
];

/** Award any newly completed achievements. Returns the ones unlocked this call. */
export function checkAchievements(state: GameState): Achievement[] {
  const unlocked: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.includes(a.id) || !a.done(state)) continue;
    state.achievements.push(a.id);
    state.coins += a.reward;
    unlocked.push(a);
  }
  return unlocked;
}
