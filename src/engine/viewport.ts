import type { Input } from "./input";

/**
 * Two-finger pinch and pan for the tank on touch screens. The canvas is
 * transformed inside a clipping box; one finger keeps talking to the game
 * through `Input`, two fingers hand the gesture over here and cancel whatever
 * the first finger had started.
 */
export class Viewport {
  /** Current zoom, 1 = the glass fits the box. */
  zoom = 1;
  private tx = 0;
  private ty = 0;
  private minZoom = 1;
  /** CSS px per framebuffer px at zoom 1. */
  private base = 1;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pinch: { dist: number; zoom: number; cx: number; cy: number; tx: number; ty: number } | null = null;

  /**
   * `glass` is the part of the framebuffer worth looking at (the tank without
   * the desktop HUD margins); fit and cover are computed on it.
   */
  constructor(private readonly box: HTMLElement, private readonly screen: HTMLCanvasElement, private readonly input: Input, private readonly glass: { x: number; y: number; w: number; h: number }) {
    box.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        input.cancel();
        this.beginPinch();
      }
    });
    box.addEventListener("pointermove", (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch && this.pointers.size >= 2) this.movePinch();
    });
    const up = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (this.pointers.size === 0) input.blocked = false;
    };
    box.addEventListener("pointerup", up);
    box.addEventListener("pointercancel", up);
    box.addEventListener("dblclick", () => this.reset());
  }

  /** Fit or cover the box; called on resize and when the view setting changes. */
  layout(cover: boolean): void {
    const bw = this.box.clientWidth;
    const bh = this.box.clientHeight;
    const g = this.glass;
    const fit = Math.min(bw / g.w, bh / g.h);
    const fill = Math.max(bw / g.w, bh / g.h);
    this.base = fit;
    this.minZoom = cover ? fill / fit : 1;
    this.screen.style.width = `${this.screen.width * fit}px`;
    this.screen.style.height = `${this.screen.height * fit}px`;
    this.zoom = Math.max(this.zoom, this.minZoom);
    this.apply();
  }

  reset(): void {
    this.zoom = this.minZoom;
    this.tx = 0;
    this.ty = 0;
    this.apply();
  }

  private beginPinch(): void {
    const [a, b] = [...this.pointers.values()];
    this.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, tx: this.tx, ty: this.ty };
    this.input.blocked = true;
  }

  private movePinch(): void {
    const p = this.pinch!;
    const [a, b] = [...this.pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const z = Math.min(4, Math.max(this.minZoom, (p.zoom * dist) / Math.max(1, p.dist)));
    // Keep the point under the fingers fixed while scaling, then add the pan.
    const r = this.box.getBoundingClientRect();
    const ox = p.cx - r.left;
    const oy = p.cy - r.top;
    this.tx = ox - ((ox - p.tx) * z) / p.zoom + (cx - p.cx);
    this.ty = oy - ((oy - p.ty) * z) / p.zoom + (cy - p.cy);
    this.zoom = z;
    this.apply();
  }

  private apply(): void {
    const bw = this.box.clientWidth;
    const bh = this.box.clientHeight;
    const k = this.base * this.zoom;
    const g = this.glass;
    // Where the glass lands: centred when it fits, otherwise never past its edges.
    const gw = g.w * k;
    const gh = g.h * k;
    const left = gw <= bw ? (bw - gw) / 2 : Math.min(0, Math.max(bw - gw, this.tx + g.x * k));
    const top = gh <= bh ? (bh - gh) / 2 : Math.min(0, Math.max(bh - gh, this.ty + g.y * k));
    this.tx = left - g.x * k;
    this.ty = top - g.y * k;
    this.screen.style.transformOrigin = "0 0";
    this.screen.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.zoom})`;
  }
}
