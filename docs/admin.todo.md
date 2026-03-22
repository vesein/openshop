# Admin 前端功能补全 TODO

> 对照 `migrations/0001_baseline.sql` 及后续迁移后的 schema，盘点当前 admin 前端已实现 / 未实现的功能。
> 按模块分组，标注优先级（P0 = 核心流程缺失, P1 = 重要功能缺失, P2 = 体验增强）。

---

## 建议实施顺序

路由改造是详情页拆分的前置条件，应最先完成。推荐按以下顺序推进：

1. **路由改造**（第 10 节）— 引入 wouter，改造 Layout，为后续所有详情页提供基础设施
2. **全局基础设施**（第 11 节）— Toast、分页组件、错误处理，所有页面都会用到
3. **商品详情页**（第 1 节）— 拆分为独立路由页，内嵌变体/库存/选项管理
4. **订单详情页**（第 2 节）— 拆分为独立路由页，内嵌发货/支付/折扣码管理
5. **促销规则编辑器**（第 3 节）— 补全 rulesJson UI + 后端规则引擎，使促销功能可用
6. **媒体库**（第 5 节）— 文件上传 + 媒体管理页，商品图片功能依赖此模块
7. **商品图片管理**（第 1 节 P1）— 依赖媒体库完成后，在 ProductDetailPage 中实现
8. **集合管理**（第 4 节）— 新页面 + 商品关联
9. **内容管理增强**（第 8 节）— 菜单项管理、页面内容编辑
10. **客户管理增强**（第 9 节）— 地址编辑/删除、订单历史
11. **购物车/Metafield**（第 6-7 节）— 低优先级，按需实现

---

## 1. 商品管理 (products.tsx)

### 已实现
- [x] 商品列表（搜索、状态筛选）
- [x] 商品 CRUD（title, slug, status, productType, vendor, descriptionHtml）
- [x] 商品详情弹窗（含变体列表只读展示）

### 未实现

#### P0 — 变体管理
> 具体 UI 在 ProductDetailPage 中实现，见第 10 节路由改造。

- [ ] 变体 CRUD 界面（在商品详情页内嵌）
  - 字段：title, sku, barcode, priceAmount, compareAtAmount, costAmount, weightValue, requiresShipping, taxable, isDefault, sortOrder
  - **注意**：active 状态的商品不允许新增/删除变体（SQL trigger 约束），前端需先切到 draft，建议提供「解锁编辑」按钮自动将状态切为 draft
- [ ] 变体排序（拖拽排序 sortOrder）

#### P0 — 库存管理
> 具体 UI 在 ProductDetailPage 中实现，见第 10 节路由改造。

- [ ] 库存查看界面（每个变体的 onHand / reserved，来自 inventory_levels）
  - 后端 API 已有：`GET /api/admin/variants/:variantId/inventory`
- [ ] 库存调整操作（入库 in / 手动调整 adjust）
  - 后端 API 已有：`POST /api/admin/variants/:variantId/inventory/adjust`
  - 需要填写：movementType, quantityDelta, note
- [ ] 低库存预警列表页面
  - 后端 API 已有：`GET /api/admin/inventory/low-stock`

#### P1 — 商品选项 (Options)
> 具体 UI 在 ProductDetailPage 中实现，见第 10 节路由改造。

- [ ] 选项管理界面（在商品详情页内嵌），如"颜色"、"尺码"
  - 后端 API 已有：`/api/admin/products/:productId/options`
  - CRUD：name, sortOrder
- [ ] 选项值管理（每个选项下的可选值），如"红色"、"蓝色"
  - 后端 API 已有：`/api/admin/product-options/:optionId/values`
  - CRUD：value, sortOrder
- [ ] 变体-选项值关联
  - 后端 API 已有：`PUT /api/admin/variants/:variantId/option-values`
  - **注意**：active 商品不允许修改选项/选项值（SQL trigger 约束）

#### P1 — 商品图片
> 具体 UI 在 ProductDetailPage 中实现，见第 10 节路由改造。依赖第 5 节媒体库先完成。

- [ ] 商品图片上传与管理
  - 后端 API 已有：`/api/admin/products/:productId/media`、`/api/admin/media`
  - 功能：attach/detach 图片、设置排序、指定变体图片、设置 featured_media_id
  - **依赖**：需要实现文件上传（见第 5 节"媒体库"）
- [ ] 图片列表展示（缩略图、alt 文本）

#### P1 — SEO 字段
- [ ] 商品编辑表单补充 seoTitle / seoDescription 字段
  - 数据库已有 `seo_title`, `seo_description` 列

#### P1 — publishedAt 管理
- [ ] 商品上架时设置 publishedAt（storefront 查询依赖此字段过滤已发布商品）
  - 方案 A：status 切为 active 时自动填入当前时间
  - 方案 B：提供独立的"发布时间"字段，支持定时发布
  - 下架（archived）时是否清除 publishedAt 取决于业务需求

#### P2 — 商品软删除
- [ ] 商品列表加"已删除"筛选（deletedAt IS NOT NULL）
- [ ] 商品恢复操作（清除 deletedAt）
- [ ] **注意**：active 商品不能直接软删除（SQL trigger 约束），需先设为 draft/archived

---

## 2. 订单管理 (orders.tsx)

### 已实现
- [x] 订单列表（搜索、三维状态筛选、统计卡片）
- [x] 订单详情弹窗（items, 金额明细）
- [x] 订单状态更新弹窗（paymentStatus, fulfillmentStatus, orderStatus）

### 未实现

#### P1 — 创建订单
> B2C 场景下订单通常由前台购物流程产生，手动创建为辅助功能。若业务以 B2B/电话下单为主则应提升为 P0。

- [ ] 手动创建订单界面
  - 选择客户（或输入邮箱/手机）
  - 选择商品变体、设置数量
  - 设置地址（billingAddressJson, shippingAddressJson）
  - 设置货币、备注
  - **后端依赖**：需要新增 order service 的 `createFullOrder()` 方法，在事务中创建 order + order_items + 库存扣减

#### P0 — 发货管理
> 具体 UI 在 OrderDetailPage 中实现，见第 10 节路由改造。

- [ ] 在订单详情中管理发货信息（shipments）
  - 创建发货单：`POST /api/admin/orders/:orderId/shipment`
  - 标记已发货：`POST /api/admin/shipments/:id/ship`（carrier, trackingNumber, trackingUrl）
  - 标记已送达：`POST /api/admin/shipments/:id/deliver`
  - 查看物流信息
- [ ] 发货状态时间线展示

#### P1 — 支付记录
> 具体 UI 在 OrderDetailPage 中实现，见第 10 节路由改造。

- [ ] 在订单详情中展示支付记录列表
  - 后端 API 已有：`GET /api/admin/orders/:orderId/payments`
  - 字段：provider, amount, status, processedAt
- [ ] 手动记录支付
  - 后端 API 已有：`POST /api/admin/orders/:orderId/payments`

#### P1 — 订单折扣码
> 具体 UI 在 OrderDetailPage 中实现，见第 10 节路由改造。

- [ ] 在订单详情中展示/应用/移除折扣码
  - 后端 API 已有：`/api/admin/orders/:orderId/discount-codes`
  - 支持通过 code 字符串或 discountCodeId 应用

#### P1 — 订单商品编辑
> 具体 UI 在 OrderDetailPage 中实现，见第 10 节路由改造。

- [ ] 在订单详情中修改/删除订单商品行项
  - 后端 API 已有：`PATCH /api/admin/order-items/:id`、`DELETE /api/admin/order-items/:id`
  - 字段：quantity, unitPriceAmount, discountAmount

#### P2 — 订单金额完整展示
- [ ] 展示所有金额字段：subtotalAmount, discountAmount, orderDiscountAmount, shippingAmount, shippingDiscountAmount, taxAmount, totalAmount
- [ ] 展示 billingAddressJson / shippingAddressJson（解析 JSON 展示）
- [ ] 展示 placedAt / cancelledAt 时间

#### P2 — 分页
- [ ] 订单列表分页（当前后端返回了 total, page, pageSize 但前端未使用）

---

## 3. 促销管理 (promotions.tsx)

### 已实现
- [x] 促销列表（含折扣码展示）
- [x] 促销 CRUD（name, type, status, startsAt, endsAt, usageLimit）
- [x] 折扣码添加/删除

### 未实现

#### P0 — 规则编辑器 (rulesJson)
> 没有此编辑器，促销功能等于残废——能创建记录但无法配置任何实际折扣规则。

- [ ] 根据 type 渲染不同的规则编辑表单
  - `percentage`: { discountPercent, minPurchaseAmount?, appliesTo? }
  - `fixed_amount`: { discountAmount, minPurchaseAmount?, appliesTo? }
  - `free_shipping`: { minPurchaseAmount? }
  - `bogo`: { buyQuantity, getQuantity, buyProductIds?, getProductIds? }
- [ ] 当前 rulesJson 字段完全没有 UI，用户无法配置折扣规则
- [ ] **注意**：SQL 有 CHECK 约束要求 rulesJson 是合法 JSON object
- [ ] **后端依赖**：后端目前也没有"根据 rulesJson 计算折扣金额"的 service 方法，前端即使能编辑规则，下单时也无法自动应用。需要新增促销规则引擎（见后端依赖清单）

#### P1 — oncePerCustomer 字段
- [ ] 促销表单补充"每位客户限用一次"开关
  - 数据库已有 `once_per_customer` 列

#### P2 — 折扣码详情
- [ ] 展示每个折扣码的 usageLimit / usageCount
- [ ] 折扣码编辑（修改 usageLimit）

---

## 4. 商品集合 (Collections) — 整页缺失

### 未实现

#### P1 — 集合管理页面
> 集合是商品组织工具，不影响核心交易链路（下单/支付/发货），降为 P1。
- [ ] 新增 `collections.tsx` 页面
- [ ] 集合列表（title, slug, status, publishedAt）
- [ ] 集合 CRUD
  - 后端 API 已有：`/api/admin/collections`、`/api/admin/collections/:id`
  - 字段：title, slug, status, descriptionHtml, seoTitle, seoDescription
- [ ] 集合-商品关联管理
  - 后端 API 已有：`/api/admin/collections/:id/products`
  - 功能：添加/移除/排序商品
- [ ] publishedAt 管理（与商品同理，storefront 查询依赖此字段）
- [ ] 在 App.tsx router 和 layout.tsx 侧边栏注册新页面

---

## 5. 媒体库 (Media) — 整页缺失

### 未实现

#### P1 — 媒体管理页面
- [ ] 新增 `media.tsx` 页面
- [ ] 媒体列表（缩略图网格、kind 筛选、分页）
  - 后端 API 已有：`GET /api/admin/media`（支持 kind, page, pageSize）
- [ ] 文件上传功能
  - **后端依赖**：需要新增文件上传 endpoint
  - 处理流程：接收 multipart/form-data → 存储到本地磁盘/对象存储 → 创建 media_assets 记录（storageKey, mimeType, width, height, sizeBytes）
  - 建议存储路径：`data/uploads/` 或可配置
- [ ] 删除媒体
  - 后端 API 已有：`DELETE /api/admin/media/:id`
- [ ] 图片预览弹窗（展示元信息：尺寸、大小、alt）
- [ ] alt 文本编辑（SEO 关键字段，需支持内联编辑）
- [ ] 在 App.tsx router 和 layout.tsx 侧边栏注册新页面

---

## 6. 购物车管理 (Carts) — 整页缺失

### 未实现

#### P2 — 购物车管理页面
- [ ] 新增 `carts.tsx` 页面（运营/调试用）
- [ ] 购物车列表
  - 后端 API 已有：`POST /api/admin/carts`（list 用 POST 传复杂筛选）
- [ ] 查看购物车详情（含 cart_items）
  - 后端 API 已有：`GET /api/admin/carts/:token`
- [ ] 手动废弃购物车
  - 后端 API 已有：`PATCH /api/admin/carts/:token` (status → abandoned)
- [ ] 在 App.tsx router 和 layout.tsx 侧边栏注册新页面

---

## 7. Metafield 管理 — 整页缺失

### 未实现

#### P2 — Metafield 管理页面
- [ ] 新增 `metafields.tsx` 页面
- [ ] Metafield Definitions 管理
  - 后端 API 已有：`/api/admin/metafield-definitions`
  - 字段：resourceType, namespace, key, name, description, valueType, validationsJson, defaultValueJson, visibleInAdmin, visibleInStorefront, pinnedPosition
- [ ] Metafield Values 管理（在各资源详情页内嵌）
  - 后端 API 已有：`/api/admin/metafield-values/:resourceType/:resourceId`
  - 在商品/集合/客户/订单等详情页中展示和编辑关联的 metafield values
- [ ] 在 App.tsx router 和 layout.tsx 侧边栏注册新页面

---

## 8. 内容管理增强 (pages.tsx)

### 已实现
- [x] 页面 CRUD（title, slug, status, seoTitle, seoDescription）
- [x] 菜单 CRUD（name, handle）

### 未实现

#### P1 — 页面内容编辑
- [ ] contentJson 可视化编辑器（当前字段存在但表单中没有编辑入口）
  - 最简方案：JSON textarea 编辑
  - 进阶方案：引入富文本编辑器（见"依赖"章节）

#### P1 — 菜单项管理 (menu_items)
> 具体 UI 在 MenuDetailPage 中实现，见第 10 节路由改造。

- [ ] 菜单项 CRUD（在菜单详情中内嵌）
  - 后端 API 已有：`/api/admin/menus/:menuId/items`、`/api/admin/menu-items/:id`
  - 字段：title, linkType (page/collection/product/external/home), linkTarget, sortOrder, parentId
- [ ] 菜单项排序（拖拽）
- [ ] 菜单项树形层级展示（parentId 支持嵌套）
- [ ] 链接目标选择器（根据 linkType 选择对应的 page/collection/product 或输入外部 URL）

#### P2 — 页面状态补充
- [ ] 页面状态下拉补充 `archived` 选项（SQL CHECK 允许 draft/active/archived）

---

## 9. 客户管理增强 (customers.tsx)

### 已实现
- [x] 客户列表（搜索、统计卡片）
- [x] 客户 CRUD
- [x] 客户详情（含地址列表）
- [x] 添加地址

### 未实现

#### P1 — 地址编辑/删除
> 具体 UI 在 CustomerDetailPage 中实现，见第 10 节路由改造。

- [ ] 编辑已有地址
  - 后端 API 已有：`PATCH /api/admin/addresses/:id`
- [ ] 删除地址
  - 后端 API 已有：`DELETE /api/admin/addresses/:id`

#### P2 — 客户关联数据
> 具体 UI 在 CustomerDetailPage 中实现，见第 10 节路由改造。

- [ ] 在客户详情中展示该客户的订单历史
  - 后端 API 已有：`GET /api/admin/orders?customerId=xxx`
- [ ] 展示客户总消费额、订单数等统计
- [ ] 分页

---

## 10. 路由改造（弃用弹窗式二级页面）

当前架构用 `useState("dashboard")` 做一级路由切换，所有二级内容（商品详情、订单详情、客户详情等）都用 Dialog 弹窗承载。随着功能补全，弹窗模式存在明显问题：

- 弹窗空间不足以容纳变体管理、库存管理、选项编辑、图片管理等复杂子模块
- 无法通过 URL 直接访问某个商品/订单（无法分享链接、无法刷新保持状态）
- 无浏览器前进/后退支持

#### P0 — 引入路由库，改造整体导航

建议引入 `wouter`（~1.5KB gzip，零依赖，hash 模式开箱即用）替代当前的 useState 路由。

- [ ] 安装 `wouter`：`bun add wouter`
- [ ] 改造 App.tsx：用 `<Router>` + `<Route>` 替代 switch/case

```tsx
// App.tsx 改造示意
import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

export function App() {
  return (
    <Router hook={useHashLocation}>
      <Layout>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/products/:id" component={ProductDetailPage} />
          <Route path="/orders" component={OrdersPage} />
          <Route path="/orders/:id" component={OrderDetailPage} />
          <Route path="/customers" component={CustomersPage} />
          <Route path="/customers/:id" component={CustomerDetailPage} />
          <Route path="/collections" component={CollectionsPage} />
          <Route path="/collections/:id" component={CollectionDetailPage} />
          <Route path="/promotions" component={PromotionsPage} />
          <Route path="/pages" component={PagesPage} />
          <Route path="/menus/:id" component={MenuDetailPage} />
          <Route path="/media" component={MediaPage} />
          <Route path="/settings" component={SettingsPage} />
        </Switch>
      </Layout>
    </Router>
  );
}
```

- [ ] 改造 layout.tsx 侧边栏：`onItemClick` 改为 `<Link href="...">`，用 `useLocation()` 判断 active 状态
- [ ] Layout 组件不再接收 `activeItem` prop，改为从 URL 路径推断

#### P0 — 拆分详情页（弹窗 → 独立页面）

以下二级内容从 Dialog 弹窗改为独立路由页面：

- [ ] **ProductDetailPage** (`/products/:id`)
  - 商品基本信息编辑（取代 products.tsx 中的编辑弹窗）
  - 内嵌 Tab 或 Section：变体管理、选项管理、图片管理、库存管理、SEO、Metafields
- [ ] **OrderDetailPage** (`/orders/:id`)
  - 订单完整信息展示（取代 orders.tsx 中的详情弹窗）
  - 内嵌 Section：商品行项、支付记录、发货管理、折扣码、地址信息
- [ ] **CustomerDetailPage** (`/customers/:id`)
  - 客户信息 + 地址管理（取代 customers.tsx 中的详情弹窗）
  - 内嵌 Section：地址列表（编辑/删除）、订单历史、统计
- [ ] **CollectionDetailPage** (`/collections/:id`)
  - 集合基本信息编辑
  - 内嵌 Section：关联商品管理（添加/移除/排序）、SEO、publishedAt
- [ ] **MenuDetailPage** (`/menus/:id`)
  - 菜单项管理（取代 pages.tsx 中缺失的菜单项功能）
  - 树形菜单项列表、添加/编辑/删除/排序

保留使用 Dialog 弹窗的场景（适合弹窗的轻量操作）：
- 删除确认弹窗
- 快速创建弹窗（创建商品/订单/客户 的简单表单，提交后跳转到详情页）
- 添加折扣码弹窗
- 状态更新弹窗

---

## 11. 全局/通用增强

#### P1 — 分页组件
- [ ] 抽取通用分页组件（当前所有列表页都不支持分页，只显示第一页）
- [ ] 后端已全部返回 `{ items, total, page, pageSize }`

#### P1 — Toast/Notification
- [ ] 操作成功/失败提示（当前只有 console.error，用户无法看到）
  - 建议：引入 sonner 或 react-hot-toast

#### P1 — 错误处理
- [ ] 统一的 fetch 错误处理和展示（网络错误、后端 4xx/5xx）
- [ ] 表单校验（必填字段、格式校验）

#### P2 — 搜索防抖
- [ ] 搜索输入 debounce（当前输入不触发搜索，需手动操作）

#### P2 — 确认提示
- [ ] 危险操作二次确认统一化（当前部分页面有，部分没有）

#### P2 — 拖拽排序
- [ ] 需要拖拽排序的场景：变体排序、选项排序、选项值排序、菜单项排序、集合商品排序、商品图片排序
  - 建议：引入 @dnd-kit/core

---

## 后端依赖清单

以下后端功能需要新增或补全，才能支撑上述前端需求：

| 功能 | 现状 | 需要做的 |
|---|---|---|
| 促销规则引擎 | 不存在 | 新增 promotionService.calculateDiscount()，根据 rulesJson + type 计算折扣金额，供下单流程调用。包括：校验最低消费、计算百分比/固定金额折扣、BOGO 逻辑、免运费判定 |
| 文件上传 endpoint | 不存在 | 新增 `POST /api/admin/media/upload`，处理 multipart/form-data，存储文件，创建 media_assets 记录 |
| 媒体文件访问 | 不存在 | 新增静态文件服务路由（如 `/uploads/*`），或用 `Bun.file()` 返回 |
| 创建完整订单 | 仅 orderDao.create（不含 items） | 新增 orderService.createFullOrder()，事务内创建 order + items + 库存操作 + 促销计算 |

---

## 前端依赖建议

| 依赖 | 用途 | 是否必须 |
|---|---|---|
| `wouter` | 轻量路由（~1.5KB，hash 模式，替代 useState 路由） | P0 必须 |
| `sonner` 或 `react-hot-toast` | Toast 通知 | P1 推荐 |
| `@dnd-kit/core` + `@dnd-kit/sortable` | 拖拽排序 | P2 可选，菜单项/变体/图片排序 |
| Rich text editor（如 `@tiptap/react`） | 页面内容编辑、商品描述 | P2 可选，最简方案用 textarea |

---

## 侧边栏新增入口

路由改造后，layout.tsx 的 menuItems 改为 `href` 路径格式（配合 wouter `<Link>`）：

```ts
{ href: "/", label: "仪表盘", icon: LayoutDashboard },
{ href: "/products", label: "商品管理", icon: Package },
{ href: "/collections", label: "商品集合", icon: FolderOpen },
{ href: "/orders", label: "订单管理", icon: ShoppingCart },
{ href: "/customers", label: "客户管理", icon: Users },
{ href: "/promotions", label: "促销活动", icon: Tag },
{ href: "/media", label: "媒体库", icon: Image },
{ href: "/pages", label: "内容管理", icon: FileText },
{ href: "/settings", label: "系统设置", icon: Settings },
// 以下为可选
// { href: "/carts", label: "购物车", icon: ShoppingBag },
// { href: "/metafields", label: "元字段", icon: Database },
```
