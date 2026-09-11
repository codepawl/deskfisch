// Records a ~35 s showcase of the browser build with Playwright driving system Chrome.
// Needs `pnpm dev` on :1420. Output: press/showcase.webm (convert with scripts/showcase.sh).
import { chromium } from "playwright";
import { mkdirSync, renameSync, readdirSync } from "node:fs";

const OUT = process.argv[2] ?? "press";
const W = 1536, H = 960; // 4× the 384×240 tank
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: W, height: H } },
});
const page = await ctx.newPage();
await page.goto("http://localhost:1420/?scene=stocked");
await page.waitForSelector("canvas#screen");
const tool = (name) => page.locator(`button.tool[data-tool="${name}"]`);
const btn = (label) => page.locator("button.tool", { hasText: label }).first();
const rest = (ms) => page.waitForTimeout(ms);

// Tank pixel → screen. The canvas fills the 1536×960 window at 4×; the stage centres it.
const box = await page.locator("canvas#screen").boundingBox();
const at = (x, y) => ({ x: box.x + (x / 384) * box.width, y: box.y + (y / 240) * box.height });

await rest(3500);                                   // just swimming

// Feed: three pinches across the surface.
await tool("feed").click();
for (const x of [90, 190, 290]) { const p = at(x, 40); await page.mouse.click(p.x, p.y); await rest(700); }
await tool("feed").click();
await rest(5000);

// Knock on the glass: fish scatter. Upper-left water is usually empty; Escape closes
// the inspect card in case a fish was under the pointer.
{ const p = at(40, 60); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up(); }
await rest(150);
await page.keyboard.press("Escape");
await rest(3500);

// Rest the pointer on the glass: curious fish drift over and nip.
{ const p = at(120, 110); await page.mouse.move(p.x, p.y, { steps: 20 }); }
await rest(6000);
await page.mouse.move(10, 10, { steps: 10 });

// Shop with item pictures.
await btn("Shop").click();
await rest(3500);
await page.keyboard.press("Escape");
await rest(1000);

// Chill mode: every control hides.
await btn("Chill").click();
await rest(5000);

await ctx.close();
await browser.close();
const webm = readdirSync(OUT).find((f) => f.endsWith(".webm") && f !== "showcase.webm");
renameSync(`${OUT}/${webm}`, `${OUT}/showcase.webm`);
console.log(`${OUT}/showcase.webm`);
