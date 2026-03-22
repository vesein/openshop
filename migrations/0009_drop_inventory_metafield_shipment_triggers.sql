-- 库存：新建 inventory_levels 行、流水校验与聚合改由应用层（inventory-rules + inventory.service）
-- inventory_items 上 UPDATE 相关触发器仍保留，下一批再迁
DROP TRIGGER IF EXISTS trg_inventory_items_create_level_after_insert;
DROP TRIGGER IF EXISTS trg_inventory_movements_validate_before_insert;
DROP TRIGGER IF EXISTS trg_inventory_movements_apply_after_insert;
DROP TRIGGER IF EXISTS trg_inventory_movements_block_update;
DROP TRIGGER IF EXISTS trg_inventory_movements_block_delete;

-- 元字段：删除资源时级联、写入校验改由应用层（metafield-rules + metafield.service / 各 delete 服务）
DROP TRIGGER IF EXISTS trg_products_delete_metafields_before_delete;
DROP TRIGGER IF EXISTS trg_product_variants_delete_metafields_before_delete;
DROP TRIGGER IF EXISTS trg_collections_delete_metafields_before_delete;
DROP TRIGGER IF EXISTS trg_customers_delete_metafields_before_delete;
DROP TRIGGER IF EXISTS trg_orders_delete_metafields_before_delete;
DROP TRIGGER IF EXISTS trg_pages_delete_metafields_before_delete;
DROP TRIGGER IF EXISTS trg_promotions_delete_metafields_before_delete;
DROP TRIGGER IF EXISTS trg_metafield_values_validate_resource_before_insert;
DROP TRIGGER IF EXISTS trg_metafield_values_validate_type_before_insert;
DROP TRIGGER IF EXISTS trg_metafield_values_validate_resource_before_update;
DROP TRIGGER IF EXISTS trg_metafield_values_validate_type_before_update;

-- 禁止删除发货记录：shipmentDao.delete 抛错（与历史触发器一致）
DROP TRIGGER IF EXISTS trg_shipments_block_delete;
