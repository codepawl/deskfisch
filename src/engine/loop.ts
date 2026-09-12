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
  // "timer" keeps rendering while the window is hidden (rAF pauses and WebKit
  // throttles setTimeout to 1 Hz on hidden pages); a MessageChannel ping is
  // neither paused nor throttled. Only for stress runs.
  let schedule: (fn: (t: number) => void) => void;
  if (driver === "raf") schedule = (fn) => requestAnimationFrame(fn);
  else {
    const channel = new MessageChannel();
    let pending: ((t: number) => void) | null = null;
    channel.port1.onmessage = () => {
      const fn = pending;
      pending = null;
      fn?.(performance.now());
    };
    schedule = (fn) => {
      pending = fn;
      channel.port2.postMessage(0);
    };
  }
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
