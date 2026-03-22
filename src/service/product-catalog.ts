import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";
import { formatTimestamp } from "../db/dao/utils";
import { variantDao } from "../db/dao";

/** 与 SQLite 中 option_signature 推导逻辑一致（无选项 → __default__；选项数与链接数一致 → 逗号拼接 id；否则 null） */
export function computeOptionSignatureFromState(
  optionCount: number,
  linkedDistinctOptionCount: number,
  orderedOptionValueIds: number[],
): string | null {
  if (optionCount === 0) return "__default__";
  if (linkedDistinctOptionCount !== optionCount) return null;
  return orderedOptionValueIds.join(",");
}

/** 按当前库内数据重算并写回单个变体的 option_signature */
export function refreshVariantOptionSignature(variantId: number) {
  const variant = variantDao.findById(variantId);
  if (!variant) return;

  const productId = variant.productId;

  const optTotalRow = db
    .select({ n: sql<number>`count(*)` })
    .from(s.productOptions)
    .where(eq(s.productOptions.productId, productId))
    .get();
  const optionCount = Number(optTotalRow?.n ?? 0);

  if (optionCount === 0) {
    db.update(s.productVariants)
      .set({ optionSignature: "__default__", updatedAt: formatTimestamp() })
      .where(eq(s.productVariants.id, variantId))
      .run();
    return;
  }

  const linkCountRow = db
    .select({ n: sql<number>`count(*)` })
    .from(s.variantOptionValues)
    .innerJoin(
      s.productOptionValues,
      eq(s.variantOptionValues.optionValueId, s.productOptionValues.id),
    )
    .innerJoin(s.productOptions, eq(s.productOptionValues.optionId, s.productOptions.id))
    .where(
      and(
        eq(s.variantOptionValues.variantId, variantId),
        eq(s.productOptions.productId, productId),
      ),
    )
    .get();
  const linkedCount = Number(linkCountRow?.n ?? 0);

  if (linkedCount !== optionCount) {
    db.update(s.productVariants)
      .set({ optionSignature: null, updatedAt: formatTimestamp() })
      .where(eq(s.productVariants.id, variantId))
      .run();
    return;
  }

  const rows = db
    .select({ optionValueId: s.variantOptionValues.optionValueId })
    .from(s.variantOptionValues)
    .innerJoin(
      s.productOptionValues,
      eq(s.variantOptionValues.optionValueId, s.productOptionValues.id),
    )
    .innerJoin(s.productOptions, eq(s.productOptionValues.optionId, s.productOptions.id))
    .where(
      and(
        eq(s.variantOptionValues.variantId, variantId),
        eq(s.productOptions.productId, productId),
      ),
    )
    .orderBy(asc(s.productOptions.id), asc(s.productOptionValues.id))
    .all();

  const sig = rows.map((r) => r.optionValueId).join(",");

  db.update(s.productVariants)
    .set({ optionSignature: sig, updatedAt: formatTimestamp() })
    .where(eq(s.productVariants.id, variantId))
    .run();
}

export function refreshAllVariantSignaturesForProduct(productId: number) {
  const variants = variantDao.findByProductId(productId);
  for (const v of variants) {
    refreshVariantOptionSignature(v.id);
  }
}
