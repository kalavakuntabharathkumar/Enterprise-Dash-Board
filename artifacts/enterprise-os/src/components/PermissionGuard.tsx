import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
}

/**
 * Permission-based route guard.
 *
 * - Redirects to /login if not authenticated.
 * - Renders null while permissions are loading (prevents access-denied flash on refresh).
 * - Redirects to /access-denied if the permission is not held.
 * - Returns children on success.
 *
 * Usage:
 *   <Route path="hrms" element={<PermissionGuard permission="manage_employees"><EmployeesPage /></PermissionGuard>} />
 */
export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { isAuthenticated, hasPermission, permissionsLoaded } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!permissionsLoaded) return null;
  if (!hasPermission(permission)) return <Navigate to="/access-denied" replace />;

  return <>{children}</>;
}
