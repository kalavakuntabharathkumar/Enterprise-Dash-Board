import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Megaphone, Pin, Plus, X, CalendarDays, Users, Briefcase, Newspaper, Bell } from "lucide-react";

interface Announcement {
  id: number; title: string; content: string; type: string;
  pinned: boolean; created_by: string; created_at: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  holiday:      { label: "Holiday",      icon: CalendarDays, color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  meeting:      { label: "Meeting",      icon: Users,        color: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  hr_update:    { label: "HR Update",    icon: Briefcase,    color: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  company_news: { label: "Company News", icon: Newspaper,    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  general:      { label: "General",      icon: Bell,         color: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function AnnouncementsPage() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", content: "", type: "general", pinned: false });

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: () => apiGet("/api/announcements"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiPost("/api/announcements", body),
    onSuccess: () => {
      toast({ title: "Announcement posted" });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setShowForm(false);
      setForm({ title: "", content: "", type: "general", pinned: false });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/announcements/${id}`),
    onSuccess: () => {
      toast({ title: "Announcement deleted" });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const filtered = filter === "all" ? announcements : announcements.filter(a => a.type === filter);
  const pinned = filtered.filter(a => a.pinned);
  const regular = filtered.filter(a => !a.pinned);

  const AnnouncementCard = ({ a }: { a: Announcement }) => {
    const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general;
    const Icon = tc.icon;
    return (
      <div className={cn("bg-white dark:bg-white/3 border rounded-xl p-5 relative group transition-all",
        a.pinned ? "border-amber-200 dark:border-amber-500/20" : "border-gray-100 dark:border-white/8 hover:border-gray-200 dark:hover:border-white/15")}>
        {a.pinned && (
          <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Pin className="w-3 h-3" /> Pinned
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", tc.color.split(" ").slice(1).join(" "))}>
            <Icon className={cn("w-5 h-5", tc.color.split(" ")[0])} />
          </div>
          <div className="flex-1 min-w-0 pr-16">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</h3>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", tc.color)}>{tc.label}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">{a.content}</p>
            <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
              <span>{a.created_by}</span>
              <span>·</span>
              <span>{timeAgo(a.created_at)}</span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => deleteMutation.mutate(a.id)}
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 hover:text-red-500 dark:hover:text-red-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-48" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Company-wide notices, updates, and news.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm shadow-indigo-600/20">
            <Plus className="w-4 h-4" /> Post Announcement
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8 rounded-xl p-1 w-fit">
        {["all", "holiday", "meeting", "hr_update", "company_news", "general"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
              filter === f ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            )}>{f === "hr_update" ? "HR Update" : f === "company_news" ? "Company News" : f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-sm text-gray-400">No announcements found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><Pin className="w-3 h-3" /> Pinned</p>
              {pinned.map(a => <AnnouncementCard key={a.id} a={a} />)}
            </div>
          )}
          {regular.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent</p>}
              {regular.map(a => <AnnouncementCard key={a.id} a={a} />)}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/8">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">New Announcement</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 placeholder:text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                      className="w-4 h-4 rounded accent-indigo-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Pin announcement</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Content</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Write your announcement..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 resize-none placeholder:text-gray-400" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.content || createMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {createMutation.isPending ? "Posting…" : "Post Announcement"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
