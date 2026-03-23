import { promotionDao, discountCodeDao, metafieldValueDao } from "../db/dao";
import { db } from "../db/index";
import type { InferInsertModel } from "drizzle-orm";
import { promotions, discountCodes } from "../db/schema";

type PromotionInsert = InferInsertModel<typeof promotions>;
type DiscountCodeInsert = InferInsertModel<typeof discountCodes>;

function assertRulesJsonObject(rulesJson: string | undefined) {
  if (rulesJson === undefined) return;
  try {
    const o = JSON.parse(rulesJson);
    if (typeof o !== "object" || o === null || Array.isArray(o)) {
      throw new Error("rules_json must be a JSON object");
    }
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error("rules_json must be valid JSON");
    throw e;
  }
}

function assertPromotionColumns(data: Partial<PromotionInsert>) {
  if (data.discountValue != null && data.discountValue < 0) {
    throw new Error("discount_value must be non-negative");
  }
  if (data.minPurchaseAmount != null && data.minPurchaseAmount < 0) {
    throw new Error("min_purchase_amount must be non-negative");
  }
  if (data.buyQuantity != null && data.buyQuantity <= 0) {
    throw new Error("buy_quantity must be positive");
  }
  if (data.getQuantity != null && data.getQuantity <= 0) {
    throw new Error("get_quantity must be positive");
  }
}

export const promotionService = {
  list(opts: { status?: string; type?: string; page?: number; pageSize?: number }) {
    const items = promotionDao.list(opts);
    const total = promotionDao.count({ status: opts.status, type: opts.type });
    return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 20 };
  },

  getById(id: number) {
    const promo = promotionDao.findById(id);
    if (!promo) throw new Error("Promotion not found");
    return promo;
  },

  getActive() {
    return promotionDao.findActive();
  },

  create(data: PromotionInsert) {
    assertRulesJsonObject(data.rulesJson);
    assertPromotionColumns(data);
    return promotionDao.create(data);
  },

  update(id: number, data: Partial<PromotionInsert>) {
    const prev = promotionDao.findById(id);
    if (!prev) throw new Error("Promotion not found");
    assertRulesJsonObject(data.rulesJson);
    assertPromotionColumns(data);
    return promotionDao.update(id, data);
  },

  delete(id: number) {
    return db.transaction(() => {
      metafieldValueDao.deleteByResource("promotion", id);
      return promotionDao.delete(id);
    });
  },

  // discount codes
  listCodes(promotionId: number) {
    return discountCodeDao.findByPromotionId(promotionId);
  },

  createCode(data: DiscountCodeInsert) {
    const promo = promotionDao.findById(data.promotionId);
    if (!promo) throw new Error("Promotion not found");
    const existing = discountCodeDao.findByCode(data.code);
    if (existing) throw new Error("discount code already exists");
    return discountCodeDao.create(data);
  },

  updateCode(id: number, data: Partial<DiscountCodeInsert>) {
    return discountCodeDao.update(id, data);
  },

  deleteCode(id: number) {
    return discountCodeDao.delete(id);
  },
};
