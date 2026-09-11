/** Tap water the player refills with. Chlorine is neutralised by conditioner. */
export const TAP = { temp: 22, pH: 7.4, chlorine: 1.0, no3: 5 };
export const ROOM_TEMP = 22;

/** Bacteria growth: a fresh tank fully cycles in roughly 4 real days. */
export const BACTERIA = {
  seed: 0.02,
  growthPerHour: 0.08,
  decayPerHour: 0.01,
  /** Half-saturation constant for Monod uptake (ppm). */
  halfSat: 0.3,
  /** ppm converted per hour per unit of bacteria at full saturation. */
  uptakePerHour: 0.6,
};

/** ppm of ammonia produced per hour by one fish of bioload 1 in 60 litres. */
export const WASTE_PER_HOUR = 0.02;
export const REFERENCE_VOLUME = 60;

/** Hours of feeding-free time before a fish is fully hungry. */
export const HOURS_TO_STARVE = 12;
/** How fast stress moves toward the level its conditions dictate (fraction per hour). */
export const STRESS_EASE_PER_HOUR = 0.5;

/** Longest offline stretch that is simulated on resume. */
export const MAX_CATCHUP_HOURS = 48;
export const CATCHUP_STEP_SECONDS = 60;

export const AUTOSAVE_SECONDS = 30;
