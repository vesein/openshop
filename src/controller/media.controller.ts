import { json, notFound, noContent, badRequest, parseBody, parsePagination, parsePositiveIntParam, handleServiceError } from "./_utils";
import { mediaService } from "../service/media.service";

export const mediaController = {
  GET(req: Request) {
    const { page, pageSize } = parsePagination(req, { defaultPageSize: 50 });
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") ?? undefined;
    return json(mediaService.list({ kind, page, pageSize }));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body?.kind) return badRequest("kind is required");
    if (!body?.storageKey) return badRequest("storageKey is required");
    if (!body?.mimeType) return badRequest("mimeType is required");
    try {
      return json(mediaService.create(body as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const mediaDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(mediaService.getById(id));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = mediaService.delete(id);
      if (!row) return notFound("Media not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const productMediaController = {
  GET(req: Request) {
    const productId = parsePositiveIntParam(req.params.productId);
    if (productId === null) return badRequest("invalid id");
    return json(mediaService.listProductMedia(productId));
  },

  async POST(req: Request) {
    const productId = parsePositiveIntParam(req.params.productId);
    if (productId === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body?.mediaId) return badRequest("mediaId is required");
    const mediaId = parsePositiveIntParam(String(body.mediaId));
    if (mediaId === null) return badRequest("invalid mediaId");
    try {
      return json(
        mediaService.attachToProduct({
          ...(body as object),
          productId,
          mediaId,
        } as any),
        201,
      );
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const productMediaDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, unknown> | null;
    if (!body) return badRequest("Invalid JSON body");
    const patch: { variantId?: number | null; sortOrder?: number } = {};
    if ("variantId" in body) {
      if (body.variantId === null) {
        patch.variantId = null;
      } else {
        const vid = parsePositiveIntParam(String(body.variantId));
        if (vid === null) return badRequest("invalid variantId");
        patch.variantId = vid;
      }
    }
    if ("sortOrder" in body && body.sortOrder !== undefined) {
      const so = Number(body.sortOrder);
      if (!Number.isInteger(so)) return badRequest("sortOrder must be an integer");
      patch.sortOrder = so;
    }
    if (Object.keys(patch).length === 0) return badRequest("variantId or sortOrder required");
    try {
      return json(mediaService.updateProductMedia(id, patch));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      mediaService.detachFromProduct(id);
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};
