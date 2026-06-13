import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetAnalyticsOverview, useGetDepartmentStats, useGetRevenueTrend } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Download, TrendingUp, Users, Activity, FileText, Building2 } from "lucide-react";
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
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
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
    <div className="space-y-10">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
        <p className="text-muted-foreground mt-1 text-sm">{pageSubtitle}</p>
      </div>

      {/* ── Overview KPIs + Charts (Admin only) ────────────────────────── */}
      {showOverview && (
        <section className="space-y-4">
          <SectionHeader icon={TrendingUp} title="Overview KPIs" subtitle="Company-wide performance snapshot" />
          {isOverviewLoading || isDeptLoading || isRevLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(overview?.kpis ?? []).map((kpi: { label: string; value: string; change: number; trend: string }, i: number) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpi.value}</div>
                      <p className={`text-xs mt-1 ${kpi.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {kpi.change >= 0 ? "+" : ""}{kpi.change}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="min-h-[360px]">
                  <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="min-h-[360px]">
                  <CardHeader><CardTitle>Department Performance</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} domain={[0, 100]} unit="%" />
                        <Tooltip formatter={(v: number) => `${v}%`} />
                        <Legend />
                        <Bar dataKey="performance" name="Performance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="budget_used" name="Budget Used" fill="#6366f1" radius={[4, 4, 0, 0]} />
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
