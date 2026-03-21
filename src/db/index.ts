import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const DB_PATH = process.env.DATABASE_URL ?? "data/shop.db";

// 确保 data 目录存在
import { mkdirSync } from "node:fs";
mkdirSync(new URL(".", `file://${process.cwd()}/data/`).pathname, { recursive: true });

const sqlite = new Database(DB_PATH, { create: true });

// PRAGMAs — 每个连接必须执行
sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA synchronous = NORMAL");
sqlite.exec("PRAGMA foreign_keys = ON");
sqlite.exec("PRAGMA busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });

/**
 * 用原始 SQL 初始化 schema (触发器/索引/CHECK 约束)
 * 适用于首次建库或开发环境
 */
export function initSchema(sqlPath: string = "docs/shop-db.sql") {
  const sql = require("node:fs").readFileSync(sqlPath, "utf-8");
  sqlite.exec(sql);
}

export { sqlite };
