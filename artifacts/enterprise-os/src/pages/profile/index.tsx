import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { User2, Mail, Phone, MapPin, Shield, Briefcase, Calendar, Edit3, Save, X, Plus, Lock, AlertCircle } from "lucide-react";

interface Profile {
  user_id: number; name: string; email: string; role: string;
  phone?: string; address?: string; emergency_contact?: string; emergency_phone?: string;
  skills?: string; bio?: string; department?: string; position?: string;
  salary?: number; joined_date?: string; location?: string;
}

export default function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [newSkill, setNewSkill] = useState("");
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["profile-me"],
    queryFn: () => apiGet("/api/profiles/me"),
  });

  useEffect(() => {
    if (profile) setForm({ phone: profile.phone || "", address: profile.address || "", emergency_contact: profile.emergency_contact || "", emergency_phone: profile.emergency_phone || "", skills: profile.skills || "", bio: profile.bio || "" });
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (body: Partial<Profile>) => apiPatch("/api/profiles/me", body),
    onSuccess: () => {
      toast({ title: "Profile updated" });
      qc.invalidateQueries({ queryKey: ["profile-me"] });
      setEditMode(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pwMutation = useMutation({
    mutationFn: (body: any) => apiPost("/api/profiles/me/change-password", body),
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setPwMode(false);
      setPw({ current_password: "", new_password: "", confirm: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const skills = (form.skills || "").split(",").map(s => s.trim()).filter(Boolean);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const updated = [...skills, newSkill.trim()].join(",");
    setForm(f => ({ ...f, skills: updated }));
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    const updated = skills.filter(s => s !== skill).join(",");
    setForm(f => ({ ...f, skills: updated }));
  };

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (pw.new_password.length < 6) { toast({ title: "Password too short (min 6 chars)", variant: "destructive" }); return; }
    pwMutation.mutate({ current_password: pw.current_password, new_password: pw.new_password });
  };

  const initials = user?.name ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "?";

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-gray-100 dark:bg-white/5 rounded-2xl" />
      <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your personal information and account settings.</p>
      </div>

      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{profile?.name || user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.position || "—"} · {profile?.department || "—"}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                isAdmin ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400")}>
                <Shield className="w-3 h-3" /> {isAdmin ? "Administrator" : "Employee"}
              </span>
              {profile?.location && <span className="inline-flex items-center gap-1 text-[10px] text-gray-500"><MapPin className="w-3 h-3" />{profile.location}</span>}
              {profile?.joined_date && <span className="inline-flex items-center gap-1 text-[10px] text-gray-500"><Calendar className="w-3 h-3" />Joined {new Date(profile.joined_date).toLocaleDateString("en",{month:"long",year:"numeric"})}</span>}
            </div>
          </div>
          <Button onClick={() => setEditMode(!editMode)} variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
            {editMode ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {editMode ? "Cancel" : "Edit"}
          </Button>
        </div>

        {form.bio !== undefined && (
          <div className="mt-5 pt-5 border-t border-gray-50 dark:border-white/5">
            {editMode ? (
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={2} placeholder="Add a short bio..."
                className="w-full text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-400 resize-none placeholder:text-gray-400" />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">{profile?.bio || <span className="text-gray-300 dark:text-white/20 italic">No bio added yet.</span>}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><User2 className="w-4 h-4 text-gray-400" /> Contact Info</h3>
          <div className="space-y-3">
            {[
              { label: "Email", key: "email", icon: Mail, value: profile?.email, editable: false },
              { label: "Phone", key: "phone", icon: Phone, value: form.phone, editable: true },
              { label: "Address", key: "address", icon: MapPin, value: form.address, editable: true },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{f.label}</label>
                {editMode && f.editable ? (
                  <input value={(form as any)[f.key] || ""} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="mt-1 w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400" />
                ) : (
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <f.icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {f.value || <span className="text-gray-300 dark:text-white/20 italic">Not set</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-gray-400" /> Emergency Contact</h3>
          <div className="space-y-3">
            {[
              { label: "Contact Name", key: "emergency_contact" },
              { label: "Phone Number", key: "emergency_phone" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{f.label}</label>
                {editMode ? (
                  <input value={(form as any)[f.key] || ""} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="mt-1 w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400" />
                ) : (
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{(profile as any)?.[f.key] || <span className="text-gray-300 dark:text-white/20 italic">Not set</span>}</p>
                )}
              </div>
            ))}
            {profile?.department && (
              <div className="pt-3 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <span>{profile.position} · {profile.department}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Skills & Expertise</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map(s => (
            <span key={s} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
              {s}
              {editMode && <button onClick={() => removeSkill(s)} className="ml-0.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>}
            </span>
          ))}
          {editMode && (
            <div className="flex items-center gap-1">
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Add skill..."
                className="text-xs bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-full px-3 py-1 outline-none focus:border-indigo-400 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 w-28" />
              <button onClick={addSkill} className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {skills.length === 0 && !editMode && <p className="text-sm text-gray-400 italic">No skills added yet.</p>}
        </div>
      </div>

      {editMode && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
          <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            <Save className="w-4 h-4" />{updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2"><Lock className="w-4 h-4 text-gray-400" /> Security</h3>
          <Button variant="outline" size="sm" onClick={() => setPwMode(!pwMode)} className="gap-1.5">
            {pwMode ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {pwMode ? "Cancel" : "Change Password"}
          </Button>
        </div>
        {pwMode ? (
          <form onSubmit={handlePwSubmit} className="space-y-3 max-w-sm">
            {[
              { key: "current_password", label: "Current Password" },
              { key: "new_password", label: "New Password" },
              { key: "confirm", label: "Confirm New Password" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">{f.label}</label>
                <input type="password" value={(pw as any)[f.key]} onChange={e => setPw(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400" />
              </div>
            ))}
            <Button type="submit" disabled={pwMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {pwMutation.isPending ? "Updating…" : "Update Password"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Password last changed: never. We recommend using a strong, unique password.</p>
        )}
      </div>
    </div>
  );
}
