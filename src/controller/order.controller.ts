import {
  json,
  notFound,
  noContent,
  badRequest,
  parseBody,
  parsePagination,
  parsePositiveIntParam,
  handleServiceError,
} from "./_utils";

const SHIPMENT_STATUSES = new Set(["pending", "shipped", "delivered", "returned"]);
import { orderService } from "../service/order.service";

export const orderController = {
  GET(req: Request) {
    const { page, pageSize } = parsePagination(req);
    const url = new URL(req.url);
    const opts: Record<string, unknown> = { page, pageSize };
    for (const k of ["status", "paymentStatus", "fulfillmentStatus", "search", "from", "to"]) {
      const v = url.searchParams.get(k);
      if (v) opts[k] = v;
    }
    const cidRaw = url.searchParams.get("customerId");
    if (cidRaw != null && cidRaw !== "") {
      const cid = parsePositiveIntParam(cidRaw);
      if (cid === null) return badRequest("invalid customerId");
      opts.customerId = cid;
    }
    return json(orderService.list(opts as any));
  },
};

export const orderDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(orderService.getById(id));
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
      return json(orderService.update(id, body as any));
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const orderItemController = {
  GET(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    return json(orderService.listItems(orderId));
  },

  async POST(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    const productTitle = typeof body.productTitle === "string" ? body.productTitle.trim() : "";
    if (!productTitle) return badRequest("productTitle is required");
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return badRequest("quantity must be a positive integer");
    }
    const unitPriceAmount = Number(body.unitPriceAmount);
    if (!Number.isInteger(unitPriceAmount) || unitPriceAmount < 0) {
      return badRequest("unitPriceAmount must be a non-negative integer");
    }
    try {
      return json(
        orderService.addItem({ ...body, orderId, productTitle, quantity, unitPriceAmount } as any),
        201,
      );
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const orderItemDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(orderService.updateItem(id, body as any));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = orderService.removeItem(id);
      if (!row) return notFound("Order item not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const paymentController = {
  GET(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    return json(orderService.listPayments(orderId));
  },

  async POST(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.provider || body.amount === undefined || body.amount === null) {
      return badRequest("provider and amount are required");
    }
    if (!body.currencyCode || !body.status) {
      return badRequest("currencyCode and status are required");
    }
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      return badRequest("amount must be a positive integer");
    }
    try {
      return json(
        orderService.createPayment({
          ...body,
          orderId,
          amount,
          provider: String(body.provider),
          currencyCode: String(body.currencyCode),
          status: String(body.status),
        } as any),
        201,
      );
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

/** PATCH /api/admin/payments/:id — 更新单条支付记录 */
export const adminPaymentDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(orderService.updatePayment(id, body as any));
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

/** GET/POST on /api/admin/orders/:orderId/shipment */
export const orderShipmentController = {
  GET(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    const s = orderService.getShipment(orderId);
    return s ? json(s) : notFound();
  },

  async POST(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, unknown> | null;
    if (!body) return badRequest("Invalid JSON body");
    if (body.status != null && body.status !== "") {
      const st = String(body.status);
      if (!SHIPMENT_STATUSES.has(st)) return badRequest("invalid status");
    }
    try {
      return json(orderService.createShipment({ ...body, orderId } as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

/** PATCH on /api/admin/shipments/:id */
export const shipmentDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(orderService.updateShipment(id, body as any));
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const shipmentActionController = {
  async POST(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const action = req.params.action;
    const body = (await parseBody(req) as Record<string, any>) ?? {};

    if (action === "ship") {
      if (!body.carrier || !body.trackingNumber) return badRequest("carrier and trackingNumber required");
      try {
        return json(
          orderService.markShipped(id, {
            carrier: String(body.carrier),
            service: body.service != null ? String(body.service) : "",
            trackingNumber: String(body.trackingNumber),
            trackingUrl: body.trackingUrl != null ? String(body.trackingUrl) : undefined,
          }),
        );
      } catch (e) {
        return handleServiceError(e);
      }
    }
    if (action === "deliver") {
      try {
        return json(orderService.markDelivered(id));
      } catch (e) {
        return handleServiceError(e);
      }
    }
    return badRequest("Invalid action");
  },
};

export const orderDiscountController = {
  GET(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    return json(orderService.listDiscountCodes(orderId));
  },

  async POST(req: Request) {
    const body = await parseBody(req) as Record<string, unknown> | null;
    if (!body) return badRequest("Invalid JSON body");
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");

    if (body.code != null && String(body.code).trim() !== "") {
      try {
        return json(orderService.applyDiscountCodeByCode(orderId, String(body.code).trim()));
      } catch (e) {
        return handleServiceError(e);
      }
    }

    const discountCodeId = parsePositiveIntParam(String(body.discountCodeId ?? ""));
    const promotionId = parsePositiveIntParam(String(body.promotionId ?? ""));
    if (discountCodeId === null || promotionId === null) {
      return badRequest("code or (discountCodeId and promotionId) required");
    }
    try {
      return json(orderService.applyDiscountCode(orderId, discountCodeId, promotionId));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    const url = new URL(req.url);
    const discountCodeId = parsePositiveIntParam(url.searchParams.get("discountCodeId"));
    if (discountCodeId === null) return badRequest("discountCodeId query param required");
    try {
      orderService.removeDiscountCode(orderId, discountCodeId);
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const orderEventController = {
  GET(req: Request) {
    const orderId = parsePositiveIntParam(req.params.orderId);
    if (orderId === null) return badRequest("invalid id");
    return json(orderService.listEvents(orderId));
  },
};

export const dashboardController = {
  GET() {
    return json(orderService.dashboardStats());
  },
};
