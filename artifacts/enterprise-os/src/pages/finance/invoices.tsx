import React, { useState } from "react";
import { useListInvoices } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Search, Plus, Download, Send, Eye,
  CheckCircle2, Clock, AlertCircle, DollarSign,
  MoreHorizontal, Filter, ArrowUpDown, TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; class: string }> = {
  paid:    { label: "Paid",    icon: CheckCircle2, class: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
  sent:    { label: "Sent",    icon: Send,         class: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
  draft:   { label: "Draft",   icon: FileText,     class: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10" },
  overdue: { label: "Overdue", icon: AlertCircle,  class: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
};

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useListInvoices();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const filtered = invoices?.filter(inv => {
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchSearch = !search || inv.client.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }) ?? [];

  const totalAmount = invoices?.reduce((s, i) => s + i.amount, 0) ?? 0;
  const paidAmount  = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0) ?? 0;
  const pendingAmt  = invoices?.filter(i => i.status === "sent" || i.status === "draft").reduce((s, i) => s + i.amount, 0) ?? 0;
  const overdueAmt  = invoices?.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0) ?? 0;
  const overdueCount = invoices?.filter(i => i.status === "overdue").length ?? 0;

  const kpis = [
    { label: "Total Billed", value: `$${(totalAmount / 1000).toFixed(0)}k`, icon: DollarSign, sub: `${invoices?.length ?? 0} invoices`, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400", trend: "+14%" },
    { label: "Collected",    value: `$${(paidAmount / 1000).toFixed(0)}k`,  icon: CheckCircle2, sub: `${invoices?.filter(i => i.status === "paid").length ?? 0} paid`, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", trend: "+8%" },
    { label: "Outstanding",  value: `$${(pendingAmt / 1000).toFixed(0)}k`,  icon: Clock, sub: "awaiting payment", color: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400", trend: null },
    { label: "Overdue",      value: `$${(overdueAmt / 1000).toFixed(0)}k`,  icon: AlertCircle, sub: `${overdueCount} invoice${overdueCount !== 1 ? "s" : ""}`, color: "bg-red-50 dark:bg-red-500/10", iconColor: "text-red-600 dark:text-red-400", trend: null },
  ];

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "sent", label: "Sent" },
    { id: "draft", label: "Draft" },
    { id: "overdue", label: "Overdue" },
  ];

  const handleAction = (action: string, inv: any) => {
    const messages: Record<string, string> = {
      view: `Viewing ${inv.invoice_number}`,
      send: `${inv.invoice_number} sent to client`,
      download: `Downloading ${inv.invoice_number}.pdf`,
    };
    toast({ title: action.charAt(0).toUpperCase() + action.slice(1), description: messages[action] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-lg w-32" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
        </div>
        <div className="h-80 bg-gray-100 dark:bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage billing, track payments, and monitor outstanding balances.</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => toast({ title: "Create invoice", description: "Invoice builder coming soon." })}
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} title={kpi.label} value={kpi.value} icon={kpi.icon} iconClass={cn(kpi.color, kpi.iconColor)} trend={kpi.trend ?? undefined} trendUp={true} sub={kpi.sub} />
        ))}
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
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 min-w-[180px] max-w-xs ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5">
                {["Invoice", "Client", "Issue Date", "Due Date", "Amount", "Status", "Actions"].map((h, i) => (
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
              {filtered.map((invoice, idx) => {
                const sc = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                const StatusIcon = sc.icon;
                const isOverdue = invoice.status === "overdue";
                const dueDate = new Date(invoice.due_date);
                const dueSoon = !isOverdue && dueDate.getTime() - Date.now() < 7 * 86400000;

                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">
                        {invoice.invoice_number}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {invoice.client.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{invoice.client}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(invoice.issue_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs", isOverdue ? "text-red-600 dark:text-red-400 font-medium" : dueSoon ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-500 dark:text-gray-400")}>
                        {isOverdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                        {dueDate.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        ${invoice.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", sc.class)}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleAction("view", invoice)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {invoice.status === "draft" && (
                          <button
                            onClick={() => handleAction("send", invoice)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Send"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleAction("download", invoice)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400 dark:text-gray-600">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No invoices found</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} invoice{filtered.length !== 1 ? "s" : ""}</p>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Total: ${filtered.reduce((s, i) => s + i.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
