import type { Sprite } from "./sprite";

/** A translucent rectangle composited by the canvas after the pixel pass; far cheaper than per-pixel blending. */
export interface Overlay { x: number; y: number; w: number; h: number; color: number; alpha: number }

/**
 * Low-resolution RGBA framebuffer. Everything is drawn here in native pixels,
 * then presented onto the visible canvas at an integer scale so edges stay crisp.
 */
export class PixelBuffer {
  readonly image: ImageData;
  readonly px: Uint32Array;
  private readonly back: HTMLCanvasElement;
  private readonly backCtx: CanvasRenderingContext2D;

  constructor(readonly w: number, readonly h: number) {
    this.back = document.createElement("canvas");
    this.back.width = w;
    this.back.height = h;
    this.backCtx = this.back.getContext("2d")!;
    this.image = this.backCtx.createImageData(w, h);
    this.px = new Uint32Array(this.image.data.buffer);
  }

  clear(color: number): void {
    this.px.fill(color);
  }

  set(x: number, y: number, color: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[(y | 0) * this.w + (x | 0)] = color;
  }

  blendPixel(x: number, y: number, color: number, alpha: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y | 0) * this.w + (x | 0);
    this.px[i] = blend(this.px[i], color, alpha);
  }

  fillRect(x: number, y: number, w: number, h: number, color: number): void {
    const x0 = Math.max(0, x | 0);
    const y0 = Math.max(0, y | 0);
    const x1 = Math.min(this.w, (x + w) | 0);
    const y1 = Math.min(this.h, (y + h) | 0);
    for (let yy = y0; yy < y1; yy++) {
      this.px.fill(color, yy * this.w + x0, yy * this.w + x1);
    }
  }

  /** Blend a translucent colour over a rect. alpha 0..1. */
  tintRect(x: number, y: number, w: number, h: number, color: number, alpha: number): void {
    const x0 = Math.max(0, x | 0);
    const y0 = Math.max(0, y | 0);
    const x1 = Math.min(this.w, (x + w) | 0);
    const y1 = Math.min(this.h, (y + h) | 0);
    const a = Math.max(0, Math.min(1, alpha));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const i = yy * this.w + xx;
        this.px[i] = blend(this.px[i], color, a);
      }
    }
  }

  blit(s: Sprite, x: number, y: number, flipX = false): void {
    const x0 = x | 0;
    const y0 = y | 0;
    for (let sy = 0; sy < s.h; sy++) {
      const dy = y0 + sy;
      if (dy < 0 || dy >= this.h) continue;
      for (let sx = 0; sx < s.w; sx++) {
        const c = s.px[sy * s.w + sx];
        if (c === 0) continue;
        const dx = x0 + (flipX ? s.w - 1 - sx : sx);
        if (dx < 0 || dx >= this.w) continue;
        this.px[dy * this.w + dx] = c;
      }
    }
  }

  /**
   * Draw onto the visible canvas. The backing store uses the largest integer
   * scale that fits (crisp pixels); CSS then stretches it the last fraction so
   * the tank hugs the window edges. Returns the effective on-screen scale.
   */
  present(screen: HTMLCanvasElement, overlays: Overlay[] = []): number {
    this.backCtx.putImageData(this.image, 0, 0);
    for (const o of overlays) {
      if (o.alpha <= 0) continue;
      this.backCtx.fillStyle = css(o.color, o.alpha);
      this.backCtx.fillRect(o.x, o.y, o.w, o.h);
    }
    const stage = screen.parentElement!;
    const fit = Math.max(0.5, Math.min(stage.clientWidth / this.w, stage.clientHeight / this.h));
    const scale = Math.max(1, Math.floor(fit));
    const cw = this.w * scale;
    const ch = this.h * scale;
    if (screen.width !== cw || screen.height !== ch) {
      screen.width = cw;
      screen.height = ch;
    }
    screen.style.width = `${Math.floor(this.w * fit)}px`;
    screen.style.height = `${Math.floor(this.h * fit)}px`;
    const ctx = screen.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    // Transparent framebuffer pixels would composite over the previous frame
    // and leave trails, so wipe the canvas first.
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(this.back, 0, 0, cw, ch);
    return fit;
  }
}

function css(color: number, alpha: number): string {
  return `rgba(${color & 0xff}, ${(color >>> 8) & 0xff}, ${(color >>> 16) & 0xff}, ${alpha.toFixed(3)})`;
}

function blend(dst: number, src: number, a: number): number {
  const ia = 1 - a;
  const r = ((dst & 0xff) * ia + (src & 0xff) * a) | 0;
  const g = (((dst >>> 8) & 0xff) * ia + ((src >>> 8) & 0xff) * a) | 0;
  const b = (((dst >>> 16) & 0xff) * ia + ((src >>> 16) & 0xff) * a) | 0;
  return ((0xff << 24) | (b << 16) | (g << 8) | r) >>> 0;
}
