import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { mockInventory } from "../mock/data";

const PAGE_SIZE = 15;

export function InventoryList() {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const filtered = mockInventory.filter((r) => {
    if (search && !r.sku.toLowerCase().includes(search.toLowerCase()) && !r.productTitle.toLowerCase().includes(search.toLowerCase())) return false;
    const avail = r.onHand - r.reserved;
    if (stockFilter === "low" && avail > 10) return false;
    if (stockFilter === "out" && avail > 0) return false;
    return true;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>

      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search SKU / product…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-64"
        />
        <Select value={stockFilter} onValueChange={(v) => { setStockFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="low">Low Stock (≤10)</SelectItem>
            <SelectItem value="out">Out of Stock (=0)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Tracked</TableHead>
            <TableHead className="text-right">On Hand</TableHead>
            <TableHead className="text-right">Reserved</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((r) => {
            const avail = r.onHand - r.reserved;
            return (
              <TableRow key={r.variantId}>
                <TableCell><ImagePlaceholder className="size-8 rounded" /></TableCell>
                <TableCell>
                  <Link href={`/products/${r.productId}`} className="text-primary hover:underline">
                    {r.productTitle}
                  </Link>
                  {r.variantTitle !== "Default Title" && (
                    <span className="text-muted-foreground text-xs ml-1">/ {r.variantTitle}</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.sku}</TableCell>
                <TableCell>
                  <Badge variant={r.tracked ? "success" : "outline"}>
                    {r.tracked ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{r.onHand}</TableCell>
                <TableCell className="text-right">{r.reserved}</TableCell>
                <TableCell className={`text-right font-medium ${avail <= 0 ? "text-destructive" : avail <= 5 ? "text-yellow-600" : ""}`}>
                  {avail}
                  {avail <= 5 && <AlertTriangle className="size-3 inline ml-1" />}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setAdjustOpen(true)}>
                    Adjust
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {paged.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No inventory items found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Movement Type</Label>
              <Select defaultValue="in">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="adjust">Adjust</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Quantity</Label><Input type="number" /></div>
            <div><Label>Note</Label><Textarea placeholder="Reason…" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={() => setAdjustOpen(false)}>Record movement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
