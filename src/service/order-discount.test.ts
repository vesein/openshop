import { test, expect } from "bun:test";
import {
  computePromotionDiscountCents,
  maxPromotionDiscountAmongApplied,
} from "./order-discount";

test("percentage 折扣", () => {
  expect(
    computePromotionDiscountCents("percentage", '{"discountPercent": 10}', 10000),
  ).toBe(1000);
});

test("fixed_amount 满额减", () => {
  expect(
    computePromotionDiscountCents(
      "fixed_amount",
      '{"minAmount": 30000, "discountAmount": 5000}',
      40000,
    ),
  ).toBe(5000);
  expect(
    computePromotionDiscountCents(
      "fixed_amount",
      '{"minAmount": 30000, "discountAmount": 5000}',
      20000,
    ),
  ).toBe(0);
});

test("整单折扣不超过商品小计", () => {
  expect(
    computePromotionDiscountCents("fixed_amount", '{"minAmount": 0, "discountAmount": 99999}', 1000),
  ).toBe(1000);
});

test("free_shipping 不计入 order_discount_amount", () => {
  expect(computePromotionDiscountCents("free_shipping", "{}", 5000)).toBe(0);
});

test("多促销互斥只取最大", () => {
  const merchandise = 10000;
  const applied = [
    { type: "percentage", rulesJson: '{"discountPercent": 10}' },
    { type: "fixed_amount", rulesJson: '{"minAmount":0,"discountAmount":3000}' },
  ];
  expect(maxPromotionDiscountAmongApplied(applied, merchandise)).toBe(3000);
  expect(
    maxPromotionDiscountAmongApplied(
      [
        { type: "percentage", rulesJson: '{"discountPercent": 50}' },
        { type: "fixed_amount", rulesJson: '{"minAmount":0,"discountAmount": 4000}' },
      ],
      10000,
    ),
  ).toBe(5000);
});
