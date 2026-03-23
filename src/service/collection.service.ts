import { collectionDao, metafieldValueDao } from "../db/dao";
import { db } from "../db/index";
import type { InferInsertModel } from "drizzle-orm";
import { collections } from "../db/schema";

type CollectionInsert = InferInsertModel<typeof collections>;

export const collectionService = {
  list(opts: { status?: string; page?: number; pageSize?: number }) {
    const items = collectionDao.list(opts);
    const total = collectionDao.count({ status: opts.status });
    return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 20 };
  },

  getById(id: number) {
    const collection = collectionDao.findById(id);
    if (!collection) throw new Error("Collection not found");
    return collection;
  },

  getBySlug(slug: string) {
    const collection = collectionDao.findBySlug(slug);
    if (!collection) throw new Error("Collection not found");
    return collection;
  },

  create(data: CollectionInsert) {
    return collectionDao.create(data);
  },

  update(id: number, data: Partial<CollectionInsert>) {
    const prev = collectionDao.findById(id);
    if (!prev) throw new Error("Collection not found");
    return collectionDao.update(id, data);
  },

  delete(id: number) {
    return db.transaction(() => {
      metafieldValueDao.deleteByResource("collection", id);
      return collectionDao.delete(id);
    });
  },

  addProduct(collectionId: number, productId: number, sortOrder = 0) {
    return collectionDao.addProduct(collectionId, productId, sortOrder);
  },

  removeProduct(collectionId: number, productId: number) {
    return collectionDao.removeProduct(collectionId, productId);
  },

  setProductOrder(collectionId: number, productId: number, sortOrder: number) {
    return collectionDao.setProductOrder(collectionId, productId, sortOrder);
  },
};
