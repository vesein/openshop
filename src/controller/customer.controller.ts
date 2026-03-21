import { json, notFound, badRequest, parseBody, parsePagination } from "./_utils";
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
    if (!body?.email) return badRequest("email is required");
    return json(customerService.create(body as any), 201);
  },
};

export const customerDetailController = {
  GET(req: Request) {
    try {
      return json(customerService.getById(Number(req.params.id)));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(customerService.update(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(customerService.delete(Number(req.params.id)));
    } catch { return notFound(); }
  },
};

export const addressController = {
  GET(req: Request) {
    return json(customerService.listAddresses(Number(req.params.customerId)));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    return json(customerService.createAddress({ ...body, customerId: Number(req.params.customerId) } as any), 201);
  },
};

export const addressDetailController = {
  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(customerService.updateAddress(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(customerService.deleteAddress(Number(req.params.id)));
    } catch { return notFound(); }
  },
};
