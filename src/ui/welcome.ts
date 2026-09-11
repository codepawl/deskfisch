import type { GameState } from "../sim/state";
import { setPlaystyle } from "../sim/shop";
import type { Playstyle } from "../sim/rules";
import { button, el } from "./dom";
import { t } from "../i18n";

/** Short, honest descriptions. Shown on first run and inside Settings. */
export const PLAYSTYLES: { id: Playstyle; title: string; blurb: string }[] = [
  { id: "zen", title: "Zen", blurb: "Nothing dies, nothing gets sick. Fish still get grumpy when neglected. Just vibes." },
  { id: "normal", title: "Normal", blurb: "Real fishkeeping. Cycle the tank, watch the water, fish can fall ill and die." },
  { id: "hardcore", title: "Hardcore", blurb: "Illness twice as likely, stress hurts more, prices up, fewer coins to start." },
  { id: "sandbox", title: "Sandbox", blurb: "Unlimited coins, no risk. Build the tank you want and watch it." },
];

/** First-run question: how do you want to play? Answered once, changeable in Settings. */
export class WelcomePanel {
  readonly root: HTMLElement;

  constructor(overlay: HTMLElement, private readonly state: GameState, private readonly onDone: () => void) {
    const cards = PLAYSTYLES.map((p) =>
      el("button.playstyle", { onclick: () => this.pick(p.id) },
        el("div.playstyle-title", {}, t(p.title)),
        el("div.muted", {}, t(p.blurb))),
    );
    this.root = el(
      "div.panel.panel-guide.panel-welcome",
      { hidden: state.onboarded },
      el("h2", {}, t("Welcome to Deskfisch")),
      el("div.muted.welcome-lead", {}, t("How do you want to keep fish? You can change this later in Settings.")),
      el("div.playstyles", {}, ...cards),
    );
    overlay.append(this.root);
  }

  private pick(style: Playstyle): void {
    setPlaystyle(this.state, style);
    this.state.onboarded = true;
    this.root.hidden = true;
    this.onDone();
  }
}

/** Row of style buttons for Settings. `render` re-marks the active one (the welcome panel may change it). */
export function playstyleButtons(state: GameState, onChange: () => void): { root: HTMLElement; render: () => void } {
  const wrap = el("div.playstyles.compact");
  const render = () => {
    wrap.replaceChildren(...PLAYSTYLES.map((p) =>
      button(state.playstyle === p.id ? "tool active" : "tool", t(p.title), () => {
        setPlaystyle(state, p.id);
        render();
        onChange();
      }),
    ));
  };
  render();
  return { root: wrap, render };
}
