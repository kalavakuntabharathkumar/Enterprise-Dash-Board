import React, { useState } from "react";
import { useListLeaves, getListLeavesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, Clock, CalendarDays, Plus, Search,
  Sun, Umbrella, Activity, Heart, ChevronDown, ChevronRight,
  HistoryIcon, MessageSquare, UserCheck, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

// ── Type configs ──────────────────────────────────────────────────────────────

const LEAVE_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  annual:    { icon: Sun,          color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",   label: "Annual" },
  sick:      { icon: Activity,     color: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",           label: "Sick" },
  maternity: { icon: Heart,        color: "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",       label: "Maternity" },
  paternity: { icon: Heart,        color: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",       label: "Paternity" },
  unpaid:    { icon: Umbrella,     color: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400",           label: "Unpaid" },
  emergency: { icon: CalendarDays, color: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",       label: "Emergency" },
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; badge: string; label: string }> = {
  pending:            { icon: Clock,        badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",     label: "Pending" },
  pending_department: { icon: Clock,        badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",     label: "Dept Review" },
  pending_hr:         { icon: UserCheck,    badge: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",           label: "HR Review" },
  approved:           { icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", label: "Approved" },
  rejected:           { icon: XCircle,      badge: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",                 label: "Rejected" },
};

const ACTION_LOG_LABELS: Record<string, { label: string; color: string }> = {
  submitted:       { label: "Submitted",           color: "text-indigo-600 dark:text-indigo-400" },
  approved_stage1: { label: "Approved by Dept",    color: "text-blue-600 dark:text-blue-400" },
  approved_final:  { label: "Fully Approved",      color: "text-emerald-600 dark:text-emerald-400" },
  rejected:        { label: "Rejected",            color: "text-red-600 dark:text-red-400" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(start: string, end: string) {
  const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return `${days} day${days !== 1 ? "s" : ""}`;
}

function isActionable(status: string) {
  return status === "pending" || status === "pending_department" || status === "pending_hr";
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function leaveAction(id: number, action: string, comments?: string) {
  const token = localStorage.getItem("enterprise_os_token");
  const res = await fetch(`/api/leaves/${id}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, comments }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Action failed");
  }
  return res.json();
}

async function fetchLeaveLogs(id: number) {
  const token = localStorage.getItem("enterprise_os_token");
  const res = await fetch(`/api/leaves/${id}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// ── Workflow log drawer (per row) ─────────────────────────────────────────────

function WorkflowHistory({ leaveId, open }: { leaveId: number; open: boolean }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["leave-logs", leaveId],
    queryFn: () => fetchLeaveLogs(leaveId),
    enabled: open,
  });

  if (!open) return null;

  return (
    <div className="px-5 pb-4 pt-0 bg-gray-50/80 dark:bg-white/2 border-t border-gray-100 dark:border-white/5">
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 pt-3">
        Workflow History
      </p>
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-gray-400">No history yet.</p>
      ) : (
        <ol className="space-y-2">
          {logs.map((log: any, i: number) => {
            const meta = ACTION_LOG_LABELS[log.action] || { label: log.action, color: "text-gray-500" };
            return (
              <li key={log.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/20 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className={cn("text-xs font-semibold", meta.color)}>{meta.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400"> — {log.performed_by_name}</span>
                  {log.comments && (
                    <span className="text-xs text-gray-500 dark:text-gray-400"> · "{log.comments}"</span>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ── Action buttons with inline comment input ──────────────────────────────────

function ActionCell({
  leave,
  canApprove,
  onAction,
}: {
  leave: any;
  canApprove: boolean;
  onAction: (id: number, action: string, comments?: string) => void;
}) {
  const [showComment, setShowComment] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");

  if (!isActionable(leave.status) || !canApprove) return null;

  const handleSubmit = (action: "approve" | "reject") => {
    onAction(leave.id, action, comment.trim() || undefined);
    setShowComment(null);
    setComment("");
  };

  if (showComment) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <input
          autoFocus
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add comment (optional)…"
          className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 outline-none focus:border-indigo-400"
          onKeyDown={e => e.key === "Enter" && handleSubmit(showComment)}
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSubmit(showComment)}
            className={cn(
              "flex-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-colors",
              showComment === "approve"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-400"
            )}
          >
            Confirm {showComment === "approve" ? "Approve" : "Reject"}
          </button>
          <button
            onClick={() => { setShowComment(null); setComment(""); }}
            className="text-[11px] text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setShowComment("approve")}
        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        title="Approve"
      >
        <CheckCircle2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => setShowComment("reject")}
        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        title="Reject"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeavesPage() {
  const { data: leaves, isLoading } = useListLeaves();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canApprove = hasPermission("approve_leave");

  const actionMutation = useMutation({
    mutationFn: ({ id, action, comments }: { id: number; action: string; comments?: string }) =>
      leaveAction(id, action, comments),
    onSuccess: (data) => {
      const label = data.status === "pending_hr" ? "forwarded to HR"
        : data.status === "approved" ? "approved"
        : "rejected";
      toast({ title: `Leave ${label}`, description: `${data.employee_name}'s leave has been ${label}.` });
      queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["leave-logs", data.id] });
    },
    onError: (err: any) => {
      toast({ title: "Action failed", description: err.message || "Could not update leave.", variant: "destructive" });
    },
  });

  const toggleHistory = (id: number) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = leaves?.filter(l => {
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchSearch = !search || l.employee_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }) ?? [];

  const byStatus = (s: string) => leaves?.filter(l => l.status === s).length ?? 0;
  const pending = (byStatus("pending") + byStatus("pending_department") + byStatus("pending_hr"));
  const approved = byStatus("approved");
  const rejected = byStatus("rejected");

  const kpis = [
    { label: "Total Requests", value: leaves?.length ?? 0, icon: CalendarDays, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Pending Review",  value: pending,   icon: Clock,        color: "bg-amber-50 dark:bg-amber-500/10",   iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "Approved",        value: approved,  icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { label: "Rejected",        value: rejected,  icon: XCircle,      color: "bg-red-50 dark:bg-red-500/10",       iconColor: "text-red-600 dark:text-red-400" },
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
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Review and manage employee time-off requests.
            {canApprove && (
              <span className="ml-2 inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                <Shield className="w-3 h-3" /> Approval access
              </span>
            )}
          </p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => toast({ title: "New request", description: "Leave request form coming soon." })}
        >
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", k.color)}>
              <Icon className={cn("w-4 h-4", k.iconColor)} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p>
            </div>
          </div>
        ); })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
        {/* Filters */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-50 dark:bg-white/5 rounded-lg p-1">
            {["all", "pending_department", "pending_hr", "approved", "rejected"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all",
                  statusFilter === f
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                )}>
                {f === "all" ? "All"
                  : f === "pending_department" ? "Dept Review"
                  : f === "pending_hr" ? "HR Review"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 min-w-[160px] max-w-xs ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…"
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5">
                {["Employee","Leave Type","Duration","Days","Reason","Stage","Actions",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(leave => {
                const lt = LEAVE_TYPE_CONFIG[leave.type] || { icon: CalendarDays, color: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400", label: leave.type };
                const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                const StatusIcon = sc.icon;
                const LtIcon = lt.icon;
                const histOpen = expandedHistory.has(leave.id);

                return (
                  <React.Fragment key={leave.id}>
                    <tr className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {leave.employee_name.slice(0,2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{leave.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", lt.color)}>
                          <LtIcon className="w-3 h-3" />{lt.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(leave.start_date).toLocaleDateString("en",{month:"short",day:"numeric"})} — {new Date(leave.end_date).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{daysBetween(leave.start_date, leave.end_date)}</span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={leave.reason}>{leave.reason || "—"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", sc.badge)}>
                          <StatusIcon className="w-3 h-3" />{sc.label}
                        </span>
                        {leave.current_approver_role && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 ml-0.5">
                            → {leave.current_approver_role.replace("_", " ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <ActionCell
                          leave={leave}
                          canApprove={canApprove}
                          onAction={(id, action, comments) =>
                            actionMutation.mutate({ id, action, comments })
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleHistory(leave.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          title="Workflow history"
                        >
                          {histOpen
                            ? <ChevronDown className="w-3.5 h-3.5" />
                            : <HistoryIcon className="w-3.5 h-3.5" />
                          }
                        </button>
                      </td>
                    </tr>
                    {histOpen && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <WorkflowHistory leaveId={leave.id} open={histOpen} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No requests found</p>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5">
          <p className="text-xs text-gray-400">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}
