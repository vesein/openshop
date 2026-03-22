import { json, notFound, noContent, badRequest, parseBody, parsePagination, parsePositiveIntParam, handleServiceError } from "./_utils";
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
    if (!body) return badRequest("Invalid JSON body");
    if (!body.title || !body.slug) return badRequest("title and slug are required");
    try {
      return json(collectionService.create(body as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const collectionDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(collectionService.getById(id));
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
      return json(collectionService.update(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = collectionService.delete(id);
      if (!row) return notFound("Collection not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const collectionProductController = {
  async POST(req: Request) {
    const collectionId = parsePositiveIntParam(req.params.id);
    if (collectionId === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    const productId = parsePositiveIntParam(String(body.productId ?? ""));
    if (productId === null) return badRequest("productId is required");
    let sortOrder = 0;
    if (body.sortOrder !== undefined && body.sortOrder !== null && body.sortOrder !== "") {
      sortOrder = Number(body.sortOrder);
      if (!Number.isInteger(sortOrder)) return badRequest("sortOrder must be an integer");
    }
    try {
      return json(collectionService.addProduct(collectionId, productId, sortOrder));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const collectionId = parsePositiveIntParam(req.params.id);
    if (collectionId === null) return badRequest("invalid id");
    const url = new URL(req.url);
    const productId = parsePositiveIntParam(url.searchParams.get("productId"));
    if (productId === null) return badRequest("productId query param required");
    try {
      collectionService.removeProduct(collectionId, productId);
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};
