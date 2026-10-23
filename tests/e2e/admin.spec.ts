import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL ?? "admin@yumyum.local";
const password = process.env.E2E_ADMIN_PASSWORD ?? "donut-give-up-2026";

test.describe.configure({ mode: "serial" });

test("admin pages need a sign-in", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login/);
  const res = await page.request.get("/admin/export");
  expect(res.url()).toContain("/admin/login");
});

test("staff can manage an order and a price", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "one run is enough");
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: /Hello/ })).toBeVisible();

  // Orders: newest order, set to confirmed.
  await page.goto("/admin/orders");
  await page.locator("tbody a").first().click();
  await page.getByRole("radio", { name: "Confirmed", exact: true }).check();
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Status updated.")).toBeVisible();

  // The customer sees the new status.
  const customerHref = await page.getByRole("link", { name: /Customer view/ }).getAttribute("href");
  const customer = await page.context().newPage();
  await customer.goto(customerHref!);
  await expect(customer.locator("[aria-current='step']")).toBeVisible();

  // Prices: change one and see it on the website.
  await page.goto("/admin/products?c=1");
  const row = page.locator("li", { hasText: "Lemon" }).first();
  await row.locator("input[name='priceAmd']").fill("650");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await customer.goto("/en/menu?category=donuts");
  await expect(customer.locator("#menu-panel li", { hasText: "Lemon" })).toContainText("650");

  // Put it back.
  await page.goto("/admin/products?c=1");
  const again = page.locator("li", { hasText: "Lemon" }).first();
  await again.locator("input[name='priceAmd']").fill("600");
  await again.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // Audit log records it.
  await page.goto("/admin/audit");
  await expect(page.locator("tbody tr").first()).toContainText("product");
});
