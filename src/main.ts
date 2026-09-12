import "@fontsource/vt323/400.css";
import { PixelBuffer } from "./engine/pixelbuffer";
import { Input } from "./engine/input";
import { startLoop } from "./engine/loop";
import { SPECIES } from "./data/species";
import { AUTOSAVE_SECONDS } from "./data/constants";
import { isCurious, moveFish, releaseFish, startle, type Fish, type Poke, type Threat } from "./sim/fish";
import { dropPellets, leftovers, updatePellets } from "./sim/food";
import { demoGame, newGame, type GameState } from "./sim/state";
import { spawnFish } from "./sim/fish";
import { newSand } from "./sim/sand";
import { advance, SIM_WATER } from "./sim/tick";
import { loadGame, saveGame } from "./save/store";
import { BAG_H, BAG_W, bagY, GLASS_TOP, sandTop, SCREEN_H, SCREEN_W, setFillLevel, TankScene, WATER, type DragBag } from "./scenes/tank";
import { scrapeAt, vacuumAt } from "./sim/grime";
import { CarePanel } from "./ui/care";
import { Toasts } from "./ui/toast";
import { SettingsPanel } from "./ui/settings";
import { GuidePanel } from "./ui/guide";
import { WelcomePanel } from "./ui/welcome";
import { checkForUpdate } from "./updater";
import { detectLang, setLang, t } from "./i18n";
import { setLabel } from "./ui/dom";
import { isCycled } from "./sim/tank";
import { Sfx } from "./engine/audio";
import { Music } from "./engine/music";
import { ambientNow } from "./sim/clock";
import { checkAchievements } from "./sim/achievements";
import { applyMode, isMobile, isMobileShell, isTauri, onModeRequest, setPinned, startWindowDrag, startWindowResize, windowVelocity, type Mode } from "./platform";
import { Viewport } from "./engine/viewport";
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
/** Scraper and siphon reach, in tank pixels. */
const SCRUB_REACH = 9;
/** The siphon reaches this far above the substrate. */
const VACUUM_REACH = 16;

const screen = document.getElementById("screen") as HTMLCanvasElement;
const overlay = document.getElementById("overlay") as HTMLElement;
const tankview = document.getElementById("tankview") as HTMLElement;
// Phones and tablets get their own layout: tank on top, big labelled buttons below.
// (The site's hero iframe is a desktop-sized tank even on a phone.)
document.documentElement.dataset.layout = isMobile && window.self === window.top ? "mobile" : "desktop";
const buf = new PixelBuffer(SCREEN_W, SCREEN_H);
const input = new Input(screen, SCREEN_W, SCREEN_H);
// The glass with its frame: the framebuffer's HUD margins are not worth screen space on a phone.
const viewport = document.documentElement.dataset.layout === "mobile" ? new Viewport(tankview, screen, input, { x: WATER.x0 - 3, y: GLASS_TOP - 3, w: WATER.x1 - WATER.x0 + 6, h: WATER.y1 - GLASS_TOP + 6 }) : null;
const scene = new TankScene();
const sfx = new Sfx();
const music = new Music();
/** Seconds between scrub sounds while the sponge is held. */
const SCRUB_SOUND_INTERVAL = 0.12;
/** `?stress=1`: uncapped frame rate and 30× sim so leaks show up in minutes (scripts/stress.mjs). */
const STRESS = new URLSearchParams(location.search).get("stress") === "1";

async function boot(): Promise<void> {
  const embedded = window.self !== window.top;
  const shot = new URLSearchParams(location.search).get("scene");
  let state = shot ? sceneState(shot) : await loadGame();
  if (!state) {
    state = embedded ? demoGame() : newGame();
    if (embedded) {
      // Website hero: a lively tank on first sight.
      const stock: [string, string][] = [["neon", "Neo"], ["neon", "Nia"], ["neon", "Nix"], ["neon", "Nam"], ["neon", "Nub"], ["neon", "Nox"], ["guppy", "Gus"], ["guppy", "Gia"], ["cory", "Cody"], ["cory", "Cleo"], ["angel", "Ari"]];
      for (const [sp, name] of stock) state.fish.push(spawnFish(SPECIES[sp], name, WATER, state.nextFishId++));
      for (const f of state.fish) f.size = 1;
      // The demo tank already earned everything; no toast parade on load.
      checkAchievements(state);
    }
  }
  // Embedded on the website: skip the onboarding card so the hero shows the tank.
  if (embedded || (shot && shot !== "welcome")) state.guideSeen = state.onboarded = true;
  if (shot) document.documentElement.dataset.shot = shot;
  if (STRESS) {
    state.inventory.flakes = 9999;
    state.settings.clock = "sim";
    state.settings.simSpeed = 30;
    state.settings.muted = true;
  }
  setLang(state.settings.lang === "auto" ? detectLang() : state.settings.lang);
  run(state);
}

function run(state: GameState): void {
  setFillLevel(state.tank.fill);
  WATER.floor = (x) => sandTop(state.tank.sand, x);
  Object.assign(SIM_WATER, WATER);
  // Debug handle: inspect or poke the live state from the devtools console.
  (window as unknown as { fisch: GameState }).fisch = state;
  (window as unknown as { fischScene: TankScene }).fischScene = scene;
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
    music.setVolume(st.volume, st.muted);
    void applyMode(state.mode, state.pinned, st.transparent);
  };
  const offerUpdate = (version: string, install: () => Promise<void>) =>
    toasts.ask(t("Deskfisch {v} is available.", { v: version }), t("Update and restart"), () => {
      persist();
      toasts.show(t("Downloading update…"), 60000);
      install().catch((e) => toasts.show(t("Update failed: {e}", { e: String(e) }), 8000));
    });
  const settings = new SettingsPanel(overlay, state, applySettings, offerUpdate, () => {
    void saveGame(state).then(() => location.reload());
  });
  // Quiet startup check; a failed or offline check is simply silent.
  setTimeout(() => void checkForUpdate().then((u) => u && offerUpdate(u.version, u.install)), 15000);
  const guide = new GuidePanel(overlay, state);
  // First run: ask how they want to play, then show the checklist.
  if (!state.onboarded) guide.root.hidden = true;
  new WelcomePanel(overlay, state, () => {
    hud.refresh();
    if (!state.guideSeen) guide.toggle();
  });
  hud.divider();
  hud.addButton(t("Change water"), () => care.toggle(), "water");
  hud.addButton(t("Test water"), () => stats.toggle(), "test");
  hud.addButton(t("Shop"), () => shop.toggle(), "coin");

  const MODES: Mode[] = ["window", "pet", "fullscreen"];
  hud.divider();
  // Window modes are a desktop thing; a phone has one screen and no tray.
  const modeBtn = viewport ? null : hud.addButton("", () => setMode(MODES[(MODES.indexOf(state.mode) + 1) % MODES.length]), "mode");
  const setMode = (mode: Mode) => {
    state.mode = viewport ? "window" : mode;
    if (modeBtn) setLabel(modeBtn, t("Mode: {mode}", { mode: t(mode) }));
    void applyMode(state.mode, state.pinned, state.settings.transparent);
  };
  sfx.setVolume(state.settings.volume, state.settings.muted);
  music.setVolume(state.settings.volume, state.settings.muted);
  setMode(state.mode);
  void onModeRequest(setMode);
  if (isTauri && !isMobileShell) {
    const pinBtn = hud.addButton("", () => {
      state.pinned = !state.pinned;
      setLabel(pinBtn, state.pinned ? t("Unpin") : t("Pin"));
      reflectPin();
      void setPinned(state.pinned, state.mode);
    }, "pin");
    setLabel(pinBtn, state.pinned ? t("Unpin") : t("Pin"));
  }
  hud.addButton(t("Guide"), () => guide.toggle(), "guide");
  hud.addButton(t("Settings"), () => settings.toggle(), "settings");
  hud.resizeHandle.addEventListener("pointerdown", () => {
    if (state.mode === "pet" && !state.pinned) void startWindowResize();
  });

  // Chill: hide every control and leave the tank. "⋯" or Escape brings them back.
  const setChill = (on: boolean) => {
    state.settings.chill = on;
    document.documentElement.dataset.chill = String(on);
    if (on) toasts.show(t("Chill mode. Double-click the tank, press Esc, or tap the corner button to bring the controls back."), 6000);
  };
  screen.addEventListener("dblclick", () => setChill(false));
  hud.addButton(t("Chill"), () => setChill(true), "chill");
  hud.restore.onclick = () => setChill(false);
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    setChill(false);
    for (const p of overlay.querySelectorAll<HTMLElement>(".panel:not(.panel-welcome)")) p.hidden = true;
  });
  setChill(state.settings.chill);
  // Pinned means fixed to the screen: on top of other windows and not movable.
  const reflectPin = () => (document.documentElement.dataset.pinned = String(state.pinned));
  reflectPin();
  hud.dragHandle.addEventListener("pointerdown", () => {
    if (state.mode !== "pet") return;
    if (state.pinned) toasts.show(t("Unpin to move the tank."), 2500);
    else void startWindowDrag();
  });

  let sinceSave = 0;
  const persist = () => {
    sinceSave = 0;
    if (document.documentElement.dataset.shot) return; // screenshot scenes are never saved
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
  // A fish in hand: where it was grabbed and the hand's recent velocity.
  let fishDrag: { f: Fish; grabX: number; grabY: number; moved: boolean; vx: number; vy: number } | null = null;

  const handleClick = () => {
    const { pressX: x, pressY: y } = input;
    const bag = bagAt(state.bags, x, y);
    if (bag) {
      drag = { bag, x: bag.x, y: bagY() };
      bagPanel.show(bag);
      inspect.show(null);
      return;
    }
    // Feeding works from above the water too: flakes land on the surface and float.
    const overWater = hud.tool === "feed" && x >= WATER.x0 && x < WATER.x1 && y >= GLASS_TOP && y < WATER.y0;
    if (!inWater(x, y) && !overWater) return;
    if (!hud.tool && y >= sandTop(state.tank.sand, x) - 14) {
      const item = decorAt(state.decor, x, y, state.tank.sand);
      if (item) {
        decorDrag = { item, grabX: x - item.x };
        return;
      }
    }
    if (hud.tool === "feed") {
      const flakes = state.inventory.flakes ?? 0;
      if (flakes <= 0) return;
      state.inventory.flakes = flakes - 1;
      dropPellets(state, x, PELLETS_PER_PINCH, WATER, overWater ? undefined : y);
      scene.splash(x);
      sfx.splash();
      hud.refresh();
      return;
    }
    // Scrub and vacuum act while held; a press must not open a fish card.
    if (hud.tool) return;
    const fish = fishAt(state.fish, x, y, inspect.current);
    if (fish && fish.alive) {
      // Decide on release: a still press opens the card, a move carries the fish.
      fishDrag = { f: fish, grabX: x - fish.x, grabY: y - fish.y, moved: false, vx: 0, vy: 0 };
      return;
    }
    inspect.show(fish);
    bagPanel.show(null);
    if (fish) return;
    // A finger decides on release: a quick tap knocks, a held finger is a poke.
    if (input.touch) pendingKnock = true;
    else knock(x, y);
  };
  let pendingKnock = false;
  const knock = (x: number, y: number) => {
    if (state.tank.fill <= 0.3) return;
    scene.tap(x, y);
    sfx.tap();
    startle(state, x, y, WATER);
  };

  const handleRelease = () => {
    if (fishDrag) {
      const { f, moved, vx, vy } = fishDrag;
      fishDrag = null;
      if (moved) {
        releaseFish(f, vx, vy);
        scene.splash(f.x + SPECIES[f.speciesId].frames[0].w / 2);
        sfx.bubble(0.6);
      } else {
        inspect.show(f);
        bagPanel.show(null);
      }
      return;
    }
    if (!drag) return;
    // Let go well below the surface to release the fish; otherwise the bag floats back.
    if (drag.y + BAG_H / 2 > WATER.y0 + 24) {
      const shock = releaseShock(state, drag.bag);
      const f = releaseBag(state, drag.bag, drag.x + BAG_W / 2, drag.y + BAG_H / 2, WATER);
      toasts.show(shock > 15 ? t("{name} is shocked. Float longer and mix more water next time.", { name: f.name }) : t("{name} settled in nicely.", { name: f.name }));
      if (!isCycled(state)) toasts.show(t("The tank is not cycled yet. Watch ammonia and change water if it climbs."), 8000);
      bagPanel.show(null);
      hud.refresh();
    }
    drag = null;
  };

  // Simulation clock: wall-clock driven so hiding the window or sleeping the
  // machine never loses time; long gaps are replayed coarsely.
  const tick = () => {
    const { away, died, born, sick } = advance(state);
    // A summary is only worth a toast after a real absence.
    if (away && away.hours >= 5 / 60) {
      const h = away.hours >= 1 ? `${away.hours.toFixed(1)} h` : `${Math.round(away.hours * 60)} min`;
      toasts.show(t("Away {h}{capped}: +{n} coins", { h, capped: away.capped ? t(" (capped)") : "", n: Math.floor(away.coinsEarned) }), 8000);
    }
    for (const name of died) toasts.show(t("{name} died. Scoop it out before it fouls the water.", { name }), 8000);
    for (const b of born) toasts.show(t("{name} had {n} fry!", { ...b }), 8000);
    for (const s of sick) toasts.show(t(s.disease === "ich" ? "{name} has ich (white spots). Check the fish card." : "{name} has fin rot. Check the fish card.", { name: s.name }), 8000);
    for (const a of checkAchievements(state)) toasts.show(t("{title}: +{n} coins", { title: t(a.title), n: a.reward }), 8000);
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
  let leftoverHintAt = -1;
  // A finger resting on the glass (pointer still for a moment, no tool) draws curious fish.
  let hoverStill = 0;
  let hoverX = 0;
  let hoverY = 0;
  let nipCooldown = 0;

  // Every painted frame costs WebKit about 6 ms of CPU regardless of the JS
  // work, so an unfocused tank (pet mode beside your work) idles at 15 fps.
  const IDLE_FPS = 15;
/** Below this the VT323 text is unreadable, so the UI stops shrinking with the tank. */
const UI_MIN_SCALE = 1.25;
  startLoop({
    maxFps: () => (STRESS ? 1000 : document.hasFocus() ? state.settings.maxFps : Math.min(state.settings.maxFps, IDLE_FPS)),
    frame(dt) {
      setFillLevel(state.tank.fill);
      const v = windowVelocity(dt);
      if (v) scene.push(v.vx, v.vy);
      scene.stepSand(state.tank.sand, dt);
      input.beginFrame(dt);
      if (input.pressed) handleClick();
      if (input.released && pendingKnock) {
        pendingKnock = false;
        if (input.travel < 4 && input.held < 0.45) knock(input.pressX, input.pressY);
      }
      if (drag) {
        drag.x = input.x - BAG_W / 2;
        drag.y = input.y - BAG_H / 2;
      }
      if (fishDrag && input.down) {
        const { f } = fishDrag;
        const sp = SPECIES[f.speciesId];
        const w = sp.frames[0].w;
        const h = sp.frames[0].h;
        if (!fishDrag.moved && Math.hypot(input.x - input.pressX, input.y - input.pressY) > 3) {
          fishDrag.moved = true;
          f.held = true;
        }
        if (fishDrag.moved) {
          const nx = Math.max(WATER.x0, Math.min(WATER.x1 - w, input.x - fishDrag.grabX));
          const ny = Math.max(WATER.y0, Math.min(sandTop(state.tank.sand, nx + w / 2) - h, input.y - fishDrag.grabY));
          // Smoothed hand velocity, so a flick throws the fish on release.
          fishDrag.vx += ((nx - f.x) / dt - fishDrag.vx) * 0.3;
          fishDrag.vy += ((ny - f.y) / dt - fishDrag.vy) * 0.3;
          if (Math.abs(nx - f.x) > 0.5) f.facing = nx > f.x ? 1 : -1;
          f.x = nx;
          f.y = ny;
        }
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
        const lifted = scrapeAt(state, input.x, input.y, SCRUB_REACH, dt);
        scene.foam(input.x, input.y);
        if (lifted > 0) scene.flakeOff(input.x, input.y, lifted);
        scrubSoundIn -= dt;
        if (scrubSoundIn <= 0) {
          sfx.scrub();
          scrubSoundIn = SCRUB_SOUND_INTERVAL;
        }
      }
      const vacuuming = working && hud.tool === "vacuum";
      if (vacuuming) {
        scene.suck(input.x, input.y + 3);
        if (input.y >= sandTop(state.tank.sand, input.x) - VACUUM_REACH) {
          const took = vacuumAt(state, input.x, VACUUM_REACH, dt, (x) => sandTop(state.tank.sand, x));
          if (took.spots + took.pellets > 0) scene.gulp(input.x, sandTop(state.tank.sand, input.x), took.spots + took.pellets);
          scene.nickSand(state.tank.sand, input.x - WATER.x0, dt);
        } else if (!vacuumHintShown) {
          vacuumHintShown = true;
          toasts.show(t("The siphon works on the sand: drag it along the bottom to lift waste and leftover food."), 5000);
        }
      }
      sfx.vacuum(vacuuming);
      const eq = state.equipment;
      sfx.ambient(state.settings.ambient && !state.settings.muted && (eq.filter > 0 || eq.airPump > 0), eq.airPump > 0);
      music.update(state.settings.music && !state.settings.muted && window.self === window.top, ambientNow(state).phase === "night");
      updatePellets(state, WATER, dt);
      // Food nobody will eat any more: point at it once so the siphon gets used before it rots.
      if (hud.tool !== "vacuum" && !state.settings.chill) {
        const stale = leftovers(state);
        if (stale.length >= 3 && leftoverHintAt < 0) {
          leftoverHintAt = stale[0].x;
          scene.pointAt(stale[0].x, stale[0].y);
          toasts.show(t("Leftover food is going off on the sand. Siphon it up before it turns into ammonia."), 7000);
        } else if (stale.length === 0) {
          leftoverHintAt = -1;
          scene.pointAt(null);
        }
      }
      const lure = hud.tool === "feed" && input.inside && inWater(input.x, input.y) ? { x: input.x } : null;
      if (Math.hypot(input.x - hoverX, input.y - hoverY) > 2 || !input.inside || hud.tool || drag || !inWater(input.x, input.y)) {
        hoverStill = 0;
        hoverX = input.x;
        hoverY = input.y;
      } else {
        hoverStill += dt;
      }
      const poke: Poke | null = hoverStill > 0.6 && (!input.touch || input.down) ? { x: hoverX, y: hoverY } : null;
      nipCooldown -= dt;
      const current = scene.current;
      // A sponge or siphon working in the water is something fish give room to.
      const threat: Threat | null = working && (hud.tool === "scrub" || hud.tool === "vacuum") ? { x: input.x, y: input.y } : null;
      for (const f of state.fish) {
        moveFish(f, SPECIES[f.speciesId], WATER, dt, state, lure, poke, threat);
        if (current) f.vx += current * dt;
        if (poke && f.alive && isCurious(f) && nipCooldown <= 0) {
          const w = SPECIES[f.speciesId].frames[0].w;
          const mx = f.facing > 0 ? f.x + w - 2 : f.x + 2;
          if (Math.hypot(mx - poke.x, f.y + 3 - poke.y) < 9 && Math.random() < dt * 1.5) {
            scene.nip(mx, f.y + 2);
            sfx.bubble(0.5);
            nipCooldown = 0.8;
          }
        }
      }
    },
    render() {
      const feedZone = input.x >= WATER.x0 && input.x < WATER.x1 && input.y >= GLASS_TOP && input.y < WATER.y1;
      const showCursor = hud.tool && input.inside && (hud.tool === "feed" ? feedZone : inWater(input.x, input.y));
      const cursor = showCursor ? { tool: hud.tool!, x: input.x, y: input.y } : null;
      // Outline the fish a click would open; off in chill mode and while a tool is held.
      const hover = !state.settings.chill && !hud.tool && !drag && input.inside && inWater(input.x, input.y)
        ? fishUnder(state.fish, input.x, input.y)[0] ?? null
        : null;
      screen.style.cursor = fishDrag?.moved ? "grabbing" : hover ? "pointer" : "";
      scene.render(buf, state, drag, cursor, state.mode === "pet" && state.settings.transparent, state.settings.quality, hover);
      const scale = buf.present(screen, scene.overlays, viewport !== null);
      if (viewport) {
        // Phone layout: the UI scales with the screen, not the tank, and the
        // overlay covers the whole stage so the deck below the tank is usable.
        const stage = overlay.parentElement!;
        overlay.style.setProperty("--s", String(Math.min(3, Math.max(2, stage.clientWidth / 190))));
        // The deck is whatever the toolbar needs; the tank takes the rest.
        const bar = hud.root.querySelector<HTMLElement>(".toolbar")!;
        const landscape = stage.clientWidth > stage.clientHeight;
        if (landscape) overlay.style.setProperty("--deck-w", `${bar.offsetWidth + 16}px`);
        else overlay.style.setProperty("--deck-h", `${bar.offsetHeight + 24}px`);
        stage.style.setProperty("--deck-h", overlay.style.getPropertyValue("--deck-h"));
        stage.style.setProperty("--deck-w", overlay.style.getPropertyValue("--deck-w"));
        viewport.layout(state.settings.mobileView === "tall");
        // Sheets open from the tank's bottom edge, not the box's.
        const r = screen.getBoundingClientRect();
        const sr = stage.getBoundingClientRect();
        overlay.style.setProperty("--tank-h", `${Math.min(r.bottom, sr.bottom) - sr.top}px`);
      } else {
        // Text keeps a readable size in tiny windows; panels then scroll inside the tank.
        overlay.style.setProperty("--s", String(Math.max(scale, UI_MIN_SCALE)));
        overlay.style.width = screen.style.width;
        overlay.style.height = screen.style.height;
      }
    },
  }, STRESS ? "timer" : "raf");
}

/**
 * Tanks for screenshots (`?scene=…`): a fresh empty tank, one set up and cycling,
 * and the stocked demo. Not saved.
 */
function sceneState(name: string): GameState {
  const g = name === "stocked" ? demoGame() : newGame();
  // Early afternoon on the tank's own clock, so the room is lit however late it is here.
  g.settings.clock = "sim";
  g.dayStartHour = 14 - (g.ageHours % 24);
  if (name === "setup") {
    g.tank.sand = newSand(14);
    g.tank.fill = 0.9;
    g.tank.temp = 25;
    g.equipment = { ...g.equipment, filter: 1, heater: 1, light: 1, lightOn: true, thermometer: true };
    g.decor = [{ kind: "plantTall", x: 48 }, { kind: "plant", x: 84 }, { kind: "rock", x: 200 }, { kind: "wood", x: 300 }];
  }
  if (name === "stocked") {
    const stock: [string, string][] = [["neon", "Neo"], ["neon", "Nia"], ["neon", "Nix"], ["neon", "Nam"], ["neon", "Nub"], ["neon", "Nox"], ["guppy", "Gus"], ["guppy", "Gia"], ["molly", "Mo"], ["cory", "Cody"], ["cory", "Cleo"], ["angel", "Ari"], ["betta", "Blu"]];
    for (const [sp, n] of stock) g.fish.push(spawnFish(SPECIES[sp], n, WATER, g.nextFishId++));
    for (const f of g.fish) f.size = 1;
    g.decal = "deep";
    checkAchievements(g);
  }
  return g;
}

function decorAt(decor: Decor[], x: number, y: number, sand: number[]): Decor | null {
  for (const d of decor) {
    const s = DECOR_SPRITES[d.kind];
    if (s && x >= d.x && x < d.x + s.w && y >= sandTop(sand, d.x + (s.w >> 1)) - s.h) return d;
  }
  return null;
}

function bagAt(bags: Bag[], x: number, y: number): Bag | null {
  return bags.find((b) => x >= b.x && x < b.x + BAG_W && y >= bagY() && y < bagY() + BAG_H) ?? null;
}

/** Fish under the pointer, nearest centre first, so a crowd picks the one you are actually on. */
function fishUnder(fish: Fish[], x: number, y: number): Fish[] {
  const hits: { f: Fish; d: number }[] = [];
  for (const f of fish) {
    const s = SPECIES[f.speciesId].frames[0];
    const w = f.size < 0.5 ? s.w / 2 : s.w;
    const h = f.size < 0.5 ? s.h / 2 : s.h;
    if (x >= f.x - 2 && x <= f.x + w + 2 && y >= f.y - 2 && y <= f.y + h + 2) {
      hits.push({ f, d: Math.hypot(x - (f.x + w / 2), y - (f.y + h / 2)) });
    }
  }
  return hits.sort((a, b) => a.d - b.d).map((h) => h.f);
}

/**
 * The fish a click should open. Clicking again on the same crowd steps to the
 * next fish under the pointer, so overlapping fish are all reachable.
 */
function fishAt(fish: Fish[], x: number, y: number, current: Fish | null = null): Fish | null {
  const hits = fishUnder(fish, x, y);
  if (hits.length === 0) return null;
  const i = current ? hits.indexOf(current) : -1;
  return i >= 0 ? hits[(i + 1) % hits.length] : hits[0];
}

boot().catch((e) => console.error("boot failed", e));
