/**
 * 后端时间约定（UTC）：
 * - 写入 DB、API 响应、服务层比较：统一为 ISO 8601 带 `Z`（例 `2026-03-22T08:00:00.000Z`）
 * - SQLite：`datetime('now')`、`date('now')`、`CURRENT_TIMESTAMP` 均按 UTC 语义
 * - 禁止用本地时区的 `getFullYear()` / `getMonth()` / `getDate()` 等拼业务时间戳
 *
 * 实现见 `src/db/dao/utils.ts` 的 `formatTimestamp`。
 */
export { formatTimestamp } from "../db/dao/utils";
