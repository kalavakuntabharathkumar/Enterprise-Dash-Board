import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { AdminGuard } from "@/components/RoleGuard";

import LoginPage from "@/pages/login";
import AccessDeniedPage from "@/pages/access-denied";
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

import MyLeavesPage from "@/pages/my-leaves";
import PayslipsPage from "@/pages/payslips";
import ProfilePage from "@/pages/profile";
import AnnouncementsPage from "@/pages/announcements";
import DirectoryPage from "@/pages/directory";
import TimesheetsPage from "@/pages/timesheets";
import SupportPage from "@/pages/support";
import DocumentsPage from "@/pages/documents";
import CalendarPage from "@/pages/calendar";

import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/access-denied" element={<AccessDeniedPage />} />
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />

                  {/* HRMS — admins only for management; leaves accessible to all */}
                  <Route path="hrms">
                    <Route index element={<AdminGuard><EmployeesPage /></AdminGuard>} />
                    <Route path="employees/:id" element={<AdminGuard><EmployeeDetailPage /></AdminGuard>} />
                    <Route path="departments" element={<AdminGuard><DepartmentsPage /></AdminGuard>} />
                    <Route path="attendance" element={<AdminGuard><AttendancePage /></AdminGuard>} />
                    <Route path="leaves" element={<LeavesPage />} />
                  </Route>

                  {/* CRM — admin only */}
                  <Route path="crm">
                    <Route index element={<AdminGuard><CRMPage /></AdminGuard>} />
                    <Route path="leads" element={<AdminGuard><LeadsPage /></AdminGuard>} />
                    <Route path="contacts" element={<AdminGuard><ContactsPage /></AdminGuard>} />
                    <Route path="deals" element={<AdminGuard><DealsKanbanPage /></AdminGuard>} />
                  </Route>

                  {/* ERP — admin only */}
                  <Route path="erp">
                    <Route index element={<AdminGuard><InventoryPage /></AdminGuard>} />
                    <Route path="vendors" element={<AdminGuard><VendorsPage /></AdminGuard>} />
                    <Route path="purchases" element={<AdminGuard><PurchasesPage /></AdminGuard>} />
                  </Route>

                  {/* Finance — admin only */}
                  <Route path="finance">
                    <Route index element={<AdminGuard><FinanceDashboard /></AdminGuard>} />
                    <Route path="invoices" element={<AdminGuard><InvoicesPage /></AdminGuard>} />
                    <Route path="expenses" element={<AdminGuard><ExpensesPage /></AdminGuard>} />
                  </Route>

                  {/* Projects — accessible to all */}
                  <Route path="projects">
                    <Route index element={<ProjectsPage />} />
                    <Route path=":id" element={<ProjectDetailPage />} />
                  </Route>

                  {/* Analytics & Workflows — admin only */}
                  <Route path="analytics" element={<AdminGuard><AnalyticsPage /></AdminGuard>} />
                  <Route path="workflows" element={<AdminGuard><WorkflowsPage /></AdminGuard>} />

                  {/* Accessible to all */}
                  <Route path="ai" element={<AiCopilotPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  {/* New employee experience modules — accessible to all */}
                  <Route path="my-leaves" element={<MyLeavesPage />} />
                  <Route path="payslips" element={<PayslipsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="directory" element={<DirectoryPage />} />
                  <Route path="timesheets" element={<TimesheetsPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />

                  <Route path="*" element={<div className="p-8 text-gray-500">Page not found</div>} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
