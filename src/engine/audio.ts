/**
 * Synthesised sound effects. No audio files: everything is oscillators and
 * filtered noise, so the app stays small and works offline. The context is
 * created lazily because browsers only allow audio after a user gesture.
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private vacuumNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private ambientNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private volume = 0.5;
  private muted = false;

  setVolume(volume: number, muted: boolean): void {
    this.volume = volume;
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.02);
  }

  private level(): number {
    return this.muted ? 0 : this.volume;
  }

  private ensure(): AudioContext | null {
    if (this.level() === 0 && !this.ctx) return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.level();
      this.master.connect(this.ctx.destination);
      const seconds = 1;
      this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * seconds, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** A single rising "blip", the classic bubble. */
  bubble(size = 1): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    const base = 400 + Math.random() * 500 * size;
    osc.type = "sine";
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 2.2, t + 0.08);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  /** A knuckle on glass: a short, dull tock. */
  tap(): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.1);
    this.noiseBurst(900, 0.02, 0.05, "lowpass");
  }

  /** Short hiss of water hitting the surface. */
  splash(): void {
    this.noiseBurst(1800, 0.18, 0.2, "highpass");
  }

  /** Scrubbing: a bit of grit plus a bubble now and then. */
  scrub(): void {
    this.noiseBurst(2500, 0.05, 0.08, "bandpass");
    if (Math.random() < 0.35) this.bubble(0.6);
  }

  /** Continuous siphon hum while `on`, with the occasional gulp. */
  vacuum(on: boolean): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    if (on && !this.vacuumNode) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 350;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.1);
      src.connect(filter).connect(gain).connect(this.master);
      src.start();
      this.vacuumNode = { src, gain };
    } else if (!on && this.vacuumNode) {
      const { src, gain } = this.vacuumNode;
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      src.stop(ctx.currentTime + 0.2);
      this.vacuumNode = null;
    }
    if (on && Math.random() < 0.06) this.bubble(1.6);
  }

  /** Soft filter hum while `on`; a bubble now and then when there is an air pump. */
  ambient(on: boolean, bubbles: boolean): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    if (on && !this.ambientNode) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 180;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.5);
      src.connect(filter).connect(gain).connect(this.master);
      src.start();
      this.ambientNode = { src, gain };
    } else if (!on && this.ambientNode) {
      const { src, gain } = this.ambientNode;
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      src.stop(ctx.currentTime + 0.6);
      this.ambientNode = null;
    }
    if (on && bubbles && Math.random() < 0.004) this.bubble(0.8);
  }

  private noiseBurst(freq: number, attack: number, length: number, type: BiquadFilterType): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + attack * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + length + 0.05);
  }
}
