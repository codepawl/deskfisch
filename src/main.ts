import { PixelBuffer } from "./engine/pixelbuffer";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { SPECIES } from "./data/species";
import { moveFish, spawnFish, type Fish } from "./sim/fish";
import { SCREEN_H, SCREEN_W, TankScene, WATER } from "./scenes/tank";

const screen = document.getElementById("screen") as HTMLCanvasElement;
const buf = new PixelBuffer(SCREEN_W, SCREEN_H);
const input = new Input(screen, SCREEN_W, SCREEN_H);
const scene = new TankScene();

const fish: Fish[] = [
  spawnFish(SPECIES.neon, "Neo", WATER),
  spawnFish(SPECIES.neon, "Nia", WATER),
  spawnFish(SPECIES.guppy, "Gus", WATER),
  spawnFish(SPECIES.cory, "Cody", WATER),
];

startLoop({
  frame(dt) {
    input.beginFrame();
    scene.update(dt);
    for (const f of fish) moveFish(f, SPECIES[f.speciesId], WATER, dt);
  },
  tick() {},
  render() {
    scene.render(buf, fish);
    buf.present(screen);
  },
});
