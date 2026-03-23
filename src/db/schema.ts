import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  primaryKey,
  index,
  check,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

/** 与 migrations/0001_baseline.sql 对齐（约束、索引、复合外键）。 */

// =========================================================
// shop_settings
// =========================================================
export const shopSettings = sqliteTable(
  "shop_settings",
  {
    id: integer("id").primaryKey(),
    shopName: text("shop_name").notNull(),
    shopDescription: text("shop_description").notNull().default(""),
    currencyCode: text("currency_code").notNull().default("USD"),
    locale: text("locale").notNull().default("en"),
    timezone: text("timezone").notNull().default("UTC"),
    supportEmail: text("support_email").notNull().default(""),
    orderPrefix: text("order_prefix").notNull().default("ORD"),
    weightUnit: text("weight_unit").notNull().default("kg"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("shop_settings_id_check", sql`${t.id} = 1`),
    check(
      "shop_settings_weight_unit_check",
      sql`${t.weightUnit} IN ('g', 'kg', 'oz', 'lb')`,
    ),
  ],
);

// =========================================================
// media_assets
// =========================================================
export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: integer("id").primaryKey(),
    kind: text("kind").notNull(),
    storageKey: text("storage_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes").notNull().default(0),
    alt: text("alt").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [check("media_assets_kind_check", sql`${t.kind} IN ('image', 'video', 'file')`)],
);

// =========================================================
// products
// =========================================================
export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("draft"),
    productType: text("product_type").notNull().default(""),
    vendor: text("vendor").notNull().default(""),
    descriptionHtml: text("description_html").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    featuredMediaId: integer("featured_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    check("products_status_check", sql`${t.status} IN ('draft', 'active', 'archived')`),
    uniqueIndex("products_slug_unique").on(sql`lower(${t.slug})`),
    index("idx_products_status_published").on(t.status, sql`${t.publishedAt} DESC`),
    index("idx_products_product_type").on(t.productType),
    index("idx_products_vendor").on(t.vendor),
  ],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: integer("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Default Title"),
    sku: text("sku").notNull().unique(),
    barcode: text("barcode").notNull().default(""),
    priceAmount: integer("price_amount").notNull().default(0),
    compareAtAmount: integer("compare_at_amount"),
    costAmount: integer("cost_amount"),
    weightValue: integer("weight_value"),
    requiresShipping: integer("requires_shipping").notNull().default(1),
    taxable: integer("taxable").notNull().default(1),
    isDefault: integer("is_default").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    optionSignature: text("option_signature"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("product_variants_price_amount_check", sql`${t.priceAmount} >= 0`),
    check(
      "product_variants_compare_at_check",
      sql`${t.compareAtAmount} IS NULL OR ${t.compareAtAmount} >= 0`,
    ),
    check(
      "product_variants_cost_check",
      sql`${t.costAmount} IS NULL OR ${t.costAmount} >= 0`,
    ),
    check(
      "product_variants_weight_check",
      sql`${t.weightValue} IS NULL OR ${t.weightValue} >= 0`,
    ),
    check("product_variants_requires_shipping_check", sql`${t.requiresShipping} IN (0, 1)`),
    check("product_variants_taxable_check", sql`${t.taxable} IN (0, 1)`),
    check("product_variants_is_default_check", sql`${t.isDefault} IN (0, 1)`),
    index("idx_product_variants_product").on(t.productId, t.sortOrder, t.id),
    uniqueIndex("uq_product_variants_default")
      .on(t.productId)
      .where(sql`${t.isDefault} = 1`),
    uniqueIndex("uq_product_variants_option_signature")
      .on(t.productId, t.optionSignature)
      .where(sql`${t.optionSignature} IS NOT NULL`),
    uniqueIndex("uq_product_variants_barcode")
      .on(t.barcode)
      .where(sql`${t.barcode} != ''`),
  ],
);

export const productOptions = sqliteTable(
  "product_options",
  {
    id: integer("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("uq_product_options_product_name").on(t.productId, t.name),
    index("idx_product_options_product").on(t.productId, t.sortOrder, t.id),
  ],
);

export const productOptionValues = sqliteTable(
  "product_option_values",
  {
    id: integer("id").primaryKey(),
    optionId: integer("option_id").notNull().references(() => productOptions.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("uq_product_option_values_option_value").on(t.optionId, t.value),
    index("idx_product_option_values_option").on(t.optionId, t.sortOrder, t.id),
  ],
);

export const variantOptionValues = sqliteTable(
  "variant_option_values",
  {
    variantId: integer("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: integer("option_value_id").notNull().references(() => productOptionValues.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.variantId, t.optionValueId] }),
    index("idx_variant_option_values_option_value").on(t.optionValueId, t.variantId),
  ],
);

export const productMedia = sqliteTable(
  "product_media",
  {
    id: integer("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    mediaId: integer("media_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("uq_product_media_product_media").on(t.productId, t.mediaId),
    index("idx_product_media_product").on(t.productId, t.sortOrder, t.id),
    index("idx_product_media_variant").on(t.variantId, t.sortOrder, t.id),
  ],
);

// =========================================================
// collections
// =========================================================
export const collections = sqliteTable(
  "collections",
  {
    id: integer("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("draft"),
    descriptionHtml: text("description_html").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("collections_status_check", sql`${t.status} IN ('draft', 'active', 'archived')`),
    uniqueIndex("collections_slug_unique").on(sql`lower(${t.slug})`),
    index("idx_collections_status_published").on(t.status, sql`${t.publishedAt} DESC`),
  ],
);

export const collectionProducts = sqliteTable(
  "collection_products",
  {
    collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.productId] }),
    index("idx_collection_products_collection").on(t.collectionId, t.sortOrder, t.productId),
    index("idx_collection_products_product").on(t.productId, t.collectionId),
  ],
);

// =========================================================
// promotions
// =========================================================
export const promotions = sqliteTable(
  "promotions",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    status: text("status").notNull().default("draft"),
    startsAt: text("starts_at"),
    endsAt: text("ends_at"),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").notNull().default(0),
    oncePerCustomer: integer("once_per_customer").notNull().default(0),
    rulesJson: text("rules_json").notNull().default("{}"),
    discountValue: integer("discount_value").notNull().default(0),
    minPurchaseAmount: integer("min_purchase_amount").notNull().default(0),
    buyQuantity: integer("buy_quantity"),
    getQuantity: integer("get_quantity"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check(
      "promotions_type_check",
      sql`${t.type} IN ('percentage', 'fixed_amount', 'free_shipping', 'bogo')`,
    ),
    check("promotions_status_check", sql`${t.status} IN ('draft', 'active', 'archived')`),
    check("promotions_once_per_customer_check", sql`${t.oncePerCustomer} IN (0, 1)`),
    check(
      "promotions_rules_json_check",
      sql`CASE WHEN json_valid(${t.rulesJson}) THEN json_type(${t.rulesJson}) = 'object' ELSE 0 END`,
    ),
    check("promotions_discount_value_check", sql`${t.discountValue} >= 0`),
    check("promotions_min_purchase_amount_check", sql`${t.minPurchaseAmount} >= 0`),
    check("promotions_buy_quantity_check", sql`${t.buyQuantity} IS NULL OR ${t.buyQuantity} > 0`),
    check("promotions_get_quantity_check", sql`${t.getQuantity} IS NULL OR ${t.getQuantity} > 0`),
    index("idx_promotions_status_dates").on(t.status, t.startsAt, t.endsAt),
  ],
);

export const discountCodes = sqliteTable(
  "discount_codes",
  {
    id: integer("id").primaryKey(),
    code: text("code").notNull(),
    promotionId: integer("promotion_id").notNull().references(() => promotions.id, { onDelete: "cascade" }),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("discount_codes_code_unique").on(sql`lower(${t.code})`),
    index("idx_discount_codes_promotion").on(t.promotionId),
  ],
);

export const orderDiscountCodes = sqliteTable(
  "order_discount_codes",
  {
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    discountCodeId: integer("discount_code_id").notNull().references(() => discountCodes.id, { onDelete: "restrict" }),
    promotionId: integer("promotion_id").notNull().references(() => promotions.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.orderId, t.discountCodeId] }),
    index("idx_order_discount_codes_order").on(t.orderId),
    index("idx_order_discount_codes_promotion").on(t.promotionId),
  ],
);

// =========================================================
// inventory
// =========================================================
export const inventoryItems = sqliteTable(
  "inventory_items",
  {
    id: integer("id").primaryKey(),
    variantId: integer("variant_id").notNull().unique().references(() => productVariants.id, { onDelete: "cascade" }),
    tracked: integer("tracked").notNull().default(1),
    allowBackorder: integer("allow_backorder").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("inventory_items_tracked_check", sql`${t.tracked} IN (0, 1)`),
    check("inventory_items_allow_backorder_check", sql`${t.allowBackorder} IN (0, 1)`),
  ],
);

export const inventoryLevels = sqliteTable(
  "inventory_levels",
  {
    inventoryItemId: integer("inventory_item_id")
      .primaryKey()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("inventory_levels_on_hand_check", sql`${t.onHand} >= 0`),
    check("inventory_levels_reserved_check", sql`${t.reserved} >= 0`),
  ],
);

export const inventoryMovements = sqliteTable(
  "inventory_movements",
  {
    id: integer("id").primaryKey(),
    inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    movementType: text("movement_type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    referenceType: text("reference_type"),
    referenceId: integer("reference_id"),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check(
      "inventory_movements_type_check",
      sql`${t.movementType} IN ('in', 'reserve', 'release', 'sold', 'returned', 'adjust')`,
    ),
    check(
      "inventory_movements_reference_type_check",
      sql`${t.referenceType} IS NULL OR ${t.referenceType} IN ('order', 'manual', 'refund', 'cart_expiry')`,
    ),
    check("inventory_movements_quantity_nonzero", sql`${t.quantityDelta} <> 0`),
    index("idx_inventory_movements_item_created").on(t.inventoryItemId, sql`${t.createdAt} DESC`),
    index("idx_inventory_movements_reference").on(t.referenceType, t.referenceId),
  ],
);

// =========================================================
// customers
// =========================================================
export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    acceptsMarketing: integer("accepts_marketing").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("customers_email_unique").on(sql`lower(${t.email})`),
    check("customers_accepts_marketing_check", sql`${t.acceptsMarketing} IN (0, 1)`),
    index("idx_customers_created").on(sql`${t.createdAt} DESC`),
  ],
);

export const customerAddresses = sqliteTable(
  "customer_addresses",
  {
    id: integer("id").primaryKey(),
    customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    company: text("company").notNull().default(""),
    phone: text("phone").notNull().default(""),
    countryCode: text("country_code").notNull().default(""),
    province: text("province").notNull().default(""),
    city: text("city").notNull().default(""),
    address1: text("address1").notNull().default(""),
    address2: text("address2").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    isDefaultShipping: integer("is_default_shipping").notNull().default(0),
    isDefaultBilling: integer("is_default_billing").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("customer_addresses_default_shipping_check", sql`${t.isDefaultShipping} IN (0, 1)`),
    check("customer_addresses_default_billing_check", sql`${t.isDefaultBilling} IN (0, 1)`),
    index("idx_customer_addresses_customer").on(t.customerId, t.id),
    uniqueIndex("uq_customer_addresses_default_shipping")
      .on(t.customerId)
      .where(sql`${t.isDefaultShipping} = 1`),
    uniqueIndex("uq_customer_addresses_default_billing")
      .on(t.customerId)
      .where(sql`${t.isDefaultBilling} = 1`),
  ],
);

// =========================================================
// carts
// =========================================================
export const carts = sqliteTable(
  "carts",
  {
    id: integer("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    sessionToken: text("session_token").notNull().unique(),
    currencyCode: text("currency_code").notNull(),
    status: text("status").notNull().default("active"),
    expiresAt: text("expires_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("carts_status_check", sql`${t.status} IN ('active', 'converted', 'abandoned')`),
    index("idx_carts_customer").on(t.customerId, sql`${t.updatedAt} DESC`),
    index("idx_carts_status_expires").on(t.status, t.expiresAt),
  ],
);

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: integer("id").primaryKey(),
    cartId: integer("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    variantId: integer("variant_id").notNull().references(() => productVariants.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPriceAmount: integer("unit_price_amount").notNull().default(0),
    discountAmount: integer("discount_amount").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("uq_cart_items_cart_variant").on(t.cartId, t.variantId),
    check("cart_items_quantity_check", sql`${t.quantity} > 0`),
    check("cart_items_unit_price_check", sql`${t.unitPriceAmount} >= 0`),
    check("cart_items_discount_check", sql`${t.discountAmount} >= 0`),
    index("idx_cart_items_cart").on(t.cartId, t.id),
  ],
);

// =========================================================
// orders
// =========================================================
export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    currencyCode: text("currency_code").notNull(),
    subtotalAmount: integer("subtotal_amount").notNull().default(0),
    discountAmount: integer("discount_amount").notNull().default(0),
    orderDiscountAmount: integer("order_discount_amount").notNull().default(0),
    shippingAmount: integer("shipping_amount").notNull().default(0),
    shippingDiscountAmount: integer("shipping_discount_amount").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull().default(0),
    paymentStatus: text("payment_status").notNull().default("pending"),
    fulfillmentStatus: text("fulfillment_status").notNull().default("unfulfilled"),
    orderStatus: text("order_status").notNull().default("open"),
    billingAddressJson: text("billing_address_json").notNull().default("{}"),
    shippingAddressJson: text("shipping_address_json").notNull().default("{}"),
    placedAt: text("placed_at"),
    cancelledAt: text("cancelled_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("orders_subtotal_check", sql`${t.subtotalAmount} >= 0`),
    check("orders_discount_check", sql`${t.discountAmount} >= 0`),
    check("orders_order_discount_check", sql`${t.orderDiscountAmount} >= 0`),
    check("orders_shipping_check", sql`${t.shippingAmount} >= 0`),
    check("orders_shipping_discount_check", sql`${t.shippingDiscountAmount} >= 0`),
    check("orders_tax_check", sql`${t.taxAmount} >= 0`),
    check("orders_total_check", sql`${t.totalAmount} >= 0`),
    check(
      "orders_payment_status_check",
      sql`${t.paymentStatus} IN ('pending', 'authorized', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'failed')`,
    ),
    check(
      "orders_fulfillment_status_check",
      sql`${t.fulfillmentStatus} IN ('unfulfilled', 'fulfilled', 'returned')`,
    ),
    check(
      "orders_order_status_check",
      sql`${t.orderStatus} IN ('open', 'completed', 'cancelled')`,
    ),
    check(
      "orders_billing_json_check",
      sql`CASE WHEN json_valid(${t.billingAddressJson}) THEN json_type(${t.billingAddressJson}) = 'object' ELSE 0 END`,
    ),
    check(
      "orders_shipping_json_check",
      sql`CASE WHEN json_valid(${t.shippingAddressJson}) THEN json_type(${t.shippingAddressJson}) = 'object' ELSE 0 END`,
    ),
    check(
      "orders_customer_or_email_check",
      sql`${t.customerId} IS NOT NULL OR ${t.email} != ''`,
    ),
    check(
      "orders_shipping_discount_lte_shipping_check",
      sql`${t.shippingDiscountAmount} <= ${t.shippingAmount}`,
    ),
    index("idx_orders_created").on(sql`${t.createdAt} DESC`),
    index("idx_orders_customer_created").on(t.customerId, sql`${t.createdAt} DESC`),
    index("idx_orders_status_created").on(t.orderStatus, sql`${t.createdAt} DESC`),
    index("idx_orders_payment_fulfillment").on(
      t.paymentStatus,
      t.fulfillmentStatus,
      sql`${t.createdAt} DESC`,
    ),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey(),
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    sku: text("sku").notNull().default(""),
    productTitle: text("product_title").notNull(),
    variantTitle: text("variant_title").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitPriceAmount: integer("unit_price_amount").notNull().default(0),
    compareAtAmount: integer("compare_at_amount"),
    discountAmount: integer("discount_amount").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    snapshotJson: text("snapshot_json").notNull().default("{}"),
    promotionId: integer("promotion_id").references(() => promotions.id, { onDelete: "restrict" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("order_items_quantity_check", sql`${t.quantity} > 0`),
    check("order_items_unit_price_check", sql`${t.unitPriceAmount} >= 0`),
    check(
      "order_items_compare_at_check",
      sql`${t.compareAtAmount} IS NULL OR ${t.compareAtAmount} >= 0`,
    ),
    check("order_items_discount_check", sql`${t.discountAmount} >= 0`),
    check("order_items_tax_check", sql`${t.taxAmount} >= 0`),
    check(
      "order_items_snapshot_json_check",
      sql`CASE WHEN json_valid(${t.snapshotJson}) THEN json_type(${t.snapshotJson}) = 'object' ELSE 0 END`,
    ),
    check(
      "order_items_line_discount_check",
      sql`${t.quantity} * ${t.unitPriceAmount} >= ${t.discountAmount}`,
    ),
    index("idx_order_items_order").on(t.orderId, t.id),
    index("idx_order_items_promotion").on(t.promotionId).where(sql`${t.promotionId} IS NOT NULL`),
  ],
);

export const orderEvents = sqliteTable(
  "order_events",
  {
    id: integer("id").primaryKey(),
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    actor: text("actor").notNull().default("system"),
    detailJson: text("detail_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check(
      "order_events_event_type_check",
      sql`${t.eventType} IN (
        'order_created', 'order_status_changed',
        'payment_status_changed', 'fulfillment_status_changed',
        'item_added', 'item_updated', 'item_removed',
        'discount_applied', 'discount_removed',
        'shipment_created', 'shipment_shipped', 'shipment_delivered'
      )`,
    ),
    check(
      "order_events_detail_json_check",
      sql`CASE WHEN json_valid(${t.detailJson}) THEN json_type(${t.detailJson}) = 'object' ELSE 0 END`,
    ),
    index("idx_order_events_order_created").on(t.orderId, sql`${t.createdAt} DESC`),
    index("idx_order_events_type").on(t.eventType, sql`${t.createdAt} DESC`),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey(),
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerPaymentId: text("provider_payment_id"),
    amount: integer("amount").notNull(),
    currencyCode: text("currency_code").notNull(),
    status: text("status").notNull(),
    payloadJson: text("payload_json").notNull().default("{}"),
    processedAt: text("processed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("payments_amount_check", sql`${t.amount} > 0`),
    check(
      "payments_status_check",
      sql`${t.status} IN ('pending', 'authorized', 'captured', 'failed', 'refunded')`,
    ),
    check(
      "payments_payload_json_check",
      sql`CASE WHEN json_valid(${t.payloadJson}) THEN json_type(${t.payloadJson}) = 'object' ELSE 0 END`,
    ),
    index("idx_payments_order").on(t.orderId, sql`${t.createdAt} DESC`),
    uniqueIndex("uq_payments_provider_payment")
      .on(t.provider, t.providerPaymentId)
      .where(sql`${t.providerPaymentId} IS NOT NULL`),
  ],
);

export const shipments = sqliteTable(
  "shipments",
  {
    id: integer("id").primaryKey(),
    orderId: integer("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
    carrier: text("carrier").notNull().default(""),
    service: text("service").notNull().default(""),
    trackingNumber: text("tracking_number").notNull().default(""),
    trackingUrl: text("tracking_url").notNull().default(""),
    status: text("status").notNull().default("pending"),
    shippedAt: text("shipped_at"),
    deliveredAt: text("delivered_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check(
      "shipments_status_check",
      sql`${t.status} IN ('pending', 'shipped', 'delivered', 'returned')`,
    ),
  ],
);

// =========================================================
// pages
// =========================================================
export const pages = sqliteTable(
  "pages",
  {
    id: integer("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("draft"),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    contentJson: text("content_json").notNull().default("{}"),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check("pages_status_check", sql`${t.status} IN ('draft', 'active', 'archived')`),
    check(
      "pages_content_json_check",
      sql`CASE WHEN json_valid(${t.contentJson}) THEN json_type(${t.contentJson}) = 'object' ELSE 0 END`,
    ),
    uniqueIndex("pages_slug_unique").on(sql`lower(${t.slug})`),
    index("idx_pages_status_published").on(t.status, sql`${t.publishedAt} DESC`),
  ],
);

// =========================================================
// menus
// =========================================================
export const menus = sqliteTable(
  "menus",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    handle: text("handle").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("menus_handle_unique").on(sql`lower(${t.handle})`)],
);

export const menuItems = sqliteTable(
  "menu_items",
  {
    id: integer("id").primaryKey(),
    menuId: integer("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
    parentId: integer("parent_id"),
    title: text("title").notNull(),
    linkType: text("link_type").notNull(),
    linkTarget: text("link_target").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check(
      "menu_items_link_type_check",
      sql`${t.linkType} IN ('page', 'collection', 'product', 'external', 'home')`,
    ),
    foreignKey({
      columns: [t.menuId, t.parentId],
      foreignColumns: [t.menuId, t.id],
    }).onDelete("cascade"),
    index("idx_menu_items_menu_parent_sort").on(t.menuId, t.parentId, t.sortOrder, t.id),
    uniqueIndex("uq_menu_items_menu_id").on(t.menuId, t.id),
  ],
);

// =========================================================
// metafield_definitions
// =========================================================
export const metafieldDefinitions = sqliteTable(
  "metafield_definitions",
  {
    id: integer("id").primaryKey(),
    resourceType: text("resource_type").notNull(),
    namespace: text("namespace").notNull(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    valueType: text("value_type").notNull(),
    validationsJson: text("validations_json").notNull().default("{}"),
    defaultValueJson: text("default_value_json").notNull().default("null"),
    visibleInAdmin: integer("visible_in_admin").notNull().default(1),
    visibleInStorefront: integer("visible_in_storefront").notNull().default(0),
    pinnedPosition: integer("pinned_position"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check(
      "metafield_definitions_resource_type_check",
      sql`${t.resourceType} IN ('shop', 'product', 'variant', 'collection', 'customer', 'order', 'page', 'promotion')`,
    ),
    check(
      "metafield_definitions_value_type_check",
      sql`${t.valueType} IN ('text', 'integer', 'number', 'boolean', 'json')`,
    ),
    check(
      "metafield_definitions_validations_json_check",
      sql`CASE WHEN json_valid(${t.validationsJson}) THEN json_type(${t.validationsJson}) = 'object' ELSE 0 END`,
    ),
    check("metafield_definitions_default_value_json_valid", sql`json_valid(${t.defaultValueJson})`),
    check("metafield_definitions_visible_admin_check", sql`${t.visibleInAdmin} IN (0, 1)`),
    check("metafield_definitions_visible_storefront_check", sql`${t.visibleInStorefront} IN (0, 1)`),
    check(
      "metafield_definitions_default_matches_type_check",
      sql`${t.valueType} = 'json'
        OR json_type(${t.defaultValueJson}) = 'null'
        OR (${t.valueType} = 'text' AND json_type(${t.defaultValueJson}) = 'text')
        OR (${t.valueType} = 'integer' AND json_type(${t.defaultValueJson}) = 'integer')
        OR (${t.valueType} = 'number' AND json_type(${t.defaultValueJson}) IN ('integer', 'real'))
        OR (${t.valueType} = 'boolean' AND json_type(${t.defaultValueJson}) IN ('true', 'false'))`,
    ),
    uniqueIndex("uq_metafield_definitions_rnk").on(t.resourceType, t.namespace, t.key),
    uniqueIndex("uq_metafield_definitions_id_resource").on(t.id, t.resourceType),
  ],
);

export const metafieldValues = sqliteTable(
  "metafield_values",
  {
    id: integer("id").primaryKey(),
    definitionId: integer("definition_id").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: integer("resource_id").notNull(),
    valueText: text("value_text"),
    valueInteger: integer("value_integer"),
    valueNumber: real("value_number"),
    valueBoolean: integer("value_boolean"),
    valueJson: text("value_json"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    check(
      "metafield_values_resource_type_check",
      sql`${t.resourceType} IN ('shop', 'product', 'variant', 'collection', 'customer', 'order', 'page', 'promotion')`,
    ),
    check(
      "metafield_values_value_boolean_check",
      sql`${t.valueBoolean} IS NULL OR ${t.valueBoolean} IN (0, 1)`,
    ),
    check(
      "metafield_values_value_json_valid",
      sql`${t.valueJson} IS NULL OR json_valid(${t.valueJson})`,
    ),
    check(
      "metafield_values_single_value_column_check",
      sql`((${t.valueText} IS NOT NULL) + (${t.valueInteger} IS NOT NULL) + (${t.valueNumber} IS NOT NULL) + (${t.valueBoolean} IS NOT NULL) + (${t.valueJson} IS NOT NULL)) = 1`,
    ),
    foreignKey({
      columns: [t.definitionId, t.resourceType],
      foreignColumns: [metafieldDefinitions.id, metafieldDefinitions.resourceType],
    }).onDelete("cascade"),
    uniqueIndex("uq_metafield_values_def_resource").on(t.definitionId, t.resourceId),
    index("idx_metafield_values_resource").on(t.resourceType, t.resourceId),
  ],
);

// =========================================================
// relations
// =========================================================

export const productsRelations = relations(products, ({ many, one }) => ({
  variants: many(productVariants),
  options: many(productOptions),
  media: many(productMedia),
  featuredMedia: one(mediaAssets, {
    fields: [products.featuredMediaId],
    references: [mediaAssets.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [productVariants.id],
    references: [inventoryItems.variantId],
  }),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryItems.variantId],
    references: [productVariants.id],
  }),
  level: one(inventoryLevels, {
    fields: [inventoryItems.id],
    references: [inventoryLevels.inventoryItemId],
  }),
}));

export const inventoryLevelsRelations = relations(inventoryLevels, ({ one }) => ({
  inventoryItem: one(inventoryItems, {
    fields: [inventoryLevels.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));

export const productOptionsRelations = relations(productOptions, ({ one, many }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
  values: many(productOptionValues),
}));

export const productOptionValuesRelations = relations(productOptionValues, ({ one }) => ({
  option: one(productOptions, {
    fields: [productOptionValues.optionId],
    references: [productOptions.id],
  }),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productMedia.variantId],
    references: [productVariants.id],
  }),
  media: one(mediaAssets, {
    fields: [productMedia.mediaId],
    references: [mediaAssets.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(collectionProducts),
}));

export const collectionProductsRelations = relations(collectionProducts, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionProducts.collectionId],
    references: [collections.id],
  }),
  product: one(products, {
    fields: [collectionProducts.productId],
    references: [products.id],
  }),
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({
  discountCodes: many(discountCodes),
}));

export const discountCodesRelations = relations(discountCodes, ({ one }) => ({
  promotion: one(promotions, {
    fields: [discountCodes.promotionId],
    references: [promotions.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
  orders: many(orders),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  shipment: one(shipments, {
    fields: [orders.id],
    references: [shipments.orderId],
  }),
  discountCodes: many(orderDiscountCodes),
  events: many(orderEvents),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
  promotion: one(promotions, {
    fields: [orderItems.promotionId],
    references: [promotions.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
}));

export const orderDiscountCodesRelations = relations(orderDiscountCodes, ({ one }) => ({
  order: one(orders, {
    fields: [orderDiscountCodes.orderId],
    references: [orders.id],
  }),
  discountCode: one(discountCodes, {
    fields: [orderDiscountCodes.discountCodeId],
    references: [discountCodes.id],
  }),
  promotion: one(promotions, {
    fields: [orderDiscountCodes.promotionId],
    references: [promotions.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  menu: one(menus, {
    fields: [menuItems.menuId],
    references: [menus.id],
  }),
}));

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}));
