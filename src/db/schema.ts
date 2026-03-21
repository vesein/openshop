import { sqliteTable, text, integer, real, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// =========================================================
// shop_settings
// =========================================================
export const shopSettings = sqliteTable("shop_settings", {
  id: integer("id").primaryKey({ autoIncrement: false }),
  shopName: text("shop_name").notNull(),
  shopDescription: text("shop_description").notNull().default(""),
  currencyCode: text("currency_code").notNull().default("USD"),
  locale: text("locale").notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),
  supportEmail: text("support_email").notNull().default(""),
  orderPrefix: text("order_prefix").notNull().default("ORD"),
  weightUnit: text("weight_unit").notNull().default("kg"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// =========================================================
// media_assets
// =========================================================
export const mediaAssets = sqliteTable("media_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  alt: text("alt").notNull().default(""),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// =========================================================
// products
// =========================================================
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"),
  productType: text("product_type").notNull().default(""),
  vendor: text("vendor").notNull().default(""),
  descriptionHtml: text("description_html").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  featuredMediaId: integer("featured_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  deletedAt: text("deleted_at"),
});

export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const productOptions = sqliteTable("product_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
}, (t) => [
  uniqueIndex("uq_product_options_product_name").on(t.productId, t.name),
]);

export const productOptionValues = sqliteTable("product_option_values", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  optionId: integer("option_id").notNull().references(() => productOptions.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
}, (t) => [
  uniqueIndex("uq_product_option_values_option_value").on(t.optionId, t.value),
]);

export const variantOptionValues = sqliteTable("variant_option_values", {
  variantId: integer("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  optionValueId: integer("option_value_id").notNull().references(() => productOptionValues.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.variantId, t.optionValueId] }),
]);

export const productMedia = sqliteTable("product_media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  mediaId: integer("media_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
}, (t) => [
  uniqueIndex("uq_product_media_product_media").on(t.productId, t.mediaId),
]);

// =========================================================
// collections
// =========================================================
export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"),
  descriptionHtml: text("description_html").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const collectionProducts = sqliteTable("collection_products", {
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.collectionId, t.productId] }),
]);

// =========================================================
// promotions
// =========================================================
export const promotions = sqliteTable("promotions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("draft"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  oncePerCustomer: integer("once_per_customer").notNull().default(0),
  rulesJson: text("rules_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const discountCodes = sqliteTable("discount_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  promotionId: integer("promotion_id").notNull().references(() => promotions.id, { onDelete: "cascade" }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const orderDiscountCodes = sqliteTable("order_discount_codes", {
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  discountCodeId: integer("discount_code_id").notNull().references(() => discountCodes.id, { onDelete: "restrict" }),
  promotionId: integer("promotion_id").notNull().references(() => promotions.id, { onDelete: "restrict" }),
}, (t) => [
  primaryKey({ columns: [t.orderId, t.discountCodeId] }),
]);

// =========================================================
// inventory
// =========================================================
export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  variantId: integer("variant_id").notNull().unique().references(() => productVariants.id, { onDelete: "cascade" }),
  tracked: integer("tracked").notNull().default(1),
  allowBackorder: integer("allow_backorder").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const inventoryLevels = sqliteTable("inventory_levels", {
  inventoryItemId: integer("inventory_item_id").primaryKey().references(() => inventoryItems.id, { onDelete: "cascade" }),
  onHand: integer("on_hand").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  movementType: text("movement_type").notNull(),
  quantityDelta: integer("quantity_delta").notNull(),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// =========================================================
// customers
// =========================================================
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  acceptsMarketing: integer("accepts_marketing").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const customerAddresses = sqliteTable("customer_addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// =========================================================
// carts
// =========================================================
export const carts = sqliteTable("carts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  sessionToken: text("session_token").notNull().unique(),
  currencyCode: text("currency_code").notNull(),
  status: text("status").notNull().default("active"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cartId: integer("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitPriceAmount: integer("unit_price_amount").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (t) => [
  uniqueIndex("uq_cart_items_cart_variant").on(t.cartId, t.variantId),
]);

// =========================================================
// orders
// =========================================================
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerPaymentId: text("provider_payment_id"),
  amount: integer("amount").notNull(),
  currencyCode: text("currency_code").notNull(),
  status: text("status").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  processedAt: text("processed_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const shipments = sqliteTable("shipments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
  carrier: text("carrier").notNull().default(""),
  service: text("service").notNull().default(""),
  trackingNumber: text("tracking_number").notNull().default(""),
  trackingUrl: text("tracking_url").notNull().default(""),
  status: text("status").notNull().default("pending"),
  shippedAt: text("shipped_at"),
  deliveredAt: text("delivered_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// =========================================================
// pages
// =========================================================
export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  contentJson: text("content_json").notNull().default("{}"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// =========================================================
// menus
// =========================================================
export const menus = sqliteTable("menus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  menuId: integer("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  title: text("title").notNull(),
  linkType: text("link_type").notNull(),
  linkTarget: text("link_target").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// =========================================================
// metafield_definitions
// =========================================================
export const metafieldDefinitions = sqliteTable("metafield_definitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (t) => [
  uniqueIndex("uq_metafield_definitions_rnk").on(t.resourceType, t.namespace, t.key),
]);

export const metafieldValues = sqliteTable("metafield_values", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  definitionId: integer("definition_id").notNull().references(() => metafieldDefinitions.id, { onDelete: "cascade" }),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id").notNull(),
  valueText: text("value_text"),
  valueInteger: integer("value_integer"),
  valueNumber: real("value_number"),
  valueBoolean: integer("value_boolean"),
  valueJson: text("value_json"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (t) => [
  uniqueIndex("uq_metafield_values_def_resource").on(t.definitionId, t.resourceId),
]);

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
