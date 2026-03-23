import { orderEventDao } from "../db/dao";

export type OrderEventType =
  | "order_created"
  | "order_status_changed"
  | "payment_status_changed"
  | "fulfillment_status_changed"
  | "item_added"
  | "item_updated"
  | "item_removed"
  | "discount_applied"
  | "discount_removed"
  | "shipment_created"
  | "shipment_shipped"
  | "shipment_delivered";

/**
 * 记录一条订单事件。可在事务内调用。
 */
export function recordOrderEvent(
  orderId: number,
  eventType: OrderEventType,
  detail: Record<string, unknown> = {},
  actor = "system",
) {
  orderEventDao.create({
    orderId,
    eventType,
    actor,
    detailJson: JSON.stringify(detail),
  });
}

/** 查询某订单的事件流水 */
export function listOrderEvents(orderId: number) {
  return orderEventDao.findByOrderId(orderId);
}
