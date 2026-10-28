import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const put = vi.fn(async (name: string) => ({
  url: `https://abc.public.blob.vercel-storage.com/${name}`,
}));
vi.mock("@vercel/blob", () => ({ put }));

async function photo() {
  const png = await sharp({
    create: { width: 40, height: 30, channels: 3, background: "#de1281" },
  })
    .png()
    .toBuffer();
  return new File([new Uint8Array(png)], "donut.png", { type: "image/png" });
}

describe("saveImage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    put.mockClear();
  });

  it("stores the re-encoded photo in Vercel Blob when a store is connected", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_test");
    const { saveImage } = await import("@/lib/storage");
    const url = await saveImage(await photo(), "products");

    expect(put).toHaveBeenCalledOnce();
    const [name, body, opts] = put.mock.calls[0] as unknown as [string, Buffer, object];
    expect(name).toMatch(/^products\/\d+-[0-9a-f]{12}\.webp$/);
    expect((await sharp(body).metadata()).format).toBe("webp");
    expect(opts).toMatchObject({ access: "public", contentType: "image/webp" });
    expect(url).toBe(`https://abc.public.blob.vercel-storage.com/${name}`);
  });

  it("refuses to upload on Vercel without a Blob store", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    const { saveImage } = await import("@/lib/storage");
    await expect(saveImage(await photo(), "products")).rejects.toThrow(/Vercel Blob/);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects files that are not photos", async () => {
    const { saveImage } = await import("@/lib/storage");
    const text = new File(["hello"], "a.txt", { type: "text/plain" });
    await expect(saveImage(text, "products")).rejects.toThrow(/JPEG, PNG/);
  });
});
