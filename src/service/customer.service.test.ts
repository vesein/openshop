import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { restoreDefaultSqliteFromTests, useSqliteForTests } from "../db/index";
import { createMigratedMemoryDatabase } from "../db/testing/memory-db";
import { customerDao, metafieldDefinitionDao, metafieldValueDao } from "../db/dao";
import { customerService } from "./customer.service";

describe("customerService 集成", () => {
  beforeEach(() => {
    const sqlite = createMigratedMemoryDatabase();
    useSqliteForTests(sqlite);
  });

  afterAll(() => {
    restoreDefaultSqliteFromTests();
  });

  // ─── create ───
  test("create 成功创建客户", () => {
    const c = customerService.create({
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Li",
    });
    expect(c.email).toBe("alice@example.com");
    expect(c.id).toBeGreaterThan(0);
  });

  test("create 去除 email 首尾空格", () => {
    const c = customerService.create({ email: "  bob@example.com  " });
    expect(c.email).toBe("bob@example.com");
  });

  test("create 重复 email 抛错", () => {
    customerService.create({ email: "dup@example.com" });
    expect(() => customerService.create({ email: "dup@example.com" })).toThrow(
      "email already in use",
    );
  });

  // ─── update ───
  test("update 修改非 email 字段", () => {
    const c = customerService.create({ email: "x@example.com" });
    const updated = customerService.update(c.id, { firstName: "New" });
    expect(updated.firstName).toBe("New");
  });

  test("update email 冲突抛错", () => {
    customerService.create({ email: "a@example.com" });
    const b = customerService.create({ email: "b@example.com" });
    expect(() =>
      customerService.update(b.id, { email: "a@example.com" }),
    ).toThrow("email already in use");
  });

  test("update email 改为自身不抛错", () => {
    const c = customerService.create({ email: "me@example.com" });
    expect(() =>
      customerService.update(c.id, { email: "me@example.com" }),
    ).not.toThrow();
  });

  // ─── delete ───
  test("delete 级联删除 metafield values", () => {
    const c = customerService.create({ email: "del@example.com" });
    const def = metafieldDefinitionDao.create({
      resourceType: "customer",
      namespace: "custom",
      key: "vip",
      name: "VIP",
      valueType: "boolean",
    });
    metafieldValueDao.upsert({
      definitionId: def.id,
      resourceType: "customer",
      resourceId: c.id,
      valueBoolean: 1,
    });

    const before = metafieldValueDao.findByResource("customer", c.id);
    expect(before).toHaveLength(1);

    customerService.delete(c.id);

    const after = metafieldValueDao.findByResource("customer", c.id);
    expect(after).toHaveLength(0);
  });

  // ─── addresses ───
  test("createAddress / listAddresses", () => {
    const c = customerService.create({ email: "addr@example.com" });
    customerService.createAddress({
      customerId: c.id,
      firstName: "A",
      city: "Shanghai",
    });

    const list = customerService.listAddresses(c.id);
    expect(list).toHaveLength(1);
    expect(list[0].city).toBe("Shanghai");
  });

  test("updateAddress 禁止修改 customerId", () => {
    const c1 = customerService.create({ email: "c1@example.com" });
    const c2 = customerService.create({ email: "c2@example.com" });
    customerService.createAddress({ customerId: c1.id, city: "BJ" });

    const addrs = customerService.listAddresses(c1.id);
    expect(() =>
      customerService.updateAddress(addrs[0].id, { customerId: c2.id }),
    ).toThrow("immutable");
  });

  // ─── list ───
  test("list 分页 + 搜索", () => {
    customerService.create({ email: "search@example.com", firstName: "SearchMe" });
    customerService.create({ email: "other@example.com", firstName: "Other" });

    const result = customerService.list({ search: "SearchMe" });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].firstName).toBe("SearchMe");
  });
});
