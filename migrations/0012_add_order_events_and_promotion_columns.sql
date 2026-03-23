-- 1. 订单事件流水表：记录订单生命周期内所有状态变更
CREATE TABLE IF NOT EXISTS order_events (
    id              INTEGER PRIMARY KEY,
    order_id        INTEGER NOT NULL,
    event_type      TEXT NOT NULL
                        CHECK (event_type IN (
                            'order_created', 'order_status_changed',
                            'payment_status_changed', 'fulfillment_status_changed',
                            'item_added', 'item_updated', 'item_removed',
                            'discount_applied', 'discount_removed',
                            'shipment_created', 'shipment_shipped', 'shipment_delivered'
                        )),
    actor           TEXT NOT NULL DEFAULT 'system',
    detail_json     TEXT NOT NULL DEFAULT '{}'
                        CHECK (
                            CASE
                                WHEN json_valid(detail_json) THEN json_type(detail_json) = 'object'
                                ELSE 0
                            END
                        ),
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_created
    ON order_events(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_events_type
    ON order_events(event_type, created_at DESC);

-- 2. 促销表新增结构化规则列，从 rules_json 提取核心字段
ALTER TABLE promotions ADD COLUMN discount_value INTEGER NOT NULL DEFAULT 0 CHECK (discount_value >= 0);
ALTER TABLE promotions ADD COLUMN min_purchase_amount INTEGER NOT NULL DEFAULT 0 CHECK (min_purchase_amount >= 0);
ALTER TABLE promotions ADD COLUMN buy_quantity INTEGER CHECK (buy_quantity IS NULL OR buy_quantity > 0);
ALTER TABLE promotions ADD COLUMN get_quantity INTEGER CHECK (get_quantity IS NULL OR get_quantity > 0);

-- 回填已有数据
UPDATE promotions SET
    discount_value = COALESCE(
        CASE type
            WHEN 'percentage' THEN json_extract(rules_json, '$.discountPercent')
            WHEN 'fixed_amount' THEN json_extract(rules_json, '$.discountAmount')
            ELSE 0
        END, 0),
    min_purchase_amount = COALESCE(
        json_extract(rules_json, '$.minAmount'),
        json_extract(rules_json, '$.minPurchaseAmount'),
        0),
    buy_quantity = json_extract(rules_json, '$.buyQuantity'),
    get_quantity = json_extract(rules_json, '$.getQuantity');
