/**
 * 一次性脚本：将 0001 中「表+索引」段执行到内存库，列出表/列，便于与 schema.ts 人工对照。
 * 用法: bun scripts/verify-schema-vs-baseline.ts
 */
import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";

const raw = readFileSync("migrations/0001_baseline.sql", "utf-8");
const lines = raw.split("\n");
const end = lines.findIndex((l) => l.includes("-- triggers"));
const sql = lines.slice(0, end > 0 ? end : 688).join("\n");

const db = new Database(":memory:");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(sql);

const tables = (
  db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  ).all() as { name: string }[]
).map((r) => r.name);

const expected = [
  "shop_settings",
  "media_assets",
  "products",
  "product_variants",
  "product_options",
  "product_option_values",
  "variant_option_values",
  "product_media",
  "collections",
  "collection_products",
  "promotions",
  "discount_codes",
  "order_discount_codes",
  "inventory_items",
  "inventory_levels",
  "inventory_movements",
  "customers",
  "customer_addresses",
  "carts",
  "cart_items",
  "orders",
  "order_items",
  "payments",
  "shipments",
  "pages",
  "menus",
  "menu_items",
  "metafield_definitions",
  "metafield_values",
];

const missing = expected.filter((t) => !tables.includes(t));
const extra = tables.filter((t) => !expected.includes(t));
console.log("missing tables:", missing.length ? missing : "(none)");
console.log("extra tables:", extra.length ? extra : "(none)");

for (const t of expected) {
  if (!tables.includes(t)) continue;
  const cols = db.prepare(`PRAGMA table_info(${t})`).all() as { name: string }[];
  console.log(`\n${t}:\n  ${cols.map((c) => c.name).join(", ")}`);
}

const idx = db
  .prepare(
    "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name, name",
  )
  .all() as { name: string; tbl_name: string }[];
console.log("\n--- indexes (non-internal) ---");
for (const r of idx) {
  console.log(`${r.tbl_name}.${r.name}`);
}
