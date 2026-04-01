// ============================================================
// Mock data for all admin pages
// ============================================================

// ---------- helpers ----------
const ts = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};
export const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
export const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ---------- Shop Settings ----------
export interface ShopSettings {
  id: number;
  shopName: string;
  shopDescription: string;
  currencyCode: string;
  locale: string;
  timezone: string;
  supportEmail: string;
  orderPrefix: string;
  weightUnit: string;
}
export const mockSettings: ShopSettings = {
  id: 1,
  shopName: "OpenShop Demo",
  shopDescription: "A demo e-commerce store powered by OpenShop",
  currencyCode: "USD",
  locale: "en",
  timezone: "America/New_York",
  supportEmail: "support@openshop.dev",
  orderPrefix: "ORD",
  weightUnit: "kg",
};

// ---------- Media ----------
export interface MediaAsset {
  id: number;
  kind: "image" | "video" | "file";
  storageKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  alt: string;
  createdAt: string;
}
export const mockMedia: MediaAsset[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  kind: (["image", "image", "image", "video", "file"] as const)[i % 5]!,
  storageKey: `media/${i + 1}.${i % 5 < 3 ? "jpg" : i % 5 === 3 ? "mp4" : "pdf"}`,
  mimeType: i % 5 < 3 ? "image/jpeg" : i % 5 === 3 ? "video/mp4" : "application/pdf",
  width: i % 5 < 3 ? 800 : null,
  height: i % 5 < 3 ? 600 : null,
  sizeBytes: 50000 + i * 12000,
  alt: `Media asset ${i + 1}`,
  createdAt: ts(i),
}));

// ---------- Products ----------
export interface Product {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "active" | "archived";
  productType: string;
  vendor: string;
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
  featuredMediaId: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  options: ProductOption[];
  media: ProductMedia[];
}
export interface ProductVariant {
  id: number;
  productId: number;
  title: string;
  sku: string;
  barcode: string;
  priceAmount: number;
  compareAtAmount: number | null;
  costAmount: number | null;
  weightValue: number | null;
  requiresShipping: boolean;
  taxable: boolean;
  isDefault: boolean;
  sortOrder: number;
  optionSignature: string | null;
  inventory: { tracked: boolean; allowBackorder: boolean; onHand: number; reserved: number };
}
export interface ProductOption {
  id: number;
  productId: number;
  name: string;
  sortOrder: number;
  values: { id: number; value: string; sortOrder: number }[];
}
export interface ProductMedia {
  id: number;
  productId: number;
  variantId: number | null;
  mediaId: number;
  sortOrder: number;
}

const productNames = [
  "Classic Cotton T-Shirt",
  "Slim Fit Denim Jeans",
  "Leather Crossbody Bag",
  "Running Performance Shoes",
  "Wireless Bluetooth Earbuds",
  "Organic Green Tea",
  "Stainless Steel Water Bottle",
  "Yoga Mat Premium",
  "Bamboo Sunglasses",
  "Merino Wool Sweater",
  "Ceramic Coffee Mug Set",
  "Natural Soy Candle",
];
const vendors = ["Nike", "Adidas", "Patagonia", "Muji", "Apple"];
const types = ["Apparel", "Footwear", "Accessories", "Electronics", "Food & Drink", "Home"];

export const mockProducts: Product[] = productNames.map((title, i) => {
  const id = i + 1;
  const hasOptions = i < 6;
  return {
    id,
    title,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    status: (["active", "active", "draft", "active", "archived"] as const)[i % 5]!,
    productType: types[i % types.length]!,
    vendor: vendors[i % vendors.length]!,
    descriptionHtml: `<p>High-quality ${title.toLowerCase()} for everyday use.</p>`,
    seoTitle: title,
    seoDescription: `Buy ${title} at the best price.`,
    featuredMediaId: (i % 3) + 1,
    publishedAt: i % 5 !== 2 ? ts(i + 5) : null,
    createdAt: ts(i + 10),
    updatedAt: ts(i),
    variants: hasOptions
      ? [
          { id: id * 10, productId: id, title: "Small / Black", sku: `SKU-${id}-S-BLK`, barcode: "", priceAmount: 2999 + i * 500, compareAtAmount: 3999 + i * 500, costAmount: 1500, weightValue: 200, requiresShipping: true, taxable: true, isDefault: true, sortOrder: 0, optionSignature: "Small|Black", inventory: { tracked: true, allowBackorder: false, onHand: 25, reserved: 3 } },
          { id: id * 10 + 1, productId: id, title: "Medium / Black", sku: `SKU-${id}-M-BLK`, barcode: "", priceAmount: 2999 + i * 500, compareAtAmount: null, costAmount: 1500, weightValue: 220, requiresShipping: true, taxable: true, isDefault: false, sortOrder: 1, optionSignature: "Medium|Black", inventory: { tracked: true, allowBackorder: false, onHand: 18, reserved: 5 } },
          { id: id * 10 + 2, productId: id, title: "Large / White", sku: `SKU-${id}-L-WHT`, barcode: "", priceAmount: 3299 + i * 500, compareAtAmount: null, costAmount: 1700, weightValue: 250, requiresShipping: true, taxable: true, isDefault: false, sortOrder: 2, optionSignature: "Large|White", inventory: { tracked: true, allowBackorder: false, onHand: 7, reserved: 2 } },
        ]
      : [
          { id: id * 10, productId: id, title: "Default Title", sku: `SKU-${id}`, barcode: `BAR-${id}`, priceAmount: 1999 + i * 1000, compareAtAmount: null, costAmount: 1000 + i * 300, weightValue: 300, requiresShipping: true, taxable: true, isDefault: true, sortOrder: 0, optionSignature: null, inventory: { tracked: true, allowBackorder: i % 2 === 0, onHand: 50 - i * 3, reserved: i } },
        ],
    options: hasOptions
      ? [
          { id: id * 10, productId: id, name: "Size", sortOrder: 0, values: [{ id: id * 100, value: "Small", sortOrder: 0 }, { id: id * 100 + 1, value: "Medium", sortOrder: 1 }, { id: id * 100 + 2, value: "Large", sortOrder: 2 }] },
          { id: id * 10 + 1, productId: id, name: "Color", sortOrder: 1, values: [{ id: id * 100 + 10, value: "Black", sortOrder: 0 }, { id: id * 100 + 11, value: "White", sortOrder: 1 }] },
        ]
      : [],
    media: [
      { id: id * 10, productId: id, variantId: null, mediaId: ((id - 1) % mockMedia.length) + 1, sortOrder: 0 },
      { id: id * 10 + 1, productId: id, variantId: null, mediaId: (id % mockMedia.length) + 1, sortOrder: 1 },
    ],
  };
});

// ---------- Collections ----------
export interface Collection {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "active" | "archived";
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  productIds: number[];
}
export const mockCollections: Collection[] = [
  { id: 1, title: "Summer Essentials", slug: "summer-essentials", status: "active", descriptionHtml: "<p>Best picks for summer</p>", seoTitle: "Summer Essentials", seoDescription: "Shop summer collection", publishedAt: ts(30), createdAt: ts(60), updatedAt: ts(2), productIds: [1, 2, 4, 9] },
  { id: 2, title: "New Arrivals", slug: "new-arrivals", status: "active", descriptionHtml: "<p>Latest products</p>", seoTitle: "New Arrivals", seoDescription: "Shop new arrivals", publishedAt: ts(10), createdAt: ts(20), updatedAt: ts(1), productIds: [3, 5, 7, 10, 11] },
  { id: 3, title: "Sale", slug: "sale", status: "draft", descriptionHtml: "<p>On sale now</p>", seoTitle: "Sale", seoDescription: "Shop sale items", publishedAt: null, createdAt: ts(15), updatedAt: ts(5), productIds: [1, 6, 8] },
  { id: 4, title: "Archived Collection", slug: "archived-collection", status: "archived", descriptionHtml: "", seoTitle: "", seoDescription: "", publishedAt: ts(90), createdAt: ts(120), updatedAt: ts(30), productIds: [] },
];

// ---------- Customers ----------
export interface Customer {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
  addresses: CustomerAddress[];
  orderCount: number;
}
export interface CustomerAddress {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  countryCode: string;
  province: string;
  city: string;
  address1: string;
  address2: string;
  postalCode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}
export const mockCustomers: Customer[] = [
  { id: 1, email: "alice@example.com", phone: "+1-555-0101", firstName: "Alice", lastName: "Johnson", acceptsMarketing: true, createdAt: ts(90), updatedAt: ts(2), orderCount: 5, addresses: [{ id: 1, customerId: 1, firstName: "Alice", lastName: "Johnson", company: "Acme Corp", phone: "+1-555-0101", countryCode: "US", province: "CA", city: "San Francisco", address1: "123 Market St", address2: "Apt 4B", postalCode: "94105", isDefaultShipping: true, isDefaultBilling: true }] },
  { id: 2, email: "bob@example.com", phone: "+1-555-0202", firstName: "Bob", lastName: "Smith", acceptsMarketing: false, createdAt: ts(60), updatedAt: ts(5), orderCount: 3, addresses: [{ id: 2, customerId: 2, firstName: "Bob", lastName: "Smith", company: "", phone: "+1-555-0202", countryCode: "US", province: "NY", city: "New York", address1: "456 Broadway", address2: "", postalCode: "10013", isDefaultShipping: true, isDefaultBilling: true }] },
  { id: 3, email: "charlie@example.com", phone: "", firstName: "Charlie", lastName: "Brown", acceptsMarketing: true, createdAt: ts(45), updatedAt: ts(10), orderCount: 1, addresses: [] },
  { id: 4, email: "diana@example.com", phone: "+44-20-7946-0958", firstName: "Diana", lastName: "Prince", acceptsMarketing: true, createdAt: ts(30), updatedAt: ts(3), orderCount: 8, addresses: [{ id: 3, customerId: 4, firstName: "Diana", lastName: "Prince", company: "Themyscira Ltd", phone: "+44-20-7946-0958", countryCode: "GB", province: "London", city: "London", address1: "10 Downing St", address2: "", postalCode: "SW1A 2AA", isDefaultShipping: true, isDefaultBilling: false }, { id: 4, customerId: 4, firstName: "Diana", lastName: "Prince", company: "", phone: "", countryCode: "GB", province: "London", city: "London", address1: "221B Baker St", address2: "", postalCode: "NW1 6XE", isDefaultShipping: false, isDefaultBilling: true }] },
  { id: 5, email: "eve@example.com", phone: "+1-555-0505", firstName: "Eve", lastName: "Williams", acceptsMarketing: false, createdAt: ts(20), updatedAt: ts(1), orderCount: 2, addresses: [{ id: 5, customerId: 5, firstName: "Eve", lastName: "Williams", company: "", phone: "+1-555-0505", countryCode: "US", province: "TX", city: "Austin", address1: "789 Congress Ave", address2: "Suite 100", postalCode: "78701", isDefaultShipping: true, isDefaultBilling: true }] },
  { id: 6, email: "frank@example.com", phone: "", firstName: "Frank", lastName: "Lee", acceptsMarketing: true, createdAt: ts(10), updatedAt: ts(0), orderCount: 0, addresses: [] },
];

// ---------- Orders ----------
export interface Order {
  id: number;
  orderNumber: string;
  customerId: number | null;
  email: string;
  phone: string;
  currencyCode: string;
  subtotalAmount: number;
  discountAmount: number;
  orderDiscountAmount: number;
  shippingAmount: number;
  shippingDiscountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  orderStatus: string;
  billingAddressJson: string;
  shippingAddressJson: string;
  placedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments: Payment[];
  shipment: Shipment | null;
  discountCodes: OrderDiscountCode[];
  events: OrderEvent[];
}
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  variantId: number | null;
  sku: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  unitPriceAmount: number;
  compareAtAmount: number | null;
  discountAmount: number;
  taxAmount: number;
  promotionId: number | null;
}
export interface Payment {
  id: number;
  orderId: number;
  provider: string;
  providerPaymentId: string | null;
  amount: number;
  currencyCode: string;
  status: string;
  processedAt: string | null;
}
export interface Shipment {
  id: number;
  orderId: number;
  carrier: string;
  service: string;
  trackingNumber: string;
  trackingUrl: string;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}
export interface OrderDiscountCode {
  orderId: number;
  discountCodeId: number;
  promotionId: number;
  code: string;
  promotionName: string;
}
export interface OrderEvent {
  id: number;
  orderId: number;
  eventType: string;
  actor: string;
  detailJson: string;
  createdAt: string;
}

const addr = JSON.stringify({ firstName: "Alice", lastName: "Johnson", address1: "123 Market St", city: "San Francisco", province: "CA", postalCode: "94105", countryCode: "US" });
export const mockOrders: Order[] = [
  {
    id: 1, orderNumber: "ORD-1001", customerId: 1, email: "alice@example.com", phone: "+1-555-0101", currencyCode: "USD",
    subtotalAmount: 8997, discountAmount: 500, orderDiscountAmount: 0, shippingAmount: 999, shippingDiscountAmount: 0, taxAmount: 680, totalAmount: 10176,
    paymentStatus: "paid", fulfillmentStatus: "fulfilled", orderStatus: "completed",
    billingAddressJson: addr, shippingAddressJson: addr, placedAt: ts(5), cancelledAt: null, createdAt: ts(5), updatedAt: ts(2),
    items: [
      { id: 1, orderId: 1, productId: 1, variantId: 10, sku: "SKU-1-S-BLK", productTitle: "Classic Cotton T-Shirt", variantTitle: "Small / Black", quantity: 2, unitPriceAmount: 2999, compareAtAmount: 3999, discountAmount: 500, taxAmount: 340, promotionId: null },
      { id: 2, orderId: 1, productId: 4, variantId: 40, sku: "SKU-4-S-BLK", productTitle: "Running Performance Shoes", variantTitle: "Small / Black", quantity: 1, unitPriceAmount: 4499, compareAtAmount: null, discountAmount: 0, taxAmount: 340, promotionId: null },
    ],
    payments: [{ id: 1, orderId: 1, provider: "stripe", providerPaymentId: "pi_abc123", amount: 10176, currencyCode: "USD", status: "captured", processedAt: ts(5) }],
    shipment: { id: 1, orderId: 1, carrier: "USPS", service: "Priority Mail", trackingNumber: "9400111899223456789012", trackingUrl: "", status: "delivered", shippedAt: ts(4), deliveredAt: ts(2) },
    discountCodes: [],
    events: [
      { id: 1, orderId: 1, eventType: "order_created", actor: "system", detailJson: "{}", createdAt: ts(5) },
      { id: 2, orderId: 1, eventType: "payment_status_changed", actor: "system", detailJson: '{"from":"pending","to":"paid"}', createdAt: ts(5) },
      { id: 3, orderId: 1, eventType: "shipment_shipped", actor: "admin", detailJson: '{"carrier":"USPS"}', createdAt: ts(4) },
      { id: 4, orderId: 1, eventType: "shipment_delivered", actor: "system", detailJson: "{}", createdAt: ts(2) },
      { id: 5, orderId: 1, eventType: "order_status_changed", actor: "system", detailJson: '{"from":"open","to":"completed"}', createdAt: ts(2) },
    ],
  },
  {
    id: 2, orderNumber: "ORD-1002", customerId: 2, email: "bob@example.com", phone: "+1-555-0202", currencyCode: "USD",
    subtotalAmount: 5998, discountAmount: 0, orderDiscountAmount: 1000, shippingAmount: 799, shippingDiscountAmount: 0, taxAmount: 400, totalAmount: 6197,
    paymentStatus: "paid", fulfillmentStatus: "unfulfilled", orderStatus: "open",
    billingAddressJson: addr, shippingAddressJson: addr, placedAt: ts(3), cancelledAt: null, createdAt: ts(3), updatedAt: ts(1),
    items: [
      { id: 3, orderId: 2, productId: 2, variantId: 20, sku: "SKU-2-S-BLK", productTitle: "Slim Fit Denim Jeans", variantTitle: "Small / Black", quantity: 2, unitPriceAmount: 2999, compareAtAmount: null, discountAmount: 0, taxAmount: 400, promotionId: null },
    ],
    payments: [{ id: 2, orderId: 2, provider: "stripe", providerPaymentId: "pi_def456", amount: 6197, currencyCode: "USD", status: "captured", processedAt: ts(3) }],
    shipment: null,
    discountCodes: [{ orderId: 2, discountCodeId: 1, promotionId: 1, code: "SAVE10", promotionName: "10% Off Everything" }],
    events: [
      { id: 6, orderId: 2, eventType: "order_created", actor: "system", detailJson: "{}", createdAt: ts(3) },
      { id: 7, orderId: 2, eventType: "discount_applied", actor: "system", detailJson: '{"code":"SAVE10"}', createdAt: ts(3) },
      { id: 8, orderId: 2, eventType: "payment_status_changed", actor: "system", detailJson: '{"from":"pending","to":"paid"}', createdAt: ts(3) },
    ],
  },
  {
    id: 3, orderNumber: "ORD-1003", customerId: 4, email: "diana@example.com", phone: "+44-20-7946-0958", currencyCode: "USD",
    subtotalAmount: 12499, discountAmount: 0, orderDiscountAmount: 0, shippingAmount: 1499, shippingDiscountAmount: 0, taxAmount: 1000, totalAmount: 14998,
    paymentStatus: "authorized", fulfillmentStatus: "unfulfilled", orderStatus: "open",
    billingAddressJson: addr, shippingAddressJson: addr, placedAt: ts(1), cancelledAt: null, createdAt: ts(1), updatedAt: ts(0),
    items: [
      { id: 4, orderId: 3, productId: 3, variantId: 30, sku: "SKU-3-S-BLK", productTitle: "Leather Crossbody Bag", variantTitle: "Small / Black", quantity: 1, unitPriceAmount: 4499, compareAtAmount: null, discountAmount: 0, taxAmount: 340, promotionId: null },
      { id: 5, orderId: 3, productId: 10, variantId: 100, sku: "SKU-10", productTitle: "Merino Wool Sweater", variantTitle: "Default Title", quantity: 1, unitPriceAmount: 7999, compareAtAmount: null, discountAmount: 0, taxAmount: 640, promotionId: null },
    ],
    payments: [{ id: 3, orderId: 3, provider: "stripe", providerPaymentId: "pi_ghi789", amount: 14998, currencyCode: "USD", status: "authorized", processedAt: ts(1) }],
    shipment: null,
    discountCodes: [],
    events: [
      { id: 9, orderId: 3, eventType: "order_created", actor: "system", detailJson: "{}", createdAt: ts(1) },
      { id: 10, orderId: 3, eventType: "payment_status_changed", actor: "system", detailJson: '{"from":"pending","to":"authorized"}', createdAt: ts(1) },
    ],
  },
  {
    id: 4, orderNumber: "ORD-1004", customerId: 5, email: "eve@example.com", phone: "+1-555-0505", currencyCode: "USD",
    subtotalAmount: 3999, discountAmount: 0, orderDiscountAmount: 0, shippingAmount: 599, shippingDiscountAmount: 599, taxAmount: 320, totalAmount: 4319,
    paymentStatus: "paid", fulfillmentStatus: "fulfilled", orderStatus: "completed",
    billingAddressJson: addr, shippingAddressJson: addr, placedAt: ts(15), cancelledAt: null, createdAt: ts(15), updatedAt: ts(10),
    items: [
      { id: 6, orderId: 4, productId: 5, variantId: 50, sku: "SKU-5-S-BLK", productTitle: "Wireless Bluetooth Earbuds", variantTitle: "Small / Black", quantity: 1, unitPriceAmount: 3999, compareAtAmount: null, discountAmount: 0, taxAmount: 320, promotionId: 3 },
    ],
    payments: [{ id: 4, orderId: 4, provider: "paypal", providerPaymentId: "PAY-xyz", amount: 4319, currencyCode: "USD", status: "captured", processedAt: ts(15) }],
    shipment: { id: 2, orderId: 4, carrier: "FedEx", service: "Ground", trackingNumber: "794644790132", trackingUrl: "", status: "delivered", shippedAt: ts(14), deliveredAt: ts(10) },
    discountCodes: [],
    events: [
      { id: 11, orderId: 4, eventType: "order_created", actor: "system", detailJson: "{}", createdAt: ts(15) },
      { id: 12, orderId: 4, eventType: "payment_status_changed", actor: "system", detailJson: '{"from":"pending","to":"paid"}', createdAt: ts(15) },
      { id: 13, orderId: 4, eventType: "fulfillment_status_changed", actor: "admin", detailJson: '{"from":"unfulfilled","to":"fulfilled"}', createdAt: ts(10) },
    ],
  },
  {
    id: 5, orderNumber: "ORD-1005", customerId: 3, email: "charlie@example.com", phone: "", currencyCode: "USD",
    subtotalAmount: 1999, discountAmount: 0, orderDiscountAmount: 0, shippingAmount: 499, shippingDiscountAmount: 0, taxAmount: 160, totalAmount: 2658,
    paymentStatus: "failed", fulfillmentStatus: "unfulfilled", orderStatus: "cancelled",
    billingAddressJson: addr, shippingAddressJson: addr, placedAt: ts(8), cancelledAt: ts(7), createdAt: ts(8), updatedAt: ts(7),
    items: [
      { id: 7, orderId: 5, productId: 6, variantId: 60, sku: "SKU-6-S-BLK", productTitle: "Organic Green Tea", variantTitle: "Small / Black", quantity: 1, unitPriceAmount: 1999, compareAtAmount: null, discountAmount: 0, taxAmount: 160, promotionId: null },
    ],
    payments: [{ id: 5, orderId: 5, provider: "stripe", providerPaymentId: "pi_fail", amount: 2658, currencyCode: "USD", status: "failed", processedAt: ts(8) }],
    shipment: null,
    discountCodes: [],
    events: [
      { id: 14, orderId: 5, eventType: "order_created", actor: "system", detailJson: "{}", createdAt: ts(8) },
      { id: 15, orderId: 5, eventType: "payment_status_changed", actor: "system", detailJson: '{"from":"pending","to":"failed"}', createdAt: ts(8) },
      { id: 16, orderId: 5, eventType: "order_status_changed", actor: "admin", detailJson: '{"from":"open","to":"cancelled"}', createdAt: ts(7) },
    ],
  },
  {
    id: 6, orderNumber: "ORD-1006", customerId: 1, email: "alice@example.com", phone: "+1-555-0101", currencyCode: "USD",
    subtotalAmount: 6598, discountAmount: 0, orderDiscountAmount: 0, shippingAmount: 0, shippingDiscountAmount: 0, taxAmount: 528, totalAmount: 7126,
    paymentStatus: "partially_paid", fulfillmentStatus: "unfulfilled", orderStatus: "open",
    billingAddressJson: addr, shippingAddressJson: addr, placedAt: ts(0), cancelledAt: null, createdAt: ts(0), updatedAt: ts(0),
    items: [
      { id: 8, orderId: 6, productId: 7, variantId: 70, sku: "SKU-7", productTitle: "Stainless Steel Water Bottle", variantTitle: "Default Title", quantity: 2, unitPriceAmount: 2499, compareAtAmount: null, discountAmount: 0, taxAmount: 200, promotionId: null },
      { id: 9, orderId: 6, productId: 11, variantId: 110, sku: "SKU-11", productTitle: "Ceramic Coffee Mug Set", variantTitle: "Default Title", quantity: 1, unitPriceAmount: 1599, compareAtAmount: null, discountAmount: 0, taxAmount: 128, promotionId: null },
    ],
    payments: [{ id: 6, orderId: 6, provider: "stripe", providerPaymentId: "pi_jkl012", amount: 3000, currencyCode: "USD", status: "captured", processedAt: ts(0) }],
    shipment: null,
    discountCodes: [],
    events: [
      { id: 17, orderId: 6, eventType: "order_created", actor: "system", detailJson: "{}", createdAt: ts(0) },
      { id: 18, orderId: 6, eventType: "payment_status_changed", actor: "system", detailJson: '{"from":"pending","to":"partially_paid"}', createdAt: ts(0) },
    ],
  },
];

// ---------- Promotions ----------
export interface Promotion {
  id: number;
  name: string;
  type: "percentage" | "fixed_amount" | "free_shipping" | "bogo";
  status: "draft" | "active" | "archived";
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  oncePerCustomer: boolean;
  rulesJson: string;
  discountValue: number;
  minPurchaseAmount: number;
  buyQuantity: number | null;
  getQuantity: number | null;
  createdAt: string;
  updatedAt: string;
  discountCodes: DiscountCode[];
}
export interface DiscountCode {
  id: number;
  code: string;
  promotionId: number;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
}
export const mockPromotions: Promotion[] = [
  { id: 1, name: "10% Off Everything", type: "percentage", status: "active", startsAt: ts(30), endsAt: ts(-30), usageLimit: 1000, usageCount: 156, oncePerCustomer: false, rulesJson: "{}", discountValue: 10, minPurchaseAmount: 0, buyQuantity: null, getQuantity: null, createdAt: ts(60), updatedAt: ts(2), discountCodes: [{ id: 1, code: "SAVE10", promotionId: 1, usageLimit: 500, usageCount: 156, createdAt: ts(60) }] },
  { id: 2, name: "$5 Off Orders Over $50", type: "fixed_amount", status: "active", startsAt: ts(20), endsAt: ts(-60), usageLimit: null, usageCount: 42, oncePerCustomer: true, rulesJson: "{}", discountValue: 500, minPurchaseAmount: 5000, buyQuantity: null, getQuantity: null, createdAt: ts(45), updatedAt: ts(5), discountCodes: [{ id: 2, code: "FIVE4FIFTY", promotionId: 2, usageLimit: null, usageCount: 42, createdAt: ts(45) }, { id: 3, code: "WELCOME5", promotionId: 2, usageLimit: 100, usageCount: 18, createdAt: ts(30) }] },
  { id: 3, name: "Free Shipping", type: "free_shipping", status: "active", startsAt: ts(10), endsAt: null, usageLimit: null, usageCount: 89, oncePerCustomer: false, rulesJson: "{}", discountValue: 0, minPurchaseAmount: 3000, buyQuantity: null, getQuantity: null, createdAt: ts(30), updatedAt: ts(1), discountCodes: [{ id: 4, code: "FREESHIP", promotionId: 3, usageLimit: null, usageCount: 89, createdAt: ts(30) }] },
  { id: 4, name: "Buy 2 Get 1 Free", type: "bogo", status: "draft", startsAt: null, endsAt: null, usageLimit: 200, usageCount: 0, oncePerCustomer: true, rulesJson: '{"applies_to":"all"}', discountValue: 100, minPurchaseAmount: 0, buyQuantity: 2, getQuantity: 1, createdAt: ts(5), updatedAt: ts(5), discountCodes: [] },
];

// ---------- Pages ----------
export interface Page {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "active" | "archived";
  seoTitle: string;
  seoDescription: string;
  contentJson: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export const mockPages: Page[] = [
  { id: 1, title: "About Us", slug: "about-us", status: "active", seoTitle: "About Us - OpenShop", seoDescription: "Learn about our story.", contentJson: '{"blocks":[{"type":"heading","text":"About Us"},{"type":"paragraph","text":"We are a demo e-commerce store."}]}', publishedAt: ts(60), createdAt: ts(90), updatedAt: ts(10) },
  { id: 2, title: "Contact", slug: "contact", status: "active", seoTitle: "Contact Us", seoDescription: "Get in touch.", contentJson: '{"blocks":[{"type":"heading","text":"Contact Us"},{"type":"paragraph","text":"Email us at support@openshop.dev"}]}', publishedAt: ts(60), createdAt: ts(90), updatedAt: ts(5) },
  { id: 3, title: "Shipping Policy", slug: "shipping-policy", status: "active", seoTitle: "Shipping Policy", seoDescription: "Our shipping policy.", contentJson: '{"blocks":[{"type":"heading","text":"Shipping Policy"},{"type":"paragraph","text":"Free shipping on orders over $30."}]}', publishedAt: ts(45), createdAt: ts(60), updatedAt: ts(30) },
  { id: 4, title: "Returns & Refunds", slug: "returns-refunds", status: "draft", seoTitle: "", seoDescription: "", contentJson: '{"blocks":[{"type":"heading","text":"Returns & Refunds"}]}', publishedAt: null, createdAt: ts(10), updatedAt: ts(10) },
];

// ---------- Menus ----------
export interface Menu {
  id: number;
  name: string;
  handle: string;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
}
export interface MenuItem {
  id: number;
  menuId: number;
  parentId: number | null;
  title: string;
  linkType: "page" | "collection" | "product" | "external" | "home";
  linkTarget: string;
  sortOrder: number;
}
export const mockMenus: Menu[] = [
  {
    id: 1, name: "Main Navigation", handle: "main-nav", createdAt: ts(90), updatedAt: ts(5),
    items: [
      { id: 1, menuId: 1, parentId: null, title: "Home", linkType: "home", linkTarget: "/", sortOrder: 0 },
      { id: 2, menuId: 1, parentId: null, title: "Shop", linkType: "collection", linkTarget: "new-arrivals", sortOrder: 1 },
      { id: 3, menuId: 1, parentId: 2, title: "Summer", linkType: "collection", linkTarget: "summer-essentials", sortOrder: 0 },
      { id: 4, menuId: 1, parentId: 2, title: "Sale", linkType: "collection", linkTarget: "sale", sortOrder: 1 },
      { id: 5, menuId: 1, parentId: null, title: "About", linkType: "page", linkTarget: "about-us", sortOrder: 2 },
      { id: 6, menuId: 1, parentId: null, title: "Contact", linkType: "page", linkTarget: "contact", sortOrder: 3 },
    ],
  },
  {
    id: 2, name: "Footer", handle: "footer", createdAt: ts(90), updatedAt: ts(10),
    items: [
      { id: 7, menuId: 2, parentId: null, title: "Shipping Policy", linkType: "page", linkTarget: "shipping-policy", sortOrder: 0 },
      { id: 8, menuId: 2, parentId: null, title: "Returns", linkType: "page", linkTarget: "returns-refunds", sortOrder: 1 },
      { id: 9, menuId: 2, parentId: null, title: "Privacy Policy", linkType: "external", linkTarget: "https://example.com/privacy", sortOrder: 2 },
    ],
  },
];

// ---------- Metafield Definitions ----------
export interface MetafieldDefinition {
  id: number;
  resourceType: string;
  namespace: string;
  key: string;
  name: string;
  description: string;
  valueType: "text" | "integer" | "number" | "boolean" | "json";
  validationsJson: string;
  visibleInAdmin: boolean;
  visibleInStorefront: boolean;
  pinnedPosition: number | null;
  createdAt: string;
  updatedAt: string;
}
export const mockMetafieldDefs: MetafieldDefinition[] = [
  { id: 1, resourceType: "product", namespace: "custom", key: "material", name: "Material", description: "Primary material of the product", valueType: "text", validationsJson: "{}", visibleInAdmin: true, visibleInStorefront: true, pinnedPosition: 1, createdAt: ts(60), updatedAt: ts(30) },
  { id: 2, resourceType: "product", namespace: "custom", key: "care_instructions", name: "Care Instructions", description: "How to care for this product", valueType: "text", validationsJson: "{}", visibleInAdmin: true, visibleInStorefront: true, pinnedPosition: 2, createdAt: ts(60), updatedAt: ts(30) },
  { id: 3, resourceType: "product", namespace: "reviews", key: "average_rating", name: "Average Rating", description: "Average customer rating", valueType: "number", validationsJson: '{"min":0,"max":5}', visibleInAdmin: true, visibleInStorefront: true, pinnedPosition: null, createdAt: ts(45), updatedAt: ts(20) },
  { id: 4, resourceType: "customer", namespace: "loyalty", key: "points", name: "Loyalty Points", description: "Customer loyalty points balance", valueType: "integer", validationsJson: '{"min":0}', visibleInAdmin: true, visibleInStorefront: false, pinnedPosition: 1, createdAt: ts(30), updatedAt: ts(10) },
  { id: 5, resourceType: "order", namespace: "custom", key: "gift_message", name: "Gift Message", description: "Optional gift message", valueType: "text", validationsJson: "{}", visibleInAdmin: true, visibleInStorefront: false, pinnedPosition: null, createdAt: ts(20), updatedAt: ts(10) },
  { id: 6, resourceType: "shop", namespace: "seo", key: "extra_scripts", name: "Extra Head Scripts", description: "Additional scripts for <head>", valueType: "json", validationsJson: "{}", visibleInAdmin: true, visibleInStorefront: false, pinnedPosition: null, createdAt: ts(15), updatedAt: ts(15) },
  { id: 7, resourceType: "collection", namespace: "custom", key: "banner_color", name: "Banner Color", description: "Hex color for collection banner", valueType: "text", validationsJson: "{}", visibleInAdmin: true, visibleInStorefront: true, pinnedPosition: null, createdAt: ts(10), updatedAt: ts(10) },
  { id: 8, resourceType: "variant", namespace: "custom", key: "is_limited_edition", name: "Limited Edition", description: "Whether this variant is limited edition", valueType: "boolean", validationsJson: "{}", visibleInAdmin: true, visibleInStorefront: true, pinnedPosition: null, createdAt: ts(5), updatedAt: ts(5) },
];

// ---------- Inventory (flat view) ----------
export interface InventoryRow {
  variantId: number;
  productId: number;
  productTitle: string;
  variantTitle: string;
  sku: string;
  tracked: boolean;
  allowBackorder: boolean;
  onHand: number;
  reserved: number;
}
export const mockInventory: InventoryRow[] = mockProducts.flatMap((p) =>
  p.variants.map((v) => ({
    variantId: v.id,
    productId: p.id,
    productTitle: p.title,
    variantTitle: v.title,
    sku: v.sku,
    tracked: v.inventory.tracked,
    allowBackorder: v.inventory.allowBackorder,
    onHand: v.inventory.onHand,
    reserved: v.inventory.reserved,
  })),
);
