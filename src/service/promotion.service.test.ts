import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { promotionDao, discountCodeDao } from "../db/dao";
import { promotionService } from "./promotion.service";

describe("promotionService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  // ─── create ───
  test("create 创建促销", () => {
    const p = promotionService.create({
      name: "Summer Sale",
      type: "percentage",
      status: "draft",
      discountValue: 20,
    });
    expect(p.id).toBeGreaterThan(0);
    expect(p.name).toBe("Summer Sale");
    expect(p.discountValue).toBe(20);
  });

  test("create rulesJson 非法 JSON 抛错", () => {
    expect(() =>
      promotionService.create({
        name: "Bad",
        type: "fixed_amount",
        rulesJson: "not json",
      }),
    ).toThrow("valid JSON");
  });

  test("create rulesJson 非 object 抛错", () => {
    expect(() =>
      promotionService.create({
        name: "Bad",
        type: "fixed_amount",
        rulesJson: "[1,2]",
      }),
    ).toThrow("JSON object");
  });

  test("create discountValue 负数抛错", () => {
    expect(() =>
      promotionService.create({
        name: "Bad",
        type: "percentage",
        discountValue: -10,
      }),
    ).toThrow("non-negative");
  });

  test("create buyQuantity 零抛错", () => {
    expect(() =>
      promotionService.create({
        name: "Bad BOGO",
        type: "bogo",
        buyQuantity: 0,
      }),
    ).toThrow("positive");
  });

  // ─── update ───
  test("update 正常更新", () => {
    const p = promotionService.create({ name: "P1", type: "percentage" });
    const updated = promotionService.update(p.id, { name: "P1 Updated" });
    expect(updated.name).toBe("P1 Updated");
  });

  test("update 不存在的促销抛错", () => {
    expect(() =>
      promotionService.update(99999, { name: "Nope" }),
    ).toThrow("not found");
  });

  // ─── delete ───
  test("delete 删除促销", () => {
    const p = promotionService.create({ name: "Del", type: "fixed_amount" });
    promotionService.delete(p.id);
    expect(() => promotionService.getById(p.id)).toThrow("not found");
  });

  // ─── discount codes ───
  test("createCode 成功创建折扣码", () => {
    const p = promotionService.create({ name: "P1", type: "percentage", status: "active" });
    const code = promotionService.createCode({ code: "SAVE20", promotionId: p.id });
    expect(code.code).toBe("SAVE20");
  });

  test("createCode 促销不存在抛错", () => {
    expect(() =>
      promotionService.createCode({ code: "ORPHAN", promotionId: 99999 }),
    ).toThrow("Promotion not found");
  });

  test("createCode 重复 code 抛错", () => {
    const p = promotionService.create({ name: "P1", type: "percentage" });
    promotionService.createCode({ code: "DUP", promotionId: p.id });
    expect(() =>
      promotionService.createCode({ code: "DUP", promotionId: p.id }),
    ).toThrow("already exists");
  });

  // ─── list / getById ───
  test("list 按 type 过滤", () => {
    promotionService.create({ name: "A", type: "percentage" });
    promotionService.create({ name: "B", type: "fixed_amount" });
    promotionService.create({ name: "C", type: "percentage" });

    const result = promotionService.list({ type: "percentage" });
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  test("getById 返回促销及关联码", () => {
    const p = promotionService.create({ name: "WithCodes", type: "bogo" });
    promotionService.createCode({ code: "C1", promotionId: p.id });
    promotionService.createCode({ code: "C2", promotionId: p.id });

    const fetched = promotionService.getById(p.id);
    expect(fetched.discountCodes).toHaveLength(2);
  });
});
