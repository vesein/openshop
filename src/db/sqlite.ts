import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";

const DB_PATH = process.env.DATABASE_URL ?? "data/shop.db";

mkdirSync(new URL(".", `file://${process.cwd()}/data/`).pathname, { recursive: true });

export const sqlite = new Database(DB_PATH, { create: true });

sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA synchronous = NORMAL");
sqlite.exec("PRAGMA foreign_keys = ON");
sqlite.exec("PRAGMA busy_timeout = 5000");
