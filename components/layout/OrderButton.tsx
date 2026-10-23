"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BagIcon } from "@/components/icons/brand";
import { cartCount, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { openCart } from "./cart-events";

export function OrderButton() {
  const t = useTranslations("nav");
  const count = cartCount(useCart());
  const ref = useRef<HTMLButtonElement>(null);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    const onAdd = (e: Event) => {
      const rect = (e as CustomEvent<{ rect?: DOMRect }>).detail?.rect;
      const target = ref.current?.getBoundingClientRect();
      setBump((n) => n + 1);
      if (!rect || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // A little donut flies from the button that was pressed into the basket.
      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      Object.assign(dot.style, {
        position: "fixed",
        left: `${rect.left + rect.width / 2 - 12}px`,
        top: `${rect.top + rect.height / 2 - 12}px`,
        width: "24px",
        height: "24px",
        borderRadius: "999px",
        background: "radial-gradient(circle, #fff8f2 26%, #de1281 28%, #de1281 60%, #ffe14d 62%)",
        zIndex: "100",
        pointerEvents: "none",
      });
      document.body.appendChild(dot);
      const dx = target.left + target.width / 2 - (rect.left + rect.width / 2);
      const dy = target.top + target.height / 2 - (rect.top + rect.height / 2);
      const anim = dot.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          {
            transform: `translate(${dx * 0.5}px, ${dy - 80}px) scale(1.2) rotate(180deg)`,
            opacity: 1,
            offset: 0.5,
          },
          { transform: `translate(${dx}px, ${dy}px) scale(0.4) rotate(360deg)`, opacity: 0.2 },
        ],
        { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      anim.onfinish = () => dot.remove();
    };
    window.addEventListener("yy:cart-add", onAdd);
    return () => window.removeEventListener("yy:cart-add", onAdd);
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={openCart}
      aria-label={t("orderLabel", { count })}
      className="group inline-flex h-11 items-center gap-2 rounded-full bg-sun pr-1.5 pl-1.5 text-sm font-bold text-plum transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:pr-1.5"
    >
      <span className="grid size-8 place-items-center rounded-full bg-white transition-transform duration-300 group-hover:-rotate-12">
        <BagIcon size={20} />
      </span>
      <span className="hidden sm:inline">{t("order")}</span>
      <span
        key={bump}
        className={cn(
          "grid h-8 min-w-8 place-items-center rounded-full bg-magenta px-2 text-xs text-white tabular-nums",
          bump > 0 && "animate-pop",
        )}
      >
        {count}
      </span>
    </button>
  );
}
