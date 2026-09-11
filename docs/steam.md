# Steam build

Status: **prepared, not yet exercised.** Everything below is wired but has not run against a real Steamworks app, because that needs a Steamworks partner account ($100 app fee) and an app id.

## What is in the repo

- `steam/*.vdf`: SteamPipe build scripts with `APPID` placeholders (app id, and depots `APPID1` Windows, `APPID2` macOS, `APPID3` Linux).
- `steam/installscript.vdf`: runs the WebView2 bootstrapper on first launch on Windows, because Steam launches the raw executable and Tauri needs the WebView2 runtime. Most Windows 10/11 machines already have it, so the script is a no-op there.
- `.github/workflows/steam.yml`: manual workflow. Give it a release tag; it downloads that release's assets, lays out the three depots and pushes with `game-ci/steam-deploy`.

## How each platform is laid out

| Platform | Source asset | Depot content | Launch executable |
|---|---|---|---|
| Windows | `Deskfisch_x.y.z_x64-setup.exe` (NSIS, unpacked with 7z) | app files + WebView2 bootstrapper | `fisch.exe` |
| macOS | `Deskfisch_universal.app.tar.gz` | `Deskfisch.app` (signed and notarized once Apple secrets exist) | `Deskfisch.app` |
| Linux | `Deskfisch_x.y.z_amd64.AppImage`, extracted | AppDir with bundled webkit2gtk | `AppRun` |

Linux ships the extracted AppImage on purpose: the Steam Linux Runtime does not include webkit2gtk, and FUSE is not guaranteed inside the runtime container.

## Steps to go live

1. Create the app in Steamworks, note the app id, create three depots (Windows, macOS, Linux) numbered `<appid>1..3` or edit the vdf files to match.
2. Create a build account (a separate Steam account with only "Edit App Metadata / Publish" for this app) and generate its `config.vdf` after logging in once with Steam Guard: see the game-ci/steam-deploy README.
3. Add repository secrets `STEAM_USERNAME`, `STEAM_CONFIG_VDF`, `STEAM_APP_ID`.
4. In Steamworks → Installation → General, set the launch options per OS to the executables above, and attach `installscript.vdf` to the Windows depot.
5. Run the **Steam** workflow with a release tag. First run: leave the branch blank, then set the build live on a private beta branch from Steamworks and test on all three OSes.
6. Verify: app launches from Steam, saves persist in the OS app-data dir (not the Steam folder), auto-update is **disabled** on Steam builds because Steam owns updates. To do: gate `checkForUpdate` behind a `STEAM=1` build flag once the depot works.

## Known gaps

- The in-app updater and Steam updates would fight; the Steam build must ship with the updater off (not done yet, needs a build-time flag).
- Steam Overlay is not required and not integrated. Achievements are in-game only.
- The macOS depot is only useful once the app is signed and notarized; unsigned .app bundles fail Gatekeeper when launched from Steam.
