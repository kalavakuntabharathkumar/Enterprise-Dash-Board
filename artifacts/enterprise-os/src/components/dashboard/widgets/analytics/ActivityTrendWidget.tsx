import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fetchWithAuth } from "../fetchWithAuth";

interface ActivityData {
  total_30d: number;
  daily_activity: { date: string; count: number }[];
  top_actors: { name: string; count: number }[];
  entity_type_breakdown: { entity_type: string; count: number }[];
}

export function ActivityTrendWidget() {
  const { data, isLoading, isError } = useQuery<ActivityData>({
    queryKey: ["analytics-activity"],
    queryFn: () => fetchWithAuth("/api/analytics/activity"),
    retry: false,
    refetchInterval: 60000,
  });

  if (isLoading) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  if (isError || !data) return null;

  const lastTwoWeeks = data.daily_activity.slice(-14);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50">
          <Activity className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{data.total_30d}</p>
          <p className="text-xs text-gray-500">Actions in last 30 days</p>
        </div>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pt-5 px-6 pb-0">
          <CardTitle className="text-base font-semibold text-gray-900">Daily Activity (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-2 pb-4">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={lastTwoWeeks} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#9ca3af" }} interval={2} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="count" name="Actions" fill="#7c3aed" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {data.top_actors.length > 0 && (
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pt-4 px-5 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Top Contributors</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {data.top_actors.slice(0, 5).map((actor) => (
              <div key={actor.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate max-w-[160px]">{actor.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-violet-200 rounded-full" style={{ width: `${Math.max(20, (actor.count / (data.top_actors[0]?.count || 1)) * 80)}px` }}>
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-6 text-right">{actor.count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
