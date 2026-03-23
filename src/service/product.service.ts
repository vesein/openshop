import {
  productDao,
  variantDao,
  inventoryDao,
  productOptionDao,
  productOptionValueDao,
  variantOptionValueDao,
  metafieldValueDao,
} from "../db/dao";
import { db } from "../db/index";
import { inventoryService } from "./inventory.service";
import type { InferInsertModel } from "drizzle-orm";
import { products, productVariants, productOptions, productOptionValues } from "../db/schema";
import {
  refreshAllVariantSignaturesForProduct,
  refreshVariantOptionSignature,
} from "./product-catalog";
import {
  assertCanActivateProduct,
  assertFeaturedMediaBelongsToProduct,
  assertProductDraftBeforeEdit,
  assertSoftDeleteProductAllowed,
} from "./product-rules";

type ProductInsert = InferInsertModel<typeof products>;
type VariantInsert = InferInsertModel<typeof productVariants>;
type ProductOptionInsert = InferInsertModel<typeof productOptions>;
type ProductOptionValueInsert = InferInsertModel<typeof productOptionValues>;

export const productService = {
  list(opts: { status?: string; search?: string; page?: number; pageSize?: number }) {
    const items = productDao.list(opts);
    const total = productDao.count(opts);
    return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 20 };
  },

  getById(id: number) {
    const product = productDao.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  },

  getBySlug(slug: string) {
    const product = productDao.findBySlug(slug);
    if (!product) throw new Error("Product not found");
    return product;
  },

  create(data: ProductInsert) {
    return productDao.create(data);
  },

  update(id: number, data: Partial<ProductInsert>) {
    const prev = productDao.findById(id);
    if (!prev) throw new Error("Product not found");
    if (data.featuredMediaId !== undefined && data.featuredMediaId != null) {
      assertFeaturedMediaBelongsToProduct(id, data.featuredMediaId);
    }
    if (data.status === "active" && prev.status !== "active") {
      assertCanActivateProduct(id);
    }
    return productDao.update(id, data);
  },

  delete(id: number) {
    assertSoftDeleteProductAllowed(id);
    return productDao.softDelete(id);
  },

  // variants
  listVariants(productId: number) {
    return variantDao.findByProductId(productId);
  },

  createVariant(data: VariantInsert) {
    assertProductDraftBeforeEdit(data.productId, "variants");
    const variant = variantDao.create(data);
    refreshVariantOptionSignature(variant.id);
    return variant;
  },

  updateVariant(id: number, data: Partial<VariantInsert>) {
    const prev = variantDao.findById(id);
    if (!prev) throw new Error("Variant not found");
    if (data.productId != null && data.productId !== prev.productId) {
      throw new Error(
        "variant product_id is immutable; recreate the variant under the target product",
      );
    }
    assertProductDraftBeforeEdit(prev.productId, "variants");
    const { optionSignature: _ignored, ...rest } = data as Record<string, unknown>;
    return variantDao.update(id, rest as Partial<VariantInsert>);
  },

  deleteVariant(id: number) {
    const prev = variantDao.findById(id);
    if (!prev) throw new Error("Variant not found");
    assertProductDraftBeforeEdit(prev.productId, "variants");
    return db.transaction(() => {
      metafieldValueDao.deleteByResource("variant", id);
      return variantDao.delete(id);
    });
  },

  // inventory
  getInventory(variantId: number) {
    return inventoryDao.getLevel(variantId);
  },

  listLowStock(threshold = 10) {
    return inventoryDao.listLowStock(threshold);
  },

  recordStockMovement(data: {
    variantId: number;
    movementType: string;
    quantityDelta: number;
    referenceType?: string;
    referenceId?: number;
    note?: string;
  }) {
    return inventoryService.recordStockMovement(data);
  },

  /** tracked / allow_backorder / variant_id 约束见 inventory.service */
  updateInventoryItem(
    variantId: number,
    data: Partial<{ tracked: number; allowBackorder: number }>,
  ) {
    return inventoryService.patchInventoryItemByVariantId(variantId, data);
  },

  // product options
  listOptions(productId: number) {
    return productOptionDao.findByProductId(productId);
  },

  createOption(data: ProductOptionInsert) {
    assertProductDraftBeforeEdit(data.productId, "options");
    const row = productOptionDao.create(data);
    refreshAllVariantSignaturesForProduct(data.productId);
    return row;
  },

  updateOption(id: number, data: Partial<ProductOptionInsert>) {
    const opt = productOptionDao.findById(id);
    if (!opt) throw new Error("Option not found");
    assertProductDraftBeforeEdit(opt.productId, "options");
    if (data.productId != null && data.productId !== opt.productId) {
      assertProductDraftBeforeEdit(data.productId, "options");
    }
    return productOptionDao.update(id, data);
  },

  deleteOption(id: number) {
    const opt = productOptionDao.findById(id);
    if (!opt) throw new Error("Option not found");
    assertProductDraftBeforeEdit(opt.productId, "options");
    const out = productOptionDao.delete(id);
    refreshAllVariantSignaturesForProduct(opt.productId);
    return out;
  },

  // option values
  listOptionValues(optionId: number) {
    return productOptionValueDao.findByOptionId(optionId);
  },

  createOptionValue(data: ProductOptionValueInsert) {
    const po = productOptionDao.findById(data.optionId);
    if (!po) throw new Error("Option not found");
    assertProductDraftBeforeEdit(po.productId, "options");
    return productOptionValueDao.create(data);
  },

  updateOptionValue(id: number, data: Partial<ProductOptionValueInsert>) {
    const pov = productOptionValueDao.findById(id);
    if (!pov) throw new Error("Option value not found");
    const po = productOptionDao.findById(pov.optionId);
    if (!po) throw new Error("Option not found");
    assertProductDraftBeforeEdit(po.productId, "options");
    return productOptionValueDao.update(id, data);
  },

  deleteOptionValue(id: number) {
    const pov = productOptionValueDao.findById(id);
    if (!pov) throw new Error("Option value not found");
    const po = productOptionDao.findById(pov.optionId);
    if (!po) throw new Error("Option not found");
    assertProductDraftBeforeEdit(po.productId, "options");
    const out = productOptionValueDao.delete(id);
    refreshAllVariantSignaturesForProduct(po.productId);
    return out;
  },

  // variant option values
  listVariantOptionValues(variantId: number) {
    return variantOptionValueDao.findByVariantId(variantId);
  },

  replaceVariantOptionValues(variantId: number, optionValueIds: number[]) {
    const v = variantDao.findById(variantId);
    if (!v) throw new Error("Variant not found");
    assertProductDraftBeforeEdit(v.productId, "variant options");

    const seenOption = new Set<number>();
    for (const vid of optionValueIds) {
      const pov = productOptionValueDao.findById(vid);
      if (!pov) throw new Error(`Option value ${vid} not found`);
      const po = productOptionDao.findById(pov.optionId);
      if (!po || po.productId !== v.productId) {
        throw new Error("variant option value must belong to the same product");
      }
      if (seenOption.has(pov.optionId)) {
        throw new Error("variant already has a value for this option");
      }
      seenOption.add(pov.optionId);
    }

    variantOptionValueDao.replace(variantId, optionValueIds);
    refreshVariantOptionSignature(variantId);
  },
};
