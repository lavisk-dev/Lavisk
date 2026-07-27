"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { NotificationRecord } from "@/lib/types";

const STATUS_OPTIONS = ["all", "queued", "sending", "sent", "failed", "retry"] as const;
const EVENT_OPTIONS = [
  "all",
  "order.created",
  "payment.success",
  "payment.failed",
  "order.dispatched",
  "order.delivered",
  "order.cancelled",
  "order.refunded",
  "inventory.low_stock",
  "inventory.out_of_stock",
] as const;

const STATUS_STYLES: Record<string, "warning" | "success" | "destructive" | "outline" | "soft"> = {
  queued: "warning",
  sending: "soft",
  sent: "success",
  failed: "destructive",
  retry: "outline",
};

export function AdminNotificationsDashboard({
  initialNotifications,
  total,
}: {
  initialNotifications: NotificationRecord[];
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [event, setEvent] = useState<string>("all");

  const filtered = useMemo(() => {
    return initialNotifications.filter((n) => {
      const matchesStatus = status === "all" || n.status === status;
      const matchesEvent = event === "all" || n.event === event;
      const matchesQuery = !query.trim() || n.subject.toLowerCase().includes(query.toLowerCase()) || n.recipient.email.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesEvent && matchesQuery;
    });
  }, [initialNotifications, query, status, event]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of initialNotifications) {
      counts[n.status] = (counts[n.status] ?? 0) + 1;
    }
    return counts;
  }, [initialNotifications]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Notifications</h1>
        <p className="text-sm text-muted">{total} total notifications</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {["queued", "sending", "sent", "failed", "retry"].map((s) => (
          <Card key={s}>
            <CardContent className="flex items-center gap-3 p-4">
              <Bell className="h-5 w-5 text-muted" />
              <div>
                <div className="text-lg font-bold text-ink">{statusCounts[s] ?? 0}</div>
                <div className="text-xs text-muted capitalize">{s}</div>
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
            placeholder="Search subject or email…"
            className="pl-11"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={event} onValueChange={setEvent}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_OPTIONS.map((e) => (
              <SelectItem key={e} value={e}>
                {e === "all" ? "All events" : e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Retries</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((n) => (
            <TableRow key={n.id}>
              <TableCell>
                <Link href={`/admin/notifications/${n.id}`} className="font-semibold text-ink hover:text-brand">
                  {n.subject.length > 50 ? n.subject.slice(0, 50) + "…" : n.subject}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted">{n.recipient.email}</TableCell>
              <TableCell>
                <span className="text-xs font-mono text-muted">{n.event}</span>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_STYLES[n.status] ?? "outline"}>{n.status}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted">{n.retryCount}/{n.maxRetries}</TableCell>
              <TableCell className="text-xs text-muted">{formatDate(n.createdAt)}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted">
                No notifications match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}