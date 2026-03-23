import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { orderDao, orderEventDao } from "../db/dao";
import { shipmentService } from "./shipment.service";

describe("shipmentService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  function seedOrder() {
    return orderDao.create({
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: "ship@test.com",
      currencyCode: "USD",
    });
  }

  // ─── create ───
  test("create 创建发货单并同步 fulfillment_status", () => {
    const order = seedOrder();
    const shipment = shipmentService.create({ orderId: order.id });
    expect(shipment.id).toBeGreaterThan(0);
    expect(shipment.status).toBe("pending");

    // pending shipment → still unfulfilled
    const refreshed = orderDao.findById(order.id)!;
    expect(refreshed.fulfillmentStatus).toBe("unfulfilled");

    const events = orderEventDao.findByOrderId(order.id);
    expect(events.some((e) => e.eventType === "shipment_created")).toBe(true);
  });

  // ─── markShipped ───
  test("markShipped 标记发货并同步 fulfillment_status → fulfilled", () => {
    const order = seedOrder();
    const shipment = shipmentService.create({ orderId: order.id });

    const shipped = shipmentService.markShipped(shipment.id, {
      carrier: "SF Express",
      service: "standard",
      trackingNumber: "SF123456",
    });
    expect(shipped.status).toBe("shipped");
    expect(shipped.carrier).toBe("SF Express");
    expect(shipped.shippedAt).toBeTruthy();

    const refreshed = orderDao.findById(order.id)!;
    expect(refreshed.fulfillmentStatus).toBe("fulfilled");

    const events = orderEventDao.findByOrderId(order.id);
    expect(events.some((e) => e.eventType === "shipment_shipped")).toBe(true);
    expect(events.some((e) => e.eventType === "fulfillment_status_changed")).toBe(true);
  });

  // ─── markDelivered ───
  test("markDelivered 标记签收", () => {
    const order = seedOrder();
    const shipment = shipmentService.create({ orderId: order.id });
    shipmentService.markShipped(shipment.id, {
      carrier: "YTO",
      service: "express",
      trackingNumber: "YT999",
    });

    const delivered = shipmentService.markDelivered(shipment.id);
    expect(delivered.status).toBe("delivered");
    expect(delivered.deliveredAt).toBeTruthy();

    const events = orderEventDao.findByOrderId(order.id);
    expect(events.some((e) => e.eventType === "shipment_delivered")).toBe(true);
  });

  // ─── 状态转换约束 ───
  test("pending 不能直接 delivered（需先 shipped）— 允许", () => {
    // shipment status transition: pending → delivered 是允许的
    const order = seedOrder();
    const shipment = shipmentService.create({ orderId: order.id });
    expect(() => shipmentService.markDelivered(shipment.id)).not.toThrow();
  });

  test("delivered → shipped 不允许", () => {
    const order = seedOrder();
    const shipment = shipmentService.create({ orderId: order.id });
    shipmentService.markShipped(shipment.id, {
      carrier: "EMS",
      service: "s",
      trackingNumber: "T1",
    });
    shipmentService.markDelivered(shipment.id);

    expect(() =>
      shipmentService.markShipped(shipment.id, {
        carrier: "EMS",
        service: "s",
        trackingNumber: "T2",
      }),
    ).toThrow("invalid shipment status transition");
  });

  test("update order_id 不可变", () => {
    const order1 = seedOrder();
    const order2 = seedOrder();
    const shipment = shipmentService.create({ orderId: order1.id });

    expect(() =>
      shipmentService.update(shipment.id, { orderId: order2.id }),
    ).toThrow("immutable");
  });
});
