import { db, sqlite } from "./src/db/index";
import * as schema from "./src/db/schema";

// 清理现有数据
console.log("🗑️  清理现有数据...");
const tables = [
  "metafield_values",
  "metafield_definitions",
  "menu_items",
  "menus",
  "pages",
  "order_discount_codes",
  "payments",
  "shipments",
  "order_items",
  "orders",
  "cart_items",
  "carts",
  "customer_addresses",
  "customers",
  "inventory_movements",
  "inventory_levels",
  "inventory_items",
  "variant_option_values",
  "product_option_values",
  "product_options",
  "product_media",
  "collection_products",
  "collections",
  "discount_codes",
  "promotions",
  "product_variants",
  "products",
  "media_assets",
  "shop_settings",
];

for (const table of tables) {
  sqlite.exec(`DELETE FROM ${table}`);
}
console.log("✓ 数据已清理\n");

// 1. 商店设置
console.log("📝 插入商店设置...");
sqlite.exec(`
  INSERT INTO shop_settings (id, shop_name, shop_description, currency_code, locale, timezone, support_email, order_prefix, weight_unit)
  VALUES (1, 'OpenShop 演示商店', '一个现代化的电商平台演示', 'CNY', 'zh-CN', 'Asia/Shanghai', 'support@openshop.com', 'ORD', 'kg')
`);

// 2. 商品数据 - 先插入草稿状态
console.log("📦 插入商品数据...");
const products = [
  { title: "经典白色T恤", slug: "classic-white-tee", type: "服装", vendor: "OpenShop", hasOptions: true },
  { title: "修身牛仔裤", slug: "slim-fit-jeans", type: "服装", vendor: "OpenShop", hasOptions: true },
  { title: "运动跑鞋", slug: "running-shoes", type: "鞋类", vendor: "SportMax", hasOptions: true },
  { title: "真皮手提包", slug: "leather-tote-bag", type: "配饰", vendor: "LuxuryBrand", hasOptions: false },
  { title: "无线蓝牙耳机", slug: "wireless-earbuds", type: "电子产品", vendor: "TechPro", hasOptions: false },
  { title: "智能手表", slug: "smart-watch", type: "电子产品", vendor: "TechPro", hasOptions: false },
  { title: "纯棉床单套装", slug: "cotton-bedding-set", type: "家居", vendor: "HomeComfort", hasOptions: false },
  { title: "陶瓷咖啡杯", slug: "ceramic-coffee-mug", type: "家居", vendor: "HomeComfort", hasOptions: false },
];

// 先插入草稿状态的商品
for (const product of products) {
  sqlite.exec(`
    INSERT INTO products (title, slug, status, product_type, vendor, description_html, seo_title, seo_description)
    VALUES ('${product.title}', '${product.slug}', 'draft', '${product.type}', '${product.vendor}', 
            '<p>${product.title} - 高品质产品，值得信赖。</p>', '${product.title}', '${product.title} - OpenShop精选')
  `);
}

// 3. 为有选项的商品添加选项和选项值
console.log("⚙️  插入商品选项...");

// 商品1: T恤 - 颜色和尺寸
sqlite.exec(`INSERT INTO product_options (product_id, name, sort_order) VALUES (1, '颜色', 1)`);
sqlite.exec(`INSERT INTO product_options (product_id, name, sort_order) VALUES (1, '尺寸', 2)`);
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (1, '白色', 1)`);  // pov_id=1
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (1, '黑色', 2)`);  // pov_id=2
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (2, 'S', 1)`);     // pov_id=3
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (2, 'M', 2)`);     // pov_id=4
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (2, 'L', 3)`);     // pov_id=5

// 商品2: 牛仔裤 - 颜色和尺寸
sqlite.exec(`INSERT INTO product_options (product_id, name, sort_order) VALUES (2, '颜色', 1)`);
sqlite.exec(`INSERT INTO product_options (product_id, name, sort_order) VALUES (2, '尺寸', 2)`);
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (3, '蓝色', 1)`);  // pov_id=6
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (3, '黑色', 2)`);  // pov_id=7
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (4, '30', 1)`);    // pov_id=8
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (4, '32', 2)`);    // pov_id=9

// 商品3: 跑鞋 - 颜色和尺码
sqlite.exec(`INSERT INTO product_options (product_id, name, sort_order) VALUES (3, '颜色', 1)`);
sqlite.exec(`INSERT INTO product_options (product_id, name, sort_order) VALUES (3, '尺码', 2)`);
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (5, '白色', 1)`);  // pov_id=10
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (5, '黑色', 2)`);  // pov_id=11
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (6, '42', 1)`);    // pov_id=12
sqlite.exec(`INSERT INTO product_option_values (option_id, value, sort_order) VALUES (6, '43', 2)`);    // pov_id=13

// 4. 商品变体
console.log("🎨 插入商品变体...");

// 有选项的商品变体 - 使用正确的选项值 ID
const variantsWithOptions = [
  // T恤变体 (商品1, 选项值 1-5)
  { productId: 1, title: "白色 / S", sku: "TEE-WHT-S", price: 9900, isDefault: 1, optionValues: [1, 3] },
  { productId: 1, title: "白色 / M", sku: "TEE-WHT-M", price: 9900, isDefault: 0, optionValues: [1, 4] },
  { productId: 1, title: "白色 / L", sku: "TEE-WHT-L", price: 9900, isDefault: 0, optionValues: [1, 5] },
  { productId: 1, title: "黑色 / S", sku: "TEE-BLK-S", price: 9900, isDefault: 0, optionValues: [2, 3] },
  { productId: 1, title: "黑色 / M", sku: "TEE-BLK-M", price: 9900, isDefault: 0, optionValues: [2, 4] },
  // 牛仔裤变体 (商品2, 选项值 6-9)
  { productId: 2, title: "蓝色 / 30", sku: "JEANS-BLU-30", price: 29900, isDefault: 1, optionValues: [6, 8] },
  { productId: 2, title: "蓝色 / 32", sku: "JEANS-BLU-32", price: 29900, isDefault: 0, optionValues: [6, 9] },
  { productId: 2, title: "黑色 / 30", sku: "JEANS-BLK-30", price: 29900, isDefault: 0, optionValues: [7, 8] },
  // 跑鞋变体 (商品3, 选项值 10-13)
  { productId: 3, title: "白色 / 42", sku: "SHOE-WHT-42", price: 59900, isDefault: 1, optionValues: [10, 12] },
  { productId: 3, title: "白色 / 43", sku: "SHOE-WHT-43", price: 59900, isDefault: 0, optionValues: [10, 13] },
  { productId: 3, title: "黑色 / 42", sku: "SHOE-BLK-42", price: 59900, isDefault: 0, optionValues: [11, 12] },
];

// 无选项的商品变体
const variantsWithoutOptions = [
  { productId: 4, title: "默认", sku: "BAG-BRN-STD", price: 129900, isDefault: 1 },
  { productId: 5, title: "默认", sku: "EAR-WHT", price: 39900, isDefault: 1 },
  { productId: 6, title: "默认", sku: "WATCH-SLV-42", price: 199900, isDefault: 1 },
  { productId: 7, title: "默认", sku: "BED-WHT-15", price: 49900, isDefault: 1 },
  { productId: 8, title: "默认", sku: "MUG-WHT-350", price: 4900, isDefault: 1 },
];

let variantId = 1;

// 插入有选项的变体
for (const variant of variantsWithOptions) {
  sqlite.exec(`
    INSERT INTO product_variants (product_id, title, sku, price_amount, is_default, requires_shipping, taxable)
    VALUES (${variant.productId}, '${variant.title}', '${variant.sku}', ${variant.price}, ${variant.isDefault}, 1, 1)
  `);
  
  // 关联选项值
  for (const optionValueId of variant.optionValues) {
    sqlite.exec(`
      INSERT INTO variant_option_values (variant_id, option_value_id)
      VALUES (${variantId}, ${optionValueId})
    `);
  }
  variantId++;
}

// 插入无选项的变体
for (const variant of variantsWithoutOptions) {
  sqlite.exec(`
    INSERT INTO product_variants (product_id, title, sku, price_amount, is_default, requires_shipping, taxable)
    VALUES (${variant.productId}, '${variant.title}', '${variant.sku}', ${variant.price}, ${variant.isDefault}, 1, 1)
  `);
  variantId++;
}

// 5. 库存数据
console.log("📊 插入库存数据...");
const totalVariants = variantsWithOptions.length + variantsWithoutOptions.length;
for (let i = 1; i <= totalVariants; i++) {
  const onHand = Math.floor(Math.random() * 100) + 10;
  const reserved = Math.floor(Math.random() * 5);
  sqlite.exec(`
    INSERT INTO inventory_items (variant_id, tracked, allow_backorder)
    VALUES (${i}, 1, 0)
  `);
  // 触发器会自动创建 inventory_levels，所以使用 UPDATE
  sqlite.exec(`
    UPDATE inventory_levels 
    SET on_hand = ${onHand}, reserved = ${reserved}
    WHERE inventory_item_id = ${i}
  `);
}

// 6. 激活商品（除了智能手表保持草稿状态）
console.log("✅ 激活商品...");
for (let i = 1; i <= 5; i++) {
  sqlite.exec(`
    UPDATE products SET status = 'active', published_at = datetime('now') WHERE id = ${i}
  `);
}
sqlite.exec(`
  UPDATE products SET status = 'active', published_at = datetime('now') WHERE id = 7
`);
sqlite.exec(`
  UPDATE products SET status = 'active', published_at = datetime('now') WHERE id = 8
`);

// 7. 客户数据
console.log("👥 插入客户数据...");
const customers = [
  { email: "zhang.wei@example.com", phone: "13800138001", firstName: "张", lastName: "伟", marketing: 1 },
  { email: "li.na@example.com", phone: "13800138002", firstName: "李", lastName: "娜", marketing: 1 },
  { email: "wang.fang@example.com", phone: "13800138003", firstName: "王", lastName: "芳", marketing: 0 },
  { email: "chen.jie@example.com", phone: "13800138004", firstName: "陈", lastName: "杰", marketing: 1 },
  { email: "liu.yang@example.com", phone: "13800138005", firstName: "刘", lastName: "洋", marketing: 0 },
];

for (const customer of customers) {
  sqlite.exec(`
    INSERT INTO customers (email, phone, first_name, last_name, accepts_marketing)
    VALUES ('${customer.email}', '${customer.phone}', '${customer.firstName}', '${customer.lastName}', ${customer.marketing})
  `);
}

// 8. 客户地址
console.log("📍 插入客户地址...");
const addresses = [
  { customerId: 1, province: "北京市", city: "朝阳区", address1: "建国路88号", postal: "100022" },
  { customerId: 2, province: "上海市", city: "浦东新区", address1: "陆家嘴环路1000号", postal: "200120" },
  { customerId: 3, province: "广东省", city: "深圳市", address1: "科技园南区", postal: "518000" },
  { customerId: 4, province: "浙江省", city: "杭州市", address1: "西湖区文三路", postal: "310000" },
  { customerId: 5, province: "四川省", city: "成都市", address1: "锦江区春熙路", postal: "610000" },
];

for (const addr of addresses) {
  sqlite.exec(`
    INSERT INTO customer_addresses (customer_id, first_name, last_name, province, city, address1, postal_code, country_code, is_default_shipping, is_default_billing)
    SELECT ${addr.customerId}, first_name, last_name, '${addr.province}', '${addr.city}', '${addr.address1}', '${addr.postal}', 'CN', 1, 1
    FROM customers WHERE id = ${addr.customerId}
  `);
}

// 9. 订单数据
console.log("🛒 插入订单数据...");
const orders = [
  { orderNumber: "ORD-00001", customerId: 1, email: "zhang.wei@example.com", subtotal: 19800, total: 19800, paymentStatus: "paid", fulfillmentStatus: "fulfilled", orderStatus: "completed" },
  { orderNumber: "ORD-00002", customerId: 2, email: "li.na@example.com", subtotal: 29900, total: 29900, paymentStatus: "paid", fulfillmentStatus: "fulfilled", orderStatus: "completed" },
  { orderNumber: "ORD-00003", customerId: 3, email: "wang.fang@example.com", subtotal: 59900, total: 59900, paymentStatus: "paid", fulfillmentStatus: "unfulfilled", orderStatus: "open" },
  { orderNumber: "ORD-00004", customerId: 1, email: "zhang.wei@example.com", subtotal: 129900, total: 129900, paymentStatus: "pending", fulfillmentStatus: "unfulfilled", orderStatus: "open" },
  { orderNumber: "ORD-00005", customerId: 4, email: "chen.jie@example.com", subtotal: 39900, total: 39900, paymentStatus: "paid", fulfillmentStatus: "unfulfilled", orderStatus: "open" },
  { orderNumber: "ORD-00006", customerId: 5, email: "liu.yang@example.com", subtotal: 9900, total: 9900, paymentStatus: "paid", fulfillmentStatus: "fulfilled", orderStatus: "completed" },
  { orderNumber: "ORD-00007", customerId: 2, email: "li.na@example.com", subtotal: 199900, total: 199900, paymentStatus: "paid", fulfillmentStatus: "unfulfilled", orderStatus: "open" },
  { orderNumber: "ORD-00008", customerId: 3, email: "wang.fang@example.com", subtotal: 49900, total: 49900, paymentStatus: "pending", fulfillmentStatus: "unfulfilled", orderStatus: "open" },
];

for (let i = 0; i < orders.length; i++) {
  const order = orders[i]!;
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  sqlite.exec(`
    INSERT INTO orders (order_number, customer_id, email, currency_code, subtotal_amount, total_amount, payment_status, fulfillment_status, order_status, placed_at)
    VALUES ('${order.orderNumber}', ${order.customerId}, '${order.email}', 'CNY', ${order.subtotal}, ${order.total}, '${order.paymentStatus}', '${order.fulfillmentStatus}', '${order.orderStatus}', datetime('now', '-${daysAgo} days'))
  `);
}

// 10. 订单项目
console.log("📋 插入订单项目...");
const orderItems = [
  { orderId: 1, productId: 1, variantId: 1, sku: "TEE-WHT-S", title: "经典白色T恤", variant: "白色 / S", qty: 2, price: 9900 },
  { orderId: 2, productId: 2, variantId: 6, sku: "JEANS-BLU-30", title: "修身牛仔裤", variant: "蓝色 / 30", qty: 1, price: 29900 },
  { orderId: 3, productId: 3, variantId: 9, sku: "SHOE-WHT-42", title: "运动跑鞋", variant: "白色 / 42", qty: 1, price: 59900 },
  { orderId: 4, productId: 4, variantId: 12, sku: "BAG-BRN-STD", title: "真皮手提包", variant: "默认", qty: 1, price: 129900 },
  { orderId: 5, productId: 5, variantId: 13, sku: "EAR-WHT", title: "无线蓝牙耳机", variant: "默认", qty: 1, price: 39900 },
  { orderId: 6, productId: 1, variantId: 4, sku: "TEE-BLK-S", title: "经典白色T恤", variant: "黑色 / S", qty: 1, price: 9900 },
  { orderId: 7, productId: 6, variantId: 14, sku: "WATCH-SLV-42", title: "智能手表", variant: "默认", qty: 1, price: 199900 },
  { orderId: 8, productId: 7, variantId: 15, sku: "BED-WHT-15", title: "纯棉床单套装", variant: "默认", qty: 1, price: 49900 },
];

for (const item of orderItems) {
  sqlite.exec(`
    INSERT INTO order_items (order_id, product_id, variant_id, sku, product_title, variant_title, quantity, unit_price_amount)
    VALUES (${item.orderId}, ${item.productId}, ${item.variantId}, '${item.sku}', '${item.title}', '${item.variant}', ${item.qty}, ${item.price})
  `);
}

// 11. 支付记录
console.log("💳 插入支付记录...");
for (let i = 0; i < orders.length; i++) {
  const order = orders[i]!;
  if (order.paymentStatus === "paid") {
    const daysAgo = Math.floor(Math.random() * 25) + 1;
    sqlite.exec(`
      INSERT INTO payments (order_id, provider, amount, currency_code, status, processed_at)
      VALUES (${i + 1}, 'alipay', ${order.total}, 'CNY', 'captured', datetime('now', '-${daysAgo} days'))
    `);
  }
}

// 12. 发货记录
console.log("🚚 插入发货记录...");
for (let i = 0; i < orders.length; i++) {
  const order = orders[i]!;
  if (order.fulfillmentStatus === "fulfilled") {
    const daysAgo = Math.floor(Math.random() * 20) + 1;
    sqlite.exec(`
      INSERT INTO shipments (order_id, carrier, service, tracking_number, status, shipped_at)
      VALUES (${i + 1}, '顺丰速运', '标准快递', 'SF${1000000000 + i + 1}', 'delivered', datetime('now', '-${daysAgo} days'))
    `);
  }
}

// 13. 促销活动
console.log("🎁 插入促销活动...");
sqlite.exec(`
  INSERT INTO promotions (name, type, status, starts_at, ends_at, usage_limit, rules_json)
  VALUES 
    ('新用户首单9折', 'percentage', 'active', datetime('now', '-30 days'), datetime('now', '+60 days'), 1000, '{"discountPercent": 10}'),
    ('满300减50', 'fixed_amount', 'active', datetime('now', '-15 days'), datetime('now', '+45 days'), 500, '{"minAmount": 30000, "discountAmount": 5000}'),
    ('夏季大促', 'percentage', 'draft', datetime('now', '+30 days'), datetime('now', '+90 days'), NULL, '{"discountPercent": 20}')
`);

// 14. 折扣码
console.log("🏷️  插入折扣码...");
sqlite.exec(`
  INSERT INTO discount_codes (code, promotion_id, usage_limit)
  VALUES 
    ('WELCOME10', 1, 100),
    ('SAVE50', 2, 50),
    ('SUMMER20', 3, 200)
`);

// 15. 集合
console.log("📚 插入集合...");
sqlite.exec(`
  INSERT INTO collections (title, slug, status, description_html, published_at)
  VALUES 
    ('新品上市', 'new-arrivals', 'active', '<p>最新上架的商品</p>', datetime('now')),
    ('热销商品', 'best-sellers', 'active', '<p>最受欢迎的商品</p>', datetime('now')),
    ('电子产品', 'electronics', 'active', '<p>各类电子产品</p>', datetime('now'))
`);

// 16. 集合商品关联
console.log("🔗 插入集合商品关联...");
sqlite.exec(`
  INSERT INTO collection_products (collection_id, product_id, sort_order)
  VALUES 
    (1, 1, 1), (1, 2, 2), (1, 5, 3), (1, 6, 4),
    (2, 1, 1), (2, 3, 2), (2, 4, 3), (2, 5, 4),
    (3, 5, 1), (3, 6, 2)
`);

// 17. 页面
console.log("📄 插入页面...");
sqlite.exec(`
  INSERT INTO pages (title, slug, status, seo_title, seo_description, content_json, published_at)
  VALUES 
    ('关于我们', 'about-us', 'active', '关于我们 - OpenShop', '了解OpenShop的故事和使命', '{"blocks":[{"type":"text","content":"OpenShop是一个现代化的电商平台..."}]}', datetime('now')),
    ('隐私政策', 'privacy-policy', 'active', '隐私政策 - OpenShop', 'OpenShop隐私保护政策', '{"blocks":[{"type":"text","content":"我们重视您的隐私..."}]}', datetime('now')),
    ('退换货政策', 'return-policy', 'active', '退换货政策 - OpenShop', '了解我们的退换货流程', '{"blocks":[{"type":"text","content":"7天无理由退换货..."}]}', datetime('now'))
`);

// 18. 菜单
console.log("📋 插入菜单...");
sqlite.exec(`
  INSERT INTO menus (name, handle)
  VALUES 
    ('主导航', 'main-nav'),
    ('页脚导航', 'footer-nav')
`);

// 19. 菜单项
console.log("🔗 插入菜单项...");
sqlite.exec(`
  INSERT INTO menu_items (menu_id, title, link_type, link_target, sort_order)
  VALUES 
    (1, '首页', 'home', '/', 1),
    (1, '商品', 'collection', '/collections/all', 2),
    (1, '新品', 'collection', '/collections/new-arrivals', 3),
    (1, '关于我们', 'page', '/pages/about-us', 4),
    (2, '隐私政策', 'page', '/pages/privacy-policy', 1),
    (2, '退换货政策', 'page', '/pages/return-policy', 2),
    (2, '联系我们', 'page', '/pages/contact', 3)
`);

console.log("\n✅ 数据播种完成！");
console.log("\n📊 数据统计：");
console.log(`   - 商品: ${products.length} 个 (7个已上架, 1个草稿)`);
console.log(`   - 变体: ${totalVariants} 个`);
console.log(`   - 选项: 6 个 (颜色、尺寸、尺码)`);
console.log(`   - 选项值: 13 个`);
console.log(`   - 客户: ${customers.length} 个`);
console.log(`   - 订单: ${orders.length} 个`);
console.log(`   - 促销: 3 个`);
console.log(`   - 折扣码: 3 个`);
console.log(`   - 集合: 3 个`);
console.log(`   - 页面: 3 个`);
console.log(`   - 菜单: 2 个`);

process.exit(0);