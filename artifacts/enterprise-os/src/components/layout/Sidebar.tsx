import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, Briefcase, Package, CreditCard,
  Target, BarChart2, Bot, Settings, Bell, FolderOpen,
  Workflow, ChevronDown, ChevronRight, Building2, Calendar,
  UserCheck, ShoppingCart, FileText, Receipt, LogOut,
  TrendingUp, ClipboardList, UserCircle, Shield,
  Megaphone, Clock, LifeBuoy, FileSearch, Map, DollarSign
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  children?: { name: string; href: string }[];
  requiredPermission?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  requiredPermission?: string;
}

// Role display labels — covers legacy roles and new RBAC roles
const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  employee: "Employee",
  super_admin: "Super Admin",
  hr_manager: "HR Manager",
  finance_manager: "Finance Manager",
  project_manager: "Project Manager",
  department_head: "Department Head",
};

// Badge color per role category
function roleBadgeClass(role: string): string {
  if (role === "admin" || role === "super_admin") return "bg-indigo-500/15 text-indigo-400";
  if (role === "hr_manager" || role === "department_head") return "bg-amber-500/15 text-amber-400";
  if (role === "finance_manager") return "bg-emerald-500/15 text-emerald-400";
  if (role === "project_manager") return "bg-sky-500/15 text-sky-400";
  return "bg-white/10 text-white/50";
}

// Full platform nav — items gate themselves via requiredPermission.
// Shown to any user who is not a plain "employee" (isEmployee === false).
const ADMIN_NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Announcements", href: "/announcements", icon: Megaphone },
    ],
  },
  {
    title: "Modules",
    items: [
      {
        name: "HRMS",
        href: "/hrms",
        icon: Users,
        requiredPermission: "manage_employees",
        children: [
          { name: "Employees", href: "/hrms" },
          { name: "Departments", href: "/hrms/departments" },
          { name: "Attendance", href: "/hrms/attendance" },
          { name: "Leave Requests", href: "/hrms/leaves" },
          { name: "Team Directory", href: "/directory" },
        ],
      },
      {
        name: "CRM",
        href: "/crm",
        icon: Target,
        requiredPermission: "manage_settings",
        children: [
          { name: "Pipeline", href: "/crm" },
          { name: "Leads", href: "/crm/leads" },
          { name: "Contacts", href: "/crm/contacts" },
          { name: "Deals", href: "/crm/deals" },
        ],
      },
      {
        name: "ERP",
        href: "/erp",
        icon: Package,
        requiredPermission: "manage_settings",
        children: [
          { name: "Inventory", href: "/erp" },
          { name: "Vendors", href: "/erp/vendors" },
          { name: "Purchases", href: "/erp/purchases" },
        ],
      },
      {
        name: "Finance",
        href: "/finance",
        icon: CreditCard,
        requiredPermission: "view_finance",
        children: [
          { name: "Overview", href: "/finance" },
          { name: "Invoices", href: "/finance/invoices" },
          { name: "Expenses", href: "/finance/expenses" },
          { name: "Payslips", href: "/payslips" },
        ],
      },
      {
        name: "Projects",
        href: "/projects",
        icon: FolderOpen,
        requiredPermission: "manage_projects",
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart2, requiredPermission: "view_analytics" },
      { name: "AI Copilot", href: "/ai", icon: Bot },
      { name: "Workflows", href: "/workflows", icon: Workflow, requiredPermission: "manage_settings" },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Support Requests", href: "/support", icon: LifeBuoy },
      { name: "Settings", href: "/settings", icon: Settings, requiredPermission: "manage_settings" },
    ],
  },
];

// Personal-view nav for plain employees
const EMPLOYEE_NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Announcements", href: "/announcements", icon: Megaphone },
    ],
  },
  {
    title: "My Work",
    items: [
      { name: "My Projects", href: "/projects", icon: FolderOpen },
      { name: "My Leaves", href: "/my-leaves", icon: ClipboardList },
      { name: "Timesheets", href: "/timesheets", icon: Clock },
      { name: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Team Directory", href: "/directory", icon: Users },
    ],
  },
  {
    title: "HR & Finance",
    items: [
      { name: "Payslips", href: "/payslips", icon: DollarSign },
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Support & Requests", href: "/support", icon: LifeBuoy },
    ],
  },
  {
    title: "Tools",
    items: [
      { name: "AI Copilot", href: "/ai", icon: Bot },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "My Profile", href: "/profile", icon: UserCircle },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { logout, user, isEmployee, hasPermission, permissionsLoaded } = useAuth();
  const navigate = useNavigate();

  // Non-employee users (admin, hr_manager, finance_manager, etc.) see the platform nav;
  // plain employees see the personal nav.
  const useAdminNav = !isEmployee;

  const [expanded, setExpanded] = useState<string[]>(
    useAdminNav ? ["/hrms", "/crm", "/finance"] : []
  );

  const toggleExpand = (key: string) => {
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Filter platform nav items by the user's live permissions.
  // If permissions haven't loaded yet, render the group structure without item-level filtering
  // so there's no jarring layout shift once they arrive.
  const filteredAdminNav: NavGroup[] = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.requiredPermission) return true;
      if (!permissionsLoaded) return false;
      return hasPermission(item.requiredPermission);
    }),
  })).filter((group) => group.items.length > 0);

  const navGroups = useAdminNav ? filteredAdminNav : EMPLOYEE_NAV;

  const isActive = (href: string) =>
    currentPath === href || (href !== "/" && currentPath.startsWith(href + "/"));

  const isGroupActive = (item: NavItem) =>
    isActive(item.href) || (item.children?.some((c) => isActive(c.href)) ?? false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const role = user?.role ?? "employee";
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <div className="w-64 bg-[#0f1117] text-white flex flex-col h-screen fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">Enterprise OS</p>
            <p className="text-[10px] text-white/30 tracking-wide">Unified Platform</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold w-fit",
          roleBadgeClass(role)
        )}>
          {useAdminNav ? <Shield className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
          {roleLabel}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isGroupActive(item);
                const isExpanded = expanded.includes(item.href);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.href}>
                    {hasChildren ? (
                      <button
                        onClick={() => toggleExpand(item.href)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                          active
                            ? "bg-white/10 text-white"
                            : "text-white/50 hover:text-white/80 hover:bg-white/5"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left font-medium">{item.name}</span>
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                          : <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                        }
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                          isActive(item.href)
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                            : "text-white/50 hover:text-white/80 hover:bg-white/5"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )}

                    {hasChildren && isExpanded && (
                      <div className="ml-4 mt-0.5 pl-3 border-l border-white/8 space-y-0.5">
                        {item.children!.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-150",
                              isActive(child.href)
                                ? "text-indigo-400 font-semibold bg-indigo-600/10"
                                : "text-white/40 hover:text-white/70 hover:bg-white/5"
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User profile */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/80 truncate">{user?.name ?? "Loading..."}</p>
            <p className="text-[10px] text-white/30 truncate">{roleLabel}</p>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            title="Sign out"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-white/30"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
