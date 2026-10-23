import "server-only";
import { imageManifest } from "./images.generated";

export type ImageInfo = { src: string; w: number; h: number; blur?: string };

/** Size and blur placeholder for a local photo; uploads fall back to a square. */
export function img(src: string | null | undefined): ImageInfo | null {
  if (!src) return null;
  const m = imageManifest[src];
  return m ? { src, w: m.w, h: m.h, blur: m.blur } : { src, w: 1200, h: 1200 };
}

export function imgOrThrow(src: string): ImageInfo {
  const info = img(src);
  if (!info) throw new Error(`Missing image ${src}`);
  return info;
}
