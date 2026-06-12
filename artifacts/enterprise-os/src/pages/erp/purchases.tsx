import React, { useState } from "react";
import { useListPurchases } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, Search, Plus, CheckCircle2, Clock,
  Truck, XCircle, Package, DollarSign, TrendingDown,
  Calendar, Download, Eye, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; badge: string; dot: string }> = {
  received: { label: "Received", icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", dot: "bg-emerald-400" },
  pending:  { label: "Pending",  icon: Clock,        badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",           dot: "bg-amber-400 animate-pulse" },
  shipped:  { label: "Shipped",  icon: Truck,        badge: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",                 dot: "bg-blue-400" },
  cancelled:{ label: "Cancelled",icon: XCircle,      badge: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",                       dot: "bg-red-400" },
  ordered:  { label: "Ordered",  icon: ShoppingCart, badge: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",     dot: "bg-purple-400" },
};

const VENDOR_COLORS = ["from-indigo-400 to-violet-500","from-blue-400 to-cyan-500","from-emerald-400 to-teal-500","from-amber-400 to-orange-500","from-rose-400 to-pink-500","from-purple-400 to-indigo-500"];

export default function PurchasesPage() {
  const { data: purchases, isLoading } = useListPurchases();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const filtered = purchases?.filter(p => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchSearch = !search || p.vendor.toLowerCase().includes(search.toLowerCase()) || p.product.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }) ?? [];

  const totalValue    = purchases?.reduce((s, p) => s + p.total, 0) ?? 0;
  const receivedVal   = purchases?.filter(p => p.status === "received").reduce((s, p) => s + p.total, 0) ?? 0;
  const pendingCount  = purchases?.filter(p => p.status === "pending" || p.status === "ordered").length ?? 0;
  const totalQty      = purchases?.reduce((s, p) => s + p.quantity, 0) ?? 0;

  const kpis = [
    { label: "Total POs",      value: purchases?.length ?? 0, icon: ShoppingCart, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Total Spend",    value: `$${(totalValue/1000).toFixed(0)}k`, icon: DollarSign, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { label: "Pending Orders", value: pendingCount, icon: Clock, color: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "Items Ordered",  value: totalQty, icon: Package, color: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-32" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track vendor orders, deliveries, and procurement spend.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"
            onClick={() => toast({ title: "Export", description: "Exporting purchase report…" })}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
            onClick={() => toast({ title: "New PO", description: "Purchase order form coming soon." })}>
            <Plus className="w-4 h-4" /> New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", k.color)}>
              <Icon className={cn("w-4.5 h-4.5", k.iconColor)} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p>
            </div>
          </div>
        ); })}
      </div>

      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-50 dark:bg-white/5 rounded-lg p-1">
            {["all","pending","ordered","shipped","received","cancelled"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                  statusFilter === f ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                )}>{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 min-w-[160px] max-w-xs ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor or product..."
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5">
                {["Date","Vendor","Product","Qty","Unit Price","Total","Status","Actions"].map((h, i) => (
                  <th key={h} className={cn("px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide",
                    (i === 3 || i === 4 || i === 5) && "text-right", i === 7 && "text-right"
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                const StatusIcon = sc.icon;
                const gradient = VENDOR_COLORS[idx % VENDOR_COLORS.length];
                const unitPrice = p.quantity > 0 ? (p.total / p.quantity) : 0;
                return (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {new Date(p.date).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0", gradient)}>
                          {p.vendor.slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.vendor}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{p.product}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.quantity}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-gray-500 dark:text-gray-400">${unitPrice.toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">${p.total.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", sc.badge)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toast({ title: "View PO", description: `Opening PO details.` })}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400"><ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No purchase orders found</p></div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Total: ${filtered.reduce((s, p) => s + p.total, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
