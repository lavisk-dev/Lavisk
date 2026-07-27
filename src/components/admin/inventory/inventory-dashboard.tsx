"use client";

import { useState } from "react";
import { Package, AlertTriangle, PackageX, Plus, Minus, Equal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InventoryDashboard, InventoryOperation } from "@/lib/types";
import { AddStockModal } from "@/components/admin/inventory/add-stock-modal";
import { RemoveStockModal } from "@/components/admin/inventory/remove-stock-modal";
import { AdjustStockModal } from "@/components/admin/inventory/adjust-stock-modal";

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

export function InventoryDashboard({ dashboard }: { dashboard: InventoryDashboard }) {
  const [addProductId, setAddProductId] = useState<string | null>(null);
  const [removeProductId, setRemoveProductId] = useState<string | null>(null);
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mist">
              <Package className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Products</p>
              <p className="text-2xl font-bold text-ink">{dashboard.totalProducts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Stock</p>
              <p className="text-2xl font-bold text-ink">{dashboard.totalStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Low Stock</p>
              <p className="text-2xl font-bold text-ink">{dashboard.lowStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <PackageX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Out of Stock</p>
              <p className="text-2xl font-bold text-ink">{dashboard.outOfStockCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Stock Summary</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Min Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dashboard.stockSummary.map((item) => {
              const isLow = item.stock > 0 && item.stock <= item.minStock;
              const isOut = item.stock === 0;
              return (
                <TableRow key={item.productId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 shrink-0 rounded-xl"
                        style={{
                          background: `linear-gradient(150deg,${item.gradientFrom},${item.gradientTo})`,
                        }}
                      />
                      <div>
                        <div className="font-semibold text-ink">{item.productName}</div>
                        <div className="text-xs text-muted">{item.productSlug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{item.stock}</TableCell>
                  <TableCell className="text-muted">{item.minStock}</TableCell>
                  <TableCell>
                    {isOut ? (
                      <Badge variant="destructive">Out of stock</Badge>
                    ) : isLow ? (
                      <Badge variant="warning">Low stock</Badge>
                    ) : (
                      <Badge variant="success">In stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        title="Add stock"
                        onClick={() => setAddProductId(item.productId)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        title="Remove stock"
                        onClick={() => setRemoveProductId(item.productId)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600"
                        title="Adjust stock"
                        onClick={() => setAdjustProductId(item.productId)}
                      >
                        <Equal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {dashboard.stockSummary.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Recent Inventory Movements</h2>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/inventory/movements">View all</a>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Before</TableHead>
              <TableHead>After</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dashboard.recentMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="text-xs text-muted">
                  {new Date(movement.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
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
              </TableRow>
            ))}
            {dashboard.recentMovements.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted">
                  No movements recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {addProductId && (
        <AddStockModal
          productId={addProductId}
          open={true}
          onOpenChange={(open) => { if (!open) setAddProductId(null); }}
        />
      )}
      {removeProductId && (
        <RemoveStockModal
          productId={removeProductId}
          open={true}
          onOpenChange={(open) => { if (!open) setRemoveProductId(null); }}
        />
      )}
      {adjustProductId && (
        <AdjustStockModal
          productId={adjustProductId}
          open={true}
          onOpenChange={(open) => { if (!open) setAdjustProductId(null); }}
        />
      )}
    </>
  );
}