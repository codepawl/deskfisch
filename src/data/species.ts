import { frames, type Sprite } from "../engine/sprite";

export interface Species {
  id: string;
  name: string;
  /** Body sprite frames, facing right. Tail animation cycles through them. */
  frames: Sprite[];
  /** Cruise speed in px/s. */
  speed: number;
  /** Preferred depth band as fraction of water height (0 top .. 1 bottom). */
  depth: [number, number];
  tempRange: readonly [number, number];
  phRange: readonly [number, number];
  /** Schooling species stress below this many of their kind. */
  minGroup: number;
  /** Waste output relative to a standard small fish. */
  bioload: number;
  price: number;
  lifespanDays: number;
}

export const SPECIES: Record<string, Species> = {
  neon: {
    id: "neon",
    name: "Neon tetra",
    speed: 22,
    depth: [0.3, 0.8],
    tempRange: [22, 27],
    phRange: [6.0, 7.5],
    minGroup: 6,
    bioload: 0.5,
    price: 8,
    lifespanDays: 365 * 5,
    frames: frames(
      [
        "......BBBBBBB....",
        "D....BBBBBBBBBB..",
        "DD..ccccccccccKB.",
        ".DDDLccccccccccWW",
        "..DDLrrrrrrrrLLW.",
        "D.D..rrrrrrrLL...",
        "DD....DD.DD......",
      ],
      [
        "D.....BBBBBBB....",
        "DD...BBBBBBBBBB..",
        ".DD.ccccccccccKB.",
        "..DDLccccccccccWW",
        ".DDDLrrrrrrrrLLW.",
        "DD...rrrrrrrLL...",
        "......DD.DD......",
      ],
    ),
  },
  guppy: {
    id: "guppy",
    name: "Guppy",
    speed: 18,
    depth: [0.1, 0.6],
    tempRange: [22, 28],
    phRange: [6.8, 8.0],
    minGroup: 3,
    bioload: 0.8,
    price: 10,
    lifespanDays: 365 * 2,
    frames: frames(
      [
        "....yy...........",
        "..yyRRy..........",
        ".yRRRRyyBBBB.....",
        "yRRPRRyBBBBBBBK..",
        "yRRRRRyyBBBBBBBWW",
        "yRRPRRyyyBBBBBB..",
        ".yRRRRyyyyyyy....",
        "..yyRRy..yy......",
        "....yy...........",
      ],
      [
        "..yy.............",
        ".yRRyy...........",
        "yRRRRyyyBBBB.....",
        "yRPRRRyBBBBBBBK..",
        "yRRRRRyyBBBBBBBWW",
        "yRPRRRyyyBBBBBB..",
        "yRRRRyyyyyyyy....",
        ".yRRyy.....yy....",
        "..yy.............",
      ],
    ),
  },
  cory: {
    id: "cory",
    name: "Corydoras",
    speed: 14,
    depth: [0.85, 1],
    tempRange: [22, 26],
    phRange: [6.0, 7.8],
    minGroup: 4,
    bioload: 1.0,
    price: 14,
    lifespanDays: 365 * 8,
    frames: frames(
      [
        ".......SSSS.....",
        ".....SSsssSSS...",
        "D...SsssssssSSK.",
        "DD.SssdsdsdssSSW",
        "DDDSsdsdsdsdsSS.",
        ".D.SSSsssssSSW..",
        "...S..SS.SS.W...",
      ],
      [
        "D......SSSS.....",
        "DD...SSsssSSS...",
        ".D..SsssssssSSK.",
        "DDDSssdsdsdssSSW",
        "DD.SsdsdsdsdsSS.",
        "D..SSSsssssSSW..",
        "...S.SS..SS.W...",
      ],
    ),
  },
};
