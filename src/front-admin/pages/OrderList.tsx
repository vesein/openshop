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
import { mockOrders, fmt, relTime } from "../mock/data";

const PAGE_SIZE = 10;

export function OrderList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [fulfillment, setFulfillment] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockOrders.filter((o) => {
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase()) && !o.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (status !== "all" && o.orderStatus !== status) return false;
    if (payment !== "all" && o.paymentStatus !== payment) return false;
    if (fulfillment !== "all" && o.fulfillmentStatus !== fulfillment) return false;
    return true;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search order# / email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-64"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={payment} onValueChange={(v) => { setPayment(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="authorized">Authorized</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fulfillment} onValueChange={(v) => { setFulfillment(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fulfillment</SelectItem>
            <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
        {(search || status !== "all" || payment !== "all" || fulfillment !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus("all"); setPayment("all"); setFulfillment("all"); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((o) => (
            <TableRow key={o.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/orders/${o.id}`} className="text-primary hover:underline font-medium">
                  {o.orderNumber}
                </Link>
              </TableCell>
              <TableCell>{o.email}</TableCell>
              <TableCell><StatusBadge status={o.orderStatus} /></TableCell>
              <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
              <TableCell><StatusBadge status={o.fulfillmentStatus} /></TableCell>
              <TableCell className="text-right">{fmt(o.totalAmount)}</TableCell>
              <TableCell className="text-muted-foreground">{relTime(o.createdAt)}</TableCell>
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
