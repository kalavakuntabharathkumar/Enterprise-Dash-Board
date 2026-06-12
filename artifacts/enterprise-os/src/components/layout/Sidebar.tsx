import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  CreditCard,
  Target,
  BarChart,
  Bot,
  Settings,
  Bell
} from "lucide-react";

export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navGroups = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Notifications", href: "/notifications", icon: Bell },
      ]
    },
    {
      title: "HRMS",
      items: [
        { name: "Employees", href: "/hrms", icon: Users },
        { name: "Departments", href: "/hrms/departments", icon: Briefcase },
      ]
    },
    {
      title: "CRM & Sales",
      items: [
        { name: "Pipeline", href: "/crm", icon: Target },
        { name: "Deals", href: "/crm/deals", icon: CreditCard },
      ]
    },
    {
      title: "ERP & Finance",
      items: [
        { name: "Inventory", href: "/erp", icon: Package },
        { name: "Finance", href: "/finance", icon: BarChart },
      ]
    },
    {
      title: "Automation",
      items: [
        { name: "AI Copilot", href: "/ai", icon: Bot },
        { name: "Settings", href: "/settings", icon: Settings },
      ]
    }
  ];

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-screen fixed top-0 left-0">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-white">Enterprise OS</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-white">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Admin User</span>
            <span className="text-xs text-sidebar-foreground/60">admin@enterprise.os</span>
          </div>
        </div>
      </div>
    </div>
  );
}
