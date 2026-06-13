import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../fetchWithAuth";

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-emerald-100 text-emerald-700",
  on_leave: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-500",
};

export function TeamWidget() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["team-members"],
    queryFn: () => fetchWithAuth("/api/employees"),
    refetchInterval: 60000,
  });

  return (
    <Card className="border-gray-100 shadow-sm bg-white">
      <CardHeader className="pt-5 px-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-base font-semibold text-gray-900">Team Members</CardTitle>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {data.length}
            </span>
          </div>
          <button
            onClick={() => navigate("/hrms")}
            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            Manage <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No team members found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 7).map((emp: any) => (
              <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
                    {emp.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.position}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 capitalize ${STATUS_COLORS[emp.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {emp.status?.replace("_", " ") ?? "active"}
                </span>
              </div>
            ))}
            {data.length > 7 && (
              <p className="text-xs text-center text-gray-400 pt-1">+{data.length - 7} more members</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
