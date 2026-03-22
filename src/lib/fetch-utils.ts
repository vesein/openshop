export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "请求失败", code: "internal_error" }));
    throw new ApiError(res.status, body.code, body.error);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
