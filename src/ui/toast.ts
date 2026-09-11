import { el } from "./dom";

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
}
