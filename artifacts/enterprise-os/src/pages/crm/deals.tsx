import React, { useState } from "react";
import { useListDeals } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Plus, DollarSign, TrendingUp, Target, Trophy,
  Calendar, Building2, MoreHorizontal, CheckCircle2,
  XCircle, Clock, Layers, ArrowRight, Zap, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { AddDealModal } from "@/components/modals/AddDealModal";

const STAGE_CONFIG: Record<string, {
  label: string; gradient: string; lightBg: string; border: string;
  headerText: string; emptyText: string; icon: React.ElementType;
}> = {
  lead:        { label: "Lead",        gradient: "from-slate-400 to-slate-500",       lightBg: "bg-slate-50/50 dark:bg-white/1",       border: "border-slate-200 dark:border-white/8",     headerText: "text-slate-700 dark:text-slate-300", emptyText: "New leads appear here",      icon: Target },
  contacted:   { label: "Contacted",   gradient: "from-blue-400 to-blue-600",         lightBg: "bg-blue-50/30 dark:bg-blue-500/3",     border: "border-blue-200 dark:border-blue-500/20",  headerText: "text-blue-700 dark:text-blue-300",   emptyText: "Leads you've reached out to", icon: Zap },
  proposal:    { label: "Proposal",    gradient: "from-violet-400 to-indigo-600",     lightBg: "bg-violet-50/30 dark:bg-violet-500/3", border: "border-violet-200 dark:border-violet-500/20", headerText: "text-violet-700 dark:text-violet-300", emptyText: "Proposals sent", icon: Layers },
  negotiation: { label: "Negotiation", gradient: "from-amber-400 to-orange-500",      lightBg: "bg-amber-50/30 dark:bg-amber-500/3",  border: "border-amber-200 dark:border-amber-500/20", headerText: "text-amber-700 dark:text-amber-300", emptyText: "Active negotiations",        icon: ArrowRight },
  won:         { label: "Won",         gradient: "from-emerald-400 to-teal-500",      lightBg: "bg-emerald-50/30 dark:bg-emerald-500/3", border: "border-emerald-200 dark:border-emerald-500/20", headerText: "text-emerald-700 dark:text-emerald-300", emptyText: "Closed wins", icon: CheckCircle2 },
  lost:        { label: "Lost",        gradient: "from-red-400 to-rose-500",          lightBg: "bg-red-50/30 dark:bg-red-500/3",      border: "border-red-200 dark:border-red-500/20",    headerText: "text-red-700 dark:text-red-300",     emptyText: "Closed lost deals",          icon: XCircle },
};

const STAGES = ["lead","contacted","proposal","negotiation","won","lost"];
const AVATAR_GRADIENTS = ["from-indigo-400 to-violet-500","from-blue-400 to-cyan-500","from-emerald-400 to-teal-500","from-amber-400 to-orange-500","from-rose-400 to-pink-500","from-purple-400 to-indigo-500"];

function ProbabilityRing({ value }: { value: number }) {
  const r = 14; const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  const color = value >= 70 ? "#10b981" : value >= 40 ? "#f59e0b" : "#6366f1";
  return (
    <svg width="36" height="36" className="flex-shrink-0 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-white/8" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      <text x="18" y="18" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center" fill={color} fontSize="8" fontWeight="bold" transform="rotate(90 18 18)">
        {value}%
      </text>
    </svg>
  );
}

function DealCard({ deal, idx }: { deal: any; idx: number }) {
  const { toast } = useToast();
  const prob = deal.probability ?? 0;
  const daysLeft = deal.close_date
    ? Math.ceil((new Date(deal.close_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="group bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/8 rounded-xl p-3.5 shadow-sm hover:shadow-md dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-0.5">{deal.title}</p>
          {(deal.company || deal.contact) && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{deal.company || deal.contact}</span>
            </div>
          )}
        </div>
        {prob > 0 && <ProbabilityRing value={prob} />}
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-white leading-none">${deal.value.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">deal value</p>
        </div>
        <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400"
          onClick={() => toast({ title: "Deal options", description: "Deal editor coming soon." })}>
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {deal.close_date && (
        <div className={cn("flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg",
          daysLeft !== null && daysLeft < 7 ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" :
          daysLeft !== null && daysLeft < 30 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
          "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
        )}>
          <Clock className="w-3 h-3" />
          {daysLeft !== null && daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
          <span className="ml-auto opacity-60">{new Date(deal.close_date).toLocaleDateString("en",{month:"short",day:"numeric"})}</span>
        </div>
      )}
    </div>
  );
}

export default function DealsKanbanPage() {
  const { data: deals, isLoading } = useListDeals();
  const [showAddModal, setShowAddModal] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals?.filter(d => d.stage === stage) || [];
    return acc;
  }, {} as Record<string, any[]>);

  const totalValue  = deals?.reduce((s, d) => s + d.value, 0) ?? 0;
  const wonValue    = deals?.filter(d => d.stage === "won").reduce((s, d) => s + d.value, 0) ?? 0;
  const activeDeals = deals?.filter(d => !["won","lost"].includes(d.stage)).length ?? 0;
  const winRate     = deals?.length ? Math.round((deals.filter(d => d.stage === "won").length / deals.length) * 100) : 0;

  const kpis = [
    { label: "Total Pipeline", value: `$${(totalValue/1000).toFixed(1)}k`, icon: DollarSign, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400", sub: "combined deal value" },
    { label: "Active Deals",   value: activeDeals,                          icon: Target,     color: "bg-blue-50 dark:bg-blue-500/10",    iconColor: "text-blue-600 dark:text-blue-400",    sub: "in progress" },
    { label: "Won Revenue",    value: `$${(wonValue/1000).toFixed(1)}k`,    icon: Trophy,     color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", sub: "closed won" },
    { label: "Win Rate",       value: `${winRate}%`,                        icon: TrendingUp, color: "bg-amber-50 dark:bg-amber-500/10",   iconColor: "text-amber-600 dark:text-amber-400",  sub: "overall conversion" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-32" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-28 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
      <div className="flex gap-4">{[...Array(6)].map((_,i) => <div key={i} className="w-64 h-96 bg-gray-100 dark:bg-white/5 rounded-xl flex-shrink-0" />)}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Deals Pipeline</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Visualize and manage every deal across your sales stages.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <a href="/api/export/leads" download
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          )}
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
            onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> New Deal
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
        {kpis.map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", k.color)}>
                <Icon className={cn("w-4 h-4", k.iconColor)} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{k.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ); })}
      </div>

      {/* Kanban board */}
      <div className="flex-1 flex gap-3 overflow-x-auto pb-2 min-h-0">
        {STAGES.map(stage => {
          const sc = STAGE_CONFIG[stage];
          const stageDeals = dealsByStage[stage] ?? [];
          const stageTotal = stageDeals.reduce((s: number, d: any) => s + d.value, 0);
          const StageIcon = sc.icon;
          return (
            <div key={stage} className={cn("flex-shrink-0 w-60 flex flex-col rounded-xl border overflow-hidden", sc.border, sc.lightBg)}>
              {/* Column header */}
              <div className="p-3 border-b border-gray-100 dark:border-white/8 bg-white/60 dark:bg-white/3 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center", sc.gradient)}>
                      <StageIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className={cn("text-xs font-bold", sc.headerText)}>{sc.label}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-br text-white", sc.gradient)}>
                    {stageDeals.length}
                  </span>
                </div>
                {stageTotal > 0 && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold pl-8">${stageTotal.toLocaleString()}</p>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-0">
                {stageDeals.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br mx-auto mb-2 flex items-center justify-center opacity-20", sc.gradient)}>
                      <StageIcon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-600">{sc.emptyText}</p>
                  </div>
                ) : stageDeals.map((deal: any, idx: number) => (
                  <DealCard key={deal.id} deal={deal} idx={idx} />
                ))}
              </div>

              {/* Add button */}
              <div className="p-2.5 border-t border-gray-100 dark:border-white/5 flex-shrink-0">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-200 dark:border-white/10 text-[11px] text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5"
                >
                  <Plus className="w-3 h-3" /> Add deal
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <AddDealModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
