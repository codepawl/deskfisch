import { newGame, type GameState } from "../sim/state";
import { backupRaw } from "./backup";

const KEY = "fisch-save";

interface Backend {
  get(): Promise<unknown>;
  set(value: GameState): Promise<void>;
}

const inTauri = "__TAURI_INTERNALS__" in window;

async function backend(): Promise<Backend> {
  if (inTauri) {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load("save.json", { autoSave: false });
    return {
      get: () => store.get(KEY),
      set: async (v) => {
        await store.set(KEY, v);
        await store.save();
      },
    };
  }
  return {
    get: async () => {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : undefined;
    },
    set: async (v) => localStorage.setItem(KEY, JSON.stringify(v)),
  };
}

export async function loadGame(): Promise<GameState | null> {
  const raw = await (await backend()).get();
  if (!raw || typeof raw !== "object") return null;
  await backupRaw(raw);
  return normalise(raw);
}

/** Bring any save object up to the current shape, or null if it is not a save at all. */
export function normalise(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object" || (raw as GameState).version !== 1) return null;
  // Fields added since the save was written fall back to a fresh game's defaults.
  const fresh = newGame();
  const saved = raw as Partial<GameState>;
  return {
    ...fresh,
    ...saved,
    tank: { ...fresh.tank, ...saved.tank },
    equipment: { ...fresh.equipment, ...saved.equipment },
    inventory: { ...fresh.inventory, ...saved.inventory },
    settings: { ...fresh.settings, ...saved.settings },
    stats: { ...fresh.stats, ...saved.stats },
    fish: (saved.fish ?? []).map((f) => ({ ...f, sex: f.sex ?? (Math.random() < 0.5 ? "m" : "f") })),
  };
}

export async function saveGame(state: GameState): Promise<void> {
  await (await backend()).set(state);
}
