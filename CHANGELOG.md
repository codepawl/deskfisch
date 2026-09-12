# Changelog

## 0.4.3 — unreleased

- Grime you can see and clean: settled waste (mulm) lies on the sand as dark crumbs and algae film grows on the front glass as green specks, both following the water numbers. The siphon now lifts the mulm and leftover food under it, nicks the sand, and takes a little water with it. The scraper lifts the film where you rub, and green flecks drift off.

## 0.4.2 — 2026-09-12

- Hovering a fish outlines it with corner brackets and the pointer becomes a hand, so you know which fish a click opens. Off in chill mode and while holding a tool.
- Crowded fish: a click picks the fish whose centre is nearest the pointer, and clicking the same spot again steps to the next fish underneath, so overlapping fish are all reachable.
- Feeding is physical: flakes dropped from above the water land dry and float on the surface for a while, where only surface feeders reach them, then soak and sink. Click under the water to place food at that depth like a pipette; bottom dwellers only go for what has sunk.
- Toolbar labels are one floating tooltip instead of one per button; the old ones lingered on WebKitGTK.
- Panels lose the block shadow, per-row rules and bordered buttons; scrollbars are thin and no longer cover content.
- Feed tool shows a pinch cursor and works from above the water; about a third of each pinch sinks at once, the rest floats first. The toolbar is split into care, tank and window groups. Toasts sit at the top of the tank and the away summary only appears after five minutes.

## 0.4.1 — 2026-09-12

- Background music: five slow chiptune tracks made for the tank, a daytime set and a night set that follows the room light, shuffled and crossfaded. Off by default; Settings → Music.
- About in Settings: version, license and links to the site, changelog, bug reports.
- Panels never outgrow the tank; Esc closes them. Shop rows show item pictures.
- The first-run screen marks Zen as the pick for people who just want fish on their desk.

## 0.4.0 — 2026-09-11

- Start from nothing: a new tank is empty glass. Pour sand, plant and decorate, fill with tap water, then cycle it. Older saves keep their full tank.
- Sand is terrain: a heightmap poured from bags, shoved by window jolts, slumping to its angle of repose. Fish, food and hardscape sit on the sand surface; plants root into it.
- Knock on the glass to startle nearby fish; curious fish drift over to a pointer resting on the glass and nip at it.
- The water sloshes when the window is dragged, reacting to acceleration and ringing down; the surface is a wandering mix of waves instead of a loop.
- Backdrop decals, adjustable water level with evaporation, and a see-through tank that gets murkier with depth.
- Every sound effect varies slightly in pitch and length; levels stay fixed.
- Website: six languages with pixel faces for Vietnamese, Japanese, Chinese and Korean; platform icons; live stocked demo in the hero.
- First run asks how you want to play: Zen (nothing dies or gets sick), Normal, Hardcore (illness twice as likely, stress hurts more, higher prices, fewer coins) or Sandbox (unlimited coins, no risk). Change it any time in Settings.
- Panels never outgrow the tank: long ones scroll with their buttons pinned at the foot, text stops shrinking below 1.25×, Esc closes them.
- Shop rows show the item: fish and decor as their in-game sprites, gear and supplies as new pixel pictures.

## 0.3.2 — 2026-09-11

- Vietnamese UI (Settings → Language, follows the system by default). Vietnamese text uses VT323 because Pixelify Sans has no Vietnamese glyphs.
- Saves: the last 5 saves are backed up before each launch; Settings gets Export and Import.
- Daylight: without a tank light the room follows the sun. Night is dark, dawn and dusk go rose and gold, day is clear. Settings → Clock: Real time (follows your clock, speed locked at 1×) or Simulated (own day at the chosen speed). Sunrise and sunset can be typed in or computed from your location.
- One pixel face (VT323) for the whole UI; finished guide steps are struck through; tooltips clear reliably.
- The water sloshes when you drag the window: it reacts to acceleration (starts and stops, not steady glides) and rings down like a lightly damped pendulum at about 1.2 Hz; fish feel the current. Rendering the water is one flat fill per row, so a frame with decal, refraction and slosh costs about 0.3 ms of JS.
- Water level: tanks are filled to 90% by default, adjustable 70–100% in Care. Water evaporates about a percent a day (faster when warm) and every water change refills to the target.
- Backdrop decals in Shop → Decor: six colours stuck to the back glass, buy once and switch freely. With no decal a see-through pet window shows the desktop through the water, and the water refracts what is under the surface with a slow ripple; it gets murkier with depth.
- CPU: the frame is presented at 1× and upscaled by the compositor, room tints are canvas fills, default 30 fps, 15 fps while the window is not focused. Measured on Linux/WebKitGTK: 60 fps ≈ 38% of a core, 30 ≈ 21%, 15 ≈ 10%.

## 0.3.0 — 2026-09-11

- Auto-update: the app checks GitHub Releases for signed builds and offers to install them. Installs from 0.3.0 on update themselves; 0.2.x needs one manual download.
- Release workflow signs update artifacts and is wired for Apple notarization and Azure Trusted Signing once certificates are added (see docs/signing.md).
- Leaving Chill mode is discoverable: hint, clearer corner button, double-click.

## 0.2.2 — 2026-09-11

- Renamed again, to **Deskfisch**: reads in English, keeps the Fisch, and is its own search term. Numbers now use a pixel mono face so 5 no longer looks like S.

## 0.2.1 — 2026-09-11

- Renamed to **Fischlein**. "Fisch" collides with an unrelated Roblox game in every search box; the new name keeps the word and stays findable. Bundle id is unchanged, saves carry over.

## 0.2.0 — 2026-09-11

- Fish behaviour: schooling, foraging bottom dwellers, betta rivalry, fish rise to a hand holding food, stressed fish hide.
- Breeding for guppies and mollies; fry grow into sellable adults.
- Disease: ich and fin rot, with shop medicine and a warm-water cure for ich.
- Tank upgrades to 120 L and 200 L.
- Getting-started checklist with a journal of lifetime stats.
- Adjustable heater target, fish renaming, drag-to-place decorations.
- Ambient filter hum, start-with-system toggle.
- Toolbar icons with floating labels, coin icon instead of a currency sign.

## 0.1.0 — 2026-09-11

- Pixel aquarium with a real nitrogen cycle, eight species, shop, acclimation and care tools.
- Window, pet and fullscreen display modes; settings for sound, sim speed, visuals and FPS.
- Linux, macOS and Windows installers via GitHub Actions; browser build.
