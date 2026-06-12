import React from "react";
import { useGetDashboardStats, useGetRevenueTrend, useListNotifications } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, DollarSign, Target, Briefcase,
  TrendingUp, TrendingDown, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

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

const QUICK_STATS = [
  { label: "Mon", value: 92 },
  { label: "Tue", value: 78 },
  { label: "Wed", value: 88 },
  { label: "Thu", value: 95 },
  { label: "Fri", value: 82 },
  { label: "Sat", value: 45 },
  { label: "Sun", value: 38 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
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
};

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: revenueTrend } = useGetRevenueTrend();
  const { data: notifications } = useListNotifications();

  const chartData = (revenueTrend && revenueTrend.length > 0) ? revenueTrend : FALLBACK_REVENUE;

  const metrics = [
    {
      title: "Total Revenue",
      value: `$${((stats?.total_revenue || 0) / 1000).toFixed(0)}k`,
      fullValue: `$${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      trend: "+12.5%",
      up: true,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Active Employees",
      value: stats?.total_employees || 0,
      icon: Users,
      trend: "+4 this month",
      up: true,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Open Leads",
      value: stats?.open_leads || 0,
      icon: Target,
      trend: "+18.2%",
      up: true,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Active Projects",
      value: stats?.active_projects || 0,
      icon: Briefcase,
      trend: "2 at risk",
      up: false,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const recentActivity = (notifications as any[])?.slice(0, 6) || [
    { title: "New Lead Assigned", message: "Michael Grant from TechCorp has been assigned", type: "info", read: false },
    { title: "Invoice Overdue", message: "Invoice INV-001028 is 10 days overdue", type: "warning", read: false },
    { title: "Project Milestone", message: "Data Analytics Pipeline is 88% complete", type: "success", read: true },
    { title: "Deal Closed", message: "Blue Wave Media deal worth $95K closed", type: "success", read: true },
    { title: "Low Stock Alert", message: "Office Desk Chair is out of stock", type: "warning", read: false },
  ];

  const typeColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
    error: "bg-red-100 text-red-700",
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Welcome back — here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-gray-500 border-gray-200 bg-white">
            June 2026
          </Badge>
          <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, i) => (
          <Card key={i} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{m.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {m.up
                      ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    }
                    <span className={`text-xs font-medium ${m.up ? "text-emerald-600" : "text-red-600"}`}>
                      {m.trend}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                  <m.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
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
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="expenses" stroke="#d1d5db" strokeWidth={2} fill="url(#colorExpenses)" dot={false} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly attendance */}
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <CardTitle className="text-base font-semibold text-gray-900">Weekly Attendance</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Employee check-ins this week</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={QUICK_STATS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
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

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm bg-white">
          <CardHeader className="pt-5 px-6 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
              <button className="text-xs text-indigo-600 font-medium hover:underline">View all</button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((item: any, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 mt-0.5 ${typeColors[item.type] || typeColors.info}`}>
                    {item.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.message}</p>
                  </div>
                  {!item.read && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions + module summary */}
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardHeader className="pt-5 px-6 pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="space-y-2">
              {[
                { label: "Add Employee", href: "/hrms", color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
                { label: "Create Invoice", href: "/finance/invoices", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                { label: "New Lead", href: "/crm/leads", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                { label: "Start Project", href: "/projects", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                { label: "View Analytics", href: "/analytics", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${action.color}`}
                >
                  {action.label}
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
