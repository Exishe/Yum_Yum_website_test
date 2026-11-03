import { expect, test } from "@playwright/test";

/* The playful bits: the hero mascot and carrying donuts into the gift box. */

test("the hero donut says hello and answers", async ({ page }) => {
  await page.goto("/en");
  const hello = page.getByRole("button", { name: "Say hello to our donut" });
  await hello.click();
  const bubble = page.getByRole("dialog", { name: /YUM-YUM donut/ });
  await expect(bubble).toBeVisible();
  await bubble.getByRole("button", { name: "Not yet" }).click();
  await expect(bubble.getByRole("link", { name: "See the menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bubble).toBeHidden();
});

test("a donut can be carried into a chosen place of the box", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "mouse drag; the phone path is a long press");
  await page.goto("/en/gifts");
  await page.locator("#box").scrollIntoViewIfNeeded();
  const places = page.locator("#box ol[aria-label] li");
  const donut = page.locator("#box ul li button").first();
  const from = (await donut.boundingBox())!;
  const to = (await places.nth(4).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.width / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();
  await expect(places.nth(4)).not.toHaveAttribute("data-free", "1");
  await expect(places.nth(0)).toHaveAttribute("data-free", "1");
  // A plain click still fills the first free place.
  await donut.click();
  await expect(places.nth(0)).not.toHaveAttribute("data-free", "1");
});
