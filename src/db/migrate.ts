import type { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sqlite } from "./sqlite";

const CREATE_MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS schema_migrations (
    version     TEXT PRIMARY KEY NOT NULL,
    applied_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
`;

/**
 * 按文件名排序执行 migrations/*.sql；已记录在 schema_migrations 中的跳过。
 * 基线为 0001_baseline.sql；结构变更请追加新迁移文件。
 * @param db 默认 `sqlite`；可传入内存库用于测试。
 */
export function runMigrations(
  migrationsDir = join(process.cwd(), "migrations"),
  db: Database = sqlite,
) {
  db.exec(CREATE_MIGRATIONS_TABLE);

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.warn("⚠️  migrations/ 下没有 .sql 文件，跳过");
    return;
  }

  const selectApplied = db.prepare(
    "SELECT 1 AS ok FROM schema_migrations WHERE version = ?",
  );
  const insertApplied = db.prepare(
    "INSERT INTO schema_migrations (version) VALUES (?)",
  );

  for (const file of files) {
    const version = file.replace(/\.sql$/i, "");
    if (selectApplied.get(version)) {
      continue;
    }

    const path = join(migrationsDir, file);
    const sql = readFileSync(path, "utf-8");
    console.log(`→ applying migration ${version} ...`);
    db.exec(sql);
    insertApplied.run(version);
    console.log(`✓ ${version}`);
  }
}

export function listPendingMigrations(
  migrationsDir = join(process.cwd(), "migrations"),
  db: Database = sqlite,
): string[] {
  db.exec(CREATE_MIGRATIONS_TABLE);
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const selectApplied = db.prepare(
    "SELECT 1 AS ok FROM schema_migrations WHERE version = ?",
  );
  return files
    .map((f) => f.replace(/\.sql$/i, ""))
    .filter((v) => !selectApplied.get(v));
}

if (import.meta.main) {
  runMigrations();
  const applied = sqlite
    .prepare("SELECT version FROM schema_migrations ORDER BY version")
    .all() as { version: string }[];
  console.log(`\n已应用迁移: ${applied.map((r) => r.version).join(", ") || "(无)"}`);
}
