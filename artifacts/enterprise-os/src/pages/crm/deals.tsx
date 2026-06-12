import React, { useState } from "react";
import { useListDeals } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Plus, DollarSign, TrendingUp, Target, Trophy,
  Calendar, Building2, MoreHorizontal, User2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STAGE_CONFIG: Record<string, {
  label: string; headerGrad: string; headerText: string;
  cardBorder: string; countBadge: string; emptyText: string;
}> = {
  lead:        { label: "Lead",        headerGrad: "from-gray-500 to-gray-600",      headerText: "text-white", cardBorder: "border-gray-100 dark:border-white/8", countBadge: "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300", emptyText: "New leads appear here" },
  contacted:   { label: "Contacted",   headerGrad: "from-blue-500 to-blue-600",      headerText: "text-white", cardBorder: "border-blue-50 dark:border-blue-500/15", countBadge: "bg-blue-200/50 text-blue-900", emptyText: "Leads you've reached out to" },
  proposal:    { label: "Proposal",    headerGrad: "from-indigo-500 to-violet-600",  headerText: "text-white", cardBorder: "border-indigo-50 dark:border-indigo-500/15", countBadge: "bg-indigo-200/50 text-indigo-900", emptyText: "Proposals sent out" },
  negotiation: { label: "Negotiation", headerGrad: "from-amber-500 to-orange-500",   headerText: "text-white", cardBorder: "border-amber-50 dark:border-amber-500/15", countBadge: "bg-amber-200/50 text-amber-900", emptyText: "Active negotiations" },
  won:         { label: "Won ✓",       headerGrad: "from-emerald-500 to-teal-500",   headerText: "text-white", cardBorder: "border-emerald-50 dark:border-emerald-500/15", countBadge: "bg-emerald-200/50 text-emerald-900", emptyText: "Closed won deals" },
  lost:        { label: "Lost",        headerGrad: "from-red-500 to-rose-500",       headerText: "text-white", cardBorder: "border-red-50 dark:border-red-500/15", countBadge: "bg-red-200/50 text-red-900", emptyText: "Closed lost deals" },
};

const STAGES = ["lead","contacted","proposal","negotiation","won","lost"];

const AVATAR_GRADIENTS = ["from-indigo-400 to-violet-500","from-blue-400 to-cyan-500","from-emerald-400 to-teal-500","from-amber-400 to-orange-500","from-rose-400 to-pink-500","from-purple-400 to-indigo-500"];

function DealCard({ deal, idx }: { deal: any; idx: number }) {
  const { toast } = useToast();
  const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
  const prob = deal.probability ?? 0;
  return (
    <div className="group bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">{deal.title}</p>
          {(deal.company || deal.contact) && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
              <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
              {deal.company || deal.contact}
            </p>
          )}
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 flex-shrink-0 ml-1"
          onClick={() => toast({ title: "Deal options", description: "Deal editor coming soon." })}>
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">${deal.value.toLocaleString()}</span>
        {deal.probability !== undefined && deal.probability !== null && (
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/10">
            {deal.probability}% likely
          </span>
        )}
      </div>

      {prob > 0 && (
        <div className="mb-3">
          <div className="h-1 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full transition-all"
              style={{ width: `${prob}%` }} />
          </div>
        </div>
      )}

      {deal.close_date && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
          <Calendar className="w-2.5 h-2.5" />
          Close: {new Date(deal.close_date).toLocaleDateString("en",{month:"short",day:"numeric"})}
        </div>
      )}
    </div>
  );
}

export default function DealsKanbanPage() {
  const { data: deals, isLoading } = useListDeals();
  const { toast } = useToast();

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals?.filter(d => d.stage === stage) || [];
    return acc;
  }, {} as Record<string, typeof deals>);

  const totalValue = deals?.reduce((s, d) => s + d.value, 0) ?? 0;
  const wonValue   = deals?.filter(d => d.stage === "won").reduce((s, d) => s + d.value, 0) ?? 0;
  const activeDeals = deals?.filter(d => !["won","lost"].includes(d.stage)).length ?? 0;

  const kpis = [
    { label: "Total Pipeline", value: `$${(totalValue/1000).toFixed(0)}k`, icon: DollarSign, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Active Deals",   value: activeDeals, icon: Target, color: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
    { label: "Won Value",      value: `$${(wonValue/1000).toFixed(0)}k`, icon: Trophy, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { label: "Total Deals",    value: deals?.length ?? 0, icon: TrendingUp, color: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-32" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
      <div className="flex gap-4">{[...Array(6)].map((_,i) => <div key={i} className="w-64 h-96 bg-gray-100 dark:bg-white/5 rounded-xl flex-shrink-0" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-5rem)]">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Deals Pipeline</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your sales deals across pipeline stages.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => toast({ title: "New deal", description: "Deal form coming soon." })}>
          <Plus className="w-4 h-4" /> New Deal
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
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

      {/* Kanban */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const sc = STAGE_CONFIG[stage];
          const stageDeals = dealsByStage[stage] ?? [];
          const stageTotal = stageDeals.reduce((s: number, d: any) => s + d.value, 0);
          return (
            <div key={stage} className="flex-shrink-0 w-64 flex flex-col rounded-xl overflow-hidden border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/2">
              {/* Column header */}
              <div className={cn("bg-gradient-to-r p-3", sc.headerGrad)}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-xs font-bold", sc.headerText)}>{sc.label}</span>
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{stageDeals.length}</span>
                </div>
                {stageTotal > 0 && (
                  <p className="text-[11px] text-white/80 font-medium">${stageTotal.toLocaleString()}</p>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {stageDeals.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[11px] text-gray-400 dark:text-gray-600">{sc.emptyText}</p>
                  </div>
                ) : (
                  stageDeals.map((deal: any, idx: number) => (
                    <DealCard key={deal.id} deal={deal} idx={idx} />
                  ))
                )}
              </div>

              {/* Add button */}
              <div className="p-2.5 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => toast({ title: "Add deal", description: "Deal form coming soon." })}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-200 dark:border-white/10 text-[11px] text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add deal
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
