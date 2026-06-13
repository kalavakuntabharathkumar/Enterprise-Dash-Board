import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: UserInfo | null;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  permissions: string[];
  hasPermission: (key: string) => boolean;
  permissionsLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchMe(token: string): Promise<UserInfo | null> {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchPermissions(token: string): Promise<string[]> {
  try {
    const res = await fetch("/api/rbac/users/me/permissions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.permissions ?? []).map((p: { name: string }) => p.name);
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("enterprise_os_token"));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("enterprise_os_token"));
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("enterprise_os_token");
    if (storedToken && !user) {
      (async () => {
        const u = await fetchMe(storedToken);
        if (u) {
          setUser(u);
          const perms = await fetchPermissions(storedToken);
          setPermissions(perms);
        } else {
          localStorage.removeItem("enterprise_os_token");
          setToken(null);
        }
        setPermissionsLoaded(true);
      })();
    } else if (!storedToken) {
      setPermissionsLoaded(true);
    }
  }, []);

  const login = (newToken: string, newUser: UserInfo) => {
    localStorage.setItem("enterprise_os_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setPermissionsLoaded(false);
    fetchPermissions(newToken).then((perms) => {
      setPermissions(perms);
      setPermissionsLoaded(true);
    });
  };

  const logout = () => {
    localStorage.removeItem("enterprise_os_token");
    setToken(null);
    setUser(null);
    setPermissions([]);
    setPermissionsLoaded(false);
  };

  const role = user?.role ?? null;
  const hasPermission = (key: string) => permissions.includes(key);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      isAuthenticated: !!token,
      isAdmin: role === "admin",
      isEmployee: role === "employee",
      permissions,
      hasPermission,
      permissionsLoaded,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
