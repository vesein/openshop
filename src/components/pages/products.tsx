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
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  id: number;
  title: string;
  slug: string;
  status: string;
  productType: string;
  vendor: string;
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

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个商品吗？")) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
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
        <Button>
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
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                      {new Date(product.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加商品
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}