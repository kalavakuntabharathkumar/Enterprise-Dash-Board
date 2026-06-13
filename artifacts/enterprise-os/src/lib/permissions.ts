/**
 * Centralized frontend permission utilities.
 *
 * Usage:
 *   const { hasPermission, canAccessModule } = usePermissions();
 *   if (hasPermission("view_finance")) { ... }
 *   if (canAccessModule("analytics")) { ... }
 *
 * GOOD: hasPermission("view_finance")
 * BAD:  role === "finance_manager"
 */

import { useAuth } from "./auth";

export const MODULE_PERMISSIONS: Record<string, string> = {
  hrms: "manage_employees",
  crm: "manage_settings",
  erp: "manage_settings",
  finance: "view_finance",
  projects: "manage_projects",
  analytics: "view_analytics",
  workflows: "manage_settings",
  settings: "manage_settings",
  payroll: "manage_payroll",
};

export type PermissionKey =
  | "view_dashboard"
  | "manage_employees"
  | "approve_leave"
  | "manage_payroll"
  | "view_finance"
  | "manage_projects"
  | "view_analytics"
  | "manage_settings";

export function usePermissions() {
  const { permissions, hasPermission, permissionsLoaded } = useAuth();

  const canAccessModule = (module: string): boolean => {
    const required = MODULE_PERMISSIONS[module];
    if (!required) return true;
    return hasPermission(required);
  };

  return {
    permissions,
    hasPermission,
    canAccessModule,
    permissionsLoaded,
  };
}
