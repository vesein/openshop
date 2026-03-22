-- 订单行项目/金额/状态、优惠码校验与 usage 自增改由应用层（见 src/service/order-rules.ts、order.service）
DROP TRIGGER IF EXISTS trg_order_items_block_after_payment_before_insert;
DROP TRIGGER IF EXISTS trg_order_items_block_after_payment_before_update;
DROP TRIGGER IF EXISTS trg_order_items_block_after_payment_before_delete;
DROP TRIGGER IF EXISTS trg_orders_block_amount_changes_after_payment;
DROP TRIGGER IF EXISTS trg_orders_validate_status_transition_before_update;
DROP TRIGGER IF EXISTS trg_order_discount_codes_validate_before_insert;
DROP TRIGGER IF EXISTS trg_order_discount_codes_increment_usage_after_insert;
