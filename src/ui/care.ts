import { doWaterChange } from "../sim/tank";
import type { GameState } from "../sim/state";
import { button, el } from "./dom";

const HEATER_MIN = 18;
const HEATER_MAX = 32;

/** Water change controls. Scrubbing and vacuuming are pointer tools, not buttons. */
export class CarePanel {
  readonly root: HTMLElement;
  private readonly doses = el("div.muted");
  private readonly note = el("div.shop-note");
  private readonly heaterRow = el("div.settings-row");
  private readonly heaterValue = el("span");

  constructor(overlay: HTMLElement, private readonly state: GameState, private readonly onChange: () => void) {
    const row = el("div.panel-actions");
    for (const pct of [20, 35, 50]) {
      row.append(button("tool", `${pct}%`, () => this.change(pct / 100)));
    }
    const nudge = (delta: number) => {
      const eq = this.state.equipment;
      eq.heaterTarget = Math.max(HEATER_MIN, Math.min(HEATER_MAX, eq.heaterTarget + delta));
      this.onChange();
      this.refresh();
    };
    this.heaterRow.append(
      el("span", {}, "Heater target"),
      el("span.panel-actions", {}, button("tool", "−", () => nudge(-1)), this.heaterValue, button("tool", "+", () => nudge(1))),
    );
    this.root = el(
      "div.panel.panel-care",
      { hidden: true },
      el("h2", {}, "Care"),
      this.heaterRow,
      el("h2", {}, "Water change"),
      el("div.muted", {}, "Swaps old water for tap water. Dilutes nitrate, resets temperature."),
      this.doses,
      row,
      this.note,
      el("div.panel-actions", {}, button("tool", "Close", () => this.toggle())),
    );
    overlay.append(this.root);
  }

  toggle(): void {
    this.root.hidden = !this.root.hidden;
    this.note.textContent = "";
    this.refresh();
  }

  private change(fraction: number): void {
    const { conditioned } = doWaterChange(this.state, fraction);
    this.note.textContent = conditioned ? "" : "No conditioner: chlorine went in. Buy some at the shop.";
    this.onChange();
    this.refresh();
  }

  refresh(): void {
    if (this.root.hidden) return;
    const n = this.state.inventory.conditioner ?? 0;
    this.doses.textContent = n > 0 ? `Conditioner doses: ${n}` : "No conditioner doses left.";
    this.heaterRow.hidden = this.state.equipment.heater === 0;
    this.heaterValue.textContent = `${this.state.equipment.heaterTarget} °C`;
  }
}
