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
export function startLoop(hooks: LoopHooks): void {
  let last = performance.now();
  const step = (now: number) => {
    requestAnimationFrame(step);
    const elapsed = (now - last) / 1000;
    // Skip frames above the cap; a small tolerance keeps 60 Hz displays at 60.
    if (elapsed < 1 / hooks.maxFps() - 0.002) return;
    last = now;
    hooks.frame(Math.min(0.1, elapsed));
    hooks.render();
  };
  requestAnimationFrame(step);
}
