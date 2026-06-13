import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fetchWithAuth } from "../fetchWithAuth";

export function WorkforceWidget() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["employee-stats"],
    queryFn: () => fetchWithAuth("/api/employees/stats"),
    refetchInterval: 60000,
  });

  const byDept: { name: string; value: number }[] = data?.by_department ?? [];

  return (
    <Card className="border-gray-100 shadow-sm bg-white">
      <CardHeader className="pt-5 px-6 pb-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <CardTitle className="text-base font-semibold text-gray-900">Workforce Distribution</CardTitle>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Employees by department</p>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-4">
        {isLoading ? (
          <div className="h-52 bg-gray-100 rounded-lg animate-pulse mx-4" />
        ) : byDept.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDept} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="value" name="Employees" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {data && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-50 mx-4 mt-1">
            <span className="text-xs text-gray-500">Total headcount</span>
            <span className="text-sm font-bold text-gray-900">{data.total ?? 0} employees</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
