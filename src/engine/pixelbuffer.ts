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

  constructor(readonly w: number, readonly h: number) {
    this.image = new ImageData(w, h);
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

  /**
   * Shift each row in a band sideways by `offset(y)` pixels, filling the exposed
   * edge with the row's edge pixel. Applied to the water band it reads as
   * refraction: things under the surface wobble and sit slightly displaced.
   */
  shearRows(x0: number, x1: number, y0: number, y1: number, offset: (y: number) => number): void {
    const w = x1 - x0;
    const row = new Uint32Array(w);
    for (let y = y0; y < y1; y++) {
      const d = offset(y) | 0;
      if (d === 0 || Math.abs(d) >= w) continue;
      const base = y * this.w + x0;
      row.set(this.px.subarray(base, base + w));
      if (d > 0) {
        // Shift right: copy the block, repeat the left edge into the gap.
        this.px.set(row.subarray(0, w - d), base + d);
        this.px.fill(row[0], base, base + d);
      } else {
        this.px.set(row.subarray(-d), base);
        this.px.fill(row[w - 1], base + w + d, base + w);
      }
    }
  }

  /**
   * Shift each column in a band vertically by `offset(x)` pixels (positive =
   * down). Vacated pixels take the pixel just above the band, so air or a
   * backdrop shows where the water fell away. Used for sloshing.
   */
  shearColumns(x0: number, x1: number, y0: number, y1: number, offset: (x: number) => number): void {
    const h = y1 - y0;
    const col = new Uint32Array(h);
    for (let x = x0; x < x1; x++) {
      const d = offset(x) | 0;
      if (d === 0) continue;
      for (let i = 0; i < h; i++) col[i] = this.px[(y0 + i) * this.w + x];
      const air = y0 > 0 ? this.px[(y0 - 1) * this.w + x] : 0;
      for (let i = 0; i < h; i++) {
        const src = i - d;
        this.px[(y0 + i) * this.w + x] = src < 0 ? air : src >= h ? col[h - 1] : col[src];
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
   * Put the frame on the visible canvas at 1:1 and let CSS (`image-rendering:
   * pixelated`) do the upscale in the compositor. Scaling with drawImage cost a
   * software raster of the whole window every frame. Returns the on-screen scale.
   */
  present(screen: HTMLCanvasElement, overlays: Overlay[] = [], external = false): number {
    if (screen.width !== this.w || screen.height !== this.h) {
      screen.width = this.w;
      screen.height = this.h;
    }
    const ctx = screen.getContext("2d")!;
    ctx.putImageData(this.image, 0, 0);
    for (const o of overlays) {
      if (o.alpha <= 0) continue;
      ctx.fillStyle = css(o.color, o.alpha);
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    const stage = screen.parentElement!;
    const fit = Math.max(0.5, Math.min(stage.clientWidth / this.w, stage.clientHeight / this.h));
    // On phones the viewport sizes and transforms the canvas itself.
    if (external) return fit;
    screen.style.width = `${Math.floor(this.w * fit)}px`;
    screen.style.height = `${Math.floor(this.h * fit)}px`;
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
