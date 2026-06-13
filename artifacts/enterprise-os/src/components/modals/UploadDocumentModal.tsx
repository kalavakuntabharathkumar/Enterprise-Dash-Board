import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/components/dashboard/widgets/fetchWithAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Lock, Globe, Building2, ShieldCheck, DollarSign } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

const CATEGORIES = ["General", "HR", "Finance", "Engineering", "IT", "Legal", "Sales", "Marketing", "Operations"];
const DOC_TYPES  = [
  { value: "policy",      label: "Policy" },
  { value: "report",      label: "Report" },
  { value: "contract",    label: "Contract" },
  { value: "offer_letter",label: "Offer Letter" },
  { value: "guide",       label: "Guide" },
  { value: "technical",   label: "Technical Doc" },
  { value: "general",     label: "General" },
];

const VISIBILITY_OPTIONS = [
  { value: "private",      label: "Private",       desc: "Only you and admins",         icon: Lock,        color: "text-gray-500" },
  { value: "department",   label: "Department",    desc: "Your department members",     icon: Building2,   color: "text-blue-500" },
  { value: "organization", label: "Organization",  desc: "All company employees",       icon: Globe,       color: "text-emerald-500" },
  { value: "hr_only",      label: "HR Only",       desc: "HR managers and admins",      icon: ShieldCheck, color: "text-purple-500" },
  { value: "finance_only", label: "Finance Only",  desc: "Finance managers and admins", icon: DollarSign,  color: "text-amber-500" },
];

interface FormState {
  title: string;
  doc_type: string;
  filename: string;
  size_kb: number;
  description: string;
  category: string;
  visibility: string;
}

const DEFAULT_FORM: FormState = {
  title: "",
  doc_type: "policy",
  filename: "",
  size_kb: 256,
  description: "",
  category: "General",
  visibility: "private",
};

export function UploadDocumentModal({ open, onClose, onUploaded }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const mutation = useMutation({
    mutationFn: (body: FormState) =>
      fetchWithAuth("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast({ title: "Document uploaded", description: `"${form.title}" has been added to the Document Center.` });
      setForm(DEFAULT_FORM);
      onUploaded();
    },
    onError: (e: any) =>
      toast({ title: "Upload failed", description: e?.message ?? "Please check your inputs.", variant: "destructive" }),
  });

  const field = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const canSubmit = form.title.trim() && form.filename.trim() && !mutation.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Upload Document</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Document Title <span className="text-red-400">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => field("title", e.target.value)}
              placeholder="e.g. Q1 Financial Report"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-400 outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => field("description", e.target.value)}
              placeholder="Brief description of the document…"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-400 outline-none transition-colors resize-none"
            />
          </div>

          {/* Filename + Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Filename <span className="text-red-400">*</span>
              </label>
              <input
                value={form.filename}
                onChange={e => field("filename", e.target.value)}
                placeholder="document.pdf"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-400 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Size (KB)</label>
              <input
                type="number"
                value={form.size_kb}
                min={1}
                onChange={e => field("size_kb", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-400 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Type + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Document Type</label>
              <select
                value={form.doc_type}
                onChange={e => field("doc_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-400 outline-none transition-colors"
              >
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => field("category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-400 outline-none transition-colors"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Visibility</label>
            <div className="space-y-1.5">
              {VISIBILITY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const selected = form.visibility === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field("visibility", opt.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      selected
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${selected ? "text-indigo-600" : opt.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${selected ? "text-indigo-700" : "text-gray-700"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-gray-400">{opt.desc}</p>
                    </div>
                    {selected && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!canSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            {mutation.isPending ? "Uploading…" : "Upload Document"}
          </button>
        </div>
      </div>
    </div>
  );
}
