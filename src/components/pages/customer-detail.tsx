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
  Save,
  Plus,
  Edit,
  Trash2,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date-utils";
import { formatMoneyMinorUnits } from "@/lib/money";

interface Customer {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  acceptsMarketing: number;
  createdAt: string;
  updatedAt: string;
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

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  currencyCode: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
}

const emptyAddressForm = {
  firstName: "",
  lastName: "",
  company: "",
  phone: "",
  countryCode: "",
  province: "",
  city: "",
  address1: "",
  address2: "",
  postalCode: "",
  isDefaultShipping: 0 as number,
  isDefaultBilling: 0 as number,
};

export function CustomerDetailPage() {
  const [, params] = useRoute("/customers/:id");
  const [, navigate] = useLocation();
  const customerId = params?.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    acceptsMarketing: 0 as number,
  });

  // Addresses state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressForm, setAddressForm] = useState({ ...emptyAddressForm });
  const [deleteAddressDialogOpen, setDeleteAddressDialogOpen] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<CustomerAddress | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (customerId) {
      void fetchCustomer();
      void fetchAddresses();
      void fetchOrders();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(adminApi.customer(customerId!));
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          acceptsMarketing: data.acceptsMarketing ?? 0,
        });
      } else {
        toast.error("客户不存在");
        navigate("/customers");
      }
    } catch {
      toast.error("获取客户失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch(adminApi.customerAddresses(customerId!));
      if (response.ok) {
        const result = await response.json();
        setAddresses(result.items || result || []);
      }
    } catch {
      toast.error("获取地址失败");
    }
  };

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      params.append("customerId", customerId!);
      const response = await fetch(adminApi.orders(params));
      if (response.ok) {
        const result = await response.json();
        setOrders(result.items || []);
      }
    } catch {
      toast.error("获取订单失败");
    }
  };

  const handleSaveCustomer = async () => {
    setSaving(true);
    try {
      const response = await fetch(adminApi.customer(customerId!), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        const updated = await response.json();
        setCustomer(updated);
        setEditing(false);
        toast.success("客户信息已保存");
      } else {
        toast.error("保存失败");
      }
    } catch {
      toast.error("保存客户失败");
    } finally {
      setSaving(false);
    }
  };

  // Address handlers
  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ ...emptyAddressForm });
    setAddressDialogOpen(true);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditingAddress(address);
    setAddressForm({
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      company: address.company || "",
      phone: address.phone || "",
      countryCode: address.countryCode || "",
      province: address.province || "",
      city: address.city || "",
      address1: address.address1 || "",
      address2: address.address2 || "",
      postalCode: address.postalCode || "",
      isDefaultShipping: address.isDefaultShipping ?? 0,
      isDefaultBilling: address.isDefaultBilling ?? 0,
    });
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = (address: CustomerAddress) => {
    setDeletingAddress(address);
    setDeleteAddressDialogOpen(true);
  };

  const confirmDeleteAddress = async () => {
    if (!deletingAddress) return;
    try {
      const response = await fetch(adminApi.address(deletingAddress.id), {
        method: "DELETE",
      });
      if (response.ok) {
        setAddresses(addresses.filter((a) => a.id !== deletingAddress.id));
        setDeleteAddressDialogOpen(false);
        setDeletingAddress(null);
        toast.success("地址已删除");
      } else {
        toast.error("删除失败");
      }
    } catch {
      toast.error("删除地址失败");
    }
  };

  const handleSubmitAddress = async () => {
    try {
      if (editingAddress) {
        const response = await fetch(adminApi.address(editingAddress.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressForm),
        });
        if (response.ok) {
          const updated = await response.json();
          setAddresses(addresses.map((a) => (a.id === editingAddress.id ? updated : a)));
          toast.success("地址已更新");
        } else {
          toast.error("更新失败");
        }
      } else {
        const response = await fetch(adminApi.customerAddresses(customerId!), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressForm),
        });
        if (response.ok) {
          const newAddress = await response.json();
          setAddresses([...addresses, newAddress]);
          toast.success("地址已添加");
        } else {
          toast.error("添加失败");
        }
      }
      setAddressDialogOpen(false);
    } catch {
      toast.error("保存地址失败");
    }
  };

  // Helpers
  const getFullName = () => {
    const name = `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim();
    return name || "未命名客户";
  };

  const getInitials = () => {
    const first = customer?.firstName?.[0] || "";
    const last = customer?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "客";
  };

  const formatAddress = (addr: CustomerAddress) => {
    return [addr.address1, addr.address2, addr.city, addr.province, addr.postalCode, addr.countryCode]
      .filter(Boolean)
      .join(", ");
  };

  const paymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">已支付</Badge>;
      case "pending":
        return <Badge variant="warning">待支付</Badge>;
      case "refunded":
        return <Badge variant="destructive">已退款</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const fulfillmentStatusBadge = (status: string) => {
    switch (status) {
      case "fulfilled":
        return <Badge variant="success">已发货</Badge>;
      case "partial":
        return <Badge variant="warning">部分发货</Badge>;
      case "unfulfilled":
        return <Badge variant="secondary">未发货</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">客户不存在</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">
              {getInitials()}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{getFullName()}</h2>
              <p className="text-sm text-muted-foreground">
                客户 ID: {customer.id} | 注册于 {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant={editing ? "outline" : "default"}
          onClick={() => {
            if (editing) {
              // Cancel editing, reset form
              setForm({
                firstName: customer.firstName || "",
                lastName: customer.lastName || "",
                email: customer.email || "",
                phone: customer.phone || "",
                acceptsMarketing: customer.acceptsMarketing ?? 0,
              });
            }
            setEditing(!editing);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          {editing ? "取消编辑" : "编辑"}
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>客户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">姓</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  disabled={!editing}
                  placeholder="姓"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">名</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  disabled={!editing}
                  placeholder="名"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!editing}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={!editing}
                placeholder="13800138000"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptsMarketing"
                checked={form.acceptsMarketing === 1}
                onChange={(e) => setForm({ ...form, acceptsMarketing: e.target.checked ? 1 : 0 })}
                disabled={!editing}
              />
              <Label htmlFor="acceptsMarketing">接受营销邮件</Label>
            </div>
            {editing && (
              <div className="flex justify-end">
                <Button onClick={handleSaveCustomer} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Addresses Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>地址</CardTitle>
            <Button size="sm" onClick={handleAddAddress}>
              <Plus className="mr-2 h-4 w-4" />
              添加地址
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length > 0 ? (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">
                        {[address.firstName, address.lastName].filter(Boolean).join(" ")}
                        {address.company && (
                          <span className="text-muted-foreground ml-2">({address.company})</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatAddress(address)}</p>
                      {address.phone && (
                        <p className="text-sm text-muted-foreground">{address.phone}</p>
                      )}
                      <div className="flex gap-2 mt-1">
                        {address.isDefaultShipping === 1 && (
                          <Badge variant="success">默认收货</Badge>
                        )}
                        {address.isDefaultBilling === 1 && (
                          <Badge variant="outline">默认账单</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditAddress(address)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(address)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">暂无地址</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order History Card */}
      <Card>
        <CardHeader>
          <CardTitle>订单历史</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>支付状态</TableHead>
                  <TableHead>发货状态</TableHead>
                  <TableHead>下单时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/orders/${order.id}`}>
                        <span className="font-medium text-primary hover:underline cursor-pointer">
                          {order.orderNumber || `#${order.id}`}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatMoneyMinorUnits(order.totalAmount, order.currencyCode)}
                    </TableCell>
                    <TableCell>{paymentStatusBadge(order.paymentStatus)}</TableCell>
                    <TableCell>{fulfillmentStatusBadge(order.fulfillmentStatus)}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">暂无订单</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent onClose={() => setAddressDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingAddress ? "编辑地址" : "添加地址"}</DialogTitle>
            <DialogDescription>
              {editingAddress ? "修改地址信息" : "为客户添加新地址"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="addr-firstName">姓</Label>
                <Input
                  id="addr-firstName"
                  value={addressForm.firstName}
                  onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                  placeholder="姓"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="addr-lastName">名</Label>
                <Input
                  id="addr-lastName"
                  value={addressForm.lastName}
                  onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                  placeholder="名"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addr-company">公司</Label>
              <Input
                id="addr-company"
                value={addressForm.company}
                onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
                placeholder="公司名称（可选）"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addr-phone">电话</Label>
              <Input
                id="addr-phone"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                placeholder="联系电话"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="addr-countryCode">国家/地区代码</Label>
                <Input
                  id="addr-countryCode"
                  value={addressForm.countryCode}
                  onChange={(e) => setAddressForm({ ...addressForm, countryCode: e.target.value })}
                  placeholder="CN"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="addr-province">省/州</Label>
                <Input
                  id="addr-province"
                  value={addressForm.province}
                  onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                  placeholder="省/州"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addr-city">城市</Label>
              <Input
                id="addr-city"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                placeholder="城市"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addr-address1">地址行 1</Label>
              <Input
                id="addr-address1"
                value={addressForm.address1}
                onChange={(e) => setAddressForm({ ...addressForm, address1: e.target.value })}
                placeholder="街道地址"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addr-address2">地址行 2</Label>
              <Input
                id="addr-address2"
                value={addressForm.address2}
                onChange={(e) => setAddressForm({ ...addressForm, address2: e.target.value })}
                placeholder="门牌号、楼层等（可选）"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addr-postalCode">邮政编码</Label>
              <Input
                id="addr-postalCode"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                placeholder="邮政编码"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addr-isDefaultShipping"
                  checked={addressForm.isDefaultShipping === 1}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, isDefaultShipping: e.target.checked ? 1 : 0 })
                  }
                />
                <Label htmlFor="addr-isDefaultShipping">默认收货地址</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addr-isDefaultBilling"
                  checked={addressForm.isDefaultBilling === 1}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, isDefaultBilling: e.target.checked ? 1 : 0 })
                  }
                />
                <Label htmlFor="addr-isDefaultBilling">默认账单地址</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitAddress}>
              {editingAddress ? "保存" : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Address Confirmation Dialog */}
      <Dialog open={deleteAddressDialogOpen} onOpenChange={setDeleteAddressDialogOpen}>
        <DialogContent onClose={() => setDeleteAddressDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个地址吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAddressDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAddress}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
