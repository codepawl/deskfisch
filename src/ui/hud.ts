import type { GameState } from "../sim/state";
import { button, el } from "./dom";

export type Tool = "feed" | "scrub" | "vacuum" | null;

/** Coins, clock and the bottom toolbar. Panels register their toggle buttons here. */
export class Hud {
  readonly root: HTMLElement;
  /** The top strip; in pet mode it doubles as the window drag handle. */
  readonly dragHandle: HTMLElement;
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
    this.bar.append(
      this.feedBtn,
      button("tool", "Scrub", () => this.toggleTool("scrub")),
      button("tool", "Vacuum", () => this.toggleTool("vacuum")),
      this.lightBtn,
    );
    this.dragHandle = el("div.hud-top", {}, this.coins, this.clock);
    this.root = el("div.hud", {}, this.dragHandle, this.bar);
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
    if (this.tool === "feed" && flakes <= 0) this.tool = null;
    for (const b of this.bar.querySelectorAll("button")) {
      b.classList.toggle("active", this.tool !== null && b.textContent!.toLowerCase().startsWith(this.tool));
    }
    this.lightBtn.hidden = s.equipment.light === 0;
    this.lightBtn.textContent = s.equipment.lightOn ? "Light: on" : "Light: off";
  }
}
