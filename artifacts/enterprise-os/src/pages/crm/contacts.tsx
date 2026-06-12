import React, { useState } from "react";
import { useListContacts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Users, Search, Mail, Phone, Building2,
  UserPlus, Star, MessageSquare, Globe, LinkedinIcon, ExternalLink,
  LayoutGrid, List, MoreHorizontal, MapPin, Briefcase, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { AddContactModal } from "@/components/modals/AddContactModal";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500","from-blue-400 to-cyan-500","from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500","from-rose-400 to-pink-500","from-purple-400 to-indigo-500",
  "from-cyan-400 to-blue-500","from-green-400 to-emerald-500","from-fuchsia-400 to-purple-500",
];

type ViewMode = "grid" | "list";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: contacts, isLoading } = useListContacts({ search: search || undefined });
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const uniqueCompanies = new Set(contacts?.map(c => c.company).filter(Boolean)).size;

  const kpis = [
    { label: "Total Contacts", value: contacts?.length ?? 0,                              icon: Users,     color: "bg-indigo-50 dark:bg-indigo-500/10",  iconColor: "text-indigo-600 dark:text-indigo-400",  sub: "in directory" },
    { label: "Companies",      value: uniqueCompanies,                                     icon: Building2, color: "bg-blue-50 dark:bg-blue-500/10",      iconColor: "text-blue-600 dark:text-blue-400",      sub: "represented" },
    { label: "Reachable",      value: contacts?.filter(c => c.email || c.phone).length ?? 0, icon: Mail,   color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400", sub: "with contact info" },
    { label: "With Phone",     value: contacts?.filter(c => c.phone).length ?? 0,          icon: Phone,     color: "bg-amber-50 dark:bg-amber-500/10",    iconColor: "text-amber-600 dark:text-amber-400",    sub: "phone available" },
  ];

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-32" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
      <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_,i) => <div key={i} className="h-44 bg-gray-100 dark:bg-white/5 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Your customer and partner directory.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 gap-1.5"
          onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4" /> Add Contact
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", k.color)}>
                <Icon className={cn("w-4 h-4", k.iconColor)} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{k.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ); })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 flex-1 max-w-sm shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, or role..."
            className="flex-1 text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1 ml-auto">
          <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-md transition-all", view === "grid" ? "bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600")}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView("list")} className={cn("p-1.5 rounded-md transition-all", view === "list" ? "bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white" : "text-gray-400 hover:text-gray-600")}>
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {contacts?.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No contacts found</p></div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contacts?.map((contact, idx) => {
            const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            return (
              <div key={contact.id}
                className="group bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-md", gradient)}>
                    {contact.name.slice(0,2).toUpperCase()}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 text-xs">
                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => toast({ title: "Email", description: `Drafting email to ${contact.name}` })}><Mail className="w-3.5 h-3.5" />Send email</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => toast({ title: "Star", description: `${contact.name} starred.` })}><Star className="w-3.5 h-3.5" />Star contact</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5 truncate">{contact.name}</p>
                {contact.role && (
                  <div className="flex items-center gap-1 mb-1">
                    <Briefcase className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.role}</p>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mb-4 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full w-fit max-w-full">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{contact.company}</span>
                  </div>
                )}

                <div className="space-y-2 border-t border-gray-50 dark:border-white/5 pt-3">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <div className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-2.5 h-2.5 text-indigo-500" />
                      </div>
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span>{contact.phone}</span>
                    </a>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
                    onClick={() => toast({ title: "Email", description: `Opening email to ${contact.name}.` })}>
                    <Mail className="w-3 h-3" /> Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-[11px] font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    onClick={() => toast({ title: "Message", description: `Opening chat with ${contact.name}.` })}>
                    <MessageSquare className="w-3 h-3" /> Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50/40 dark:bg-white/1">
                {["Contact","Role","Company","Email","Phone",""].map((h,i) => (
                  <th key={i} className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {contacts?.map((contact, idx) => {
                const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                return (
                  <tr key={contact.id} className="hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0", gradient)}>
                          {contact.name.slice(0,2).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{contact.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{contact.role || "—"}</td>
                    <td className="px-5 py-3">
                      {contact.company ? (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{contact.company}</span>
                      ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{contact.email || "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{contact.phone || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-600 transition-colors"
                          onClick={() => toast({ title: "Email", description: `Opening email to ${contact.name}.` })}>
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => toast({ title: "View", description: `Viewing ${contact.name}'s profile.` })}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400">{contacts?.length ?? 0} contact{(contacts?.length ?? 0) !== 1 ? "s" : ""}</p>
      <AddContactModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
