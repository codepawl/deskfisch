import { PALETTE } from "../engine/palette";

/** 8×8 pixel icons in the sprite palette, rendered as crisp SVG rects. */
const ICONS: Record<string, string[]> = {
  feed: [
    "........",
    "..yy.y..",
    ".y..y.S.",
    "..S...y.",
    ".y.yy...",
    "..y..S..",
    ".S.y....",
    "........",
  ],
  scrub: [
    "........",
    ".yyyyyy.",
    "yyySyyyy",
    "yySyyyyy",
    "yyyyySyy",
    ".yyyyyy.",
    "........",
    "........",
  ],
  vacuum: [
    "...DD...",
    "...DD...",
    "...DD...",
    "..DDD...",
    ".DLLD...",
    ".DLLD...",
    ".DDDD...",
    "........",
  ],
  light: [
    "..yyyy..",
    ".yyyyyy.",
    ".yySyyy.",
    ".yyyyyy.",
    "..yyyy..",
    "...DD...",
    "...DD...",
    "...LL...",
  ],
  water: [
    "...c....",
    "...c....",
    "..ccc...",
    ".ccccc..",
    ".cWccc..",
    ".ccccc..",
    "..ccc...",
    "........",
  ],
  test: [
    "..LLLL..",
    "...WW...",
    "...WW...",
    "...WW...",
    "...GG...",
    "..GGGG..",
    "..GGGG..",
    "...GG...",
  ],
  coin: [
    "..yyyy..",
    ".yyyyyy.",
    "yyySSyyy",
    "yySyyyyy",
    "yySyyyyy",
    "yyySSyyy",
    ".yyyyyy.",
    "..yyyy..",
  ],
  mode: [
    "DDDDDDDD",
    "DLLLLLLD",
    "DDDDDDDD",
    "D......D",
    "D......D",
    "D......D",
    "D......D",
    "DDDDDDDD",
  ],
  pin: [
    "...RR...",
    "..RRRR..",
    "..RRRR..",
    "..RRRR..",
    ".RRRRRR.",
    "...DD...",
    "...D....",
    "...D....",
  ],
  guide: [
    "WWWWWWW.",
    "WLLLWLLW",
    "WLLLWLLW",
    "WWWWWWWW",
    "WLLLWLLW",
    "WLLLWLLW",
    "WWWWWWW.",
    "........",
  ],
  settings: [
    "..D..D..",
    ".DDDDDD.",
    "DDD..DDD",
    ".D....D.",
    ".D....D.",
    "DDD..DDD",
    ".DDDDDD.",
    "..D..D..",
  ],
  chill: [
    "...WWW..",
    "..WW....",
    ".WW.....",
    ".WW.....",
    ".WW.....",
    "..WW....",
    "...WWW..",
    "........",
  ],
};

export type IconName = keyof typeof ICONS;

export function icon(name: IconName): SVGSVGElement {
  const rows = ICONS[name];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${rows[0].length} ${rows.length}`);
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = PALETTE[row[x]];
      if (!color) continue;
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", String(x));
      r.setAttribute("y", String(y));
      r.setAttribute("width", "1");
      r.setAttribute("height", "1");
      r.setAttribute("fill", color);
      svg.append(r);
    }
  });
  return svg;
}
