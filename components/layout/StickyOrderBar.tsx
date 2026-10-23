"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cartCount, useCart } from "@/lib/cart-store";

/** Phone only: a bar at the bottom with the basket count and a checkout button. */
export function StickyOrderBar({ shops }: { shops: Array<{ id: number; name: string }> }) {
  const t = useTranslations("cart");
  const pathname = usePathname();
  const state = useCart();
  const count = cartCount(state);
  if (count === 0 || pathname === "/checkout" || pathname.startsWith("/order")) return null;
  const shop = shops.find((s) => s.id === state.shopId) ?? shops[0];

  return (
    <div className="on-dark fixed inset-x-3 bottom-3 z-40 flex animate-rise items-center justify-between gap-3 rounded-full bg-plum py-2 pr-2 pl-6 text-white shadow-lift lg:hidden">
      <p className="min-w-0 text-sm leading-tight">
        <span className="block font-semibold">{t("count", { count })}</span>
        {shop ? (
          <span className="block truncate text-white/75">{t("pickupAt", { shop: shop.name })}</span>
        ) : null}
      </p>
      <Link
        href="/checkout"
        className="inline-flex h-12 shrink-0 items-center rounded-full bg-sun px-6 font-bold text-plum"
      >
        {t("barCheckout")}
      </Link>
    </div>
  );
}
