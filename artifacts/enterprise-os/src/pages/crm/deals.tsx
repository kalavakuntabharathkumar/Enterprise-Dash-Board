import React from "react";
import { useListDeals } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export default function DealsKanbanPage() {
  const { data: deals, isLoading } = useListDeals();

  const stages = ["lead", "contacted", "proposal", "negotiation", "won", "lost"];
  
  if (isLoading) return <div className="p-8">Loading deals...</div>;

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage] = deals?.filter(d => d.stage === stage) || [];
    return acc;
  }, {} as Record<string, typeof deals>);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deals Kanban</h1>
        <p className="text-muted-foreground mt-2 text-sm">Drag and drop pipeline management.</p>
      </div>
      
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage} className="bg-muted/50 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col gap-4 border border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">{stage}</h3>
              <Badge variant="secondary">{dealsByStage[stage]?.length || 0}</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {dealsByStage[stage]?.map(deal => (
                <div key={deal.id} className="bg-card p-4 rounded-md shadow-sm border border-border cursor-pointer hover:border-primary transition-colors">
                  <div className="font-medium text-sm mb-1">{deal.title}</div>
                  <div className="text-xs text-muted-foreground mb-3">{deal.company || deal.contact}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">${deal.value.toLocaleString()}</span>
                    <span>{deal.probability ? `${deal.probability}%` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
