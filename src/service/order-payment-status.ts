import { eq } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";
import { formatTimestamp } from "../db/dao/utils";

/**
 * 与已移除的 SQLite 触发器 `trg_payments_refresh_order_*` / `trg_orders_normalize_payment_status_*` 一致。
 */
export function derivePaymentStatus(
  totalAmount: number,
  payments: { amount: number; status: string }[],
): string {
  const sumRefunded = payments
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + p.amount, 0);
  const sumCaptured = payments
    .filter((p) => p.status === "captured")
    .reduce((s, p) => s + p.amount, 0);
  const hasRefunded = payments.some((p) => p.status === "refunded");
  const hasAuthorized = payments.some((p) => p.status === "authorized");
  const hasPending = payments.some((p) => p.status === "pending");
  const hasFailed = payments.some((p) => p.status === "failed");

  if (sumRefunded >= totalAmount && hasRefunded) return "refunded";
  if (hasRefunded) return "partially_refunded";
  if (totalAmount === 0) return "paid";
  if (totalAmount > 0 && sumCaptured >= totalAmount) return "paid";
  if (sumCaptured > 0) return "partially_paid";
  if (hasAuthorized) return "authorized";
  if (hasPending) return "pending";
  if (hasFailed) return "failed";
  return "pending";
}

/**
 * 根据当前 `orders.total_amount` 与 `payments` 行重算 `payment_status`。
 * 可在已有 `db.transaction` 内调用（不再套一层事务）。
 */
export function syncOrderPaymentStatus(orderId: number) {
  const order = db
    .select({
      totalAmount: s.orders.totalAmount,
      paymentStatus: s.orders.paymentStatus,
    })
    .from(s.orders)
    .where(eq(s.orders.id, orderId))
    .get();
  if (!order) return;

  const rows = db
    .select({ amount: s.payments.amount, status: s.payments.status })
    .from(s.payments)
    .where(eq(s.payments.orderId, orderId))
    .all();

  const next = derivePaymentStatus(order.totalAmount, rows);
  if (order.paymentStatus === next) return;

  db.update(s.orders)
    .set({ paymentStatus: next, updatedAt: formatTimestamp() })
    .where(eq(s.orders.id, orderId))
    .run();
}
