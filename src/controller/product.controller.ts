import { json, notFound, badRequest, parseBody, parsePagination } from "./_utils";
import { productService } from "../service/product.service";

export const productController = {
  GET(req: Request) {
    const { page, pageSize } = parsePagination(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    return json(productService.list({ status, search, page, pageSize }));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.title || !body?.slug) return badRequest("title and slug are required");
    return json(productService.create(body as any), 201);
  },
};

export const productDetailController = {
  GET(req: Request) {
    const id = Number(req.params.id);
    try {
      return json(productService.getById(id));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const id = Number(req.params.id);
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(productService.update(id, body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    const id = Number(req.params.id);
    try {
      return json(productService.delete(id));
    } catch { return notFound(); }
  },
};

export const variantController = {
  GET(req: Request) {
    const productId = Number(req.params.productId);
    return json(productService.listVariants(productId));
  },

  async POST(req: Request) {
    const productId = Number(req.params.productId);
    const body = await parseBody(req);
    if (!body?.sku) return badRequest("sku is required");
    return json(productService.createVariant({ ...body, productId } as any), 201);
  },
};

export const variantDetailController = {
  async PATCH(req: Request) {
    const id = Number(req.params.id);
    const body = await parseBody(req);
    return json(productService.updateVariant(id, body as any));
  },

  DELETE(req: Request) {
    return json(productService.deleteVariant(Number(req.params.id)));
  },
};

export const inventoryController = {
  GET(req: Request) {
    const variantId = Number(req.params.variantId);
    const level = productService.getInventory(variantId);
    return level ? json(level) : notFound();
  },
};

export const lowStockController = {
  GET(req: Request) {
    const url = new URL(req.url);
    const threshold = Number(url.searchParams.get("threshold")) || 10;
    return json(productService.listLowStock(threshold));
  },
};

export const inventoryAdjustController = {
  async POST(req: Request) {
    const variantId = Number(req.params.variantId);
    const body = await parseBody(req) as Record<string, any>;
    if (!body?.movementType) return badRequest("movementType is required");
    if (body?.quantityDelta === undefined) return badRequest("quantityDelta is required");
    try {
      return json(productService.recordStockMovement({
        variantId,
        movementType: String(body.movementType),
        quantityDelta: Number(body.quantityDelta),
        referenceType: body.referenceType ? String(body.referenceType) : undefined,
        referenceId: body.referenceId ? Number(body.referenceId) : undefined,
        note: body.note ? String(body.note) : undefined,
      }), 201);
    } catch (e: any) { return badRequest(e.message); }
  },
};
