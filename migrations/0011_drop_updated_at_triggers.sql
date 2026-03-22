-- 各表更新时由 DAO 显式设置 updatedAt（formatTimestamp）；不再依赖数据库 AFTER UPDATE 补戳
DROP TRIGGER IF EXISTS trg_shop_settings_updated_at;
DROP TRIGGER IF EXISTS trg_products_updated_at;
DROP TRIGGER IF EXISTS trg_product_variants_updated_at;
DROP TRIGGER IF EXISTS trg_collections_updated_at;
DROP TRIGGER IF EXISTS trg_customers_updated_at;
DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at;
DROP TRIGGER IF EXISTS trg_carts_updated_at;
DROP TRIGGER IF EXISTS trg_cart_items_updated_at;
DROP TRIGGER IF EXISTS trg_pages_updated_at;
DROP TRIGGER IF EXISTS trg_menus_updated_at;
DROP TRIGGER IF EXISTS trg_metafield_definitions_updated_at;
DROP TRIGGER IF EXISTS trg_metafield_values_updated_at;
DROP TRIGGER IF EXISTS trg_orders_updated_at;
DROP TRIGGER IF EXISTS trg_inventory_levels_updated_at;
DROP TRIGGER IF EXISTS trg_promotions_updated_at;
DROP TRIGGER IF EXISTS trg_discount_codes_updated_at;
