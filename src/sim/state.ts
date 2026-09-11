import { BACTERIA, TAP } from "../data/constants";
import type { Fish } from "./fish";

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

export interface GameState {
  version: 1;
  /** Epoch ms of the last simulated instant. */
  simTime: number;
  coins: number;
  tank: TankState;
  equipment: Equipment;
  fish: Fish[];
  inventory: Record<string, number>;
  /** Total hours the tank has been running, for achievements and cycle detection. */
  ageHours: number;
}

export function newGame(now = Date.now()): GameState {
  return {
    version: 1,
    simTime: now,
    coins: 150,
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
    inventory: {},
    ageHours: 0,
  };
}
