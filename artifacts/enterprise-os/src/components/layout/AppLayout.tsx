import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Bell, Search, ChevronRight, Sun, Moon, Settings, LogOut, User2, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

function UserDropdown({ onClose }: { onClose: () => void }) {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const handleNav = (path: string) => { navigate(path); onClose(); };
  const handleLogout = () => { logout(); navigate("/login"); onClose(); };

  return (
    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-50 dark:border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name ?? "Loading..."}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate capitalize">{isAdmin ? "Administrator" : "Employee"}</p>
          </div>
        </div>
      </div>

      <div className="py-1.5">
        <button onClick={() => handleNav("/settings")}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <User2 className="w-3.5 h-3.5 text-gray-400" /> View profile
        </button>
        <button onClick={() => handleNav("/settings")}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <Settings className="w-3.5 h-3.5 text-gray-400" /> Settings
        </button>
        <button onClick={() => handleNav("/notifications")}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <Bell className="w-3.5 h-3.5 text-gray-400" /> Notifications
        </button>
      </div>

      <div className="border-t border-gray-50 dark:border-white/8 py-1.5">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const title = pageTitles[location.pathname] || "Enterprise OS";
  const breadcrumbs = title.split(" — ");

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const SEARCH_SHORTCUTS = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Employees", path: "/hrms" },
    { label: "CRM Pipeline", path: "/crm" },
    { label: "Finance", path: "/finance" },
    { label: "Projects", path: "/projects" },
    { label: "AI Copilot", path: "/ai" },
    { label: "Workflows", path: "/workflows" },
    { label: "Settings", path: "/settings" },
  ].filter(s => !searchQuery || s.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white dark:bg-[#080c14] border-b border-gray-100 dark:border-white/5 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />}
                <span className={i === breadcrumbs.length - 1
                  ? "text-gray-800 dark:text-white font-semibold text-sm"
                  : "text-gray-500 dark:text-gray-500 text-sm"
                }>{crumb}</span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowSearch(v => !v)}
                className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 w-52 hover:border-gray-300 dark:hover:border-white/20 transition-colors text-left"
              >
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-400 flex-1">Quick search...</span>
                <kbd className="text-[10px] text-gray-300 dark:text-white/20 font-mono border border-gray-200 dark:border-white/10 rounded px-1 bg-gray-50 dark:bg-transparent">⌘K</kbd>
              </button>

              {showSearch && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 dark:border-white/8">
                    <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search pages..."
                      className="flex-1 text-sm bg-transparent text-gray-800 dark:text-white placeholder:text-gray-400 outline-none" />
                    <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="py-1.5 max-h-64 overflow-y-auto">
                    {SEARCH_SHORTCUTS.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400">No results found</p>
                    ) : SEARCH_SHORTCUTS.map(s => (
                      <button key={s.path}
                        onClick={() => { navigate(s.path); setShowSearch(false); setSearchQuery(""); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={toggleTheme}
              className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-gray-500" />}
            </button>

            <button onClick={() => navigate("/notifications")}
              className="relative w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <Bell className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className={cn(
                  "w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm transition-all ring-2",
                  showUserMenu ? "ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900" : "ring-transparent"
                )}
              >
                {initials}
              </button>
              {showUserMenu && <UserDropdown onClose={() => setShowUserMenu(false)} />}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
