import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, AlertCircle, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { fetchWithAuth } from "../fetchWithAuth";

interface HRData {
  active_employees: number;
  on_leave_count: number;
  pending_approvals: number;
  avg_turnaround_days: number;
  headcount_by_dept: { department: string; count: number }[];
  leave_trends: { month: string; approved: number; rejected: number; pending: number }[];
}

export function HRAnalyticsWidget() {
  const { data, isLoading, isError } = useQuery<HRData>({
    queryKey: ["analytics-hr"],
    queryFn: () => fetchWithAuth("/api/analytics/hr"),
    retry: false,
    refetchInterval: 60000,
  });

  if (isLoading) return <WidgetSkeleton />;
  if (isError || !data) return null;

  const kpis = [
    { label: "Active Employees", value: data.active_employees, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "On Leave", value: data.on_leave_count, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pending Approvals", value: data.pending_approvals, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Avg Turnaround", value: `${data.avg_turnaround_days}d`, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pt-5 px-6 pb-0">
            <CardTitle className="text-base font-semibold text-gray-900">Headcount by Department</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.headcount_by_dept} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-15} textAnchor="end" height={36} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="count" name="Employees" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pt-5 px-6 pb-0">
            <CardTitle className="text-base font-semibold text-gray-900">Leave Request Trends</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Last 12 months</p>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.leave_trends.slice(-6)} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f9fafb" }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={20} stackId="a" />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={20} stackId="a" />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={20} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
