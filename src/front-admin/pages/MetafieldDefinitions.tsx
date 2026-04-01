import { useState } from "react";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { mockMetafieldDefs } from "../mock/data";

export function MetafieldDefinitions() {
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const perPage = 20;

  const filtered = mockMetafieldDefs.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.key.toLowerCase().includes(search.toLowerCase())) return false;
    if (resourceFilter !== "all" && d.resourceType !== resourceFilter) return false;
    return true;
  });

  const total = filtered.length;
  const rows = filtered.slice((page - 1) * perPage, page * perPage);

  const resourceTypes = [...new Set(mockMetafieldDefs.map((d) => d.resourceType))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Metafield Definitions</h1>
        <Button onClick={() => setEditOpen(true)}><Plus className="size-4 mr-1" /> New definition</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search definitions…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Resource" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resources</SelectItem>
            {resourceTypes.map((rt) => <SelectItem key={rt} value={rt}>{rt}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || resourceFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setResourceFilter("all"); setPage(1); }}>
            <X className="size-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Namespace.Key</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{d.namespace}.{d.key}</code>
                </TableCell>
                <TableCell><Badge variant="outline">{d.resourceType}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{d.valueType}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{d.description || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditOpen(true)}><Pencil className="size-3" /></Button>
                  <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteId(d.id)}><Trash2 className="size-3" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No definitions found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {total > perPage && <Pagination total={total} page={page} pageSize={perPage} onPageChange={setPage} />}

      <MetafieldDefDialog open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} description="This metafield definition will be permanently deleted. Existing values will be orphaned." onConfirm={() => setDeleteId(null)} />
    </div>
  );
}

function MetafieldDefDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [valueType, setValueType] = useState("single_line_text");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Metafield Definition</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div><Label>Name</Label><Input placeholder="e.g. Warranty Period" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Namespace</Label><Input placeholder="e.g. custom" /></div>
            <div><Label>Key</Label><Input placeholder="e.g. warranty" /></div>
          </div>
          <div>
            <Label>Resource Type</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select resource" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="variant">Variant</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="page">Page</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Value Type</Label>
            <Select value={valueType} onValueChange={setValueType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single_line_text">Single Line Text</SelectItem>
                <SelectItem value="multi_line_text">Multi Line Text</SelectItem>
                <SelectItem value="integer">Integer</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="datetime">DateTime</SelectItem>
                <SelectItem value="color">Color</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Textarea rows={2} /></div>
          <div>
            <Label>Default Value</Label>
            {valueType === "boolean" ? (
              <Select><SelectTrigger><SelectValue placeholder="No default" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : valueType === "json" || valueType === "multi_line_text" ? (
              <Textarea rows={3} className="font-mono text-sm" />
            ) : (
              <Input type={valueType === "integer" || valueType === "number" ? "number" : "text"} />
            )}
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" /> Required
            </label>
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
