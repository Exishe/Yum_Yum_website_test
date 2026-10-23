"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CartDrawer = dynamic(() => import("./CartDrawer").then((m) => m.CartDrawer), { ssr: false });

/** Loads the basket drawer code only when someone first opens it. */
export function LazyCartDrawer() {
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    const onOpen = () => {
      if (wanted) return;
      setWanted(true);
      // The drawer mounts after this event; open it once it is ready.
      window.setTimeout(() => window.dispatchEvent(new Event("yy:cart-open")), 60);
    };
    window.addEventListener("yy:cart-open", onOpen);
    return () => window.removeEventListener("yy:cart-open", onOpen);
  }, [wanted]);
  return wanted ? <CartDrawer /> : null;
}
