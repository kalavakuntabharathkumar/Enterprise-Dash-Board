import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchWithAuth } from "../fetchWithAuth";

interface FinanceData {
  total_paid: number;
  total_outstanding: number;
  revenue_by_month: { month: string; revenue: number }[];
  expense_by_category: { category: string; total: number }[];
  invoice_status_distribution: { status: string; count: number; total: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  paid: "#10b981",
  sent: "#3b82f6",
  draft: "#9ca3af",
  overdue: "#ef4444",
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1"];

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
}

export function FinanceAnalyticsWidget() {
  const { data, isLoading, isError } = useQuery<FinanceData>({
    queryKey: ["analytics-finance"],
    queryFn: () => fetchWithAuth("/api/analytics/finance"),
    retry: false,
    refetchInterval: 60000,
  });

  if (isLoading) return <WidgetSkeleton />;
  if (isError || !data) return null;

  const kpis = [
    { label: "Total Collected", value: fmt(data.total_paid), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Outstanding", value: fmt(data.total_outstanding), icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-gray-100 shadow-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-3`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.revenue_by_month.length > 0 && (
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pt-5 px-6 pb-0">
              <CardTitle className="text-base font-semibold text-gray-900">Revenue by Month</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Paid invoices only</p>
            </CardHeader>
            <CardContent className="pt-4 px-2 pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.revenue_by_month} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={fmt} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pt-5 px-6 pb-0">
            <CardTitle className="text-base font-semibold text-gray-900">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 pb-3">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.expense_by_category}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                >
                  {data.expense_by_category.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pt-4 px-5 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Invoice Status Overview</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="flex flex-wrap gap-3">
            {data.invoice_status_distribution.map((item) => (
              <div key={item.status} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[item.status] || "#9ca3af" }}
                />
                <div>
                  <p className="text-xs font-semibold text-gray-800 capitalize">{item.status}</p>
                  <p className="text-[10px] text-gray-500">{item.count} invoice{item.count !== 1 ? "s" : ""} · ${item.total.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );
}
