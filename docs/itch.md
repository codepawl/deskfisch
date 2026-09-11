# itch.io page

Everything below is ready to paste. The account and the project have to be created by a codepawl
member (itch.io login is a human step). Once the project exists, `butler` can push builds from CI.

## Project settings

| Field | Value |
|---|---|
| Title | Deskfisch |
| Project URL | `codepawl.itch.io/deskfisch` |
| Short description | A cozy pixel-art aquarium for your desktop. Real water chemistry, fish with needs, a pet window that floats over your work. |
| Classification | Game → Simulation |
| Kind of project | Downloadable |
| Release status | Released |
| Pricing | Free, "No payments" for the launch; switch to "Paid with $0 minimum" (pay what you want, suggested $5) once the Steam page exists so both stores tell the same story |
| Tags | aquarium, pixel-art, relaxing, simulation, idle, desktop-pet, cozy, virtual-pet, tauri |
| Platforms | Windows, macOS, Linux, HTML5 (the browser build, `pnpm site` output in `site/play`) |
| Cover image | `press/itch-cover-630x500.png` |
| Screenshots | `press/01-empty-tank.png` … `press/04-welcome.png`, in that order |
| Community | Comments enabled |
| Visibility | Draft until the copy and images are approved, then Public |

## Page text (Markdown, itch renders it)

**A small aquarium that lives on your desk.**

Pixel fish with real needs. The water runs a real nitrogen cycle, new fish have to be acclimated, and pet mode floats the tank over whatever you are doing.

**What makes it different**

- **A real nitrogen cycle.** Ammonia becomes nitrite becomes nitrate. A new tank takes days to cycle; add fish too early and they stress. Buy a test kit to see it happen.
- **Pet mode.** A borderless, see-through window that stays on top of everything. Pin it in a corner or drag it around. Chill mode hides every control.
- **Acclimate properly.** New fish arrive in a bag. Float it, mix in tank water, then drag it under the surface. Rush it and they sulk.
- **Care, not clicks.** Feed by hand, scrub algae, vacuum the sand, change water with conditioner. Neglect shows up as ich and fin rot.
- **Breeding and a shop.** Happy guppies and mollies have fry that grow up and sell. Coins buy filters, heaters, lights, a bigger tank and decor.
- **Follows the sun.** Without a tank light the room goes dark at night and rose-gold at dawn and dusk, on your real clock or the tank's own day.
- **Pick how you play.** Zen (nothing dies), Normal, Hardcore, or Sandbox with unlimited coins.

**Runs light.** 384×240 pixels, about a fifth of one core at 30 fps, less while unfocused. The tank keeps living while the app is closed and catches up when you come back.

**No account, no ads, no tracking.** The only network request is the update check against GitHub.

Source-available under PolyForm Noncommercial at github.com/codepawl/deskfisch. Website: deskfisch.codepawl.com.

*Installers are not code-signed yet. macOS: right-click → Open. Windows: More info → Run anyway. Details on the website's Questions section.*

## Uploads

Take the files from the GitHub release, name and tag them like this:

| File | itch platform | Notes |
|---|---|---|
| `Deskfisch_<v>_x64-setup.exe` | Windows | Mark as "executable" |
| `Deskfisch_<v>_universal.dmg` | macOS | |
| `Deskfisch_<v>_amd64.AppImage` | Linux | Mark as "executable" |
| `deskfisch-<v>-html5.zip` (`vite build --base=./`, `index.html` at the root) | HTML5, "played in the browser" | Kind of project: HTML. Viewport 768×480, Fullscreen button on. Upload through the web form: a butler-pushed directory makes itch report "Failed to find index.html". |

## butler

`.github/workflows/itch.yml` pushes the three installers on every published GitHub release
(or by hand: Actions → itch.io → Run workflow with the tag). Needs the `BUTLER_API_KEY` secret.
The browser zip is uploaded by hand as described above.

## butler by hand

```bash
# once: butler login  (opens a browser; a codepawl member does this)
butler push Deskfisch_0.4.0_x64-setup.exe     codepawl/deskfisch:windows --userversion 0.4.0
butler push Deskfisch_0.4.0_universal.dmg     codepawl/deskfisch:mac     --userversion 0.4.0
butler push Deskfisch_0.4.0_amd64.AppImage    codepawl/deskfisch:linux   --userversion 0.4.0
butler push site/play                         codepawl/deskfisch:html5   --userversion 0.4.0
```

To automate it, add the itch API key as the `BUTLER_API_KEY` repository secret and a job in
`release.yml` that runs the four pushes after the GitHub release is published.

## Devlog for launch day

Title: "Deskfisch 0.4.0: start from an empty tank"

Three paragraphs: what the app is, what 0.4.0 added (empty-tank start, sand as terrain, glass
knocks, play styles), where to get it. Attach `press/03-stocked.png`.
