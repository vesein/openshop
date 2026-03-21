import { orderDao, orderItemDao, paymentDao, shipmentDao, orderDiscountCodeDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { orders, orderItems, payments, shipments } from "../db/schema";

type OrderInsert = InferInsertModel<typeof orders>;
type OrderItemInsert = InferInsertModel<typeof orderItems>;
type PaymentInsert = InferInsertModel<typeof payments>;
type ShipmentInsert = InferInsertModel<typeof shipments>;

export const orderService = {
  list(opts: {
    status?: string;
    paymentStatus?: string;
    customerId?: number;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const items = orderDao.list(opts);
    const total = orderDao.count(opts);
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
    return orderDao.create(data);
  },

  update(id: number, data: Partial<OrderInsert>) {
    return orderDao.update(id, data);
  },

  // order items
  listItems(orderId: number) {
    return orderItemDao.findByOrderId(orderId);
  },

  addItem(data: OrderItemInsert) {
    return orderItemDao.create(data);
  },

  updateItem(id: number, data: Partial<OrderItemInsert>) {
    return orderItemDao.update(id, data);
  },

  removeItem(id: number) {
    return orderItemDao.delete(id);
  },

  // payments
  listPayments(orderId: number) {
    return paymentDao.findByOrderId(orderId);
  },

  createPayment(data: PaymentInsert) {
    return paymentDao.create(data);
  },

  // shipments
  getShipment(orderId: number) {
    return shipmentDao.findByOrderId(orderId);
  },

  createShipment(data: ShipmentInsert) {
    return shipmentDao.create(data);
  },

  updateShipment(id: number, data: Partial<ShipmentInsert>) {
    return shipmentDao.update(id, data);
  },

  markShipped(id: number, tracking: { carrier: string; service: string; trackingNumber: string; trackingUrl?: string }) {
    return shipmentDao.markShipped(id, tracking);
  },

  markDelivered(id: number) {
    return shipmentDao.markDelivered(id);
  },

  // discount codes
  listDiscountCodes(orderId: number) {
    return orderDiscountCodeDao.findByOrderId(orderId);
  },

  applyDiscountCode(orderId: number, discountCodeId: number, promotionId: number) {
    return orderDiscountCodeDao.apply(orderId, discountCodeId, promotionId);
  },

  removeDiscountCode(orderId: number, discountCodeId: number) {
    return orderDiscountCodeDao.remove(orderId, discountCodeId);
  },

  // dashboard
  dashboardStats() {
    return orderDao.dashboardStats();
  },
};
