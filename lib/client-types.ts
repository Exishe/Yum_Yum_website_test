import type { MenuCategory, MenuProduct } from "./catalog";
import type { ImageInfo } from "./images";

/** A product as sent to the browser: menu data plus image size and blur placeholder. */
export type ClientProduct = MenuProduct & { img: ImageInfo | null };
export type ClientCategory = Omit<MenuCategory, "products"> & { img: ImageInfo | null; products: ClientProduct[] };
