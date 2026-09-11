import "@fontsource/pixelify-sans/500.css";
import "@fontsource/vt323/400.css";
import { PixelBuffer } from "./engine/pixelbuffer";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { SPECIES } from "./data/species";
import { AUTOSAVE_SECONDS } from "./data/constants";
import { moveFish, type Fish } from "./sim/fish";
import { dropPellets, updatePellets } from "./sim/food";
import { newGame, type GameState } from "./sim/state";
import { advance, SIM_WATER } from "./sim/tick";
import { loadGame, saveGame } from "./save/store";
import { BAG_H, BAG_W, BAG_Y, SAND_Y, SCREEN_H, SCREEN_W, TankScene, WATER, type DragBag } from "./scenes/tank";
import { scrubGlass, vacuumGravel } from "./sim/tank";
import { CarePanel } from "./ui/care";
import { Toasts } from "./ui/toast";
import { SettingsPanel } from "./ui/settings";
import { GuidePanel } from "./ui/guide";
import { setLabel } from "./ui/dom";
import { isCycled } from "./sim/tank";
import { Sfx } from "./engine/audio";
import { checkAchievements } from "./sim/achievements";
import { applyMode, isTauri, onModeRequest, setPinned, startWindowDrag, startWindowResize, type Mode } from "./platform";
import { releaseBag, releaseShock, type Bag } from "./sim/bag";
import type { Decor } from "./sim/state";
import { DECOR_SPRITES } from "./scenes/tank";
import { BagPanel } from "./ui/bag";
import { Hud } from "./ui/hud";
import { StatsPanel } from "./ui/stats";
import { InspectPanel } from "./ui/inspect";
import { ShopPanel } from "./ui/shop";

const PELLETS_PER_PINCH = 6;
/** Percentage points of algae/dirt removed per second of dragging. */
const SCRUB_RATE = 40;
const VACUUM_RATE = 30;
/** The siphon reaches this far above the substrate. */
const VACUUM_REACH = 16;

const screen = document.getElementById("screen") as HTMLCanvasElement;
const overlay = document.getElementById("overlay") as HTMLElement;
const buf = new PixelBuffer(SCREEN_W, SCREEN_H);
const input = new Input(screen, SCREEN_W, SCREEN_H);
const scene = new TankScene();
const sfx = new Sfx();
/** Seconds between scrub sounds while the sponge is held. */
const SCRUB_SOUND_INTERVAL = 0.12;

async function boot(): Promise<void> {
  run((await loadGame()) ?? newGame());
}

function run(state: GameState): void {
  Object.assign(SIM_WATER, WATER);
  // Debug handle: inspect or poke the live state from the devtools console.
  (window as unknown as { fisch: GameState }).fisch = state;
  const hud = new Hud(overlay, state);
  const stats = new StatsPanel(overlay, state);
  const inspect = new InspectPanel(overlay, state, () => hud.refresh());
  const shop = new ShopPanel(overlay, state, WATER, () => hud.refresh());
  const bagPanel = new BagPanel(overlay, state);
  const care = new CarePanel(overlay, state, () => hud.refresh());
  const toasts = new Toasts(overlay);
  const applySettings = () => {
    const st = state.settings;
    sfx.setVolume(st.volume, st.muted);
    void applyMode(state.mode, state.pinned, st.transparent);
  };
  const settings = new SettingsPanel(overlay, state, applySettings);
  const guide = new GuidePanel(overlay, state);
  hud.addButton("Change water", () => care.toggle(), "water");
  hud.addButton("Test water", () => stats.toggle(), "test");
  hud.addButton("Shop", () => shop.toggle(), "coin");

  const MODES: Mode[] = ["window", "pet", "fullscreen"];
  const modeBtn = hud.addButton("", () => setMode(MODES[(MODES.indexOf(state.mode) + 1) % MODES.length]), "mode");
  const setMode = (mode: Mode) => {
    state.mode = mode;
    setLabel(modeBtn, `Mode: ${mode}`);
    void applyMode(mode, state.pinned, state.settings.transparent);
  };
  sfx.setVolume(state.settings.volume, state.settings.muted);
  setMode(state.mode);
  void onModeRequest(setMode);
  if (isTauri) {
    const pinBtn = hud.addButton("", () => {
      state.pinned = !state.pinned;
      setLabel(pinBtn, state.pinned ? "Unpin" : "Pin");
      reflectPin();
      void setPinned(state.pinned, state.mode);
    }, "pin");
    setLabel(pinBtn, state.pinned ? "Unpin" : "Pin");
  }
  hud.addButton("Guide", () => guide.toggle(), "guide");
  hud.addButton("Settings", () => settings.toggle(), "settings");
  hud.resizeHandle.addEventListener("pointerdown", () => {
    if (state.mode === "pet" && !state.pinned) void startWindowResize();
  });

  // Chill: hide every control and leave the tank. "⋯" or Escape brings them back.
  const setChill = (on: boolean) => {
    state.settings.chill = on;
    document.documentElement.dataset.chill = String(on);
    if (on) toasts.show("Chill mode. Double-click the tank, press Esc, or tap the corner button to bring the controls back.", 6000);
  };
  screen.addEventListener("dblclick", () => setChill(false));
  hud.addButton("Chill", () => setChill(true), "chill");
  hud.restore.onclick = () => setChill(false);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setChill(false);
  });
  setChill(state.settings.chill);
  // Pinned means fixed to the screen: on top of other windows and not movable.
  const reflectPin = () => (document.documentElement.dataset.pinned = String(state.pinned));
  reflectPin();
  hud.dragHandle.addEventListener("pointerdown", () => {
    if (state.mode !== "pet") return;
    if (state.pinned) toasts.show("Unpin to move the tank.", 2500);
    else void startWindowDrag();
  });

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
  /** A decoration being slid along the substrate. */
  let decorDrag: { item: Decor; grabX: number } | null = null;

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
    if (!hud.tool && y >= SAND_Y - 14) {
      const item = decorAt(state.decor, x, y);
      if (item) {
        decorDrag = { item, grabX: x - item.x };
        return;
      }
    }
    if (hud.tool === "feed") {
      const flakes = state.inventory.flakes ?? 0;
      if (flakes <= 0) return;
      state.inventory.flakes = flakes - 1;
      dropPellets(state, x, PELLETS_PER_PINCH, WATER);
      scene.splash(x);
      sfx.splash();
      hud.refresh();
      return;
    }
    // Scrub and vacuum act while held; a press must not open a fish card.
    if (hud.tool) return;
    inspect.show(fishAt(state.fish, x, y));
    bagPanel.show(null);
  };

  const handleRelease = () => {
    if (!drag) return;
    // Let go well below the surface to release the fish; otherwise the bag floats back.
    if (drag.y + BAG_H / 2 > WATER.y0 + 24) {
      const shock = releaseShock(state, drag.bag);
      const f = releaseBag(state, drag.bag, drag.x + BAG_W / 2, drag.y + BAG_H / 2, WATER);
      toasts.show(shock > 15 ? `${f.name} is shocked. Float longer and mix more water next time.` : `${f.name} settled in nicely.`);
      if (!isCycled(state)) toasts.show("The tank is not cycled yet. Watch ammonia and change water if it climbs.", 8000);
      bagPanel.show(null);
      hud.refresh();
    }
    drag = null;
  };

  // Simulation clock: wall-clock driven so hiding the window or sleeping the
  // machine never loses time; long gaps are replayed coarsely.
  const tick = () => {
    const { away, died, born, sick } = advance(state);
    if (away) {
      const h = away.hours >= 1 ? `${away.hours.toFixed(1)} h` : `${Math.round(away.hours * 60)} min`;
      toasts.show(`Away ${h}${away.capped ? " (capped)" : ""}: +${Math.floor(away.coinsEarned)} coins`, 8000);
    }
    for (const name of died) toasts.show(`${name} died. Scoop it out before it fouls the water.`, 8000);
    for (const msg of born) toasts.show(msg, 8000);
    for (const msg of sick) toasts.show(`${msg}. Check the fish card.`, 8000);
    for (const a of checkAchievements(state)) toasts.show(`${a.title}: +${a.reward} coins`, 8000);
    hud.refresh();
    stats.refresh();
    inspect.refresh();
    shop.refresh();
    bagPanel.refresh();
    care.refresh();
    guide.refresh();
    if (++sinceSave >= AUTOSAVE_SECONDS) persist();
  };
  tick();
  setInterval(tick, 1000);

  let scrubSoundIn = 0;
  let vacuumHintShown = false;
  startLoop({
    maxFps: () => state.settings.maxFps,
    frame(dt) {
      input.beginFrame();
      if (input.pressed) handleClick();
      if (drag) {
        drag.x = input.x - BAG_W / 2;
        drag.y = input.y - BAG_H / 2;
      }
      if (decorDrag) {
        const w = DECOR_SPRITES[decorDrag.item.kind]?.w ?? 8;
        decorDrag.item.x = Math.round(Math.max(WATER.x0, Math.min(WATER.x1 - w, input.x - decorDrag.grabX)));
        if (input.released) decorDrag = null;
      }
      if (input.released) handleRelease();
      scene.update(dt, state.settings.quality);
      const working = input.down && !drag && inWater(input.x, input.y);
      if (working && hud.tool === "scrub") {
        scrubGlass(state, SCRUB_RATE * dt);
        scene.foam(input.x, input.y);
        scrubSoundIn -= dt;
        if (scrubSoundIn <= 0) {
          sfx.scrub();
          scrubSoundIn = SCRUB_SOUND_INTERVAL;
        }
      }
      const vacuuming = working && hud.tool === "vacuum";
      if (vacuuming) {
        scene.suck(input.x, input.y + 3);
        if (input.y >= SAND_Y - VACUUM_REACH) {
          vacuumGravel(state, VACUUM_RATE * dt);
        } else if (!vacuumHintShown) {
          vacuumHintShown = true;
          toasts.show("The siphon only lifts dirt from the gravel. Drag it along the bottom.", 5000);
        }
      }
      sfx.vacuum(vacuuming);
      const eq = state.equipment;
      sfx.ambient(state.settings.ambient && !state.settings.muted && (eq.filter > 0 || eq.airPump > 0), eq.airPump > 0);
      updatePellets(state, WATER, dt);
      const lure = hud.tool === "feed" && input.inside && inWater(input.x, input.y) ? { x: input.x } : null;
      for (const f of state.fish) moveFish(f, SPECIES[f.speciesId], WATER, dt, state, lure);
    },
    render() {
      const showCursor = hud.tool && hud.tool !== "feed" && input.inside && inWater(input.x, input.y);
      const cursor = showCursor ? { tool: hud.tool!, x: input.x, y: input.y } : null;
      scene.render(buf, state, drag, cursor, state.mode === "pet" && state.settings.transparent, state.settings.quality);
      const scale = buf.present(screen);
      overlay.style.setProperty("--s", String(scale));
      overlay.style.width = screen.style.width;
      overlay.style.height = screen.style.height;
    },
  });
}

function decorAt(decor: Decor[], x: number, y: number): Decor | null {
  for (const d of decor) {
    const s = DECOR_SPRITES[d.kind];
    if (s && x >= d.x && x < d.x + s.w && y >= SAND_Y + 1 - s.h) return d;
  }
  return null;
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
