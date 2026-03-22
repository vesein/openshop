import { eq, sql } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";
import { formatTimestamp } from "../db/dao/utils";
import { syncOrderPaymentStatus } from "./order-payment-status";

/**
 * 与已移除的 SQLite 触发器一致：
 * total = sum(q*price) - sum(行折扣) - order_discount + shipping - shipping_discount + sum(税)
 */
export function computeOrderTotalAmount(input: {
  sumLineExtended: number;
  sumLineDiscount: number;
  orderDiscountAmount: number;
  shippingAmount: number;
  shippingDiscountAmount: number;
  sumLineTax: number;
}): number {
  return (
    input.sumLineExtended -
    input.sumLineDiscount -
    input.orderDiscountAmount +
    input.shippingAmount -
    input.shippingDiscountAmount +
    input.sumLineTax
  );
}

/**
 * 重算小计/税/总价（不新开事务），供已处于 `db.transaction` 内的流程调用。
 */
export function recalculateOrderTotalsCore(orderId: number) {
  const sums = db
    .select({
      sumLineExtended: sql<number>`coalesce(sum(${s.orderItems.quantity} * ${s.orderItems.unitPriceAmount}), 0)`,
      sumLineDiscount: sql<number>`coalesce(sum(${s.orderItems.discountAmount}), 0)`,
      sumLineTax: sql<number>`coalesce(sum(${s.orderItems.taxAmount}), 0)`,
    })
    .from(s.orderItems)
    .where(eq(s.orderItems.orderId, orderId))
    .get();

  const ext = sums?.sumLineExtended ?? 0;
  const lineDisc = sums?.sumLineDiscount ?? 0;
  const lineTax = sums?.sumLineTax ?? 0;

  const o = db
    .select({
      orderDiscountAmount: s.orders.orderDiscountAmount,
      shippingAmount: s.orders.shippingAmount,
      shippingDiscountAmount: s.orders.shippingDiscountAmount,
    })
    .from(s.orders)
    .where(eq(s.orders.id, orderId))
    .get();

  if (!o) {
    throw new Error(`Order ${orderId} not found`);
  }

  const total = computeOrderTotalAmount({
    sumLineExtended: ext,
    sumLineDiscount: lineDisc,
    orderDiscountAmount: o.orderDiscountAmount,
    shippingAmount: o.shippingAmount,
    shippingDiscountAmount: o.shippingDiscountAmount,
    sumLineTax: lineTax,
  });

  db.update(s.orders)
    .set({
      subtotalAmount: ext,
      discountAmount: lineDisc,
      taxAmount: lineTax,
      totalAmount: total,
      updatedAt: formatTimestamp(),
    })
    .where(eq(s.orders.id, orderId))
    .run();

  syncOrderPaymentStatus(orderId);
}

/** 按行项目汇总并重写 orders 的 subtotal/discount/tax/total（依赖当前行的运费与整单折扣字段） */
export function recalculateOrderTotals(orderId: number) {
  db.transaction(() => {
    recalculateOrderTotalsCore(orderId);
  });
}
