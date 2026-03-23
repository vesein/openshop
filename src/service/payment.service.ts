import type { InferInsertModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { paymentDao } from "../db/dao";
import { payments, orders } from "../db/schema";
import { assertPaymentInsertValid, assertPaymentUpdateValid } from "./payment-rules";
import { syncOrderPaymentStatus } from "./order-payment-status";
import { recordOrderEvent } from "./order-events";

type PaymentInsert = InferInsertModel<typeof payments>;

function getPaymentStatus(orderId: number): string | undefined {
  return db.select({ ps: orders.paymentStatus })
    .from(orders).where(eq(orders.id, orderId)).get()?.ps;
}

/** 所有 payments 写入应经此层，保证与 orders.payment_status 一致 */
export const paymentService = {
  listByOrderId(orderId: number) {
    return paymentDao.findByOrderId(orderId);
  },

  findById(id: number) {
    return paymentDao.findById(id);
  },

  create(data: PaymentInsert) {
    return db.transaction(() => {
      assertPaymentInsertValid({
        orderId: data.orderId,
        amount: data.amount,
        currencyCode: data.currencyCode,
        status: data.status,
      });
      const row = paymentDao.create(data);
      const prevStatus = getPaymentStatus(data.orderId);
      syncOrderPaymentStatus(data.orderId);
      const nextStatus = getPaymentStatus(data.orderId);
      if (prevStatus !== nextStatus) {
        recordOrderEvent(data.orderId, "payment_status_changed", {
          from: prevStatus,
          to: nextStatus,
          paymentId: row.id,
        });
      }
      return row;
    });
  },

  update(id: number, data: Partial<PaymentInsert>) {
    return db.transaction(() => {
      assertPaymentUpdateValid(id, data);
      const before = paymentDao.findById(id);
      if (!before) throw new Error("Payment not found");
      const prevStatus = getPaymentStatus(before.orderId);
      const row = paymentDao.update(id, data);
      if (!row) throw new Error("Payment not found");
      syncOrderPaymentStatus(row.orderId);
      const nextStatus = getPaymentStatus(row.orderId);
      if (prevStatus !== nextStatus) {
        recordOrderEvent(row.orderId, "payment_status_changed", {
          from: prevStatus,
          to: nextStatus,
          paymentId: id,
        });
      }
      return row;
    });
  },
};
