import type { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { sqlite } from "./sqlite";
import { listPendingMigrations, runMigrations } from "./migrate";

/** 默认连接；集成测试可通过 `useSqliteForTests` 临时指向 :memory:，结束时须 `restoreDefaultSqliteFromTests` */
export let db = drizzle(sqlite, { schema });

/** 仅测试：将 Drizzle 指向给定 SQLite 连接（须已跑迁移） */
export function useSqliteForTests(database: Database): void {
  db = drizzle(database, { schema });
}

/** 仅测试：恢复为 `sqlite.ts` 的默认文件库连接 */
export function restoreDefaultSqliteFromTests(): void {
  db = drizzle(sqlite, { schema });
}

/**
 * 执行未应用的 migrations/*.sql（基线为 0001_baseline.sql）。
 * 结构真源在 migrations/，与 Drizzle schema 需手工对齐。
 */
export function initSchema() {
  runMigrations();
}

export { sqlite, listPendingMigrations, runMigrations };
