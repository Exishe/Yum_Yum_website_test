/**
 * Product photos with the white studio background removed (generated once
 * from the buy.am photos into public/images/source/buyam-cut). Used where a
 * donut sits on a coloured surface, such as the gift box.
 */
const CUT = new Set([
  "donut-american-flag",
  "donut-banana-nutella",
  "donut-blue-bali-rainbow",
  "donut-bubble-rainbow",
  "donut-caramel-latte",
  "donut-caramel",
  "donut-chocolate-rainbow",
  "donut-chocolate",
  "donut-frowny",
  "donut-kinder-bueno",
  "donut-lemon",
  "donut-lotus",
  "donut-nutella",
  "donut-oreo",
  "donut-peach-rainbow",
  "donut-pistachio-king",
  "donut-strawberry-rainbow",
  "donut-white-chocolate",
  "long-john-bavarian-chocolate",
  "long-john-chocolate-caramel",
  "yum-donut-bavarian-caramel",
  "yum-donut-bavarian-chocolate",
  "yum-donut-cherry",
  "yum-donut-chocolate-caramel",
  "yum-donut-double-chocolate",
  "yum-donut-white-chocolate-strawberry",
]);

/** The cut-out version of a product photo, or the photo itself when there is none. */
export function cutout(src: string | null | undefined): string | null {
  if (!src) return null;
  const m = src.match(/^\/images\/source\/buyam\/([a-z0-9-]+)\.(?:jpg|webp|png)$/);
  return m && CUT.has(m[1]!) ? `/images/source/buyam-cut/${m[1]}.webp` : src;
}

/** The product's slug from its photo, for the box helper's lines. */
export function slugOfPhoto(src: string | null | undefined): string | null {
  return src?.match(/\/([a-z0-9-]+)\.(?:jpg|webp|png)$/)?.[1] ?? null;
}
