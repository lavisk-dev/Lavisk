"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentRecord } from "@/lib/types";

const STATUS_OPTIONS = ["all", "pending", "authorized", "captured", "failed", "cancelled", "refunded", "partially_refunded"] as const;
const PROVIDER_OPTIONS = ["all", "razorpay", "cod", "stripe", "cashfree"] as const;

export function AdminPaymentsDashboard({
  initialPayments,
  total,
}: {
  initialPayments: PaymentRecord[];
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [provider, setProvider] = useState<string>("all");

  const filtered = useMemo(() => {
    return initialPayments.filter((p) => {
      const matchesStatus = status === "all" || p.status === status;
      const matchesProvider = provider === "all" || p.provider === provider;
      const matchesQuery =
        !query.trim() ||
        p.orderId.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesProvider && matchesQuery;
    });
  }, [initialPayments, query, status, provider]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of initialPayments) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    }
    return counts;
  }, [initialPayments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Payments</h1>
        <p className="text-sm text-muted">{total} total payment records</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATUS_OPTIONS.slice(1).map((s) => (
          <Card key={s}>
            <CardContent className="flex items-center gap-3 p-4">
              <CreditCard className="h-5 w-5 text-muted" />
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
            placeholder="Search by payment ID or order ID…"
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
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p === "all" ? "All providers" : p.charAt(0).toUpperCase() + p.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment ID</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <Link href={`/admin/payments/${payment.id}`} className="font-mono text-xs font-semibold text-ink hover:text-brand">
                  {payment.id.slice(0, 18)}…
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/admin/orders/${payment.orderId}`} className="text-sm font-semibold text-ink hover:text-brand">
                  {payment.orderId.slice(0, 12)}…
                </Link>
              </TableCell>
              <TableCell className="capitalize">{payment.provider}</TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(payment.amount)}</TableCell>
              <TableCell className="text-xs text-muted">{formatDate(payment.createdAt)}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted">
                No payments match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}