#!/usr/bin/env node
/*
 * Portfolio screenshots of this site for freelance profiles, with the client's
 * brand, logos and contact details blurred.
 *
 *   1. Start the site (see the README: `pnpm demo`, or a production build).
 *   2. node scripts/portfolio-shots.mjs            (settings: portfolio-shots.config.json)
 *
 * Output: portfolio-shots/<description-slug>/ with, for every page,
 * <page>-desktop.png (1440×900), <page>-desktop-full.png and <page>-mobile.png
 * (390×844 at 3×), plus cover.png, overview.png, mobile-trio.png and project.md.
 * A shot is only saved after a check finds no hidden name left readable.
 * If Playwright's own Chromium is not installed, set "chromiumPath" in the
 * config or PORTFOLIO_CHROMIUM to a Chrome/Chromium binary.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = await import("@playwright/test"));
}

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const cfg = JSON.parse(fs.readFileSync(path.join(here, "portfolio-shots.config.json"), "utf8"));
const slug = (cfg.slug || cfg.description)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
const out = path.join(root, "portfolio-shots", slug);
fs.mkdirSync(out, { recursive: true });

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
};
const NO_MOTION = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (p) => new URL(p, cfg.url).toString();

// ---------- runs inside the page ----------

/** Blurs every hidden name, address, phone, email, logo and social link. Returns how many. */
function hideInPage(c) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const armenian = (s) => /[Ա-և]/.test(s);
  const parts = [
    ...c.hideTexts.map(esc),
    ...c.hideNames.map(
      (n) =>
        `(?<![\\p{L}\\p{N}])${esc(n)}${armenian(n) ? "[\\u0561-\\u0587]{0,3}" : ""}(?![\\p{L}])`,
    ),
  ].sort((a, b) => b.length - a.length);
  const EMAIL = "[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+";
  const PHONE = "(?<![\\d\\w])\\+?\\(?\\d[\\d\\s().-]{6,}\\d(?![\\d\\w])";
  const re = () => new RegExp(`${parts.join("|")}|${EMAIL}|${PHONE}`, "giu");
  const isPhoneish = (s) => /^[+\d\s().-]+$/.test(s);
  const realPhone = (s) => {
    const d = s.replace(/\D/g, "");
    return d.length >= 8 && d.length <= 15 && !/^\d{4}-\d{2}-\d{2}/.test(s.trim());
  };
  const hit = (text) => {
    for (const m of text.matchAll(re())) if (!isPhoneish(m[0]) || realPhone(m[0])) return true;
    return false;
  };
  // Links and image attributes hold IDs and sizes that look like phone numbers: names only there.
  const nameRe = new RegExp(parts.join("|"), "iu");
  const hitName = (text) => nameRe.test(text);
  const blur = (el, px) => {
    if (el.dataset.pfsBlur) return 0;
    el.dataset.pfsBlur = String(px);
    el.style.setProperty("filter", `blur(${px}px)`, "important");
    return 1;
  };
  let n = 0;

  // Overlays that are not part of the site: hidden by CSS, so a re-render cannot bring them back.
  if (!document.getElementById("pfs-hide") && c.hideSelectors.length) {
    const st = document.createElement("style");
    st.id = "pfs-hide";
    st.textContent = `${c.hideSelectors.join(",")}{display:none!important}`;
    document.head.append(st);
  }
  document.title = c.description;

  // Text: wrap each match in a blurred span.
  const nodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(t) {
      const p = t.parentElement;
      if (!p || p.closest("script,style,noscript,template,[data-pfs-blur]"))
        return NodeFilter.FILTER_REJECT;
      return hit(t.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const t of nodes) {
    // A span cannot go inside SVG text or an <option>: blur the drawing or the list instead.
    const p = t.parentElement;
    if (p.namespaceURI === "http://www.w3.org/2000/svg") {
      n += blur(p.closest("svg") || p, 10);
      continue;
    }
    if (p.closest("option,select")) {
      n += blur(p.closest("select") || p, 6);
      continue;
    }
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of t.data.matchAll(re())) {
      if (isPhoneish(m[0]) && !realPhone(m[0])) continue;
      frag.append(t.data.slice(last, m.index));
      const s = document.createElement("span");
      s.textContent = m[0];
      s.style.display = "inline-block";
      blur(s, 6);
      frag.append(s);
      last = m.index + m[0].length;
      n++;
    }
    frag.append(t.data.slice(last));
    t.replaceWith(frag);
  }

  // Attributes: visible ones blur their element, invisible ones are rewritten.
  for (const el of document.querySelectorAll("*")) {
    for (const a of ["placeholder", "value"]) {
      const v = a === "value" ? (el.matches("input,textarea") ? el.value : "") : el.getAttribute(a);
      if (v && hit(v)) n += blur(el, 6);
    }
    for (const a of ["alt", "title", "aria-label"]) {
      const v = el.getAttribute(a);
      if (v && hit(v)) el.setAttribute(a, v.replace(re(), "•••"));
    }
  }

  // Logos.
  const logoish = (el) =>
    ["src", "srcset", "alt", "class", "id", "aria-label", "href", "data-src"]
      .map((a) => (el.getAttribute(a) || "").toLowerCase())
      .some((v) => v.includes("logo") || (v && hitName(v)));
  for (const el of document.querySelectorAll("img,svg,picture,[role=img]")) {
    if (logoish(el) || (el.closest("a") && logoish(el.closest("a")))) n += blur(el, 10);
  }
  for (const a of document.querySelectorAll("header a[href], footer a[href]")) {
    const p = new URL(a.href, location.href);
    const home = p.origin === location.origin && /^\/([a-z]{2})?\/?$/.test(p.pathname);
    if (home && a.querySelector("img,svg,picture")) n += blur(a, 10);
  }
  for (const el of document.querySelectorAll("[style*='logo' i]")) n += blur(el, 10);

  // Contacts, socials, addresses, maps.
  const social =
    /instagram|facebook|fb\.com|tiktok|t\.me|telegram|wa\.me|whatsapp|viber|youtube|twitter|x\.com|linkedin|vk\.com|ok\.ru|maps\.google|google\.[a-z.]+\/maps|yandex\.[a-z]+\/maps|2gis|tripadvisor/i;
  for (const a of document.querySelectorAll("a[href]")) {
    const h = a.getAttribute("href") || "";
    if (/^(mailto|tel|sms):/i.test(h) || social.test(h) || hitName(h)) n += blur(a, 6);
  }
  for (const el of document.querySelectorAll("address")) n += blur(el, 6);
  for (const f of document.querySelectorAll("iframe")) if (/map/i.test(f.src)) n += blur(f, 10);
  return n;
}

/** Visible text or field values in which a hidden name is still readable. */
function leftoversInPage(c) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const armenian = (s) => /[Ա-և]/.test(s);
  const parts = [
    ...c.hideTexts.map(esc),
    ...c.hideNames.map(
      (n) =>
        `(?<![\\p{L}\\p{N}])${esc(n)}${armenian(n) ? "[\\u0561-\\u0587]{0,3}" : ""}(?![\\p{L}])`,
    ),
  ];
  const re = new RegExp(parts.join("|"), "iu");
  const blurred = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      if (e.dataset?.pfsBlur || /blur\(([4-9]|\d\d)/.test(getComputedStyle(e).filter)) return true;
    }
    return false;
  };
  const visible = (el) =>
    el.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) ?? true;
  const found = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    const p = t.parentElement;
    if (!p || p.closest("script,style,noscript,template")) continue;
    if (re.test(t.data) && visible(p) && !blurred(p)) {
      p.dataset.pfsLeft = "1";
      found.push(t.data.trim().slice(0, 80));
    }
  }
  for (const el of document.querySelectorAll("input,textarea")) {
    const v = `${el.value} ${el.placeholder}`;
    if (re.test(v) && visible(el) && !blurred(el)) {
      el.dataset.pfsLeft = "1";
      found.push(`[field] ${v.trim().slice(0, 80)}`);
    }
  }
  if (re.test(document.title)) found.push(`[title] ${document.title}`);
  return found;
}

function blurLeftoversInPage() {
  document.querySelectorAll("[data-pfs-left]").forEach((e) => {
    e.dataset.pfsBlur = "6";
    e.style.setProperty("filter", "blur(6px)", "important");
    delete e.dataset.pfsLeft;
  });
}

// ---------- page preparation ----------

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
}

async function closeConsent(page) {
  const banner = page.locator(
    "[role=dialog],[role=region],[role=alertdialog],[class*=cookie i],[id*=cookie i],[class*=consent i],[id*=consent i]",
  );
  const n = await banner.count();
  for (let i = 0; i < n; i++) {
    const b = banner.nth(i);
    if (!(await b.isVisible().catch(() => false))) continue;
    const text = (await b.innerText().catch(() => "")).toLowerCase();
    if (!/cookie|consent|privacy|gdpr|файлы|քուքի|cookie-ներ/.test(text)) continue;
    for (const label of [
      /only essential|necessary only|reject|decline|deny/i,
      /accept|allow|agree|got it|^ok$/i,
    ]) {
      const btn = b.getByRole("button", { name: label }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await sleep(300);
        break;
      }
    }
  }
}

async function loadEverything(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 300));
    scrollTo(0, 0);
  });
  await settle(page);
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((i) => !i.complete)
        .map((i) => new Promise((r) => ((i.onload = i.onerror = r), setTimeout(r, 5000)))),
    ),
  );
}

async function step(page, s) {
  if (s.goto) {
    await page.goto(url(s.goto), { waitUntil: "networkidle" });
    await closeConsent(page);
  }
  if (s.click) await page.locator(s.click).first().click();
  if (s.fill) await page.locator(s.fill[0]).first().fill(s.fill[1]);
  if (s.waitFor) await page.locator(s.waitFor).first().waitFor({ timeout: 10000 });
  await sleep(s.wait ?? 400);
}

async function openPage(browser, device, pg) {
  const ctx = await browser.newContext({ ...device, locale: "en-US", reducedMotion: "reduce" });
  if (Object.keys(cfg.localStorage || {}).length) {
    await ctx.addInitScript((items) => {
      for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v);
    }, cfg.localStorage);
  }
  if (pg.cookies?.length) await ctx.addCookies(pg.cookies.map((c) => ({ ...c, url: cfg.url })));
  const page = await ctx.newPage();
  await page.goto(url(pg.path), { waitUntil: "networkidle" });
  if (page.url().includes("/unlock") && cfg.sitePassword) {
    await page.locator("input[type=password]").fill(cfg.sitePassword);
    await Promise.all([page.waitForLoadState("networkidle"), page.keyboard.press("Enter")]);
  }
  if (pg.login) {
    const l = pg.login;
    await page.goto(url(l.path), { waitUntil: "networkidle" });
    await page.locator(`[name="${l.userField}"]`).fill(l.user);
    await page.locator(`[name="${l.passwordField}"]`).fill(l.password);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith(l.path), { timeout: 20000 }),
      page.locator(`[name="${l.passwordField}"]`).press("Enter"),
    ]);
  }
  await closeConsent(page);
  for (const s of pg.prepare || []) await step(page, s);
  await page.goto(url(pg.path), { waitUntil: "networkidle" });
  await settle(page);
  await closeConsent(page);
  await page.addStyleTag({ content: NO_MOTION });
  await loadEverything(page);
  if (pg.click) await step(page, { click: pg.click, waitFor: pg.waitFor, wait: 800 });
  return { ctx, page };
}

/** Hides, then checks; blurs whatever is still readable; refuses to continue if a name survives. */
async function ensureHidden(page, label) {
  for (let round = 0; round < 4; round++) {
    await page.evaluate(hideInPage, cfg);
    const left = await page.evaluate(leftoversInPage, cfg);
    if (!left.length) return;
    console.log(`  ${label}: still readable, blurring: ${left.slice(0, 3).join(" | ")}`);
    await page.evaluate(blurLeftoversInPage);
  }
  const left = await page.evaluate(leftoversInPage, cfg);
  if (left.length) throw new Error(`${label}: hidden names still readable: ${left.join(" | ")}`);
}

// ---------- composites ----------

const dataUrl = (file) =>
  `data:image/png;base64,${fs.readFileSync(path.join(out, file)).toString("base64")}`;
const BG = "#F4F2EE";
const SHADOW = "0 30px 70px rgba(30,20,10,.18),0 8px 22px rgba(30,20,10,.10)";

async function compose(browser, file, body) {
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.setContent(
    `<!doctype html><html><body style="margin:0;width:1600px;height:1200px;background:${BG};position:relative;overflow:hidden">${body}</body></html>`,
  );
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await page.screenshot({ path: path.join(out, file) });
  await ctx.close();
}
const shot = (file, css) =>
  `<img src="${dataUrl(file)}" style="position:absolute;object-fit:cover;object-position:top;box-shadow:${SHADOW};${css}">`;

async function composites(browser) {
  const { cover, overview, mobileTrio } = cfg;
  // Cover: desktop centred, a phone overlapping its bottom right corner.
  await compose(
    browser,
    "cover.png",
    shot(
      `${cover.desktop}-desktop.png`,
      "left:180px;top:212px;width:1240px;height:775px;border-radius:18px",
    ) +
      shot(
        `${cover.mobile}-mobile.png`,
        "right:110px;bottom:90px;width:300px;height:649px;border-radius:40px;border:7px solid #fff",
      ),
  );
  // Overview: 2×2, three desktop shots and one phone.
  const cells = [
    [100, 130],
    [880, 130],
    [100, 620],
    [880, 620],
  ];
  let html = overview.desktop
    .slice(0, 3)
    .map((p, i) =>
      shot(
        `${p}-desktop.png`,
        `left:${cells[i][0]}px;top:${cells[i][1]}px;width:720px;height:450px;border-radius:14px`,
      ),
    )
    .join("");
  html += shot(
    `${overview.mobile}-mobile.png`,
    `left:${cells[3][0] + 256}px;top:${cells[3][1] - 10}px;width:208px;height:450px;border-radius:26px;border:5px solid #fff`,
  );
  await compose(browser, "overview.png", html);
  // Three phones side by side.
  await compose(
    browser,
    "mobile-trio.png",
    mobileTrio
      .slice(0, 3)
      .map((p, i) =>
        shot(
          `${p}-mobile.png`,
          `left:${80 + i * 500}px;top:100px;width:440px;height:952px;border-radius:52px;border:8px solid #fff`,
        ),
      )
      .join(""),
  );
}

function writeProjectMd() {
  const files = fs
    .readdirSync(out)
    .filter((f) => f.endsWith(".png"))
    .sort();
  const md = `# ${cfg.description}

${cfg.about}

## Tech stack

${cfg.stack.map((s) => `- ${s}`).join("\n")}

## Images

${files.map((f) => `- ${f}`).join("\n")}
`;
  fs.writeFileSync(path.join(out, "project.md"), md);
}

// ---------- run ----------

const exe = cfg.chromiumPath || process.env.PORTFOLIO_CHROMIUM;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
try {
  for (const pg of cfg.pages) {
    console.log(`• ${pg.name}  ${pg.path}`);
    {
      const { ctx, page } = await openPage(browser, DESKTOP, pg);
      await ensureHidden(page, `${pg.name} desktop`);
      await page.evaluate(() => scrollTo(0, 0));
      await sleep(200);
      await ensureHidden(page, `${pg.name} desktop`);
      await page.screenshot({ path: path.join(out, `${pg.name}-desktop.png`) });
      await ensureHidden(page, `${pg.name} desktop-full`);
      await page.screenshot({
        path: path.join(out, `${pg.name}-desktop-full.png`),
        fullPage: true,
      });
      await ctx.close();
    }
    {
      const { ctx, page } = await openPage(browser, MOBILE, pg);
      await page.evaluate(() => scrollTo(0, 0));
      await sleep(200);
      await ensureHidden(page, `${pg.name} mobile`);
      await page.screenshot({ path: path.join(out, `${pg.name}-mobile.png`) });
      await ctx.close();
    }
  }
  await composites(browser);
  writeProjectMd();
} finally {
  await browser.close();
}
console.log(`\nDone: ${path.relative(root, out)}/`);
for (const f of fs.readdirSync(out).sort()) {
  console.log(
    `  ${f.padEnd(28)} ${(fs.statSync(path.join(out, f)).size / 1024).toFixed(0).padStart(6)} KB`,
  );
}
