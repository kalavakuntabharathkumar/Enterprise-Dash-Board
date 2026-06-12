import React from "react";
import { useGetProject, useListTasks } from "@workspace/api-client-react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  
  const { data: project, isLoading: isProjLoading } = useGetProject(projectId, { query: { enabled: !!projectId } });
  const { data: tasks, isLoading: isTasksLoading } = useListTasks({ project_id: projectId }, { query: { enabled: !!projectId } });

  const statuses = ["todo", "in_progress", "done"];
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status] = tasks?.filter(t => t.status === status) || [];
    return acc;
  }, {} as Record<string, typeof tasks>);

  if (isProjLoading) return <div className="p-8">Loading project...</div>;

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{project?.name}</h1>
          <Badge variant={project?.status === 'active' ? 'default' : 'secondary'}>{project?.status}</Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm max-w-2xl">{project?.description}</p>
        <div className="mt-4 flex items-center gap-4 max-w-sm">
          <span className="text-sm font-medium">Progress</span>
          <Progress value={project?.progress || 0} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground">{project?.progress}%</span>
        </div>
      </div>
      
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 mt-4">
        {statuses.map(status => (
          <div key={status} className="bg-muted/50 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col gap-4 border border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
              <Badge variant="secondary">{tasksByStatus[status]?.length || 0}</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {tasksByStatus[status]?.map(task => (
                <div key={task.id} className="bg-card p-4 rounded-md shadow-sm border border-border cursor-pointer hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm leading-tight">{task.title}</div>
                    <Badge variant="outline" className="text-[10px] uppercase">{task.priority}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{task.assignee}</span>
                    <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : ''}</span>
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
