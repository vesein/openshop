import { describe, test, expect, mock, beforeAll } from "bun:test";
import { controllerRequest, readError } from "./test-helpers";
import { mockServiceModule } from "./test-mock-module";

const upsertValue = mock(() => ({ id: 1 }));

beforeAll(() => {
  mockServiceModule("../service/metafield.service", () => ({
    metafieldService: {
      listDefinitions: () => [],
      createDefinition: () => ({ id: 1 }),
      getDefinitionById: () => ({ id: 1 }),
      updateDefinition: () => ({ id: 1 }),
      deleteDefinition: () => {},
      listValues: () => [],
      upsertValue,
      deleteValue: () => {},
    },
  }));
});

const mc = await import("./metafield.controller");

describe("metafieldValueController POST", () => {
  test("无任何 value 字段 → 400", async () => {
    const res = await mc.metafieldValueController.POST(
      controllerRequest("http://x/api/admin/metafield-values/product/1", {
        method: "POST",
        body: { definitionId: 1 },
        params: { resourceType: "product", resourceId: "1" },
      }),
    );
    expect(res.status).toBe(400);
    const err = await readError(res);
    expect(err.code).toBe("bad_request");
    expect(err.error).toContain("at least one");
  });

  test("含 valueText → 201", async () => {
    const res = await mc.metafieldValueController.POST(
      controllerRequest("http://x/api/admin/metafield-values/product/1", {
        method: "POST",
        body: { definitionId: 1, valueText: "hello" },
        params: { resourceType: "product", resourceId: "1" },
      }),
    );
    expect(res.status).toBe(201);
    expect(upsertValue).toHaveBeenCalled();
  });
});
