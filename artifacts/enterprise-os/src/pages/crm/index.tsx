import React from "react";
import { useListDeals } from "@workspace/api-client-react";

export default function CRMPage() {
  const { data: deals, isLoading } = useListDeals();

  if (isLoading) return <div className="p-8">Loading CRM data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM & Sales</h1>
        <p className="text-muted-foreground mt-2 text-sm">Pipeline and deals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deals?.map(deal => (
          <div key={deal.id} className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <h3 className="font-semibold">{deal.title}</h3>
            <p className="text-sm text-muted-foreground">{deal.company || deal.contact}</p>
            <div className="mt-4 font-bold">${deal.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
