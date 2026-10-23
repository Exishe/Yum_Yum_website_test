import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { env } from "./env";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Validates an uploaded photo, re-encodes it (which strips EXIF/GPS data and
 * anything that is not a picture) and stores it. Uses Supabase Storage when
 * configured, otherwise public/uploads for local development.
 */
export async function saveImage(file: File, folder: "products" | "shops" | "categories"): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error("Use a JPEG, PNG, WebP or AVIF photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("The photo is larger than 5 MB.");
  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  try {
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height || meta.width * meta.height > 50_000_000) throw new Error("bad size");
    output = await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("This file is not a readable photo.");
  }

  const name = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}.webp`;

  if (env.supabaseUrl && env.supabaseServiceKey) {
    const res = await fetch(`${env.supabaseUrl}/storage/v1/object/${env.storageBucket}/${name}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.supabaseServiceKey}`,
        "Content-Type": "image/webp",
        "Cache-Control": "31536000",
        "x-upsert": "false",
      },
      body: new Uint8Array(output),
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
    return `${env.supabaseUrl}/storage/v1/object/public/${env.storageBucket}/${name}`;
  }

  if (env.isProd && process.env.VERCEL) {
    throw new Error("Photo uploads need Supabase Storage. Set SUPABASE_SERVICE_ROLE_KEY.");
  }
  const dir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(process.cwd(), "public", "uploads", name), output);
  return `/uploads/${name}`;
}
