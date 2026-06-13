import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Plus, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../fetchWithAuth";

const STATUS_COLORS: Record<string, string> = {
  approved:           "bg-emerald-100 text-emerald-700",
  approved_final:     "bg-emerald-100 text-emerald-700",
  pending_department: "bg-amber-100 text-amber-700",
  pending_hr:         "bg-blue-100 text-blue-700",
  pending:            "bg-gray-100 text-gray-600",
  rejected:           "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  approved:           "Approved",
  approved_final:     "Approved",
  pending_department: "Pending",
  pending_hr:         "HR Review",
  pending:            "Pending",
  rejected:           "Rejected",
};

export function MyLeavesWidget() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["my-leaves"],
    queryFn: () => fetchWithAuth("/api/leaves"),
    refetchInterval: 60000,
  });

  return (
    <Card className="border-gray-100 shadow-sm bg-white">
      <CardHeader className="pt-5 px-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            <CardTitle className="text-base font-semibold text-gray-900">My Leave Requests</CardTitle>
          </div>
          <button
            onClick={() => navigate("/hrms/leaves")}
            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-gray-400">No leave requests yet</p>
            <button
              onClick={() => navigate("/hrms/leaves")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Request Leave
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 5).map((l: any) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 capitalize">{l.type} Leave</p>
                  <p className="text-xs text-gray-500">{l.start_date} → {l.end_date}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${STATUS_COLORS[l.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[l.status] ?? l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
