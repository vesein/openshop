import { json, notFound, badRequest, parseBody, parsePagination } from "./_utils";
import { collectionService } from "../service/collection.service";

export const collectionController = {
  GET(req: Request) {
    const { page, pageSize } = parsePagination(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    return json(collectionService.list({ status, page, pageSize }));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.title || !body?.slug) return badRequest("title and slug are required");
    return json(collectionService.create(body as any), 201);
  },
};

export const collectionDetailController = {
  GET(req: Request) {
    try {
      return json(collectionService.getById(Number(req.params.id)));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(collectionService.update(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(collectionService.delete(Number(req.params.id)));
    } catch { return notFound(); }
  },
};

export const collectionProductController = {
  async POST(req: Request) {
    const body = await parseBody(req) as Record<string, any>;
    if (!body?.productId) return badRequest("productId is required");
    return json(collectionService.addProduct(
      Number(req.params.id),
      Number(body.productId),
      body.sortOrder !== undefined ? Number(body.sortOrder) : 0
    ));
  },

  DELETE(req: Request) {
    const url = new URL(req.url);
    const productId = Number(url.searchParams.get("productId"));
    if (!productId) return badRequest("productId query param required");
    return json(collectionService.removeProduct(Number(req.params.id), productId));
  },
};
