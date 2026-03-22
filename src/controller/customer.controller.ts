import { json, notFound, noContent, badRequest, parseBody, parsePagination, parsePositiveIntParam, handleServiceError } from "./_utils";
import { customerService } from "../service/customer.service";

export const customerController = {
  GET(req: Request) {
    const { page, pageSize } = parsePagination(req);
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    return json(customerService.list({ search, page, pageSize }));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.email || typeof body.email !== "string" || !body.email.trim()) {
      return badRequest("email is required");
    }
    try {
      return json(customerService.create(body as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const customerDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(customerService.getById(id));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(customerService.update(id, body as any));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = customerService.delete(id);
      if (!row) return notFound("Customer not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const addressController = {
  GET(req: Request) {
    const customerId = parsePositiveIntParam(req.params.customerId);
    if (customerId === null) return badRequest("invalid id");
    return json(customerService.listAddresses(customerId));
  },

  async POST(req: Request) {
    const customerId = parsePositiveIntParam(req.params.customerId);
    if (customerId === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, unknown> | null;
    if (!body) return badRequest("Invalid JSON body");
    const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim() : "";
    const address1 = typeof body.address1 === "string" ? body.address1.trim() : "";
    if (!countryCode || !address1) {
      return badRequest("countryCode and address1 are required");
    }
    try {
      return json(
        customerService.createAddress({ ...body, customerId, countryCode, address1 } as any),
        201,
      );
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const addressDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(customerService.updateAddress(id, body as any));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = customerService.deleteAddress(id);
      if (!row) return notFound("Address not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};
