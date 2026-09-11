import type { GameState, Quality } from "../sim/state";
import { autostart, isTauri } from "../platform";
import { checkForUpdate } from "../updater";
import { exportSave, pickSaveFile, KEEP } from "../save/backup";
import { normalise, saveGame } from "../save/store";
import { button, el } from "./dom";
import { LANGS, t, type Lang } from "../i18n";

/** User preferences. `onChange` lets the app re-apply audio, window and render settings. */
export class SettingsPanel {
  readonly root: HTMLElement;
  private readonly speedWarn = el("div.shop-note");

  constructor(
    overlay: HTMLElement,
    private readonly state: GameState,
    private readonly onChange: () => void,
    private readonly offerUpdate: (version: string, install: () => Promise<void>) => void,
    /** Language changed: the caller saves and reloads so every panel is rebuilt. */
    private readonly onLanguage: () => void,
  ) {
    const s = state.settings;
    const rows = el("div.settings-rows");
    rows.append(
      this.row(t("Language"), this.select(["auto", "en", "vi"], s.lang, (v) => {
        s.lang = v as typeof s.lang;
        this.onLanguage();
      }, (v) => (v === "auto" ? t("System") : LANGS[v as Lang]))),
      this.row(t("See-through pet window"), this.checkbox(s.transparent, (v) => (s.transparent = v))),
      this.row(t("Sound"), this.checkbox(!s.muted, (v) => (s.muted = !v))),
      this.row(t("Ambient hum"), this.checkbox(s.ambient, (v) => (s.ambient = v))),
      this.row(t("Volume"), this.range(s.volume, (v) => (s.volume = v))),
      this.row(t("Sim speed"), this.select(["1", "2", "5", "10"], String(s.simSpeed), (v) => {
        s.simSpeed = Number(v);
        this.refresh();
      }, (v) => `${v}×`)),
      this.speedWarn,
      this.row(t("Visuals"), this.select(["high", "medium", "low"], s.quality, (v) => (s.quality = v as Quality), (v) => t(v))),
      this.row(t("Max FPS"), this.select(["60", "30", "15"], String(s.maxFps), (v) => (s.maxFps = Number(v)))),
    );
    // Desktop only: the OS owns this flag, so read it rather than the save.
    void autostart().then((on) => {
      if (on === null) return;
      rows.append(this.row(t("Start with the system"), this.checkbox(on, (v) => void autostart(v))));
    });
    const saveNote = el("span.muted", {}, "");
    rows.append(
      this.row(t("Save file"), el("span.panel-actions", {},
        button("tool", t("Export"), async () => {
          saveNote.textContent = (await exportSave(this.state)) ? t("Exported") : "";
        }),
        button("tool", t("Import"), async () => {
          const raw = await pickSaveFile().catch(() => null);
          const loaded = raw === null ? null : normalise(raw);
          if (!loaded) {
            if (raw !== null) saveNote.textContent = t("That file is not a Deskfisch save.");
            return;
          }
          if (!confirm(t("Replace the current tank with this save? A backup of the current one is kept."))) return;
          await saveGame(loaded);
          location.reload();
        }),
      )),
      el("div.muted", {}, t("The last {n} saves are backed up automatically before each launch.", { n: KEEP })),
    );
    if (isTauri) {
      const status = el("span.muted", {}, "");
      const btn = button("tool", t("Check for updates"), async () => {
        status.textContent = t("Checking…");
        const u = await checkForUpdate();
        status.textContent = u ? t("{v} available", { v: u.version }) : t("Up to date");
        if (u) this.offerUpdate(u.version, u.install);
      });
      rows.append(this.row(t("Updates"), el("span.panel-actions", {}, status, btn)));
    }
    this.root = el(
      "div.panel.panel-settings",
      { hidden: true },
      el("h2", {}, t("Settings")),
      rows,
      el("div.panel-actions", {}, button("tool", t("Close"), () => this.toggle())),
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
      ? t("{n}× runs {n} game seconds per real second: fish age and the tank cycles faster, and higher speeds cost more CPU. Offline catch-up stays at 1×.", { n: speed })
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
