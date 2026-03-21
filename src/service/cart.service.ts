import { cartDao, cartItemDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { carts, cartItems } from "../db/schema";

type CartInsert = InferInsertModel<typeof carts>;
type CartItemInsert = InferInsertModel<typeof cartItems>;

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

  addItem(data: { cartId: number; variantId: number; quantity: number; unitPriceAmount: number }) {
    return cartItemDao.upsert(data);
  },

  updateItemQuantity(id: number, quantity: number) {
    return cartItemDao.updateQuantity(id, quantity);
  },

  removeItem(id: number) {
    return cartItemDao.delete(id);
  },

  clear(cartId: number) {
    return cartItemDao.deleteByCartId(cartId);
  },
};