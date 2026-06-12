import React from "react";
import { useListWorkflows, useTriggerWorkflow } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListWorkflowsQueryKey } from "@workspace/api-client-react";

export default function WorkflowsPage() {
  const { data: workflows, isLoading } = useListWorkflows();
  const triggerWorkflow = useTriggerWorkflow();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-8">Loading workflows...</div>;

  const handleTrigger = (id: number, name: string) => {
    triggerWorkflow.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Workflow Triggered", description: `${name} has been queued.` });
          queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to trigger workflow.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
        <p className="text-muted-foreground mt-2 text-sm">Automate business processes across modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows?.map(workflow => (
          <Card key={workflow.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>{workflow.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">{workflow.description}</p>
              
              <div className="bg-muted/50 p-3 rounded-md text-xs space-y-2 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Trigger</span>
                  <span className="font-mono">{workflow.trigger}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Total Runs</span>
                  <span>{workflow.runs}</span>
                </div>
                {workflow.last_run && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Last Run</span>
                    <span>{new Date(workflow.last_run).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleTrigger(workflow.id, workflow.name)}
                disabled={workflow.status !== 'active' || triggerWorkflow.isPending}
              >
                <Play className="w-4 h-4 mr-2" /> 
                {triggerWorkflow.isPending ? 'Triggering...' : 'Run Manually'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
