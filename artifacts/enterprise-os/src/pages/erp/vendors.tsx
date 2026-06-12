import React, { useState } from "react";
import { useListVendors } from "@workspace/api-client-react";
import {
  Store, Plus, Search, Mail, Phone, CheckCircle2,
  XCircle, Package, Tag, ExternalLink, LayoutGrid, List, Building2, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_THEMES: Record<string, { color: string; bg: string }> = {
  Technology:   { color: "text-indigo-700 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  Manufacturing:{ color: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-500/10" },
  Logistics:    { color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10" },
  Services:     { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  Consulting:   { color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
  Marketing:    { color: "text-pink-700 dark:text-pink-400",     bg: "bg-pink-50 dark:bg-pink-500/10" },
  Finance:      { color: "text-cyan-700 dark:text-cyan-400",     bg: "bg-cyan-50 dark:bg-cyan-500/10" },
  Legal:        { color: "text-rose-700 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-500/10" },
};

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500","from-blue-400 to-cyan-500","from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500","from-rose-400 to-pink-500","from-purple-400 to-indigo-500",
  "from-cyan-400 to-blue-500","from-green-400 to-emerald-500",
];

const DEFAULT_CATEGORY = { color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-white/5" };

type ViewMode = "grid" | "list";

export default function VendorsPage() {
  const { data: vendors, isLoading } = useListVendors();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"inactive">("all");
  const [view, setView] = useState<ViewMode>("grid");
  const { toast } = useToast();

  const filtered = vendors?.filter(v => {
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }) ?? [];

  const activeCount   = vendors?.filter(v => v.status === "active").length ?? 0;
  const inactiveCount = vendors?.filter(v => v.status !== "active").length ?? 0;
  const categories    = new Set(vendors?.map(v => v.category).filter(Boolean)).size;

  const kpis = [
    { label: "Total Vendors",   value: vendors?.length ?? 0, icon: Store,        color: "bg-indigo-50 dark:bg-indigo-500/10",  iconColor: "text-indigo-600 dark:text-indigo-400",  sub: "in directory" },
    { label: "Active",          value: activeCount,          icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", sub: "currently active" },
    { label: "Inactive",        value: inactiveCount,        icon: XCircle,      color: "bg-red-50 dark:bg-red-500/10",         iconColor: "text-red-600 dark:text-red-400",         sub: "not active" },
    { label: "Categories",      value: categories,           icon: Tag,          color: "bg-blue-50 dark:bg-blue-500/10",       iconColor: "text-blue-600 dark:text-blue-400",       sub: "vendor types" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-32" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
      <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_,i) => <div key={i} className="h-44 bg-gray-100 dark:bg-white/5 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Vendors</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your supplier and partner directory.</p>
        </div>
        <button
          onClick={() => toast({ title: "Add vendor", description: "Vendor form coming soon." })}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", k.color)}>
                <Icon className={cn("w-4 h-4", k.iconColor)} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{k.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ); })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
          {(["all","active","inactive"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                statusFilter === f ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              )}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..."
            className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1 ml-auto">
          <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-md transition-all", view === "grid" ? "bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600")}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView("list")} className={cn("p-1.5 rounded-md transition-all", view === "list" ? "bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600")}>
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Store className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No vendors found</p></div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((vendor, idx) => {
            const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            const catTheme = CATEGORY_THEMES[vendor.category] || DEFAULT_CATEGORY;
            const isActive = vendor.status === "active";
            return (
              <div key={vendor.id}
                className="group bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0", gradient)}>
                    {vendor.name.slice(0,2).toUpperCase()}
                  </div>
                  <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-400 animate-pulse" : "bg-gray-400")} />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="font-bold text-gray-900 dark:text-white text-sm mb-1 truncate">{vendor.name}</p>
                {vendor.category && (
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-4", catTheme.bg, catTheme.color)}>
                    <Tag className="w-2.5 h-2.5" />{vendor.category}
                  </span>
                )}

                <div className="space-y-2 border-t border-gray-50 dark:border-white/5 pt-3">
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`}
                      className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <div className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-2.5 h-2.5 text-indigo-500" />
                      </div>
                      <span className="truncate">{vendor.email}</span>
                    </a>
                  )}
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`}
                      className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span>{vendor.phone}</span>
                    </a>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
                    onClick={() => toast({ title: "Contact vendor", description: `Drafting email to ${vendor.name}.` })}>
                    <Mail className="w-3 h-3" /> Contact
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    onClick={() => toast({ title: "View vendor", description: `Opening ${vendor.name}'s profile.` })}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50/40 dark:bg-white/1">
                {["Vendor","Category","Email","Phone","Status",""].map((h,i) => (
                  <th key={i} className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {filtered.map((vendor, idx) => {
                const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                const catTheme = CATEGORY_THEMES[vendor.category] || DEFAULT_CATEGORY;
                const isActive = vendor.status === "active";
                return (
                  <tr key={vendor.id} className="hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0", gradient)}>
                          {vendor.name.slice(0,2).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{vendor.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {vendor.category && (
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", catTheme.bg, catTheme.color)}>{vendor.category}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{vendor.email || "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{vendor.phone || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("flex items-center gap-1 w-fit text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-400" : "bg-gray-400")} />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-600 transition-colors"
                          onClick={() => toast({ title: "Email", description: `Contacting ${vendor.name}.` })}>
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => toast({ title: "View", description: `Viewing ${vendor.name}.` })}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400">{filtered.length} vendor{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
