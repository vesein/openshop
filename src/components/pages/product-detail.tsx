import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Package,
  AlertTriangle,
  Unlock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { formatMoneyMinorUnits } from "@/lib/money";

interface Product {
  id: number;
  title: string;
  slug: string;
  status: string;
  productType: string;
  vendor: string;
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: Variant[];
}

interface Variant {
  id: number;
  productId: number;
  title: string;
  sku: string;
  barcode: string;
  priceAmount: number;
  compareAtAmount: number | null;
  costAmount: number | null;
  weightValue: number | null;
  requiresShipping: number;
  taxable: number;
  isDefault: number;
  sortOrder: number;
}

interface InventoryLevel {
  onHand: number;
  reserved: number;
}

interface ProductOption {
  id: number;
  productId: number;
  name: string;
  sortOrder: number;
  values?: OptionValue[];
}

interface OptionValue {
  id: number;
  optionId: number;
  value: string;
  sortOrder: number;
}

export function ProductDetailPage() {
  const [, params] = useRoute("/products/:id");
  const [, navigate] = useLocation();
  const productId = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [shopCurrency, setShopCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    status: "draft",
    productType: "",
    vendor: "",
    descriptionHtml: "",
    seoTitle: "",
    seoDescription: "",
  });

  // Variant state
  const [variants, setVariants] = useState<Variant[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<number, InventoryLevel>>({});
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [variantForm, setVariantForm] = useState({
    title: "",
    sku: "",
    barcode: "",
    priceAmount: "",
    compareAtAmount: "",
    costAmount: "",
    weightValue: "",
    requiresShipping: 1,
    taxable: 1,
    isDefault: 0,
    sortOrder: "0",
  });
  const [deleteVariantDialogOpen, setDeleteVariantDialogOpen] = useState(false);
  const [deletingVariant, setDeletingVariant] = useState<Variant | null>(null);

  // Inventory adjust state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustVariantId, setAdjustVariantId] = useState<number | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    movementType: "in",
    quantityDelta: "",
    note: "",
  });

  // Options state
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null);
  const [optionForm, setOptionForm] = useState({ name: "", sortOrder: "0" });
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<OptionValue | null>(null);
  const [valueOptionId, setValueOptionId] = useState<number | null>(null);
  const [valueForm, setValueForm] = useState({ value: "", sortOrder: "0" });

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadCurrency();
    }
  }, [productId]);

  const loadCurrency = async () => {
    try {
      const r = await fetch(adminApi.settings);
      if (r.ok) {
        const s = await r.json();
        if (s.currencyCode) setShopCurrency(s.currencyCode);
      }
    } catch {}
  };

  const loadProduct = async () => {
    try {
      const r = await fetch(adminApi.product(productId!));
      if (!r.ok) {
        toast.error("商品不存在");
        navigate("/products");
        return;
      }
      const data: Product = await r.json();
      setProduct(data);
      setForm({
        title: data.title,
        slug: data.slug,
        status: data.status,
        productType: data.productType,
        vendor: data.vendor,
        descriptionHtml: data.descriptionHtml,
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
      });
      setVariants(data.variants || []);

      // Load options and inventory in parallel
      await Promise.all([
        loadOptions(),
        ...(data.variants || []).map((v) => loadInventory(v.id)),
      ]);
    } catch {
      toast.error("加载商品失败");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const r = await fetch(adminApi.productOptions(productId!));
      if (r.ok) {
        const data = await r.json();
        const opts: ProductOption[] = data.items || [];
        // Load values for each option
        const withValues = await Promise.all(
          opts.map(async (opt) => {
            try {
              const vr = await fetch(adminApi.optionValues(opt.id));
              if (vr.ok) {
                const vd = await vr.json();
                return { ...opt, values: vd.items || [] };
              }
            } catch {}
            return { ...opt, values: [] };
          })
        );
        setOptions(withValues);
      }
    } catch {}
  };

  const loadInventory = async (variantId: number) => {
    try {
      const r = await fetch(adminApi.variantInventory(variantId));
      if (r.ok) {
        const data = await r.json();
        setInventoryMap((prev) => ({
          ...prev,
          [variantId]: { onHand: data.onHand ?? 0, reserved: data.reserved ?? 0 },
        }));
      }
    } catch {}
  };

  const handleSaveProduct = async () => {
    setSaving(true);
    try {
      const r = await fetch(adminApi.product(productId!), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        const updated = await r.json();
        setProduct(updated);
        toast.success("商品已保存");
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const isActive = product?.status === "active";

  const handleUnlockEdit = async () => {
    try {
      const r = await fetch(adminApi.product(productId!), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (r.ok) {
        const updated = await r.json();
        setProduct(updated);
        setForm((f) => ({ ...f, status: "draft" }));
        toast.success("已切换为草稿状态，可编辑变体和选项");
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "解锁失败");
      }
    } catch {
      toast.error("解锁失败");
    }
  };

  // ---- Variant CRUD ----
  const openVariantCreate = () => {
    setEditingVariant(null);
    setVariantForm({
      title: "",
      sku: "",
      barcode: "",
      priceAmount: "",
      compareAtAmount: "",
      costAmount: "",
      weightValue: "",
      requiresShipping: 1,
      taxable: 1,
      isDefault: 0,
      sortOrder: String(variants.length),
    });
    setVariantDialogOpen(true);
  };

  const openVariantEdit = (v: Variant) => {
    setEditingVariant(v);
    setVariantForm({
      title: v.title,
      sku: v.sku,
      barcode: v.barcode || "",
      priceAmount: String(v.priceAmount),
      compareAtAmount: v.compareAtAmount != null ? String(v.compareAtAmount) : "",
      costAmount: v.costAmount != null ? String(v.costAmount) : "",
      weightValue: v.weightValue != null ? String(v.weightValue) : "",
      requiresShipping: v.requiresShipping,
      taxable: v.taxable,
      isDefault: v.isDefault,
      sortOrder: String(v.sortOrder),
    });
    setVariantDialogOpen(true);
  };

  const handleSaveVariant = async () => {
    const data: Record<string, unknown> = {
      title: variantForm.title,
      sku: variantForm.sku,
      barcode: variantForm.barcode || null,
      priceAmount: parseInt(variantForm.priceAmount) || 0,
      compareAtAmount: variantForm.compareAtAmount ? parseInt(variantForm.compareAtAmount) : null,
      costAmount: variantForm.costAmount ? parseInt(variantForm.costAmount) : null,
      weightValue: variantForm.weightValue ? parseFloat(variantForm.weightValue) : null,
      requiresShipping: variantForm.requiresShipping,
      taxable: variantForm.taxable,
      isDefault: variantForm.isDefault,
      sortOrder: parseInt(variantForm.sortOrder) || 0,
    };
    try {
      if (editingVariant) {
        const r = await fetch(adminApi.variant(editingVariant.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          const updated = await r.json();
          setVariants((vs) => vs.map((v) => (v.id === editingVariant.id ? updated : v)));
          toast.success("变体已更新");
        } else {
          const err = await r.json().catch(() => null);
          toast.error(err?.error || "更新变体失败");
        }
      } else {
        const r = await fetch(adminApi.variants(productId!), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          const newV = await r.json();
          setVariants((vs) => [...vs, newV]);
          loadInventory(newV.id);
          toast.success("变体已创建");
        } else {
          const err = await r.json().catch(() => null);
          toast.error(err?.error || "创建变体失败");
        }
      }
      setVariantDialogOpen(false);
    } catch {
      toast.error("保存变体失败");
    }
  };

  const confirmDeleteVariant = async () => {
    if (!deletingVariant) return;
    try {
      const r = await fetch(adminApi.variant(deletingVariant.id), { method: "DELETE" });
      if (r.ok) {
        setVariants((vs) => vs.filter((v) => v.id !== deletingVariant.id));
        toast.success("变体已删除");
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "删除变体失败");
      }
    } catch {
      toast.error("删除变体失败");
    }
    setDeleteVariantDialogOpen(false);
    setDeletingVariant(null);
  };

  // ---- Inventory ----
  const openAdjust = (variantId: number) => {
    setAdjustVariantId(variantId);
    setAdjustForm({ movementType: "in", quantityDelta: "", note: "" });
    setAdjustDialogOpen(true);
  };

  const handleAdjustInventory = async () => {
    if (!adjustVariantId) return;
    try {
      const r = await fetch(adminApi.inventoryAdjust(adjustVariantId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movementType: adjustForm.movementType,
          quantityDelta: parseInt(adjustForm.quantityDelta) || 0,
          note: adjustForm.note || undefined,
        }),
      });
      if (r.ok) {
        toast.success("库存已调整");
        loadInventory(adjustVariantId);
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "库存调整失败");
      }
    } catch {
      toast.error("库存调整失败");
    }
    setAdjustDialogOpen(false);
  };

  // ---- Options CRUD ----
  const openOptionCreate = () => {
    setEditingOption(null);
    setOptionForm({ name: "", sortOrder: String(options.length) });
    setOptionDialogOpen(true);
  };

  const openOptionEdit = (opt: ProductOption) => {
    setEditingOption(opt);
    setOptionForm({ name: opt.name, sortOrder: String(opt.sortOrder) });
    setOptionDialogOpen(true);
  };

  const handleSaveOption = async () => {
    const data = { name: optionForm.name, sortOrder: parseInt(optionForm.sortOrder) || 0 };
    try {
      if (editingOption) {
        const r = await fetch(adminApi.productOption(editingOption.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          toast.success("选项已更新");
          loadOptions();
        } else {
          const err = await r.json().catch(() => null);
          toast.error(err?.error || "更新选项失败");
        }
      } else {
        const r = await fetch(adminApi.productOptions(productId!), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          toast.success("选项已创建");
          loadOptions();
        } else {
          const err = await r.json().catch(() => null);
          toast.error(err?.error || "创建选项失败");
        }
      }
      setOptionDialogOpen(false);
    } catch {
      toast.error("保存选项失败");
    }
  };

  const handleDeleteOption = async (optId: number) => {
    try {
      const r = await fetch(adminApi.productOption(optId), { method: "DELETE" });
      if (r.ok) {
        toast.success("选项已删除");
        loadOptions();
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "删除选项失败");
      }
    } catch {
      toast.error("删除选项失败");
    }
  };

  // ---- Option Values CRUD ----
  const openValueCreate = (optionId: number) => {
    setValueOptionId(optionId);
    setEditingValue(null);
    setValueForm({ value: "", sortOrder: "0" });
    setValueDialogOpen(true);
  };

  const openValueEdit = (optionId: number, val: OptionValue) => {
    setValueOptionId(optionId);
    setEditingValue(val);
    setValueForm({ value: val.value, sortOrder: String(val.sortOrder) });
    setValueDialogOpen(true);
  };

  const handleSaveValue = async () => {
    if (!valueOptionId) return;
    const data = { value: valueForm.value, sortOrder: parseInt(valueForm.sortOrder) || 0 };
    try {
      if (editingValue) {
        const r = await fetch(adminApi.optionValue(editingValue.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          toast.success("选项值已更新");
          loadOptions();
        } else {
          const err = await r.json().catch(() => null);
          toast.error(err?.error || "更新选项值失败");
        }
      } else {
        const r = await fetch(adminApi.optionValues(valueOptionId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (r.ok) {
          toast.success("选项值已创建");
          loadOptions();
        } else {
          const err = await r.json().catch(() => null);
          toast.error(err?.error || "创建选项值失败");
        }
      }
      setValueDialogOpen(false);
    } catch {
      toast.error("保存选项值失败");
    }
  };

  const handleDeleteValue = async (valId: number) => {
    try {
      const r = await fetch(adminApi.optionValue(valId), { method: "DELETE" });
      if (r.ok) {
        toast.success("选项值已删除");
        loadOptions();
      } else {
        const err = await r.json().catch(() => null);
        toast.error(err?.error || "删除选项值失败");
      }
    } catch {
      toast.error("删除选项值失败");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{product.title}</h2>
            <p className="text-muted-foreground">ID: {product.id}</p>
          </div>
          {product.status === "active" && <Badge variant="success">已上架</Badge>}
          {product.status === "draft" && <Badge variant="secondary">草稿</Badge>}
          {product.status === "archived" && <Badge variant="outline">已归档</Badge>}
        </div>
        <Button onClick={handleSaveProduct} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>商品名称</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>URL 标识</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>状态</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">草稿</option>
                <option value="active">已上架</option>
                <option value="archived">已归档</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>商品类型</Label>
              <Input value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>供应商</Label>
              <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>商品描述</Label>
            <Textarea
              value={form.descriptionHtml}
              onChange={(e) => setForm({ ...form, descriptionHtml: e.target.value })}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>SEO 标题</Label>
              <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>SEO 描述</Label>
              <Input value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Warning */}
      {isActive && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">商品已上架，变体和选项不可编辑</p>
            <p className="text-sm text-yellow-700">需要先切换为草稿状态才能修改变体和选项</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleUnlockEdit}>
            <Unlock className="mr-1 h-4 w-4" />
            解锁编辑
          </Button>
        </div>
      )}

      {/* Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>变体管理</CardTitle>
            {!isActive && (
              <Button size="sm" onClick={openVariantCreate}>
                <Plus className="mr-1 h-4 w-4" />
                添加变体
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {variants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>库存</TableHead>
                  <TableHead>默认</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((v) => {
                  const inv = inventoryMap[v.id];
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.title}</TableCell>
                      <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                      <TableCell>{formatMoneyMinorUnits(v.priceAmount, shopCurrency)}</TableCell>
                      <TableCell>
                        {inv ? (
                          <span>
                            {inv.onHand} 在手
                            {inv.reserved > 0 && <span className="text-muted-foreground"> / {inv.reserved} 预留</span>}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {v.isDefault === 1 && <Badge variant="outline">默认</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openAdjust(v.id)}>
                            库存
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openVariantEdit(v)} disabled={isActive}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isActive}
                            onClick={() => {
                              setDeletingVariant(v);
                              setDeleteVariantDialogOpen(true);
                            }}
                          >
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
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">暂无变体</p>
              {!isActive && (
                <Button variant="outline" size="sm" className="mt-2" onClick={openVariantCreate}>
                  <Plus className="mr-1 h-4 w-4" />
                  添加变体
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>商品选项</CardTitle>
            {!isActive && (
              <Button size="sm" onClick={openOptionCreate}>
                <Plus className="mr-1 h-4 w-4" />
                添加选项
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {options.length > 0 ? (
            <div className="space-y-4">
              {options.map((opt) => (
                <div key={opt.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{opt.name}</h4>
                    <div className="flex gap-1">
                      {!isActive && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openValueCreate(opt.id)}>
                            <Plus className="mr-1 h-3 w-3" />
                            添加值
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openOptionEdit(opt)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteOption(opt.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {opt.values && opt.values.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val) => (
                        <Badge key={val.id} variant="outline" className="gap-1">
                          {val.value}
                          {!isActive && (
                            <>
                              <button
                                className="text-muted-foreground hover:text-foreground ml-1"
                                onClick={() => openValueEdit(opt.id, val)}
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteValue(val.id)}
                              >
                                x
                              </button>
                            </>
                          )}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无选项值</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">暂无商品选项</p>
          )}
        </CardContent>
      </Card>

      {/* Variant Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent onClose={() => setVariantDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingVariant ? "编辑变体" : "添加变体"}</DialogTitle>
            <DialogDescription>{editingVariant ? "修改变体信息" : "创建新变体"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>名称</Label>
                <Input value={variantForm.title} onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })} placeholder="默认" />
              </div>
              <div className="grid gap-2">
                <Label>SKU</Label>
                <Input value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} placeholder="SKU-001" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>条码</Label>
              <Input value={variantForm.barcode} onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>价格 (分)</Label>
                <Input type="number" value={variantForm.priceAmount} onChange={(e) => setVariantForm({ ...variantForm, priceAmount: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>原价 (分)</Label>
                <Input type="number" value={variantForm.compareAtAmount} onChange={(e) => setVariantForm({ ...variantForm, compareAtAmount: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>成本 (分)</Label>
                <Input type="number" value={variantForm.costAmount} onChange={(e) => setVariantForm({ ...variantForm, costAmount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>重量</Label>
                <Input type="number" step="0.01" value={variantForm.weightValue} onChange={(e) => setVariantForm({ ...variantForm, weightValue: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>排序</Label>
                <Input type="number" value={variantForm.sortOrder} onChange={(e) => setVariantForm({ ...variantForm, sortOrder: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="vShipping" checked={variantForm.requiresShipping === 1} onChange={(e) => setVariantForm({ ...variantForm, requiresShipping: e.target.checked ? 1 : 0 })} />
                <Label htmlFor="vShipping">需要发货</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="vTaxable" checked={variantForm.taxable === 1} onChange={(e) => setVariantForm({ ...variantForm, taxable: e.target.checked ? 1 : 0 })} />
                <Label htmlFor="vTaxable">含税</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="vDefault" checked={variantForm.isDefault === 1} onChange={(e) => setVariantForm({ ...variantForm, isDefault: e.target.checked ? 1 : 0 })} />
                <Label htmlFor="vDefault">默认变体</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariantDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveVariant}>{editingVariant ? "保存" : "创建"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Variant Dialog */}
      <Dialog open={deleteVariantDialogOpen} onOpenChange={setDeleteVariantDialogOpen}>
        <DialogContent onClose={() => setDeleteVariantDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除变体 "{deletingVariant?.title}" 吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVariantDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmDeleteVariant}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory Adjust Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent onClose={() => setAdjustDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>库存调整</DialogTitle>
            <DialogDescription>调整变体库存数量</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>操作类型</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={adjustForm.movementType}
                onChange={(e) => setAdjustForm({ ...adjustForm, movementType: e.target.value })}
              >
                <option value="in">入库</option>
                <option value="adjust">手动调整</option>
                <option value="reserve">预留</option>
                <option value="release">释放预留</option>
                <option value="sold">已售出</option>
                <option value="returned">退货入库</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>数量变化</Label>
              <Input
                type="number"
                value={adjustForm.quantityDelta}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantityDelta: e.target.value })}
                placeholder="正数增加，负数减少"
              />
            </div>
            <div className="grid gap-2">
              <Label>备注</Label>
              <Input
                value={adjustForm.note}
                onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                placeholder="可选备注"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>取消</Button>
            <Button onClick={handleAdjustInventory}>确认调整</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent onClose={() => setOptionDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingOption ? "编辑选项" : "添加选项"}</DialogTitle>
            <DialogDescription>{editingOption ? "修改商品选项" : "为商品创建新选项"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>选项名称</Label>
              <Input value={optionForm.name} onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })} placeholder="如: 颜色、尺码" />
            </div>
            <div className="grid gap-2">
              <Label>排序</Label>
              <Input type="number" value={optionForm.sortOrder} onChange={(e) => setOptionForm({ ...optionForm, sortOrder: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptionDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveOption}>{editingOption ? "保存" : "创建"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Value Dialog */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent onClose={() => setValueDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingValue ? "编辑选项值" : "添加选项值"}</DialogTitle>
            <DialogDescription>{editingValue ? "修改选项值" : "为选项创建新值"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>值</Label>
              <Input value={valueForm.value} onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })} placeholder="如: 红色、XL" />
            </div>
            <div className="grid gap-2">
              <Label>排序</Label>
              <Input type="number" value={valueForm.sortOrder} onChange={(e) => setValueForm({ ...valueForm, sortOrder: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValueDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveValue}>{editingValue ? "保存" : "创建"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
