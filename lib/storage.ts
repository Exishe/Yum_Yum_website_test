import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { env } from "./env";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Local uploads (no Blob store), served by app/uploads/[...path]/route.ts. */
export const LOCAL_UPLOADS_DIR = join(process.cwd(), ".uploads");

/**
 * Validates an uploaded photo, re-encodes it (which strips EXIF/GPS data and
 * anything that is not a picture) and stores it. Uses Vercel Blob when
 * configured, otherwise .uploads/ for the local demo.
 */
export async function saveImage(
  file: File,
  folder: "products" | "shops" | "categories",
): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error("Use a JPEG, PNG, WebP or AVIF photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("The photo is larger than 5 MB.");
  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  try {
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height || meta.width * meta.height > 50_000_000)
      throw new Error("bad size");
    output = await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("This file is not a readable photo.");
  }

  const name = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}.webp`;

  if (env.blobToken) {
    const blob = await put(name, output, {
      access: "public",
      contentType: "image/webp",
      cacheControlMaxAge: 31536000,
      token: env.blobToken,
    });
    return blob.url;
  }

  if (env.isProd && process.env.VERCEL) {
    throw new Error("Photo uploads need Vercel Blob. Connect a Blob store to the project.");
  }
  await mkdir(join(LOCAL_UPLOADS_DIR, folder), { recursive: true });
  await writeFile(join(LOCAL_UPLOADS_DIR, name), output);
  return `/uploads/${name}`;
}
