import type { InferInsertModel } from "drizzle-orm";
import { db } from "../db/index";
import { shipmentDao } from "../db/dao";
import { shipments } from "../db/schema";
import { syncOrderFulfillmentStatus } from "./order-fulfillment";

type ShipmentInsert = InferInsertModel<typeof shipments>;

function assertShipmentStatusTransition(oldStatus: string, newStatus: string) {
  if (oldStatus === newStatus) return;
  const ok =
    (oldStatus === "pending" &&
      ["shipped", "delivered", "returned"].includes(newStatus)) ||
    (oldStatus === "shipped" && ["delivered", "returned"].includes(newStatus)) ||
    (oldStatus === "delivered" && newStatus === "returned");
  if (!ok) throw new Error("invalid shipment status transition");
}

/** 发货写入经此层，保证与 orders.fulfillment_status 一致（与 SQLite 校验规则一致） */
export const shipmentService = {
  findByOrderId(orderId: number) {
    return shipmentDao.findByOrderId(orderId);
  },

  create(data: ShipmentInsert) {
    return db.transaction(() => {
      const row = shipmentDao.create(data);
      syncOrderFulfillmentStatus(data.orderId);
      return row;
    });
  },

  update(id: number, data: Partial<ShipmentInsert>) {
    return db.transaction(() => {
      const prev = shipmentDao.findById(id);
      if (!prev) throw new Error("Shipment not found");
      if (data.orderId != null && data.orderId !== prev.orderId) {
        throw new Error("shipment order_id is immutable after insert");
      }
      if (data.status != null && data.status !== prev.status) {
        assertShipmentStatusTransition(prev.status, data.status);
      }
      const row = shipmentDao.update(id, data);
      if (!row) throw new Error("Shipment not found");
      syncOrderFulfillmentStatus(row.orderId);
      return row;
    });
  },

  markShipped(
    id: number,
    tracking: { carrier: string; service: string; trackingNumber: string; trackingUrl?: string },
  ) {
    return db.transaction(() => {
      const prev = shipmentDao.findById(id);
      if (!prev) throw new Error("Shipment not found");
      assertShipmentStatusTransition(prev.status, "shipped");
      const row = shipmentDao.markShipped(id, tracking);
      if (!row) throw new Error("Shipment not found");
      syncOrderFulfillmentStatus(row.orderId);
      return row;
    });
  },

  markDelivered(id: number) {
    return db.transaction(() => {
      const prev = shipmentDao.findById(id);
      if (!prev) throw new Error("Shipment not found");
      assertShipmentStatusTransition(prev.status, "delivered");
      const row = shipmentDao.markDelivered(id);
      if (!row) throw new Error("Shipment not found");
      syncOrderFulfillmentStatus(row.orderId);
      return row;
    });
  },
};
