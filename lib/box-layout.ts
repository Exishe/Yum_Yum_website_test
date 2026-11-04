/*
 * How the places of a gift box are laid out, for a box of any size the admin
 * sets (6, 12, 18, 24 …): the number of columns, so rows come out even and the
 * box stays wider than tall, like a real donut box.
 */

/** The largest box the admin can create. */
export const MAX_BOX_SIZE = 48;

/**
 * Columns for a box of `size` places: the fewest columns, from 3 to 6, that
 * divide the box into full rows with no more rows than columns
 * (6 → 3×2, 12 → 4×3, 18 → 6×3, 24 → 6×4). Sizes with no such split
 * (7, 11, 13 …) get a near-square grid of at most 6 columns.
 */
export function boxColumns(size: number): number {
  const n = Math.max(1, Math.round(size));
  if (n <= 3) return n;
  for (let c = 3; c <= 6; c++) if (n % c === 0 && n / c <= c) return c;
  return Math.min(6, Math.ceil(Math.sqrt(n * 1.3)));
}
