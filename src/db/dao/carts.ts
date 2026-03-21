import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

// =========================================================
// Carts
// =========================================================

export const cartDao = {
  findById(id: number) {
    const cart = db.select().from(s.carts).where(eq(s.carts.id, id)).get();
    if (!cart) return null;
    const items = db.select().from(s.cartItems)
      .where(eq(s.cartItems.cartId, id))
      .orderBy(asc(s.cartItems.id)).all();
    return { ...cart, items };
  },

  findByToken(sessionToken: string) {
    const cart = db.select().from(s.carts)
      .where(eq(s.carts.sessionToken, sessionToken)).get();
    if (!cart) return null;
    const items = db.select().from(s.cartItems)
      .where(eq(s.cartItems.cartId, cart.id))
      .orderBy(asc(s.cartItems.id)).all();
    return { ...cart, items };
  },

  findByCustomerId(customerId: number) {
    return db.select().from(s.carts)
      .where(and(
        eq(s.carts.customerId, customerId),
        eq(s.carts.status, "active"),
      ))
      .orderBy(desc(s.carts.updatedAt))
      .all();
  },

  create(data: InferInsertModel<typeof s.carts>) {
    const now = formatTimestamp();
    return db.insert(s.carts).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.carts>>) {
    return db.update(s.carts)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.carts.id, id))
      .returning().get();
  },

  abandon(id: number) {
    return this.update(id, { status: "abandoned" });
  },

  delete(id: number) {
    return db.delete(s.carts).where(eq(s.carts.id, id)).run();
  },
};

// =========================================================
// Cart Items
// =========================================================

export const cartItemDao = {
  findByCartId(cartId: number) {
    return db.select().from(s.cartItems)
      .where(eq(s.cartItems.cartId, cartId))
      .orderBy(asc(s.cartItems.id))
      .all();
  },

  upsert(data: { cartId: number; variantId: number; quantity: number; unitPriceAmount: number }) {
    return db.insert(s.cartItems)
      .values(data)
      .onConflictDoUpdate({
        target: [s.cartItems.cartId, s.cartItems.variantId],
        set: {
          quantity: data.quantity,
          unitPriceAmount: data.unitPriceAmount,
          updatedAt: formatTimestamp(),
        },
      })
      .run();
  },

  updateQuantity(id: number, quantity: number) {
    return db.update(s.cartItems)
      .set({ quantity, updatedAt: formatTimestamp() })
      .where(eq(s.cartItems.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.cartItems).where(eq(s.cartItems.id, id)).run();
  },

  deleteByCartId(cartId: number) {
    return db.delete(s.cartItems).where(eq(s.cartItems.cartId, cartId)).run();
  },
};
