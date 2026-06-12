import React, { useState } from "react";
import { useAiChat, useGetAiSuggestions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AiCopilotPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{role: string, content: string}[]>([]);
  
  const { data: suggestions } = useGetAiSuggestions({ module: "general" });
  const chatMutation = useAiChat();

  const handleSend = () => {
    if (!input.trim()) return;

    const newHistory = [...history, { role: "user", content: input }];
    setHistory(newHistory);
    setInput("");

    chatMutation.mutate(
      { data: { message: input, history: newHistory, module: "general" } },
      {
        onSuccess: (data) => {
          setHistory(prev => [...prev, { role: "assistant", content: data.response }]);
        }
      }
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Copilot</h1>
        <p className="text-muted-foreground mt-2 text-sm">Your enterprise intelligence assistant.</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        {suggestions?.map(s => (
          <Badge 
            key={s.id} 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80"
            onClick={() => { setInput(s.prompt); }}
          >
            {s.prompt}
          </Badge>
        ))}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/60 shadow-sm">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-primary/10 text-foreground' : 'bg-muted/50 text-foreground'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <Bot size={16} />
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t bg-card">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your data..."
              className="flex-1"
            />
            <Button type="submit" disabled={chatMutation.isPending || !input.trim()}>
              <Send className="w-4 h-4 mr-2" /> Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
