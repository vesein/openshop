import { serve } from "bun";
import index from "./index.html";

// controllers
import {
  productController, productDetailController,
  variantController, variantDetailController,
  inventoryController, lowStockController,
  inventoryAdjustController,
  productOptionController, productOptionDetailController,
  optionValueController, optionValueDetailController,
  variantOptionValueController,
} from "./controller/product.controller";
import {
  orderController, orderDetailController,
  orderItemController, orderItemDetailController,
  paymentController, adminPaymentDetailController,
  orderShipmentController, shipmentDetailController, shipmentActionController,
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
  cartListController, cartController,
  cartItemController, cartItemDetailController,
} from "./controller/cart.controller";
import {
  metafieldDefinitionController, metafieldDefinitionDetailController,
  metafieldValueController, metafieldValueDetailController,
} from "./controller/metafield.controller";
import {
  mediaController, mediaDetailController,
  productMediaController, productMediaDetailController,
} from "./controller/media.controller";
import { settingsController } from "./controller/settings.controller";

const server = serve({
  routes: {
    // SPA fallback
    "/*": index,

    // dashboard
    "/api/admin/dashboard": dashboardController,

    // settings
    "/api/admin/settings": settingsController,

    // products
    "/api/admin/products": productController,
    "/api/admin/products/:id": productDetailController,
    "/api/admin/products/:productId/variants": variantController,
    "/api/admin/variants/:id": variantDetailController,
    "/api/admin/variants/:variantId/inventory": inventoryController,
    "/api/admin/inventory/low-stock": lowStockController,
    "/api/admin/variants/:variantId/inventory/adjust": inventoryAdjustController,

    // product options
    "/api/admin/products/:productId/options": productOptionController,
    "/api/admin/product-options/:id": productOptionDetailController,
    "/api/admin/product-options/:optionId/values": optionValueController,
    "/api/admin/product-option-values/:id": optionValueDetailController,
    "/api/admin/variants/:variantId/option-values": variantOptionValueController,

    // orders
    "/api/admin/orders": orderController,
    "/api/admin/orders/:id": orderDetailController,
    "/api/admin/orders/:orderId/items": orderItemController,
    "/api/admin/order-items/:id": orderItemDetailController,
    "/api/admin/orders/:orderId/payments": paymentController,
    "/api/admin/payments/:id": adminPaymentDetailController,
    "/api/admin/orders/:orderId/shipment": orderShipmentController,
    "/api/admin/shipments/:id": shipmentDetailController,
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
    "/api/admin/carts": cartListController,
    "/api/admin/carts/:token": cartController,
    "/api/admin/carts/:cartId/items": cartItemController,
    "/api/admin/cart-items/:id": cartItemDetailController,

    // metafields
    "/api/admin/metafield-definitions": metafieldDefinitionController,
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
