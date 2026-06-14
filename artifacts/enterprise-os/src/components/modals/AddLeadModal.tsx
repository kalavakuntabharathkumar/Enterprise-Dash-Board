import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateLead, getListLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Target, Loader2 } from "lucide-react";

const STAGES = ["prospect", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Invalid email"),
  stage: z.string().min(1, "Stage is required"),
  value: z.coerce.number().min(0, "Value must be positive"),
  phone: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.string().default("new"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddLeadModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createLead = useCreateLead();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stage: "prospect", value: 0, status: "new" },
  });

  const onSubmit = (data: FormData) => {
    createLead.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
          toast({ title: "Lead added", description: `${data.name} has been added to the pipeline.` });
          reset();
          onClose();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to add lead.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Add Lead
          </DialogTitle>
          <DialogDescription>Add a new prospect to the sales pipeline.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Contact Name *</Label>
              <Input id="name" placeholder="John Doe" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" placeholder="Acme Corp" {...register("company")} />
              {errors.company && <p className="text-xs text-red-500">{errors.company.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="john@acme.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1-555-0100" {...register("phone")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage *</Label>
              <select id="stage" {...register("stage")}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">
                {STAGES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">Deal Value ($)</Label>
              <Input id="value" type="number" placeholder="50000" {...register("value")} />
              {errors.value && <p className="text-xs text-red-500">{errors.value.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Input id="assigned_to" placeholder="Sales rep name" {...register("assigned_to")} />
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={createLead.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              {createLead.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              Add Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
