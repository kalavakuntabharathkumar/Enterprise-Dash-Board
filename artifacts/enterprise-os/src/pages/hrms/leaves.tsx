import React, { useState } from "react";
import { useListLeaves, useUpdateLeaveStatus, getListLeavesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, CalendarDays, Plus, Search, Download, Sun, Umbrella, Activity, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const LEAVE_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  annual:    { icon: Sun,          color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",   label: "Annual" },
  sick:      { icon: Activity,     color: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",           label: "Sick" },
  maternity: { icon: Heart,        color: "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",       label: "Maternity" },
  paternity: { icon: Heart,        color: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",       label: "Paternity" },
  unpaid:    { icon: Umbrella,     color: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400",           label: "Unpaid" },
  emergency: { icon: CalendarDays, color: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",       label: "Emergency" },
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; badge: string; label: string }> = {
  pending:  { icon: Clock,        badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", label: "Pending" },
  approved: { icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", label: "Approved" },
  rejected: { icon: XCircle,      badge: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20", label: "Rejected" },
};

function daysBetween(start: string, end: string) {
  const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export default function LeavesPage() {
  const { data: leaves, isLoading } = useListLeaves();
  const updateStatus = useUpdateLeaveStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleStatusUpdate = (id: number, status: string, name: string) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Request ${status}`, description: `${name}'s leave has been ${status}.` });
          queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
        },
        onError: () => toast({ title: "Error", description: "Failed to update.", variant: "destructive" }),
      }
    );
  };

  const filtered = leaves?.filter(l => {
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchSearch = !search || l.employee_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }) ?? [];

  const pending  = leaves?.filter(l => l.status === "pending").length ?? 0;
  const approved = leaves?.filter(l => l.status === "approved").length ?? 0;
  const rejected = leaves?.filter(l => l.status === "rejected").length ?? 0;

  const kpis = [
    { label: "Total Requests", value: leaves?.length ?? 0, icon: CalendarDays, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Pending Review", value: pending,  icon: Clock,        color: "bg-amber-50 dark:bg-amber-500/10",  iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "Approved",       value: approved, icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { label: "Rejected",       value: rejected, icon: XCircle,      color: "bg-red-50 dark:bg-red-500/10",      iconColor: "text-red-600 dark:text-red-400" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Leave Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Review and manage employee time-off requests.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => toast({ title: "New request", description: "Leave request form coming soon." })}>
          <Plus className="w-4 h-4" /> New Request
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
          <div className="flex gap-1 bg-gray-50 dark:bg-white/5 rounded-lg p-1">
            {["all","pending","approved","rejected"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                  statusFilter === f ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                )}>{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 min-w-[160px] max-w-xs ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5">
                {["Employee","Leave Type","Duration","Days","Reason","Status","Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(leave => {
                const lt = LEAVE_TYPE_CONFIG[leave.type] || { icon: CalendarDays, color: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400", label: leave.type };
                const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                const StatusIcon = sc.icon;
                const LtIcon = lt.icon;
                return (
                  <tr key={leave.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {leave.employee_name.slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{leave.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", lt.color)}>
                        <LtIcon className="w-3 h-3" />{lt.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                      {new Date(leave.start_date).toLocaleDateString("en",{month:"short",day:"numeric"})} — {new Date(leave.end_date).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{daysBetween(leave.start_date, leave.end_date)}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[180px]">
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={leave.reason}>{leave.reason || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", sc.badge)}>
                        <StatusIcon className="w-3 h-3" />{sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {leave.status === "pending" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStatusUpdate(leave.id, "approved", leave.employee_name)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(leave.id, "rejected", leave.employee_name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400"><CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No requests found</p></div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5">
          <p className="text-xs text-gray-400">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}
