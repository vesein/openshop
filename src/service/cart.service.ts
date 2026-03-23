import { cartDao, cartItemDao, variantDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { carts, cartItems } from "../db/schema";

type CartInsert = InferInsertModel<typeof carts>;
type CartItemInsert = InferInsertModel<typeof cartItems>;

function assertCartActive(cartId: number) {
  const cart = cartDao.findById(cartId);
  if (!cart) throw new Error("Cart not found");
  if (cart.status !== "active") {
    throw new Error("cart is not active");
  }
}

export const cartService = {
  getById(id: number) {
    const cart = cartDao.findById(id);
    if (!cart) throw new Error("Cart not found");
    return cart;
  },

  getByToken(sessionToken: string) {
    const cart = cartDao.findByToken(sessionToken);
    if (!cart) throw new Error("Cart not found");
    return cart;
  },

  listByCustomerId(customerId: number) {
    return cartDao.findByCustomerId(customerId);
  },

  create(data: CartInsert) {
    return cartDao.create(data);
  },

  update(id: number, data: Partial<CartInsert>) {
    return cartDao.update(id, data);
  },

  abandon(id: number) {
    return cartDao.abandon(id);
  },

  delete(id: number) {
    return cartDao.delete(id);
  },

  // cart items
  listItems(cartId: number) {
    return cartItemDao.findByCartId(cartId);
  },

  addItem(data: {
    cartId: number;
    variantId: number;
    quantity: number;
    unitPriceAmount: number;
    discountAmount?: number;
  }) {
    assertCartActive(data.cartId);
    if (data.quantity <= 0) throw new Error("quantity must be positive");
    const variant = variantDao.findById(data.variantId);
    if (!variant) throw new Error("Variant not found");
    return cartItemDao.upsert(data);
  },

  updateItemQuantity(id: number, quantity: number) {
    if (quantity <= 0) throw new Error("quantity must be positive");
    const item = cartItemDao.findById(id);
    if (!item) throw new Error("Cart item not found");
    assertCartActive(item.cartId);
    return cartItemDao.updateQuantity(id, quantity);
  },

  removeItem(id: number) {
    const item = cartItemDao.findById(id);
    if (!item) throw new Error("Cart item not found");
    assertCartActive(item.cartId);
    return cartItemDao.delete(id);
  },

  clear(cartId: number) {
    assertCartActive(cartId);
    return cartItemDao.deleteByCartId(cartId);
  },
};