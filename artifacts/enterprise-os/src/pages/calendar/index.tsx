import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, Circle } from "lucide-react";

interface Leave { id: number; employee_name: string; type: string; start_date: string; end_date: string; status: string; }
interface Task { id: number; title: string; due_date: string; status: string; priority: string; assignee?: string; }
interface Milestone { id: number; title: string; due_date: string; status: string; }
interface Announcement { id: number; title: string; type: string; created_at: string; }

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type CalEvent = { date: string; label: string; color: string; dot: string; };

export default function CalendarPage() {
  const { user } = useAuth();
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { data: leaves = [] }        = useQuery<Leave[]>({ queryKey: ["leaves-cal"], queryFn: () => apiGet("/api/leaves") });
  const { data: tasks = [] }         = useQuery<Task[]>({ queryKey: ["tasks-cal"], queryFn: () => apiGet("/api/tasks") });
  const { data: milestones = [] }    = useQuery<Milestone[]>({ queryKey: ["milestones-cal"], queryFn: () => apiGet("/api/milestones") });
  const { data: announcements = [] } = useQuery<Announcement[]>({ queryKey: ["announcements-cal"], queryFn: () => apiGet("/api/announcements") });

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const events: Record<string, CalEvent[]> = {};
  const addEvent = (dateStr: string, label: string, color: string, dot: string) => {
    if (!events[dateStr]) events[dateStr] = [];
    events[dateStr].push({ date: dateStr, label, color, dot });
  };

  leaves.filter(l => l.status === "approved").forEach(l => {
    const start = new Date(l.start_date); const end = new Date(l.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      if (new Date(key).getMonth() === month) addEvent(key, `${l.employee_name}: ${l.type}`, "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400", "bg-amber-400");
    }
  });

  tasks.filter(t => t.due_date && t.status !== "done").forEach(t => {
    const key = t.due_date.split("T")[0];
    if (new Date(key + "T12:00:00").getMonth() === month) addEvent(key, `Due: ${t.title}`, "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400", "bg-red-400");
  });

  milestones.filter(m => m.status !== "completed").forEach(m => {
    const key = m.due_date.split("T")[0];
    if (new Date(key + "T12:00:00").getMonth() === month) addEvent(key, `🎯 ${m.title}`, "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400", "bg-purple-400");
  });

  announcements.filter(a => a.type === "holiday").forEach(a => {
    const key = a.created_at.split("T")[0];
    if (new Date(key).getMonth() === month) addEvent(key, `🏖️ ${a.title}`, "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", "bg-emerald-400");
  });

  const cells: Array<{ day: number | null; dateStr: string }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: "" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr });
  }

  const todayStr = today.toISOString().split("T")[0];
  const allEvents = Object.values(events).flat();
  const monthEvents = allEvents.length;

  const legend = [
    { dot: "bg-amber-400", label: "Leave" },
    { dot: "bg-red-400",   label: "Task Due" },
    { dot: "bg-purple-400",label: "Milestone" },
    { dot: "bg-emerald-400",label: "Holiday" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Calendar</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">View your schedule, deadlines, leave dates, and company events.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/8 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{MONTHS[month]} {year}</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrent(new Date(year, month - 1, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))}
                className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">Today</button>
              <button onClick={() => setCurrent(new Date(year, month + 1, 1))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-50 dark:border-white/5">
            {DAYS.map(d => (
              <div key={d} className="py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const isToday = cell.dateStr === todayStr;
              const dayEvents = cell.dateStr ? (events[cell.dateStr] || []) : [];
              return (
                <div key={i} className={cn(
                  "min-h-[90px] p-2 border-b border-r border-gray-50 dark:border-white/5",
                  "last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  !cell.day && "bg-gray-50/40 dark:bg-white/1",
                  isToday && "bg-indigo-50/40 dark:bg-indigo-500/5"
                )}>
                  {cell.day && (
                    <>
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1",
                        isToday ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-300")}>
                        {cell.day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev, j) => (
                          <div key={j} className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded truncate", ev.color)} title={ev.label}>
                            {ev.label}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-gray-400 px-1">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">{MONTHS[month]} Overview</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total events</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{monthEvents}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Leave days</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {Object.values(events).flat().filter(e => e.dot === "bg-amber-400").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Task deadlines</span>
                <span className="font-semibold text-red-500 dark:text-red-400">
                  {Object.keys(events).filter(k => events[k].some(e => e.dot === "bg-red-400")).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Milestones</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {Object.keys(events).filter(k => events[k].some(e => e.dot === "bg-purple-400")).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Legend</h3>
            <div className="space-y-2">
              {legend.map(l => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", l.dot)} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Upcoming</h3>
            {allEvents.length === 0 ? (
              <p className="text-xs text-gray-400">No upcoming events.</p>
            ) : (
              <div className="space-y-2">
                {allEvents.slice(0, 5).map((ev, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", ev.dot)} />
                    <div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight">{ev.label}</p>
                      <p className="text-[11px] text-gray-400">{new Date(ev.date + "T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"})}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
