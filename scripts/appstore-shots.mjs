// App Store screenshots from the dev server: iPhone 6.7" (1290×2796) and iPad 12.9" (2048×2732).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2] ?? "press/appstore";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
const phone = { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" };
const ipad = { viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" };
const shots = [
  ["iphone-1-tank", phone, async () => {}],
  ["iphone-2-tall", phone, async (p) => { await p.evaluate(() => { window.fisch.settings.mobileView = "tall"; }); }],
  ["iphone-3-shop", phone, async (p) => { await p.locator("button.tool", { hasText: "Shop" }).first().tap(); }],
  ["iphone-4-water", phone, async (p) => { await p.locator("button.tool", { hasText: "Test water" }).first().tap(); }],
  ["iphone-5-fish", phone, async (p) => { await p.evaluate(() => { const f = window.fisch.fish.find((x) => x.alive); window.fisch.fish.forEach((x) => { x.x = Math.min(x.x, 300); }); }); await p.waitForTimeout(300); await p.evaluate(() => { const s = document.getElementById("screen").getBoundingClientRect(); const f = window.fisch.fish.find((x) => x.alive); window.__pt = [s.left + (f.x + 6) / 384 * s.width, s.top + (f.y + 3) / 240 * s.height]; }); const pt = await p.evaluate(() => window.__pt); await p.touchscreen.tap(pt[0], pt[1]); }],
  ["ipad-1-tank", ipad, async () => {}],
  ["ipad-2-shop", ipad, async (p) => { await p.locator("button.tool", { hasText: "Shop" }).first().tap(); }],
];
for (const [name, device, act] of shots) {
  const ctx = await browser.newContext(device);
  const page = await ctx.newPage();
  await page.goto("http://localhost:1420/?scene=stocked");
  await page.waitForSelector("canvas#screen");
  await page.waitForTimeout(3000);
  await act(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name);
  await ctx.close();
}
await browser.close();
