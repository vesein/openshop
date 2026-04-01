import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const statusMap: Record<string, { label: string; variant: Variant }> = {
  // order status
  open: { label: "Open", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  // payment status
  pending: { label: "Pending", variant: "warning" },
  authorized: { label: "Authorized", variant: "secondary" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  partially_refunded: { label: "Partially Refunded", variant: "warning" },
  refunded: { label: "Refunded", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  // fulfillment status
  unfulfilled: { label: "Unfulfilled", variant: "warning" },
  fulfilled: { label: "Fulfilled", variant: "success" },
  returned: { label: "Returned", variant: "destructive" },
  // product / collection / page status
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "success" },
  archived: { label: "Archived", variant: "outline" },
  // shipment
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  // payment record
  captured: { label: "Captured", variant: "success" },
  // promotion type
  percentage: { label: "Percentage", variant: "default" },
  fixed_amount: { label: "Fixed Amount", variant: "secondary" },
  free_shipping: { label: "Free Shipping", variant: "success" },
  bogo: { label: "BOGO", variant: "warning" },
};

export function StatusBadge({ status }: { status: string }) {
  const info = statusMap[status] ?? { label: status, variant: "outline" as Variant };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
