import React, { useState } from "react";
import { useListLeads } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Target, Search, Plus, TrendingUp, UserCheck,
  DollarSign, Star, ChevronRight, Mail, Phone,
  Building2, ArrowUpRight, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STAGE_CONFIG: Record<string, { label: string; color: string; step: number; barColor: string }> = {
  prospect:    { label: "Prospect",    color: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",             step: 1, barColor: "bg-gray-300 dark:bg-white/20" },
  contacted:   { label: "Contacted",   color: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",       step: 2, barColor: "bg-blue-400" },
  qualified:   { label: "Qualified",   color: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20", step: 3, barColor: "bg-indigo-500" },
  proposal:    { label: "Proposal",    color: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20", step: 4, barColor: "bg-purple-500" },
  negotiation: { label: "Negotiation", color: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",   step: 5, barColor: "bg-amber-400" },
  won:         { label: "Won",         color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", step: 6, barColor: "bg-emerald-400" },
  lost:        { label: "Lost",        color: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",               step: 0, barColor: "bg-red-400" },
};

const AVATAR_GRADIENTS = ["from-indigo-400 to-violet-500","from-blue-400 to-cyan-500","from-emerald-400 to-teal-500","from-amber-400 to-orange-500","from-rose-400 to-pink-500","from-purple-400 to-indigo-500"];

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const { data: leads, isLoading } = useListLeads({ search: search || undefined });
  const { toast } = useToast();

  const filtered = leads?.filter(l => stageFilter === "all" || l.stage === stageFilter) ?? [];

  const totalValue = leads?.reduce((s, l) => s + (l.value || 0), 0) ?? 0;
  const wonLeads   = leads?.filter(l => l.stage === "won").length ?? 0;
  const hotLeads   = leads?.filter(l => ["negotiation","proposal"].includes(l.stage)).length ?? 0;
  const convRate   = leads?.length ? Math.round((wonLeads / leads.length) * 100) : 0;

  const kpis = [
    { label: "Total Leads",    value: leads?.length ?? 0, icon: Target,    color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Pipeline Value", value: `$${(totalValue/1000).toFixed(0)}k`, icon: DollarSign, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { label: "Hot Leads",      value: hotLeads, icon: Flame, color: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "Won",            value: wonLeads, icon: Star,  color: "bg-purple-50 dark:bg-purple-500/10", iconColor: "text-purple-600 dark:text-purple-400" },
  ];

  const STAGES = ["all","prospect","contacted","qualified","proposal","negotiation","won","lost"];

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track and manage your sales prospects through the pipeline.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => toast({ title: "Add lead", description: "Lead form coming soon." })}>
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
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
          <div className="flex gap-1 bg-gray-50 dark:bg-white/5 rounded-lg p-1 overflow-x-auto">
            {STAGES.map(s => (
              <button key={s} onClick={() => setStageFilter(s)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all capitalize whitespace-nowrap",
                  stageFilter === s ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                )}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 min-w-[160px] max-w-xs ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5">
                {["Lead","Company","Stage Progress","Value","Source","Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, idx) => {
                const sc = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.prospect;
                const progress = (sc.step / 6) * 100;
                const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                return (
                  <tr key={lead.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0", gradient)}>
                          {lead.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{lead.name}</p>
                          <p className="text-[11px] text-gray-400">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {lead.company || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border", sc.color)}>{sc.label}</span>
                        </div>
                        <div className="h-1 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", sc.barColor)} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">${(lead.value || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{lead.source || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          onClick={() => toast({ title: "Email sent", description: `Email drafted for ${lead.name}.` })}>
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => toast({ title: "View lead", description: `Opening ${lead.name}'s profile.` })}>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400"><Target className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No leads found</p></div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5">
          <p className="text-xs text-gray-400">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}
