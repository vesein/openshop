import { eq, and, desc, asc, sql, like, gte, lte } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

// =========================================================
// Orders
// =========================================================

export const orderDao = {
  findById(id: number) {
    const order = db.select().from(s.orders).where(eq(s.orders.id, id)).get();
    if (!order) return null;

    const items = db.select().from(s.orderItems)
      .where(eq(s.orderItems.orderId, id))
      .orderBy(asc(s.orderItems.id)).all();

    const payments = db.select().from(s.payments)
      .where(eq(s.payments.orderId, id))
      .orderBy(desc(s.payments.createdAt)).all();

    const shipment = db.select().from(s.shipments)
      .where(eq(s.shipments.orderId, id)).get() ?? null;

    return { ...order, items, payments, shipment };
  },

  findByNumber(orderNumber: string) {
    return db.select().from(s.orders)
      .where(eq(s.orders.orderNumber, orderNumber)).get() ?? null;
  },

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
  } = {}) {
    const { page = 1, pageSize = 20 } = opts;
    const conditions = [];
    if (opts.status) conditions.push(eq(s.orders.orderStatus, opts.status));
    if (opts.paymentStatus) conditions.push(eq(s.orders.paymentStatus, opts.paymentStatus));
    if (opts.fulfillmentStatus) conditions.push(eq(s.orders.fulfillmentStatus, opts.fulfillmentStatus));
    if (opts.customerId) conditions.push(eq(s.orders.customerId, opts.customerId));
    if (opts.search) conditions.push(like(s.orders.orderNumber, `%${opts.search}%`));
    if (opts.from) conditions.push(gte(s.orders.createdAt, opts.from));
    if (opts.to) conditions.push(lte(s.orders.createdAt, opts.to));

    return db.select()
      .from(s.orders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(s.orders.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all();
  },

  count(opts: {
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    customerId?: number;
    search?: string;
    from?: string;
    to?: string;
  } = {}) {
    const conditions = [];
    if (opts.status) conditions.push(eq(s.orders.orderStatus, opts.status));
    if (opts.paymentStatus) conditions.push(eq(s.orders.paymentStatus, opts.paymentStatus));
    if (opts.fulfillmentStatus) conditions.push(eq(s.orders.fulfillmentStatus, opts.fulfillmentStatus));
    if (opts.customerId) conditions.push(eq(s.orders.customerId, opts.customerId));
    if (opts.search) conditions.push(like(s.orders.orderNumber, `%${opts.search}%`));
    if (opts.from) conditions.push(gte(s.orders.createdAt, opts.from));
    if (opts.to) conditions.push(lte(s.orders.createdAt, opts.to));

    return db.select({ count: sql<number>`count(*)` })
      .from(s.orders)
      .where(conditions.length ? and(...conditions) : undefined)
      .get()!.count;
  },

  create(data: InferInsertModel<typeof s.orders>) {
    const now = formatTimestamp();
    return db.insert(s.orders).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.orders>>) {
    return db.update(s.orders)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.orders.id, id))
      .returning().get();
  },

  dashboardStats() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const totalOrders = db.select({ count: sql<number>`count(*)` }).from(s.orders).get()!.count;
    const todayOrders = db.select({ count: sql<number>`count(*)` }).from(s.orders)
      .where(gte(s.orders.createdAt, today)).get()!.count;
    const revenue = db.select({ sum: sql<number>`coalesce(sum(total_amount), 0)` }).from(s.orders)
      .where(eq(s.orders.paymentStatus, "paid")).get()!.sum;

    const totalProducts = db.select({ count: sql<number>`count(*)` }).from(s.products)
      .where(sql`${s.products.deletedAt} IS NULL`).get()!.count;

    const totalCustomers = db.select({ count: sql<number>`count(*)` }).from(s.customers).get()!.count;

    const recentOrders = db.select({
      id: s.orders.id,
      orderNumber: s.orders.orderNumber,
      customerEmail: s.orders.email,
      totalAmount: s.orders.totalAmount,
      status: s.orders.orderStatus,
      createdAt: s.orders.createdAt,
    }).from(s.orders)
      .orderBy(desc(s.orders.createdAt))
      .limit(5)
      .all();

    const lowStockProducts = db.select({
      id: s.products.id,
      title: s.products.title,
      sku: s.productVariants.sku,
      quantity: s.inventoryLevels.onHand,
    })
    .from(s.inventoryLevels)
    .innerJoin(s.inventoryItems, eq(s.inventoryLevels.inventoryItemId, s.inventoryItems.id))
    .innerJoin(s.productVariants, eq(s.inventoryItems.variantId, s.productVariants.id))
    .innerJoin(s.products, eq(s.productVariants.productId, s.products.id))
    .where(and(
      lte(s.inventoryLevels.onHand, 10),
      sql`${s.products.deletedAt} IS NULL`,
    ))
    .orderBy(asc(s.inventoryLevels.onHand))
    .limit(10)
    .all();

    return { totalOrders, todayOrders, totalRevenue: revenue, totalProducts, totalCustomers, recentOrders, lowStockProducts };
  },
};

// =========================================================
// Order Items
// =========================================================

export const orderItemDao = {
  findByOrderId(orderId: number) {
    return db.select().from(s.orderItems)
      .where(eq(s.orderItems.orderId, orderId))
      .orderBy(asc(s.orderItems.id))
      .all();
  },

  create(data: InferInsertModel<typeof s.orderItems>) {
    return db.insert(s.orderItems).values({
      ...data,
      createdAt: formatTimestamp(),
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.orderItems>>) {
    return db.update(s.orderItems)
      .set(data)
      .where(eq(s.orderItems.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.orderItems)
      .where(eq(s.orderItems.id, id))
      .returning().get();
  },
};

// =========================================================
// Payments
// =========================================================

export const paymentDao = {
  findByOrderId(orderId: number) {
    return db.select().from(s.payments)
      .where(eq(s.payments.orderId, orderId))
      .orderBy(desc(s.payments.createdAt))
      .all();
  },

  create(data: InferInsertModel<typeof s.payments>) {
    return db.insert(s.payments).values({
      ...data,
      createdAt: formatTimestamp(),
    }).returning().get();
  },
};

// =========================================================
// Shipments
// =========================================================

export const shipmentDao = {
  findByOrderId(orderId: number) {
    return db.select().from(s.shipments)
      .where(eq(s.shipments.orderId, orderId)).get() ?? null;
  },

  create(data: InferInsertModel<typeof s.shipments>) {
    return db.insert(s.shipments).values({
      ...data,
      createdAt: formatTimestamp(),
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.shipments>>) {
    return db.update(s.shipments)
      .set(data)
      .where(eq(s.shipments.id, id))
      .returning().get();
  },

  markShipped(id: number, tracking: { carrier: string; service: string; trackingNumber: string; trackingUrl?: string }) {
    return db.update(s.shipments)
      .set({
        ...tracking,
        status: "shipped",
        shippedAt: formatTimestamp(),
      })
      .where(eq(s.shipments.id, id))
      .returning().get();
  },

  markDelivered(id: number) {
    return db.update(s.shipments)
      .set({ status: "delivered", deliveredAt: formatTimestamp() })
      .where(eq(s.shipments.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.shipments).where(eq(s.shipments.id, id)).run();
  },
};

// =========================================================
// Order Discount Codes
// =========================================================

export const orderDiscountCodeDao = {
  findByOrderId(orderId: number) {
    return db.select({
      orderId: s.orderDiscountCodes.orderId,
      discountCodeId: s.orderDiscountCodes.discountCodeId,
      promotionId: s.orderDiscountCodes.promotionId,
      code: s.discountCodes.code,
      promoName: s.promotions.name,
      promoType: s.promotions.type,
    })
    .from(s.orderDiscountCodes)
    .innerJoin(s.discountCodes, eq(s.orderDiscountCodes.discountCodeId, s.discountCodes.id))
    .innerJoin(s.promotions, eq(s.orderDiscountCodes.promotionId, s.promotions.id))
    .where(eq(s.orderDiscountCodes.orderId, orderId))
    .all();
  },

  apply(orderId: number, discountCodeId: number, promotionId: number) {
    return db.insert(s.orderDiscountCodes)
      .values({ orderId, discountCodeId, promotionId })
      .run();
  },

  remove(orderId: number, discountCodeId: number) {
    return db.delete(s.orderDiscountCodes)
      .where(and(
        eq(s.orderDiscountCodes.orderId, orderId),
        eq(s.orderDiscountCodes.discountCodeId, discountCodeId),
      )).run();
  },
};
