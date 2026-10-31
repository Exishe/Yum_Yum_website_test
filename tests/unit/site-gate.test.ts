import { afterEach, describe, expect, it, vi } from "vitest";
import { PREVIEW_BOTS, passwordMatches, safeNext, siteGateToken } from "@/lib/site-gate";

describe("site password", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts only the set password and never stores it in the cookie", () => {
    vi.stubEnv("SITE_PASSWORD", "YumYum2026");
    expect(passwordMatches("YumYum2026")).toBe(true);
    expect(passwordMatches("yumyum2026")).toBe(false);
    expect(passwordMatches("")).toBe(false);
    expect(siteGateToken()).not.toContain("YumYum2026");
  });

  it("sends people back only within the site", () => {
    expect(safeNext("/hy/menu?x=1")).toBe("/hy/menu?x=1");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext(undefined)).toBe("/");
  });

  it("lets messenger link previews through", () => {
    expect(PREVIEW_BOTS.test("TelegramBot (like TwitterBot)")).toBe(true);
    expect(PREVIEW_BOTS.test("WhatsApp/2.23")).toBe(true);
    expect(PREVIEW_BOTS.test("Mozilla/5.0 (iPhone)")).toBe(false);
  });
});
