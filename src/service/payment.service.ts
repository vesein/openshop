import type { InferInsertModel } from "drizzle-orm";
import { db } from "../db/index";
import { paymentDao } from "../db/dao";
import { payments } from "../db/schema";
import { assertPaymentInsertValid, assertPaymentUpdateValid } from "./payment-rules";
import { syncOrderPaymentStatus } from "./order-payment-status";

type PaymentInsert = InferInsertModel<typeof payments>;

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
      syncOrderPaymentStatus(data.orderId);
      return row;
    });
  },

  update(id: number, data: Partial<PaymentInsert>) {
    return db.transaction(() => {
      assertPaymentUpdateValid(id, data);
      const row = paymentDao.update(id, data);
      if (!row) throw new Error("Payment not found");
      syncOrderPaymentStatus(row.orderId);
      return row;
    });
  },
};
