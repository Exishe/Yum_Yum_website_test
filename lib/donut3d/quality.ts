/*
 * How much the 3D donut may ask of this device. The graphics chip decides,
 * not the processor: detect-gpu matches the GPU's name against measured
 * benchmarks (served from /gpu-benchmarks, so nothing leaves the site). The
 * engine then keeps checking its own frame times and adjusts the resolution.
 */
export type Quality = "high" | "medium" | "low";

export type QualityInfo = {
  quality: Quality;
  /** detect-gpu tier 0–3, or -1 when it could not tell. */
  tier: number;
  gpu: string;
};

function guess(phone: boolean): QualityInfo {
  // Only when the GPU could not be identified. Safari rounds the core count
  // down and many browsers hide memory, so only clearly small numbers count.
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
  return { quality: small ? "low" : phone ? "medium" : "high", tier: -1, gpu: "unknown" };
}

export async function detectQuality(phone: boolean): Promise<QualityInfo> {
  try {
    const { getGPUTier } = await import("detect-gpu");
    const result = await Promise.race([
      getGPUTier({ benchmarksURL: "/gpu-benchmarks" }),
      new Promise<null>((res) => setTimeout(() => res(null), 2500)),
    ]);
    if (!result || result.type === "FALLBACK" || result.type === "WEBGL_UNSUPPORTED")
      return guess(phone);
    const tier = result.tier;
    const quality: Quality = tier >= 3 ? "high" : tier === 2 ? "medium" : "low";
    return { quality, tier, gpu: result.gpu ?? "unknown" };
  } catch {
    return guess(phone);
  }
}
