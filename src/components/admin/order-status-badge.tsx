import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

const STATUS_STYLES: Record<OrderStatus, "warning" | "success" | "soft" | "destructive" | "outline"> = {
  pending: "warning",
  paid: "soft",
  processing: "soft",
  packed: "soft",
  dispatched: "success",
  out_for_delivery: "success",
  delivered: "success",
  cancelled: "destructive",
  refunded: "destructive",
  returned: "destructive",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  packed: "Packed",
  dispatched: "Dispatched",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  returned: "Returned",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>;
}
