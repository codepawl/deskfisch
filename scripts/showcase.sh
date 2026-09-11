#!/usr/bin/env bash
# Record the browser showcase and cut it into an MP4 and a short GIF.
#   scripts/showcase.sh            → press/showcase.webm, press/showcase.mp4, press/showcase.gif
# GIF covers the knock + curious-fish beat (seconds 12–22) at 768 px wide, 15 fps.
set -euo pipefail
out=${1:-press}
node scripts/showcase.mjs "$out"
ffmpeg -y -loglevel error -i "$out/showcase.webm" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "$out/showcase.mp4"
ffmpeg -y -loglevel error -ss 12 -t 10 -i "$out/showcase.mp4" \
  -vf "fps=15,scale=768:-1:flags=neighbor,split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=diff[p];[s1][p]paletteuse=dither=none" \
  "$out/showcase.gif"
ls -la "$out"/showcase.*
