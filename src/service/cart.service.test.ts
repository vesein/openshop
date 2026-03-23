import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { cartDao, productDao, variantDao } from "../db/dao";
import { cartService } from "./cart.service";

describe("cartService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  // ─── helpers ───
  function seedProduct() {
    const p = productDao.create({ title: "T恤", slug: "tee", status: "active" });
    const v = variantDao.create({
      productId: p.id,
      title: "默认",
      sku: `SKU-${Date.now()}`,
      priceAmount: 2990,
      isDefault: 1,
    });
    return { product: p, variant: v };
  }

  function seedCart(status = "active") {
    const cart = cartDao.create({
      sessionToken: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      currencyCode: "USD",
      status,
    });
    return cart;
  }

  // ─── addItem ───
  test("addItem 成功添加到 active 购物车", () => {
    const cart = seedCart();
    const { variant } = seedProduct();
    cartService.addItem({
      cartId: cart.id,
      variantId: variant.id,
      quantity: 2,
      unitPriceAmount: variant.priceAmount,
    });

    const items = cartService.listItems(cart.id);
    expect(items).toHaveLength(1);
  });

  test("addItem 非 active 购物车抛错", () => {
    const cart = seedCart();
    cartService.abandon(cart.id);
    const { variant } = seedProduct();

    expect(() =>
      cartService.addItem({
        cartId: cart.id,
        variantId: variant.id,
        quantity: 1,
        unitPriceAmount: 100,
      }),
    ).toThrow("not active");
  });

  test("addItem 不存在的 variant 抛错", () => {
    const cart = seedCart();
    expect(() =>
      cartService.addItem({
        cartId: cart.id,
        variantId: 99999,
        quantity: 1,
        unitPriceAmount: 100,
      }),
    ).toThrow("Variant not found");
  });

  test("addItem quantity <= 0 抛错", () => {
    const cart = seedCart();
    const { variant } = seedProduct();
    expect(() =>
      cartService.addItem({
        cartId: cart.id,
        variantId: variant.id,
        quantity: 0,
        unitPriceAmount: 100,
      }),
    ).toThrow("quantity must be positive");
  });

  // ─── updateItemQuantity ───
  test("updateItemQuantity 正常更新数量", () => {
    const cart = seedCart();
    const { variant } = seedProduct();
    cartService.addItem({
      cartId: cart.id,
      variantId: variant.id,
      quantity: 1,
      unitPriceAmount: 100,
    });

    const items = cartService.listItems(cart.id);
    const updated = cartService.updateItemQuantity(items[0]!.id, 5);
    expect(updated.quantity).toBe(5);
  });

  test("updateItemQuantity quantity <= 0 抛错", () => {
    const cart = seedCart();
    const { variant } = seedProduct();
    cartService.addItem({
      cartId: cart.id,
      variantId: variant.id,
      quantity: 1,
      unitPriceAmount: 100,
    });

    const items = cartService.listItems(cart.id);
    expect(() => cartService.updateItemQuantity(items[0]!.id, -1)).toThrow(
      "quantity must be positive",
    );
  });

  test("updateItemQuantity 非 active 购物车抛错", () => {
    const cart = seedCart();
    const { variant } = seedProduct();
    cartService.addItem({
      cartId: cart.id,
      variantId: variant.id,
      quantity: 1,
      unitPriceAmount: 100,
    });

    const items = cartService.listItems(cart.id);
    cartService.abandon(cart.id);

    expect(() => cartService.updateItemQuantity(items[0]!.id, 3)).toThrow(
      "not active",
    );
  });

  // ─── removeItem ───
  test("removeItem 非 active 购物车抛错", () => {
    const cart = seedCart();
    const { variant } = seedProduct();
    cartService.addItem({
      cartId: cart.id,
      variantId: variant.id,
      quantity: 1,
      unitPriceAmount: 100,
    });

    const items = cartService.listItems(cart.id);
    cartService.abandon(cart.id);

    expect(() => cartService.removeItem(items[0]!.id)).toThrow("not active");
  });

  // ─── clear ───
  test("clear 非 active 购物车抛错", () => {
    const cart = seedCart();
    cartService.abandon(cart.id);
    expect(() => cartService.clear(cart.id)).toThrow("not active");
  });

  test("clear 清空 active 购物车", () => {
    const cart = seedCart();
    const { variant } = seedProduct();
    cartService.addItem({
      cartId: cart.id,
      variantId: variant.id,
      quantity: 2,
      unitPriceAmount: 100,
    });

    cartService.clear(cart.id);
    const items = cartService.listItems(cart.id);
    expect(items).toHaveLength(0);
  });
});
