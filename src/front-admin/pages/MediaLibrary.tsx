import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Upload, Search, X, Trash2, Image as ImageIcon, FileText, Film, Music } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { mockMedia, fmtDate } from "../mock/data";

function KindIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "image": return <ImageIcon className="size-4" />;
    case "video": return <Film className="size-4" />;
    case "audio": return <Music className="size-4" />;
    default: return <FileText className="size-4" />;
  }
}

export function MediaLibrary() {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const perPage = 24;

  const filtered = mockMedia.filter((m) => {
    if (search && !m.storageKey.toLowerCase().includes(search.toLowerCase()) && !m.alt?.toLowerCase().includes(search.toLowerCase())) return false;
    if (kindFilter !== "all" && m.kind !== kindFilter) return false;
    return true;
  });

  const total = filtered.length;
  const rows = filtered.slice((page - 1) * perPage, page * perPage);
  const selectedItem = selected != null ? mockMedia.find((m) => m.id === selected) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <Button><Upload className="size-4 mr-1" /> Upload</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search media…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={kindFilter} onValueChange={(v) => { setKindFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Kind" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
        {(search || kindFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setKindFilter("all"); setPage(1); }}>
            <X className="size-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {rows.map((m) => (
            <button
              key={m.id}
              className="border rounded-lg overflow-hidden text-left hover:ring-2 ring-primary transition-all group"
              onClick={() => setSelected(m.id)}
            >
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {m.kind === "image" ? (
                  <ImagePlaceholder className="w-full h-full" />
                ) : (
                  <KindIcon kind={m.kind} />
                )}
                <Badge variant="secondary" className="absolute top-1 right-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                  {m.kind}
                </Badge>
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{m.storageKey.split("/").pop()}</p>
                <p className="text-[10px] text-muted-foreground">{(m.sizeBytes / 1024).toFixed(0)} KB</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">No media found.</div>
      )}

      {total > perPage && <Pagination total={total} page={page} pageSize={perPage} onPageChange={setPage} />}

      {/* Detail Dialog */}
      <Dialog open={selectedItem != null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Media Detail</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                {selectedItem.kind === "image" ? (
                  <ImagePlaceholder className="w-full h-full rounded-md" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <KindIcon kind={selectedItem.kind} />
                    <span className="text-sm">{selectedItem.mimeType}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div><Label>Filename</Label><p className="text-sm">{selectedItem.storageKey.split("/").pop()}</p></div>
                <div><Label>Alt Text</Label><Input defaultValue={selectedItem.alt ?? ""} /></div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><Label>Kind</Label><p>{selectedItem.kind}</p></div>
                  <div><Label>MIME Type</Label><p>{selectedItem.mimeType}</p></div>
                  <div><Label>File Size</Label><p>{(selectedItem.sizeBytes / 1024).toFixed(1)} KB</p></div>
                  {selectedItem.width && <div><Label>Dimensions</Label><p>{selectedItem.width}×{selectedItem.height}</p></div>}
                  <div><Label>Uploaded</Label><p>{fmtDate(selectedItem.createdAt)}</p></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" size="sm" onClick={() => { setSelected(null); setDeleteId(selectedItem.id); }}>
                  <Trash2 className="size-4 mr-1" /> Delete
                </Button>
                <Button onClick={() => setSelected(null)}>Save</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} description="This media file will be permanently deleted." onConfirm={() => setDeleteId(null)} />
    </div>
  );
}
