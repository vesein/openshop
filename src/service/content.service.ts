import { pageDao, menuDao, menuItemDao, metafieldValueDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { db } from "../db/index";
import { pages, menus, menuItems } from "../db/schema";
import { assertMenuItemHierarchy } from "./menu-rules";

type PageInsert = InferInsertModel<typeof pages>;
type MenuInsert = InferInsertModel<typeof menus>;
type MenuItemInsert = InferInsertModel<typeof menuItems>;

export const pageService = {
  list(opts: { status?: string; search?: string; page?: number; pageSize?: number }) {
    const items = pageDao.list(opts);
    const total = pageDao.count({ status: opts.status, search: opts.search });
    return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 20 };
  },

  getById(id: number) {
    const page = pageDao.findById(id);
    if (!page) throw new Error("Page not found");
    return page;
  },

  create(data: PageInsert) {
    return pageDao.create(data);
  },

  update(id: number, data: Partial<PageInsert>) {
    const prev = pageDao.findById(id);
    if (!prev) throw new Error("Page not found");
    return pageDao.update(id, data);
  },

  delete(id: number) {
    return db.transaction(() => {
      metafieldValueDao.deleteByResource("page", id);
      return pageDao.delete(id);
    });
  },
};

export const menuService = {
  list() {
    const items = menuDao.list();
    return { items };
  },

  getById(id: number) {
    const menu = menuDao.findById(id);
    if (!menu) throw new Error("Menu not found");
    return menu;
  },

  create(data: MenuInsert) {
    return menuDao.create(data);
  },

  update(id: number, data: Partial<MenuInsert>) {
    const prev = menuDao.findById(id);
    if (!prev) throw new Error("Menu not found");
    return menuDao.update(id, data);
  },

  delete(id: number) {
    return menuDao.delete(id);
  },

  // items
  listItems(menuId: number) {
    return menuItemDao.findByMenuId(menuId);
  },

  addItem(data: MenuItemInsert) {
    return db.transaction(() => {
      const row = menuItemDao.create(data);
      if (row.parentId != null) {
        assertMenuItemHierarchy(data.menuId, row.id, row.parentId);
      }
      return row;
    });
  },

  updateItem(id: number, data: Partial<MenuItemInsert>) {
    return db.transaction(() => {
      const prev = menuItemDao.findById(id);
      if (!prev) throw new Error("Menu item not found");
      const menuId = data.menuId ?? prev.menuId;
      const parentId =
        data.parentId !== undefined ? data.parentId : prev.parentId;
      if (parentId != null) {
        assertMenuItemHierarchy(menuId, id, parentId);
      }
      return menuItemDao.update(id, data);
    });
  },

  removeItem(id: number) {
    return menuItemDao.delete(id);
  },

  reorderItems(menuId: number, orderedIds: number[]) {
    return menuItemDao.reorder(menuId, orderedIds);
  },
};
