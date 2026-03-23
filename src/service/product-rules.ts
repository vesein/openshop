import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";
import { productDao, variantDao } from "../db/dao";

export function assertProductDraftBeforeEdit(productId: number, editTarget: string) {
  const p = db.select({ status: s.products.status }).from(s.products).where(eq(s.products.id, productId)).get();
  if (!p) throw new Error("Product not found");
  if (p.status === "active") {
    throw new Error(`set product to draft before changing ${editTarget}`);
  }
}

export function assertCanActivateProduct(productId: number) {
  const variants = variantDao.findByProductId(productId);
  if (variants.length === 0) {
    throw new Error("active product must have at least one variant");
  }
  if (!variants.some((v) => v.isDefault)) {
    throw new Error("active product must have a default variant");
  }

  const optTotalRow = db
    .select({ n: sql<number>`count(*)` })
    .from(s.productOptions)
    .where(eq(s.productOptions.productId, productId))
    .get();
  const optionCount = Number(optTotalRow?.n ?? 0);
  if (optionCount === 0) return;

  for (const v of variants) {
    const dRow = db
      .select({ n: sql<number>`count(distinct ${s.productOptions.id})` })
      .from(s.variantOptionValues)
      .innerJoin(
        s.productOptionValues,
        eq(s.variantOptionValues.optionValueId, s.productOptionValues.id),
      )
      .innerJoin(s.productOptions, eq(s.productOptionValues.optionId, s.productOptions.id))
      .where(
        and(
          eq(s.variantOptionValues.variantId, v.id),
          eq(s.productOptions.productId, productId),
        ),
      )
      .get();
    const d = Number(dRow?.n ?? 0);
    if (d !== optionCount) {
      throw new Error("active product variants must cover every option");
    }
  }
}

export function assertSoftDeleteProductAllowed(productId: number) {
  const p = productDao.findById(productId);
  if (!p) throw new Error("Product not found");
  if (p.status === "active") {
    throw new Error("set product to draft or archived before soft-deleting");
  }
}

export function assertFeaturedMediaBelongsToProduct(productId: number, mediaId: number) {
  const ok = db
    .select({ id: s.productMedia.id })
    .from(s.productMedia)
    .where(
      and(
        eq(s.productMedia.productId, productId),
        eq(s.productMedia.mediaId, mediaId),
      ),
    )
    .get();
  if (!ok) {
    throw new Error("featured media must belong to the product");
  }
}

export function assertProductMediaVariantSameProduct(productId: number, variantId: number | null) {
  if (variantId == null) return;
  const v = variantDao.findById(variantId);
  if (!v || v.productId !== productId) {
    throw new Error("product media variant must belong to the same product");
  }
}
