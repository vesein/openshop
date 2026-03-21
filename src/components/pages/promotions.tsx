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
  Tag,
  Percent,
  Gift,
} from "lucide-react";
import { useEffect, useState } from "react";

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
}

export function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
        <Button>
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
                  <TableHead>使用次数</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>创建时间</TableHead>
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
                              {new Date(promotion.startsAt).toLocaleDateString()}
                            </div>
                          )}
                          {promotion.endsAt && (
                            <div className="text-muted-foreground">
                              至 {new Date(promotion.endsAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          永久有效
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(promotion.createdAt).toLocaleDateString()}
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
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">暂无促销活动</h3>
              <p className="text-sm text-muted-foreground mb-4">
                创建您的第一个促销活动
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                创建促销
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}