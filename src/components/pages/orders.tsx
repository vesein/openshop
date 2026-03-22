import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Eye,
  ShoppingCart,
  CreditCard,
  Truck,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/date-utils";
import { adminApi } from "@/lib/admin-api";
import { Pagination } from "@/components/ui/pagination";
import { formatMoneyMinorUnits } from "@/lib/money";
import { Link } from "wouter";
import { toast } from "sonner";

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  useEffect(() => {
    setPage(1);
  }, [searchTerm, paymentFilter, fulfillmentFilter, orderStatusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [searchTerm, paymentFilter, fulfillmentFilter, orderStatusFilter, page]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (paymentFilter !== "all") params.append("paymentStatus", paymentFilter);
      if (fulfillmentFilter !== "all") params.append("fulfillmentStatus", fulfillmentFilter);
      if (orderStatusFilter !== "all") params.append("status", orderStatusFilter);
      params.append("page", String(page));
      params.append("pageSize", "20");

      const response = await fetch(adminApi.orders(params));
      if (response.ok) {
        const result = await response.json();
        setOrders(result.items || []);
        setTotal(result.total || 0);
      }
    } catch (error) {
      toast.error("获取订单失败");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
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
                共 {total} 个订单
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
                <option value="partially_paid">部分支付</option>
                <option value="refunded">已退款</option>
                <option value="partially_refunded">部分退款</option>
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
                      {formatMoneyMinorUnits(order.totalAmount, order.currencyCode)}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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
          <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
