import { Database } from "bun:sqlite";
import { join } from "node:path";
import { runMigrations } from "../migrate";

/** 迁移目录（自 `src/db/testing/` 指向仓库根下 `migrations/`） */
const MIGRATIONS_DIR = join(import.meta.dir, "../../../migrations");

/**
 * 新建内存库、开启外键、跑完全部 migrations。
 * 供 DAO 集成测试使用；调用方需再 `useSqliteForTests(db)`。
 */
export function createMigratedMemoryDatabase(): Database {
  const database = new Database(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  runMigrations(MIGRATIONS_DIR, database);
  return database;
}
