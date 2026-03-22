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
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/date-utils";
import { adminApi } from "@/lib/admin-api";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface Customer {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  acceptsMarketing: number;
  createdAt: string;
  addresses?: CustomerAddress[];
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
  isDefaultShipping: number;
  isDefaultBilling: number;
}

interface CustomerFormData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  acceptsMarketing: number;
}

export function CustomersPage() {
  const [, navigate] = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    acceptsMarketing: 0,
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    void fetchCustomers();
  }, [searchTerm, page]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", String(page));
      params.append("pageSize", "20");

      const response = await fetch(adminApi.customers(params));
      if (response.ok) {
        const result = await response.json();
        setCustomers(result.items || []);
        setTotal(result.total || 0);
      }
    } catch (error) {
      toast.error("获取客户失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData({
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      acceptsMarketing: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      email: customer.email,
      phone: customer.phone,
      firstName: customer.firstName,
      lastName: customer.lastName,
      acceptsMarketing: customer.acceptsMarketing,
    });
    setDialogOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setDeletingCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCustomer) return;

    try {
      const response = await fetch(adminApi.customer(deletingCustomer.id), {
        method: "DELETE",
      });
      if (response.ok) {
        setCustomers(customers.filter((c) => c.id !== deletingCustomer.id));
        setDeleteDialogOpen(false);
        setDeletingCustomer(null);
        toast.success("客户已删除");
      }
    } catch (error) {
      toast.error("删除客户失败");
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingCustomer) {
        const response = await fetch(adminApi.customer(editingCustomer.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const updated = await response.json();
          setCustomers(customers.map((c) => (c.id === editingCustomer.id ? updated : c)));
          toast.success("客户已更新");
        } else {
          toast.error("更新客户失败");
          return;
        }
      } else {
        const response = await fetch(adminApi.customers(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const newCustomer = await response.json();
          setCustomers([newCustomer, ...customers]);
          toast.success("客户已创建");
          setDialogOpen(false);
          navigate(`/customers/${newCustomer.id}`);
          return;
        }
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("保存客户失败");
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
    const subscribed = customers.filter((c) => c.acceptsMarketing === 1).length;
    const withAddresses = customers.filter((c) => (c.addresses?.length || 0) > 0).length;

    return { total, subscribed, withAddresses };
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
        <Button onClick={handleCreate}>
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
            <CardTitle className="text-sm font-medium">有地址客户</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withAddresses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${((stats.withAddresses / stats.total) * 100).toFixed(1)}% 的客户`
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
                共 {total} 位客户
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
                    (a) => a.isDefaultShipping === 1
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
                        {customer.acceptsMarketing === 1 ? (
                          <Badge variant="success">已订阅</Badge>
                        ) : (
                          <Badge variant="secondary">未订阅</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(customer)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
              <Button onClick={handleCreate}>
                <UserPlus className="mr-2 h-4 w-4" />
                添加客户
              </Button>
            </div>
          )}
          <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "编辑客户" : "添加客户"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? "修改客户信息" : "创建新客户"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">姓</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="姓"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">名</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="名"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="13800138000"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptsMarketing"
                checked={formData.acceptsMarketing === 1}
                onChange={(e) => setFormData({ ...formData, acceptsMarketing: e.target.checked ? 1 : 0 })}
              />
              <Label htmlFor="acceptsMarketing">接受营销邮件</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingCustomer ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent onClose={() => setDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除客户 "{deletingCustomer && getFullName(deletingCustomer)}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
