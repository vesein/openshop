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
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate, formatDateTime } from "@/lib/date-utils";

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    acceptsMarketing: 0,
  });
  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    countryCode: "CN",
    province: "",
    city: "",
    address1: "",
    address2: "",
    postalCode: "",
    isDefaultShipping: 0,
    isDefaultBilling: 0,
  });

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

  const handleView = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch customer details:", error);
    }
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCustomers(customers.filter((c) => c.id !== selectedCustomer.id));
        setDeleteDialogOpen(false);
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingCustomer) {
        const response = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const updated = await response.json();
          setCustomers(customers.map((c) => (c.id === editingCustomer.id ? updated : c)));
        }
      } else {
        const response = await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const newCustomer = await response.json();
          setCustomers([newCustomer, ...customers]);
        }
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save customer:", error);
    }
  };

  const handleAddAddress = (customer: Customer) => {
    setSelectedCustomer(customer);
    setAddressForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      company: "",
      phone: customer.phone,
      countryCode: "CN",
      province: "",
      city: "",
      address1: "",
      address2: "",
      postalCode: "",
      isDefaultShipping: 0,
      isDefaultBilling: 0,
    });
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/admin/customers/${selectedCustomer.id}/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      if (response.ok) {
        setAddressDialogOpen(false);
        // Refresh customer details if dialog is open
        if (detailDialogOpen) {
          const detailResponse = await fetch(`/api/admin/customers/${selectedCustomer.id}`);
          if (detailResponse.ok) {
            const data = await detailResponse.json();
            setSelectedCustomer(data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to save address:", error);
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
                          <Button variant="ghost" size="icon" onClick={() => handleView(customer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent onClose={() => setDetailDialogOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>客户详情</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">姓名</Label>
                  <p className="font-medium">{getFullName(selectedCustomer)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">营销订阅</Label>
                  <div className="mt-1">
                    {selectedCustomer.acceptsMarketing === 1 ? (
                      <Badge variant="success">已订阅</Badge>
                    ) : (
                      <Badge variant="secondary">未订阅</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">邮箱</Label>
                  <p>{selectedCustomer.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">电话</Label>
                  <p>{selectedCustomer.phone || "-"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">注册时间</Label>
                <p>{formatDateTime(selectedCustomer.createdAt)}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-muted-foreground">地址列表</Label>
                  <Button variant="outline" size="sm" onClick={() => handleAddAddress(selectedCustomer)}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加地址
                  </Button>
                </div>
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.addresses.map((address) => (
                      <div key={address.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {address.firstName} {address.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {[
                                address.province,
                                address.city,
                                address.address1,
                                address.address2,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                            {address.postalCode && (
                              <p className="text-sm text-muted-foreground">
                                邮编: {address.postalCode}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {address.isDefaultShipping === 1 && (
                              <Badge variant="outline">默认收货</Badge>
                            )}
                            {address.isDefaultBilling === 1 && (
                              <Badge variant="outline">默认账单</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无地址
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent onClose={() => setDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除客户 "{selectedCustomer && getFullName(selectedCustomer)}" 吗？此操作不可撤销。
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

      {/* Add Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent onClose={() => setAddressDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>添加地址</DialogTitle>
            <DialogDescription>
              为客户 "{selectedCustomer && getFullName(selectedCustomer)}" 添加新地址
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="addressFirstName">姓</Label>
                <Input
                  id="addressFirstName"
                  value={addressForm.firstName}
                  onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="addressLastName">名</Label>
                <Input
                  id="addressLastName"
                  value={addressForm.lastName}
                  onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addressCompany">公司</Label>
              <Input
                id="addressCompany"
                value={addressForm.company}
                onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="addressProvince">省份</Label>
                <Input
                  id="addressProvince"
                  value={addressForm.province}
                  onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="addressCity">城市</Label>
                <Input
                  id="addressCity"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address1">详细地址</Label>
              <Input
                id="address1"
                value={addressForm.address1}
                onChange={(e) => setAddressForm({ ...addressForm, address1: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="addressPostalCode">邮编</Label>
                <Input
                  id="addressPostalCode"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="addressPhone">电话</Label>
                <Input
                  id="addressPhone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultShipping"
                  checked={addressForm.isDefaultShipping === 1}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefaultShipping: e.target.checked ? 1 : 0 })}
                />
                <Label htmlFor="isDefaultShipping">默认收货地址</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultBilling"
                  checked={addressForm.isDefaultBilling === 1}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefaultBilling: e.target.checked ? 1 : 0 })}
                />
                <Label htmlFor="isDefaultBilling">默认账单地址</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveAddress}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}