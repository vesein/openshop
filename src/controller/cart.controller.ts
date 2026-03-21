import { json, notFound, badRequest, parseBody } from "./_utils";
import { cartService } from "../service/cart.service";

/** POST /api/admin/carts */
export const cartListController = {
  async POST(req: Request) {
    const body = await parseBody(req) as Record<string, any>;
    if (!body?.sessionToken) return badRequest("sessionToken is required");
    if (!body?.currencyCode) return badRequest("currencyCode is required");
    return json(cartService.create({
      sessionToken: String(body.sessionToken),
      currencyCode: String(body.currencyCode),
      customerId: body.customerId ? Number(body.customerId) : undefined,
    }), 201);
  },
};

/** GET/PATCH/DELETE /api/admin/carts/:token */
export const cartController = {
  GET(req: Request) {
    const token = req.params.token ?? "";
    if (!token) return badRequest("token is required");
    try {
      return json(cartService.getByToken(token));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const token = req.params.token ?? "";
    try {
      const cart = cartService.getByToken(token);
      const body = await parseBody(req) as Record<string, any>;
      if (!body) return badRequest("Invalid JSON body");
      return json(cartService.update(cart.id, body));
    } catch (e: any) {
      if (e.message === "Cart not found") return notFound();
      return badRequest(e.message);
    }
  },

  DELETE(req: Request) {
    const token = req.params.token ?? "";
    try {
      const cart = cartService.getByToken(token);
      return json(cartService.abandon(cart.id));
    } catch { return notFound(); }
  },
};

export const cartItemController = {
  GET(req: Request) {
    const cartId = Number(req.params.cartId);
    return json(cartService.listItems(cartId));
  },

  async POST(req: Request) {
    const cartId = Number(req.params.cartId);
    const body = await parseBody(req) as Record<string, any>;
    if (!body?.variantId) return badRequest("variantId is required");
    if (!body?.quantity) return badRequest("quantity is required");
    if (!body?.unitPriceAmount) return badRequest("unitPriceAmount is required");
    return json(cartService.addItem({
      cartId,
      variantId: Number(body.variantId),
      quantity: Number(body.quantity),
      unitPriceAmount: Number(body.unitPriceAmount),
    }), 201);
  },
};

export const cartItemDetailController = {
  async PATCH(req: Request) {
    const id = Number(req.params.id);
    const body = await parseBody(req) as Record<string, any>;
    if (!body?.quantity) return badRequest("quantity is required");
    try {
      return json(cartService.updateItemQuantity(id, Number(body.quantity)));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    const id = Number(req.params.id);
    return json(cartService.removeItem(id));
  },
};
