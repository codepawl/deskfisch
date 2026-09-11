import type { GameState } from "./sim/state";

export type Mode = GameState["mode"];

export const isTauri = "__TAURI_INTERNALS__" in window;

const WINDOW_SIZE: [number, number] = [1170, 690];
/** Pet mode shows the tank at 2x with no chrome around it. */
const PET_SIZE: [number, number] = [384 * 2, 240 * 2];

/** Keep the window above other apps. No-op in the browser. */
export async function setPinned(pinned: boolean): Promise<void> {
  if (!isTauri) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().setAlwaysOnTop(pinned);
}

/** Configure the native window (or the browser) for a display mode. */
export async function applyMode(mode: Mode, pinned: boolean, transparent: boolean): Promise<void> {
  // On <html>, not <body>: both carry a background and pet mode must clear both.
  document.documentElement.dataset.mode = mode;
  document.documentElement.dataset.transparent = String(mode === "pet" && transparent);
  if (!isTauri) {
    if (mode === "fullscreen") await document.documentElement.requestFullscreen?.().catch(() => undefined);
    else if (document.fullscreenElement) await document.exitFullscreen();
    return;
  }
  const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
  const w = getCurrentWindow();
  await w.setFullscreen(false);
  switch (mode) {
    case "window":
      await w.setAlwaysOnTop(pinned);
      await w.setDecorations(true);
      await w.setShadow(true);
      await w.setResizable(true);
      await w.setSize(new LogicalSize(...WINDOW_SIZE));
      break;
    case "pet":
      await w.setDecorations(false);
      await w.setShadow(false);
      await w.setResizable(false);
      await w.setSize(new LogicalSize(...PET_SIZE));
      await w.setAlwaysOnTop(pinned);
      break;
    case "fullscreen":
      await w.setAlwaysOnTop(false);
      await w.setDecorations(true);
      await w.setFullscreen(true);
      break;
  }
}

/** Mode changes requested from the tray menu. */
export async function onModeRequest(cb: (mode: Mode) => void): Promise<void> {
  if (!isTauri) return;
  const { listen } = await import("@tauri-apps/api/event");
  await listen<Mode>("mode", (e) => cb(e.payload));
}

/** Move the borderless pet window by dragging. */
export async function startWindowDrag(): Promise<void> {
  if (!isTauri) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().startDragging();
}
