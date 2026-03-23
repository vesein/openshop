import { eq } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";
import { formatTimestamp } from "../db/dao/utils";
import { recordOrderEvent } from "./order-events";

/** 与已移除的发货相关 SQLite 触发器中对 orders.fulfillment_status 的推导一致 */
export function deriveFulfillmentStatus(
  shipmentRows: { status: string }[],
): "unfulfilled" | "fulfilled" | "returned" {
  if (shipmentRows.some((r) => r.status === "returned")) return "returned";
  if (shipmentRows.some((r) => r.status === "shipped" || r.status === "delivered")) {
    return "fulfilled";
  }
  return "unfulfilled";
}

export function syncOrderFulfillmentStatus(orderId: number) {
  const rows = db
    .select({ status: s.shipments.status })
    .from(s.shipments)
    .where(eq(s.shipments.orderId, orderId))
    .all();

  const next = deriveFulfillmentStatus(rows);

  const order = db
    .select({ fulfillmentStatus: s.orders.fulfillmentStatus })
    .from(s.orders)
    .where(eq(s.orders.id, orderId))
    .get();
  if (!order) return;
  if (order.fulfillmentStatus === next) return;

  db.update(s.orders)
    .set({ fulfillmentStatus: next, updatedAt: formatTimestamp() })
    .where(eq(s.orders.id, orderId))
    .run();

  recordOrderEvent(orderId, "fulfillment_status_changed", {
    from: order.fulfillmentStatus,
    to: next,
  });
}
