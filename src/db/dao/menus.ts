import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

export const menuDao = {
  findById(id: number) {
    const menu = db.select().from(s.menus).where(eq(s.menus.id, id)).get();
    if (!menu) return null;
    const items = db.select().from(s.menuItems)
      .where(eq(s.menuItems.menuId, id))
      .orderBy(asc(s.menuItems.sortOrder)).all();
    return { ...menu, items };
  },

  findByHandle(handle: string) {
    const menu = db.select().from(s.menus).where(eq(s.menus.handle, handle)).get();
    if (!menu) return null;
    const items = db.select().from(s.menuItems)
      .where(eq(s.menuItems.menuId, menu.id))
      .orderBy(asc(s.menuItems.sortOrder)).all();
    return { ...menu, items };
  },

  list() {
    return db.select().from(s.menus).orderBy(asc(s.menus.name)).all();
  },

  create(data: InferInsertModel<typeof s.menus>) {
    const now = formatTimestamp();
    return db.insert(s.menus).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.menus>>) {
    return db.update(s.menus)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.menus.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.menus).where(eq(s.menus.id, id)).run();
  },
};

export const menuItemDao = {
  findById(id: number) {
    return db.select().from(s.menuItems).where(eq(s.menuItems.id, id)).get() ?? null;
  },

  findByMenuId(menuId: number) {
    return db.select().from(s.menuItems)
      .where(eq(s.menuItems.menuId, menuId))
      .orderBy(asc(s.menuItems.sortOrder))
      .all();
  },

  create(data: InferInsertModel<typeof s.menuItems>) {
    return db.insert(s.menuItems).values({
      ...data,
      createdAt: formatTimestamp(),
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.menuItems>>) {
    return db.update(s.menuItems)
      .set(data)
      .where(eq(s.menuItems.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.menuItems).where(eq(s.menuItems.id, id)).run();
  },

  reorder(menuId: number, orderedIds: number[]) {
    orderedIds.forEach((id, i) => {
      db.update(s.menuItems)
        .set({ sortOrder: i })
        .where(and(eq(s.menuItems.id, id), eq(s.menuItems.menuId, menuId)))
        .run();
    });
  },
};
