import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateDeal, getListDealsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2 } from "lucide-react";

const STAGES = ["lead", "contacted", "proposal", "negotiation", "won", "lost"];

const schema = z.object({
  title: z.string().min(2, "Deal title is required"),
  contact: z.string().min(1, "Contact name is required"),
  company: z.string().optional(),
  value: z.coerce.number().min(0),
  stage: z.string().default("lead"),
  probability: z.coerce.number().min(0).max(100).optional(),
  close_date: z.string().min(1, "Expected close date is required"),
  assigned_to: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddDealModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createDeal = useCreateDeal();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      stage: "lead",
      value: 0,
      close_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    },
  });

  const onSubmit = (data: FormData) => {
    createDeal.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
          toast({ title: "Deal created", description: `"${data.title}" has been added to the pipeline.` });
          reset();
          onClose();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create deal.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            New Deal
          </DialogTitle>
          <DialogDescription>Create a new deal in the sales pipeline.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Deal Title *</Label>
            <Input id="title" placeholder="e.g. Enterprise License — Acme Corp" {...register("title")} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact Name *</Label>
              <Input id="contact" placeholder="John Doe" {...register("contact")} />
              {errors.contact && <p className="text-xs text-red-500">{errors.contact.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" {...register("company")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="value">Deal Value ($) *</Label>
              <Input id="value" type="number" placeholder="50000" {...register("value")} />
              {errors.value && <p className="text-xs text-red-500">{errors.value.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="probability">Win Probability (%)</Label>
              <Input id="probability" type="number" min="0" max="100" placeholder="50" {...register("probability")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <select id="stage" {...register("stage")}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">
                {STAGES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close_date">Expected Close Date *</Label>
              <Input id="close_date" type="date" {...register("close_date")} />
              {errors.close_date && <p className="text-xs text-red-500">{errors.close_date.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Input id="assigned_to" placeholder="Sales rep name" {...register("assigned_to")} />
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={createDeal.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              {createDeal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Create Deal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
