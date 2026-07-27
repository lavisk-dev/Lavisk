"use client";

import { ShipmentStatusBadge } from "@/components/admin/shipping/shipment-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Shipment, TrackingEvent, ShippingLabel, PickupRequest } from "@/lib/types";

interface Props {
  shipment: Shipment;
  tracking: TrackingEvent[];
  labels: ShippingLabel[];
  pickup: PickupRequest | null;
}

export function AdminShippingDetail({ shipment, tracking, labels, pickup }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Shipment Detail</h1>
          <p className="font-mono text-xs text-muted">{shipment.id}</p>
        </div>
        <ShipmentStatusBadge status={shipment.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Shipment Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Order ID</span><span className="font-mono text-xs">{shipment.orderId}</span></div>
            <div className="flex justify-between"><span className="text-muted">Tracking Number</span><span className="font-mono text-xs">{shipment.trackingNumber ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted">Courier</span><span className="capitalize">{shipment.courier}</span></div>
            <div className="flex justify-between"><span className="text-muted">Provider</span><span className="capitalize">{shipment.provider}</span></div>
            <div className="flex justify-between"><span className="text-muted">Status</span><ShipmentStatusBadge status={shipment.status} /></div>
            <div className="flex justify-between"><span className="text-muted">Pickup Status</span><span className="capitalize">{shipment.pickupStatus}</span></div>
            <div className="flex justify-between"><span className="text-muted">Created</span><span>{formatDate(shipment.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Updated</span><span>{formatDate(shipment.updatedAt)}</span></div>
            {shipment.estimatedDelivery && (
              <div className="flex justify-between"><span className="text-muted">Est. Delivery</span><span>{formatDate(shipment.estimatedDelivery)}</span></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dimensions & Labels</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Weight</span>
              <span>{shipment.weight ? `${shipment.weight} kg` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Dimensions</span>
              <span>
                {shipment.length && shipment.width && shipment.height
                  ? `${shipment.length}×${shipment.width}×${shipment.height} ${shipment.dimensionUnit ?? "cm"}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping Cost</span>
              <span>{shipment.shippingCost ? `$${shipment.shippingCost}` : "—"}</span>
            </div>
            {labels.length > 0 && (
              <div>
                <span className="text-muted block mb-1">Labels</span>
                {labels.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono">{l.format.toUpperCase()}</span>
                    {l.url && (
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            {shipment.notes && (
              <div>
                <span className="text-muted block mb-1">Notes</span>
                <p className="text-xs">{shipment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {pickup && (
        <Card>
          <CardHeader><CardTitle>Pickup Request</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Status</span><span className="capitalize">{pickup.status}</span></div>
            {pickup.scheduledAt && <div className="flex justify-between"><span className="text-muted">Scheduled</span><span>{formatDate(pickup.scheduledAt)}</span></div>}
            {pickup.pickupAddress && <div className="flex justify-between"><span className="text-muted">Address</span><span>{pickup.pickupAddress}</span></div>}
            {pickup.pickupTime && <div className="flex justify-between"><span className="text-muted">Time Slot</span><span>{pickup.pickupTime}</span></div>}
            {pickup.retryCount > 0 && <div className="flex justify-between"><span className="text-muted">Retries</span><span>{pickup.retryCount}</span></div>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Tracking History</CardTitle></CardHeader>
        <CardContent>
          {tracking.length === 0 ? (
            <p className="text-sm text-muted">No tracking events yet.</p>
          ) : (
            <div className="relative space-y-0">
              {tracking.map((event, idx) => (
                <div key={event.id} className="flex gap-4 pb-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full border-2 ${idx === tracking.length - 1 ? "border-brand bg-brand" : "border-muted"}`} />
                    {idx < tracking.length - 1 && <div className="mt-1 h-full w-px bg-border" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize">{event.status.replace(/_/g, " ")}</span>
                      <span className="text-xs text-muted">{formatDate(event.createdAt)}</span>
                    </div>
                    {event.location && <div className="text-xs text-muted">{event.location}</div>}
                    {event.description && <div className="text-xs text-muted mt-0.5">{event.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}