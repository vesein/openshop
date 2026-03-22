export type ApiErrorCode =
  | "bad_request"
  | "not_found"
  | "conflict"
  | "internal_error";

function errorBody(msg: string, code: ApiErrorCode) {
  return { error: msg, code };
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function notFound(msg = "Not found", code: ApiErrorCode = "not_found") {
  return json(errorBody(msg, code), 404);
}

export function badRequest(msg: string, code: ApiErrorCode = "bad_request") {
  return json(errorBody(msg, code), 400);
}

export function conflict(msg: string, code: ApiErrorCode = "conflict") {
  return json(errorBody(msg, code), 409);
}

export function serverError(msg = "Internal server error", code: ApiErrorCode = "internal_error") {
  return json(errorBody(msg, code), 500);
}

/** 成功删除等无响应体场景 */
export function noContent() {
  return new Response(null, { status: 204 });
}

/** 路径或查询中的正整数 ID（>0）。空或未传返回 null（表示缺省时可由调用方区分「未传」与「非法」） */
export function parsePositiveIntParam(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

const CONFLICT_MESSAGES = new Set([
  "email already in use",
  "order already has a discount code; remove it before applying another",
  "discount code usage limit reached",
  "promotion usage limit reached",
]);

function isNotFoundMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.endsWith("not found") || m.includes(" not found");
}

/** SQLite / Drizzle：唯一约束、重复键 → 409 */
function inferConflictFromMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  if (m.includes("unique constraint")) return true;
  if (m.includes("already exists")) return true;
  if (m.includes("duplicate") && (m.includes("key") || m.includes("entry"))) return true;
  if (m.includes("sqlconstraintunique") || m.includes("sqlite_constraint_unique")) return true;
  return false;
}

/** 外键等约束失败 → 400（与「资源冲突」区分） */
function inferForeignKeyMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("foreign key") || m.includes("sqlite_constraint_foreignkey");
}

/** 将 service / 数据库抛出的 Error 映射为 400 / 404 / 409 */
export function handleServiceError(e: unknown): Response {
  const msg = e instanceof Error ? e.message : String(e);
  if (CONFLICT_MESSAGES.has(msg) || inferConflictFromMessage(msg)) {
    return conflict(msg);
  }
  if (isNotFoundMessage(msg)) return notFound(msg);
  if (inferForeignKeyMessage(msg)) return badRequest(msg);
  return badRequest(msg);
}

/** 解析 JSON body，失败返回 null */
export async function parseBody<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** 从 URL 解析分页参数；可指定默认 pageSize（如 media 为 50）。非法 page / pageSize 回退为安全默认值。 */
export function parsePagination(req: Request, opts?: { defaultPageSize?: number }) {
  const url = new URL(req.url);
  const dps = opts?.defaultPageSize ?? 20;
  const rawPage = url.searchParams.get("page");
  const rawPs = url.searchParams.get("pageSize");
  let page = 1;
  if (rawPage != null && rawPage !== "") {
    const p = Number(rawPage);
    if (Number.isInteger(p) && p >= 1) page = p;
  }
  let pageSize = dps;
  if (rawPs != null && rawPs !== "") {
    const ps = Number(rawPs);
    if (Number.isInteger(ps) && ps >= 1) pageSize = Math.min(ps, 100);
  }
  return { page, pageSize };
}
