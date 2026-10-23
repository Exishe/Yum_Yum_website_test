// Usage: node scripts/screenshot.mjs <url> <out.png> [width] [fullPage]
import { chromium } from "@playwright/test";

const [url, out, width = "1440", full = "1"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(width) < 600 ? 844 : 900 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "*{animation-play-state:paused!important}" });
// Scroll through so lazy images load.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 80));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: full === "1" });
if (errors.length) console.log("CONSOLE ERRORS:\n" + errors.join("\n"));
await browser.close();
