/** 构造带 `params` 的 Request（与 Bun.serve 路由行为一致） */
export function controllerRequest(
  url: string,
  opts: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  } = {},
): Request {
  const init: RequestInit = { method: opts.method ?? "GET" };
  if (opts.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(opts.body);
  }
  const req = new Request(url, init);
  (req as Request & { params: Record<string, string> }).params = opts.params ?? {};
  return req;
}

export async function readError(res: Response) {
  const j = (await res.json()) as { error: string; code: string };
  return j;
}
