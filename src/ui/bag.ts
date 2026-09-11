import { SPECIES } from "../data/species";
import { addTankWater, ADDS_NEEDED, FLOAT_MINUTES, secondsUntilNextAdd, type Bag } from "../sim/bag";
import type { GameState } from "../sim/state";
import { button, el } from "./dom";

/** Acclimation card for a floating bag. */
export class BagPanel {
  readonly root: HTMLElement;
  bag: Bag | null = null;
  private readonly title = el("h2");
  private readonly sub = el("div.muted");
  private readonly floatFill = el("div.bar-fill");
  private readonly addsFill = el("div.bar-fill");
  private readonly addBtn: HTMLButtonElement;
  private readonly note = el("div.shop-note");

  constructor(overlay: HTMLElement, private readonly state: GameState) {
    this.addBtn = button("tool", "Add tank water", () => {
      if (!this.bag) return;
      this.note.textContent = addTankWater(this.state, this.bag) ?? "";
      this.refresh();
    });
    this.root = el(
      "div.panel.panel-bag",
      { hidden: true },
      this.title,
      this.sub,
      el("div.bar-row", {}, el("span.stat-label", {}, "float"), el("div.bar", {}, this.floatFill)),
      el("div.bar-row", {}, el("span.stat-label", {}, "mixed"), el("div.bar", {}, this.addsFill)),
      el("div.muted", {}, "Drag the bag under the surface to release."),
      this.note,
      el("div.panel-actions", {}, this.addBtn, button("tool", "Close", () => this.show(null))),
    );
    overlay.append(this.root);
  }

  show(b: Bag | null): void {
    this.bag = b;
    this.note.textContent = "";
    this.root.hidden = !b;
    this.refresh();
  }

  refresh(): void {
    const b = this.bag;
    if (!b || this.root.hidden) return;
    if (!this.state.bags.includes(b)) {
      this.show(null);
      return;
    }
    this.title.textContent = b.name;
    this.sub.textContent = `${SPECIES[b.speciesId].name} · in the bag`;
    const floated = Math.min(1, (Date.now() - b.floatedAt) / (FLOAT_MINUTES * 60_000));
    this.floatFill.style.width = `${Math.round(floated * 100)}%`;
    this.floatFill.className = `bar-fill ${floated < 0.5 ? "bad" : floated < 1 ? "warn" : ""}`;
    this.addsFill.style.width = `${Math.round((b.waterAdds / ADDS_NEEDED) * 100)}%`;
    this.addsFill.className = `bar-fill ${b.waterAdds === 0 ? "bad" : b.waterAdds < ADDS_NEEDED ? "warn" : ""}`;
    const wait = Math.ceil(secondsUntilNextAdd(b));
    const full = b.waterAdds >= ADDS_NEEDED;
    this.addBtn.disabled = full || wait > 0;
    this.addBtn.textContent = full ? "Bag mixed" : wait > 0 ? `Add water in ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, "0")}` : "Add tank water";
  }
}
