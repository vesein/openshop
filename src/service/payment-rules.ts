import { and, eq } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";

function sumPaymentAmountForStatus(
  orderId: number,
  status: string,
  excludePaymentId?: number,
): number {
  const rows = db
    .select({ amount: s.payments.amount, id: s.payments.id })
    .from(s.payments)
    .where(and(eq(s.payments.orderId, orderId), eq(s.payments.status, status)))
    .all();
  return rows
    .filter((r) => excludePaymentId == null || r.id !== excludePaymentId)
    .reduce((acc, r) => acc + r.amount, 0);
}

/** 与 trg_payments_validate_before_insert 一致 */
export function assertPaymentInsertValid(input: {
  orderId: number;
  amount: number;
  currencyCode: string;
  status: string;
}) {
  const order = db
    .select({
      currencyCode: s.orders.currencyCode,
      totalAmount: s.orders.totalAmount,
    })
    .from(s.orders)
    .where(eq(s.orders.id, input.orderId))
    .get();
  if (!order) throw new Error("Order not found");
  if (input.currencyCode !== order.currencyCode) {
    throw new Error("payment currency must match order currency");
  }

  if (input.status === "captured") {
    const sum = sumPaymentAmountForStatus(input.orderId, "captured");
    if (sum + input.amount > order.totalAmount) {
      throw new Error("captured payments cannot exceed order total");
    }
  }
  if (input.status === "authorized") {
    const sum = sumPaymentAmountForStatus(input.orderId, "authorized");
    if (sum + input.amount > order.totalAmount) {
      throw new Error("authorized payments cannot exceed order total");
    }
  }
  if (input.status === "refunded") {
    const refunded = sumPaymentAmountForStatus(input.orderId, "refunded");
    const captured = sumPaymentAmountForStatus(input.orderId, "captured");
    if (refunded + input.amount > captured) {
      throw new Error("refunded payments cannot exceed captured payments");
    }
  }
}

/** 禁止删除支付记录（与 trg_payments_block_delete 一致） */
export function assertPaymentDeleteForbidden() {
  throw new Error("payments are append-only; keep the ledger and add a compensating record instead");
}

function paymentBucketsAfterPatch(
  orderId: number,
  paymentId: number,
  merged: { amount: number; status: string },
) {
  const rows = db
    .select({
      id: s.payments.id,
      amount: s.payments.amount,
      status: s.payments.status,
    })
    .from(s.payments)
    .where(eq(s.payments.orderId, orderId))
    .all();
  let captured = 0;
  let authorized = 0;
  let refunded = 0;
  for (const r of rows) {
    const amount = r.id === paymentId ? merged.amount : r.amount;
    const status = r.id === paymentId ? merged.status : r.status;
    if (status === "captured") captured += amount;
    if (status === "authorized") authorized += amount;
    if (status === "refunded") refunded += amount;
  }
  return { captured, authorized, refunded };
}

/** 更新支付前校验：币种、order_id 不变；captured/authorized/refunded 汇总与 insert 规则一致 */
export function assertPaymentUpdateValid(
  paymentId: number,
  patch: Partial<{
    amount: number;
    currencyCode: string;
    status: string;
    orderId: number;
  }>,
) {
  const prev = db.select().from(s.payments).where(eq(s.payments.id, paymentId)).get();
  if (!prev) throw new Error("Payment not found");
  if (patch.orderId != null && patch.orderId !== prev.orderId) {
    throw new Error("payment order_id is immutable");
  }

  const merged = {
    amount: patch.amount ?? prev.amount,
    currencyCode: patch.currencyCode ?? prev.currencyCode,
    status: patch.status ?? prev.status,
  };

  const order = db
    .select({
      currencyCode: s.orders.currencyCode,
      totalAmount: s.orders.totalAmount,
    })
    .from(s.orders)
    .where(eq(s.orders.id, prev.orderId))
    .get();
  if (!order) throw new Error("Order not found");
  if (merged.currencyCode !== order.currencyCode) {
    throw new Error("payment currency must match order currency");
  }

  const { captured, authorized, refunded } = paymentBucketsAfterPatch(
    prev.orderId,
    paymentId,
    merged,
  );
  validatePaymentBucketTotals(order.totalAmount, captured, authorized, refunded);
}

/** 与 assertPaymentInsertValid 汇总约束一致（便于单测） */
export function validatePaymentBucketTotals(
  orderTotal: number,
  captured: number,
  authorized: number,
  refunded: number,
): void {
  if (captured > orderTotal) {
    throw new Error("captured payments cannot exceed order total");
  }
  if (authorized > orderTotal) {
    throw new Error("authorized payments cannot exceed order total");
  }
  if (refunded > captured) {
    throw new Error("refunded payments cannot exceed captured payments");
  }
}
