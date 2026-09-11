import type { GameState, Quality } from "../sim/state";
import { autostart } from "../platform";
import { button, el } from "./dom";

/** User preferences. `onChange` lets the app re-apply audio, window and render settings. */
export class SettingsPanel {
  readonly root: HTMLElement;
  private readonly speedWarn = el("div.shop-note");

  constructor(overlay: HTMLElement, private readonly state: GameState, private readonly onChange: () => void) {
    const s = state.settings;
    const rows = el("div.settings-rows");
    rows.append(
      this.row("See-through pet window", this.checkbox(s.transparent, (v) => (s.transparent = v))),
      this.row("Sound", this.checkbox(!s.muted, (v) => (s.muted = !v))),
      this.row("Volume", this.range(s.volume, (v) => (s.volume = v))),
      this.row("Sim speed", this.select(["1", "2", "5", "10"], String(s.simSpeed), (v) => {
        s.simSpeed = Number(v);
        this.refresh();
      }, (v) => `${v}×`)),
      this.speedWarn,
      this.row("Visuals", this.select(["high", "medium", "low"], s.quality, (v) => (s.quality = v as Quality))),
      this.row("Max FPS", this.select(["60", "30", "15"], String(s.maxFps), (v) => (s.maxFps = Number(v)))),
    );
    // Desktop only: the OS owns this flag, so read it rather than the save.
    void autostart().then((on) => {
      if (on === null) return;
      rows.append(this.row("Start with the system", this.checkbox(on, (v) => void autostart(v))));
    });
    this.root = el(
      "div.panel.panel-settings",
      { hidden: true },
      el("h2", {}, "Settings"),
      rows,
      el("div.panel-actions", {}, button("tool", "Close", () => this.toggle())),
    );
    overlay.append(this.root);
    this.refresh();
  }

  toggle(): void {
    this.root.hidden = !this.root.hidden;
  }

  private refresh(): void {
    const speed = this.state.settings.simSpeed;
    this.speedWarn.textContent = speed > 1
      ? `${speed}× runs ${speed} game seconds per real second: fish age and the tank cycles faster, and higher speeds cost more CPU. Offline catch-up stays at 1×.`
      : "";
  }

  private row(label: string, control: HTMLElement): HTMLElement {
    return el("label.settings-row", {}, el("span", {}, label), control);
  }

  private checkbox(checked: boolean, set: (v: boolean) => void): HTMLElement {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.onchange = () => {
      set(input.checked);
      this.onChange();
    };
    return input;
  }

  private range(value: number, set: (v: number) => void): HTMLElement {
    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "1";
    input.step = "0.05";
    input.value = String(value);
    input.oninput = () => {
      set(Number(input.value));
      this.onChange();
    };
    return input;
  }

  private select(options: string[], value: string, set: (v: string) => void, label = (v: string) => v): HTMLElement {
    const sel = document.createElement("select");
    for (const o of options) {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = label(o);
      opt.selected = o === value;
      sel.append(opt);
    }
    sel.onchange = () => {
      set(sel.value);
      this.onChange();
    };
    return sel;
  }
}
