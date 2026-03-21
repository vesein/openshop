import { eq, and, desc, asc, like, isNull, sql, inArray } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

// =========================================================
// Products
// =========================================================

export const productDao = {
  findById(id: number) {
    const product = db.select().from(s.products)
      .where(eq(s.products.id, id)).get();
    if (!product) return null;

    const variants = db.select().from(s.productVariants)
      .where(eq(s.productVariants.productId, id))
      .orderBy(asc(s.productVariants.sortOrder)).all();

    return { ...product, variants };
  },

  list(opts: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { status, search, page = 1, pageSize = 20 } = opts;
    const conditions = [isNull(s.products.deletedAt)];
    if (status) conditions.push(eq(s.products.status, status));
    if (search) conditions.push(like(s.products.title, `%${search}%`));

    return db.select()
      .from(s.products)
      .where(and(...conditions))
      .orderBy(desc(s.products.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all();
  },

  count(opts: { status?: string; search?: string } = {}) {
    const conditions = [isNull(s.products.deletedAt)];
    if (opts.status) conditions.push(eq(s.products.status, opts.status));
    if (opts.search) conditions.push(like(s.products.title, `%${opts.search}%`));

    return db.select({ count: sql<number>`count(*)` })
      .from(s.products)
      .where(and(...conditions))
      .get()!.count;
  },

  create(data: InferInsertModel<typeof s.products>) {
    const now = formatTimestamp();
    return db.insert(s.products).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.products>>) {
    return db.update(s.products)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.products.id, id))
      .returning().get();
  },

  softDelete(id: number) {
    return db.update(s.products)
      .set({ deletedAt: formatTimestamp() })
      .where(eq(s.products.id, id))
      .returning().get();
  },
};

// =========================================================
// Product Variants
// =========================================================

export const variantDao = {
  findByProductId(productId: number) {
    return db.select().from(s.productVariants)
      .where(eq(s.productVariants.productId, productId))
      .orderBy(asc(s.productVariants.sortOrder))
      .all();
  },

  findById(id: number) {
    return db.select().from(s.productVariants)
      .where(eq(s.productVariants.id, id)).get() ?? null;
  },

  create(data: InferInsertModel<typeof s.productVariants>) {
    const variant = db.insert(s.productVariants).values(data).returning().get();
    db.insert(s.inventoryItems).values({ variantId: variant.id }).run();
    return variant;
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.productVariants>>) {
    return db.update(s.productVariants)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(s.productVariants.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.productVariants)
      .where(eq(s.productVariants.id, id))
      .returning().get();
  },
};

// =========================================================
// Inventory
// =========================================================

export const inventoryDao = {
  getLevel(variantId: number) {
    const row = db.select({
      variantId: s.inventoryItems.variantId,
      onHand: s.inventoryLevels.onHand,
      reserved: s.inventoryLevels.reserved,
    })
    .from(s.inventoryItems)
    .innerJoin(s.inventoryLevels, eq(s.inventoryItems.id, s.inventoryLevels.inventoryItemId))
    .where(eq(s.inventoryItems.variantId, variantId))
    .get();
    return row ?? null;
  },

  listLowStock(threshold: number = 10) {
    return db.select({
      variantId: s.inventoryItems.variantId,
      onHand: s.inventoryLevels.onHand,
      reserved: s.inventoryLevels.reserved,
    })
    .from(s.inventoryLevels)
    .innerJoin(s.inventoryItems, eq(s.inventoryItems.id, s.inventoryLevels.inventoryItemId))
    .where(sql`${s.inventoryLevels.onHand} - ${s.inventoryLevels.reserved} <= ${threshold}`)
    .all();
  },

  recordMovement(data: {
    variantId: number;
    movementType: string;
    quantityDelta: number;
    referenceType?: string;
    referenceId?: number;
    note?: string;
  }) {
    const item = db.select({ id: s.inventoryItems.id })
      .from(s.inventoryItems)
      .where(eq(s.inventoryItems.variantId, data.variantId))
      .get();
    if (!item) throw new Error(`No inventory item for variant ${data.variantId}`);

    return db.insert(s.inventoryMovements).values({
      inventoryItemId: item.id,
      movementType: data.movementType,
      quantityDelta: data.quantityDelta,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      note: data.note ?? "",
    }).run();
  },
};
