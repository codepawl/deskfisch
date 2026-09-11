import type { GameState } from "../sim/state";
import { isCycled } from "../sim/tank";
import { BACTERIA } from "../data/constants";
import { hasSand } from "../sim/sand";
import { ACHIEVEMENTS } from "../sim/achievements";
import { button, el } from "./dom";
import { t } from "../i18n";

interface Step {
  title: string;
  tip: string;
  done(s: GameState): boolean;
}

/** The path from an empty tank to a healthy first fish, in order. */
const STEPS: Step[] = [
  { title: "Pour in some sand", tip: "Shop → Supplies → Bag of sand. Fish and plants need a bed to live on.", done: (s) => hasSand(s) },
  { title: "Plant something", tip: "Shop → Decor. Plants soak up nitrate and give shy fish a place to hide. Drag to place.", done: (s) => s.decor.length > 0 || s.tank.fill >= 0.7 },
  { title: "Fill it with water", tip: "Change water → Fill with tap water. Use conditioner so no chlorine goes in.", done: (s) => s.tank.fill >= 0.7 },
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
      el("h2", {}, t("Getting started")),
      el("div.guide-body", {},
        el("div", {}, el("h3", {}, t("Checklist")), this.list),
        el("div", {}, el("h3", {}, t("Journal")), this.journal)),
      el("div.panel-actions", {}, button("tool", t("Got it"), () => this.close())),
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
        [t("Tank age"), t("{n} days", { n: Math.floor(s.ageHours / 24) })],
        [t("Fish now"), String(alive)],
        [t("Bought / born"), `${s.stats.bought} / ${s.stats.born}`],
        [t("Sold / lost"), `${s.stats.sold} / ${s.stats.died}`],
        [t("Oldest fish"), t("{n} days", { n: Math.floor(oldest / 24) })],
        [t("Coins earned"), String(Math.floor(s.stats.coinsEarned))],
        [t("Achievements"), `${s.achievements.length} / ${ACHIEVEMENTS.length}`],
      ].map(([k, v]) => el("div.stat-row", {}, el("span.stat-label", {}, k), el("span.num", {}, v))),
    );
    this.list.replaceChildren();
    let current = true;
    for (const step of STEPS) {
      const done = step.done(this.state);
      const row = el("div.guide-step", { className: `guide-step ${done ? "done" : current ? "current" : ""}` }, el("div", {}, `${done ? "✔" : "○"} ${t(step.title)}`));
      if (!done && current) row.append(el("div.muted", {}, t(step.tip)));
      if (!done) current = false;
      this.list.append(row);
    }
  }
}
