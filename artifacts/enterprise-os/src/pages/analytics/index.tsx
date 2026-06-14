import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetAnalyticsOverview, useGetDepartmentStats, useGetRevenueTrend } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Download, TrendingUp, TrendingDown, Users, Activity, FileText, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/components/dashboard/widgets/fetchWithAuth";
import { HRAnalyticsWidget } from "@/components/dashboard/widgets/analytics/HRAnalyticsWidget";
import { FinanceAnalyticsWidget } from "@/components/dashboard/widgets/analytics/FinanceAnalyticsWidget";
import { DepartmentAnalyticsWidget } from "@/components/dashboard/widgets/analytics/DepartmentAnalyticsWidget";
import { ActivityTrendWidget } from "@/components/dashboard/widgets/analytics/ActivityTrendWidget";
import { DocumentStatsWidget } from "@/components/dashboard/widgets/analytics/DocumentStatsWidget";

function downloadCSV(url: string, filename: string, token: string | null) {
  fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then((res) => {
      if (!res.ok) throw new Error("Export failed");
      return res.blob();
    })
    .then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    })
    .catch(() => alert("Export failed — insufficient permissions or no data."));
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  exports,
  token,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  exports?: { url: string; filename: string; label: string }[];
  token?: string | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {exports && exports.length > 0 && (
        <div className="flex items-center gap-2">
          {exports.map((exp) => (
            <Button
              key={exp.url}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => downloadCSV(exp.url, exp.filename, token ?? null)}
            >
              <Download className="w-3.5 h-3.5" />
              {exp.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmployeeSelfStats() {
  const { data: leaves = [], isLoading: leavesLoading } = useQuery<any[]>({
    queryKey: ["own-leaves-analytics"],
    queryFn: () => fetchWithAuth("/api/leaves"),
    retry: false,
  });
  const { data: notifications = [], isLoading: notifsLoading } = useQuery<any[]>({
    queryKey: ["own-notifications-analytics"],
    queryFn: () => fetchWithAuth("/api/notifications"),
    retry: false,
  });

  const pendingLeaves = Array.isArray(leaves)
    ? leaves.filter((l: any) => ["pending_department", "pending_hr", "pending"].includes(l.status)).length
    : 0;
  const approvedLeaves = Array.isArray(leaves)
    ? leaves.filter((l: any) => l.status === "approved").length
    : 0;
  const unreadNotifs = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.read).length
    : 0;

  const stats = [
    { label: "Leave Requests", value: Array.isArray(leaves) ? leaves.length : 0, sub: `${approvedLeaves} approved`, loading: leavesLoading },
    { label: "Pending Approvals", value: pendingLeaves, sub: "awaiting decision", loading: leavesLoading },
    { label: "Unread Notifications", value: unreadNotifs, sub: "in your inbox", loading: notifsLoading },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="pt-5 pb-4 px-5">
            {s.loading ? (
              <div className="h-10 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{s.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  // user.role is sourced from /api/auth/me on mount, which performs DB role_id lookup
  // (see backend/app/core/scoping.py get_effective_scope — role_id path is authoritative).
  const { user, token } = useAuth();
  const role = user?.role ?? "employee";

  // Section visibility matrix — matches spec exactly:
  // Admin: Overview KPIs + HR + Finance + Department + Activity + Documents
  // HR Manager: HR section + Documents  (no Overview, no Finance, no Activity section)
  // Finance Manager: Finance section + Documents  (no Overview, no HR, no Activity)
  // Dept Head: Department section + Documents  (no Overview, no HR, no Finance, no Activity)
  // Employee: self-stats + Documents
  const isAdmin = role === "admin";
  const isHRManager = role === "hr_manager";
  const isFinanceManager = role === "finance_manager";
  const isDeptHead = role === "dept_head";
  const isEmployee = !isAdmin && !isHRManager && !isFinanceManager && !isDeptHead;

  const showOverview   = isAdmin;
  const showHR         = isAdmin || isHRManager;                            // NOT dept_head
  const showFinance    = isAdmin || isFinanceManager;
  const showDepartment = isAdmin || isDeptHead;                             // HR sees HR section, not dept section
  const showActivity   = isAdmin;                                           // Activity Trends: admin only
  // Documents visible to everyone (scoped server-side)

  const { data: overview, isLoading: isOverviewLoading } = useGetAnalyticsOverview();
  const { data: deptStats, isLoading: isDeptLoading } = useGetDepartmentStats();
  const { data: revenueTrend, isLoading: isRevLoading } = useGetRevenueTrend();

  const pageSubtitle = isAdmin
    ? "Full organizational analytics — HR, Finance, Activity, and Documents."
    : isHRManager
    ? "HR analytics — workforce, leave trends, and approval performance."
    : isFinanceManager
    ? "Finance analytics — revenue, expenses, and invoice summaries."
    : isDeptHead
    ? "Department analytics — your team metrics and operational KPIs."
    : "Your personal operational metrics.";

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Analytics & Reporting</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{pageSubtitle}</p>
      </div>

      {/* ── Overview KPIs + Charts (Admin only) ────────────────────────── */}
      {showOverview && (
        <section className="space-y-4">
          <SectionHeader icon={TrendingUp} title="Overview KPIs" subtitle="Company-wide performance snapshot" />
          {isOverviewLoading || isDeptLoading || isRevLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {(overview?.kpis ?? []).map((kpi: { label: string; value: string; change: number; trend: string }, i: number) => (
                  <Card key={i} className="bg-white dark:bg-white/3 border-gray-100 dark:border-white/8 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{kpi.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {kpi.change >= 0
                          ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                        }
                        <span className={`text-xs font-medium ${kpi.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {kpi.change >= 0 ? "+" : ""}{kpi.change}% vs last month
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="bg-white dark:bg-white/3 border-gray-100 dark:border-white/8 shadow-sm">
                  <CardHeader className="pb-0 pt-5 px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Revenue Trend</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Monthly revenue vs expenses</p>
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
                  <CardContent className="px-2 pb-4 pt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-white/3 border-gray-100 dark:border-white/8 shadow-sm">
                  <CardHeader className="pb-0 pt-5 px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Department Performance</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Progress & attendance by department</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Performance
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-300 inline-block" />Attendance
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-2 pb-4 pt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptStats} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} domain={[0, 100]} unit="%" />
                        <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                        <Bar dataKey="performance" name="Performance" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="budget_used" name="Attendance" fill="#a5b4fc" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── HR Analytics (Admin + HR Manager only) ─────────────────────── */}
      {showHR && (
        <section className="space-y-4">
          <SectionHeader
            icon={Users}
            title="HR Analytics"
            subtitle="Workforce metrics, leave trends, and approval performance"
            token={token}
            exports={[
              { url: "/api/analytics/export/hr", filename: "hr-leave-report.csv", label: "HR Report" },
              { url: "/api/analytics/export/leaves", filename: "leave-analytics.csv", label: "Leave Analytics" },
            ]}
          />
          <HRAnalyticsWidget />
        </section>
      )}

      {/* ── Finance Analytics (Admin + Finance Manager only) ────────────── */}
      {showFinance && (
        <section className="space-y-4">
          <SectionHeader
            icon={TrendingUp}
            title="Finance Analytics"
            subtitle="Revenue by month, expense breakdown, and invoice status"
          />
          <FinanceAnalyticsWidget />
        </section>
      )}

      {/* ── Department Analytics (Admin + Dept Head only) ───────────────── */}
      {showDepartment && (
        <section className="space-y-4">
          <SectionHeader
            icon={Building2}
            title="Department Analytics"
            subtitle="Team metrics for the last 30 days"
            token={token}
            exports={[
              { url: "/api/analytics/export/department", filename: "department-activity-report.csv", label: "Dept Report" },
            ]}
          />
          <DepartmentAnalyticsWidget />
        </section>
      )}

      {/* ── Activity Trends (Admin only) ────────────────────────────────── */}
      {showActivity && (
        <section className="space-y-4">
          <SectionHeader
            icon={Activity}
            title="Activity Trends"
            subtitle="Organization-wide activity over the last 30 days"
          />
          <ActivityTrendWidget />
        </section>
      )}

      {/* ── Document Analytics (all authenticated users, scoped server-side) */}
      <section className="space-y-4">
        <SectionHeader
          icon={FileText}
          title="Document Analytics"
          subtitle="Upload trends and document distribution within your access scope"
        />
        <DocumentStatsWidget />
      </section>

      {/* ── Employee Self-Stats (employee role only — real data from API) ── */}
      {isEmployee && (
        <section className="space-y-4">
          <SectionHeader
            icon={Users}
            title="Your Summary"
            subtitle="Your leave requests and notification status"
          />
          <EmployeeSelfStats />
        </section>
      )}
    </div>
  );
}
