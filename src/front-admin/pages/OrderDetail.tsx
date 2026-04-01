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
import { ArrowLeft, Plus, Pencil, Trash2, Truck, Package as PackageIcon } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { mockOrders, fmt, fmtDateTime } from "../mock/data";

export function OrderDetail() {
  const params = useParams<{ id: string }>();
  const order = mockOrders.find((o) => o.id === Number(params.id));

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [removeItem, setRemoveItem] = useState<number | null>(null);

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/orders"><Button variant="link" className="mt-4">← Back to orders</Button></Link>
      </div>
    );
  }

  const addr = (() => { try { return JSON.parse(order.shippingAddressJson); } catch { return null; } })();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/orders"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <StatusBadge status={order.orderStatus} />
        <StatusBadge status={order.paymentStatus} />
        <StatusBadge status={order.fulfillmentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setAddItemOpen(true)}>
                  <Plus className="size-4 mr-1" /> Add item
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ImagePlaceholder className="size-8 rounded" />
                          <div>
                            <p className="font-medium">{item.productTitle}</p>
                            {item.variantTitle && (
                              <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{fmt(item.unitPriceAmount)}</TableCell>
                      <TableCell className="text-right">{item.discountAmount > 0 ? `−${fmt(item.discountAmount)}` : "—"}</TableCell>
                      <TableCell className="text-right">{fmt(item.taxAmount)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {fmt(item.quantity * item.unitPriceAmount - item.discountAmount + item.taxAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm"><Pencil className="size-3" /></Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setRemoveItem(item.id)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setPaymentOpen(true)}>
                  <Plus className="size-4 mr-1" /> Record payment
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.provider}</TableCell>
                      <TableCell className="text-right">{fmt(p.amount)}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.processedAt ? fmtDateTime(p.processedAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Shipment */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment</CardTitle>
            </CardHeader>
            <CardContent>
              {order.shipment ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Carrier:</span> {order.shipment.carrier}</div>
                    <div><span className="text-muted-foreground">Service:</span> {order.shipment.service}</div>
                    <div><span className="text-muted-foreground">Tracking:</span> {order.shipment.trackingNumber || "—"}</div>
                    <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={order.shipment.status} /></div>
                    <div><span className="text-muted-foreground">Shipped:</span> {order.shipment.shippedAt ? fmtDateTime(order.shipment.shippedAt) : "—"}</div>
                    <div><span className="text-muted-foreground">Delivered:</span> {order.shipment.deliveredAt ? fmtDateTime(order.shipment.deliveredAt) : "—"}</div>
                  </div>
                  <div className="flex gap-2">
                    {order.shipment.status === "pending" && (
                      <Button size="sm" onClick={() => setShipmentOpen(true)}>
                        <Truck className="size-4 mr-1" /> Mark as shipped
                      </Button>
                    )}
                    {order.shipment.status === "shipped" && (
                      <Button size="sm">
                        <PackageIcon className="size-4 mr-1" /> Mark as delivered
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">No shipment yet</p>
                  <Button onClick={() => setShipmentOpen(true)}>Create shipment</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.events.map((e) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="mt-1 size-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {e.eventType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.actor} · {fmtDateTime(e.createdAt)}
                      </p>
                      {e.detailJson !== "{}" && (
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{e.detailJson}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={fmt(order.subtotalAmount)} />
                {order.discountAmount > 0 && <Row label="Item Discounts" value={`−${fmt(order.discountAmount)}`} className="text-destructive" />}
                {order.orderDiscountAmount > 0 && <Row label="Order Discount" value={`−${fmt(order.orderDiscountAmount)}`} className="text-destructive" />}
                <Row label="Shipping" value={fmt(order.shippingAmount)} />
                {order.shippingDiscountAmount > 0 && <Row label="Shipping Discount" value={`−${fmt(order.shippingDiscountAmount)}`} className="text-destructive" />}
                <Row label="Tax" value={fmt(order.taxAmount)} />
                <div className="border-t pt-2 mt-2">
                  <Row label="Total" value={fmt(order.totalAmount)} className="font-bold text-base" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Discount Codes</CardTitle>
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setDiscountOpen(true)}>
                  <Plus className="size-3" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {order.discountCodes.length > 0 ? (
                <div className="space-y-2">
                  {order.discountCodes.map((dc) => (
                    <div key={dc.discountCodeId} className="flex items-center justify-between text-sm">
                      <div>
                        <Badge variant="secondary">{dc.code}</Badge>
                        <span className="text-muted-foreground ml-2">{dc.promotionName}</span>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="text-destructive">
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No discount codes applied.</p>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.customerId && (
                <Link href={`/customers/${order.customerId}`} className="text-primary hover:underline">
                  {order.email}
                </Link>
              )}
              {!order.customerId && <p>{order.email}</p>}
              {order.phone && <p className="text-muted-foreground">{order.phone}</p>}
              {addr && (
                <div>
                  <p className="font-medium mt-3 mb-1">Shipping Address</p>
                  <p className="text-muted-foreground">
                    {addr.firstName} {addr.lastName}<br />
                    {addr.address1}<br />
                    {addr.city}, {addr.province} {addr.postalCode}<br />
                    {addr.countryCode}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AddItemDialog open={addItemOpen} onOpenChange={setAddItemOpen} />
      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
      <ShipmentDialog open={shipmentOpen} onOpenChange={setShipmentOpen} />
      <DiscountDialog open={discountOpen} onOpenChange={setDiscountOpen} />
      <ConfirmDialog
        open={removeItem !== null}
        onOpenChange={() => setRemoveItem(null)}
        description="This item will be removed from the order."
        onConfirm={() => setRemoveItem(null)}
      />
    </div>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between ${className}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function AddItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Item</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Product / SKU</Label><Input placeholder="Search product…" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Quantity</Label><Input type="number" min={1} defaultValue={1} /></div>
            <div><Label>Unit Price</Label><Input type="number" placeholder="Auto" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Provider</Label><Input placeholder="stripe" /></div>
          <div><Label>Amount</Label><Input type="number" /></div>
          <div>
            <Label>Status</Label>
            <Select defaultValue="captured">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="authorized">Authorized</SelectItem>
                <SelectItem value="captured">Captured</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Provider Payment ID</Label><Input placeholder="Optional" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShipmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Shipment Details</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Carrier</Label><Input placeholder="USPS" /></div>
          <div><Label>Service</Label><Input placeholder="Priority Mail" /></div>
          <div><Label>Tracking Number</Label><Input /></div>
          <div><Label>Tracking URL</Label><Input placeholder="https://…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Confirm Shipment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Apply Discount Code</DialogTitle></DialogHeader>
        <div><Label>Code</Label><Input placeholder="Enter discount code" /></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
