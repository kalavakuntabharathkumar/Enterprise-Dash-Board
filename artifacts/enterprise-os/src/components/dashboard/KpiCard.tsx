import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconClass?: string;
  trend?: string;
  trendUp?: boolean;
  sub?: string;
  className?: string;
  variant?: "stacked" | "inline";
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  trend,
  trendUp = true,
  sub,
  className,
  variant = "stacked",
}: KpiCardProps) {
  if (variant === "inline") {
    return (
      <div className={cn(
        "bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-5",
        "flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{title}</p>
          {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-5",
      "shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none">{title}</p>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <div className="flex items-center gap-2 mt-2 min-h-[20px]">
        {trend ? (
          <div className="flex items-center gap-1">
            {trendUp
              ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            }
            <span className={cn("text-xs font-medium", trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {trend}
            </span>
          </div>
        ) : sub ? (
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>
        ) : null}
      </div>
    </div>
  );
}
