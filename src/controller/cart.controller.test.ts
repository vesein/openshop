import { describe, test, expect, mock, beforeAll } from "bun:test";
import { controllerRequest, readError } from "./test-helpers";
import { mockServiceModule } from "./test-mock-module";

const getByToken = mock(() => ({ id: 1, sessionToken: "t" }));

beforeAll(() => {
  mockServiceModule("../service/cart.service", () => ({
    cartService: {
      create: () => ({ id: 1 }),
      getByToken,
      update: () => ({ id: 1 }),
      abandon: () => ({ id: 1 }),
      listItems: () => [],
      addItem: () => ({ id: 1 }),
      updateItemQuantity: () => ({ id: 1 }),
      removeItem: () => {},
    },
  }));
});

const cc = await import("./cart.controller");

describe("cartListController", () => {
  test("缺 sessionToken → 400", async () => {
    const res = await cc.cartListController.POST(
      controllerRequest("http://x/api/admin/carts", {
        method: "POST",
        body: { currencyCode: "USD" },
        params: {},
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("cartController", () => {
  test("GET token 空 → 400", () => {
    const res = cc.cartController.GET(controllerRequest("http://x/api/admin/carts/", { params: { token: "" } }));
    expect(res.status).toBe(400);
  });

  test("GET 200", () => {
    const res = cc.cartController.GET(
      controllerRequest("http://x/api/admin/carts/abc", { params: { token: "abc" } }),
    );
    expect(res.status).toBe(200);
  });
});

describe("cartItemController", () => {
  test("POST 缺 quantity → 400", async () => {
    const res = await cc.cartItemController.POST(
      controllerRequest("http://x/api/admin/carts/1/items", {
        method: "POST",
        body: { variantId: 1, unitPriceAmount: 100 },
        params: { cartId: "1" },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("cartItemDetailController", () => {
  test("PATCH quantity 非正整数 → 400", async () => {
    const res = await cc.cartItemDetailController.PATCH(
      controllerRequest("http://x/api/admin/cart-items/1", {
        method: "PATCH",
        body: { quantity: 0 },
        params: { id: "1" },
      }),
    );
    expect(res.status).toBe(400);
    const err = await readError(res);
    expect(err.code).toBe("bad_request");
  });
});
