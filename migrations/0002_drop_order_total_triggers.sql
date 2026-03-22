-- 订单小计/合计改由应用层 recalculateOrderTotals 维护（见 src/service/order-totals.ts）
DROP TRIGGER IF EXISTS trg_order_items_refresh_order_after_insert;
DROP TRIGGER IF EXISTS trg_order_items_refresh_order_after_update;
DROP TRIGGER IF EXISTS trg_order_items_refresh_order_after_delete;
DROP TRIGGER IF EXISTS trg_orders_recalc_total_after_shipping_or_discount_update;
