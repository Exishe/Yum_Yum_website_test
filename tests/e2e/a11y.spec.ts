import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/* Automated accessibility check (axe) of the main pages, in Armenian. */
const pages = ["/hy", "/hy/menu", "/hy/nverner", "/hy/mijocarumner", "/hy/kap", "/hy/patver"];

for (const path of pages) {
  test(`no serious accessibility problems on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    // Scroll through once so every section has finished easing in.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      // The 3D canvas is decorative and aria-hidden; third-party captcha frames are not ours.
      .exclude("canvas")
      .exclude("iframe")
      .analyze();
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map(
        (v) =>
          `${v.id}: ${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 3)
            .join(" | ")}`,
      );
    expect(serious, serious.join("\n")).toEqual([]);
  });
}
