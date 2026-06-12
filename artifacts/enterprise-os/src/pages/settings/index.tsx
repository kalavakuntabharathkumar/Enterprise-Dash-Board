import React, { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  User2, Palette, Bell, Shield, LogOut, Sun, Moon, Monitor,
  Camera, Check, ChevronRight, Key, Smartphone, Globe,
  ToggleLeft, Mail, MessageSquare, AlertTriangle, Save,
  Building2, Clock, Languages
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "profile" | "appearance" | "notifications" | "security";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "Profile",       icon: User2 },
  { id: "appearance",   label: "Appearance",     icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security",     label: "Security",       icon: Shield },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-10 h-5.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        checked ? "bg-indigo-600" : "bg-gray-200 dark:bg-white/10"
      )}
    >
      <span className={cn(
        "absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-4.5" : "translate-x-0"
      )} />
    </button>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: user, isLoading } = useGetMe();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [notifs, setNotifs] = useState({ email: true, push: false, slack: true, alerts: true });
  const [name, setName] = useState("");

  React.useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSave = () => {
    toast({ title: "Changes saved", description: "Your profile has been updated." });
  };

  const handlePasswordChange = () => {
    toast({ title: "Password email sent", description: "Check your email for a password reset link." });
  };

  const handle2FA = () => {
    toast({ title: "2FA setup", description: "Two-factor authentication setup coming soon." });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-3xl">
        <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-lg w-24" />
        <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl" />
      </div>
    );
  }

  const initials = user?.name?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your account, preferences, and security.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-white/8">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Sign out
              </button>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <>
              <SectionCard title="Personal Information" description="Update your name and profile photo.">
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-2 ring-gray-100 dark:ring-white/10">
                      <AvatarImage src={user?.avatar || ""} />
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">{initials}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => toast({ title: "Upload avatar", description: "File picker coming soon." })}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-sm transition-colors"
                    >
                      <Camera className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                    <button
                      onClick={() => toast({ title: "Upload avatar", description: "File picker coming soon." })}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 font-medium transition-colors"
                    >
                      Change photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="h-9 text-sm bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                    <Input
                      defaultValue={user?.email}
                      disabled
                      className="h-9 text-sm bg-gray-50 dark:bg-white/3 border-gray-200 dark:border-white/10 text-gray-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Role</Label>
                    <Input
                      defaultValue={user?.role}
                      disabled
                      className="h-9 text-sm bg-gray-50 dark:bg-white/3 border-gray-200 dark:border-white/10 text-gray-500 capitalize"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Time Zone</Label>
                    <select className="w-full h-9 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-3 text-gray-700 dark:text-gray-300 outline-none">
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC+0 (London)</option>
                      <option>UTC+1 (Paris)</option>
                      <option>UTC+5:30 (Mumbai)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 gap-1.5 shadow-sm shadow-indigo-600/20">
                    <Save className="w-3.5 h-3.5" />
                    Save changes
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Organization" description="Your workspace information.">
                <div className="space-y-3">
                  {[
                    { icon: Building2, label: "Organization", value: "Enterprise Corp" },
                    { icon: Globe, label: "Plan", value: "Enterprise" },
                    { icon: Clock, label: "Member since", value: "January 2024" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === "appearance" && (
            <>
              <SectionCard title="Theme" description="Choose your preferred color scheme.">
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: "light", label: "Light", icon: Sun },
                    { id: "dark", label: "Dark", icon: Moon },
                    { id: "system", label: "System", icon: Monitor },
                  ] as const).map(opt => {
                    const Icon = opt.icon;
                    const isActive = theme === opt.id || (opt.id === "system" && false);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => opt.id !== "system" ? setTheme(opt.id as "light" | "dark") : toast({ title: "System theme", description: "Follows your OS preference." })}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          theme === opt.id
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                            : "border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/3 hover:border-gray-200 dark:hover:border-white/15"
                        )}
                      >
                        {theme === opt.id && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          theme === opt.id ? "bg-indigo-100 dark:bg-indigo-500/20" : "bg-white dark:bg-white/5"
                        )}>
                          <Icon className={cn("w-4 h-4", theme === opt.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500")} />
                        </div>
                        <span className={cn("text-xs font-semibold", theme === opt.id ? "text-indigo-700 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400")}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Display" description="Customize the interface density and font size.">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Compact mode</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reduce spacing for more content on screen</p>
                    </div>
                    <ToggleSwitch checked={false} onChange={() => toast({ title: "Compact mode", description: "This preference will be saved." })} />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Sidebar collapsed by default</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Start with the sidebar minimized</p>
                    </div>
                    <ToggleSwitch checked={false} onChange={() => toast({ title: "Sidebar preference", description: "This preference will be saved." })} />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <SectionCard title="Notification Preferences" description="Choose where and how you receive alerts.">
              <div className="space-y-1">
                {[
                  { key: "email" as const, icon: Mail, label: "Email notifications", desc: "Receive summaries and alerts via email" },
                  { key: "push" as const, icon: Smartphone, label: "Push notifications", desc: "Browser and mobile push alerts" },
                  { key: "slack" as const, icon: MessageSquare, label: "Slack integration", desc: "Send alerts to your Slack workspace" },
                  { key: "alerts" as const, icon: AlertTriangle, label: "Critical alerts", desc: "Always notify for high-priority events" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-white/5 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={notifs[item.key]}
                        onChange={(v) => {
                          setNotifs(prev => ({ ...prev, [item.key]: v }));
                          toast({ title: v ? "Enabled" : "Disabled", description: `${item.label} ${v ? "enabled" : "disabled"}.` });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <>
              <SectionCard title="Password" description="Update your account password.">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Current password</Label>
                    <Input type="password" placeholder="••••••••" className="h-9 text-sm bg-white dark:bg-white/5 border-gray-200 dark:border-white/10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">New password</Label>
                    <Input type="password" placeholder="••••••••" className="h-9 text-sm bg-white dark:bg-white/5 border-gray-200 dark:border-white/10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Confirm new password</Label>
                    <Input type="password" placeholder="••••••••" className="h-9 text-sm bg-white dark:bg-white/5 border-gray-200 dark:border-white/10" />
                  </div>
                  <div className="pt-2">
                    <Button onClick={handlePasswordChange} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 gap-1.5 shadow-sm shadow-indigo-600/20">
                      <Key className="w-3.5 h-3.5" />
                      Update password
                    </Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">2FA not enabled</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Protect your account with an authenticator app</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={handle2FA}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Enable 2FA
                  </Button>
                </div>
              </SectionCard>

              <SectionCard title="Active Sessions" description="Manage where you're currently signed in.">
                <div className="space-y-3">
                  {[
                    { device: "MacBook Pro", location: "San Francisco, CA", current: true, time: "Now" },
                    { device: "iPhone 16 Pro", location: "San Francisco, CA", current: false, time: "2 hours ago" },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                          <Monitor className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{session.device}</p>
                            {session.current && (
                              <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{session.location} · {session.time}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <button
                          onClick={() => toast({ title: "Session ended", description: `${session.device} has been signed out.` })}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="bg-red-50 dark:bg-red-500/8 border border-red-100 dark:border-red-500/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">Danger zone</h3>
                <p className="text-xs text-red-600 dark:text-red-500 mb-4">Once you delete your account, there is no going back.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/15"
                  onClick={() => toast({ title: "Account deletion", description: "Please contact support to delete your account.", variant: "destructive" })}
                >
                  Delete account
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
