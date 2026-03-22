import { test, expect } from "bun:test";
import { assertAddressCustomerIdImmutable } from "./address-rules";

test("允许不改 customerId", () => {
  expect(() => assertAddressCustomerIdImmutable(1, {})).not.toThrow();
  expect(() => assertAddressCustomerIdImmutable(1, { customerId: 1 })).not.toThrow();
});

test("禁止修改 customerId", () => {
  expect(() => assertAddressCustomerIdImmutable(1, { customerId: 2 })).toThrow(
    "customer address customer_id is immutable",
  );
});
