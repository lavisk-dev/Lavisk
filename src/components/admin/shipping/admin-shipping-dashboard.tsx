"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ShipmentStatusBadge } from "@/components/admin/shipping/shipment-status-badge";
import { formatDate } from "@/lib/utils";
import type { Shipment } from "@/lib/types";

const STATUS_OPTIONS = [
  "all", "pending", "label_generated", "pickup_scheduled", "picked_up",
  "in_transit", "out_for_delivery", "delivered", "delivery_failed",
  "returned", "cancelled",
] as const;

export function AdminShippingDashboard({
  initialShipments,
  total,
}: {
  initialShipments: Shipment[];
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return initialShipments.filter((s) => {
      const matchesStatus = status === "all" || s.status === status;
      const matchesQuery =
        !query.trim() ||
        s.id.toLowerCase().includes(query.toLowerCase()) ||
        s.orderId.toLowerCase().includes(query.toLowerCase()) ||
        (s.trackingNumber ?? "").toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [initialShipments, query, status]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of initialShipments) {
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    }
    return counts;
  }, [initialShipments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Shipping</h1>
        <p className="text-sm text-muted">{total} total shipments</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {["pending", "in_transit", "delivered", "delivery_failed"].map((s) => (
          <Card key={s}>
            <CardContent className="flex items-center gap-3 p-4">
              <Truck className="h-5 w-5 text-muted" />
              <div>
                <div className="text-lg font-bold text-ink">{statusCounts[s] ?? 0}</div>
                <div className="text-xs text-muted capitalize">{s.replace(/_/g, " ")}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, order ID or tracking..."
            className="pl-11"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted py-8">
                  No shipments found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link href={`/admin/shipping/${s.id}`} className="font-mono text-xs text-brand hover:underline">
                    {s.id.slice(0, 12)}…
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{s.orderId.slice(0, 12)}…</TableCell>
                <TableCell className="font-mono text-xs">{s.trackingNumber ?? "—"}</TableCell>
                <TableCell className="capitalize text-sm">{s.courier}</TableCell>
                <TableCell><ShipmentStatusBadge status={s.status} /></TableCell>
                <TableCell className="text-sm capitalize">{s.pickupStatus}</TableCell>
                <TableCell className="text-xs text-muted">{formatDate(s.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}