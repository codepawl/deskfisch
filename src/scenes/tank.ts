import { COLOR, rgba } from "../engine/palette";
import { DECALS } from "../data/items";
import { relaxSand, sandAt, shiftSand } from "../sim/sand";
import { PixelBuffer, type Overlay } from "../engine/pixelbuffer";
import { sprite, type Sprite } from "../engine/sprite";
import { rand } from "../engine/rng";
import { SPECIES } from "../data/species";
import type { Bounds, Fish } from "../sim/fish";
import type { GameState, Quality } from "../sim/state";
import type { Bag } from "../sim/bag";
import { ambientNow } from "../sim/clock";


export const SCREEN_W = 384;
export const SCREEN_H = 240;

/** Top of the glass. The water surface sits below it by the fill level. */
export const GLASS_TOP = 18;
/**
 * Water area. `y0` is the surface and moves with the fill level (see
 * `setFillLevel`); the glass frame sits just outside; the toolbar lives below.
 */
export const WATER: Bounds = { x0: 8, y0: 37, x1: 376, y1: 208 };

/** Move the surface to `fill` of the glass height (0.7–1). */
export function setFillLevel(fill: number): void {
  WATER.y0 = GLASS_TOP + Math.round((1 - fill) * (WATER.y1 - GLASS_TOP));
}

/** Bags float with their top above the water line. */
export function bagY(): number {
  return WATER.y0 - 8;
}
/** Pointer tool sprites drawn at the cursor. */
const SPONGE = sprite([
  ".yyyyyy.",
  "yyySyyyy",
  "yySyyyyy",
  "yyyyyySy",
  ".yyyyyy.",
]);
const SIPHON = sprite([
  "..DD",
  "..DD",
  "..DD",
  ".DDD",
  "DLLD",
  "DLLD",
  "DDDD",
]);
export const TOOL_SPRITES: Record<string, Sprite> = { scrub: SPONGE, vacuum: SIPHON };
/** Sand top at a column, from the state's heightmap. Columns outside the water fall back to the glass bottom. */
export function sandTop(sand: number[], x: number): number {
  return WATER.y1 - sandAt(sand, x - WATER.x0);
}

/** Highest sand row in the tank (smallest y), for band effects that stop at the bed. */
export function sandCrest(sand: number[]): number {
  let max = 0;
  for (const h of sand) if (h > max) max = h;
  return WATER.y1 - max;
}

/** Surface velocity gained per px/s of window velocity change. A quick flick of ~600 px/s tilts the surface about half way. */
const IMPULSE = 0.006;

/** A bag being dragged by the pointer, drawn at the pointer instead of the surface. */
export interface DragBag { bag: Bag; x: number; y: number }
export const BAG_W = 26;
export const BAG_H = 22;

const WATER_TOP = rgba("#3b7dd8");
const WATER_MID = rgba("#2f5fc4");
const WATER_DEEP = rgba("#29366f");
const GLASS = COLOR.d;

const PLANT = sprite([
  "..G....",
  ".gGg.G.",
  ".gGg.gG",
  "..g.gG.",
  "gG.g.g.",
  ".gGg.g.",
  "..g..g.",
  "..g.g..",
  "..gg...",
  "..t....",
]);

const PLANT_TALL = sprite([
  "G.....",
  "gG..G.",
  ".g.gG.",
  ".g.g..",
  "G.g...",
  "gG.g..",
  ".g.G..",
  ".gg...",
  ".g....",
  ".g.G..",
  ".gg...",
  ".t....",
]);

const ROCK = sprite([
  "....DDDD....",
  "..DDLLLDDD..",
  ".DLLLDDDDDD.",
  "DDLDDDDDDdDD",
  "DDDDDDdDDddD",
  ".DdDDDdddDd.",
]);

const WOOD = sprite([
  "t..........",
  "tt........t",
  ".ttt....ttt",
  "..ttttttts.",
  "...tsttts..",
  "...ts.tt...",
  "..tt..tt...",
]);

export const DECOR_SPRITES: Record<string, Sprite> = { plant: PLANT, plantTall: PLANT_TALL, rock: ROCK, wood: WOOD };

interface Bubble { x: number; y: number; speed: number; wobble: number }

/** Short-lived effect pixel. `pull` particles home in on a point instead of drifting. */
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: number; pull?: { x: number; y: number } }

export class TankScene {
  private bubbles: Bubble[] = [];
  private particles: Particle[] = [];
  private time = 0;
  /** True while a tool is being applied this frame; wiggles the tool sprite. */
  private working = false;
  /** Full-water tints for this frame (room light, algae), composited on the GPU. */
  overlays: Overlay[] = [];
  /** Sloshing: surface tilt (−1..1, positive = high on the right) and heave, as damped springs. */
  private tilt = 0;
  private tiltVel = 0;
  private heave = 0;
  private heaveVel = 0;
  private pushX = 0;
  private pushY = 0;

  /** Window jolts waiting to shove the sand: signed grains per column, applied in order. */
  private shoves: number[] = [];
  private settleTimer = 0;
  /** Top of the sand this frame, cached for the band effects. */
  private crest = WATER.y1;

  /**
   * The window's velocity changed (px/s). Water only reacts to acceleration:
   * a steady glide leaves the surface flat, a start or stop kicks it, and the
   * surface then rings like a lightly damped pendulum.
   */
  push(vx: number, vy: number): void {
    const dvx = vx - this.pushX;
    const dvy = vy - this.pushY;
    this.pushX = vx;
    this.pushY = vy;
    this.tiltVel -= dvx * IMPULSE;
    this.heaveVel -= dvy * IMPULSE;
    // Friction drags the top grains against the shove; a hard yank piles the bed up one side.
    const grains = Math.min(4, Math.floor(Math.abs(dvx) / 300));
    if (grains > 0) this.shoves.push(dvx > 0 ? -grains : grains);
  }

  /** Apply pending shoves and let slopes slump. Cheap: one pass over 368 columns. */
  stepSand(sand: number[], dt: number): void {
    for (const s of this.shoves.splice(0)) {
      shiftSand(sand, Math.abs(s), s > 0 ? 1 : -1);
      this.settleTimer = 2;
    }
    if (this.settleTimer > 0) {
      this.settleTimer -= dt;
      if (!relaxSand(sand)) this.settleTimer = 0;
    }
  }

  private stepSlosh(dt: number): void {
    // Undamped natural frequency ~1.2 Hz, damping ratio ~0.12: rings a few times over ~3 s.
    const omega = 2 * Math.PI * 1.2;
    const k = omega * omega;
    const c = 2 * 0.12 * omega;
    this.tiltVel += (-k * this.tilt - c * this.tiltVel) * dt;
    this.tilt = Math.max(-1, Math.min(1, this.tilt + this.tiltVel * dt));
    this.heaveVel += (-k * this.heave - c * this.heaveVel) * dt;
    this.heave = Math.max(-1, Math.min(1, this.heave + this.heaveVel * dt));
  }

  /** Whether the water is visibly moving; skips the shear when still. */
  get sloshing(): boolean {
    return Math.abs(this.tilt) > 0.02 || Math.abs(this.heave) > 0.02 || Math.abs(this.tiltVel) > 0.1;
  }

  /** Horizontal water velocity felt by fish, px/s. */
  get current(): number {
    return this.tiltVel * 40;
  }

  update(dt: number, quality: Quality = "high"): void {
    this.time += dt;
    this.stepSlosh(dt);
    if (quality !== "low" && Math.random() < dt * 1.2) {
      this.bubbles.push({ x: rand(WATER.x0 + 30, WATER.x0 + 40), y: WATER.y1 - 6, speed: rand(18, 30), wobble: rand(0, 6) });
    }
    for (const b of this.bubbles) {
      b.y -= b.speed * dt;
      b.wobble += dt * 4;
    }
    this.bubbles = this.bubbles.filter((b) => b.y > WATER.y0);
    for (const p of this.particles) {
      if (p.pull) {
        const dx = p.pull.x - p.x;
        const dy = p.pull.y - p.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        p.vx = (dx / d) * 40;
        p.vy = (dy / d) * 40;
        if (d < 2) p.life = 0;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y > WATER.y0 - 2);
    this.working = false;
  }

  /** Foam from scrubbing: pale bubbles that rise and pop. */
  foam(x: number, y: number): void {
    this.working = true;
    for (let i = 0; i < 2; i++) {
      this.particles.push({ x: x + rand(-4, 4), y: y + rand(-3, 3), vx: rand(-6, 6), vy: rand(-25, -12), life: rand(0.3, 0.7), color: Math.random() < 0.5 ? COLOR.W : COLOR.c });
    }
  }

  /** Suction: grains around the siphon mouth get pulled in and vanish. */
  suck(x: number, y: number): void {
    this.working = true;
    for (let i = 0; i < 2; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(5, 11);
      this.particles.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.5, vx: 0, vy: 0, life: 0.6, color: Math.random() < 0.3 ? COLOR.t : COLOR.s, pull: { x, y } });
    }
    // A puff of water up the tube.
    this.particles.push({ x: x + rand(-1, 1), y: y - 4, vx: 0, vy: -30, life: 0.25, color: COLOR.c });
  }

  /** Ripple where food hits the surface. */
  splash(x: number): void {
    for (let i = 0; i < 6; i++) {
      this.particles.push({ x, y: WATER.y0 + 1, vx: rand(-20, 20), vy: rand(-14, -4), life: rand(0.2, 0.4), color: i % 2 ? COLOR.W : COLOR.c });
    }
  }

  render(
    buf: PixelBuffer,
    state: GameState,
    drag: DragBag | null = null,
    cursor: { tool: string; x: number; y: number } | null = null,
    transparentBackdrop = false,
    quality: Quality = "high",
  ): void {
    buf.clear(transparentBackdrop ? 0 : COLOR.K);
    this.crest = sandCrest(state.tank.sand);
    const lit = state.equipment.light > 0 && state.equipment.lightOn;
    this.drawBackdrop(buf, state);
    // Only a transparent window has anything behind the glass to see through.
    this.drawWater(buf, quality, lit, state.decal === null && transparentBackdrop, this.crest);
    this.drawSand(buf, state.tank.sand);
    this.drawDecor(buf, state);
    for (const p of state.pellets) {
      buf.set(p.x, p.y, COLOR.t);
      buf.set(p.x + 1, p.y, COLOR.s);
    }
    for (const f of state.fish) this.drawFish(buf, f);
    this.drawBubbles(buf);
    if (quality !== "low") for (const p of this.particles) buf.set(p.x, p.y, p.color);
    if (quality !== "low") this.refract(buf);
    if (quality !== "low" && this.sloshing) this.slosh(buf);
    for (const b of state.bags) {
      if (drag?.bag === b) this.drawBag(buf, b, drag.x, drag.y);
      else this.drawBag(buf, b, b.x, bagY() + Math.round(Math.sin(this.time * 1.2 + b.x) * 1));
    }
    // Room light follows the sun (real or simulated clock): night is dark navy,
    // dawn and dusk go rose and gold, day is clear. The tank light overrides it;
    // without one the tank is always a touch dimmer than the room so toggling shows.
    this.overlays.length = 0;
    const water = { x: WATER.x0, y: WATER.y0, w: WATER.x1 - WATER.x0, h: WATER.y1 - WATER.y0 };
    if (!lit) {
      const a = ambientNow(state);
      this.overlays.push({ ...water, color: a.alpha > 0 ? a.color : COLOR.n, alpha: Math.max(0.15, a.alpha) });
    }
    if (state.tank.algae > 10) this.overlays.push({ ...water, color: COLOR.g, alpha: state.tank.algae / 250 });
    this.drawGlass(buf);
    const toolSprite = cursor && TOOL_SPRITES[cursor.tool];
    if (toolSprite && cursor) {
      const wiggle = this.working ? Math.round(Math.sin(this.time * 40)) : 0;
      buf.blit(toolSprite, cursor.x - toolSprite.w / 2 + wiggle, cursor.y - toolSprite.h / 2);
    }
  }

  /** The decal stuck to the back glass; nothing when the back is left clear. */
  private drawBackdrop(buf: PixelBuffer, state: GameState): void {
    const decal = state.decal && DECALS.find((d) => d.id === state.decal);
    if (!decal) return;
    const top = rgba(decal.top);
    const bottom = rgba(decal.bottom);
    const h = WATER.y1 - GLASS_TOP;
    for (let y = GLASS_TOP; y < WATER.y1; y++) {
      buf.fillRect(WATER.x0, y, WATER.x1 - WATER.x0, 1, mix(top, bottom, (y - GLASS_TOP) / h));
    }
  }

  /** Tilt the whole water band: high side rises, low side drops, with a travelling ripple. */
  private slosh(buf: PixelBuffer): void {
    const cx = (WATER.x0 + WATER.x1) / 2;
    const half = (WATER.x1 - WATER.x0) / 2;
    const t = this.time;
    buf.shearColumns(WATER.x0, WATER.x1, WATER.y0 - 6, this.crest, (x) => {
      const lean = (-this.tilt * (x - cx)) / half * 6;
      const ripple = Math.sin((x - WATER.x0) * 0.08 + t * 9) * Math.abs(this.tiltVel) * 0.8;
      return Math.round(lean + this.heave * 4 + ripple);
    });
  }

  /** Water bends what is behind it: a slow sideways ripple plus a 1 px offset below the surface. */
  private refract(buf: PixelBuffer): void {
    const t = this.time;
    buf.shearRows(WATER.x0, WATER.x1, WATER.y0 + 2, this.crest, (y) => 1 + Math.round(Math.sin(y * 0.11 + t * 1.3) * 0.9));
  }

  private drawWater(buf: PixelBuffer, quality: Quality, lit: boolean, seeThrough: boolean, crest: number): void {
    const h = WATER.y1 - WATER.y0;
    if (h <= 0) return;
    // With no decal the water is only partly opaque, so a transparent window
    // shows the desktop through the tank, murkier with depth. Over a decal (or
    // the app's own backdrop) each row is one flat colour, so blend it once
    // against the backdrop pixel and fill the row instead of blending per pixel.
    const paint = (y: number, c: number) => {
      const depth = (y - WATER.y0) / h;
      const behind = buf.px[y * buf.w + WATER.x0];
      if (seeThrough && behind === 0) {
        buf.fillRect(WATER.x0, y, WATER.x1 - WATER.x0, 1, withAlpha(c, 0.5 + depth * 0.3));
      } else {
        buf.fillRect(WATER.x0, y, WATER.x1 - WATER.x0, 1, mix(behind, c, 0.72));
      }
    };
    if (quality === "low") {
      for (let y = WATER.y0; y < WATER.y1; y++) paint(y, WATER_MID);
    } else {
      for (let y = WATER.y0; y < WATER.y1; y++) {
        const t = (y - WATER.y0) / h;
        paint(y, t < 0.5 ? mix(WATER_TOP, WATER_MID, t * 2) : mix(WATER_MID, WATER_DEEP, (t - 0.5) * 2));
      }
    }
    // Light shafts from the tank light: sparse dithered pale bands drifting slowly, fading with depth.
    for (let i = 0; i < (quality === "high" && lit ? 3 : 0); i++) {
      const cx = WATER.x0 + 70 + i * 110 + Math.sin(this.time * 0.3 + i) * 10;
      for (let y = WATER.y0 + 1; y < crest; y++) {
        const w = 5 + (y - WATER.y0) * 0.1;
        const fade = 1 - (y - WATER.y0) / Math.max(1, crest - WATER.y0);
        for (let x = (cx - w) | 0; x < cx + w; x++) {
          if ((x + y * 2) % 5 === 0) buf.blendPixel(x, y, COLOR.c, 0.18 * fade);
        }
      }
    }
    // Surface ripple line.
    for (let x = WATER.x0; x < WATER.x1; x++) {
      const dy = Math.round(Math.sin(x * 0.25 + this.time * 2) * 0.6);
      buf.set(x, WATER.y0 + dy, COLOR.c);
    }
  }

  private drawSand(buf: PixelBuffer, sand: number[]): void {
    for (let i = 0; i < sand.length; i++) {
      const h = sand[i];
      if (h <= 0) continue;
      const x = WATER.x0 + i;
      const top = WATER.y1 - h;
      buf.fillRect(x, top, 1, h, COLOR.s);
      buf.set(x, top, COLOR.S);
      // Grain speckles: fixed per column and depth so they do not shimmer.
      for (let y = top + 2; y < WATER.y1; y += 3) {
        if (((x * 7 + y * 13) & 7) === 0) buf.set(x, y, ((x + y) & 1) ? COLOR.t : COLOR.S);
      }
    }
  }

  private drawDecor(buf: PixelBuffer, state: GameState): void {
    for (const d of state.decor) {
      const s = DECOR_SPRITES[d.kind];
      if (!s) continue;
      const plant = d.kind.startsWith("plant");
      const sway = plant ? Math.round(Math.sin(this.time * 1.5 + d.x)) : 0;
      // Plants are rooted a couple of pixels into the bed; hardscape rests on top of it.
      const top = sandTop(state.tank.sand, d.x + (s.w >> 1)) - s.h + (plant ? 2 : 0);
      buf.blit(s, d.x + sway, top, sway < 0);
    }
  }

  private drawFish(buf: PixelBuffer, f: Fish): void {
    const sp = SPECIES[f.speciesId];
    let frame = sp.frames[Math.floor(f.phase) % sp.frames.length];
    if (f.size < 0.5) frame = halfSize(frame);
    if (!f.alive) {
      // Belly up at the surface.
      buf.blit(frame, f.x, f.y, f.facing < 0);
      buf.tintRect(f.x, f.y, frame.w, frame.h, COLOR.D, 0.5);
      return;
    }
    const bob = Math.sin(f.phase * 0.8) * 0.8;
    buf.blit(frame, f.x, f.y + bob, f.facing < 0);
    if (f.sick === "ich") {
      // White spots scattered over the body.
      for (let i = 0; i < 4; i++) {
        buf.set(f.x + 3 + ((i * 5 + f.id) % Math.max(1, frame.w - 6)), f.y + bob + 1 + ((i * 3 + f.id) % Math.max(1, frame.h - 2)), COLOR.W);
      }
    } else if (f.sick === "finrot") {
      // Ragged, reddened tail.
      const tailX = f.facing > 0 ? f.x : f.x + frame.w - 4;
      buf.tintRect(tailX, f.y + bob, 4, frame.h, COLOR.r, 0.6);
    }
  }

  private drawBag(buf: PixelBuffer, bag: Bag, x: number, y: number): void {
    // Knotted top, translucent body, fish centred inside.
    buf.tintRect(x, y + 4, BAG_W, BAG_H - 4, COLOR.c, 0.35);
    buf.fillRect(x, y + 4, BAG_W, 1, COLOR.W);
    buf.fillRect(x, y + BAG_H - 1, BAG_W, 1, COLOR.W);
    buf.fillRect(x, y + 4, 1, BAG_H - 4, COLOR.W);
    buf.fillRect(x + BAG_W - 1, y + 4, 1, BAG_H - 4, COLOR.W);
    buf.fillRect(x + BAG_W / 2 - 2, y, 4, 4, COLOR.L);
    const sp = SPECIES[bag.speciesId];
    const frame = sp.frames[Math.floor(this.time * 3) % sp.frames.length];
    buf.blit(frame, x + (BAG_W - frame.w) / 2, y + 4 + (BAG_H - 4 - frame.h) / 2);
  }

  private drawBubbles(buf: PixelBuffer): void {
    for (const b of this.bubbles) {
      const x = b.x + Math.sin(b.wobble) * 1.5;
      buf.set(x, b.y, COLOR.c);
      buf.set(x + 1, b.y, COLOR.W);
      buf.set(x, b.y + 1, COLOR.B);
    }
  }

  private drawGlass(buf: PixelBuffer): void {
    const t = 3;
    buf.fillRect(WATER.x0 - t, GLASS_TOP - t, WATER.x1 - WATER.x0 + t * 2, t, GLASS);
    buf.fillRect(WATER.x0 - t, WATER.y1, WATER.x1 - WATER.x0 + t * 2, t, GLASS);
    buf.fillRect(WATER.x0 - t, GLASS_TOP - t, t, WATER.y1 - GLASS_TOP + t * 2, GLASS);
    buf.fillRect(WATER.x1, GLASS_TOP - t, t, WATER.y1 - GLASS_TOP + t * 2, GLASS);
  }
}

const halfCache = new Map<Sprite, Sprite>();

/** Fry are drawn at half resolution: every other pixel, so shapes stay readable. */
function halfSize(s: Sprite): Sprite {
  let small = halfCache.get(s);
  if (small) return small;
  const w = Math.ceil(s.w / 2);
  const h = Math.ceil(s.h / 2);
  const px = new Uint32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[y * w + x] = s.px[y * 2 * s.w + x * 2];
  small = { w, h, px };
  halfCache.set(s, small);
  return small;
}

function withAlpha(c: number, a: number): number {
  return ((Math.round(a * 255) << 24) | (c & 0xffffff)) >>> 0;
}

function mix(a: number, b: number, t: number): number {
  const r = ((a & 0xff) * (1 - t) + (b & 0xff) * t) | 0;
  const g = (((a >>> 8) & 0xff) * (1 - t) + ((b >>> 8) & 0xff) * t) | 0;
  const bl = (((a >>> 16) & 0xff) * (1 - t) + ((b >>> 16) & 0xff) * t) | 0;
  return ((0xff << 24) | (bl << 16) | (g << 8) | r) >>> 0;
}
