import { json, notFound, noContent, badRequest, parseBody, parsePagination, parsePositiveIntParam, handleServiceError } from "./_utils";
import { promotionService } from "../service/promotion.service";

export const promotionController = {
  GET(req: Request) {
    const { page, pageSize } = parsePagination(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const type = url.searchParams.get("type") ?? undefined;
    return json(promotionService.list({ status, type, page, pageSize }));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.name || !body.type) return badRequest("name and type are required");
    try {
      return json(promotionService.create(body as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const promotionDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(promotionService.getById(id));
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
      return json(promotionService.update(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = promotionService.delete(id);
      if (!row) return notFound("Promotion not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const promotionCodeController = {
  GET(req: Request) {
    const promotionId = parsePositiveIntParam(req.params.promotionId);
    if (promotionId === null) return badRequest("invalid id");
    return json(promotionService.listCodes(promotionId));
  },

  async POST(req: Request) {
    const promotionId = parsePositiveIntParam(req.params.promotionId);
    if (promotionId === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.code) return badRequest("code is required");
    try {
      return json(promotionService.createCode({ ...body, promotionId } as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const promotionCodeDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(promotionService.updateCode(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = promotionService.deleteCode(id);
      if (!row) return notFound("Discount code not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const activePromotionsController = {
  GET() {
    return json(promotionService.getActive());
  },
};
