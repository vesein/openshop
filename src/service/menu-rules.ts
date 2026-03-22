import { eq } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";

const MAX_DEPTH = 10_000;

/**
 * 从 proposedParentId 沿父链向上，若遇到 itemId 则形成环（与 SQLite 递归触发器一致）。
 */
export function assertMenuItemParentChain(
  itemId: number,
  parentId: number | null,
  parentById: Map<number, number | null>,
) {
  if (parentId == null) return;
  if (parentId === itemId) {
    throw new Error("menu item cannot parent itself");
  }

  let cur: number | null = parentId;
  let depth = 0;
  while (cur != null) {
    if (cur === itemId) {
      throw new Error("menu item cycle detected");
    }
    cur = parentById.get(cur) ?? null;
    if (++depth > MAX_DEPTH) {
      throw new Error("menu hierarchy too deep");
    }
  }
}

/**
 * 校验 parent_id 不指向自身、且不形成环（与 trg_menu_items_validate_* 一致）。
 */
export function assertMenuItemHierarchy(
  menuId: number,
  itemId: number,
  parentId: number | null,
) {
  if (parentId == null) return;

  const rows = db
    .select({ id: s.menuItems.id, parentId: s.menuItems.parentId })
    .from(s.menuItems)
    .where(eq(s.menuItems.menuId, menuId))
    .all();

  const parentById = new Map<number, number | null>();
  for (const r of rows) {
    parentById.set(r.id, r.parentId);
  }

  assertMenuItemParentChain(itemId, parentId, parentById);
}
