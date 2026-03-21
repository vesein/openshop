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
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Percent,
  Gift,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/date-utils";

interface Promotion {
  id: number;
  name: string;
  type: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  rulesJson: string;
  createdAt: string;
  discountCodes?: DiscountCode[];
}

interface DiscountCode {
  id: number;
  code: string;
  promotionId: number;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
}

interface PromotionFormData {
  name: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  rulesJson: string;
}

export function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: "",
    type: "percentage",
    status: "draft",
    startsAt: "",
    endsAt: "",
    usageLimit: "",
    rulesJson: "{}",
  });
  const [codeForm, setCodeForm] = useState({
    code: "",
    usageLimit: "",
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch("/api/admin/promotions");
      if (response.ok) {
        const result = await response.json();
        setPromotions(result.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPromotion(null);
    setFormData({
      name: "",
      type: "percentage",
      status: "draft",
      startsAt: "",
      endsAt: "",
      usageLimit: "",
      rulesJson: "{}",
    });
    setDialogOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      type: promotion.type,
      status: promotion.status,
      startsAt: promotion.startsAt ? (promotion.startsAt.split("T")[0] ?? "") : "",
      endsAt: promotion.endsAt ? (promotion.endsAt.split("T")[0] ?? "") : "",
      usageLimit: promotion.usageLimit?.toString() || "",
      rulesJson: promotion.rulesJson,
    });
    setDialogOpen(true);
  };

  const handleDelete = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPromotion) return;

    try {
      const response = await fetch(`/api/admin/promotions/${selectedPromotion.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPromotions(promotions.filter((p) => p.id !== selectedPromotion.id));
        setDeleteDialogOpen(false);
        setSelectedPromotion(null);
      }
    } catch (error) {
      console.error("Failed to delete promotion:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        startsAt: formData.startsAt || null,
        endsAt: formData.endsAt || null,
      };

      if (editingPromotion) {
        const response = await fetch(`/api/admin/promotions/${editingPromotion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const updated = await response.json();
          setPromotions(promotions.map((p) => (p.id === editingPromotion.id ? updated : p)));
        }
      } else {
        const response = await fetch("/api/admin/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const newPromotion = await response.json();
          setPromotions([newPromotion, ...promotions]);
        }
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save promotion:", error);
    }
  };

  const handleAddCode = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setCodeForm({ code: "", usageLimit: "" });
    setCodeDialogOpen(true);
  };

  const handleSaveCode = async () => {
    if (!selectedPromotion || !codeForm.code) return;

    try {
      const response = await fetch(`/api/admin/promotions/${selectedPromotion.id}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeForm.code,
          usageLimit: codeForm.usageLimit ? parseInt(codeForm.usageLimit) : null,
          promotionId: selectedPromotion.id,
        }),
      });
      if (response.ok) {
        setCodeDialogOpen(false);
        fetchPromotions(); // Refresh to get updated codes
      }
    } catch (error) {
      console.error("Failed to save discount code:", error);
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    try {
      const response = await fetch(`/api/admin/promotion-codes/${codeId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchPromotions(); // Refresh to get updated codes
      }
    } catch (error) {
      console.error("Failed to delete discount code:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">进行中</Badge>;
      case "draft":
        return <Badge variant="secondary">草稿</Badge>;
      case "expired":
        return <Badge variant="outline">已过期</Badge>;
      case "scheduled":
        return <Badge variant="warning">计划中</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="h-4 w-4" />;
      case "fixed_amount":
        return <Tag className="h-4 w-4" />;
      case "free_shipping":
        return <Gift className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "percentage":
        return "百分比折扣";
      case "fixed_amount":
        return "固定金额";
      case "free_shipping":
        return "免运费";
      case "buy_x_get_y":
        return "买赠活动";
      default:
        return type;
    }
  };

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
          <h2 className="text-3xl font-bold tracking-tight">促销活动</h2>
          <p className="text-muted-foreground">
            创建和管理促销活动、折扣码
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建促销
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>促销列表</CardTitle>
              <CardDescription>
                共 {promotions.length} 个促销活动
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索促销..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {promotions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>促销名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>折扣码</TableHead>
                  <TableHead>使用次数</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                          {getTypeIcon(promotion.type)}
                        </div>
                        <div>
                          <p className="font-medium">{promotion.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {promotion.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeName(promotion.type)}</TableCell>
                    <TableCell>{getStatusBadge(promotion.status)}</TableCell>
                    <TableCell>
                      {promotion.discountCodes && promotion.discountCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {promotion.discountCodes.slice(0, 2).map((code) => (
                            <Badge key={code.id} variant="outline" className="font-mono text-xs">
                              {code.code}
                            </Badge>
                          ))}
                          {promotion.discountCodes.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{promotion.discountCodes.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {promotion.usageCount}
                      {promotion.usageLimit
                        ? ` / ${promotion.usageLimit}`
                        : ""}
                    </TableCell>
                    <TableCell>
                      {promotion.startsAt || promotion.endsAt ? (
                        <div className="text-sm">
                          {promotion.startsAt && (
                            <div>
                              {formatDate(promotion.startsAt)}
                            </div>
                          )}
                          {promotion.endsAt && (
                            <div className="text-muted-foreground">
                              至 {formatDate(promotion.endsAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          永久有效
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleAddCode(promotion)}>
                          <Ticket className="h-4 w-4 mr-1" />
                          码
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(promotion)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(promotion)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">暂无促销活动</h3>
              <p className="text-sm text-muted-foreground mb-4">
                创建您的第一个促销活动
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                创建促销
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
              {editingPromotion ? "编辑促销" : "创建促销"}
            </DialogTitle>
            <DialogDescription>
              {editingPromotion ? "修改促销活动信息" : "创建新的促销活动"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">促销名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入促销名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">促销类型</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="percentage">百分比折扣</option>
                  <option value="fixed_amount">固定金额</option>
                  <option value="free_shipping">免运费</option>
                  <option value="buy_x_get_y">买赠活动</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">状态</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">草稿</option>
                  <option value="active">进行中</option>
                  <option value="expired">已过期</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startsAt">开始日期</Label>
                <Input
                  id="startsAt"
                  type="date"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endsAt">结束日期</Label>
                <Input
                  id="endsAt"
                  type="date"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="usageLimit">使用次数限制</Label>
              <Input
                id="usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="留空表示不限制"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingPromotion ? "保存" : "创建"}
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
              确定要删除促销活动 "{selectedPromotion?.name}" 吗？此操作不可撤销。
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

      {/* Add Discount Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent onClose={() => setCodeDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>添加折扣码</DialogTitle>
            <DialogDescription>
              为促销 "{selectedPromotion?.name}" 添加折扣码
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">折扣码</Label>
              <Input
                id="code"
                value={codeForm.code}
                onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })}
                placeholder="例如: SUMMER20"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="codeUsageLimit">使用次数限制</Label>
              <Input
                id="codeUsageLimit"
                type="number"
                value={codeForm.usageLimit}
                onChange={(e) => setCodeForm({ ...codeForm, usageLimit: e.target.value })}
                placeholder="留空表示不限制"
              />
            </div>
            {selectedPromotion?.discountCodes && selectedPromotion.discountCodes.length > 0 && (
              <div>
                <Label className="text-muted-foreground">现有折扣码</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPromotion.discountCodes.map((code) => (
                    <Badge key={code.id} variant="outline" className="font-mono">
                      {code.code}
                      <button
                        className="ml-1 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteCode(code.id)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCode} disabled={!codeForm.code}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}