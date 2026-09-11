import { button, el } from "./dom";

/** Short stacked notices at the bottom of the tank. */
export class Toasts {
  private readonly root = el("div.toasts");

  constructor(overlay: HTMLElement) {
    overlay.append(this.root);
  }

  show(text: string, ms = 5000): void {
    const t = el("div.toast", {}, text);
    this.root.append(t);
    setTimeout(() => t.remove(), ms);
  }

  /** A toast with one action; stays until acted on or dismissed. */
  ask(text: string, actionLabel: string, action: () => void): void {
    const t = el("div.toast.toast-ask", {}, text);
    t.append(
      button("tool", actionLabel, () => {
        t.remove();
        action();
      }),
      button("tool", "Later", () => t.remove()),
    );
    this.root.append(t);
  }
}
