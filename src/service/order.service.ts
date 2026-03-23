import { orderDao, orderItemDao, orderDiscountCodeDao, discountCodeDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index";
import { orders, orderItems, orderDiscountCodes, payments, shipments } from "../db/schema";
import { formatTimestamp } from "../db/dao/utils";
import { syncOrderFulfillmentStatus } from "./order-fulfillment";
import { paymentService } from "./payment.service";
import {
  assertApplicableOrderDiscountCode,
  assertOrderAmountPatchAllowed,
  assertOrderHasNoDiscountCode,
  assertOrderItemsMutable,
  assertOrderStatusTransition,
  decrementUsageAfterOrderDiscountRemove,
  incrementUsageAfterOrderDiscountInsert,
} from "./order-rules";
import { syncOrderDiscountAmountFromAppliedCodes } from "./order-discount";
import { recalculateOrderTotalsCore } from "./order-totals";
import { shipmentService } from "./shipment.service";
import { recordOrderEvent, listOrderEvents } from "./order-events";

type OrderInsert = InferInsertModel<typeof orders>;
type OrderItemInsert = InferInsertModel<typeof orderItems>;
type PaymentInsert = InferInsertModel<typeof payments>;
type ShipmentInsert = InferInsertModel<typeof shipments>;

export const orderService = {
  list(opts: {
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    customerId?: number;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const items = orderDao.list(opts);
    const total = orderDao.count({
      status: opts.status,
      paymentStatus: opts.paymentStatus,
      fulfillmentStatus: opts.fulfillmentStatus,
      customerId: opts.customerId,
      search: opts.search,
      from: opts.from,
      to: opts.to,
    });
    return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 20 };
  },

  getById(id: number) {
    const order = orderDao.findById(id);
    if (!order) throw new Error("Order not found");
    return order;
  },

  getByNumber(orderNumber: string) {
    const order = orderDao.findByNumber(orderNumber);
    if (!order) throw new Error("Order not found");
    return order;
  },

  create(data: OrderInsert) {
    return db.transaction(() => {
      const row = orderDao.create(data);
      recalculateOrderTotalsCore(row.id);
      syncOrderFulfillmentStatus(row.id);
      recordOrderEvent(row.id, "order_created", { orderNumber: row.orderNumber });
      const next = orderDao.findById(row.id);
      if (!next) throw new Error("Order not found");
      return next;
    });
  },

  update(id: number, data: Partial<OrderInsert>) {
    return db.transaction(() => {
      const prev = db.select().from(orders).where(eq(orders.id, id)).get();
      if (!prev) throw new Error("Order not found");
      assertOrderAmountPatchAllowed(id, data, prev);
      if (data.orderStatus != null && data.orderStatus !== prev.orderStatus) {
        assertOrderStatusTransition(prev.orderStatus, data.orderStatus);
        if (data.orderStatus === "cancelled") {
          data = { ...data, cancelledAt: formatTimestamp() };
        }
      }
      orderDao.update(id, data);
      recalculateOrderTotalsCore(id);
      syncOrderFulfillmentStatus(id);
      if (data.orderStatus != null && data.orderStatus !== prev.orderStatus) {
        recordOrderEvent(id, "order_status_changed", {
          from: prev.orderStatus,
          to: data.orderStatus,
        });
      }
      const next = orderDao.findById(id);
      if (!next) throw new Error("Order not found");
      return next;
    });
  },

  // order items
  listItems(orderId: number) {
    return orderItemDao.findByOrderId(orderId);
  },

  addItem(data: OrderItemInsert) {
    return db.transaction(() => {
      assertOrderItemsMutable(data.orderId);
      const item = orderItemDao.create(data);
      recalculateOrderTotalsCore(data.orderId);
      recordOrderEvent(data.orderId, "item_added", {
        itemId: item.id,
        productTitle: item.productTitle,
        quantity: item.quantity,
      });
      return item;
    });
  },

  updateItem(id: number, data: Partial<OrderItemInsert>) {
    return db.transaction(() => {
      const before = orderItemDao.findById(id);
      if (!before) throw new Error("Order item not found");
      if (data.orderId != null && data.orderId !== before.orderId) {
        throw new Error("order item order_id is immutable; recreate the item under the target order");
      }
      assertOrderItemsMutable(before.orderId);
      const item = orderItemDao.update(id, data);
      if (!item) throw new Error("Order item not found");
      recalculateOrderTotalsCore(item.orderId);
      recordOrderEvent(item.orderId, "item_updated", { itemId: id });
      return item;
    });
  },

  removeItem(id: number) {
    return db.transaction(() => {
      const before = orderItemDao.findById(id);
      if (before) assertOrderItemsMutable(before.orderId);
      const row = orderItemDao.delete(id);
      if (row) {
        recalculateOrderTotalsCore(row.orderId);
        recordOrderEvent(row.orderId, "item_removed", {
          itemId: id,
          productTitle: row.productTitle,
        });
      }
      return row;
    });
  },

  // payments（实现见 paymentService）
  listPayments(orderId: number) {
    return paymentService.listByOrderId(orderId);
  },

  createPayment(data: PaymentInsert) {
    return paymentService.create(data);
  },

  updatePayment(id: number, data: Partial<PaymentInsert>) {
    return paymentService.update(id, data);
  },

  // shipments（实现见 shipmentService）
  getShipment(orderId: number) {
    return shipmentService.findByOrderId(orderId);
  },

  createShipment(data: ShipmentInsert) {
    return shipmentService.create(data);
  },

  updateShipment(id: number, data: Partial<ShipmentInsert>) {
    return shipmentService.update(id, data);
  },

  markShipped(id: number, tracking: { carrier: string; service: string; trackingNumber: string; trackingUrl?: string }) {
    return shipmentService.markShipped(id, tracking);
  },

  markDelivered(id: number) {
    return shipmentService.markDelivered(id);
  },

  // discount codes
  listDiscountCodes(orderId: number) {
    return orderDiscountCodeDao.findByOrderId(orderId);
  },

  applyDiscountCode(orderId: number, discountCodeId: number, promotionId: number) {
    return db.transaction(() => {
      assertOrderHasNoDiscountCode(orderId);
      assertApplicableOrderDiscountCode(discountCodeId, promotionId);
      orderDiscountCodeDao.apply(orderId, discountCodeId, promotionId);
      incrementUsageAfterOrderDiscountInsert(promotionId, discountCodeId);
      syncOrderDiscountAmountFromAppliedCodes(orderId);
      recalculateOrderTotalsCore(orderId);
      recordOrderEvent(orderId, "discount_applied", { discountCodeId, promotionId });
    });
  },

  removeDiscountCode(orderId: number, discountCodeId: number) {
    return db.transaction(() => {
      const link = db
        .select({ promotionId: orderDiscountCodes.promotionId })
        .from(orderDiscountCodes)
        .where(
          and(
            eq(orderDiscountCodes.orderId, orderId),
            eq(orderDiscountCodes.discountCodeId, discountCodeId),
          ),
        )
        .get();
      if (!link) {
        throw new Error("discount code not applied to this order");
      }
      orderDiscountCodeDao.remove(orderId, discountCodeId);
      decrementUsageAfterOrderDiscountRemove(link.promotionId, discountCodeId);
      syncOrderDiscountAmountFromAppliedCodes(orderId);
      recalculateOrderTotalsCore(orderId);
      recordOrderEvent(orderId, "discount_removed", { discountCodeId, promotionId: link.promotionId });
    });
  },

  applyDiscountCodeByCode(orderId: number, code: string) {
    return db.transaction(() => {
      assertOrderHasNoDiscountCode(orderId);
      const dc = discountCodeDao.findByCode(code);
      if (!dc) throw new Error(`Discount code "${code}" not found`);
      assertApplicableOrderDiscountCode(dc.id, dc.promotionId);
      orderDiscountCodeDao.apply(orderId, dc.id, dc.promotionId);
      incrementUsageAfterOrderDiscountInsert(dc.promotionId, dc.id);
      syncOrderDiscountAmountFromAppliedCodes(orderId);
      recalculateOrderTotalsCore(orderId);
      recordOrderEvent(orderId, "discount_applied", { discountCodeId: dc.id, promotionId: dc.promotionId, code });
    });
  },

  // events
  listEvents(orderId: number) {
    return listOrderEvents(orderId);
  },

  // dashboard
  dashboardStats() {
    return orderDao.dashboardStats();
  },
};
