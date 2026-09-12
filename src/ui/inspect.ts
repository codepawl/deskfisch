import { SPECIES } from "../data/species";
import { happiness, type Fish } from "../sim/fish";
import { removeFish, sellPrice } from "../sim/shop";
import { GESTATION_HOURS } from "../sim/breeding";
import type { GameState } from "../sim/state";
import { button, el } from "./dom";
import { t } from "../i18n";

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

  private readonly action: HTMLButtonElement;

  constructor(overlay: HTMLElement, private readonly state: GameState, private readonly onChange: () => void) {
    this.root = el("div.panel.panel-inspect", { hidden: true }, this.title, this.sub);
    for (const [key, fill] of Object.entries(this.bars)) {
      this.root.append(el("div.bar-row", {}, el("span.stat-label", {}, t(key)), el("div.bar", {}, fill)));
    }
    this.action = button("tool", "", () => {
      if (!this.fish) return;
      removeFish(this.state, this.fish.id);
      this.show(null);
      this.onChange();
    });
    this.root.append(el("div.panel-actions", {}, this.action, button("tool", t("Rename"), () => this.rename()), button("tool", t("Close"), () => this.show(null))));
    overlay.append(this.root);
  }

  /** Swap the title for a text box; Enter or blur commits, Escape cancels. */
  private rename(): void {
    const f = this.fish;
    if (!f) return;
    const input = document.createElement("input");
    input.className = "rename";
    input.value = f.name;
    input.maxLength = 16;
    const done = (commit: boolean) => {
      const v = input.value.trim();
      if (commit && v) f.name = v;
      input.replaceWith(this.title);
      this.refresh();
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") done(true);
      if (e.key === "Escape") done(false);
      e.stopPropagation();
    };
    input.onblur = () => done(true);
    this.title.replaceWith(input);
    input.focus();
    input.select();
  }

  /** The fish whose card is open, if any. */
  get current(): Fish | null {
    return this.root.hidden ? null : this.fish;
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
    const sex = f.sex === "f" ? "♀" : "♂";
    const stage = t(f.size < 0.5 ? "fry" : f.size < 0.8 ? "juvenile" : "adult");
    const gravid = f.gravidHours ? t(" · carrying fry {p}%", { p: Math.round((f.gravidHours / GESTATION_HOURS) * 100) }) : "";
    const sick = f.sick === "ich" ? t(" · ICH: medicine or 29 °C+") : f.sick === "finrot" ? t(" · FIN ROT: medicine + clean water") : "";
    this.sub.textContent = f.alive ? `${sex} ${t(sp.name)} · ${stage} · ${days}d${gravid}${sick}` : `${t(sp.name)} · ${t("dead")}`;
    this.sub.classList.toggle("bad", !!f.sick);
    setBar(this.bars.hunger, f.hunger, true);
    setBar(this.bars.stress, f.stress, true);
    setBar(this.bars.health, f.health, false);
    setBar(this.bars.mood, happiness(f), false);
    this.action.textContent = f.alive ? t("Sell for {n} coins", { n: sellPrice(this.state, f.id) }) : t("Scoop out");
  }
}

function setBar(fill: HTMLElement, v: number, highIsBad: boolean): void {
  fill.style.width = `${Math.round(v)}%`;
  const bad = highIsBad ? v : 100 - v;
  fill.className = `bar-fill ${bad < 35 ? "ok" : bad < 65 ? "warn" : "bad"}`;
}
