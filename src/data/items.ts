/** Equipment tiers indexed by state value; index 0 is "none". */
export interface FilterTier { name: string; price: number; bacteriaCapacity: number; dirtRemovalPerHour: number; aeration: number }
export const FILTERS: FilterTier[] = [
  { name: "None", price: 0, bacteriaCapacity: 0.3, dirtRemovalPerHour: 0, aeration: 0 },
  { name: "Sponge filter", price: 40, bacteriaCapacity: 1.0, dirtRemovalPerHour: 0.5, aeration: 0.3 },
  { name: "Hang-on-back filter", price: 120, bacteriaCapacity: 2.0, dirtRemovalPerHour: 1.5, aeration: 0.5 },
  { name: "Canister filter", price: 400, bacteriaCapacity: 4.0, dirtRemovalPerHour: 3, aeration: 0.6 },
];

export interface HeaterTier { name: string; price: number; /** °C per hour per degree of gap */ power: number }
export const HEATERS: HeaterTier[] = [
  { name: "None", price: 0, power: 0 },
  { name: "50W heater", price: 35, power: 0.4 },
  { name: "100W heater", price: 70, power: 0.9 },
  { name: "200W heater", price: 140, power: 1.8 },
];

export interface AirPumpTier { name: string; price: number; aeration: number }
export const AIR_PUMPS: AirPumpTier[] = [
  { name: "None", price: 0, aeration: 0 },
  { name: "Small air pump", price: 30, aeration: 0.8 },
  { name: "Large air pump", price: 80, aeration: 1.6 },
];

export interface LightTier { name: string; price: number; /** algae growth multiplier while on */ intensity: number }
export const LIGHTS: LightTier[] = [
  { name: "None", price: 0, intensity: 0 },
  { name: "Basic LED", price: 45, intensity: 1 },
  { name: "Full-spectrum LED", price: 150, intensity: 1.6 },
];

/** Surface gas exchange with no equipment at all. */
export const BASE_AERATION = 0.25;
