import { json, notFound, badRequest, parseBody, parsePagination } from "./_utils";
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
    if (!body?.name || !body?.type) return badRequest("name and type are required");
    return json(promotionService.create(body as any), 201);
  },
};

export const promotionDetailController = {
  GET(req: Request) {
    try {
      return json(promotionService.getById(Number(req.params.id)));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(promotionService.update(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(promotionService.delete(Number(req.params.id)));
    } catch { return notFound(); }
  },
};

export const promotionCodeController = {
  GET(req: Request) {
    return json(promotionService.listCodes(Number(req.params.promotionId)));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.code) return badRequest("code is required");
    return json(promotionService.createCode({ ...body, promotionId: Number(req.params.promotionId) } as any), 201);
  },
};

export const promotionCodeDetailController = {
  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(promotionService.updateCode(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(promotionService.deleteCode(Number(req.params.id)));
    } catch { return notFound(); }
  },
};

export const activePromotionsController = {
  GET() {
    return json(promotionService.getActive());
  },
};
