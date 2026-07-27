"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { InventoryMovement, InventoryOperation } from "@/lib/types";

const OPERATION_LABELS: Record<InventoryOperation, string> = {
  added: "Added",
  removed: "Removed",
  adjusted: "Adjusted",
  sale: "Sale",
  return: "Return",
  damaged: "Damaged",
  lost: "Lost",
  purchase_received: "Purchase Received",
};

const OPERATION_COLORS: Record<InventoryOperation, string> = {
  added: "text-green-600",
  removed: "text-red-600",
  adjusted: "text-amber-600",
  sale: "text-red-600",
  return: "text-green-600",
  damaged: "text-red-600",
  lost: "text-red-600",
  purchase_received: "text-green-600",
};

export function InventoryMovementsTable({
  initialMovements,
}: {
  initialMovements: InventoryMovement[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return initialMovements;
    const q = query.toLowerCase();
    return initialMovements.filter(
      (m) =>
        m.productId.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.operation.toLowerCase().includes(q) ||
        (m.reference ?? "").toLowerCase().includes(q)
    );
  }, [initialMovements, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movements…"
          className="pl-11"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Product ID</TableHead>
            <TableHead>Operation</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Before</TableHead>
            <TableHead>After</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted">
                {new Date(movement.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell className="font-mono text-xs">{movement.productId}</TableCell>
              <TableCell>
                <span className={cn("font-medium", OPERATION_COLORS[movement.operation])}>
                  {OPERATION_LABELS[movement.operation]}
                </span>
              </TableCell>
              <TableCell className="font-semibold">{movement.quantity}</TableCell>
              <TableCell className="text-muted">{movement.stockBefore}</TableCell>
              <TableCell className="text-muted">{movement.stockAfter}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted">
                {movement.reason}
              </TableCell>
              <TableCell className="text-xs text-muted">{movement.reference ?? "—"}</TableCell>
              <TableCell className="text-xs text-muted">{movement.performedBy}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="py-10 text-center text-sm text-muted">
                No movements match your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}