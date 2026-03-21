import { serve } from "bun";
import index from "./index.html";

// controllers
import {
  productController, productDetailController,
  variantController, variantDetailController,
  inventoryController, lowStockController,
  inventoryAdjustController,
} from "./controller/product.controller";
import {
  orderController, orderDetailController,
  orderItemController, orderItemDetailController,
  paymentController,
  shipmentController, shipmentActionController,
  orderDiscountController,
  dashboardController,
} from "./controller/order.controller";
import {
  customerController, customerDetailController,
  addressController, addressDetailController,
} from "./controller/customer.controller";
import {
  collectionController, collectionDetailController,
  collectionProductController,
} from "./controller/collection.controller";
import {
  promotionController, promotionDetailController,
  promotionCodeController, promotionCodeDetailController,
  activePromotionsController,
} from "./controller/promotion.controller";
import {
  pageController, pageDetailController,
  menuController, menuDetailController,
  menuItemController, menuItemDetailController,
} from "./controller/content.controller";
import {
  cartController, cartItemController, cartItemDetailController,
} from "./controller/cart.controller";
import {
  metafieldDefinitionController, metafieldDefinitionDetailController,
  metafieldValueController, metafieldValueDetailController,
} from "./controller/metafield.controller";
import {
  mediaController, mediaDetailController,
  productMediaController, productMediaDetailController,
} from "./controller/media.controller";

const server = serve({
  routes: {
    // SPA fallback
    "/*": index,

    // dashboard
    "/api/admin/dashboard": dashboardController,

    // products
    "/api/admin/products": productController,
    "/api/admin/products/:id": productDetailController,
    "/api/admin/products/:productId/variants": variantController,
    "/api/admin/variants/:id": variantDetailController,
    "/api/admin/variants/:variantId/inventory": inventoryController,
    "/api/admin/inventory/low-stock": lowStockController,
    "/api/admin/variants/:variantId/inventory/adjust": inventoryAdjustController,

    // orders
    "/api/admin/orders": orderController,
    "/api/admin/orders/:id": orderDetailController,
    "/api/admin/orders/:orderId/items": orderItemController,
    "/api/admin/order-items/:id": orderItemDetailController,
    "/api/admin/orders/:orderId/payments": paymentController,
    "/api/admin/orders/:orderId/shipment": shipmentController,
    "/api/admin/shipments/:id": shipmentController,
    "/api/admin/shipments/:id/:action": shipmentActionController,
    "/api/admin/orders/:orderId/discount-codes": orderDiscountController,

    // customers
    "/api/admin/customers": customerController,
    "/api/admin/customers/:id": customerDetailController,
    "/api/admin/customers/:customerId/addresses": addressController,
    "/api/admin/addresses/:id": addressDetailController,

    // collections
    "/api/admin/collections": collectionController,
    "/api/admin/collections/:id": collectionDetailController,
    "/api/admin/collections/:id/products": collectionProductController,

    // promotions
    "/api/admin/promotions": promotionController,
    "/api/admin/promotions/active": activePromotionsController,
    "/api/admin/promotions/:id": promotionDetailController,
    "/api/admin/promotions/:promotionId/codes": promotionCodeController,
    "/api/admin/promotion-codes/:id": promotionCodeDetailController,

    // pages
    "/api/admin/pages": pageController,
    "/api/admin/pages/:id": pageDetailController,

    // menus
    "/api/admin/menus": menuController,
    "/api/admin/menus/:id": menuDetailController,
    "/api/admin/menus/:menuId/items": menuItemController,
    "/api/admin/menu-items/:id": menuItemDetailController,

    // carts
    "/api/admin/carts/:token": cartController,
    "/api/admin/carts/:cartId/items": cartItemController,
    "/api/admin/cart-items/:id": cartItemDetailController,

    // metafields
    "/api/admin/metafield-definitions/:resourceType": metafieldDefinitionController,
    "/api/admin/metafield-definitions/:id": metafieldDefinitionDetailController,
    "/api/admin/metafield-values/:resourceType/:resourceId": metafieldValueController,
    "/api/admin/metafield-values/:id": metafieldValueDetailController,

    // media
    "/api/admin/media": mediaController,
    "/api/admin/media/:id": mediaDetailController,
    "/api/admin/products/:productId/media": productMediaController,
    "/api/admin/product-media/:id": productMediaDetailController,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
