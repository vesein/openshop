import { json, notFound, badRequest, parseBody } from "./_utils";
import { mediaService } from "../service/media.service";

export const mediaController = {
  GET(req: Request) {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") ?? undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 50;
    return json(mediaService.list({ kind, page, pageSize }));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.kind) return badRequest("kind is required");
    if (!body?.storageKey) return badRequest("storageKey is required");
    if (!body?.mimeType) return badRequest("mimeType is required");
    return json(mediaService.create(body as any), 201);
  },
};

export const mediaDetailController = {
  GET(req: Request) {
    const id = Number(req.params.id);
    try {
      return json(mediaService.getById(id));
    } catch { return notFound(); }
  },

  DELETE(req: Request) {
    const id = Number(req.params.id);
    try {
      return json(mediaService.delete(id));
    } catch { return notFound(); }
  },
};

export const productMediaController = {
  GET(req: Request) {
    const productId = Number(req.params.productId);
    return json(mediaService.listProductMedia(productId));
  },

  async POST(req: Request) {
    const productId = Number(req.params.productId);
    const body = await parseBody(req);
    if (!body?.mediaId) return badRequest("mediaId is required");
    return json(mediaService.attachToProduct({
      ...body,
      productId,
    } as any), 201);
  },
};

export const productMediaDetailController = {
  DELETE(req: Request) {
    const id = Number(req.params.id);
    return json(mediaService.detachFromProduct(id));
  },
};