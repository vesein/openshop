import { eq, and, desc, asc, sql, like, isNull } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";

export const pageDao = {
  findById(id: number) {
    return db.select().from(s.pages).where(eq(s.pages.id, id)).get() ?? null;
  },

  findBySlug(slug: string) {
    return db.select().from(s.pages).where(eq(s.pages.slug, slug)).get() ?? null;
  },

  list(opts: { status?: string; search?: string; page?: number; pageSize?: number } = {}) {
    const { status, search, page = 1, pageSize = 20 } = opts;
    const conditions = [];
    if (status) conditions.push(eq(s.pages.status, status));
    if (search) conditions.push(like(s.pages.title, `%${search}%`));

    return db.select().from(s.pages)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(s.pages.createdAt))
      .limit(pageSize).offset((page - 1) * pageSize)
      .all();
  },

  count(opts: { status?: string; search?: string } = {}) {
    const conditions = [];
    if (opts.status) conditions.push(eq(s.pages.status, opts.status));
    if (opts.search) conditions.push(like(s.pages.title, `%${opts.search}%`));

    return db.select({ count: sql<number>`count(*)` })
      .from(s.pages)
      .where(conditions.length ? and(...conditions) : undefined)
      .get()!.count;
  },

  create(data: InferInsertModel<typeof s.pages>) {
    return db.insert(s.pages).values(data).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.pages>>) {
    return db.update(s.pages)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(s.pages.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.pages).where(eq(s.pages.id, id)).returning().get();
  },
};
