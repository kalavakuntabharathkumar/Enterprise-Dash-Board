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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("enterprise_os_token"));
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("enterprise_os_token"));
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("enterprise_os_token");
    if (storedToken && !user) {
      fetchMe(storedToken).then((u) => {
        if (u) setUser(u);
        else {
          localStorage.removeItem("enterprise_os_token");
          setToken(null);
        }
      });
    }
  }, []);

  const login = (newToken: string, newUser: UserInfo) => {
    localStorage.setItem("enterprise_os_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("enterprise_os_token");
    setToken(null);
    setUser(null);
  };

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      isAuthenticated: !!token,
      isAdmin: role === "admin",
      isEmployee: role === "employee",
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
