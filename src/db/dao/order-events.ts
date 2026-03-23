import { eq, desc } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

export const orderEventDao = {
  findByOrderId(orderId: number) {
    return db
      .select()
      .from(s.orderEvents)
      .where(eq(s.orderEvents.orderId, orderId))
      .orderBy(desc(s.orderEvents.createdAt))
      .all();
  },

  create(data: InferInsertModel<typeof s.orderEvents>) {
    return db
      .insert(s.orderEvents)
      .values({
        ...data,
        createdAt: formatTimestamp(),
      })
      .returning()
      .get();
  },
};
