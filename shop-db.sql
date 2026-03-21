-- NOTE: these PRAGMAs are per-connection, NOT persisted in the database file.
-- Every application connection MUST re-execute them on open.
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- =========================================================
-- shop_settings
-- 单店只保留一行，id 固定为 1
-- =========================================================
CREATE TABLE IF NOT EXISTS shop_settings (
    id                  INTEGER PRIMARY KEY CHECK (id = 1),
    shop_name           TEXT NOT NULL,
    shop_description    TEXT NOT NULL DEFAULT '',
    currency_code       TEXT NOT NULL DEFAULT 'USD',
    locale              TEXT NOT NULL DEFAULT 'en',
    timezone            TEXT NOT NULL DEFAULT 'UTC',
    support_email       TEXT NOT NULL DEFAULT '',
    order_prefix        TEXT NOT NULL DEFAULT 'ORD',
    weight_unit         TEXT NOT NULL DEFAULT 'kg'
                            CHECK (weight_unit IN ('g', 'kg', 'oz', 'lb')),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO shop_settings (
    id, shop_name, shop_description, currency_code, locale, timezone, support_email, order_prefix, weight_unit
) VALUES (
    1, 'My Shop', '', 'USD', 'en', 'UTC', '', 'ORD', 'kg'
);

-- =========================================================
-- media_assets
-- =========================================================
CREATE TABLE IF NOT EXISTS media_assets (
    id                  INTEGER PRIMARY KEY,
    kind                TEXT NOT NULL
                            CHECK (kind IN ('image', 'video', 'file')),
    storage_key         TEXT NOT NULL UNIQUE,
    mime_type           TEXT NOT NULL,
    width               INTEGER,
    height              INTEGER,
    size_bytes          INTEGER NOT NULL DEFAULT 0,
    alt                 TEXT NOT NULL DEFAULT '',
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- products
-- =========================================================
CREATE TABLE IF NOT EXISTS products (
    id                  INTEGER PRIMARY KEY,
    title               TEXT NOT NULL,
    slug                TEXT NOT NULL COLLATE NOCASE UNIQUE,
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'active', 'archived')),
    product_type        TEXT NOT NULL DEFAULT '',
    vendor              TEXT NOT NULL DEFAULT '',
    description_html    TEXT NOT NULL DEFAULT '',
    seo_title           TEXT NOT NULL DEFAULT '',
    seo_description     TEXT NOT NULL DEFAULT '',
    featured_media_id   INTEGER,
    published_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TEXT,
    FOREIGN KEY (featured_media_id) REFERENCES media_assets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
    id                  INTEGER PRIMARY KEY,
    product_id          INTEGER NOT NULL,
    title               TEXT NOT NULL DEFAULT 'Default Title',
    sku                 TEXT NOT NULL UNIQUE,
    barcode             TEXT NOT NULL DEFAULT '',
    price_amount        INTEGER NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
    compare_at_amount   INTEGER CHECK (compare_at_amount IS NULL OR compare_at_amount >= 0),
    cost_amount         INTEGER CHECK (cost_amount IS NULL OR cost_amount >= 0),
    weight_value        INTEGER CHECK (weight_value IS NULL OR weight_value >= 0),
    requires_shipping   INTEGER NOT NULL DEFAULT 1 CHECK (requires_shipping IN (0, 1)),
    taxable             INTEGER NOT NULL DEFAULT 1 CHECK (taxable IN (0, 1)),
    is_default          INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    sort_order          INTEGER NOT NULL DEFAULT 0,
    option_signature    TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_options (
    id                  INTEGER PRIMARY KEY,
    product_id          INTEGER NOT NULL,
    name                TEXT NOT NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, name),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_option_values (
    id                  INTEGER PRIMARY KEY,
    option_id           INTEGER NOT NULL,
    value               TEXT NOT NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (option_id, value),
    FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS variant_option_values (
    variant_id          INTEGER NOT NULL,
    option_value_id     INTEGER NOT NULL,
    PRIMARY KEY (variant_id, option_value_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (option_value_id) REFERENCES product_option_values(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_media (
    id                  INTEGER PRIMARY KEY,
    product_id          INTEGER NOT NULL,
    variant_id          INTEGER,
    media_id            INTEGER NOT NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, media_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE CASCADE
);

-- =========================================================
-- collections
-- =========================================================
CREATE TABLE IF NOT EXISTS collections (
    id                  INTEGER PRIMARY KEY,
    title               TEXT NOT NULL,
    slug                TEXT NOT NULL COLLATE NOCASE UNIQUE,
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'active', 'archived')),
    description_html    TEXT NOT NULL DEFAULT '',
    seo_title           TEXT NOT NULL DEFAULT '',
    seo_description     TEXT NOT NULL DEFAULT '',
    published_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_products (
    collection_id       INTEGER NOT NULL,
    product_id          INTEGER NOT NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, product_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =========================================================
-- promotions
-- 统一管理优惠码 / BOGO / 满减 / 包邮
-- rules_json 由应用层按 type 解读
-- =========================================================
CREATE TABLE IF NOT EXISTS promotions (
    id                  INTEGER PRIMARY KEY,
    name                TEXT NOT NULL,
    type                TEXT NOT NULL
                            CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping', 'bogo')),
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'active', 'archived')),
    starts_at           TEXT,
    ends_at             TEXT,
    usage_limit         INTEGER,
    usage_count         INTEGER NOT NULL DEFAULT 0,
    once_per_customer   INTEGER NOT NULL DEFAULT 0
                            CHECK (once_per_customer IN (0, 1)),
    rules_json          TEXT NOT NULL DEFAULT '{}'
                            CHECK (
                                CASE
                                    WHEN json_valid(rules_json) THEN json_type(rules_json) = 'object'
                                    ELSE 0
                                END
                            ),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discount_codes (
    id                  INTEGER PRIMARY KEY,
    code                TEXT NOT NULL COLLATE NOCASE UNIQUE,
    promotion_id        INTEGER NOT NULL,
    usage_limit         INTEGER,
    usage_count         INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_discount_codes (
    order_id            INTEGER NOT NULL,
    discount_code_id    INTEGER NOT NULL,
    promotion_id        INTEGER NOT NULL,
    PRIMARY KEY (order_id, discount_code_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE RESTRICT,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE RESTRICT
);

-- =========================================================
-- inventory
-- 单店、单库存池，不做 location
-- inventory_levels 由 inventory_movements 触发器维护
-- =========================================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id                  INTEGER PRIMARY KEY,
    variant_id          INTEGER NOT NULL UNIQUE,
    tracked             INTEGER NOT NULL DEFAULT 1 CHECK (tracked IN (0, 1)),
    allow_backorder     INTEGER NOT NULL DEFAULT 0 CHECK (allow_backorder IN (0, 1)),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_levels (
    inventory_item_id   INTEGER PRIMARY KEY,
    on_hand             INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reserved            INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id                  INTEGER PRIMARY KEY,
    inventory_item_id   INTEGER NOT NULL,
    movement_type       TEXT NOT NULL
                            CHECK (movement_type IN ('in', 'reserve', 'release', 'sold', 'returned', 'adjust')),
    quantity_delta      INTEGER NOT NULL,
    reference_type      TEXT
                            CHECK (reference_type IS NULL OR reference_type IN ('order', 'manual', 'refund', 'cart_expiry')),
    reference_id        INTEGER,
    note                TEXT NOT NULL DEFAULT '',
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (quantity_delta <> 0),
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- =========================================================
-- customers
-- =========================================================
CREATE TABLE IF NOT EXISTS customers (
    id                  INTEGER PRIMARY KEY,
    email               TEXT NOT NULL COLLATE NOCASE,
    phone               TEXT NOT NULL DEFAULT '',
    first_name          TEXT NOT NULL DEFAULT '',
    last_name           TEXT NOT NULL DEFAULT '',
    accepts_marketing   INTEGER NOT NULL DEFAULT 0 CHECK (accepts_marketing IN (0, 1)),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id                  INTEGER PRIMARY KEY,
    customer_id         INTEGER NOT NULL,
    first_name          TEXT NOT NULL DEFAULT '',
    last_name           TEXT NOT NULL DEFAULT '',
    company             TEXT NOT NULL DEFAULT '',
    phone               TEXT NOT NULL DEFAULT '',
    country_code        TEXT NOT NULL DEFAULT '',
    province            TEXT NOT NULL DEFAULT '',
    city                TEXT NOT NULL DEFAULT '',
    address1            TEXT NOT NULL DEFAULT '',
    address2            TEXT NOT NULL DEFAULT '',
    postal_code         TEXT NOT NULL DEFAULT '',
    is_default_shipping INTEGER NOT NULL DEFAULT 0 CHECK (is_default_shipping IN (0, 1)),
    is_default_billing  INTEGER NOT NULL DEFAULT 0 CHECK (is_default_billing IN (0, 1)),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- =========================================================
-- carts
-- =========================================================
CREATE TABLE IF NOT EXISTS carts (
    id                  INTEGER PRIMARY KEY,
    customer_id         INTEGER,
    session_token       TEXT NOT NULL UNIQUE,
    currency_code       TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'converted', 'abandoned')),
    expires_at          TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
    id                  INTEGER PRIMARY KEY,
    cart_id             INTEGER NOT NULL,
    variant_id          INTEGER NOT NULL,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_amount   INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_amount >= 0),
    discount_amount     INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, variant_id),
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
);

-- =========================================================
-- orders
-- =========================================================
CREATE TABLE IF NOT EXISTS orders (
    id                  INTEGER PRIMARY KEY,
    order_number        TEXT NOT NULL UNIQUE,
    customer_id         INTEGER,
    email               TEXT NOT NULL DEFAULT '',
    phone               TEXT NOT NULL DEFAULT '',
    currency_code       TEXT NOT NULL,
    subtotal_amount     INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
    discount_amount     INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    order_discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (order_discount_amount >= 0),
    shipping_amount     INTEGER NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    shipping_discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (shipping_discount_amount >= 0),
    tax_amount          INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount        INTEGER NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_status      TEXT NOT NULL DEFAULT 'pending'
                            CHECK (payment_status IN ('pending', 'authorized', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'failed')),
    fulfillment_status  TEXT NOT NULL DEFAULT 'unfulfilled'
                            CHECK (fulfillment_status IN ('unfulfilled', 'fulfilled', 'returned')),
    order_status        TEXT NOT NULL DEFAULT 'open'
                            CHECK (order_status IN ('open', 'completed', 'cancelled')),
    billing_address_json TEXT NOT NULL DEFAULT '{}',
    shipping_address_json TEXT NOT NULL DEFAULT '{}',
    placed_at           TEXT,
    cancelled_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        CASE
            WHEN json_valid(billing_address_json) THEN json_type(billing_address_json) = 'object'
            ELSE 0
        END
    ),
    CHECK (
        CASE
            WHEN json_valid(shipping_address_json) THEN json_type(shipping_address_json) = 'object'
            ELSE 0
        END
    ),
    CHECK (customer_id IS NOT NULL OR email != ''),
    CHECK (shipping_discount_amount <= shipping_amount),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id                  INTEGER PRIMARY KEY,
    order_id            INTEGER NOT NULL,
    product_id          INTEGER,
    variant_id          INTEGER,
    sku                 TEXT NOT NULL DEFAULT '',
    product_title       TEXT NOT NULL,
    variant_title       TEXT NOT NULL DEFAULT '',
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_amount   INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_amount >= 0),
    compare_at_amount   INTEGER CHECK (compare_at_amount IS NULL OR compare_at_amount >= 0),
    discount_amount     INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount          INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    snapshot_json       TEXT NOT NULL DEFAULT '{}'
                            CHECK (
                                CASE
                                    WHEN json_valid(snapshot_json) THEN json_type(snapshot_json) = 'object'
                                    ELSE 0
                                END
                            ),
    promotion_id        INTEGER,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (quantity * unit_price_amount >= discount_amount),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payments (
    id                  INTEGER PRIMARY KEY,
    order_id            INTEGER NOT NULL,
    provider            TEXT NOT NULL,
    provider_payment_id TEXT,
    amount              INTEGER NOT NULL CHECK (amount > 0),
    currency_code       TEXT NOT NULL,
    status              TEXT NOT NULL
                            CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    payload_json        TEXT NOT NULL DEFAULT '{}'
                            CHECK (
                                CASE
                                    WHEN json_valid(payload_json) THEN json_type(payload_json) = 'object'
                                    ELSE 0
                                END
                            ),
    processed_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipments (
    id                  INTEGER PRIMARY KEY,
    order_id            INTEGER NOT NULL UNIQUE,
    carrier             TEXT NOT NULL DEFAULT '',
    service             TEXT NOT NULL DEFAULT '',
    tracking_number     TEXT NOT NULL DEFAULT '',
    tracking_url        TEXT NOT NULL DEFAULT '',
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'shipped', 'delivered', 'returned')),
    shipped_at          TEXT,
    delivered_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- =========================================================
-- pages
-- =========================================================
CREATE TABLE IF NOT EXISTS pages (
    id                  INTEGER PRIMARY KEY,
    title               TEXT NOT NULL,
    slug                TEXT NOT NULL COLLATE NOCASE UNIQUE,
    status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'active', 'archived')),
    seo_title           TEXT NOT NULL DEFAULT '',
    seo_description     TEXT NOT NULL DEFAULT '',
    content_json        TEXT NOT NULL DEFAULT '{}'
                            CHECK (
                                CASE
                                    WHEN json_valid(content_json) THEN json_type(content_json) = 'object'
                                    ELSE 0
                                END
                            ),
    published_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- menus
-- =========================================================
CREATE TABLE IF NOT EXISTS menus (
    id                  INTEGER PRIMARY KEY,
    name                TEXT NOT NULL,
    handle              TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
    id                  INTEGER PRIMARY KEY,
    menu_id             INTEGER NOT NULL,
    parent_id           INTEGER,
    title               TEXT NOT NULL,
    link_type           TEXT NOT NULL
                            CHECK (link_type IN ('page', 'collection', 'product', 'external', 'home')),
    link_target         TEXT NOT NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id, parent_id) REFERENCES menu_items(menu_id, id) ON DELETE CASCADE
);

-- =========================================================
-- metafield_definitions
-- Shopify 风格：先定义，再赋值
-- resource_type 覆盖单店常见资源
-- =========================================================
CREATE TABLE IF NOT EXISTS metafield_definitions (
    id                  INTEGER PRIMARY KEY,
    resource_type       TEXT NOT NULL
                            CHECK (resource_type IN ('shop', 'product', 'variant', 'collection', 'customer', 'order', 'page', 'promotion')),
    namespace           TEXT NOT NULL,
    key                 TEXT NOT NULL,
    name                TEXT NOT NULL,
    description         TEXT NOT NULL DEFAULT '',
    value_type          TEXT NOT NULL
                            CHECK (value_type IN ('text', 'integer', 'number', 'boolean', 'json')),
    validations_json    TEXT NOT NULL DEFAULT '{}'
                            CHECK (
                                CASE
                                    WHEN json_valid(validations_json) THEN json_type(validations_json) = 'object'
                                    ELSE 0
                                END
                            ),
    default_value_json  TEXT NOT NULL DEFAULT 'null'
                            CHECK (json_valid(default_value_json)),
    visible_in_admin    INTEGER NOT NULL DEFAULT 1 CHECK (visible_in_admin IN (0, 1)),
    visible_in_storefront INTEGER NOT NULL DEFAULT 0 CHECK (visible_in_storefront IN (0, 1)),
    pinned_position     INTEGER,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        value_type = 'json'
        OR json_type(default_value_json) = 'null'
        OR (value_type = 'text' AND json_type(default_value_json) = 'text')
        OR (value_type = 'integer' AND json_type(default_value_json) = 'integer')
        OR (value_type = 'number' AND json_type(default_value_json) IN ('integer', 'real'))
        OR (value_type = 'boolean' AND json_type(default_value_json) IN ('true', 'false'))
    ),
    UNIQUE (resource_type, namespace, key)
);

-- =========================================================
-- metafield_values
-- SQLite 里保留多值列，便于有限查询
-- 应用层保证“按 definition 的 value_type 只写一个 value_*”
-- resource_id:
--   shop 固定写 1
--   其他资源写对应表主键
-- =========================================================
CREATE TABLE IF NOT EXISTS metafield_values (
    id                  INTEGER PRIMARY KEY,
    definition_id       INTEGER NOT NULL,
    resource_type       TEXT NOT NULL
                            CHECK (resource_type IN ('shop', 'product', 'variant', 'collection', 'customer', 'order', 'page', 'promotion')),
    resource_id         INTEGER NOT NULL,
    value_text          TEXT,
    value_integer       INTEGER,
    value_number        REAL,
    value_boolean       INTEGER CHECK (value_boolean IS NULL OR value_boolean IN (0, 1)),
    value_json          TEXT CHECK (value_json IS NULL OR json_valid(value_json)),
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (value_text IS NOT NULL) +
        (value_integer IS NOT NULL) +
        (value_number IS NOT NULL) +
        (value_boolean IS NOT NULL) +
        (value_json IS NOT NULL) = 1
    ),
    UNIQUE (definition_id, resource_id),
    FOREIGN KEY (definition_id, resource_type) REFERENCES metafield_definitions(id, resource_type) ON DELETE CASCADE
);

-- =========================================================
-- indexes
-- =========================================================

-- products / storefront
CREATE INDEX IF NOT EXISTS idx_products_status_published
    ON products(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_product_type
    ON products(product_type);

CREATE INDEX IF NOT EXISTS idx_products_vendor
    ON products(vendor);

CREATE INDEX IF NOT EXISTS idx_product_variants_product
    ON product_variants(product_id, sort_order, id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_default
    ON product_variants(product_id)
    WHERE is_default = 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_option_signature
    ON product_variants(product_id, option_signature)
    WHERE option_signature IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_barcode
    ON product_variants(barcode)
    WHERE barcode != '';

CREATE INDEX IF NOT EXISTS idx_product_options_product
    ON product_options(product_id, sort_order, id);

CREATE INDEX IF NOT EXISTS idx_product_option_values_option
    ON product_option_values(option_id, sort_order, id);

CREATE INDEX IF NOT EXISTS idx_variant_option_values_option_value
    ON variant_option_values(option_value_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_product_media_product
    ON product_media(product_id, sort_order, id);

CREATE INDEX IF NOT EXISTS idx_product_media_variant
    ON product_media(variant_id, sort_order, id);

-- collections
CREATE INDEX IF NOT EXISTS idx_collections_status_published
    ON collections(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_products_collection
    ON collection_products(collection_id, sort_order, product_id);

CREATE INDEX IF NOT EXISTS idx_collection_products_product
    ON collection_products(product_id, collection_id);

-- inventory
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_created
    ON inventory_movements(inventory_item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference
    ON inventory_movements(reference_type, reference_id);

-- customers
CREATE INDEX IF NOT EXISTS idx_customers_created
    ON customers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer
    ON customer_addresses(customer_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_addresses_default_shipping
    ON customer_addresses(customer_id)
    WHERE is_default_shipping = 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_addresses_default_billing
    ON customer_addresses(customer_id)
    WHERE is_default_billing = 1;

-- carts
CREATE INDEX IF NOT EXISTS idx_carts_customer
    ON carts(customer_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_carts_status_expires
    ON carts(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart
    ON cart_items(cart_id, id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_created
    ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created
    ON orders(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
    ON orders(order_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_fulfillment
    ON orders(payment_status, fulfillment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order
    ON order_items(order_id, id);

-- promotions / discount codes
CREATE INDEX IF NOT EXISTS idx_promotions_status_dates
    ON promotions(status, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_discount_codes_promotion
    ON discount_codes(promotion_id);

CREATE INDEX IF NOT EXISTS idx_order_items_promotion
    ON order_items(promotion_id)
    WHERE promotion_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_discount_codes_order
    ON order_discount_codes(order_id);

CREATE INDEX IF NOT EXISTS idx_order_discount_codes_promotion
    ON order_discount_codes(promotion_id);

CREATE INDEX IF NOT EXISTS idx_payments_order
    ON payments(order_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_payment
    ON payments(provider, provider_payment_id)
    WHERE provider_payment_id IS NOT NULL;


-- pages / menus
CREATE INDEX IF NOT EXISTS idx_pages_status_published
    ON pages(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_menu_items_menu_parent_sort
    ON menu_items(menu_id, parent_id, sort_order, id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_items_menu_id
    ON menu_items(menu_id, id);

-- metafields

CREATE UNIQUE INDEX IF NOT EXISTS uq_metafield_definitions_id_resource
    ON metafield_definitions(id, resource_type);

CREATE INDEX IF NOT EXISTS idx_metafield_values_resource
    ON metafield_values(resource_type, resource_id);


-- =========================================================
-- triggers
-- =========================================================

CREATE TRIGGER IF NOT EXISTS trg_product_variants_refresh_signature_after_insert
AFTER INSERT ON product_variants
FOR EACH ROW
BEGIN
    UPDATE product_variants
    SET option_signature = CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_options
            WHERE product_id = NEW.product_id
        ) THEN '__default__'
        WHEN (
            SELECT COUNT(*)
            FROM variant_option_values vov
            JOIN product_option_values pov ON pov.id = vov.option_value_id
            JOIN product_options po ON po.id = pov.option_id
            WHERE vov.variant_id = NEW.id
              AND po.product_id = NEW.product_id
        ) = (
            SELECT COUNT(*)
            FROM product_options
            WHERE product_id = NEW.product_id
        ) THEN (
            SELECT group_concat(option_value_id, ',')
            FROM (
                SELECT vov.option_value_id
                FROM variant_option_values vov
                JOIN product_option_values pov ON pov.id = vov.option_value_id
                JOIN product_options po ON po.id = pov.option_id
                WHERE vov.variant_id = NEW.id
                  AND po.product_id = NEW.product_id
                ORDER BY po.id, pov.id
            )
        )
        ELSE NULL
    END
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_products_archive_on_soft_delete
BEFORE UPDATE OF deleted_at ON products
FOR EACH ROW
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND NEW.status = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft or archived before soft-deleting');
END;

CREATE TRIGGER IF NOT EXISTS trg_products_validate_before_activate
BEFORE UPDATE OF status ON products
FOR EACH ROW
WHEN NEW.status = 'active'
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_variants
            WHERE product_id = NEW.id
        )
        THEN RAISE(ABORT, 'active product must have at least one variant')
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_variants
            WHERE product_id = NEW.id
              AND is_default = 1
        )
        THEN RAISE(ABORT, 'active product must have a default variant')
        WHEN EXISTS (
            SELECT 1
            FROM product_options
            WHERE product_id = NEW.id
        )
         AND EXISTS (
            SELECT 1
            FROM product_variants pv
            WHERE pv.product_id = NEW.id
              AND (
                    SELECT COUNT(DISTINCT po.id)
                    FROM variant_option_values vov
                    JOIN product_option_values pov ON pov.id = vov.option_value_id
                    JOIN product_options po ON po.id = pov.option_id
                    WHERE vov.variant_id = pv.id
                      AND po.product_id = NEW.id
              ) != (
                    SELECT COUNT(*)
                    FROM product_options
                    WHERE product_id = NEW.id
              )
        )
        THEN RAISE(ABORT, 'active product variants must cover every option')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_product_options_block_active_before_insert
BEFORE INSERT ON product_options
FOR EACH ROW
WHEN (
    SELECT status
    FROM products
    WHERE id = NEW.product_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing options');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_options_block_active_before_update
BEFORE UPDATE ON product_options
FOR EACH ROW
WHEN (
    SELECT status
    FROM products
    WHERE id = OLD.product_id
) = 'active'
 OR (
    SELECT status
    FROM products
    WHERE id = NEW.product_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing options');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_options_block_active_before_delete
BEFORE DELETE ON product_options
FOR EACH ROW
WHEN (
    SELECT status
    FROM products
    WHERE id = OLD.product_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing options');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_option_values_block_active_before_insert
BEFORE INSERT ON product_option_values
FOR EACH ROW
WHEN (
    SELECT p.status
    FROM product_options po
    JOIN products p ON p.id = po.product_id
    WHERE po.id = NEW.option_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing options');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_option_values_block_active_before_update
BEFORE UPDATE ON product_option_values
FOR EACH ROW
WHEN (
    SELECT p.status
    FROM product_option_values pov
    JOIN product_options po ON po.id = pov.option_id
    JOIN products p ON p.id = po.product_id
    WHERE pov.id = OLD.id
) = 'active'
 OR (
    SELECT p.status
    FROM product_options po
    JOIN products p ON p.id = po.product_id
    WHERE po.id = NEW.option_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing options');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_option_values_block_active_before_delete
BEFORE DELETE ON product_option_values
FOR EACH ROW
WHEN (
    SELECT p.status
    FROM product_options po
    JOIN products p ON p.id = po.product_id
    WHERE po.id = OLD.option_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing options');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_variants_block_active_before_insert
BEFORE INSERT ON product_variants
FOR EACH ROW
WHEN (
    SELECT status
    FROM products
    WHERE id = NEW.product_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing variants');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_variants_block_active_default_update
BEFORE UPDATE OF is_default ON product_variants
FOR EACH ROW
WHEN NEW.is_default != OLD.is_default
 AND (
    SELECT status
    FROM products
    WHERE id = OLD.product_id
 ) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing default variant');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_variants_validate_product_id_before_update
BEFORE UPDATE OF product_id ON product_variants
FOR EACH ROW
WHEN NEW.product_id != OLD.product_id
BEGIN
    SELECT RAISE(ABORT, 'variant product_id is immutable; recreate the variant under the target product');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_variants_validate_option_signature_before_update
BEFORE UPDATE OF option_signature ON product_variants
FOR EACH ROW
WHEN COALESCE(NEW.option_signature, '__null__') != COALESCE((
    CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_options
            WHERE product_id = NEW.product_id
        ) THEN '__default__'
        WHEN (
            SELECT COUNT(*)
            FROM variant_option_values vov
            JOIN product_option_values pov ON pov.id = vov.option_value_id
            JOIN product_options po ON po.id = pov.option_id
            WHERE vov.variant_id = NEW.id
              AND po.product_id = NEW.product_id
        ) = (
            SELECT COUNT(*)
            FROM product_options
            WHERE product_id = NEW.product_id
        ) THEN (
            SELECT group_concat(option_value_id, ',')
            FROM (
                SELECT vov.option_value_id
                FROM variant_option_values vov
                JOIN product_option_values pov ON pov.id = vov.option_value_id
                JOIN product_options po ON po.id = pov.option_id
                WHERE vov.variant_id = NEW.id
                  AND po.product_id = NEW.product_id
                ORDER BY po.id, pov.id
            )
        )
        ELSE NULL
    END
), '__null__')
BEGIN
    SELECT RAISE(ABORT, 'option_signature is derived from variant_option_values');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_variants_block_active_before_delete
BEFORE DELETE ON product_variants
FOR EACH ROW
WHEN (
    SELECT status
    FROM products
    WHERE id = OLD.product_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing variants');
END;

CREATE TRIGGER IF NOT EXISTS trg_product_options_refresh_signatures_after_insert
AFTER INSERT ON product_options
FOR EACH ROW
BEGIN
    UPDATE product_variants
    SET option_signature = CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN '__default__'
        WHEN (
            SELECT COUNT(*)
            FROM variant_option_values vov
            JOIN product_option_values pov ON pov.id = vov.option_value_id
            JOIN product_options po ON po.id = pov.option_id
            WHERE vov.variant_id = product_variants.id
              AND po.product_id = product_variants.product_id
        ) = (
            SELECT COUNT(*)
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN (
            SELECT group_concat(option_value_id, ',')
            FROM (
                SELECT vov.option_value_id
                FROM variant_option_values vov
                JOIN product_option_values pov ON pov.id = vov.option_value_id
                JOIN product_options po ON po.id = pov.option_id
                WHERE vov.variant_id = product_variants.id
                  AND po.product_id = product_variants.product_id
                ORDER BY po.id, pov.id
            )
        )
        ELSE NULL
    END
    WHERE product_id = NEW.product_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_product_options_refresh_signatures_after_delete
AFTER DELETE ON product_options
FOR EACH ROW
BEGIN
    UPDATE product_variants
    SET option_signature = CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN '__default__'
        WHEN (
            SELECT COUNT(*)
            FROM variant_option_values vov
            JOIN product_option_values pov ON pov.id = vov.option_value_id
            JOIN product_options po ON po.id = pov.option_id
            WHERE vov.variant_id = product_variants.id
              AND po.product_id = product_variants.product_id
        ) = (
            SELECT COUNT(*)
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN (
            SELECT group_concat(option_value_id, ',')
            FROM (
                SELECT vov.option_value_id
                FROM variant_option_values vov
                JOIN product_option_values pov ON pov.id = vov.option_value_id
                JOIN product_options po ON po.id = pov.option_id
                WHERE vov.variant_id = product_variants.id
                  AND po.product_id = product_variants.product_id
                ORDER BY po.id, pov.id
            )
        )
        ELSE NULL
    END
    WHERE product_id = OLD.product_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_variant_option_values_validate_before_insert
BEFORE INSERT ON variant_option_values
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (
            SELECT pv.product_id
            FROM product_variants pv
            WHERE pv.id = NEW.variant_id
        ) != (
            SELECT po.product_id
            FROM product_option_values pov
            JOIN product_options po ON po.id = pov.option_id
            WHERE pov.id = NEW.option_value_id
        ) THEN RAISE(ABORT, 'variant option value must belong to the same product')
    END;

    SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM variant_option_values vov
            JOIN product_option_values existing_pov ON existing_pov.id = vov.option_value_id
            JOIN product_option_values new_pov ON new_pov.id = NEW.option_value_id
            WHERE vov.variant_id = NEW.variant_id
              AND existing_pov.option_id = new_pov.option_id
        ) THEN RAISE(ABORT, 'variant already has a value for this option')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_variant_option_values_block_active_before_insert
BEFORE INSERT ON variant_option_values
FOR EACH ROW
WHEN (
    SELECT p.status
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = NEW.variant_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing variant options');
END;

CREATE TRIGGER IF NOT EXISTS trg_variant_option_values_validate_before_update
BEFORE UPDATE OF variant_id, option_value_id ON variant_option_values
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (
            SELECT pv.product_id
            FROM product_variants pv
            WHERE pv.id = NEW.variant_id
        ) != (
            SELECT po.product_id
            FROM product_option_values pov
            JOIN product_options po ON po.id = pov.option_id
            WHERE pov.id = NEW.option_value_id
        ) THEN RAISE(ABORT, 'variant option value must belong to the same product')
    END;

    SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM variant_option_values vov
            JOIN product_option_values existing_pov ON existing_pov.id = vov.option_value_id
            JOIN product_option_values new_pov ON new_pov.id = NEW.option_value_id
            WHERE vov.variant_id = NEW.variant_id
              AND existing_pov.option_id = new_pov.option_id
              AND NOT (
                  vov.variant_id = OLD.variant_id
                  AND vov.option_value_id = OLD.option_value_id
              )
        ) THEN RAISE(ABORT, 'variant already has a value for this option')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_variant_option_values_block_active_before_update
BEFORE UPDATE OF variant_id, option_value_id ON variant_option_values
FOR EACH ROW
WHEN (
    SELECT p.status
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = OLD.variant_id
) = 'active'
 OR (
    SELECT p.status
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = NEW.variant_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing variant options');
END;

CREATE TRIGGER IF NOT EXISTS trg_variant_option_values_block_active_before_delete
BEFORE DELETE ON variant_option_values
FOR EACH ROW
WHEN (
    SELECT p.status
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = OLD.variant_id
) = 'active'
BEGIN
    SELECT RAISE(ABORT, 'set product to draft before changing variant options');
END;

CREATE TRIGGER IF NOT EXISTS trg_variant_option_values_refresh_signature_after_insert
AFTER INSERT ON variant_option_values
FOR EACH ROW
BEGIN
    UPDATE product_variants
    SET option_signature = CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN '__default__'
        WHEN (
            SELECT COUNT(*)
            FROM variant_option_values vov
            JOIN product_option_values pov ON pov.id = vov.option_value_id
            JOIN product_options po ON po.id = pov.option_id
            WHERE vov.variant_id = product_variants.id
              AND po.product_id = product_variants.product_id
        ) = (
            SELECT COUNT(*)
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN (
            SELECT group_concat(option_value_id, ',')
            FROM (
                SELECT vov.option_value_id
                FROM variant_option_values vov
                JOIN product_option_values pov ON pov.id = vov.option_value_id
                JOIN product_options po ON po.id = pov.option_id
                WHERE vov.variant_id = product_variants.id
                  AND po.product_id = product_variants.product_id
                ORDER BY po.id, pov.id
            )
        )
        ELSE NULL
    END
    WHERE id = NEW.variant_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_variant_option_values_refresh_signature_after_delete
AFTER DELETE ON variant_option_values
FOR EACH ROW
BEGIN
    UPDATE product_variants
    SET option_signature = CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN '__default__'
        WHEN (
            SELECT COUNT(*)
            FROM variant_option_values vov
            JOIN product_option_values pov ON pov.id = vov.option_value_id
            JOIN product_options po ON po.id = pov.option_id
            WHERE vov.variant_id = product_variants.id
              AND po.product_id = product_variants.product_id
        ) = (
            SELECT COUNT(*)
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN (
            SELECT group_concat(option_value_id, ',')
            FROM (
                SELECT vov.option_value_id
                FROM variant_option_values vov
                JOIN product_option_values pov ON pov.id = vov.option_value_id
                JOIN product_options po ON po.id = pov.option_id
                WHERE vov.variant_id = product_variants.id
                  AND po.product_id = product_variants.product_id
                ORDER BY po.id, pov.id
            )
        )
        ELSE NULL
    END
    WHERE id = OLD.variant_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_variant_option_values_refresh_signature_after_update
AFTER UPDATE OF variant_id, option_value_id ON variant_option_values
FOR EACH ROW
BEGIN
    UPDATE product_variants
    SET option_signature = CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN '__default__'
        WHEN (
            SELECT COUNT(*)
            FROM variant_option_values vov
            JOIN product_option_values pov ON pov.id = vov.option_value_id
            JOIN product_options po ON po.id = pov.option_id
            WHERE vov.variant_id = product_variants.id
              AND po.product_id = product_variants.product_id
        ) = (
            SELECT COUNT(*)
            FROM product_options
            WHERE product_id = product_variants.product_id
        ) THEN (
            SELECT group_concat(option_value_id, ',')
            FROM (
                SELECT vov.option_value_id
                FROM variant_option_values vov
                JOIN product_option_values pov ON pov.id = vov.option_value_id
                JOIN product_options po ON po.id = pov.option_id
                WHERE vov.variant_id = product_variants.id
                  AND po.product_id = product_variants.product_id
                ORDER BY po.id, pov.id
            )
        )
        ELSE NULL
    END
    WHERE id IN (OLD.variant_id, NEW.variant_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_products_validate_featured_media_before_update
BEFORE UPDATE OF featured_media_id ON products
FOR EACH ROW
WHEN NEW.featured_media_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM product_media
            WHERE product_id = NEW.id
              AND media_id = NEW.featured_media_id
        )
        THEN RAISE(ABORT, 'featured media must belong to the product')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_product_media_validate_before_insert
BEFORE INSERT ON product_media
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.variant_id IS NOT NULL
         AND (
            SELECT product_id
            FROM product_variants
            WHERE id = NEW.variant_id
         ) != NEW.product_id
        THEN RAISE(ABORT, 'product media variant must belong to the same product')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_product_media_validate_before_update
BEFORE UPDATE OF product_id, variant_id ON product_media
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.variant_id IS NOT NULL
         AND (
            SELECT product_id
            FROM product_variants
            WHERE id = NEW.variant_id
         ) != NEW.product_id
        THEN RAISE(ABORT, 'product media variant must belong to the same product')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_menu_items_validate_before_insert
BEFORE INSERT ON menu_items
FOR EACH ROW
WHEN NEW.parent_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NEW.parent_id = NEW.id
        THEN RAISE(ABORT, 'menu item cannot parent itself')
        WHEN EXISTS (
            WITH RECURSIVE ancestors(id) AS (
                SELECT NEW.parent_id
                UNION ALL
                SELECT mi.parent_id
                FROM menu_items mi
                JOIN ancestors a ON mi.id = a.id AND mi.menu_id = NEW.menu_id
                WHERE mi.parent_id IS NOT NULL
            )
            SELECT 1
            FROM ancestors
            WHERE id = NEW.id
        )
        THEN RAISE(ABORT, 'menu item cycle detected')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_menu_items_validate_before_update
BEFORE UPDATE OF menu_id, parent_id ON menu_items
FOR EACH ROW
WHEN NEW.parent_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NEW.parent_id = NEW.id
        THEN RAISE(ABORT, 'menu item cannot parent itself')
        WHEN EXISTS (
            WITH RECURSIVE ancestors(id) AS (
                SELECT NEW.parent_id
                UNION ALL
                SELECT mi.parent_id
                FROM menu_items mi
                JOIN ancestors a ON mi.id = a.id AND mi.menu_id = NEW.menu_id
                WHERE mi.parent_id IS NOT NULL
            )
            SELECT 1
            FROM ancestors
            WHERE id = NEW.id
        )
        THEN RAISE(ABORT, 'menu item cycle detected')
    END;
END;


CREATE TRIGGER IF NOT EXISTS trg_customer_addresses_validate_customer_id_before_update
BEFORE UPDATE OF customer_id ON customer_addresses
FOR EACH ROW
WHEN NEW.customer_id != OLD.customer_id
BEGIN
    SELECT RAISE(ABORT, 'customer address customer_id is immutable; recreate the address for another customer');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_items_create_level_after_insert
AFTER INSERT ON inventory_items
FOR EACH ROW
BEGIN
    INSERT OR IGNORE INTO inventory_levels (inventory_item_id)
    VALUES (NEW.id);
END;


CREATE TRIGGER IF NOT EXISTS trg_inventory_items_validate_variant_id_before_update
BEFORE UPDATE OF variant_id ON inventory_items
FOR EACH ROW
WHEN NEW.variant_id != OLD.variant_id
BEGIN
    SELECT RAISE(ABORT, 'inventory item variant_id is immutable; create a new inventory item for another variant');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_items_validate_tracked_before_update
BEFORE UPDATE OF tracked ON inventory_items
FOR EACH ROW
WHEN NEW.tracked != OLD.tracked
 AND EXISTS (
    SELECT 1
    FROM inventory_movements
    WHERE inventory_item_id = OLD.id
)
BEGIN
    SELECT RAISE(ABORT, 'tracked flag is immutable after inventory history exists');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_items_refresh_levels_after_tracked_update
AFTER UPDATE OF tracked ON inventory_items
FOR EACH ROW
WHEN NEW.tracked != OLD.tracked
BEGIN
    UPDATE inventory_levels
    SET on_hand = CASE
                WHEN NEW.tracked = 0 THEN 0
                ELSE COALESCE((
                    SELECT SUM(
                        CASE
                            WHEN movement_type IN ('in', 'returned', 'sold', 'adjust') THEN quantity_delta
                            ELSE 0
                        END
                    )
                    FROM inventory_movements
                    WHERE inventory_item_id = NEW.id
                ), 0)
            END,
        reserved = CASE
                WHEN NEW.tracked = 0 THEN 0
                ELSE COALESCE((
                    SELECT SUM(
                        CASE
                            WHEN movement_type IN ('reserve', 'release', 'sold') THEN quantity_delta
                            ELSE 0
                        END
                    )
                    FROM inventory_movements
                    WHERE inventory_item_id = NEW.id
                ), 0)
            END,
        updated_at = CURRENT_TIMESTAMP
    WHERE inventory_item_id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_items_validate_backorder_before_update
BEFORE UPDATE OF allow_backorder ON inventory_items
FOR EACH ROW
WHEN NEW.allow_backorder = 0 AND OLD.allow_backorder = 1
BEGIN
    SELECT CASE
        WHEN (
            SELECT reserved
            FROM inventory_levels
            WHERE inventory_item_id = OLD.id
        ) > (
            SELECT on_hand
            FROM inventory_levels
            WHERE inventory_item_id = OLD.id
        )
        THEN RAISE(ABORT, 'cannot disable backorder while reserved exceeds on_hand')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movements_validate_before_insert
BEFORE INSERT ON inventory_movements
FOR EACH ROW
BEGIN
    INSERT OR IGNORE INTO inventory_levels (inventory_item_id)
    VALUES (NEW.inventory_item_id);

    SELECT CASE
        WHEN (
            SELECT tracked
            FROM inventory_items
            WHERE id = NEW.inventory_item_id
        ) = 0
        THEN RAISE(ABORT, 'inventory movements are not allowed for untracked items')
        WHEN NEW.movement_type IN ('in', 'reserve', 'returned') AND NEW.quantity_delta <= 0
        THEN RAISE(ABORT, 'inventory movement must be positive for this movement type')
        WHEN NEW.movement_type IN ('release', 'sold') AND NEW.quantity_delta >= 0
        THEN RAISE(ABORT, 'inventory movement must be negative for this movement type')
        WHEN NEW.movement_type = 'adjust' AND NEW.quantity_delta = 0
        THEN RAISE(ABORT, 'inventory adjustment cannot be zero')
    END;

    SELECT CASE
        WHEN (
            SELECT tracked
            FROM inventory_items
            WHERE id = NEW.inventory_item_id
        ) = 1
        AND (
            SELECT reserved +
                CASE
                    WHEN NEW.movement_type IN ('reserve', 'release', 'sold') THEN NEW.quantity_delta
                    ELSE 0
                END
            FROM inventory_levels
            WHERE inventory_item_id = NEW.inventory_item_id
        ) < 0
        THEN RAISE(ABORT, 'inventory reserved quantity cannot go negative')
    END;

    SELECT CASE
        WHEN (
            SELECT tracked
            FROM inventory_items
            WHERE id = NEW.inventory_item_id
        ) = 1
        AND (
            SELECT allow_backorder
            FROM inventory_items
            WHERE id = NEW.inventory_item_id
        ) = 0
        AND (
            SELECT reserved +
                CASE
                    WHEN NEW.movement_type IN ('reserve', 'release', 'sold') THEN NEW.quantity_delta
                    ELSE 0
                END
            FROM inventory_levels
            WHERE inventory_item_id = NEW.inventory_item_id
        ) > (
            SELECT on_hand +
                CASE
                    WHEN NEW.movement_type IN ('in', 'returned', 'sold', 'adjust') THEN NEW.quantity_delta
                    ELSE 0
                END
            FROM inventory_levels
            WHERE inventory_item_id = NEW.inventory_item_id
        )
        THEN RAISE(ABORT, 'inventory would exceed available stock without backorder')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movements_apply_after_insert
AFTER INSERT ON inventory_movements
FOR EACH ROW
BEGIN
    UPDATE inventory_levels
    SET on_hand = on_hand +
            CASE
                WHEN (
                    SELECT tracked
                    FROM inventory_items
                    WHERE id = NEW.inventory_item_id
                ) = 1
                 AND NEW.movement_type IN ('in', 'returned', 'sold', 'adjust') THEN NEW.quantity_delta
                ELSE 0
            END,
        reserved = reserved +
            CASE
                WHEN (
                    SELECT tracked
                    FROM inventory_items
                    WHERE id = NEW.inventory_item_id
                ) = 1
                 AND NEW.movement_type IN ('reserve', 'release', 'sold') THEN NEW.quantity_delta
                ELSE 0
            END,
        updated_at = CURRENT_TIMESTAMP
    WHERE inventory_item_id = NEW.inventory_item_id
      AND (
            SELECT tracked
            FROM inventory_items
            WHERE id = NEW.inventory_item_id
      ) = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movements_block_update
BEFORE UPDATE ON inventory_movements
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'inventory_movements is append-only; add a compensating movement instead');
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movements_block_delete
BEFORE DELETE ON inventory_movements
FOR EACH ROW
WHEN EXISTS (
    SELECT 1
    FROM inventory_items
    WHERE id = OLD.inventory_item_id
)
BEGIN
    SELECT RAISE(ABORT, 'inventory_movements is append-only; add a compensating movement instead');
END;

CREATE TRIGGER IF NOT EXISTS trg_order_items_block_after_payment_before_insert
BEFORE INSERT ON order_items
FOR EACH ROW
WHEN EXISTS (
    SELECT 1
    FROM payments
    WHERE order_id = NEW.order_id
      AND status IN ('authorized', 'captured', 'refunded')
)
BEGIN
    SELECT RAISE(ABORT, 'cannot change order items after payment activity');
END;

CREATE TRIGGER IF NOT EXISTS trg_order_items_block_after_payment_before_update
BEFORE UPDATE OF order_id, quantity, unit_price_amount, discount_amount, tax_amount ON order_items
FOR EACH ROW
WHEN EXISTS (
    SELECT 1
    FROM payments
    WHERE order_id IN (OLD.order_id, NEW.order_id)
      AND status IN ('authorized', 'captured', 'refunded')
)
BEGIN
    SELECT RAISE(ABORT, 'cannot change order items after payment activity');
END;

CREATE TRIGGER IF NOT EXISTS trg_order_items_block_after_payment_before_delete
BEFORE DELETE ON order_items
FOR EACH ROW
WHEN EXISTS (
    SELECT 1
    FROM payments
    WHERE order_id = OLD.order_id
      AND status IN ('authorized', 'captured', 'refunded')
)
BEGIN
    SELECT RAISE(ABORT, 'cannot change order items after payment activity');
END;

CREATE TRIGGER IF NOT EXISTS trg_order_items_refresh_order_after_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders
    SET subtotal_amount = COALESCE((
                SELECT SUM(quantity * unit_price_amount)
                FROM order_items
                WHERE order_id = NEW.order_id
            ), 0),
        discount_amount = COALESCE((
                SELECT SUM(discount_amount)
                FROM order_items
                WHERE order_id = NEW.order_id
            ), 0),
        tax_amount = COALESCE((
                SELECT SUM(tax_amount)
                FROM order_items
                WHERE order_id = NEW.order_id
            ), 0),
        total_amount = COALESCE((
                SELECT SUM(quantity * unit_price_amount)
                FROM order_items
                WHERE order_id = NEW.order_id
            ), 0)
            - COALESCE((
                SELECT SUM(discount_amount)
                FROM order_items
                WHERE order_id = NEW.order_id
            ), 0)
            - order_discount_amount
            + shipping_amount
            - shipping_discount_amount
            + COALESCE((
                SELECT SUM(tax_amount)
                FROM order_items
                WHERE order_id = NEW.order_id
            ), 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_order_items_refresh_order_after_update
AFTER UPDATE OF order_id, quantity, unit_price_amount, discount_amount, tax_amount ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders
    SET subtotal_amount = COALESCE((
                SELECT SUM(quantity * unit_price_amount)
                FROM order_items
                WHERE order_id = orders.id
            ), 0),
        discount_amount = COALESCE((
                SELECT SUM(discount_amount)
                FROM order_items
                WHERE order_id = orders.id
            ), 0),
        tax_amount = COALESCE((
                SELECT SUM(tax_amount)
                FROM order_items
                WHERE order_id = orders.id
            ), 0),
        total_amount = COALESCE((
                SELECT SUM(quantity * unit_price_amount)
                FROM order_items
                WHERE order_id = orders.id
            ), 0)
            - COALESCE((
                SELECT SUM(discount_amount)
                FROM order_items
                WHERE order_id = orders.id
            ), 0)
            - order_discount_amount
            + shipping_amount
            - shipping_discount_amount
            + COALESCE((
                SELECT SUM(tax_amount)
                FROM order_items
                WHERE order_id = orders.id
            ), 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id IN (OLD.order_id, NEW.order_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_order_items_refresh_order_after_delete
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders
    SET subtotal_amount = COALESCE((
                SELECT SUM(quantity * unit_price_amount)
                FROM order_items
                WHERE order_id = OLD.order_id
            ), 0),
        discount_amount = COALESCE((
                SELECT SUM(discount_amount)
                FROM order_items
                WHERE order_id = OLD.order_id
            ), 0),
        tax_amount = COALESCE((
                SELECT SUM(tax_amount)
                FROM order_items
                WHERE order_id = OLD.order_id
            ), 0),
        total_amount = COALESCE((
                SELECT SUM(quantity * unit_price_amount)
                FROM order_items
                WHERE order_id = OLD.order_id
            ), 0)
            - COALESCE((
                SELECT SUM(discount_amount)
                FROM order_items
                WHERE order_id = OLD.order_id
            ), 0)
            - order_discount_amount
            + shipping_amount
            - shipping_discount_amount
            + COALESCE((
                SELECT SUM(tax_amount)
                FROM order_items
                WHERE order_id = OLD.order_id
            ), 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.order_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_recalc_total_after_shipping_or_discount_update
AFTER UPDATE OF shipping_amount, shipping_discount_amount, order_discount_amount ON orders
FOR EACH ROW
BEGIN
    UPDATE orders
    SET total_amount = COALESCE((
                SELECT SUM(quantity * unit_price_amount)
                FROM order_items
                WHERE order_id = NEW.id
            ), 0)
            - COALESCE((
                SELECT SUM(discount_amount)
                FROM order_items
                WHERE order_id = NEW.id
            ), 0)
            - NEW.order_discount_amount
            + NEW.shipping_amount
            - NEW.shipping_discount_amount
            + COALESCE((
                SELECT SUM(tax_amount)
                FROM order_items
                WHERE order_id = NEW.id
            ), 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_block_amount_changes_after_payment
BEFORE UPDATE OF subtotal_amount, discount_amount, order_discount_amount, shipping_amount, shipping_discount_amount, tax_amount, total_amount ON orders
FOR EACH ROW
WHEN (
        NEW.subtotal_amount != OLD.subtotal_amount
     OR NEW.discount_amount != OLD.discount_amount
     OR NEW.order_discount_amount != OLD.order_discount_amount
     OR NEW.shipping_amount != OLD.shipping_amount
     OR NEW.shipping_discount_amount != OLD.shipping_discount_amount
     OR NEW.tax_amount != OLD.tax_amount
     OR NEW.total_amount != OLD.total_amount
)
 AND EXISTS (
    SELECT 1
    FROM payments
    WHERE order_id = NEW.id
      AND status IN ('authorized', 'captured', 'refunded')
)
BEGIN
    SELECT RAISE(ABORT, 'cannot change order totals after payment activity');
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_normalize_payment_status_after_insert
AFTER INSERT ON orders
FOR EACH ROW
WHEN NEW.total_amount = 0
BEGIN
    UPDATE orders SET payment_status = 'paid' WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_normalize_payment_status_after_update
AFTER UPDATE OF payment_status, total_amount ON orders
FOR EACH ROW
BEGIN
    UPDATE orders
    SET payment_status = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'refunded'
            ), 0) >= total_amount
             AND EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'refunded'
            ) THEN 'refunded'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'refunded'
            ) THEN 'partially_refunded'
            WHEN total_amount = 0 THEN 'paid'
            WHEN total_amount > 0
             AND COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'captured'
            ), 0) >= total_amount THEN 'paid'
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'captured'
            ), 0) > 0 THEN 'partially_paid'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'authorized'
            ) THEN 'authorized'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'pending'
            ) THEN 'pending'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'failed'
            ) THEN 'failed'
            ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id
      AND payment_status != CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'refunded'
            ), 0) >= total_amount
             AND EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'refunded'
            ) THEN 'refunded'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'refunded'
            ) THEN 'partially_refunded'
            WHEN total_amount = 0 THEN 'paid'
            WHEN total_amount > 0
             AND COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'captured'
            ), 0) >= total_amount THEN 'paid'
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'captured'
            ), 0) > 0 THEN 'partially_paid'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'authorized'
            ) THEN 'authorized'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'pending'
            ) THEN 'pending'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.id
                  AND status = 'failed'
            ) THEN 'failed'
            ELSE 'pending'
        END;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_validate_status_transition_before_update
BEFORE UPDATE OF order_status ON orders
FOR EACH ROW
WHEN NEW.order_status != OLD.order_status
BEGIN
    SELECT CASE
        WHEN OLD.order_status = 'open'
         AND NEW.order_status NOT IN ('completed', 'cancelled')
        THEN RAISE(ABORT, 'invalid order status transition')
        WHEN OLD.order_status IN ('completed', 'cancelled')
        THEN RAISE(ABORT, 'order status is immutable after completion or cancellation')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_normalize_fulfillment_status_after_update
AFTER UPDATE OF fulfillment_status ON orders
FOR EACH ROW
BEGIN
    UPDATE orders
    SET fulfillment_status = CASE
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = NEW.id
                  AND status = 'returned'
            ) THEN 'returned'
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = NEW.id
                  AND status IN ('shipped', 'delivered')
            ) THEN 'fulfilled'
            ELSE 'unfulfilled'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id
      AND fulfillment_status != CASE
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = NEW.id
                  AND status = 'returned'
            ) THEN 'returned'
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = NEW.id
                  AND status IN ('shipped', 'delivered')
            ) THEN 'fulfilled'
            ELSE 'unfulfilled'
        END;
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_validate_before_insert
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.currency_code != (
            SELECT currency_code
            FROM orders
            WHERE id = NEW.order_id
        )
        THEN RAISE(ABORT, 'payment currency must match order currency')
        WHEN NEW.status = 'captured'
         AND COALESCE((
            SELECT SUM(amount)
            FROM payments
            WHERE order_id = NEW.order_id
              AND status = 'captured'
        ), 0) + NEW.amount > (
            SELECT total_amount
            FROM orders
            WHERE id = NEW.order_id
        )
        THEN RAISE(ABORT, 'captured payments cannot exceed order total')
        WHEN NEW.status = 'authorized'
         AND COALESCE((
            SELECT SUM(amount)
            FROM payments
            WHERE order_id = NEW.order_id
              AND status = 'authorized'
        ), 0) + NEW.amount > (
            SELECT total_amount
            FROM orders
            WHERE id = NEW.order_id
        )
        THEN RAISE(ABORT, 'authorized payments cannot exceed order total')
        WHEN NEW.status = 'refunded'
         AND (
            COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'refunded'
            ), 0) + NEW.amount
        ) > COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'captured'
            ), 0)
        THEN RAISE(ABORT, 'refunded payments cannot exceed captured payments')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_validate_before_update
BEFORE UPDATE OF order_id, amount, currency_code, status ON payments
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.currency_code != (
            SELECT currency_code
            FROM orders
            WHERE id = NEW.order_id
        )
        THEN RAISE(ABORT, 'payment currency must match order currency')
        WHEN NEW.status = 'captured'
         AND COALESCE((
            SELECT SUM(amount)
            FROM payments
            WHERE order_id = NEW.order_id
              AND status = 'captured'
              AND id != OLD.id
        ), 0) + NEW.amount > (
            SELECT total_amount
            FROM orders
            WHERE id = NEW.order_id
        )
        THEN RAISE(ABORT, 'captured payments cannot exceed order total')
        WHEN NEW.status = 'authorized'
         AND COALESCE((
            SELECT SUM(amount)
            FROM payments
            WHERE order_id = NEW.order_id
              AND status = 'authorized'
              AND id != OLD.id
        ), 0) + NEW.amount > (
            SELECT total_amount
            FROM orders
            WHERE id = NEW.order_id
        )
        THEN RAISE(ABORT, 'authorized payments cannot exceed order total')
        WHEN NEW.status = 'refunded'
         AND (
            COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'refunded'
                  AND id != OLD.id
            ), 0) + NEW.amount
        ) > COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'captured'
                  AND id != OLD.id
            ), 0)
        THEN RAISE(ABORT, 'refunded payments cannot exceed captured payments')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_validate_immutable_fields_before_update
BEFORE UPDATE OF order_id, provider, provider_payment_id, amount, currency_code ON payments
FOR EACH ROW
WHEN NEW.order_id != OLD.order_id
 OR NEW.provider != OLD.provider
 OR COALESCE(NEW.provider_payment_id, '') != COALESCE(OLD.provider_payment_id, '')
 OR NEW.amount != OLD.amount
 OR NEW.currency_code != OLD.currency_code
BEGIN
    SELECT RAISE(ABORT, 'payment identity fields are immutable after insert');
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_validate_status_transition_before_update
BEFORE UPDATE OF status ON payments
FOR EACH ROW
WHEN NEW.status != OLD.status
BEGIN
    SELECT CASE
        WHEN NEW.status = 'refunded'
        THEN RAISE(ABORT, 'insert a new refund payment row instead of changing payment status')
        WHEN OLD.status = 'pending'
         AND NEW.status NOT IN ('authorized', 'captured', 'failed')
        THEN RAISE(ABORT, 'invalid payment status transition')
        WHEN OLD.status = 'authorized'
         AND NEW.status NOT IN ('captured', 'failed')
        THEN RAISE(ABORT, 'invalid payment status transition')
        WHEN OLD.status IN ('captured', 'failed', 'refunded')
        THEN RAISE(ABORT, 'payment status is immutable after reaching a terminal state')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_refresh_order_after_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    UPDATE orders
    SET payment_status = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'refunded'
            ), 0) >= total_amount
             AND EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'refunded'
            ) THEN 'refunded'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'refunded'
            ) THEN 'partially_refunded'
            WHEN total_amount = 0 THEN 'paid'
            WHEN total_amount > 0
             AND COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'captured'
            ), 0) >= total_amount THEN 'paid'
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'captured'
            ), 0) > 0 THEN 'partially_paid'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'authorized'
            ) THEN 'authorized'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'pending'
            ) THEN 'pending'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = NEW.order_id
                  AND status = 'failed'
            ) THEN 'failed'
            ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_refresh_order_after_update
AFTER UPDATE OF order_id, amount, currency_code, status ON payments
FOR EACH ROW
BEGIN
    UPDATE orders
    SET payment_status = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = orders.id
                  AND status = 'refunded'
            ), 0) >= total_amount
             AND EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = orders.id
                  AND status = 'refunded'
            ) THEN 'refunded'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = orders.id
                  AND status = 'refunded'
            ) THEN 'partially_refunded'
            WHEN total_amount = 0 THEN 'paid'
            WHEN total_amount > 0
             AND COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = orders.id
                  AND status = 'captured'
            ), 0) >= total_amount THEN 'paid'
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = orders.id
                  AND status = 'captured'
            ), 0) > 0 THEN 'partially_paid'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = orders.id
                  AND status = 'authorized'
            ) THEN 'authorized'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = orders.id
                  AND status = 'pending'
            ) THEN 'pending'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = orders.id
                  AND status = 'failed'
            ) THEN 'failed'
            ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id IN (OLD.order_id, NEW.order_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_refresh_order_after_delete
AFTER DELETE ON payments
FOR EACH ROW
BEGIN
    UPDATE orders
    SET payment_status = CASE
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = OLD.order_id
                  AND status = 'refunded'
            ), 0) >= total_amount
             AND EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = OLD.order_id
                  AND status = 'refunded'
            ) THEN 'refunded'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = OLD.order_id
                  AND status = 'refunded'
            ) THEN 'partially_refunded'
            WHEN total_amount = 0 THEN 'paid'
            WHEN total_amount > 0
             AND COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = OLD.order_id
                  AND status = 'captured'
            ), 0) >= total_amount THEN 'paid'
            WHEN COALESCE((
                SELECT SUM(amount)
                FROM payments
                WHERE order_id = OLD.order_id
                  AND status = 'captured'
            ), 0) > 0 THEN 'partially_paid'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = OLD.order_id
                  AND status = 'authorized'
            ) THEN 'authorized'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = OLD.order_id
                  AND status = 'pending'
            ) THEN 'pending'
            WHEN EXISTS (
                SELECT 1
                FROM payments
                WHERE order_id = OLD.order_id
                  AND status = 'failed'
            ) THEN 'failed'
            ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.order_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_block_delete
BEFORE DELETE ON payments
FOR EACH ROW
WHEN EXISTS (
    SELECT 1
    FROM orders
    WHERE id = OLD.order_id
)
BEGIN
    SELECT RAISE(ABORT, 'payments are append-only; keep the ledger and add a compensating record instead');
END;

CREATE TRIGGER IF NOT EXISTS trg_shipments_refresh_order_after_insert
AFTER INSERT ON shipments
FOR EACH ROW
BEGIN
    UPDATE orders
    SET fulfillment_status = CASE
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = NEW.order_id
                  AND status = 'returned'
            ) THEN 'returned'
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = NEW.order_id
                  AND status IN ('shipped', 'delivered')
            ) THEN 'fulfilled'
            ELSE 'unfulfilled'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_shipments_validate_order_id_before_update
BEFORE UPDATE OF order_id ON shipments
FOR EACH ROW
WHEN NEW.order_id != OLD.order_id
BEGIN
    SELECT RAISE(ABORT, 'shipment order_id is immutable after insert');
END;

CREATE TRIGGER IF NOT EXISTS trg_shipments_validate_status_transition_before_update
BEFORE UPDATE OF status ON shipments
FOR EACH ROW
WHEN NEW.status != OLD.status
BEGIN
    SELECT CASE
        WHEN OLD.status = 'pending'
         AND NEW.status NOT IN ('shipped', 'delivered', 'returned')
        THEN RAISE(ABORT, 'invalid shipment status transition')
        WHEN OLD.status = 'shipped'
         AND NEW.status NOT IN ('delivered', 'returned')
        THEN RAISE(ABORT, 'invalid shipment status transition')
        WHEN OLD.status = 'delivered'
         AND NEW.status NOT IN ('returned')
        THEN RAISE(ABORT, 'invalid shipment status transition')
        WHEN OLD.status = 'returned'
        THEN RAISE(ABORT, 'shipment status is immutable after return')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_shipments_refresh_order_after_update
AFTER UPDATE OF order_id, status ON shipments
FOR EACH ROW
BEGIN
    UPDATE orders
    SET fulfillment_status = CASE
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = orders.id
                  AND status = 'returned'
            ) THEN 'returned'
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = orders.id
                  AND status IN ('shipped', 'delivered')
            ) THEN 'fulfilled'
            ELSE 'unfulfilled'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id IN (OLD.order_id, NEW.order_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_shipments_refresh_order_after_delete
AFTER DELETE ON shipments
FOR EACH ROW
BEGIN
    UPDATE orders
    SET fulfillment_status = CASE
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = OLD.order_id
                  AND status = 'returned'
            ) THEN 'returned'
            WHEN EXISTS (
                SELECT 1
                FROM shipments
                WHERE order_id = OLD.order_id
                  AND status IN ('shipped', 'delivered')
            ) THEN 'fulfilled'
            ELSE 'unfulfilled'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.order_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_shipments_block_delete
BEFORE DELETE ON shipments
FOR EACH ROW
WHEN EXISTS (
    SELECT 1
    FROM orders
    WHERE id = OLD.order_id
)
BEGIN
    SELECT RAISE(ABORT, 'shipments are immutable; update status instead of deleting history');
END;

CREATE TRIGGER IF NOT EXISTS trg_products_delete_metafields_before_delete
BEFORE DELETE ON products
FOR EACH ROW
BEGIN
    DELETE FROM metafield_values
    WHERE (resource_type = 'product' AND resource_id = OLD.id)
       OR (
            resource_type = 'variant'
        AND resource_id IN (
            SELECT id
            FROM product_variants
            WHERE product_id = OLD.id
        )
       );
END;

CREATE TRIGGER IF NOT EXISTS trg_product_variants_delete_metafields_before_delete
BEFORE DELETE ON product_variants
FOR EACH ROW
BEGIN
    DELETE FROM metafield_values
    WHERE resource_type = 'variant'
      AND resource_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_collections_delete_metafields_before_delete
BEFORE DELETE ON collections
FOR EACH ROW
BEGIN
    DELETE FROM metafield_values
    WHERE resource_type = 'collection'
      AND resource_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_customers_delete_metafields_before_delete
BEFORE DELETE ON customers
FOR EACH ROW
BEGIN
    DELETE FROM metafield_values
    WHERE resource_type = 'customer'
      AND resource_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_delete_metafields_before_delete
BEFORE DELETE ON orders
FOR EACH ROW
BEGIN
    DELETE FROM metafield_values
    WHERE resource_type = 'order'
      AND resource_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_pages_delete_metafields_before_delete
BEFORE DELETE ON pages
FOR EACH ROW
BEGIN
    DELETE FROM metafield_values
    WHERE resource_type = 'page'
      AND resource_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_promotions_delete_metafields_before_delete
BEFORE DELETE ON promotions
FOR EACH ROW
BEGIN
    DELETE FROM metafield_values
    WHERE resource_type = 'promotion'
      AND resource_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_metafield_values_validate_resource_before_insert
BEFORE INSERT ON metafield_values
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.resource_type = 'shop' AND NEW.resource_id != 1
        THEN RAISE(ABORT, 'shop metafield resource_id must be 1')
        WHEN NEW.resource_type = 'product'
         AND NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield product resource does not exist')
        WHEN NEW.resource_type = 'variant'
         AND NOT EXISTS (SELECT 1 FROM product_variants WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield variant resource does not exist')
        WHEN NEW.resource_type = 'collection'
         AND NOT EXISTS (SELECT 1 FROM collections WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield collection resource does not exist')
        WHEN NEW.resource_type = 'customer'
         AND NOT EXISTS (SELECT 1 FROM customers WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield customer resource does not exist')
        WHEN NEW.resource_type = 'order'
         AND NOT EXISTS (SELECT 1 FROM orders WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield order resource does not exist')
        WHEN NEW.resource_type = 'page'
         AND NOT EXISTS (SELECT 1 FROM pages WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield page resource does not exist')
        WHEN NEW.resource_type = 'promotion'
         AND NOT EXISTS (SELECT 1 FROM promotions WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield promotion resource does not exist')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_metafield_values_validate_type_before_insert
BEFORE INSERT ON metafield_values
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'text'
         AND NEW.value_text IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type text')
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'integer'
         AND NEW.value_integer IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type integer')
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'number'
         AND NEW.value_number IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type number')
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'boolean'
         AND NEW.value_boolean IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type boolean')
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'json'
         AND NEW.value_json IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type json')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_metafield_values_validate_resource_before_update
BEFORE UPDATE OF resource_type, resource_id, definition_id ON metafield_values
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.resource_type = 'shop' AND NEW.resource_id != 1
        THEN RAISE(ABORT, 'shop metafield resource_id must be 1')
        WHEN NEW.resource_type = 'product'
         AND NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield product resource does not exist')
        WHEN NEW.resource_type = 'variant'
         AND NOT EXISTS (SELECT 1 FROM product_variants WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield variant resource does not exist')
        WHEN NEW.resource_type = 'collection'
         AND NOT EXISTS (SELECT 1 FROM collections WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield collection resource does not exist')
        WHEN NEW.resource_type = 'customer'
         AND NOT EXISTS (SELECT 1 FROM customers WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield customer resource does not exist')
        WHEN NEW.resource_type = 'order'
         AND NOT EXISTS (SELECT 1 FROM orders WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield order resource does not exist')
        WHEN NEW.resource_type = 'page'
         AND NOT EXISTS (SELECT 1 FROM pages WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield page resource does not exist')
        WHEN NEW.resource_type = 'promotion'
         AND NOT EXISTS (SELECT 1 FROM promotions WHERE id = NEW.resource_id)
        THEN RAISE(ABORT, 'metafield promotion resource does not exist')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_metafield_values_validate_type_before_update
BEFORE UPDATE OF definition_id, resource_type, value_text, value_integer, value_number, value_boolean, value_json ON metafield_values
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'text'
         AND NEW.value_text IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type text')
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'integer'
         AND NEW.value_integer IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type integer')
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'number'
         AND NEW.value_number IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type number')
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'boolean'
         AND NEW.value_boolean IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type boolean')
        WHEN (
            SELECT value_type
            FROM metafield_definitions
            WHERE id = NEW.definition_id
              AND resource_type = NEW.resource_type
        ) = 'json'
         AND NEW.value_json IS NULL
        THEN RAISE(ABORT, 'metafield value must match definition type json')
    END;
END;

-- =========================================================
-- updated_at auto-refresh triggers
-- WHEN guard: only fire when the application did not
-- explicitly set updated_at, preventing infinite recursion.
-- =========================================================

CREATE TRIGGER IF NOT EXISTS trg_shop_settings_updated_at
AFTER UPDATE ON shop_settings FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE shop_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_products_updated_at
AFTER UPDATE ON products FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_product_variants_updated_at
AFTER UPDATE ON product_variants FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE product_variants SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_collections_updated_at
AFTER UPDATE ON collections FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_items_updated_at
AFTER UPDATE ON inventory_items FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE inventory_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_customers_updated_at
AFTER UPDATE ON customers FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_customer_addresses_updated_at
AFTER UPDATE ON customer_addresses FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE customer_addresses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_carts_updated_at
AFTER UPDATE ON carts FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_cart_items_updated_at
AFTER UPDATE ON cart_items FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE cart_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_pages_updated_at
AFTER UPDATE ON pages FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE pages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_menus_updated_at
AFTER UPDATE ON menus FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE menus SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_metafield_definitions_updated_at
AFTER UPDATE ON metafield_definitions FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE metafield_definitions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_metafield_values_updated_at
AFTER UPDATE ON metafield_values FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE metafield_values SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_orders_updated_at
AFTER UPDATE ON orders FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_levels_updated_at
AFTER UPDATE ON inventory_levels FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE inventory_levels SET updated_at = CURRENT_TIMESTAMP WHERE inventory_item_id = NEW.inventory_item_id; END;

CREATE TRIGGER IF NOT EXISTS trg_promotions_updated_at
AFTER UPDATE ON promotions FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE promotions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_discount_codes_updated_at
AFTER UPDATE ON discount_codes FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN UPDATE discount_codes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;

-- =========================================================
-- promotion validation triggers
-- =========================================================

CREATE TRIGGER IF NOT EXISTS trg_order_discount_codes_validate_before_insert
BEFORE INSERT ON order_discount_codes
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM discount_codes
            WHERE id = NEW.discount_code_id AND promotion_id = NEW.promotion_id
        )
        THEN RAISE(ABORT, 'discount code does not belong to the specified promotion')
        WHEN NOT EXISTS (
            SELECT 1 FROM promotions WHERE id = NEW.promotion_id AND status = 'active'
        )
        THEN RAISE(ABORT, 'promotion is not active')
        WHEN EXISTS (
            SELECT 1 FROM promotions
            WHERE id = NEW.promotion_id
              AND starts_at IS NOT NULL
              AND starts_at > CURRENT_TIMESTAMP
        )
        THEN RAISE(ABORT, 'promotion has not started')
        WHEN EXISTS (
            SELECT 1 FROM promotions
            WHERE id = NEW.promotion_id
              AND ends_at IS NOT NULL
              AND ends_at < CURRENT_TIMESTAMP
        )
        THEN RAISE(ABORT, 'promotion has expired')
        WHEN EXISTS (
            SELECT 1 FROM promotions
            WHERE id = NEW.promotion_id
              AND usage_limit IS NOT NULL
              AND usage_count >= usage_limit
        )
        THEN RAISE(ABORT, 'promotion usage limit reached')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_order_discount_codes_increment_usage_after_insert
AFTER INSERT ON order_discount_codes
FOR EACH ROW
BEGIN
    UPDATE promotions SET usage_count = usage_count + 1 WHERE id = NEW.promotion_id;
    UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = NEW.discount_code_id;
END;
