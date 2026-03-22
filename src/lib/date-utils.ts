// 后端存 UTC ISO；此处仅负责在浏览器里格式化为本地展示
// 输入: UTC ISO (2026-03-21T20:56:08.428Z)
// 输出: 本地日期 (2026/3/22 或 3/22/2026)
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    // toLocaleDateString 自动转换为浏览器本地时区
    return date.toLocaleDateString();
  } catch {
    return "-";
  }
}

// 格式化为完整的本地日期时间
// 输入: UTC ISO 时间 (2026-03-21T20:56:08.428Z)
// 输出: 本地日期时间 (2026/3/22 04:56:08)
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    // toLocaleString 自动转换为浏览器本地时区
    return date.toLocaleString();
  } catch {
    return "-";
  }
}