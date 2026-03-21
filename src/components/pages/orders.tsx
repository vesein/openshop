import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search,
  Eye,
  ShoppingCart,
  CreditCard,
  Truck,
  Clock,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate, formatDateTime } from "@/lib/date-utils";

interface Order {
  id: number;
  orderNumber: string;
  customerId: number | null;
  email: string;
  phone: string;
  currencyCode: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  orderStatus: string;
  createdAt: string;
  placedAt: string | null;
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

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState({ paymentStatus: "", fulfillmentStatus: "", orderStatus: "" });

  useEffect(() => {
    fetchOrders();
  }, [paymentFilter, fulfillmentFilter, orderStatusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (paymentFilter !== "all") params.append("paymentStatus", paymentFilter);
      if (fulfillmentFilter !== "all") params.append("fulfillmentStatus", fulfillmentFilter);
      if (orderStatusFilter !== "all") params.append("status", orderStatusFilter);

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setOrders(result.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (order: Order) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    }
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus({
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      orderStatus: order.orderStatus,
    });
    setStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStatus),
      });
      if (response.ok) {
        const updated = await response.json();
        setOrders(orders.map((o) => (o.id === selectedOrder.id ? updated : o)));
        setStatusDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">已支付</Badge>;
      case "pending":
        return <Badge variant="warning">待支付</Badge>;
      case "refunded":
        return <Badge variant="secondary">已退款</Badge>;
      case "failed":
        return <Badge variant="destructive">支付失败</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFulfillmentStatusBadge = (status: string) => {
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
  };

  const getOrderStatusBadge = (status: string) => {
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
  };

  const formatPrice = (amount: number, currency: string = "CNY") => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const getOrderStats = () => {
    const pending = orders.filter((o) => o.paymentStatus === "pending").length;
    const processing = orders.filter(
      (o) => o.paymentStatus === "paid" && o.fulfillmentStatus === "unfulfilled"
    ).length;
    const shipped = orders.filter((o) => o.fulfillmentStatus === "fulfilled").length;
    const completed = orders.filter((o) => o.orderStatus === "completed").length;

    return { pending, processing, shipped, completed };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">订单管理</h2>
        <p className="text-muted-foreground">
          查看和管理所有订单
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待支付</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待发货</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发货</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipped}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>订单列表</CardTitle>
              <CardDescription>
                共 {orders.length} 个订单
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索订单..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">支付状态</option>
                <option value="pending">待支付</option>
                <option value="paid">已支付</option>
                <option value="refunded">已退款</option>
              </select>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={fulfillmentFilter}
                onChange={(e) => setFulfillmentFilter(e.target.value)}
              >
                <option value="all">发货状态</option>
                <option value="unfulfilled">待发货</option>
                <option value="fulfilled">已发货</option>
                <option value="returned">已退货</option>
              </select>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">订单状态</option>
                <option value="open">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>支付状态</TableHead>
                  <TableHead>发货状态</TableHead>
                  <TableHead>订单状态</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{order.email || "-"}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.phone || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      {getFulfillmentStatusBadge(order.fulfillmentStatus)}
                    </TableCell>
                    <TableCell>
                      {getOrderStatusBadge(order.orderStatus)}
                    </TableCell>
                    <TableCell>
                      {formatPrice(order.totalAmount, order.currencyCode)}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(order)}>
                          更新状态
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">暂无订单</h3>
              <p className="text-sm text-muted-foreground">
                订单将在客户下单后显示在这里
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent onClose={() => setDetailDialogOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">订单号</Label>
                  <p className="font-mono font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">创建时间</Label>
                  <p>{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">客户邮箱</Label>
                  <p>{selectedOrder.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">联系电话</Label>
                  <p>{selectedOrder.phone || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">支付状态</Label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">发货状态</Label>
                  <div className="mt-1">{getFulfillmentStatusBadge(selectedOrder.fulfillmentStatus)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">订单状态</Label>
                  <div className="mt-1">{getOrderStatusBadge(selectedOrder.orderStatus)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">订单金额</Label>
                <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                  <span>商品小计:</span>
                  <span className="text-right">{formatPrice(selectedOrder.subtotalAmount)}</span>
                  {selectedOrder.discountAmount > 0 && (
                    <>
                      <span>折扣:</span>
                      <span className="text-right text-red-500">-{formatPrice(selectedOrder.discountAmount)}</span>
                    </>
                  )}
                  {selectedOrder.taxAmount > 0 && (
                    <>
                      <span>税费:</span>
                      <span className="text-right">{formatPrice(selectedOrder.taxAmount)}</span>
                    </>
                  )}
                  <span className="font-medium">总计:</span>
                  <span className="text-right font-bold">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">订单商品</Label>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead className="text-right">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.productTitle}</p>
                              {item.variantTitle && (
                                <p className="text-sm text-muted-foreground">{item.variantTitle}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatPrice(item.unitPriceAmount)}</TableCell>
                          <TableCell className="text-right">
                            {formatPrice(item.unitPriceAmount * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent onClose={() => setStatusDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>更新订单状态</DialogTitle>
            <DialogDescription>
              修改订单 "{selectedOrder?.orderNumber}" 的状态
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>支付状态</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newStatus.paymentStatus}
                onChange={(e) => setNewStatus({ ...newStatus, paymentStatus: e.target.value })}
              >
                <option value="pending">待支付</option>
                <option value="paid">已支付</option>
                <option value="refunded">已退款</option>
                <option value="failed">支付失败</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>发货状态</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newStatus.fulfillmentStatus}
                onChange={(e) => setNewStatus({ ...newStatus, fulfillmentStatus: e.target.value })}
              >
                <option value="unfulfilled">待发货</option>
                <option value="fulfilled">已发货</option>
                <option value="returned">已退货</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>订单状态</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newStatus.orderStatus}
                onChange={(e) => setNewStatus({ ...newStatus, orderStatus: e.target.value })}
              >
                <option value="open">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmStatusUpdate}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}