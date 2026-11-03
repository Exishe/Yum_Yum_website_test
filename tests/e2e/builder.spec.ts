import { expect, test, type Page } from "@playwright/test";

/*
 * The 3D donut builder: every flavour, topping and packaging, no errors,
 * the scene keeps drawing, and it comes back after the GPU is taken away.
 * With ?debug=1 the builder prints its engine stats, which the test reads.
 */

const section = (page: Page) => page.locator("section[aria-labelledby=build-title]");
const canvas = (page: Page) => section(page).locator("canvas");
const panelButtons = (page: Page) => page.locator("#build-panel button[aria-pressed]");

async function openBuilder(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/hy?debug=1");
  await canvas(page).scrollIntoViewIfNeeded();
  // Ready with WebGL, or the photo fallback without it; both are valid.
  await expect
    .poll(
      async () =>
        (await canvas(page).getAttribute("class"))?.includes("opacity-100") ||
        (await section(page).locator("p.text-center").count()) > 0,
      { timeout: 45_000 },
    )
    .toBeTruthy();
  const ready = (await canvas(page).getAttribute("class"))?.includes("opacity-100") ?? false;
  return { errors, ready };
}

const draws = async (page: Page) => {
  const text = (await page.locator("section[aria-labelledby=build-title] pre").textContent()) ?? "";
  return Number(text.match(/(\d+) draws/)?.[1] ?? 0);
};

test("every flavour, topping and packaging works", async ({ page }) => {
  test.setTimeout(180_000);
  const { errors, ready } = await openBuilder(page);
  const tabs = page.locator("[id^=build-tab-]");

  await tabs.nth(0).click();
  const flavours = await panelButtons(page).count();
  expect(flavours).toBeGreaterThanOrEqual(8);
  for (let i = 0; i < flavours; i++) {
    await panelButtons(page).nth(i).click();
    await expect(panelButtons(page).nth(i)).toHaveAttribute("aria-pressed", "true");
  }

  await tabs.nth(1).click();
  const toppings = await panelButtons(page).count();
  for (let i = 0; i < toppings; i++) {
    const b = panelButtons(page).nth(i);
    const before = await b.getAttribute("aria-pressed");
    await b.click();
    await expect(b).not.toHaveAttribute("aria-pressed", before ?? "");
  }

  await tabs.nth(2).click();
  const packs = await panelButtons(page).count();
  expect(packs).toBe(3);
  for (let i = 0; i < packs; i++) {
    await panelButtons(page).nth(i).click();
    await expect(panelButtons(page).nth(i)).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(400);
  }

  // The closest real product can always be added to the basket.
  await expect(section(page).getByRole("button", { name: /֏/ })).toBeVisible();

  if (ready) await expect.poll(() => draws(page), { timeout: 20_000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("the scene comes back after the GPU context is lost", async ({ page }) => {
  test.setTimeout(120_000);
  const { errors, ready } = await openBuilder(page);
  test.skip(!ready, "no WebGL in this browser");

  await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>(
      "section[aria-labelledby=build-title] canvas",
    )!;
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext;
    const ext = gl.getExtension("WEBGL_lose_context")!;
    ext.loseContext();
    setTimeout(() => ext.restoreContext(), 800);
  });
  await expect(canvas(page)).toHaveClass(/opacity-0/, { timeout: 5_000 });
  await expect(canvas(page)).toHaveClass(/opacity-100/, { timeout: 45_000 });
  await panelButtons(page).nth(2).click();
  await expect.poll(() => draws(page), { timeout: 20_000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
