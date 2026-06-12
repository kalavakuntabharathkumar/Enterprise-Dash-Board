import React, { useState } from "react";
import { useListContacts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Users, Search, Plus, Mail, Phone, Building2,
  Globe, MoreHorizontal, UserPlus, Star, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500","from-blue-400 to-cyan-500","from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500","from-rose-400 to-pink-500","from-purple-400 to-indigo-500",
  "from-cyan-400 to-blue-500","from-green-400 to-emerald-500","from-fuchsia-400 to-purple-500",
];

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const { data: contacts, isLoading } = useListContacts({ search: search || undefined });
  const { toast } = useToast();

  const kpis = [
    { label: "Total Contacts", value: contacts?.length ?? 0, icon: Users, color: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { label: "Companies", value: new Set(contacts?.map(c => c.company).filter(Boolean)).size, icon: Building2, color: "bg-blue-50 dark:bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-400" },
    { label: "With Email", value: contacts?.filter(c => c.email).length ?? 0, icon: Mail, color: "bg-emerald-50 dark:bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { label: "With Phone", value: contacts?.filter(c => c.phone).length ?? 0, icon: Phone, color: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-400" },
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
          onClick={() => toast({ title: "Add contact", description: "Contact form coming soon." })}>
          <UserPlus className="w-4 h-4" /> Add Contact
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", k.color)}>
              <Icon className={cn("w-4.5 h-4.5", k.iconColor)} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p>
            </div>
          </div>
        ); })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, or role..."
          className="flex-1 text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
      </div>

      {/* Contact cards grid */}
      {contacts?.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No contacts found</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contacts?.map((contact, idx) => {
            const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            return (
              <div key={contact.id}
                className="group bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-5 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200">
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
                {contact.role && <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">{contact.role}</p>}
                {contact.company && (
                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mb-4">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{contact.company}</span>
                  </div>
                )}

                <div className="space-y-2 border-t border-gray-50 dark:border-white/5 pt-3">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{contact.phone}</span>
                    </a>
                  )}
                </div>

                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                    onClick={() => toast({ title: "Email", description: `Opening email to ${contact.name}.` })}>
                    <Mail className="w-3 h-3" /> Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[11px] font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    onClick={() => toast({ title: "Message", description: `Opening chat with ${contact.name}.` })}>
                    <MessageSquare className="w-3 h-3" /> Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
