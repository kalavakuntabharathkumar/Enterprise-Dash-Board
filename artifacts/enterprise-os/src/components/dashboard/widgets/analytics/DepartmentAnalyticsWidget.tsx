import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, Activity, FileText } from "lucide-react";
import { fetchWithAuth } from "../fetchWithAuth";

interface DeptMetric {
  department: string;
  employee_count: number;
  leave_requests_30d: number;
  activity_count_30d: number;
  doc_uploads_30d: number;
}

interface DeptData {
  scope_dept: string | null;
  departments: DeptMetric[];
}

const METRIC_ICONS = [
  { key: "employee_count", label: "Employees", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "leave_requests_30d", label: "Leave Requests (30d)", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
  { key: "activity_count_30d", label: "Activity Events (30d)", icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "doc_uploads_30d", label: "Doc Uploads (30d)", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
];

export function DepartmentAnalyticsWidget() {
  const { data, isLoading, isError } = useQuery<DeptData>({
    queryKey: ["analytics-department"],
    queryFn: () => fetchWithAuth("/api/analytics/department"),
    retry: false,
    refetchInterval: 60000,
  });

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  if (isError || !data) return null;

  const depts = data.departments;

  if (depts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No department data available.</p>
      </div>
    );
  }

  if (depts.length === 1) {
    const d = depts[0];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1">
          <Building2 className="w-4 h-4 text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900">{d.department}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {METRIC_ICONS.map((m) => (
            <Card key={m.key} className="border-gray-100 shadow-sm">
              <CardContent className="pt-4 pb-3 px-4">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${m.bg} mb-2`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                </div>
                <p className="text-xl font-bold text-gray-900">{(d as any)[m.key]}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {depts.map((d) => (
        <Card key={d.department} className="border-gray-100 shadow-sm">
          <CardHeader className="pt-4 px-5 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-sm font-semibold text-gray-800">{d.department}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-4 gap-3">
              {METRIC_ICONS.map((m) => (
                <div key={m.key} className="text-center">
                  <p className="text-lg font-bold text-gray-900">{(d as any)[m.key]}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{m.label.split(" ")[0]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
