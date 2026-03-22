-- 客户地址 customer_id、菜单父子环检测改由应用层（address-rules、menu-rules）
DROP TRIGGER IF EXISTS trg_customer_addresses_validate_customer_id_before_update;
DROP TRIGGER IF EXISTS trg_menu_items_validate_before_insert;
DROP TRIGGER IF EXISTS trg_menu_items_validate_before_update;
