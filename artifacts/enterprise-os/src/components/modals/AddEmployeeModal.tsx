import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateEmployee, useListDepartments, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(2, "Position is required"),
  status: z.enum(["active", "inactive", "on_leave"]),
  joined_date: z.string().min(1, "Join date is required"),
  phone: z.string().optional(),
  salary: z.coerce.number().optional(),
  location: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddEmployeeModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: departments } = useListDepartments();
  const createEmployee = useCreateEmployee();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active", joined_date: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = (data: FormData) => {
    createEmployee.mutate(
      { data: { ...data, salary: data.salary ?? undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          toast({ title: "Employee added", description: `${data.name} has been added successfully.` });
          reset();
          onClose();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to add employee. Email may already exist.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            Add Employee
          </DialogTitle>
          <DialogDescription>Fill in the details to add a new employee to the directory.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="Jane Smith" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="jane@company.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="department">Department *</Label>
              <select id="department" {...register("department")}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">
                <option value="">Select department</option>
                {departments?.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Position *</Label>
              <Input id="position" placeholder="Senior Engineer" {...register("position")} />
              {errors.position && <p className="text-xs text-red-500">{errors.position.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="joined_date">Join Date *</Label>
              <Input id="joined_date" type="date" {...register("joined_date")} />
              {errors.joined_date && <p className="text-xs text-red-500">{errors.joined_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" {...register("status")}
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="salary">Salary (USD)</Label>
              <Input id="salary" type="number" placeholder="85000" {...register("salary")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1-555-0100" {...register("phone")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="San Francisco, CA" {...register("location")} />
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={createEmployee.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              {createEmployee.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
