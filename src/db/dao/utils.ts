/**
 * 当前 UTC 时刻，ISO 8601（末尾 `Z`）。
 * 后端持久化、服务层「现在」比较请统一使用本函数，勿混用本地时区。
 */
export function formatTimestamp(): string {
  return new Date().toISOString();
}