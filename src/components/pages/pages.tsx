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
  FileText,
  Menu as MenuIcon,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-utils";
import { adminApi } from "@/lib/admin-api";

interface Page {
  id: number;
  title: string;
  slug: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  contentJson: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Menu {
  id: number;
  name: string;
  handle: string;
  createdAt: string;
  updatedAt: string;
}

interface PageFormData {
  title: string;
  slug: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  contentJson: string;
}

interface MenuFormData {
  name: string;
  handle: string;
}

export function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pages" | "menus">("pages");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "page" | "menu"; id: number; name: string } | null>(null);
  const [pageForm, setPageForm] = useState<PageFormData>({
    title: "",
    slug: "",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    contentJson: "{}",
  });
  const [menuForm, setMenuForm] = useState<MenuFormData>({
    name: "",
    handle: "",
  });

  useEffect(() => {
    fetchPages();
    fetchMenus();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch(adminApi.pages());
      if (response.ok) {
        const result = await response.json();
        setPages(result.items || []);
      }
    } catch (error) {
      toast.error("获取页面列表失败");
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await fetch(adminApi.menus());
      if (response.ok) {
        const result = await response.json();
        setMenus(result.items || []);
      }
    } catch (error) {
      toast.error("获取菜单列表失败");
    } finally {
      setLoading(false);
    }
  };

  // Page handlers
  const handleCreatePage = () => {
    setEditingPage(null);
    setPageForm({
      title: "",
      slug: "",
      status: "draft",
      seoTitle: "",
      seoDescription: "",
      contentJson: "{}",
    });
    setPageDialogOpen(true);
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page);
    setPageForm({
      title: page.title,
      slug: page.slug,
      status: page.status,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      contentJson: page.contentJson,
    });
    setPageDialogOpen(true);
  };

  const handleDeletePage = (page: Page) => {
    setDeleteTarget({ type: "page", id: page.id, name: page.title });
    setDeleteDialogOpen(true);
  };

  const handleSavePage = async () => {
    try {
      const slug = pageForm.slug || pageForm.title.toLowerCase().replace(/\s+/g, "-");
      const data = { ...pageForm, slug };

      if (editingPage) {
        const response = await fetch(adminApi.page(editingPage.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const updated = await response.json();
          setPages(pages.map((p) => (p.id === editingPage.id ? updated : p)));
          toast.success("页面已更新");
        }
      } else {
        const response = await fetch(adminApi.pages(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const newPage = await response.json();
          setPages([newPage, ...pages]);
          toast.success("页面已创建");
        }
      }
      setPageDialogOpen(false);
    } catch (error) {
      toast.error("保存页面失败");
    }
  };

  // Menu handlers
  const handleCreateMenu = () => {
    setEditingMenu(null);
    setMenuForm({ name: "", handle: "" });
    setMenuDialogOpen(true);
  };

  const handleEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setMenuForm({
      name: menu.name,
      handle: menu.handle,
    });
    setMenuDialogOpen(true);
  };

  const handleDeleteMenu = (menu: Menu) => {
    setDeleteTarget({ type: "menu", id: menu.id, name: menu.name });
    setDeleteDialogOpen(true);
  };

  const handleSaveMenu = async () => {
    try {
      const handle = menuForm.handle || menuForm.name.toLowerCase().replace(/\s+/g, "-");
      const data = { ...menuForm, handle };

      if (editingMenu) {
        const response = await fetch(adminApi.menu(editingMenu.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const updated = await response.json();
          setMenus(menus.map((m) => (m.id === editingMenu.id ? updated : m)));
          toast.success("菜单已更新");
        }
      } else {
        const response = await fetch(adminApi.menus(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const newMenu = await response.json();
          setMenus([newMenu, ...menus]);
          toast.success("菜单已创建");
        }
      }
      setMenuDialogOpen(false);
    } catch (error) {
      toast.error("保存菜单失败");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const url =
        deleteTarget.type === "page"
          ? adminApi.page(deleteTarget.id)
          : adminApi.menu(deleteTarget.id);

      const response = await fetch(url, { method: "DELETE" });
      if (response.ok) {
        if (deleteTarget.type === "page") {
          setPages(pages.filter((p) => p.id !== deleteTarget.id));
          toast.success("页面已删除");
        } else {
          setMenus(menus.filter((m) => m.id !== deleteTarget.id));
          toast.success("菜单已删除");
        }
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
      case "active":
        return <Badge variant="success">已发布</Badge>;
      case "draft":
        return <Badge variant="secondary">草稿</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMenus = menus.filter((menu) =>
    menu.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-3xl font-bold tracking-tight">内容管理</h2>
          <p className="text-muted-foreground">
            管理静态页面和导航菜单
          </p>
        </div>
        <Button onClick={activeTab === "pages" ? handleCreatePage : handleCreateMenu}>
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === "pages" ? "创建页面" : "创建菜单"}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "pages" ? "default" : "outline"}
          onClick={() => setActiveTab("pages")}
        >
          <FileText className="mr-2 h-4 w-4" />
          页面 ({pages.length})
        </Button>
        <Button
          variant={activeTab === "menus" ? "default" : "outline"}
          onClick={() => setActiveTab("menus")}
        >
          <MenuIcon className="mr-2 h-4 w-4" />
          菜单 ({menus.length})
        </Button>
      </div>

      {activeTab === "pages" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>页面列表</CardTitle>
                <CardDescription>
                  共 {pages.length} 个页面
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索页面..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>页面标题</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>发布日期</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{page.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {page.seoDescription || "暂无描述"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <ExternalLink className="h-3 w-3 mr-1 text-muted-foreground" />
                          /{page.slug}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(page.status)}</TableCell>
                      <TableCell>
                        {formatDate(page.publishedAt)}
                      </TableCell>
                      <TableCell>
                        {formatDate(page.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditPage(page)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePage(page)}>
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
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">暂无页面</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  创建您的第一个静态页面
                </p>
                <Button onClick={handleCreatePage}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建页面
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>菜单列表</CardTitle>
                <CardDescription>
                  共 {menus.length} 个菜单
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索菜单..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMenus.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>菜单名称</TableHead>
                    <TableHead>标识</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMenus.map((menu) => (
                    <TableRow key={menu.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                            <MenuIcon className="h-5 w-5" />
                          </div>
                          <p className="font-medium">{menu.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {menu.handle}
                        </code>
                      </TableCell>
                      <TableCell>
                        {formatDate(menu.createdAt)}
                      </TableCell>
                      <TableCell>
                        {formatDate(menu.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditMenu(menu)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMenu(menu)}>
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
                <MenuIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">暂无菜单</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  创建您的第一个导航菜单
                </p>
                <Button onClick={handleCreateMenu}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建菜单
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Page Dialog */}
      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent onClose={() => setPageDialogOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "编辑页面" : "创建页面"}
            </DialogTitle>
            <DialogDescription>
              {editingPage ? "修改页面内容" : "创建新的静态页面"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pageTitle">页面标题</Label>
              <Input
                id="pageTitle"
                value={pageForm.title}
                onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                placeholder="输入页面标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pageSlug">URL 标识</Label>
              <Input
                id="pageSlug"
                value={pageForm.slug}
                onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                placeholder="page-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pageStatus">状态</Label>
              <select
                id="pageStatus"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={pageForm.status}
                onChange={(e) => setPageForm({ ...pageForm, status: e.target.value })}
              >
                <option value="draft">草稿</option>
                <option value="active">已发布</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoTitle">SEO 标题</Label>
              <Input
                id="seoTitle"
                value={pageForm.seoTitle}
                onChange={(e) => setPageForm({ ...pageForm, seoTitle: e.target.value })}
                placeholder="搜索引擎显示的标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoDescription">SEO 描述</Label>
              <Textarea
                id="seoDescription"
                value={pageForm.seoDescription}
                onChange={(e) => setPageForm({ ...pageForm, seoDescription: e.target.value })}
                placeholder="搜索引擎显示的描述"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPageDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSavePage}>
              {editingPage ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Dialog */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent onClose={() => setMenuDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? "编辑菜单" : "创建菜单"}
            </DialogTitle>
            <DialogDescription>
              {editingMenu ? "修改菜单信息" : "创建新的导航菜单"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="menuName">菜单名称</Label>
              <Input
                id="menuName"
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                placeholder="例如: 主导航"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="menuHandle">菜单标识</Label>
              <Input
                id="menuHandle"
                value={menuForm.handle}
                onChange={(e) => setMenuForm({ ...menuForm, handle: e.target.value })}
                placeholder="例如: main-nav"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveMenu}>
              {editingMenu ? "保存" : "创建"}
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
              确定要删除{deleteTarget?.type === "page" ? "页面" : "菜单"} "{deleteTarget?.name}" 吗？此操作不可撤销。
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