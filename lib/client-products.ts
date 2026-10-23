import "server-only";
import type { MenuCategory, MenuProduct } from "./catalog";
import type { ClientCategory, ClientProduct } from "./client-types";
import { img } from "./images";

export function toClientProduct(p: MenuProduct): ClientProduct {
  return { ...p, img: img(p.image) };
}

export function toClientCategories(menu: MenuCategory[]): ClientCategory[] {
  return menu.map((c) => ({ ...c, img: img(c.image), products: c.products.map(toClientProduct) }));
}
