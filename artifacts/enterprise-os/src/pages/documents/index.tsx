import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/components/dashboard/widgets/fetchWithAuth";
import { UploadDocumentModal } from "@/components/modals/UploadDocumentModal";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, FileSpreadsheet, FileSearch, Trash2, Download,
  Upload, Search, FolderOpen, Globe, Lock, Building2,
  ShieldCheck, DollarSign,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Document {
  id: number;
  title: string;
  doc_type: string;
  filename: string;
  size_kb: number;
  uploaded_by: string;
  uploaded_by_user_id: number | null;
  category: string;
  visibility: string;
  description: string | null;
  department: string | null;
  employee_name: string | null;
  created_at: string;
}

// ─── Config maps ────────────────────────────────────────────────────────────

const VISIBILITY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  private:      { label: "Private",      icon: Lock,        color: "bg-gray-100 text-gray-600" },
  department:   { label: "Department",   icon: Building2,   color: "bg-blue-100 text-blue-700" },
  organization: { label: "Organization", icon: Globe,       color: "bg-emerald-100 text-emerald-700" },
  hr_only:      { label: "HR Only",      icon: ShieldCheck, color: "bg-purple-100 text-purple-700" },
  finance_only: { label: "Finance Only", icon: DollarSign,  color: "bg-amber-100 text-amber-700" },
};

const CATEGORY_COLORS: Record<string, string> = {
  HR:          "bg-rose-50 text-rose-700 border border-rose-200",
  Finance:     "bg-amber-50 text-amber-700 border border-amber-200",
  Engineering: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  IT:          "bg-cyan-50 text-cyan-700 border border-cyan-200",
  Legal:       "bg-orange-50 text-orange-700 border border-orange-200",
  Sales:       "bg-green-50 text-green-700 border border-green-200",
  Marketing:   "bg-pink-50 text-pink-700 border border-pink-200",
  Operations:  "bg-teal-50 text-teal-700 border border-teal-200",
  General:     "bg-gray-50 text-gray-600 border border-gray-200",
};

const DOC_ICONS: Record<string, React.ElementType> = {
  policy: FileText, report: FileSpreadsheet, contract: FileText,
  offer_letter: FileText, guide: FileSearch, technical: FileSearch,
};

function fileSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}
function fmtDate(s: string) {
  try { return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return s; }
}

// ─── Visibility Badge ───────────────────────────────────────────────────────

function VisibilityBadge({ visibility }: { visibility: string }) {
  const cfg = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.private;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Document row ───────────────────────────────────────────────────────────

function DocRow({ doc, canDelete, onDelete }: { doc: Document; canDelete: boolean; onDelete: (id: number) => void }) {
  const Icon = DOC_ICONS[doc.doc_type] ?? FileText;
  const catCls = CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.General;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{doc.title}</p>
            {doc.description && (
              <p className="text-xs text-gray-400 truncate max-w-[220px]">{doc.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-3">
        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${catCls}`}>{doc.category}</span>
      </td>
      <td className="py-3.5 px-3">
        <VisibilityBadge visibility={doc.visibility} />
      </td>
      <td className="py-3.5 px-3 text-xs text-gray-500 whitespace-nowrap">{doc.uploaded_by}</td>
      <td className="py-3.5 px-3 text-xs text-gray-400 whitespace-nowrap">{fileSize(doc.size_kb)}</td>
      <td className="py-3.5 px-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(doc.created_at)}</td>
      <td className="py-3.5 pl-3 pr-5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            title="Download"
            onClick={() => alert(`Downloading: ${doc.filename}`)}
            className="w-7 h-7 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {canDelete && (
            <button
              title="Delete"
              onClick={() => onDelete(doc.id)}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Summary strip ──────────────────────────────────────────────────────────

function SummaryStrip({ docs }: { docs: Document[] }) {
  const total    = docs.length;
  const orgWide  = docs.filter(d => d.visibility === "organization").length;
  const cats     = new Set(docs.map(d => d.category)).size;
  const cutoff   = new Date(Date.now() - 30 * 86400000);
  const recent   = docs.filter(d => new Date(d.created_at) > cutoff).length;

  const items = [
    { label: "Total Documents",    value: total,   icon: FileText,   color: "bg-indigo-50 text-indigo-600"  },
    { label: "Org-Wide Docs",      value: orgWide, icon: Globe,      color: "bg-emerald-50 text-emerald-600" },
    { label: "Categories",         value: cats,    icon: FolderOpen, color: "bg-amber-50 text-amber-600"    },
    { label: "Added in Last 30d",  value: recent,  icon: Upload,     color: "bg-purple-50 text-purple-600"  },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(c => (
        <Card key={c.label} className="border-gray-100 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
              <c.icon className="w-[18px] h-[18px]" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("all");
  const [visFilter, setVisFilter]   = useState("all");

  const { data: rawDocs = [], isLoading } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: () => fetchWithAuth("/api/documents"),
    refetchInterval: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchWithAuth(`/api/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document deleted", description: "The document has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Could not delete document.", variant: "destructive" }),
  });

  const docs = useMemo(() => rawDocs.filter(d => {
    if (catFilter !== "all" && d.category !== catFilter) return false;
    if (visFilter !== "all" && d.visibility !== visFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [rawDocs, catFilter, visFilter, search]);

  const categories = useMemo(() => [...new Set(rawDocs.map(d => d.category))].sort(), [rawDocs]);

  const isAdminOrOwner = (doc: Document) =>
    ["admin", "super_admin"].includes(user?.role ?? "") || doc.uploaded_by_user_id === null;

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this document? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Document Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Access, upload, and manage organization documents — scoped to your role
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Summary strip */}
      {!isLoading && <SummaryStrip docs={rawDocs} />}

      {/* Filter bar + table */}
      <Card className="border-gray-100 shadow-sm bg-white">
        <CardHeader className="pt-5 px-5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                className="pl-8 h-8 text-sm bg-gray-50 border-gray-200"
                placeholder="Search documents…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="h-8 w-36 text-xs border-gray-200 bg-gray-50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={visFilter} onValueChange={setVisFilter}>
                <SelectTrigger className="h-8 w-40 text-xs border-gray-200 bg-gray-50">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  {Object.entries(VISIBILITY_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 text-center">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading documents…</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No documents found</p>
              <p className="text-xs text-gray-400 mt-1">
                {search || catFilter !== "all" || visFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Upload a document to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["Document", "Category", "Visibility", "Uploaded By", "Size", "Date", ""].map(h => (
                      <th key={h} className={`py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide ${h === "Document" ? "pl-5 pr-3" : h === "" ? "pl-3 pr-5" : "px-3"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      canDelete={isAdminOrOwner(doc)}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          qc.invalidateQueries({ queryKey: ["documents"] });
          setUploadOpen(false);
        }}
      />
    </div>
  );
}
