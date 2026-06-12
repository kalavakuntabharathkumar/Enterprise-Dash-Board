import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { DollarSign, Download, TrendingUp, Calendar, Award, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Payslip {
  id: number; employee_id: number; employee_name: string; month: string;
  salary: number; deductions: number; bonus: number; final_amount: number;
  status: string; generated_at: string;
}

function fmt(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(+y, +mo - 1).toLocaleDateString("en", { month: "long", year: "numeric" });
}

export default function PayslipsPage() {
  const { isAdmin } = useAuth();
  const [selected, setSelected] = useState<Payslip | null>(null);

  const { data: payslips = [], isLoading } = useQuery<Payslip[]>({
    queryKey: ["payslips"],
    queryFn: () => apiGet("/api/payslips"),
  });

  const sorted = [...payslips].sort((a, b) => b.month.localeCompare(a.month));
  const ytdEarnings = payslips.reduce((s, p) => s + p.final_amount, 0);
  const ytdBonus    = payslips.reduce((s, p) => s + p.bonus, 0);
  const ytdDed      = payslips.reduce((s, p) => s + p.deductions, 0);

  const chartData = [...payslips]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(p => ({
      month: new Date(p.month + "-01").toLocaleDateString("en", { month: "short" }),
      "Net Pay": Math.round(p.final_amount),
      "Gross": Math.round(p.salary + p.bonus),
    }));

  const handleDownload = (p: Payslip) => {
    const content = [
      "=" .repeat(50),
      "         ENTERPRISE OS — PAYSLIP",
      "=" .repeat(50),
      `Month:          ${monthLabel(p.month)}`,
      `Employee:       ${p.employee_name}`,
      `Status:         ${p.status.toUpperCase()}`,
      "-".repeat(50),
      `Basic Salary:   ${fmt(p.salary)}`,
      `Bonus:          ${fmt(p.bonus)}`,
      `Deductions:     -${fmt(p.deductions)}`,
      "-".repeat(50),
      `NET PAY:        ${fmt(p.final_amount)}`,
      "=" .repeat(50),
      `Generated: ${new Date(p.generated_at).toLocaleDateString()}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `payslip_${p.month}_${p.employee_name.replace(" ", "_")}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 dark:bg-white/5 rounded w-40" />
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_,i) => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  const kpis = [
    { label: "YTD Net Earnings", value: fmt(ytdEarnings), icon: DollarSign, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
    { label: "YTD Bonus", value: fmt(ytdBonus), icon: Award, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "YTD Deductions", value: fmt(ytdDed), icon: TrendingUp, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Payslips & Salary</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">View and download your monthly payslips.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k, i) => { const Icon = k.icon; return (
          <div key={i} className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", k.bg)}>
              <Icon className={cn("w-5 h-5", k.color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
            </div>
          </div>
        ); })}
      </div>

      {chartData.length > 0 && (
        <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Earnings Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="netPay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="Net Pay" stroke="#6366f1" strokeWidth={2} fill="url(#netPay)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(p => (
          <div key={p.id}
            onClick={() => setSelected(p)}
            className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl p-5 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{monthLabel(p.month)}</p>
                {isAdmin && <p className="text-xs text-gray-400 mt-0.5">{p.employee_name}</p>}
              </div>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                p.status === "paid" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700")}>
                {p.status}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{fmt(p.final_amount)}</p>
            <p className="text-xs text-gray-400">Net pay</p>
            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400">Gross</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300">{fmt(p.salary + p.bonus)}</p>
              </div>
              <div>
                <p className="text-gray-400">Deductions</p>
                <p className="font-semibold text-red-500">-{fmt(p.deductions)}</p>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDownload(p); }}
              className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-50 dark:border-white/8 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{monthLabel(selected.month)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Payslip for {selected.employee_name}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{selected.status}</span>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Basic Salary", value: fmt(selected.salary), cls: "" },
                { label: "Bonus", value: `+${fmt(selected.bonus)}`, cls: "text-emerald-600 dark:text-emerald-400" },
                { label: "Deductions", value: `-${fmt(selected.deductions)}`, cls: "text-red-500" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className={cn("font-semibold text-gray-800 dark:text-gray-200", row.cls)}>{row.value}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 dark:border-white/8 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Net Pay</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{fmt(selected.final_amount)}</span>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => handleDownload(selected)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <Download className="w-4 h-4" /> Download Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
