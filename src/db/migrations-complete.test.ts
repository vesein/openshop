import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { join } from "node:path";
import { runMigrations } from "./migrate";

/**
 * 基线 0001 会创建大量触发器；0002–0011 应全部删除。
 * 用于防止遗漏 DROP 或迁移顺序错误。
 */
test("自 0001 起完整迁移后无用户触发器", () => {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys = ON");

  const migrationsDir = join(import.meta.dir, "../../migrations");
  runMigrations(migrationsDir, db);

  const count = (
    db.prepare(
      "SELECT COUNT(*) AS c FROM sqlite_master WHERE type = 'trigger' AND name NOT LIKE 'sqlite_%'",
    ).get() as { c: number }
  ).c;
  expect(count).toBe(0);
});
