import React, { useState } from "react";
import { useListExpenses } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Receipt, Search, Plus, CheckCircle2, XCircle,
  Clock, TrendingUp, DollarSign, AlertCircle,
  MoreHorizontal, Eye, Download, Laptop,
  Building2, Megaphone, Plane, Wrench, Coffee
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Technology: Laptop,
  Office: Building2,
  Marketing: Megaphone,
  Travel: Plane,
  Services: Wrench,
  Other: Coffee,
};

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  Office: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  Marketing: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  Travel: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  Services: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  Other: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; class: string }> = {
  approved: { label: "Approved", icon: CheckCircle2, class: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
  pending:  { label: "Pending",  icon: Clock,        class: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  rejected: { label: "Rejected", icon: XCircle,      class: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
};

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useListExpenses();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  const filtered = expenses?.filter(exp => {
    const matchStatus = statusFilter === "all" || exp.status === statusFilter;
    const matchCat = categoryFilter === "all" || exp.category === categoryFilter;
    const matchSearch = !search || exp.title.toLowerCase().includes(search.toLowerCase()) || exp.submitted_by.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchCat && matchSearch;
  }) ?? [];

  const totalAmt    = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const approvedAmt = expenses?.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0) ?? 0;
  const pendingAmt  = expenses?.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0) ?? 0;
  const pendingCount = expenses?.filter(e => e.status === "pending").length ?? 0;
  const rejectedAmt = expenses?.filter(e => e.status === "rejected").reduce((s, e) => s + e.amount, 0) ?? 0;

  const categories = ["all", ...Array.from(new Set(expenses?.map(e => e.category) ?? []))];

  const kpis = [
    { label: "Total Expenses", value: `$${(totalAmt / 1000).toFixed(0)}k`, icon: DollarSign, sub: `${expenses?.length ?? 0} submissions`, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400", trend: "+8.1%" },
    { label: "Approved",       value: `$${(approvedAmt / 1000).toFixed(0)}k`, icon: CheckCircle2, sub: `${expenses?.filter(e => e.status === "approved").length ?? 0} approved`, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", trend: null },
    { label: "Pending Review", value: `$${(pendingAmt / 1000).toFixed(0)}k`,  icon: Clock, sub: `${pendingCount} awaiting`, color: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400", trend: null },
    { label: "Rejected",       value: `$${(rejectedAmt / 1000).toFixed(0)}k`, icon: XCircle, sub: `${expenses?.filter(e => e.status === "rejected").length ?? 0} rejected`, color: "bg-red-50 dark:bg-red-500/10", iconColor: "text-red-600 dark:text-red-400", trend: null },
  ];

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "approved", label: "Approved" },
    { id: "pending", label: "Pending" },
    { id: "rejected", label: "Rejected" },
  ];

  const handleApprove = (exp: any) => toast({ title: "Approved", description: `${exp.title} has been approved.` });
  const handleReject  = (exp: any) => toast({ title: "Rejected", description: `${exp.title} has been rejected.`, variant: "destructive" });
  const handleView    = (exp: any) => toast({ title: "Viewing", description: `Opening ${exp.title} details.` });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-lg w-32" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track, approve, and manage company expenditures.</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => toast({ title: "Submit expense", description: "Expense form coming soon." })}
        >
          <Plus className="w-4 h-4" />
          Submit Expense
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", kpi.color)}>
                  <Icon className={cn("w-4.5 h-4.5", kpi.iconColor)} />
                </div>
                {kpi.trend && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-red-500 dark:text-red-400">
                    <TrendingUp className="w-3 h-3" />
                    {kpi.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{kpi.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-50 dark:bg-white/5 rounded-lg p-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  statusFilter === f.id
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-300 outline-none"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 min-w-[180px] max-w-xs ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5">
                {["Date", "Expense", "Category", "Submitted By", "Amount", "Status", "Actions"].map((h, i) => (
                  <th key={h} className={cn(
                    "px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide",
                    i === 4 && "text-right",
                    i === 6 && "text-right"
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => {
                const sc = STATUS_CONFIG[exp.status] || STATUS_CONFIG.pending;
                const StatusIcon = sc.icon;
                const CatIcon = CATEGORY_ICONS[exp.category] || Coffee;
                const catColor = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;

                return (
                  <tr
                    key={exp.id}
                    className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group"
                  >
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(exp.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{exp.title}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full", catColor)}>
                        <CatIcon className="w-3 h-3" />
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {exp.submitted_by.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{exp.submitted_by}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        ${exp.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", sc.class)}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(exp)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {exp.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(exp)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleReject(exp)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="Reject"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400 dark:text-gray-600">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No expenses found</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Total: ${filtered.reduce((s, e) => s + e.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
