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
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Customer {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  acceptsMarketing: boolean;
  createdAt: string;
  addresses?: CustomerAddress[];
  ordersCount?: number;
  totalSpent?: number;
}

interface CustomerAddress {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  countryCode: string;
  province: string;
  city: string;
  address1: string;
  address2: string;
  postalCode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/customers?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setCustomers(result.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (customer: Customer) => {
    const name = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    return name || "未命名客户";
  };

  const getInitials = (customer: Customer) => {
    const first = customer.firstName?.[0] || "";
    const last = customer.lastName?.[0] || "";
    return (first + last).toUpperCase() || "客";
  };

  const getStats = () => {
    const total = customers.length;
    const subscribed = customers.filter((c) => c.acceptsMarketing).length;
    const withOrders = customers.filter((c) => (c.ordersCount || 0) > 0).length;

    return { total, subscribed, withOrders };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">客户管理</h2>
          <p className="text-muted-foreground">
            管理您的客户信息和地址
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          添加客户
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总客户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订阅营销</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscribed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${((stats.subscribed / stats.total) * 100).toFixed(1)}% 的客户`
                : "暂无数据"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有订单客户</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${((stats.withOrders / stats.total) * 100).toFixed(1)}% 的客户`
                : "暂无数据"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>客户列表</CardTitle>
              <CardDescription>
                共 {customers.length} 位客户
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索客户..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客户</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>营销订阅</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const defaultAddress = customer.addresses?.find(
                    (a) => a.isDefaultShipping
                  );

                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {getInitials(customer)}
                          </div>
                          <div>
                            <p className="font-medium">{getFullName(customer)}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {customer.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {defaultAddress ? (
                          <div className="flex items-start text-sm">
                            <MapPin className="h-3 w-3 mr-1 mt-0.5 text-muted-foreground shrink-0" />
                            <span className="line-clamp-2">
                              {[
                                defaultAddress.province,
                                defaultAddress.city,
                                defaultAddress.address1,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            暂无地址
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.acceptsMarketing ? (
                          <Badge variant="success">已订阅</Badge>
                        ) : (
                          <Badge variant="secondary">未订阅</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">暂无客户</h3>
              <p className="text-sm text-muted-foreground mb-4">
                客户将在注册后显示在这里
              </p>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                添加客户
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}