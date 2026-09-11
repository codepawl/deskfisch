import { DECALS, DECOR, SUPPLIES } from "../data/items";
import { SPECIES } from "../data/species";
import { buyDecal, buyDecor, buyFish, buySupply, GEAR, ownsDecal, upgradeGear, type GearKey } from "../sim/shop";
import type { Bounds } from "../sim/fish";
import type { GameState } from "../sim/state";
import { button, el } from "./dom";
import { shopIcon, spriteIcon } from "./shopicons";
import { DECOR_SPRITES } from "../scenes/tank";
import { t } from "../i18n";

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
    for (const tab of ["fish", "gear", "supplies", "decor"] as Tab[]) {
      tabs.append(button("tab", t(tab), () => this.setTab(tab)));
    }
    this.root = el("div.panel.panel-shop", { hidden: true }, el("h2", {}, t("Shop")), tabs, this.list, this.note);
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
    this.note.textContent = err ? t(err) : "";
    this.onChange();
    this.refresh();
  }

  refresh(): void {
    if (this.root.hidden) return;
    for (const b of this.root.querySelectorAll(".tab")) b.classList.toggle("active", b.textContent === t(this.tab));
    this.list.replaceChildren();
    const coins = this.state.coins;
    const row = (pic: HTMLElement, name: string, sub: string, price: number, action: () => void, disabled = false) =>
      this.list.append(
        el("div.shop-row", {}, pic, el("div.shop-text", {}, el("div", {}, name), el("div.muted", {}, sub)),
          disabled ? button("tool", "—", action) : button("tool", String(price), action, "coin")),
      );
    switch (this.tab) {
      case "fish":
        for (const sp of Object.values(SPECIES)) {
          const sub = `${sp.tempRange[0]}–${sp.tempRange[1]}°C · pH ${sp.phRange[0]}–${sp.phRange[1]}` + (sp.minGroup > 1 ? t(" · group of {n}+", { n: sp.minGroup }) : "");
          row(spriteIcon(sp.frames[0]), t(sp.name), sub, sp.price, () => this.attempt(buyFish(this.state, sp.id, this.water)), coins < sp.price);
        }
        break;
      case "gear":
        for (const key of Object.keys(GEAR) as GearKey[]) {
          const { label, tiers } = GEAR[key];
          const cur = tiers[this.state.equipment[key]];
          const next = tiers[this.state.equipment[key] + 1];
          if (next) row(shopIcon(key), `${t(label)}: ${t(cur.name)}`, t("Upgrade to {name}", { name: t(next.name) }), next.price, () => this.attempt(upgradeGear(this.state, key)), coins < next.price);
          else row(shopIcon(key), `${t(label)}: ${t(cur.name)}`, t("Top tier"), 0, () => {}, true);
        }
        break;
      case "supplies":
        for (const it of SUPPLIES) {
          const owned = (it.id === "thermometer" || it.id === "testKit") && this.state.equipment[it.id];
          row(shopIcon(it.id), t(it.name), owned ? t("Owned") : t(it.blurb), it.price, () => this.attempt(buySupply(this.state, it.id)), owned || coins < it.price);
        }
        break;
      case "decor":
        for (const d of DECOR) {
          row(spriteIcon(DECOR_SPRITES[d.id]), t(d.name), (d.no3Uptake ? t("Absorbs nitrate") : t("A hiding spot")) + t(" · drag to place"), d.price, () => this.attempt(buyDecor(this.state, d.id, this.water)), coins < d.price);
        }
        this.list.append(el("div.shop-heading", {}, t("Backdrop decals")));
        this.list.append(
          el("div.shop-row", {}, shopIcon("decal"), el("div.shop-text", {}, el("div", {}, t("No decal")), el("div.muted", {}, t("See-through back glass, water bends the view"))),
            this.state.decal === null ? el("span.muted", {}, t("Applied")) : button("tool", t("Apply"), () => this.attempt((this.state.decal = null, null)))),
        );
        for (const d of DECALS) {
          const owned = ownsDecal(this.state, d.id);
          const active = this.state.decal === d.id;
          const swatch = el("span.swatch");
          swatch.style.background = `linear-gradient(${d.top}, ${d.bottom})`;
          this.list.append(
            el("div.shop-row", {}, el("div.shop-icon", {}, swatch), el("div.shop-text", {}, el("div", {}, t(d.name)), el("div.muted", {}, owned ? t("Owned") : "")),
              active ? el("span.muted", {}, t("Applied")) : owned ? button("tool", t("Apply"), () => this.attempt(buyDecal(this.state, d.id))) : coins < d.price ? button("tool", "—", () => {}) : button("tool", String(d.price), () => this.attempt(buyDecal(this.state, d.id)), "coin")),
          );
        }
        break;
    }
  }
}
