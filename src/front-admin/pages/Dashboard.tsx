import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Link } from "wouter";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { mockOrders, mockCustomers, mockInventory, fmt, relTime, fmtDate } from "../mock/data";
import { StatusBadge } from "../components/StatusBadge";

const recentOrders = mockOrders.slice(0, 5);
const lowStock = mockInventory.filter((i) => i.tracked && i.onHand - i.reserved <= 10);
const todayRevenue = mockOrders
  .filter((o) => o.orderStatus !== "cancelled")
  .reduce((s, o) => s + o.totalAmount, 0);

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={String(mockOrders.length)} change="+12%" up />
        <StatCard title="Revenue" value={fmt(todayRevenue)} change="+8%" up />
        <StatCard
          title="New Customers"
          value={String(mockCustomers.filter((c) => {
            const d = new Date(c.createdAt);
            return Date.now() - d.getTime() < 30 * 86400000;
          }).length)}
          change="+3"
          up
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStock.length)}
          change={lowStock.length > 0 ? "Needs attention" : "All good"}
          up={lowStock.length === 0}
          danger={lowStock.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardAction>
              <Link href="/orders">
                <Button variant="link" size="sm">
                  View all <ArrowRight className="size-3 ml-1" />
                </Button>
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/orders/${o.id}`} className="text-primary hover:underline">
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{o.email}</TableCell>
                    <TableCell><StatusBadge status={o.orderStatus} /></TableCell>
                    <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
                    <TableCell className="text-right">{fmt(o.totalAmount)}</TableCell>
                    <TableCell className="text-muted-foreground">{relTime(o.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardAction>
              <Link href="/inventory">
                <Button variant="link" size="sm">
                  View all <ArrowRight className="size-3 ml-1" />
                </Button>
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">All items are well stocked.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.slice(0, 8).map((row) => {
                    const avail = row.onHand - row.reserved;
                    return (
                      <TableRow key={row.variantId}>
                        <TableCell>
                          <Link
                            href={`/products/${row.productId}`}
                            className="text-primary hover:underline"
                          >
                            {row.productTitle}
                          </Link>
                          {row.variantTitle !== "Default Title" && (
                            <span className="text-muted-foreground text-xs ml-1">
                              / {row.variantTitle}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.sku}</TableCell>
                        <TableCell className="text-right">{row.onHand}</TableCell>
                        <TableCell className="text-right">{row.reserved}</TableCell>
                        <TableCell className={`text-right font-medium ${avail <= 0 ? "text-destructive" : avail <= 5 ? "text-yellow-600" : ""}`}>
                          {avail}
                          {avail <= 5 && <AlertTriangle className="size-3 inline ml-1" />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, up, danger }: {
  title: string; value: string; change: string; up: boolean; danger?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <Badge variant={danger ? "destructive" : up ? "success" : "warning"} className="text-[10px]">
            {change}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
