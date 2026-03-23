import { eq, sql } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";
import { formatTimestamp } from "../db/dao/utils";

/**
 * 单笔促销在「商品小计 = Σ(q×价) − 行折扣」上可减免金额（分，非负）。
 * free_shipping / bogo 不写入 order_discount_amount（由运费或行级逻辑另行处理）。
 */
export function computePromotionDiscountCents(
  type: string,
  discountValue: number,
  minPurchaseAmount: number,
  merchandiseSubtotalCents: number,
): number {
  if (merchandiseSubtotalCents <= 0) return 0;

  if (type === "percentage") {
    if (discountValue <= 0) return 0;
    if (merchandiseSubtotalCents < minPurchaseAmount) return 0;
    return Math.floor((merchandiseSubtotalCents * discountValue) / 100);
  }

  if (type === "fixed_amount") {
    if (discountValue <= 0) return 0;
    if (merchandiseSubtotalCents < minPurchaseAmount) return 0;
    return Math.min(discountValue, merchandiseSubtotalCents);
  }

  return 0;
}

/**
 * 对已关联的多个促销，在「商品小计」上**互斥只取最大**可减金额（分），不叠加。
 */
export function maxPromotionDiscountAmongApplied(
  applied: { type: string; discountValue: number; minPurchaseAmount: number }[],
  merchandiseSubtotalCents: number,
): number {
  if (applied.length === 0 || merchandiseSubtotalCents <= 0) return 0;
  let best = 0;
  for (const row of applied) {
    best = Math.max(
      best,
      computePromotionDiscountCents(row.type, row.discountValue, row.minPurchaseAmount, merchandiseSubtotalCents),
    );
  }
  return Math.min(best, merchandiseSubtotalCents);
}

/** 根据当前订单行与已应用的折扣码，写回 orders.order_discount_amount（互斥取最大；应用层限制每单仅一码） */
export function syncOrderDiscountAmountFromAppliedCodes(orderId: number): void {
  const sums = db
    .select({
      sumLineExtended: sql<number>`coalesce(sum(${s.orderItems.quantity} * ${s.orderItems.unitPriceAmount}), 0)`,
      sumLineDiscount: sql<number>`coalesce(sum(${s.orderItems.discountAmount}), 0)`,
    })
    .from(s.orderItems)
    .where(eq(s.orderItems.orderId, orderId))
    .get();

  const ext = sums?.sumLineExtended ?? 0;
  const lineDisc = sums?.sumLineDiscount ?? 0;
  const merchandise = Math.max(0, ext - lineDisc);

  const applied = db
    .select({
      type: s.promotions.type,
      discountValue: s.promotions.discountValue,
      minPurchaseAmount: s.promotions.minPurchaseAmount,
    })
    .from(s.orderDiscountCodes)
    .innerJoin(s.promotions, eq(s.orderDiscountCodes.promotionId, s.promotions.id))
    .where(eq(s.orderDiscountCodes.orderId, orderId))
    .all();

  const orderDiscountAmount = maxPromotionDiscountAmongApplied(applied, merchandise);

  db.update(s.orders)
    .set({
      orderDiscountAmount,
      updatedAt: formatTimestamp(),
    })
    .where(eq(s.orders.id, orderId))
    .run();
}
