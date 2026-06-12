import React from "react";
import { useGetEmployee } from "@workspace/api-client-react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const empId = Number(id);

  const { data: employee, isLoading } = useGetEmployee(empId, { query: { enabled: !!empId } });

  if (isLoading) return <div className="p-8">Loading profile...</div>;
  if (!employee) return <div className="p-8">Employee not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
      </div>

      <Card className="border-border">
        <CardContent className="p-8 flex flex-col md:flex-row gap-8 items-start">
          <Avatar className="h-32 w-32 border-4 border-background shadow-sm">
            <AvatarImage src={employee.avatar || ""} />
            <AvatarFallback className="text-4xl">{employee.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-muted-foreground">{employee.position} &bull; {employee.department}</p>
              </div>
              <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {employee.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t border-border">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Email</div>
                <div className="font-medium">{employee.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Phone</div>
                <div className="font-medium">{employee.phone || "Not provided"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Location</div>
                <div className="font-medium">{employee.location || "Remote"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Joined Date</div>
                <div className="font-medium">{new Date(employee.joined_date).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Salary</div>
                <div className="font-medium">${employee.salary?.toLocaleString() || "N/A"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
