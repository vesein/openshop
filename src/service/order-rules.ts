import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";
import { formatTimestamp } from "../db/dao/utils";

const BLOCKING_PAYMENT_STATUSES = ["authorized", "captured", "refunded"] as const;

export function hasBlockingPaymentActivity(orderId: number): boolean {
  const row = db
    .select({ id: s.payments.id })
    .from(s.payments)
    .where(
      and(
        eq(s.payments.orderId, orderId),
        inArray(s.payments.status, [...BLOCKING_PAYMENT_STATUSES]),
      ),
    )
    .limit(1)
    .get();
  return !!row;
}

export function assertOrderItemsMutable(orderId: number) {
  if (hasBlockingPaymentActivity(orderId)) {
    throw new Error("cannot change order items after payment activity");
  }
}

const AMOUNT_FIELDS = [
  "subtotalAmount",
  "discountAmount",
  "orderDiscountAmount",
  "shippingAmount",
  "shippingDiscountAmount",
  "taxAmount",
  "totalAmount",
] as const;

type OrderRow = typeof s.orders.$inferSelect;

/** 与 trg_orders_block_amount_changes_after_payment 一致：已有有效支付时禁止用户改金额相关列 */
export function assertOrderAmountPatchAllowed(
  orderId: number,
  patch: Partial<Record<(typeof AMOUNT_FIELDS)[number], unknown>>,
  prev: OrderRow,
) {
  if (!hasBlockingPaymentActivity(orderId)) return;
  for (const k of AMOUNT_FIELDS) {
    if (patch[k] !== undefined && patch[k] !== prev[k]) {
      throw new Error("cannot change order totals after payment activity");
    }
  }
}

/** 与 trg_orders_validate_status_transition_before_update 一致 */
export function assertOrderStatusTransition(prevStatus: string, nextStatus: string) {
  if (prevStatus === nextStatus) return;
  if (prevStatus === "open" && !["completed", "cancelled"].includes(nextStatus)) {
    throw new Error("invalid order status transition");
  }
  if (prevStatus === "completed" || prevStatus === "cancelled") {
    throw new Error("order status is immutable after completion or cancellation");
  }
}

/** 与 trg_order_discount_codes_validate_before_insert 一致 */
export function assertApplicableOrderDiscountCode(discountCodeId: number, promotionId: number) {
  const dc = db.select().from(s.discountCodes).where(eq(s.discountCodes.id, discountCodeId)).get();
  if (!dc || dc.promotionId !== promotionId) {
    throw new Error("discount code does not belong to the specified promotion");
  }
  if (dc.usageLimit != null && dc.usageCount >= dc.usageLimit) {
    throw new Error("discount code usage limit reached");
  }

  const p = db.select().from(s.promotions).where(eq(s.promotions.id, promotionId)).get();
  if (!p) throw new Error("Promotion not found");
  if (p.status !== "active") {
    throw new Error("promotion is not active");
  }

  const now = formatTimestamp();
  if (p.startsAt != null && p.startsAt > now) {
    throw new Error("promotion has not started");
  }
  if (p.endsAt != null && p.endsAt < now) {
    throw new Error("promotion has expired");
  }
  if (p.usageLimit != null && p.usageCount >= p.usageLimit) {
    throw new Error("promotion usage limit reached");
  }
}

/** 每单仅允许一个折扣码（与互斥取最大策略一致）；应用前须先移除已有码 */
export function assertOrderHasNoDiscountCode(orderId: number) {
  const row = db
    .select({ orderId: s.orderDiscountCodes.orderId })
    .from(s.orderDiscountCodes)
    .where(eq(s.orderDiscountCodes.orderId, orderId))
    .limit(1)
    .get();
  if (row) {
    throw new Error("order already has a discount code; remove it before applying another");
  }
}

/** 与 trg_order_discount_codes_increment_usage_after_insert 一致 */
export function incrementUsageAfterOrderDiscountInsert(promotionId: number, discountCodeId: number) {
  db.update(s.promotions)
    .set({
      usageCount: sql`${s.promotions.usageCount} + 1`,
      updatedAt: formatTimestamp(),
    })
    .where(eq(s.promotions.id, promotionId))
    .run();

  db.update(s.discountCodes)
    .set({
      usageCount: sql`${s.discountCodes.usageCount} + 1`,
      updatedAt: formatTimestamp(),
    })
    .where(eq(s.discountCodes.id, discountCodeId))
    .run();
}

/** 从订单移除已应用的折扣码时，与 increment 对称回退用量（不低于 0） */
export function decrementUsageAfterOrderDiscountRemove(promotionId: number, discountCodeId: number) {
  db.update(s.promotions)
    .set({
      usageCount: sql`(CASE WHEN ${s.promotions.usageCount} > 0 THEN ${s.promotions.usageCount} - 1 ELSE 0 END)`,
      updatedAt: formatTimestamp(),
    })
    .where(eq(s.promotions.id, promotionId))
    .run();

  db.update(s.discountCodes)
    .set({
      usageCount: sql`(CASE WHEN ${s.discountCodes.usageCount} > 0 THEN ${s.discountCodes.usageCount} - 1 ELSE 0 END)`,
      updatedAt: formatTimestamp(),
    })
    .where(eq(s.discountCodes.id, discountCodeId))
    .run();
}
