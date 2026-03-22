import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { formatMoneyMinorUnits } from "@/lib/money";

interface DashboardData {
  totalProducts?: number;
  totalOrders?: number;
  totalCustomers?: number;
  totalRevenue?: number;
  /** 店铺默认货币，来自 `shop_settings` */
  currencyCode?: string;
  recentOrders?: Array<{
    id: number;
    orderNumber: string;
    customerEmail: string;
    totalAmount: number;
    currencyCode: string;
    status: string;
    createdAt: string;
  }>;
  lowStockProducts?: Array<{
    id: number;
    title: string;
    sku: string;
    quantity: number;
  }>;
}

const defaultData: DashboardData = {
  totalProducts: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalRevenue: 0,
  currencyCode: "USD",
  recentOrders: [],
  lowStockProducts: [],
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(adminApi.dashboard);
      if (response.ok) {
        const result = await response.json();
        setData({
          ...defaultData,
          ...result,
          recentOrders: result.recentOrders || [],
          lowStockProducts: result.lowStockProducts || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const shopCurrency = data.currencyCode ?? "USD";

  const stats = [
    {
      title: "总商品数",
      value: data.totalProducts,
      icon: Package,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "总订单数",
      value: data.totalOrders,
      icon: ShoppingCart,
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "总客户数",
      value: data.totalCustomers,
      icon: Users,
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "总收入",
      value: formatMoneyMinorUnits(data.totalRevenue ?? 0, shopCurrency),
      icon: DollarSign,
      trend: "+15%",
      trendUp: true,
    },
  ];

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
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <p className="text-muted-foreground">
          欢迎回来！这是您的商店概览。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={stat.trendUp ? "text-green-500" : "text-red-500"}>
                    {stat.trend}
                  </span>
                  <span className="ml-1">较上月</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近订单</CardTitle>
            <CardDescription>最近创建的订单</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data.recentOrders ?? []).length > 0 ? (
                (data.recentOrders ?? []).slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerEmail || "未知客户"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatMoneyMinorUnits(order.totalAmount, order.currencyCode || shopCurrency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无订单数据
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>库存预警</CardTitle>
            <CardDescription>库存不足的商品</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data.lowStockProducts ?? []).length > 0 ? (
                (data.lowStockProducts ?? []).slice(0, 5).map((product) => (
                  <div
                    key={`${product.id}-${product.sku}`}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.quantity === 0
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        库存: {product.quantity}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  库存充足
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => void fetchDashboardData()}>
          <TrendingUp className="mr-2 h-4 w-4" />
          刷新数据
        </Button>
      </div>
    </div>
  );
}