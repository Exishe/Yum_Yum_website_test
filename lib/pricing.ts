/*
 * Cart pricing. Pure functions, used by the browser to show totals and by the
 * server to compute the real price. The server never trusts prices sent by
 * the browser: it calls these functions with fresh data from the database.
 */
import type { MenuProduct, PublicZone } from "./catalog";

export type CartLineInput = {
  productId: number;
  quantity: number;
  optionIds?: number[];
  messages?: string[];
  contents?: number[];
};

export type PricedLine = {
  product: MenuProduct;
  quantity: number;
  unitPriceAmd: number;
  lineTotalAmd: number;
  options: MenuProduct["options"];
  messages: string[];
  contents: MenuProduct[];
};

export type PricingError =
  | { code: "unavailable"; productId: number }
  | { code: "badOption"; productId: number }
  | { code: "badBox"; productId: number }
  | { code: "badMessage"; productId: number };

export function priceLine(
  input: CartLineInput,
  products: Map<number, MenuProduct>,
  boxableIds: Set<number>,
): PricedLine | PricingError {
  const product = products.get(input.productId);
  if (!product || !product.isAvailable) return { code: "unavailable", productId: input.productId };

  const optionIds = [...new Set(input.optionIds ?? [])];
  const options = optionIds.map((id) => product.options.find((o) => o.id === id));
  if (options.some((o) => !o || o.kind === "text")) return { code: "badOption", productId: product.id };
  const chosen = options as MenuProduct["options"];
  if (chosen.filter((o) => o.kind === "size").length > 1) return { code: "badOption", productId: product.id };

  const textOption = product.options.find((o) => o.kind === "text");
  const messages = (input.messages ?? []).map((m) => m.trim()).filter(Boolean);
  if (messages.length && !textOption) return { code: "badMessage", productId: product.id };
  if (textOption?.maxLength && messages.some((m) => m.length > textOption.maxLength!)) {
    return { code: "badMessage", productId: product.id };
  }

  let contents: MenuProduct[] = [];
  if (product.boxSize) {
    const ids = input.contents ?? [];
    if (ids.length !== product.boxSize) return { code: "badBox", productId: product.id };
    const found = ids.map((id) => products.get(id));
    if (found.some((p) => !p || !p.isAvailable || !boxableIds.has(p.id))) {
      return { code: "badBox", productId: product.id };
    }
    contents = found as MenuProduct[];
  } else if (input.contents?.length) {
    return { code: "badBox", productId: product.id };
  }

  const unitPriceAmd =
    product.priceAmd +
    chosen.reduce((sum, o) => sum + o.priceDeltaAmd, 0) +
    contents.reduce((sum, p) => sum + p.priceAmd, 0);

  return {
    product,
    quantity: input.quantity,
    unitPriceAmd,
    lineTotalAmd: unitPriceAmd * input.quantity,
    options: chosen,
    messages,
    contents,
  };
}

export function isPricingError(x: PricedLine | PricingError): x is PricingError {
  return "code" in x;
}

export type DeliveryQuote =
  | { ok: true; zone: PublicZone; feeAmd: number }
  | { ok: false; reason: "noZone" }
  | { ok: false; reason: "belowMinimum"; minOrderAmd: number; zone: PublicZone };

export function quoteDelivery(
  district: string | undefined,
  subtotalAmd: number,
  zones: PublicZone[],
): DeliveryQuote {
  const zone = district ? zones.find((z) => z.districts.includes(district)) : undefined;
  if (!zone) return { ok: false, reason: "noZone" };
  if (subtotalAmd < zone.minOrderAmd) {
    return { ok: false, reason: "belowMinimum", minOrderAmd: zone.minOrderAmd, zone };
  }
  const free = zone.freeFromAmd != null && subtotalAmd >= zone.freeFromAmd;
  return { ok: true, zone, feeAmd: free ? 0 : zone.feeAmd };
}

/** How many days ahead the order must be placed (bouquets and name donuts need a day). */
export function leadDays(lines: Array<{ product: Pick<MenuProduct, "leadTimeDays"> }>): number {
  return lines.reduce((max, l) => Math.max(max, l.product.leadTimeDays), 0);
}
