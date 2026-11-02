import { expect, test } from "@playwright/test";
import { DEMO } from "../../lib/demo-config";

test.skip(!DEMO.enabled, "the concept-demo settings are switched off");

test("phone: the Wiymood badge folds into a pill and opens again", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "on a computer the badge starts as a pill");
  await page.goto("/ru");
  const badge = page.locator("aside[data-demo-badge]");
  await expect(badge).toContainText(`команда ${DEMO.team}`);
  await expect(badge.getByRole("link")).toHaveAttribute("href", DEMO.telegram);

  await badge.getByRole("button").click();
  await expect(badge).toBeHidden();
  await page.locator("button[data-demo-open]").click();
  await expect(badge).toBeVisible();
});

test("computer: the badge is a pill that opens on hover", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "phones show the badge open");
  await page.goto("/ru");
  const badge = page.locator("aside[data-demo-badge]");
  const pill = page.locator("button[data-demo-open]");
  await expect(pill).toBeVisible();
  await expect(badge).toBeHidden();
  await pill.hover();
  await expect(badge).toBeVisible();
  await expect(badge.getByRole("link")).toHaveAttribute("href", DEMO.telegram);
  await page.mouse.move(10, 10);
  await expect(badge).toBeHidden();
});

test("the demo stays out of search engines", async ({ page, request }) => {
  await page.goto("/hy");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
});
