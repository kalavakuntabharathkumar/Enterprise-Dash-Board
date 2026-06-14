import React from "react";
import { useGetDashboardStats, useGetRevenueTrend, useListNotifications } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getDashboardConfig } from "@/lib/dashboard-config";
import {
  Users, DollarSign, Target, Briefcase,
  TrendingUp, TrendingDown, ArrowUpRight, Activity, Clock,
  Bell, CalendarDays, BarChart2, CreditCard,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { fetchWithAuth } from "@/components/dashboard/widgets/fetchWithAuth";
import { MyLeavesWidget }      from "@/components/dashboard/widgets/employee/MyLeavesWidget";
import { PendingLeavesWidget } from "@/components/dashboard/widgets/hr/PendingLeavesWidget";
import { WorkforceWidget }     from "@/components/dashboard/widgets/hr/WorkforceWidget";
import { ExpenseSummaryWidget } from "@/components/dashboard/widgets/finance/ExpenseSummaryWidget";
import { TeamWidget }          from "@/components/dashboard/widgets/department/TeamWidget";

// ─── Static chart data ─────────────────────────────────────────────────────

const FALLBACK_REVENUE = [
  { month: "Jan", revenue: 320000, expenses: 210000 },
  { month: "Feb", revenue: 380000, expenses: 225000 },
  { month: "Mar", revenue: 290000, expenses: 195000 },
  { month: "Apr", revenue: 430000, expenses: 240000 },
  { month: "May", revenue: 510000, expenses: 275000 },
  { month: "Jun", revenue: 475000, expenses: 260000 },
  { month: "Jul", revenue: 580000, expenses: 295000 },
  { month: "Aug", revenue: 620000, expenses: 310000 },
  { month: "Sep", revenue: 545000, expenses: 280000 },
  { month: "Oct", revenue: 690000, expenses: 330000 },
  { month: "Nov", revenue: 720000, expenses: 345000 },
  { month: "Dec", revenue: 815000, expenses: 390000 },
];

const WEEKLY_ATTENDANCE = [
  { label: "Mon", value: 92 }, { label: "Tue", value: 78 },
  { label: "Wed", value: 88 }, { label: "Thu", value: 95 },
  { label: "Fri", value: 82 }, { label: "Sat", value: 45 },
  { label: "Sun", value: 38 },
];

const ACTION_ICON: Record<string, string> = {
  login: "🔐", leave_submitted: "📋",
  approved_stage1: "✅", approved_final: "✅",
  rejected: "❌", leave_approved: "✅", leave_rejected: "❌",
};

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-red-100 text-red-700",
};

// ─── KPI card definitions per role ────────────────────────────────────────

interface KpiItem {
  title: string;
  value: string | number;
  trend: string;
  up: boolean;
  icon: React.ElementType;
  color: string;
}

function getRoleKpis(
  role: string,
  stats: any,
  pendingLeaves: number,
  unread: number,
  empStats: any,
): KpiItem[] {
  const s = stats ?? {};

  switch (role) {
    case "admin":
    case "super_admin":
      return [
        { title: "Total Revenue",    value: `$${((s.total_revenue ?? 0) / 1000).toFixed(0)}k`, trend: "+12.5%",        up: true,  icon: DollarSign, color: "bg-indigo-50 text-indigo-600"  },
        { title: "Active Employees", value: s.total_employees ?? 0,                            trend: "+4 this month", up: true,  icon: Users,      color: "bg-emerald-50 text-emerald-600" },
        { title: "Open Leads",       value: s.open_leads ?? 0,                                 trend: "+18.2%",        up: true,  icon: Target,     color: "bg-amber-50 text-amber-600"     },
        { title: "Active Projects",  value: s.active_projects ?? 0,                            trend: "2 at risk",     up: false, icon: Briefcase,  color: "bg-purple-50 text-purple-600"   },
      ];

    case "hr_manager":
      return [
        { title: "Total Employees",   value: empStats?.total ?? s.total_employees ?? 0, trend: "org-wide",       up: true,  icon: Users,         color: "bg-emerald-50 text-emerald-600" },
        { title: "Pending Approvals", value: pendingLeaves,                             trend: "need action",    up: false, icon: CalendarDays,  color: "bg-amber-50 text-amber-600"     },
        { title: "On Leave Today",    value: empStats?.on_leave ?? 0,                   trend: "this month",     up: false, icon: Briefcase,     color: "bg-red-50 text-red-600"         },
        { title: "Active Projects",   value: s.active_projects ?? 0,                   trend: "in progress",    up: true,  icon: BarChart2,     color: "bg-indigo-50 text-indigo-600"   },
      ];

    case "dept_head":
      return [
        { title: "Team Size",          value: empStats?.total ?? 0,   trend: "in your dept",   up: true,  icon: Users,        color: "bg-emerald-50 text-emerald-600" },
        { title: "Team on Leave",      value: empStats?.on_leave ?? 0,trend: "currently",      up: false, icon: CalendarDays, color: "bg-amber-50 text-amber-600"     },
        { title: "Pending Approvals",  value: pendingLeaves,          trend: "need review",    up: false, icon: Briefcase,    color: "bg-red-50 text-red-600"         },
        { title: "Active Projects",    value: s.active_projects ?? 0, trend: "this quarter",   up: true,  icon: BarChart2,    color: "bg-indigo-50 text-indigo-600"   },
      ];

    case "finance_manager":
      return [
        { title: "Total Revenue",     value: `$${((s.total_revenue ?? 0) / 1000).toFixed(0)}k`,  trend: "+12.5%",      up: true,  icon: DollarSign,  color: "bg-indigo-50 text-indigo-600"   },
        { title: "Total Expenses",    value: `$${((s.total_expenses ?? 0) / 1000).toFixed(0)}k`, trend: "this period", up: false, icon: CreditCard,  color: "bg-red-50 text-red-600"         },
        { title: "Pending Invoices",  value: s.pending_invoices ?? 0,                            trend: "need action", up: false, icon: Target,      color: "bg-amber-50 text-amber-600"     },
        { title: "Active Projects",   value: s.active_projects ?? 0,                            trend: "in progress", up: true,  icon: Briefcase,   color: "bg-purple-50 text-purple-600"   },
      ];

    default:
      return [
        { title: "Active Projects",  value: s.active_projects ?? 0, trend: "assigned to you",  up: true,  icon: Briefcase,    color: "bg-purple-50 text-purple-600"   },
        { title: "Unread Alerts",    value: unread,                  trend: "in inbox",         up: false, icon: Bell,         color: "bg-amber-50 text-amber-600"     },
        { title: "Open Leads",       value: s.open_leads ?? 0,      trend: "pipeline",         up: true,  icon: Target,       color: "bg-indigo-50 text-indigo-600"   },
        { title: "Team Size",        value: s.total_employees ?? 0, trend: "org members",      up: true,  icon: Users,        color: "bg-emerald-50 text-emerald-600" },
      ];
  }
}

// ─── Role-specific middle row ──────────────────────────────────────────────

function MiddleRow({
  role, chartData, stats,
}: { role: string; chartData: any[]; stats: any }) {
  if (role === "admin" || role === "super_admin") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Revenue Overview</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Monthly revenue vs expenses</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Revenue
                </span>
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />Expenses
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="expenses" stroke="#d1d5db" strokeWidth={2} fill="url(#colorExpenses)" dot={false} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <CardTitle className="text-base font-semibold text-gray-900">Weekly Attendance</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Employee check-ins this week</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY_ATTENDANCE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip cursor={{ fill: "#f3f4f6" }} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
              <span className="text-xs text-gray-500">Avg attendance</span>
              <span className="text-sm font-bold text-gray-900">74%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "hr_manager") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><WorkforceWidget /></div>
        <PendingLeavesWidget label="Pending Approvals" />
      </div>
    );
  }

  if (role === "dept_head") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><TeamWidget /></div>
        <PendingLeavesWidget label="Team Leave Queue" />
      </div>
    );
  }

  if (role === "finance_manager") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Revenue & Expenses</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Monthly financial trend</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Revenue
                </span>
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Expenses
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#colorExpF)" dot={false} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevF)" dot={false} activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <ExpenseSummaryWidget />
      </div>
    );
  }

  // employee — my leaves + unread notifications summary
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2"><MyLeavesWidget /></div>
      <Card className="border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-0 pt-5 px-6">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <CardTitle className="text-base font-semibold text-gray-900">My Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-4">
          <UnreadNotificationsPanel />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Unread notifications panel (employee) ─────────────────────────────────

function UnreadNotificationsPanel() {
  const navigate = useNavigate();
  const { data: notifications } = useListNotifications();
  const items = (notifications as any[]) ?? [];
  const unread = items.filter((n: any) => !n.read).slice(0, 5);

  if (unread.length === 0) {
    return (
      <div className="text-center py-6">
        <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">All caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {unread.map((n: any, i: number) => (
        <div key={n.id ?? i} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50">
          <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0 mt-0.5 ${TYPE_COLORS[n.type] ?? TYPE_COLORS.info}`}>
            {n.type}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{n.title}</p>
            <p className="text-[10px] text-gray-500 truncate">{n.message}</p>
          </div>
        </div>
      ))}
      <button
        onClick={() => navigate("/notifications")}
        className="w-full text-xs text-indigo-600 font-medium hover:underline pt-1 flex items-center justify-center gap-1"
      >
        View all <ArrowUpRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Revenue tooltip ───────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: ${(p.value / 1000).toFixed(0)}k
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ─── Main dashboard component ──────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role ?? "employee";
  const config = getDashboardConfig(role);
  const navigate = useNavigate();

  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: revenueTrend }     = useGetRevenueTrend();
  const { data: notifications }    = useListNotifications();

  const { data: activityLogs } = useQuery<any[]>({
    queryKey: ["activity-feed"],
    queryFn: () => fetchWithAuth("/api/activity"),
    refetchInterval: 30000,
  });

  const { data: empStats } = useQuery<any>({
    queryKey: ["employee-stats-dashboard"],
    queryFn: () => fetchWithAuth("/api/employees/stats"),
    refetchInterval: 60000,
    enabled: ["hr_manager", "dept_head"].includes(role),
  });

  const { data: pendingLeaveCount = 0 } = useQuery<number>({
    queryKey: ["pending-leave-count"],
    queryFn: async () => {
      const leaves = await fetchWithAuth("/api/leaves");
      return (leaves as any[]).filter((l: any) =>
        ["pending_department", "pending_hr", "pending"].includes(l.status)
      ).length;
    },
    refetchInterval: 30000,
    enabled: ["admin", "super_admin", "hr_manager", "dept_head"].includes(role),
  });

  const unreadCount = ((notifications as any[]) ?? []).filter((n: any) => !n.read).length;
  const chartData   = (revenueTrend as any[])?.length ? revenueTrend as any[] : FALLBACK_REVENUE;
  const kpis        = getRoleKpis(role, stats, pendingLeaveCount as number, unreadCount, empStats);

  const activityItems: any[] = activityLogs ?? [];
  const fallbackActivity     = ((notifications as any[]) ?? []).slice(0, 6);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{config.title}</h1>
          <p className="text-gray-500 mt-1 text-sm">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-gray-500 border-gray-200 bg-white">
            June 2026
          </Badge>
          {["admin", "super_admin", "finance_manager"].includes(role) && (
            <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((m, i) => (
          <KpiCard key={i} title={m.title} value={m.value} icon={m.icon} iconClass={m.color} trend={m.trend} trendUp={m.up} />
        ))}
      </div>

      {/* ── Role-specific middle row ── */}
      <MiddleRow role={role} chartData={chartData} stats={stats} />

      {/* ── Bottom row: Activity feed + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity Feed */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm bg-white dark:bg-[#0f1117] dark:border-white/5">
          <CardHeader className="pt-5 px-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  {activityItems.length > 0 ? "Activity Feed" : "Recent Activity"}
                </CardTitle>
                {activityItems.length > 0 && <Activity className="w-4 h-4 text-indigo-400" />}
              </div>
              <button
                onClick={() => navigate("/notifications")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                View all
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {activityItems.length > 0 ? (
              <div className="space-y-0">
                {activityItems.slice(0, 6).map((item: any, i) => (
                  <div key={item.id ?? i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-white/5 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-sm">
                      {ACTION_ICON[item.action] ?? "•"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.actor_role && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 capitalize">
                            {item.actor_role}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {fallbackActivity.slice(0, 5).map((item: any, i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 mt-0.5 ${TYPE_COLORS[item.type] ?? TYPE_COLORS.info}`}>
                      {item.type}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 truncate">{item.message}</p>
                    </div>
                    {!item.read && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-gray-100 shadow-sm bg-white dark:bg-[#0f1117] dark:border-white/5">
          <CardHeader className="pt-5 px-6 pb-4">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="space-y-2">
              {config.quickActions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${action.color}`}
                >
                  <span className="flex items-center gap-2">
                    {action.label}
                    {action.label === "Review Leave Requests" && (pendingLeaveCount as number) > 0 && (
                      <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full leading-none">
                        {pendingLeaveCount as number}
                      </span>
                    )}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
