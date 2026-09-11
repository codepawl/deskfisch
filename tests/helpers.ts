import { newGame } from "../src/sim/state";
import { newSand } from "../src/sim/sand";

/** A set-up tank: sand poured and water filled, the state most simulation tests assume. */
export function tankGame(now = 0) {
  const g = newGame(now);
  g.tank.fill = 0.9;
  g.tank.sand = newSand(14);
  return g;
}
