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
  FolderOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/date-utils";
import { adminApi } from "@/lib/admin-api";
import { toast } from "sonner";

interface Collection {
  id: number;
  title: string;
  slug: string;
  status: string;
  descriptionHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
}

interface CollectionFormData {
  title: string;
  slug: string;
  status: string;
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
}

export function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<CollectionFormData>({
    title: "",
    slug: "",
    status: "draft",
    descriptionHtml: "",
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    void fetchCollections();
  }, [searchTerm, statusFilter, page]);

  const fetchCollections = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", String(page));
      params.append("pageSize", "20");

      const response = await fetch(adminApi.collections(params));
      if (response.ok) {
        const result = await response.json();
        setCollections(result.items || []);
        setTotal(result.total || 0);
      }
    } catch (error) {
      toast.error("获取商品集合失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCollection(null);
    setFormData({
      title: "",
      slug: "",
      status: "draft",
      descriptionHtml: "",
      seoTitle: "",
      seoDescription: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      title: collection.title,
      slug: collection.slug,
      status: collection.status,
      descriptionHtml: collection.descriptionHtml || "",
      seoTitle: collection.seoTitle || "",
      seoDescription: collection.seoDescription || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (collection: Collection) => {
    setDeletingCollection(collection);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCollection) return;

    try {
      const response = await fetch(adminApi.collection(deletingCollection.id), {
        method: "DELETE",
      });
      if (response.ok) {
        setCollections(collections.filter((c) => c.id !== deletingCollection.id));
        setDeleteDialogOpen(false);
        setDeletingCollection(null);
        toast.success("商品集合已删除");
      }
    } catch (error) {
      toast.error("删除商品集合失败");
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingCollection) {
        const response = await fetch(adminApi.collection(editingCollection.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const updated = await response.json();
          setCollections(collections.map((c) => (c.id === editingCollection.id ? updated : c)));
          toast.success("商品集合已更新");
        }
      } else {
        const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, "-");
        const response = await fetch(adminApi.collections(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, slug }),
        });
        if (response.ok) {
          const newCollection = await response.json();
          setCollections([newCollection, ...collections]);
          toast.success("商品集合已创建");
        }
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("保存商品集合失败");
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
          <h2 className="text-3xl font-bold tracking-tight">商品集合</h2>
          <p className="text-muted-foreground">
            管理您的商品集合与分类
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建集合
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>集合列表</CardTitle>
              <CardDescription>
                共 {total} 个集合
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索集合..."
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
          {collections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>集合名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{collection.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {collection.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(collection.status)}</TableCell>
                    <TableCell>
                      {formatDate(collection.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(collection)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(collection)}>
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
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">暂无集合</h3>
              <p className="text-sm text-muted-foreground mb-4">
                创建您的第一个商品集合
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                创建集合
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
              {editingCollection ? "编辑集合" : "创建集合"}
            </DialogTitle>
            <DialogDescription>
              {editingCollection ? "修改商品集合信息" : "创建新的商品集合"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">集合名称</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入集合名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">URL 标识</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="collection-slug"
              />
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
              <Label htmlFor="descriptionHtml">集合描述</Label>
              <Textarea
                id="descriptionHtml"
                value={formData.descriptionHtml}
                onChange={(e) => setFormData({ ...formData, descriptionHtml: e.target.value })}
                placeholder="输入集合描述..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoTitle">SEO 标题</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="搜索引擎标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoDescription">SEO 描述</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="搜索引擎描述..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingCollection ? "保存" : "创建"}
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
              确定要删除商品集合 "{deletingCollection?.title}" 吗？此操作不可撤销。
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
