import { test, expect } from "bun:test";
import { assertOrderStatusTransition } from "./order-rules";

test("open → completed 允许", () => {
  expect(() => assertOrderStatusTransition("open", "completed")).not.toThrow();
});

test("open → open 无操作", () => {
  expect(() => assertOrderStatusTransition("open", "open")).not.toThrow();
});

test("completed 后不可改", () => {
  expect(() => assertOrderStatusTransition("completed", "open")).toThrow(
    "order status is immutable after completion or cancellation",
  );
});

test("open → processing 不允许", () => {
  expect(() => assertOrderStatusTransition("open", "processing")).toThrow(
    "invalid order status transition",
  );
});
