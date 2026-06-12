import React from "react";
import { useGetFinanceSummary, useListInvoices, useListExpenses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, ArrowUpRight, ArrowDownRight, Activity,
  TrendingUp, TrendingDown, FileText, Receipt
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

const MONTHLY_DATA = [
  { month: "Jan", revenue: 265000, expenses: 148000 },
  { month: "Feb", revenue: 310000, expenses: 162000 },
  { month: "Mar", revenue: 245000, expenses: 133000 },
  { month: "Apr", revenue: 390000, expenses: 195000 },
  { month: "May", revenue: 425000, expenses: 210000 },
  { month: "Jun", revenue: 398000, expenses: 198000 },
];

const EXPENSE_CATEGORIES = [
  { name: "Technology", value: 20200, color: "#6366f1" },
  { name: "Office", value: 18500, color: "#22c55e" },
  { name: "Marketing", value: 25000, color: "#f59e0b" },
  { name: "Travel", value: 8200, color: "#3b82f6" },
  { name: "Services", value: 5500, color: "#8b5cf6" },
];

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  sent: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-600",
  overdue: "bg-red-100 text-red-700",
};

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

export default function FinanceDashboard() {
  const { data: summary, isLoading } = useGetFinanceSummary();
  const { data: invoices } = useListInvoices();
  const { data: expenses } = useListExpenses();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-36" />
        <div className="grid grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const totalExpenseAmount = (expenses as any[])?.reduce((s: number, e: any) => s + e.amount, 0) || 77400;
  const netProfit = (summary?.net_profit || 0);

  const metrics = [
    {
      title: "Total Revenue",
      value: `$${((summary?.total_revenue || 265000) / 1000).toFixed(0)}k`,
      icon: ArrowUpRight,
      trend: "+14.2%",
      up: true,
      color: "bg-indigo-50 text-indigo-600",
      sub: "vs last quarter",
    },
    {
      title: "Total Expenses",
      value: `$${(totalExpenseAmount / 1000).toFixed(0)}k`,
      icon: ArrowDownRight,
      trend: "+8.1%",
      up: false,
      color: "bg-red-50 text-red-600",
      sub: "vs last quarter",
    },
    {
      title: "Net Profit",
      value: `$${((summary?.total_revenue || 265000) - totalExpenseAmount > 0
        ? ((summary?.total_revenue || 265000) - totalExpenseAmount) : Math.abs(netProfit)).toLocaleString()}`,
      icon: Activity,
      trend: "+22.5%",
      up: true,
      color: "bg-emerald-50 text-emerald-600",
      sub: "profit margin 41%",
    },
    {
      title: "Pending Amount",
      value: `$${((summary?.pending_amount || 70500) / 1000).toFixed(0)}k`,
      icon: DollarSign,
      trend: "3 invoices",
      up: false,
      color: "bg-amber-50 text-amber-600",
      sub: "awaiting payment",
    },
  ];

  const recentInvoices = (invoices as any[])?.slice(0, 5) || [
    { invoice_number: "INV-001024", client: "TechCorp Inc", amount: 85000, status: "paid", due_date: "2024-01-31" },
    { invoice_number: "INV-001025", client: "DataFlow Systems", amount: 42000, status: "sent", due_date: "2024-02-10" },
    { invoice_number: "INV-001026", client: "Apex Ventures", amount: 28500, status: "draft", due_date: "2024-02-15" },
    { invoice_number: "INV-001027", client: "Blue Wave Media", amount: 95000, status: "paid", due_date: "2023-12-31" },
    { invoice_number: "INV-001028", client: "Nexus Solutions", amount: 15000, status: "overdue", due_date: "2024-01-05" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Finance</h1>
          <p className="text-gray-500 mt-1 text-sm">Financial overview, revenue tracking and expense management.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/finance/invoices" className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors">
            <FileText className="w-3.5 h-3.5" />
            Invoices
          </a>
          <a href="/finance/expenses" className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
            <Receipt className="w-3.5 h-3.5" />
            Expenses
          </a>
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
                    <span className={`text-xs font-medium ${m.up ? "text-emerald-600" : "text-red-600"}`}>{m.trend}</span>
                    <span className="text-xs text-gray-400">{m.sub}</span>
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
        {/* Revenue vs Expenses chart */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Revenue vs Expenses</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">6-month financial performance</p>
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
              <BarChart data={MONTHLY_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barGap={4}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[4, 4, 0, 0]} maxBarSize={36} name="revenue" />
                <Bar dataKey="expenses" fill="url(#expenseGrad)" radius={[4, 4, 0, 0]} maxBarSize={36} name="expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense breakdown */}
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-0 pt-5 px-6">
            <CardTitle className="text-base font-semibold text-gray-900">Expense Breakdown</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">By category</p>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={EXPENSE_CATEGORIES} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {EXPENSE_CATEGORIES.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2 px-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs text-gray-600">{cat.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">${cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="border-gray-100 shadow-sm bg-white">
        <CardHeader className="pt-5 px-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">Recent Invoices</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Latest invoice activity</p>
            </div>
            <a href="/finance/invoices" className="text-xs text-indigo-600 font-medium hover:underline">
              View all →
            </a>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Invoice</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Due Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentInvoices.map((inv: any, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-mono text-xs text-gray-700 font-medium">{inv.invoice_number}</td>
                    <td className="py-3 text-sm text-gray-800 font-medium">{inv.client}</td>
                    <td className="py-3 text-sm font-semibold text-gray-900">${inv.amount.toLocaleString()}</td>
                    <td className="py-3 text-xs text-gray-500">{inv.due_date}</td>
                    <td className="py-3">
                      <Badge className={`text-[10px] font-semibold uppercase tracking-wide border-0 ${statusColors[inv.status] || "bg-gray-100 text-gray-600"}`}>
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
