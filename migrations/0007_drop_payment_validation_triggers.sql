-- 支付插入/更新校验与禁止删除改由应用层（见 src/service/payment-rules.ts、payment.service）
DROP TRIGGER IF EXISTS trg_payments_validate_before_insert;
DROP TRIGGER IF EXISTS trg_payments_validate_before_update;
DROP TRIGGER IF EXISTS trg_payments_validate_immutable_fields_before_update;
DROP TRIGGER IF EXISTS trg_payments_validate_status_transition_before_update;
DROP TRIGGER IF EXISTS trg_payments_block_delete;
