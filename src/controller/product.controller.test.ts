import { describe, test, expect, mock, beforeAll } from "bun:test";
import { controllerRequest, readError } from "./test-helpers";
import { mockServiceModule } from "./test-mock-module";

const deleteProduct = mock((): { id: number; deletedAt: string } | undefined => ({ id: 1, deletedAt: "x" }));
const recordMovement = mock(() => ({ id: 1 }));

beforeAll(() => {
  mockServiceModule("../service/product.service", () => ({
    productService: {
      list: () => ({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 }),
      create: () => ({ id: 99 }),
      getById: (id: number) => ({ id, title: "P" }),
      update: () => ({ id: 1 }),
      delete: deleteProduct,
      listVariants: () => [],
      createVariant: () => ({ id: 1 }),
      updateVariant: () => ({ id: 1 }),
      deleteVariant: () => {},
      getInventory: () => ({ onHand: 1 }),
      listLowStock: () => [],
      recordStockMovement: recordMovement,
      listOptions: () => [],
      createOption: () => ({ id: 1 }),
      updateOption: () => ({ id: 1 }),
      deleteOption: () => {},
      listOptionValues: () => [],
      createOptionValue: () => ({ id: 1 }),
      updateOptionValue: () => ({ id: 1 }),
      deleteOptionValue: () => {},
      listVariantOptionValues: () => [],
      replaceVariantOptionValues: () => [],
    },
  }));
});

const pc = await import("./product.controller");

describe("productController", () => {
  test("GET 列表 200", async () => {
    const res = pc.productController.GET(
      controllerRequest("http://x/api/admin/products?page=2&status=active", { params: {} }),
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as { total: number };
    expect(j.total).toBe(1);
  });

  test("POST 非法 JSON → 400", async () => {
    const req = new Request("http://x/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{",
    });
    (req as Request & { params: Record<string, string> }).params = {};
    const res = await pc.productController.POST(req);
    expect(res.status).toBe(400);
    expect((await readError(res)).code).toBe("bad_request");
  });

  test("POST 缺 title → 400", async () => {
    const res = await pc.productController.POST(
      controllerRequest("http://x/api/admin/products", {
        method: "POST",
        body: { slug: "s" },
        params: {},
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("productDetailController", () => {
  test("GET id 非法 → 400", () => {
    const res = pc.productDetailController.GET(
      controllerRequest("http://x/api/admin/products/abc", { params: { id: "abc" } }),
    );
    expect(res.status).toBe(400);
  });

  test("GET 200", () => {
    const res = pc.productDetailController.GET(
      controllerRequest("http://x/api/admin/products/1", { params: { id: "1" } }),
    );
    expect(res.status).toBe(200);
  });

  test("DELETE 成功 → 204", () => {
    deleteProduct.mockImplementation(() => ({ id: 1, deletedAt: "x" }));
    const res = pc.productDetailController.DELETE(
      controllerRequest("http://x/api/admin/products/1", { params: { id: "1" } }),
    );
    expect(res.status).toBe(204);
  });

  test("DELETE 未删到 → 404", () => {
    deleteProduct.mockImplementationOnce(() => undefined);
    const res = pc.productDetailController.DELETE(
      controllerRequest("http://x/api/admin/products/1", { params: { id: "1" } }),
    );
    expect(res.status).toBe(404);
    deleteProduct.mockImplementation(() => ({ id: 1, deletedAt: "x" }));
  });
});

describe("inventoryAdjustController", () => {
  test("缺 movementType → 400", async () => {
    const res = await pc.inventoryAdjustController.POST(
      controllerRequest("http://x/api/admin/variants/1/inventory/adjust", {
        method: "POST",
        body: { quantityDelta: 1 },
        params: { variantId: "1" },
      }),
    );
    expect(res.status).toBe(400);
  });

  test("非法 movementType → 400", async () => {
    const res = await pc.inventoryAdjustController.POST(
      controllerRequest("http://x/api/admin/variants/1/inventory/adjust", {
        method: "POST",
        body: { movementType: "nope", quantityDelta: 1 },
        params: { variantId: "1" },
      }),
    );
    expect(res.status).toBe(400);
  });

  test("合法流水 → 201", async () => {
    const res = await pc.inventoryAdjustController.POST(
      controllerRequest("http://x/api/admin/variants/1/inventory/adjust", {
        method: "POST",
        body: { movementType: "in", quantityDelta: 5 },
        params: { variantId: "1" },
      }),
    );
    expect(res.status).toBe(201);
    expect(recordMovement).toHaveBeenCalled();
  });
});

describe("variantOptionValueController", () => {
  test("PUT optionValueIds 非数组 → 400", async () => {
    const res = await pc.variantOptionValueController.PUT(
      controllerRequest("http://x/api/admin/variants/1/option-values", {
        method: "PUT",
        body: { optionValueIds: 1 },
        params: { variantId: "1" },
      }),
    );
    expect(res.status).toBe(400);
  });
});
