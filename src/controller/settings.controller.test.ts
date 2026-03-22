import { describe, test, expect, beforeAll } from "bun:test";
import { readError } from "./test-helpers";
import { mockServiceModule } from "./test-mock-module";

beforeAll(() => {
  mockServiceModule("../service/settings.service", () => ({
    settingsService: {
      get: () => ({ id: 1, shopName: "Test" }),
      update: () => ({ id: 1, shopName: "U" }),
    },
  }));
});

const sc = await import("./settings.controller");

describe("settingsController", () => {
  test("GET 200", () => {
    const res = sc.settingsController.GET();
    expect(res.status).toBe(200);
  });

  test("PATCH 无 body → 400", async () => {
    const req = new Request("http://x/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "oops",
    });
    const res = await sc.settingsController.PATCH(req);
    expect(res.status).toBe(400);
    expect((await readError(res)).code).toBe("bad_request");
  });
});
