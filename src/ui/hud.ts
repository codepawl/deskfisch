import type { GameState } from "../sim/state";
import { button, el, setLabel } from "./dom";
import { icon, type IconName } from "./icons";
import { t } from "../i18n";

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
    this.feedBtn = button("tool", t("Feed"), () => this.toggleTool("feed"), "feed");
    this.lightBtn = button("tool", t("Light"), () => {
      state.equipment.lightOn = !state.equipment.lightOn;
      this.refresh();
    }, "light");
    const scrubBtn = button("tool", t("Scrub"), () => this.toggleTool("scrub"), "scrub");
    const vacuumBtn = button("tool", t("Vacuum"), () => this.toggleTool("vacuum"), "vacuum");
    this.feedBtn.dataset.tool = "feed";
    scrubBtn.dataset.tool = "scrub";
    vacuumBtn.dataset.tool = "vacuum";
    this.bar.append(this.feedBtn, scrubBtn, vacuumBtn, this.lightBtn);
    // Labels follow the last hovered button, not :hover, so crossing the gap
    // between two buttons hands the label over instead of collapsing it.
    this.bar.addEventListener("pointerover", (e) => {
      const b = (e.target as HTMLElement).closest("button");
      if (!b) return;
      for (const o of this.bar.querySelectorAll("button.hover")) o.classList.remove("hover");
      b.classList.add("hover");
    });
    const clearHover = () => {
      for (const o of this.bar.querySelectorAll("button.hover")) o.classList.remove("hover");
    };
    this.bar.addEventListener("pointerleave", clearHover);
    // Once a button is chosen the label has done its job.
    this.bar.addEventListener("click", clearHover);
    // pointerleave is skipped when the cursor flies out of a small window, so
    // also clear whenever the pointer is seen anywhere else or the window loses it.
    document.addEventListener("pointermove", (e) => {
      if (!(e.target as HTMLElement).closest?.(".toolbar")) clearHover();
    });
    document.addEventListener("pointerout", (e) => {
      if (e.relatedTarget === null) clearHover();
    });
    window.addEventListener("blur", clearHover);
    this.dragHandle = el("div.hud-top", {}, this.coins, el("span.grip", {}, t("⋮⋮ drag ⋮⋮")), this.clock);
    this.restore = button("hud-restore", t("Show controls"), () => {}, "settings");
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
    const h = now.getHours();
    const sky = h >= 21 || h < 6 ? "☾" : h >= 17 || h < 8 ? "☁" : "☀";
    this.clock.textContent = t("Day {day} · {sky} {time}", { day, sky, time: `${hh}:${mm}` });
    const flakes = s.inventory.flakes ?? 0;
    setLabel(this.feedBtn, t("Feed ×{n}", { n: flakes }));
    this.feedBtn.disabled = flakes <= 0;
    if (this.tool === "feed" && flakes <= 0) this.tool = null;
    for (const b of this.bar.querySelectorAll("button")) {
      b.classList.toggle("active", this.tool !== null && b.dataset.tool === this.tool);
    }
    const hasLight = s.equipment.light > 0;
    this.lightBtn.disabled = !hasLight;
    setLabel(this.lightBtn, !hasLight ? t("No light yet (Shop → Gear)") : s.equipment.lightOn ? t("Light: on") : t("Light: off"));
    this.lightBtn.classList.toggle("lit", s.equipment.lightOn);
  }
}
