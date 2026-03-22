import { test, expect } from "bun:test";
import { computeOrderTotalAmount } from "./order-totals";

test("computeOrderTotalAmount 与历史触发器公式一致", () => {
  expect(
    computeOrderTotalAmount({
      sumLineExtended: 10000,
      sumLineDiscount: 500,
      orderDiscountAmount: 1000,
      shippingAmount: 800,
      shippingDiscountAmount: 200,
      sumLineTax: 300,
    }),
  ).toBe(10000 - 500 - 1000 + 800 - 200 + 300);
});

test("全部为 0", () => {
  expect(
    computeOrderTotalAmount({
      sumLineExtended: 0,
      sumLineDiscount: 0,
      orderDiscountAmount: 0,
      shippingAmount: 0,
      shippingDiscountAmount: 0,
      sumLineTax: 0,
    }),
  ).toBe(0);
});
