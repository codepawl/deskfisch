// Renders the store art from public/cover.html over the live stocked tank. Needs `pnpm dev`.
import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true });
const shots = [
  ["press/itch-cover-630x500.png", "w=630&h=500&s=3&ox=261&oy=100&p=6&logo=8&lift=20"],
  ["press/itch-banner-1496x420.png", "w=1496&h=420&s=4&ox=24&oy=200&p=8&logo=10&tag=0"],
  ["site/og.png", "w=1200&h=630&s=4&ox=168&oy=100&p=8&logo=11"],
];
for (const [out, qs] of shots) {
  const [w, h] = [/w=(\d+)/, /h=(\d+)/].map((r) => +qs.match(r)[1]);
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto("http://localhost:1420/cover.html?" + qs);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: out });
  await page.close();
  console.log(out);
}
await browser.close();
