import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../fetchWithAuth";

const PENDING_STATUSES = ["pending_department", "pending_hr", "pending"];

const STATUS_COLORS: Record<string, string> = {
  pending_department: "bg-amber-100 text-amber-700",
  pending_hr:         "bg-blue-100 text-blue-700",
  pending:            "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending_department: "Dept Review",
  pending_hr:         "HR Review",
  pending:            "Pending",
};

interface Props {
  label?: string;
}

export function PendingLeavesWidget({ label = "Pending Leave Approvals" }: Props) {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["pending-leaves-widget"],
    queryFn: () => fetchWithAuth("/api/leaves"),
    refetchInterval: 30000,
  });

  const pending = data.filter((l: any) => PENDING_STATUSES.includes(l.status));

  return (
    <Card className="border-gray-100 shadow-sm bg-white">
      <CardHeader className="pt-5 px-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-indigo-400" />
            <CardTitle className="text-base font-semibold text-gray-900">{label}</CardTitle>
            {pending.length > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full leading-none">
                {pending.length}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate("/hrms/leaves")}
            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            Manage <ArrowUpRight className="w-3 h-3" />
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
        ) : pending.length === 0 ? (
          <div className="text-center py-6">
            <ClipboardCheck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 6).map((l: any) => (
              <div
                key={l.id}
                onClick={() => navigate("/hrms/leaves")}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{l.employee_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{l.type} · {l.start_date} → {l.end_date}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${STATUS_COLORS[l.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[l.status] ?? l.status}
                </span>
              </div>
            ))}
            {pending.length > 6 && (
              <p className="text-xs text-center text-gray-400 pt-1">+{pending.length - 6} more</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
