import { test, expect } from "bun:test";
import {
  computePromotionDiscountCents,
  maxPromotionDiscountAmongApplied,
} from "./order-discount";

test("percentage 折扣", () => {
  expect(
    computePromotionDiscountCents("percentage", 10, 0, 10000),
  ).toBe(1000);
});

test("fixed_amount 满额减", () => {
  expect(
    computePromotionDiscountCents("fixed_amount", 5000, 30000, 40000),
  ).toBe(5000);
  expect(
    computePromotionDiscountCents("fixed_amount", 5000, 30000, 20000),
  ).toBe(0);
});

test("整单折扣不超过商品小计", () => {
  expect(
    computePromotionDiscountCents("fixed_amount", 99999, 0, 1000),
  ).toBe(1000);
});

test("free_shipping 不计入 order_discount_amount", () => {
  expect(computePromotionDiscountCents("free_shipping", 0, 0, 5000)).toBe(0);
});

test("percentage 满额门槛", () => {
  expect(computePromotionDiscountCents("percentage", 10, 20000, 10000)).toBe(0);
  expect(computePromotionDiscountCents("percentage", 10, 20000, 30000)).toBe(3000);
});

test("多促销互斥只取最大", () => {
  const merchandise = 10000;
  const applied = [
    { type: "percentage", discountValue: 10, minPurchaseAmount: 0 },
    { type: "fixed_amount", discountValue: 3000, minPurchaseAmount: 0 },
  ];
  expect(maxPromotionDiscountAmongApplied(applied, merchandise)).toBe(3000);
  expect(
    maxPromotionDiscountAmongApplied(
      [
        { type: "percentage", discountValue: 50, minPurchaseAmount: 0 },
        { type: "fixed_amount", discountValue: 4000, minPurchaseAmount: 0 },
      ],
      10000,
    ),
  ).toBe(5000);
});
