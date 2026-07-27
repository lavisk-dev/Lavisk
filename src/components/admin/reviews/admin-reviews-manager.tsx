"use client";

import { useState } from "react";
import { Check, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/lib/types";

export function AdminReviewsManager({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);

  async function setApproval(id: string, isApproved: boolean) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved }),
    });
    const json = await res.json();
    if (json.success) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved } : r)));
    }
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-muted">No reviews submitted yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{review.customerName}</span>
                <Badge variant={review.isApproved ? "success" : "warning"}>
                  {review.isApproved ? "Approved" : "Pending"}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-1 text-brand">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5"
                    fill={i < review.rating ? "currentColor" : "none"}
                  />
                ))}
                <span className="ml-2 text-xs text-muted">{formatDate(review.createdAt)}</span>
              </div>
              <p className="mt-3 max-w-2xl text-sm text-muted">{review.comment}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setApproval(review.id, true)}
                title="Approve"
              >
                <Check className="h-4 w-4 text-emerald-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setApproval(review.id, false)}
                title="Reject"
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
