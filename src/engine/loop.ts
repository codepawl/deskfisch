export interface LoopHooks {
  /** Per-frame animation update, dt in seconds (clamped). */
  frame(dt: number): void;
  render(): void;
}

/**
 * requestAnimationFrame loop for animation only. The simulation runs on its own
 * wall-clock timer because rAF pauses while the window is hidden.
 */
export function startLoop(hooks: LoopHooks): void {
  let last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    hooks.frame(dt);
    hooks.render();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
