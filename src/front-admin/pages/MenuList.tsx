import { useState } from "react";
import { Link } from "wouter";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Search } from "lucide-react";
import { mockMenus, fmtDate } from "../mock/data";

export function MenuList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = mockMenus.filter(
    (m) => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.handle.toLowerCase().includes(search.toLowerCase()),
  );

  const total = filtered.length;
  const rows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menus</h1>
        <Link href="/menus/new"><Button><Plus className="size-4 mr-1" /> New menu</Button></Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search menus…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Link href={`/menus/${m.id}`} className="text-primary hover:underline font-medium">{m.name}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{m.handle}</TableCell>
                <TableCell className="text-right">{m.items.length}</TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(m.updatedAt)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">No menus found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {total > perPage && <Pagination total={total} page={page} pageSize={perPage} onPageChange={setPage} />}
    </div>
  );
}
