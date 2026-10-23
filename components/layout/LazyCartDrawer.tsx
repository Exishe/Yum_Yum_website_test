"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CartDrawer = dynamic(() => import("./CartDrawer").then((m) => m.CartDrawer), { ssr: false });

/**
 * Loads the basket drawer code only when someone first opens it. The drawer
 * mounts already open; after that it listens for "yy:cart-open" itself.
 */
export function LazyCartDrawer() {
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    if (wanted) return;
    const onOpen = () => setWanted(true);
    window.addEventListener("yy:cart-open", onOpen);
    return () => window.removeEventListener("yy:cart-open", onOpen);
  }, [wanted]);
  return wanted ? <CartDrawer defaultOpen /> : null;
}
