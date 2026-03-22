import { describe, test, expect } from "bun:test";
import { controllerRequest } from "./test-helpers";
import { mockServiceModule } from "./test-mock-module";

mockServiceModule("../service/collection.service", () => ({
  collectionService: {
    list: () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
    getById: () => ({ id: 1 }),
    create: () => ({ id: 1 }),
    update: () => ({ id: 1 }),
    delete: () => ({ id: 1 }),
    addProduct: () => {},
    removeProduct: () => {},
  },
}));

const col = await import("./collection.controller");

mockServiceModule("../service/media.service", () => ({
  mediaService: {
    list: () => ({ items: [], total: 0, page: 1, pageSize: 50 }),
    create: () => ({ id: 1 }),
    getById: () => ({ id: 1 }),
    delete: () => ({ id: 1 }),
    listProductMedia: () => [],
    attachToProduct: () => ({ id: 1 }),
    detachFromProduct: () => {},
    updateProductMedia: () => ({ id: 1 }),
  },
}));

const media = await import("./media.controller");

mockServiceModule("../service/content.service", () => ({
  pageService: {
    list: () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
    getById: () => ({ id: 1 }),
    create: () => ({ id: 1 }),
    update: () => ({ id: 1 }),
    delete: () => ({ id: 1 }),
  },
  menuService: {
    list: () => ({ items: [] }),
    getById: () => ({ id: 1 }),
    create: () => ({ id: 1 }),
    update: () => ({ id: 1 }),
    delete: () => {},
    listItems: () => [],
    addItem: () => ({ id: 1 }),
    updateItem: () => ({ id: 1 }),
    removeItem: () => {},
    reorderItems: () => {},
  },
}));

const content = await import("./content.controller");

mockServiceModule("../service/promotion.service", () => ({
  promotionService: {
    list: () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
    getById: () => ({ id: 1 }),
    create: () => ({ id: 1 }),
    update: () => ({ id: 1 }),
    delete: () => ({ id: 1 }),
    listCodes: () => [],
    createCode: () => ({ id: 1 }),
    updateCode: () => ({ id: 1 }),
    deleteCode: () => ({ id: 1 }),
    getActive: () => [],
  },
}));

const promo = await import("./promotion.controller");

describe("collectionProductController", () => {
  test("DELETE 成功 → 204", () => {
    const res = col.collectionProductController.DELETE(
      controllerRequest("http://x/api/admin/collections/1/products?productId=2", { params: { id: "1" } }),
    );
    expect(res.status).toBe(204);
  });
});

describe("mediaController", () => {
  test("GET 200", () => {
    const res = media.mediaController.GET(controllerRequest("http://x/api/admin/media", { params: {} }));
    expect(res.status).toBe(200);
  });
});

describe("menuItemController PUT reorder", () => {
  test("orderedIds 非数组 → 400", async () => {
    const res = await content.menuItemController.PUT(
      controllerRequest("http://x/api/admin/menus/1/items", {
        method: "PUT",
        body: { orderedIds: "bad" },
        params: { menuId: "1" },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("activePromotionsController", () => {
  test("GET 200", () => {
    const res = promo.activePromotionsController.GET();
    expect(res.status).toBe(200);
  });
});
