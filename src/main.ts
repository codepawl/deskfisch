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
import { BAG_H, BAG_W, BAG_Y, SCREEN_H, SCREEN_W, TankScene, WATER, type DragBag } from "./scenes/tank";
import { releaseBag, type Bag } from "./sim/bag";
import { BagPanel } from "./ui/bag";
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
  const bagPanel = new BagPanel(overlay, state);
  hud.addButton("Water", () => stats.toggle());
  hud.addButton("Shop", () => shop.toggle());
  (window as unknown as { fischUi: unknown }).fischUi = { hud, stats, inspect, shop, bagPanel };

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
  let drag: DragBag | null = null;

  const handleClick = () => {
    const { pressX: x, pressY: y } = input;
    const bag = bagAt(state.bags, x, y);
    if (bag) {
      drag = { bag, x: bag.x, y: BAG_Y };
      bagPanel.show(bag);
      inspect.show(null);
      return;
    }
    if (!inWater(x, y)) return;
    if (hud.tool === "feed") {
      const flakes = state.inventory.flakes ?? 0;
      if (flakes <= 0) return;
      state.inventory.flakes = flakes - 1;
      dropPellets(state, x, PELLETS_PER_PINCH, WATER);
      hud.refresh();
      return;
    }
    inspect.show(fishAt(state.fish, x, y));
    bagPanel.show(null);
  };

  const handleRelease = () => {
    if (!drag) return;
    // Let go well below the surface to release the fish; otherwise the bag floats back.
    if (drag.y + BAG_H / 2 > WATER.y0 + 24) {
      releaseBag(state, drag.bag, drag.x + BAG_W / 2, drag.y + BAG_H / 2, WATER);
      bagPanel.show(null);
      hud.refresh();
    }
    drag = null;
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
    bagPanel.refresh();
    if (++sinceSave >= AUTOSAVE_SECONDS) persist();
  };
  tick();
  setInterval(tick, 1000);

  startLoop({
    frame(dt) {
      input.beginFrame();
      if (input.pressed) handleClick();
      if (drag) {
        drag.x = input.x - BAG_W / 2;
        drag.y = input.y - BAG_H / 2;
      }
      if (input.released) handleRelease();
      scene.update(dt);
      updatePellets(state, WATER, dt);
      for (const f of state.fish) moveFish(f, SPECIES[f.speciesId], WATER, dt, state);
    },
    render() {
      scene.render(buf, state, drag);
      const scale = buf.present(screen);
      overlay.style.setProperty("--s", String(scale));
      overlay.style.width = `${screen.width}px`;
      overlay.style.height = `${screen.height}px`;
    },
  });
}

function bagAt(bags: Bag[], x: number, y: number): Bag | null {
  return bags.find((b) => x >= b.x && x < b.x + BAG_W && y >= BAG_Y && y < BAG_Y + BAG_H) ?? null;
}

function fishAt(fish: Fish[], x: number, y: number): Fish | null {
  for (const f of fish) {
    const s = SPECIES[f.speciesId].frames[0];
    if (x >= f.x - 2 && x <= f.x + s.w + 2 && y >= f.y - 2 && y <= f.y + s.h + 2) return f;
  }
  return null;
}

void boot();
