import { PixelBuffer } from "./engine/pixelbuffer";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { SPECIES } from "./data/species";
import { AUTOSAVE_SECONDS } from "./data/constants";
import { moveFish, spawnFish } from "./sim/fish";
import { newGame, type GameState } from "./sim/state";
import { catchUp, simulate } from "./sim/tick";
import { loadGame, saveGame } from "./save/store";
import { SCREEN_H, SCREEN_W, TankScene, WATER } from "./scenes/tank";

const screen = document.getElementById("screen") as HTMLCanvasElement;
const buf = new PixelBuffer(SCREEN_W, SCREEN_H);
const input = new Input(screen, SCREEN_W, SCREEN_H);
const scene = new TankScene();

async function boot(): Promise<void> {
  let state = await loadGame();
  if (!state) {
    state = newGame();
    // Temporary starter stock until the shop exists.
    let id = 1;
    for (const [sp, name] of [["neon", "Neo"], ["neon", "Nia"], ["guppy", "Gus"], ["cory", "Cody"]] as const) {
      state.fish.push(spawnFish(SPECIES[sp], name, WATER, id++));
    }
  }
  const away = catchUp(state);
  if (away) console.info("catch-up", away);
  run(state);
}

function run(state: GameState): void {
  // Debug handle: inspect or poke the live state from the devtools console.
  (window as unknown as { fisch: GameState }).fisch = state;
  let sinceSave = 0;
  const persist = () => {
    sinceSave = 0;
    void saveGame(state);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) persist();
  });
  window.addEventListener("pagehide", persist);

  startLoop({
    frame(dt) {
      input.beginFrame();
      scene.update(dt);
      for (const f of state.fish) moveFish(f, SPECIES[f.speciesId], WATER, dt);
    },
    tick() {
      simulate(state, 1);
      if (++sinceSave >= AUTOSAVE_SECONDS) persist();
    },
    render() {
      scene.render(buf, state.fish);
      buf.present(screen);
    },
  });
}

void boot();
