import type { GameState } from "./state";

export type Playstyle = "zen" | "normal" | "hardcore" | "sandbox";

/** How a play style bends the simulation. Multipliers of 1 mean "as designed". */
export interface Rules {
  /** Chance of catching ich or fin rot. 0 disables disease. */
  disease: number;
  /** Health loss from stress, hunger and illness. */
  harm: number;
  /** Fish cannot die: health never drops below a floor. */
  immortal: boolean;
  /** Evaporation and dirt build-up. */
  upkeep: number;
  /** Starting coins. */
  coins: number;
  /** Shop prices. */
  prices: number;
}

export const RULES: Record<Playstyle, Rules> = {
  zen: { disease: 0, harm: 0.5, immortal: true, upkeep: 0.5, coins: 200, prices: 1 },
  normal: { disease: 1, harm: 1, immortal: false, upkeep: 1, coins: 200, prices: 1 },
  hardcore: { disease: 2, harm: 1.5, immortal: false, upkeep: 1.5, coins: 120, prices: 1.25 },
  sandbox: { disease: 0, harm: 0, immortal: true, upkeep: 0, coins: 999999, prices: 0 },
};

export function rulesFor(state: GameState): Rules {
  return RULES[state.playstyle] ?? RULES.normal;
}
