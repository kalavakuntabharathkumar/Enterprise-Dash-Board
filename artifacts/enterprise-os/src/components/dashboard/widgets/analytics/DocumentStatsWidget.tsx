import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchWithAuth } from "../fetchWithAuth";

interface DocData {
  total_docs: number;
  uploads_by_month: { month: string; count: number }[];
  category_distribution: { category: string; count: number }[];
  visibility_breakdown: { visibility: string; count: number }[];
}

const VIS_COLORS: Record<string, string> = {
  organization: "#10b981",
  department: "#3b82f6",
  private: "#6b7280",
  hr_only: "#8b5cf6",
  finance_only: "#f59e0b",
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

export function DocumentStatsWidget() {
  const { data, isLoading, isError } = useQuery<DocData>({
    queryKey: ["analytics-documents"],
    queryFn: () => fetchWithAuth("/api/analytics/documents"),
    retry: false,
    refetchInterval: 60000,
  });

  if (isLoading) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  if (isError || !data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{data.total_docs}</p>
          <p className="text-xs text-gray-500">Total documents accessible</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pt-4 px-5 pb-0">
            <CardTitle className="text-sm font-semibold text-gray-700">Uploads by Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 px-2 pb-3">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.uploads_by_month} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="count" name="Uploads" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pt-4 px-5 pb-0">
            <CardTitle className="text-sm font-semibold text-gray-700">By Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-3">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data.category_distribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={55}
                  innerRadius={30}
                >
                  {data.category_distribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {data.visibility_breakdown.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {data.visibility_breakdown.map((v) => (
            <span
              key={v.visibility}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 border border-gray-100 text-gray-700"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: VIS_COLORS[v.visibility] || "#9ca3af" }}
              />
              {v.visibility.replace("_", " ")} ({v.count})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
