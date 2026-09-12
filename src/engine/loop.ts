export interface LoopHooks {
  /** Per-frame animation update, dt in seconds (clamped). */
  frame(dt: number): void;
  render(): void;
  /** Frame-rate cap, read every frame so settings apply live. */
  maxFps(): number;
}

/**
 * requestAnimationFrame loop for animation only. The simulation runs on its own
 * wall-clock timer because rAF pauses while the window is hidden.
 */
export function startLoop(hooks: LoopHooks, driver: "raf" | "timer" = "raf"): void {
  let last = performance.now();
  // "timer" keeps rendering while the window is hidden (rAF would pause); only for stress runs.
  const schedule = driver === "raf" ? (fn: (t: number) => void) => requestAnimationFrame(fn) : (fn: (t: number) => void) => setTimeout(() => fn(performance.now()), 0);
  const step = (now: number) => {
    schedule(step);
    const elapsed = (now - last) / 1000;
    // Skip frames above the cap; a small tolerance keeps 60 Hz displays at 60.
    if (elapsed < 1 / hooks.maxFps() - 0.002) return;
    last = now;
    hooks.frame(Math.min(0.1, elapsed));
    hooks.render();
  };
  schedule(step);
}
