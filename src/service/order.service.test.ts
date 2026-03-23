import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { orderDao, orderItemDao, orderEventDao, promotionDao, discountCodeDao } from "../db/dao";
import { orderService } from "./order.service";

describe("orderService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  // ─── helpers ───
  function makeOrder(overrides: Record<string, unknown> = {}) {
    return orderService.create({
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: "test@example.com",
      currencyCode: "USD",
      ...overrides,
    } as any);
  }

  // ─── create ───
  test("create 返回完整订单并触发 order_created 事件", () => {
    const order = makeOrder();
    expect(order.id).toBeGreaterThan(0);
    expect(order.orderStatus).toBe("open");
    expect(order.paymentStatus).toBe("paid"); // totalAmount=0 → paid
    expect(order.fulfillmentStatus).toBe("unfulfilled");
    expect(order.totalAmount).toBe(0);

    const events = orderEventDao.findByOrderId(order.id);
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("order_created");
  });

  // ─── update ───
  test("update 状态转换触发 order_status_changed 事件", () => {
    const order = makeOrder();
    const updated = orderService.update(order.id, { orderStatus: "completed" });
    expect(updated.orderStatus).toBe("completed");

    const events = orderEventDao.findByOrderId(order.id);
    const statusEvent = events.find((e) => e.eventType === "order_status_changed");
    expect(statusEvent).toBeTruthy();
    const detail = JSON.parse(statusEvent!.detailJson);
    expect(detail.from).toBe("open");
    expect(detail.to).toBe("completed");
  });

  test("update cancelled 自动设置 cancelledAt", () => {
    const order = makeOrder();
    const updated = orderService.update(order.id, { orderStatus: "cancelled" });
    expect(updated.orderStatus).toBe("cancelled");
    expect(updated.cancelledAt).toBeTruthy();
  });

  test("update 非法状态转换抛错", () => {
    const order = makeOrder();
    orderService.update(order.id, { orderStatus: "completed" });
    expect(() =>
      orderService.update(order.id, { orderStatus: "open" }),
    ).toThrow("immutable");
  });

  test("update 不存在的订单抛错", () => {
    expect(() => orderService.update(99999, { email: "x" })).toThrow("not found");
  });

  // ─── addItem ───
  test("addItem 添加行项目并重算总价", () => {
    const order = makeOrder();
    const item = orderService.addItem({
      orderId: order.id,
      productTitle: "商品A",
      quantity: 2,
      unitPriceAmount: 1000,
    });
    expect(item.id).toBeGreaterThan(0);
    expect(item.productTitle).toBe("商品A");

    const refreshed = orderService.getById(order.id);
    expect(refreshed.subtotalAmount).toBe(2000);
    expect(refreshed.totalAmount).toBe(2000);

    const events = orderEventDao.findByOrderId(order.id);
    expect(events.some((e) => e.eventType === "item_added")).toBe(true);
  });

  // ─── updateItem ───
  test("updateItem 修改数量后重算总价", () => {
    const order = makeOrder();
    const item = orderService.addItem({
      orderId: order.id,
      productTitle: "商品A",
      quantity: 1,
      unitPriceAmount: 500,
    });

    orderService.updateItem(item.id, { quantity: 3 });
    const refreshed = orderService.getById(order.id);
    expect(refreshed.subtotalAmount).toBe(1500);
    expect(refreshed.totalAmount).toBe(1500);
  });

  test("updateItem 禁止跨订单迁移", () => {
    const order1 = makeOrder({ orderNumber: "ORD-A1" });
    const order2 = makeOrder({ orderNumber: "ORD-A2" });
    const item = orderService.addItem({
      orderId: order1.id,
      productTitle: "商品A",
      quantity: 1,
      unitPriceAmount: 100,
    });

    expect(() =>
      orderService.updateItem(item.id, { orderId: order2.id }),
    ).toThrow("immutable");
  });

  // ─── removeItem ───
  test("removeItem 删除行项目并重算总价", () => {
    const order = makeOrder();
    const item = orderService.addItem({
      orderId: order.id,
      productTitle: "商品A",
      quantity: 2,
      unitPriceAmount: 1000,
    });

    orderService.removeItem(item.id);
    const refreshed = orderService.getById(order.id);
    expect(refreshed.subtotalAmount).toBe(0);
    expect(refreshed.totalAmount).toBe(0);

    const events = orderEventDao.findByOrderId(order.id);
    expect(events.some((e) => e.eventType === "item_removed")).toBe(true);
  });

  // ─── discount codes ───
  test("applyDiscountCodeByCode 应用折扣码并重算总价", () => {
    const order = makeOrder();
    orderService.addItem({
      orderId: order.id,
      productTitle: "商品A",
      quantity: 1,
      unitPriceAmount: 10000,
    });

    const promo = promotionDao.create({
      name: "10% off",
      type: "percentage",
      status: "active",
      discountValue: 10,
    });
    const dc = discountCodeDao.create({
      code: "SAVE10",
      promotionId: promo.id,
    });

    orderService.applyDiscountCodeByCode(order.id, "SAVE10");

    const refreshed = orderService.getById(order.id);
    expect(refreshed.orderDiscountAmount).toBe(1000);
    expect(refreshed.totalAmount).toBe(9000);

    const events = orderEventDao.findByOrderId(order.id);
    expect(events.some((e) => e.eventType === "discount_applied")).toBe(true);
  });

  test("removeDiscountCode 移除后总价恢复", () => {
    const order = makeOrder();
    orderService.addItem({
      orderId: order.id,
      productTitle: "商品A",
      quantity: 1,
      unitPriceAmount: 10000,
    });

    const promo = promotionDao.create({
      name: "Fixed 500",
      type: "fixed_amount",
      status: "active",
      discountValue: 500,
    });
    const dc = discountCodeDao.create({
      code: "FLAT500",
      promotionId: promo.id,
    });

    orderService.applyDiscountCodeByCode(order.id, "FLAT500");
    const mid = orderService.getById(order.id);
    expect(mid.orderDiscountAmount).toBe(500);

    orderService.removeDiscountCode(order.id, dc.id);
    const final = orderService.getById(order.id);
    expect(final.orderDiscountAmount).toBe(0);
    expect(final.totalAmount).toBe(10000);

    const events = orderEventDao.findByOrderId(order.id);
    expect(events.some((e) => e.eventType === "discount_removed")).toBe(true);
  });

  test("同一订单不能重复应用折扣码", () => {
    const order = makeOrder();
    orderService.addItem({
      orderId: order.id,
      productTitle: "商品A",
      quantity: 1,
      unitPriceAmount: 10000,
    });

    const promo = promotionDao.create({
      name: "P1",
      type: "percentage",
      status: "active",
      discountValue: 5,
    });
    discountCodeDao.create({ code: "CODE1", promotionId: promo.id });
    discountCodeDao.create({ code: "CODE2", promotionId: promo.id });

    orderService.applyDiscountCodeByCode(order.id, "CODE1");
    expect(() =>
      orderService.applyDiscountCodeByCode(order.id, "CODE2"),
    ).toThrow("already has a discount code");
  });

  // ─── events ───
  test("listEvents 返回订单完整事件流水", () => {
    const order = makeOrder();
    orderService.addItem({
      orderId: order.id,
      productTitle: "商品A",
      quantity: 1,
      unitPriceAmount: 100,
    });
    orderService.update(order.id, { orderStatus: "completed" });

    const events = orderService.listEvents(order.id);
    expect(events.length).toBeGreaterThanOrEqual(3); // created + item_added + status_changed
    const types = events.map((e) => e.eventType);
    expect(types).toContain("order_created");
    expect(types).toContain("item_added");
    expect(types).toContain("order_status_changed");
  });
});
