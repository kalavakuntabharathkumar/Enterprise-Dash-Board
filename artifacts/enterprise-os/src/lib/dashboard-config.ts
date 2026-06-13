export interface QuickAction {
  label: string;
  href: string;
  color: string;
}

export interface DashboardConfig {
  title: string;
  subtitle: string;
  quickActions: QuickAction[];
}

const C = {
  indigo:  "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20",
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20",
  amber:   "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20",
  purple:  "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20",
  blue:    "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20",
};

const CONFIGS: Record<string, DashboardConfig> = {
  admin: {
    title: "Dashboard",
    subtitle: "Organization command center — full visibility.",
    quickActions: [
      { label: "Review Leave Requests", href: "/hrms/leaves",     color: C.indigo  },
      { label: "Add Employee",          href: "/hrms",            color: C.indigo  },
      { label: "Create Invoice",        href: "/finance/invoices",color: C.emerald },
      { label: "New Lead",              href: "/crm/leads",       color: C.amber   },
      { label: "Start Project",         href: "/projects",        color: C.purple  },
      { label: "View Analytics",        href: "/analytics",       color: C.blue    },
    ],
  },
  hr_manager: {
    title: "HR Dashboard",
    subtitle: "Workforce overview and leave management.",
    quickActions: [
      { label: "Review Leave Requests", href: "/hrms/leaves",     color: C.indigo  },
      { label: "Employee Directory",    href: "/hrms",            color: C.emerald },
      { label: "Attendance Records",    href: "/hrms/attendance", color: C.amber   },
      { label: "View Analytics",        href: "/analytics",       color: C.blue    },
    ],
  },
  dept_head: {
    title: "Team Dashboard",
    subtitle: "Your department overview.",
    quickActions: [
      { label: "Approve Leaves",  href: "/hrms/leaves", color: C.indigo  },
      { label: "Team Members",    href: "/hrms",        color: C.emerald },
      { label: "Active Projects", href: "/projects",    color: C.purple  },
      { label: "View Analytics",  href: "/analytics",   color: C.blue    },
    ],
  },
  finance_manager: {
    title: "Finance Dashboard",
    subtitle: "Financial overview and pending actions.",
    quickActions: [
      { label: "Create Invoice",   href: "/finance/invoices", color: C.emerald },
      { label: "Track Expenses",   href: "/finance/expenses", color: C.amber   },
      { label: "Payroll Reports",  href: "/finance",          color: C.indigo  },
      { label: "View Analytics",   href: "/analytics",        color: C.blue    },
    ],
  },
  employee: {
    title: "My Workspace",
    subtitle: "Your personal overview and tasks.",
    quickActions: [
      { label: "Submit Leave Request", href: "/hrms/leaves",   color: C.indigo },
      { label: "My Projects",          href: "/projects",      color: C.purple },
      { label: "Notifications",        href: "/notifications", color: C.amber  },
      { label: "AI Copilot",           href: "/ai-copilot",    color: C.blue   },
    ],
  },
};

export function getDashboardConfig(role: string | null | undefined): DashboardConfig {
  if (!role) return CONFIGS.employee;
  if (role === "super_admin") return CONFIGS.admin;
  return CONFIGS[role] ?? CONFIGS.employee;
}
