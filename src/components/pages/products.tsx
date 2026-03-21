import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate, formatDateTime } from "@/lib/date-utils";

interface Product {
  id: number;
  title: string;
  slug: string;
  status: string;
  productType: string;
  vendor: string;
  descriptionHtml: string;
  publishedAt: string | null;
  createdAt: string;
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: number;
  productId: number;
  title: string;
  sku: string;
  priceAmount: number;
  compareAtAmount: number | null;
}

interface ProductFormData {
  title: string;
  slug: string;
  status: string;
  productType: string;
  vendor: string;
  descriptionHtml: string;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    slug: "",
    status: "draft",
    productType: "",
    vendor: "",
    descriptionHtml: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/products?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setProducts(result.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      title: "",
      slug: "",
      status: "draft",
      productType: "",
      vendor: "",
      descriptionHtml: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      slug: product.slug,
      status: product.status,
      productType: product.productType,
      vendor: product.vendor,
      descriptionHtml: product.descriptionHtml,
    });
    setDialogOpen(true);
  };

  const handleView = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(data);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch product details:", error);
    }
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setProducts(products.filter((p) => p.id !== selectedProduct.id));
        setDeleteDialogOpen(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const updated = await response.json();
          setProducts(products.map((p) => (p.id === editingProduct.id ? updated : p)));
        }
      } else {
        const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, "-");
        const response = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, slug }),
        });
        if (response.ok) {
          const newProduct = await response.json();
          setProducts([newProduct, ...products]);
        }
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">已上架</Badge>;
      case "draft":
        return <Badge variant="secondary">草稿</Badge>;
      case "archived":
        return <Badge variant="outline">已归档</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (amount: number) => {
    return `¥${(amount / 100).toFixed(2)}`;
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
          <h2 className="text-3xl font-bold tracking-tight">商品管理</h2>
          <p className="text-muted-foreground">
            管理您的商品目录和库存
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          添加商品
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>商品列表</CardTitle>
              <CardDescription>
                共 {products.length} 个商品
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索商品..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                <option value="active">已上架</option>
                <option value="draft">草稿</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>{product.productType || "-"}</TableCell>
                    <TableCell>{product.vendor || "-"}</TableCell>
                    <TableCell>
                      {product.variants && product.variants.length > 0
                        ? formatPrice(product.variants[0]!.priceAmount)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {formatDate(product.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
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
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">暂无商品</h3>
              <p className="text-sm text-muted-foreground mb-4">
                开始添加您的第一个商品
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                添加商品
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
              {editingProduct ? "编辑商品" : "添加商品"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "修改商品信息" : "创建新商品"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">商品名称</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入商品名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">URL 标识</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="product-slug"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="productType">商品类型</Label>
                <Input
                  id="productType"
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  placeholder="服装、电子产品等"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vendor">供应商</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="供应商名称"
                />
              </div>
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
                <option value="active">已上架</option>
                <option value="archived">已归档</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">商品描述</Label>
              <Textarea
                id="description"
                value={formData.descriptionHtml}
                onChange={(e) => setFormData({ ...formData, descriptionHtml: e.target.value })}
                placeholder="输入商品描述..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent onClose={() => setDetailDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>商品详情</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">商品名称</Label>
                  <p className="font-medium">{selectedProduct.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">商品类型</Label>
                  <p>{selectedProduct.productType || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">供应商</Label>
                  <p>{selectedProduct.vendor || "-"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">URL 标识</Label>
                <p className="font-mono text-sm">/{selectedProduct.slug}</p>
              </div>
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">变体</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>名称</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>价格</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProduct.variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>{variant.title}</TableCell>
                          <TableCell className="font-mono">{variant.sku}</TableCell>
                          <TableCell>{formatPrice(variant.priceAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">创建时间</Label>
                <p>{formatDateTime(selectedProduct.createdAt)}</p>
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
              确定要删除商品 "{selectedProduct?.title}" 吗？此操作不可撤销。
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