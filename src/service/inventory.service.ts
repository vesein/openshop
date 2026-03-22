import { eq } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";
import { formatTimestamp } from "../db/dao/utils";
import { inventoryMovementDao } from "../db/dao";
import {
  assertCanDisableBackorder,
  assertInventoryMovementInsertValid,
  levelDeltasForMovement,
  summedLevelsFromMovements,
} from "./inventory-rules";

function ensureInventoryLevelRow(inventoryItemId: number) {
  db.insert(s.inventoryLevels)
    .values({ inventoryItemId })
    .onConflictDoNothing()
    .run();
}

function hasMovementsForItem(inventoryItemId: number) {
  return inventoryMovementDao.findByInventoryItemId(inventoryItemId, { limit: 1 }).length > 0;
}

function listMovementsForItem(inventoryItemId: number) {
  return inventoryMovementDao.findAllByInventoryItemId(inventoryItemId);
}

/** 与 trg_inventory_items_refresh_levels_after_tracked_update 一致 */
function refreshLevelsAfterTrackedChange(inventoryItemId: number, tracked: number) {
  ensureInventoryLevelRow(inventoryItemId);
  if (tracked === 0) {
    db.update(s.inventoryLevels)
      .set({ onHand: 0, reserved: 0, updatedAt: formatTimestamp() })
      .where(eq(s.inventoryLevels.inventoryItemId, inventoryItemId))
      .run();
    return;
  }
  const movements = listMovementsForItem(inventoryItemId);
  const { onHand, reserved } = summedLevelsFromMovements(movements);
  db.update(s.inventoryLevels)
    .set({ onHand, reserved, updatedAt: formatTimestamp() })
    .where(eq(s.inventoryLevels.inventoryItemId, inventoryItemId))
    .run();
}

export const inventoryService = {
  /**
   * 与 trg_inventory_items_* UPDATE 触发器一致（variant_id / tracked / allow_backorder）。
   * 若存在库存流水，则禁止修改 tracked。
   */
  patchInventoryItemByVariantId(
    variantId: number,
    patch: Partial<{ variantId: number; tracked: number; allowBackorder: number }>,
  ) {
    return db.transaction(() => {
      const item = db
        .select()
        .from(s.inventoryItems)
        .where(eq(s.inventoryItems.variantId, variantId))
        .get();
      if (!item) throw new Error(`No inventory item for variant ${variantId}`);

      if (patch.variantId != null && patch.variantId !== item.variantId) {
        throw new Error(
          "inventory item variant_id is immutable; create a new inventory item for another variant",
        );
      }

      if (patch.tracked != null && patch.tracked !== item.tracked) {
        if (hasMovementsForItem(item.id)) {
          throw new Error("tracked flag is immutable after inventory history exists");
        }
      }

      ensureInventoryLevelRow(item.id);
      const level = db
        .select()
        .from(s.inventoryLevels)
        .where(eq(s.inventoryLevels.inventoryItemId, item.id))
        .get();
      if (!level) throw new Error("inventory level row missing");

      if (patch.allowBackorder !== undefined) {
        assertCanDisableBackorder(item.allowBackorder, patch.allowBackorder, level.onHand, level.reserved);
      }

      const trackedWillChange = patch.tracked !== undefined && patch.tracked !== item.tracked;

      const updated = db
        .update(s.inventoryItems)
        .set({
          ...(patch.tracked !== undefined ? { tracked: patch.tracked } : {}),
          ...(patch.allowBackorder !== undefined ? { allowBackorder: patch.allowBackorder } : {}),
          updatedAt: formatTimestamp(),
        })
        .where(eq(s.inventoryItems.id, item.id))
        .returning()
        .get();

      if (!updated) throw new Error("inventory item not found");

      if (trackedWillChange && patch.tracked !== undefined) {
        refreshLevelsAfterTrackedChange(item.id, patch.tracked);
      }

      return updated;
    });
  },

  recordStockMovement(data: {
    variantId: number;
    movementType: string;
    quantityDelta: number;
    referenceType?: string;
    referenceId?: number;
    note?: string;
  }) {
    return db.transaction(() => {
      const item = db
        .select()
        .from(s.inventoryItems)
        .where(eq(s.inventoryItems.variantId, data.variantId))
        .get();
      if (!item) throw new Error(`No inventory item for variant ${data.variantId}`);

      ensureInventoryLevelRow(item.id);
      const level = db
        .select()
        .from(s.inventoryLevels)
        .where(eq(s.inventoryLevels.inventoryItemId, item.id))
        .get();
      if (!level) throw new Error("inventory level row missing");

      assertInventoryMovementInsertValid(
        item.tracked,
        item.allowBackorder,
        level.onHand,
        level.reserved,
        data.movementType,
        data.quantityDelta,
      );

      const movement = db
        .insert(s.inventoryMovements)
        .values({
          inventoryItemId: item.id,
          movementType: data.movementType,
          quantityDelta: data.quantityDelta,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          note: data.note ?? "",
        })
        .returning()
        .get();

      if (item.tracked === 1) {
        const { onHand, reserved } = levelDeltasForMovement(data.movementType, data.quantityDelta);
        db.update(s.inventoryLevels)
          .set({
            onHand: level.onHand + onHand,
            reserved: level.reserved + reserved,
            updatedAt: formatTimestamp(),
          })
          .where(eq(s.inventoryLevels.inventoryItemId, item.id))
          .run();
      }

      return movement;
    });
  },
};
