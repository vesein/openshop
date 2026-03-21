// 返回 UTC ISO 时间格式 (2026-03-21T20:42:42.698Z)
export function formatTimestamp(): string {
  return new Date().toISOString();
}