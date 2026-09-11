import { BACTERIA, TAP } from "../data/constants";
import type { Fish } from "./fish";
import type { Pellet } from "./food";
import type { Bag } from "./bag";

export interface TankState {
  volumeL: number;
  temp: number;
  pH: number;
  /** ppm */
  nh3: number;
  no2: number;
  no3: number;
  /** mg/L dissolved oxygen */
  o2: number;
  chlorine: number;
  /** 0..100 waste on the substrate */
  dirt: number;
  /** 0..100 film on the glass */
  algae: number;
  /** Nitrifying bacteria as a fraction of the filter's capacity (can exceed 1 briefly after a downgrade). */
  bactA: number;
  bactB: number;
}

export interface Equipment {
  filter: number;
  heater: number;
  heaterTarget: number;
  airPump: number;
  light: number;
  lightOn: boolean;
  thermometer: boolean;
  testKit: boolean;
}

export interface Decor {
  kind: string;
  /** Left edge on the substrate. */
  x: number;
}

export type Quality = "high" | "medium" | "low";

export interface Settings {
  /** See-through window in pet mode. */
  transparent: boolean;
  /** 0..1 */
  volume: number;
  muted: boolean;
  /** Game seconds per real second. */
  simSpeed: number;
  quality: Quality;
  maxFps: number;
  /** Hide every control and leave only the tank. */
  chill: boolean;
}

export interface GameState {
  version: 1;
  /** Epoch ms of the last simulated instant. */
  simTime: number;
  coins: number;
  tank: TankState;
  equipment: Equipment;
  fish: Fish[];
  pellets: Pellet[];
  bags: Bag[];
  decor: Decor[];
  /** Next fish id, so ids stay unique across sells and deaths. */
  nextFishId: number;
  /** Item id -> count. */
  inventory: Record<string, number>;
  /** Total hours the tank has been running, for achievements and cycle detection. */
  ageHours: number;
  achievements: string[];
  /** The getting-started checklist has been dismissed once. */
  guideSeen: boolean;
  /** How the desktop window is presented; ignored in the browser build. */
  mode: "window" | "pet" | "fullscreen";
  /** Keep the window above other apps (window and pet modes). */
  pinned: boolean;
  settings: Settings;
}

export function newGame(now = Date.now()): GameState {
  return {
    version: 1,
    simTime: now,
    coins: 200,
    tank: {
      volumeL: 60,
      temp: TAP.temp,
      pH: TAP.pH,
      nh3: 0,
      no2: 0,
      no3: TAP.no3,
      o2: 8,
      chlorine: 0,
      dirt: 0,
      algae: 0,
      bactA: BACTERIA.seed,
      bactB: BACTERIA.seed,
    },
    equipment: {
      filter: 0,
      heater: 0,
      heaterTarget: 25,
      airPump: 0,
      light: 0,
      lightOn: false,
      thermometer: false,
      testKit: false,
    },
    fish: [],
    pellets: [],
    bags: [],
    decor: [],
    nextFishId: 1,
    inventory: { flakes: 20, conditioner: 2 },
    ageHours: 0,
    achievements: [],
    guideSeen: false,
    mode: "window",
    pinned: true,
    settings: { transparent: true, volume: 0.5, muted: false, simSpeed: 1, quality: "high", maxFps: 60, chill: false },
  };
}
