import type { GameState } from "../sim/state";

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
  // Only the current schema exists; older saves will get a migration step here.
  if (raw && typeof raw === "object" && (raw as GameState).version === 1) return raw as GameState;
  return null;
}

export async function saveGame(state: GameState): Promise<void> {
  await (await backend()).set(state);
}
