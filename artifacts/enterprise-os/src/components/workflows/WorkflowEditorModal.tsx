import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Zap, Bell, Mail, CheckSquare, RefreshCw, AlertTriangle, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WorkflowStepData {
  id?: number;
  step_order: number;
  action_type: string;
  target: string;
  delay_minutes: number;
}

export interface WorkflowData {
  id?: number;
  name: string;
  description: string;
  trigger: string;
  status: string;
  steps: WorkflowStepData[];
  // Real computed metrics from WorkflowRun records
  runs?: number;
  last_run?: string | null;
  total_runs?: number;
  successful_runs?: number;
  failed_runs?: number;
  avg_duration_ms?: number | null;
  success_rate?: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const TRIGGER_OPTIONS = [
  { value: "Leave Request Submitted", label: "Leave Request Submitted" },
  { value: "Employee Created", label: "Employee Created" },
  { value: "Invoice Generated", label: "Invoice Generated" },
  { value: "Deal Closed", label: "Deal Closed" },
  { value: "Task Completed", label: "Task Completed" },
] as const;

export const ACTION_TYPE_OPTIONS = [
  { value: "Send Notification", label: "Send Notification", icon: Bell, color: "text-blue-500" },
  { value: "Send Email", label: "Send Email", icon: Mail, color: "text-indigo-500" },
  { value: "Create Approval Task", label: "Create Approval Task", icon: CheckSquare, color: "text-emerald-500" },
  { value: "Update Status", label: "Update Status", icon: RefreshCw, color: "text-amber-500" },
  { value: "Escalate Request", label: "Escalate Request", icon: AlertTriangle, color: "text-red-500" },
] as const;

// ── Zod Schema ─────────────────────────────────────────────────────────────────

const stepSchema = z.object({
  step_order: z.number(),
  action_type: z.string().min(1, "Action type is required"),
  target: z.string().min(1, "Target is required"),
  delay_minutes: z.coerce.number().min(0).default(0),
});

const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required").max(80, "Name too long"),
  description: z.string().max(200, "Description too long").default(""),
  trigger: z.string().min(1, "Trigger is required"),
  enabled: z.boolean().default(true),
  steps: z.array(stepSchema).default([]),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

// ── WorkflowTriggerSelector ────────────────────────────────────────────────────

interface WorkflowTriggerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function WorkflowTriggerSelector({ value, onChange, error }: WorkflowTriggerSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Trigger Event <span className="text-red-500">*</span>
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn(
          "h-9 text-sm border-gray-200 dark:border-white/10 bg-white dark:bg-white/5",
          error && "border-red-400"
        )}>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <SelectValue placeholder="Select a trigger event..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {TRIGGER_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value} className="text-sm">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── WorkflowStepCard ───────────────────────────────────────────────────────────

interface WorkflowStepCardProps {
  index: number;
  actionType: string;
  target: string;
  delayMinutes: number;
  onActionTypeChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onDelayChange: (value: number) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
  errors?: { action_type?: string; target?: string };
}

export function WorkflowStepCard({
  index, actionType, target, delayMinutes,
  onActionTypeChange, onTargetChange, onDelayChange, onRemove,
  onMoveUp, onMoveDown, isFirst, isLast, errors,
}: WorkflowStepCardProps) {
  const actionMeta = ACTION_TYPE_OPTIONS.find(a => a.value === actionType);
  const ActionIcon = actionMeta?.icon ?? Bell;

  return (
    <div className="group relative bg-gray-50 dark:bg-white/3 border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
      {/* Step header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-0.5 text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-0.5 text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Step {index + 1}</span>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-2.5">
        {/* Action type */}
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
            Action
          </label>
          <Select value={actionType} onValueChange={onActionTypeChange}>
            <SelectTrigger className={cn(
              "h-8 text-xs border-gray-200 dark:border-white/10 bg-white dark:bg-white/5",
              errors?.action_type && "border-red-400"
            )}>
              <div className="flex items-center gap-1.5">
                <ActionIcon className={cn("w-3 h-3 flex-shrink-0", actionMeta?.color ?? "text-gray-400")} />
                <SelectValue placeholder="Select action..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-3 h-3", opt.color)} />
                      {opt.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errors?.action_type && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.action_type}</p>
          )}
        </div>

        {/* Target + Delay row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              Target / Recipient
            </label>
            <input
              type="text"
              value={target}
              onChange={e => onTargetChange(e.target.value)}
              placeholder="e.g. HR Team, Manager, #channel"
              className={cn(
                "w-full h-8 px-2.5 text-xs rounded-md border bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow",
                errors?.target
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-200 dark:border-white/10"
              )}
            />
            {errors?.target && (
              <p className="mt-0.5 text-[11px] text-red-500">{errors.target}</p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="inline w-2.5 h-2.5 mr-0.5" />
              Delay (min)
            </label>
            <input
              type="number"
              min={0}
              value={delayMinutes}
              onChange={e => onDelayChange(Number(e.target.value))}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── WorkflowStepsList ──────────────────────────────────────────────────────────

interface WorkflowStepsListProps {
  fields: WorkflowFormValues["steps"];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onChange: (index: number, field: keyof WorkflowStepData, value: string | number) => void;
  errors?: Array<{ action_type?: { message?: string }; target?: { message?: string } } | undefined>;
}

export function WorkflowStepsList({
  fields, onAdd, onRemove, onMove, onChange, errors,
}: WorkflowStepsListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Workflow Steps
          {fields.length > 0 && (
            <span className="ml-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
              {fields.length}
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add step
        </button>
      </div>

      {fields.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-6 border border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-400 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-400 transition-colors"
          onClick={onAdd}
        >
          <Plus className="w-5 h-5 mb-1.5" />
          <span className="text-xs">Click to add the first step</span>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((step, index) => (
            <WorkflowStepCard
              key={index}
              index={index}
              actionType={step.action_type}
              target={step.target}
              delayMinutes={step.delay_minutes}
              onActionTypeChange={v => onChange(index, "action_type", v)}
              onTargetChange={v => onChange(index, "target", v)}
              onDelayChange={v => onChange(index, "delay_minutes", v)}
              onRemove={() => onRemove(index)}
              onMoveUp={() => onMove(index, index - 1)}
              onMoveDown={() => onMove(index, index + 1)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              errors={{
                action_type: errors?.[index]?.action_type?.message,
                target: errors?.[index]?.target?.message,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── WorkflowEditorModal ────────────────────────────────────────────────────────

interface WorkflowEditorModalProps {
  open: boolean;
  onClose: () => void;
  workflow?: WorkflowData | null;
  onSaved: () => void;
}

export function WorkflowEditorModal({ open, onClose, workflow, onSaved }: WorkflowEditorModalProps) {
  const isEditing = Boolean(workflow?.id);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      description: "",
      trigger: "",
      enabled: true,
      steps: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "steps" });

  const triggerValue = watch("trigger");
  const enabledValue = watch("enabled");

  useEffect(() => {
    if (open) {
      if (workflow) {
        reset({
          name: workflow.name,
          description: workflow.description || "",
          trigger: workflow.trigger,
          enabled: workflow.status !== "inactive",
          steps: workflow.steps.map(s => ({
            step_order: s.step_order,
            action_type: s.action_type,
            target: s.target,
            delay_minutes: s.delay_minutes,
          })),
        });
      } else {
        reset({
          name: "",
          description: "",
          trigger: "",
          enabled: true,
          steps: [],
        });
      }
      setApiError(null);
    }
  }, [open, workflow]);

  const handleAddStep = () => {
    append({
      step_order: fields.length,
      action_type: "Send Notification",
      target: "",
      delay_minutes: 0,
    });
  };

  const handleStepChange = (index: number, field: keyof WorkflowStepData, value: string | number) => {
    const current = getValues("steps");
    const updated = current.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setValue("steps", updated, { shouldValidate: false });
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return;
    move(from, to);
    const current = getValues("steps");
    setValue("steps", current.map((s, i) => ({ ...s, step_order: i })));
  };

  const onSubmit = async (data: WorkflowFormValues) => {
    setIsSaving(true);
    setApiError(null);

    const token = localStorage.getItem("enterprise_os_token");
    const payload = {
      name: data.name,
      description: data.description,
      trigger: data.trigger,
      status: data.enabled ? "active" : "inactive",
      steps: data.steps.map((s, i) => ({ ...s, step_order: i })),
    };

    try {
      const url = isEditing
        ? `/api/workflows/${workflow!.id}`
        : "/api/workflows";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save workflow");
      }

      onSaved();
      onClose();
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                {isEditing ? "Edit Workflow" : "New Workflow"}
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isEditing ? "Update automation settings and steps" : "Configure a new automation workflow"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body — scrollable */}
        <form id="workflow-editor-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Workflow Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                placeholder="e.g. Leave Approval Notification"
                className={cn(
                  "w-full h-9 px-3 text-sm rounded-md border bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow",
                  errors.name
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-200 dark:border-white/10"
                )}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={2}
                placeholder="What does this workflow do?"
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-shadow"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Trigger + Enabled row */}
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <WorkflowTriggerSelector
                  value={triggerValue}
                  onChange={v => setValue("trigger", v, { shouldValidate: true })}
                  error={errors.trigger?.message}
                />
              </div>
              <div className="flex flex-col items-start gap-1.5 pt-0.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={enabledValue}
                    onCheckedChange={v => setValue("enabled", v)}
                  />
                  <span className={cn(
                    "text-xs font-medium",
                    enabledValue
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-400"
                  )}>
                    {enabledValue ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-white/8" />

            {/* Steps */}
            <WorkflowStepsList
              fields={fields}
              onAdd={handleAddStep}
              onRemove={remove}
              onMove={handleMove}
              onChange={handleStepChange}
              errors={errors.steps as any}
            />
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/8 flex-shrink-0 flex items-center justify-between gap-3">
          {apiError ? (
            <p className="text-xs text-red-500 flex-1">{apiError}</p>
          ) : (
            <p className="text-xs text-gray-400 flex-1">
              {fields.length} step{fields.length !== 1 ? "s" : ""} configured
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="border-gray-200 dark:border-white/10 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="workflow-editor-form"
              size="sm"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-sm shadow-indigo-600/20 min-w-[90px]"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isEditing ? "Save changes" : "Create workflow"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
