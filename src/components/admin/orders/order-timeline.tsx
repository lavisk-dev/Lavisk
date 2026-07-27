"use client";

import { cn } from "@/lib/utils";
import type { OrderTimelineEntry } from "@/lib/types";
import { Check, Circle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  paid: "Payment Received",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  dispatched: "Dispatched",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  returned: "Returned",
};

export function OrderTimeline({ entries }: { entries: OrderTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted">
        No timeline entries yet.
      </div>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-0">
      {sorted.map((entry, idx) => {
        const isLast = idx === sorted.length - 1;
        const isCancelled = entry.status === "cancelled" || entry.status === "refunded" || entry.status === "returned";
        return (
          <div key={entry.id} className="relative flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                  isCancelled
                    ? "border-red-400 bg-red-50 text-red-500"
                    : "border-brand bg-brand-mist text-brand"
                )}
              >
                {isLast ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
              </div>
              {!isLast && <div className="mt-1 h-full w-px bg-border" />}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {STATUS_LABELS[entry.status] ?? entry.status}
                </p>
                <span className="whitespace-nowrap text-xs text-muted">
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {entry.note && (
                <p className="mt-0.5 text-xs text-muted">{entry.note}</p>
              )}
              <p className="mt-0.5 text-[11px] text-muted/60">
                by {entry.performedBy}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}