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
    } catch (e: any) { return badRequest(e.message); }
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
    try {
      return json(productService.createVariant({ ...body, productId } as any), 201);
    } catch (e: any) { return badRequest(e.message); }
  },
};

export const variantDetailController = {
  async PATCH(req: Request) {
    const id = Number(req.params.id);
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(productService.updateVariant(id, body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(productService.deleteVariant(Number(req.params.id)));
    } catch (e: any) { return badRequest(e.message); }
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

// =========================================================
// Product Options
// =========================================================

export const productOptionController = {
  GET(req: Request) {
    const productId = Number(req.params.productId);
    return json(productService.listOptions(productId));
  },

  async POST(req: Request) {
    const productId = Number(req.params.productId);
    const body = await parseBody(req);
    if (!body?.name) return badRequest("name is required");
    try {
      return json(productService.createOption({ ...body, productId } as any), 201);
    } catch (e: any) { return badRequest(e.message); }
  },
};

export const productOptionDetailController = {
  async PATCH(req: Request) {
    const id = Number(req.params.id);
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(productService.updateOption(id, body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(productService.deleteOption(Number(req.params.id)));
    } catch (e: any) { return badRequest(e.message); }
  },
};

// =========================================================
// Product Option Values
// =========================================================

export const optionValueController = {
  GET(req: Request) {
    const optionId = Number(req.params.optionId);
    return json(productService.listOptionValues(optionId));
  },

  async POST(req: Request) {
    const optionId = Number(req.params.optionId);
    const body = await parseBody(req);
    if (!body?.value) return badRequest("value is required");
    try {
      return json(productService.createOptionValue({ ...body, optionId } as any), 201);
    } catch (e: any) { return badRequest(e.message); }
  },
};

export const optionValueDetailController = {
  async PATCH(req: Request) {
    const id = Number(req.params.id);
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(productService.updateOptionValue(id, body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(productService.deleteOptionValue(Number(req.params.id)));
    } catch (e: any) { return badRequest(e.message); }
  },
};

// =========================================================
// Variant Option Values
// =========================================================

export const variantOptionValueController = {
  GET(req: Request) {
    const variantId = Number(req.params.variantId);
    return json(productService.listVariantOptionValues(variantId));
  },

  async PUT(req: Request) {
    const variantId = Number(req.params.variantId);
    const body = await parseBody(req) as Record<string, any>;
    if (!body?.optionValueIds || !Array.isArray(body.optionValueIds)) {
      return badRequest("optionValueIds array is required");
    }
    try {
      return json(productService.replaceVariantOptionValues(
        variantId,
        body.optionValueIds.map(Number)
      ));
    } catch (e: any) { return badRequest(e.message); }
  },
};
