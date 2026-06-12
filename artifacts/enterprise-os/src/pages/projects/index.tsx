import React, { useState } from "react";
import { useListProjects } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  FolderOpen, Plus, Search, Calendar, User2, ArrowRight,
  CheckCircle2, Clock, AlertTriangle, XCircle, BarChart3,
  TrendingUp, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, {
  label: string; icon: React.ElementType;
  badge: string; bar: string; border: string; topBar: string;
}> = {
  active:    { label: "Active",     icon: CheckCircle2,  badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", bar: "from-emerald-400 to-teal-400", border: "border-gray-100 dark:border-white/8 hover:border-emerald-200 dark:hover:border-emerald-500/30", topBar: "from-emerald-400 to-teal-400" },
  planning:  { label: "Planning",   icon: Clock,         badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",             bar: "from-blue-400 to-indigo-400",   border: "border-gray-100 dark:border-white/8 hover:border-blue-200 dark:hover:border-blue-500/30",   topBar: "from-blue-400 to-indigo-400" },
  on_hold:   { label: "On Hold",    icon: AlertTriangle, badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",          bar: "from-amber-400 to-orange-400",  border: "border-gray-100 dark:border-white/8 hover:border-amber-200 dark:hover:border-amber-500/30", topBar: "from-amber-400 to-orange-400" },
  completed: { label: "Completed",  icon: CheckCircle2,  badge: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400",                 bar: "from-gray-300 to-gray-400",     border: "border-gray-100 dark:border-white/8",                                                         topBar: "from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/5" },
  cancelled: { label: "Cancelled",  icon: XCircle,       badge: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",                 bar: "from-red-300 to-red-400",       border: "border-gray-100 dark:border-white/8",                                                         topBar: "from-red-300 to-rose-400" },
};

const AVATAR_COLORS = [
  "from-indigo-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-purple-400 to-indigo-500",
];

function ProjectCard({ project }: { project: any }) {
  const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
  const StatusIcon = sc.icon;

  const dueDate = new Date(project.end_date);
  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
  const isOverdue = daysLeft < 0;
  const isDueSoon = !isOverdue && daysLeft <= 7;

  // Fake team members based on project id
  const teamCount = 2 + (project.id % 3);
  const teamAvatars = Array.from({ length: Math.min(teamCount, 3) });

  return (
    <Link to={`/projects/${project.id}`} className="block group">
      <div className={cn(
        "bg-white dark:bg-white/3 border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg dark:hover:shadow-black/30 hover:-translate-y-0.5 h-full flex flex-col",
        sc.border
      )}>
        {/* Top gradient bar */}
        <div className={cn("h-1 bg-gradient-to-r flex-shrink-0", sc.topBar)} />

        <div className="p-5 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", sc.badge)}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {sc.label}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {project.name}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
            {project.description || "No description provided."}
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Progress</span>
              <span className={cn(
                "text-[11px] font-bold",
                project.progress >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                project.progress >= 50 ? "text-indigo-600 dark:text-indigo-400" :
                "text-amber-600 dark:text-amber-400"
              )}>
                {project.progress}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", sc.bar)}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className={cn(
                "text-[11px] font-medium",
                isOverdue ? "text-red-600 dark:text-red-400" :
                isDueSoon ? "text-amber-600 dark:text-amber-400" :
                "text-gray-500 dark:text-gray-400"
              )}>
                {isOverdue ? `${Math.abs(daysLeft)}d overdue` :
                 isDueSoon ? `${daysLeft}d left` :
                 dueDate.toLocaleDateString("en", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Team avatars */}
              <div className="flex -space-x-1.5">
                {teamAvatars.map((_, i) => (
                  <div
                    key={i}
                    className={cn("w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-br text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0", AVATAR_COLORS[(project.id + i) % AVATAR_COLORS.length])}
                  >
                    {String.fromCharCode(65 + ((project.id + i) % 26))}
                  </div>
                ))}
                {teamCount > 3 && (
                  <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[8px] font-bold flex items-center justify-center">
                    +{teamCount - 3}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <User2 className="w-3 h-3" />
                <span>{project.manager?.split(" ")[0]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View link */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-center gap-1 py-2 rounded-lg bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/8 text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:border-indigo-100 dark:group-hover:border-indigo-500/20 transition-all">
            View project
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

type FilterTab = "all" | "active" | "planning" | "on_hold" | "completed";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useListProjects();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filtered = projects?.filter(p => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.manager?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }) ?? [];

  const counts = {
    all: projects?.length ?? 0,
    active: projects?.filter(p => p.status === "active").length ?? 0,
    planning: projects?.filter(p => p.status === "planning").length ?? 0,
    on_hold: projects?.filter(p => p.status === "on_hold").length ?? 0,
    completed: projects?.filter(p => p.status === "completed").length ?? 0,
  };

  const avgProgress = projects?.length
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
    : 0;

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "planning", label: "Planning" },
    { id: "on_hold", label: "On Hold" },
    { id: "completed", label: "Completed" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-lg w-36" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track project portfolio, milestones, and team progress.</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => toast({ title: "Create project", description: "Project creation coming soon." })}
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total projects", value: counts.all, icon: Layers, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
          { label: "Active", value: counts.active, icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
          { label: "On hold", value: counts.on_hold, icon: AlertTriangle, color: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
          { label: "Avg progress", value: `${avgProgress}%`, icon: BarChart3, color: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", stat.color)}>
                <Icon className={cn("w-4.5 h-4.5", stat.iconColor)} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                filter === tab.id
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {tab.label}
              {tab.id !== "all" && (
                <span className={cn("ml-1.5 text-[10px] font-semibold", filter === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400")}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
