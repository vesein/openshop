import { mediaDao, productMediaDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { mediaAssets, productMedia } from "../db/schema";

type MediaInsert = InferInsertModel<typeof mediaAssets>;
type ProductMediaInsert = InferInsertModel<typeof productMedia>;

export const mediaService = {
  // media assets
  list(opts: { kind?: string; page?: number; pageSize?: number } = {}) {
    const items = mediaDao.list(opts);
    return { items, page: opts.page ?? 1, pageSize: opts.pageSize ?? 50 };
  },

  getById(id: number) {
    const media = mediaDao.findById(id);
    if (!media) throw new Error("Media not found");
    return media;
  },

  create(data: MediaInsert) {
    return mediaDao.create(data);
  },

  delete(id: number) {
    return mediaDao.delete(id);
  },

  // product media
  listProductMedia(productId: number) {
    return productMediaDao.findByProductId(productId);
  },

  attachToProduct(data: ProductMediaInsert) {
    return productMediaDao.attach(data);
  },

  detachFromProduct(id: number) {
    return productMediaDao.detach(id);
  },

  detachMediaFromProduct(productId: number, mediaId: number) {
    return productMediaDao.detachByMediaId(productId, mediaId);
  },
};