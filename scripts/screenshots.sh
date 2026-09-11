#!/usr/bin/env bash
# Capture press screenshots from the dev server (pnpm dev on :1420) with headless Chrome.
# Scenes come from `?scene=` in src/main.ts: welcome, empty, setup, stocked. 1536×960 = 4× pixels.
set -euo pipefail
out=${1:-press}
mkdir -p "$out"
shot() {
  local scene=$1 file=$2
  for _ in 1 2 3 4; do
    timeout 40 google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1536,960 \
      --force-device-scale-factor=1 --virtual-time-budget=8000 --screenshot="$out/$file" \
      "http://localhost:1420/?scene=$scene" >/dev/null 2>&1 || true
    # Headless sometimes captures before layout; the tank frame pixel tells a real capture apart.
    [ "$(magick "$out/$file" -format '%[pixel:p{20,70}]' info:)" != "srgb(26,28,44)" ] && return
  done
  echo "gave up on $scene" >&2
}
shot empty 01-empty-tank.png
shot setup 02-set-up.png
shot stocked 03-stocked.png
shot welcome 04-welcome.png
bg=$(magick "$out/03-stocked.png" -format '%[pixel:p{5,5}]' info:)
magick "$out/03-stocked.png" -sample 50% -crop 630x480+69+0 +repage -background "$bg" -gravity center -extent 630x500 "$out/itch-cover-630x500.png"
ls -la "$out"
