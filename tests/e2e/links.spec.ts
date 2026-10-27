import { expect, test } from "@playwright/test";

// Visits every internal link reachable from the main pages in all three
// languages and checks none of them is broken or a dead "#".
test("no broken internal links", async ({ page, request }, info) => {
  test.skip(info.project.name !== "desktop", "one run is enough");
  test.setTimeout(180_000);
  const start = [
    "/hy",
    "/ru",
    "/en",
    "/en/menu",
    "/ru/podarki",
    "/hy/khanutner",
    "/en/our-story",
    "/en/contact",
  ];
  const seen = new Set<string>();
  const broken: string[] = [];
  for (const path of start) {
    await page.goto(path);
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const href of hrefs) {
      expect(href, `dead link on ${path}`).not.toBe("#");
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      const url = href.split("#")[0]!;
      if (seen.has(url)) continue;
      seen.add(url);
      const res = await request.get(url, { maxRedirects: 3 });
      if (res.status() >= 400 && !url.startsWith("/admin"))
        broken.push(`${url} (${res.status()}) from ${path}`);
    }
  }
  expect(broken).toEqual([]);
  expect(seen.size).toBeGreaterThan(30);
});

test("security headers are sent", async ({ request }) => {
  const res = await request.get("/hy");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("nonce-");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("https upgrade only over https (Safari applies it to http://localhost too)", async ({
  request,
}) => {
  const plain = await request.get("/hy");
  expect(plain.headers()["content-security-policy"]).not.toContain("upgrade-insecure-requests");
  const behindHttps = await request.get("/hy", { headers: { "x-forwarded-proto": "https" } });
  expect(behindHttps.headers()["content-security-policy"]).toContain("upgrade-insecure-requests");
});

test("unknown order ids reveal nothing", async ({ page }) => {
  await page.goto("/en/order/AAAAAAAAAAAAAAAA");
  await expect(page.getByText("We couldn’t find this order")).toBeVisible();
});
