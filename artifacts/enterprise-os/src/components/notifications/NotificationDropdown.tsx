import React, { useState, useRef, useEffect } from "react";
import { Bell, BellDot, CheckCheck, ExternalLink, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useListNotifications } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function markOneRead(id: number) {
  const token = localStorage.getItem("enterprise_os_token");
  await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function markAllReadApi() {
  const token = localStorage.getItem("enterprise_os_token");
  await fetch("/api/notifications/mark-all-read", {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: notifications, refetch } = useListNotifications(
    {},
    { refetchInterval: 30000 } as any,
  );

  const items: any[] = (notifications as any[]) || [];
  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleItemClick = async (item: any) => {
    if (!item.read) {
      await markOneRead(item.id);
      refetch();
    }
    if (item.link) {
      navigate(item.link);
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    await markAllReadApi();
    refetch();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        title="Notifications"
      >
        <Bell className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-indigo-500 rounded-full flex items-center justify-center px-1 text-[9px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-white/8">
            <div className="flex items-center gap-2">
              <BellDot className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 dark:text-white/10 mx-auto mb-2" />
                <p className="text-xs text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              items.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 dark:border-white/5 last:border-0",
                    !item.read
                      ? "bg-indigo-50/40 dark:bg-indigo-500/5 hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide flex-shrink-0 mt-0.5",
                      TYPE_COLORS[item.type] ?? TYPE_COLORS.info,
                    )}
                  >
                    {item.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium truncate",
                        !item.read
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {item.message}
                    </p>
                    {item.created_at && (
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">
                        {timeAgo(item.created_at)}
                      </p>
                    )}
                  </div>
                  {!item.read && (
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-50 dark:border-white/8">
            <button
              onClick={() => {
                navigate("/notifications");
                setOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              View all notifications
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
