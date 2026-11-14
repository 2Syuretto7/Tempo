"use client";

import { useEffect, useRef, useState } from "react";

export type KibitzerTarget = { nodeId: string; itemId?: string; seed?: number; step?: number; puzzleId?: string; ply?: number };
type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  target: KibitzerTarget | null;
  open: boolean;
  setOpen: (o: boolean) => void;
  /** Incremented by "Ask Kibitzer for a hint" buttons. */
  hintSignal: number;
  onUse: () => void;
};

/** Mount with key={contextKey} so each screen starts a fresh conversation. */
export function Kibitzer({ target, open, setOpen, hintSignal, onUse }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const lastSignal = useRef(hintSignal);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string, isHint: boolean) => {
    if (!target || busy) return;
    const nextLevel = isHint ? level + 1 : Math.max(1, level);
    if (isHint) setLevel(nextLevel);
    onUse();
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setBusy(true);
    try {
      const res = await fetch("/api/kibitzer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...target, hintLevel: nextLevel, messages: history }),
      });
      const data = await res.json();
      setMessages([...history, { role: "assistant", content: data.reply ?? data.error ?? "I could not think of a good hint just now." }]);
    } catch {
      setMessages([...history, { role: "assistant", content: "I could not reach my notes. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (hintSignal !== lastSignal.current) {
      lastSignal.current = hintSignal;
      setOpen(true);
      send(level === 0 ? "Can I have a hint?" : "Can I have another hint?", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintSignal]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 h-11 pl-3 pr-4 inline-flex items-center gap-2 bg-raised border border-hairline rounded-[2px] text-[14px] font-medium text-ink hover:bg-[#1b1b1b] transition-colors"
        aria-label="Open Kibitzer, your tutor"
      >
        <Mark />
        Kibitzer
      </button>
    );
  }

  return (
    <aside
      className="fixed z-40 inset-x-0 bottom-0 md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px] h-[min(560px,75vh)] bg-raised border border-hairline md:rounded-[4px] flex flex-col fade-in"
      aria-label="Kibitzer"
    >
      <header className="h-12 px-4 flex items-center gap-2 border-b border-hairline">
        <Mark />
        <span className="text-[14px] font-medium text-ink">Kibitzer</span>
        <span className="ml-1 font-mono text-[11px] leading-[13px] uppercase tracking-[0.04em] text-meta border border-hairline rounded-[2px] px-1.5 py-0.5">Hints, not answers</span>
        <button onClick={() => setOpen(false)} className="ml-auto h-8 w-8 inline-flex items-center justify-center text-meta hover:text-ink rounded-[2px]" aria-label="Close Kibitzer">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
        </button>
      </header>
      <div ref={list} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-[14px] leading-[22px] text-body">
            I am here to help you think, not to think for you. Ask me anything about this idea, or ask for a hint and I will give you the smallest nudge that helps. Each hint goes one step further.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[85%] text-[14px] leading-[22px] ${m.role === "user" ? "bg-[rgba(108,53,245,0.2)] text-ink px-3 py-2 rounded-[2px]" : "text-body"}`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="text-[14px] text-meta">Thinking…</div>}
      </div>
      <form
        className="border-t border-hairline p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            send(input.trim(), false);
            setInput("");
          }
        }}
      >
        <label htmlFor="kibitzer-input" className="sr-only">Ask Kibitzer</label>
        <input
          id="kibitzer-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={target ? "Ask a question…" : "Kibitzer joins you inside a lesson"}
          disabled={!target}
          className="flex-1 h-10 bg-page border border-hairline rounded-[2px] px-3 text-[14px] text-ink focus:outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={!target || busy}
          onClick={() => send(level === 0 ? "Can I have a hint?" : "Can I have another hint?", true)}
          className="h-10 px-3 text-[14px] font-medium bg-white text-[#0d0d0d] rounded-[2px] disabled:opacity-40"
        >
          Hint
        </button>
      </form>
    </aside>
  );
}

function Mark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="8" cy="7" r="1" fill="var(--purple-400)" />
    </svg>
  );
}
