import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { mockCustomers, fmtDate } from "../mock/data";
import { Plus } from "lucide-react";

const PAGE_SIZE = 10;

export function CustomerList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = mockCustomers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.email.toLowerCase().includes(q) || c.firstName.toLowerCase().includes(q) || c.lastName.toLowerCase().includes(q);
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link href="/customers/new">
          <Button><Plus className="size-4 mr-1" /> New customer</Button>
        </Link>
      </div>

      <Input placeholder="Search email / name…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-64" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead>Marketing</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`/customers/${c.id}`} className="text-primary hover:underline font-medium">
                  {c.firstName} {c.lastName}
                </Link>
              </TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
              <TableCell className="text-right">{c.orderCount}</TableCell>
              <TableCell>
                <Badge variant={c.acceptsMarketing ? "success" : "outline"}>
                  {c.acceptsMarketing ? "Subscribed" : "Not subscribed"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{fmtDate(c.createdAt)}</TableCell>
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No customers found.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
