import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { productDao, variantDao, inventoryDao } from "../db/dao";
import { inventoryService } from "./inventory.service";

describe("inventoryService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  function seedVariant() {
    const p = productDao.create({
      title: "库存商品",
      slug: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: "draft",
    });
    return variantDao.create({
      productId: p.id,
      title: "默认",
      sku: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      priceAmount: 100,
      isDefault: 1,
    });
  }

  // ─── recordStockMovement ───
  test("in 入库增加 onHand", () => {
    const v = seedVariant();
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "in",
      quantityDelta: 50,
      referenceType: "manual",
    });

    const level = inventoryDao.getLevel(v.id);
    expect(level?.onHand).toBe(50);
    expect(level?.reserved).toBe(0);
  });

  test("reserve 增加 reserved", () => {
    const v = seedVariant();
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "in",
      quantityDelta: 10,
    });
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "reserve",
      quantityDelta: 3,
    });

    const level = inventoryDao.getLevel(v.id);
    expect(level?.onHand).toBe(10);
    expect(level?.reserved).toBe(3);
  });

  test("sold 减少 onHand 和 reserved", () => {
    const v = seedVariant();
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "in",
      quantityDelta: 10,
    });
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "reserve",
      quantityDelta: 5,
    });
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "sold",
      quantityDelta: -3,
    });

    const level = inventoryDao.getLevel(v.id);
    expect(level?.onHand).toBe(7);  // 10 - 3
    expect(level?.reserved).toBe(2);  // 5 - 3
  });

  test("无 backorder 时超卖抛错", () => {
    const v = seedVariant();
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "in",
      quantityDelta: 5,
    });

    // 尝试预留超过库存
    expect(() =>
      inventoryService.recordStockMovement({
        variantId: v.id,
        movementType: "reserve",
        quantityDelta: 6,
      }),
    ).toThrow("without backorder");
  });

  test("启用 backorder 后允许超额预留", () => {
    const v = seedVariant();
    inventoryService.patchInventoryItemByVariantId(v.id, { allowBackorder: 1 });

    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "in",
      quantityDelta: 2,
    });
    expect(() =>
      inventoryService.recordStockMovement({
        variantId: v.id,
        movementType: "reserve",
        quantityDelta: 5,
      }),
    ).not.toThrow();

    const level = inventoryDao.getLevel(v.id);
    expect(level?.reserved).toBe(5);
  });

  // ─── patchInventoryItemByVariantId ───
  test("patchInventoryItemByVariantId 修改 allowBackorder", () => {
    const v = seedVariant();
    const updated = inventoryService.patchInventoryItemByVariantId(v.id, {
      allowBackorder: 1,
    });
    expect(updated.allowBackorder).toBe(1);
  });

  test("有流水后禁止修改 tracked", () => {
    const v = seedVariant();
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "in",
      quantityDelta: 1,
    });

    expect(() =>
      inventoryService.patchInventoryItemByVariantId(v.id, { tracked: 0 }),
    ).toThrow("immutable after inventory history");
  });

  test("variant_id 不可变", () => {
    const v = seedVariant();
    expect(() =>
      inventoryService.patchInventoryItemByVariantId(v.id, { variantId: 99999 } as any),
    ).toThrow("immutable");
  });

  test("reserved > onHand 时不能关闭 backorder", () => {
    const v = seedVariant();
    inventoryService.patchInventoryItemByVariantId(v.id, { allowBackorder: 1 });
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "in",
      quantityDelta: 2,
    });
    inventoryService.recordStockMovement({
      variantId: v.id,
      movementType: "reserve",
      quantityDelta: 3,
    });

    expect(() =>
      inventoryService.patchInventoryItemByVariantId(v.id, { allowBackorder: 0 }),
    ).toThrow("cannot disable backorder");
  });
});
