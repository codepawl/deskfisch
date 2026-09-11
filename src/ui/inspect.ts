import { SPECIES } from "../data/species";
import { happiness, type Fish } from "../sim/fish";
import { el } from "./dom";

/** Small card for one fish: name, species and need bars. */
export class InspectPanel {
  readonly root: HTMLElement;
  fish: Fish | null = null;
  private readonly title = el("h2");
  private readonly sub = el("div.muted");
  private readonly bars = {
    hunger: el("div.bar-fill"),
    stress: el("div.bar-fill"),
    health: el("div.bar-fill"),
    mood: el("div.bar-fill"),
  };

  constructor(overlay: HTMLElement) {
    this.root = el("div.panel.panel-inspect", { hidden: true }, this.title, this.sub);
    for (const [key, fill] of Object.entries(this.bars)) {
      this.root.append(el("div.bar-row", {}, el("span.stat-label", {}, key), el("div.bar", {}, fill)));
    }
    overlay.append(this.root);
  }

  show(f: Fish | null): void {
    this.fish = f;
    this.root.hidden = !f;
    this.refresh();
  }

  refresh(): void {
    const f = this.fish;
    if (!f || this.root.hidden) return;
    const sp = SPECIES[f.speciesId];
    this.title.textContent = f.name;
    const days = Math.floor(f.ageHours / 24);
    this.sub.textContent = f.alive ? `${sp.name} · ${days}d old` : `${sp.name} · dead`;
    setBar(this.bars.hunger, f.hunger, true);
    setBar(this.bars.stress, f.stress, true);
    setBar(this.bars.health, f.health, false);
    setBar(this.bars.mood, happiness(f), false);
  }
}

function setBar(fill: HTMLElement, v: number, highIsBad: boolean): void {
  fill.style.width = `${Math.round(v)}%`;
  const bad = highIsBad ? v : 100 - v;
  fill.className = `bar-fill ${bad < 35 ? "ok" : bad < 65 ? "warn" : "bad"}`;
}
