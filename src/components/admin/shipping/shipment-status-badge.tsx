import { Badge } from "@/components/ui/badge";
import type { ShipmentStatus } from "@/lib/types";

const STATUS_STYLES: Record<string, "warning" | "success" | "soft" | "destructive" | "outline"> = {
  pending: "warning",
  label_generated: "soft",
  pickup_scheduled: "soft",
  picked_up: "warning",
  in_transit: "soft",
  out_for_delivery: "warning",
  delivered: "success",
  delivery_failed: "destructive",
  returned: "destructive",
  lost: "destructive",
  damaged: "destructive",
  cancelled: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  label_generated: "Label Generated",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  delivery_failed: "Delivery Failed",
  returned: "Returned",
  lost: "Lost",
  damaged: "Damaged",
  cancelled: "Cancelled",
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge variant={STATUS_STYLES[status]}>{STATUS_LABELS[status] ?? status}</Badge>;
}