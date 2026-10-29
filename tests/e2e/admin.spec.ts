import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL ?? "director";
const password = process.env.E2E_ADMIN_PASSWORD ?? "donut-give-up-2026";

test.describe.configure({ mode: "serial" });

/** Fills the real checkout with one donut for pickup and presses "Place order". */
async function submitPickupOrder(page: Page, phone: string) {
  await page.goto("/en/menu?category=donuts");
  await page.evaluate(() => localStorage.setItem("yy-consent-v1", "essential"));
  await page.reload();
  await page.locator("#menu-panel li button[aria-label]").first().click();
  await page.goto("/en/checkout");
  await page.locator("input[name='name']").fill("Test Admin");
  await page.locator("input[name='phone']").fill(phone);
  await page.locator("input[name='consent']").check();
  await page.locator("#checkout-form button[type='submit']").click();
}

/** One pickup order through the real checkout, so the admin has something to manage. */
async function placePickupOrder(page: Page, phone = "+374 94 55 66 77") {
  await submitPickupOrder(page, phone);
  await page.waitForURL(/\/order\/[A-Za-z0-9_-]+\?new=1/);
  await page.close();
}

/** Signs in. The panel opens in Armenian; the tests switch it to English first. */
async function signIn(page: Page) {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Աշխատակիցների մուտք" })).toBeVisible();
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.getByRole("heading", { name: "Staff sign-in" })).toBeVisible();
  await page.getByLabel("Login").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: /Hello/ })).toBeVisible();
}

test("staff accounts use a login and a password the admin sets", async ({
  page,
  browser,
}, info) => {
  test.skip(info.project.name !== "desktop", "one run is enough");
  await signIn(page);
  const login = `anna${Date.now() % 100000}`;
  await page.goto("/admin/users");
  await page.locator("form input[name='name']").fill("Anna");
  await page.locator("form input[name='login']").fill(login);
  await page.getByLabel("First password").fill("donut-first-2026");
  await page.getByRole("button", { name: "Create user" }).click();
  await expect(page.getByText(`${login} can now sign in with the password you set.`)).toBeVisible();

  // The new person signs in and must pick their own password first.
  const ctx = await browser.newContext();
  const anna = await ctx.newPage();
  await anna.goto("/admin/login");
  await anna.getByLabel("Մուտքանուն").fill(login);
  await anna.getByLabel("Գաղտնաբառ").fill("donut-first-2026");
  await anna.getByRole("button", { name: "Մուտք" }).click();
  await expect(anna).toHaveURL(/\/admin\/account/);
  await expect(anna.getByRole("navigation").getByText("Պատվերներ")).toBeVisible();
  await ctx.close();
});

test("admin pages need a sign-in", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login/);
  const res = await page.request.get("/admin/export");
  expect(res.url()).toContain("/admin/login");
});

test("staff can manage an order and a price", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "one run is enough");
  await signIn(page);

  // Orders: newest order, set to confirmed. On a fresh database place one first.
  await page.goto("/admin/orders");
  if ((await page.locator("tbody a").count()) === 0) {
    await placePickupOrder(await page.context().newPage());
    await page.reload();
  }
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

test("new orders are confirmed by phone; a prank number gets blocked", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "one run is enough");
  page.on("dialog", (d) => d.accept());
  const n = String(Math.floor(100000 + Math.random() * 899999));
  const phone = `+374 93 ${n.slice(0, 2)} ${n.slice(2, 4)} ${n.slice(4)}`;
  await signIn(page);

  // A first order from this number: staff call, then confirm.
  await placePickupOrder(await page.context().newPage(), phone);
  await page.goto("/admin/orders");
  await page.locator("tbody a").first().click();
  await expect(page.getByText("Call the customer before preparing")).toBeVisible();
  await expect(page.getByText("First order from this number.")).toBeVisible();
  await page.getByRole("button", { name: "Confirmed by phone" }).click();
  await expect(page.getByText("Confirmed. Prepare the order.")).toBeVisible();
  await expect(page.getByText("Call the customer before preparing")).toHaveCount(0);

  // The next order turns out to be a prank: cancel it and block the number.
  await placePickupOrder(await page.context().newPage(), phone);
  await page.goto("/admin/orders");
  await page.locator("tbody a").first().click();
  await expect(page.getByText(/Earlier orders from this number:\s*1/)).toBeVisible();
  await page.getByRole("button", { name: "Fake order: cancel" }).click();
  await expect(page.getByText(/Order cancelled\. If it was a prank/)).toBeVisible();
  // Cancelling alone never blocks; blocking is a separate, deliberate step.
  await page.getByRole("button", { name: "Block this number" }).click();
  await expect(page.getByText("Number blocked. It can no longer order online.")).toBeVisible();

  // The blocked number cannot order online and is told to call instead.
  const customer = await page.context().newPage();
  await submitPickupOrder(customer, phone);
  await expect(customer.getByText("We couldn't take this order online")).toBeVisible();
  await expect(customer).toHaveURL(/\/checkout/);
  await customer.close();

  // Unblocked, it can order again.
  await page.goto("/admin/blocked");
  await page.locator("li", { hasText: phone }).getByRole("button", { name: "Unblock" }).click();
  await expect(page.getByText("Number unblocked.")).toBeVisible();
  await placePickupOrder(await page.context().newPage(), phone);
});
