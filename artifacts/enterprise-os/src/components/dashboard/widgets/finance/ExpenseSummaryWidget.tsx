import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchWithAuth } from "../fetchWithAuth";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function ExpenseSummaryWidget() {
  const navigate = useNavigate();
  const { data: chartData } = useQuery<any>({
    queryKey: ["dashboard-charts"],
    queryFn: () => fetchWithAuth("/api/dashboard/charts"),
    refetchInterval: 60000,
  });
  const { data: stats } = useQuery<any>({
    queryKey: ["dashboard-stats-finance"],
    queryFn: () => fetchWithAuth("/api/dashboard/stats"),
    refetchInterval: 60000,
  });

  const expenseByCategory: { name: string; value: number }[] =
    chartData?.expense_by_category ?? [];

  return (
    <Card className="border-gray-100 shadow-sm bg-white">
      <CardHeader className="pt-5 px-6 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-base font-semibold text-gray-900">Expense Breakdown</CardTitle>
          </div>
          <button
            onClick={() => navigate("/finance/expenses")}
            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Expenses by category</p>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-4">
        {expenseByCategory.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400">No expense data</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                strokeWidth={1}
              >
                {expenseByCategory.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "10px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        {stats && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-50 mx-4 mt-1">
            <span className="text-xs text-gray-500">Total expenses</span>
            <span className="text-sm font-bold text-gray-900">
              ${(stats.total_expenses ?? 0).toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
