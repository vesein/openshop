import { test, expect } from "bun:test";
import { assertMenuItemParentChain } from "./menu-rules";

test("无父节点", () => {
  expect(() =>
    assertMenuItemParentChain(1, null, new Map()),
  ).not.toThrow();
});

test("自引用", () => {
  expect(() =>
    assertMenuItemParentChain(1, 1, new Map([[1, null]])),
  ).toThrow("menu item cannot parent itself");
});

test("链上无环", () => {
  const m = new Map<number, number | null>([
    [1, null],
    [2, 1],
    [3, 2],
  ]);
  expect(() => assertMenuItemParentChain(4, 3, m)).not.toThrow();
});

test("会形成环：新父的祖先链经过自身", () => {
  // 1<-2<-3 ，若将 2 的父设为 3，则 3->2->… 链上会再遇到要移动的节点（与触发器语义一致）
  const m = new Map<number, number | null>([
    [1, null],
    [2, 1],
    [3, 2],
  ]);
  expect(() => assertMenuItemParentChain(2, 3, m)).toThrow("menu item cycle detected");
});
