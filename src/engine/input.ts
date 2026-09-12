/** Pointer state translated into framebuffer coordinates. */
export class Input {
  x = 0;
  y = 0;
  /** Where the current/last press started, so a fast drag still hits what was pressed. */
  pressX = 0;
  pressY = 0;
  down = false;
  /** False once the pointer leaves the canvas, so cursors stop at the edge. */
  inside = false;
  /** True for exactly one frame after a press. */
  pressed = false;
  /** True for exactly one frame after a release. */
  released = false;
  /** The current or last press came from a finger, not a mouse or pen. */
  touch = false;
  /** Seconds the pointer has been held down. */
  held = 0;
  /** Distance the pointer has moved since the press, in framebuffer pixels. */
  travel = 0;
  /** A two-finger gesture owns the screen: presses are ignored until every finger lifts. */
  blocked = false;
  private pendingPress = false;
  private pendingRelease = false;

  constructor(private readonly screen: HTMLCanvasElement, private readonly bufW: number, private readonly bufH: number) {
    screen.addEventListener("pointermove", (e) => {
      this.track(e);
      this.inside = true;
      if (this.down) this.travel = Math.max(this.travel, Math.hypot(this.x - this.pressX, this.y - this.pressY));
    });
    screen.addEventListener("pointerleave", () => {
      this.inside = false;
    });
    screen.addEventListener("pointerdown", (e) => {
      if (!e.isPrimary || this.blocked) return;
      this.track(e);
      this.touch = e.pointerType === "touch";
      this.inside = true;
      this.pressX = this.x;
      this.pressY = this.y;
      this.down = true;
      this.held = 0;
      this.travel = 0;
      this.pendingPress = true;
      screen.setPointerCapture(e.pointerId);
    });
    const release = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if (e.type === "pointerup") this.track(e);
      this.down = false;
      this.pendingRelease = true;
      // A lifted finger is nowhere: no hover, no cursor, no lure left behind.
      if (this.touch) this.inside = false;
    };
    screen.addEventListener("pointerup", release);
    screen.addEventListener("pointercancel", release);
  }

  private track(e: PointerEvent): void {
    const r = this.screen.getBoundingClientRect();
    this.x = Math.floor(((e.clientX - r.left) / r.width) * this.bufW);
    this.y = Math.floor(((e.clientY - r.top) / r.height) * this.bufH);
  }

  /** Drop the current press without a release: a second finger took over. */
  cancel(): void {
    if (!this.down) return;
    this.down = false;
    this.pendingPress = false;
    this.pendingRelease = true;
    this.travel = 999;
    this.inside = false;
  }

  /** Call once per frame before reading `pressed`/`released`. */
  beginFrame(dt = 0): void {
    this.pressed = this.pendingPress;
    this.released = this.pendingRelease;
    this.pendingPress = false;
    this.pendingRelease = false;
    if (this.down) this.held += dt;
  }
}
