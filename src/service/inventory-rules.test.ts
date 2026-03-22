import { test, expect } from "bun:test";
import {
  assertCanDisableBackorder,
  assertInventoryMovementInsertValid,
  levelDeltasForMovement,
  summedLevelsFromMovements,
} from "./inventory-rules";

test("levelDeltasForMovement：sold 同时影响 on_hand 与 reserved", () => {
  expect(levelDeltasForMovement("sold", -2)).toEqual({ onHand: -2, reserved: -2 });
});

test("未跟踪库存禁止流水", () => {
  expect(() =>
    assertInventoryMovementInsertValid(0, 0, 10, 0, "in", 1),
  ).toThrow("not allowed for untracked items");
});

test("in 必须为正", () => {
  expect(() =>
    assertInventoryMovementInsertValid(1, 0, 10, 0, "in", 0),
  ).toThrow("must be positive");
});

test("release 必须为负", () => {
  expect(() =>
    assertInventoryMovementInsertValid(1, 0, 10, 5, "release", 1),
  ).toThrow("must be negative");
});

test("无 backorder 时 reserved 不能大于 on_hand", () => {
  expect(() =>
    assertInventoryMovementInsertValid(1, 0, 5, 5, "reserve", 1),
  ).toThrow("exceed available stock without backorder");
});

test("允许 backorder 时可超卖预留", () => {
  expect(() =>
    assertInventoryMovementInsertValid(1, 1, 5, 5, "reserve", 1),
  ).not.toThrow();
});

test("summedLevelsFromMovements：多条流水聚合", () => {
  expect(
    summedLevelsFromMovements([
      { movementType: "in", quantityDelta: 10 },
      { movementType: "reserve", quantityDelta: 3 },
    ]),
  ).toEqual({ onHand: 10, reserved: 3 });
});

test("禁止在 reserved > on_hand 时关闭 backorder", () => {
  expect(() => assertCanDisableBackorder(1, 0, 5, 6)).toThrow("cannot disable backorder");
  expect(() => assertCanDisableBackorder(1, 0, 6, 5)).not.toThrow();
});
