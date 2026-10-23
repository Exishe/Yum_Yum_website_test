"use client";

import { announceAdd, cart } from "@/lib/cart-store";
import type { ClientProduct } from "@/lib/client-types";

/** Adds a product with its default options in one tap. */
export function addSimple(p: ClientProduct, from?: Element | null) {
  const defaults = p.options.filter((o) => o.isDefault && o.kind !== "text");
  cart.add({
    productId: p.id,
    quantity: 1,
    optionIds: defaults.map((o) => o.id),
    messages: [],
    contents: [],
    name: p.name,
    unitPriceAmd: p.priceAmd + defaults.reduce((s, o) => s + o.priceDeltaAmd, 0),
    image: p.img?.src ?? null,
    detail: { options: defaults.map((o) => o.name) },
    leadTimeDays: p.leadTimeDays,
  });
  announceAdd(from);
}

/** Products that need a choice from the customer before they can go in the basket. */
export function needsDetails(p: ClientProduct) {
  return !!p.boxSize || p.options.some((o) => o.kind === "text");
}
