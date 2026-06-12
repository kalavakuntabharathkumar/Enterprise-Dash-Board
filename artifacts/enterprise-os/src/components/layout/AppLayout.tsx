import React from "react";
import { Sidebar } from "./Sidebar";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-8 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
