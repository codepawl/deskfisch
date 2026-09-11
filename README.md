# Fischlein

A cozy pixel-art aquarium for your desktop. Fish have real needs, the water
runs a real nitrogen cycle, and new fish must be acclimated before release.

## Run

```bash
pnpm install
pnpm tauri dev      # desktop app
pnpm dev            # browser only, saves to localStorage
pnpm test           # simulation tests
pnpm tauri build    # installers for the current OS
```

Tagging `v*` builds Linux, macOS and Windows installers through GitHub Actions
and uploads a browser build as an artifact.

## Display modes

Pick from the tray menu or the Mode button: **Window** (resizable), **Pet**
(small, borderless, always on top, drag it around by its top bar) and
**Fullscreen**. The browser build only offers fullscreen. Linux under Wayland
ignores always-on-top for native GTK apps; run with `GDK_BACKEND=x11` to get it.

## How the tank works

- Fish waste and rotting food produce ammonia. Two bacteria populations turn
  it into nitrite, then nitrate. A fresh tank takes a few days to cycle;
  fish added before that get stressed.
- Temperature drifts toward the room unless a heater holds it. Oxygen comes
  from surface exchange, the filter and an air pump.
- Water changes dilute nitrate but bring chlorine unless you have conditioner.
- Readings are hidden until you buy a thermometer and a test kit.
- Guppies and mollies breed: an adult pair that is fed, calm and in a
  cycled, uncrowded tank produces fry after a day. Fry grow up over weeks.
- New fish arrive in a bag. Float it ten minutes, add tank water three times,
  then drag the bag under the surface to release.

The bundle identifier stays `com.an.fisch` so existing saves keep working after the rename to Fischlein. Saves live in the app data directory (`save.json`) via `tauri-plugin-store`.
