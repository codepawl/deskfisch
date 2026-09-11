# Codepawl pixel font

Goal: one pixel typeface, owned by codepawl, covering every language Deskfisch ships in, so the UI never mixes faces.

## Today

- English UI: Pixelify Sans (OFL, latin + latin-ext only).
- Vietnamese UI: VT323 (OFL, has the vietnamese subset). Digits everywhere use VT323 because Pixelify's 5 reads as S.
- Anything outside Latin (CJK, Thai, Cyrillic) falls back to the system font and stops looking pixel.

## Scope for a custom font

| Block | Glyphs | Needed for |
|---|---|---|
| Basic Latin + punctuation | ~95 | everything |
| Latin-1 + Latin Extended-A/B subset | ~200 | Vietnamese base letters, German, French, Spanish, Portuguese, Polish, Turkish |
| Latin Extended Additional (Vietnamese tone marks) | ~134 | Vietnamese |
| Cyrillic basic | ~66 | Russian, Ukrainian |
| Symbols the UI uses | ☀ ☁ ☾ ♂ ♀ ✔ ○ ⋮ × → ° | HUD |

Start with Latin + Vietnamese + Cyrillic (~500 glyphs). CJK is a separate project (thousands of glyphs; use a licensed pixel CJK face such as Zpix or a system fallback instead).

## Process

1. Draw on an 8×12 grid at 400 weight, digits with an open 5 and slashed 0, in a bitmap editor (BitFontMaker2, or Aseprite with the font export script).
2. Export to TTF with FontForge (bitmap → outline, "autotrace off" to keep hard edges) and hint for integer sizes 8/16/24 px only.
3. Subset with `pyftsubset` into latin, latin-ext, vietnamese, cyrillic `.woff2` files with unicode-range, like fontsource does, and ship them in `src/fonts/`.
4. Replace the two `@fontsource` imports in `src/main.ts` with the local `@font-face` rules; delete the `html[lang="vi"]` override in `styles.css`.
5. License OFL, name it something codepawl owns (working title: "Pawlfont"), publish the source grid in the repo.

Budget: about two weeks of drawing for a first Latin + Vietnamese + Cyrillic release, one more week for testing across the UI at 2×, 3× and 4×.
