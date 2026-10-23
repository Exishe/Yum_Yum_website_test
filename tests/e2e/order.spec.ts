import { expect, test, type Page } from "@playwright/test";

async function dismissCookies(page: Page) {
  await page.evaluate(() => localStorage.setItem("yy-consent-v1", "essential"));
}

/** A different valid phone per test so the per-phone limit is not hit. */
const phone = () => `+374 94 ${String(Math.floor(100000 + Math.random() * 899999)).replace(/(\d{2})(\d{2})(\d{2})/, "$1 $2 $3")}`;

for (const locale of ["hy", "ru", "en"] as const) {
  test(`places a pickup order in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/menu?category=donuts`);
    await dismissCookies(page);
    await page.reload();
    const add = page.locator("#menu-panel li button[aria-label]").first();
    await add.click();
    await expect(page.locator("header button[aria-label*='1']")).toBeVisible();

    await page.goto(`/${locale}/checkout`);
    await page.locator("input[name='name']").fill("Test Ani");
    await page.locator("input[name='phone']").fill(phone());
    await page.locator("input[name='consent']").check();
    await page.locator("#checkout-form button[type='submit']").click();

    await page.waitForURL(/\/order\/[A-Za-z0-9_-]+\?new=1/);
    await expect(page.locator("h1")).toContainText("#");
  });
}

test("delivery needs a district and shows the fee", async ({ page }) => {
  await page.goto("/en/menu?category=gifts");
  await dismissCookies(page);
  await page.reload();
  await page.getByRole("button", { name: /Add Donut bouquet N3/ }).click();
  await page.getByLabel("Messages on the donuts").fill("Happy birthday\nAni");
  await page.getByRole("button", { name: /Add to order/ }).click();
  await page.goto("/en/checkout");
  await page.getByText("Delivery", { exact: true }).click();
  await page.locator("input[name='name']").fill("Test Delivery");
  await page.locator("input[name='phone']").fill(phone());
  await page.locator("input[name='consent']").check();
  await page.locator("#checkout-form button[type='submit']").click();
  await expect(page.getByText("Please choose a district.")).toBeVisible();
  await page.locator("select[name='district']").selectOption("kentron");
  await page.locator("input[name='address.street']").fill("Abovyan");
  await page.locator("input[name='address.building']").fill("25");
  await expect(page.getByText("Tomorrow", { exact: true })).toBeVisible();
  await page.locator("#checkout-form button[type='submit']").click();
  await page.waitForURL(/\/order\//);
  await expect(page.getByText("Delivery to Abovyan 25")).toBeVisible();
});
