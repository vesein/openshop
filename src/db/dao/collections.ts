import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

// =========================================================
// Collections
// =========================================================

export const collectionDao = {
  findById(id: number) {
    const collection = db.select().from(s.collections)
      .where(eq(s.collections.id, id)).get();
    if (!collection) return null;
    const products = db.select({
      collectionId: s.collectionProducts.collectionId,
      productId: s.collectionProducts.productId,
      sortOrder: s.collectionProducts.sortOrder,
      productTitle: s.products.title,
      productSlug: s.products.slug,
      productStatus: s.products.status,
    })
    .from(s.collectionProducts)
    .innerJoin(s.products, eq(s.collectionProducts.productId, s.products.id))
    .where(eq(s.collectionProducts.collectionId, id))
    .orderBy(asc(s.collectionProducts.sortOrder))
    .all();
    return { ...collection, products };
  },

  list(opts: { status?: string; page?: number; pageSize?: number } = {}) {
    const { status, page = 1, pageSize = 20 } = opts;
    const conditions = [];
    if (status) conditions.push(eq(s.collections.status, status));

    return db.select().from(s.collections)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(s.collections.createdAt))
      .limit(pageSize).offset((page - 1) * pageSize)
      .all();
  },

  count(opts: { status?: string } = {}) {
    const conditions = [];
    if (opts.status) conditions.push(eq(s.collections.status, opts.status));

    return db.select({ count: sql<number>`count(*)` })
      .from(s.collections)
      .where(conditions.length ? and(...conditions) : undefined)
      .get()!.count;
  },

  create(data: InferInsertModel<typeof s.collections>) {
    const now = formatTimestamp();
    return db.insert(s.collections).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.collections>>) {
    return db.update(s.collections)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.collections.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.collections).where(eq(s.collections.id, id)).returning().get();
  },

  addProduct(collectionId: number, productId: number, sortOrder: number = 0) {
    return db.insert(s.collectionProducts)
      .values({ collectionId, productId, sortOrder })
      .run();
  },

  removeProduct(collectionId: number, productId: number) {
    return db.delete(s.collectionProducts)
      .where(
        and(
          eq(s.collectionProducts.collectionId, collectionId),
          eq(s.collectionProducts.productId, productId),
        )
      ).run();
  },

  setProductOrder(collectionId: number, productId: number, sortOrder: number) {
    return db.update(s.collectionProducts)
      .set({ sortOrder })
      .where(
        and(
          eq(s.collectionProducts.collectionId, collectionId),
          eq(s.collectionProducts.productId, productId),
        )
      ).run();
  },
};

// =========================================================
// Shop Settings
// =========================================================

export const shopSettingsDao = {
  get() {
    return db.select().from(s.shopSettings)
      .where(eq(s.shopSettings.id, 1)).get() ?? null;
  },

  update(data: Partial<InferInsertModel<typeof s.shopSettings>>) {
    return db.update(s.shopSettings)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.shopSettings.id, 1))
      .returning().get();
  },
};
