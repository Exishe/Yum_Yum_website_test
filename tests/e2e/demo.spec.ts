import { expect, test } from "@playwright/test";
import { DEMO } from "../../lib/demo-config";

test.skip(!DEMO.enabled, "the concept-demo settings are switched off");

test("the Wiymood badge folds into a pill and opens again", async ({ page }) => {
  await page.goto("/ru");
  const badge = page.locator("aside[data-demo-badge]");
  await expect(badge).toContainText(`команда ${DEMO.team}`);
  await expect(badge.getByRole("link")).toHaveAttribute("href", DEMO.telegram);

  await badge.getByRole("button").click();
  await expect(badge).toBeHidden();
  await page.locator("button[data-demo-open]").click();
  await expect(badge).toBeVisible();
});

test("the demo stays out of search engines", async ({ page, request }) => {
  await page.goto("/hy");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
});
