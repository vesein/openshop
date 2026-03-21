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
  FileText,
  Menu as MenuIcon,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Page {
  id: number;
  title: string;
  slug: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
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

export function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pages" | "menus">("pages");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPages();
    fetchMenus();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/admin/pages");
      if (response.ok) {
        const result = await response.json();
        setPages(result.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await fetch("/api/admin/menus");
      if (response.ok) {
        const result = await response.json();
        setMenus(result.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch menus:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">已发布</Badge>;
      case "draft":
        return <Badge variant="secondary">草稿</Badge>;
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
          <h2 className="text-3xl font-bold tracking-tight">内容管理</h2>
          <p className="text-muted-foreground">
            管理静态页面和导航菜单
          </p>
        </div>
        <Button>
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
          页面
        </Button>
        <Button
          variant={activeTab === "menus" ? "default" : "outline"}
          onClick={() => setActiveTab("menus")}
        >
          <MenuIcon className="mr-2 h-4 w-4" />
          菜单
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
            {pages.length > 0 ? (
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
                  {pages.map((page) => (
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
                        {page.publishedAt
                          ? new Date(page.publishedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
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
                <Button>
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
            </div>
          </CardHeader>
          <CardContent>
            {menus.length > 0 ? (
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
                  {menus.map((menu) => (
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
                        {new Date(menu.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(menu.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
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
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  创建菜单
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}