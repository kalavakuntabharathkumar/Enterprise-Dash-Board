import React from "react";
import { Sidebar } from "./Sidebar";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Bell, Search, ChevronRight } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/hrms": "HRMS — Employees",
  "/hrms/departments": "HRMS — Departments",
  "/hrms/attendance": "HRMS — Attendance",
  "/hrms/leaves": "HRMS — Leave Requests",
  "/crm": "CRM — Pipeline",
  "/crm/leads": "CRM — Leads",
  "/crm/contacts": "CRM — Contacts",
  "/crm/deals": "CRM — Deals",
  "/erp": "ERP — Inventory",
  "/erp/vendors": "ERP — Vendors",
  "/erp/purchases": "ERP — Purchases",
  "/finance": "Finance — Overview",
  "/finance/invoices": "Finance — Invoices",
  "/finance/expenses": "Finance — Expenses",
  "/projects": "Projects",
  "/analytics": "Analytics",
  "/ai": "AI Copilot",
  "/workflows": "Workflows",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

export function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const title = pageTitles[location.pathname] || "Enterprise OS";
  const breadcrumbs = title.split(" — ");

  return (
    <div className="flex min-h-screen bg-gray-50 text-foreground">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                <span className={i === breadcrumbs.length - 1 ? "text-gray-800 font-semibold" : ""}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-56 hover:border-gray-300 transition-colors cursor-text">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400">Search...</span>
              <span className="ml-auto text-[10px] text-gray-300 font-mono border border-gray-200 rounded px-1">⌘K</span>
            </div>

            {/* Notifications */}
            <button className="relative w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm cursor-pointer">
              AM
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
