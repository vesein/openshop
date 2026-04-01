import { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, ChevronRight } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { mockMenus, type MenuItem as MockMenuItem } from "../mock/data";
import { toast } from "sonner";

type TreeItem = MockMenuItem & { children?: TreeItem[] };

export function MenuDetail() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const menu = isNew ? null : mockMenus.find((m) => m.id === Number(params.id));

  const [title, setTitle] = useState(menu?.name ?? "");
  const [handle, setHandle] = useState(menu?.handle ?? "");

  const [itemOpen, setItemOpen] = useState(false);
  const [deleteMenu, setDeleteMenu] = useState(false);
  const [deleteItem, setDeleteItem] = useState<number | null>(null);

  if (!isNew && !menu) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Menu not found.</p>
        <Link href="/menus"><Button variant="link" className="mt-4">← Back</Button></Link>
      </div>
    );
  }

  const flatItems = menu?.items ?? [];
  // Build tree from flat items
  const items: TreeItem[] = [];
  const itemMap = new Map<number, TreeItem>();
  for (const item of flatItems) {
    const ti: TreeItem = { ...item, children: [] };
    itemMap.set(item.id, ti);
  }
  for (const ti of itemMap.values()) {
    if (ti.parentId && itemMap.has(ti.parentId)) {
      itemMap.get(ti.parentId)!.children!.push(ti);
    } else {
      items.push(ti);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/menus"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <h1 className="text-2xl font-bold">{isNew ? "New Menu" : title}</h1>
        <div className="ml-auto flex gap-2">
          {!isNew && <Button variant="destructive" size="sm" onClick={() => setDeleteMenu(true)}>Delete</Button>}
          <Button onClick={() => toast.success("Saved")}>Save</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Menu Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Handle</Label><Input value={handle} onChange={(e) => setHandle(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setItemOpen(true)}>
              <Plus className="size-4 mr-1" /> Add item
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-1">
              {items.map((item) => (
                <MenuItemRow key={item.id} item={item} depth={0} onEdit={() => setItemOpen(true)} onDelete={(id) => setDeleteItem(id)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">No menu items yet.</p>
          )}
        </CardContent>
      </Card>

      <MenuItemDialog open={itemOpen} onOpenChange={setItemOpen} />
      <ConfirmDialog open={deleteMenu} onOpenChange={setDeleteMenu} description="This menu and all its items will be permanently deleted." onConfirm={() => setDeleteMenu(false)} />
      <ConfirmDialog open={deleteItem !== null} onOpenChange={() => setDeleteItem(null)} description="This menu item and its children will be permanently deleted." onConfirm={() => setDeleteItem(null)} />
    </div>
  );
}

function MenuItemRow({ item, depth, onEdit, onDelete }: {
  item: TreeItem; depth: number; onEdit: () => void; onDelete: (id: number) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 group" style={{ paddingLeft: `${12 + depth * 24}px` }}>
        <GripVertical className="size-4 text-muted-foreground cursor-grab" />
        {depth > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
        <span className="font-medium text-sm flex-1">{item.title}</span>
        <Badge variant="outline" className="text-xs">{item.linkType}</Badge>
        <span className="text-xs text-muted-foreground max-w-[200px] truncate">{item.linkTarget}</span>
        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={onEdit}><Pencil className="size-3" /></Button>
        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="size-3" /></Button>
      </div>
      {item.children?.map((child) => (
        <MenuItemRow key={child.id} item={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

function MenuItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [linkType, setLinkType] = useState("url");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Menu Item</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title</Label><Input placeholder="e.g. Home" /></div>
          <div>
            <Label>Link Type</Label>
            <Select value={linkType} onValueChange={setLinkType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="page">Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{linkType === "url" ? "URL" : `${linkType} ID`}</Label>
            <Input placeholder={linkType === "url" ? "https://…" : "Enter ID"} />
          </div>
          <div>
            <Label>Parent Item (optional)</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top level)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
