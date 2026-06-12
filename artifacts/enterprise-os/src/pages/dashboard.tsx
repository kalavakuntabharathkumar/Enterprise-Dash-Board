import React from "react";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Target, Briefcase } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard metrics...</div>;
  }

  const metrics = [
    { title: "Total Revenue", value: `$${(stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, trend: "+12%" },
    { title: "Active Employees", value: stats?.total_employees || 0, icon: Users, trend: "+4%" },
    { title: "Open Leads", value: stats?.open_leads || 0, icon: Target, trend: "+18%" },
    { title: "Active Projects", value: stats?.active_projects || 0, icon: Briefcase, trend: "-2%" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm">Your enterprise command center overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Card key={i} className="shadow-sm border-gray-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
              <p className={`text-xs mt-1 ${m.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                {m.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-gray-200/60 min-h-[400px]">
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground text-sm border-t border-dashed">
            [Chart Placeholder: Revenue by Month]
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200/60 min-h-[400px]">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground text-sm border-t border-dashed">
            [Activity Feed Placeholder]
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
