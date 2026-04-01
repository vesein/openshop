import { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, X, GripVertical } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { MetafieldCard } from "../components/MetafieldCard";
import { mockCollections, mockProducts } from "../mock/data";

export function CollectionDetail() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const collection = isNew ? null : mockCollections.find((c) => c.id === Number(params.id));

  const [title, setTitle] = useState(collection?.title ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [status, setStatus] = useState(collection?.status ?? "draft");
  const [desc, setDesc] = useState(collection?.descriptionHtml ?? "");
  const [seoTitle, setSeoTitle] = useState(collection?.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(collection?.seoDescription ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const linkedProducts = (collection?.productIds ?? [])
    .map((id) => mockProducts.find((p) => p.id === id))
    .filter(Boolean);

  if (!isNew && !collection) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Collection not found.</p>
        <Link href="/collections"><Button variant="link" className="mt-4">← Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/collections"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <h1 className="text-2xl font-bold">{isNew ? "New Collection" : title}</h1>
        {!isNew && <StatusBadge status={status} />}
        <div className="ml-auto flex gap-2">
          {!isNew && <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>}
          <Button>Save</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Published At</Label><Input type="datetime-local" defaultValue={collection?.publishedAt?.slice(0, 16) ?? ""} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>SEO Title</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} /></div>
          <div><Label>SEO Description</Label><Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} /></div>
          <div className="border rounded-md p-3 bg-muted/50">
            <p className="text-sm text-primary">{seoTitle || title || "Collection title"}</p>
            <p className="text-xs text-green-700">openshop.dev › collections › {slug || "slug"}</p>
            <p className="text-xs text-muted-foreground">{seoDesc || "Description…"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4 mr-1" /> Add products
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {linkedProducts.length > 0 ? (
            <div className="space-y-2">
              {linkedProducts.map((p) => (
                <div key={p!.id} className="flex items-center gap-3 p-2 border rounded-md">
                  <GripVertical className="size-4 text-muted-foreground cursor-grab" />
                  <ImagePlaceholder className="size-8 rounded" />
                  <div className="flex-1">
                    <Link href={`/products/${p!.id}`} className="text-sm font-medium hover:underline">{p!.title}</Link>
                  </div>
                  <StatusBadge status={p!.status} />
                  <Button variant="ghost" size="icon-sm" className="text-destructive"><X className="size-3" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No products in this collection.</p>
          )}
        </CardContent>
      </Card>

      {!isNew && <MetafieldCard resourceType="collection" />}

      <ProductPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} description="This collection will be permanently deleted." onConfirm={() => setDeleteOpen(false)} />
    </div>
  );
}

function ProductPickerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = mockProducts.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Products</DialogTitle></DialogHeader>
        <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filtered.map((p) => (
            <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer">
              <input
                type="checkbox"
                className="size-4"
                checked={selected.has(p.id)}
                onChange={() => {
                  const s = new Set(selected);
                  s.has(p.id) ? s.delete(p.id) : s.add(p.id);
                  setSelected(s);
                }}
              />
              <ImagePlaceholder className="size-6 rounded" />
              <span className="text-sm flex-1">{p.title}</span>
              <StatusBadge status={p.status} />
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Add selected ({selected.size})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
