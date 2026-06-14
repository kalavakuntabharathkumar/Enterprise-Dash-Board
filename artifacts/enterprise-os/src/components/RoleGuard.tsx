import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { isAuthenticated, user, permissionsLoaded } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!permissionsLoaded) {
    return null;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["admin"]}>{children}</RoleGuard>;
}
