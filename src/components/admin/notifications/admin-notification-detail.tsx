"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { NotificationRecord } from "@/lib/types";

const STATUS_STYLES: Record<string, "warning" | "success" | "destructive" | "outline" | "soft"> = {
  queued: "warning",
  sending: "soft",
  sent: "success",
  failed: "destructive",
  retry: "outline",
};

export function AdminNotificationDetail({ notification }: { notification: NotificationRecord }) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    setIsRetrying(true);
    const res = await fetch("/api/admin/notifications/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notification.id }),
    });
    const json = await res.json();
    setIsRetrying(false);
    if (json.success) {
      router.refresh();
    } else {
      alert(json.error ?? "Retry failed");
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 text-sm" onClick={() => router.push("/admin/notifications")}>
        <ArrowLeft className="h-4 w-4" /> Back to notifications
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{notification.subject}</CardTitle>
                <p className="mt-1 font-mono text-xs text-muted">{notification.id}</p>
              </div>
              <Badge variant={STATUS_STYLES[notification.status] ?? "outline"}>
                {notification.status}
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">To</span>
                  <span className="font-semibold text-ink">{notification.recipient.email}</span>
                </div>
                {notification.recipient.name && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted">Name</span>
                      <span className="text-ink">{notification.recipient.name}</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted">Event</span>
                  <span className="font-mono text-xs text-ink">{notification.event}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted">Template</span>
                  <span className="text-ink">{notification.templateType}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted">Channel</span>
                  <span className="capitalize text-ink">{notification.channel}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted">Created</span>
                  <span className="text-ink">{formatDate(notification.createdAt)}</span>
                </div>
                {notification.sentAt && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted">Sent</span>
                      <span className="text-ink">{formatDate(notification.sentAt)}</span>
                    </div>
                  </>
                )}
                {notification.error && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      <span className="text-muted">Error</span>
                      <span className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{notification.error}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-96 overflow-auto rounded-lg border border-border p-4">
                <iframe
                  srcDoc={notification.body}
                  title="Email preview"
                  className="h-full w-full"
                  style={{ minHeight: 400, border: "none" }}
                  sandbox=""
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {notification.status === "failed" && notification.retryCount < notification.maxRetries && (
                <Button className="w-full gap-2" onClick={handleRetry} disabled={isRetrying}>
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              )}
              {notification.status === "failed" && notification.retryCount >= notification.maxRetries && (
                <p className="text-center text-sm text-muted">Max retries reached</p>
              )}
            </CardContent>
          </Card>

          {notification.metadata && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
                  {JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}