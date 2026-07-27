import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  changePct?: number;
  icon: LucideIcon;
  accent?: string;
}

export function StatCard({ label, value, changePct, icon: Icon, accent = "#FFE9EF" }: StatCardProps) {
  const isPositive = (changePct ?? 0) >= 0;
  return (
    <div className="rounded-lg bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-ink">{value}</div>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: accent }}
        >
          <Icon className="h-5 w-5 text-brand" />
        </div>
      </div>
      {typeof changePct === "number" && (
        <div
          className={cn(
            "mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
            isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}
        >
          {isPositive ? "▲" : "▼"} {Math.abs(changePct)}% vs last month
        </div>
      )}
    </div>
  );
}
