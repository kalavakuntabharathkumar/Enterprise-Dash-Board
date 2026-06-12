import React from "react";
import { useGetFinanceSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export default function FinanceDashboard() {
  const { data: summary, isLoading } = useGetFinanceSummary();

  if (isLoading) return <div className="p-8">Loading finance data...</div>;

  const metrics = [
    { title: "Total Revenue", value: summary?.total_revenue || 0, icon: ArrowUpRight, color: "text-emerald-500" },
    { title: "Total Expenses", value: summary?.total_expenses || 0, icon: ArrowDownRight, color: "text-red-500" },
    { title: "Net Profit", value: summary?.net_profit || 0, icon: Activity, color: "text-blue-500" },
    { title: "Pending Amount", value: summary?.pending_amount || 0, icon: DollarSign, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground mt-2 text-sm">Financial overview and tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${m.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          [Chart Placeholder]
        </CardContent>
      </Card>
    </div>
  );
}
