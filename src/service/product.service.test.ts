import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { productDao, variantDao, productOptionDao, productOptionValueDao } from "../db/dao";
import { productService } from "./product.service";

describe("productService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  // ─── helpers ───
  function seedDraftProduct(slug?: string) {
    return productService.create({
      title: "测试商品",
      slug: slug ?? `slug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: "draft",
    });
  }

  function seedVariant(productId: number, overrides: Record<string, unknown> = {}) {
    return productService.createVariant({
      productId,
      title: "默认变体",
      sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      priceAmount: 1000,
      isDefault: 1,
      ...overrides,
    } as any);
  }

  // ─── CRUD ───
  test("create / getById / getBySlug", () => {
    const p = seedDraftProduct("my-product");
    expect(p.id).toBeGreaterThan(0);
    expect(p.status).toBe("draft");

    const byId = productService.getById(p.id);
    expect(byId.title).toBe("测试商品");

    const bySlug = productService.getBySlug("my-product");
    expect(bySlug.id).toBe(p.id);
  });

  test("list 分页 + 搜索", () => {
    productService.create({ title: "Alpha Widget", slug: "p-alpha", status: "draft" });
    productService.create({ title: "Beta Gadget", slug: "p-beta", status: "draft" });

    const all = productService.list({});
    expect(all.total).toBe(2);

    const searched = productService.list({ search: "Alpha" });
    expect(searched.total).toBe(1);
  });

  test("softDelete 需要非 active 状态", () => {
    const p = seedDraftProduct();
    productService.delete(p.id);

    // 列表不再出现
    const list = productService.list({});
    expect(list.items.some((r) => r.id === p.id)).toBe(false);
  });

  test("softDelete active 商品抛错", () => {
    const p = seedDraftProduct();
    const v = seedVariant(p.id);
    productService.update(p.id, { status: "active" });
    expect(() => productService.delete(p.id)).toThrow("draft or archived");
  });

  // ─── 状态约束 ───
  test("激活商品需要至少一个默认变体", () => {
    const p = seedDraftProduct();
    expect(() =>
      productService.update(p.id, { status: "active" }),
    ).toThrow("at least one variant");
  });

  test("有默认变体后可以激活", () => {
    const p = seedDraftProduct();
    seedVariant(p.id);
    const updated = productService.update(p.id, { status: "active" });
    expect(updated.status).toBe("active");
  });

  // ─── draft-before-edit guard ───
  test("active 商品不能修改变体", () => {
    const p = seedDraftProduct();
    seedVariant(p.id);
    productService.update(p.id, { status: "active" });

    expect(() =>
      productService.createVariant({
        productId: p.id,
        title: "V2",
        sku: "SKU-V2",
        priceAmount: 200,
      }),
    ).toThrow("set product to draft before changing variants");
  });

  test("active 商品不能修改选项", () => {
    const p = seedDraftProduct();
    seedVariant(p.id);
    productService.update(p.id, { status: "active" });

    expect(() =>
      productService.createOption({ productId: p.id, name: "Color" }),
    ).toThrow("set product to draft before changing options");
  });

  // ─── variants ───
  test("variant product_id 不可变", () => {
    const p1 = seedDraftProduct("p1-test");
    const p2 = seedDraftProduct("p2-test");
    const v = seedVariant(p1.id);

    expect(() =>
      productService.updateVariant(v.id, { productId: p2.id } as any),
    ).toThrow("immutable");
  });

  test("deleteVariant 删除变体", () => {
    const p = seedDraftProduct();
    const v = seedVariant(p.id);
    productService.deleteVariant(v.id);

    const list = productService.listVariants(p.id);
    expect(list).toHaveLength(0);
  });

  // ─── options + option values ───
  test("createOption / createOptionValue / listOptions", () => {
    const p = seedDraftProduct();
    const opt = productService.createOption({
      productId: p.id,
      name: "颜色",
    });
    expect(opt.name).toBe("颜色");

    const val = productService.createOptionValue({
      optionId: opt.id,
      value: "红色",
    });
    expect(val.value).toBe("红色");

    const opts = productService.listOptions(p.id);
    expect(opts).toHaveLength(1);

    const vals = productService.listOptionValues(opt.id);
    expect(vals).toHaveLength(1);
  });

  // ─── variant option values ───
  test("replaceVariantOptionValues 替换变体选项值", () => {
    const p = seedDraftProduct();
    const v = seedVariant(p.id);
    const opt = productService.createOption({ productId: p.id, name: "Size" });
    const ov1 = productService.createOptionValue({ optionId: opt.id, value: "S" });
    const ov2 = productService.createOptionValue({ optionId: opt.id, value: "M" });

    productService.replaceVariantOptionValues(v.id, [ov1.id]);
    let linked = productService.listVariantOptionValues(v.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].value).toBe("S");

    productService.replaceVariantOptionValues(v.id, [ov2.id]);
    linked = productService.listVariantOptionValues(v.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].value).toBe("M");
  });

  test("replaceVariantOptionValues 同一选项不能有两个值", () => {
    const p = seedDraftProduct();
    const v = seedVariant(p.id);
    const opt = productService.createOption({ productId: p.id, name: "Color" });
    const ov1 = productService.createOptionValue({ optionId: opt.id, value: "Red" });
    const ov2 = productService.createOptionValue({ optionId: opt.id, value: "Blue" });

    expect(() =>
      productService.replaceVariantOptionValues(v.id, [ov1.id, ov2.id]),
    ).toThrow("already has a value for this option");
  });
});
