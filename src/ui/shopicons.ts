import type { Sprite } from "../engine/sprite";
import { pixelSvg } from "./icons";

/** 12×12 pictures for gear and supplies. Fish and decor use their own sprites. */
const SHOP_ICONS: Record<string, string[]> = {
  tank: [
    "dDDDDDDDDDDd",
    "D..........D",
    "D.BBBBBBBB.D",
    "D.BBBBBBBB.D",
    "D.BBBBBBBB.D",
    "D.BBBBBBBB.D",
    "D.BBBBBBBB.D",
    "D.BBBBBBBB.D",
    "D.ssssssss.D",
    "D.ssssssss.D",
    "D..........D",
    "dDDDDDDDDDDd",
  ],
  filter: [
    ".....LL.c...",
    ".....LL.....",
    ".....LL..c..",
    "...DDDDDDD..",
    "...DdDdDdD..",
    "...DDdDdDD..",
    "...DdDdDdD..",
    "...DDdDdDD..",
    "...DdDdDdD..",
    "...DDdDdDD..",
    "...DDDDDDD..",
    "............",
  ],
  heater: [
    "....DDDD....",
    "....DddD....",
    "....LWWL....",
    "....LRRL....",
    "....LWWL....",
    "....LRRL....",
    "....LWWL....",
    "....LRRL....",
    "....LWWL....",
    "....LRRL....",
    "....LLLL....",
    "............",
  ],
  airPump: [
    ".........c..",
    ".......c....",
    "........c...",
    "......c.....",
    ".......c....",
    "............",
    "..DDDDDDDD..",
    "..DLLLLLLD..",
    "..DLdddLLD..",
    "..DLdddLLD..",
    "..DLLLLLLD..",
    "..DDDDDDDD..",
  ],
  light: [
    "............",
    "............",
    "..DDDDDDDD..",
    "..DyyyyyyD..",
    "..DDDDDDDD..",
    "...y..y..y..",
    "...y..y..y..",
    "..y..y..y...",
    "..y..y..y...",
    ".y..y..y....",
    "............",
    "............",
  ],
  sand: [
    ".....DD.....",
    "....DsSD....",
    "....DssD....",
    "...DssSsD...",
    "..DssSSssD..",
    "..DsssssSD..",
    "..DsSsssSD..",
    "..DssssssD..",
    "..DSssssSD..",
    "..DsssSssD..",
    "...DDDDDD...",
    "............",
  ],
  flakes: [
    "....DDDD....",
    "...DyyyyD...",
    "...DyyyyD...",
    "...DDDDDD...",
    "...DRRRRD...",
    "...DRWWRD...",
    "...DRWWRD...",
    "...DRRRRD...",
    "...DRRRRD...",
    "...DDDDDD...",
    "............",
    "............",
  ],
  conditioner: [
    ".....DD.....",
    ".....DD.....",
    "....DDDD....",
    "....DLLD....",
    "...DLLLLD...",
    "...DLBBLD...",
    "...DBBBBD...",
    "...DBBBBD...",
    "...DBBBBD...",
    "...DDDDDD...",
    "............",
    "............",
  ],
  bacteria: [
    ".....DD.....",
    ".....DD.....",
    "....DDDD....",
    "....DLLD....",
    "...DLLLLD...",
    "...DLGgLD...",
    "...DgGggD...",
    "...DggGgD...",
    "...DgggGD...",
    "...DDDDDD...",
    "............",
    "............",
  ],
  thermometer: [
    ".....LL.....",
    "....LWWL....",
    "....LWRL....",
    "....LWRL....",
    "....LWRL....",
    "....LWRL....",
    "....LWRL....",
    "....LWRL....",
    "...LRRRRL...",
    "...LRRRRL...",
    "....LRRL....",
    ".....LL.....",
  ],
  testKit: [
    "............",
    ".LLL.LLL.LLL",
    ".LWL.LWL.LWL",
    ".LWL.LWL.LWL",
    ".LyL.LgL.LbL",
    ".LyL.LgL.LbL",
    ".LyL.LgL.LbL",
    ".LLL.LLL.LLL",
    ".DDDDDDDDDD.",
    ".DDDDDDDDDD.",
    "............",
    "............",
  ],
  ichMed: [
    "....DDDD....",
    "....DDDD....",
    "...DWWWWD...",
    "...DWWWWD...",
    "...DWRRWD...",
    "...DRRRRD...",
    "...DRRRRD...",
    "...DWRRWD...",
    "...DWWWWD...",
    "...DDDDDD...",
    "............",
    "............",
  ],
  finrotMed: [
    "....DDDD....",
    "....DDDD....",
    "...DWWWWD...",
    "...DWWWWD...",
    "...DWggWD...",
    "...DggggD...",
    "...DggggD...",
    "...DWggWD...",
    "...DWWWWD...",
    "...DDDDDD...",
    "............",
    "............",
  ],
  decal: [
    "DDDDDDDDDDDD",
    "D..........D",
    "D..........D",
    "D..........D",
    "D..........D",
    "D..........D",
    "D..........D",
    "D..........D",
    "D..........D",
    "D..........D",
    "D..........D",
    "DDDDDDDDDDDD",
  ],
};

export function shopIcon(name: string): HTMLElement {
  const rows = SHOP_ICONS[name] ?? SHOP_ICONS.decal;
  return slot(pixelSvg(rows), rows[0].length, rows.length);
}

/** A sprite drawn once to a tiny canvas; the browser upscales it crisply. */
export function spriteIcon(sp: Sprite): HTMLElement {
  const c = document.createElement("canvas");
  c.width = sp.w;
  c.height = sp.h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(sp.w, sp.h);
  new Uint32Array(img.data.buffer).set(sp.px);
  ctx.putImageData(img, 0, 0);
  c.className = "sprite";
  return slot(c, sp.w, sp.h);
}

/** Fixed 18×14 box (in tank pixels) so rows line up; big sprites shrink to fit. */
function slot(node: Element, w: number, h: number): HTMLElement {
  const f = Math.min(1, 18 / w, 14 / h);
  const wrap = document.createElement("div");
  wrap.className = "shop-icon";
  (node as HTMLElement).style.width = `calc(${(w * f).toFixed(2)}px * var(--s))`;
  (node as HTMLElement).style.height = `calc(${(h * f).toFixed(2)}px * var(--s))`;
  wrap.append(node);
  return wrap;
}
