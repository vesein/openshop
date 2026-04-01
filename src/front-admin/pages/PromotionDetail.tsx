import { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2, Copy } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { MetafieldCard } from "../components/MetafieldCard";
import { mockPromotions, fmtDate, fmtDateTime } from "../mock/data";
import { toast } from "sonner";

export function PromotionDetail() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const promo = isNew ? null : mockPromotions.find((p) => p.id === Number(params.id));

  const [name, setName] = useState(promo?.name ?? "");
  const [type, setType] = useState(promo?.type ?? "order_discount");
  const [status, setStatus] = useState(promo?.status ?? "active");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">(promo?.type === "fixed_amount" ? "fixed_amount" : "percentage");
  const [discountValue, setDiscountValue] = useState(promo?.discountValue?.toString() ?? "");
  const [minPurchase, setMinPurchase] = useState(promo?.minPurchaseAmount?.toString() ?? "");
  const [usageLimit, setUsageLimit] = useState(promo?.usageLimit?.toString() ?? "");
  const [oncePerCustomer, setOncePerCustomer] = useState(promo?.oncePerCustomer ?? false);
  const [startsAt, setStartsAt] = useState(promo?.startsAt?.slice(0, 16) ?? "");
  const [endsAt, setEndsAt] = useState(promo?.endsAt?.slice(0, 16) ?? "");
  const [rules, setRules] = useState(promo?.rulesJson ?? "{}");

  const [codeOpen, setCodeOpen] = useState(false);
  const [deletePromo, setDeletePromo] = useState(false);
  const [deleteCode, setDeleteCode] = useState<number | null>(null);

  const isBXGY = type === "buy_x_get_y";

  if (!isNew && !promo) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Promotion not found.</p>
        <Link href="/promotions"><Button variant="link" className="mt-4">← Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/promotions"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <h1 className="text-2xl font-bold">{isNew ? "New Promotion" : name}</h1>
        {!isNew && <StatusBadge status={status} />}
        <div className="ml-auto flex gap-2">
          {!isNew && <Button variant="destructive" size="sm" onClick={() => setDeletePromo(true)}>Delete</Button>}
          <Button onClick={() => toast.success("Saved")}>Save</Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="order_discount">Order Discount</SelectItem>
                  <SelectItem value="product_discount">Product Discount</SelectItem>
                  <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as typeof discountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Discount Value {discountType === "percentage" ? "(%)" : "(cents)"}</Label>
              <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Min Purchase Amount (cents)</Label><Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} /></div>
            <div><Label>Usage Limit</Label><Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={oncePerCustomer} onChange={(e) => setOncePerCustomer(e.target.checked)} className="size-4" />
            Once per customer
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Starts At</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div>
            <div><Label>Ends At</Label><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* BOGO Settings */}
      {isBXGY && (
        <Card>
          <CardHeader><CardTitle>Buy X Get Y Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Buy Quantity (X)</Label><Input type="number" defaultValue={promo?.buyQuantity ?? 2} /></div>
              <div><Label>Get Quantity (Y)</Label><Input type="number" defaultValue={promo?.getQuantity ?? 1} /></div>
            </div>
            <div><Label>Buy Product IDs (comma separated)</Label><Input /></div>
            <div><Label>Get Product IDs (comma separated)</Label><Input /></div>
          </CardContent>
        </Card>
      )}

      {/* Rules JSON */}
      <Card>
        <CardHeader><CardTitle>Rules (JSON)</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={6} className="font-mono text-sm" value={rules} onChange={(e) => setRules(e.target.value)} />
        </CardContent>
      </Card>

      {/* Discount Codes */}
      {!isNew && (
        <Card>
          <CardHeader>
            <CardTitle>Discount Codes</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setCodeOpen(true)}>
                <Plus className="size-4 mr-1" /> Add code
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {(promo?.discountCodes ?? []).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Use Count</TableHead>
                    <TableHead className="text-right">Max Uses</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promo!.discountCodes.map((dc) => (
                    <TableRow key={dc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{dc.code}</code>
                          <Button variant="ghost" size="icon-sm" onClick={() => { navigator.clipboard.writeText(dc.code); toast.info("Copied!"); }}>
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{dc.usageCount}</TableCell>
                      <TableCell className="text-right font-mono">{dc.usageLimit ?? "∞"}</TableCell>
                      <TableCell><Badge variant="success">Active</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setCodeOpen(true)}><Pencil className="size-3" /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteCode(dc.id)}><Trash2 className="size-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-6">No discount codes yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {!isNew && <MetafieldCard resourceType="promotion" />}

      {/* Dialogs */}
      <DiscountCodeDialog open={codeOpen} onOpenChange={setCodeOpen} />
      <ConfirmDialog open={deletePromo} onOpenChange={setDeletePromo} description="This promotion and all its discount codes will be permanently deleted." onConfirm={() => setDeletePromo(false)} />
      <ConfirmDialog open={deleteCode !== null} onOpenChange={() => setDeleteCode(null)} description="This discount code will be permanently deleted." onConfirm={() => setDeleteCode(null)} />
    </div>
  );
}

function DiscountCodeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Discount Code</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Code</Label><Input placeholder="e.g. SUMMER20" /></div>
          <div><Label>Max Uses</Label><Input type="number" placeholder="Unlimited" /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="size-4" /> Active
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
