import React, { useState, useRef, useEffect } from "react";
import { useAiChat, useGetAiSuggestions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send, Bot, User, Sparkles, BarChart3, Users, Target,
  CreditCard, FolderOpen, Package, ChevronDown, Copy, ThumbsUp, ThumbsDown,
  Lightbulb, Zap, Brain, TrendingUp, RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MODULES = [
  { id: "general", label: "General", icon: Brain, color: "text-indigo-500" },
  { id: "hrms", label: "HR", icon: Users, color: "text-blue-500" },
  { id: "crm", label: "CRM", icon: Target, color: "text-emerald-500" },
  { id: "finance", label: "Finance", icon: CreditCard, color: "text-amber-500" },
  { id: "projects", label: "Projects", icon: FolderOpen, color: "text-purple-500" },
  { id: "erp", label: "ERP", icon: Package, color: "text-rose-500" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-cyan-500" },
];

const QUICK_PROMPTS = [
  { text: "Summarize this week's performance", icon: TrendingUp },
  { text: "What are the top 3 priorities?", icon: Lightbulb },
  { text: "Generate a status report", icon: Zap },
  { text: "Identify key risks this quarter", icon: Brain },
];

type Message = { role: string; content: string; id: string };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied", description: "Message copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors">
      <Copy className={cn("w-3.5 h-3.5", copied && "text-emerald-500")} />
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
          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
          : "bg-gradient-to-br from-gray-800 to-gray-900 dark:from-indigo-900 dark:to-gray-900 text-white border border-indigo-500/20"
      )}>
        {isUser ? <User size={14} /> : <Sparkles size={14} className="text-indigo-300" />}
      </div>
      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start", "max-w-[75%]")}>
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-tl-sm"
        )}>
          {msg.content}
        </div>
        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            <CopyButton text={msg.content} />
            <button className="p-1 rounded hover:bg-black/5 text-gray-400 hover:text-emerald-500 transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-black/5 text-gray-400 hover:text-red-500 transition-colors">
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
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-500/20">
        <Sparkles size={14} className="text-indigo-300" />
      </div>
      <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-5">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Copilot</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-xs mb-8">
        Ask anything about your business data — HR metrics, sales pipeline, financial performance, and more.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {QUICK_PROMPTS.map((p, i) => {
          const Icon = p.icon;
          return (
            <button
              key={i}
              onClick={() => onPrompt(p.text)}
              className="flex items-center gap-2.5 p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-left hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all group shadow-sm"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{p.text}</span>
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
  const [showModules, setShowModules] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: suggestions } = useGetAiSuggestions({ module: activeModule });
  const chatMutation = useAiChat();

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
      {
        onSuccess: (data) => {
          setHistory(prev => [...prev, { role: "assistant", content: data.response, id: Date.now().toString() }]);
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => setHistory([]);

  const activeModuleData = MODULES.find(m => m.id === activeModule) || MODULES[0];
  const ActiveIcon = activeModuleData.icon;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-8">
      {/* Header */}
      <div className="bg-white dark:bg-background border-b border-gray-100 dark:border-white/8 px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">AI Copilot</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">Enterprise intelligence assistant</p>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-100 dark:bg-white/10" />

          {/* Module selector */}
          <div className="relative">
            <button
              onClick={() => setShowModules(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300 transition-colors"
            >
              <ActiveIcon className={cn("w-3.5 h-3.5", activeModuleData.color)} />
              {activeModuleData.label} context
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showModules && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 py-1.5 min-w-[180px]">
                {MODULES.map(mod => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => { setActiveModule(mod.id); setShowModules(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors",
                        activeModule === mod.id
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5", mod.color)} />
                      {mod.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              New chat
            </button>
          )}
        </div>
      </div>

      {/* Suggestion chips */}
      {suggestions && suggestions.length > 0 && (
        <div className="px-8 py-3 bg-gray-50/80 dark:bg-white/2 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">Try:</span>
            {suggestions.slice(0, 5).map(s => (
              <button
                key={s.id}
                onClick={() => handleSend(s.prompt)}
                className="text-[11px] px-2.5 py-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors font-medium"
              >
                {s.prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <EmptyState onPrompt={(p) => handleSend(p)} />
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-6 space-y-5">
            {history.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {chatMutation.isPending && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-white/8 bg-white dark:bg-background px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-sm">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your enterprise data..."
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 py-1 px-1 min-h-[36px] max-h-[120px]"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-gray-300 dark:text-gray-600 hidden sm:block">⏎ Enter</span>
              <Button
                onClick={() => handleSend()}
                disabled={chatMutation.isPending || !input.trim()}
                size="sm"
                className="h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-600/20 disabled:opacity-40 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
            AI responses are generated based on your enterprise data · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
