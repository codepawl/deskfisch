/** Pointer state translated into framebuffer coordinates. */
export class Input {
  x = 0;
  y = 0;
  down = false;
  /** True for exactly one frame after a press. */
  pressed = false;
  /** True for exactly one frame after a release. */
  released = false;
  private pendingPress = false;
  private pendingRelease = false;

  constructor(private readonly screen: HTMLCanvasElement, private readonly bufW: number, private readonly bufH: number) {
    screen.addEventListener("pointermove", (e) => this.track(e));
    screen.addEventListener("pointerdown", (e) => {
      this.track(e);
      this.down = true;
      this.pendingPress = true;
      screen.setPointerCapture(e.pointerId);
    });
    screen.addEventListener("pointerup", (e) => {
      this.track(e);
      this.down = false;
      this.pendingRelease = true;
    });
    screen.addEventListener("pointercancel", () => {
      this.down = false;
      this.pendingRelease = true;
    });
  }

  private track(e: PointerEvent): void {
    const r = this.screen.getBoundingClientRect();
    this.x = Math.floor(((e.clientX - r.left) / r.width) * this.bufW);
    this.y = Math.floor(((e.clientY - r.top) / r.height) * this.bufH);
  }

  /** Call once per frame before reading `pressed`/`released`. */
  beginFrame(): void {
    this.pressed = this.pendingPress;
    this.released = this.pendingRelease;
    this.pendingPress = false;
    this.pendingRelease = false;
  }
}
