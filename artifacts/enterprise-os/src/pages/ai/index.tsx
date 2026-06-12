import React, { useState, useRef, useEffect } from "react";
import { useAiChat, useGetAiSuggestions } from "@workspace/api-client-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Send, Sparkles, User, BarChart3, Users, Target,
  CreditCard, FolderOpen, Package, Copy, ThumbsUp, ThumbsDown,
  Lightbulb, Zap, Brain, TrendingUp, RotateCcw, ChevronRight,
  MessageSquare, Layers, Shield, Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MODULES = [
  { id: "general",   label: "General",   icon: Brain,      color: "from-indigo-500 to-violet-600",   light: "bg-indigo-50 dark:bg-indigo-500/10",  text: "text-indigo-600 dark:text-indigo-400" },
  { id: "hrms",      label: "HR",        icon: Users,      color: "from-blue-500 to-cyan-600",        light: "bg-blue-50 dark:bg-blue-500/10",      text: "text-blue-600 dark:text-blue-400" },
  { id: "crm",       label: "CRM",       icon: Target,     color: "from-emerald-500 to-teal-600",     light: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  { id: "finance",   label: "Finance",   icon: CreditCard, color: "from-amber-500 to-orange-600",     light: "bg-amber-50 dark:bg-amber-500/10",    text: "text-amber-600 dark:text-amber-400" },
  { id: "projects",  label: "Projects",  icon: FolderOpen, color: "from-purple-500 to-indigo-600",    light: "bg-purple-50 dark:bg-purple-500/10",  text: "text-purple-600 dark:text-purple-400" },
  { id: "erp",       label: "ERP",       icon: Package,    color: "from-rose-500 to-pink-600",        light: "bg-rose-50 dark:bg-rose-500/10",      text: "text-rose-600 dark:text-rose-400" },
  { id: "analytics", label: "Analytics", icon: BarChart3,  color: "from-cyan-500 to-blue-600",        light: "bg-cyan-50 dark:bg-cyan-500/10",      text: "text-cyan-600 dark:text-cyan-400" },
];

const QUICK_PROMPTS = [
  { text: "Summarize this week's performance metrics", icon: TrendingUp,    category: "Analytics" },
  { text: "What are the top 3 priorities this quarter?", icon: Lightbulb,  category: "Strategy" },
  { text: "Generate an executive status report", icon: Layers,             category: "Reports" },
  { text: "Identify key risks and opportunities", icon: Shield,             category: "Strategy" },
  { text: "Compare revenue vs forecast this month", icon: BarChart3,       category: "Finance" },
  { text: "Who are the top performers in sales?", icon: Users,             category: "HR & CRM" },
];

type Message = { role: string; content: string; id: string };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast({ title: "Copied" }); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-600 transition-colors">
      <Copy className={cn("w-3.5 h-3.5 transition-colors", copied ? "text-emerald-500" : "")} />
    </button>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
        isUser
          ? "bg-gradient-to-br from-indigo-500 to-violet-600"
          : "bg-gradient-to-br from-gray-800 to-gray-900 dark:from-slate-800 dark:to-gray-900 border border-white/10"
      )}>
        {isUser
          ? <User size={14} className="text-white" />
          : <Sparkles size={14} className="text-indigo-300" />
        }
      </div>
      <div className={cn("flex flex-col gap-1.5 max-w-[78%]", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm"
            : "bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-tl-sm"
        )}>
          {msg.content}
        </div>
        {!isUser && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={msg.content} />
            <button className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-600 transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors">
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center flex-shrink-0 shadow-sm border border-white/10">
        <Sparkles size={14} className="text-indigo-300 animate-pulse" />
      </div>
      <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm flex items-center gap-1.5">
        {[0, 150, 300].map(delay => (
          <span key={delay} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onPrompt, activeModule }: { onPrompt: (p: string) => void; activeModule: string }) {
  const mod = MODULES.find(m => m.id === activeModule) || MODULES[0];
  const ModIcon = mod.icon;
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 max-w-2xl mx-auto w-full">
      {/* Hero icon */}
      <div className="relative mb-6">
        <div className={cn("w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl", mod.color)}>
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className={cn("absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", mod.color)}>
          <ModIcon className="w-4 h-4 text-white" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">AI Copilot</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm mb-2">
        Your intelligent enterprise assistant. Ask anything about your business data.
      </p>
      <div className={cn("flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-8", mod.light, mod.text)}>
        <ModIcon className="w-3.5 h-3.5" />
        {mod.label} context active
      </div>

      {/* Quick prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {QUICK_PROMPTS.map((p, i) => {
          const Icon = p.icon;
          return (
            <button key={i} onClick={() => onPrompt(p.text)}
              className="group flex items-start gap-3 p-3.5 bg-white dark:bg-white/3 border border-gray-100 dark:border-white/8 rounded-xl text-left hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-md dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-snug">{p.text}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{p.category}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AiCopilotPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [activeModule, setActiveModule] = useState("general");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: suggestions } = useGetAiSuggestions({ module: activeModule });
  const chatMutation = useAiChat();
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, chatMutation.isPending]);

  const handleSend = (overrideMsg?: string) => {
    const msg = overrideMsg || input.trim();
    if (!msg) return;
    const newMsg: Message = { role: "user", content: msg, id: Date.now().toString() };
    const newHistory = [...history, newMsg];
    setHistory(newHistory);
    setInput("");
    chatMutation.mutate(
      { data: { message: msg, history: newHistory.map(m => ({ role: m.role, content: m.content })), module: activeModule } },
      { onSuccess: (data) => setHistory(prev => [...prev, { role: "assistant", content: data.response, id: Date.now().toString() }]) }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const activeMod = MODULES.find(m => m.id === activeModule) || MODULES[0];
  const ActiveIcon = activeMod.icon;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-8">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-white dark:bg-background border-b border-gray-100 dark:border-white/8 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">AI Copilot</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">Enterprise intelligence assistant</p>
            </div>

            <div className="w-px h-6 bg-gray-100 dark:bg-white/10 mx-1" />

            {/* Module pills */}
            <div className="hidden md:flex gap-1.5 flex-wrap">
              {MODULES.map(mod => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <button key={mod.id} onClick={() => setActiveModule(mod.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                      isActive
                        ? cn("text-white shadow-sm", `bg-gradient-to-r ${mod.color}`)
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                    )}>
                    <Icon className="w-3 h-3" />
                    {mod.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <span className="text-[11px] text-gray-400">{history.length} messages</span>
                <button onClick={() => setHistory([])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg transition-colors">
                  <RotateCcw className="w-3 h-3" /> New chat
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion chips */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2.5 bg-gray-50/60 dark:bg-white/1 border-b border-gray-100 dark:border-white/5">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[11px] text-gray-400 font-medium">✦ Suggested</span>
            {suggestions.slice(0, 5).map(s => (
              <button key={s.id} onClick={() => handleSend(s.prompt)}
                className="text-[11px] px-3 py-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all hover:shadow-sm font-medium">
                {s.prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-transparent">
        {history.length === 0 ? (
          <EmptyState onPrompt={handleSend} activeModule={activeModule} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
            {history.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {chatMutation.isPending && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white dark:bg-background border-t border-gray-100 dark:border-white/8 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Mobile module selector */}
          <div className="md:hidden flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {MODULES.map(mod => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button key={mod.id} onClick={() => setActiveModule(mod.id)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex-shrink-0",
                    isActive ? cn("text-white", `bg-gradient-to-r ${mod.color}`) : "text-gray-500 bg-gray-100 dark:bg-white/5"
                  )}>
                  <Icon className="w-3 h-3" /> {mod.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex items-end gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/60 focus-within:ring-4 focus-within:ring-indigo-500/8 transition-all shadow-sm">
            {/* Active module indicator */}
            <div className={cn("flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center self-end mb-0.5", activeMod.color)}>
              <ActiveIcon className="w-3.5 h-3.5 text-white" />
            </div>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${activeMod.label.toLowerCase()} data...`}
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 py-1 px-0 min-h-[32px] max-h-[160px] self-end"
            />

            <button
              onClick={() => handleSend()}
              disabled={chatMutation.isPending || !input.trim()}
              className={cn(
                "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all self-end",
                input.trim() && !chatMutation.isPending
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg hover:scale-105"
                  : "bg-gray-100 dark:bg-white/8 text-gray-400"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-gray-400">
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[10px]">Shift+Enter</kbd> for newline
            </p>
            <p className="text-[10px] text-gray-400">Powered by Enterprise AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
