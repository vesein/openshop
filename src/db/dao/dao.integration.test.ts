import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import {
  restoreDefaultSqliteFromTests,
  useSqliteForTests,
} from "../index";
import { createMigratedMemoryDatabase } from "../testing/memory-db";
import { shopSettingsDao } from "./collections";
import { customerDao } from "./customers";
import {
  inventoryDao,
  inventoryMovementDao,
  productDao,
  variantDao,
} from "./products";

describe("DAO 集成（:memory: + migrations）", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  test("shopSettingsDao ensure + update（基线迁移已插入 id=1 / My Shop）", () => {
    const row = shopSettingsDao.ensure();
    expect(row?.id).toBe(1);
    expect(row?.shopName).toBe("My Shop");

    const updated = shopSettingsDao.update({ shopName: "Test Shop" });
    expect(updated?.shopName).toBe("Test Shop");

    const again = shopSettingsDao.get();
    expect(again?.shopName).toBe("Test Shop");
  });

  test("customerDao create / findById / update", () => {
    const created = customerDao.create({
      email: "u@example.com",
      phone: "",
      firstName: "A",
      lastName: "B",
      acceptsMarketing: 0,
    });
    expect(created?.email).toBe("u@example.com");

    const found = customerDao.findById(created!.id);
    expect(found?.email).toBe("u@example.com");
    expect(found?.addresses).toEqual([]);

    const patched = customerDao.update(created!.id, { phone: "10086" });
    expect(patched?.phone).toBe("10086");
  });

  test("productDao create / findBySlug / list / softDelete", () => {
    const p = productDao.create({
      id: 1,
      title: "商品甲",
      slug: "product-a",
      status: "draft",
    });
    expect(p?.slug).toBe("product-a");

    const bySlug = productDao.findBySlug("product-a");
    expect(bySlug?.title).toBe("商品甲");
    expect(bySlug?.variants).toEqual([]);

    const rows = productDao.list({ status: "draft", pageSize: 10 });
    expect(rows.some((r) => r.id === 1)).toBe(true);

    const deleted = productDao.softDelete(1);
    expect(deleted?.deletedAt).toBeTruthy();

    const still = productDao.findById(1);
    expect(still?.id).toBe(1);
    expect(still?.deletedAt).toBeTruthy();
    expect(productDao.list({ status: "draft" }).some((r) => r.id === 1)).toBe(false);
  });

  test("inventoryMovementDao create + findByVariantId（依赖 variant + inventory_items）", () => {
    productDao.create({
      id: 10,
      title: "库存测",
      slug: "inv-test",
      status: "draft",
    });
    const v = variantDao.create({
      id: 1,
      productId: 10,
      title: "默认",
      sku: "SKU-INV-1",
      priceAmount: 100,
      isDefault: 1,
    });
    const itemRow = variantDao.findById(v!.id);
    expect(itemRow).not.toBeNull();

    const invItem = inventoryDao.findItemByVariantId(v!.id);
    expect(invItem?.id).toBeTruthy();

    const mov = inventoryMovementDao.create({
      id: 1,
      inventoryItemId: invItem!.id,
      movementType: "adjust",
      quantityDelta: 5,
      referenceType: "manual",
      note: "seed",
    });
    expect(mov?.quantityDelta).toBe(5);

    const list = inventoryMovementDao.findByVariantId(v!.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.movementType).toBe("adjust");
  });
});
