import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  CreditCard,
  Truck,
  Tag,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/date-utils";
import { formatMoneyMinorUnits } from "@/lib/money";

// ---- Interfaces ----

interface Order {
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
  billingAddressJson: string | object | null;
  shippingAddressJson: string | object | null;
  note: string | null;
  placedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  orderId: number;
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPriceAmount: number;
}

interface Payment {
  id: number;
  orderId: number;
  provider: string;
  amount: number;
  currencyCode: string;
  status: string;
  processedAt: string | null;
}

interface Shipment {
  id: number;
  orderId: number;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

interface DiscountCode {
  id: number;
  orderId: number;
  code: string;
}

interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
  [key: string]: unknown;
}

// ---- Status badge helpers ----

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge variant="success">已支付</Badge>;
    case "pending":
      return <Badge variant="warning">待支付</Badge>;
    case "partially_paid":
      return <Badge variant="secondary">部分支付</Badge>;
    case "refunded":
      return <Badge variant="secondary">已退款</Badge>;
    case "partially_refunded":
      return <Badge variant="secondary">部分退款</Badge>;
    case "failed":
      return <Badge variant="destructive">支付失败</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getFulfillmentStatusBadge(status: string) {
  switch (status) {
    case "fulfilled":
      return <Badge variant="success">已发货</Badge>;
    case "unfulfilled":
      return <Badge variant="warning">待发货</Badge>;
    case "partial":
      return <Badge variant="secondary">部分发货</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge variant="default">进行中</Badge>;
    case "completed":
      return <Badge variant="success">已完成</Badge>;
    case "cancelled":
      return <Badge variant="destructive">已取消</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

// ---- Helper to parse address ----

function parseAddress(raw: string | object | null | undefined): Address | null {
  if (!raw) return null;
  try {
    if (typeof raw === "string") return JSON.parse(raw) as Address;
    return raw as Address;
  } catch {
    return null;
  }
}

function renderAddress(addr: Address | null, label: string) {
  if (!addr) return <p className="text-sm text-muted-foreground">暂无{label}</p>;

  const lines: string[] = [];
  const name = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
  if (name) lines.push(name);
  if (addr.company) lines.push(addr.company);
  if (addr.address1) lines.push(addr.address1);
  if (addr.address2) lines.push(addr.address2);
  const cityLine = [addr.city, addr.province, addr.zip].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (addr.country) lines.push(addr.country);
  if (addr.phone) lines.push(addr.phone);

  if (lines.length === 0) return <p className="text-sm text-muted-foreground">暂无{label}</p>;

  return (
    <div className="text-sm space-y-0.5">
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}

// ---- Main Component ----

export function OrderDetailPage() {
  const [, params] = useRoute("/orders/:id");
  const [, navigate] = useLocation();
  const orderId = params?.id;

  // Core state
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit item dialog
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [editItemForm, setEditItemForm] = useState({ quantity: "", unitPriceAmount: "" });

  // Ship dialog
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [shipForm, setShipForm] = useState({ carrier: "", trackingNumber: "", trackingUrl: "" });

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ provider: "", amount: "", currencyCode: "", status: "paid" });

  // Discount code dialog
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  // Status update
  const [statusForm, setStatusForm] = useState({
    paymentStatus: "",
    fulfillmentStatus: "",
    orderStatus: "",
  });

  // ---- Data loading ----

  useEffect(() => {
    if (orderId) {
      loadAll();
    }
  }, [orderId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadOrder(), loadItems(), loadPayments(), loadShipment(), loadDiscountCodes()]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrder = async () => {
    try {
      const r = await fetch(adminApi.order(orderId!));
      if (!r.ok) {
        toast.error("订单不存在");
        navigate("/orders");
        return;
      }
      const data: Order = await r.json();
      setOrder(data);
      setStatusForm({
        paymentStatus: data.paymentStatus,
        fulfillmentStatus: data.fulfillmentStatus,
        orderStatus: data.orderStatus,
      });
    } catch {
      toast.error("加载订单失败");
    }
  };

  const loadItems = async () => {
    try {
      const r = await fetch(adminApi.orderItems(orderId!));
      if (r.ok) {
        const data = await r.json();
        setItems(data.items || []);
      }
    } catch {}
  };

  const loadPayments = async () => {
    try {
      const r = await fetch(adminApi.orderPayments(orderId!));
      if (r.ok) {
        const data = await r.json();
        setPayments(data.items || []);
      }
    } catch {}
  };

  const loadShipment = async () => {
    try {
      const r = await fetch(adminApi.orderShipment(orderId!));
      if (r.ok) {
        const data = await r.json();
        // API may return null/empty or a shipment object
        setShipment(data && data.id ? data : null);
      }
    } catch {
      setShipment(null);
    }
  };

  const loadDiscountCodes = async () => {
    try {
      const r = await fetch(adminApi.orderDiscountCodes(orderId!));
      if (r.ok) {
        const data = await r.json();
        setDiscountCodes(data.items || []);
      }
    } catch {}
  };

  // ---- Item actions ----

  const openEditItem = (item: OrderItem) => {
    setEditingItem(item);
    setEditItemForm({
      quantity: String(item.quantity),
      unitPriceAmount: String(item.unitPriceAmount),
    });
    setEditItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      const r = await fetch(adminApi.orderItem(editingItem.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(editItemForm.quantity),
          unitPriceAmount: Number(editItemForm.unitPriceAmount),
        }),
      });
      if (r.ok) {
        toast.success("订单项已更新");
        setEditItemDialogOpen(false);
        await Promise.all([loadItems(), loadOrder()]);
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "更新失败");
      }
    } catch {
      toast.error("更新失败");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("确定要删除该订单项吗？")) return;
    try {
      const r = await fetch(adminApi.orderItem(itemId), { method: "DELETE" });
      if (r.ok) {
        toast.success("订单项已删除");
        await Promise.all([loadItems(), loadOrder()]);
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "删除失败");
      }
    } catch {
      toast.error("删除失败");
    }
  };

  // ---- Shipment actions ----

  const handleCreateShipment = async () => {
    try {
      const r = await fetch(adminApi.orderShipment(orderId!), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (r.ok) {
        toast.success("物流单已创建");
        await loadShipment();
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "创建失败");
      }
    } catch {
      toast.error("创建失败");
    }
  };

  const openShipDialog = () => {
    setShipForm({ carrier: "", trackingNumber: "", trackingUrl: "" });
    setShipDialogOpen(true);
  };

  const handleMarkShipped = async () => {
    if (!shipment) return;
    try {
      const r = await fetch(adminApi.shipmentAction(shipment.id, "ship"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipForm),
      });
      if (r.ok) {
        toast.success("已标记为已发货");
        setShipDialogOpen(false);
        await loadShipment();
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "操作失败");
      }
    } catch {
      toast.error("操作失败");
    }
  };

  const handleMarkDelivered = async () => {
    if (!shipment) return;
    try {
      const r = await fetch(adminApi.shipmentAction(shipment.id, "deliver"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (r.ok) {
        toast.success("已标记为已送达");
        await loadShipment();
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "操作失败");
      }
    } catch {
      toast.error("操作失败");
    }
  };

  // ---- Payment actions ----

  const openPaymentDialog = () => {
    setPaymentForm({
      provider: "",
      amount: "",
      currencyCode: order?.currencyCode || "USD",
      status: "paid",
    });
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    try {
      const r = await fetch(adminApi.orderPayments(orderId!), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: paymentForm.provider,
          amount: Number(paymentForm.amount),
          currencyCode: paymentForm.currencyCode,
          status: paymentForm.status,
        }),
      });
      if (r.ok) {
        toast.success("支付记录已添加");
        setPaymentDialogOpen(false);
        await loadPayments();
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "添加失败");
      }
    } catch {
      toast.error("添加失败");
    }
  };

  // ---- Discount code actions ----

  const openDiscountDialog = () => {
    setDiscountCode("");
    setDiscountDialogOpen(true);
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    try {
      const r = await fetch(adminApi.orderDiscountCodes(orderId!), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.trim() }),
      });
      if (r.ok) {
        toast.success("优惠码已应用");
        setDiscountDialogOpen(false);
        await Promise.all([loadDiscountCodes(), loadOrder()]);
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "应用失败");
      }
    } catch {
      toast.error("应用失败");
    }
  };

  const handleRemoveDiscount = async (discountCodeId: number) => {
    try {
      const r = await fetch(
        `${adminApi.orderDiscountCodes(orderId!)}?discountCodeId=${discountCodeId}`,
        { method: "DELETE" }
      );
      if (r.ok) {
        toast.success("优惠码已移除");
        await Promise.all([loadDiscountCodes(), loadOrder()]);
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "移除失败");
      }
    } catch {
      toast.error("移除失败");
    }
  };

  // ---- Status update ----

  const handleUpdateStatus = async () => {
    try {
      const r = await fetch(adminApi.order(orderId!), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusForm),
      });
      if (r.ok) {
        const updated = await r.json();
        setOrder(updated);
        toast.success("订单状态已更新");
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "更新失败");
      }
    } catch {
      toast.error("更新失败");
    }
  };

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">订单不存在</div>
      </div>
    );
  }

  const fmt = (amount: number) => formatMoneyMinorUnits(amount, order.currencyCode);
  const billingAddr = parseAddress(order.billingAddressJson);
  const shippingAddr = parseAddress(order.shippingAddressJson);

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">订单 {order.orderNumber}</h2>
        </div>
        <div className="flex items-center gap-2">
          {getPaymentStatusBadge(order.paymentStatus)}
          {getFulfillmentStatusBadge(order.fulfillmentStatus)}
          {getOrderStatusBadge(order.orderStatus)}
        </div>
      </div>

      {/* ===== Order Info Card ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            订单信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">订单号</Label>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">邮箱</Label>
              <p className="font-medium">{order.email || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">电话</Label>
              <p className="font-medium">{order.phone || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">创建时间</Label>
              <p className="font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">下单时间</Label>
              <p className="font-medium">{formatDateTime(order.placedAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">取消时间</Label>
              <p className="font-medium">{formatDateTime(order.cancelledAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Order Items Card ===== */}
      <Card>
        <CardHeader>
          <CardTitle>订单项</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead>变体</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">单价</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-right">小计</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productTitle}</TableCell>
                    <TableCell>{item.variantTitle || "-"}</TableCell>
                    <TableCell>{item.sku || "-"}</TableCell>
                    <TableCell className="text-right">
                      {fmt(item.unitPriceAmount)}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {fmt(item.unitPriceAmount * item.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">暂无订单项</p>
          )}
        </CardContent>
      </Card>

      {/* ===== Amount Summary Card ===== */}
      <Card>
        <CardHeader>
          <CardTitle>金额汇总</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">小计</span>
              <span>{fmt(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">商品折扣</span>
              <span>-{fmt(order.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">订单折扣</span>
              <span>-{fmt(order.orderDiscountAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">运费</span>
              <span>{fmt(order.shippingAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">税费</span>
              <span>{fmt(order.taxAmount)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>合计</span>
              <span>{fmt(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Shipment Card ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              物流信息
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!shipment ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <p className="text-sm text-muted-foreground">暂无物流单</p>
              <Button onClick={handleCreateShipment}>创建物流单</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <p className="font-medium">{shipment.status}</p>
                </div>
                {shipment.carrier && (
                  <div>
                    <Label className="text-muted-foreground">承运商</Label>
                    <p className="font-medium">{shipment.carrier}</p>
                  </div>
                )}
                {shipment.trackingNumber && (
                  <div>
                    <Label className="text-muted-foreground">追踪号</Label>
                    <p className="font-medium">{shipment.trackingNumber}</p>
                  </div>
                )}
                {shipment.trackingUrl && (
                  <div>
                    <Label className="text-muted-foreground">追踪链接</Label>
                    <a
                      href={shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline break-all"
                    >
                      {shipment.trackingUrl}
                    </a>
                  </div>
                )}
                {shipment.shippedAt && (
                  <div>
                    <Label className="text-muted-foreground">发货时间</Label>
                    <p className="font-medium">{formatDateTime(shipment.shippedAt)}</p>
                  </div>
                )}
                {shipment.deliveredAt && (
                  <div>
                    <Label className="text-muted-foreground">送达时间</Label>
                    <p className="font-medium">{formatDateTime(shipment.deliveredAt)}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {shipment.status === "pending" && (
                  <Button onClick={openShipDialog}>标记发货</Button>
                )}
                {shipment.status === "shipped" && (
                  <Button onClick={handleMarkDelivered}>标记送达</Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Payments Card ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              支付记录
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openPaymentDialog}>
              记录支付
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>支付渠道</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>处理时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.provider || "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatMoneyMinorUnits(p.amount, p.currencyCode)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "success" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(p.processedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">暂无支付记录</p>
          )}
        </CardContent>
      </Card>

      {/* ===== Discount Codes Card ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              优惠码
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openDiscountDialog}>
              应用优惠码
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {discountCodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {discountCodes.map((dc) => (
                <div
                  key={dc.id}
                  className="flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm"
                >
                  <span className="font-mono">{dc.code}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveDiscount(dc.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">暂无优惠码</p>
          )}
        </CardContent>
      </Card>

      {/* ===== Status Update Card ===== */}
      <Card>
        <CardHeader>
          <CardTitle>更新状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>支付状态</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusForm.paymentStatus}
                onChange={(e) => setStatusForm((f) => ({ ...f, paymentStatus: e.target.value }))}
              >
                <option value="pending">待支付</option>
                <option value="paid">已支付</option>
                <option value="partially_paid">部分支付</option>
                <option value="refunded">已退款</option>
                <option value="partially_refunded">部分退款</option>
                <option value="failed">支付失败</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>发货状态</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusForm.fulfillmentStatus}
                onChange={(e) => setStatusForm((f) => ({ ...f, fulfillmentStatus: e.target.value }))}
              >
                <option value="unfulfilled">待发货</option>
                <option value="partial">部分发货</option>
                <option value="fulfilled">已发货</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>订单状态</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusForm.orderStatus}
                onChange={(e) => setStatusForm((f) => ({ ...f, orderStatus: e.target.value }))}
              >
                <option value="open">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpdateStatus}>更新状态</Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Addresses Card ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            地址信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground mb-2 block">账单地址</Label>
              {renderAddress(billingAddr, "账单地址")}
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">收货地址</Label>
              {renderAddress(shippingAddr, "收货地址")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Dialogs ===== */}

      {/* Edit Item Dialog */}
      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑订单项</DialogTitle>
            <DialogDescription>
              修改 {editingItem?.productTitle} 的数量和单价
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>数量</Label>
              <Input
                type="number"
                min="1"
                value={editItemForm.quantity}
                onChange={(e) => setEditItemForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>单价（最小货币单位）</Label>
              <Input
                type="number"
                min="0"
                value={editItemForm.unitPriceAmount}
                onChange={(e) => setEditItemForm((f) => ({ ...f, unitPriceAmount: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveItem}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>标记发货</DialogTitle>
            <DialogDescription>填写物流信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>承运商</Label>
              <Input
                value={shipForm.carrier}
                onChange={(e) => setShipForm((f) => ({ ...f, carrier: e.target.value }))}
                placeholder="如：顺丰、圆通"
              />
            </div>
            <div className="space-y-2">
              <Label>追踪号</Label>
              <Input
                value={shipForm.trackingNumber}
                onChange={(e) => setShipForm((f) => ({ ...f, trackingNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>追踪链接</Label>
              <Input
                value={shipForm.trackingUrl}
                onChange={(e) => setShipForm((f) => ({ ...f, trackingUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleMarkShipped}>确认发货</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>记录支付</DialogTitle>
            <DialogDescription>添加一条支付记录</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>支付渠道</Label>
              <Input
                value={paymentForm.provider}
                onChange={(e) => setPaymentForm((f) => ({ ...f, provider: e.target.value }))}
                placeholder="如：微信、支付宝、银行转账"
              />
            </div>
            <div className="space-y-2">
              <Label>金额（最小货币单位）</Label>
              <Input
                type="number"
                min="0"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>货币代码</Label>
              <Input
                value={paymentForm.currencyCode}
                onChange={(e) => setPaymentForm((f) => ({ ...f, currencyCode: e.target.value }))}
                placeholder="USD"
              />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentForm.status}
                onChange={(e) => setPaymentForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="paid">已支付</option>
                <option value="pending">待处理</option>
                <option value="failed">失败</option>
                <option value="refunded">已退款</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRecordPayment}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Code Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>应用优惠码</DialogTitle>
            <DialogDescription>输入要应用到此订单的优惠码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>优惠码</Label>
              <Input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="输入优惠码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleApplyDiscount}>应用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
