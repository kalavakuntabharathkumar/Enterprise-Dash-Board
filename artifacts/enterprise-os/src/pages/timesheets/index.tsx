import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Clock, Plus, X, Calendar, TrendingUp, CheckCircle2, Briefcase } from "lucide-react";

interface Timesheet { id: number; employee_id: number; employee_name: string; project_id?: number; project_name?: string; date: string; hours: number; description?: string; billable: boolean; status: string; }
interface Project { id: number; name: string; }
interface Employee { id: number; name: string; email: string; }

function weekRange(d: Date) {
  const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { mon, sun };
}

function fmtDate(d: Date) { return d.toISOString().split("T")[0]; }

export default function TimesheetsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], hours: 8, description: "", project_id: "", billable: true });

  const today = new Date();
  const targetDate = new Date(today); targetDate.setDate(today.getDate() + weekOffset * 7);
  const { mon, sun } = weekRange(targetDate);

  const { data: timesheets = [], isLoading } = useQuery<Timesheet[]>({
    queryKey: ["timesheets"],
    queryFn: () => apiGet("/api/timesheets"),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects-list"],
    queryFn: () => apiGet("/api/projects"),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => apiGet("/api/employees"),
    enabled: isAdmin,
  });

  const myEmp = employees.find(e => e.email === user?.email);

  const weekEntries = timesheets.filter(t => {
    const d = new Date(t.date);
    return d >= mon && d <= sun;
  });

  const totalHours = timesheets.reduce((s, t) => s + t.hours, 0);
  const weekHours  = weekEntries.reduce((s, t) => s + t.hours, 0);
  const billable   = timesheets.filter(t => t.billable).reduce((s, t) => s + t.hours, 0);

  const createMutation = useMutation({
    mutationFn: (body: any) => apiPost("/api/timesheets", body),
    onSuccess: () => {
      toast({ title: "Hours logged" });
      qc.invalidateQueries({ queryKey: ["timesheets"] });
      setShowForm(false);
      setForm({ date: new Date().toISOString().split("T")[0], hours: 8, description: "", project_id: "", billable: true });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/timesheets/${id}`),
    onSuccess: () => { toast({ title: "Entry removed" }); qc.invalidateQueries({ queryKey: ["timesheets"] }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const empId = myEmp?.id || (isAdmin && employees[0]?.id);
    if (!empId) { toast({ title: "No linked employee found", variant: "destructive" }); return; }
    createMutation.mutate({ employee_id: empId, date: form.date, hours: form.hours, description: form.description, project_id: form.project_id ? +form.project_id : undefined, billable: form.billable });
  };

  const kpis = [
    { label: "This Week", value: `${weekHours}h`, icon: Calendar, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
    { label: "Total Logged", value: `${totalHours}h`, icon: Clock, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Billable Hours", value: `${billable}h`, icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Approved", value: timesheets.filter(t => t.status === "approved").reduce((s, t) => s + t.hours, 0) + "h", icon: CheckCircle2, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-white/5" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Timesheets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track and log your working hours per project.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm shadow-indigo-600/20">
          <Plus className="w-4 h-4" /> Log Hours
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
            </div>
          </div>
        ); })}
      </div>

      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 transition-colors">←</button>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              {mon.toLocaleDateString("en", { month: "short", day: "numeric" })} – {sun.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 transition-colors">→</button>
            {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Today</button>}
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{weekHours}h this week</span>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-50 dark:border-white/5">
          {days.map(d => {
            const isToday = fmtDate(d) === fmtDate(today);
            const dayEntries = weekEntries.filter(t => t.date === fmtDate(d));
            const dayHours = dayEntries.reduce((s, t) => s + t.hours, 0);
            return (
              <div key={d.toISOString()} className={cn("p-3 border-r border-gray-50 dark:border-white/5 last:border-r-0 min-h-[80px]",
                isToday && "bg-indigo-50/40 dark:bg-indigo-500/5")}>
                <p className={cn("text-[11px] font-semibold mb-1", isToday ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400")}>
                  {d.toLocaleDateString("en", { weekday: "short" })}
                </p>
                <p className={cn("text-xs font-bold mb-2", isToday ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300")}>{d.getDate()}</p>
                {dayHours > 0 && <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded px-1.5 py-0.5 w-fit">{dayHours}h</div>}
              </div>
            );
          })}
        </div>

        {weekEntries.length === 0 ? (
          <div className="py-10 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-white/20" />
            <p className="text-sm text-gray-400">No entries this week</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Log your first entry →</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-50 dark:border-white/5">
                {["Date","Project","Hours","Description","Billable","Status",""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {weekEntries.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                  <tr key={t.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{new Date(t.date + "T12:00:00").toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"})}</td>
                    <td className="px-5 py-3.5"><span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.project_name || "General"}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{t.hours}h</span></td>
                    <td className="px-5 py-3.5 max-w-[200px]"><p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.description || "—"}</p></td>
                    <td className="px-5 py-3.5"><span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", t.billable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-gray-50 text-gray-500")}>{t.billable ? "Yes" : "No"}</span></td>
                    <td className="px-5 py-3.5"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      t.status === "approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400")}>{t.status}</span></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => deleteMutation.mutate(t.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 hover:text-red-500 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/8">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Log Hours</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Hours</label>
                  <input type="number" min="0.5" max="24" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: +e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Project</label>
                <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400">
                  <option value="">General / No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What did you work on?"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 resize-none placeholder:text-gray-400" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.billable} onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))} className="w-4 h-4 rounded accent-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Billable hours</span>
              </label>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {createMutation.isPending ? "Saving…" : "Log Hours"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
