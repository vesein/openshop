import { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { MetafieldCard } from "../components/MetafieldCard";
import { mockPages } from "../mock/data";
import { toast } from "sonner";

export function PageDetail() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const pg = isNew ? null : mockPages.find((p) => p.id === Number(params.id));

  const [title, setTitle] = useState(pg?.title ?? "");
  const [slug, setSlug] = useState(pg?.slug ?? "");
  const [status, setStatus] = useState(pg?.status ?? "draft");
  const [content, setContent] = useState(pg?.contentJson ? JSON.stringify(pg.contentJson, null, 2) : "");
  const [seoTitle, setSeoTitle] = useState(pg?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(pg?.seoDescription ?? "");
  const [publishedAt, setPublishedAt] = useState(pg?.publishedAt?.slice(0, 16) ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!isNew && !pg) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Page not found.</p>
        <Link href="/pages"><Button variant="link" className="mt-4">← Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/pages"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <h1 className="text-2xl font-bold">{isNew ? "New Page" : title}</h1>
        {!isNew && <StatusBadge status={status} />}
        <div className="ml-auto flex gap-2">
          {!isNew && <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>}
          <Button onClick={() => toast.success("Saved")}>Save</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Published At</Label><Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Content (JSON)</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={12} className="font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} placeholder='{"type":"doc","content":[...]}' />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SEO Title</Label>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
          </div>
          <div className="border rounded-md p-4 bg-muted/30 space-y-1">
            <p className="text-sm text-blue-600 truncate">{seoTitle || title || "Page Title"}</p>
            <p className="text-xs text-green-700 truncate">example.com/pages/{slug || "slug"}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{seoDescription || "No description."}</p>
          </div>
        </CardContent>
      </Card>

      {!isNew && <MetafieldCard resourceType="page" />}

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} description="This page will be permanently deleted." onConfirm={() => setDeleteOpen(false)} />
    </div>
  );
}
