import { test, expect } from "bun:test";
import { assertMetafieldValueMatchesDefinitionType } from "./metafield-rules";

test("text 要求 valueText 非空", () => {
  expect(() =>
    assertMetafieldValueMatchesDefinitionType("text", { valueText: null }),
  ).toThrow("definition type text");
  expect(() =>
    assertMetafieldValueMatchesDefinitionType("text", { valueText: "x" }),
  ).not.toThrow();
});

test("boolean 允许 0", () => {
  expect(() =>
    assertMetafieldValueMatchesDefinitionType("boolean", { valueBoolean: 0 }),
  ).not.toThrow();
});
