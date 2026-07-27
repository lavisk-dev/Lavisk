import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types";

const STATUS_STYLES: Record<PaymentStatus, "warning" | "success" | "soft" | "destructive" | "outline"> = {
  pending: "warning",
  authorized: "soft",
  captured: "success",
  failed: "destructive",
  cancelled: "destructive",
  refunded: "destructive",
  partially_refunded: "warning",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  authorized: "Authorized",
  captured: "Captured",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>;
}