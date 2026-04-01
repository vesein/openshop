# OpenShop Admin — UI Frames Specification

> 本文档以 Figma frame 的粒度描述 Admin 后台每一个页面及其组件，供设计与前端开发对齐使用。
> 所有金额字段在数据库中以 **整数（分）** 存储，UI 层显示时除以 100 并带货币符号。

---

## 全局布局 · `Frame: AppShell`

```
┌──────────────────────────────────────────────────┐
│  TopBar                                          │
├────────┬─────────────────────────────────────────┤
│        │                                         │
│ Side-  │  <PageSlot />                           │
│  Nav   │                                         │
│        │                                         │
└────────┴─────────────────────────────────────────┘
```

### TopBar
| 组件 | 类型 | 说明 |
|------|------|------|
| Logo | `<img>` | 左侧 logo，点击回 Dashboard |
| ShopName | `<span>` | 从 `shop_settings.shop_name` 读取 |
| GlobalSearch | `<Input placeholder="Search…">` | 全局搜索：输入后弹出 Popover 显示 orders/products/customers 匹配结果 |
| NotificationBell | `<Button variant="ghost" size="icon">` | 预留消息通知入口 |
| UserAvatar | `<Button variant="ghost" size="icon">` | 头像下拉：Settings / Logout |

### SideNav
| 菜单项 | 图标 | 路由 |
|--------|------|------|
| Dashboard | `LayoutDashboard` | `#/` |
| Orders | `ShoppingCart` | `#/orders` |
| Products | `Package` | `#/products` |
| Inventory | `Warehouse` | `#/inventory` |
| Collections | `FolderTree` | `#/collections` |
| Customers | `Users` | `#/customers` |
| Promotions | `Percent` | `#/promotions` |
| Content ▸ | — | 展开子菜单 |
| — Pages | `FileText` | `#/pages` |
| — Menus | `Menu` | `#/menus` |
| Media | `Image` | `#/media` |
| Metafields | `Database` | `#/metafields` |
| Settings | `Settings` | `#/settings` |

---

## 1. Dashboard · `Frame: Dashboard`

路由：`#/`

### 1.1 StatsRow
四张 `<Card>` 横向排列

| Card | 数值来源 | 说明 |
|------|---------|------|
| Total Orders | `orders.count` | 今日 / 本周 / 本月切换 |
| Revenue | `SUM(orders.total_amount)` | 同上 |
| New Customers | `customers.count` (时间段) | 同上 |
| Low Stock Items | `inventoryLevels WHERE on_hand - reserved ≤ 10` | 红色高亮 |

每张 Card:
- `<CardHeader>` 标题 + `<Badge>` 变化百分比（↑ green / ↓ red）
- `<CardContent>` 大号数值

### 1.2 RecentOrdersTable
| 组件 | 说明 |
|------|------|
| `<Card>` 容器 | 标题 "Recent Orders" |
| `<Table>` | 列：Order#, Customer, Status（`<Badge>`）, Payment（`<Badge>`）, Total, Date |
| 行点击 | 跳转 `#/orders/:id` |
| `<Button variant="link">` "View all →" | 跳转 `#/orders` |

最多显示最近 10 条。

### 1.3 LowStockAlert
| 组件 | 说明 |
|------|------|
| `<Card>` 容器 | 标题 "Low Stock Items" |
| `<Table>` | 列：Product, SKU, On Hand, Reserved, Available |
| 行点击 | 跳转 `#/products/:productId` |

---

## 2. Orders · `Frame: OrderList` + `Frame: OrderDetail`

### 2.1 OrderList `#/orders`

#### FilterBar
| 组件 | 类型 | 说明 |
|------|------|------|
| SearchInput | `<Input placeholder="Search order# / email…">` | 模糊搜索 |
| StatusFilter | `<Select>` | 选项：All / Open / Completed / Cancelled |
| PaymentFilter | `<Select>` | 选项：All / Pending / Authorized / Partially Paid / Paid / Partially Refunded / Refunded / Failed |
| FulfillmentFilter | `<Select>` | 选项：All / Unfulfilled / Fulfilled / Returned |
| DateRangeFilter | `<Input type="date">` × 2 | 起止日期 |
| ClearFilters | `<Button variant="ghost" size="sm">` "Clear" | 重置所有筛选 |

#### OrderTable
| 列 | 组件 | 说明 |
|----|------|------|
| Order # | `<span>` link | 点击进入详情 |
| Customer | `<span>` | 显示 email 或 firstName + lastName |
| Status | `<Badge variant>` | open=default, completed=green, cancelled=red |
| Payment | `<Badge variant>` | 按状态着色 |
| Fulfillment | `<Badge variant>` | unfulfilled=yellow, fulfilled=green, returned=red |
| Total | `<span>` | 货币格式 |
| Date | `<span>` | 相对时间 |

#### Pagination
`<Pagination>` 组件：Prev / 页码 / Next

---

### 2.2 OrderDetail `#/orders/:id`

#### HeaderSection
| 组件 | 说明 |
|------|------|
| BackButton | `<Button variant="ghost" size="icon">` ← |
| OrderTitle | `<h1>` "Order #ORD-1001" |
| StatusBadge | `<Badge>` 订单状态 |
| PaymentBadge | `<Badge>` 支付状态 |
| FulfillmentBadge | `<Badge>` 履约状态 |
| ActionDropdown | `<Button variant="outline">` "More actions" ▾ → 下拉：Cancel Order |

#### Card: Order Items
| 组件 | 说明 |
|------|------|
| CardTitle | "Items" |
| `<Table>` | 列：Product（缩略图+标题+variant title）, SKU, Qty, Unit Price, Discount, Tax, Line Total |
| AddItemButton | `<Button variant="outline" size="sm">` "+ Add item" → 打开 `<Dialog>` |
| 行内 EditButton | `<Button variant="ghost" size="icon">` 铅笔图标 → 弹出编辑数量/价格 Dialog |
| 行内 RemoveButton | `<Button variant="ghost" size="icon" class="text-destructive">` 垃圾桶图标 → 确认 Dialog |

##### Dialog: AddOrderItem
| 组件 | 说明 |
|------|------|
| DialogTitle | "Add Item" |
| ProductSearch | `<Input>` 搜索产品/variant |
| SearchResults | 列表：Product Title / SKU / Price，点击选中 |
| QuantityInput | `<Input type="number" min="1">` |
| UnitPriceInput | `<Input type="number">` 可覆盖价格 |
| CancelButton | `<Button variant="outline">` |
| ConfirmButton | `<Button>` "Add" |

#### Card: Order Summary
| 行 | 说明 |
|----|------|
| Subtotal | `subtotal_amount` |
| Item Discounts | `− discount_amount` |
| Order Discount | `− order_discount_amount` |
| Shipping | `shipping_amount` |
| Shipping Discount | `− shipping_discount_amount` |
| Tax | `tax_amount` |
| **Total** | **`total_amount`** 加粗 |

#### Card: Discount Codes
| 组件 | 说明 |
|------|------|
| 已应用优惠码列表 | 每行：Code（`<Badge>`） + Promotion Name + `<Button variant="ghost" size="icon">` × 移除 |
| ApplyCodeButton | `<Button variant="outline" size="sm">` "+ Apply code" → Dialog |

##### Dialog: ApplyDiscountCode
| 组件 | 说明 |
|------|------|
| CodeInput | `<Input placeholder="Enter discount code">` |
| CancelButton | `<Button variant="outline">` |
| ApplyButton | `<Button>` "Apply" |

#### Card: Payment
| 组件 | 说明 |
|------|------|
| CardTitle | "Payments" |
| PaymentTable | 列：Provider, Amount, Status（`<Badge>`）, Processed At |
| CreatePaymentButton | `<Button variant="outline" size="sm">` "+ Record payment" |

##### Dialog: CreatePayment
| 组件 | 说明 |
|------|------|
| ProviderInput | `<Input>` 或 `<Select>` provider 名称 |
| AmountInput | `<Input type="number">` |
| StatusSelect | `<Select>` pending / authorized / captured / failed / refunded |
| ProviderPaymentIdInput | `<Input>` 可选的外部支付ID |
| CancelButton | `<Button variant="outline">` |
| SaveButton | `<Button>` "Save" |

#### Card: Shipment
| 组件 | 说明 |
|------|------|
| CardTitle | "Shipment" |
| 无运单时 | `<p>` "No shipment yet" + `<Button>` "Create shipment" |
| 有运单时 | Carrier / Service / Tracking# / Status（`<Badge>`）/ Shipped At / Delivered At |
| MarkShippedButton | `<Button size="sm">` "Mark as shipped"（status=pending 时可见）→ Dialog |
| MarkDeliveredButton | `<Button size="sm">` "Mark as delivered"（status=shipped 时可见）|

##### Dialog: MarkShipped
| 组件 | 说明 |
|------|------|
| CarrierInput | `<Input>` |
| ServiceInput | `<Input>` |
| TrackingNumberInput | `<Input>` |
| TrackingUrlInput | `<Input>` |
| CancelButton | `<Button variant="outline">` |
| ConfirmButton | `<Button>` "Confirm Shipment" |

#### Card: Customer Info
| 组件 | 说明 |
|------|------|
| Email | `<span>` 点击可跳转到 customer 详情 |
| Phone | `<span>` |
| BillingAddress | 解析 `billing_address_json` 显示 |
| ShippingAddress | 解析 `shipping_address_json` 显示 |

#### Card: Order Timeline (Events)
| 组件 | 说明 |
|------|------|
| CardTitle | "Timeline" |
| EventList | 垂直时间线，每条：图标 + event_type 描述 + actor + detail_json 摘要 + 时间戳 |

支持的 event_type：
`order_created` / `order_status_changed` / `payment_status_changed` / `fulfillment_status_changed` / `item_added` / `item_updated` / `item_removed` / `discount_applied` / `discount_removed` / `shipment_created` / `shipment_shipped` / `shipment_delivered`

---

## 3. Products · `Frame: ProductList` + `Frame: ProductDetail`

### 3.1 ProductList `#/products`

#### ActionBar
| 组件 | 说明 |
|------|------|
| SearchInput | `<Input placeholder="Search products…">` |
| StatusFilter | `<Select>` All / Draft / Active / Archived |
| CreateButton | `<Button>` "+ New product" → 跳转 `#/products/new` |

#### ProductTable
| 列 | 组件 |
|----|------|
| Image | 缩略图（`featured_media_id` → media_assets） |
| Title | `<span>` link 跳转详情 |
| Status | `<Badge>` draft=gray, active=green, archived=yellow |
| Type | `<span>` product_type |
| Vendor | `<span>` vendor |
| Variants | `<span>` variant 数量 |
| Created | `<span>` 日期 |

#### Pagination
`<Pagination>`

---

### 3.2 ProductDetail `#/products/:id`

#### HeaderSection
| 组件 | 说明 |
|------|------|
| BackButton | `<Button variant="ghost" size="icon">` ← |
| ProductTitle | `<h1>` 编辑时变 `<Input>` |
| StatusBadge | `<Badge>` |
| SaveButton | `<Button>` "Save" |
| ActionDropdown | `<Button variant="outline">` "More" ▾ → Archive / Delete（确认 Dialog） |

#### Card: Basic Information
| 字段 | 组件 |
|------|------|
| Title | `<Input>` |
| Slug | `<Input>` + 自动从 title 生成提示 |
| Status | `<Select>` draft / active / archived |
| Product Type | `<Input>` |
| Vendor | `<Input>` |
| Description | `<Textarea>` 或富文本（HTML） |
| Published At | `<Input type="datetime-local">` |

#### Card: SEO
| 字段 | 组件 |
|------|------|
| SEO Title | `<Input>` + 字符计数 |
| SEO Description | `<Textarea>` + 字符计数 |
| Preview | 模拟 Google 搜索结果片段 |

#### Card: Media
| 组件 | 说明 |
|------|------|
| MediaGrid | 拖拽排序的图片网格，每张图：缩略图 + alt 文字 |
| FeaturedStar | 每张图右上角 ★ 按钮，点击设为 featured_media |
| UploadButton | `<Button variant="outline">` "+ Upload" → 文件选择器 |
| SelectFromLibrary | `<Button variant="outline">` "Choose existing" → Media Picker Dialog |
| RemoveButton | 每张图悬浮时出现 × 按钮 |

##### Dialog: MediaPicker
| 组件 | 说明 |
|------|------|
| KindFilter | `<Select>` image / video / file |
| MediaGrid | 可多选的媒体缩略图网格 |
| Pagination | `<Pagination>` |
| CancelButton | `<Button variant="outline">` |
| ConfirmButton | `<Button>` "Select" |

#### Card: Variants
| 组件 | 说明 |
|------|------|
| `<Table>` | 列：Title, SKU, Price, Compare At, Cost, Inventory（on_hand − reserved）, Actions |
| 行内 EditButton | `<Button variant="ghost" size="icon">` 铅笔 → 跳转或弹出 VariantEdit |
| 行内 DeleteButton | `<Button variant="ghost" size="icon" class="text-destructive">` 垃圾桶 → 确认 Dialog |
| AddVariantButton | `<Button variant="outline" size="sm">` "+ Add variant" |
| Default 标记 | `<Badge>` "Default" 在 `is_default=1` 的行 |

##### Dialog/Section: VariantEdit
| 字段 | 组件 |
|------|------|
| Title | `<Input>` |
| SKU | `<Input>` |
| Barcode | `<Input>` |
| Price | `<Input type="number">` |
| Compare At Price | `<Input type="number">` |
| Cost | `<Input type="number">` |
| Weight | `<Input type="number">` + `<Select>` unit 来自 shop_settings.weight_unit |
| Requires Shipping | `<Checkbox>` |
| Taxable | `<Checkbox>` |
| Is Default | `<Checkbox>` |
| OptionValues | 每个 option 一个 `<Select>`，列出该 option 的 values |
| SaveButton | `<Button>` "Save" |
| CancelButton | `<Button variant="outline">` |

#### Card: Options
| 组件 | 说明 |
|------|------|
| OptionList | 每个 option 一行：Name + Values（`<Badge>` 列表）+ EditButton + DeleteButton |
| AddOptionButton | `<Button variant="outline" size="sm">` "+ Add option" |

##### Dialog: OptionEdit
| 字段 | 组件 |
|------|------|
| Name | `<Input>` 如 "Color" / "Size" |
| Values | Tag 输入器：输入后按 Enter 生成 `<Badge>`，每个 badge 带 × 可删 |
| SortOrder | `<Input type="number">` |
| SaveButton | `<Button>` |
| CancelButton | `<Button variant="outline">` |

#### Card: Inventory (per variant)
出现在 Variant 编辑内或作为独立 section

| 字段 | 组件 |
|------|------|
| Tracked | `<Checkbox>` |
| Allow Backorder | `<Checkbox>` |
| On Hand | `<span>` 只读 |
| Reserved | `<span>` 只读 |
| Available | `<span>` (on_hand − reserved) 只读 |
| AdjustStockButton | `<Button variant="outline" size="sm">` "Adjust" → Dialog |

##### Dialog: AdjustStock
| 字段 | 组件 |
|------|------|
| MovementType | `<Select>` in / adjust / returned |
| Quantity | `<Input type="number">` 正/负 |
| Note | `<Textarea>` |
| CancelButton | `<Button variant="outline">` |
| ConfirmButton | `<Button>` "Record movement" |

#### Card: Metafields
| 组件 | 说明 |
|------|------|
| MetafieldList | 按 namespace 分组，每行：Key, Value（按 value_type 渲染对应输入组件）, EditButton |
| AddMetafieldButton | `<Button variant="outline" size="sm">` "+ Add metafield" → Dialog |

---

## 4. Inventory · `Frame: InventoryList`

路由：`#/inventory`

### ActionBar
| 组件 | 说明 |
|------|------|
| SearchInput | `<Input placeholder="Search SKU / product…">` |
| StockFilter | `<Select>` All / Low Stock (≤10) / Out of Stock (=0) |

### InventoryTable
| 列 | 组件 |
|----|------|
| Product | 缩略图 + 产品名 + variant title |
| SKU | `<span>` |
| Tracked | `<Badge>` Yes/No |
| On Hand | `<span>` |
| Reserved | `<span>` |
| Available | `<span>` 负值红色 |
| Actions | `<Button variant="ghost" size="sm">` "Adjust" → AdjustStock Dialog |

### Pagination
`<Pagination>`

---

## 5. Collections · `Frame: CollectionList` + `Frame: CollectionDetail`

### 5.1 CollectionList `#/collections`

#### ActionBar
| 组件 | 说明 |
|------|------|
| SearchInput | `<Input>` |
| StatusFilter | `<Select>` All / Draft / Active / Archived |
| CreateButton | `<Button>` "+ New collection" |

#### CollectionTable
| 列 | 说明 |
|----|------|
| Title | link 到详情 |
| Status | `<Badge>` |
| Products | 产品数量 |
| Published At | 日期 |

#### Pagination

---

### 5.2 CollectionDetail `#/collections/:id`

#### HeaderSection
| 组件 | 说明 |
|------|------|
| BackButton | ← |
| Title | `<Input>` |
| StatusBadge | `<Badge>` |
| SaveButton | `<Button>` "Save" |
| DeleteButton | `<Button variant="destructive">` "Delete" → 确认 Dialog |

#### Card: Basic Information
| 字段 | 组件 |
|------|------|
| Title | `<Input>` |
| Slug | `<Input>` |
| Status | `<Select>` draft / active / archived |
| Description | `<Textarea>` (HTML) |
| Published At | `<Input type="datetime-local">` |

#### Card: SEO
同 Product SEO 卡片结构。

#### Card: Products
| 组件 | 说明 |
|------|------|
| ProductList | 拖拽排序列表：缩略图 + Product Title + Status Badge + `<Button variant="ghost" size="icon">` × 移除 |
| AddProductButton | `<Button variant="outline" size="sm">` "+ Add products" → ProductPicker Dialog |

##### Dialog: ProductPicker
| 组件 | 说明 |
|------|------|
| SearchInput | `<Input>` 搜索产品 |
| ProductCheckboxList | 每行：Checkbox + 缩略图 + Title + Status |
| CancelButton | `<Button variant="outline">` |
| AddButton | `<Button>` "Add selected" |

#### Card: Metafields
同 Product 的 Metafields 卡。

---

## 6. Customers · `Frame: CustomerList` + `Frame: CustomerDetail`

### 6.1 CustomerList `#/customers`

#### ActionBar
| 组件 | 说明 |
|------|------|
| SearchInput | `<Input placeholder="Search email / name…">` |
| CreateButton | `<Button>` "+ New customer" |

#### CustomerTable
| 列 | 说明 |
|----|------|
| Name | firstName + lastName，link 到详情 |
| Email | `<span>` |
| Phone | `<span>` |
| Orders | 订单数量 |
| Marketing | `<Badge>` Subscribed / Not subscribed |
| Created | 日期 |

#### Pagination

---

### 6.2 CustomerDetail `#/customers/:id`

#### HeaderSection
| 组件 | 说明 |
|------|------|
| BackButton | ← |
| CustomerName | `<h1>` |
| DeleteButton | `<Button variant="destructive" size="sm">` "Delete customer" → 确认 Dialog |

#### Card: Basic Information
| 字段 | 组件 |
|------|------|
| First Name | `<Input>` |
| Last Name | `<Input>` |
| Email | `<Input type="email">` |
| Phone | `<Input type="tel">` |
| Accepts Marketing | `<Checkbox>` |
| SaveButton | `<Button>` "Save" |

#### Card: Addresses
| 组件 | 说明 |
|------|------|
| AddressList | 每个地址一张子 Card：名、公司、地址行、城市/省/邮编/国家代码 + 电话 |
| DefaultShippingBadge | `<Badge>` "Default shipping" |
| DefaultBillingBadge | `<Badge>` "Default billing" |
| EditButton | 每张地址卡上 `<Button variant="ghost" size="sm">` "Edit" → Dialog |
| DeleteButton | 每张地址卡上 `<Button variant="ghost" size="sm" class="text-destructive">` "Delete" → 确认 |
| AddAddressButton | `<Button variant="outline" size="sm">` "+ Add address" |

##### Dialog: AddressEdit
| 字段 | 组件 |
|------|------|
| First Name | `<Input>` |
| Last Name | `<Input>` |
| Company | `<Input>` |
| Phone | `<Input>` |
| Address 1 | `<Input>` |
| Address 2 | `<Input>` |
| City | `<Input>` |
| Province | `<Input>` |
| Postal Code | `<Input>` |
| Country Code | `<Input>` 或 `<Select>` |
| Is Default Shipping | `<Checkbox>` |
| Is Default Billing | `<Checkbox>` |
| CancelButton | `<Button variant="outline">` |
| SaveButton | `<Button>` |

#### Card: Orders
| 组件 | 说明 |
|------|------|
| `<Table>` | 列：Order#, Status, Payment, Total, Date——同 OrderList 行格式 |
| 行点击 | 跳转 `#/orders/:id` |
| ViewAllLink | `<Button variant="link">` "View all orders →" |

#### Card: Metafields
同上通用 Metafield 卡。

---

## 7. Promotions · `Frame: PromotionList` + `Frame: PromotionDetail`

### 7.1 PromotionList `#/promotions`

#### ActionBar
| 组件 | 说明 |
|------|------|
| SearchInput | `<Input>` |
| StatusFilter | `<Select>` All / Draft / Active / Archived |
| TypeFilter | `<Select>` All / Percentage / Fixed Amount / Free Shipping / BOGO |
| CreateButton | `<Button>` "+ New promotion" |

#### PromotionTable
| 列 | 说明 |
|----|------|
| Name | link 到详情 |
| Type | `<Badge>` percentage / fixed_amount / free_shipping / bogo |
| Status | `<Badge>` |
| Discount Value | 显示金额或百分比 |
| Usage | `usage_count / usage_limit`（或 "Unlimited"） |
| Period | starts_at ~ ends_at |

#### Pagination

---

### 7.2 PromotionDetail `#/promotions/:id`

#### HeaderSection
| 组件 | 说明 |
|------|------|
| BackButton | ← |
| PromotionName | `<h1>` |
| StatusBadge | `<Badge>` |
| SaveButton | `<Button>` "Save" |
| DeleteButton | `<Button variant="destructive">` "Delete" |

#### Card: Basic Information
| 字段 | 组件 |
|------|------|
| Name | `<Input>` |
| Type | `<Select>` percentage / fixed_amount / free_shipping / bogo |
| Status | `<Select>` draft / active / archived |
| Discount Value | `<Input type="number">` |
| Min Purchase Amount | `<Input type="number">` |
| Starts At | `<Input type="datetime-local">` |
| Ends At | `<Input type="datetime-local">` |
| Usage Limit | `<Input type="number">` 空表示 unlimited |
| Once Per Customer | `<Checkbox>` |

#### Card: BOGO Settings (type=bogo 时显示)
| 字段 | 组件 |
|------|------|
| Buy Quantity | `<Input type="number" min="1">` |
| Get Quantity | `<Input type="number" min="1">` |

#### Card: Rules (JSON)
| 组件 | 说明 |
|------|------|
| RulesEditor | `<Textarea>` 显示 `rules_json`，带 JSON 语法校验提示 |

#### Card: Discount Codes
| 组件 | 说明 |
|------|------|
| `<Table>` | 列：Code, Usage（`usage_count / usage_limit`）, Created |
| 行内 EditButton | `<Button variant="ghost" size="icon">` |
| 行内 DeleteButton | `<Button variant="ghost" size="icon" class="text-destructive">` → 确认 Dialog |
| AddCodeButton | `<Button variant="outline" size="sm">` "+ Add code" |

##### Dialog: DiscountCodeEdit
| 字段 | 组件 |
|------|------|
| Code | `<Input>` 大写自动转换 |
| Usage Limit | `<Input type="number">` |
| CancelButton | `<Button variant="outline">` |
| SaveButton | `<Button>` |

#### Card: Metafields
同通用 Metafield 卡。

---

## 8. Content: Pages · `Frame: PageList` + `Frame: PageDetail`

### 8.1 PageList `#/pages`

#### ActionBar
| 组件 | 说明 |
|------|------|
| SearchInput | `<Input>` |
| StatusFilter | `<Select>` All / Draft / Active / Archived |
| CreateButton | `<Button>` "+ New page" |

#### PageTable
| 列 | 说明 |
|----|------|
| Title | link |
| Slug | `<span>` |
| Status | `<Badge>` |
| Published At | 日期 |
| Updated At | 日期 |

#### Pagination

---

### 8.2 PageDetail `#/pages/:id`

#### HeaderSection
| 组件 | 说明 |
|------|------|
| BackButton | ← |
| PageTitle | `<Input>` |
| StatusBadge | `<Badge>` |
| SaveButton | `<Button>` "Save" |
| DeleteButton | `<Button variant="destructive">` "Delete" |

#### Card: Basic Information
| 字段 | 组件 |
|------|------|
| Title | `<Input>` |
| Slug | `<Input>` |
| Status | `<Select>` draft / active / archived |
| Published At | `<Input type="datetime-local">` |

#### Card: Content
| 组件 | 说明 |
|------|------|
| ContentEditor | `<Textarea>` 展示 `content_json`。理想情况可替换为可视化 JSON block editor |

#### Card: SEO
同 Product SEO 卡。

#### Card: Metafields
同通用 Metafield 卡。

---

## 9. Content: Menus · `Frame: MenuList` + `Frame: MenuDetail`

### 9.1 MenuList `#/menus`

#### ActionBar
| 组件 | 说明 |
|------|------|
| CreateButton | `<Button>` "+ New menu" |

#### MenuTable
| 列 | 说明 |
|----|------|
| Name | link |
| Handle | `<span>` |
| Items Count | `<span>` |
| Updated At | 日期 |

---

### 9.2 MenuDetail `#/menus/:id`

#### HeaderSection
| 组件 | 说明 |
|------|------|
| BackButton | ← |
| MenuName | `<Input>` |
| Handle | `<Input>` |
| SaveButton | `<Button>` "Save" |
| DeleteButton | `<Button variant="destructive">` "Delete" |

#### Card: Menu Items
| 组件 | 说明 |
|------|------|
| TreeView | 缩进的可折叠树形列表，支持拖拽排序和层级调整 |
| 每一项 | 拖拽手柄 + Title + LinkType（`<Badge>`）+ LinkTarget + EditButton + DeleteButton |
| AddItemButton | `<Button variant="outline" size="sm">` "+ Add item" |

##### Dialog: MenuItemEdit
| 字段 | 组件 |
|------|------|
| Title | `<Input>` |
| Link Type | `<Select>` page / collection / product / external / home |
| Link Target | `<Input>`（external 时输入 URL，其他类型提供下拉选择对应资源）|
| Parent | `<Select>` None / 已有菜单项（仅同一 menu_id 的项） |
| Sort Order | `<Input type="number">` |
| CancelButton | `<Button variant="outline">` |
| SaveButton | `<Button>` |

---

## 10. Media · `Frame: MediaLibrary`

路由：`#/media`

### ActionBar
| 组件 | 说明 |
|------|------|
| KindFilter | `<Select>` All / Image / Video / File |
| UploadButton | `<Button>` "+ Upload" → 触发文件选择器 |

### MediaGrid
| 组件 | 说明 |
|------|------|
| MediaCard | 网格布局卡片：缩略图/图标 + Filename + Kind badge + Size + Dimensions |
| 悬浮操作 | EditButton (铅笔) + DeleteButton (垃圾桶) |
| 点击 | 打开 MediaDetail Dialog |

### Pagination
`<Pagination>`

### Dialog: MediaDetail
| 组件 | 说明 |
|------|------|
| Preview | 大图/视频播放/文件图标 |
| Alt | `<Input>` |
| Kind | `<Badge>` 只读 |
| MIME Type | `<span>` 只读 |
| Dimensions | `<span>` width × height |
| Size | `<span>` human-readable |
| Storage Key | `<span>` 只读 |
| Created At | `<span>` |
| SaveButton | `<Button>` "Save" |
| DeleteButton | `<Button variant="destructive">` "Delete" → 确认 Dialog（提示可能影响引用此媒体的产品） |
| CloseButton | Dialog 关闭 × |

---

## 11. Metafields · `Frame: MetafieldDefinitions`

路由：`#/metafields`

### ActionBar
| 组件 | 说明 |
|------|------|
| ResourceTypeFilter | `<Select>` All / Shop / Product / Variant / Collection / Customer / Order / Page / Promotion |
| CreateButton | `<Button>` "+ New definition" |

### DefinitionTable
| 列 | 说明 |
|----|------|
| Resource Type | `<Badge>` |
| Namespace | `<span>` |
| Key | `<span>` |
| Name | `<span>` |
| Value Type | `<Badge>` text / integer / number / boolean / json |
| Visible Admin | ✓ / — |
| Visible Storefront | ✓ / — |
| Actions | EditButton + DeleteButton |

### Dialog: MetafieldDefinitionEdit
| 字段 | 组件 |
|------|------|
| Resource Type | `<Select>` shop / product / variant / collection / customer / order / page / promotion |
| Namespace | `<Input>` |
| Key | `<Input>` |
| Name | `<Input>` |
| Description | `<Textarea>` |
| Value Type | `<Select>` text / integer / number / boolean / json |
| Default Value | 根据 value_type 动态渲染对应输入组件 |
| Validations (JSON) | `<Textarea>` |
| Visible in Admin | `<Checkbox>` |
| Visible in Storefront | `<Checkbox>` |
| Pinned Position | `<Input type="number">` |
| CancelButton | `<Button variant="outline">` |
| SaveButton | `<Button>` |

---

## 12. Settings · `Frame: Settings`

路由：`#/settings`

### Card: General
| 字段 | 组件 |
|------|------|
| Shop Name | `<Input>` |
| Shop Description | `<Textarea>` |
| Support Email | `<Input type="email">` |

### Card: Locale & Currency
| 字段 | 组件 |
|------|------|
| Currency Code | `<Input>` 或 `<Select>` (USD / EUR / GBP / CNY / JPY …) |
| Locale | `<Input>` 或 `<Select>` (en / zh / ja …) |
| Timezone | `<Select>` 时区列表 |
| Weight Unit | `<Select>` g / kg / oz / lb |

### Card: Order
| 字段 | 组件 |
|------|------|
| Order Prefix | `<Input>` 如 "ORD" |

### SaveButton
`<Button>` "Save settings"（页面底部固定 sticky bar）

---

## 通用模式 · Shared Patterns

### Metafield Card（通用可复用组件）
所有资源详情页共享同一 Metafield 编辑卡片：
- 从 `metafield_definitions` 按 `resource_type` 过滤获取可用定义
- 从 `metafield_values` 按 `resource_type + resource_id` 读取当前值
- 每个已有值渲染为一行：Namespace.Key（`<Label>`）+ 值输入组件 + SaveButton + DeleteButton
- 值输入组件按 `value_type` 切换：
  - `text` → `<Input>`
  - `integer` → `<Input type="number" step="1">`
  - `number` → `<Input type="number" step="any">`
  - `boolean` → `<Checkbox>`
  - `json` → `<Textarea>` 带 JSON 校验

### Confirm Dialog（通用删除确认）
| 组件 | 说明 |
|------|------|
| DialogTitle | "Are you sure?" |
| DialogDescription | 具体描述将要删除的内容 |
| CancelButton | `<Button variant="outline">` "Cancel" |
| ConfirmButton | `<Button variant="destructive">` "Delete" |

### Empty State（通用空状态）
| 组件 | 说明 |
|------|------|
| Illustration | 空状态插图 |
| Message | `<p>` 如 "No products yet" |
| ActionButton | `<Button>` "Create your first product" |

### Loading State
| 组件 | 说明 |
|------|------|
| Skeleton | 表格/卡片骨架屏 |
| Spinner | `<Loader2 className="animate-spin" />` 在按钮内或页面中心 |

### Toast Notifications
使用 Sonner `<Toaster>` 全局组件：
- 成功：绿色 toast "Product saved"
- 错误：红色 toast "Failed to save: ..."
- 信息：默认 toast

---

## Frame 总览表

| # | Frame 名称 | 路由 | 主表/数据源 |
|---|-----------|------|------------|
| 0 | AppShell | — | — |
| 1 | Dashboard | `#/` | orders, customers, inventory_levels |
| 2a | OrderList | `#/orders` | orders |
| 2b | OrderDetail | `#/orders/:id` | orders, order_items, payments, shipments, order_events, order_discount_codes |
| 3a | ProductList | `#/products` | products |
| 3b | ProductDetail | `#/products/:id` | products, product_variants, product_options, product_option_values, variant_option_values, product_media, inventory_items, inventory_levels |
| 4 | InventoryList | `#/inventory` | inventory_items, inventory_levels, product_variants, products |
| 5a | CollectionList | `#/collections` | collections |
| 5b | CollectionDetail | `#/collections/:id` | collections, collection_products |
| 6a | CustomerList | `#/customers` | customers |
| 6b | CustomerDetail | `#/customers/:id` | customers, customer_addresses, orders |
| 7a | PromotionList | `#/promotions` | promotions |
| 7b | PromotionDetail | `#/promotions/:id` | promotions, discount_codes |
| 8a | PageList | `#/pages` | pages |
| 8b | PageDetail | `#/pages/:id` | pages |
| 9a | MenuList | `#/menus` | menus |
| 9b | MenuDetail | `#/menus/:id` | menus, menu_items |
| 10 | MediaLibrary | `#/media` | media_assets |
| 11 | MetafieldDefinitions | `#/metafields` | metafield_definitions |
| 12 | Settings | `#/settings` | shop_settings |
