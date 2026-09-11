import type { GameState } from "../sim/state";
import { button, el } from "./dom";

export type Tool = "feed" | null;

/** Coins, clock and the bottom toolbar. Panels register their toggle buttons here. */
export class Hud {
  readonly root: HTMLElement;
  tool: Tool = null;
  private readonly coins = el("span.hud-coins");
  private readonly clock = el("span.hud-clock");
  private readonly feedBtn: HTMLButtonElement;
  private readonly lightBtn: HTMLButtonElement;
  private readonly bar = el("div.toolbar");

  constructor(overlay: HTMLElement, private readonly state: GameState) {
    this.feedBtn = button("tool", "Feed", () => this.toggleTool("feed"));
    this.lightBtn = button("tool", "Light", () => {
      state.equipment.lightOn = !state.equipment.lightOn;
      this.refresh();
    });
    this.bar.append(this.feedBtn, this.lightBtn);
    this.root = el("div.hud", {}, el("div.hud-top", {}, this.coins, this.clock), this.bar);
    overlay.append(this.root);
    this.refresh();
  }

  addButton(label: string, onclick: () => void): HTMLButtonElement {
    const b = button("tool", label, onclick);
    this.bar.append(b);
    return b;
  }

  toggleTool(t: Tool): void {
    this.tool = this.tool === t ? null : t;
    this.refresh();
  }

  refresh(): void {
    const s = this.state;
    this.coins.textContent = `$ ${Math.floor(s.coins)}`;
    const day = Math.floor(s.ageHours / 24) + 1;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    this.clock.textContent = `Day ${day} · ${hh}:${mm}`;
    const flakes = s.inventory.flakes ?? 0;
    this.feedBtn.textContent = `Feed ×${flakes}`;
    this.feedBtn.disabled = flakes <= 0;
    this.feedBtn.classList.toggle("active", this.tool === "feed");
    if (this.tool === "feed" && flakes <= 0) this.tool = null;
    this.lightBtn.hidden = s.equipment.light === 0;
    this.lightBtn.textContent = s.equipment.lightOn ? "Light: on" : "Light: off";
  }
}
