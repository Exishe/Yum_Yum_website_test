"use client";

/*
 * The order basket lives in localStorage so it survives reloads, and is saved
 * to the database only when the customer checks out. Prices here are for
 * display; the server recalculates everything from the database.
 */
import { useSyncExternalStore } from "react";
import type { Localized } from "@/db/schema";

export type CartLine = {
  key: string;
  productId: number;
  quantity: number;
  optionIds: number[];
  messages: string[];
  contents: number[];
  /** Display snapshot taken when the item was added. */
  name: Localized;
  unitPriceAmd: number;
  image: string | null;
  detail?: { options?: Localized[]; contents?: Localized[] };
  leadTimeDays: number;
};

export type CartState = { lines: CartLine[]; shopId: number | null };

const KEY = "yy-cart-v1";
const EMPTY: CartState = { lines: [], shopId: null };
let state: CartState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (Array.isArray(parsed.lines)) state = { lines: parsed.lines.slice(0, 40), shopId: parsed.shopId ?? null };
    }
  } catch {
    state = EMPTY;
  }
}

function save(next: CartState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: the basket still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartState {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

function sameConfig(a: CartLine, b: Omit<CartLine, "key" | "quantity">) {
  return (
    a.productId === b.productId &&
    a.optionIds.join() === b.optionIds.join() &&
    a.messages.join("\n") === b.messages.join("\n") &&
    a.contents.join() === b.contents.join()
  );
}

export const cart = {
  add(line: Omit<CartLine, "key">) {
    load();
    const existing = state.lines.find((l) => sameConfig(l, line));
    if (existing) {
      save({
        ...state,
        lines: state.lines.map((l) =>
          l === existing ? { ...l, quantity: Math.min(50, l.quantity + line.quantity) } : l,
        ),
      });
    } else {
      const key = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
      save({ ...state, lines: [...state.lines, { ...line, key }].slice(0, 40) });
    }
  },
  setQuantity(key: string, quantity: number) {
    load();
    save({
      ...state,
      lines:
        quantity <= 0
          ? state.lines.filter((l) => l.key !== key)
          : state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, quantity) } : l)),
    });
  },
  remove(key: string) {
    load();
    save({ ...state, lines: state.lines.filter((l) => l.key !== key) });
  },
  setShop(shopId: number | null) {
    load();
    save({ ...state, shopId });
  },
  clear() {
    save({ ...state, lines: [] });
  },
};

export function cartCount(s: CartState) {
  return s.lines.reduce((n, l) => n + l.quantity, 0);
}

export function cartSubtotal(s: CartState) {
  return s.lines.reduce((n, l) => n + l.unitPriceAmd * l.quantity, 0);
}

/** Fires the "fly into the basket" animation from the clicked element. */
export function announceAdd(from?: Element | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("yy:cart-add", { detail: { rect: from?.getBoundingClientRect() } }));
}
