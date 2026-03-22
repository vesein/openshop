import { test, expect } from "bun:test";
import { computeOptionSignatureFromState } from "./product-catalog";

test("无选项 → __default__", () => {
  expect(computeOptionSignatureFromState(0, 0, [])).toBe("__default__");
});

test("选项与链接数不一致 → null", () => {
  expect(computeOptionSignatureFromState(2, 1, [1])).toBe(null);
});

test("完整 → 拼接 id", () => {
  expect(computeOptionSignatureFromState(2, 2, [10, 20])).toBe("10,20");
});
