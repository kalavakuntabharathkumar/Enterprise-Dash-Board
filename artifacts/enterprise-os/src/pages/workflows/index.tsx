import React, { useState } from "react";
import { useListWorkflows, useTriggerWorkflow, getListWorkflowsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play, Activity, Plus, Search, Clock, Zap,
  Calendar, Webhook, MoreHorizontal, CheckCircle2,
  XCircle, PauseCircle, BarChart3, Settings2, Copy, Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WorkflowEditorModal, type WorkflowData } from "@/components/workflows/WorkflowEditorModal";

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  schedule: Calendar,
  webhook: Webhook,
  event: Zap,
  manual: Play,
};

const TRIGGER_COLORS: Record<string, string> = {
  schedule: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  webhook: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  event: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  manual: "bg-gray-50 text-gray-700 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10",
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; dot: string; label: string }> = {
  active: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-400 shadow-emerald-400/50", label: "Active" },
  paused: { icon: PauseCircle, color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-400 shadow-amber-400/50", label: "Paused" },
  inactive: { icon: XCircle, color: "text-gray-400", dot: "bg-gray-300 dark:bg-gray-600", label: "Inactive" },
  error: { icon: XCircle, color: "text-red-600 dark:text-red-400", dot: "bg-red-400 shadow-red-400/50", label: "Error" },
};

type FilterTab = "all" | "active" | "paused" | "inactive";

interface WorkflowCardProps {
  workflow: WorkflowData & { runs: number; last_run: string | null };
  onTrigger: () => void;
  isTriggering: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function WorkflowCard({ workflow, onTrigger, isTriggering, onEdit, onDelete, onDuplicate }: WorkflowCardProps) {
  const status = STATUS_CONFIG[workflow.status] || STATUS_CONFIG.inactive;
  const StatusIcon = status.icon;
  const triggerKey = workflow.trigger?.toLowerCase().replace(/[^a-z]/g, "") || "manual";
  const TriggerIcon = TRIGGER_ICONS[triggerKey] || Zap;
  const triggerColorClass = TRIGGER_COLORS[triggerKey] || TRIGGER_COLORS.manual;

  const totalRuns = workflow.total_runs ?? workflow.runs ?? 0;
  const successRate = workflow.success_rate ?? 0;
  const avgDuration = workflow.avg_duration_ms ?? null;

  return (
    <div className="group bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl overflow-hidden hover:border-gray-200 dark:hover:border-white/15 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200">
      <div className={cn(
        "h-0.5",
        workflow.status === "active" ? "bg-gradient-to-r from-emerald-400 to-teal-400" :
        workflow.status === "paused" ? "bg-gradient-to-r from-amber-400 to-orange-400" :
        workflow.status === "error" ? "bg-gradient-to-r from-red-400 to-rose-400" :
        "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/5"
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0 shadow-sm", status.dot,
                workflow.status === "active" && "animate-pulse"
              )} />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{workflow.name}</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{workflow.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 flex-shrink-0 ml-2">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit} className="gap-2 text-xs">
                <Settings2 className="w-3.5 h-3.5" /> Edit workflow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate} className="gap-2 text-xs">
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-xs text-red-600 focus:text-red-600">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-4">
          <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border", triggerColorClass)}>
            <TriggerIcon className="w-2.5 h-2.5" />
            {workflow.trigger || "Manual"}
          </span>
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
            workflow.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
            workflow.status === "paused" ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
            "bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"
          )}>
            <StatusIcon className="w-2.5 h-2.5" />
            {status.label}
          </span>
          {(workflow.steps?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
              {workflow.steps.length} step{workflow.steps.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 dark:bg-white/3 rounded-xl border border-gray-100 dark:border-white/5">
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{totalRuns}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Runs</p>
          </div>
          <div className="text-center border-x border-gray-100 dark:border-white/5">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {totalRuns > 0 ? `${successRate}%` : "—"}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Success</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {formatDuration(avgDuration)}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Avg duration</p>
          </div>
        </div>

        {/* Success bar — driven by real success_rate */}
        {totalRuns > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>
                Success rate
                {(workflow.failed_runs ?? 0) > 0 && (
                  <span className="ml-1.5 text-red-400">{workflow.failed_runs} failed</span>
                )}
              </span>
              <span className={cn(
                "font-medium",
                successRate >= 95 ? "text-emerald-600 dark:text-emerald-400" :
                successRate >= 80 ? "text-amber-600 dark:text-amber-400" :
                "text-red-500 dark:text-red-400"
              )}>
                {successRate}%
              </span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  successRate >= 95 ? "bg-gradient-to-r from-emerald-400 to-teal-400" :
                  successRate >= 80 ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                  "bg-gradient-to-r from-red-400 to-rose-400"
                )}
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs border-gray-200 dark:border-white/10 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 dark:hover:border-indigo-500/30 transition-colors"
            onClick={onEdit}
          >
            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
            Configure
          </Button>
          <Button
            size="sm"
            className={cn(
              "flex-1 h-8 text-xs font-medium transition-all shadow-sm",
              workflow.status === "active"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
            )}
            onClick={onTrigger}
            disabled={workflow.status !== "active" || isTriggering}
          >
            {isTriggering ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            )}
            Run now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const { data: workflows, isLoading } = useListWorkflows();
  const triggerWorkflow = useTriggerWorkflow();
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openNew = () => {
    setEditingWorkflow(null);
    setEditorOpen(true);
  };

  const openEdit = (workflow: WorkflowData) => {
    setEditingWorkflow(workflow);
    setEditorOpen(true);
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
    toast({
      title: editingWorkflow ? "Workflow updated" : "Workflow created",
      description: editingWorkflow
        ? "Your changes have been saved."
        : "New workflow is now active.",
    });
  };

  const handleDuplicate = async (workflow: WorkflowData) => {
    const token = localStorage.getItem("enterprise_os_token");
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          trigger: workflow.trigger,
          status: "inactive",
          steps: workflow.steps.map(s => ({
            step_order: s.step_order,
            action_type: s.action_type,
            target: s.target,
            delay_minutes: s.delay_minutes,
          })),
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({ title: "Duplicated", description: `"${workflow.name}" has been duplicated.` });
      }
    } catch {
      toast({ title: "Error", description: "Could not duplicate workflow.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const token = localStorage.getItem("enterprise_os_token");
    try {
      await fetch(`/api/workflows/${deleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
      toast({ title: "Deleted", description: `"${deleteTarget.name}" was removed.`, variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Could not delete workflow.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleTrigger = (id: number, name: string) => {
    setTriggeringId(id);
    triggerWorkflow.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Workflow triggered", description: `${name} is now running.` });
          queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
          setTriggeringId(null);
        },
        onError: () => {
          toast({ title: "Failed", description: "Could not trigger workflow.", variant: "destructive" });
          setTriggeringId(null);
        },
      }
    );
  };

  const filtered = (workflows ?? []).filter((w: WorkflowData) => {
    const matchFilter = filter === "all" || w.status === filter;
    const matchSearch =
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: workflows?.length ?? 0,
    active: workflows?.filter((w: WorkflowData) => w.status === "active").length ?? 0,
    paused: workflows?.filter((w: WorkflowData) => w.status === "paused").length ?? 0,
    inactive: workflows?.filter((w: WorkflowData) => w.status === "inactive").length ?? 0,
  };

  const totalRuns = (workflows ?? []).reduce((s: number, w: any) => s + (w.runs || 0), 0);

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "paused", label: "Paused" },
    { id: "inactive", label: "Inactive" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-lg w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Workflow Automation</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Automate business processes across all modules.</p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
            onClick={openNew}
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total workflows", value: counts.all, icon: Activity, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
            { label: "Active", value: counts.active, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            { label: "Paused", value: counts.paused, icon: PauseCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
            { label: "Total runs", value: totalRuns, icon: BarChart3, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", stat.bg)}>
                  <Icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter + Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filter === tab.id
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                {tab.label}
                <span className={cn(
                  "ml-1.5 text-[10px] font-semibold",
                  filter === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
                )}>
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workflows..."
              className="flex-1 text-xs bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No workflows found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs border-gray-200 dark:border-white/10"
              onClick={openNew}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create your first workflow
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((workflow: any) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onTrigger={() => handleTrigger(workflow.id, workflow.name)}
                isTriggering={triggeringId === workflow.id}
                onEdit={() => openEdit(workflow)}
                onDelete={() => setDeleteTarget({ id: workflow.id, name: workflow.name })}
                onDuplicate={() => handleDuplicate(workflow)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Workflow Editor Modal */}
      <WorkflowEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        workflow={editingWorkflow}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTarget?.name}"</strong> and all its steps will be permanently deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
