/**
 * 当前 UTC 时刻，ISO 8601（末尾 `Z`）。
 * 后端持久化、服务层「现在」比较请统一使用本函数，勿混用本地时区。
 */
export function formatTimestamp(): string {
  return new Date().toISOString();
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

/** 校验时间戳是否为标准 ISO 8601 UTC 格式 */
export function isValidTimestamp(v: string): boolean {
  return ISO_RE.test(v);
}