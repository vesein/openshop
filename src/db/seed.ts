/**
 * 演示数据播种。依赖已 migrate 的库（无库存触发器时需显式写入 inventory_levels）。
 * 用法: bun src/db/seed.ts（或 bun run db:seed）
 */
import { sqlite } from "./index";

/** 按外键依赖逆序删除（子表 → 父表） */
const TABLES = [
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
] as const;

function clearTables() {
  for (const table of TABLES) {
    sqlite.exec(`DELETE FROM ${table}`);
  }
}

/** 确定性库存：可复现、便于调试（替代 Math.random） */
function stockForVariantIndex(i: number) {
  const onHand = 10 + ((i * 17) % 90);
  const reserved = (i * 3) % 6;
  return { onHand, reserved };
}

function main() {
  console.log("🗑️  清理现有数据...");
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    clearTables();

    console.log("📝 插入商店设置...");
    const insShop = sqlite.prepare(`
      INSERT INTO shop_settings (id, shop_name, shop_description, currency_code, locale, timezone, support_email, order_prefix, weight_unit)
      VALUES (1, ?, ?, 'CNY', 'zh-CN', 'Asia/Shanghai', 'support@openshop.com', 'ORD', 'kg')
    `);
    insShop.run("OpenShop 演示商店", "一个现代化的电商平台演示");

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

    console.log("📦 插入商品数据...");
    const insProduct = sqlite.prepare(`
      INSERT INTO products (title, slug, status, product_type, vendor, description_html, seo_title, seo_description)
      VALUES (?, ?, 'draft', ?, ?, ?, ?, ?)
    `);
    for (const p of products) {
      const desc = `<p>${p.title} - 高品质产品，值得信赖。</p>`;
      const seo = `${p.title} - OpenShop精选`;
      insProduct.run(p.title, p.slug, p.type, p.vendor, desc, p.title, seo);
    }

    console.log("⚙️  插入商品选项...");
    const insOpt = sqlite.prepare(
      `INSERT INTO product_options (product_id, name, sort_order) VALUES (?, ?, ?)`,
    );
    const insOptVal = sqlite.prepare(
      `INSERT INTO product_option_values (option_id, value, sort_order) VALUES (?, ?, ?)`,
    );

    insOpt.run(1, "颜色", 1);
    insOpt.run(1, "尺寸", 2);
    insOptVal.run(1, "白色", 1);
    insOptVal.run(1, "黑色", 2);
    insOptVal.run(2, "S", 1);
    insOptVal.run(2, "M", 2);
    insOptVal.run(2, "L", 3);

    insOpt.run(2, "颜色", 1);
    insOpt.run(2, "尺寸", 2);
    insOptVal.run(3, "蓝色", 1);
    insOptVal.run(3, "黑色", 2);
    insOptVal.run(4, "30", 1);
    insOptVal.run(4, "32", 2);

    insOpt.run(3, "颜色", 1);
    insOpt.run(3, "尺码", 2);
    insOptVal.run(5, "白色", 1);
    insOptVal.run(5, "黑色", 2);
    insOptVal.run(6, "42", 1);
    insOptVal.run(6, "43", 2);

    const variantsWithOptions: {
      productId: number;
      title: string;
      sku: string;
      price: number;
      isDefault: number;
      optionValues: number[];
    }[] = [
      { productId: 1, title: "白色 / S", sku: "TEE-WHT-S", price: 9900, isDefault: 1, optionValues: [1, 3] },
      { productId: 1, title: "白色 / M", sku: "TEE-WHT-M", price: 9900, isDefault: 0, optionValues: [1, 4] },
      { productId: 1, title: "白色 / L", sku: "TEE-WHT-L", price: 9900, isDefault: 0, optionValues: [1, 5] },
      { productId: 1, title: "黑色 / S", sku: "TEE-BLK-S", price: 9900, isDefault: 0, optionValues: [2, 3] },
      { productId: 1, title: "黑色 / M", sku: "TEE-BLK-M", price: 9900, isDefault: 0, optionValues: [2, 4] },
      { productId: 2, title: "蓝色 / 30", sku: "JEANS-BLU-30", price: 29900, isDefault: 1, optionValues: [6, 8] },
      { productId: 2, title: "蓝色 / 32", sku: "JEANS-BLU-32", price: 29900, isDefault: 0, optionValues: [6, 9] },
      { productId: 2, title: "黑色 / 30", sku: "JEANS-BLK-30", price: 29900, isDefault: 0, optionValues: [7, 8] },
      { productId: 3, title: "白色 / 42", sku: "SHOE-WHT-42", price: 59900, isDefault: 1, optionValues: [10, 12] },
      { productId: 3, title: "白色 / 43", sku: "SHOE-WHT-43", price: 59900, isDefault: 0, optionValues: [10, 13] },
      { productId: 3, title: "黑色 / 42", sku: "SHOE-BLK-42", price: 59900, isDefault: 0, optionValues: [11, 12] },
    ];

    const variantsWithoutOptions = [
      { productId: 4, title: "默认", sku: "BAG-BRN-STD", price: 129900, isDefault: 1 },
      { productId: 5, title: "默认", sku: "EAR-WHT", price: 39900, isDefault: 1 },
      { productId: 6, title: "默认", sku: "WATCH-SLV-42", price: 199900, isDefault: 1 },
      { productId: 7, title: "默认", sku: "BED-WHT-15", price: 49900, isDefault: 1 },
      { productId: 8, title: "默认", sku: "MUG-WHT-350", price: 4900, isDefault: 1 },
    ];

    console.log("🎨 插入商品变体...");
    const insVariant = sqlite.prepare(`
      INSERT INTO product_variants (product_id, title, sku, price_amount, is_default, requires_shipping, taxable)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `);
    const insVov = sqlite.prepare(
      `INSERT INTO variant_option_values (variant_id, option_value_id) VALUES (?, ?)`,
    );

    for (const v of variantsWithOptions) {
      const { lastInsertRowid } = insVariant.run(
        v.productId,
        v.title,
        v.sku,
        v.price,
        v.isDefault,
      );
      const vid = Number(lastInsertRowid);
      for (const povId of v.optionValues) {
        insVov.run(vid, povId);
      }
    }
    for (const v of variantsWithoutOptions) {
      insVariant.run(v.productId, v.title, v.sku, v.price, v.isDefault);
    }

    const totalVariants = variantsWithOptions.length + variantsWithoutOptions.length;

    console.log("📊 插入库存（inventory_items + inventory_levels）...");
    const insInvItem = sqlite.prepare(`
      INSERT INTO inventory_items (variant_id, tracked, allow_backorder) VALUES (?, 1, 0)
    `);
    const insInvLevel = sqlite.prepare(`
      INSERT INTO inventory_levels (inventory_item_id, on_hand, reserved) VALUES (?, ?, ?)
    `);
    for (let i = 1; i <= totalVariants; i++) {
      const { lastInsertRowid } = insInvItem.run(i);
      const inventoryItemId = Number(lastInsertRowid);
      const { onHand, reserved } = stockForVariantIndex(i);
      insInvLevel.run(inventoryItemId, onHand, reserved);
    }

    console.log("✅ 激活商品...");
    const activate = sqlite.prepare(
      `UPDATE products SET status = 'active', published_at = datetime('now') WHERE id = ?`,
    );
    for (const id of [1, 2, 3, 4, 5, 7, 8]) {
      activate.run(id);
    }

    console.log("👥 插入客户数据...");
    const insCustomer = sqlite.prepare(`
      INSERT INTO customers (email, phone, first_name, last_name, accepts_marketing)
      VALUES (?, ?, ?, ?, ?)
    `);
    const customerRows = [
      ["zhang.wei@example.com", "13800138001", "张", "伟", 1],
      ["li.na@example.com", "13800138002", "李", "娜", 1],
      ["wang.fang@example.com", "13800138003", "王", "芳", 0],
      ["chen.jie@example.com", "13800138004", "陈", "杰", 1],
      ["liu.yang@example.com", "13800138005", "刘", "洋", 0],
    ] as const;
    for (const row of customerRows) {
      insCustomer.run(row[0], row[1], row[2], row[3], row[4]);
    }

    console.log("📍 插入客户地址...");
    const insAddr = sqlite.prepare(`
      INSERT INTO customer_addresses (
        customer_id, first_name, last_name, province, city, address1, postal_code, country_code,
        is_default_shipping, is_default_billing
      )
      SELECT ?, first_name, last_name, ?, ?, ?, ?, 'CN', 1, 1
      FROM customers WHERE id = ?
    `);
    const addrData: { customerId: number; province: string; city: string; address1: string; postal: string }[] = [
      { customerId: 1, province: "北京市", city: "朝阳区", address1: "建国路88号", postal: "100022" },
      { customerId: 2, province: "上海市", city: "浦东新区", address1: "陆家嘴环路1000号", postal: "200120" },
      { customerId: 3, province: "广东省", city: "深圳市", address1: "科技园南区", postal: "518000" },
      { customerId: 4, province: "浙江省", city: "杭州市", address1: "西湖区文三路", postal: "310000" },
      { customerId: 5, province: "四川省", city: "成都市", address1: "锦江区春熙路", postal: "610000" },
    ];
    for (const a of addrData) {
      insAddr.run(a.customerId, a.province, a.city, a.address1, a.postal, a.customerId);
    }

    const orderRows = [
      { orderNumber: "ORD-00001", customerId: 1, email: "zhang.wei@example.com", subtotal: 19800, total: 19800, paymentStatus: "paid", fulfillmentStatus: "fulfilled", orderStatus: "completed", daysAgo: 12 },
      { orderNumber: "ORD-00002", customerId: 2, email: "li.na@example.com", subtotal: 29900, total: 29900, paymentStatus: "paid", fulfillmentStatus: "fulfilled", orderStatus: "completed", daysAgo: 10 },
      { orderNumber: "ORD-00003", customerId: 3, email: "wang.fang@example.com", subtotal: 59900, total: 59900, paymentStatus: "paid", fulfillmentStatus: "unfulfilled", orderStatus: "open", daysAgo: 8 },
      { orderNumber: "ORD-00004", customerId: 1, email: "zhang.wei@example.com", subtotal: 129900, total: 129900, paymentStatus: "pending", fulfillmentStatus: "unfulfilled", orderStatus: "open", daysAgo: 5 },
      { orderNumber: "ORD-00005", customerId: 4, email: "chen.jie@example.com", subtotal: 39900, total: 39900, paymentStatus: "paid", fulfillmentStatus: "unfulfilled", orderStatus: "open", daysAgo: 4 },
      { orderNumber: "ORD-00006", customerId: 5, email: "liu.yang@example.com", subtotal: 9900, total: 9900, paymentStatus: "paid", fulfillmentStatus: "fulfilled", orderStatus: "completed", daysAgo: 3 },
      { orderNumber: "ORD-00007", customerId: 2, email: "li.na@example.com", subtotal: 199900, total: 199900, paymentStatus: "paid", fulfillmentStatus: "unfulfilled", orderStatus: "open", daysAgo: 2 },
      { orderNumber: "ORD-00008", customerId: 3, email: "wang.fang@example.com", subtotal: 49900, total: 49900, paymentStatus: "pending", fulfillmentStatus: "unfulfilled", orderStatus: "open", daysAgo: 1 },
    ];

    console.log("🛒 插入订单数据...");
    const insOrder = sqlite.prepare(`
      INSERT INTO orders (order_number, customer_id, email, currency_code, subtotal_amount, total_amount, payment_status, fulfillment_status, order_status, placed_at)
      VALUES (?, ?, ?, 'CNY', ?, ?, ?, ?, ?, datetime('now', ?))
    `);
    for (const o of orderRows) {
      insOrder.run(
        o.orderNumber,
        o.customerId,
        o.email,
        o.subtotal,
        o.total,
        o.paymentStatus,
        o.fulfillmentStatus,
        o.orderStatus,
        `-${o.daysAgo} days`,
      );
    }

    console.log("📋 插入订单项目...");
    const insOi = sqlite.prepare(`
      INSERT INTO order_items (order_id, product_id, variant_id, sku, product_title, variant_title, quantity, unit_price_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const orderItems: {
      orderId: number;
      productId: number;
      variantId: number;
      sku: string;
      title: string;
      variant: string;
      qty: number;
      price: number;
    }[] = [
      { orderId: 1, productId: 1, variantId: 1, sku: "TEE-WHT-S", title: "经典白色T恤", variant: "白色 / S", qty: 2, price: 9900 },
      { orderId: 2, productId: 2, variantId: 6, sku: "JEANS-BLU-30", title: "修身牛仔裤", variant: "蓝色 / 30", qty: 1, price: 29900 },
      { orderId: 3, productId: 3, variantId: 9, sku: "SHOE-WHT-42", title: "运动跑鞋", variant: "白色 / 42", qty: 1, price: 59900 },
      { orderId: 4, productId: 4, variantId: 12, sku: "BAG-BRN-STD", title: "真皮手提包", variant: "默认", qty: 1, price: 129900 },
      { orderId: 5, productId: 5, variantId: 13, sku: "EAR-WHT", title: "无线蓝牙耳机", variant: "默认", qty: 1, price: 39900 },
      { orderId: 6, productId: 1, variantId: 4, sku: "TEE-BLK-S", title: "经典白色T恤", variant: "黑色 / S", qty: 1, price: 9900 },
      { orderId: 7, productId: 6, variantId: 14, sku: "WATCH-SLV-42", title: "智能手表", variant: "默认", qty: 1, price: 199900 },
      { orderId: 8, productId: 7, variantId: 15, sku: "BED-WHT-15", title: "纯棉床单套装", variant: "默认", qty: 1, price: 49900 },
    ];
    for (const it of orderItems) {
      insOi.run(it.orderId, it.productId, it.variantId, it.sku, it.title, it.variant, it.qty, it.price);
    }

    console.log("💳 插入支付记录...");
    const insPay = sqlite.prepare(`
      INSERT INTO payments (order_id, provider, amount, currency_code, status, processed_at)
      VALUES (?, 'alipay', ?, 'CNY', 'captured', datetime('now', ?))
    `);
    orderRows.forEach((o, i) => {
      if (o.paymentStatus === "paid") {
        const d = Math.min(o.daysAgo, 25);
        insPay.run(i + 1, o.total, `-${d} days`);
      }
    });

    console.log("🚚 插入发货记录...");
    const insShip = sqlite.prepare(`
      INSERT INTO shipments (order_id, carrier, service, tracking_number, status, shipped_at)
      VALUES (?, '顺丰速运', '标准快递', ?, 'delivered', datetime('now', ?))
    `);
    orderRows.forEach((o, i) => {
      if (o.fulfillmentStatus === "fulfilled") {
        const d = Math.min(o.daysAgo, 20);
        insShip.run(i + 1, `SF${1000000000 + i + 1}`, `-${d} days`);
      }
    });

    console.log("🎁 插入促销活动 / 折扣码 / 集合 / 页面 / 菜单...");
    sqlite.exec(`
      INSERT INTO promotions (name, type, status, starts_at, ends_at, usage_limit, rules_json, discount_value, min_purchase_amount)
      VALUES
        ('新用户首单9折', 'percentage', 'active', datetime('now', '-30 days'), datetime('now', '+60 days'), 1000, '{"discountPercent": 10}', 10, 0),
        ('满300减50', 'fixed_amount', 'active', datetime('now', '-15 days'), datetime('now', '+45 days'), 500, '{"minAmount": 30000, "discountAmount": 5000}', 5000, 30000),
        ('夏季大促', 'percentage', 'draft', datetime('now', '+30 days'), datetime('now', '+90 days'), NULL, '{"discountPercent": 20}', 20, 0);
      INSERT INTO discount_codes (code, promotion_id, usage_limit)
      VALUES ('WELCOME10', 1, 100), ('SAVE50', 2, 50), ('SUMMER20', 3, 200);
      INSERT INTO collections (title, slug, status, description_html, published_at)
      VALUES
        ('新品上市', 'new-arrivals', 'active', '<p>最新上架的商品</p>', datetime('now')),
        ('热销商品', 'best-sellers', 'active', '<p>最受欢迎的商品</p>', datetime('now')),
        ('电子产品', 'electronics', 'active', '<p>各类电子产品</p>', datetime('now'));
      INSERT INTO collection_products (collection_id, product_id, sort_order)
      VALUES
        (1, 1, 1), (1, 2, 2), (1, 5, 3), (1, 6, 4),
        (2, 1, 1), (2, 3, 2), (2, 4, 3), (2, 5, 4),
        (3, 5, 1), (3, 6, 2);
      INSERT INTO pages (title, slug, status, seo_title, seo_description, content_json, published_at)
      VALUES
        ('关于我们', 'about-us', 'active', '关于我们 - OpenShop', '了解OpenShop的故事和使命', '{"blocks":[{"type":"text","content":"OpenShop是一个现代化的电商平台..."}]}', datetime('now')),
        ('隐私政策', 'privacy-policy', 'active', '隐私政策 - OpenShop', 'OpenShop隐私保护政策', '{"blocks":[{"type":"text","content":"我们重视您的隐私..."}]}', datetime('now')),
        ('退换货政策', 'return-policy', 'active', '退换货政策 - OpenShop', '了解我们的退换货流程', '{"blocks":[{"type":"text","content":"7天无理由退换货..."}]}', datetime('now'));
      INSERT INTO menus (name, handle) VALUES ('主导航', 'main-nav'), ('页脚导航', 'footer-nav');
      INSERT INTO menu_items (menu_id, title, link_type, link_target, sort_order) VALUES
        (1, '首页', 'home', '/', 1),
        (1, '商品', 'collection', '/collections/all', 2),
        (1, '新品', 'collection', '/collections/new-arrivals', 3),
        (1, '关于我们', 'page', '/pages/about-us', 4),
        (2, '隐私政策', 'page', '/pages/privacy-policy', 1),
        (2, '退换货政策', 'page', '/pages/return-policy', 2),
        (2, '联系我们', 'external', 'mailto:support@openshop.com', 3);
    `);

    sqlite.exec("COMMIT");
  } catch (e) {
    sqlite.exec("ROLLBACK");
    console.error("播种失败，已回滚:", e);
    throw e;
  }

  console.log("\n✅ 数据播种完成！");
  console.log("\n📊 数据统计：");
  console.log("   - 商品: 8 个（7 个已上架，1 个草稿：智能手表）");
  console.log("   - 变体: 17 个");
  console.log("   - 客户: 5 个 | 订单: 8 个");
  console.log("   - 促销: 3 个 | 折扣码: 3 个 | 集合: 3 个 | 页面: 3 个 | 菜单: 2 个");
}

main();
