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
import { mockCollections, fmtDate } from "../mock/data";
import { Plus } from "lucide-react";

const PAGE_SIZE = 10;

export function CollectionList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockCollections.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (status !== "all" && c.status !== status) return false;
    return true;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <Link href="/collections/new">
          <Button><Plus className="size-4 mr-1" /> New collection</Button>
        </Link>
      </div>

      <div className="flex gap-3 items-center">
        <Input placeholder="Search collections…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-64" />
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
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead>Published</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/collections/${c.id}`} className="text-primary hover:underline font-medium">{c.title}</Link>
              </TableCell>
              <TableCell><StatusBadge status={c.status} /></TableCell>
              <TableCell className="text-right">{c.productIds.length}</TableCell>
              <TableCell className="text-muted-foreground">{c.publishedAt ? fmtDate(c.publishedAt) : "—"}</TableCell>
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No collections found.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
