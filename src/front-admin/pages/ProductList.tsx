import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "../components/StatusBadge";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { mockProducts, fmtDate } from "../mock/data";
import { Plus } from "lucide-react";

const PAGE_SIZE = 10;

export function ProductList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockProducts.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (status !== "all" && p.status !== status) return false;
    return true;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/products/new">
          <Button><Plus className="size-4 mr-1" /> New product</Button>
        </Link>
      </div>

      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-64"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Variants</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((p) => (
            <TableRow key={p.id}>
              <TableCell><ImagePlaceholder className="size-8 rounded" /></TableCell>
              <TableCell>
                <Link href={`/products/${p.id}`} className="text-primary hover:underline font-medium">
                  {p.title}
                </Link>
              </TableCell>
              <TableCell><StatusBadge status={p.status} /></TableCell>
              <TableCell className="text-muted-foreground">{p.productType}</TableCell>
              <TableCell className="text-muted-foreground">{p.vendor}</TableCell>
              <TableCell className="text-right">{p.variants.length}</TableCell>
              <TableCell className="text-muted-foreground">{fmtDate(p.createdAt)}</TableCell>
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No products found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
