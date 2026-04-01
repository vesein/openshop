import { useState } from "react";
import { Link } from "wouter";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Search, X } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { mockPromotions, fmtDate } from "../mock/data";

export function PromotionList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = mockPromotions.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    return true;
  });

  const total = filtered.length;
  const rows = filtered.slice((page - 1) * perPage, page * perPage);
  const hasFilter = search || statusFilter !== "all" || typeFilter !== "all";

  function fmtDiscount(p: (typeof mockPromotions)[0]) {
    if (p.type === "percentage") return `${p.discountValue}%`;
    return `$${(p.discountValue / 100).toFixed(2)}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <Link href="/promotions/new"><Button><Plus className="size-4 mr-1" /> New promotion</Button></Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search promotions…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="order_discount">Order Discount</SelectItem>
            <SelectItem value="product_discount">Product Discount</SelectItem>
            <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
            <SelectItem value="free_shipping">Free Shipping</SelectItem>
          </SelectContent>
        </Select>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setPage(1); }}>
            <X className="size-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Usage</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/promotions/${p.id}`} className="text-primary hover:underline font-medium">{p.name}</Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">{p.type.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-right font-mono">{fmtDiscount(p)}</TableCell>
                <TableCell className="text-right font-mono">
                  {p.usageCount}{p.usageLimit ? `/${p.usageLimit}` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{p.startsAt ? fmtDate(p.startsAt) : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{p.endsAt ? fmtDate(p.endsAt) : "—"}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No promotions found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {total > perPage && <Pagination total={total} page={page} pageSize={perPage} onPageChange={setPage} />}
    </div>
  );
}
