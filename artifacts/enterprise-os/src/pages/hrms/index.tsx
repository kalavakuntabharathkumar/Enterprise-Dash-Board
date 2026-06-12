import React, { useState } from "react";
import { useListEmployees } from "@workspace/api-client-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users, Plus, Search, Mail, Phone, Building2,
  CheckCircle2, XCircle, Clock, UserPlus,
  ChevronRight, MoreHorizontal, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const DEPT_COLORS: Record<string, string> = {
  Engineering:  "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  Marketing:    "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
  Sales:        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Finance:      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  HR:           "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  Operations:   "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  Legal:        "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  Design:       "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
};

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-purple-400 to-indigo-500",
  "from-cyan-400 to-blue-500",
  "from-green-400 to-emerald-500",
];

type ViewMode = "grid" | "list";
type FilterTab = "all" | "active" | "inactive";

export default function EmployeesPage() {
  const { data: employees, isLoading } = useListEmployees();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const { toast } = useToast();

  const filtered = employees?.filter(e => {
    const matchStatus = filter === "all" || e.status === filter;
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase()) ||
      e.position?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchDept && matchSearch;
  }) ?? [];

  const depts = ["all", ...Array.from(new Set(employees?.map(e => e.department).filter(Boolean) ?? []))];
  const activeCount = employees?.filter(e => e.status === "active").length ?? 0;
  const inactiveCount = employees?.filter(e => e.status !== "active").length ?? 0;

  const kpis = [
    { label: "Total Employees", value: employees?.length ?? 0, icon: Users, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400", sub: "across all departments" },
    { label: "Active", value: activeCount, icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", sub: "currently working" },
    { label: "Inactive", value: inactiveCount, icon: XCircle, color: "bg-red-50 dark:bg-red-500/10", iconColor: "text-red-600 dark:text-red-400", sub: "on leave or offboarded" },
    { label: "Departments", value: depts.length - 1, icon: Building2, color: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400", sub: "active teams" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
      <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_,i) => <div key={i} className="h-48 bg-gray-100 dark:bg-white/5 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your workforce across all departments.</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => toast({ title: "Add employee", description: "Employee form coming soon." })}
        >
          <UserPlus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* KPIs */}
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

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
          {(["all","active","inactive"] as FilterTab[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                filter === f ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              )}>
              {f}
            </button>
          ))}
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-300 outline-none">
          {depts.map(d => <option key={d} value={d}>{d === "all" ? "All departments" : d}</option>)}
        </select>
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
            className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No employees found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp, idx) => {
            const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            const deptColor = DEPT_COLORS[emp.department] || "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400";
            const isActive = emp.status === "active";
            return (
              <Link key={emp.id} to={`/hrms/employees/${emp.id}`}
                className="group bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-200 hover:-translate-y-0.5">
                {/* Top gradient bar with avatar inside */}
                <div className={cn("h-16 bg-gradient-to-r", gradient, "relative flex items-end px-4 pb-0")}>
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  <div className={cn("relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br border-2 border-white dark:border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-md translate-y-1/2", gradient)}>
                    {emp.name.slice(0,2).toUpperCase()}
                  </div>
                </div>
                <div className="px-4 pb-4 pt-8">
                  <div className="flex items-center justify-end mb-1">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1",
                      isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-400 animate-pulse" : "bg-gray-400")} />
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{emp.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-3">{emp.position}</p>
                  <span className={cn("inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3", deptColor)}>{emp.department}</span>
                  <div className="border-t border-gray-50 dark:border-white/5 pt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View profile <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-400">{filtered.length} employee{filtered.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}
