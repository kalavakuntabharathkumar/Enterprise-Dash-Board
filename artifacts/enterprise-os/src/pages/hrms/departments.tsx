import React, { useState } from "react";
import { useListDepartments } from "@workspace/api-client-react";
import { Building2, Users, UserCheck, Plus, TrendingUp, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AddDepartmentModal } from "@/components/modals/AddDepartmentModal";

const DEPT_THEMES: Record<string, { gradient: string; light: string; icon: string; accent: string }> = {
  Engineering:  { gradient: "from-indigo-500 to-violet-600",  light: "bg-indigo-50 dark:bg-indigo-500/10",  icon: "text-indigo-600 dark:text-indigo-400",  accent: "border-indigo-100 dark:border-indigo-500/20" },
  Marketing:    { gradient: "from-pink-500 to-rose-600",      light: "bg-pink-50 dark:bg-pink-500/10",      icon: "text-pink-600 dark:text-pink-400",      accent: "border-pink-100 dark:border-pink-500/20" },
  Sales:        { gradient: "from-emerald-500 to-teal-600",   light: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400", accent: "border-emerald-100 dark:border-emerald-500/20" },
  Finance:      { gradient: "from-amber-500 to-orange-600",   light: "bg-amber-50 dark:bg-amber-500/10",    icon: "text-amber-600 dark:text-amber-400",    accent: "border-amber-100 dark:border-amber-500/20" },
  HR:           { gradient: "from-purple-500 to-indigo-600",  light: "bg-purple-50 dark:bg-purple-500/10",  icon: "text-purple-600 dark:text-purple-400",  accent: "border-purple-100 dark:border-purple-500/20" },
  Operations:   { gradient: "from-blue-500 to-cyan-600",      light: "bg-blue-50 dark:bg-blue-500/10",      icon: "text-blue-600 dark:text-blue-400",      accent: "border-blue-100 dark:border-blue-500/20" },
  Legal:        { gradient: "from-rose-500 to-red-600",       light: "bg-rose-50 dark:bg-rose-500/10",      icon: "text-rose-600 dark:text-rose-400",      accent: "border-rose-100 dark:border-rose-500/20" },
  Design:       { gradient: "from-cyan-500 to-blue-600",      light: "bg-cyan-50 dark:bg-cyan-500/10",      icon: "text-cyan-600 dark:text-cyan-400",      accent: "border-cyan-100 dark:border-cyan-500/20" },
};

const DEFAULT_THEME = { gradient: "from-gray-400 to-gray-600", light: "bg-gray-50 dark:bg-white/5", icon: "text-gray-600 dark:text-gray-400", accent: "border-gray-100 dark:border-white/8" };

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useListDepartments();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const filtered = departments?.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.head?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const totalEmployees = departments?.reduce((s, d) => s + (d.employee_count || 0), 0) ?? 0;
  const maxCount = Math.max(...(departments?.map(d => d.employee_count || 0) ?? [1]));

  const kpis = [
    { label: "Departments", value: departments?.length ?? 0, icon: Building2, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Total Employees", value: totalEmployees, icon: Users, color: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
    { label: "Avg Team Size", value: departments?.length ? Math.round(totalEmployees / departments.length) : 0, icon: TrendingUp, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { label: "Dept Heads", value: departments?.filter(d => d.head).length ?? 0, icon: UserCheck, color: "bg-purple-50 dark:bg-purple-500/10", iconColor: "text-purple-600 dark:text-purple-400" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
      <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_,i) => <div key={i} className="h-44 bg-gray-100 dark:bg-white/5 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Departments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Organizational structure across all teams.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* KPIs */}
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

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments..."
          className="flex-1 text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
      </div>

      {/* Department cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No departments found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((dept) => {
            const theme = DEPT_THEMES[dept.name] || DEFAULT_THEME;
            const pct = maxCount > 0 ? ((dept.employee_count || 0) / maxCount) * 100 : 0;
            const initials = dept.name.slice(0, 2).toUpperCase();
            return (
              <div key={dept.id}
                className={cn("group bg-white dark:bg-white/3 border rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer", theme.accent)}>
                {/* Top colored strip */}
                <div className={cn("h-2 bg-gradient-to-r w-full", theme.gradient)} />
                <div className="p-5">
                  {/* Icon + name row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0", theme.gradient)}>
                      {initials}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-base mb-1 leading-tight">{dept.name}</p>
                  {dept.head ? (
                    <div className="flex items-center gap-1.5 mb-4">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{dept.head}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-600 italic mb-4">No head assigned</p>
                  )}

                  {/* Employee bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" /> Employees
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{dept.employee_count ?? 0}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", theme.gradient)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AddDepartmentModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
