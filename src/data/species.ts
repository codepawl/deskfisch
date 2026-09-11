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
}

export const SPECIES: Record<string, Species> = {
  neon: {
    id: "neon",
    name: "Neon tetra",
    speed: 22,
    depth: [0.3, 0.8],
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
