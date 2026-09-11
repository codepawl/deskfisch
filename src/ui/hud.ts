import type { GameState } from "../sim/state";
import { button, el, setLabel } from "./dom";
import { icon, type IconName } from "./icons";

export type Tool = "feed" | "scrub" | "vacuum" | null;

/** Coins, clock and the bottom toolbar. Panels register their toggle buttons here. */
export class Hud {
  readonly root: HTMLElement;
  /** The top strip; in pet mode it doubles as the window drag handle. */
  readonly dragHandle: HTMLElement;
  /** Bottom-right corner handle for resizing the pet window. */
  readonly resizeHandle = el("div.resize-grip", { title: "Resize" });
  /** The only control left in chill mode; brings the rest back. */
  readonly restore: HTMLButtonElement;
  tool: Tool = null;
  private readonly coinCount = el("span");
  private readonly coins = el("span.hud-coins", {}, icon("coin"), this.coinCount);
  private readonly clock = el("span.hud-clock");
  private readonly feedBtn: HTMLButtonElement;
  private readonly lightBtn: HTMLButtonElement;
  private readonly bar = el("div.toolbar");

  constructor(overlay: HTMLElement, private readonly state: GameState) {
    this.feedBtn = button("tool", "Feed", () => this.toggleTool("feed"), "feed");
    this.lightBtn = button("tool", "Light", () => {
      state.equipment.lightOn = !state.equipment.lightOn;
      this.refresh();
    }, "light");
    this.bar.append(
      this.feedBtn,
      button("tool", "Scrub", () => this.toggleTool("scrub"), "scrub"),
      button("tool", "Vacuum", () => this.toggleTool("vacuum"), "vacuum"),
      this.lightBtn,
    );
    // Labels follow the last hovered button, not :hover, so crossing the gap
    // between two buttons hands the label over instead of collapsing it.
    this.bar.addEventListener("pointerover", (e) => {
      const b = (e.target as HTMLElement).closest("button");
      if (!b) return;
      for (const o of this.bar.querySelectorAll("button.hover")) o.classList.remove("hover");
      b.classList.add("hover");
    });
    this.bar.addEventListener("pointerleave", () => {
      for (const o of this.bar.querySelectorAll("button.hover")) o.classList.remove("hover");
    });
    this.dragHandle = el("div.hud-top", {}, this.coins, el("span.grip", {}, "⋮⋮ drag ⋮⋮"), this.clock);
    this.restore = button("hud-restore", "⋯", () => {});
    this.root = el("div.hud", {}, this.dragHandle, this.bar);
    overlay.append(this.root, this.resizeHandle, this.restore);
    this.refresh();
  }

  addButton(label: string, onclick: () => void, iconName?: IconName): HTMLButtonElement {
    const b = button("tool", label, onclick, iconName);
    this.bar.append(b);
    return b;
  }

  toggleTool(t: Tool): void {
    this.tool = this.tool === t ? null : t;
    this.refresh();
  }

  refresh(): void {
    const s = this.state;
    this.coinCount.textContent = String(Math.floor(s.coins));
    const day = Math.floor(s.ageHours / 24) + 1;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    this.clock.textContent = `Day ${day} · ${hh}:${mm}`;
    const flakes = s.inventory.flakes ?? 0;
    setLabel(this.feedBtn, `Feed ×${flakes}`);
    this.feedBtn.disabled = flakes <= 0;
    if (this.tool === "feed" && flakes <= 0) this.tool = null;
    for (const b of this.bar.querySelectorAll("button")) {
      b.classList.toggle("active", this.tool !== null && b.textContent!.trim().toLowerCase().startsWith(this.tool));
    }
    this.lightBtn.hidden = s.equipment.light === 0;
    setLabel(this.lightBtn, s.equipment.lightOn ? "Light: on" : "Light: off");
    this.lightBtn.classList.toggle("lit", s.equipment.lightOn);
  }
}
