import { test, expect } from "bun:test";
import { deriveFulfillmentStatus } from "./order-fulfillment";

test("无发货 → unfulfilled", () => {
  expect(deriveFulfillmentStatus([])).toBe("unfulfilled");
});

test("pending → unfulfilled", () => {
  expect(deriveFulfillmentStatus([{ status: "pending" }])).toBe("unfulfilled");
});

test("shipped → fulfilled", () => {
  expect(deriveFulfillmentStatus([{ status: "shipped" }])).toBe("fulfilled");
});

test("delivered → fulfilled", () => {
  expect(deriveFulfillmentStatus([{ status: "delivered" }])).toBe("fulfilled");
});

test("returned 优先", () => {
  expect(
    deriveFulfillmentStatus([{ status: "shipped" }, { status: "returned" }]),
  ).toBe("returned");
});
