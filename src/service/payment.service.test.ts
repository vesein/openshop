import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { orderDao, orderItemDao, orderEventDao } from "../db/dao";
import { paymentService } from "./payment.service";

describe("paymentService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  function seedOrder(totalHint: number) {
    const order = orderDao.create({
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: "pay@test.com",
      currencyCode: "USD",
    });
    // 添加行项目使 total > 0
    orderItemDao.create({
      orderId: order.id,
      productTitle: "P",
      quantity: 1,
      unitPriceAmount: totalHint,
    });
    // 手动设置 totalAmount（绕过 service 重算，直接用 DAO）
    orderDao.update(order.id, {
      subtotalAmount: totalHint,
      totalAmount: totalHint,
    });
    return orderDao.findById(order.id)!;
  }

  // ─── create ───
  test("create captured 支付后订单变为 paid", () => {
    const order = seedOrder(5000);
    const payment = paymentService.create({
      orderId: order.id,
      provider: "stripe",
      amount: 5000,
      currencyCode: "USD",
      status: "captured",
    });
    expect(payment.id).toBeGreaterThan(0);

    const refreshed = orderDao.findById(order.id)!;
    expect(refreshed.paymentStatus).toBe("paid");
  });

  test("create 记录 payment_status_changed 事件", () => {
    const order = seedOrder(3000);
    paymentService.create({
      orderId: order.id,
      provider: "manual",
      amount: 3000,
      currencyCode: "USD",
      status: "captured",
    });

    const events = orderEventDao.findByOrderId(order.id);
    const psEvent = events.find((e) => e.eventType === "payment_status_changed");
    expect(psEvent).toBeTruthy();
    const detail = JSON.parse(psEvent!.detailJson);
    expect(detail.from).toBe("pending");
    expect(detail.to).toBe("paid");
  });

  test("create 部分支付 → partially_paid", () => {
    const order = seedOrder(10000);
    paymentService.create({
      orderId: order.id,
      provider: "stripe",
      amount: 5000,
      currencyCode: "USD",
      status: "captured",
    });

    const refreshed = orderDao.findById(order.id)!;
    expect(refreshed.paymentStatus).toBe("partially_paid");
  });

  test("create 币种不匹配抛错", () => {
    const order = seedOrder(1000);
    expect(() =>
      paymentService.create({
        orderId: order.id,
        provider: "stripe",
        amount: 1000,
        currencyCode: "EUR",
        status: "captured",
      }),
    ).toThrow("currency must match");
  });

  test("create captured 超过 total 抛错", () => {
    const order = seedOrder(1000);
    expect(() =>
      paymentService.create({
        orderId: order.id,
        provider: "stripe",
        amount: 2000,
        currencyCode: "USD",
        status: "captured",
      }),
    ).toThrow("cannot exceed order total");
  });

  // ─── update ───
  test("update 状态变化记录事件", () => {
    const order = seedOrder(5000);
    const payment = paymentService.create({
      orderId: order.id,
      provider: "stripe",
      amount: 5000,
      currencyCode: "USD",
      status: "authorized",
    });

    // authorized → captured
    paymentService.update(payment.id, { status: "captured" });

    const refreshed = orderDao.findById(order.id)!;
    expect(refreshed.paymentStatus).toBe("paid");

    const events = orderEventDao.findByOrderId(order.id);
    const statusEvents = events.filter((e) => e.eventType === "payment_status_changed");
    // authorized → captured 至少一次
    expect(statusEvents.length).toBeGreaterThanOrEqual(1);
  });

  test("update order_id 不可变", () => {
    const order1 = seedOrder(1000);
    const order2 = seedOrder(1000);
    const payment = paymentService.create({
      orderId: order1.id,
      provider: "manual",
      amount: 500,
      currencyCode: "USD",
      status: "pending",
    });

    expect(() =>
      paymentService.update(payment.id, { orderId: order2.id }),
    ).toThrow("immutable");
  });
});
