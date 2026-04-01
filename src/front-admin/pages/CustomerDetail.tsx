import { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { MetafieldCard } from "../components/MetafieldCard";
import { mockCustomers, mockOrders, fmt, fmtDate } from "../mock/data";

export function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const customer = isNew ? null : mockCustomers.find((c) => c.id === Number(params.id));

  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [marketing, setMarketing] = useState(customer?.acceptsMarketing ?? false);

  const [addressOpen, setAddressOpen] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState(false);
  const [deleteAddr, setDeleteAddr] = useState<number | null>(null);

  const customerOrders = customer ? mockOrders.filter((o) => o.customerId === customer.id) : [];

  if (!isNew && !customer) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Customer not found.</p>
        <Link href="/customers"><Button variant="link" className="mt-4">← Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/customers"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <h1 className="text-2xl font-bold">{isNew ? "New Customer" : `${firstName} ${lastName}`}</h1>
        <div className="ml-auto flex gap-2">
          {!isNew && <Button variant="destructive" size="sm" onClick={() => setDeleteCustomer(true)}>Delete customer</Button>}
          <Button>Save</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Phone</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="size-4" />
            Accepts Marketing
          </label>
        </CardContent>
      </Card>

      {/* Addresses */}
      {!isNew && (
        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setAddressOpen(true)}>
                <Plus className="size-4 mr-1" /> Add address
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {(customer?.addresses ?? []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer!.addresses.map((addr) => (
                  <div key={addr.id} className="border rounded-md p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      {addr.isDefaultShipping && <Badge variant="success">Default shipping</Badge>}
                      {addr.isDefaultBilling && <Badge variant="secondary">Default billing</Badge>}
                      <div className="ml-auto flex gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setAddressOpen(true)}><Pencil className="size-3" /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteAddr(addr.id)}><Trash2 className="size-3" /></Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{addr.firstName} {addr.lastName}</p>
                    {addr.company && <p className="text-sm text-muted-foreground">{addr.company}</p>}
                    <p className="text-sm text-muted-foreground">
                      {addr.address1}
                      {addr.address2 && `, ${addr.address2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.city}, {addr.province} {addr.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{addr.countryCode}</p>
                    {addr.phone && <p className="text-sm text-muted-foreground">{addr.phone}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No addresses.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Orders */}
      {!isNew && customerOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardAction>
              <Link href="/orders"><Button variant="link" size="sm">View all orders →</Button></Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/orders/${o.id}`} className="text-primary hover:underline">{o.orderNumber}</Link>
                    </TableCell>
                    <TableCell><StatusBadge status={o.orderStatus} /></TableCell>
                    <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
                    <TableCell className="text-right">{fmt(o.totalAmount)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(o.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isNew && <MetafieldCard resourceType="customer" />}

      <AddressDialog open={addressOpen} onOpenChange={setAddressOpen} />
      <ConfirmDialog open={deleteCustomer} onOpenChange={setDeleteCustomer} description="This customer and all their addresses will be permanently deleted." onConfirm={() => setDeleteCustomer(false)} />
      <ConfirmDialog open={deleteAddr !== null} onOpenChange={() => setDeleteAddr(null)} description="This address will be permanently deleted." onConfirm={() => setDeleteAddr(null)} />
    </div>
  );
}

function AddressDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Address</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input /></div>
            <div><Label>Last Name</Label><Input /></div>
          </div>
          <div><Label>Company</Label><Input /></div>
          <div><Label>Phone</Label><Input type="tel" /></div>
          <div><Label>Address 1</Label><Input /></div>
          <div><Label>Address 2</Label><Input /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>City</Label><Input /></div>
            <div><Label>Province</Label><Input /></div>
            <div><Label>Postal Code</Label><Input /></div>
          </div>
          <div><Label>Country Code</Label><Input placeholder="US" /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" /> Default shipping
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" /> Default billing
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
