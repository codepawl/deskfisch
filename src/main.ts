import "@fontsource/pixelify-sans/500.css";
import { PixelBuffer } from "./engine/pixelbuffer";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { SPECIES } from "./data/species";
import { AUTOSAVE_SECONDS } from "./data/constants";
import { moveFish, type Fish } from "./sim/fish";
import { dropPellets, updatePellets } from "./sim/food";
import { newGame, type GameState } from "./sim/state";
import { advance } from "./sim/tick";
import { loadGame, saveGame } from "./save/store";
import { SCREEN_H, SCREEN_W, TankScene, WATER } from "./scenes/tank";
import { Hud } from "./ui/hud";
import { StatsPanel } from "./ui/stats";
import { InspectPanel } from "./ui/inspect";
import { ShopPanel } from "./ui/shop";

const PELLETS_PER_PINCH = 6;

const screen = document.getElementById("screen") as HTMLCanvasElement;
const overlay = document.getElementById("overlay") as HTMLElement;
const buf = new PixelBuffer(SCREEN_W, SCREEN_H);
const input = new Input(screen, SCREEN_W, SCREEN_H);
const scene = new TankScene();

async function boot(): Promise<void> {
  run((await loadGame()) ?? newGame());
}

function run(state: GameState): void {
  // Debug handle: inspect or poke the live state from the devtools console.
  (window as unknown as { fisch: GameState }).fisch = state;
  const hud = new Hud(overlay, state);
  const stats = new StatsPanel(overlay, state);
  const inspect = new InspectPanel(overlay, state, () => hud.refresh());
  const shop = new ShopPanel(overlay, state, WATER, () => hud.refresh());
  hud.addButton("Water", () => stats.toggle());
  hud.addButton("Shop", () => shop.toggle());
  (window as unknown as { fischUi: unknown }).fischUi = { hud, stats, inspect, shop };

  let sinceSave = 0;
  const persist = () => {
    sinceSave = 0;
    void saveGame(state);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) persist();
  });
  window.addEventListener("pagehide", persist);

  const inWater = (x: number, y: number) => x >= WATER.x0 && x < WATER.x1 && y >= WATER.y0 && y < WATER.y1;

  const handleClick = () => {
    if (!inWater(input.x, input.y)) return;
    if (hud.tool === "feed") {
      const flakes = state.inventory.flakes ?? 0;
      if (flakes <= 0) return;
      state.inventory.flakes = flakes - 1;
      dropPellets(state, input.x, PELLETS_PER_PINCH, WATER);
      hud.refresh();
      return;
    }
    inspect.show(fishAt(state.fish, input.x, input.y));
  };

  // Simulation clock: wall-clock driven so hiding the window or sleeping the
  // machine never loses time; long gaps are replayed coarsely.
  const tick = () => {
    const { away } = advance(state);
    if (away) console.info("catch-up", away);
    hud.refresh();
    stats.refresh();
    inspect.refresh();
    shop.refresh();
    if (++sinceSave >= AUTOSAVE_SECONDS) persist();
  };
  tick();
  setInterval(tick, 1000);

  startLoop({
    frame(dt) {
      input.beginFrame();
      if (input.pressed) handleClick();
      scene.update(dt);
      updatePellets(state, WATER, dt);
      for (const f of state.fish) moveFish(f, SPECIES[f.speciesId], WATER, dt, state);
    },
    render() {
      scene.render(buf, state);
      const scale = buf.present(screen);
      overlay.style.setProperty("--s", String(scale));
      overlay.style.width = `${screen.width}px`;
      overlay.style.height = `${screen.height}px`;
    },
  });
}

function fishAt(fish: Fish[], x: number, y: number): Fish | null {
  for (const f of fish) {
    const s = SPECIES[f.speciesId].frames[0];
    if (x >= f.x - 2 && x <= f.x + s.w + 2 && y >= f.y - 2 && y <= f.y + s.h + 2) return f;
  }
  return null;
}

void boot();
