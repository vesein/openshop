/**
 * Admin HTTP 路径 — 须与仓库根 `src/index.ts` 的 `routes` 保持一致。
 * 仅用于前端 fetch，不包含业务逻辑。
 */
export const adminApi = {
  dashboard: "/api/admin/dashboard",
  settings: "/api/admin/settings",

  products: (searchParams?: URLSearchParams | string) =>
    searchParams && String(searchParams).length > 0
      ? `/api/admin/products?${searchParams}`
      : "/api/admin/products",
  product: (id: number | string) => `/api/admin/products/${id}`,

  orders: (searchParams?: URLSearchParams | string) =>
    searchParams && String(searchParams).length > 0
      ? `/api/admin/orders?${searchParams}`
      : "/api/admin/orders",
  order: (id: number | string) => `/api/admin/orders/${id}`,

  customers: (searchParams?: URLSearchParams | string) =>
    searchParams && String(searchParams).length > 0
      ? `/api/admin/customers?${searchParams}`
      : "/api/admin/customers",
  customer: (id: number | string) => `/api/admin/customers/${id}`,
  customerAddresses: (customerId: number | string) =>
    `/api/admin/customers/${customerId}/addresses`,

  promotions: "/api/admin/promotions",
  promotion: (id: number | string) => `/api/admin/promotions/${id}`,
  promotionCodes: (promotionId: number | string) => `/api/admin/promotions/${promotionId}/codes`,
  promotionCode: (id: number | string) => `/api/admin/promotion-codes/${id}`,

  /** PATCH 单条支付 — 与路由 `/api/admin/payments/:id` 对应 */
  payment: (id: number | string) => `/api/admin/payments/${id}`,

  pages: "/api/admin/pages",
  page: (id: number | string) => `/api/admin/pages/${id}`,
  menus: "/api/admin/menus",
  menu: (id: number | string) => `/api/admin/menus/${id}`,
} as const;
