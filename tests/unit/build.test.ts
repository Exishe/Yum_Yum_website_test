import { describe, expect, it } from "vitest";
import { buildSchema, buildText } from "@/lib/build";
import { cartItemSchema } from "@/lib/validation";

describe("3D builder order line", () => {
  it("keeps a valid build on the cart item", () => {
    const item = cartItemSchema.parse({
      productId: 3,
      quantity: 1,
      build: { flavour: "chocolate", toppings: ["sprinkles", "nuts"], pack: "box" },
    });
    expect(item.build?.pack).toBe("box");
  });

  it("rejects values the builder never offers", () => {
    expect(buildSchema.safeParse({ flavour: "bacon", toppings: [], pack: "box" }).success).toBe(
      false,
    );
    expect(
      cartItemSchema.safeParse({
        productId: 3,
        quantity: 1,
        build: { flavour: "lemon", toppings: ["glitter"], pack: "paper" },
      }).success,
    ).toBe(false);
  });

  it("reads like the builder summary", () => {
    expect(buildText({ flavour: "lemon", toppings: [], pack: "gift" }, "hy")).toBe(
      "Կիտրոն · առանց զարդարանքի · նվերի փաթեթով",
    );
  });
});
