// Leak hunt in minutes: runs the browser build with ?stress=1 (uncapped fps, 10× sim),
// drives it like a restless player, and samples JS heap + DOM nodes every 30 s.
//   node scripts/stress.mjs [minutes=15]   (needs `pnpm dev` on :1420)
// A healthy run: heap flat after warm-up (± a few MB), node count constant.
import { chromium } from "playwright";

const minutes = Number(process.argv[2] ?? 15);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--disable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1152, height: 720 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
await page.goto("http://localhost:1420/?scene=stocked&stress=1");
await page.waitForSelector("canvas#screen");
await page.waitForTimeout(2000);

const box = await page.locator("canvas#screen").boundingBox();
const at = (x, y) => ({ x: box.x + (x / 384) * box.width, y: box.y + (y / 240) * box.height });
const btn = (label) => page.locator("button.tool", { hasText: label }).first();
const tool = (name) => page.locator(`button.tool[data-tool="${name}"]`);

const metrics = async () => {
  const m = (await cdp.send("Performance.getMetrics")).metrics;
  const g = (n) => m.find((x) => x.name === n)?.value ?? 0;
  const frames = await page.evaluate(() => performance.now());
  return { heapMB: +(g("JSHeapUsedSize") / 1048576).toFixed(1), nodes: g("Nodes"), listeners: g("JSEventListeners"), t: +(frames / 1000).toFixed(0) };
};

const start = Date.now();
const samples = [];
let i = 0;
console.log("t(s)\theapMB\tnodes\tlisteners");
while (Date.now() - start < minutes * 60_000) {
  // a restless player: feed, knock, hover, open and close every panel, poke settings
  if (await tool("feed").isEnabled()) { await tool("feed").click(); for (const x of [60, 200, 330]) { const p = at(x, 40); await page.mouse.click(p.x, p.y); } await tool("feed").click({ timeout: 1000 }).catch(() => {}); }
  { const p = at(40 + (i % 5) * 60, 80); await page.mouse.click(p.x, p.y); await page.keyboard.press("Escape"); }
  { const p = at(120, 110); await page.mouse.move(p.x, p.y, { steps: 5 }); }
  for (const label of ["Shop", "Change water", "Test water", "Guide", "Settings"]) { await btn(label).click(); await page.waitForTimeout(150); await page.keyboard.press("Escape"); }
  await btn("Chill").click(); await page.waitForTimeout(200); await page.keyboard.press("Escape");
  await tool("scrub").click(); { const p = at(200, 100); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 80, p.y + 40, { steps: 10 }); await page.mouse.up(); } await tool("scrub").click();
  i++;
  if (i % 6 === 0) { const s = await metrics(); samples.push(s); console.log(`${s.t}\t${s.heapMB}\t${s.nodes}\t${s.listeners}`); }
  await page.waitForTimeout(2500);
}
// force a GC before the final read so the number is what stays reachable
await cdp.send("HeapProfiler.collectGarbage");
const end = await metrics();
console.log(`end\t${end.heapMB}\t${end.nodes}\t${end.listeners}`);
const first = samples[1] ?? samples[0];
console.log(`\nheap ${first.heapMB} → ${end.heapMB} MB after GC, nodes ${first.nodes} → ${end.nodes}, listeners ${first.listeners} → ${end.listeners}`);
await browser.close();
