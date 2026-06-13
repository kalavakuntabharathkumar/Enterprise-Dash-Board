import React, { useState } from "react";
import { useGetAnalyticsOverview, useGetDepartmentStats, useGetRevenueTrend } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Download, TrendingUp, Users, Activity, FileText, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
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
  exportUrl,
  exportFilename,
  token,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  exportUrl?: string;
  exportFilename?: string;
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
      {exportUrl && exportFilename && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => downloadCSV(exportUrl, exportFilename, token ?? null)}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const role = user?.role ?? "employee";

  const isAdmin = role === "admin";
  const isHR = role === "hr_manager" || isAdmin;
  const isFinance = role === "finance_manager" || isAdmin;
  const isDeptHead = role === "dept_head" || isAdmin;
  const canSeeOverview = isAdmin || isHR || isFinance;

  const { data: overview, isLoading: isOverviewLoading } = useGetAnalyticsOverview();
  const { data: deptStats, isLoading: isDeptLoading } = useGetDepartmentStats();
  const { data: revenueTrend, isLoading: isRevLoading } = useGetRevenueTrend();

  const overviewLoading = isOverviewLoading || isDeptLoading || isRevLoading;

  return (
    <div className="space-y-10">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isAdmin
            ? "Full organizational analytics — HR, Finance, Activity, and Documents."
            : isHR && !isAdmin
            ? "HR analytics — workforce, leave trends, and approval metrics."
            : isFinance && !isAdmin
            ? "Finance analytics — revenue, expenses, and invoice summaries."
            : isDeptHead && !isAdmin
            ? "Department analytics — your team metrics and operational KPIs."
            : "Your personal operational metrics."}
        </p>
      </div>

      {/* ── Overview KPIs (admin / hr / finance only) ──────────────────── */}
      {canSeeOverview && (
        <section className="space-y-4">
          <SectionHeader icon={TrendingUp} title="Overview KPIs" subtitle="Company-wide performance snapshot" />
          {overviewLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
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
                        {kpi.change >= 0 ? "+" : ""}
                        {kpi.change}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="min-h-[360px]">
                    <CardHeader>
                      <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
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
                    <CardHeader>
                      <CardTitle>Department Headcount</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="employees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── HR Analytics (admin + hr_manager) ──────────────────────────── */}
      {isHR && (
        <section className="space-y-4">
          <SectionHeader
            icon={Users}
            title="HR Analytics"
            subtitle="Workforce metrics, leave trends, and approval performance"
            exportUrl="/api/analytics/export/hr"
            exportFilename="hr-leave-report.csv"
            token={token}
          />
          <HRAnalyticsWidget />
        </section>
      )}

      {/* ── Finance Analytics (admin + finance_manager) ─────────────────── */}
      {isFinance && (
        <section className="space-y-4">
          <SectionHeader
            icon={TrendingUp}
            title="Finance Analytics"
            subtitle="Revenue by month, expense breakdown, and invoice status"
          />
          <FinanceAnalyticsWidget />
        </section>
      )}

      {/* ── Department Analytics (admin + dept_head + hr_manager) ──────── */}
      {isDeptHead && (
        <section className="space-y-4">
          <SectionHeader
            icon={Building2}
            title="Department Analytics"
            subtitle="Team metrics for the last 30 days"
            exportUrl="/api/analytics/export/department"
            exportFilename="department-report.csv"
            token={token}
          />
          <DepartmentAnalyticsWidget />
        </section>
      )}

      {/* ── Activity Trends (admin + hr_manager; others see own) ────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={Activity}
          title="Activity Trends"
          subtitle={
            isAdmin || role === "hr_manager"
              ? "Organization-wide activity over the last 30 days"
              : "Your activity over the last 30 days"
          }
        />
        <ActivityTrendWidget />
      </section>

      {/* ── Document Analytics (all roles, scoped) ──────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={FileText}
          title="Document Analytics"
          subtitle="Upload trends and document distribution in your scope"
        />
        <DocumentStatsWidget />
      </section>

      {/* ── Employee Self-Stats (employee role only) ─────────────────────── */}
      {role === "employee" && (
        <section className="space-y-4">
          <SectionHeader icon={Users} title="Your Summary" subtitle="Your personal metrics snapshot" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <Card>
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-gray-500 mb-1">Leave Requests</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
                <p className="text-xs text-gray-400 mt-1">Visit HR → Leave to manage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-gray-500 mb-1">Notifications</p>
                <p className="text-2xl font-bold text-gray-900">—</p>
                <p className="text-xs text-gray-400 mt-1">Check your inbox</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
