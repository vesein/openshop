export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function notFound(msg = "Not found") {
  return json({ error: msg }, 404);
}

export function badRequest(msg: string) {
  return json({ error: msg }, 400);
}

export function conflict(msg: string) {
  return json({ error: msg }, 409);
}

export function serverError(msg = "Internal server error") {
  return json({ error: msg }, 500);
}

/** 解析 JSON body，失败返回 null */
export async function parseBody<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** 从 URL 解析分页参数 */
export function parsePagination(req: Request) {
  const url = new URL(req.url);
  return {
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Math.min(Number(url.searchParams.get("pageSize")) || 20, 100),
  };
}
