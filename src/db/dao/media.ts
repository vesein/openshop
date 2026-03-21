import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";

export const mediaDao = {
  findById(id: number) {
    return db.select().from(s.mediaAssets).where(eq(s.mediaAssets.id, id)).get() ?? null;
  },

  list(opts: { kind?: string; page?: number; pageSize?: number } = {}) {
    const { kind, page = 1, pageSize = 50 } = opts;
    const conditions = [];
    if (kind) conditions.push(eq(s.mediaAssets.kind, kind));

    return db.select().from(s.mediaAssets)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(s.mediaAssets.createdAt))
      .limit(pageSize).offset((page - 1) * pageSize)
      .all();
  },

  create(data: InferInsertModel<typeof s.mediaAssets>) {
    return db.insert(s.mediaAssets).values(data).returning().get();
  },

  delete(id: number) {
    return db.delete(s.mediaAssets).where(eq(s.mediaAssets.id, id)).returning().get();
  },
};

export const productMediaDao = {
  findByProductId(productId: number) {
    return db.select({
      id: s.productMedia.id,
      productId: s.productMedia.productId,
      variantId: s.productMedia.variantId,
      mediaId: s.productMedia.mediaId,
      sortOrder: s.productMedia.sortOrder,
      storageKey: s.mediaAssets.storageKey,
      mimeType: s.mediaAssets.mimeType,
      alt: s.mediaAssets.alt,
    })
    .from(s.productMedia)
    .innerJoin(s.mediaAssets, eq(s.productMedia.mediaId, s.mediaAssets.id))
    .where(eq(s.productMedia.productId, productId))
    .orderBy(asc(s.productMedia.sortOrder))
    .all();
  },

  attach(data: InferInsertModel<typeof s.productMedia>) {
    return db.insert(s.productMedia).values(data).returning().get();
  },

  detach(id: number) {
    return db.delete(s.productMedia).where(eq(s.productMedia.id, id)).run();
  },

  detachByMediaId(productId: number, mediaId: number) {
    return db.delete(s.productMedia)
      .where(and(
        eq(s.productMedia.productId, productId),
        eq(s.productMedia.mediaId, mediaId),
      )).run();
  },
};
