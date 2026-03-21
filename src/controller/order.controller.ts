import { json, notFound, badRequest, parseBody, parsePagination } from "./_utils";
import { orderService } from "../service/order.service";

export const orderController = {
  GET(req: Request) {
    const { page, pageSize } = parsePagination(req);
    const url = new URL(req.url);
    const opts: Record<string, any> = { page, pageSize };
    for (const k of ["status", "paymentStatus", "fulfillmentStatus", "search", "from", "to"]) {
      const v = url.searchParams.get(k);
      if (v) opts[k] = v;
    }
    const cid = url.searchParams.get("customerId");
    if (cid) opts.customerId = Number(cid);
    return json(orderService.list(opts));
  },
};

export const orderDetailController = {
  GET(req: Request) {
    try {
      return json(orderService.getById(Number(req.params.id)));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const body = await parseBody(req);
    try {
      return json(orderService.update(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },
};

export const orderItemController = {
  GET(req: Request) {
    return json(orderService.listItems(Number(req.params.orderId)));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.productTitle) return badRequest("productTitle is required");
    return json(orderService.addItem({ ...body, orderId: Number(req.params.orderId) } as any), 201);
  },
};

export const orderItemDetailController = {
  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(orderService.updateItem(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    return json(orderService.removeItem(Number(req.params.id)));
  },
};

export const paymentController = {
  GET(req: Request) {
    return json(orderService.listPayments(Number(req.params.orderId)));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.provider || !body?.amount) return badRequest("provider and amount are required");
    return json(orderService.createPayment({ ...body, orderId: Number(req.params.orderId) } as any), 201);
  },
};

/** GET/POST on /api/admin/orders/:orderId/shipment */
export const orderShipmentController = {
  GET(req: Request) {
    const s = orderService.getShipment(Number(req.params.orderId));
    return s ? json(s) : notFound();
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    return json(orderService.createShipment({ ...body, orderId: Number(req.params.orderId) } as any), 201);
  },
};

/** PATCH on /api/admin/shipments/:id */
export const shipmentDetailController = {
  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(orderService.updateShipment(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },
};

export const shipmentActionController = {
  async POST(req: Request) {
    const id = Number(req.params.id);
    const action = req.params.action;
    const body = await parseBody(req) ?? {};

    if (action === "ship") {
      if (!body.carrier || !body.trackingNumber) return badRequest("carrier and trackingNumber required");
      return json(orderService.markShipped(id, body as any));
    }
    if (action === "deliver") {
      return json(orderService.markDelivered(id));
    }
    return badRequest("Invalid action");
  },
};

export const orderDiscountController = {
  GET(req: Request) {
    return json(orderService.listDiscountCodes(Number(req.params.orderId)));
  },

  async POST(req: Request) {
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    const orderId = Number(req.params.orderId);

    // Support applying by code string (preferred) or by IDs (backward compat)
    if (body.code) {
      try {
        return json(orderService.applyDiscountCodeByCode(orderId, String(body.code)));
      } catch (e: any) { return badRequest(e.message); }
    }

    if (!body.discountCodeId || !body.promotionId) {
      return badRequest("code or (discountCodeId and promotionId) required");
    }
    return json(orderService.applyDiscountCode(
      orderId,
      Number(body.discountCodeId),
      Number(body.promotionId)
    ));
  },

  DELETE(req: Request) {
    const url = new URL(req.url);
    const discountCodeId = Number(url.searchParams.get("discountCodeId"));
    if (!discountCodeId) return badRequest("discountCodeId query param required");
    return json(orderService.removeDiscountCode(
      Number(req.params.orderId),
      discountCodeId
    ));
  },
};

export const dashboardController = {
  GET() {
    return json(orderService.dashboardStats());
  },
};
