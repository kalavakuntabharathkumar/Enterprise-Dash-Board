import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { Search, Mail, Phone, MapPin, Building2, Users } from "lucide-react";

interface Employee {
  id: number; name: string; email: string; phone?: string; department: string;
  position: string; status: string; location?: string;
}

const DEPT_COLORS: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  Sales:       "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Marketing:   "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
  HR:          "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  Finance:     "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  Operations:  "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
};

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-600", "from-emerald-500 to-teal-600",
  "from-pink-500 to-rose-600",    "from-amber-500 to-orange-600",
  "from-blue-500 to-cyan-600",    "from-purple-500 to-fuchsia-600",
];

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["employees-directory"],
    queryFn: () => apiGet("/api/employees"),
  });

  const depts = ["all", ...Array.from(new Set(employees.map(e => e.department)))];

  const filtered = employees.filter(e => {
    const matchDept = dept === "all" || e.department === dept;
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Team Directory</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{employees.length} colleagues across {depts.length - 1} departments.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white dark:bg-white/3 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role, or email..."
            className="flex-1 text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
        </div>
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 rounded-xl p-1 flex-wrap">
          {depts.map(d => (
            <button key={d} onClick={() => setDept(d)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                dept === d ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              )}>{d}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {(["grid", "list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn("p-2 rounded-lg text-xs transition-all", view === v ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300")}>
              {v === "grid" ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3A1.5 1.5 0 0 1 15 10.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5v-3z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-sm text-gray-400">No employees found</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp, i) => {
            const initials = emp.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
            const grad = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
            const dc = DEPT_COLORS[emp.department] || "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400";
            return (
              <div key={emp.id} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-5 hover:border-gray-200 dark:hover:border-white/15 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0", grad)}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{emp.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{emp.position}</p>
                    <span className={cn("mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", dc)}>
                      <Building2 className="w-2.5 h-2.5" />{emp.department}
                    </span>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                    emp.status === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400")}>
                    {emp.status === "active" ? "Active" : "On Leave"}
                  </span>
                </div>
                <div className="mt-4 space-y-1.5">
                  <a href={`mailto:${emp.email}`} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-300 dark:text-white/20" />{emp.email}
                  </a>
                  {emp.location && (
                    <p className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-300 dark:text-white/20" />{emp.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-50 dark:border-white/5">
              {["Employee","Department","Contact","Location","Status"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((emp, i) => {
                const initials = emp.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                const grad = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
                const dc = DEPT_COLORS[emp.department] || "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400";
                return (
                  <tr key={emp.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5"><div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0", grad)}>{initials}</div>
                      <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{emp.name}</p><p className="text-xs text-gray-400">{emp.position}</p></div>
                    </div></td>
                    <td className="px-5 py-3.5"><span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", dc)}>{emp.department}</span></td>
                    <td className="px-5 py-3.5"><a href={`mailto:${emp.email}`} className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{emp.email}</a></td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{emp.location || "—"}</td>
                    <td className="px-5 py-3.5"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      emp.status === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-600")}>{emp.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
