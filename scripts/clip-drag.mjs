// Records a short clip of the stocked tank: fish swimming, then one picked up,
// carried across the tank and let go. Needs `pnpm dev` on :1420.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "press";
const W = 1536, H = 960;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: W, height: H } } });
const page = await ctx.newPage();
await page.goto("http://localhost:1420/?scene=stocked");
await page.waitForSelector("canvas#screen");
const rest = (ms) => page.waitForTimeout(ms);
const box = await page.locator("canvas#screen").boundingBox();
const at = (x, y) => ({ x: box.x + (x / 384) * box.width, y: box.y + (y / 240) * box.height });
await rest(5000);
// Pick the fish nearest the middle of the water.
const f = await page.evaluate(() => {
  const s = window.fisch; let best = null, bd = 1e9;
  for (const x of s.fish) { if (!x.alive) continue; const d = Math.hypot(x.x - 190, x.y - 110); if (d < bd) { bd = d; best = { x: x.x + 6, y: x.y + 3 }; } }
  return best;
});
let p = at(f.x, f.y);
await page.mouse.move(p.x, p.y);
await rest(400);
await page.mouse.down();
// Carry it in a slow arc to the other side, then a quick flick.
const steps = 60;
for (let i = 1; i <= steps; i++) {
  const t = i / steps;
  const q = at(f.x + (300 - f.x) * t, f.y - Math.sin(t * Math.PI) * 60);
  await page.mouse.move(q.x, q.y);
  await rest(40);
}
await rest(600);
for (let i = 1; i <= 6; i++) { const q = at(300 - i * 12, f.y - Math.sin(Math.PI) * 60 + i * 4); await page.mouse.move(q.x, q.y); await rest(16); }
await page.mouse.up();
await rest(4500);
await ctx.close();
await browser.close();
