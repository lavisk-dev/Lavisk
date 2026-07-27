"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderTimeline } from "@/components/admin/orders/order-timeline";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderStatus, OrderDetail } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "packed",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
  "returned",
];

const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "paid", "processing", "packed"];

export function AdminOrderDetail({ order: initialOrder }: { order: Order }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder as OrderDetail);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(status: OrderStatus) {
    setIsUpdating(true);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    setIsUpdating(false);
    if (json.success) {
      setOrder(json.data);
    } else {
      alert(json.error ?? "Couldn't update this order.");
    }
  }

  async function handleCancel() {
    const reason = prompt("Reason for cancellation:");
    if (!reason || reason.trim().length < 2) return;
    setIsUpdating(true);
    const res = await fetch("/api/admin/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, reason: reason.trim() }),
    });
    const json = await res.json();
    setIsUpdating(false);
    if (json.success) {
      setOrder((prev) => ({ ...prev, ...json.data }));
      router.refresh();
    } else {
      alert(json.error ?? "Couldn't cancel this order.");
    }
  }

  async function handleRefund() {
    const reason = prompt("Reason for refund:");
    if (!reason || reason.trim().length < 2) return;
    setIsUpdating(true);
    const res = await fetch("/api/admin/orders/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, reason: reason.trim() }),
    });
    const json = await res.json();
    setIsUpdating(false);
    if (json.success) {
      setOrder((prev) => ({ ...prev, ...json.data }));
      router.refresh();
    } else {
      alert(json.error ?? "Couldn't refund this order.");
    }
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const canRefund = order.status === "cancelled";

  const timeline = "timeline" in order ? (order as OrderDetail).timeline : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{order.orderNumber}</CardTitle>
              <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt)}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-semibold text-ink">{item.name}</div>
                    <div className="text-muted">Qty {item.quantity} x {formatCurrency(item.price)}</div>
                  </div>
                  <div className="font-semibold text-ink">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {(order.tax ?? 0) > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? "Free" : formatCurrency(order.shipping)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <OrderTimeline entries={timeline} />
          </CardContent>
        </Card>

        {order.giftNote && (
          <Card>
            <CardHeader>
              <CardTitle>Gift Note</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted">{order.giftNote}</CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Select
              value={order.status}
              onValueChange={(v) => handleStatusChange(v as OrderStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1).replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Separator />

            {canCancel && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                Cancel Order
              </Button>
            )}
            {canRefund && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRefund}
                disabled={isUpdating}
              >
                Refund Order
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-sm text-muted">
            <div className="flex justify-between">
              <span>Provider</span>
              <span className="font-medium text-ink capitalize">{order.paymentProvider}</span>
            </div>
            <div className="flex justify-between">
              <span>Order ID</span>
              <span className="font-mono text-xs text-ink">{order.paymentOrderId ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment ID</span>
              <span className="font-mono text-xs text-ink">{order.paymentId ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <OrderStatusBadge status={order.status} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-sm text-muted">
            <div className="font-semibold text-ink">{order.customerName}</div>
            <div>{order.customerEmail}</div>
            <div>{order.customerPhone}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-sm text-muted">
            <div className="font-semibold text-ink">{order.shippingAddress.fullName}</div>
            <div>{order.shippingAddress.line1}</div>
            {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
            <div>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </div>
            <div>{order.shippingAddress.country}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}