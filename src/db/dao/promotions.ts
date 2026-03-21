import { eq, and, desc, asc, sql, isNull, like, gte, lte } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

// =========================================================
// Promotions
// =========================================================

export const promotionDao = {
  findById(id: number) {
    const promo = db.select().from(s.promotions).where(eq(s.promotions.id, id)).get();
    if (!promo) return null;
    const codes = db.select().from(s.discountCodes)
      .where(eq(s.discountCodes.promotionId, id))
      .orderBy(asc(s.discountCodes.code))
      .all();
    return { ...promo, discountCodes: codes };
  },

  list(opts: {
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { status, type, page = 1, pageSize = 20 } = opts;
    const conditions = [];
    if (status) conditions.push(eq(s.promotions.status, status));
    if (type) conditions.push(eq(s.promotions.type, type));

    return db.select()
      .from(s.promotions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(s.promotions.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all();
  },

  count(opts: { status?: string; type?: string } = {}) {
    const conditions = [];
    if (opts.status) conditions.push(eq(s.promotions.status, opts.status));
    if (opts.type) conditions.push(eq(s.promotions.type, opts.type));

    return db.select({ count: sql<number>`count(*)` })
      .from(s.promotions)
      .where(conditions.length ? and(...conditions) : undefined)
      .get()!.count;
  },

  findActive() {
    const now = new Date().toISOString();
    return db.select()
      .from(s.promotions)
      .where(and(
        eq(s.promotions.status, "active"),
        sql`(${s.promotions.startsAt} IS NULL OR ${s.promotions.startsAt} <= ${now})`,
        sql`(${s.promotions.endsAt} IS NULL OR ${s.promotions.endsAt} >= ${now})`,
      ))
      .orderBy(desc(s.promotions.createdAt))
      .all();
  },

  create(data: InferInsertModel<typeof s.promotions>) {
    const now = formatTimestamp();
    return db.insert(s.promotions).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.promotions>>) {
    return db.update(s.promotions)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.promotions.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.promotions)
      .where(eq(s.promotions.id, id))
      .returning().get();
  },
};

// =========================================================
// Discount Codes
// =========================================================

export const discountCodeDao = {
  findByCode(code: string) {
    const row = db.select({
      code: s.discountCodes.code,
      id: s.discountCodes.id,
      promotionId: s.discountCodes.promotionId,
      usageLimit: s.discountCodes.usageLimit,
      usageCount: s.discountCodes.usageCount,
      promoName: s.promotions.name,
      promoStatus: s.promotions.status,
    })
    .from(s.discountCodes)
    .innerJoin(s.promotions, eq(s.discountCodes.promotionId, s.promotions.id))
    .where(eq(s.discountCodes.code, code))
    .get();
    return row ?? null;
  },

  findByPromotionId(promotionId: number) {
    return db.select()
      .from(s.discountCodes)
      .where(eq(s.discountCodes.promotionId, promotionId))
      .orderBy(asc(s.discountCodes.code))
      .all();
  },

  create(data: InferInsertModel<typeof s.discountCodes>) {
    const now = formatTimestamp();
    return db.insert(s.discountCodes).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.discountCodes>>) {
    return db.update(s.discountCodes)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.discountCodes.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.discountCodes)
      .where(eq(s.discountCodes.id, id))
      .returning().get();
  },

  /** 在订单上应用优惠码 (触发器会验证有效性并自增 usage_count) */
  applyToOrder(orderId: number, code: string) {
    const dc = this.findByCode(code);
    if (!dc) throw new Error(`Discount code "${code}" not found`);
    if (dc.promoStatus !== "active") throw new Error(`Promotion "${dc.promoName}" is not active`);

    return db.insert(s.orderDiscountCodes).values({
      orderId,
      discountCodeId: dc.id,
      promotionId: dc.promotionId,
    }).run();
  },
};
