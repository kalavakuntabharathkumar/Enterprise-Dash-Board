import React from "react";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Bell, BellDot } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-8">Loading notifications...</div>;

  const handleMarkRead = (id: number) => {
    markRead.mutate(
      { id },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() })
      }
    );
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(
      undefined,
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() })
      }
    );
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2 text-sm">Updates and alerts from across the system.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            <Check className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Inbox {unreadCount > 0 && <span className="bg-primary text-primary-foreground text-xs py-0.5 px-2 rounded-full">{unreadCount}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {notifications?.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 flex gap-4 items-start transition-colors ${!notif.read ? 'bg-muted/30' : 'hover:bg-muted/10'}`}
              >
                <div className={`mt-1 rounded-full p-2 ${!notif.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {!notif.read ? <BellDot size={16} /> : <Bell size={16} />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                </div>
                {!notif.read && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleMarkRead(notif.id)}
                    disabled={markRead.isPending}
                  >
                    <Check size={16} />
                  </Button>
                )}
              </div>
            ))}
            {notifications?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                You're all caught up!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
