import { isTauri } from "../platform";
import type { GameState } from "../sim/state";

/** How many rotating backups to keep. */
export const KEEP = 5;
const DIR = "backups";
const LS_PREFIX = "fisch-save-backup-";

/**
 * Snapshot the raw save before it is normalised or migrated, so a bad update
 * never destroys the only copy. Never throws: a failed backup must not block play.
 */
export async function backupRaw(raw: unknown): Promise<void> {
  try {
    const text = JSON.stringify(raw);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    if (isTauri) {
      const fs = await import("@tauri-apps/plugin-fs");
      const base = { baseDir: fs.BaseDirectory.AppData };
      await fs.mkdir(DIR, { ...base, recursive: true });
      await fs.writeTextFile(`${DIR}/save-${stamp}.json`, text, base);
      const entries = (await fs.readDir(DIR, base)).filter((e) => e.isFile && e.name.startsWith("save-")).map((e) => e.name).sort();
      for (const name of entries.slice(0, Math.max(0, entries.length - KEEP))) await fs.remove(`${DIR}/${name}`, base);
    } else {
      localStorage.setItem(LS_PREFIX + stamp, text);
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX)).sort();
      for (const k of keys.slice(0, Math.max(0, keys.length - KEEP))) localStorage.removeItem(k);
    }
  } catch (e) {
    console.warn("backup failed", e);
  }
}

/** Let the player save a copy wherever they like. */
export async function exportSave(state: GameState): Promise<boolean> {
  const text = JSON.stringify(state, null, 2);
  const name = `deskfisch-save-${new Date().toISOString().slice(0, 10)}.json`;
  if (isTauri) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({ defaultPath: name, filters: [{ name: "Deskfisch save", extensions: ["json"] }] });
    if (!path) return false;
    const fs = await import("@tauri-apps/plugin-fs");
    await fs.writeTextFile(path, text);
    return true;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  return true;
}

/** Pick a save file and return its parsed content, or null if cancelled. */
export async function pickSaveFile(): Promise<unknown | null> {
  if (isTauri) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const path = await open({ multiple: false, filters: [{ name: "Deskfisch save", extensions: ["json"] }] });
    if (!path) return null;
    const fs = await import("@tauri-apps/plugin-fs");
    return JSON.parse(await fs.readTextFile(path));
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      resolve(f ? JSON.parse(await f.text()) : null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
