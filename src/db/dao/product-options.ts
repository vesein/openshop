import { eq, and, asc } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

// =========================================================
// Product Options
// =========================================================

export const productOptionDao = {
  findByProductId(productId: number) {
    return db.select().from(s.productOptions)
      .where(eq(s.productOptions.productId, productId))
      .orderBy(asc(s.productOptions.sortOrder))
      .all();
  },

  findById(id: number) {
    return db.select().from(s.productOptions)
      .where(eq(s.productOptions.id, id)).get() ?? null;
  },

  create(data: InferInsertModel<typeof s.productOptions>) {
    return db.insert(s.productOptions).values({
      ...data,
      createdAt: formatTimestamp(),
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.productOptions>>) {
    return db.update(s.productOptions)
      .set(data)
      .where(eq(s.productOptions.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.productOptions).where(eq(s.productOptions.id, id)).returning().get();
  },
};

// =========================================================
// Product Option Values
// =========================================================

export const productOptionValueDao = {
  findByOptionId(optionId: number) {
    return db.select().from(s.productOptionValues)
      .where(eq(s.productOptionValues.optionId, optionId))
      .orderBy(asc(s.productOptionValues.sortOrder))
      .all();
  },

  findById(id: number) {
    return db.select().from(s.productOptionValues)
      .where(eq(s.productOptionValues.id, id)).get() ?? null;
  },

  create(data: InferInsertModel<typeof s.productOptionValues>) {
    return db.insert(s.productOptionValues).values({
      ...data,
      createdAt: formatTimestamp(),
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.productOptionValues>>) {
    return db.update(s.productOptionValues)
      .set(data)
      .where(eq(s.productOptionValues.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.productOptionValues).where(eq(s.productOptionValues.id, id)).returning().get();
  },
};

// =========================================================
// Variant Option Values (多对多关联)
// =========================================================

export const variantOptionValueDao = {
  findByVariantId(variantId: number) {
    return db.select({
      variantId: s.variantOptionValues.variantId,
      optionValueId: s.variantOptionValues.optionValueId,
      value: s.productOptionValues.value,
      optionId: s.productOptionValues.optionId,
    })
    .from(s.variantOptionValues)
    .innerJoin(s.productOptionValues, eq(s.variantOptionValues.optionValueId, s.productOptionValues.id))
    .where(eq(s.variantOptionValues.variantId, variantId))
    .all();
  },

  link(variantId: number, optionValueId: number) {
    return db.insert(s.variantOptionValues)
      .values({ variantId, optionValueId })
      .run();
  },

  unlink(variantId: number, optionValueId: number) {
    return db.delete(s.variantOptionValues)
      .where(and(
        eq(s.variantOptionValues.variantId, variantId),
        eq(s.variantOptionValues.optionValueId, optionValueId),
      )).run();
  },

  /** 替换 variant 的所有 option values */
  replace(variantId: number, optionValueIds: number[]) {
    return db.transaction(() => {
      db.delete(s.variantOptionValues)
        .where(eq(s.variantOptionValues.variantId, variantId)).run();

      if (optionValueIds.length > 0) {
        db.insert(s.variantOptionValues)
          .values(optionValueIds.map(id => ({ variantId, optionValueId: id })))
          .run();
      }
    });
  },
};
