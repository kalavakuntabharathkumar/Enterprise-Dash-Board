import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LifeBuoy, Plus, X, Monitor, Users, Package, DollarSign, AlertCircle, CheckCircle2, Clock, Search } from "lucide-react";

interface SupportRequest { id: number; employee_id: number; employee_name: string; request_type: string; title: string; description: string; status: string; priority: string; created_at: string; }
interface Employee { id: number; name: string; email: string; }

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  IT:            { icon: Monitor,     color: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",      label: "IT Request" },
  HR:            { icon: Users,       color: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400", label: "HR Request" },
  Asset:         { icon: Package,     color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",  label: "Asset Request" },
  Reimbursement: { icon: DollarSign,  color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", label: "Reimbursement" },
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  open:        { label: "Open",        badge: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",    icon: AlertCircle },
  in_progress: { label: "In Progress", badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", icon: Clock },
  resolved:    { label: "Resolved",    badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", icon: CheckCircle2 },
  closed:      { label: "Closed",      badge: "bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10", icon: X },
};

const PRIORITY_CONFIG: Record<string, string> = {
  low:    "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  high:   "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export default function SupportPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ request_type: "IT", title: "", description: "", priority: "medium" });

  const { data: requests = [], isLoading } = useQuery<SupportRequest[]>({
    queryKey: ["support"],
    queryFn: () => apiGet("/api/support"),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiGet("/api/employees"),
  });

  const myEmp = employees.find(e => e.email === user?.email);

  const createMutation = useMutation({
    mutationFn: (body: any) => apiPost("/api/support", body),
    onSuccess: () => {
      toast({ title: "Request submitted", description: "We'll get back to you shortly." });
      qc.invalidateQueries({ queryKey: ["support"] });
      setShowForm(false);
      setForm({ request_type: "IT", title: "", description: "", priority: "medium" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiPatch(`/api/support/${id}/status`, { status }),
    onSuccess: () => { toast({ title: "Status updated" }); qc.invalidateQueries({ queryKey: ["support"] }); },
  });

  const filtered = requests.filter(r => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.request_type.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const open = requests.filter(r => r.status === "open").length;
  const inProgress = requests.filter(r => r.status === "in_progress").length;
  const resolved = requests.filter(r => r.status === "resolved").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { toast({ title: "Please fill all fields", variant: "destructive" }); return; }
    if (!myEmp && !isAdmin) { toast({ title: "No linked employee profile", variant: "destructive" }); return; }
    const empId = myEmp?.id || employees[0]?.id;
    createMutation.mutate({ employee_id: empId, ...form });
  };

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Support & Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Submit IT, HR, asset, or reimbursement requests.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm shadow-indigo-600/20">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Open", value: open, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", icon: AlertCircle },
          { label: "In Progress", value: inProgress, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", icon: Clock },
          { label: "Resolved", value: resolved, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2 },
          { label: "Total", value: requests.length, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-white/5", icon: LifeBuoy },
        ].map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", k.bg)}>
              <Icon className={cn("w-5 h-5", k.color)} />
            </div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p></div>
          </div>
        ); })}
      </div>

      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-50 dark:bg-white/5 rounded-lg p-1">
            {["all","open","in_progress","resolved","closed"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all",
                  filter === f ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                )}>{f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 ml-auto max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..."
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <LifeBuoy className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
            <p className="text-sm text-gray-400">No requests found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {filtered.map(r => {
              const tc = TYPE_CONFIG[r.request_type] || TYPE_CONFIG.IT;
              const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.open;
              const StatusIcon = sc.icon;
              const TypeIcon = tc.icon;
              return (
                <div key={r.id} className="px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", tc.color.split(" ").slice(1).join(" "))}>
                      <TypeIcon className={cn("w-4 h-4", tc.color.split(" ")[0])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", tc.color)}>{tc.label}</span>
                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", PRIORITY_CONFIG[r.priority])}>{r.priority}</span>
                            {isAdmin && <span className="text-[10px] text-gray-400">· {r.employee_name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border", sc.badge)}>
                            <StatusIcon className="w-3 h-3" />{sc.label}
                          </span>
                          {isAdmin && r.status !== "closed" && (
                            <select onChange={e => updateMutation.mutate({ id: r.id, status: e.target.value })} defaultValue=""
                              className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 outline-none">
                              <option value="" disabled>Update</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{r.description}</p>
                      <p className="text-[11px] text-gray-400 mt-1.5">{new Date(r.created_at).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/8">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">New Support Request</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Request Type</label>
                  <select value={form.request_type} onChange={e => setForm(f => ({ ...f, request_type: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400">
                    {Object.keys(TYPE_CONFIG).map(k => <option key={k} value={k}>{TYPE_CONFIG[k].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief title..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 placeholder:text-gray-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe your request in detail..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 resize-none placeholder:text-gray-400" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {createMutation.isPending ? "Submitting…" : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
