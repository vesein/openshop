/** 与 trg_inventory_movements_validate_before_insert / apply_after_insert 一致 */

const POSITIVE_TYPES = new Set(["in", "reserve", "returned"]);
const NEGATIVE_TYPES = new Set(["release", "sold"]);

export function levelDeltasForMovement(movementType: string, quantityDelta: number) {
  let onHand = 0;
  let reserved = 0;
  if (movementType === "in" || movementType === "returned" || movementType === "sold" || movementType === "adjust") {
    onHand = quantityDelta;
  }
  if (movementType === "reserve" || movementType === "release" || movementType === "sold") {
    reserved = quantityDelta;
  }
  return { onHand, reserved };
}

export function reservedDeltaForMovement(movementType: string, quantityDelta: number) {
  return movementType === "reserve" || movementType === "release" || movementType === "sold"
    ? quantityDelta
    : 0;
}

export function onHandDeltaForMovement(movementType: string, quantityDelta: number) {
  return movementType === "in" || movementType === "returned" || movementType === "sold" || movementType === "adjust"
    ? quantityDelta
    : 0;
}

export function assertInventoryMovementInsertValid(
  tracked: number,
  allowBackorder: number,
  onHand: number,
  reserved: number,
  movementType: string,
  quantityDelta: number,
) {
  if (tracked === 0) {
    throw new Error("inventory movements are not allowed for untracked items");
  }

  if (POSITIVE_TYPES.has(movementType) && quantityDelta <= 0) {
    throw new Error("inventory movement must be positive for this movement type");
  }
  if (NEGATIVE_TYPES.has(movementType) && quantityDelta >= 0) {
    throw new Error("inventory movement must be negative for this movement type");
  }
  if (movementType === "adjust" && quantityDelta === 0) {
    throw new Error("inventory adjustment cannot be zero");
  }

  const newReserved = reserved + reservedDeltaForMovement(movementType, quantityDelta);
  if (newReserved < 0) {
    throw new Error("inventory reserved quantity cannot go negative");
  }

  if (allowBackorder === 0) {
    const newOnHand = onHand + onHandDeltaForMovement(movementType, quantityDelta);
    if (newReserved > newOnHand) {
      throw new Error("inventory would exceed available stock without backorder");
    }
  }
}

/** 与 trg_inventory_items_refresh_levels_after_tracked_update 中 SUM 公式一致 */
export function summedLevelsFromMovements(
  movements: { movementType: string; quantityDelta: number }[],
) {
  let onHand = 0;
  let reserved = 0;
  for (const m of movements) {
    const d = levelDeltasForMovement(m.movementType, m.quantityDelta);
    onHand += d.onHand;
    reserved += d.reserved;
  }
  return { onHand, reserved };
}

/** 与 trg_inventory_items_validate_backorder_before_update 一致 */
export function assertCanDisableBackorder(
  prevAllowBackorder: number,
  nextAllowBackorder: number,
  onHand: number,
  reserved: number,
) {
  if (nextAllowBackorder === 0 && prevAllowBackorder === 1 && reserved > onHand) {
    throw new Error("cannot disable backorder while reserved exceeds on_hand");
  }
}
