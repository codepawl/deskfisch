// Phone-layout screenshots from the dev server: portrait and landscape, with a
// panel open. Also the base for App Store screenshots. Needs `pnpm dev`.
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2] ?? "press/mobile";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
const shots = [
  ["portrait", { ...devices["iPhone 14"] }, null],
  ["portrait-tall", { ...devices["iPhone 14"] }, "@tall"],
  ["portrait-shop", { ...devices["iPhone 14"] }, "Shop"],
  ["portrait-settings", { ...devices["iPhone 14"] }, "Settings"],
  ["landscape", { ...devices["iPhone 14 landscape"] }, null],
  ["landscape-stats", { ...devices["iPhone 14 landscape"] }, "Test water"],
  ["tablet", { ...devices["iPad Mini"] }, null],
];
for (const [name, device, panel] of shots) {
  const ctx = await browser.newContext(device);
  const page = await ctx.newPage();
  await page.goto("http://localhost:1420/?scene=stocked");
  await page.waitForSelector("canvas#screen");
  await page.waitForTimeout(2500);
  if (panel === "@tall") {
    await page.evaluate(() => { window.fisch.settings.mobileView = "tall"; });
    await page.waitForTimeout(400);
  } else if (panel) {
    await page.locator("button.tool", { hasText: panel }).first().tap();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name, await page.evaluate(() => document.documentElement.dataset.layout + " s=" + getComputedStyle(document.getElementById("overlay")).getPropertyValue("--s")));
  await ctx.close();
}
await browser.close();
