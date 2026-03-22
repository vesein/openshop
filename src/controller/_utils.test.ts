import { test, expect } from "bun:test";
import { parsePositiveIntParam, handleServiceError, parsePagination, conflict } from "./_utils";

test("parsePositiveIntParam", () => {
  expect(parsePositiveIntParam(undefined)).toBeNull();
  expect(parsePositiveIntParam(null)).toBeNull();
  expect(parsePositiveIntParam("")).toBeNull();
  expect(parsePositiveIntParam("0")).toBeNull();
  expect(parsePositiveIntParam("-1")).toBeNull();
  expect(parsePositiveIntParam("3.5")).toBeNull();
  expect(parsePositiveIntParam("12")).toBe(12);
});

test("handleServiceError 映射", async () => {
  const r409 = handleServiceError(new Error("email already in use"));
  expect(r409.status).toBe(409);
  expect(await r409.json()).toEqual({ error: "email already in use", code: "conflict" });

  const r404 = handleServiceError(new Error("Order not found"));
  expect(r404.status).toBe(404);
  expect(await r404.json()).toMatchObject({ code: "not_found" });

  const r400 = handleServiceError(new Error("invalid order status transition"));
  expect(r400.status).toBe(400);
  expect(await r400.json()).toMatchObject({ code: "bad_request" });

  const uniq = handleServiceError(new Error("UNIQUE constraint failed: idx.foo"));
  expect(uniq.status).toBe(409);

  const fk = handleServiceError(new Error("FOREIGN KEY constraint failed"));
  expect(fk.status).toBe(400);
});

test("parsePagination defaultPageSize", () => {
  const req = new Request("http://x/?page=2");
  const a = parsePagination(req);
  expect(a.page).toBe(2);
  expect(a.pageSize).toBe(20);
  const b = parsePagination(req, { defaultPageSize: 50 });
  expect(b.pageSize).toBe(50);
  const capped = new Request("http://x/?pageSize=500");
  expect(parsePagination(capped).pageSize).toBe(100);
  expect(parsePagination(new Request("http://x/?page=-1&pageSize=0")).page).toBe(1);
  expect(parsePagination(new Request("http://x/?page=foo")).page).toBe(1);
});

test("conflict 响应含 code", async () => {
  const r = conflict("dup");
  expect(r.status).toBe(409);
  expect(await r.json()).toEqual({ error: "dup", code: "conflict" });
});
