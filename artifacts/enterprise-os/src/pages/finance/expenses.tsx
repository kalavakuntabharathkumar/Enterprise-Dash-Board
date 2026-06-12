import React from "react";
import { useListExpenses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useListExpenses();

  if (isLoading) return <div className="p-8">Loading expenses...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground mt-2 text-sm">Company spend tracking.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map(exp => (
                <TableRow key={exp.id}>
                  <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{exp.title}</TableCell>
                  <TableCell>{exp.category}</TableCell>
                  <TableCell>{exp.submitted_by}</TableCell>
                  <TableCell className="text-right font-medium">${exp.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={exp.status === 'approved' ? 'default' : exp.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {exp.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
