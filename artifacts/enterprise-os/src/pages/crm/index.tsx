import React, { useState } from "react";
import { useListDeals } from "@workspace/api-client-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  Target, DollarSign, TrendingUp, CheckCircle2,
  Search, Plus, ArrowUpRight, Building2, User2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { AddDealModal } from "@/components/modals/AddDealModal";

const STAGE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  prospecting:    { label: "Prospecting",    color: "bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-gray-400",           dot: "bg-gray-400" },
  qualification:  { label: "Qualification",  color: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",        dot: "bg-blue-400" },
  proposal:       { label: "Proposal",       color: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400", dot: "bg-purple-500" },
  negotiation:    { label: "Negotiation",    color: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",    dot: "bg-amber-400" },
  closed_won:     { label: "Closed Won",     color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", dot: "bg-emerald-400" },
  closed_lost:    { label: "Closed Lost",    color: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",            dot: "bg-red-400" },
};

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500", "from-blue-400 to-cyan-500",
  "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500", "from-purple-400 to-indigo-500",
];

export default function CRMPage() {
  const { data: deals, isLoading } = useListDeals();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const dealList = (deals as any[]) ?? [];

  const filtered = dealList.filter((d: any) => {
    const matchStage = stageFilter === "all" || d.stage === stageFilter;
    const matchSearch = !search ||
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.company?.toLowerCase().includes(search.toLowerCase()) ||
      d.contact?.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  const openDeals     = dealList.filter((d: any) => !["closed_won", "closed_lost"].includes(d.stage));
  const wonDeals      = dealList.filter((d: any) => d.stage === "closed_won");
  const pipelineValue = openDeals.reduce((s: number, d: any) => s + (d.value || 0), 0);
  const wonValue      = wonDeals.reduce((s: number, d: any) => s + (d.value || 0), 0);

  const kpis = [
    { title: "Total Deals",     value: dealList.length,                     icon: Target,       iconClass: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",  trend: `${openDeals.length} active` },
    { title: "Pipeline Value",  value: `$${(pipelineValue / 1000).toFixed(0)}k`, icon: DollarSign,   iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",   trend: "open deals" },
    { title: "Revenue Won",     value: `$${(wonValue / 1000).toFixed(0)}k`,      icon: TrendingUp,   iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", trend: `${wonDeals.length} closed` },
    { title: "Deals Closed",    value: wonDeals.length,                     icon: CheckCircle2, iconClass: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", trend: "won this period" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">CRM Pipeline</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Track deals, contacts, and your sales pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/crm/deals"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Kanban View
          </Link>
          {isAdmin && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4" /> Add Deal
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={i} variant="stacked" title={k.title} value={k.value} icon={k.icon} iconClass={k.iconClass} trend={k.trend} trendUp />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
          {["all", "prospecting", "proposal", "negotiation", "closed_won", "closed_lost"].map(s => (
            <button key={s} onClick={() => setStageFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize whitespace-nowrap",
                stageFilter === s
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}>
              {s === "all" ? "All Stages" : STAGE_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search deals..."
            className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
        </div>
      </div>

      {/* Deal Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No deals found</p>
          <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">Try adjusting your search or stage filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((deal: any, idx: number) => {
            const stage = STAGE_CONFIG[deal.stage] ?? { label: deal.stage, color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
            const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            const initials = (deal.title ?? "D").slice(0, 2).toUpperCase();
            return (
              <div key={deal.id}
                className="group bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-3">

                {/* Deal header */}
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm", gradient)}>
                    {initials}
                  </div>
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", stage.color)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", stage.dot)} />
                    {stage.label}
                  </span>
                </div>

                {/* Deal info */}
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {deal.title}
                  </p>
                  <div className="mt-1 space-y-1">
                    {deal.company && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{deal.company}</span>
                      </div>
                    )}
                    {deal.contact && !deal.company && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <User2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{deal.contact}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deal value + action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-white/5">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Deal Value</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      ${(deal.value ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <Link to="/crm/deals"
                    className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Details <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400">{filtered.length} deal{filtered.length !== 1 ? "s" : ""} shown</p>

      <AddDealModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
