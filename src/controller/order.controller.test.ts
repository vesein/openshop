import { describe, test, expect, mock, beforeAll } from "bun:test";
import { controllerRequest, readError } from "./test-helpers";
import { mockServiceModule } from "./test-mock-module";

const removeDiscount = mock(() => {});
const removeItem = mock((): { id: number; orderId: number } | undefined => ({ id: 1, orderId: 1 }));
const listOrders = mock(() => ({ items: [], total: 0, page: 1, pageSize: 20 }));

beforeAll(() => {
  mockServiceModule("../service/order.service", () => ({
    orderService: {
      list: listOrders,
      getById: () => ({ id: 1 }),
      update: () => ({ id: 1 }),
      listItems: () => [],
      addItem: () => ({ id: 1 }),
      updateItem: () => ({ id: 1 }),
      removeItem,
      listPayments: () => [],
      createPayment: () => ({ id: 1 }),
      updatePayment: () => ({ id: 1 }),
      getShipment: () => null,
      createShipment: () => ({ id: 1 }),
      updateShipment: () => ({ id: 1 }),
      markShipped: () => ({ id: 1 }),
      markDelivered: () => ({ id: 1 }),
      listDiscountCodes: () => [],
      applyDiscountCode: () => {},
      applyDiscountCodeByCode: () => {},
      removeDiscountCode: removeDiscount,
      dashboardStats: () => ({ todayOrders: 0 }),
    },
  }));
});

const oc = await import("./order.controller");

describe("orderController", () => {
  test("customerId 非法 → 400", () => {
    const res = oc.orderController.GET(
      controllerRequest("http://x/api/admin/orders?customerId=xx", { params: {} }),
    );
    expect(res.status).toBe(400);
  });

  test("customerId 合法 → 200", () => {
    const res = oc.orderController.GET(
      controllerRequest("http://x/api/admin/orders?customerId=3", { params: {} }),
    );
    expect(res.status).toBe(200);
    expect(listOrders).toHaveBeenCalled();
  });
});

describe("orderDetailController", () => {
  test("PATCH 无 body → 400", async () => {
    const req = new Request("http://x/api/admin/orders/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "x",
    });
    (req as Request & { params: Record<string, string> }).params = { id: "1" };
    const res = await oc.orderDetailController.PATCH(req);
    expect(res.status).toBe(400);
  });
});

describe("orderItemDetailController", () => {
  test("DELETE 无行 → 404", () => {
    removeItem.mockImplementationOnce(() => undefined);
    const res = oc.orderItemDetailController.DELETE(
      controllerRequest("http://x/api/admin/order-items/9", { params: { id: "9" } }),
    );
    expect(res.status).toBe(404);
    removeItem.mockImplementation(() => ({ id: 1, orderId: 1 }));
  });

  test("DELETE 成功 → 204", () => {
    const res = oc.orderItemDetailController.DELETE(
      controllerRequest("http://x/api/admin/order-items/1", { params: { id: "1" } }),
    );
    expect(res.status).toBe(204);
  });
});

describe("orderShipmentController", () => {
  test("POST status 非法 → 400", async () => {
    const res = await oc.orderShipmentController.POST(
      controllerRequest("http://x/api/admin/orders/1/shipment", {
        method: "POST",
        body: { status: "bogus" },
        params: { orderId: "1" },
      }),
    );
    expect(res.status).toBe(400);
    const err = await readError(res);
    expect(err.code).toBe("bad_request");
  });

  test("POST status 合法 → 201", async () => {
    const res = await oc.orderShipmentController.POST(
      controllerRequest("http://x/api/admin/orders/1/shipment", {
        method: "POST",
        body: { status: "pending" },
        params: { orderId: "1" },
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe("orderDiscountController", () => {
  test("DELETE 成功 → 204", () => {
    const res = oc.orderDiscountController.DELETE(
      controllerRequest("http://x/api/admin/orders/1/discount-codes?discountCodeId=2", {
        params: { orderId: "1" },
      }),
    );
    expect(res.status).toBe(204);
    expect(removeDiscount).toHaveBeenCalled();
  });
});

describe("adminPaymentDetailController", () => {
  test("PATCH 无 JSON → 400", async () => {
    const req = new Request("http://x/api/admin/payments/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    (req as Request & { params: Record<string, string> }).params = { id: "1" };
    const res = await oc.adminPaymentDetailController.PATCH(req);
    expect(res.status).toBe(400);
  });
});
