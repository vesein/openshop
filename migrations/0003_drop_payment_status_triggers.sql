-- 支付状态改由应用层 derivePaymentStatus + syncOrderPaymentStatus（见 src/service/order-payment-status.ts）
DROP TRIGGER IF EXISTS trg_orders_normalize_payment_status_after_insert;
DROP TRIGGER IF EXISTS trg_orders_normalize_payment_status_after_update;
DROP TRIGGER IF EXISTS trg_payments_refresh_order_after_insert;
DROP TRIGGER IF EXISTS trg_payments_refresh_order_after_update;
DROP TRIGGER IF EXISTS trg_payments_refresh_order_after_delete;
