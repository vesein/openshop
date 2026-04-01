import { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Plus, Pencil, Trash2, Star, Upload, X } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { MetafieldCard } from "../components/MetafieldCard";
import { mockProducts, mockSettings, fmt } from "../mock/data";

export function ProductDetail() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const product = isNew ? null : mockProducts.find((p) => p.id === Number(params.id));

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [productType, setProductType] = useState(product?.productType ?? "");
  const [vendor, setVendor] = useState(product?.vendor ?? "");
  const [description, setDescription] = useState(product?.descriptionHtml ?? "");
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(product?.seoDescription ?? "");

  const [variantDialog, setVariantDialog] = useState(false);
  const [optionDialog, setOptionDialog] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [deleteVariant, setDeleteVariant] = useState<number | null>(null);
  const [deleteProduct, setDeleteProduct] = useState(false);

  if (!isNew && !product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Product not found.</p>
        <Link href="/products"><Button variant="link" className="mt-4">← Back to products</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/products"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <h1 className="text-2xl font-bold">{isNew ? "New Product" : title}</h1>
        {!isNew && <StatusBadge status={status} />}
        <div className="ml-auto flex gap-2">
          {!isNew && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteProduct(true)}>Delete</Button>
          )}
          <Button>Save</Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Product Type</Label><Input value={productType} onChange={(e) => setProductType(e.target.value)} /></div>
            <div><Label>Vendor</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} /></div>
          </div>
          <div>
            <Label>Description (HTML)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div>
            <Label>Published At</Label>
            <Input type="datetime-local" defaultValue={product?.publishedAt?.slice(0, 16) ?? ""} />
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between">
              <Label>SEO Title</Label>
              <span className="text-xs text-muted-foreground">{seoTitle.length}/60</span>
            </div>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </div>
          <div>
            <div className="flex justify-between">
              <Label>SEO Description</Label>
              <span className="text-xs text-muted-foreground">{seoDesc.length}/160</span>
            </div>
            <Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} />
          </div>
          <div className="border rounded-md p-3 bg-muted/50">
            <p className="text-sm text-primary">{seoTitle || title || "Page title"}</p>
            <p className="text-xs text-green-700">openshop.dev › products › {slug || "product-slug"}</p>
            <p className="text-xs text-muted-foreground">{seoDesc || "Page description will appear here."}</p>
          </div>
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader><CardTitle>Media</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {(product?.media ?? []).map((pm, i) => (
              <div
                key={pm.id}
                className="relative border rounded-md overflow-hidden bg-muted/50 aspect-square flex items-center justify-center group"
              >
                <ImagePlaceholder className="size-16" />
                <button className="absolute top-1 right-1 size-5 rounded bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <X className="size-3" />
                </button>
                <button className="absolute top-1 left-1 size-5 rounded bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Star className={`size-3 ${i === 0 ? "fill-yellow-400 text-yellow-400" : ""}`} />
                </button>
              </div>
            ))}
            <button className="border-2 border-dashed rounded-md aspect-square flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary">
              <Upload className="size-6 mb-1" />
              <span className="text-xs">Upload</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      {!isNew && (
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setOptionDialog(true)}>
                <Plus className="size-4 mr-1" /> Add option
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {(product?.options ?? []).length > 0 ? (
              <div className="space-y-3">
                {product!.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <span className="font-medium text-sm w-24">{opt.name}</span>
                    <div className="flex gap-1 flex-wrap flex-1">
                      {opt.values.map((v) => (
                        <Badge key={v.id} variant="secondary">{v.value}</Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon-sm"><Pencil className="size-3" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="size-3" /></Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No options defined.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Variants */}
      {!isNew && (
        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setVariantDialog(true)}>
                <Plus className="size-4 mr-1" /> Add variant
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Compare</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Inventory</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(product?.variants ?? []).map((v) => {
                  const avail = v.inventory.onHand - v.inventory.reserved;
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {v.title}
                          {v.isDefault && <Badge variant="outline" className="text-[10px]">Default</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{v.sku}</TableCell>
                      <TableCell className="text-right">{fmt(v.priceAmount)}</TableCell>
                      <TableCell className="text-right">{v.compareAtAmount ? fmt(v.compareAtAmount) : "—"}</TableCell>
                      <TableCell className="text-right">{v.costAmount ? fmt(v.costAmount) : "—"}</TableCell>
                      <TableCell className={`text-right ${avail <= 5 ? "text-destructive font-medium" : ""}`}>
                        {avail}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setVariantDialog(true)}><Pencil className="size-3" /></Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteVariant(v.id)}><Trash2 className="size-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Inventory quick view */}
      {!isNew && product && product.variants.length === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setAdjustDialog(true)}>Adjust</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tracked</p>
                <p>{product.variants[0]!.inventory.tracked ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Backorder</p>
                <p>{product.variants[0]!.inventory.allowBackorder ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">On Hand</p>
                <p>{product.variants[0]!.inventory.onHand}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reserved</p>
                <p>{product.variants[0]!.inventory.reserved}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Available</p>
                <p className="font-medium">{product.variants[0]!.inventory.onHand - product.variants[0]!.inventory.reserved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metafields */}
      {!isNew && <MetafieldCard resourceType="product" />}

      {/* Dialogs */}
      <VariantEditDialog open={variantDialog} onOpenChange={setVariantDialog} weightUnit={mockSettings.weightUnit} />
      <OptionEditDialog open={optionDialog} onOpenChange={setOptionDialog} />
      <AdjustStockDialog open={adjustDialog} onOpenChange={setAdjustDialog} />
      <ConfirmDialog
        open={deleteVariant !== null}
        onOpenChange={() => setDeleteVariant(null)}
        description="This variant and its inventory will be permanently deleted."
        onConfirm={() => setDeleteVariant(null)}
      />
      <ConfirmDialog
        open={deleteProduct}
        onOpenChange={setDeleteProduct}
        description="This product will be soft-deleted and hidden from the storefront."
        onConfirm={() => setDeleteProduct(false)}
      />
    </div>
  );
}

function VariantEditDialog({ open, onOpenChange, weightUnit }: { open: boolean; onOpenChange: (v: boolean) => void; weightUnit: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Variant</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div><Label>Title</Label><Input defaultValue="Default Title" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>SKU</Label><Input /></div>
            <div><Label>Barcode</Label><Input /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Price</Label><Input type="number" /></div>
            <div><Label>Compare At</Label><Input type="number" /></div>
            <div><Label>Cost</Label><Input type="number" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Weight ({weightUnit})</Label>
              <Input type="number" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="size-4" /> Requires Shipping
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="size-4" /> Taxable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" /> Is Default
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

function OptionEditDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [values, setValues] = useState<string[]>([]);
  const [input, setInput] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Option</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input placeholder='e.g. "Color" or "Size"' /></div>
          <div>
            <Label>Values</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {values.map((v, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {v}
                  <button onClick={() => setValues(values.filter((_, j) => j !== i))}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Type and press Enter"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  e.preventDefault();
                  setValues([...values, input.trim()]);
                  setInput("");
                }
              }}
            />
          </div>
          <div><Label>Sort Order</Label><Input type="number" defaultValue={0} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustStockDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Adjust Stock</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Movement Type</Label>
            <Select defaultValue="in">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="adjust">Adjust</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Quantity</Label><Input type="number" /></div>
          <div><Label>Note</Label><Textarea placeholder="Reason for adjustment…" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Record movement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
