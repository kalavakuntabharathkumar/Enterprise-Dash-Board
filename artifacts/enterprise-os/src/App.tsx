import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";

import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import EmployeesPage from "@/pages/hrms";
import EmployeeDetailPage from "@/pages/hrms/employees/[id]";
import DepartmentsPage from "@/pages/hrms/departments";
import AttendancePage from "@/pages/hrms/attendance";
import LeavesPage from "@/pages/hrms/leaves";
import CRMPage from "@/pages/crm";
import LeadsPage from "@/pages/crm/leads";
import ContactsPage from "@/pages/crm/contacts";
import DealsKanbanPage from "@/pages/crm/deals";
import InventoryPage from "@/pages/erp";
import VendorsPage from "@/pages/erp/vendors";
import PurchasesPage from "@/pages/erp/purchases";
import FinanceDashboard from "@/pages/finance";
import InvoicesPage from "@/pages/finance/invoices";
import ExpensesPage from "@/pages/finance/expenses";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/projects/[id]";
import AnalyticsPage from "@/pages/analytics";
import AiCopilotPage from "@/pages/ai";
import WorkflowsPage from "@/pages/workflows";
import NotificationsPage from "@/pages/notifications";
import SettingsPage from "@/pages/settings";

import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                <Route path="hrms">
                  <Route index element={<EmployeesPage />} />
                  <Route path="employees/:id" element={<EmployeeDetailPage />} />
                  <Route path="departments" element={<DepartmentsPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="leaves" element={<LeavesPage />} />
                </Route>

                <Route path="crm">
                  <Route index element={<CRMPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="deals" element={<DealsKanbanPage />} />
                </Route>

                <Route path="erp">
                  <Route index element={<InventoryPage />} />
                  <Route path="vendors" element={<VendorsPage />} />
                  <Route path="purchases" element={<PurchasesPage />} />
                </Route>

                <Route path="finance">
                  <Route index element={<FinanceDashboard />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                </Route>

                <Route path="projects">
                  <Route index element={<ProjectsPage />} />
                  <Route path=":id" element={<ProjectDetailPage />} />
                </Route>

                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="ai" element={<AiCopilotPage />} />
                <Route path="workflows" element={<WorkflowsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                
                <Route path="*" element={<div className="p-8">Page under construction</div>} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
