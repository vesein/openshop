import { test, expect } from "bun:test";
import {
  assertPaymentDeleteForbidden,
  validatePaymentBucketTotals,
} from "./payment-rules";

test("assertPaymentDeleteForbidden 文案", () => {
  expect(() => assertPaymentDeleteForbidden()).toThrow(
    "payments are append-only; keep the ledger and add a compensating record instead",
  );
});

test("validatePaymentBucketTotals", () => {
  expect(() => validatePaymentBucketTotals(10000, 10001, 0, 0)).toThrow(
    "captured payments cannot exceed order total",
  );
  expect(() => validatePaymentBucketTotals(10000, 5000, 10001, 0)).toThrow(
    "authorized payments cannot exceed order total",
  );
  expect(() => validatePaymentBucketTotals(10000, 5000, 0, 6000)).toThrow(
    "refunded payments cannot exceed captured payments",
  );
  expect(() => validatePaymentBucketTotals(10000, 10000, 0, 10000)).not.toThrow();
});
