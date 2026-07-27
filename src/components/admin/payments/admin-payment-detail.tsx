"use client";

import { useRouter } from "next/navigation";
import { CreditCard, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentRecord, PaymentTransaction, RefundRecord } from "@/lib/types";

export function AdminPaymentDetail({
  payment,
  transactions,
  refunds,
}: {
  payment: PaymentRecord;
  transactions: PaymentTransaction[];
  refunds: RefundRecord[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 text-sm" onClick={() => router.push("/admin/payments")}>
        <ArrowLeft className="h-4 w-4" /> Back to payments
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
                <p className="mt-1 font-mono text-xs text-muted">{payment.id}</p>
              </div>
              <PaymentStatusBadge status={payment.status} />
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Order ID</span>
                <span className="font-mono text-xs font-semibold text-ink">{payment.orderId}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted">Amount</span>
                <span className="font-bold text-ink">{formatCurrency(payment.amount)} {payment.currency}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted">Provider</span>
                <span className="font-semibold text-ink capitalize">{payment.provider}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted">Method</span>
                <span className="font-semibold text-ink">{payment.method ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted">Provider Order ID</span>
                <span className="font-mono text-xs text-ink">{payment.providerOrderId ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted">Provider Payment ID</span>
                <span className="font-mono text-xs text-ink">{payment.providerPaymentId ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted">Created</span>
                <span className="text-ink">{formatDate(payment.createdAt)}</span>
              </div>
              {payment.updatedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted">Updated</span>
                    <span className="text-ink">{formatDate(payment.updatedAt)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {transactions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">No transactions recorded.</p>
              ) : (
                <div className="divide-y divide-border text-sm">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-semibold text-ink capitalize">{tx.type.replace(/_/g, " ")}</div>
                        <div className="text-xs text-muted">
                          {tx.status} — {tx.createdAt ? formatDate(tx.createdAt) : "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-ink">{formatCurrency(tx.amount)}</div>
                        {tx.providerReference && (
                          <div className="font-mono text-[10px] text-muted">{tx.providerReference}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refunds</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {refunds.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">No refunds processed.</p>
              ) : (
                <div className="divide-y divide-border text-sm">
                  {refunds.map((refund) => (
                    <div key={refund.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-semibold text-ink">Refund</div>
                        <div className="text-xs text-muted">{refund.reason}</div>
                        <div className="text-xs text-muted">{formatDate(refund.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-ink">{formatCurrency(refund.amount)}</div>
                        <span className={`text-xs font-semibold ${refund.status === "success" ? "text-green-600" : refund.status === "failed" ? "text-red-600" : "text-amber-600"}`}>
                          {refund.status}
                        </span>
                        {refund.providerRefundId && (
                          <div className="font-mono text-[10px] text-muted">{refund.providerRefundId}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {(payment.status === "captured" || payment.status === "partially_refunded") && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    const reason = prompt("Reason for refund:");
                    if (!reason || reason.trim().length < 2) return;
                    const amountStr = prompt(`Amount to refund (max ${payment.amount}):`);
                    if (!amountStr) return;
                    const amount = Math.min(Number(amountStr), payment.amount);
                    if (amount <= 0) return;
                    fetch("/api/admin/payments/refund", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ paymentId: payment.id, amount, reason: reason.trim() }),
                    })
                      .then((r) => r.json())
                      .then((json) => {
                        if (json.success) router.refresh();
                        else alert(json.error ?? "Refund failed");
                      });
                  }}
                >
                  Process Refund
                </Button>
              )}
              {(payment.status === "failed" || payment.status === "cancelled") && (
                <Button
                  className="w-full"
                  onClick={() => {
                    fetch("/api/admin/payments/retry", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ paymentId: payment.id }),
                    })
                      .then((r) => r.json())
                      .then((json) => {
                        if (json.success) router.refresh();
                        else alert(json.error ?? "Retry failed");
                      });
                  }}
                >
                  Retry Payment
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}