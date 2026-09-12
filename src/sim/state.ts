import { BACTERIA, TAP } from "../data/constants";
import type { Fish } from "./fish";
import type { Pellet } from "./food";
import type { Bag } from "./bag";
import { newSand } from "./sand";
import type { Playstyle } from "./rules";

export interface TankState {
  /** Visible settled waste on the sand; follows `dirt` (sim/grime.ts). */
  mulm?: { x: number; y: number; s: number }[];
  /** Visible algae film on the front glass; follows `algae`. */
  algaeSpots?: { x: number; y: number; s: number }[];
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
  /** Water level as a fraction of the glass height; 0 is an empty tank. Evaporation lowers it, filling and water changes raise it. */
  fill: number;
  /** Level the player fills to. */
  fillTarget: number;
  /** Sand heightmap, one entry per column. See sim/sand.ts. */
  sand: number[];
  /** Nitrifying bacteria as a fraction of the filter's capacity (can exceed 1 briefly after a downgrade). */
  bactA: number;
  bactB: number;
}

export interface Equipment {
  /** Index into TANKS; the tank's volume lives in `tank.volumeL`. */
  tank: number;
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
  /** Filter hum and bubbles in the background. */
  ambient: boolean;
  /** Background music (slow chiptune, day and night sets). Off by default. */
  music: boolean;
  /** UI language; "auto" follows the system. */
  lang: "auto" | "en" | "vi";
  /** Real time locks sim speed to 1× and lights the room by the real sun; simulated uses game time. */
  clock: "real" | "sim";
  /** Phones: "fit" shows the whole tank, "tall" fills a taller box and lets you pan. */
  mobileView?: "fit" | "tall";
  /** "HH:MM" local; used unless a location is set. */
  sunrise: string;
  sunset: string;
  /** Optional coordinates; when set, sunrise/sunset are computed daily. */
  lat?: number;
  lon?: number;
}

/** Lifetime counters for the journal. */
export interface Stats {
  bought: number;
  born: number;
  died: number;
  sold: number;
  coinsEarned: number;
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
  /** Active backdrop decal id, or null for a see-through back glass. Owned decals live in `inventory` as `decal:<id>`. */
  decal: string | null;
  /** Next fish id, so ids stay unique across sells and deaths. */
  nextFishId: number;
  /** Item id -> count. */
  inventory: Record<string, number>;
  /** Total hours the tank has been running, for achievements and cycle detection. */
  ageHours: number;
  /** Hour of day when the tank was started; the simulated clock runs from here. */
  dayStartHour: number;
  achievements: string[];
  stats: Stats;
  /** The getting-started checklist has been dismissed once. */
  guideSeen: boolean;
  /** How the desktop window is presented; ignored in the browser build. */
  mode: "window" | "pet" | "fullscreen";
  /** Keep the window above other apps (window and pet modes). */
  pinned: boolean;
  /** Zen, normal, hardcore or sandbox. See sim/rules.ts. */
  playstyle: Playstyle;
  /** The first-run welcome has been answered. */
  onboarded: boolean;
  settings: Settings;
}

/** A stocked, cycled tank for the website demo so the hero shows life, not an empty box. */
export function demoGame(now = Date.now()): GameState {
  const g = newGame(now);
  g.coins = 120;
  g.tank.fill = 0.9;
  g.tank.sand = newSand(14);
  g.tank.bactA = g.tank.bactB = 1;
  g.tank.temp = 25;
  g.tank.no3 = 12;
  g.equipment = { ...g.equipment, filter: 2, heater: 2, light: 1, lightOn: true, airPump: 1, thermometer: true, testKit: true };
  g.decor = [{ kind: "plantTall", x: 40 }, { kind: "plant", x: 70 }, { kind: "rock", x: 180 }, { kind: "plant", x: 300 }, { kind: "wood", x: 330 }];
  g.guideSeen = true;
  g.onboarded = true;
  g.ageHours = 24 * 9;
  return g;
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
      fill: 0,
      fillTarget: 0.9,
      sand: newSand(0),
      bactA: BACTERIA.seed,
      bactB: BACTERIA.seed,
    },
    equipment: {
      tank: 0,
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
    decal: null,
    nextFishId: 1,
    inventory: { flakes: 20, conditioner: 2 },
    ageHours: 0,
    dayStartHour: new Date(now).getHours() + new Date(now).getMinutes() / 60,
    achievements: [],
    stats: { bought: 0, born: 0, died: 0, sold: 0, coinsEarned: 0 },
    guideSeen: false,
    mode: "window",
    pinned: true,
    playstyle: "normal",
    onboarded: false,
    settings: { transparent: true, volume: 0.5, muted: false, simSpeed: 1, quality: "high", maxFps: 30, chill: false, ambient: true, music: false, lang: "auto", clock: "real", sunrise: "06:00", sunset: "18:00" },
  };
}
