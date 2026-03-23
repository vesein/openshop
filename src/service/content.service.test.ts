import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { pageService, menuService } from "./content.service";

describe("pageService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  test("create / getById / list", () => {
    const page = pageService.create({
      title: "About",
      slug: "about",
      status: "draft",
    });
    expect(page.id).toBeGreaterThan(0);

    const fetched = pageService.getById(page.id);
    expect(fetched.title).toBe("About");

    const result = pageService.list({});
    expect(result.total).toBe(1);
  });

  test("update 存在性检查", () => {
    expect(() => pageService.update(99999, { title: "X" })).toThrow("not found");
  });

  test("update 正常修改", () => {
    const page = pageService.create({ title: "Old", slug: "old" });
    const updated = pageService.update(page.id, { title: "New" });
    expect(updated.title).toBe("New");
  });

  test("delete 删除页面", () => {
    const page = pageService.create({ title: "Del", slug: "del" });
    pageService.delete(page.id);
    expect(() => pageService.getById(page.id)).toThrow("not found");
  });
});

describe("menuService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  test("create / getById / list", () => {
    const menu = menuService.create({ name: "Main", handle: "main" });
    expect(menu.id).toBeGreaterThan(0);

    const fetched = menuService.getById(menu.id);
    expect(fetched.name).toBe("Main");
    expect(fetched.items).toEqual([]);

    const result = menuService.list();
    expect(result.items).toHaveLength(1);
  });

  test("update 存在性检查", () => {
    expect(() => menuService.update(99999, { name: "X" })).toThrow("not found");
  });

  test("addItem / listItems", () => {
    const menu = menuService.create({ name: "Nav", handle: "nav" });
    const item = menuService.addItem({
      menuId: menu.id,
      title: "Home",
      linkType: "home",
      linkTarget: "/",
    });
    expect(item.title).toBe("Home");

    const items = menuService.listItems(menu.id);
    expect(items).toHaveLength(1);
  });

  test("addItem 父子层级环检测", () => {
    const menu = menuService.create({ name: "Test", handle: "test-cycle" });
    const a = menuService.addItem({
      menuId: menu.id,
      title: "A",
      linkType: "page",
      linkTarget: "/a",
    });
    const b = menuService.addItem({
      menuId: menu.id,
      title: "B",
      linkType: "page",
      linkTarget: "/b",
      parentId: a.id,
    });

    // 试图让 A 的 parent 指向 B → 形成环
    expect(() =>
      menuService.updateItem(a.id, { parentId: b.id }),
    ).toThrow("cycle");
  });

  test("reorderItems 重排序", () => {
    const menu = menuService.create({ name: "Reorder", handle: "reorder" });
    const i1 = menuService.addItem({
      menuId: menu.id,
      title: "First",
      linkType: "home",
      linkTarget: "/",
    });
    const i2 = menuService.addItem({
      menuId: menu.id,
      title: "Second",
      linkType: "home",
      linkTarget: "/",
    });

    menuService.reorderItems(menu.id, [i2.id, i1.id]);
    const items = menuService.listItems(menu.id);
    expect(items[0]!.id).toBe(i2.id);
    expect(items[1]!.id).toBe(i1.id);
  });
});
