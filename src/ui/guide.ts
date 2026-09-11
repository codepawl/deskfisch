import type { GameState } from "../sim/state";
import { isCycled } from "../sim/tank";
import { BACTERIA } from "../data/constants";
import { ACHIEVEMENTS } from "../sim/achievements";
import { button, el } from "./dom";

interface Step {
  title: string;
  tip: string;
  done(s: GameState): boolean;
}

/** The path from an empty tank to a healthy first fish, in order. */
const STEPS: Step[] = [
  { title: "Buy a filter", tip: "Shop → Gear. The filter is where the good bacteria live.", done: (s) => s.equipment.filter > 0 },
  { title: "Buy a heater", tip: "Shop → Gear. Most tropical fish want 24–27 °C.", done: (s) => s.equipment.heater > 0 },
  { title: "Drop a pinch of food", tip: "Feed the empty tank. Rotting food makes ammonia, which feeds the bacteria.", done: (s) => s.tank.nh3 > 0.02 || s.tank.bactA > BACTERIA.seed * 1.5 || s.fish.length > 0 },
  { title: "Buy a test kit", tip: "Shop → Supplies. Without it you cannot see ammonia or nitrite.", done: (s) => s.equipment.testKit },
  { title: "Wait for the cycle", tip: "Test water shows the stage. Ammonia spikes, then nitrite, then both drop. Takes a few days.", done: (s) => isCycled(s) || s.fish.length > 0 },
  { title: "Buy your first fish", tip: "Shop → Fish. Schooling species need a group.", done: (s) => s.fish.length > 0 || s.bags.length > 0 },
  { title: "Acclimate and release", tip: "Float the bag 10 min, add tank water three times, then drag it under the surface.", done: (s) => s.fish.length > 0 },
  { title: "Feed once or twice a day", tip: "Uneaten food rots. Change some water weekly.", done: (s) => s.fish.some((f) => f.alive && f.hunger < 40) },
];

/** Checklist panel for new players. Opens itself on a fresh tank. */
export class GuidePanel {
  readonly root: HTMLElement;
  private readonly list = el("div.guide-list");
  private readonly journal = el("div.journal");

  constructor(overlay: HTMLElement, private readonly state: GameState) {
    this.root = el(
      "div.panel.panel-guide",
      { hidden: state.guideSeen },
      el("h2", {}, "Getting started"),
      el("div.guide-body", {},
        el("div", {}, el("h3", {}, "Checklist"), this.list),
        el("div", {}, el("h3", {}, "Journal"), this.journal)),
      el("div.panel-actions", {}, button("tool", "Got it", () => this.close())),
    );
    overlay.append(this.root);
    this.refresh();
  }

  toggle(): void {
    if (this.root.hidden) this.open();
    else this.close();
  }

  private open(): void {
    this.root.hidden = false;
    this.refresh();
  }

  private close(): void {
    this.root.hidden = true;
    this.state.guideSeen = true;
  }

  refresh(): void {
    if (this.root.hidden) return;
    const s = this.state;
    const alive = s.fish.filter((f) => f.alive).length;
    const oldest = Math.max(0, ...s.fish.filter((f) => f.alive).map((f) => f.ageHours));
    this.journal.replaceChildren(
      ...[
        ["Tank age", `${Math.floor(s.ageHours / 24)} days`],
        ["Fish now", String(alive)],
        ["Bought / born", `${s.stats.bought} / ${s.stats.born}`],
        ["Sold / lost", `${s.stats.sold} / ${s.stats.died}`],
        ["Oldest fish", `${Math.floor(oldest / 24)} days`],
        ["Coins earned", String(Math.floor(s.stats.coinsEarned))],
        ["Achievements", `${s.achievements.length} / ${ACHIEVEMENTS.length}`],
      ].map(([k, v]) => el("div.stat-row", {}, el("span.stat-label", {}, k), el("span.num", {}, v))),
    );
    this.list.replaceChildren();
    let current = true;
    for (const step of STEPS) {
      const done = step.done(this.state);
      const row = el("div.guide-step", { className: `guide-step ${done ? "done" : current ? "current" : ""}` }, el("div", {}, `${done ? "✔" : "○"} ${step.title}`));
      if (!done && current) row.append(el("div.muted", {}, step.tip));
      if (!done) current = false;
      this.list.append(row);
    }
  }
}
