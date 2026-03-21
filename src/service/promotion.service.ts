import { promotionDao, discountCodeDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { promotions, discountCodes } from "../db/schema";

type PromotionInsert = InferInsertModel<typeof promotions>;
type DiscountCodeInsert = InferInsertModel<typeof discountCodes>;

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
    return promotionDao.create(data);
  },

  update(id: number, data: Partial<PromotionInsert>) {
    return promotionDao.update(id, data);
  },

  delete(id: number) {
    return promotionDao.delete(id);
  },

  // discount codes
  listCodes(promotionId: number) {
    return discountCodeDao.findByPromotionId(promotionId);
  },

  createCode(data: DiscountCodeInsert) {
    return discountCodeDao.create(data);
  },

  updateCode(id: number, data: Partial<DiscountCodeInsert>) {
    return discountCodeDao.update(id, data);
  },

  deleteCode(id: number) {
    return discountCodeDao.delete(id);
  },
};
