/**
 * Admin HTTP 路径 — 须与仓库根 `src/index.ts` 的 `routes` 保持一致。
 * 仅用于前端 fetch，不包含业务逻辑。
 */

const qs = (base: string, searchParams?: URLSearchParams | string) =>
  searchParams && String(searchParams).length > 0
    ? `${base}?${searchParams}`
    : base;

export const adminApi = {
  dashboard: "/api/admin/dashboard",
  settings: "/api/admin/settings",

  // Products
  products: (searchParams?: URLSearchParams | string) => qs("/api/admin/products", searchParams),
  product: (id: number | string) => `/api/admin/products/${id}`,

  // Variants
  variants: (productId: number | string) => `/api/admin/products/${productId}/variants`,
  variant: (id: number | string) => `/api/admin/variants/${id}`,
  variantInventory: (variantId: number | string) => `/api/admin/variants/${variantId}/inventory`,
  inventoryAdjust: (variantId: number | string) => `/api/admin/variants/${variantId}/inventory/adjust`,
  lowStock: "/api/admin/inventory/low-stock",

  // Product Options
  productOptions: (productId: number | string) => `/api/admin/products/${productId}/options`,
  productOption: (id: number | string) => `/api/admin/product-options/${id}`,
  optionValues: (optionId: number | string) => `/api/admin/product-options/${optionId}/values`,
  optionValue: (id: number | string) => `/api/admin/product-option-values/${id}`,
  variantOptionValues: (variantId: number | string) => `/api/admin/variants/${variantId}/option-values`,

  // Orders
  orders: (searchParams?: URLSearchParams | string) => qs("/api/admin/orders", searchParams),
  order: (id: number | string) => `/api/admin/orders/${id}`,

  // Order sub-resources
  orderItems: (orderId: number | string) => `/api/admin/orders/${orderId}/items`,
  orderItem: (id: number | string) => `/api/admin/order-items/${id}`,
  orderPayments: (orderId: number | string) => `/api/admin/orders/${orderId}/payments`,
  orderShipment: (orderId: number | string) => `/api/admin/orders/${orderId}/shipment`,
  shipment: (id: number | string) => `/api/admin/shipments/${id}`,
  shipmentAction: (id: number | string, action: string) => `/api/admin/shipments/${id}/${action}`,
  orderDiscountCodes: (orderId: number | string) => `/api/admin/orders/${orderId}/discount-codes`,

  // Customers
  customers: (searchParams?: URLSearchParams | string) => qs("/api/admin/customers", searchParams),
  customer: (id: number | string) => `/api/admin/customers/${id}`,
  customerAddresses: (customerId: number | string) => `/api/admin/customers/${customerId}/addresses`,
  address: (id: number | string) => `/api/admin/addresses/${id}`,

  // Collections
  collections: (searchParams?: URLSearchParams | string) => qs("/api/admin/collections", searchParams),
  collection: (id: number | string) => `/api/admin/collections/${id}`,
  collectionProducts: (id: number | string) => `/api/admin/collections/${id}/products`,

  // Promotions
  promotions: (searchParams?: URLSearchParams | string) => qs("/api/admin/promotions", searchParams),
  activePromotions: "/api/admin/promotions/active",
  promotion: (id: number | string) => `/api/admin/promotions/${id}`,
  promotionCodes: (promotionId: number | string) => `/api/admin/promotions/${promotionId}/codes`,
  promotionCode: (id: number | string) => `/api/admin/promotion-codes/${id}`,

  // Payments
  payment: (id: number | string) => `/api/admin/payments/${id}`,

  // Pages
  pages: (searchParams?: URLSearchParams | string) => qs("/api/admin/pages", searchParams),
  page: (id: number | string) => `/api/admin/pages/${id}`,

  // Menus
  menus: (searchParams?: URLSearchParams | string) => qs("/api/admin/menus", searchParams),
  menu: (id: number | string) => `/api/admin/menus/${id}`,
  menuItems: (menuId: number | string) => `/api/admin/menus/${menuId}/items`,
  menuItem: (id: number | string) => `/api/admin/menu-items/${id}`,

  // Carts
  carts: "/api/admin/carts",
  cart: (token: string) => `/api/admin/carts/${token}`,
  cartItems: (cartId: number | string) => `/api/admin/carts/${cartId}/items`,
  cartItem: (id: number | string) => `/api/admin/cart-items/${id}`,

  // Metafields
  metafieldDefinitions: (searchParams?: URLSearchParams | string) => qs("/api/admin/metafield-definitions", searchParams),
  metafieldDefinition: (id: number | string) => `/api/admin/metafield-definitions/${id}`,
  metafieldValues: (resourceType: string, resourceId: number | string) => `/api/admin/metafield-values/${resourceType}/${resourceId}`,
  metafieldValue: (id: number | string) => `/api/admin/metafield-values/${id}`,

  // Media
  media: (searchParams?: URLSearchParams | string) => qs("/api/admin/media", searchParams),
  mediaItem: (id: number | string) => `/api/admin/media/${id}`,
  productMedia: (productId: number | string) => `/api/admin/products/${productId}/media`,
  productMediaItem: (id: number | string) => `/api/admin/product-media/${id}`,
} as const;
