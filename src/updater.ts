import { isMobileShell, isTauri } from "./platform";

export interface AvailableUpdate {
  version: string;
  /** Downloads, installs and relaunches. Rejects with a message on failure. */
  install(): Promise<void>;
}

/**
 * Ask GitHub Releases for a newer signed build. Returns null in the browser,
 * when already current, or when the check itself fails (offline).
 */
export async function checkForUpdate(): Promise<AvailableUpdate | null> {
  if (!isTauri || isMobileShell) return null;
  const { check } = await import("@tauri-apps/plugin-updater");
  const update = await check().catch(() => null);
  if (!update) return null;
  return {
    version: update.version,
    async install() {
      await update.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    },
  };
}
