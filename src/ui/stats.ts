import type { GameState } from "../sim/state";
import { isCycled } from "../sim/tank";
import { el } from "./dom";

type Level = "ok" | "warn" | "bad";

interface Row {
  label: string;
  unit: string;
  /** Which purchase reveals this reading. */
  gate: "thermometer" | "testKit" | null;
  value(s: GameState): number;
  level(v: number): Level;
  digits: number;
}

const ROWS: Row[] = [
  { label: "Temp", unit: "°C", gate: "thermometer", digits: 1, value: (s) => s.tank.temp, level: (v) => (v >= 22 && v <= 28 ? "ok" : v >= 19 && v <= 30 ? "warn" : "bad") },
  { label: "pH", unit: "", gate: "testKit", digits: 1, value: (s) => s.tank.pH, level: (v) => (v >= 6.5 && v <= 7.8 ? "ok" : v >= 6 && v <= 8.2 ? "warn" : "bad") },
  { label: "Ammonia", unit: "ppm", gate: "testKit", digits: 2, value: (s) => s.tank.nh3, level: (v) => (v < 0.1 ? "ok" : v < 0.5 ? "warn" : "bad") },
  { label: "Nitrite", unit: "ppm", gate: "testKit", digits: 2, value: (s) => s.tank.no2, level: (v) => (v < 0.1 ? "ok" : v < 0.5 ? "warn" : "bad") },
  { label: "Nitrate", unit: "ppm", gate: "testKit", digits: 0, value: (s) => s.tank.no3, level: (v) => (v < 20 ? "ok" : v < 40 ? "warn" : "bad") },
  { label: "Oxygen", unit: "mg/L", gate: "testKit", digits: 1, value: (s) => s.tank.o2, level: (v) => (v > 6 ? "ok" : v > 4 ? "warn" : "bad") },
  { label: "Chlorine", unit: "ppm", gate: "testKit", digits: 2, value: (s) => s.tank.chlorine, level: (v) => (v < 0.05 ? "ok" : v < 0.3 ? "warn" : "bad") },
  { label: "Dirt", unit: "%", gate: null, digits: 0, value: (s) => s.tank.dirt, level: (v) => (v < 30 ? "ok" : v < 60 ? "warn" : "bad") },
  { label: "Algae", unit: "%", gate: null, digits: 0, value: (s) => s.tank.algae, level: (v) => (v < 30 ? "ok" : v < 60 ? "warn" : "bad") },
];

/** Water readings. Gated rows show "?" until the matching kit is owned. */
export class StatsPanel {
  readonly root: HTMLElement;
  private readonly cells = new Map<Row, HTMLElement>();
  private readonly cycle = el("div.stat-row");
  private readonly volume = el("div.muted");

  constructor(overlay: HTMLElement, private readonly state: GameState) {
    this.root = el("div.panel.panel-stats", { hidden: true }, el("h2", {}, "Water"), this.volume);
    for (const r of ROWS) {
      const v = el("span.stat-value");
      this.cells.set(r, v);
      this.root.append(el("div.stat-row", {}, el("span.stat-label", {}, r.label), v));
    }
    this.root.append(this.cycle);
    overlay.append(this.root);
    this.refresh();
  }

  toggle(): void {
    this.root.hidden = !this.root.hidden;
  }

  refresh(): void {
    if (this.root.hidden) return;
    const s = this.state;
    this.volume.textContent = `${s.tank.volumeL} L tank`;
    for (const [r, cell] of this.cells) {
      const known = r.gate === null || s.equipment[r.gate];
      cell.className = "stat-value";
      if (!known) {
        cell.textContent = "?";
        continue;
      }
      const v = r.value(s);
      cell.textContent = `${v.toFixed(r.digits)}${r.unit ? " " + r.unit : ""}`;
      cell.classList.add(r.level(v));
    }
    if (!s.equipment.testKit) {
      this.cycle.textContent = "Buy a test kit to read the water.";
    } else if (isCycled(s)) {
      this.cycle.textContent = "Cycle: established";
    } else {
      const t = s.tank;
      const phase = t.nh3 > 0.25 && t.no2 < 0.25 ? "ammonia stage" : t.no2 > 0.25 ? "nitrite stage" : "starting";
      this.cycle.textContent = `Cycle: ${phase}`;
    }
  }
}
