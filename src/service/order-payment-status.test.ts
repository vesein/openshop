import { test, expect } from "bun:test";
import { derivePaymentStatus } from "./order-payment-status";

test("total_amount=0 且无支付 → paid", () => {
  expect(derivePaymentStatus(0, [])).toBe("paid");
});

test("有 captured 且足额 → paid", () => {
  expect(
    derivePaymentStatus(10000, [{ amount: 10000, status: "captured" }]),
  ).toBe("paid");
});

test("部分 captured → partially_paid", () => {
  expect(
    derivePaymentStatus(10000, [{ amount: 3000, status: "captured" }]),
  ).toBe("partially_paid");
});

test("仅有 authorized", () => {
  expect(
    derivePaymentStatus(10000, [{ amount: 10000, status: "authorized" }]),
  ).toBe("authorized");
});

test("仅有 pending", () => {
  expect(
    derivePaymentStatus(10000, [{ amount: 10000, status: "pending" }]),
  ).toBe("pending");
});

test("有退款记录 → partially_refunded", () => {
  expect(
    derivePaymentStatus(
      10000,
      [
        { amount: 10000, status: "captured" },
        { amount: 2000, status: "refunded" },
      ],
    ),
  ).toBe("partially_refunded");
});

test("退款累计 ≥ 订单总额 → refunded", () => {
  expect(
    derivePaymentStatus(10000, [{ amount: 10000, status: "refunded" }]),
  ).toBe("refunded");
});
