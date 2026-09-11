# Changelog

## 0.3.1 — unreleased

- Vietnamese UI (Settings → Language, follows the system by default). Vietnamese text uses VT323 because Pixelify Sans has no Vietnamese glyphs.
- Saves: the last 5 saves are backed up before each launch; Settings gets Export and Import.
- Daylight: without a tank light the room follows the sun. Night is dark, dawn and dusk go rose and gold, day is clear. Settings → Clock: Real time (follows your clock, speed locked at 1×) or Simulated (own day at the chosen speed). Sunrise and sunset can be typed in or computed from your location.
- One pixel face (VT323) for the whole UI; finished guide steps are struck through; tooltips clear reliably.

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
