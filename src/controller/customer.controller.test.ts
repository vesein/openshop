import { describe, test, expect } from "bun:test";
import { controllerRequest, readError } from "./test-helpers";
import { mockServiceModule } from "./test-mock-module";

mockServiceModule("../service/customer.service", () => ({
  customerService: {
    list: () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
    create: () => {
      throw new Error("email already in use");
    },
    getById: () => ({ id: 1 }),
    update: () => ({ id: 1 }),
    delete: () => ({ id: 1 }),
    listAddresses: () => [],
    createAddress: () => ({ id: 1 }),
    updateAddress: () => ({ id: 1 }),
    deleteAddress: () => ({ id: 1 }),
  },
}));

const { customerController } = await import("./customer.controller");

describe("customerController", () => {
  test("POST 邮箱冲突 → 409", async () => {
    const res = await customerController.POST(
      controllerRequest("http://x/api/admin/customers", {
        method: "POST",
        body: { email: "a@b.c", firstName: "A", lastName: "B" },
        params: {},
      }),
    );
    expect(res.status).toBe(409);
    expect((await readError(res)).code).toBe("conflict");
  });
});
