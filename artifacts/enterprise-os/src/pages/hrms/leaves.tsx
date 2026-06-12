import React from "react";
import { useListLeaves, useUpdateLeaveStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListLeavesQueryKey } from "@workspace/api-client-react";

export default function LeavesPage() {
  const { data: leaves, isLoading } = useListLeaves();
  const updateStatus = useUpdateLeaveStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading leave requests...</div>;

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `Leave request marked as ${status}.` });
          queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground mt-2 text-sm">Manage employee time off.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending & Past Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves?.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.employee_name}</TableCell>
                  <TableCell className="capitalize">{leave.type.replace('_', ' ')}</TableCell>
                  <TableCell>
                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={leave.reason}>{leave.reason}</TableCell>
                  <TableCell>
                    <Badge variant={leave.status === "approved" ? "default" : leave.status === "rejected" ? "destructive" : "secondary"}>
                      {leave.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {leave.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(leave.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(leave.id, "rejected")}>Reject</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leaves?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No leave requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
