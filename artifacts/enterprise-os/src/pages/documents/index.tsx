import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { FileText, Download, Upload, Search, Building2, User2, Shield, FileCheck, Plus, X } from "lucide-react";

interface Document { id: number; title: string; doc_type: string; filename: string; size_kb: number; uploaded_by: string; is_company_doc: boolean; employee_name?: string; created_at: string; }

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  policy:       { label: "Policy",       icon: Shield,    color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" },
  contract:     { label: "Contract",     icon: FileCheck, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  offer_letter: { label: "Offer Letter", icon: FileText,  color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  certificate:  { label: "Certificate",  icon: FileCheck, color: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  id_proof:     { label: "ID Proof",     icon: User2,     color: "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400" },
  general:      { label: "Document",     icon: FileText,  color: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400" },
};

function fmtSize(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function fmtDate(s: string) { return new Date(s).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }); }

export default function DocumentsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "company" | "personal">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: "", doc_type: "policy", filename: "", size_kb: 256, is_company_doc: true });

  const { data: docs = [], isLoading } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: () => apiGet("/api/documents"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiPost("/api/documents", body),
    onSuccess: () => {
      toast({ title: "Document added" });
      qc.invalidateQueries({ queryKey: ["documents"] });
      setShowUpload(false);
      setForm({ title: "", doc_type: "policy", filename: "", size_kb: 256, is_company_doc: true });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleDownload = (doc: Document) => {
    toast({ title: "Download started", description: `${doc.filename} is being prepared.` });
  };

  const filtered = docs.filter(d => {
    const matchTab = tab === "all" || (tab === "company" ? d.is_company_doc : !d.is_company_doc);
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.doc_type.includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const grouped = Object.entries(
    filtered.reduce((acc, d) => {
      const key = d.is_company_doc ? "Company Documents" : "My Documents";
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    }, {} as Record<string, Document[]>)
  );

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Document Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Access company policies, contracts, and personal documents.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowUpload(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm shadow-indigo-600/20">
            <Plus className="w-4 h-4" /> Add Document
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 rounded-xl p-1">
          {(["all", "company", "personal"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                tab === t ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              )}>{t === "all" ? "All Documents" : t === "company" ? "Company Docs" : "My Documents"}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-white/3 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 ml-auto flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
            className="flex-1 text-sm bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-2">
        {[
          { label: "Total Documents", value: docs.length, icon: FileText, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Company Policies", value: docs.filter(d => d.is_company_doc).length, icon: Building2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Personal Documents", value: docs.filter(d => !d.is_company_doc).length, icon: User2, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
        ].map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", k.bg)}><Icon className={cn("w-5 h-5", k.color)} /></div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p></div>
          </div>
        ); })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-sm text-gray-400">No documents found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([groupName, groupDocs]) => (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-3">
                {groupName === "Company Documents" ? <Building2 className="w-4 h-4 text-gray-400" /> : <User2 className="w-4 h-4 text-gray-400" />}
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{groupName}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/8 px-1.5 py-0.5 rounded-full">{groupDocs.length}</span>
              </div>
              <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl overflow-hidden">
                {groupDocs.map((doc, i) => {
                  const tc = TYPE_CONFIG[doc.doc_type] || TYPE_CONFIG.general;
                  const Icon = tc.icon;
                  return (
                    <div key={doc.id} className={cn("flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors group",
                      i < groupDocs.length - 1 && "border-b border-gray-50 dark:border-white/5")}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", tc.color.split(" ").slice(1).join(" "))}>
                        <Icon className={cn("w-5 h-5", tc.color.split(" ")[0])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", tc.color)}>{tc.label}</span>
                          <span className="text-[11px] text-gray-400">{doc.filename}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-xs text-gray-400">{fmtSize(doc.size_kb)}</p>
                        <p className="text-[11px] text-gray-300 dark:text-white/20 mt-0.5">{fmtDate(doc.created_at)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-xs text-gray-400">By {doc.uploaded_by}</p>
                      </div>
                      <button onClick={() => handleDownload(doc)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/8">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Document</h2>
              <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Document title..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 placeholder:text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Type</label>
                  <select value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Filename</label>
                  <input value={form.filename} onChange={e => setForm(f => ({ ...f, filename: e.target.value }))} placeholder="file.pdf"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-400 placeholder:text-gray-400" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_company_doc} onChange={e => setForm(f => ({ ...f, is_company_doc: e.target.checked }))} className="w-4 h-4 rounded accent-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Company-wide document (visible to all employees)</span>
              </label>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowUpload(false)} className="flex-1">Cancel</Button>
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.filename || createMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                  <Upload className="w-4 h-4" /> {createMutation.isPending ? "Adding…" : "Add Document"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
