import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Clock, CheckCircle2, XCircle, Plus, X,
  Sun, Activity, Umbrella, Heart, Briefcase, Home
} from "lucide-react";

const LEAVE_TYPES = [
  { value: "Sick Leave", label: "Sick Leave", icon: Activity, color: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400" },
  { value: "Casual Leave", label: "Casual Leave", icon: Sun, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  { value: "Paid Leave", label: "Paid Leave", icon: Briefcase, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" },
  { value: "Work From Home", label: "Work From Home", icon: Home, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { value: "Annual Leave", label: "Annual Leave", icon: Sun, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  { value: "Maternity Leave", label: "Maternity Leave", icon: Heart, color: "text-pink-600 bg-pink-50 dark:bg-pink-500/10 dark:text-pink-400" },
];

const STATUS_CONFIG: Record<string, { icon: React.ElementType; badge: string; label: string }> = {
  pending:  { icon: Clock,        badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",   label: "Pending" },
  approved: { icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", label: "Approved" },
  rejected: { icon: XCircle,      badge: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",         label: "Rejected" },
};

function daysBetween(start: string, end: string) {
  const d = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return d;
}

interface Leave { id: number; employee_id: number; employee_name: string; type: string; start_date: string; end_date: string; status: string; reason: string; }

export default function MyLeavesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ type: "Sick Leave", start_date: "", end_date: "", reason: "" });

  const { data: allLeaves = [], isLoading } = useQuery<Leave[]>({
    queryKey: ["my-leaves"],
    queryFn: () => apiGet("/api/leaves"),
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["employees"],
    queryFn: () => apiGet("/api/employees"),
  });

  const myEmp = employees.find((e: any) => e.email === user?.email);

  const myLeaves = allLeaves.filter(l =>
    l.employee_name === user?.name || (myEmp && l.employee_id === myEmp.id)
  );

  const filtered = filter === "all" ? myLeaves : myLeaves.filter(l => l.status === filter);

  const pending  = myLeaves.filter(l => l.status === "pending").length;
  const approved = myLeaves.filter(l => l.status === "approved").length;
  const usedDays = myLeaves.filter(l => l.status === "approved").reduce((s, l) => s + daysBetween(l.start_date, l.end_date), 0);
  const balance  = 24 - usedDays;

  const applyMutation = useMutation({
    mutationFn: (body: any) => apiPost("/api/leaves", body),
    onSuccess: () => {
      toast({ title: "Leave applied", description: "Your request has been submitted for approval." });
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
      setShowForm(false);
      setForm({ type: "Sick Leave", start_date: "", end_date: "", reason: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/leaves/${id}/status`, { status: "rejected" }),
    onSuccess: () => {
      toast({ title: "Request cancelled" });
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date || !form.reason.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" }); return;
    }
    if (!myEmp) {
      toast({ title: "Employee profile not found", description: "Contact HR to link your account.", variant: "destructive" }); return;
    }
    applyMutation.mutate({ employee_id: myEmp.id, ...form });
  };

  const kpis = [
    { label: "Leave Balance", value: `${balance} days`, sub: "Annual leave remaining", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", icon: CalendarDays },
    { label: "Used This Year", value: `${usedDays} days`, sub: `${approved} approved`, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2 },
    { label: "Pending Approval", value: pending, sub: "Awaiting review", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", icon: Clock },
    { label: "Total Requests", value: myLeaves.length, sub: "All time", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-white/5", icon: Briefcase },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">My Leave Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your time-off requests and track leave balance.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm shadow-indigo-600/20">
          <Plus className="w-4 h-4" /> Apply Leave
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", k.bg)}>
              <Icon className={cn("w-5 h-5", k.color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{k.sub}</p>
            </div>
          </div>
        ); })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {LEAVE_TYPES.slice(0, 3).map(lt => {
          const Icon = lt.icon;
          const used = myLeaves.filter(l => l.type === lt.value && l.status === "approved").reduce((s, l) => s + daysBetween(l.start_date, l.end_date), 0);
          const max = lt.value === "Sick Leave" ? 12 : lt.value === "Work From Home" ? 52 : 8;
          return (
            <div key={lt.value} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", lt.color.split(" ").slice(1).join(" "))}>
                  <Icon className={cn("w-4 h-4", lt.color.split(" ")[0])} />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{lt.label}</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{used}</span>
                <span className="text-xs text-gray-400">/ {max} days</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-white/8 rounded-full h-1.5">
                <div className={cn("h-1.5 rounded-full transition-all", lt.color.split(" ")[0].replace("text-", "bg-"))} style={{ width: `${Math.min((used / max) * 100, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-3">
          <div className="flex gap-1 bg-gray-50 dark:bg-white/5 rounded-lg p-1">
            {["all","pending","approved","rejected"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                  filter === f ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                )}>{f}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
            <p className="text-sm text-gray-400">No leave requests found</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Apply for leave →</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-white/5">
                  {["Type","Duration","Days","Reason","Status",""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(leave => {
                  const lt = LEAVE_TYPES.find(t => t.value === leave.type);
                  const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                  const StatusIcon = sc.icon;
                  const days = daysBetween(leave.start_date, leave.end_date);
                  return (
                    <tr key={leave.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", lt?.color || "bg-gray-50 text-gray-600")}>
                          {lt && <lt.icon className="w-3 h-3" />}{leave.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                        {new Date(leave.start_date).toLocaleDateString("en",{month:"short",day:"numeric"})} — {new Date(leave.end_date).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{days} day{days !== 1 ? "s" : ""}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={leave.reason}>{leave.reason}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", sc.badge)}>
                          <StatusIcon className="w-3 h-3" />{sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {leave.status === "pending" && (
                          <button onClick={() => cancelMutation.mutate(leave.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 transition-all flex items-center gap-1">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/8">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Apply for Leave</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Leave Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 dark:focus:border-indigo-500">
                  {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Reason</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Briefly describe the reason for your leave..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 resize-none placeholder:text-gray-400" />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={applyMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {applyMutation.isPending ? "Submitting…" : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
