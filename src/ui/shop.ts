import { DECOR, SUPPLIES } from "../data/items";
import { SPECIES } from "../data/species";
import { buyDecor, buyFish, buySupply, GEAR, upgradeGear, type GearKey } from "../sim/shop";
import type { Bounds } from "../sim/fish";
import type { GameState } from "../sim/state";
import { button, el } from "./dom";

type Tab = "fish" | "gear" | "supplies" | "decor";

/** Tabbed shop. Rows are rebuilt on every refresh; the list is tiny. */
export class ShopPanel {
  readonly root: HTMLElement;
  private tab: Tab = "fish";
  private readonly list = el("div.shop-list");
  private readonly note = el("div.shop-note");

  constructor(
    overlay: HTMLElement,
    private readonly state: GameState,
    private readonly water: Bounds,
    private readonly onChange: () => void,
  ) {
    const tabs = el("div.tabs");
    for (const t of ["fish", "gear", "supplies", "decor"] as Tab[]) {
      tabs.append(button("tab", t, () => this.setTab(t)));
    }
    this.root = el("div.panel.panel-shop", { hidden: true }, el("h2", {}, "Shop"), tabs, this.list, this.note);
    overlay.append(this.root);
  }

  toggle(): void {
    this.root.hidden = !this.root.hidden;
    this.refresh();
  }

  private setTab(t: Tab): void {
    this.tab = t;
    this.refresh();
  }

  private attempt(err: string | null): void {
    this.note.textContent = err ?? "";
    this.onChange();
    this.refresh();
  }

  refresh(): void {
    if (this.root.hidden) return;
    for (const b of this.root.querySelectorAll(".tab")) b.classList.toggle("active", b.textContent === this.tab);
    this.list.replaceChildren();
    const coins = this.state.coins;
    const row = (name: string, sub: string, price: number, action: () => void, disabled = false) =>
      this.list.append(
        el("div.shop-row", {}, el("div", {}, el("div", {}, name), el("div.muted", {}, sub)),
          disabled ? button("tool", "—", action) : button("tool", String(price), action, "coin")),
      );
    switch (this.tab) {
      case "fish":
        for (const sp of Object.values(SPECIES)) {
          const sub = `${sp.tempRange[0]}–${sp.tempRange[1]}°C · pH ${sp.phRange[0]}–${sp.phRange[1]}` + (sp.minGroup > 1 ? ` · group of ${sp.minGroup}+` : "");
          row(sp.name, sub, sp.price, () => this.attempt(buyFish(this.state, sp.id, this.water)), coins < sp.price);
        }
        break;
      case "gear":
        for (const key of Object.keys(GEAR) as GearKey[]) {
          const { label, tiers } = GEAR[key];
          const cur = tiers[this.state.equipment[key]];
          const next = tiers[this.state.equipment[key] + 1];
          if (next) row(`${label}: ${cur.name}`, `Upgrade to ${next.name}`, next.price, () => this.attempt(upgradeGear(this.state, key)), coins < next.price);
          else row(`${label}: ${cur.name}`, "Top tier", 0, () => {}, true);
        }
        break;
      case "supplies":
        for (const it of SUPPLIES) {
          const owned = (it.id === "thermometer" || it.id === "testKit") && this.state.equipment[it.id];
          row(it.name, owned ? "Owned" : it.blurb, it.price, () => this.attempt(buySupply(this.state, it.id)), owned || coins < it.price);
        }
        break;
      case "decor":
        for (const d of DECOR) {
          row(d.name, d.no3Uptake ? "Absorbs nitrate" : "A hiding spot", d.price, () => this.attempt(buyDecor(this.state, d.id, this.water)), coins < d.price);
        }
        break;
    }
  }
}
