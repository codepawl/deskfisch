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

export interface TankTier { name: string; price: number; volumeL: number }
export const TANKS: TankTier[] = [
  { name: "60 L nano", price: 0, volumeL: 60 },
  { name: "120 L", price: 300, volumeL: 120 },
  { name: "200 L", price: 800, volumeL: 200 },
];

/** Surface gas exchange with no equipment at all. */
export const BASE_AERATION = 0.25;

/** Everything else the shop sells. `apply` mutates the game state on purchase. */
export interface Consumable { id: string; name: string; price: number; blurb: string }
export const SUPPLIES: Consumable[] = [
  { id: "sand", name: "Bag of sand", price: 20, blurb: "Pours a layer of sand across the bottom. Pour twice for a deeper bed." },
  { id: "flakes", name: "Flake food ×10", price: 10, blurb: "Ten pinches. Feed once or twice a day." },
  { id: "conditioner", name: "Water conditioner ×5", price: 15, blurb: "Neutralises chlorine in tap water." },
  { id: "bacteria", name: "Bottled bacteria", price: 40, blurb: "Kick-starts the nitrogen cycle." },
  { id: "thermometer", name: "Thermometer", price: 12, blurb: "Reveals the water temperature." },
  { id: "testKit", name: "Test kit", price: 60, blurb: "Reveals pH, ammonia, nitrite, nitrate, oxygen." },
  { id: "ichMed", name: "Ich medicine", price: 35, blurb: "Clears white spot from every fish. Knocks the filter bacteria back a bit." },
  { id: "finrotMed", name: "Fin rot medicine", price: 35, blurb: "Clears fin rot from every fish. Knocks the filter bacteria back a bit." },
];

export interface DecorKind { id: string; name: string; price: number; /** Nitrate removed per hour. */ no3Uptake: number }
export const DECOR: DecorKind[] = [
  { id: "plant", name: "Small plant", price: 20, no3Uptake: 0.05 },
  { id: "plantTall", name: "Tall plant", price: 30, no3Uptake: 0.08 },
  { id: "rock", name: "Rock", price: 25, no3Uptake: 0 },
  { id: "wood", name: "Driftwood", price: 45, no3Uptake: 0 },
];

/** Backdrop decals stuck to the back glass. Two colours make a vertical gradient. */
export interface Decal { id: string; name: string; price: number; top: string; bottom: string }
export const DECALS: Decal[] = [
  { id: "black", name: "Black backdrop", price: 15, top: "#0b0d14", bottom: "#0b0d14" },
  { id: "deep", name: "Deep blue backdrop", price: 20, top: "#1f2b4d", bottom: "#0d1226" },
  { id: "jungle", name: "Jungle backdrop", price: 25, top: "#1f4a2a", bottom: "#0d2414" },
  { id: "sunset", name: "Sunset backdrop", price: 30, top: "#ef7d57", bottom: "#5d275d" },
  { id: "coral", name: "Coral backdrop", price: 30, top: "#ff77a8", bottom: "#b13e53" },
  { id: "sand", name: "Sand backdrop", price: 20, top: "#eec39a", bottom: "#d9a066" },
];

/** Each decoration is a hiding spot; stress relief tops out at this many. */
export const MAX_DECOR_COMFORT = 5;
export const DECOR_COMFORT = 2;

export const FISH_NAMES = [
  "Bubbles", "Finn", "Coral", "Pearl", "Ziggy", "Momo", "Luna", "Kiwi", "Pip", "Sunny",
  "Blue", "Dot", "Mochi", "Taro", "Boba", "Nori", "Miso", "Pebble", "Echo", "Juno",
];
