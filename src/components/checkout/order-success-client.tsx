"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((res) => res.success && setOrder(res.data))
      .catch(() => {});
  }, [orderNumber]);

  return (
    <div className="mx-auto max-w-lg px-5 pb-20 pt-32 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white"
      >
        <CheckCircle2 className="h-10 w-10" />
      </motion.div>

      <h1 className="font-display text-[clamp(30px,5vw,44px)] font-extrabold tracking-[-0.02em]">
        Thank you! 🎀
      </h1>
      <p className="mt-3 text-lg text-muted">
        Your gift is on its way to being wrapped with love.
      </p>

      {orderNumber && (
        <p className="mt-2 text-sm text-muted">
          Order <span className="font-bold text-ink">{orderNumber}</span>
        </p>
      )}

      {order && (
        <div className="mt-8 rounded-[24px] bg-white p-6 text-left shadow-soft">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <div className="mt-4 flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-muted">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-semibold text-ink">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-semibold">Total</span>
            <span className="font-display text-xl font-bold">{formatCurrency(order.total)}</span>
          </div>
          <p className="mt-4 text-xs text-muted">
            A confirmation email is on its way to {order.customerEmail}.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/shop">Keep shopping</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
