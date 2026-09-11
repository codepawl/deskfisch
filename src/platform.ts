import type { GameState } from "./sim/state";

export type Mode = GameState["mode"];

export const isTauri = "__TAURI_INTERNALS__" in window;

const WINDOW_SIZE: [number, number] = [1170, 690];
/** Pet mode shows the tank at 2x with no chrome around it. */
const PET_SIZE: [number, number] = [384 * 2, 240 * 2];

/** Pinned = fixed to the screen: above other apps and, in pet mode, not resizable. */
export async function setPinned(pinned: boolean, mode: Mode): Promise<void> {
  if (!isTauri) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const w = getCurrentWindow();
  await w.setAlwaysOnTop(pinned);
  if (mode === "pet") await w.setResizable(!pinned);
}

/** Resize the borderless pet window from its bottom-right corner. */
export async function startWindowResize(): Promise<void> {
  if (!isTauri) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().startResizeDragging("SouthEast");
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
      await w.setResizable(!pinned);
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

/**
 * Window velocity (screen px/s) sampled from `window.screenX/Y`, which the
 * webview updates itself: no IPC, so nothing can block while the window
 * manager is dragging the window. Call once per frame; returns null when still.
 */
export function windowVelocity(dt: number): { vx: number; vy: number } | null {
  const x = window.screenX;
  const y = window.screenY;
  if (lastPos === null) {
    lastPos = { x, y };
    return null;
  }
  const dx = x - lastPos.x;
  const dy = y - lastPos.y;
  lastPos = { x, y };
  if (dx === 0 && dy === 0) {
    if (!wasMoving) return null;
    wasMoving = false;
    return { vx: 0, vy: 0 };
  }
  wasMoving = true;
  return { vx: dx / Math.max(0.004, dt), vy: dy / Math.max(0.004, dt) };
}
let lastPos: { x: number; y: number } | null = null;
let wasMoving = false;

/** Launch on login. Returns the current state; null when unsupported (browser). */
export async function autostart(enable?: boolean): Promise<boolean | null> {
  if (!isTauri) return null;
  const a = await import("@tauri-apps/plugin-autostart");
  if (enable === true) await a.enable();
  if (enable === false) await a.disable();
  return a.isEnabled();
}
