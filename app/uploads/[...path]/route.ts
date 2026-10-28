import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { LOCAL_UPLOADS_DIR } from "@/lib/storage";

/*
 * Photos uploaded in the admin when no Vercel Blob store is connected (the
 * local demo). `next start` only serves files that were in public/ at build
 * time, so these are served from here instead.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const name = (await params).path.join("/");
  if (!/^(products|shops|categories)\/\d+-[0-9a-f]{12}\.webp$/.test(name)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const file = await readFile(join(LOCAL_UPLOADS_DIR, name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
