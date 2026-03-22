import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Trash2,
  Upload,
  Image,
  Video,
  File,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/date-utils";
import { adminApi } from "@/lib/admin-api";
import { toast } from "sonner";

interface MediaItem {
  id: number;
  kind: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getKindIcon(kind: string) {
  switch (kind) {
    case "image":
      return <Image className="h-8 w-8 text-muted-foreground" />;
    case "video":
      return <Video className="h-8 w-8 text-muted-foreground" />;
    default:
      return <File className="h-8 w-8 text-muted-foreground" />;
  }
}

function getFilename(storageKey: string): string {
  const parts = storageKey.split("/");
  return parts[parts.length - 1] || storageKey;
}

export function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [altText, setAltText] = useState("");

  useEffect(() => {
    void fetchMedia();
  }, [kindFilter]);

  const fetchMedia = async () => {
    try {
      const params = new URLSearchParams();
      if (kindFilter !== "all") params.append("kind", kindFilter);

      const response = await fetch(adminApi.media(params));
      if (response.ok) {
        const result = await response.json();
        setMediaItems(result.items || []);
      }
    } catch (error) {
      toast.error("获取媒体文件失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (item: MediaItem) => {
    setSelectedItem(item);
    setAltText(item.alt || "");
    setDetailDialogOpen(true);
  };

  const handleUpload = () => {
    toast.info("文件上传功能即将推出");
  };

  const handleDelete = (item: MediaItem) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(adminApi.mediaItem(selectedItem.id), {
        method: "DELETE",
      });
      if (response.ok) {
        setMediaItems(mediaItems.filter((m) => m.id !== selectedItem.id));
        setDeleteDialogOpen(false);
        setDetailDialogOpen(false);
        setSelectedItem(null);
        toast.success("媒体文件已删除");
      }
    } catch (error) {
      toast.error("删除媒体文件失败");
    }
  };

  const handleSaveAlt = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(adminApi.mediaItem(selectedItem.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: altText }),
      });
      if (response.ok) {
        const updated = await response.json();
        setMediaItems(mediaItems.map((m) => (m.id === selectedItem.id ? updated : m)));
        setSelectedItem(updated);
        toast.success("替代文本已更新");
      }
    } catch (error) {
      toast.error("更新替代文本失败");
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
          <h2 className="text-3xl font-bold tracking-tight">媒体库</h2>
          <p className="text-muted-foreground">
            管理您的图片、视频和文件
          </p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="mr-2 h-4 w-4" />
          上传文件
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>文件列表</CardTitle>
              <CardDescription>
                共 {mediaItems.length} 个文件
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
              >
                <option value="all">全部类型</option>
                <option value="image">图片</option>
                <option value="video">视频</option>
                <option value="file">文件</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:shadow-sm transition-colors"
                  onClick={() => handleCardClick(item)}
                >
                  <div className="flex items-center justify-center h-24 bg-muted rounded-md mb-3">
                    {getKindIcon(item.kind)}
                  </div>
                  <p className="text-sm font-medium truncate" title={getFilename(item.storageKey)}>
                    {getFilename(item.storageKey)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.mimeType}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatSize(item.sizeBytes)}
                    </span>
                    {item.width && item.height && (
                      <span className="text-xs text-muted-foreground">
                        {item.width}x{item.height}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">暂无媒体文件</h3>
              <p className="text-sm text-muted-foreground mb-4">
                上传您的第一个文件
              </p>
              <Button onClick={handleUpload}>
                <Upload className="mr-2 h-4 w-4" />
                上传文件
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent onClose={() => setDetailDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>媒体详情</DialogTitle>
            <DialogDescription>
              {selectedItem ? getFilename(selectedItem.storageKey) : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                {getKindIcon(selectedItem.kind)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">文件类型</span>
                  <p className="font-medium">{selectedItem.mimeType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">文件大小</span>
                  <p className="font-medium">{formatSize(selectedItem.sizeBytes)}</p>
                </div>
                {selectedItem.width && selectedItem.height && (
                  <div>
                    <span className="text-muted-foreground">尺寸</span>
                    <p className="font-medium">{selectedItem.width} x {selectedItem.height}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">上传时间</span>
                  <p className="font-medium">{formatDate(selectedItem.createdAt)}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="alt">替代文本 (Alt)</Label>
                <Input
                  id="alt"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="输入图片替代文本..."
                />
                <Button variant="outline" size="sm" onClick={handleSaveAlt}>
                  保存替代文本
                </Button>
              </div>
              <div className="grid gap-2">
                <span className="text-sm text-muted-foreground">存储路径</span>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                  {selectedItem.storageKey}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                setDetailDialogOpen(false);
                if (selectedItem) handleDelete(selectedItem);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
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
              确定要删除文件 "{selectedItem ? getFilename(selectedItem.storageKey) : ""}" 吗？此操作不可撤销。
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
