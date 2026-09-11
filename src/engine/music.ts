/**
 * Background music: a few slow chiptune tracks, one set for daylight and one
 * for night, shuffled and crossfaded. Off by default so a pet window never
 * starts playing over someone's work; Settings → Music turns it on.
 */
const DAY = ["sunrise", "music-box", "calm"];
const NIGHT = ["night", "deep"];
/** Music sits under the sound effects. */
const LEVEL = 0.35;
const FADE_MS = 2500;

type Set = "day" | "night";

export class Music {
  private el: HTMLAudioElement | null = null;
  private set: Set | null = null;
  private queue: string[] = [];
  private enabled = false;
  private volume = 0.5;
  private muted = false;
  private fade: number | null = null;
  /** Browsers need a gesture before audio starts; retry on the next one. */
  private blocked = false;

  constructor() {
    window.addEventListener("pointerdown", () => {
      if (this.blocked && this.enabled) {
        this.blocked = false;
        this.next();
      }
    }, { passive: true });
  }

  setVolume(volume: number, muted: boolean): void {
    this.volume = volume;
    this.muted = muted;
    if (this.el && !this.fade) this.el.volume = this.level();
  }

  /** Call every frame: turns the player on or off and follows day and night. */
  update(enabled: boolean, night: boolean): void {
    const set: Set = night ? "night" : "day";
    if (!enabled) {
      if (this.enabled) this.stop();
      this.enabled = false;
      return;
    }
    if (!this.enabled || set !== this.set) {
      this.enabled = true;
      this.set = set;
      this.queue = shuffle(set === "day" ? DAY : NIGHT);
      this.crossfadeToNext();
    }
  }

  private level(): number {
    return this.muted ? 0 : this.volume * LEVEL;
  }

  private next(): void {
    if (!this.enabled || !this.set) return;
    if (this.queue.length === 0) this.queue = shuffle(this.set === "day" ? DAY : NIGHT);
    const name = this.queue.shift()!;
    const el = new Audio(`${import.meta.env.BASE_URL}music/${name}.mp3`);
    el.preload = "auto";
    el.volume = 0;
    el.addEventListener("ended", () => {
      if (this.el === el) this.next();
    });
    this.el = el;
    el.play().then(() => this.ramp(el, this.level())).catch(() => {
      this.blocked = true;
    });
  }

  private crossfadeToNext(): void {
    const old = this.el;
    if (old) this.ramp(old, 0, () => { old.pause(); old.src = ""; });
    this.next();
  }

  private stop(): void {
    const old = this.el;
    this.el = null;
    this.set = null;
    if (old) this.ramp(old, 0, () => { old.pause(); old.src = ""; });
  }

  private ramp(el: HTMLAudioElement, to: number, done?: () => void): void {
    const from = el.volume;
    const start = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - start) / FADE_MS);
      el.volume = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step);
      else done?.();
    };
    requestAnimationFrame(step);
  }
}

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
