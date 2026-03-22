import { json, notFound, noContent, badRequest, parseBody, parsePositiveIntParam, handleServiceError } from "./_utils";
import { cartService } from "../service/cart.service";

/** POST /api/admin/carts */
export const cartListController = {
  async POST(req: Request) {
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    if (!body?.sessionToken) return badRequest("sessionToken is required");
    if (!body?.currencyCode) return badRequest("currencyCode is required");
    let customerId: number | undefined = undefined;
    if (body.customerId != null && body.customerId !== "") {
      const cid = parsePositiveIntParam(String(body.customerId));
      if (cid === null) return badRequest("invalid customerId");
      customerId = cid;
    }
    try {
      return json(
        cartService.create({
          sessionToken: String(body.sessionToken),
          currencyCode: String(body.currencyCode),
          customerId,
        }),
        201,
      );
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

/** GET/PATCH/DELETE /api/admin/carts/:token */
export const cartController = {
  GET(req: Request) {
    const token = req.params.token ?? "";
    if (!token) return badRequest("token is required");
    try {
      return json(cartService.getByToken(token));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  async PATCH(req: Request) {
    const token = req.params.token ?? "";
    if (!token) return badRequest("token is required");
    try {
      const cart = cartService.getByToken(token);
      const body = await parseBody(req) as Record<string, any>;
      if (!body) return badRequest("Invalid JSON body");
      return json(cartService.update(cart.id, body));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const token = req.params.token ?? "";
    if (!token) return badRequest("token is required");
    try {
      const cart = cartService.getByToken(token);
      const row = cartService.abandon(cart.id);
      if (!row) return notFound("Cart not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const cartItemController = {
  GET(req: Request) {
    const cartId = parsePositiveIntParam(req.params.cartId);
    if (cartId === null) return badRequest("invalid id");
    return json(cartService.listItems(cartId));
  },

  async POST(req: Request) {
    const cartId = parsePositiveIntParam(req.params.cartId);
    if (cartId === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    if (!body?.variantId) return badRequest("variantId is required");
    if (body?.quantity === undefined) return badRequest("quantity is required");
    if (body?.unitPriceAmount === undefined) return badRequest("unitPriceAmount is required");
    const variantId = Number(body.variantId);
    const quantity = Number(body.quantity);
    const unitPriceAmount = Number(body.unitPriceAmount);
    if (!Number.isInteger(variantId) || variantId <= 0) return badRequest("variantId must be a positive integer");
    if (!Number.isInteger(quantity) || quantity <= 0) return badRequest("quantity must be a positive integer");
    if (!Number.isInteger(unitPriceAmount) || unitPriceAmount < 0) {
      return badRequest("unitPriceAmount must be a non-negative integer");
    }
    try {
      return json(
        cartService.addItem({
          cartId,
          variantId,
          quantity,
          unitPriceAmount,
        }),
        201,
      );
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const cartItemDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    if (body?.quantity === undefined) return badRequest("quantity is required");
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return badRequest("quantity must be a positive integer");
    }
    try {
      return json(cartService.updateItemQuantity(id, quantity));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      cartService.removeItem(id);
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};
