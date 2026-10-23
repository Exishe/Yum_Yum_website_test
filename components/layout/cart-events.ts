"use client";

export function openCart() {
  window.dispatchEvent(new Event("yy:cart-open"));
}
