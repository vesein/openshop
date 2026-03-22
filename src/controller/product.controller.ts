import { json, notFound, noContent, badRequest, parseBody, parsePagination, parsePositiveIntParam, handleServiceError } from "./_utils";
import { productService } from "../service/product.service";

const INVENTORY_MOVEMENT_TYPES = new Set([
  "in",
  "reserve",
  "release",
  "sold",
  "returned",
  "adjust",
]);

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
    if (!body) return badRequest("Invalid JSON body");
    if (!body.title || !body.slug) return badRequest("title and slug are required");
    try {
      return json(productService.create(body as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const productDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(productService.getById(id));
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
      return json(productService.update(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = productService.delete(id);
      if (!row) return notFound("Product not found");
      return noContent();
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};

export const variantController = {
  GET(req: Request) {
    const productId = parsePositiveIntParam(req.params.productId);
    if (productId === null) return badRequest("invalid id");
    return json(productService.listVariants(productId));
  },

  async POST(req: Request) {
    const productId = parsePositiveIntParam(req.params.productId);
    if (productId === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.sku) return badRequest("sku is required");
    try {
      return json(productService.createVariant({ ...body, productId } as any), 201);
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};

export const variantDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(productService.updateVariant(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      productService.deleteVariant(id);
      return noContent();
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};

export const inventoryController = {
  GET(req: Request) {
    const variantId = parsePositiveIntParam(req.params.variantId);
    if (variantId === null) return badRequest("invalid id");
    const level = productService.getInventory(variantId);
    return level ? json(level) : notFound();
  },
};

export const lowStockController = {
  GET(req: Request) {
    const url = new URL(req.url);
    const raw = url.searchParams.get("threshold");
    const threshold = raw === null || raw === "" ? 10 : Number(raw);
    if (!Number.isInteger(threshold) || threshold < 0) {
      return badRequest("threshold must be a non-negative integer");
    }
    return json(productService.listLowStock(threshold));
  },
};

export const inventoryAdjustController = {
  async POST(req: Request) {
    const variantId = parsePositiveIntParam(req.params.variantId);
    if (variantId === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    if (!body?.movementType) return badRequest("movementType is required");
    const movementType = String(body.movementType);
    if (!INVENTORY_MOVEMENT_TYPES.has(movementType)) {
      return badRequest("invalid movementType");
    }
    if (body?.quantityDelta === undefined) return badRequest("quantityDelta is required");
    const quantityDelta = Number(body.quantityDelta);
    if (!Number.isFinite(quantityDelta)) return badRequest("quantityDelta must be a finite number");
    let referenceId: number | undefined = undefined;
    if (body.referenceId != null && body.referenceId !== "") {
      const rid = parsePositiveIntParam(String(body.referenceId));
      if (rid === null) return badRequest("invalid referenceId");
      referenceId = rid;
    }
    try {
      return json(
        productService.recordStockMovement({
          variantId,
          movementType,
          quantityDelta,
          referenceType: body.referenceType ? String(body.referenceType) : undefined,
          referenceId,
          note: body.note ? String(body.note) : undefined,
        }),
        201,
      );
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};

// =========================================================
// Product Options
// =========================================================

export const productOptionController = {
  GET(req: Request) {
    const productId = parsePositiveIntParam(req.params.productId);
    if (productId === null) return badRequest("invalid id");
    return json(productService.listOptions(productId));
  },

  async POST(req: Request) {
    const productId = parsePositiveIntParam(req.params.productId);
    if (productId === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.name) return badRequest("name is required");
    try {
      return json(productService.createOption({ ...body, productId } as any), 201);
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};

export const productOptionDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(productService.updateOption(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      productService.deleteOption(id);
      return noContent();
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};

// =========================================================
// Product Option Values
// =========================================================

export const optionValueController = {
  GET(req: Request) {
    const optionId = parsePositiveIntParam(req.params.optionId);
    if (optionId === null) return badRequest("invalid id");
    return json(productService.listOptionValues(optionId));
  },

  async POST(req: Request) {
    const optionId = parsePositiveIntParam(req.params.optionId);
    if (optionId === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.value) return badRequest("value is required");
    try {
      return json(productService.createOptionValue({ ...body, optionId } as any), 201);
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};

export const optionValueDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(productService.updateOptionValue(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      productService.deleteOptionValue(id);
      return noContent();
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};

// =========================================================
// Variant Option Values
// =========================================================

export const variantOptionValueController = {
  GET(req: Request) {
    const variantId = parsePositiveIntParam(req.params.variantId);
    if (variantId === null) return badRequest("invalid id");
    return json(productService.listVariantOptionValues(variantId));
  },

  async PUT(req: Request) {
    const variantId = parsePositiveIntParam(req.params.variantId);
    if (variantId === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    if (!body?.optionValueIds || !Array.isArray(body.optionValueIds)) {
      return badRequest("optionValueIds array is required");
    }
    const ids = body.optionValueIds.map((x: unknown) => Number(x));
    if (ids.some((x) => !Number.isInteger(x) || x <= 0)) {
      return badRequest("optionValueIds must be positive integers");
    }
    try {
      return json(productService.replaceVariantOptionValues(variantId, ids));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },
};
