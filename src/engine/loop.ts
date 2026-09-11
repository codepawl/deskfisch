export interface LoopHooks {
  /** Per-frame animation update, dt in seconds (clamped). */
  frame(dt: number): void;
  /** Fixed-step simulation tick, once per `tickSeconds` of wall time. */
  tick(): void;
  render(): void;
}

/** requestAnimationFrame loop with a fixed-step accumulator for the simulation. */
export function startLoop(hooks: LoopHooks, tickSeconds = 1): void {
  let last = performance.now();
  let acc = 0;
  const step = (now: number) => {
    // Clamp so a background tab does not replay hours of ticks in one frame;
    // offline catch-up is handled separately with coarse ticks.
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    hooks.frame(dt);
    while (acc >= tickSeconds) {
      acc -= tickSeconds;
      hooks.tick();
    }
    hooks.render();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
