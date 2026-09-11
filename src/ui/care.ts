import { doWaterChange } from "../sim/tank";
import type { GameState } from "../sim/state";
import { button, el } from "./dom";

/** Water change controls. Scrubbing and vacuuming are pointer tools, not buttons. */
export class CarePanel {
  readonly root: HTMLElement;
  private readonly doses = el("div.muted");
  private readonly note = el("div.shop-note");

  constructor(overlay: HTMLElement, private readonly state: GameState, private readonly onChange: () => void) {
    const row = el("div.panel-actions");
    for (const pct of [20, 35, 50]) {
      row.append(button("tool", `${pct}%`, () => this.change(pct / 100)));
    }
    this.root = el(
      "div.panel.panel-care",
      { hidden: true },
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
  }
}
