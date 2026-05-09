"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";

const STORAGE_KEY = "assistant-chat-v1";
const MAX_STORED = 40;

type Role = "user" | "assistant";

type ChatLine = { role: Role; content: string };

type ChatApiResponse = {
  id: string;
  message: { role: "assistant"; content: string };
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  estimated_cost_usd: number;
};

function pickUserFacingError(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (typeof o.detail === "string") return o.detail;
  }
  if (status === 429)
    return "Too many requests. Please wait and try again.";
  if (status === 503)
    return "AI chat is not available on the server yet.";
  return "Something went wrong. Please try again.";
}

function emitAssistantEvent(kind: "message_sent" | "response_ok" | "response_failed") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("assistant_chat", { detail: { kind, ts: Date.now() } })
  );
}

function loadStored(): ChatLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is ChatLine =>
          x &&
          typeof x === "object" &&
          (x as ChatLine).role !== undefined &&
          typeof (x as ChatLine).content === "string" &&
          ((x as ChatLine).role === "user" || (x as ChatLine).role === "assistant")
      )
      .slice(-MAX_STORED);
  } catch {
    return [];
  }
}

function persist(lines: ChatLine[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.slice(-MAX_STORED)));
  } catch {
    /* ignore quota */
  }
}

export default function ChatAssistant() {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines(loadStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(lines);
  }, [lines, hydrated]);

  useEffect(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines, loading]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const trialUserMessage: ChatLine = { role: "user", content: trimmed };

    const historyForApi = [...lines, trialUserMessage].map((m) =>
      m.role === "assistant"
        ? { role: "assistant" as const, content: m.content }
        : { role: "user" as const, content: m.content }
    );

    setInput("");
    setError(null);
    setLoading(true);
    setLines((prev) => [...prev, trialUserMessage]);
    emitAssistantEvent("message_sent");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
        }),
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = pickUserFacingError(payload, res.status);
        emitAssistantEvent("response_failed");
        throw new Error(msg);
      }

      const data = payload as ChatApiResponse;
      const content = data?.message?.content?.trim();
      if (!content) {
        emitAssistantEvent("response_failed");
        throw new Error("Empty response from assistant.");
      }

      emitAssistantEvent("response_ok");
      setLines((prev) => [...prev, { role: "assistant", content }]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed.";
      setError(message);
      setLines((prev) =>
        prev.length > 0 && prev[prev.length - 1]?.role === "user"
          ? prev.slice(0, -1)
          : prev
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, lines]);

  return (
    <Card className="w-full max-w-3xl mx-auto min-h-[min(70vh,520px)] flex flex-col gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">Assistant</CardTitle>
        <CardDescription>
          Ask about markets or how to use the app. Responses are informational only,
          not financial advice or live quotes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 gap-2">
        <div
          ref={messageContainerRef}
          className={cn(
            "flex flex-col gap-3 rounded-md border bg-background/60 p-3 flex-1 min-h-[220px]",
            "max-h-[min(50vh,400px)] overflow-y-auto overscroll-contain"
          )}
        >
          {!hydrated ? (
            <p className="text-sm text-muted-foreground">Loading conversation…</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Start by asking a question below.
            </p>
          ) : (
            lines.map((line, i) => (
              <div
                key={`${i}-${line.role}`}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
                  line.role === "user"
                    ? "self-end bg-primary/15 border border-primary/30"
                    : "self-start bg-muted/50 border"
                )}
              >
                {line.content}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground self-start">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0 sm:px-2">
        <Textarea
          placeholder="Type your message…"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={3}
          className="min-h-[72px]"
        />
        <div className="flex w-full justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || lines.length === 0}
            onClick={() => {
              setLines([]);
              persist([]);
              setError(null);
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading || !input.trim()}
            onClick={() => void send()}
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
