import { productDao, variantDao, inventoryDao, productOptionDao, productOptionValueDao, variantOptionValueDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { products, productVariants, productOptions, productOptionValues } from "../db/schema";

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

  create(data: ProductInsert) {
    return productDao.create(data);
  },

  update(id: number, data: Partial<ProductInsert>) {
    return productDao.update(id, data);
  },

  delete(id: number) {
    return productDao.softDelete(id);
  },

  // variants
  listVariants(productId: number) {
    return variantDao.findByProductId(productId);
  },

  createVariant(data: VariantInsert) {
    return variantDao.create(data);
  },

  updateVariant(id: number, data: Partial<VariantInsert>) {
    return variantDao.update(id, data);
  },

  deleteVariant(id: number) {
    return variantDao.delete(id);
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
    return inventoryDao.recordMovement(data);
  },

  // product options
  listOptions(productId: number) {
    return productOptionDao.findByProductId(productId);
  },

  createOption(data: ProductOptionInsert) {
    return productOptionDao.create(data);
  },

  updateOption(id: number, data: Partial<ProductOptionInsert>) {
    return productOptionDao.update(id, data);
  },

  deleteOption(id: number) {
    return productOptionDao.delete(id);
  },

  // option values
  listOptionValues(optionId: number) {
    return productOptionValueDao.findByOptionId(optionId);
  },

  createOptionValue(data: ProductOptionValueInsert) {
    return productOptionValueDao.create(data);
  },

  updateOptionValue(id: number, data: Partial<ProductOptionValueInsert>) {
    return productOptionValueDao.update(id, data);
  },

  deleteOptionValue(id: number) {
    return productOptionValueDao.delete(id);
  },

  // variant option values
  listVariantOptionValues(variantId: number) {
    return variantOptionValueDao.findByVariantId(variantId);
  },

  replaceVariantOptionValues(variantId: number, optionValueIds: number[]) {
    return variantOptionValueDao.replace(variantId, optionValueIds);
  },
};
