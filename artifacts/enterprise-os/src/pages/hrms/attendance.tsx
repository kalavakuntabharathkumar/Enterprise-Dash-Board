import React, { useState } from "react";
import { useListAttendance } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Clock, CheckCircle2, XCircle, AlertTriangle,
  Search, Calendar, UserCheck, TrendingUp, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; badge: string; dot: string }> = {
  present: { label: "Present", icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", dot: "bg-emerald-400" },
  absent:  { label: "Absent",  icon: XCircle,      badge: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",                         dot: "bg-red-400" },
  late:    { label: "Late",    icon: AlertTriangle, badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",             dot: "bg-amber-400" },
  half_day:{ label: "Half Day",icon: Clock,         badge: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",                  dot: "bg-blue-400" },
};

function fmtTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmtHours(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) return null;
  const hrs = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000;
  return hrs > 0 ? `${hrs.toFixed(1)}h` : null;
}

export default function AttendancePage() {
  const { data: attendance, isLoading } = useListAttendance();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const filtered = attendance?.filter(r => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSearch = !search || r.employee_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }) ?? [];

  const present  = attendance?.filter(r => r.status === "present").length ?? 0;
  const absent   = attendance?.filter(r => r.status === "absent").length ?? 0;
  const late     = attendance?.filter(r => r.status === "late").length ?? 0;
  const total    = attendance?.length ?? 0;
  const rate     = total > 0 ? Math.round((present / total) * 100) : 0;

  const kpis = [
    { label: "Present Today", value: present, icon: UserCheck, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { label: "Absent",        value: absent,  icon: XCircle,   color: "bg-red-50 dark:bg-red-500/10",         iconColor: "text-red-600 dark:text-red-400" },
    { label: "Late Arrivals", value: late,    icon: AlertTriangle, color: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "On-time Rate",  value: `${rate}%`, icon: TrendingUp, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Daily check-in/out tracking and workforce presence.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs"
          onClick={() => toast({ title: "Export", description: "Exporting attendance report…" })}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", k.color)}>
                <Icon className={cn("w-4.5 h-4.5", k.iconColor)} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-50 dark:bg-white/5 rounded-lg p-1">
            {["all","present","absent","late"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                  statusFilter === f ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                )}>{f}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 min-w-[180px] max-w-xs ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5">
                {["Date","Employee","Check In","Check Out","Hours","Status"].map((h, i) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
                const StatusIcon = sc.icon;
                const hours = fmtHours(r.check_in, r.check_out);
                return (
                  <tr key={r.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {new Date(r.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {r.employee_name.slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.check_in ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-2 py-0.5 rounded-md text-gray-700 dark:text-gray-300">
                          <Clock className="w-3 h-3 text-emerald-500" /> {fmtTime(r.check_in)}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.check_out ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-2 py-0.5 rounded-md text-gray-700 dark:text-gray-300">
                          <Clock className="w-3 h-3 text-red-400" /> {fmtTime(r.check_out)}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {hours ? (
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{hours}</span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", sc.badge)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400"><Clock className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No records found</p></div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5">
          <p className="text-xs text-gray-400">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </div>
  );
}
