"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustStockModal({ productId, open, onOpenChange }: Props) {
  const router = useRouter();
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("Physical count adjustment");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const target = parseInt(newStock, 10);
    if (target < 0 || isNaN(target)) {
      setError("Stock must be a non-negative number");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/adjust-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          newStock: target,
          reason: reason.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(json.error ?? "Failed to adjust stock");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>Set inventory to an exact quantity.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="newStock">New Stock Quantity</Label>
            <Input
              id="newStock"
              type="number"
              min={0}
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="25"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Physical count adjustment"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details…"
              rows={2}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adjusting…" : "Adjust Stock"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}